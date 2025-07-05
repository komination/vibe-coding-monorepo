import { ActivityType, EntityType } from "@kanban/domain-core";

export const DEFAULT_TEST_DATE = new Date("2024-01-01T00:00:00Z");

export const DEFAULT_PROPS = {
  USER: {
    email: "test@example.com",
    username: "testuser",
    cognitoSub: "cognito-sub-123",
    isActive: true,
  },
  BOARD: {
    title: "Test Board",
    isPublic: false,
    isArchived: false,
    ownerId: "user-123",
  },
  LIST: {
    title: "Test List",
    position: 1000,
    boardId: "board-123",
  },
  CARD: {
    title: "Test Card",
    position: 1000,
    isArchived: false,
    listId: "list-123",
    creatorId: "user-123",
  },
  LABEL: {
    name: "Test Label",
    color: "#0079BF",
    boardId: "board-123",
  },
  ACTIVITY: {
    action: "CREATE" as ActivityType,
    entityType: "CARD" as EntityType,
    entityId: "entity-123",
    entityTitle: "Test Entity",
    userId: "user-123",
    boardId: "board-123",
  },
  BOARD_MEMBER: {
    userId: "user-123",
    role: "MEMBER" as const,
    joinedAt: new Date("2024-01-01T00:00:00Z"),
  },
};