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
  // Use Cognito-only authentication
  const authMiddleware = createAuthMiddleware(
    container.verifyCognitoTokenUseCase
  );
  
  app.use('*', authMiddleware);
  
  app.route('/auth', createAuthRoutes(container.authController));

  
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