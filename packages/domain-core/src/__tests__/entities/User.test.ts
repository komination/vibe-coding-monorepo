import { describe, test, expect } from "bun:test";
import { User } from "../../entities/User";

describe("User Entity", () => {
  describe("create", () => {
    test("should create a new user with valid properties", () => {
      const props = {
        email: "test@example.com",
        username: "testuser",
        cognitoSub: "cognito-123",
        name: "Test User",
        isActive: true,
      };

      const user = User.create(props);

      expect(user.email).toBe(props.email);
      expect(user.username).toBe(props.username);
      expect(user.cognitoSub).toBe(props.cognitoSub);
      expect(user.name).toBe(props.name);
      expect(user.isActive).toBe(props.isActive);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test("should create user without optional fields", () => {
      const props = {
        email: "test@example.com",
        username: "testuser",
        cognitoSub: "cognito-123",
        isActive: true,
      };

      const user = User.create(props);

      expect(user.email).toBe(props.email);
      expect(user.username).toBe(props.username);
      expect(user.cognitoSub).toBe(props.cognitoSub);
      expect(user.name).toBeUndefined();
      expect(user.avatarUrl).toBeUndefined();
      expect(user.isActive).toBe(props.isActive);
    });
  });

  describe("createCognitoUser", () => {
    test("should create a Cognito user with default active status", () => {
      const props = {
        email: "cognito@example.com",
        username: "cognitouser",
        cognitoSub: "cognito-456",
        name: "Cognito User",
      };

      const user = User.createCognitoUser(props);

      expect(user.email).toBe(props.email);
      expect(user.username).toBe(props.username);
      expect(user.cognitoSub).toBe(props.cognitoSub);
      expect(user.name).toBe(props.name);
      expect(user.isActive).toBe(true);
    });

    test("should create Cognito user with minimal properties", () => {
      const props = {
        email: "minimal@example.com",
        username: "minimaluser",
        cognitoSub: "cognito-minimal",
      };

      const user = User.createCognitoUser(props);

      expect(user.email).toBe(props.email);
      expect(user.username).toBe(props.username);
      expect(user.cognitoSub).toBe(props.cognitoSub);
      expect(user.isActive).toBe(true);
    });
  });

  describe("fromPersistence", () => {
    test("should create user from persistence data", () => {
      const props = {
        id: "existing-id",
        email: "existing@example.com",
        username: "existinguser",
        cognitoSub: "existing-cognito",
        name: "Existing User",
        isActive: false,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-02"),
      };

      const user = User.fromPersistence(props);

      expect(user.id).toBe(props.id);
      expect(user.email).toBe(props.email);
      expect(user.username).toBe(props.username);
      expect(user.cognitoSub).toBe(props.cognitoSub);
      expect(user.name).toBe(props.name);
      expect(user.isActive).toBe(props.isActive);
      expect(user.createdAt).toBe(props.createdAt);
      expect(user.updatedAt).toBe(props.updatedAt);
    });
  });

  describe("update methods", () => {
    test("should update user profile", () => {
      const user = User.create({
        email: "test@example.com",
        username: "testuser",
        cognitoSub: "cognito-123",
        isActive: true,
      });

      const newName = "Updated Name";
      const newAvatarUrl = "https://example.com/avatar.jpg";

      user.updateProfile(newName, newAvatarUrl);

      expect(user.name).toBe(newName);
      expect(user.avatarUrl).toBe(newAvatarUrl);
    });

    test("should deactivate user", () => {
      const user = User.create({
        email: "test@example.com",
        username: "testuser",
        cognitoSub: "cognito-123",
        isActive: true,
      });

      user.deactivate();

      expect(user.isActive).toBe(false);
    });

    test("should activate user", () => {
      const user = User.create({
        email: "test@example.com",
        username: "testuser",
        cognitoSub: "cognito-123",
        isActive: false,
      });

      user.activate();

      expect(user.isActive).toBe(true);
    });
  });
});