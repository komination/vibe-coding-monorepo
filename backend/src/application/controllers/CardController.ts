import { Context } from 'hono';
import { CreateCardUseCase } from '@/domain/usecases/CreateCard';
import { CardValidator } from '@/application/validators/CardValidator';
import { CardResponseDto } from '@/interfaces/http/dto/CardDto';
import { Card } from '@/domain/entities/Card';

export class CardController {
  constructor(
    private createCardUseCase: CreateCardUseCase
  ) {}

  async createCard(c: Context) {
    try {
      // Get user ID from context (will be set by auth middleware)
      const userId = c.get('userId');
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const listId = c.req.param('listId');
      if (!listId) {
        return c.json({ error: 'List ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = CardValidator.validateCreateCard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const cardData = validation.data!;
      const result = await this.createCardUseCase.execute({
        title: cardData.title,
        description: cardData.description,
        listId,
        creatorId: userId,
        assigneeId: cardData.assigneeId,
        dueDate: cardData.dueDate ? new Date(cardData.dueDate) : undefined,
        startDate: cardData.startDate ? new Date(cardData.startDate) : undefined,
      });

      // Return response
      const response: CardResponseDto = this.mapCardToResponse(result.card);
      return c.json(response, 201);

    } catch (error) {
      console.error('Error creating card:', error);
      
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

  async getCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // TODO: Implement GetCardUseCase and add permission checking
      // For now, return a placeholder response
      return c.json({ error: 'Not implemented yet' }, 501);

    } catch (error) {
      console.error('Error getting card:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async updateCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = CardValidator.validateUpdateCard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // TODO: Implement UpdateCardUseCase
      // For now, return a placeholder response
      return c.json({ error: 'Not implemented yet' }, 501);

    } catch (error) {
      console.error('Error updating card:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async moveCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = CardValidator.validateMoveCard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // TODO: Implement MoveCardUseCase
      // For now, return a placeholder response
      return c.json({ error: 'Not implemented yet' }, 501);

    } catch (error) {
      console.error('Error moving card:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  private mapCardToResponse(card: Card): CardResponseDto {
    const cardData = card.toJSON();
    return {
      id: cardData.id,
      title: cardData.title,
      description: cardData.description,
      position: cardData.position,
      dueDate: cardData.dueDate?.toISOString(),
      startDate: cardData.startDate?.toISOString(),
      isArchived: cardData.isArchived,
      coverUrl: cardData.coverUrl,
      listId: cardData.listId,
      creatorId: cardData.creatorId,
      assigneeId: cardData.assigneeId,
      createdAt: cardData.createdAt.toISOString(),
      updatedAt: cardData.updatedAt.toISOString(),
      isOverdue: cardData.dueDate ? new Date() > cardData.dueDate : false,
    };
  }
}