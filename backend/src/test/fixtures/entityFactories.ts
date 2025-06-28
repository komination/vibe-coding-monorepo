import { User } from "@/domain/entities/User";
import { Board } from "@/domain/entities/Board";
import { List } from "@/domain/entities/List";
import { Card } from "@/domain/entities/Card";
import { Label } from "@/domain/entities/Label";
import { Activity, ActivityType, EntityType } from "@/domain/entities/Activity";
import { DEFAULT_PROPS } from "@/test/utils/testHelpers";

let idCounter = 1;

export class UserBuilder {
  private props = { ...DEFAULT_PROPS.USER };

  static valid(): UserBuilder {
    return new UserBuilder();
  }

  withEmail(email: string): UserBuilder {
    this.props.email = email;
    return this;
  }

  withUsername(username: string): UserBuilder {
    this.props.username = username;
    return this;
  }

  withCognitoSub(cognitoSub: string): UserBuilder {
    this.props.cognitoSub = cognitoSub;
    return this;
  }

  withName(name: string): UserBuilder {
    (this.props as any).name = name;
    return this;
  }

  withAvatarUrl(avatarUrl: string): UserBuilder {
    (this.props as any).avatarUrl = avatarUrl;
    return this;
  }

  active(): UserBuilder {
    this.props.isActive = true;
    return this;
  }

  inactive(): UserBuilder {
    this.props.isActive = false;
    return this;
  }

  build(): User {
    return User.create(this.props);
  }

  buildCognito(): User {
    return User.createCognitoUser(this.props);
  }
}

export class BoardBuilder {
  private props = { ...DEFAULT_PROPS.BOARD };

  static valid(): BoardBuilder {
    return new BoardBuilder();
  }

  withTitle(title: string): BoardBuilder {
    this.props.title = title;
    return this;
  }

  withDescription(description: string): BoardBuilder {
    (this.props as any).description = description;
    return this;
  }

  withBackgroundUrl(backgroundUrl: string): BoardBuilder {
    (this.props as any).backgroundUrl = backgroundUrl;
    return this;
  }

  withOwner(ownerId: string): BoardBuilder {
    this.props.ownerId = ownerId;
    return this;
  }

  public(): BoardBuilder {
    this.props.isPublic = true;
    return this;
  }

  private(): BoardBuilder {
    this.props.isPublic = false;
    return this;
  }

  archived(): BoardBuilder {
    this.props.isArchived = true;
    return this;
  }

  active(): BoardBuilder {
    this.props.isArchived = false;
    return this;
  }

  build(): Board {
    return Board.create(this.props);
  }
}

export class ListBuilder {
  private props = { ...DEFAULT_PROPS.LIST };

  static valid(): ListBuilder {
    return new ListBuilder();
  }

  withTitle(title: string): ListBuilder {
    this.props.title = title;
    return this;
  }

  withPosition(position: number): ListBuilder {
    this.props.position = position;
    return this;
  }

  withColor(color: string): ListBuilder {
    (this.props as any).color = color;
    return this;
  }

  inBoard(boardId: string): ListBuilder {
    this.props.boardId = boardId;
    return this;
  }

  build(): List {
    return List.create(this.props);
  }
}

export class CardBuilder {
  private props = { ...DEFAULT_PROPS.CARD };

  static valid(): CardBuilder {
    return new CardBuilder();
  }

  withTitle(title: string): CardBuilder {
    this.props.title = title;
    return this;
  }

  withDescription(description: string): CardBuilder {
    (this.props as any).description = description;
    return this;
  }

  withPosition(position: number): CardBuilder {
    this.props.position = position;
    return this;
  }

  withDueDate(dueDate: Date): CardBuilder {
    (this.props as any).dueDate = dueDate;
    return this;
  }

  withStartDate(startDate: Date): CardBuilder {
    (this.props as any).startDate = startDate;
    return this;
  }

  withCoverUrl(coverUrl: string): CardBuilder {
    (this.props as any).coverUrl = coverUrl;
    return this;
  }

  inList(listId: string): CardBuilder {
    this.props.listId = listId;
    return this;
  }

  createdBy(creatorId: string): CardBuilder {
    this.props.creatorId = creatorId;
    return this;
  }

  assignedTo(assigneeId: string): CardBuilder {
    (this.props as any).assigneeId = assigneeId;
    return this;
  }

  archived(): CardBuilder {
    this.props.isArchived = true;
    return this;
  }

  active(): CardBuilder {
    this.props.isArchived = false;
    return this;
  }

  build(): Card {
    return Card.create(this.props);
  }
}

export class LabelBuilder {
  private props = { ...DEFAULT_PROPS.LABEL };

  static valid(): LabelBuilder {
    return new LabelBuilder();
  }

  withName(name: string): LabelBuilder {
    this.props.name = name;
    return this;
  }

  withColor(color: string): LabelBuilder {
    this.props.color = color;
    return this;
  }

  inBoard(boardId: string): LabelBuilder {
    this.props.boardId = boardId;
    return this;
  }

  build(): Label {
    return Label.create(this.props);
  }
}

export class ActivityBuilder {
  private props = { ...DEFAULT_PROPS.ACTIVITY };

  static valid(): ActivityBuilder {
    return new ActivityBuilder();
  }

  withAction(action: ActivityType): ActivityBuilder {
    this.props.action = action;
    return this;
  }

  withEntityType(entityType: EntityType): ActivityBuilder {
    this.props.entityType = entityType;
    return this;
  }

  withEntityId(entityId: string): ActivityBuilder {
    this.props.entityId = entityId;
    return this;
  }

  withEntityTitle(entityTitle: string): ActivityBuilder {
    this.props.entityTitle = entityTitle;
    return this;
  }

  withData(data: Record<string, any>): ActivityBuilder {
    (this.props as any).data = data;
    return this;
  }

  withUserId(userId: string): ActivityBuilder {
    this.props.userId = userId;
    return this;
  }

  inBoard(boardId: string): ActivityBuilder {
    this.props.boardId = boardId;
    return this;
  }

  forCard(cardId: string): ActivityBuilder {
    (this.props as any).cardId = cardId;
    return this;
  }

  // Convenience methods for common activity types
  createCard(cardId: string, cardTitle: string): ActivityBuilder {
    return this.withAction("CREATE")
      .withEntityType("CARD")
      .withEntityId(cardId)
      .withEntityTitle(cardTitle)
      .forCard(cardId);
  }

  updateCard(cardId: string, cardTitle: string): ActivityBuilder {
    return this.withAction("UPDATE")
      .withEntityType("CARD")
      .withEntityId(cardId)
      .withEntityTitle(cardTitle)
      .forCard(cardId);
  }

  moveCard(cardId: string, cardTitle: string): ActivityBuilder {
    return this.withAction("MOVE")
      .withEntityType("CARD")
      .withEntityId(cardId)
      .withEntityTitle(cardTitle)
      .forCard(cardId);
  }

  createBoard(boardId: string, boardTitle: string): ActivityBuilder {
    return this.withAction("CREATE")
      .withEntityType("BOARD")
      .withEntityId(boardId)
      .withEntityTitle(boardTitle);
  }

  addMember(boardId: string, boardTitle: string): ActivityBuilder {
    return this.withAction("ADD_MEMBER")
      .withEntityType("BOARD")
      .withEntityId(boardId)
      .withEntityTitle(boardTitle);
  }

  build(): Activity {
    return Activity.create(this.props);
  }
}

// Legacy functions for backward compatibility (deprecated)
export function createMockUser(overrides: any = {}): any {
  const id = `user-${idCounter++}`;
  return {
    id,
    cognitoId: `cognito-${id}`,
    email: `${id}@example.com`,
    name: `Test User ${id}`,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockBoard(overrides: any = {}): any {
  const id = `board-${idCounter++}`;
  return {
    id,
    name: `Test Board ${id}`,
    description: `Description for ${id}`,
    color: "#0079BF",
    isArchived: false,
    ownerId: `user-${idCounter}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockList(overrides: any = {}): any {
  const id = `list-${idCounter++}`;
  return {
    id,
    name: `Test List ${id}`,
    position: idCounter * 1000,
    boardId: `board-${idCounter}`,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockCard(overrides: any = {}): any {
  const id = `card-${idCounter++}`;
  return {
    id,
    title: `Test Card ${id}`,
    description: `Description for ${id}`,
    position: idCounter * 1000,
    listId: `list-${idCounter}`,
    dueDate: null,
    isArchived: false,
    coverUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetIdCounter() {
  idCounter = 1;
}