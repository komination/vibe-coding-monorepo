import { UserRepository } from '@kanban/domain-core';
import { User } from '@kanban/domain-core';

export interface UpdateUserProfileRequest {
  userId: string;
  name?: string;
  avatarUrl?: string;
}

export interface UpdateUserProfileResponse {
  success: boolean;
  user: User;
}

export class UpdateUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    const { userId, name, avatarUrl } = request;

    // Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Cannot update profile for inactive user');
    }

    // Update the user profile
    user.updateProfile(name, avatarUrl);

    // Save the updated user
    await this.userRepository.save(user);

    return {
      success: true,
      user,
    };
  }
}