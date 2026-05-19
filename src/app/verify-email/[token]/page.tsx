"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token was provided in the URL.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Failed to verify email address.");
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error("[verify-email-page]", err);
        setStatus("error");
        setErrorMessage("A network error occurred. Please try again.");
      }
    };

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendError(null);
    setResendSuccess(null);

    if (!resendEmail.trim() || !resendEmail.includes("@")) {
      setResendError("Please enter a valid email address.");
      setResendLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResendError(data.error || "Failed to request a new verification link.");
      } else {
        setResendSuccess(data.message || "A new verification link has been sent.");
        setResendEmail("");
      }
    } catch (err) {
      console.error("[resend-verification-on-verify-page]", err);
      setResendError("Failed to connect to the server.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-12 w-12 text-[--accent] animate-spin" />
            <h1 className="text-xl font-semibold text-[--text-primary]">Verifying Email...</h1>
            <p className="text-sm text-[--text-secondary]">Please wait while we confirm your email address.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 animate-fade-in">
            <CheckCircle2 className="h-16 w-16 text-[--success]" />
            <h1 className="text-2xl font-semibold text-[--text-primary]">Verification Complete</h1>
            <p className="text-sm text-[--text-secondary]">
              Your email address has been verified. You can now log in to access your dashboard.
            </p>
            <Link
              href="/login"
              className="mt-4 px-6 py-2.5 rounded-lg bg-[--accent] hover:bg-[--accent-hover] text-white font-medium text-sm transition-colors duration-150"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <XCircle className="h-16 w-16 text-[--error]" />
            <h1 className="text-2xl font-semibold text-[--text-primary]">Verification Failed</h1>
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg w-full">
              {errorMessage}
            </p>

            {/* Resend Verification Form */}
            <div className="w-full mt-6 text-left border-t border-[--border] pt-6">
              <h2 className="text-sm font-semibold text-[--text-primary] mb-2">Request new verification link</h2>
              
              {resendError && (
                <div className="p-2.5 mb-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {resendError}
                </div>
              )}

              {resendSuccess && (
                <div className="p-2.5 mb-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-black">
                  {resendSuccess}
                </div>
              )}

              <form onSubmit={handleResend} className="flex flex-col gap-2">
                <label htmlFor="resend-email" className="sr-only">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    id="resend-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-[--bg-primary] border border-[--border]
                               text-[--text-primary] placeholder:text-neutral-600
                               focus:outline-none focus:ring-2 focus:ring-[--accent]
                               transition-all duration-150"
                  />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="px-4 py-2 rounded-lg bg-[--accent] hover:bg-[--accent-hover] text-white font-medium text-sm transition-colors duration-150 disabled:opacity-50 flex items-center gap-1"
                >
                  {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Request"}
                </button>
                </div>
              </form>
            </div>

            <Link
              href="/login"
              className="mt-4 text-sm text-[--accent] hover:underline font-medium"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
