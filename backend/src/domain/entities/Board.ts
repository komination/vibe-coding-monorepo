export type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface BoardProps {
  id: string;
  title: string;
  description?: string;
  backgroundUrl?: string;
  isPublic: boolean;
  isArchived: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Board {
  private constructor(private props: BoardProps) {}

  static create(props: Omit<BoardProps, 'id' | 'createdAt' | 'updatedAt'>): Board {
    const now = new Date();
    return new Board({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: BoardProps): Board {
    return new Board(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get backgroundUrl(): string | undefined {
    return this.props.backgroundUrl;
  }

  get isPublic(): boolean {
    return this.props.isPublic;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTitle(title: string): void {
    this.props.title = title;
    this.props.updatedAt = new Date();
  }

  updateDescription(description?: string): void {
    this.props.description = description;
    this.props.updatedAt = new Date();
  }

  updateBackground(backgroundUrl?: string): void {
    this.props.backgroundUrl = backgroundUrl;
    this.props.updatedAt = new Date();
  }

  makePublic(): void {
    this.props.isPublic = true;
    this.props.updatedAt = new Date();
  }

  makePrivate(): void {
    this.props.isPublic = false;
    this.props.updatedAt = new Date();
  }

  archive(): void {
    this.props.isArchived = true;
    this.props.updatedAt = new Date();
  }

  unarchive(): void {
    this.props.isArchived = false;
    this.props.updatedAt = new Date();
  }

  isOwner(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  isOwnedBy(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  canBeEditedBy(userId: string, role: BoardRole): boolean {
    if (this.isOwner(userId)) return true;
    return role === 'ADMIN';
  }

  canBeViewedBy(userId: string, role?: BoardRole): boolean {
    if (this.props.isPublic) return true;
    if (this.isOwner(userId)) return true;
    return role !== undefined;
  }

  toJSON(): BoardProps {
    return { ...this.props };
  }
}