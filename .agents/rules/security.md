---
trigger: always_on
---

# Security Rules — SecureGate

## The Prime Directive
Do not trust the client. Validate everything on the server. Return the minimum information needed for the user to proceed — nothing more.

---

## Password Hashing

### Rule
Always hash passwords with `bcryptjs` at **12 salt rounds**. Never use SHA-256, MD5, or any fast hash for passwords.

### Why
bcrypt is intentionally slow. Its cost factor (12 rounds ≈ ~250ms per hash) makes brute-force and dictionary attacks computationally expensive. It also automatically salts each hash, making rainbow table attacks impossible. SHA-256 is deterministic and fast — an attacker with the hash can reverse common passwords in seconds.

### Implementation
```ts
import bcrypt from 'bcryptjs';
import { SALT_ROUNDS } from '@/lib/constants';

// Hashing (sign up / password reset)
const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);

// Comparing (login)
const isValid = await bcrypt.compare(plainPassword, storedHash);
```

### Verification
After sign up, open your database client. The `password` column must start with `$2b$12$`.

---

## Token Generation

### Rule
Use `crypto.randomBytes(32).toString('hex')` — never `Math.random()` or `Date.now()`.

### Why
`Math.random()` is not cryptographically secure. It is predictable. An attacker who observes enough tokens can predict future ones. `crypto.randomBytes` uses the OS entropy source — unpredictable by design.

### Expiry — Non-Negotiable
| Token Type | Expiry |
|---|---|
| Email Verification | 15 minutes |
| Password Reset | 1 hour |

```ts
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function verificationExpiry(): Date {
  return new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
}

export function resetExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
}
```

**Always delete a token from the database immediately after it is successfully consumed.** A used token left in the DB is a replayable credential.

---

## Rate Limiting

### Rule
Rate-limit every endpoint that accepts user-supplied credentials or sends emails.

| Endpoint | Limit |
|---|---|
| `POST /api/auth/signin` | 5 attempts / 10 minutes / IP |
| `POST /api/auth/signup` | 10 attempts / 1 hour / IP |
| `POST /api/auth/forgot-password` | 3 attempts / 15 minutes / IP |
| `POST /api/auth/reset-password` | 5 attempts / 15 minutes / IP |

### Implementation (Upstash)
```ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const loginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
});
```

In the route handler:
```ts
const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
const { success } = await loginRatelimit.limit(ip);
if (!success) {
  return NextResponse.json(
    { error: 'Too many attempts. Please wait before trying again.' },
    { status: 429 }
  );
}
```

---

## Information Leakage Prevention

### Login Error Messages
Do NOT reveal whether the email exists:
```ts
// ✅ correct
return null; // NextAuth will surface: "Invalid email or password"

// ❌ wrong
throw new Error('No account found with this email');
throw new Error('Incorrect password');
```

### Forgot Password Response
Always return success — even if the email is not in the database:
```ts
// ✅ correct — always
return NextResponse.json({
  message: 'If an account exists with that email, a reset link has been sent.'
});

// ❌ wrong
if (!user) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
```

### Stack Traces
Never return error objects or stack traces to the client:
```ts
// ✅ correct
console.error('[reset-password]', error);
return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });

// ❌ wrong
return NextResponse.json({ error: error.message }, { status: 500 });
```

---

## Environment Variables

### Rules
1. `.env.local` is in `.gitignore`. Confirm this before the first push.
2. All secrets in Vercel dashboard under **Settings → Environment Variables**.
3. Never hardcode a key string in source code — not even in comments.
4. If a secret is accidentally committed: rotate it immediately, force-push (or squash the commit), revoke the old key in the provider dashboard.

### NEXTAUTH_SECRET Rotation (if leaked)
1. Generate a new secret: `openssl rand -base64 32`
2. Update it in Vercel environment variables.
3. Redeploy. All existing JWT sessions are immediately invalidated.
4. Revoke / regenerate the old secret in any relevant provider.

---

## HTTP Security Headers (`next.config.js`)

```js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

---

## Input Sanitisation
- Zod strips unknown fields by default when using `.strip()` (the default). This is sufficient for SQL injection protection via Prisma's parameterised queries.
- Never interpolate user input into raw SQL strings.
- Trim and lowercase emails before storing or querying: `email.trim().toLowerCase()`.

---

## Session Security
- JWT secret must be a minimum 32-byte random string (`NEXTAUTH_SECRET`).
- Session tokens are HTTP-only cookies (NextAuth default). Do not expose them to JavaScript.
- `emailVerified` must be checked in the session callback and stored in the JWT. The dashboard middleware reads this flag — if it is falsy, the user is redirected regardless of having a valid session.

---

## Security Checklist (run before every deployment)
- [ ] `$2b$12$` prefix visible in DB password column
- [ ] `.env.local` absent from GitHub repo (`git ls-files | grep env`)
- [ ] 6 consecutive wrong login attempts trigger a 429 response
- [ ] Expired verification token shows error, not success
- [ ] Forgot password returns success even for unknown emails
- [ ] Security headers visible in browser DevTools → Network → Response Headers
- [ ] No hardcoded keys in codebase (`grep -r "sk_" src/` returns empty)