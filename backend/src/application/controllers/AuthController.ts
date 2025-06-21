import { Context } from 'hono';
import { RegisterUserUseCase } from '@/domain/usecases/RegisterUser';
import { LoginUserUseCase } from '@/domain/usecases/LoginUser';
import { GetUserProfileUseCase } from '@/domain/usecases/GetUserProfile';
import { RefreshTokenUseCase } from '@/domain/usecases/RefreshToken';
import { UpdateUserProfileUseCase } from '@/domain/usecases/UpdateUserProfile';
import { ChangePasswordUseCase } from '@/domain/usecases/ChangePassword';
import { AuthValidator } from '@/application/validators/AuthValidator';
import { UserResponseDto } from '@/interfaces/http/dto/UserDto';
import { User } from '@/domain/entities/User';

export class AuthController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    private loginUserUseCase: LoginUserUseCase,
    private getUserProfileUseCase: GetUserProfileUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase,
    private changePasswordUseCase: ChangePasswordUseCase
  ) {}

  async register(c: Context) {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validation = AuthValidator.validateRegister(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.registerUserUseCase.execute(validation.data!);

      // Return response (without sensitive data)
      const response: UserResponseDto = this.mapUserToResponse(result.user);
      return c.json(response, 201);

    } catch (error) {
      console.error('Error registering user:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          return c.json({ error: 'User already exists' }, 409);
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return c.json({ error: error.message }, 400);
        }
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async login(c: Context) {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validation = AuthValidator.validateLogin(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.loginUserUseCase.execute(validation.data!);

      // Return response
      const response = {
        user: this.mapUserToResponse(result.user),
        token: result.token,
        refreshToken: result.refreshToken,
      };
      
      return c.json(response);

    } catch (error) {
      console.error('Error logging in user:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          return c.json({ error: 'Invalid credentials' }, 401);
        }
        if (error.message === 'Account is inactive') {
          return c.json({ error: 'Account is inactive' }, 403);
        }
        if (error.message.includes('validation') || error.message.includes('invalid')) {
          return c.json({ error: error.message }, 400);
        }
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

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

  async refreshToken(c: Context) {
    try {
      // Parse and validate request body
      const body = await c.req.json();
      const validation = AuthValidator.validateRefreshToken(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.refreshTokenUseCase.execute(validation.data!);

      // Return response
      const response = {
        user: this.mapUserToResponse(result.user),
        token: result.token,
        refreshToken: result.refreshToken,
      };
      
      return c.json(response);

    } catch (error) {
      console.error('Error refreshing token:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid refresh token') || 
            error.message.includes('expired')) {
          return c.json({ error: error.message }, 401);
        }
        if (error.message === 'User not found' || 
            error.message === 'User account is inactive') {
          return c.json({ error: 'Access denied' }, 403);
        }
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async logout(c: Context) {
    // For JWT tokens, logout is handled client-side by removing the token
    // In a more sophisticated implementation, you might maintain a blacklist
    return c.json({ message: 'Logged out successfully' });
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

  async changePassword(c: Context) {
    try {
      // Get userId from auth middleware
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Authentication required' }, 401);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = AuthValidator.validateChangePassword(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.changePasswordUseCase.execute({
        userId,
        ...validation.data!,
      });

      // Return response
      return c.json({ 
        success: result.success,
        message: result.message 
      });

    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return c.json({ error: 'User not found' }, 404);
        }
        if (error.message === 'Cannot change password for inactive user') {
          return c.json({ error: 'Account is inactive' }, 403);
        }
        if (error.message === 'Current password is incorrect') {
          return c.json({ error: 'Current password is incorrect' }, 400);
        }
        if (error.message.includes('password')) {
          return c.json({ error: error.message }, 400);
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