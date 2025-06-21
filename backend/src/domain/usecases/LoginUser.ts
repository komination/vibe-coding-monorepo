import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
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
    if (emailRegex.test(identifier)) {
      user = await this.userRepository.findByEmail(identifier.toLowerCase().trim());
    } else {
      user = await this.userRepository.findByUsername(identifier.trim());
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT tokens
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    // Access token (expires in 1 hour)
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'kanban-app',
      subject: user.id,
    });

    // Refresh token (expires in 7 days)
    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      jwtSecret,
      {
        expiresIn: '7d',
        issuer: 'kanban-app',
        subject: user.id,
      }
    );

    return { user, token, refreshToken };
  }
}