export interface LabelResponseDto {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: string;
}

export interface CreateLabelDto {
  name: string;
  color: string;
}

export interface UpdateLabelDto {
  name?: string;
  color?: string;
}

export interface AddLabelToCardDto {
  labelId: string;
}