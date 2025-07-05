import { Context } from 'hono';
import { CreateLabelUseCase } from '@/domain/usecases/CreateLabel';
import { GetBoardLabelsUseCase } from '@/domain/usecases/GetBoardLabels';
import { UpdateLabelUseCase } from '@/domain/usecases/UpdateLabel';
import { DeleteLabelUseCase } from '@/domain/usecases/DeleteLabel';
import { AddLabelToCardUseCase } from '@/domain/usecases/AddLabelToCard';
import { RemoveLabelFromCardUseCase } from '@/domain/usecases/RemoveLabelFromCard';
import { GetCardLabelsUseCase } from '@/domain/usecases/GetCardLabels';
import { LabelValidator } from '@/application/validators/LabelValidator';
import { LabelResponseDto } from '@/interfaces/http/dto/LabelDto';
import { Label } from '@kanban/domain-core';

export class LabelController {
  constructor(
    private createLabelUseCase: CreateLabelUseCase,
    private getBoardLabelsUseCase: GetBoardLabelsUseCase,
    private updateLabelUseCase: UpdateLabelUseCase,
    private deleteLabelUseCase: DeleteLabelUseCase,
    private addLabelToCardUseCase: AddLabelToCardUseCase,
    private removeLabelFromCardUseCase: RemoveLabelFromCardUseCase,
    private getCardLabelsUseCase: GetCardLabelsUseCase
  ) {}

  async createLabel(c: Context) {
    try {
      const boardId = c.req.param('boardId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = LabelValidator.validateCreateLabel(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.createLabelUseCase.execute({
        ...validation.data!,
        boardId,
        userId,
      });

      // Return response
      const response: LabelResponseDto = this.mapLabelToResponse(result.label);
      return c.json(response, 201);

    } catch (error) {
      console.error('Error creating label:', error);
      
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

  async getBoardLabels(c: Context) {
    try {
      const boardId = c.req.param('boardId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!boardId) {
        return c.json({ error: 'Board ID is required' }, 400);
      }

      // Execute use case
      const result = await this.getBoardLabelsUseCase.execute({
        boardId,
        userId,
      });

      // Return response
      const response = result.labels.map(label => this.mapLabelToResponse(label));
      return c.json(response);

    } catch (error) {
      console.error('Error getting board labels:', error);
      
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

  async updateLabel(c: Context) {
    try {
      const labelId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!labelId) {
        return c.json({ error: 'Label ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = LabelValidator.validateUpdateLabel(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      const result = await this.updateLabelUseCase.execute({
        labelId,
        userId,
        ...validation.data!,
      });

      // Return response
      const response: LabelResponseDto = this.mapLabelToResponse(result.label);
      return c.json(response);

    } catch (error) {
      console.error('Error updating label:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Label not found') {
          return c.json({ error: 'Label not found' }, 404);
        }
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

  async deleteLabel(c: Context) {
    try {
      const labelId = c.req.param('id');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!labelId) {
        return c.json({ error: 'Label ID is required' }, 400);
      }

      // Execute use case
      await this.deleteLabelUseCase.execute({
        labelId,
        userId,
      });

      // Return success response
      return c.json({ message: 'Label deleted successfully' }, 200);

    } catch (error) {
      console.error('Error deleting label:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Label not found') {
          return c.json({ error: 'Label not found' }, 404);
        }
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

  async addLabelToCard(c: Context) {
    try {
      const cardId = c.req.param('cardId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = LabelValidator.validateAddLabelToCard(body);
      
      if (!validation.success) {
        return c.json({ 
          error: 'Validation failed', 
          details: validation.errors 
        }, 400);
      }

      // Execute use case
      await this.addLabelToCardUseCase.execute({
        cardId,
        labelId: validation.data!.labelId,
        userId,
      });

      // Return success response
      return c.json({ message: 'Label added to card successfully' }, 200);

    } catch (error) {
      console.error('Error adding label to card:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
        if (error.message === 'Label not found') {
          return c.json({ error: 'Label not found' }, 404);
        }
        if (error.message === 'Label does not belong to the same board as the card') {
          return c.json({ error: 'Label does not belong to the same board as the card' }, 400);
        }
        if (error.message === 'Label is already attached to this card') {
          return c.json({ error: 'Label is already attached to this card' }, 400);
        }
        if (error.message === 'Access denied') {
          return c.json({ error: 'Access denied' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async removeLabelFromCard(c: Context) {
    try {
      const cardId = c.req.param('cardId');
      const labelId = c.req.param('labelId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      if (!labelId) {
        return c.json({ error: 'Label ID is required' }, 400);
      }

      // Execute use case
      await this.removeLabelFromCardUseCase.execute({
        cardId,
        labelId,
        userId,
      });

      // Return success response
      return c.json({ message: 'Label removed from card successfully' }, 200);

    } catch (error) {
      console.error('Error removing label from card:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
        if (error.message === 'Label not found') {
          return c.json({ error: 'Label not found' }, 404);
        }
        if (error.message === 'Label is not attached to this card') {
          return c.json({ error: 'Label is not attached to this card' }, 400);
        }
        if (error.message === 'Access denied') {
          return c.json({ error: 'Access denied' }, 403);
        }
        return c.json({ error: error.message }, 400);
      }
      
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  async getCardLabels(c: Context) {
    try {
      const cardId = c.req.param('cardId');
      const userId = c.get('userId');
      
      if (!userId) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      if (!cardId) {
        return c.json({ error: 'Card ID is required' }, 400);
      }

      // Execute use case
      const result = await this.getCardLabelsUseCase.execute({
        cardId,
        userId,
      });

      // Return response
      const response = result.labels.map(label => this.mapLabelToResponse(label));
      return c.json(response);

    } catch (error) {
      console.error('Error getting card labels:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Card not found') {
          return c.json({ error: 'Card not found' }, 404);
        }
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

  private mapLabelToResponse(label: Label): LabelResponseDto {
    const labelData = label.toJSON();
    return {
      id: labelData.id,
      name: labelData.name,
      color: labelData.color,
      boardId: labelData.boardId,
      createdAt: labelData.createdAt.toISOString(),
    };
  }
}