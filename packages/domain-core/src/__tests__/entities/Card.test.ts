import { describe, test, expect } from "bun:test";
import { Card } from "../../entities/Card";

describe("Card Entity", () => {
  describe("create", () => {
    test("should create a new card with valid properties", () => {
      const props = {
        title: "Test Card",
        description: "A test card",
        position: 1000,
        dueDate: new Date("2024-12-31"),
        startDate: new Date("2024-01-01"),
        coverUrl: "https://example.com/cover.jpg",
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      };

      const card = Card.create(props);

      expect(card.title).toBe(props.title);
      expect(card.description).toBe(props.description);
      expect(card.position).toBe(props.position);
      expect(card.dueDate).toBe(props.dueDate);
      expect(card.startDate).toBe(props.startDate);
      expect(card.coverUrl).toBe(props.coverUrl);
      expect(card.isArchived).toBe(props.isArchived);
      expect(card.listId).toBe(props.listId);
      expect(card.creatorId).toBe(props.creatorId);
      expect(card.assigneeId).toBe(props.assigneeId);
      expect(card.id).toBeDefined();
      expect(card.createdAt).toBeInstanceOf(Date);
      expect(card.updatedAt).toBeInstanceOf(Date);
    });

    test("should create card with minimal required properties", () => {
      const props = {
        title: "Minimal Card",
        position: 500,
        isArchived: false,
        listId: "list-456",
        creatorId: "user-789",
      };

      const card = Card.create(props);

      expect(card.title).toBe(props.title);
      expect(card.position).toBe(props.position);
      expect(card.isArchived).toBe(props.isArchived);
      expect(card.listId).toBe(props.listId);
      expect(card.creatorId).toBe(props.creatorId);
      expect(card.description).toBeUndefined();
      expect(card.dueDate).toBeUndefined();
      expect(card.assigneeId).toBeUndefined();
    });
  });

  describe("fromPersistence", () => {
    test("should create card from persistence data", () => {
      const props = {
        id: "existing-card-id",
        title: "Existing Card",
        description: "Existing description",
        position: 2000,
        dueDate: new Date("2024-06-15"),
        startDate: new Date("2024-06-01"),
        coverUrl: "https://example.com/existing-cover.jpg",
        isArchived: true,
        listId: "existing-list",
        creatorId: "existing-creator",
        assigneeId: "existing-assignee",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const card = Card.fromPersistence(props);

      expect(card.id).toBe(props.id);
      expect(card.title).toBe(props.title);
      expect(card.description).toBe(props.description);
      expect(card.position).toBe(props.position);
      expect(card.dueDate).toBe(props.dueDate);
      expect(card.startDate).toBe(props.startDate);
      expect(card.coverUrl).toBe(props.coverUrl);
      expect(card.isArchived).toBe(props.isArchived);
      expect(card.listId).toBe(props.listId);
      expect(card.creatorId).toBe(props.creatorId);
      expect(card.assigneeId).toBe(props.assigneeId);
      expect(card.createdAt).toBe(props.createdAt);
      expect(card.updatedAt).toBe(props.updatedAt);
    });
  });

  describe("update methods", () => {
    test("should update card title", () => {
      const card = Card.create({
        title: "Original Title",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newTitle = "Updated Title";
      card.updateTitle(newTitle);

      expect(card.title).toBe(newTitle);
    });

    test("should update card description", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newDescription = "Updated description";
      card.updateDescription(newDescription);

      expect(card.description).toBe(newDescription);
    });

    test("should update card position", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newPosition = 2000;
      card.updatePosition(newPosition);

      expect(card.position).toBe(newPosition);
    });

    test("should move card to different list", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const newListId = "list-456";
      const newPosition = 500;
      card.moveToList(newListId, newPosition);

      expect(card.listId).toBe(newListId);
      expect(card.position).toBe(newPosition);
    });

    test("should assign and unassign card", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const assigneeId = "user-456";
      card.assignTo(assigneeId);
      expect(card.assigneeId).toBe(assigneeId);

      card.unassign();
      expect(card.assigneeId).toBeUndefined();
    });

    test("should set and clear due date", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const dueDate = new Date("2024-12-31");
      card.setDueDate(dueDate);
      expect(card.dueDate).toBe(dueDate);

      card.clearDueDate();
      expect(card.dueDate).toBeUndefined();
    });

    test("should archive and unarchive card", () => {
      const card = Card.create({
        title: "Test Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      card.archive();
      expect(card.isArchived).toBe(true);

      card.unarchive();
      expect(card.isArchived).toBe(false);
    });
  });

  describe("validation", () => {
    test("should check if card is overdue", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const overdueCard = Card.create({
        title: "Overdue Card",
        position: 1000,
        dueDate: pastDate,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const notOverdueCard = Card.create({
        title: "Not Overdue Card",
        position: 1000,
        dueDate: futureDate,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      const noDueDateCard = Card.create({
        title: "No Due Date Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(overdueCard.isOverdue()).toBe(true);
      expect(notOverdueCard.isOverdue()).toBe(false);
      expect(noDueDateCard.isOverdue()).toBe(false);
    });

    test("should check if card has assignee", () => {
      const assignedCard = Card.create({
        title: "Assigned Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
        assigneeId: "user-456",
      });

      const unassignedCard = Card.create({
        title: "Unassigned Card",
        position: 1000,
        isArchived: false,
        listId: "list-123",
        creatorId: "user-123",
      });

      expect(assignedCard.hasAssignee()).toBe(true);
      expect(unassignedCard.hasAssignee()).toBe(false);
    });
  });
});