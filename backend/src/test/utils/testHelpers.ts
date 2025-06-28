import { PrismaClient } from "@prisma/client";
import { prismaTest } from "../setup";

export interface TestContext {
  prisma: PrismaClient;
}

export function createTestContext(): TestContext {
  return {
    prisma: prismaTest,
  };
}

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    action: "CREATE" as const,
    entityType: "CARD" as const,
    entityId: "entity-123",
    entityTitle: "Test Entity",
    userId: "user-123",
    boardId: "board-123",
  },
};

export async function cleanDatabase(prisma: PrismaClient) {
  const tables = [
    "Activity",
    "ChecklistItem",
    "Checklist",
    "Attachment",
    "Comment",
    "CardLabel",
    "Label",
    "Card",
    "List",
    "BoardMember",
    "Board",
    "User",
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

export function mockDate(date: Date = new Date("2024-01-01T00:00:00Z")) {
  const originalDate = Date;
  
  // @ts-ignore
  global.Date = class extends originalDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(date.getTime());
      } else {
        // @ts-ignore
        super(...args);
      }
    }
    
    static now() {
      return date.getTime();
    }
  };
  
  return () => {
    global.Date = originalDate;
  };
}