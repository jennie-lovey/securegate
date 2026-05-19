"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full py-2 px-4 rounded-lg bg-red-950/40 border border-red-800/50 hover:bg-red-900/40
                 text-red-400 font-medium text-sm transition-colors duration-150
                 flex items-center justify-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </button>
  );
}
