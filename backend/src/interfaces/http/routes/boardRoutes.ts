import { Hono } from 'hono';
import { BoardController, ListController } from '@/application/controllers/index';

export function createBoardRoutes(boardController: BoardController, listController: ListController) {
  const app = new Hono();

  // GET /api/boards - Get user's boards
  app.get('/', async (c) => {
    return boardController.getUserBoards(c);
  });

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

  // DELETE /api/boards/:id - Delete a board
  app.delete('/:id', async (c) => {
    return boardController.deleteBoard(c);
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

  // GET /api/boards/:id/lists - Get all lists in a board
  app.get('/:id/lists', async (c) => {
    return listController.getBoardLists(c);
  });

  // POST /api/boards/:id/lists - Create a new list in the board
  app.post('/:id/lists', async (c) => {
    return listController.createList(c);
  });

  // PUT /api/boards/:id/lists/reorder - Reorder lists in a board
  app.put('/:id/lists/reorder', async (c) => {
    return listController.reorderLists(c);
  });

  return app;
}