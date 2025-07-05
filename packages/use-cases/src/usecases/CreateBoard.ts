import { Board } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface CreateBoardRequest {
  title: string;
  description?: string;
  backgroundUrl?: string;
  isPublic?: boolean;
  ownerId: string;
}

export interface CreateBoardResponse {
  board: Board;
}

export class CreateBoardUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private userRepository: UserRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: CreateBoardRequest): Promise<CreateBoardResponse> {
    const { title, description, backgroundUrl, isPublic = false, ownerId } = request;

    // Validate owner exists
    const owner = await this.userRepository.findById(ownerId);
    if (!owner) {
      throw new Error('Owner not found');
    }

    if (!owner.isActive) {
      throw new Error('Owner account is inactive');
    }

    // Validate title
    if (!title.trim()) {
      throw new Error('Board title is required');
    }

    if (title.length > 255) {
      throw new Error('Board title is too long');
    }

    // Create board
    const board = Board.create({
      title: title.trim(),
      description: description?.trim(),
      backgroundUrl,
      isPublic,
      isArchived: false,
      ownerId,
    });

    // Save board
    await this.boardRepository.save(board);

    // Add owner as board member with OWNER role
    await this.boardRepository.addMember(board.id, ownerId, 'OWNER');

    // Log activity
    const activity = Activity.create({
      action: 'CREATE',
      entityType: 'BOARD',
      entityId: board.id,
      entityTitle: board.title,
      userId: ownerId,
      boardId: board.id,
    });
    await this.activityRepository.save(activity);

    return { board };
  }
}