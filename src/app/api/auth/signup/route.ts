import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSignupRateLimiter, getClientIp } from "@/lib/rate-limit";
import { generateOtp, verificationExpiry } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { SALT_ROUNDS } from "@/lib/constants";


const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Rate Limit check
  const ip = getClientIp(req.headers);
  const limiter = await getSignupRateLimiter();
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
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_mock")) {
        console.log(`\n[EMAIL MOCK] Account already exists notification to: ${normalizedEmail}`);
      } else {
        const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          const from = process.env.RESEND_FROM_ADDRESS || "SecureGate <onboarding@resend.dev>";
          await resend.emails.send({
            from,
            to: normalizedEmail,
            subject: "SecureGate account already exists",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
                <h2 style="color: #6366f1;">Account Already Exists</h2>
                <p>Someone (hopefully you) tried to sign up for an account on SecureGate using this email address.</p>
                <p>Since an account already exists with this email address, you can log in directly or reset your password if you forgot it.</p>
                <a href="${loginUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Log In</a>
              </div>
            `,
          });
        } catch (err) {
          console.error("[signup] Failed sending existing email notification:", err);
        }
      }

      return NextResponse.json(
        { message: "Check your email for a verification link." },
        { status: 200 }
      );
    }

    // 4. Hash password with bcryptjs (12 rounds)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create new User & VerificationToken in transaction
    const otp = generateOtp();
    const expires = verificationExpiry();

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
        },
      });

      await tx.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: otp,
          expires,
        },
      });
    });

    // 6. Send OTP via email
    const emailSent = await sendVerificationEmail(normalizedEmail, otp);

    if (!emailSent.success) {
      console.error("[signup] Verification email failed to send.");
    }

    return NextResponse.json(
      {
        message: "Account created! Check your email for the verification code.",
        email: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[signup]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
