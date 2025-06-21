import { PrismaClient } from '@prisma/client';
import { Label } from '@/domain/entities/Label';
import { LabelRepository } from '@/domain/repositories/LabelRepository';

export class PrismaLabelRepository implements LabelRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Label | null> {
    const labelData = await this.prisma.label.findUnique({
      where: { id },
    });

    if (!labelData) return null;

    return Label.fromPersistence({
      id: labelData.id,
      name: labelData.name,
      color: labelData.color,
      boardId: labelData.boardId,
      createdAt: labelData.createdAt,
    });
  }

  async findByBoard(boardId: string): Promise<Label[]> {
    const labelsData = await this.prisma.label.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });

    return labelsData.map(labelData => Label.fromPersistence({
      id: labelData.id,
      name: labelData.name,
      color: labelData.color,
      boardId: labelData.boardId,
      createdAt: labelData.createdAt,
    }));
  }

  async save(label: Label): Promise<void> {
    const labelData = label.toJSON();

    await this.prisma.label.upsert({
      where: { id: labelData.id },
      create: {
        id: labelData.id,
        name: labelData.name,
        color: labelData.color,
        boardId: labelData.boardId,
        createdAt: labelData.createdAt,
      },
      update: {
        name: labelData.name,
        color: labelData.color,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.label.delete({
      where: { id },
    });
  }

  async addToCard(cardId: string, labelId: string): Promise<void> {
    await this.prisma.cardLabel.create({
      data: {
        cardId,
        labelId,
      },
    });
  }

  async removeFromCard(cardId: string, labelId: string): Promise<void> {
    await this.prisma.cardLabel.delete({
      where: {
        cardId_labelId: {
          cardId,
          labelId,
        },
      },
    });
  }

  async getCardLabels(cardId: string): Promise<Label[]> {
    const cardLabels = await this.prisma.cardLabel.findMany({
      where: { cardId },
      include: {
        label: true,
      },
    });

    return cardLabels.map(cardLabel => Label.fromPersistence({
      id: cardLabel.label.id,
      name: cardLabel.label.name,
      color: cardLabel.label.color,
      boardId: cardLabel.label.boardId,
      createdAt: cardLabel.label.createdAt,
    }));
  }

  async isAttachedToCard(cardId: string, labelId: string): Promise<boolean> {
    const count = await this.prisma.cardLabel.count({
      where: {
        cardId,
        labelId,
      },
    });

    return count > 0;
  }

  async existsInBoard(labelId: string, boardId: string): Promise<boolean> {
    const count = await this.prisma.label.count({
      where: {
        id: labelId,
        boardId,
      },
    });

    return count > 0;
  }
}