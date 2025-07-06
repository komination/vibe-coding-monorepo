import { PrismaClient } from '@prisma/client';
import { List } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';

export class PrismaListRepository implements ListRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<List | null> {
    const listData = await this.prisma.list.findUnique({
      where: { id },
    });

    if (!listData) return null;

    return List.fromPersistence({
      id: listData.id,
      title: listData.title,
      position: listData.position,
      color: listData.color || undefined,
      boardId: listData.boardId,
      createdAt: listData.createdAt,
      updatedAt: listData.updatedAt,
    });
  }

  async findByBoard(boardId: string, options?: {
    orderBy?: 'position' | 'title' | 'createdAt';
    order?: 'asc' | 'desc';
  }): Promise<List[]> {
    const orderBy = options?.orderBy || 'position';
    const order = options?.order || 'asc';

    const listsData = await this.prisma.list.findMany({
      where: { boardId },
      orderBy: { [orderBy]: order },
    });

    return listsData.map(listData => List.fromPersistence({
      id: listData.id,
      title: listData.title,
      position: listData.position,
      color: listData.color || undefined,
      boardId: listData.boardId,
      createdAt: listData.createdAt,
      updatedAt: listData.updatedAt,
    }));
  }

  async save(list: List): Promise<void> {
    const listData = list.toJSON();

    await this.prisma.list.upsert({
      where: { id: listData.id },
      create: {
        id: listData.id,
        title: listData.title,
        position: listData.position,
        color: listData.color,
        boardId: listData.boardId,
        createdAt: listData.createdAt,
        updatedAt: listData.updatedAt,
      },
      update: {
        title: listData.title,
        position: listData.position,
        color: listData.color,
        updatedAt: listData.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.list.delete({
      where: { id },
    });
  }

  async reorderLists(boardId: string, listPositions: { id: string; position: number }[]): Promise<void> {
    // Use transaction to ensure all updates happen atomically
    await this.prisma.$transaction(
      listPositions.map(({ id, position }) =>
        this.prisma.list.update({
          where: { id, boardId },
          data: { position },
        })
      )
    );
  }

  async getNextPosition(boardId: string): Promise<number> {
    const maxPosition = await this.prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });

    return (maxPosition._max.position || 0) + 1;
  }

  async existsInBoard(listId: string, boardId: string): Promise<boolean> {
    const count = await this.prisma.list.count({
      where: { id: listId, boardId },
    });
    return count > 0;
  }
}