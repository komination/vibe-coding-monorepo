import { Hono } from 'hono';
import { AuthController } from '@/application/controllers/AuthController';

export function createAuthRoutes(authController: AuthController) {
  const app = new Hono();

  // POST /api/auth/logout - Logout user (client-side token removal)
  app.post('/logout', async (c) => {
    return authController.logout(c);
  });

  // GET /api/auth/profile - Get user profile (requires authentication)
  app.get('/profile', async (c) => {
    return authController.getProfile(c);
  });

  // PUT /api/auth/profile - Update user profile (requires authentication)
  app.put('/profile', async (c) => {
    return authController.updateProfile(c);
  });

  return app;
}