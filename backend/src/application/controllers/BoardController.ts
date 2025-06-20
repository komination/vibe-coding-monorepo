import { Context } from 'hono';
import { CreateBoardUseCase } from '@/domain/usecases/CreateBoard';
import { GetBoardUseCase } from '@/domain/usecases/GetBoard';
import { UpdateBoardUseCase } from '@/domain/usecases/UpdateBoard';
import { BoardValidator } from '@/application/validators/BoardValidator';
import { BoardResponseDto, CreateBoardDto, UpdateBoardDto } from '@/interfaces/http/dto/BoardDto';
import { Board } from '@/domain/entities/Board';

export class BoardController {
  constructor(
    private createBoardUseCase: CreateBoardUseCase,
    private getBoardUseCase: GetBoardUseCase,
    private updateBoardUseCase: UpdateBoardUseCase
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