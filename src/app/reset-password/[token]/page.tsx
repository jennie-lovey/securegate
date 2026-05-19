"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

type Strength = "none" | "weak" | "fair" | "strong";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password strength logic matching design system rules
  const strength = useMemo<Strength>(() => {
    if (!password) return "none";
    
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    
    const classesCount = [hasLowercase, hasUppercase, hasDigit, hasSymbol].filter(Boolean).length;
    
    if (password.length < 8 || classesCount <= 1) {
      return "weak";
    }
    
    if (password.length >= 12 && classesCount >= 3) {
      return "strong";
    }
    
    return "fair";
  }, [password]);

  const strengthColour = useMemo(() => {
    switch (strength) {
      case "weak":
        return "bg-[--error]";
      case "fair":
        return "bg-[--warning]";
      case "strong":
        return "bg-[--success]";
      default:
        return "bg-[--border]";
    }
  }, [strength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Reset token is missing from the URL.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. The link may have expired.");
      } else {
        setSuccess(data.message || "Your password has been successfully reset!");
        setIsSuccess(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("[reset-password-form]", err);
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl">
        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-[--success]" />
            <h1 className="text-2xl font-semibold text-[--text-primary]">Password Reset</h1>
            <p className="text-sm text-[--text-secondary]">
              Your password has been successfully updated. You can now sign in using your new credentials.
            </p>
            <Link
              href="/login"
              className="mt-4 px-6 py-2.5 rounded-lg bg-[--accent] hover:bg-[--accent-hover] text-white font-medium text-sm transition-colors duration-150"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-[--text-primary]">Reset Password</h1>
              <p className="text-sm text-[--text-secondary] mt-1">
                Enter your new password below to update your account access
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/40 border border-red-800/50 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Password Input */}
              <div className="flex flex-col gap-1.5 relative">
                <label htmlFor="password" className="text-sm font-medium text-[--text-secondary]">
                  New Password
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

                {/* Three segment bar below the input */}
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
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-[--text-secondary]">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
                             text-[--text-primary] placeholder:text-neutral-600
                             focus:outline-none focus:ring-2 focus:ring-[--accent]
                             transition-all duration-150 disabled:opacity-50"
                />
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
                    Updating password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
