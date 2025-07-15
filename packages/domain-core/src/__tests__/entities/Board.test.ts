import { describe, test, expect } from "bun:test";
import { Board } from "../../entities/Board";

describe("Board Entity", () => {
  describe("create", () => {
    test("should create a new board with valid properties", () => {
      const props = {
        title: "Test Board",
        description: "A test board",
        backgroundUrl: "https://example.com/bg.jpg",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      };

      const board = Board.create(props);

      expect(board.title).toBe(props.title);
      expect(board.description).toBe(props.description);
      expect(board.backgroundUrl).toBe(props.backgroundUrl);
      expect(board.isPublic).toBe(props.isPublic);
      expect(board.isArchived).toBe(props.isArchived);
      expect(board.ownerId).toBe(props.ownerId);
      expect(board.id).toBeDefined();
      expect(board.createdAt).toBeInstanceOf(Date);
      expect(board.updatedAt).toBeInstanceOf(Date);
    });

    test("should create board with minimal required properties", () => {
      const props = {
        title: "Minimal Board",
        isPublic: true,
        isArchived: false,
        ownerId: "owner-456",
      };

      const board = Board.create(props);

      expect(board.title).toBe(props.title);
      expect(board.description).toBeUndefined();
      expect(board.backgroundUrl).toBeUndefined();
      expect(board.isPublic).toBe(props.isPublic);
      expect(board.isArchived).toBe(props.isArchived);
      expect(board.ownerId).toBe(props.ownerId);
    });
  });

  describe("fromPersistence", () => {
    test("should create board from persistence data", () => {
      const props = {
        id: "existing-board-id",
        title: "Existing Board",
        description: "Existing description",
        backgroundUrl: "https://example.com/existing-bg.jpg",
        isPublic: true,
        isArchived: false,
        ownerId: "existing-owner",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const board = Board.fromPersistence(props);

      expect(board.id).toBe(props.id);
      expect(board.title).toBe(props.title);
      expect(board.description).toBe(props.description);
      expect(board.backgroundUrl).toBe(props.backgroundUrl);
      expect(board.isPublic).toBe(props.isPublic);
      expect(board.isArchived).toBe(props.isArchived);
      expect(board.ownerId).toBe(props.ownerId);
      expect(board.createdAt).toBe(props.createdAt);
      expect(board.updatedAt).toBe(props.updatedAt);
    });
  });

  describe("update methods", () => {
    test("should update board title", () => {
      const board = Board.create({
        title: "Original Title",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      const newTitle = "Updated Title";
      board.updateTitle(newTitle);

      expect(board.title).toBe(newTitle);
    });

    test("should update board description", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      const newDescription = "Updated description";
      board.updateDescription(newDescription);

      expect(board.description).toBe(newDescription);
    });

    test("should update board background URL", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      const newBackgroundUrl = "https://example.com/new-bg.jpg";
      board.updateBackgroundUrl(newBackgroundUrl);

      expect(board.backgroundUrl).toBe(newBackgroundUrl);
    });

    test("should toggle board visibility", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      board.makePublic();
      expect(board.isPublic).toBe(true);

      board.makePrivate();
      expect(board.isPublic).toBe(false);
    });

    test("should archive and unarchive board", () => {
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      board.archive();
      expect(board.isArchived).toBe(true);

      board.unarchive();
      expect(board.isArchived).toBe(false);
    });
  });

  describe("validation", () => {
    test("should validate board permissions for owner", () => {
      const ownerId = "owner-123";
      const board = Board.create({
        title: "Test Board",
        isPublic: false,
        isArchived: false,
        ownerId,
      });

      expect(board.canEdit(ownerId)).toBe(true);
      expect(board.canView(ownerId)).toBe(true);
    });

    test("should validate board permissions for non-owner", () => {
      const board = Board.create({
        title: "Private Board",
        isPublic: false,
        isArchived: false,
        ownerId: "owner-123",
      });

      const otherUserId = "other-user";
      expect(board.canEdit(otherUserId)).toBe(false);
      expect(board.canView(otherUserId)).toBe(false);
    });

    test("should allow view access to public boards", () => {
      const board = Board.create({
        title: "Public Board",
        isPublic: true,
        isArchived: false,
        ownerId: "owner-123",
      });

      const otherUserId = "other-user";
      expect(board.canView(otherUserId)).toBe(true);
      expect(board.canEdit(otherUserId)).toBe(false);
    });
  });
});