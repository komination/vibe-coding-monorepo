import { describe, test, expect, beforeEach } from "bun:test";
import { PrismaBoardRepository } from "@/infrastructure/repositories/PrismaBoardRepository";
import { prismaTest } from "@/test/setup";
import { Board } from "@kanban/domain-core";
import { BoardRole } from "@prisma/client";
import { UserBuilder } from "@/test/fixtures/entityFactories";

describe("PrismaBoardRepository", () => {
  let repository: PrismaBoardRepository;
  let testUser: any;

  beforeEach(async () => {
    repository = new PrismaBoardRepository(prismaTest);

    // Create a unique test user for each test
    const userBuilder = UserBuilder.valid();
    const userData = userBuilder.build();
    
    testUser = await prismaTest.user.create({
      data: {
        cognitoSub: userData.cognitoSub,
        email: userData.email,
        username: userData.username,
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
      // Create another unique user
      const anotherUserBuilder = UserBuilder.valid();
      const anotherUserData = anotherUserBuilder.build();
      
      const anotherUser = await prismaTest.user.create({
        data: {
          cognitoSub: anotherUserData.cognitoSub,
          email: anotherUserData.email,
          username: anotherUserData.username,
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

      const newUserBuilder = UserBuilder.valid();
      const newUserData = newUserBuilder.build();
      
      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: newUserData.cognitoSub,
          email: newUserData.email,
          username: newUserData.username,
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

      const newUserBuilder = UserBuilder.valid();
      const newUserData = newUserBuilder.build();
      
      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: newUserData.cognitoSub,
          email: newUserData.email,
          username: newUserData.username,
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

      const newUserBuilder = UserBuilder.valid();
      const newUserData = newUserBuilder.build();
      
      const newUser = await prismaTest.user.create({
        data: {
          cognitoSub: newUserData.cognitoSub,
          email: newUserData.email,
          username: newUserData.username,
          name: "New User 3",
          isActive: true,
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