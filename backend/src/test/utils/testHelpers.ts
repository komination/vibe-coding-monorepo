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