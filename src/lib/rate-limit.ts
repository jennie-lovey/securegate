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

export function getClientIp(headersObj: { get: (name: string) => string | null }): string {
  const xRealIp = headersObj.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  
  const xForwardedFor = headersObj.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",");
    const clientIp = ips[0]?.trim();
    if (clientIp) return clientIp;
  }
  
  return "127.0.0.1";
}

async function createRateLimiter(limitCount: number, windowStr: string, windowMs: number): Promise<RateLimiterInstance> {
  const fallback = new MemoryRateLimiter(limitCount, windowMs);
  const redis = await getUpstash();
  if (redis) {
    try {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const primary = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limitCount, windowStr as any),
        analytics: true,
      });
      return {
        limit: async (ip: string) => {
          try {
            return await primary.limit(ip);
          } catch (error) {
            console.error("[rate-limit] Upstash limit check failed, using memory fallback:", error);
            return await fallback.limit(ip);
          }
        }
      };
    } catch (error) {
      console.error("[rate-limit] Upstash ratelimit initialization failed, using memory fallback:", error);
    }
  }
  return fallback;
}

// Lazy initialization globals
let _loginRateLimiter: RateLimiterInstance | null = null;
let _signupRateLimiter: RateLimiterInstance | null = null;
let _forgotPasswordRateLimiter: RateLimiterInstance | null = null;
let _resetPasswordRateLimiter: RateLimiterInstance | null = null;
let _resendVerificationRateLimiter: RateLimiterInstance | null = null;

export async function getLoginRateLimiter() {
  if (!_loginRateLimiter) {
    _loginRateLimiter = await createRateLimiter(5, "10 m", 10 * 60 * 1000);
  }
  return _loginRateLimiter;
}

export async function getSignupRateLimiter() {
  if (!_signupRateLimiter) {
    _signupRateLimiter = await createRateLimiter(10, "1 h", 60 * 60 * 1000);
  }
  return _signupRateLimiter;
}

export async function getForgotPasswordRateLimiter() {
  if (!_forgotPasswordRateLimiter) {
    _forgotPasswordRateLimiter = await createRateLimiter(3, "15 m", 15 * 60 * 1000);
  }
  return _forgotPasswordRateLimiter;
}

export async function getResetPasswordRateLimiter() {
  if (!_resetPasswordRateLimiter) {
    _resetPasswordRateLimiter = await createRateLimiter(5, "15 m", 15 * 60 * 1000);
  }
  return _resetPasswordRateLimiter;
}

export async function getResendVerificationRateLimiter() {
  if (!_resendVerificationRateLimiter) {
    _resendVerificationRateLimiter = await createRateLimiter(3, "15 m", 15 * 60 * 1000);
  }
  return _resendVerificationRateLimiter;
}
