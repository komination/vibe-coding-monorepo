import { Context, Next } from 'hono';
import { VerifyTokenUseCase } from '@/domain/usecases/VerifyToken';

// Factory function to create auth middleware with injected dependencies
export function createAuthMiddleware(verifyTokenUseCase: VerifyTokenUseCase) {
  return async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization header required' }, 401);
    }

    try {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const result = await verifyTokenUseCase.execute({ token });
      
      // Set user information in context
      c.set('userId', result.user.id);
      c.set('user', result.user);
      c.set('tokenPayload', result.payload);
      
      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Invalid token' || error.message === 'Token expired') {
          return c.json({ error: error.message }, 401);
        }
        if (error.message === 'User not found' || error.message === 'User account is inactive') {
          return c.json({ error: 'Access denied' }, 403);
        }
      }
      
      return c.json({ error: 'Authentication failed' }, 401);
    }
  };
}

// Factory function to create optional auth middleware
export function createOptionalAuthMiddleware(verifyTokenUseCase: VerifyTokenUseCase) {
  return async function optionalAuthMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const result = await verifyTokenUseCase.execute({ token });
        
        // Set user information in context
        c.set('userId', result.user.id);
        c.set('user', result.user);
        c.set('tokenPayload', result.payload);
      } catch (error) {
        // For optional auth, we just ignore errors and continue without setting user
        console.warn('Optional auth failed:', error);
      }
    }
    
    await next();
  };
}