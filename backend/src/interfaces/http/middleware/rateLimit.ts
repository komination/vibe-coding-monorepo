import { Context, Next } from 'hono';
import { TooManyRequestsError } from '@/application/errors/ApplicationError';
import { appConfig } from '@/infrastructure/config/env';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (c: Context) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  increment(key: string): Promise<{ count: number; resetTime: number }>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
}

// In-memory store for rate limiting
class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime <= now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async increment(key: string): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || existing.resetTime <= now) {
      const resetTime = now + 900000; // 15 minutes default
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    existing.count++;
    return existing;
  }

  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global store instance
const globalStore = new InMemoryRateLimitStore();

// Default key generator (by IP)
const defaultKeyGenerator = (c: Context): string => {
  const forwarded = c.req.header('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : c.req.header('remote-addr') || 'unknown';
  return `rate-limit:${ip}`;
};

// Factory function to create rate limit middleware
export function createRateLimitMiddleware(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async function rateLimitMiddleware(c: Context, next: Next) {
    const key = keyGenerator(c);
    
    // Increment counter
    const { count, resetTime } = await globalStore.increment(key);
    
    // Calculate remaining requests
    const remaining = Math.max(0, max - count);
    const resetSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetTime.toString());
    
    // Check if limit exceeded
    if (count > max) {
      c.header('Retry-After', resetSeconds.toString());
      throw new TooManyRequestsError(message, resetSeconds);
    }
    
    try {
      await next();
      
      // Decrement counter if configured to skip successful requests
      if (skipSuccessfulRequests && c.res.status < 400) {
        await globalStore.decrement(key);
      }
    } catch (error) {
      // Decrement counter if configured to skip failed requests
      if (skipFailedRequests && c.res.status >= 400) {
        await globalStore.decrement(key);
      }
      throw error;
    }
  };
}

// Specific middleware for login attempts with user-based limiting
export function createLoginRateLimitMiddleware() {
  const store = new Map<string, { attempts: number; lockedUntil?: number }>();
  
  return async function loginRateLimitMiddleware(c: Context, next: Next) {
    const body = await c.req.json().catch(() => ({}));
    const identifier = body.identifier || body.email || body.username;
    
    if (!identifier) {
      await next();
      return;
    }
    
    const key = `login:${identifier.toLowerCase()}`;
    const now = Date.now();
    const record = store.get(key) || { attempts: 0 };
    
    // Check if account is locked
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      c.header('Retry-After', remainingSeconds.toString());
      throw new TooManyRequestsError(
        `Account locked due to too many failed login attempts. Try again in ${remainingSeconds} seconds.`,
        remainingSeconds
      );
    }
    
    try {
      await next();
      
      // Reset attempts on successful login
      if (c.res.status === 200) {
        store.delete(key);
      } else if (c.res.status === 401) {
        // Increment failed attempts
        record.attempts++;
        
        if (record.attempts >= appConfig.maxLoginAttempts) {
          // Lock account
          record.lockedUntil = now + (appConfig.loginLockoutDuration * 60 * 1000);
          store.set(key, record);
          
          const lockDurationMinutes = appConfig.loginLockoutDuration;
          throw new TooManyRequestsError(
            `Account locked for ${lockDurationMinutes} minutes due to ${appConfig.maxLoginAttempts} failed login attempts.`,
            lockDurationMinutes * 60
          );
        } else {
          store.set(key, record);
          // Add remaining attempts to response
          c.header('X-Login-Attempts-Remaining', (appConfig.maxLoginAttempts - record.attempts).toString());
        }
      }
    } catch (error) {
      throw error;
    }
  };
}

// Pre-configured rate limiters for common endpoints
export const authRateLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication requests from this IP, please try again later.',
});

export const registrationRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many registration attempts from this IP, please try again later.',
});

export const apiRateLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests from this IP, please try again later.',
});

export const refreshTokenRateLimiter = createRateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many token refresh requests from this IP, please try again later.',
});