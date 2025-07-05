import { Board } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';

export interface GetUserBoardsRequest {
  userId: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface GetUserBoardsResponse {
  ownedBoards: Board[];
  memberBoards: Board[];
  totalCount: {
    owned: number;
    member: number;
  };
}

export class GetUserBoardsUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private userRepository: UserRepository
  ) {}

  async execute(request: GetUserBoardsRequest): Promise<GetUserBoardsResponse> {
    const { userId, includeArchived = false, limit, offset } = request;

    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Get boards owned by user
    const ownedBoards = await this.boardRepository.findByOwner(userId, {
      includeArchived,
      limit,
      offset,
    });

    // Get boards where user is a member (but not owner)
    const memberBoards = await this.boardRepository.findByMember(userId, {
      includeArchived,
      limit,
      offset,
    });

    // Filter out boards that the user owns from member boards to avoid duplicates
    const filteredMemberBoards = memberBoards.filter(board => 
      !ownedBoards.some(ownedBoard => ownedBoard.id === board.id)
    );

    // For simplicity, we'll return the counts based on the returned arrays
    // In a real implementation, you might want separate count queries for accuracy
    const totalCount = {
      owned: ownedBoards.length,
      member: filteredMemberBoards.length,
    };

    return {
      ownedBoards,
      memberBoards: filteredMemberBoards,
      totalCount,
    };
  }
}