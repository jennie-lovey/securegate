"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Parse errors from NextAuth / Middleware redirects
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password.");
    } else if (errorParam === "unverified") {
      setError("Your email address is not verified. Please verify your email before logging in.");
    } else if (errorParam) {
      setError("An authentication error occurred. Please try again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        // NextAuth returned error
        setError("Invalid email or password.");
      } else {
        // Successful login, trigger redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("[login-form]", err);
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Please enter your email address to request a new verification link.");
      return;
    }

    setResendingEmail(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend verification link.");
      } else {
        setSuccess(data.message || "A new verification link has been sent to your email.");
      }
    } catch (err) {
      console.error("[resend-verification-form]", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setResendingEmail(false);
    }
  };

  const isUnverifiedError = searchParams.get("error") === "unverified" || error?.includes("verified");

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border]">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-[--text-primary]">Welcome Back</h1>
        <p className="text-sm text-[--text-secondary] mt-1">Sign in to your SecureGate account</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex flex-col gap-2">
          <span>{error}</span>
          {isUnverifiedError && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="text-[--accent] hover:text-[--accent-hover] hover:underline text-xs font-semibold self-start flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendingEmail ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend verification link"
              )}
            </button>
          )}
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-[--text-secondary]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
                       text-[--text-primary] placeholder:text-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-[--accent]
                       transition-all duration-150 disabled:opacity-50"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-[--text-secondary]">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-lg bg-[--bg-primary] border border-[--border]
                         text-[--text-primary] placeholder:text-neutral-600
                         focus:outline-none focus:ring-2 focus:ring-[--accent]
                         transition-all duration-150 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs text-[--accent] hover:underline font-medium self-end"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-[--accent] hover:bg-[--accent-hover]
                     text-white font-medium text-sm transition-colors duration-150
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Please wait...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[--text-secondary]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-[--accent] hover:underline font-medium">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
