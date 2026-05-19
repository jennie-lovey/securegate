import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getResetPasswordRateLimiter } from "@/lib/rate-limit";
import { SALT_ROUNDS } from "@/lib/constants";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Rate Limit check
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const limiter = await getResetPasswordRateLimiter();
  const limitResult = await limiter.limit(ip);
  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    
    // 2. Validate input with Zod
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // 3. Find Reset Token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid password reset link. It may have already been used." },
        { status: 400 }
      );
    }

    // 4. Check if token expired
    if (new Date() > resetToken.expires) {
      try {
        await prisma.passwordResetToken.delete({
          where: { token },
        });
      } catch (err) {
        // Ignore errors
      }

      return NextResponse.json(
        { error: "Password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 5. Hash new password (12 salt rounds)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 6. Update user's password and delete the consumed token in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.delete({
        where: { token },
      });
    });

    return NextResponse.json(
      { message: "Your password has been successfully reset! You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
