import { Label } from '@kanban/domain-core';

export interface LabelRepository {
  findById(id: string): Promise<Label | null>;
  findByBoard(boardId: string): Promise<Label[]>;
  save(label: Label): Promise<void>;
  delete(id: string): Promise<void>;
  addToCard(cardId: string, labelId: string): Promise<void>;
  removeFromCard(cardId: string, labelId: string): Promise<void>;
  getCardLabels(cardId: string): Promise<Label[]>;
  isAttachedToCard(cardId: string, labelId: string): Promise<boolean>;
  existsInBoard(labelId: string, boardId: string): Promise<boolean>;
}