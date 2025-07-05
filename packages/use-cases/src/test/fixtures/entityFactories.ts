import { User } from "@kanban/domain-core";
import { Board } from "@kanban/domain-core";
import { List } from "@kanban/domain-core";
import { Card } from "@kanban/domain-core";
import { Label } from "@kanban/domain-core";
import { Activity, ActivityType, EntityType } from "@kanban/domain-core";
import { BoardMember } from "@kanban/domain-core";
import { DEFAULT_PROPS } from "../utils/testHelpers";

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
    this.props = { ...this.props, action };
    return this;
  }

  withEntityType(entityType: EntityType): ActivityBuilder {
    this.props = { ...this.props, entityType };
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

  build(): Activity {
    return Activity.create(this.props);
  }
}

// BoardMember factory function (interface, not class)
export function createBoardMember(overrides: Partial<BoardMember> = {}): BoardMember {
  return {
    userId: DEFAULT_PROPS.BOARD_MEMBER.userId,
    role: DEFAULT_PROPS.BOARD_MEMBER.role,
    joinedAt: new Date(DEFAULT_PROPS.BOARD_MEMBER.joinedAt), // Create new Date instance
    ...overrides,
  };
}