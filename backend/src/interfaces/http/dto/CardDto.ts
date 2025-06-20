export interface CreateCardDto {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  startDate?: string;
  coverUrl?: string;
}

export interface MoveCardDto {
  listId: string;
  position: number;
}

export interface CardResponseDto {
  id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: string;
  startDate?: string;
  isArchived: boolean;
  coverUrl?: string;
  listId: string;
  creatorId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export interface CardListResponseDto {
  cards: CardResponseDto[];
  total: number;
}