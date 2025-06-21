import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { createContainer } from '@/infrastructure/di/container';
import { createAuthMiddleware } from '@/interfaces/http/middleware/auth';

// Import route creators
import { createBoardRoutes } from '@/interfaces/http/routes/boardRoutes';
import { createCardRoutes } from '@/interfaces/http/routes/cardRoutes';
import { createListRoutes } from '@/interfaces/http/routes/listRoutes';
import { createAuthRoutes } from '@/interfaces/http/routes/authRoutes';
import { createLabelRoutes } from '@/interfaces/http/routes/labelRoutes';

export function createApiRoutes(prisma: PrismaClient) {
  const app = new Hono();
  
  // Create DI container
  const container = createContainer(prisma);
  
  // Create auth middleware with injected dependencies
  const authMiddleware = createAuthMiddleware(container.verifyTokenUseCase);
  
  // Register routes
  
  // Public routes (no authentication required)
  app.route('/auth', createAuthRoutes(container.authController));
  
  // Protected routes (authentication required)
  app.use('/boards/*', authMiddleware);
  app.use('/cards/*', authMiddleware);
  app.use('/lists/*', authMiddleware);
  app.use('/labels/*', authMiddleware);
  
  // Protected auth routes (user profile management)
  app.use('/auth/me', authMiddleware);
  app.use('/auth/profile', authMiddleware);
  app.use('/auth/password', authMiddleware);
  
  app.route('/boards', createBoardRoutes(container.boardController, container.listController));
  app.route('/cards', createCardRoutes(container.cardController));
  app.route('/lists', createListRoutes(container.listController));
  app.route('/labels', createLabelRoutes(container.labelController));

  // Health check endpoint
  app.get('/health', (c) => {
    return c.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  return app;
}