import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Fallback in-memory rate limiter for local development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

class MemoryRateLimiter {
  private limitCount: number;
  private windowMs: number;

  constructor(limitCount: number, windowMs: number) {
    this.limitCount = limitCount;
    this.windowMs = windowMs;
  }

  async limit(ip: string) {
    const now = Date.now();
    const record = memoryStore.get(ip);

    if (!record || now > record.resetTime) {
      memoryStore.set(ip, { count: 1, resetTime: now + this.windowMs });
      return { success: true, remaining: this.limitCount - 1 };
    }

    if (record.count >= this.limitCount) {
      return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: this.limitCount - record.count };
  }
}

function createRateLimiter(limitCount: number, windowStr: string, windowMs: number) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limitCount, windowStr as any),
        analytics: true,
      });
    } catch (error) {
      console.error("[rate-limit] Upstash initialization failed, using fallback:", error);
      return new MemoryRateLimiter(limitCount, windowMs);
    }
  } else {
    return new MemoryRateLimiter(limitCount, windowMs);
  }
}

// 5 attempts / 10 minutes
export const loginRateLimiter = createRateLimiter(5, "10 m", 10 * 60 * 1000);

// 10 attempts / 1 hour
export const signupRateLimiter = createRateLimiter(10, "1 h", 60 * 60 * 1000);

// 3 attempts / 15 minutes
export const forgotPasswordRateLimiter = createRateLimiter(3, "15 m", 15 * 60 * 1000);

// 5 attempts / 15 minutes
export const resetPasswordRateLimiter = createRateLimiter(5, "15 m", 15 * 60 * 1000);
export type RateLimiter = Ratelimit | MemoryRateLimiter;
