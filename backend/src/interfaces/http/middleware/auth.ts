import { Context, Next } from 'hono';

// Temporary auth middleware - just sets a dummy user ID
// TODO: Implement proper JWT authentication
export async function authMiddleware(c: Context, next: Next) {
  // For development, we'll use a dummy user ID
  // In production, this should validate JWT tokens and extract user info
  
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development, allow requests without auth but set a default user
    // TODO: Remove this and require proper authentication
    c.set('userId', 'demo-user-id');
    await next();
    return;
  }

  // TODO: Implement JWT token validation
  // const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  // const decoded = jwt.verify(token, JWT_SECRET);
  // c.set('userId', decoded.userId);
  
  // For now, just set a dummy user ID
  c.set('userId', 'demo-user-id');
  await next();
}

// Optional authentication - doesn't require auth but sets userId if available
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // TODO: Implement JWT token validation
    c.set('userId', 'demo-user-id');
  }
  
  await next();
}