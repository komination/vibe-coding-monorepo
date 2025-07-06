import { Context } from 'hono';
import { CreateListUseCase } from '@kanban/use-cases';
import { GetListUseCase } from '@kanban/use-cases';
import { UpdateListUseCase } from '@kanban/use-cases';
import { DeleteListUseCase } from '@kanban/use-cases';
import { GetBoardListsUseCase } from '@kanban/use-cases';
import { ReorderListsUseCase } from '@kanban/use-cases';
import { ListValidator } from '@/application/validators/ListValidator';
import { ListResponseDto } from '@/interfaces/http/dto/ListDto';
import { List } from '@kanban/domain-core';

export class ListController {
  constructor(
    private createListUseCase: CreateListUseCase,
    private getListUseCase: GetListUseCase,
    private updateListUseCase: UpdateListUseCase,
    private deleteListUseCase: DeleteListUseCase,
    private getBoardListsUseCase: GetBoardListsUseCase,
    private reorderListsUseCase: ReorderListsUseCase
  ) {}

  async createList(c: Context) {
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
      const validation = ListValidator.validateCreateList(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.createListUseCase.execute({
        ...validation.data!,
        boardId,
        userId,
      });

      // Return response
      const response: ListResponseDto = this.mapListToResponse(result.list);
      return c.json(response, 201);

    } catch (error) {
      console.error('Error creating list:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getList(c: Context) {
    try {
      const listId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!listId) {
        return c.json({ error: 'List ID is required' }, 400);
      }

      // Execute use case
      const result = await this.getListUseCase.execute({
        listId,
        userId,
      });

      // Return response
      const response: ListResponseDto = this.mapListToResponse(result.list);
      return c.json(response);

    } catch (error) {
      console.error('Error getting list:', error);
      
      if (error instanceof Error) {
        if (error.message === 'List not found') {
          return c.json({ error: 'List not found' }, 404);
        }
        if (error.message === 'Access denied') {
          return c.json({ error: 'Access denied' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async updateList(c: Context) {
    try {
      const listId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!listId) {
        return c.json({ error: 'List ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = ListValidator.validateUpdateList(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.updateListUseCase.execute({
        listId,
        userId,
        ...validation.data!,
      });

      // Return response
      const response: ListResponseDto = this.mapListToResponse(result.list);
      return c.json(response);

    } catch (error) {
      console.error('Error updating list:', error);
      
      if (error instanceof Error) {
        if (error.message === 'List not found') {
          return c.json({ error: 'List not found' }, 404);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async deleteList(c: Context) {
    try {
      const listId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!listId) {
        return c.json({ error: 'List ID is required' }, 400);
      }

      // Execute use case
      await this.deleteListUseCase.execute({
        listId,
        userId,
      });

      // Return 204 No Content on successful deletion
      return c.body(null, 204);

    } catch (error) {
      console.error('Error deleting list:', error);
      
      if (error instanceof Error) {
        if (error.message === 'List not found') {
          return c.json({ error: 'List not found' }, 404);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getBoardLists(c: Context) {
    try {
      const boardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Get query parameters
      const orderBy = c.req.query('orderBy') as 'position' | 'title' | 'createdAt' | undefined;
      const order = c.req.query('order') as 'asc' | 'desc' | undefined;

      // Execute use case
      const result = await this.getBoardListsUseCase.execute({
        boardId,
        userId,
        orderBy,
        order,
      });

      // Return response
      const response = result.lists.map(list => this.mapListToResponse(list));
      return c.json(response);

    } catch (error) {
      console.error('Error getting board lists:', error);
      
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

  async reorderLists(c: Context) {
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
      const validation = ListValidator.validateReorderLists(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      await this.reorderListsUseCase.execute({
        boardId,
        listPositions: validation.data!.lists,
        userId,
      });

      // Return 200 OK on successful reorder
      return c.json({ message: 'Lists reordered successfully' });

    } catch (error) {
      console.error('Error reordering lists:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Board not found') {
          return c.json({ error: 'Board not found' }, 404);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  private mapListToResponse(list: List): ListResponseDto {
    const listData = list.toJSON();
    return {
      id: listData.id,
      title: listData.title,
      position: listData.position,
      color: listData.color,
      boardId: listData.boardId,
      createdAt: listData.createdAt.toISOString(),
      updatedAt: listData.updatedAt.toISOString(),
    };
  }
}