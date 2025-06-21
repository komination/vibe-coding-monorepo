import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import * as bcrypt from 'bcrypt';

export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface RegisterUserResponse {
  user: User;
}

export class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const { email, username, password, name } = request;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate email uniqueness
    const existingUserByEmail = await this.userRepository.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('Email already exists');
    }

    // Validate username format and uniqueness
    if (username.length < 3 || username.length > 20) {
      throw new Error('Username must be between 3 and 20 characters');
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }

    const existingUserByUsername = await this.userRepository.findByUsername(username);
    if (existingUserByUsername) {
      throw new Error('Username already exists');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter, one uppercase letter, and one number');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = User.create({
      email: email.toLowerCase().trim(),
      username: username.trim(),
      passwordHash,
      name: name?.trim(),
      isActive: true,
    });

    // Save user
    await this.userRepository.save(user);

    return { user };
  }
}