export type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface BoardMember {
  userId: string;
  role: BoardRole;
  joinedAt: Date;
}

export interface CreateBoardMemberData {
  boardId: string;
  userId: string;
  role: BoardRole;
}

export interface UpdateBoardMemberData {
  role: BoardRole;
}