import { User, Board, List, Card, Label, BoardMember } from "@/domain/entities";
import { BoardRole } from "@prisma/client";

let idCounter = 1;

export function createMockUser(overrides: Partial<User> = {}): User {
  const id = `user-${idCounter++}`;
  return {
    id,
    cognitoId: `cognito-${id}`,
    email: `${id}@example.com`,
    name: `Test User ${id}`,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBoard(overrides: Partial<Board> = {}): Board {
  const id = `board-${idCounter++}`;
  return {
    id,
    name: `Test Board ${id}`,
    description: `Description for ${id}`,
    color: "#0079BF",
    isArchived: false,
    ownerId: `user-${idCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockList(overrides: Partial<List> = {}): List {
  const id = `list-${idCounter++}`;
  return {
    id,
    name: `Test List ${id}`,
    position: idCounter * 1000,
    boardId: `board-${idCounter}`,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCard(overrides: Partial<Card> = {}): Card {
  const id = `card-${idCounter++}`;
  return {
    id,
    title: `Test Card ${id}`,
    description: `Description for ${id}`,
    position: idCounter * 1000,
    listId: `list-${idCounter}`,
    dueDate: null,
    isArchived: false,
    coverUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockLabel(overrides: Partial<Label> = {}): Label {
  const id = `label-${idCounter++}`;
  return {
    id,
    name: `Test Label ${id}`,
    color: "#61BD4F",
    boardId: `board-${idCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBoardMember(overrides: Partial<BoardMember> = {}): BoardMember {
  return {
    boardId: `board-${idCounter}`,
    userId: `user-${idCounter}`,
    role: BoardRole.MEMBER,
    joinedAt: new Date(),
    ...overrides,
  };
}

export function resetIdCounter() {
  idCounter = 1;
}