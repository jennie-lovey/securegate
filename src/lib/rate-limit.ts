// Fallback in-memory rate limiter for local development
const memoryStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimiterInstance {
  limit(ip: string): Promise<{ success: boolean; remaining: number }>;
}

class MemoryRateLimiter implements RateLimiterInstance {
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

let upstashRedis: InstanceType<typeof import("@upstash/redis").Redis> | null = null;

async function getUpstash() {
  if (upstashRedis) return upstashRedis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return upstashRedis;
  } catch {
    return null;
  }
}

async function createRateLimiter(limitCount: number, windowStr: string, windowMs: number): Promise<RateLimiterInstance> {
  const redis = await getUpstash();
  if (redis) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limitCount, windowStr as any),
        analytics: true,
      });
    } catch (error) {
      console.error("[rate-limit] Upstash ratelimit initialization failed, using fallback:", error);
    }
  }
  return new MemoryRateLimiter(limitCount, windowMs);
}

// Lazy initialization — Upstash packages are only imported on first request
let _loginRateLimiter: RateLimiterInstance | null = null;
let _signupRateLimiter: RateLimiterInstance | null = null;
let _forgotPasswordRateLimiter: RateLimiterInstance | null = null;
let _resetPasswordRateLimiter: RateLimiterInstance | null = null;

async function getOrInit<T>(cache: { value: T | null }, factory: () => Promise<T>): Promise<T> {
  if (!cache.value) {
    cache.value = await factory();
  }
  return cache.value;
}

export async function getLoginRateLimiter() {
  return getOrInit({ value: _loginRateLimiter }, () => createRateLimiter(5, "10 m", 10 * 60 * 1000));
}

export async function getSignupRateLimiter() {
  return getOrInit({ value: _signupRateLimiter }, () => createRateLimiter(10, "1 h", 60 * 60 * 1000));
}

export async function getForgotPasswordRateLimiter() {
  return getOrInit({ value: _forgotPasswordRateLimiter }, () => createRateLimiter(3, "15 m", 15 * 60 * 1000));
}

export async function getResetPasswordRateLimiter() {
  return getOrInit({ value: _resetPasswordRateLimiter }, () => createRateLimiter(5, "15 m", 15 * 60 * 1000));
}
