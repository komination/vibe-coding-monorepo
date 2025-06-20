export interface CreateBoardDto {
  title: string;
  description?: string;
  backgroundUrl?: string;
  isPublic?: boolean;
}

export interface UpdateBoardDto {
  title?: string;
  description?: string;
  backgroundUrl?: string;
  isPublic?: boolean;
}

export interface BoardResponseDto {
  id: string;
  title: string;
  description?: string;
  backgroundUrl?: string;
  isPublic: boolean;
  isArchived: boolean;
  ownerId: string;
  userRole: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardListResponseDto {
  boards: BoardResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface AddMemberDto {
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface UpdateMemberDto {
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}