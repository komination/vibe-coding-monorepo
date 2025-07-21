import { jwtVerify, createRemoteJWKSet, errors } from 'jose';
import { User } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';

export interface VerifyCognitoTokenRequest {
  token: string;
}

export interface VerifyCognitoTokenResponse {
  user: User;
  payload: CognitoAccessTokenPayload;
}

// Cognito Access Token specific payload
export interface CognitoAccessTokenPayload {
  sub: string;
  token_use: 'access';
  scope: string;
  client_id: string;
  username?: string;
  'cognito:username'?: string;
  iss: string;
  exp: number;
  iat: number;
  jti?: string;
}

// For backward compatibility, export the old name as well
export type CognitoJWTPayload = CognitoAccessTokenPayload;

export interface CognitoConfig {
  isConfigured: boolean;
  region: string;
  userPoolId: string;
  clientId: string;
  domain?: string;
}

interface UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  username?: string;
  name?: string;
  picture?: string;
  preferred_username?: string;
}

/**
 * Verifies and processes Cognito access tokens.
 * This use case only accepts access tokens and uses the UserInfo endpoint
 * to fetch user details when creating new users.
 */
export class VerifyCognitoTokenUseCase {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private userRepository: UserRepository,
    private cognitoConfig: CognitoConfig
  ) {
    // Initialize JWKS only if Cognito is configured
    if (this.cognitoConfig.isConfigured && this.cognitoConfig.region && this.cognitoConfig.userPoolId) {
      const jwksUri = `https://cognito-idp.${this.cognitoConfig.region}.amazonaws.com/${this.cognitoConfig.userPoolId}/.well-known/jwks.json`;
      this.jwks = createRemoteJWKSet(new URL(jwksUri));
    }
  }

  /**
   * Verifies a Cognito access token and returns the associated user.
   * For new users, fetches user info from the UserInfo endpoint.
   * 
   * @param request Contains the access token to verify
   * @returns The verified user and token payload
   * @throws Error if token is invalid, expired, or not an access token
   */
  async execute(request: VerifyCognitoTokenRequest): Promise<VerifyCognitoTokenResponse> {
    if (!this.cognitoConfig.isConfigured || !this.jwks) {
      throw new Error('Cognito not configured');
    }

    try {
      // Verify JWT access token using Cognito's public keys
      const { payload } = await jwtVerify(request.token, this.jwks, {
        issuer: `https://cognito-idp.${this.cognitoConfig.region}.amazonaws.com/${this.cognitoConfig.userPoolId}`,
      });

      const cognitoPayload = payload as unknown as CognitoAccessTokenPayload;

      // Validate this is an access token
      if (cognitoPayload.token_use !== 'access') {
        throw new Error('Invalid token type: Only access tokens are accepted');
      }

      // Validate required fields
      if (!cognitoPayload.sub) {
        throw new Error('Invalid token: missing subject');
      }

      // Validate client_id
      if (cognitoPayload.client_id !== this.cognitoConfig.clientId) {
        throw new Error('Invalid token: client_id mismatch');
      }

      // Find user based on Cognito sub
      let user = await this.userRepository.findByCognitoSub(cognitoPayload.sub);

      if (!user) {
        // For new users, fetch user info from UserInfo endpoint
        const userInfo = await this.fetchUserInfo(request.token);
        
        // Check if user exists by email (for migration scenario)
        const existingUser = await this.userRepository.findByEmail(userInfo.email);
        
        if (existingUser) {
          // Update existing user to link with Cognito
          const updatedUser = existingUser.updateCognito(cognitoPayload.sub);
          user = await this.userRepository.update(updatedUser);
        } else {
          // Create new Cognito user
          const username = userInfo.username || 
                          userInfo.preferred_username ||
                          cognitoPayload.username ||
                          cognitoPayload['cognito:username'] ||
                          userInfo.email.split('@')[0] ||
                          'user';

          const newUser = User.createCognitoUser({
            email: userInfo.email,
            username: await this.generateUniqueUsername(username),
            cognitoSub: cognitoPayload.sub,
            name: userInfo.name,
            avatarUrl: userInfo.picture,
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
        throw new Error('Access token expired');
      }
      if (error instanceof errors.JWTInvalid) {
        throw new Error('Invalid access token');
      }
      if (error instanceof errors.JWKSNoMatchingKey) {
        throw new Error('Access token validation failed: Invalid signature');
      }
      
      // Re-throw known errors
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Access token verification failed');
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

  /**
   * Fetches user information from the Cognito UserInfo endpoint.
   * This is only called for new users who don't exist in the database.
   * 
   * @param accessToken The verified access token
   * @returns User information including email, name, and picture
   * @throws Error if the request fails or email is missing
   */
  private async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    if (!this.cognitoConfig.domain) {
      throw new Error('Cognito domain not configured');
    }

    const userInfoUrl = `https://${this.cognitoConfig.domain}/oauth2/userInfo`;
    
    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch user info: ${response.status} - ${errorText}`);
    }

    const userInfo = await response.json() as UserInfo;
    
    if (!userInfo.email) {
      throw new Error('User info does not contain email');
    }

    return userInfo;
  }
}