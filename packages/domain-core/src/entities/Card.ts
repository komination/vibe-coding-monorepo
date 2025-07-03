export interface CardProps {
  id: string;
  title: string;
  description?: string;
  position: number;
  dueDate?: Date;
  startDate?: Date;
  isArchived: boolean;
  coverUrl?: string;
  listId: string;
  creatorId: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Card {
  private constructor(private props: CardProps) {}

  static create(props: Omit<CardProps, 'id' | 'createdAt' | 'updatedAt'>): Card {
    const now = new Date();
    return new Card({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: CardProps): Card {
    return new Card(props);
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

  get position(): number {
    return this.props.position;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get startDate(): Date | undefined {
    return this.props.startDate;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get coverUrl(): string | undefined {
    return this.props.coverUrl;
  }

  get listId(): string {
    return this.props.listId;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get assigneeId(): string | undefined {
    return this.props.assigneeId;
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

  updatePosition(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  updateDueDate(dueDate?: Date): void {
    this.props.dueDate = dueDate;
    this.props.updatedAt = new Date();
  }

  updateStartDate(startDate?: Date): void {
    this.props.startDate = startDate;
    this.props.updatedAt = new Date();
  }

  updateCover(coverUrl?: string): void {
    this.props.coverUrl = coverUrl;
    this.props.updatedAt = new Date();
  }

  moveToList(listId: string, position: number): void {
    this.props.listId = listId;
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  assignTo(assigneeId?: string): void {
    this.props.assigneeId = assigneeId;
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

  belongsToList(listId: string): boolean {
    return this.props.listId === listId;
  }

  isCreatedBy(userId: string): boolean {
    return this.props.creatorId === userId;
  }

  isAssignedTo(userId: string): boolean {
    return this.props.assigneeId === userId;
  }

  isOverdue(): boolean {
    if (!this.props.dueDate) return false;
    return new Date() > this.props.dueDate;
  }

  toJSON(): CardProps {
    return { ...this.props };
  }
}