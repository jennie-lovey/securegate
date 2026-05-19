---
trigger: always_on
---

# Code Style Rules — SecureGate

## TypeScript
- **Strict mode is on.** `tsconfig.json` must include `"strict": true`. No `@ts-ignore` without a written comment explaining why.
- No `any`. Use `unknown` when the type is genuinely uncertain and narrow it explicitly.
- Prefer `type` for unions, primitives, and function signatures. Use `interface` for object shapes that may be extended.
- Export types that are used across more than one file. Co-locate types that are only used in one module.

### Example: API route handler typing
```ts
// ✅ correct
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> { ... }

// ❌ wrong
export async function POST(req: any) { ... }
```

## Zod Validation
- Every API route that accepts a request body must validate it with Zod **before** touching the database.
- Define schemas in the same file as the route, or in a `src/lib/schemas/` file if reused.
- Use `.safeParse()` — not `.parse()` — so you can return a proper 400 response on failure.

```ts
const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const result = signUpSchema.safeParse(await req.json());
if (!result.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

## Naming Conventions
| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `LoginForm.tsx` |
| Files (lib/util) | camelCase | `tokens.ts`, `rateLimit.ts` |
| Files (routes) | lowercase (Next.js convention) | `route.ts`, `page.tsx` |
| React components | PascalCase | `PasswordStrengthIndicator` |
| Functions | camelCase | `generateVerificationToken` |
| Constants | SCREAMING_SNAKE | `SALT_ROUNDS`, `TOKEN_EXPIRY_MS` |
| Prisma models | PascalCase (matches schema) | `User`, `VerificationToken` |
| Environment variables | SCREAMING_SNAKE | `RESEND_API_KEY` |

## Functions
- Single responsibility. If a function does more than one thing, split it.
- No function longer than 40 lines. If it is, extract helpers.
- Async functions must always handle errors — use `try/catch` in route handlers.
- Never `await` inside a loop. Use `Promise.all()` where parallel execution is safe.

## Error Handling in Route Handlers
```ts
try {
  // business logic
  return NextResponse.json({ success: true });
} catch (error) {
  console.error('[signup]', error); // log server-side only
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' }, // generic to client
    { status: 500 }
  );
}
```
- Log errors server-side with a context prefix: `[signup]`, `[verify-email]`, `[reset-password]`.
- Return generic messages to the client. Never expose stack traces or internal state.

## Prisma Usage
- Import the singleton: `import { prisma } from '@/lib/prisma'`.
- Always use `prisma.user.findUnique()` (not `findFirst()`) when querying by `id` or `email`.
- Wrap mutations that touch multiple tables in a `prisma.$transaction()`.
- Delete tokens after they are used. Do not leave consumed tokens in the database.

## React Components
- Prefer **server components** by default. Add `'use client'` only when you need `useState`, `useEffect`, or browser APIs.
- Forms must be client components because they need `useState` for controlled inputs and loading states.
- Every form must have:
  - Accessible `<label>` elements tied to inputs via `htmlFor` / `id`.
  - A loading/disabled state on the submit button while a request is in flight.
  - Real, specific error messages — not "Something went wrong."

## Imports
- Use path aliases: `@/lib/...`, `@/components/...`, `@/emails/...`.
- Group imports: external packages → internal modules → types.
- Remove all unused imports. The linter will catch them; fix them before committing.

## Constants
Define shared constants in `src/lib/constants.ts`:
```ts
export const SALT_ROUNDS = 12;
export const VERIFICATION_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;        // 1 hour
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW = '10 m';
```

## Boy Scout Rule
Leave every file cleaner than you found it. If you open a file to add a feature and notice:
- An unused import → remove it.
- A magic number → extract it to a constant.
- A repeated code block → extract a shared function.
- A vague variable name → rename it.

Document what you cleaned in your REFLECTION.md Q6 answer.

## Linting & Formatting
- ESLint with the Next.js config is the baseline. Do not disable rules without a comment.
- Prettier for formatting. Consistent indentation: 2 spaces.
- Run `next lint` before marking any task complete.