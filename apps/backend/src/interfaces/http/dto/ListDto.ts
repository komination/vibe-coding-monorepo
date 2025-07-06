export interface CreateListDto {
  title: string;
  color?: string;
}

export interface UpdateListDto {
  title?: string;
  color?: string;
}

export interface ReorderListsDto {
  lists: { id: string; position: number }[];
}

export interface ListResponseDto {
  id: string;
  title: string;
  position: number;
  color?: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}