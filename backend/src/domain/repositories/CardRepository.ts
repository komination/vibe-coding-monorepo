import { Card } from '@/domain/entities/Card';

export interface CardRepository {
  findById(id: string): Promise<Card | null>;
  findByList(listId: string, options?: {
    includeArchived?: boolean;
    orderBy?: 'position' | 'title' | 'dueDate' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<Card[]>;
  findByBoard(boardId: string, options?: {
    includeArchived?: boolean;
    assigneeId?: string;
    dueDate?: {
      from?: Date;
      to?: Date;
    };
    limit?: number;
    offset?: number;
  }): Promise<Card[]>;
  findByAssignee(assigneeId: string, options?: {
    includeArchived?: boolean;
    boardId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Card[]>;
  findOverdueCards(options?: {
    boardId?: string;
    assigneeId?: string;
  }): Promise<Card[]>;
  save(card: Card): Promise<void>;
  delete(id: string): Promise<void>;
  moveCard(cardId: string, targetListId: string, position: number): Promise<void>;
  reorderCards(listId: string, cardPositions: { id: string; position: number }[]): Promise<void>;
  getNextPosition(listId: string): Promise<number>;
  existsInList(cardId: string, listId: string): Promise<boolean>;
}