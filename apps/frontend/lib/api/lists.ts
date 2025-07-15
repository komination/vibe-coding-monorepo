import BaseApiClient, { ApiResponse } from './base'
import { List } from '@kanban/domain-core'

export interface CreateListData {
  title: string
  boardId: string
  color?: string
}

export interface UpdateListData {
  title?: string
  color?: string
}

export interface ReorderListsData {
  listIds: string[]
}

class ListsApiClient extends BaseApiClient {
  async getLists(boardId: string): Promise<ApiResponse<List[]>> {
    return this.get<ApiResponse<List[]>>(`/boards/${boardId}/lists`)
  }

  async getList(id: string): Promise<ApiResponse<List>> {
    return this.get<ApiResponse<List>>(`/lists/${id}`)
  }

  async createList(data: CreateListData): Promise<ApiResponse<List>> {
    return this.post<ApiResponse<List>>('/lists', data)
  }

  async updateList(id: string, data: UpdateListData): Promise<ApiResponse<List>> {
    return this.put<ApiResponse<List>>(`/lists/${id}`, data)
  }

  async deleteList(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/lists/${id}`)
  }

  async reorderLists(boardId: string, data: ReorderListsData): Promise<ApiResponse<List[]>> {
    return this.put<ApiResponse<List[]>>(`/boards/${boardId}/lists/reorder`, data)
  }
}

export const listsApi = new ListsApiClient('/api')
export default ListsApiClient