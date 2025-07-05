import { Context } from 'hono';
import { CreateCardUseCase } from '@/domain/usecases/CreateCard';
import { GetCard } from '@/domain/usecases/GetCard';
import { UpdateCard } from '@/domain/usecases/UpdateCard';
import { MoveCard } from '@/domain/usecases/MoveCard';
import { DeleteCard } from '@/domain/usecases/DeleteCard';
import { GetListCards } from '@/domain/usecases/GetListCards';
import { ArchiveCard } from '@/domain/usecases/ArchiveCard';
import { UnarchiveCard } from '@/domain/usecases/UnarchiveCard';
import { ReorderCards } from '@/domain/usecases/ReorderCards';
import { CardValidator } from '@/application/validators/CardValidator';
import { CardResponseDto, CardListResponseDto } from '@/interfaces/http/dto/CardDto';
import { Card } from '@kanban/domain-core';

export class CardController {
  constructor(
    private createCardUseCase: CreateCardUseCase,
    private getCardUseCase: GetCard,
    private updateCardUseCase: UpdateCard,
    private moveCardUseCase: MoveCard,
    private deleteCardUseCase: DeleteCard,
    private getListCardsUseCase: GetListCards,
    private archiveCardUseCase: ArchiveCard,
    private unarchiveCardUseCase: UnarchiveCard,
    private reorderCardsUseCase: ReorderCards
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

      // Execute use case
      const card = await this.getCardUseCase.execute(cardId, userId);
      
      // Return response
      const response: CardResponseDto = this.mapCardToResponse(card);
      return c.json(response);

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

      // Execute use case
      const updatedCard = await this.updateCardUseCase.execute(
        cardId,
        userId,
        {
          title: validation.data!.title,
          description: validation.data!.description,
          dueDate: validation.data!.dueDate ? new Date(validation.data!.dueDate) : null,
          startDate: validation.data!.startDate ? new Date(validation.data!.startDate) : null,
          assignedToId: validation.data!.assigneeId,
          archived: validation.data!.isArchived,
        }
      );
      
      // Return response
      const response: CardResponseDto = this.mapCardToResponse(updatedCard);
      return c.json(response);

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

      // Execute use case
      const movedCard = await this.moveCardUseCase.execute(
        cardId,
        userId,
        validation.data!.listId,
        validation.data!.position
      );
      
      // Return response
      const response: CardResponseDto = this.mapCardToResponse(movedCard);
      return c.json(response);

    } catch (error) {
      console.error('Error moving card:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async deleteCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Execute use case
      await this.deleteCardUseCase.execute(cardId, userId);
      
      // Return success response
      return c.json({ message: 'Card deleted successfully' }, 200);

    } catch (error) {
      console.error('Error deleting card:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async archiveCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Execute use case
      const archivedCard = await this.archiveCardUseCase.execute(cardId, userId);
      
      // Return response
      const response: CardResponseDto = this.mapCardToResponse(archivedCard);
      return c.json(response);

    } catch (error) {
      console.error('Error archiving card:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
        if (error.message === 'Card is already archived') {
          return c.json({ error: error.message }, 400);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async unarchiveCard(c: Context) {
    try {
      const cardId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Execute use case
      const unarchivedCard = await this.unarchiveCardUseCase.execute(cardId, userId);
      
      // Return response
      const response: CardResponseDto = this.mapCardToResponse(unarchivedCard);
      return c.json(response);

    } catch (error) {
      console.error('Error unarchiving card:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
        if (error.message === 'Card is not archived') {
          return c.json({ error: error.message }, 400);
        }
        if (error.message.includes('permission')) {
          return c.json({ error: error.message }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getListCards(c: Context) {
    try {
      const listId = c.req.param('listId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!listId) {
        return c.json({ error: 'List ID is required' }, 400);
      }

      // Execute use case
      const cards = await this.getListCardsUseCase.execute(listId, userId);
      
      // Return response
      const response: CardListResponseDto = {
        cards: cards.map(card => this.mapCardToResponse(card)),
        total: cards.length
      };
      return c.json(response);

    } catch (error) {
      console.error('Error getting list cards:', error);
      
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