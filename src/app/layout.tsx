import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureGate - Secure Authentication System",
  description: "Secure, production-ready identity and access management gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
