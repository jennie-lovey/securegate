# SecureGate — Reflection & Engineering Analysis
**Name:** [Anthony jennifer]
**Cohort:** Design to MVP Bootcamp
**Live URL:** ttps://securegate-hgya.vercel.app/signup
**GitHub Repo:** [Your repo URL]
---
## Part 1 — What I Built
[SecureGate is a focused authentication system built with Next.js, NextAuth, Prisma, PostgreSQL, and Resend. It handles sign up, email verification, login, password reset, rate limiting, and protected routes. The goal was not to build a full product, but to deeply understand how secure identity systems behave in real applications]

## Part 2 — What Surprised Me
[What surprised me most was how quickly Antigravity generated scaffolding and how fast the structure came together. I expected setup to take longer, but the speed at which the project foundation was created changed how I think about building systems.
What I learned is that speed doesn’t reduce responsibility  it actually increases the need to understand what is happening underneath, especially with authentication flows and generated structure.]

## Part 3 — Engineering Laws Quiz
My Answer:
I added protections in login and session handling because failures are always possible in authentication systems. For example, rate limiting on /api/auth/signin and session expiry in NextAuth ensure brute force attempts and stale sessions are controlled.

What goes wrong if ignored:
Without these protections, attackers could brute force logins or users could stay logged in indefinitely, creating security and access risks.



### Q1 — What goes wrong if ignored:
Attackers could brute force logins or users could stay logged in indefinitely,creating security and access risks.

**Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48
**My Answer:** [This section handles the authentication flow configuration in NextAuth, including session strategy, providers, callbacks, or custom logic depending on your setup.e]

**What goes wrong if ignored:** [Authentication can fail or become inconsistent, causing users to be unable to sign in, lose sessions unexpectedly, or gain/lose access incorrectly due to broken session or callback handling.
]

### Q2 — Law of Leaky AbstractionsMy Answer:
NextAuth hides session handling, but I still had to manually map token data into the session. The abstraction leaks when I need to control what exists inside the session object.



## Part 4 — One Thing I Would Refactor
[would split the auth logic into smaller files (providers, callbacks, and config) to make it cleaner and easier to maintain.]

## Part 5 — How This Changes How I Build
I now understand that authentication is sensitive and tightly connected to security and user sessions, so even small mistakes can break login flow or create security risks.
