import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

// Import repositories using relative paths
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaBoardRepository } from '@/infrastructure/repositories/PrismaBoardRepository';
import { PrismaCardRepository } from '@/infrastructure/repositories/PrismaCardRepository';
import { PrismaActivityRepository } from '@/infrastructure/repositories/PrismaActivityRepository';
import { PrismaListRepository } from '@/infrastructure/repositories/PrismaListRepository';
import { PrismaLabelRepository } from '@/infrastructure/repositories/PrismaLabelRepository';

// Import use cases using relative paths
import { CreateBoardUseCase } from '@/domain/usecases/CreateBoard';
import { GetBoardUseCase } from '@/domain/usecases/GetBoard';
import { UpdateBoardUseCase } from '@/domain/usecases/UpdateBoard';
import { DeleteBoardUseCase } from '@/domain/usecases/DeleteBoard';
import { GetUserBoardsUseCase } from '@/domain/usecases/GetUserBoards';
import { CreateCardUseCase } from '@/domain/usecases/CreateCard';
import { GetCard } from '@/domain/usecases/GetCard';
import { UpdateCard } from '@/domain/usecases/UpdateCard';
import { MoveCard } from '@/domain/usecases/MoveCard';
import { DeleteCard } from '@/domain/usecases/DeleteCard';
import { GetListCards } from '@/domain/usecases/GetListCards';
import { ArchiveCard } from '@/domain/usecases/ArchiveCard';
import { UnarchiveCard } from '@/domain/usecases/UnarchiveCard';
import { ReorderCards } from '@/domain/usecases/ReorderCards';
import { CreateListUseCase } from '@/domain/usecases/CreateList';
import { GetListUseCase } from '@/domain/usecases/GetList';
import { UpdateListUseCase } from '@/domain/usecases/UpdateList';
import { DeleteListUseCase } from '@/domain/usecases/DeleteList';
import { GetBoardListsUseCase } from '@/domain/usecases/GetBoardLists';
import { ReorderListsUseCase } from '@/domain/usecases/ReorderLists';
import { RegisterUserUseCase } from '@/domain/usecases/RegisterUser';
import { LoginUserUseCase } from '@/domain/usecases/LoginUser';
import { VerifyTokenUseCase } from '@/domain/usecases/VerifyToken';
import { GetUserProfileUseCase } from '@/domain/usecases/GetUserProfile';
import { RefreshTokenUseCase } from '@/domain/usecases/RefreshToken';
import { CreateLabelUseCase } from '@/domain/usecases/CreateLabel';
import { GetBoardLabelsUseCase } from '@/domain/usecases/GetBoardLabels';
import { UpdateLabelUseCase } from '@/domain/usecases/UpdateLabel';
import { DeleteLabelUseCase } from '@/domain/usecases/DeleteLabel';
import { AddLabelToCardUseCase } from '@/domain/usecases/AddLabelToCard';
import { RemoveLabelFromCardUseCase } from '@/domain/usecases/RemoveLabelFromCard';
import { GetCardLabelsUseCase } from '@/domain/usecases/GetCardLabels';

// Import controllers using relative paths
import { BoardController } from '@/application/controllers/BoardController';
import { CardController } from '@/application/controllers/CardController';
import { ListController } from '@/application/controllers/ListController';
import { AuthController } from '@/application/controllers/AuthController';
import { LabelController } from '@/application/controllers/LabelController';

// Import route creators
import { createBoardRoutes } from '@/interfaces/http/routes/boardRoutes';
import { createCardRoutes } from '@/interfaces/http/routes/cardRoutes';
import { createListRoutes } from '@/interfaces/http/routes/listRoutes';
import { createAuthRoutes } from '@/interfaces/http/routes/authRoutes';
import { createLabelRoutes } from '@/interfaces/http/routes/labelRoutes';

// Import middleware
import { initializeAuthMiddleware, authMiddleware } from '@/interfaces/http/middleware/auth';

export function createApiRoutes(prisma: PrismaClient) {
  const app = new Hono();

  // Initialize repositories
  const userRepository = new PrismaUserRepository(prisma);
  const boardRepository = new PrismaBoardRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);
  const activityRepository = new PrismaActivityRepository(prisma);
  const listRepository = new PrismaListRepository(prisma);
  const labelRepository = new PrismaLabelRepository(prisma);

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
  const deleteBoardUseCase = new DeleteBoardUseCase(
    boardRepository,
    activityRepository
  );
  const getUserBoardsUseCase = new GetUserBoardsUseCase(
    boardRepository,
    userRepository
  );
  const createCardUseCase = new CreateCardUseCase(
    cardRepository,
    listRepository,
    boardRepository,
    activityRepository
  );
  const getCardUseCase = new GetCard(
    cardRepository,
    userRepository,
    boardRepository,
    activityRepository
  );
  const updateCardUseCase = new UpdateCard(
    cardRepository,
    userRepository,
    boardRepository,
    activityRepository
  );
  const moveCardUseCase = new MoveCard(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  const deleteCardUseCase = new DeleteCard(
    cardRepository,
    userRepository,
    boardRepository,
    activityRepository
  );
  const getListCardsUseCase = new GetListCards(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository
  );
  const archiveCardUseCase = new ArchiveCard(
    cardRepository,
    userRepository,
    boardRepository,
    activityRepository
  );
  const unarchiveCardUseCase = new UnarchiveCard(
    cardRepository,
    userRepository,
    boardRepository,
    activityRepository
  );
  const reorderCardsUseCase = new ReorderCards(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  
  // Initialize list use cases
  const createListUseCase = new CreateListUseCase(
    listRepository,
    boardRepository,
    activityRepository
  );
  const getListUseCase = new GetListUseCase(
    listRepository,
    boardRepository
  );
  const updateListUseCase = new UpdateListUseCase(
    listRepository,
    boardRepository,
    activityRepository
  );
  const deleteListUseCase = new DeleteListUseCase(
    listRepository,
    boardRepository,
    activityRepository
  );
  const getBoardListsUseCase = new GetBoardListsUseCase(
    listRepository,
    boardRepository
  );
  const reorderListsUseCase = new ReorderListsUseCase(
    listRepository,
    boardRepository,
    activityRepository
  );
  
  // Initialize authentication use cases
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository);
  const verifyTokenUseCase = new VerifyTokenUseCase(userRepository);
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository);
  
  // Initialize label use cases
  const createLabelUseCase = new CreateLabelUseCase(
    labelRepository,
    boardRepository,
    activityRepository
  );
  const getBoardLabelsUseCase = new GetBoardLabelsUseCase(
    labelRepository,
    boardRepository
  );
  const updateLabelUseCase = new UpdateLabelUseCase(
    labelRepository,
    boardRepository,
    activityRepository
  );
  const deleteLabelUseCase = new DeleteLabelUseCase(
    labelRepository,
    boardRepository,
    activityRepository
  );
  const addLabelToCardUseCase = new AddLabelToCardUseCase(
    labelRepository,
    cardRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  const removeLabelFromCardUseCase = new RemoveLabelFromCardUseCase(
    labelRepository,
    cardRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  const getCardLabelsUseCase = new GetCardLabelsUseCase(
    labelRepository,
    cardRepository,
    boardRepository,
    listRepository
  );

  // Initialize authentication middleware
  initializeAuthMiddleware(verifyTokenUseCase);

  // Initialize controllers
  const boardController = new BoardController(
    createBoardUseCase,
    getBoardUseCase,
    updateBoardUseCase,
    deleteBoardUseCase,
    getUserBoardsUseCase
  );
  const cardController = new CardController(
    createCardUseCase,
    getCardUseCase,
    updateCardUseCase,
    moveCardUseCase,
    deleteCardUseCase,
    getListCardsUseCase,
    archiveCardUseCase,
    unarchiveCardUseCase,
    reorderCardsUseCase
  );
  const listController = new ListController(
    createListUseCase,
    getListUseCase,
    updateListUseCase,
    deleteListUseCase,
    getBoardListsUseCase,
    reorderListsUseCase
  );
  const authController = new AuthController(
    registerUserUseCase,
    loginUserUseCase,
    getUserProfileUseCase,
    refreshTokenUseCase
  );
  const labelController = new LabelController(
    createLabelUseCase,
    getBoardLabelsUseCase,
    updateLabelUseCase,
    deleteLabelUseCase,
    addLabelToCardUseCase,
    removeLabelFromCardUseCase,
    getCardLabelsUseCase
  );

  // Register routes
  
  // Public routes (no authentication required)
  app.route('/auth', createAuthRoutes(authController));
  
  // Protected routes (authentication required)
  app.use('/boards/*', authMiddleware);
  app.use('/cards/*', authMiddleware);
  app.use('/lists/*', authMiddleware);
  app.use('/labels/*', authMiddleware);
  app.use('/auth/me', authMiddleware);
  
  app.route('/boards', createBoardRoutes(boardController, listController));
  app.route('/cards', createCardRoutes(cardController));
  app.route('/lists', createListRoutes(listController));
  app.route('/labels', createLabelRoutes(labelController));

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