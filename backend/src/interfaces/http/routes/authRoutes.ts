import { Hono } from 'hono';
import { AuthController } from '@/application/controllers/index';

export function createAuthRoutes(authController: AuthController) {
  const app = new Hono();

  // POST /api/auth/register - Register a new user
  app.post('/register', async (c) => {
    return authController.register(c);
  });

  // POST /api/auth/login - Login user
  app.post('/login', async (c) => {
    return authController.login(c);
  });

  // POST /api/auth/refresh - Refresh access token
  app.post('/refresh', async (c) => {
    return authController.refreshToken(c);
  });

  // POST /api/auth/logout - Logout user (client-side token removal)
  app.post('/logout', async (c) => {
    return authController.logout(c);
  });

  // GET /api/auth/me - Get current user profile (requires authentication)
  app.get('/me', async (c) => {
    return authController.getProfile(c);
  });

  return app;
}