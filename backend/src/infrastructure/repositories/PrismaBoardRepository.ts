import { PrismaClient } from '@prisma/client';
import { Board, BoardRole } from '@kanban/domain-core';
import { BoardRepository, BoardMember } from '@kanban/domain-core';

export class PrismaBoardRepository implements BoardRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Board | null> {
    const boardData = await this.prisma.board.findUnique({
      where: { id },
    });

    if (!boardData) return null;

    return Board.fromPersistence({
      id: boardData.id,
      title: boardData.title,
      description: boardData.description || undefined,
      backgroundUrl: boardData.backgroundUrl || undefined,
      isPublic: boardData.isPublic,
      isArchived: boardData.isArchived,
      ownerId: boardData.ownerId,
      createdAt: boardData.createdAt,
      updatedAt: boardData.updatedAt,
    });
  }

  async findByOwner(ownerId: string, options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Board[]> {
    const where: any = { ownerId };
    
    if (!options?.includeArchived) {
      where.isArchived = false;
    }

    const boardsData = await this.prisma.board.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return boardsData.map(boardData => Board.fromPersistence({
      id: boardData.id,
      title: boardData.title,
      description: boardData.description || undefined,
      backgroundUrl: boardData.backgroundUrl || undefined,
      isPublic: boardData.isPublic,
      isArchived: boardData.isArchived,
      ownerId: boardData.ownerId,
      createdAt: boardData.createdAt,
      updatedAt: boardData.updatedAt,
    }));
  }

  async findByMember(userId: string, options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Board[]> {
    const where: any = {
      members: {
        some: { userId }
      }
    };
    
    if (!options?.includeArchived) {
      where.isArchived = false;
    }

    const boardsData = await this.prisma.board.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return boardsData.map(boardData => Board.fromPersistence({
      id: boardData.id,
      title: boardData.title,
      description: boardData.description || undefined,
      backgroundUrl: boardData.backgroundUrl || undefined,
      isPublic: boardData.isPublic,
      isArchived: boardData.isArchived,
      ownerId: boardData.ownerId,
      createdAt: boardData.createdAt,
      updatedAt: boardData.updatedAt,
    }));
  }

  async findPublicBoards(options?: {
    limit?: number;
    offset?: number;
  }): Promise<Board[]> {
    const boardsData = await this.prisma.board.findMany({
      where: {
        isPublic: true,
        isArchived: false,
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return boardsData.map(boardData => Board.fromPersistence({
      id: boardData.id,
      title: boardData.title,
      description: boardData.description || undefined,
      backgroundUrl: boardData.backgroundUrl || undefined,
      isPublic: boardData.isPublic,
      isArchived: boardData.isArchived,
      ownerId: boardData.ownerId,
      createdAt: boardData.createdAt,
      updatedAt: boardData.updatedAt,
    }));
  }

  async save(board: Board): Promise<void> {
    const boardData = board.toJSON();

    await this.prisma.board.upsert({
      where: { id: boardData.id },
      create: {
        id: boardData.id,
        title: boardData.title,
        description: boardData.description,
        backgroundUrl: boardData.backgroundUrl,
        isPublic: boardData.isPublic,
        isArchived: boardData.isArchived,
        ownerId: boardData.ownerId,
        createdAt: boardData.createdAt,
        updatedAt: boardData.updatedAt,
      },
      update: {
        title: boardData.title,
        description: boardData.description,
        backgroundUrl: boardData.backgroundUrl,
        isPublic: boardData.isPublic,
        isArchived: boardData.isArchived,
        updatedAt: boardData.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.board.delete({
      where: { id },
    });
  }

  async addMember(boardId: string, userId: string, role: BoardRole): Promise<void> {
    await this.prisma.boardMember.create({
      data: {
        boardId,
        userId,
        role,
      },
    });
  }

  async removeMember(boardId: string, userId: string): Promise<void> {
    await this.prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  }

  async updateMemberRole(boardId: string, userId: string, role: BoardRole): Promise<void> {
    await this.prisma.boardMember.update({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
      data: { role },
    });
  }

  async getMemberRole(boardId: string, userId: string): Promise<BoardRole | null> {
    const member = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });

    return member?.role as BoardRole || null;
  }

  async getMembers(boardId: string): Promise<BoardMember[]> {
    const members = await this.prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return members.map(member => ({
      userId: member.userId,
      role: member.role as BoardRole,
      joinedAt: member.joinedAt,
    }));
  }

  async isMember(boardId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.boardMember.count({
      where: { boardId, userId },
    });
    return count > 0;
  }
}