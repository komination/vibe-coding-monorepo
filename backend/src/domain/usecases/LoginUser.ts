import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UnauthorizedError, BusinessRuleViolationError } from '@/domain/errors/DomainError';
import { jwtConfig } from '@/infrastructure/config/env';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

export interface LoginUserRequest {
  identifier: string; // email or username
  password: string;
}

export interface LoginUserResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export class LoginUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { identifier, password } = request;

    // Find user by email or username
    let user: User | null = null;
    
    // Check if identifier is an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(identifier)) {
      user = await this.userRepository.findByEmail(identifier.toLowerCase().trim());
    } else {
      user = await this.userRepository.findByUsername(identifier.trim());
    }

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new BusinessRuleViolationError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    // Access token
    const token = jwt.sign(tokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessTokenExpiresIn as any,
      issuer: jwtConfig.issuer,
      subject: user.id,
    });

    // Refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtConfig.secret,
      {
        expiresIn: jwtConfig.refreshTokenExpiresIn as any,
        issuer: jwtConfig.issuer,
        subject: user.id,
      }
    );

    return { user, token, refreshToken };
  }
}