import { Context, Next } from "hono";
import { prismaTest } from "../setup";

/**
 * Mock authentication middleware for testing
 * Extracts user ID from Authorization header or creates test user
 */
export async function mockAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // For testing, we'll use the token to identify the user
  // In real tests, you'd decode a proper JWT
  const token = authHeader.substring(7);

  // Get or create test user based on token
  let user;
  if (token === "test-token") {
    // For legacy test-token, look for a user with a specific marker
    user = await prismaTest.user.findFirst({
      where: { 
        OR: [
          { name: "Test User" },
          { username: { startsWith: "testuser" } }
        ]
      },
      orderBy: { createdAt: 'asc' } // Use first created test user
    });
  } else {
    // Allow custom user tokens for testing different scenarios
    // Use the token directly as cognitoSub
    user = await prismaTest.user.findFirst({
      where: { cognitoSub: token },
    });
  }

  if (!user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  // Set user in context
  c.set("user", user);
  c.set("userId", user.id);

  await next();
}

/**
 * Create a mock auth token for a specific user
 */
export function createMockAuthToken(cognitoSub: string): string {
  return `Bearer ${cognitoSub}`;
}