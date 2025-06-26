import { describe, test, expect, beforeEach, beforeAll } from "bun:test";
import { Hono } from "hono";
import { createBoardRoutes } from "@/interfaces/http/routes/boardRoutes";
import { prismaTest } from "@/test/setup";
import { createContainer } from "@/infrastructure/di/container";
import { mockAuthMiddleware } from "@/test/utils/mockAuth";
import { BoardRole } from "@prisma/client";

describe("Board Routes", () => {
  let app: Hono;
  let testUser: any;
  let authToken: string;
  let container: any;

  beforeAll(() => {
    // Set up container with test repositories
    container = createContainer(prismaTest);
  });

  beforeEach(async () => {
    // Create test app
    app = new Hono();
    app.use("*", mockAuthMiddleware);
    app.route("/boards", createBoardRoutes(container.boardController, container.listController));

    // Create test user
    testUser = await prismaTest.user.create({
      data: {
        cognitoId: "test-cognito-id",
        email: "test@example.com",
        name: "Test User",
        isActive: true,
      },
    });

    // Mock auth token (in real tests, you'd use a proper JWT)
    authToken = "Bearer test-token";
  });

  describe("POST /boards", () => {
    test("should create a new board", async () => {
      const response = await app.request("/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          title: "New Board",
          description: "Board Description",
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.board).toBeDefined();
      expect(data.board.title).toBe("New Board");
      expect(data.board.description).toBe("Board Description");

      // Verify board was created in database
      const board = await prismaTest.board.findUnique({
        where: { id: data.board.id },
      });
      expect(board).toBeDefined();
    });

    test("should return 400 for invalid data", async () => {
      const response = await app.request("/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          // Missing title
          description: "Board Description",
        }),
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.errors).toBeDefined();
    });

    test("should return 401 without auth", async () => {
      const response = await app.request("/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Board",
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /boards", () => {
    test("should return user's boards", async () => {
      // Create test boards
      await prismaTest.board.createMany({
        data: [
          { title: "Board 1", ownerId: testUser.id },
          { title: "Board 2", ownerId: testUser.id },
        ],
      });

      const response = await app.request("/boards", {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.boards).toHaveLength(2);
      expect(data.boards[0].title).toBeDefined();
    });

    test("should include boards where user is member", async () => {
      // Create board owned by another user
      const otherUser = await prismaTest.user.create({
        data: {
          cognitoId: "other-cognito-id",
          email: "other@example.com",
          name: "Other User",
        },
      });

      const otherBoard = await prismaTest.board.create({
        data: {
          title: "Other's Board",
          ownerId: otherUser.id,
        },
      });

      // Add test user as member
      await prismaTest.boardMember.create({
        data: {
          boardId: otherBoard.id,
          userId: testUser.id,
          role: BoardRole.MEMBER,
        },
      });

      const response = await app.request("/boards", {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.boards).toHaveLength(1);
      expect(data.boards[0].title).toBe("Other's Board");
    });
  });

  describe("GET /boards/:id", () => {
    test("should return board details", async () => {
      const board = await prismaTest.board.create({
        data: {
          title: "Test Board",
          description: "Test Description",
          ownerId: testUser.id,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.board.id).toBe(board.id);
      expect(data.board.title).toBe("Test Board");
      expect(data.board.members).toBeDefined();
    });

    test("should return 404 for non-existent board", async () => {
      const response = await app.request("/boards/non-existent-id", {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(404);
    });

    test("should return 403 if user is not a member", async () => {
      const otherUser = await prismaTest.user.create({
        data: {
          cognitoId: "other-cognito-id",
          email: "other@example.com",
          name: "Other User",
        },
      });

      const board = await prismaTest.board.create({
        data: {
          title: "Private Board",
          ownerId: otherUser.id,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe("PUT /boards/:id", () => {
    test("should update board", async () => {
      const board = await prismaTest.board.create({
        data: {
          title: "Original Title",
          ownerId: testUser.id,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          title: "Updated Title",
          description: "New Description",
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.board.title).toBe("Updated Title");
      expect(data.board.description).toBe("New Description");
    });

    test("should return 403 if user is not owner or admin", async () => {
      const otherUser = await prismaTest.user.create({
        data: {
          cognitoId: "other-cognito-id",
          email: "other@example.com",
          name: "Other User",
        },
      });

      const board = await prismaTest.board.create({
        data: {
          title: "Other's Board",
          ownerId: otherUser.id,
        },
      });

      // Add test user as regular member
      await prismaTest.boardMember.create({
        data: {
          boardId: board.id,
          userId: testUser.id,
          role: BoardRole.MEMBER,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          title: "Updated Title",
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /boards/:id", () => {
    test("should delete board if owner", async () => {
      const board = await prismaTest.board.create({
        data: {
          title: "Board to Delete",
          ownerId: testUser.id,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(204);

      // Verify board was deleted
      const deletedBoard = await prismaTest.board.findUnique({
        where: { id: board.id },
      });
      expect(deletedBoard).toBeNull();
    });

    test("should return 403 if not owner", async () => {
      const otherUser = await prismaTest.user.create({
        data: {
          cognitoId: "other-cognito-id",
          email: "other@example.com",
          name: "Other User",
        },
      });

      const board = await prismaTest.board.create({
        data: {
          title: "Other's Board",
          ownerId: otherUser.id,
        },
      });

      const response = await app.request(`/boards/${board.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authToken,
        },
      });

      expect(response.status).toBe(403);
    });
  });
});