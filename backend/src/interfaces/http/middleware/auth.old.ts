import { Context, Next } from 'hono';
import { VerifyTokenUseCase } from '@/domain/usecases/VerifyToken';

// Store the verify token use case instance
let verifyTokenUseCase: VerifyTokenUseCase | null = null;

// Initialize the auth middleware with dependencies
export function initializeAuthMiddleware(verifyTokenUseCaseInstance: VerifyTokenUseCase) {
  verifyTokenUseCase = verifyTokenUseCaseInstance;
}

// Required authentication middleware
export async function authMiddleware(c: Context, next: Next) {
  if (!verifyTokenUseCase) {
    throw new Error('Auth middleware not initialized. Call initializeAuthMiddleware first.');
  }

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
}

// Optional authentication - doesn't require auth but sets userId if available
export async function optionalAuthMiddleware(c: Context, next: Next) {
  if (!verifyTokenUseCase) {
    // If auth middleware is not initialized, just continue without setting user
    await next();
    return;
  }

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
}