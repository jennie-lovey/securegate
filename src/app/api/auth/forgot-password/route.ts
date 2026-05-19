import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { forgotPasswordRateLimiter } from "@/lib/rate-limit";
import { generateToken, resetExpiry } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Rate Limit check
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const limitResult = await forgotPasswordRateLimiter.limit(ip);
  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    
    // 2. Validate input with Zod
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // SECURITY: Always return success message to client to prevent user enumeration
    const successResponse = NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 }
    );

    // 3. Find User
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // User doesn't exist, return success immediately
      return successResponse;
    }

    // 4. Clean up any existing reset tokens for this email
    try {
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });
    } catch (err) {
      // Ignore if none found
    }

    // 5. Generate Reset Token (1-hour expiry)
    const token = generateToken();
    const expires = resetExpiry();

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    // 6. Send Email via Resend
    await sendPasswordResetEmail(normalizedEmail, token);

    return successResponse;
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
