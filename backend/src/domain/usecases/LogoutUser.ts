export interface LogoutUserRequest {
  token: string;
  refreshToken?: string;
}

export interface LogoutUserResponse {
  success: boolean;
}

export class LogoutUserUseCase {
  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    // For Cognito-only auth, logout is handled client-side
    // The client removes tokens and redirects to Cognito logout URL
    // No server-side token blacklisting needed
    return { success: true };
  }
}