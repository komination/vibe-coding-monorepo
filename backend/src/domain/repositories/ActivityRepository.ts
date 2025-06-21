import { Activity, ActivityType, EntityType } from '@/domain/entities/Activity';

export interface CreateActivityData {
  type: ActivityType;
  userId: string;
  boardId: string;
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  description?: string;
  cardId?: string;
  data?: Record<string, any>;
}

export interface ActivityRepository {
  findById(id: string): Promise<Activity | null>;
  findByBoard(boardId: string, options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    entityType?: EntityType;
    action?: ActivityType;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Activity[]>;
  findByCard(cardId: string, options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: ActivityType;
  }): Promise<Activity[]>;
  findByUser(userId: string, options?: {
    boardId?: string;
    limit?: number;
    offset?: number;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Activity[]>;
  create(data: CreateActivityData): Promise<Activity>;
  save(activity: Activity): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByEntity(entityType: EntityType, entityId: string): Promise<void>;
}