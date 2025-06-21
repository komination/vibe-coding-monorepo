import { BoardMember, BoardRole } from '@/domain/entities/BoardMember';
import { Activity } from '@/domain/entities/Activity';
import { BoardRepository } from '@/domain/repositories/BoardRepository';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { ActivityRepository } from '@/domain/repositories/ActivityRepository';

export interface AddBoardMemberRequest {
  boardId: string;
  userId: string;
  memberUserId: string;
  role: BoardRole;
}

export interface AddBoardMemberResponse {
  member: BoardMember;
}

export class AddBoardMemberUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private userRepository: UserRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: AddBoardMemberRequest): Promise<AddBoardMemberResponse> {
    const { boardId, userId, memberUserId, role } = request;

    // Validate board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    if (board.isArchived) {
      throw new Error('Cannot add members to archived board');
    }

    // Validate requesting user has permission
    const userRole = await this.boardRepository.getMemberRole(boardId, userId);
    if (!board.isOwner(userId) && userRole !== 'ADMIN') {
      throw new Error('Insufficient permissions to add members');
    }

    // Validate member user exists
    const memberUser = await this.userRepository.findById(memberUserId);
    if (!memberUser) {
      throw new Error('User to be added not found');
    }

    if (!memberUser.isActive) {
      throw new Error('User account is inactive');
    }

    // Check if user is already a member
    const isAlreadyMember = await this.boardRepository.isMember(boardId, memberUserId);
    if (isAlreadyMember) {
      throw new Error('User is already a member of this board');
    }

    // Validate role
    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      throw new Error('Invalid role. Only ADMIN, MEMBER, or VIEWER roles can be assigned');
    }

    // Add member to board
    await this.boardRepository.addMember(boardId, memberUserId, role);

    // Get the newly added member data
    const members = await this.boardRepository.getMembers(boardId);
    const newMember = members.find(m => m.userId === memberUserId);
    if (!newMember) {
      throw new Error('Failed to retrieve added member');
    }

    // Log activity
    const activity = Activity.create({
      action: 'ADD_MEMBER',
      entityType: 'BOARD',
      entityId: boardId,
      entityTitle: board.title,
      userId,
      boardId,
      data: { memberUserId, role },
    });
    await this.activityRepository.save(activity);

    return { member: newMember };
  }
}