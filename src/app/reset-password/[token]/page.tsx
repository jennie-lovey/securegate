"use client";

import { useParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <ResetPasswordForm token={token} />
    </main>
  );
}
