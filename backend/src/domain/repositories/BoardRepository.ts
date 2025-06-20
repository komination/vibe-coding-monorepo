import { Board, BoardRole } from '@/domain/entities/Board';

export interface BoardMember {
  userId: string;
  role: BoardRole;
  joinedAt: Date;
}

export interface BoardRepository {
  findById(id: string): Promise<Board | null>;
  findByOwner(ownerId: string, options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Board[]>;
  findByMember(userId: string, options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Board[]>;
  findPublicBoards(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Board[]>;
  save(board: Board): Promise<void>;
  delete(id: string): Promise<void>;
  addMember(boardId: string, userId: string, role: BoardRole): Promise<void>;
  removeMember(boardId: string, userId: string): Promise<void>;
  updateMemberRole(boardId: string, userId: string, role: BoardRole): Promise<void>;
  getMemberRole(boardId: string, userId: string): Promise<BoardRole | null>;
  getMembers(boardId: string): Promise<BoardMember[]>;
  isMember(boardId: string, userId: string): Promise<boolean>;
}