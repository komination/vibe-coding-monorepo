import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { UnauthorizedError, BusinessRuleViolationError } from '@/domain/errors/DomainError';
import { JWTAccessTokenPayload, JWTRefreshTokenPayload } from '@/domain/types/jwt';
import { jwtConfig } from '@/infrastructure/config/env';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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
    const trimmedIdentifier = identifier.trim();
    if (emailRegex.test(trimmedIdentifier)) {
      user = await this.userRepository.findByEmail(trimmedIdentifier.toLowerCase());
    } else {
      user = await this.userRepository.findByUsername(trimmedIdentifier);
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
    const accessTokenPayload: JWTAccessTokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
    };

    // Access token
    const token = jwt.sign(accessTokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessTokenExpiresIn,
      issuer: jwtConfig.issuer,
      subject: user.id,
    });

    // Refresh token
    const refreshTokenPayload: JWTRefreshTokenPayload = {
      userId: user.id,
      type: 'refresh',
    };
    
    const refreshToken = jwt.sign(refreshTokenPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshTokenExpiresIn,
      issuer: jwtConfig.issuer,
      subject: user.id,
    });

    return { user, token, refreshToken };
  }
}