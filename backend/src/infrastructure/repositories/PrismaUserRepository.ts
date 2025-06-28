import { PrismaClient } from '@prisma/client';
import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToUser(userData: any): User {
    return User.fromPersistence({
      id: userData.id,
      email: userData.email,
      username: userData.username,
      cognitoSub: userData.cognitoSub,
      name: userData.name || undefined,
      avatarUrl: userData.avatarUrl || undefined,
      isActive: userData.isActive,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userData) return null;

    return this.mapToUser(userData);
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userData) return null;

    return this.mapToUser(userData);
  }

  async findByUsername(username: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!userData) return null;

    return this.mapToUser(userData);
  }

  async findByCognitoSub(cognitoSub: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { cognitoSub },
    });

    if (!userData) return null;

    return this.mapToUser(userData);
  }

  async create(user: User): Promise<User> {
    const userData = user.toJSON();

    const created = await this.prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        cognitoSub: userData.cognitoSub,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    });

    return this.mapToUser(created);
  }

  async update(user: User): Promise<User> {
    const userData = user.toJSON();

    const updated = await this.prisma.user.update({
      where: { id: userData.id },
      data: {
        email: userData.email,
        username: userData.username,
        cognitoSub: userData.cognitoSub,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        isActive: userData.isActive,
        updatedAt: userData.updatedAt,
      },
    });

    return this.mapToUser(updated);
  }

  async save(user: User): Promise<void> {
    const userData = user.toJSON();

    await this.prisma.user.upsert({
      where: { id: userData.id },
      create: {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        cognitoSub: userData.cognitoSub,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      update: {
        email: userData.email,
        username: userData.username,
        cognitoSub: userData.cognitoSub,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        isActive: userData.isActive,
        updatedAt: userData.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findMany(filters?: {
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    const where: any = {};
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const usersData = await this.prisma.user.findMany({
      where,
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map(userData => this.mapToUser(userData));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username },
    });
    return count > 0;
  }
}