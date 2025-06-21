import { redisConfig } from '@/infrastructure/config/env';
import * as jwt from 'jsonwebtoken';

export interface TokenBlacklistStore {
  blacklist(token: string, expiresAt: Date): Promise<void>;
  isBlacklisted(token: string): Promise<boolean>;
  cleanup(): Promise<void>;
}

// In-memory token blacklist store (fallback when Redis is not available)
class InMemoryTokenBlacklistStore implements TokenBlacklistStore {
  private blacklistedTokens: Map<string, Date> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired tokens every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

  async blacklist(token: string, expiresAt: Date): Promise<void> {
    // Store token with its expiration time
    this.blacklistedTokens.set(token, expiresAt);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const expiresAt = this.blacklistedTokens.get(token);
    if (!expiresAt) {
      return false;
    }

    // Check if token has expired and remove it
    if (expiresAt <= new Date()) {
      this.blacklistedTokens.delete(token);
      return false;
    }

    return true;
  }

  async cleanup(): Promise<void> {
    const now = new Date();
    for (const [token, expiresAt] of this.blacklistedTokens.entries()) {
      if (expiresAt <= now) {
        this.blacklistedTokens.delete(token);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.blacklistedTokens.clear();
  }
}

// Redis-based token blacklist store (preferred when Redis is available)
class RedisTokenBlacklistStore implements TokenBlacklistStore {
  private redis: any;

  constructor() {
    // Note: Redis implementation would require installing redis client
    // For now, we'll throw an error if Redis is configured but not available
    throw new Error('Redis support not implemented yet. Please install redis client.');
  }

  async blacklist(token: string, expiresAt: Date): Promise<void> {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (ttl > 0) {
      await this.redis.setEx(`blacklist:${token}`, ttl, '1');
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`blacklist:${token}`);
    return result !== null;
  }

  async cleanup(): Promise<void> {
    // Redis automatically handles TTL cleanup
  }
}

// Factory function to create appropriate token blacklist store
export function createTokenBlacklistStore(): TokenBlacklistStore {
  if (redisConfig.url) {
    try {
      return new RedisTokenBlacklistStore();
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory token blacklist store');
    }
  }
  
  return new InMemoryTokenBlacklistStore();
}

// Global token blacklist store instance
export const tokenBlacklistStore = createTokenBlacklistStore();

// Helper functions for token blacklisting
export async function blacklistToken(token: string): Promise<void> {
  try {
    // Decode token to get expiration time
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      // If we can't decode or no expiration, blacklist for 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await tokenBlacklistStore.blacklist(token, expiresAt);
    } else {
      // Use token's actual expiration time
      const expiresAt = new Date(decoded.exp * 1000);
      await tokenBlacklistStore.blacklist(token, expiresAt);
    }
  } catch (error) {
    console.error('Error blacklisting token:', error);
    // Fallback: blacklist for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await tokenBlacklistStore.blacklist(token, expiresAt);
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    return await tokenBlacklistStore.isBlacklisted(token);
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    // Fail safe: assume token is not blacklisted
    return false;
  }
}