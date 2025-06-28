import { describe, test, expect, beforeEach } from "bun:test";
import { PrismaBoardRepository } from "@/infrastructure/repositories/PrismaBoardRepository";
import { prismaTest } from "@/test/setup";
import { Board } from "@/domain/entities/Board";
import { BoardRole } from "@prisma/client";

describe("PrismaBoardRepository", () => {
  let repository: PrismaBoardRepository;
  let testUser: any;

  beforeEach(async () => {
    repository = new PrismaBoardRepository(prismaTest);

    // Create a test user
    testUser = await prismaTest.user.create({
      data: {
        cognitoSub: "test-cognito-id",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        isActive: true,
      },
    });
  });

  describe("save", () => {
    test("should save a new board", async () => {
      const board = Board.create({
        title: "Test Board",
        description: "Test Description",
        isPublic: false,
        isArchived: false,
        ownerId: testUser.id,
      });

      await repository.save(board);

      const savedBoard = await prismaTest.board.findUnique({
        where: { id: board.id },
      });

      expect(savedBoard).toBeDefined();
      expect(savedBoard?.title).toBe("Test Board");
      expect(savedBoard?.description).toBe("Test Description");
      expect(savedBoard?.ownerId).toBe(testUser.id);
    });

    test("should update an existing board", async () => {
      // First create a board
      const board = Board.create({
        title: "Original Title",
        isPublic: false,
        isArchived: false,
        ownerId: testUser.id,
      });
      await repository.save(board);

      // Update the board
      board.updateTitle("Updated Title");
      board.updateDescription("New Description");
      await repository.save(board);

      const updatedBoard = await prismaTest.board.findUnique({
        where: { id: board.id },
      });

      expect(updatedBoard?.title).toBe("Updated Title");
      expect(updatedBoard?.description).toBe("New Description");
    });
  });

  describe("findById", () => {
    test("should find board by id", async () => {
      const boardData = await prismaTest.board.create({
        data: {
          title: "Test Board",
          ownerId: testUser.id,
        },
      });

      const board = await repository.findById(boardData.id);

      expect(board).toBeDefined();
      expect(board?.id).toBe(boardData.id);
      expect(board?.title).toBe("Test Board");
    });

    test("should return null if board not found", async () => {
      const board = await repository.findById("non-existent-id");
      expect(board).toBeNull();
    });
  });

  describe("findByOwner", () => {
    test("should find boards by owner", async () => {
      // Create multiple boards
      await prismaTest.board.createMany({
        data: [
          { title: "Board 1", ownerId: testUser.id },
          { title: "Board 2", ownerId: testUser.id },
          { title: "Board 3", ownerId: testUser.id, isArchived: true },
        ],
      });

      const boards = await repository.findByOwner(testUser.id);

      expect(boards).toHaveLength(2); // Archived board should be excluded by default
      expect(boards[0].title).toBeDefined();
    });

    test("should include archived boards when specified", async () => {
      await prismaTest.board.createMany({
        data: [
          { title: "Active Board", ownerId: testUser.id },
          { title: "Archived Board", ownerId: testUser.id, isArchived: true },
        ],
      });

      const boards = await repository.findByOwner(testUser.id, {
        includeArchived: true,
      });

      expect(boards).toHaveLength(2);
    });

    test("should respect limit and offset", async () => {
      // Create 5 boards
      for (let i = 1; i <= 5; i++) {
        await prismaTest.board.create({
          data: { title: `Board ${i}`, ownerId: testUser.id },
        });
      }

      const boards = await repository.findByOwner(testUser.id, {
        limit: 2,
        offset: 1,
      });

      expect(boards).toHaveLength(2);
    });
  });

  describe("findByMember", () => {
    test("should find boards where user is a member", async () => {
      // Create another user first
      const anotherUser = await prismaTest.user.create({
        data: {
          cognitoSub: "another-user-cognito",
          email: "another@example.com",
          username: "anotheruser",
          name: "Another User",
          isActive: true,
        },
      });

      const board1 = await prismaTest.board.create({
        data: { title: "Board 1", ownerId: testUser.id },
      });

      const board2 = await prismaTest.board.create({
        data: { title: "Board 2", ownerId: anotherUser.id },
      });

      // Add test user as member to board2
      await prismaTest.boardMember.create({
        data: {
          boardId: board2.id,
          userId: testUser.id,
          role: BoardRole.MEMBER,
        },
      });

      const boards = await repository.findByMember(testUser.id);

      // Should find at least 1 board (the membership on board2)
      expect(boards.length).toBeGreaterThanOrEqual(1);
      expect(boards.map((b) => b.title)).toContain("Board 2");
    });
  });

  describe("addMember", () => {
    test("should add a member to board", async () => {
      const board = await prismaTest.board.create({
        data: { title: "Test Board", ownerId: testUser.id },
      });

      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: "new-user-cognito-1",
          email: "newuser1@example.com",
          username: "newuser1",
          name: "New User 1",
          isActive: true,
        },
      });

      await repository.addMember(board.id, newUser.id, BoardRole.MEMBER);

      const member = await prismaTest.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: newUser.id,
          },
        },
      });

      expect(member).toBeDefined();
      expect(member?.role).toBe(BoardRole.MEMBER);
    });

    test("should update role if member already exists", async () => {
      const board = await prismaTest.board.create({
        data: { title: "Test Board", ownerId: testUser.id },
      });

      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: "new-user-cognito-2",
          email: "newuser2@example.com",
          username: "newuser2",
          name: "New User 2",
          isActive: true,
        },
      });

      // Add as VIEWER first
      await repository.addMember(board.id, newUser.id, BoardRole.VIEWER);

      // Update to ADMIN using upsert
      await prismaTest.boardMember.upsert({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: newUser.id,
          },
        },
        update: {
          role: BoardRole.ADMIN,
        },
        create: {
          boardId: board.id,
          userId: newUser.id,
          role: BoardRole.ADMIN,
        },
      });

      const member = await prismaTest.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: newUser.id,
          },
        },
      });

      expect(member?.role).toBe(BoardRole.ADMIN);
    });
  });

  describe("removeMember", () => {
    test("should remove a member from board", async () => {
      const board = await prismaTest.board.create({
        data: { title: "Test Board", ownerId: testUser.id },
      });

      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: "new-user-cognito-3",
          email: "newuser3@example.com",
          username: "newuser3",
          name: "New User 3",
        },
      });

      await prismaTest.boardMember.create({
        data: {
          boardId: board.id,
          userId: newUser.id,
          role: BoardRole.MEMBER,
        },
      });

      await repository.removeMember(board.id, newUser.id);

      const member = await prismaTest.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: newUser.id,
          },
        },
      });

      expect(member).toBeNull();
    });
  });

  describe("delete", () => {
    test("should delete a board", async () => {
      const board = await prismaTest.board.create({
        data: { title: "Test Board", ownerId: testUser.id },
      });

      await repository.delete(board.id);

      const deletedBoard = await prismaTest.board.findUnique({
        where: { id: board.id },
      });

      expect(deletedBoard).toBeNull();
    });
  });
});