import { blacklistToken } from '@/infrastructure/cache/TokenBlacklist';

export interface LogoutUserRequest {
  token: string;
  refreshToken?: string;
}

export interface LogoutUserResponse {
  success: boolean;
}

export class LogoutUserUseCase {
  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    const { token, refreshToken } = request;

    try {
      // Blacklist the access token
      await blacklistToken(token);

      // Blacklist the refresh token if provided
      if (refreshToken) {
        await blacklistToken(refreshToken);
      }

      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if blacklisting fails, we should return success
      // The client will remove tokens anyway
      return { success: true };
    }
  }
}