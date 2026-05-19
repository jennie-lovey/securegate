import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";
import { User, Mail, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Fallback protection if middleware somehow bypasses
  if (!session || !session.user) {
    redirect("/login");
  }

  const user = session.user as { name?: string; email?: string; emailVerified?: Date | string | null };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[--bg-primary] px-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl bg-[--bg-surface] border border-[--border] shadow-xl">
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="h-16 w-16 rounded-full bg-[--accent]/10 border border-[--accent]/30 flex items-center justify-center text-[--accent] mb-2">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold text-[--text-primary]">Dashboard</h1>
          <p className="text-sm text-[--text-secondary]">Protected user session space</p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          {/* Name Display */}
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[--bg-primary] border border-[--border]">
            <div className="text-[--text-secondary]">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[--text-secondary] font-medium uppercase tracking-wider">Full Name</p>
              <p className="text-sm font-semibold text-[--text-primary] truncate">
                {user.name || "N/A"}
              </p>
            </div>
          </div>

          {/* Email Display */}
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[--bg-primary] border border-[--border]">
            <div className="text-[--text-secondary]">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[--text-secondary] font-medium uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-semibold text-[--text-primary] truncate">
                {user.email || "N/A"}
              </p>
            </div>
          </div>

          {/* Verification Status Display */}
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-[--bg-primary] border border-[--border]">
            <div className="text-[--success]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[--text-secondary] font-medium uppercase tracking-wider">Security Verification</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[--success]" />
                <p className="text-xs font-semibold text-[--text-primary]">
                  Verified Account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <LogoutButton />
      </div>
    </main>
  );
}
