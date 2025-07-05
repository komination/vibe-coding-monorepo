import { BoardMember, BoardRole } from '@kanban/domain-core';
import { Activity } from '@kanban/domain-core';
import { BoardRepository } from '@kanban/domain-core';
import { UserRepository } from '@kanban/domain-core';
import { ActivityRepository } from '@kanban/domain-core';

export interface UpdateMemberRoleRequest {
  boardId: string;
  userId: string;
  memberUserId: string;
  newRole: BoardRole;
}

export interface UpdateMemberRoleResponse {
  member: BoardMember;
}

export class UpdateMemberRoleUseCase {
  constructor(
    private boardRepository: BoardRepository,
    private userRepository: UserRepository,
    private activityRepository: ActivityRepository
  ) {}

  async execute(request: UpdateMemberRoleRequest): Promise<UpdateMemberRoleResponse> {
    const { boardId, userId, memberUserId, newRole } = request;

    // Validate board exists
    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    if (board.isArchived) {
      throw new Error('Cannot update member roles in archived board');
    }

    // Validate requesting user has permission
    const userRole = await this.boardRepository.getMemberRole(boardId, userId);
    if (!board.isOwner(userId) && userRole !== 'ADMIN') {
      throw new Error('Insufficient permissions to update member roles');
    }

    // Validate member exists
    const memberUser = await this.userRepository.findById(memberUserId);
    if (!memberUser) {
      throw new Error('Member not found');
    }

    // Check if user is a member of the board
    const currentRole = await this.boardRepository.getMemberRole(boardId, memberUserId);
    if (!currentRole) {
      throw new Error('User is not a member of this board');
    }

    // Prevent demoting the board owner
    if (board.isOwner(memberUserId)) {
      throw new Error('Cannot change the role of the board owner');
    }

    // Prevent non-owners from creating new owners
    if (newRole === 'OWNER') {
      throw new Error('Only the board owner can transfer ownership');
    }

    // Validate new role
    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(newRole)) {
      throw new Error('Invalid role. Valid roles are: ADMIN, MEMBER, VIEWER');
    }

    // Check if role is actually changing
    if (currentRole === newRole) {
      throw new Error('Member already has this role');
    }

    // Update member role
    await this.boardRepository.updateMemberRole(boardId, memberUserId, newRole);

    // Get the updated member data
    const members = await this.boardRepository.getMembers(boardId);
    const updatedMember = members.find(m => m.userId === memberUserId);
    if (!updatedMember) {
      throw new Error('Failed to retrieve updated member');
    }

    // Log activity
    const activity = Activity.create({
      action: 'UPDATE',
      entityType: 'BOARD',
      entityId: boardId,
      entityTitle: board.title,
      userId,
      boardId,
      data: { memberUserId, oldRole: currentRole, newRole },
    });
    await this.activityRepository.save(activity);

    return { member: updatedMember };
  }
}