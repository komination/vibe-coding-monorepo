import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Activity, ActivityType, EntityType } from "@/domain/entities/Activity";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";

describe("Activity Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("Activity creation", () => {
    test("should create an activity with required properties", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "New Task",
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.id).toMatch(UUID_REGEX);
      expect(activity.action).toBe("CREATE");
      expect(activity.entityType).toBe("CARD");
      expect(activity.entityId).toBe("card-123");
      expect(activity.entityTitle).toBe("New Task");
      expect(activity.userId).toBe("user-456");
      expect(activity.boardId).toBe("board-789");
      expect(activity.cardId).toBeUndefined();
      expect(activity.data).toBeUndefined();
      expect(activity.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("should create an activity with optional cardId", () => {
      const activity = Activity.create({
        action: "COMMENT",
        entityType: "COMMENT",
        entityId: "comment-123",
        entityTitle: "User commented",
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-999",
      });

      expect(activity.cardId).toBe("card-999");
    });

    test("should create an activity with optional data", () => {
      const activityData = {
        oldValue: "To Do",
        newValue: "In Progress",
        field: "status",
      };

      const activity = Activity.create({
        action: "UPDATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Task Updated",
        userId: "user-456",
        boardId: "board-789",
        data: activityData,
      });

      expect(activity.data).toEqual(activityData);
    });

    test("should generate unique UUIDs for different activities", () => {
      const activity1 = Activity.create({
        action: "CREATE",
        entityType: "BOARD",
        entityId: "board-123",
        entityTitle: "Board 1",
        userId: "user-456",
        boardId: "board-123",
      });

      const activity2 = Activity.create({
        action: "CREATE",
        entityType: "BOARD",
        entityId: "board-456",
        entityTitle: "Board 2",
        userId: "user-456",
        boardId: "board-456",
      });

      expect(activity1.id).not.toBe(activity2.id);
      expect(activity1.id).toMatch(UUID_REGEX);
      expect(activity2.id).toMatch(UUID_REGEX);
    });
  });

  describe("Activity persistence", () => {
    test("should restore activity from persistence data", () => {
      const persistenceData = {
        id: "activity-existing-123",
        action: "UPDATE" as ActivityType,
        entityType: "CARD" as EntityType,
        entityId: "card-456",
        entityTitle: "Updated Card",
        data: { field: "title", oldValue: "Old", newValue: "New" },
        userId: "user-789",
        boardId: "board-111",
        cardId: "card-456",
        createdAt: new Date("2024-01-15T10:00:00Z"),
      };

      const activity = Activity.fromPersistence(persistenceData);

      expect(activity.id).toBe("activity-existing-123");
      expect(activity.action).toBe("UPDATE");
      expect(activity.entityType).toBe("CARD");
      expect(activity.entityId).toBe("card-456");
      expect(activity.entityTitle).toBe("Updated Card");
      expect(activity.data).toEqual({ field: "title", oldValue: "Old", newValue: "New" });
      expect(activity.userId).toBe("user-789");
      expect(activity.boardId).toBe("board-111");
      expect(activity.cardId).toBe("card-456");
      expect(activity.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    test("should maintain all properties when restoring from persistence", () => {
      const originalActivity = Activity.create({
        action: "MOVE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Moved Card",
        data: { fromList: "list-1", toList: "list-2" },
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-123",
      });

      const persistedData = originalActivity.toJSON();
      const restoredActivity = Activity.fromPersistence(persistedData);

      expect(restoredActivity.id).toBe(originalActivity.id);
      expect(restoredActivity.action).toBe(originalActivity.action);
      expect(restoredActivity.entityType).toBe(originalActivity.entityType);
      expect(restoredActivity.entityId).toBe(originalActivity.entityId);
      expect(restoredActivity.entityTitle).toBe(originalActivity.entityTitle);
      expect(restoredActivity.data).toEqual(originalActivity.data);
      expect(restoredActivity.userId).toBe(originalActivity.userId);
      expect(restoredActivity.boardId).toBe(originalActivity.boardId);
      expect(restoredActivity.cardId).toBe(originalActivity.cardId);
      expect(restoredActivity.createdAt).toEqual(originalActivity.createdAt);
    });
  });

  describe("Activity type variations", () => {
    const activityTypes: ActivityType[] = [
      "CREATE", "UPDATE", "DELETE", "MOVE", "ARCHIVE", "UNARCHIVE",
      "ASSIGN", "UNASSIGN", "COMMENT", "ATTACH", "DETACH",
      "ADD_MEMBER", "REMOVE_MEMBER", "ADD_LABEL", "REMOVE_LABEL"
    ];

    test.each(activityTypes)("should create activity with action type %s", (action) => {
      const activity = Activity.create({
        action,
        entityType: "CARD",
        entityId: "entity-123",
        entityTitle: `${action} action`,
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.action).toBe(action);
    });

    const entityTypes: EntityType[] = [
      "BOARD", "LIST", "CARD", "COMMENT", "ATTACHMENT", "CHECKLIST", "LABEL"
    ];

    test.each(entityTypes)("should create activity with entity type %s", (entityType) => {
      const activity = Activity.create({
        action: "CREATE",
        entityType,
        entityId: "entity-123",
        entityTitle: `${entityType} entity`,
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.entityType).toBe(entityType);
    });
  });

  describe("Activity board association", () => {
    test("should correctly identify board association", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "LIST",
        entityId: "list-123",
        entityTitle: "New List",
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.belongsToBoard("board-789")).toBe(true);
      expect(activity.belongsToBoard("board-999")).toBe(false);
      expect(activity.belongsToBoard("")).toBe(false);
    });

    test("should handle undefined boardId in belongsToBoard check", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "BOARD",
        entityId: "board-123",
        entityTitle: "New Board",
        userId: "user-456",
        boardId: "board-123",
      });

      expect(activity.belongsToBoard(undefined as any)).toBe(false);
    });
  });

  describe("Activity card association", () => {
    test("should correctly identify card association when cardId exists", () => {
      const activity = Activity.create({
        action: "COMMENT",
        entityType: "COMMENT",
        entityId: "comment-123",
        entityTitle: "New Comment",
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-999",
      });

      expect(activity.belongsToCard("card-999")).toBe(true);
      expect(activity.belongsToCard("card-888")).toBe(false);
    });

    test("should return false for card association when cardId is undefined", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "BOARD",
        entityId: "board-123",
        entityTitle: "New Board",
        userId: "user-456",
        boardId: "board-123",
      });

      expect(activity.belongsToCard("card-999")).toBe(false);
    });

    test("should handle undefined cardId in belongsToCard check", () => {
      const activity = Activity.create({
        action: "COMMENT",
        entityType: "COMMENT",
        entityId: "comment-123",
        entityTitle: "Comment",
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-999",
      });

      expect(activity.belongsToCard(undefined as any)).toBe(false);
    });
  });

  describe("Activity user association", () => {
    test("should correctly identify user who performed the activity", () => {
      const activity = Activity.create({
        action: "UPDATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Updated Card",
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.isPerformedBy("user-456")).toBe(true);
      expect(activity.isPerformedBy("user-999")).toBe(false);
      expect(activity.isPerformedBy("")).toBe(false);
    });

    test("should handle undefined userId in isPerformedBy check", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "New Card",
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.isPerformedBy(undefined as any)).toBe(false);
    });
  });

  describe("Activity serialization", () => {
    test("should serialize to JSON with all properties", () => {
      const activity = Activity.create({
        action: "MOVE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Task Card",
        data: { fromList: "list-1", toList: "list-2", position: 1000 },
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-123",
      });

      const json = activity.toJSON();

      expect(json).toEqual({
        id: activity.id,
        action: "MOVE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Task Card",
        data: { fromList: "list-1", toList: "list-2", position: 1000 },
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-123",
        createdAt: DEFAULT_TEST_DATE,
      });
    });

    test("should create a copy of properties in toJSON", () => {
      const activity = Activity.create({
        action: "CREATE",
        entityType: "BOARD",
        entityId: "board-123",
        entityTitle: "New Board",
        data: { color: "#0079BF" },
        userId: "user-456",
        boardId: "board-123",
      });

      const json1 = activity.toJSON();
      const json2 = activity.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2); // Different object references
      // Note: The data object might be the same reference since toJSON() 
      // typically does a shallow copy, which is acceptable behavior
    });

    test("should maintain data integrity through serialization and deserialization", () => {
      const originalActivity = Activity.create({
        action: "ADD_LABEL",
        entityType: "LABEL",
        entityId: "label-123",
        entityTitle: "Bug Label Added",
        data: { labelName: "Bug", labelColor: "#ff0000", cardTitle: "Fix Login Issue" },
        userId: "user-456",
        boardId: "board-789",
        cardId: "card-999",
      });

      const serialized = JSON.stringify(originalActivity.toJSON());
      const parsed = JSON.parse(serialized);
      // Convert date string back to Date object as would happen in real deserialization
      parsed.createdAt = new Date(parsed.createdAt);
      const restoredActivity = Activity.fromPersistence(parsed);

      expect(restoredActivity.id).toBe(originalActivity.id);
      expect(restoredActivity.action).toBe(originalActivity.action);
      expect(restoredActivity.entityType).toBe(originalActivity.entityType);
      expect(restoredActivity.entityId).toBe(originalActivity.entityId);
      expect(restoredActivity.entityTitle).toBe(originalActivity.entityTitle);
      expect(restoredActivity.data).toEqual(originalActivity.data);
      expect(restoredActivity.userId).toBe(originalActivity.userId);
      expect(restoredActivity.boardId).toBe(originalActivity.boardId);
      expect(restoredActivity.cardId).toBe(originalActivity.cardId);
      expect(restoredActivity.createdAt).toEqual(originalActivity.createdAt);
    });
  });

  describe("Activity edge cases", () => {
    test("should handle empty entity title", () => {
      const activity = Activity.create({
        action: "DELETE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "",
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.entityTitle).toBe("");
    });

    test("should handle very long entity title", () => {
      const longTitle = "a".repeat(1000);
      const activity = Activity.create({
        action: "CREATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: longTitle,
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.entityTitle).toBe(longTitle);
      expect(activity.entityTitle.length).toBe(1000);
    });

    test("should handle complex data objects", () => {
      const complexData = {
        changes: [
          { field: "title", oldValue: "Old Title", newValue: "New Title" },
          { field: "description", oldValue: null, newValue: "Added description" },
          { field: "dueDate", oldValue: "2024-01-01", newValue: "2024-02-01" },
        ],
        metadata: {
          userAgent: "Mozilla/5.0",
          timestamp: 1234567890,
          nested: { deep: { value: true } },
        },
        arrays: [1, 2, 3, ["nested", "array"]],
      };

      const activity = Activity.create({
        action: "UPDATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: "Complex Update",
        data: complexData,
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.data).toEqual(complexData);
    });

    test("should handle special characters in entity title", () => {
      const specialTitle = "Activity 🎯 <script>alert('xss')</script> & \"quotes\"";
      const activity = Activity.create({
        action: "CREATE",
        entityType: "CARD",
        entityId: "card-123",
        entityTitle: specialTitle,
        userId: "user-456",
        boardId: "board-789",
      });

      expect(activity.entityTitle).toBe(specialTitle);
    });

    test("should handle undefined data gracefully", () => {
      const activity = Activity.create({
        action: "DELETE",
        entityType: "ATTACHMENT",
        entityId: "attachment-123",
        entityTitle: "file.pdf",
        userId: "user-456",
        boardId: "board-789",
        data: undefined,
      });

      expect(activity.data).toBeUndefined();
      const json = activity.toJSON();
      expect(json.data).toBeUndefined();
    });
  });
});