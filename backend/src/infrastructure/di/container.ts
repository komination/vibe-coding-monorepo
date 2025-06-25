import { PrismaClient } from '@prisma/client';

// Import repositories
import { UserRepository } from '@/domain/repositories/UserRepository';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { CardRepository } from '@/domain/repositories/CardRepository';
import { ListRepository } from '@/domain/repositories/ListRepository';
import { LabelRepository } from '@/domain/repositories/LabelRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository';
import { PrismaBoardRepository } from '@/infrastructure/repositories/PrismaBoardRepository';
import { PrismaCardRepository } from '@/infrastructure/repositories/PrismaCardRepository';
import { PrismaListRepository } from '@/infrastructure/repositories/PrismaListRepository';
import { PrismaLabelRepository } from '@/infrastructure/repositories/PrismaLabelRepository';
import { PrismaActivityRepository } from '@/infrastructure/repositories/PrismaActivityRepository';

// Import use cases
import { VerifyCognitoTokenUseCase } from '@/domain/usecases/VerifyCognitoToken';
import { SyncCognitoUserUseCase } from '@/domain/usecases/SyncCognitoUser';
import { GetUserProfileUseCase } from '@/domain/usecases/GetUserProfile';
import { UpdateUserProfileUseCase } from '@/domain/usecases/UpdateUserProfile';
import { LogoutUserUseCase } from '@/domain/usecases/LogoutUser';
import { CreateBoardUseCase } from '@/domain/usecases/CreateBoard';
import { GetBoardUseCase } from '@/domain/usecases/GetBoard';
import { UpdateBoardUseCase } from '@/domain/usecases/UpdateBoard';
import { DeleteBoardUseCase } from '@/domain/usecases/DeleteBoard';
import { GetUserBoardsUseCase } from '@/domain/usecases/GetUserBoards';
import { AddBoardMemberUseCase } from '@/domain/usecases/AddBoardMember';
import { UpdateMemberRoleUseCase } from '@/domain/usecases/UpdateMemberRole';
import { RemoveBoardMemberUseCase } from '@/domain/usecases/RemoveBoardMember';
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
import { CreateLabelUseCase } from '@/domain/usecases/CreateLabel';
import { GetBoardLabelsUseCase } from '@/domain/usecases/GetBoardLabels';
import { UpdateLabelUseCase } from '@/domain/usecases/UpdateLabel';
import { DeleteLabelUseCase } from '@/domain/usecases/DeleteLabel';
import { AddLabelToCardUseCase } from '@/domain/usecases/AddLabelToCard';
import { RemoveLabelFromCardUseCase } from '@/domain/usecases/RemoveLabelFromCard';
import { GetCardLabelsUseCase } from '@/domain/usecases/GetCardLabels';

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
  const verifyCognitoTokenUseCase = new VerifyCognitoTokenUseCase(userRepository);
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