import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { jwtConfig } from '@/infrastructure/config/env';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export class RefreshTokenUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = request;

    try {
      // Verify and decode refresh token
      const payload = jwt.verify(refreshToken, jwtConfig.secret) as any;

      // Validate it's a refresh token
      if (payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Validate token issuer
      if (payload.iss !== jwtConfig.issuer) {
        throw new Error('Invalid token issuer');
      }

      // Validate token subject matches userId
      if (payload.sub !== payload.userId) {
        throw new Error('Invalid token subject');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new Error('User account is inactive');
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
      };

      // New access token
      const newToken = jwt.sign(tokenPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.accessTokenExpiresIn as any,
        issuer: jwtConfig.issuer,
        subject: user.id,
      });

      // New refresh token
      const newRefreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        jwtConfig.secret,
        {
          expiresIn: jwtConfig.refreshTokenExpiresIn as any,
          issuer: jwtConfig.issuer,
          subject: user.id,
        }
      );

      return { 
        token: newToken, 
        refreshToken: newRefreshToken, 
        user 
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid refresh token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Refresh token not yet active');
      }
      
      // Re-throw our custom errors with enhanced context
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Refresh token verification failed');
    }
  }
}