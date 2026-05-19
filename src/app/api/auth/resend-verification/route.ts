import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getForgotPasswordRateLimiter, getClientIp } from "@/lib/rate-limit";
import { generateToken, verificationExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate Limit check (3 attempts / 15m)
  const ip = getClientIp(req.headers);
  const limiter = await getForgotPasswordRateLimiter();
  const limitResult = await limiter.limit(ip);
  if (!limitResult.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = resendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // SECURITY: Always return success to prevent email enumeration
    const successResponse = NextResponse.json(
      { message: "If the email is associated with an unverified account, a verification link has been sent." },
      { status: 200 }
    );

    if (!user || user.emailVerified) {
      return successResponse;
    }

    // Clean up any existing verification tokens for this user
    try {
      await prisma.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });
    } catch (err) {
      // Ignore if none found
    }

    // Generate new token & expiry
    const token = generateToken();
    const expires = verificationExpiry();

    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires,
      },
    });

    // Send the email
    await sendVerificationEmail(normalizedEmail, token);

    return successResponse;
  } catch (error) {
    console.error("[resend-verification]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
