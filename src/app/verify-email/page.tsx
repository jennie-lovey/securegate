"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromParams = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromParams);
  const [digits, setDigits] = useState(["", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
    const newDigits = [...digits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    const nextIndex = Math.min(pasteData.length, 4);
    inputRefs.current[nextIndex]?.focus();
  };

  const code = digits.join("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) {
      setErrorMessage("Please enter the full 5-digit code.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setResendMsg(null);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to verify code.");
      } else {
        setStatus("success");
      }
    } catch {
      setStatus("error");
      setErrorMessage("A network error occurred. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setResendMsg(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to resend code.");
      } else {
        setResendMsg(data.message || "Code sent! Check your email.");
        setDigits(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage("Failed to connect to the server.");
    }
  };

  if (status === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
        <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-16 w-16 text-[--success]" />
            <h1 className="text-2xl font-semibold text-[--text-primary]">Verified!</h1>
            <p className="text-sm text-[--text-secondary]">
              Your email has been verified. You can now sign in.
            </p>
            <Link
              href="/login"
              className="mt-4 px-6 py-2.5 rounded-lg bg-[--accent] hover:bg-[--accent-hover] text-white font-medium text-sm transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1 text-sm text-[--text-secondary] hover:text-[--text-primary] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </button>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[--text-primary]">Verify your email</h1>
          <p className="text-sm text-[--text-secondary] mt-1">
            Enter the 5-digit code sent to your email
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {resendMsg && (
          <div className="p-3 mb-4 rounded-lg bg-[#fafafa] border border-gray-200 text-sm text-black">
            {resendMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[--text-secondary]">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={status === "loading"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-[--bg-primary] border border-[--border]
                         text-[--text-primary] placeholder:text-neutral-600
                         focus:outline-none focus:ring-2 focus:ring-[--accent]
                         transition-all duration-150 disabled:opacity-50"
            />
          </div>

          {/* 5-digit OTP input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[--text-secondary]">
              Verification Code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={status === "loading"}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-lg font-bold rounded-lg bg-[--bg-primary] border border-[--border]
                             text-[--text-primary] focus:outline-none focus:ring-2 focus:ring-[--accent]
                             transition-all duration-150 disabled:opacity-50"
                />
              ))}
            </div>
          </div>

          {/* Verify button */}
          <button
            type="submit"
            disabled={status === "loading" || code.length !== 5}
            className="w-full py-2.5 px-4 rounded-lg bg-[--accent] hover:bg-[--accent-hover]
                       text-white font-medium text-sm transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        {/* Resend link */}
        <div className="mt-6 text-center text-sm text-[--text-secondary]">
          Didnt get the code?{" "}
          <button
            onClick={handleResend}
            disabled={status === "loading"}
            className="text-[--accent] hover:underline font-medium disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
        <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-12 w-12 text-[--accent] animate-spin" />
            <p className="text-sm text-[--text-secondary]">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
