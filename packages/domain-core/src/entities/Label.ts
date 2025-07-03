export interface LabelProps {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: Date;
}

export class Label {
  private constructor(private props: LabelProps) {}

  static create(props: Omit<LabelProps, 'id' | 'createdAt'>): Label {
    return new Label({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  static fromPersistence(props: LabelProps): Label {
    return new Label(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get boardId(): string {
    return this.props.boardId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  update(name: string, color: string): void {
    this.props.name = name;
    this.props.color = color;
  }

  belongsToBoard(boardId: string): boolean {
    return this.props.boardId === boardId;
  }

  toJSON(): LabelProps {
    return { ...this.props };
  }
}