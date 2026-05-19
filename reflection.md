# SecureGate — Reflection & Engineering Analysis
**Name:** [Anthony jennifer]
**Cohort:** Design to MVP Bootcamp
**Live URL:** [Your Vercel deployment link]
**GitHub Repo:** [Your repo URL]
---
## Part 1 — What I Built
[SecureGate is a production-ready authentication system built with Next.js 14, TypeScript, Prisma, and PostgreSQL. It uses NextAuth.js for auth flows, Resend for emails, and Tailwind CSS for styling, deployed on Vercel]

## Part 2 — What Surprised Me
[What surprised me most was how quickly the scaffolding was generated and how much faster it made the setup process compared to doing it manually. It showed me how much time can be saved when tools handle repetitive structure automatically, allowing more focus on actual problem-solving instead of setup work.]

## Part 3 — Engineering Laws Quiz
### Q1 — For each question: read the code reference, answer in your own words, and explain the failure mode if the law is ignored.

**Code reference:** `src/app/api/auth/[...nextauth]/route.ts` lines 34-48
**My Answer:** [This section handles the authentication flow configuration in NextAuth, including session strategy, providers, callbacks, or custom logic depending on your setup.e]

**What goes wrong if ignored:** [Authentication can fail or become inconsistent, causing users to be unable to sign in, lose sessions unexpectedly, or gain/lose access incorrectly due to broken session or callback handling.
]

### Q2 — Law of Leaky Abstractions


## Part 4 — One Thing I Would Refactor
[would split the auth logic into smaller files (providers, callbacks, and config) to make it cleaner and easier to maintain.]

## Part 5 — How This Changes How I Build
I now understand that authentication is sensitive and tightly connected to security and user sessions, so even small mistakes can break login flow or create security risks.
