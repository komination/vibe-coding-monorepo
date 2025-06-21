import { Hono } from 'hono';
import { AuthController } from '@/application/controllers/AuthController';
import { authRateLimiter, registrationRateLimiter, refreshTokenRateLimiter, createLoginRateLimitMiddleware } from '@/interfaces/http/middleware/rateLimit';

export function createAuthRoutes(authController: AuthController) {
  const app = new Hono();

  // Create login rate limiter instance
  const loginRateLimiter = createLoginRateLimitMiddleware();

  // POST /api/auth/register - Register a new user
  app.post('/register', registrationRateLimiter, async (c) => {
    return authController.register(c);
  });

  // POST /api/auth/login - Login user
  app.post('/login', authRateLimiter, loginRateLimiter, async (c) => {
    return authController.login(c);
  });

  // POST /api/auth/refresh - Refresh access token
  app.post('/refresh', refreshTokenRateLimiter, async (c) => {
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

  // PUT /api/auth/profile - Update user profile (requires authentication)
  app.put('/profile', async (c) => {
    return authController.updateProfile(c);
  });

  // PUT /api/auth/password - Change user password (requires authentication)
  app.put('/password', async (c) => {
    return authController.changePassword(c);
  });

  return app;
}