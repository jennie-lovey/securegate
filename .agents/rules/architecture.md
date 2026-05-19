---
trigger: always_on
---

# Architecture Rules — SecureGate

## Framework: Next.js 14 App Router
- Use the **App Router** exclusively. No Pages Router.
- Every route segment is a folder with a `page.tsx` (UI) and optionally a `route.ts` (API handler).
- Co-locate server logic in `route.ts` files. Never put business logic inside `page.tsx`.

## Route Map
```
/                          → redirect to /login
/login                     → LoginPage (public)
/signup                    → SignUpPage (public)
/verify-email/[token]      → VerifyEmailPage (public, token from URL)
/forgot-password           → ForgotPasswordPage (public)
/reset-password/[token]    → ResetPasswordPage (public, token from URL)
/dashboard                 → DashboardPage (protected: authenticated + verified)

/api/auth/[...nextauth]    → NextAuth handler
/api/auth/signup           → POST: register user, send verification email
/api/auth/verify-email     → POST: verify token, mark user as verified
/api/auth/forgot-password  → POST: generate reset token, send email
/api/auth/reset-password   → POST: validate reset token, update password
```

## Middleware (`src/middleware.ts`)
- Protect `/dashboard` and any future `/dashboard/*` routes.
- Use `getToken()` from `next-auth/jwt` to read session.
- If no valid session → redirect to `/login`.
- If session exists but `emailVerified` is null → redirect to `/login?error=unverified`.
- Middleware runs on the Edge. Keep it lean — no Prisma, no bcrypt.

## Library Layer (`src/lib/`)
| File | Responsibility |
|---|---|
| `prisma.ts` | Singleton Prisma client |
| `auth.ts` | NextAuth configuration (providers, callbacks, session) |
| `tokens.ts` | Token generation (`crypto.randomBytes`) and DB helpers |
| `email.ts` | Resend send wrappers for verification and reset emails |
| `rate-limit.ts` | Upstash rate limiter factory |

**Rule:** API route handlers import from `src/lib/`. They do not contain raw Prisma queries or email logic inline.

## Database Layer
- ORM: Prisma.
- Database: PostgreSQL.
- Schema lives in `prisma/schema.prisma`.
- Never query the DB from a client component.
- Never run `prisma.$executeRaw` unless there is no Prisma model API equivalent.

### Required Models
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  password      String
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model PasswordResetToken {
  email   String
  token   String   @unique
  expires DateTime
}
```

## Session Strategy
- Use **JWT sessions** (not database sessions) for stateless, edge-compatible session reads in middleware.
- Store `id`, `email`, and `emailVerified` in the JWT payload via the `jwt` callback.
- Access session data in server components via `getServerSession(authOptions)`.
- Access session data in client components via `useSession()`.

## Auth Flow Summary
```
Sign Up → hash password (bcrypt, 12 rounds) → save User → generate VerificationToken
        → send email via Resend → redirect to "check your email" page

Verify Email → look up VerificationToken → check expiry → set User.emailVerified
             → delete token → redirect to /login

Login → NextAuth Credentials provider → compare hash → create JWT session
      → check emailVerified in session callback → allow or reject

Forgot Password → generate PasswordResetToken (1hr expiry) → send email
                → (always return success — do not confirm email existence)

Reset Password → look up PasswordResetToken → check expiry → hash new password
               → update User.password → delete token → redirect to /login

Logout → NextAuth signOut() → destroy session → redirect to /login
```

## Dependency Direction
```
page.tsx / route.ts
    ↓
src/lib/* (auth, tokens, email, rate-limit)
    ↓
Prisma / Resend / Upstash (external services)
```
Nothing in `src/lib/` imports from `src/app/`. No circular imports.

## Environment Boundaries
- **Server only:** Prisma, bcryptjs, Resend, Upstash, `NEXTAUTH_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`.
- **Edge safe (middleware):** `next-auth/jwt` `getToken()` only.
- **Client safe:** `useSession()`, `signIn()`, `signOut()` from `next-auth/react`.
- Never import a server-only module into a client component.