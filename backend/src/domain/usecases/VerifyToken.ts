import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
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

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    try {
      // Verify and decode token
      const payload = jwt.verify(token, jwtSecret) as any;

      // Validate payload structure
      if (!payload.userId || !payload.email || !payload.username) {
        throw new Error('Invalid token payload');
      }

      // Check if token is not a refresh token
      if (payload.type === 'refresh') {
        throw new Error('Refresh token cannot be used for authentication');
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
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active');
      }
      
      // Re-throw our custom errors
      throw error;
    }
  }
}