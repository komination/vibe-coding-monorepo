import BaseApiClient, { ApiResponse } from './base'
import { Board, BoardMember, BoardRole } from '@kanban/domain-core'

export interface CreateBoardData {
  title: string
  description?: string
  backgroundUrl?: string
  isPublic?: boolean
}

export interface UpdateBoardData {
  title?: string
  description?: string
  backgroundUrl?: string
  isPublic?: boolean
}

class BoardsApiClient extends BaseApiClient {
  async getBoards(): Promise<ApiResponse<Board[]>> {
    return this.get<ApiResponse<Board[]>>('/boards')
  }

  async getBoard(id: string): Promise<ApiResponse<Board>> {
    return this.get<ApiResponse<Board>>(`/boards/${id}`)
  }

  async createBoard(data: CreateBoardData): Promise<ApiResponse<Board>> {
    return this.post<ApiResponse<Board>>('/boards', data)
  }

  async updateBoard(id: string, data: UpdateBoardData): Promise<ApiResponse<Board>> {
    return this.put<ApiResponse<Board>>(`/boards/${id}`, data)
  }

  async deleteBoard(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/boards/${id}`)
  }

  async getBoardMembers(boardId: string): Promise<ApiResponse<BoardMember[]>> {
    return this.get<ApiResponse<BoardMember[]>>(`/boards/${boardId}/members`)
  }

  async addBoardMember(
    boardId: string, 
    userId: string, 
    role: BoardRole
  ): Promise<ApiResponse<BoardMember>> {
    return this.post<ApiResponse<BoardMember>>(`/boards/${boardId}/members`, {
      userId,
      role,
    })
  }

  async updateMemberRole(
    boardId: string,
    userId: string,
    role: BoardRole
  ): Promise<ApiResponse<BoardMember>> {
    return this.put<ApiResponse<BoardMember>>(
      `/boards/${boardId}/members/${userId}`,
      { role }
    )
  }

  async removeBoardMember(
    boardId: string, 
    userId: string
  ): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/boards/${boardId}/members/${userId}`)
  }
}

export const boardsApi = new BoardsApiClient('/api')
export default BoardsApiClient