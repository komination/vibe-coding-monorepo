import BaseApiClient, { ApiResponse } from './base'
import { User } from '@kanban/domain-core'

class AuthApiClient extends BaseApiClient {
  async logout(): Promise<ApiResponse<void>> {
    return this.post<ApiResponse<void>>('/auth/logout')
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