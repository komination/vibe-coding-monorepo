import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

// Import repositories using relative paths
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaBoardRepository } from '@/infrastructure/repositories/PrismaBoardRepository';
import { PrismaCardRepository } from '@/infrastructure/repositories/PrismaCardRepository';
import { PrismaActivityRepository } from '@/infrastructure/repositories/PrismaActivityRepository';

// Import use cases using relative paths
import { CreateBoardUseCase } from '@/domain/usecases/CreateBoard';
import { GetBoardUseCase } from '@/domain/usecases/GetBoard';
import { UpdateBoardUseCase } from '@/domain/usecases/UpdateBoard';
import { CreateCardUseCase } from '@/domain/usecases/CreateCard';

// Import controllers using relative paths
import { BoardController } from '@/application/controllers/BoardController';
import { CardController } from '@/application/controllers/CardController';

// Import route creators
import { createBoardRoutes } from '@/interfaces/http/routes/boardRoutes';
import { createCardRoutes } from '@/interfaces/http/routes/cardRoutes';

export function createApiRoutes(prisma: PrismaClient) {
  const app = new Hono();

  // Initialize repositories
  const userRepository = new PrismaUserRepository(prisma);
  const boardRepository = new PrismaBoardRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);
  const activityRepository = new PrismaActivityRepository(prisma);

  // Initialize use cases
  const createBoardUseCase = new CreateBoardUseCase(
    boardRepository,
    userRepository,
    activityRepository
  );
  const getBoardUseCase = new GetBoardUseCase(boardRepository);
  const updateBoardUseCase = new UpdateBoardUseCase(
    boardRepository,
    activityRepository
  );
  const createCardUseCase = new CreateCardUseCase(
    cardRepository,
    // TODO: Add list repository when implemented
    boardRepository as any,
    boardRepository,
    activityRepository
  );

  // Initialize controllers
  const boardController = new BoardController(
    createBoardUseCase,
    getBoardUseCase,
    updateBoardUseCase
  );
  const cardController = new CardController(createCardUseCase);

  // Register routes
  app.route('/boards', createBoardRoutes(boardController));
  app.route('/cards', createCardRoutes(cardController));

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  return app;
}