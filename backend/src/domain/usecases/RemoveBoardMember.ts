import { Activity } from '@/domain/entities/Activity';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';

export interface RemoveBoardMemberRequest {
  boardId: string;
  userId: string;
  memberUserId: string;
}

export interface RemoveBoardMemberResponse {
  success: boolean;
}

export class RemoveBoardMemberUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private userRepository: UserRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: RemoveBoardMemberRequest): Promise<RemoveBoardMemberResponse> {
    const { boardId, userId, memberUserId } = request;

    // Validate board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    if (board.isArchived) {
      throw new Error('Cannot remove members from archived board');
    }

    // Validate requesting user has permission
    const userRole = await this.boardRepository.getMemberRole(boardId, userId);
    const isSelfRemoval = userId === memberUserId;
    
    // Allow self-removal, or require OWNER/ADMIN permissions
    if (!isSelfRemoval && !board.isOwner(userId) && userRole !== 'ADMIN') {
      throw new Error('Insufficient permissions to remove members');
    }

    // Validate member exists
    const memberUser = await this.userRepository.findById(memberUserId);
    if (!memberUser) {
      throw new Error('Member not found');
    }

    // Check if user is a member of the board
    const memberRole = await this.boardRepository.getMemberRole(boardId, memberUserId);
    if (!memberRole) {
      throw new Error('User is not a member of this board');
    }

    // Prevent removing the board owner
    if (board.isOwner(memberUserId)) {
      throw new Error('Cannot remove the board owner');
    }

    // Remove member from board
    await this.boardRepository.removeMember(boardId, memberUserId);

    // Log activity
    const activity = Activity.create({
      action: 'REMOVE_MEMBER',
      entityType: 'BOARD',
      entityId: boardId,
      entityTitle: board.title,
      userId,
      boardId,
      data: { 
        memberUserId, 
        removedRole: memberRole,
        selfRemoval: isSelfRemoval 
      },
    });
    await this.activityRepository.save(activity);

    return { success: true };
  }
}