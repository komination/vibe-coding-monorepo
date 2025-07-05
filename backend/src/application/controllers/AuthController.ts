import { Context } from 'hono';
import { LogoutUserUseCase } from '@/domain/usecases/LogoutUser';
import { GetUserProfileUseCase } from '@/domain/usecases/GetUserProfile';
import { UpdateUserProfileUseCase } from '@/domain/usecases/UpdateUserProfile';
import { AuthValidator } from '@/application/validators/AuthValidator';
import { UserResponseDto } from '@/interfaces/http/dto/UserDto';
import { User } from '@kanban/domain-core';

export class AuthController {
  constructor(
    private logoutUserUseCase: LogoutUserUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase
  ) {}


  async getProfile(c: Context) {
    try {
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Execute use case
      const result = await this.getUserProfileUseCase.execute({
        userId,
        requesterId: userId,
      });

      // Return response
      const response: UserResponseDto = this.mapUserToResponse(result.user);
      return c.json(response);

    } catch (error) {
      console.error('Error getting user profile:', error);
      
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return c.json({ error: 'User not found' }, 404);
        }
        if (error.message === 'User account is inactive') {
          return c.json({ error: 'Account is inactive' }, 403);
        }
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }


  async logout(c: Context) {
    try {
      // Execute logout use case (simplified for Cognito-only)
      await this.logoutUserUseCase.execute({
        token: '',
        refreshToken: undefined,
      });

      return c.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, return success since client will remove tokens
      return c.json({ message: 'Logged out successfully' });
    }
  }

  async updateProfile(c: Context) {
    try {
      // Get userId from auth middleware
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = AuthValidator.validateUpdateProfile(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.updateUserProfileUseCase.execute({
        userId,
        ...validation.data!,
      });

      // Return response
      const response: UserResponseDto = this.mapUserToResponse(result.user);
      return c.json(response);

    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return c.json({ error: 'User not found' }, 404);
        }
        if (error.message === 'Cannot update profile for inactive user') {
          return c.json({ error: 'Account is inactive' }, 403);
        }
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }


  private mapUserToResponse(user: User): UserResponseDto {
    const userData = user.toJSON();
    return {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      isActive: userData.isActive,
      createdAt: userData.createdAt.toISOString(),
      updatedAt: userData.updatedAt.toISOString(),
    };
  }
}