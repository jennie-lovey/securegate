# SecureGate — Agent Instructions

## Project Overview
SecureGate is a production-ready, standalone authentication system built with Next.js 14 (App Router), TypeScript, Prisma, PostgreSQL, NextAuth.js, Resend, and Tailwind CSS. It is deployed on Vercel.

## Agent Behaviour Contract
You are a senior full-stack product engineer. Every decision you make must be deliberate, secure, and explainable. You do not take shortcuts on auth, hashing, token handling, or error messages. You build as if Murphy himself is a user.

## Stack at a Glance
| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (Credentials provider) |
| Password | bcryptjs (salt rounds: 12) |
| Email | Resend + React Email |
| Validation | Zod |
| Rate Limiting | Upstash Redis (`@upstash/ratelimit`) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Folder Structure
```
securegate/
├── .agents/
│   └── rules/
│       ├── markdown.md
│       ├── architecture.md
│       ├── code-style.md
│       ├── design-system.md
│       └── security.md
├── skills/
│   ├── flutterwave-integration/
│   │   ├── SKILL.md
│   │   └── resources/
│   │       └── webhook-handler.ts
│   ├── component-builder/
│   │   └── SKILL.md
│   ├── api-route-scaffolder/
│   │   └── SKILL.md
│   └── db-migration-runner/
│       └── SKILL.md
├── workflows/
│   ├── new-component.md
│   └── new-api-route.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── verify-email/[token]/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/[token]/
│   │   ├── dashboard/
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── auth/signup/
│   │       ├── auth/verify-email/
│   │       ├── auth/forgot-password/
│   │       └── auth/reset-password/
│   ├── components/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── email.ts
│   │   ├── tokens.ts
│   │   └── rate-limit.ts
│   ├── emails/
│   └── middleware.ts
├── prisma/
│   └── schema.prisma
├── REFLECTION.md
└── AGENTS.md
```

## Core Rules (always apply)
1. **Read the relevant `.agents/rules/` file before writing any code in that domain.**
2. **Read the relevant `skills/` SKILL.md before scaffolding any feature.**
3. **Follow the workflow in `workflows/` when creating components or API routes.**
4. Never store plain-text passwords. Never return stack traces to the client. Never expose whether an email exists in the system.
5. All secrets live in `.env.local` (local) and Vercel dashboard (production). Never hardcode them.
6. Zod validates every API input server-side, regardless of client-side validation.
7. Every token (verification, reset) must have an expiry. Short-lived is always safer.
8. Rate-limit every auth endpoint that accepts user-supplied credentials.

## Environment Variables Required
```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
RESEND_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Agent Task Protocol
When given a task:
1. Identify which **rule files** apply → read them.
2. Identify which **skill** is needed → read the SKILL.md.
3. Identify which **workflow** to follow → follow it step by step.
4. Write the code. Run migrations if schema changed. Test the happy path AND failure paths.
5. Confirm no secrets are hardcoded before considering the task done.