# Skill: Component Builder

## Purpose
Scaffold a new React component for SecureGate following the project's design system, TypeScript conventions, and accessibility rules. Use this skill every time you create a new UI component — auth forms, alerts, input fields, buttons, or dashboard widgets.

## When to Use This Skill
- Building any `.tsx` file under `src/components/`.
- Adding a new form to an auth page.
- Creating a reusable UI element (input, button, badge, alert).
- Building a page-level layout component.

## Before You Start
1. Read `.agents/rules/design-system.md` — colour tokens, component patterns, form rules.
2. Read `.agents/rules/code-style.md` — TypeScript rules, naming conventions, linting.
3. Identify whether the component is a **server component** or **client component**:
   - Needs `useState`, `useEffect`, event handlers, or browser APIs → **client component** (`'use client'`).
   - Only renders data, no interactivity → **server component** (no directive needed).

## Step-by-Step

### Step 1 — Determine the component type and location
| Type | Location | Example |
|---|---|---|
| Reusable UI primitive | `src/components/ui/` | `Button.tsx`, `Input.tsx` |
| Auth-specific form | `src/components/auth/` | `LoginForm.tsx`, `SignUpForm.tsx` |
| Dashboard widget | `src/components/dashboard/` | `UserCard.tsx` |
| Page layout | `src/components/layout/` | `AuthLayout.tsx` |

### Step 2 — Create the file with the correct directive
```tsx
// Client component (has interactivity)
'use client';

import { useState } from 'react';

// Server component (no directive needed)
import { getServerSession } from 'next-auth';
```

### Step 3 — Define Props with a TypeScript interface
```tsx
interface LoginFormProps {
  redirectTo?: string;
}
```

### Step 4 — Write the component
Follow these rules:
- Every `<input>` must have a matching `<label>` with `htmlFor`/`id` pair.
- Every form must have an `isLoading` state and disable the submit button during requests.
- Every form must have an `error` state and display it clearly.
- Use CSS variable tokens from the design system — no raw hex values.

### Step 5 — Component Template (Client Form)
```tsx
'use client';

import { useState } from 'react';

interface ExampleFormProps {
  onSuccess?: () => void;
}

export function ExampleForm({ onSuccess }: ExampleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: fieldValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      onSuccess?.();
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border]">
      <h1 className="text-2xl font-semibold text-[--text-primary] mb-6">
        Form Title
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="field" className="text-sm font-medium text-neutral-400">
            Field Label
          </label>
          <input
            id="field"
            type="text"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
                       text-[--text-primary] placeholder:text-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-[--accent] transition-all duration-150"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-[--accent] hover:bg-[--accent-hover]
                     text-white font-medium text-sm transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Please wait...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
```

### Step 6 — Export correctly
- Named exports for all components: `export function LoginForm()`.
- No default exports from component files (easier to find in IDEs and refactor).

### Step 7 — Checklist before finishing
- [ ] `<label>` exists for every `<input>` with matching `htmlFor`/`id`.
- [ ] `isLoading` state disables the submit button.
- [ ] Error state displays a specific, user-readable message.
- [ ] No raw colour hex values — only design system CSS variables or Tailwind tokens.
- [ ] TypeScript: no `any`, props are typed with an interface.
- [ ] No unused imports.
- [ ] Run `next lint` — zero errors.

## Special Case: Password Strength Indicator
When building or modifying the `SignUpForm`, include the password strength indicator as per `design-system.md`. The indicator logic must live in the component, not in a separate utility, since it is purely presentational.

## Special Case: Password Visibility Toggle
Add a show/hide toggle to all password inputs:
```tsx
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    // ...
  />
  <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? '🙈' : '👁'}
  </button>
</div>
```