import { apiClient } from "./client"

export interface Board {
  id: string
  title: string
  description?: string
  isPrivate: boolean
  backgroundUrl?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  memberCount?: number
  listCount?: number
}

export interface CreateBoardRequest {
  title: string
  description?: string
  isPrivate?: boolean
  backgroundUrl?: string
}

export interface UpdateBoardRequest {
  title?: string
  description?: string
  isPrivate?: boolean
  backgroundUrl?: string
}

export interface BoardMember {
  id: string
  userId: string
  boardId: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  joinedAt: string
  user: {
    id: string
    username: string
    name?: string
    avatarUrl?: string
  }
}

export const boardsApi = {
  async getUserBoards(): Promise<Board[]> {
    return apiClient.get("/boards")
  },

  async getBoard(id: string): Promise<Board> {
    return apiClient.get(`/boards/${id}`)
  },

  async createBoard(data: CreateBoardRequest): Promise<Board> {
    return apiClient.post("/boards", data)
  },

  async updateBoard(id: string, data: UpdateBoardRequest): Promise<Board> {
    return apiClient.put(`/boards/${id}`, data)
  },

  async deleteBoard(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/boards/${id}`)
  },

  async getBoardMembers(boardId: string): Promise<BoardMember[]> {
    return apiClient.get(`/boards/${boardId}/members`)
  },

  async addBoardMember(
    boardId: string, 
    data: { email: string; role?: string }
  ): Promise<BoardMember> {
    return apiClient.post(`/boards/${boardId}/members`, data)
  },

  async updateMemberRole(
    boardId: string, 
    memberId: string, 
    role: string
  ): Promise<BoardMember> {
    return apiClient.put(`/boards/${boardId}/members/${memberId}`, { role })
  },

  async removeBoardMember(boardId: string, memberId: string): Promise<{ message: string }> {
    return apiClient.delete(`/boards/${boardId}/members/${memberId}`)
  },
}