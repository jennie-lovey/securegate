---
trigger: always_on
---

# Design System Rules — SecureGate

## Philosophy
SecureGate is a security-focused product. Its UI should feel **precise, trustworthy, and calm**. No flashy animations. No visual noise. Every element on screen should earn its place. Users who are entering passwords and clicking verification links need to feel safe — the design reinforces that.

## Styling Stack
- **Tailwind CSS** — utility-first. No custom CSS files unless Tailwind cannot achieve the result.
- No external component libraries (no shadcn, no MUI) — build components from scratch to demonstrate understanding.
- Responsive by default. All auth forms must be usable on mobile.

## Colour Palette
Use CSS variables defined in `src/app/globals.css`:
```css
:root {
  --bg-primary: #0f0f0f;       /* near-black page background */
  --bg-surface: #1a1a1a;       /* card/form surface */
  --bg-surface-hover: #222222;
  --border: #2e2e2e;           /* subtle borders */
  --text-primary: #f5f5f5;     /* main text */
  --text-secondary: #a3a3a3;   /* muted labels, hints */
  --accent: #6366f1;           /* indigo — primary action colour */
  --accent-hover: #4f46e5;
  --error: #ef4444;            /* red — errors and warnings */
  --success: #22c55e;          /* green — success states */
  --warning: #f59e0b;          /* amber — weak password, expiry warnings */
}
```

## Typography
- Font: `Inter` via `next/font/google`.
- Base size: 16px (`text-base`).
- Headings: `text-2xl font-semibold` for page titles, `text-lg font-medium` for card titles.
- Labels: `text-sm font-medium text-[--text-secondary]`.
- Error messages: `text-sm text-[--error]`.

## Layout
- All auth pages: vertically and horizontally centred on screen.
- Form card: `max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border]`.
- Page wrapper: `min-h-screen flex items-center justify-center bg-[--bg-primary] px-4`.

## Component Patterns

### Input Field
```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="email" className="text-sm font-medium text-neutral-400">
    Email address
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
               text-[--text-primary] placeholder:text-neutral-600
               focus:outline-none focus:ring-2 focus:ring-[--accent]
               transition-all duration-150"
  />
  {error && <p className="text-xs text-[--error]">{error}</p>}
</div>
```

### Primary Button
```tsx
<button
  type="submit"
  disabled={isLoading}
  className="w-full py-2.5 px-4 rounded-lg bg-[--accent] hover:bg-[--accent-hover]
             text-white font-medium text-sm transition-colors duration-150
             disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? 'Please wait...' : 'Sign in'}
</button>
```

### Error Alert
```tsx
{error && (
  <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-sm text-red-400">
    {error}
  </div>
)}
```

### Success Alert
```tsx
{success && (
  <div className="p-3 rounded-lg bg-green-950/40 border border-green-800/50 text-sm text-green-400">
    {success}
  </div>
)}
```

## Password Strength Indicator
The password field on the Sign Up page must include a strength indicator below the input.

**Logic:**
- `weak`: length < 8 OR only one character class
- `fair`: length ≥ 8 AND two character classes (e.g. letters + numbers)
- `strong`: length ≥ 12 AND three or more character classes (uppercase, lowercase, numbers, symbols)

**Visual:**
```tsx
// Three segment bar below the input
<div className="flex gap-1 mt-1.5">
  <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
    strength !== 'none' ? strengthColour : 'bg-[--border]'
  }`} />
  <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
    strength === 'fair' || strength === 'strong' ? strengthColour : 'bg-[--border]'
  }`} />
  <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
    strength === 'strong' ? strengthColour : 'bg-[--border]'
  }`} />
</div>
<p className="text-xs mt-1 text-[--text-secondary]">
  {strength !== 'none' && `Password strength: ${strength}`}
</p>
```

Colours: `weak → bg-[--error]`, `fair → bg-[--warning]`, `strong → bg-[--success]`.

## Forms — Non-Negotiables
1. Every input must have a visible `<label>` — no placeholder-only inputs.
2. Submit button must be `disabled` and show a loading indicator while the request is in flight.
3. Error messages must be specific: "Invalid email or password" not "Error occurred".
4. Success messages must tell the user what to do next: "Check your email for a verification link."
5. All forms must work with keyboard navigation (tab order, Enter to submit).

## Loading States
- Button text changes to "Please wait..." while `isLoading` is `true`.
- Optionally add a spinner SVG inline with the button text.
- Do not show a skeleton or full-page loader for auth forms — it adds perceived latency.

## Protected Dashboard
- The dashboard is intentionally minimal for this assessment.
- Show: user's name/email, `emailVerified` status, a logout button.
- Style it as a simple centred card — consistent with auth pages.

## Responsive Rules
- Stack elements vertically on mobile. Single-column layout throughout.
- Minimum tap target: 44px height on interactive elements.
- Font sizes do not scale down on mobile — 16px base prevents iOS auto-zoom on inputs.