import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { User } from "@/domain/entities/User";
import { mockDate, UUID_REGEX, DEFAULT_TEST_DATE } from "@/test/utils/testHelpers";
import { UserBuilder } from "@/test/fixtures/entityFactories";

describe("User Entity", () => {
  let restoreDate: () => void;

  beforeEach(() => {
    restoreDate = mockDate(DEFAULT_TEST_DATE);
  });

  afterEach(() => {
    restoreDate();
  });

  describe("User creation", () => {
    test("generates unique UUID when creating user", () => {
      const user = UserBuilder.valid().build();
      expect(user.id).toMatch(UUID_REGEX);
    });

    test("assigns provided email to new user", () => {
      const user = UserBuilder.valid().withEmail("custom@example.com").build();
      expect(user.email).toBe("custom@example.com");
    });

    test("assigns provided username to new user", () => {
      const user = UserBuilder.valid().withUsername("customuser").build();
      expect(user.username).toBe("customuser");
    });

    test("assigns provided cognito sub to new user", () => {
      const user = UserBuilder.valid().withCognitoSub("cognito-custom-123").build();
      expect(user.cognitoSub).toBe("cognito-custom-123");
    });

    test("assigns provided name when specified", () => {
      const user = UserBuilder.valid().withName("Custom Name").build();
      expect(user.name).toBe("Custom Name");
    });

    test("assigns provided avatar URL when specified", () => {
      const user = UserBuilder.valid().withAvatarUrl("https://example.com/custom.jpg").build();
      expect(user.avatarUrl).toBe("https://example.com/custom.jpg");
    });

    test("sets active status according to specification", () => {
      const activeUser = UserBuilder.valid().active().build();
      const inactiveUser = UserBuilder.valid().inactive().build();
      expect(activeUser.isActive).toBe(true);
      expect(inactiveUser.isActive).toBe(false);
    });

    test("sets current timestamp for creation date", () => {
      const user = UserBuilder.valid().build();
      expect(user.createdAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("sets current timestamp for updated date", () => {
      const user = UserBuilder.valid().build();
      expect(user.updatedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("creates user without optional properties when not provided", () => {
      const user = UserBuilder.valid().withEmail("minimal@example.com").build();
      expect(user.name).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
    });

    test("generates different UUIDs for multiple users", () => {
      const user1 = UserBuilder.valid().withEmail("user1@example.com").build();
      const user2 = UserBuilder.valid().withEmail("user2@example.com").build();
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe("Cognito user creation", () => {
    test("generates unique UUID for Cognito user", () => {
      const user = UserBuilder.valid().buildCognito();
      expect(user.id).toMatch(UUID_REGEX);
    });

    test("assigns provided properties to Cognito user", () => {
      const user = UserBuilder.valid()
        .withEmail("cognito@example.com")
        .withUsername("cognitouser")
        .withCognitoSub("cognito-sub-789")
        .withName("Cognito User")
        .withAvatarUrl("https://example.com/cognito-avatar.jpg")
        .buildCognito();

      expect(user.email).toBe("cognito@example.com");
      expect(user.username).toBe("cognitouser");
      expect(user.cognitoSub).toBe("cognito-sub-789");
      expect(user.name).toBe("Cognito User");
      expect(user.avatarUrl).toBe("https://example.com/cognito-avatar.jpg");
    });

    test("sets default active status for Cognito user", () => {
      const user = UserBuilder.valid().buildCognito();
      expect(user.isActive).toBe(true);
    });

    test("sets current timestamp for Cognito user creation", () => {
      const user = UserBuilder.valid().buildCognito();
      expect(user.createdAt).toEqual(DEFAULT_TEST_DATE);
      expect(user.updatedAt).toEqual(DEFAULT_TEST_DATE);
    });

    test("creates Cognito user without optional fields when not provided", () => {
      const user = UserBuilder.valid()
        .withEmail("basic@example.com")
        .withUsername("basicuser")
        .withCognitoSub("cognito-sub-basic")
        .buildCognito();

      expect(user.name).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
      expect(user.isActive).toBe(true);
    });
  });

  describe("User restoration from persistence", () => {
    const persistenceData = {
      id: "user-123",
      email: "persisted@example.com",
      username: "persisteduser",
      cognitoSub: "cognito-sub-persisted",
      name: "Persisted User",
      avatarUrl: "https://example.com/persisted.jpg",
      isActive: true,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-06-01"),
    };

    test("restores user ID from persistence data", () => {
      const user = User.fromPersistence(persistenceData);
      expect(user.id).toBe("user-123");
    });

    test("restores user properties from persistence data", () => {
      const user = User.fromPersistence(persistenceData);
      expect(user.email).toBe("persisted@example.com");
      expect(user.username).toBe("persisteduser");
      expect(user.cognitoSub).toBe("cognito-sub-persisted");
      expect(user.name).toBe("Persisted User");
      expect(user.avatarUrl).toBe("https://example.com/persisted.jpg");
      expect(user.isActive).toBe(true);
    });

    test("restores user timestamps from persistence data", () => {
      const user = User.fromPersistence(persistenceData);
      expect(user.createdAt).toEqual(new Date("2023-01-01"));
      expect(user.updatedAt).toEqual(new Date("2023-06-01"));
    });

    test("restores inactive user status from persistence data", () => {
      const inactiveData = {
        id: "user-inactive",
        email: "inactive@example.com",
        username: "inactiveuser",
        cognitoSub: "cognito-sub-inactive",
        isActive: false,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-06-01"),
      };

      const user = User.fromPersistence(inactiveData);
      expect(user.isActive).toBe(false);
    });
  });

  describe("User profile updates", () => {
    test("updates user profile with name and avatar", () => {
      const user = UserBuilder.valid().withName("Original Name").withAvatarUrl("https://example.com/old.jpg").build();

      const originalId = user.id;
      const originalCreatedAt = user.createdAt;

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      user.updateProfile("Updated Name", "https://example.com/new.jpg");

      expect(user.id).toBe(originalId); // ID should not change
      expect(user.name).toBe("Updated Name");
      expect(user.avatarUrl).toBe("https://example.com/new.jpg");
      expect(user.createdAt).toEqual(originalCreatedAt); // Created date should not change
      expect(user.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z")); // Updated date should change
    });

    test("should clear name and avatar when set to undefined", () => {
      const user = User.create({
        email: "clear@example.com",
        username: "clearuser",
        cognitoSub: "cognito-sub-clear",
        name: "Has Name",
        avatarUrl: "https://example.com/avatar.jpg",
        isActive: true,
      });

      user.updateProfile(undefined, undefined);

      expect(user.name).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
    });

    test("should update only name", () => {
      const user = User.create({
        email: "partial@example.com",
        username: "partialuser",
        cognitoSub: "cognito-sub-partial",
        name: "Old Name",
        avatarUrl: "https://example.com/keep.jpg",
        isActive: true,
      });

      user.updateProfile("New Name", "https://example.com/keep.jpg");

      expect(user.name).toBe("New Name");
      expect(user.avatarUrl).toBe("https://example.com/keep.jpg");
    });
  });

  describe("User activation status", () => {
    test("should deactivate an active user", () => {
      const user = User.create({
        email: "active@example.com",
        username: "activeuser",
        cognitoSub: "cognito-sub-active",
        isActive: true,
      });

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      user.deactivate();

      expect(user.isActive).toBe(false);
      expect(user.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should activate an inactive user", () => {
      const user = User.create({
        email: "inactive@example.com",
        username: "inactiveuser",
        cognitoSub: "cognito-sub-inactive",
        isActive: false,
      });

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      user.activate();

      expect(user.isActive).toBe(true);
      expect(user.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));
    });

    test("should handle multiple status changes", () => {
      const user = User.create({
        email: "toggle@example.com",
        username: "toggleuser",
        cognitoSub: "cognito-sub-toggle",
        isActive: true,
      });

      user.deactivate();
      expect(user.isActive).toBe(false);

      user.activate();
      expect(user.isActive).toBe(true);

      user.deactivate();
      expect(user.isActive).toBe(false);
    });
  });

  describe("User Cognito updates", () => {
    test("should update cognito sub and return new user instance", () => {
      const user = User.create({
        email: "cognito-update@example.com",
        username: "cognitoupdateuser",
        cognitoSub: "old-cognito-sub",
        name: "Test User",
        isActive: true,
      });

      const originalId = user.id;
      const originalEmail = user.email;
      const originalUsername = user.username;
      const originalName = user.name as string;

      // Move time forward
      restoreDate();
      restoreDate = mockDate(new Date("2024-01-02T00:00:00Z"));

      const updatedUser = user.updateCognito("new-cognito-sub");

      // New user instance should be created
      expect(updatedUser).not.toBe(user);

      // Updated user should have new cognito sub
      expect(updatedUser.cognitoSub).toBe("new-cognito-sub");
      expect(updatedUser.updatedAt).toEqual(new Date("2024-01-02T00:00:00Z"));

      // Other properties should remain the same
      expect(updatedUser.id).toBe(originalId);
      expect(updatedUser.email).toBe(originalEmail);
      expect(updatedUser.username).toBe(originalUsername);
      expect(updatedUser.name).toBe(originalName);

      // Original user should remain unchanged
      expect(user.cognitoSub).toBe("old-cognito-sub");
    });
  });

  describe("User serialization", () => {
    test("should serialize user to JSON", () => {
      const user = User.create({
        email: "json@example.com",
        username: "jsonuser",
        cognitoSub: "cognito-sub-json",
        name: "JSON User",
        avatarUrl: "https://example.com/json.jpg",
        isActive: true,
      });

      const json = user.toJSON();

      expect(json).toEqual({
        id: user.id,
        email: "json@example.com",
        username: "jsonuser",
        cognitoSub: "cognito-sub-json",
        name: "JSON User",
        avatarUrl: "https://example.com/json.jpg",
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });

    test("should serialize user with undefined optional fields", () => {
      const user = User.create({
        email: "minimal-json@example.com",
        username: "minimaljsonuser",
        cognitoSub: "cognito-sub-minimal",
        isActive: true,
      });

      const json = user.toJSON();

      expect(json).toEqual({
        id: user.id,
        email: "minimal-json@example.com",
        username: "minimaljsonuser",
        cognitoSub: "cognito-sub-minimal",
        name: undefined,
        avatarUrl: undefined,
        isActive: true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });
  });

  describe("User property access", () => {
    test("should expose all properties through getters", () => {
      const user = User.create({
        email: "getter@example.com",
        username: "getteruser",
        cognitoSub: "cognito-sub-getter",
        name: "Getter User",
        avatarUrl: "https://example.com/getter.jpg",
        isActive: true,
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe("getter@example.com");
      expect(user.username).toBe("getteruser");
      expect(user.cognitoSub).toBe("cognito-sub-getter");
      expect(user.name).toBe("Getter User");
      expect(user.avatarUrl).toBe("https://example.com/getter.jpg");
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("User business rules validation", () => {
    test("should allow empty email (validation at application layer)", () => {
      const user = User.create({
        email: "", // Empty email - validation handled at application layer
        username: "emptyemail",
        cognitoSub: "cognito-sub-empty",
        isActive: true,
      });
      expect(user.email).toBe("");
    });

    test("should allow invalid email format (validation at application layer)", () => {
      const user = User.create({
        email: "not-an-email", // Invalid format - validation handled at application layer
        username: "invalidemail",
        cognitoSub: "cognito-sub-invalid",
        isActive: true,
      });
      expect(user.email).toBe("not-an-email");
    });

    test("should allow duplicate usernames (uniqueness at database layer)", () => {
      const user1 = User.create({
        email: "user1@example.com",
        username: "sameusername", // Same username
        cognitoSub: "cognito-sub-1",
        isActive: true,
      });

      const user2 = User.create({
        email: "user2@example.com",
        username: "sameusername", // Same username - uniqueness handled at database layer
        cognitoSub: "cognito-sub-2",
        isActive: true,
      });

      expect(user1.username).toBe("sameusername");
      expect(user2.username).toBe("sameusername");
    });

    test("should allow long names (validation at application layer)", () => {
      const longName = "a".repeat(256);
      const user = User.create({
        email: "longname@example.com",
        username: "longnameuser",
        cognitoSub: "cognito-sub-long",
        name: longName, // Long name - validation handled at application layer
        isActive: true,
      });
      expect(user.name).toBe(longName);
    });

    test("should allow invalid avatar URLs (validation at application layer)", () => {
      const user = User.create({
        email: "invalidavatar@example.com",
        username: "invalidavataruser",
        cognitoSub: "cognito-sub-avatar",
        avatarUrl: "not-a-valid-url", // Invalid URL - validation handled at application layer
        isActive: true,
      });
      expect(user.avatarUrl).toBe("not-a-valid-url");
    });
  });
});