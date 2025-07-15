import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { PrismaClient } from "@prisma/client";

// Set test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kanban_test";

// Create a test-specific Prisma client
export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.DEBUG ? ["query", "error", "warn"] : ["error"],
});

// Global test lifecycle hooks
beforeAll(async () => {
  // Ensure test database is ready
  try {
    await prismaTest.$connect();
  } catch (error) {
    console.error("Failed to connect to test database:", error);
    process.exit(1);
  }
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

// Global test lifecycle hooks for proper cleanup
beforeEach(async () => {
  // Clean up data before each test to ensure isolation
  if (process.env.CLEANUP_BEFORE_EACH !== "false") {
    try {
      // Delete in correct order to respect foreign key constraints
      await prismaTest.activity.deleteMany({});
      await prismaTest.checklistItem.deleteMany({});
      await prismaTest.checklist.deleteMany({});
      await prismaTest.attachment.deleteMany({});
      await prismaTest.comment.deleteMany({});
      await prismaTest.cardLabel.deleteMany({});
      await prismaTest.label.deleteMany({});
      await prismaTest.card.deleteMany({});
      await prismaTest.list.deleteMany({});
      await prismaTest.boardMember.deleteMany({});
      await prismaTest.board.deleteMany({});
      await prismaTest.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup before test failed:", error);
    }
  }
});

afterEach(async () => {
  // Clean up data after each test
  if (process.env.CLEANUP_AFTER_EACH !== "false") {
    try {
      // Delete in correct order to respect foreign key constraints
      await prismaTest.activity.deleteMany({});
      await prismaTest.checklistItem.deleteMany({});
      await prismaTest.checklist.deleteMany({});
      await prismaTest.attachment.deleteMany({});
      await prismaTest.comment.deleteMany({});
      await prismaTest.cardLabel.deleteMany({});
      await prismaTest.label.deleteMany({});
      await prismaTest.card.deleteMany({});
      await prismaTest.list.deleteMany({});
      await prismaTest.boardMember.deleteMany({});
      await prismaTest.board.deleteMany({});
      await prismaTest.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup after test failed:", error);
    }
  }
});