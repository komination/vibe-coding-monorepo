import { Hono } from 'hono';
import { LabelController } from '@/application/controllers/LabelController';

export function createLabelRoutes(labelController: LabelController) {
  const app = new Hono();

  // Board Label Routes
  // POST /api/boards/:boardId/labels - Create a new label for a board
  app.post('/boards/:boardId/labels', async (c) => {
    return labelController.createLabel(c);
  });

  // GET /api/boards/:boardId/labels - Get all labels for a board
  app.get('/boards/:boardId/labels', async (c) => {
    return labelController.getBoardLabels(c);
  });

  // PUT /api/labels/:id - Update a label
  app.put('/:id', async (c) => {
    return labelController.updateLabel(c);
  });

  // DELETE /api/labels/:id - Delete a label
  app.delete('/:id', async (c) => {
    return labelController.deleteLabel(c);
  });

  // Card Label Association Routes
  // POST /api/cards/:cardId/labels - Add a label to a card
  app.post('/cards/:cardId/labels', async (c) => {
    return labelController.addLabelToCard(c);
  });

  // GET /api/cards/:cardId/labels - Get all labels for a card
  app.get('/cards/:cardId/labels', async (c) => {
    return labelController.getCardLabels(c);
  });

  // DELETE /api/cards/:cardId/labels/:labelId - Remove a label from a card
  app.delete('/cards/:cardId/labels/:labelId', async (c) => {
    return labelController.removeLabelFromCard(c);
  });

  return app;
}