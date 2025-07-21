import { apiClient } from "./client"

export interface User {
  id: string
  email: string
  username: string
  name?: string
  avatarUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  username?: string
  avatarUrl?: string
}

export const authApi = {
  async getProfile(): Promise<User> {
    return apiClient.get("/auth/me")
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.put("/auth/profile", data)
  },

  async logout(): Promise<{ message: string }> {
    return apiClient.post("/auth/logout")
  },
}