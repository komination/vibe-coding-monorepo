import { describe, test, expect, beforeEach, beforeAll } from "bun:test";
import { Hono } from "hono";
import { boardRoutes } from "@/interfaces/http/routes/boardRoutes";
import { prismaTest } from "@/test/setup";
import { initTestContainer } from "@/test/utils/testContainer";
import { mockAuthMiddleware } from "@/test/utils/mockAuth";
import { BoardRole } from "@prisma/client";

describe("Board Routes Integration", () => {
  let app: Hono;
  let testUser: any;

  beforeAll(() => {
    // Initialize DI container with test repositories
    initTestContainer();
  });

  beforeEach(async () => {
    // Create test app with mock auth
    app = new Hono();
    app.use("*", mockAuthMiddleware);
    app.route("/boards", boardRoutes);

    // Create test user
    testUser = await prismaTest.user.create({
      data: {
        cognitoId: "test-cognito-id",
        email: "test@example.com",
        name: "Test User",
        isActive: true,
      },
    });
  });

  test("POST /boards - creates board and adds owner as member", async () => {
    const response = await app.request("/boards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "Integration Test Board",
        description: "Testing with real database",
        isPublic: true,
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.board).toBeDefined();
    expect(data.board.title).toBe("Integration Test Board");

    // Verify board was created in database
    const board = await prismaTest.board.findUnique({
      where: { id: data.board.id },
      include: { members: true },
    });

    expect(board).toBeDefined();
    expect(board?.members).toHaveLength(1);
    expect(board?.members[0].userId).toBe(testUser.id);
    expect(board?.members[0].role).toBe(BoardRole.OWNER);

    // Verify activity was logged
    const activities = await prismaTest.activity.findMany({
      where: { boardId: board?.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].action).toBe("CREATE");
    expect(activities[0].entityType).toBe("BOARD");
  });

  test("GET /boards - returns all user boards including memberships", async () => {
    // Create boards where user is owner
    const ownedBoard1 = await prismaTest.board.create({
      data: {
        title: "Owned Board 1",
        ownerId: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: BoardRole.OWNER,
          },
        },
      },
    });

    const ownedBoard2 = await prismaTest.board.create({
      data: {
        title: "Owned Board 2",
        ownerId: testUser.id,
        isArchived: true,
        members: {
          create: {
            userId: testUser.id,
            role: BoardRole.OWNER,
          },
        },
      },
    });

    // Create board where user is member
    const otherUser = await prismaTest.user.create({
      data: {
        cognitoId: "other-user-cognito",
        email: "other@example.com",
        name: "Other User",
      },
    });

    const memberBoard = await prismaTest.board.create({
      data: {
        title: "Member Board",
        ownerId: otherUser.id,
        members: {
          create: [
            {
              userId: otherUser.id,
              role: BoardRole.OWNER,
            },
            {
              userId: testUser.id,
              role: BoardRole.MEMBER,
            },
          ],
        },
      },
    });

    const response = await app.request("/boards", {
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.boards).toHaveLength(2); // Should not include archived board
    
    const boardTitles = data.boards.map((b: any) => b.title);
    expect(boardTitles).toContain("Owned Board 1");
    expect(boardTitles).toContain("Member Board");
    expect(boardTitles).not.toContain("Owned Board 2"); // Archived
  });

  test("PUT /boards/:id - updates board with proper authorization", async () => {
    // Create board with user as admin
    const board = await prismaTest.board.create({
      data: {
        title: "Original Title",
        ownerId: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: BoardRole.OWNER,
          },
        },
      },
    });

    const response = await app.request(`/boards/${board.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        title: "Updated Title",
        description: "Updated Description",
        isPublic: true,
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.board.title).toBe("Updated Title");
    expect(data.board.description).toBe("Updated Description");
    expect(data.board.isPublic).toBe(true);

    // Verify in database
    const updatedBoard = await prismaTest.board.findUnique({
      where: { id: board.id },
    });

    expect(updatedBoard?.title).toBe("Updated Title");
    expect(updatedBoard?.updatedAt.getTime()).toBeGreaterThan(board.createdAt.getTime());
  });

  test("DELETE /boards/:id - deletes board and cascades properly", async () => {
    // Create board with lists and cards
    const board = await prismaTest.board.create({
      data: {
        title: "Board to Delete",
        ownerId: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: BoardRole.OWNER,
          },
        },
        lists: {
          create: {
            name: "Test List",
            position: 1000,
            cards: {
              create: {
                title: "Test Card",
                position: 1000,
              },
            },
          },
        },
      },
    });

    const response = await app.request(`/boards/${board.id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer test-token",
      },
    });

    expect(response.status).toBe(204);

    // Verify board and related data are deleted
    const deletedBoard = await prismaTest.board.findUnique({
      where: { id: board.id },
    });
    expect(deletedBoard).toBeNull();

    const lists = await prismaTest.list.findMany({
      where: { boardId: board.id },
    });
    expect(lists).toHaveLength(0);

    const cards = await prismaTest.card.findMany({
      where: { list: { boardId: board.id } },
    });
    expect(cards).toHaveLength(0);
  });

  test("POST /boards/:id/members - adds new member with proper role", async () => {
    const board = await prismaTest.board.create({
      data: {
        title: "Test Board",
        ownerId: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: BoardRole.OWNER,
          },
        },
      },
    });

    const newUser = await prismaTest.user.create({
      data: {
        cognitoId: "new-member-cognito",
        email: "newmember@example.com",
        name: "New Member",
      },
    });

    const response = await app.request(`/boards/${board.id}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({
        userId: newUser.id,
        role: "MEMBER",
      }),
    });

    expect(response.status).toBe(201);

    // Verify member was added
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

    // Verify activity was logged
    const activity = await prismaTest.activity.findFirst({
      where: {
        boardId: board.id,
        action: "ADD_MEMBER",
      },
    });

    expect(activity).toBeDefined();
  });
});