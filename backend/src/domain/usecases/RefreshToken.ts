import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UnauthorizedError } from '@/domain/errors/DomainError';
import { JWTTokenPayload, JWTAccessTokenPayload, JWTRefreshTokenPayload, isRefreshToken } from '@/domain/types/jwt';
import { jwtConfig } from '@/infrastructure/config/env';
import { isTokenBlacklisted, blacklistToken } from '@/infrastructure/cache/TokenBlacklist';
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

    try {
      // Check if refresh token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedError('Refresh token has been revoked');
      }

      // Verify and decode refresh token
      const decoded = jwt.verify(refreshToken, jwtConfig.secret);
      const payload = decoded as JWTTokenPayload;

      // Validate it's a refresh token
      if (!isRefreshToken(payload)) {
        throw new UnauthorizedError('Invalid token type');
      }

      // Validate token issuer
      if (payload.iss !== jwtConfig.issuer) {
        throw new UnauthorizedError('Invalid token issuer');
      }

      // Validate token subject matches userId
      if (payload.sub !== payload.userId) {
        throw new UnauthorizedError('Invalid token subject');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new UnauthorizedError('User account is inactive');
      }

      // Generate new tokens
      const accessTokenPayload: JWTAccessTokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        type: 'access',
      };

      // New access token
      const newToken = jwt.sign(accessTokenPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.accessTokenExpiresIn,
        issuer: jwtConfig.issuer,
        subject: user.id,
      });

      // New refresh token
      const newRefreshTokenPayload: JWTRefreshTokenPayload = {
        userId: user.id,
        type: 'refresh',
      };
      
      const newRefreshToken = jwt.sign(newRefreshTokenPayload, jwtConfig.secret, {
        expiresIn: jwtConfig.refreshTokenExpiresIn,
        issuer: jwtConfig.issuer,
        subject: user.id,
      });

      // Blacklist the old refresh token (refresh token rotation)
      await blacklistToken(refreshToken);

      return { 
        token: newToken, 
        refreshToken: newRefreshToken, 
        user 
      };

    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(`Invalid refresh token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedError('Refresh token not yet active');
      }
      
      throw new UnauthorizedError('Refresh token verification failed');
    }
  }
}