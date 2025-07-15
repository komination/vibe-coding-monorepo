import BaseApiClient, { ApiResponse } from './base'
import { Card } from '@kanban/domain-core'

export interface CreateCardData {
  title: string
  listId: string
  description?: string
  dueDate?: Date
  startDate?: Date
  coverUrl?: string
  assigneeId?: string
}

export interface UpdateCardData {
  title?: string
  description?: string
  dueDate?: Date
  startDate?: Date
  coverUrl?: string
  assigneeId?: string
}

export interface MoveCardData {
  targetListId: string
  position: number
}

export interface ReorderCardsData {
  cardIds: string[]
}

class CardsApiClient extends BaseApiClient {
  async getCards(listId: string): Promise<ApiResponse<Card[]>> {
    return this.get<ApiResponse<Card[]>>(`/lists/${listId}/cards`)
  }

  async getCard(id: string): Promise<ApiResponse<Card>> {
    return this.get<ApiResponse<Card>>(`/cards/${id}`)
  }

  async createCard(data: CreateCardData): Promise<ApiResponse<Card>> {
    return this.post<ApiResponse<Card>>('/cards', data)
  }

  async updateCard(id: string, data: UpdateCardData): Promise<ApiResponse<Card>> {
    return this.put<ApiResponse<Card>>(`/cards/${id}`, data)
  }

  async deleteCard(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/cards/${id}`)
  }

  async moveCard(id: string, data: MoveCardData): Promise<ApiResponse<Card>> {
    return this.put<ApiResponse<Card>>(`/cards/${id}/move`, data)
  }

  async reorderCards(listId: string, data: ReorderCardsData): Promise<ApiResponse<Card[]>> {
    return this.put<ApiResponse<Card[]>>(`/lists/${listId}/cards/reorder`, data)
  }

  async archiveCard(id: string): Promise<ApiResponse<Card>> {
    return this.put<ApiResponse<Card>>(`/cards/${id}/archive`)
  }

  async unarchiveCard(id: string): Promise<ApiResponse<Card>> {
    return this.put<ApiResponse<Card>>(`/cards/${id}/unarchive`)
  }
}

export const cardsApi = new CardsApiClient('/api')
export default CardsApiClient