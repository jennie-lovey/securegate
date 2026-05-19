import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  email: z.string().email("Invalid email format"),
  code: z.string().length(5, "Verification code must be 5 digits"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    // Validate inputs
    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { email, code } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Look up OTP in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: normalizedEmail, token: code } },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    // Check token expiry
    if (new Date() > verificationToken.expires) {
      try {
        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: normalizedEmail, token: code } },
        });
      } catch (err) {
        console.error("[verify-email] Cleanup of expired token failed:", err);
      }

      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update User.emailVerified and delete the consumed token in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: normalizedEmail },
        data: { emailVerified: new Date() },
      });

      await tx.verificationToken.delete({
        where: { identifier_token: { identifier: normalizedEmail, token: code } },
      });
    });

    return NextResponse.json(
      { message: "Your email has been successfully verified!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
