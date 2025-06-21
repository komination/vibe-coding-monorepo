import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { jwtConfig } from '@/infrastructure/config/env';
import * as jwt from 'jsonwebtoken';

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponse {
  user: User;
  payload: {
    userId: string;
    email: string;
    username: string;
    iat: number;
    exp: number;
    iss: string;
    sub: string;
  };
}

export class VerifyTokenUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    const { token } = request;

    try {
      // Verify and decode token
      const payload = jwt.verify(token, jwtConfig.secret) as any;

      // Validate payload structure
      if (!payload.userId || !payload.email || !payload.username) {
        throw new Error('Invalid token payload');
      }

      // Check if token is not a refresh token
      if (payload.type === 'refresh') {
        throw new Error('Refresh token cannot be used for authentication');
      }

      // Validate token issuer
      if (payload.iss !== jwtConfig.issuer) {
        throw new Error('Invalid token issuer');
      }

      // Validate token subject matches userId
      if (payload.sub !== payload.userId) {
        throw new Error('Invalid token subject');
      }

      // Find user by ID
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      return { user, payload };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not yet active');
      }
      
      // Re-throw our custom errors with enhanced context
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Token verification failed');
    }
  }
}