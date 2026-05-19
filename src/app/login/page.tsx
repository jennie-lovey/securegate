import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <Suspense
        fallback={
          <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] flex flex-col items-center justify-center gap-4">
            <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-48 bg-neutral-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-neutral-800 rounded animate-pulse mt-4" />
            <div className="h-10 w-full bg-neutral-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-neutral-800 rounded animate-pulse mt-2" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
