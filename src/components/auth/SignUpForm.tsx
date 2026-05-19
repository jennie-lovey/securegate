"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import PasswordStrengthIndicator, { usePasswordStrength } from "./PasswordStrengthIndicator";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = usePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Basic client validation
    if (!name.trim()) {
      setError("Name is required.");
      setIsLoading(false);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account. Please try again.");
      } else {
        setSuccess(data.message || "Account created! Check your email for a verification link.");
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      console.error("[signup-form]", err);
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border]">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-[--text-primary]">Create Account</h1>
        <p className="text-sm text-[--text-secondary] mt-1">Sign up to get started with SecureGate</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-[--text-secondary]">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            disabled={isLoading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
                       text-[--text-primary] placeholder:text-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-[--accent]
                       transition-all duration-150 disabled:opacity-50"
          />
        </div>

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
        <div className="flex flex-col gap-1.5 relative">
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
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
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

          {passwordFocused && <PasswordStrengthIndicator password={password} />}
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
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[--text-secondary]">
        Already have an account?{" "}
        <Link href="/login" className="text-[--accent] hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
}
