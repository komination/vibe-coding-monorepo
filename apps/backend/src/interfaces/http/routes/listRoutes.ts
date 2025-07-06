import { Hono } from 'hono';
import { ListController } from '@/application/controllers/ListController';

export function createListRoutes(listController: ListController) {
  const app = new Hono();

  // GET /api/lists/:id - Get a specific list
  app.get('/:id', async (c) => {
    return listController.getList(c);
  });

  // PUT /api/lists/:id - Update a list
  app.put('/:id', async (c) => {
    return listController.updateList(c);
  });

  // DELETE /api/lists/:id - Delete a list
  app.delete('/:id', async (c) => {
    return listController.deleteList(c);
  });

  return app;
}