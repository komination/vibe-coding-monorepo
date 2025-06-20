import { PrismaClient } from '@prisma/client';
import { Card } from '@/domain/entities/Card';
import { CardRepository } from '@/domain/repositories/CardRepository';

export class PrismaCardRepository implements CardRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Card | null> {
    const cardData = await this.prisma.card.findUnique({
      where: { id },
    });

    if (!cardData) return null;

    return Card.fromPersistence({
      id: cardData.id,
      title: cardData.title,
      description: cardData.description || undefined,
      position: cardData.position,
      dueDate: cardData.dueDate || undefined,
      startDate: cardData.startDate || undefined,
      isArchived: cardData.isArchived,
      coverUrl: cardData.coverUrl || undefined,
      listId: cardData.listId,
      creatorId: cardData.creatorId,
      assigneeId: cardData.assigneeId || undefined,
      createdAt: cardData.createdAt,
      updatedAt: cardData.updatedAt,
    });
  }

  async findByList(listId: string, options?: {
    includeArchived?: boolean;
    orderBy?: 'position' | 'title' | 'dueDate' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<Card[]> {
    const where: any = { listId };
    
    if (!options?.includeArchived) {
      where.isArchived = false;
    }

    const orderBy = options?.orderBy || 'position';
    const order = options?.order || 'asc';

    const cardsData = await this.prisma.card.findMany({
      where,
      orderBy: { [orderBy]: order },
    });

    return this.mapToDomainCards(cardsData);
  }

  async findByBoard(boardId: string, options?: {
    includeArchived?: boolean;
    assigneeId?: string;
    dueDate?: {
      from?: Date;
      to?: Date;
    };
    limit?: number;
    offset?: number;
  }): Promise<Card[]> {
    const where: any = {
      list: { boardId }
    };
    
    if (!options?.includeArchived) {
      where.isArchived = false;
    }

    if (options?.assigneeId) {
      where.assigneeId = options.assigneeId;
    }

    if (options?.dueDate) {
      where.dueDate = {};
      if (options.dueDate.from) {
        where.dueDate.gte = options.dueDate.from;
      }
      if (options.dueDate.to) {
        where.dueDate.lte = options.dueDate.to;
      }
    }

    const cardsData = await this.prisma.card.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToDomainCards(cardsData);
  }

  async findByAssignee(assigneeId: string, options?: {
    includeArchived?: boolean;
    boardId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Card[]> {
    const where: any = { assigneeId };
    
    if (!options?.includeArchived) {
      where.isArchived = false;
    }

    if (options?.boardId) {
      where.list = { boardId: options.boardId };
    }

    const cardsData = await this.prisma.card.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { dueDate: 'asc' },
    });

    return this.mapToDomainCards(cardsData);
  }

  async findOverdueCards(options?: {
    boardId?: string;
    assigneeId?: string;
  }): Promise<Card[]> {
    const where: any = {
      dueDate: {
        lt: new Date(),
      },
      isArchived: false,
    };

    if (options?.assigneeId) {
      where.assigneeId = options.assigneeId;
    }

    if (options?.boardId) {
      where.list = { boardId: options.boardId };
    }

    const cardsData = await this.prisma.card.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    return this.mapToDomainCards(cardsData);
  }

  async save(card: Card): Promise<void> {
    const cardData = card.toJSON();

    await this.prisma.card.upsert({
      where: { id: cardData.id },
      create: {
        id: cardData.id,
        title: cardData.title,
        description: cardData.description,
        position: cardData.position,
        dueDate: cardData.dueDate,
        startDate: cardData.startDate,
        isArchived: cardData.isArchived,
        coverUrl: cardData.coverUrl,
        listId: cardData.listId,
        creatorId: cardData.creatorId,
        assigneeId: cardData.assigneeId,
        createdAt: cardData.createdAt,
        updatedAt: cardData.updatedAt,
      },
      update: {
        title: cardData.title,
        description: cardData.description,
        position: cardData.position,
        dueDate: cardData.dueDate,
        startDate: cardData.startDate,
        isArchived: cardData.isArchived,
        coverUrl: cardData.coverUrl,
        listId: cardData.listId,
        assigneeId: cardData.assigneeId,
        updatedAt: cardData.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.card.delete({
      where: { id },
    });
  }

  async moveCard(cardId: string, targetListId: string, position: number): Promise<void> {
    await this.prisma.card.update({
      where: { id: cardId },
      data: {
        listId: targetListId,
        position,
        updatedAt: new Date(),
      },
    });
  }

  async reorderCards(listId: string, cardPositions: { id: string; position: number }[]): Promise<void> {
    await this.prisma.$transaction(
      cardPositions.map(({ id, position }) =>
        this.prisma.card.update({
          where: { id },
          data: {
            position,
            updatedAt: new Date(),
          },
        })
      )
    );
  }

  async getNextPosition(listId: string): Promise<number> {
    const lastCard = await this.prisma.card.findFirst({
      where: { listId },
      orderBy: { position: 'desc' },
    });

    return (lastCard?.position ?? -1) + 1;
  }

  async existsInList(cardId: string, listId: string): Promise<boolean> {
    const count = await this.prisma.card.count({
      where: { id: cardId, listId },
    });
    return count > 0;
  }

  private mapToDomainCards(cardsData: any[]): Card[] {
    return cardsData.map(cardData => Card.fromPersistence({
      id: cardData.id,
      title: cardData.title,
      description: cardData.description || undefined,
      position: cardData.position,
      dueDate: cardData.dueDate || undefined,
      startDate: cardData.startDate || undefined,
      isArchived: cardData.isArchived,
      coverUrl: cardData.coverUrl || undefined,
      listId: cardData.listId,
      creatorId: cardData.creatorId,
      assigneeId: cardData.assigneeId || undefined,
      createdAt: cardData.createdAt,
      updatedAt: cardData.updatedAt,
    }));
  }
}