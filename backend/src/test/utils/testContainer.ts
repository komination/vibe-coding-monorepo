import { container } from "@/infrastructure/di/container";
import { prismaTest } from "../setup";
import { PrismaBoardRepository } from "@/infrastructure/repositories/PrismaBoardRepository";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { PrismaListRepository } from "@/infrastructure/repositories/PrismaListRepository";
import { PrismaCardRepository } from "@/infrastructure/repositories/PrismaCardRepository";
import { PrismaLabelRepository } from "@/infrastructure/repositories/PrismaLabelRepository";
import { PrismaActivityRepository } from "@/infrastructure/repositories/PrismaActivityRepository";

/**
 * Initialize the DI container with test repositories
 */
export function initTestContainer() {
  // Clear any existing registrations
  container.clear();

  // Register repositories with test database
  container.register("boardRepository", new PrismaBoardRepository(prismaTest));
  container.register("userRepository", new PrismaUserRepository(prismaTest));
  container.register("listRepository", new PrismaListRepository(prismaTest));
  container.register("cardRepository", new PrismaCardRepository(prismaTest));
  container.register("labelRepository", new PrismaLabelRepository(prismaTest));
  container.register("activityRepository", new PrismaActivityRepository(prismaTest));

  // Register use cases (these will use the test repositories)
  // Note: In a real implementation, you'd register all use cases here
  // For now, we'll add them as needed in tests

  return container;
}

/**
 * Create mock repositories for unit testing
 */
export function createMockRepositories() {
  return {
    boardRepository: {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
      findByOwner: () => Promise.resolve([]),
      findByMember: () => Promise.resolve([]),
      addMember: () => Promise.resolve(),
      removeMember: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      update: () => Promise.resolve(),
      findByIdWithMembers: () => Promise.resolve(null),
    },
    userRepository: {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
      findByEmail: () => Promise.resolve(null),
      findByCognitoId: () => Promise.resolve(null),
      update: () => Promise.resolve(),
    },
    listRepository: {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
      findByBoard: () => Promise.resolve([]),
      delete: () => Promise.resolve(),
      update: () => Promise.resolve(),
      getMaxPosition: () => Promise.resolve(0),
      reorderLists: () => Promise.resolve(),
    },
    cardRepository: {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
      findByList: () => Promise.resolve([]),
      findByBoard: () => Promise.resolve([]),
      delete: () => Promise.resolve(),
      update: () => Promise.resolve(),
      moveCard: () => Promise.resolve(),
      getMaxPosition: () => Promise.resolve(0),
      reorderCards: () => Promise.resolve(),
    },
    labelRepository: {
      save: () => Promise.resolve(),
      findById: () => Promise.resolve(null),
      findByBoard: () => Promise.resolve([]),
      delete: () => Promise.resolve(),
      update: () => Promise.resolve(),
      addToCard: () => Promise.resolve(),
      removeFromCard: () => Promise.resolve(),
      findByCard: () => Promise.resolve([]),
    },
    activityRepository: {
      save: () => Promise.resolve(),
      findByBoard: () => Promise.resolve([]),
      findByUser: () => Promise.resolve([]),
      findByEntityId: () => Promise.resolve([]),
    },
  };
}