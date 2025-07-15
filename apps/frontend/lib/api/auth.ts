import BaseApiClient, { ApiResponse } from './base'
import { User } from '@kanban/domain-core'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username: string
  name?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface VerifyTokenResponse {
  user: User
  valid: boolean
}

class AuthApiClient extends BaseApiClient {
  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    return this.post<ApiResponse<AuthResponse>>('/auth/login', data)
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    return this.post<ApiResponse<AuthResponse>>('/auth/register', data)
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>('/auth/logout')
  }

  async verifyToken(token: string): Promise<ApiResponse<VerifyTokenResponse>> {
    return this.post<ApiResponse<VerifyTokenResponse>>('/auth/verify', { token })
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return this.post<ApiResponse<{ token: string }>>('/auth/refresh', { refreshToken })
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<ApiResponse<User>>('/auth/me')
  }

  async updateProfile(data: { name?: string; avatarUrl?: string }): Promise<ApiResponse<User>> {
    return this.put<ApiResponse<User>>('/auth/profile', data)
  }
}

export const authApi = new AuthApiClient('/api')
export default AuthApiClient