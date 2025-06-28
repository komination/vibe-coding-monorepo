import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Card } from "@/domain/entities/Card";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { CardBuilder } from "@/test/fixtures/entityFactories";

describe("Card Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("Card creation", () => {
    test("generates unique UUID when creating card", () => {
      const card = CardBuilder.valid().build();
      expect(card.id).toMatch(UUID_REGEX);
    });

    test("assigns provided title to new card", () => {
      const card = CardBuilder.valid().withTitle("Custom Card").build();
      expect(card.title).toBe("Custom Card");
    });

    test("assigns provided description to new card", () => {
      const card = CardBuilder.valid().withDescription("Custom Description").build();
      expect(card.description).toBe("Custom Description");
    });

    test("assigns provided position to new card", () => {
      const card = CardBuilder.valid().withPosition(2500).build();
      expect(card.position).toBe(2500);
    });

    test("assigns provided due date to new card", () => {
      const dueDate = new Date("2024-12-31");
      const card = CardBuilder.valid().withDueDate(dueDate).build();
      expect(card.dueDate).toEqual(dueDate);
    });

    test("assigns provided start date to new card", () => {
      const startDate = new Date("2024-01-15");
      const card = CardBuilder.valid().withStartDate(startDate).build();
      expect(card.startDate).toEqual(startDate);
    });

    test("assigns provided cover URL to new card", () => {
      const card = CardBuilder.valid().withCoverUrl("https://example.com/cover.jpg").build();
      expect(card.coverUrl).toBe("https://example.com/cover.jpg");
    });

    test("assigns card to specified list", () => {
      const card = CardBuilder.valid().inList("list-456").build();
      expect(card.listId).toBe("list-456");
    });

    test("assigns card to creator", () => {
      const card = CardBuilder.valid().createdBy("user-789").build();
      expect(card.creatorId).toBe("user-789");
    });

    test("assigns card to assignee when specified", () => {
      const card = CardBuilder.valid().assignedTo("user-456").build();
      expect(card.assigneeId).toBe("user-456");
    });

    test("sets archived status according to specification", () => {
      const archivedCard = CardBuilder.valid().archived().build();
      const activeCard = CardBuilder.valid().active().build();
      expect(archivedCard.isArchived).toBe(true);
      expect(activeCard.isArchived).toBe(false);
    });

    test("sets current timestamp for creation date", () => {
      const card = CardBuilder.valid().build();
      expect(card.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("sets current timestamp for updated date", () => {
      const card = CardBuilder.valid().build();
      expect(card.updatedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("creates card without optional properties when not provided", () => {
      const card = CardBuilder.valid().withTitle("Minimal Card").build();
      expect(card.description).toBeUndefined();
      expect(card.dueDate).toBeUndefined();
      expect(card.startDate).toBeUndefined();
      expect(card.coverUrl).toBeUndefined();
      expect(card.assigneeId).toBeUndefined();
    });

    test("generates different UUIDs for multiple cards", () => {
      const card1 = CardBuilder.valid().withTitle("Card 1").build();
      const card2 = CardBuilder.valid().withTitle("Card 2").build();
      expect(card1.id).not.toBe(card2.id);
    });
  });

  describe("Card restoration from persistence", () => {
    test("should restore card from persistence data", () => {
      const persistenceData = {
        id: "card-123",
        title: "Persisted Card",
        description: "From database",
        position: 3000,
        dueDate: new Date("2024-06-30"),
        startDate: new Date("2024-01-10"),
        isArchived: true,
        coverUrl: "https://example.com/persisted.jpg",
        listId: "list-789",
        creatorId: "user-111",
        assigneeId: "user-222",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      };

      const card = Card.fromPersistence(persistenceData);

      expect(card.id).toBe("card-123");
      expect(card.title).toBe("Persisted Card");
      expect(card.description).toBe("From database");
      expect(card.position).toBe(3000);
      expect(card.dueDate).toEqual(new Date("2024-06-30"));
      expect(card.startDate).toEqual(new Date("2024-01-10"));
      expect(card.isArchived).toBe(true);
      expect(card.coverUrl).toBe("https://example.com/persisted.jpg");
      expect(card.listId).toBe("list-789");
      expect(card.creatorId).toBe("user-111");
      expect(card.assigneeId).toBe("user-222");
      expect(card.createdAt).toEqual(new Date("2023-01-01"));
      expect(card.updatedAt).toEqual(new Date("2023-06-01"));
    });
  });

  describe("Card property updates", () => {
    test("should update card title", () => {
      const card = Card.create({
        title: "Original Title",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const originalId = card.id;
      const originalCreatedAt = card.createdAt;

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      card.updateTitle("Updated Title");

      expect(card.id).toBe(originalId);
      expect(card.title).toBe("Updated Title");
      expect(card.createdAt).toEqual(originalCreatedAt);
      expect(card.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should update card description", () => {
      const card = Card.create({
        title: "Test Card",
        description: "Original Description",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.updateDescription("New Description");
      expect(card.description).toBe("New Description");

      card.updateDescription(undefined);
      expect(card.description).toBeUndefined();
    });

    test("should update card position", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.updatePosition(2500);
      expect(card.position).toBe(2500);
    });

    test("should update due date", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newDueDate = new Date("2024-12-31");
      card.updateDueDate(newDueDate);
      expect(card.dueDate).toEqual(newDueDate);

      card.updateDueDate(undefined);
      expect(card.dueDate).toBeUndefined();
    });

    test("should update start date", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newStartDate = new Date("2024-01-15");
      card.updateStartDate(newStartDate);
      expect(card.startDate).toEqual(newStartDate);

      card.updateStartDate(undefined);
      expect(card.startDate).toBeUndefined();
    });

    test("should update cover URL", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.updateCover("https://example.com/new-cover.jpg");
      expect(card.coverUrl).toBe("https://example.com/new-cover.jpg");

      card.updateCover(undefined);
      expect(card.coverUrl).toBeUndefined();
    });
  });

  describe("Card list movement", () => {
    test("should move card to a different list", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      card.moveToList("list-456", 2000);

      expect(card.listId).toBe("list-456");
      expect(card.position).toBe(2000);
      expect(card.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should handle moving within the same list", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.moveToList("list-123", 3000);

      expect(card.listId).toBe("list-123");
      expect(card.position).toBe(3000);
    });
  });

  describe("Card assignment", () => {
    test("should assign card to a user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.assignTo("user-456");
      expect(card.assigneeId).toBe("user-456");
    });

    test("should unassign card when set to undefined", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      card.assignTo(undefined);
      expect(card.assigneeId).toBeUndefined();
    });

    test("should reassign card to different user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      card.assignTo("user-789");
      expect(card.assigneeId).toBe("user-789");
    });
  });

  describe("Card archival", () => {
    test("should archive card", () => {
      const card = Card.create({
        title: "Active Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.archive();
      expect(card.isArchived).toBe(true);
    });

    test("should unarchive card", () => {
      const card = Card.create({
        title: "Archived Card",
        position: 1000,
        isArchived: true,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.unarchive();
      expect(card.isArchived).toBe(false);
    });
  });

  describe("belongsToList", () => {
    test("should return true when card belongs to the list", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.belongsToList("list-123")).toBe(true);
    });

    test("should return false when card does not belong to the list", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.belongsToList("list-456")).toBe(false);
    });
  });

  describe("isCreatedBy", () => {
    test("should return true when card is created by the user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.isCreatedBy("user-123")).toBe(true);
    });

    test("should return false when card is not created by the user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.isCreatedBy("user-456")).toBe(false);
    });
  });

  describe("isAssignedTo", () => {
    test("should return true when card is assigned to the user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      expect(card.isAssignedTo("user-456")).toBe(true);
    });

    test("should return false when card is not assigned to the user", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      expect(card.isAssignedTo("user-789")).toBe(false);
    });

    test("should return false when card is not assigned to anyone", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.isAssignedTo("user-456")).toBe(false);
    });
  });

  describe("isOverdue", () => {
    test("should return true when card is overdue", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        dueDate: new Date("2023-12-31"), // Past date
      });

      expect(card.isOverdue()).toBe(true);
    });

    test("should return false when card is not overdue", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        dueDate: new Date("2024-12-31"), // Future date
      });

      expect(card.isOverdue()).toBe(false);
    });

    test("should return false when card has no due date", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(card.isOverdue()).toBe(false);
    });

    test("should handle due date exactly at current time", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        dueDate: new Date("2024-01-01T00:00:00Z"), // Same as mocked current time
      });

      expect(card.isOverdue()).toBe(false); // Not overdue if exactly at current time
    });
  });

  describe("Card serialization", () => {
    test("should serialize card to JSON", () => {
      const card = Card.create({
        title: "Test Card",
        description: "Test Description",
        position: 1000,
        dueDate: new Date("2024-12-31"),
        startDate: new Date("2024-01-15"),
        isArchived: false,
        coverUrl: "https://example.com/cover.jpg",
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      const json = card.toJSON();

      expect(json).toEqual({
        id: card.id,
        title: "Test Card",
        description: "Test Description",
        position: 1000,
        dueDate: new Date("2024-12-31"),
        startDate: new Date("2024-01-15"),
        isArchived: false,
        coverUrl: "https://example.com/cover.jpg",
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    });

    test("should serialize card with undefined optional fields", () => {
      const card = Card.create({
        title: "Minimal Card",
        position: 2000,
        isArchived: false,
        listId: "list-456",
        creatorId: "user-789",
      });

      const json = card.toJSON();

      expect(json).toEqual({
        id: card.id,
        title: "Minimal Card",
        description: undefined,
        position: 2000,
        dueDate: undefined,
        startDate: undefined,
        isArchived: false,
        coverUrl: undefined,
        listId: "list-456",
        creatorId: "user-789",
        assigneeId: undefined,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    });
  });

  describe("getters", () => {
    test("should expose all properties through getters", () => {
      const dueDate = new Date("2024-12-31");
      const startDate = new Date("2024-01-15");
      const card = Card.create({
        title: "Getter Test Card",
        description: "Getter Description",
        position: 5000,
        dueDate,
        startDate,
        isArchived: true,
        coverUrl: "https://example.com/getter.jpg",
        listId: "list-getter",
        creatorId: "user-creator",
        assigneeId: "user-assignee",
      });

      expect(card.id).toBeDefined();
      expect(card.title).toBe("Getter Test Card");
      expect(card.description).toBe("Getter Description");
      expect(card.position).toBe(5000);
      expect(card.dueDate).toEqual(dueDate);
      expect(card.startDate).toEqual(startDate);
      expect(card.isArchived).toBe(true);
      expect(card.coverUrl).toBe("https://example.com/getter.jpg");
      expect(card.listId).toBe("list-getter");
      expect(card.creatorId).toBe("user-creator");
      expect(card.assigneeId).toBe("user-assignee");
      expect(card.createdAt).toBeInstanceOf(Date);
      expect(card.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("Card business rules validation", () => {
    test("should allow empty title (validation at application layer)", () => {
      const card = Card.create({
        title: "", // Empty title - validation handled at application layer
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.title).toBe("");
    });

    test("should allow long titles (validation at application layer)", () => {
      const longTitle = "a".repeat(256);
      const card = Card.create({
        title: longTitle, // Long title - validation handled at application layer
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.title).toBe(longTitle);
    });

    test("should allow long descriptions (validation at application layer)", () => {
      const longDescription = "a".repeat(10001);
      const card = Card.create({
        title: "Test Card",
        description: longDescription, // Long description - validation handled at application layer
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.description).toBe(longDescription);
    });

    test("should allow invalid cover URLs (validation at application layer)", () => {
      const card = Card.create({
        title: "Test Card",
        coverUrl: "not-a-valid-url", // Invalid URL - validation handled at application layer
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.coverUrl).toBe("not-a-valid-url");
    });

    test("should allow negative positions", () => {
      const card = Card.create({
        title: "Negative Position Card",
        position: -1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.position).toBe(-1000);
    });

    test("should allow decimal positions", () => {
      const card = Card.create({
        title: "Decimal Position Card",
        position: 1500.5,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.position).toBe(1500.5);
    });

    test("should handle start date after due date (validation at application layer)", () => {
      const card = Card.create({
        title: "Invalid Date Range Card",
        position: 1000,
        startDate: new Date("2024-12-31"),
        dueDate: new Date("2024-01-01"), // Due date before start date
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });
      expect(card.startDate).toEqual(new Date("2024-12-31"));
      expect(card.dueDate).toEqual(new Date("2024-01-01"));
    });
  });
});