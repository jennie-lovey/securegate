"use client";

import { useMemo } from "react";

export type Strength = "none" | "weak" | "fair" | "strong";

export function usePasswordStrength(password: string): Strength {
  return useMemo<Strength>(() => {
    if (!password) return "none";

    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const classesCount = [hasLowercase, hasUppercase, hasDigit, hasSymbol].filter(Boolean).length;

    if (password.length < 8 || classesCount <= 1) return "weak";
    if (password.length >= 12 && classesCount >= 3) return "strong";
    return "fair";
  }, [password]);
}

function strengthToColour(strength: Strength): string {
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
}

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = usePasswordStrength(password);
  const colour = strengthToColour(strength);

  return (
    <div>
      <div className="flex gap-1 mt-1.5">
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            strength !== "none" ? colour : "bg-[--border]"
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            strength === "fair" || strength === "strong" ? colour : "bg-[--border]"
          }`}
        />
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            strength === "strong" ? colour : "bg-[--border]"
          }`}
        />
      </div>
      <p className="text-xs mt-1 text-[--text-secondary]">
        {strength !== "none" && `Password strength: ${strength}`}
      </p>
    </div>
  );
}
