import { Hono } from 'hono';
import { BoardController } from '@/application/controllers/index';

export function createBoardRoutes(boardController: BoardController) {
  const app = new Hono();

  // POST /api/boards - Create a new board
  app.post('/', async (c) => {
    return boardController.createBoard(c);
  });

  // GET /api/boards/:id - Get a specific board
  app.get('/:id', async (c) => {
    return boardController.getBoard(c);
  });

  // PUT /api/boards/:id - Update a board
  app.put('/:id', async (c) => {
    return boardController.updateBoard(c);
  });

  // DELETE /api/boards/:id - Delete a board (TODO: implement use case and controller method)
  app.delete('/:id', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/boards/:id/members - Add a member to the board (TODO: implement)
  app.post('/:id/members', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // PUT /api/boards/:id/members/:userId - Update member role (TODO: implement)
  app.put('/:id/members/:userId', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // DELETE /api/boards/:id/members/:userId - Remove member from board (TODO: implement)
  app.delete('/:id/members/:userId', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // GET /api/boards/:id/lists - Get all lists in a board (TODO: implement)
  app.get('/:id/lists', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  // POST /api/boards/:id/lists - Create a new list in the board (TODO: implement)
  app.post('/:id/lists', async (c) => {
    return c.json({ error: 'Not implemented yet' }, 501);
  });

  return app;
}