export type ActivityType = 'CREATE' | 'UPDATE' | 'DELETE' | 'MOVE' | 'ARCHIVE' | 'UNARCHIVE' | 'ASSIGN' | 'UNASSIGN' | 'COMMENT' | 'ATTACH' | 'DETACH' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'ADD_LABEL' | 'REMOVE_LABEL';
export type EntityType = 'BOARD' | 'LIST' | 'CARD' | 'COMMENT' | 'ATTACHMENT' | 'CHECKLIST' | 'LABEL';

export interface ActivityProps {
  id: string;
  action: ActivityType;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  data?: Record<string, any>;
  userId: string;
  boardId: string;
  cardId?: string;
  createdAt: Date;
}

export class Activity {
  private constructor(private props: ActivityProps) {}

  static create(props: Omit<ActivityProps, 'id' | 'createdAt'>): Activity {
    return new Activity({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: ActivityProps): Activity {
    return new Activity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get action(): ActivityType {
    return this.props.action;
  }

  get entityType(): EntityType {
    return this.props.entityType;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get entityTitle(): string {
    return this.props.entityTitle;
  }

  get data(): Record<string, any> | undefined {
    return this.props.data;
  }

  get userId(): string {
    return this.props.userId;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get cardId(): string | undefined {
    return this.props.cardId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  belongsToBoard(boardId: string): boolean {
    return this.props.boardId === boardId;
  }

  belongsToCard(cardId: string): boolean {
    return this.props.cardId === cardId;
  }

  isPerformedBy(userId: string): boolean {
    return this.props.userId === userId;
  }

  toJSON(): ActivityProps {
    return { ...this.props };
  }
}