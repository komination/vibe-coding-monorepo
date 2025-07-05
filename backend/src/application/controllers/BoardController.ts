import { Context } from 'hono';
import { CreateBoardUseCase } from '@/domain/usecases/CreateBoard';
import { GetBoardUseCase } from '@/domain/usecases/GetBoard';
import { UpdateBoardUseCase } from '@/domain/usecases/UpdateBoard';
import { DeleteBoardUseCase } from '@/domain/usecases/DeleteBoard';
import { GetUserBoardsUseCase } from '@/domain/usecases/GetUserBoards';
import { AddBoardMemberUseCase } from '@/domain/usecases/AddBoardMember';
import { UpdateMemberRoleUseCase } from '@/domain/usecases/UpdateMemberRole';
import { RemoveBoardMemberUseCase } from '@/domain/usecases/RemoveBoardMember';
import { BoardValidator } from '@/application/validators/BoardValidator';
import { BoardResponseDto } from '@/interfaces/http/dto/BoardDto';
import { Board } from '@kanban/domain-core';

export class BoardController {
  constructor(
    private createBoardUseCase: CreateBoardUseCase,
    private getBoardUseCase: GetBoardUseCase,
    private updateBoardUseCase: UpdateBoardUseCase,
    private deleteBoardUseCase: DeleteBoardUseCase,
    private getUserBoardsUseCase: GetUserBoardsUseCase,
    private addBoardMemberUseCase: AddBoardMemberUseCase,
    private updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private removeBoardMemberUseCase: RemoveBoardMemberUseCase
  ) {}

  async createBoard(c: Context) {
    try {
      // Get user ID from context (will be set by auth middleware)
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = BoardValidator.validateCreateBoard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.createBoardUseCase.execute({
        ...validation.data!,
        ownerId: userId,
      });

      // Return response
      const response: BoardResponseDto = this.mapBoardToResponse(result.board, 'OWNER');
      return c.json(response, 201);

    } catch (error) {
      console.error('Error creating board:', error);
      
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getBoard(c: Context) {
    try {
      const boardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Execute use case
      const result = await this.getBoardUseCase.execute({
        boardId,
        userId,
      });

      // Return response
      const response: BoardResponseDto = this.mapBoardToResponse(result.board, result.userRole);
      return c.json(response);

    } catch (error) {
      console.error('Error getting board:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Access denied') {
          return c.json({ error: 'Access denied' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async updateBoard(c: Context) {
    try {
      const boardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = BoardValidator.validateUpdateBoard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.updateBoardUseCase.execute({
        boardId,
        userId,
        ...validation.data!,
      });

      // Get user role for response
      const getUserBoardResult = await this.getBoardUseCase.execute({
        boardId,
        userId,
      });

      // Return response
      const response: BoardResponseDto = this.mapBoardToResponse(result.board, getUserBoardResult.userRole);
      return c.json(response);

    } catch (error) {
      console.error('Error updating board:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Access denied') {
          return c.json({ error: 'Access denied' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async deleteBoard(c: Context) {
    try {
      const boardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Execute use case
      await this.deleteBoardUseCase.execute({
        boardId,
        userId,
      });

      // Return success response
      return c.json({ message: 'Board deleted successfully' }, 200);

    } catch (error) {
      console.error('Error deleting board:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Only board owners can delete boards') {
          return c.json({ error: 'Only board owners can delete boards' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getUserBoards(c: Context) {
    try {
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Get query parameters
      const includeArchived = c.req.query('includeArchived') === 'true';
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined;
      const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : undefined;

      // Execute use case
      const result = await this.getUserBoardsUseCase.execute({
        userId,
        includeArchived,
        limit,
        offset,
      });

      // Map response - for member boards, we don't know the exact role without additional queries
      // so we'll use 'MEMBER' as a default for now
      const response = {
        ownedBoards: result.ownedBoards.map(board => this.mapBoardToResponse(board, 'OWNER')),
        memberBoards: result.memberBoards.map(board => this.mapBoardToResponse(board, 'MEMBER')),
        totalCount: result.totalCount,
      };

      return c.json(response);

    } catch (error) {
      console.error('Error getting user boards:', error);
      
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return c.json({ error: 'User not found' }, 404);
        }
        if (error.message === 'User account is inactive') {
          return c.json({ error: 'Account is inactive' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async addMember(c: Context) {
    try {
      const boardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = BoardValidator.validateAddMember(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.addBoardMemberUseCase.execute({
        boardId,
        userId,
        memberUserId: validation.data!.userId,
        role: validation.data!.role,
      });

      // Return response
      return c.json({
        member: {
          userId: result.member.userId,
          role: result.member.role,
          joinedAt: result.member.joinedAt.toISOString(),
        }
      }, 201);

    } catch (error) {
      console.error('Error adding member:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Insufficient permissions to add members') {
          return c.json({ error: 'Insufficient permissions' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async updateMemberRole(c: Context) {
    try {
      const boardId = c.req.param('id');
      const memberUserId = c.req.param('userId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId || !memberUserId) {
        return c.json({ error: 'Board ID and User ID are required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = BoardValidator.validateUpdateMember(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.updateMemberRoleUseCase.execute({
        boardId,
        userId,
        memberUserId,
        newRole: validation.data!.role,
      });

      // Return response
      return c.json({
        member: {
          userId: result.member.userId,
          role: result.member.role,
          joinedAt: result.member.joinedAt.toISOString(),
        }
      });

    } catch (error) {
      console.error('Error updating member role:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Member not found') {
          return c.json({ error: 'Member not found' }, 404);
        }
        if (error.message === 'Insufficient permissions to update member roles') {
          return c.json({ error: 'Insufficient permissions' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async removeMember(c: Context) {
    try {
      const boardId = c.req.param('id');
      const memberUserId = c.req.param('userId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId || !memberUserId) {
        return c.json({ error: 'Board ID and User ID are required' }, 400);
      }

      // Execute use case
      await this.removeBoardMemberUseCase.execute({
        boardId,
        userId,
        memberUserId,
      });

      // Return success response
      return c.json({ message: 'Member removed successfully' });

    } catch (error) {
      console.error('Error removing member:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message === 'Member not found') {
          return c.json({ error: 'Member not found' }, 404);
        }
        if (error.message === 'Insufficient permissions to remove members') {
          return c.json({ error: 'Insufficient permissions' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  private mapBoardToResponse(board: Board, userRole: string): BoardResponseDto {
    const boardData = board.toJSON();
    return {
      id: boardData.id,
      title: boardData.title,
      description: boardData.description,
      backgroundUrl: boardData.backgroundUrl,
      isPublic: boardData.isPublic,
      isArchived: boardData.isArchived,
      ownerId: boardData.ownerId,
      userRole,
      createdAt: boardData.createdAt.toISOString(),
      updatedAt: boardData.updatedAt.toISOString(),
    };
  }
}