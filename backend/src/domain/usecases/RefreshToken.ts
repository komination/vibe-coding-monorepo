import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import * as jwt from 'jsonwebtoken';

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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      // Verify and decode refresh token
      const payload = jwt.verify(refreshToken, jwtSecret) as any;

      // Validate it's a refresh token
      if (payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
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

      // New access token (expires in 1 hour)
      const newToken = jwt.sign(tokenPayload, jwtSecret, {
        expiresIn: '1h',
        issuer: 'kanban-app',
        subject: user.id,
      });

      // New refresh token (expires in 7 days)
      const newRefreshToken = jwt.sign(
        { userId: user.id, type: 'refresh' },
        jwtSecret,
        {
          expiresIn: '7d',
          issuer: 'kanban-app',
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
        throw new Error('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Refresh token not active');
      }
      
      // Re-throw our custom errors
      throw error;
    }
  }
}