import { User } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';

export interface GetUserProfileRequest {
  userId: string;
  requesterId?: string; // Optional for self-access
}

export interface GetUserProfileResponse {
  user: User;
  isOwnProfile: boolean;
}

export class GetUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const { userId, requesterId } = request;

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    const isOwnProfile = requesterId === userId;

    return { user, isOwnProfile };
  }
}