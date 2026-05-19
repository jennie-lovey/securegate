import type { Metadata } from "next";
import { Inter, Mulish } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
});

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
    <html lang="en" className={`${inter.variable} ${mulish.variable}`}>
      <body>{children}</body>
    </html>
  );
}
