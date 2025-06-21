import { UserRepository } from '@/domain/repositories/UserRepository';
import { hash, compare } from 'bcrypt';

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export class ChangePasswordUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const { userId, currentPassword, newPassword } = request;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new Error('Both current and new passwords are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    if (currentPassword === newPassword) {
      throw new Error('New password must be different from current password');
    }

    // Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Cannot change password for inactive user');
    }

    // Verify current password
    const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash the new password
    const saltRounds = 12;
    const newPasswordHash = await hash(newPassword, saltRounds);

    // Update the user password
    user.changePassword(newPasswordHash);

    // Save the updated user
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}