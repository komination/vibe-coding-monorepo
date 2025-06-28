import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Label } from "@/domain/entities/Label";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";

describe("Label Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("Label creation", () => {
    test("should create a label with required properties", () => {
      const label = Label.create({
        name: "Bug",
        color: "#ff0000",
        boardId: "board-123",
      });

      expect(label.id).toMatch(UUID_REGEX);
      expect(label.name).toBe("Bug");
      expect(label.color).toBe("#ff0000");
      expect(label.boardId).toBe("board-123");
      expect(label.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("should generate unique UUIDs for different labels", () => {
      const label1 = Label.create({
        name: "Feature",
        color: "#00ff00",
        boardId: "board-123",
      });
      const label2 = Label.create({
        name: "Enhancement",
        color: "#0000ff",
        boardId: "board-123",
      });

      expect(label1.id).not.toBe(label2.id);
      expect(label1.id).toMatch(UUID_REGEX);
      expect(label2.id).toMatch(UUID_REGEX);
    });

    test("should allow empty name (validation at application layer)", () => {
      const label = Label.create({
        name: "",
        color: "#ff0000",
        boardId: "board-123",
      });

      expect(label.name).toBe("");
    });

    test("should allow any color format (validation at application layer)", () => {
      const label = Label.create({
        name: "Test",
        color: "red",
        boardId: "board-123",
      });

      expect(label.color).toBe("red");
    });
  });

  describe("Label persistence", () => {
    test("should restore label from persistence data", () => {
      const persistenceData = {
        id: "label-existing-123",
        name: "Critical",
        color: "#ff0000",
        boardId: "board-456",
        createdAt: new Date("2024-01-15T10:00:00Z"),
      };

      const label = Label.fromPersistence(persistenceData);

      expect(label.id).toBe("label-existing-123");
      expect(label.name).toBe("Critical");
      expect(label.color).toBe("#ff0000");
      expect(label.boardId).toBe("board-456");
      expect(label.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"));
    });

    test("should maintain all properties when restoring from persistence", () => {
      const originalLabel = Label.create({
        name: "Documentation",
        color: "#9c27b0",
        boardId: "board-789",
      });

      const persistedData = originalLabel.toJSON();
      const restoredLabel = Label.fromPersistence(persistedData);

      expect(restoredLabel.id).toBe(originalLabel.id);
      expect(restoredLabel.name).toBe(originalLabel.name);
      expect(restoredLabel.color).toBe(originalLabel.color);
      expect(restoredLabel.boardId).toBe(originalLabel.boardId);
      expect(restoredLabel.createdAt).toEqual(originalLabel.createdAt);
    });
  });

  describe("Label update", () => {
    test("should update both name and color", () => {
      const label = Label.create({
        name: "Original",
        color: "#000000",
        boardId: "board-123",
      });

      label.update("Updated", "#ffffff");

      expect(label.name).toBe("Updated");
      expect(label.color).toBe("#ffffff");
      expect(label.boardId).toBe("board-123"); // Should not change
      expect(label.id).toMatch(UUID_REGEX); // Should not change
    });

    test("should allow updating to empty name", () => {
      const label = Label.create({
        name: "Non-empty",
        color: "#123456",
        boardId: "board-123",
      });

      label.update("", "#654321");

      expect(label.name).toBe("");
      expect(label.color).toBe("#654321");
    });

    test("should allow updating only name", () => {
      const label = Label.create({
        name: "Bug",
        color: "#ff0000",
        boardId: "board-123",
      });

      label.update("Critical Bug", "#ff0000");

      expect(label.name).toBe("Critical Bug");
      expect(label.color).toBe("#ff0000");
    });

    test("should allow updating only color", () => {
      const label = Label.create({
        name: "Feature",
        color: "#00ff00",
        boardId: "board-123",
      });

      label.update("Feature", "#00ff88");

      expect(label.name).toBe("Feature");
      expect(label.color).toBe("#00ff88");
    });
  });

  describe("Label board association", () => {
    test("should correctly identify board association", () => {
      const label = Label.create({
        name: "Test",
        color: "#000000",
        boardId: "board-123",
      });

      expect(label.belongsToBoard("board-123")).toBe(true);
      expect(label.belongsToBoard("board-456")).toBe(false);
      expect(label.belongsToBoard("")).toBe(false);
    });

    test("should handle undefined boardId in belongsToBoard check", () => {
      const label = Label.create({
        name: "Test",
        color: "#000000",
        boardId: "board-123",
      });

      expect(label.belongsToBoard(undefined as any)).toBe(false);
    });
  });

  describe("Label serialization", () => {
    test("should serialize to JSON with all properties", () => {
      const label = Label.create({
        name: "High Priority",
        color: "#ff5722",
        boardId: "board-999",
      });

      const json = label.toJSON();

      expect(json).toEqual({
        id: label.id,
        name: "High Priority",
        color: "#ff5722",
        boardId: "board-999",
        createdAt: DEFAULT_TEST_DATE,
      });
    });

    test("should create a copy of properties in toJSON", () => {
      const label = Label.create({
        name: "Test",
        color: "#000000",
        boardId: "board-123",
      });

      const json1 = label.toJSON();
      const json2 = label.toJSON();

      expect(json1).toEqual(json2);
      expect(json1).not.toBe(json2); // Different object references
    });

    test("should maintain data integrity through serialization and deserialization", () => {
      const originalLabel = Label.create({
        name: "Serialization Test",
        color: "#3f51b5",
        boardId: "board-serial-123",
      });

      const serialized = JSON.stringify(originalLabel.toJSON());
      const parsed = JSON.parse(serialized);
      // Convert date string back to Date object as would happen in real deserialization
      parsed.createdAt = new Date(parsed.createdAt);
      const restoredLabel = Label.fromPersistence(parsed);

      expect(restoredLabel.id).toBe(originalLabel.id);
      expect(restoredLabel.name).toBe(originalLabel.name);
      expect(restoredLabel.color).toBe(originalLabel.color);
      expect(restoredLabel.boardId).toBe(originalLabel.boardId);
      expect(restoredLabel.createdAt).toEqual(originalLabel.createdAt);
    });
  });

  describe("Label edge cases", () => {
    test("should handle very long names", () => {
      const longName = "a".repeat(1000);
      const label = Label.create({
        name: longName,
        color: "#000000",
        boardId: "board-123",
      });

      expect(label.name).toBe(longName);
      expect(label.name.length).toBe(1000);
    });

    test("should handle special characters in name", () => {
      const specialName = "Bug 🐛 <script>alert('xss')</script> & \"quotes\"";
      const label = Label.create({
        name: specialName,
        color: "#ff0000",
        boardId: "board-123",
      });

      expect(label.name).toBe(specialName);
    });

    test("should handle various color formats", () => {
      const colorFormats = [
        "#fff",
        "#ffffff",
        "rgb(255, 255, 255)",
        "rgba(255, 255, 255, 0.5)",
        "white",
        "transparent",
        "",
      ];

      colorFormats.forEach(color => {
        const label = Label.create({
          name: "Test",
          color,
          boardId: "board-123",
        });
        expect(label.color).toBe(color);
      });
    });
  });
});