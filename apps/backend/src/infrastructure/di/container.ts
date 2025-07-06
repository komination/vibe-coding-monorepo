import { PrismaClient } from '@prisma/client';
import { cognitoConfig } from '@/infrastructure/config/env';

// Import repositories
import { UserRepository } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { CardRepository } from '@kanban/domain-core';
import { ListRepository } from '@kanban/domain-core';
import { LabelRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaBoardRepository } from '@/infrastructure/repositories/PrismaBoardRepository';
import { PrismaCardRepository } from '@/infrastructure/repositories/PrismaCardRepository';
import { PrismaListRepository } from '@/infrastructure/repositories/PrismaListRepository';
import { PrismaLabelRepository } from '@/infrastructure/repositories/PrismaLabelRepository';
import { PrismaActivityRepository } from '@/infrastructure/repositories/PrismaActivityRepository';

// Import use cases
import { VerifyCognitoTokenUseCase } from '@kanban/use-cases';
import { SyncCognitoUserUseCase } from '@kanban/use-cases';
import { GetUserProfileUseCase } from '@kanban/use-cases';
import { UpdateUserProfileUseCase } from '@kanban/use-cases';
import { LogoutUserUseCase } from '@kanban/use-cases';
import { CreateBoardUseCase } from '@kanban/use-cases';
import { GetBoardUseCase } from '@kanban/use-cases';
import { UpdateBoardUseCase } from '@kanban/use-cases';
import { DeleteBoardUseCase } from '@kanban/use-cases';
import { GetUserBoardsUseCase } from '@kanban/use-cases';
import { AddBoardMemberUseCase } from '@kanban/use-cases';
import { UpdateMemberRoleUseCase } from '@kanban/use-cases';
import { RemoveBoardMemberUseCase } from '@kanban/use-cases';
import { CreateCardUseCase } from '@kanban/use-cases';
import { GetCard } from '@kanban/use-cases';
import { UpdateCard } from '@kanban/use-cases';
import { MoveCard } from '@kanban/use-cases';
import { DeleteCard } from '@kanban/use-cases';
import { GetListCards } from '@kanban/use-cases';
import { ArchiveCard } from '@kanban/use-cases';
import { UnarchiveCard } from '@kanban/use-cases';
import { ReorderCards } from '@kanban/use-cases';
import { CreateListUseCase } from '@kanban/use-cases';
import { GetListUseCase } from '@kanban/use-cases';
import { UpdateListUseCase } from '@kanban/use-cases';
import { DeleteListUseCase } from '@kanban/use-cases';
import { GetBoardListsUseCase } from '@kanban/use-cases';
import { ReorderListsUseCase } from '@kanban/use-cases';
import { CreateLabelUseCase } from '@kanban/use-cases';
import { GetBoardLabelsUseCase } from '@kanban/use-cases';
import { UpdateLabelUseCase } from '@kanban/use-cases';
import { DeleteLabelUseCase } from '@kanban/use-cases';
import { AddLabelToCardUseCase } from '@kanban/use-cases';
import { RemoveLabelFromCardUseCase } from '@kanban/use-cases';
import { GetCardLabelsUseCase } from '@kanban/use-cases';

// Import controllers
import { AuthController } from '@/application/controllers/AuthController';
import { BoardController } from '@/application/controllers/BoardController';
import { CardController } from '@/application/controllers/CardController';
import { ListController } from '@/application/controllers/ListController';
import { LabelController } from '@/application/controllers/LabelController';

export interface Container {
  // Database
  prisma: PrismaClient;
  
  // Repositories
  userRepository: UserRepository;
  boardRepository: BoardRepository;
  cardRepository: CardRepository;
  listRepository: ListRepository;
  labelRepository: LabelRepository;
  activityRepository: ActivityRepository;
  
  // Auth Use Cases
  logoutUserUseCase: LogoutUserUseCase;
  verifyCognitoTokenUseCase: VerifyCognitoTokenUseCase;
  syncCognitoUserUseCase: SyncCognitoUserUseCase;
  getUserProfileUseCase: GetUserProfileUseCase;
  updateUserProfileUseCase: UpdateUserProfileUseCase;
  
  // Board Use Cases
  createBoardUseCase: CreateBoardUseCase;
  getBoardUseCase: GetBoardUseCase;
  updateBoardUseCase: UpdateBoardUseCase;
  deleteBoardUseCase: DeleteBoardUseCase;
  getUserBoardsUseCase: GetUserBoardsUseCase;
  addBoardMemberUseCase: AddBoardMemberUseCase;
  updateMemberRoleUseCase: UpdateMemberRoleUseCase;
  removeBoardMemberUseCase: RemoveBoardMemberUseCase;
  
  // Card Use Cases
  createCardUseCase: CreateCardUseCase;
  getCardUseCase: GetCard;
  updateCardUseCase: UpdateCard;
  moveCardUseCase: MoveCard;
  deleteCardUseCase: DeleteCard;
  getListCardsUseCase: GetListCards;
  archiveCardUseCase: ArchiveCard;
  unarchiveCardUseCase: UnarchiveCard;
  reorderCardsUseCase: ReorderCards;
  
  // List Use Cases
  createListUseCase: CreateListUseCase;
  getListUseCase: GetListUseCase;
  updateListUseCase: UpdateListUseCase;
  deleteListUseCase: DeleteListUseCase;
  getBoardListsUseCase: GetBoardListsUseCase;
  reorderListsUseCase: ReorderListsUseCase;
  
  // Label Use Cases
  createLabelUseCase: CreateLabelUseCase;
  getBoardLabelsUseCase: GetBoardLabelsUseCase;
  updateLabelUseCase: UpdateLabelUseCase;
  deleteLabelUseCase: DeleteLabelUseCase;
  addLabelToCardUseCase: AddLabelToCardUseCase;
  removeLabelFromCardUseCase: RemoveLabelFromCardUseCase;
  getCardLabelsUseCase: GetCardLabelsUseCase;
  
  // Controllers
  authController: AuthController;
  boardController: BoardController;
  cardController: CardController;
  listController: ListController;
  labelController: LabelController;
}

export function createContainer(prisma: PrismaClient): Container {
  // Create repositories
  const userRepository = new PrismaUserRepository(prisma);
  const boardRepository = new PrismaBoardRepository(prisma);
  const cardRepository = new PrismaCardRepository(prisma);
  const listRepository = new PrismaListRepository(prisma);
  const labelRepository = new PrismaLabelRepository(prisma);
  const activityRepository = new PrismaActivityRepository(prisma);
  
  // Create auth use cases
  const logoutUserUseCase = new LogoutUserUseCase();
  const verifyCognitoTokenUseCase = new VerifyCognitoTokenUseCase(userRepository, cognitoConfig);
  const syncCognitoUserUseCase = new SyncCognitoUserUseCase(userRepository);
  const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
  const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
  
  // Create board use cases
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
  const addBoardMemberUseCase = new AddBoardMemberUseCase(
    boardRepository,
    userRepository,
    activityRepository
  );
  const updateMemberRoleUseCase = new UpdateMemberRoleUseCase(
    boardRepository,
    userRepository,
    activityRepository
  );
  const removeBoardMemberUseCase = new RemoveBoardMemberUseCase(
    boardRepository,
    userRepository,
    activityRepository
  );
  
  // Create card use cases
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
    listRepository,
    activityRepository
  );
  const updateCardUseCase = new UpdateCard(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository,
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
    listRepository,
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
    listRepository,
    activityRepository
  );
  const unarchiveCardUseCase = new UnarchiveCard(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  const reorderCardsUseCase = new ReorderCards(
    cardRepository,
    userRepository,
    boardRepository,
    listRepository,
    activityRepository
  );
  
  // Create list use cases
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
  
  // Create label use cases
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
  
  // Create controllers
  const authController = new AuthController(
    logoutUserUseCase,
    getUserProfileUseCase,
    updateUserProfileUseCase
  );
  const boardController = new BoardController(
    createBoardUseCase,
    getBoardUseCase,
    updateBoardUseCase,
    deleteBoardUseCase,
    getUserBoardsUseCase,
    addBoardMemberUseCase,
    updateMemberRoleUseCase,
    removeBoardMemberUseCase
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
  const labelController = new LabelController(
    createLabelUseCase,
    getBoardLabelsUseCase,
    updateLabelUseCase,
    deleteLabelUseCase,
    addLabelToCardUseCase,
    removeLabelFromCardUseCase,
    getCardLabelsUseCase
  );
  
  return {
    // Database
    prisma,
    
    // Repositories
    userRepository,
    boardRepository,
    cardRepository,
    listRepository,
    labelRepository,
    activityRepository,
    
    // Auth Use Cases
    logoutUserUseCase,
    verifyCognitoTokenUseCase,
    syncCognitoUserUseCase,
    getUserProfileUseCase,
    updateUserProfileUseCase,
    
    // Board Use Cases
    createBoardUseCase,
    getBoardUseCase,
    updateBoardUseCase,
    deleteBoardUseCase,
    getUserBoardsUseCase,
    addBoardMemberUseCase,
    updateMemberRoleUseCase,
    removeBoardMemberUseCase,
    
    // Card Use Cases
    createCardUseCase,
    getCardUseCase,
    updateCardUseCase,
    moveCardUseCase,
    deleteCardUseCase,
    getListCardsUseCase,
    archiveCardUseCase,
    unarchiveCardUseCase,
    reorderCardsUseCase,
    
    // List Use Cases
    createListUseCase,
    getListUseCase,
    updateListUseCase,
    deleteListUseCase,
    getBoardListsUseCase,
    reorderListsUseCase,
    
    // Label Use Cases
    createLabelUseCase,
    getBoardLabelsUseCase,
    updateLabelUseCase,
    deleteLabelUseCase,
    addLabelToCardUseCase,
    removeLabelFromCardUseCase,
    getCardLabelsUseCase,
    
    // Controllers
    authController,
    boardController,
    cardController,
    listController,
    labelController,
  };
}