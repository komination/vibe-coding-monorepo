export interface ListProps {
  id: string;
  title: string;
  position: number;
  color?: string;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class List {
  private constructor(private props: ListProps) {}

  static create(props: Omit<ListProps, 'id' | 'createdAt' | 'updatedAt'>): List {
    const now = new Date();
    return new List({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ListProps): List {
    return new List(props);
  }

  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get position(): number {
    return this.props.position;
  }

  get color(): string | undefined {
    return this.props.color;
  }

  get boardId(): string {
    return this.props.boardId;
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

  updateColor(color?: string): void {
    this.props.color = color;
    this.props.updatedAt = new Date();
  }

  updatePosition(position: number): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  belongsToBoard(boardId: string): boolean {
    return this.props.boardId === boardId;
  }

  toJSON(): ListProps {
    return { ...this.props };
  }
}