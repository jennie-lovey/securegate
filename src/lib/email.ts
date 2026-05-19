import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

function getFromAddress(): string {
  if (process.env.RESEND_FROM_ADDRESS) {
    return process.env.RESEND_FROM_ADDRESS;
  }
  return "SecureGate <onboarding@resend.dev>";
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email/${token}`;
  
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_mock")) {
    console.log("\n=========================================");
    console.log(`[EMAIL SEND MOCK] Verification email to: ${email}`);
    console.log(`Verification URL: ${verifyUrl}`);
    console.log("=========================================\n");
    return { success: true, data: null };
  }

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #6366f1;">Verify your SecureGate account</h2>
          <p>Please click the button below to verify your email address. This link is valid for 15 minutes.</p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Verify Email</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not request this email, please ignore it.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[sendVerificationEmail] Failed to send email via Resend:", error);
    console.error("[sendVerificationEmail] If using onboarding@resend.dev, it can only send to the email address that owns the Resend API key. Add RESEND_FROM_ADDRESS env var with a verified domain sender (e.g. 'SecureGate <noreply@yourdomain.com>') in production.");
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/${token}`;

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_mock")) {
    console.log("\n=========================================");
    console.log(`[EMAIL SEND MOCK] Password Reset email to: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=========================================\n");
    return { success: true, data: null };
  }

  try {
    const data = await resend.emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #6366f1;">Reset your SecureGate password</h2>
          <p>Please click the button below to reset your password. This link is valid for 1 hour.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[sendPasswordResetEmail] Failed to send email via Resend:", error);
    console.error("[sendPasswordResetEmail] If using onboarding@resend.dev, it can only send to the email address that owns the Resend API key. Add RESEND_FROM_ADDRESS env var with a verified domain sender (e.g. 'SecureGate <noreply@yourdomain.com>') in production.");
    return { success: false, error };
  }
}
