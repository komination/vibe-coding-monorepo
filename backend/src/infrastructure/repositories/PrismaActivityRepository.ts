import { PrismaClient } from '@prisma/client';
import { Activity, ActivityType, EntityType } from '@/domain/entities/Activity';
import { ActivityRepository, CreateActivityData } from '@/domain/repositories/ActivityRepository';

export class PrismaActivityRepository implements ActivityRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Activity | null> {
    const activityData = await this.prisma.activity.findUnique({
      where: { id },
    });

    if (!activityData) return null;

    return Activity.fromPersistence({
      id: activityData.id,
      action: activityData.action as ActivityType,
      entityType: activityData.entityType as EntityType,
      entityId: activityData.entityId,
      entityTitle: activityData.entityTitle,
      data: activityData.data ? (activityData.data as Record<string, any>) : undefined,
      userId: activityData.userId,
      boardId: activityData.boardId,
      cardId: activityData.cardId || undefined,
      createdAt: activityData.createdAt,
    });
  }

  async findByBoard(boardId: string, options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    entityType?: EntityType;
    action?: ActivityType;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Activity[]> {
    const where: any = { boardId };

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.entityType) {
      where.entityType = options.entityType;
    }

    if (options?.action) {
      where.action = options.action;
    }

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options.fromDate) {
        where.createdAt.gte = options.fromDate;
      }
      if (options.toDate) {
        where.createdAt.lte = options.toDate;
      }
    }

    const activitiesData = await this.prisma.activity.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToDomainActivities(activitiesData);
  }

  async findByCard(cardId: string, options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: ActivityType;
  }): Promise<Activity[]> {
    const where: any = { cardId };

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.action) {
      where.action = options.action;
    }

    const activitiesData = await this.prisma.activity.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToDomainActivities(activitiesData);
  }

  async findByUser(userId: string, options?: {
    boardId?: string;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Activity[]> {
    const where: any = { userId };

    if (options?.boardId) {
      where.boardId = options.boardId;
    }

    if (options?.fromDate || options?.toDate) {
      where.createdAt = {};
      if (options.fromDate) {
        where.createdAt.gte = options.fromDate;
      }
      if (options.toDate) {
        where.createdAt.lte = options.toDate;
      }
    }

    const activitiesData = await this.prisma.activity.findMany({
      where,
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return this.mapToDomainActivities(activitiesData);
  }

  async create(data: CreateActivityData): Promise<Activity> {
    // Create Activity entity with provided data
    const activityData = {
      description: data.description,
      ...data.data
    };

    const activity = Activity.create({
      action: data.type,
      entityType: data.entityType,
      entityId: data.entityId,
      entityTitle: data.entityTitle,
      data: activityData,
      userId: data.userId,
      boardId: data.boardId,
      cardId: data.cardId,
    });

    // Save to database
    await this.save(activity);
    
    return activity;
  }

  async save(activity: Activity): Promise<void> {
    const activityData = activity.toJSON();

    await this.prisma.activity.create({
      data: {
        id: activityData.id,
        action: activityData.action,
        entityType: activityData.entityType,
        entityId: activityData.entityId,
        entityTitle: activityData.entityTitle,
        data: activityData.data,
        userId: activityData.userId,
        boardId: activityData.boardId,
        cardId: activityData.cardId || undefined,
        createdAt: activityData.createdAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.activity.delete({
      where: { id },
    });
  }

  async deleteByEntity(entityType: EntityType, entityId: string): Promise<void> {
    await this.prisma.activity.deleteMany({
      where: {
        entityType,
        entityId,
      },
    });
  }

  private mapToDomainActivities(activitiesData: any[]): Activity[] {
    return activitiesData.map(activityData => Activity.fromPersistence({
      id: activityData.id,
      action: activityData.action as ActivityType,
      entityType: activityData.entityType as EntityType,
      entityId: activityData.entityId,
      entityTitle: activityData.entityTitle,
      data: activityData.data ? (activityData.data as Record<string, any>) : undefined,
      userId: activityData.userId,
      boardId: activityData.boardId,
      cardId: activityData.cardId || undefined,
      createdAt: activityData.createdAt,
    }));
  }
}