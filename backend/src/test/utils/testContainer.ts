import { createContainer, Container } from "@/infrastructure/di/container";
import { prismaTest } from "../setup";

/**
 * Initialize the DI container with test repositories
 */
export function initTestContainer(): Container {
  // Create container with test database
  return createContainer(prismaTest);
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