import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UnauthorizedError } from '@/domain/errors/DomainError';
import { JWTTokenPayload, isAccessToken } from '@/domain/types/jwt';
import { jwtConfig } from '@/infrastructure/config/env';
import { isTokenBlacklisted } from '@/infrastructure/cache/TokenBlacklist';
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
      // Check if token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedError('Token has been revoked');
      }

      // Verify and decode token
      const decoded = jwt.verify(token, jwtConfig.secret);
      const payload = decoded as JWTTokenPayload;

      // Validate it's an access token
      if (!isAccessToken(payload)) {
        throw new UnauthorizedError('Invalid token type');
      }

      // Validate payload structure
      if (!payload.userId || !payload.email || !payload.username) {
        throw new UnauthorizedError('Invalid token payload');
      }

      // Validate token issuer
      if (payload.iss !== jwtConfig.issuer) {
        throw new UnauthorizedError('Invalid token issuer');
      }

      // Validate token subject matches userId
      if (payload.sub !== payload.userId) {
        throw new UnauthorizedError('Invalid token subject');
      }

      // Find user by ID
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new UnauthorizedError('User account is inactive');
      }

      return { user, payload };

    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError(`Invalid token: ${error.message}`);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedError('Token not yet active');
      }
      
      throw new UnauthorizedError('Token verification failed');
    }
  }
}