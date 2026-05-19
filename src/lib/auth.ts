import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "./prisma";
import { loginRateLimiter } from "./rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 1. Rate Limit check
        const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
        const limitResult = await loginRateLimiter.limit(ip);
        if (!limitResult.success) {
          throw new Error("Too many attempts. Please wait before trying again.");
        }

        // 2. Validate credentials structure using Zod
        const result = loginSchema.safeParse(credentials);
        if (!result.success) {
          return null; // NextAuth handles null by returning generic invalid credentials error
        }

        const { email, password } = result.data;

        try {
          // Normalize email by trimming and lowercasing
          const normalizedEmail = email.trim().toLowerCase();

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            return null; // Prevents email existence leakage by showing same generic error
          }

          // Compare password hash
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return null;
          }

          // Return user object mapping fields for token
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("[auth-authorize]", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // JWT sessions for edge-compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Pass user database properties to JWT payload
      if (user) {
        token.id = user.id;
        token.emailVerified = (user as any).emailVerified;
      }
      
      // Handle session updates (e.g. after email verification)
      if (trigger === "update" && session) {
        if (session.emailVerified !== undefined) {
          token.emailVerified = session.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose properties to client session
      if (session.user && token) {
        (session.user as any).id = token.id;
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect to login on authentication errors
  },
};
