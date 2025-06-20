import { List } from '@/domain/entities/List';

export interface ListRepository {
  findById(id: string): Promise<List | null>;
  findByBoard(boardId: string, options?: {
    orderBy?: 'position' | 'title' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<List[]>;
  save(list: List): Promise<void>;
  delete(id: string): Promise<void>;
  reorderLists(boardId: string, listPositions: { id: string; position: number }[]): Promise<void>;
  getNextPosition(boardId: string): Promise<number>;
  existsInBoard(listId: string, boardId: string): Promise<boolean>;
}