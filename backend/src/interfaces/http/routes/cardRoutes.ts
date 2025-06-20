import { Hono } from 'hono';
import { CardController } from '@/application/controllers/index';

export function createCardRoutes(cardController: CardController) {
  const app = new Hono();

  // POST /api/lists/:listId/cards - Create a new card in a list
  app.post('/lists/:listId/cards', async (c) => {
    return cardController.createCard(c);
  });

  // GET /api/cards/:id - Get a specific card
  app.get('/:id', async (c) => {
    return cardController.getCard(c);
  });

  // PUT /api/cards/:id - Update a card
  app.put('/:id', async (c) => {
    return cardController.updateCard(c);
  });

  // PUT /api/cards/:id/move - Move card to different list/position
  app.put('/:id/move', async (c) => {
    return cardController.moveCard(c);
  });

  // DELETE /api/cards/:id - Delete a card (TODO: implement)
  app.delete('/:id', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/cards/:id/archive - Archive a card (TODO: implement)
  app.post('/:id/archive', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/cards/:id/unarchive - Unarchive a card (TODO: implement)
  app.post('/:id/unarchive', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // GET /api/cards/:id/comments - Get card comments (TODO: implement)
  app.get('/:id/comments', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/cards/:id/comments - Add a comment to card (TODO: implement)
  app.post('/:id/comments', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // GET /api/cards/:id/attachments - Get card attachments (TODO: implement)
  app.get('/:id/attachments', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/cards/:id/attachments - Add attachment to card (TODO: implement)
  app.post('/:id/attachments', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  return app;
}