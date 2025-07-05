import { jwtVerify, createRemoteJWKSet, errors } from 'jose';
import { User } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';
import { cognitoConfig } from '@/infrastructure/config/env';

export interface VerifyCognitoTokenRequest {
  token: string;
}

export interface VerifyCognitoTokenResponse {
  user: User;
  payload: CognitoJWTPayload;
}

export interface CognitoJWTPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  username?: string;
  'cognito:username'?: string;
  token_use: 'access' | 'id';
  client_id: string;
  iss: string;
  exp: number;
  iat: number;
  aud: string;
}

export class VerifyCognitoTokenUseCase {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private userRepository: UserRepository
  ) {
    // Initialize JWKS only if Cognito is configured
    if (cognitoConfig.isConfigured && cognitoConfig.region && cognitoConfig.userPoolId) {
      const jwksUri = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}/.well-known/jwks.json`;
      this.jwks = createRemoteJWKSet(new URL(jwksUri));
    }
  }

  async execute(request: VerifyCognitoTokenRequest): Promise<VerifyCognitoTokenResponse> {
    if (!cognitoConfig.isConfigured || !this.jwks) {
      throw new Error('Cognito not configured');
    }

    try {
      // Verify JWT token using Cognito's public keys
      const { payload } = await jwtVerify(request.token, this.jwks, {
        issuer: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`,
        audience: cognitoConfig.clientId,
      });

      const cognitoPayload = payload as unknown as CognitoJWTPayload;

      // Validate required fields
      if (!cognitoPayload.sub) {
        throw new Error('Invalid token: missing subject');
      }

      if (!cognitoPayload.email) {
        throw new Error('Invalid token: missing email');
      }

      // Find or create user based on Cognito sub
      let user = await this.userRepository.findByCognitoSub(cognitoPayload.sub);

      if (!user) {
        // Check if user exists by email (for migration scenario)
        const existingUser = await this.userRepository.findByEmail(cognitoPayload.email);
        
        if (existingUser) {
          // Update existing user to link with Cognito
          const updatedUser = existingUser.updateCognito(cognitoPayload.sub);
          user = await this.userRepository.update(updatedUser);
        } else {
          // Create new Cognito user
          const username = cognitoPayload.username || 
                          cognitoPayload['cognito:username'] || 
                          cognitoPayload.email.split('@')[0];

          const newUser = User.createCognitoUser({
            email: cognitoPayload.email,
            username: await this.generateUniqueUsername(username),
            cognitoSub: cognitoPayload.sub,
            name: cognitoPayload.name,
            avatarUrl: cognitoPayload.picture,
          });

          user = await this.userRepository.create(newUser);
        }
      }

      // Check if user account is active
      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      return {
        user,
        payload: cognitoPayload,
      };
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new Error('Token expired');
      }
      if (error instanceof errors.JWTInvalid) {
        throw new Error('Invalid token');
      }
      if (error instanceof errors.JWKSNoMatchingKey) {
        throw new Error('Token validation failed');
      }
      
      // Re-throw known errors
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Token verification failed');
    }
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    const sanitized = baseUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let username = sanitized;
    let counter = 1;

    while (await this.userRepository.findByUsername(username)) {
      username = `${sanitized}${counter}`;
      counter++;
    }

    return username;
  }
}