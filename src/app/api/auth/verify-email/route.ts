import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const verifySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    // Validate inputs
    const result = verifySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid token data" },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Look up token in database
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification link. It may have already been used." },
        { status: 400 }
      );
    }

    // Check token expiry
    if (new Date() > verificationToken.expires) {
      // Keep expired token in DB or let the user delete/cleanup?
      // Better to delete it so it cannot be re-checked, and return expired error.
      try {
        await prisma.verificationToken.delete({
          where: { token },
        });
      } catch (err) {
        console.error("[verify-email] Cleanup of expired token failed:", err);
      }

      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Update User.emailVerified and delete the consumed token in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: verificationToken.identifier },
        data: { emailVerified: new Date() },
      });

      await tx.verificationToken.delete({
        where: { token },
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
