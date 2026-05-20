function getFromAddress(): string {
  if (process.env.RESEND_FROM_ADDRESS) {
    return process.env.RESEND_FROM_ADDRESS;
  }
  return "SecureGate <onboarding@resend.dev>";
}

export async function sendVerificationEmail(email: string, otp: string) {
  const verifyLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify-email?email=${encodeURIComponent(email)}`;

  console.log("\n=========================================");
  console.log(`[VERIFICATION CODE] Email: ${email}`);
  console.log(`Link: ${verifyLink}`);
  console.log(`Code: ${otp}`);
  console.log("=========================================\n");

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_mock")) {
    return { success: true, data: null };
  }

  try {
    const { Resend } = await import("resend");
    const data = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: getFromAddress(),
      to: email,
      subject: "Verify your SecureGate account",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #ffffff; color: #333333;">
          <h2 style="color: #6366f1;">Verify your SecureGate account</h2>
          <p>Click the button below to verify your email address:</p>
          <a href="${verifyLink}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Verify Email</a>
          <p>Or enter this code on the verification page:</p>
          <div style="text-align: center; margin: 20px 0; padding: 16px; background: #f4f4f5; border-radius: 12px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #333;">${otp}</div>
          <p style="font-size: 12px; color: #888;">This code is valid for 15 minutes. If you did not request this, ignore this email.</p>
        </div>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[sendVerificationEmail] Failed to send email via Resend:", error);
    if (!process.env.RESEND_FROM_ADDRESS) {
      console.warn(
        "[sendVerificationEmail] No RESEND_FROM_ADDRESS set. Using onboarding@resend.dev, which can only send to the email that owns the Resend API key. Add RESEND_FROM_ADDRESS (e.g. 'SecureGate <noreply@yourdomain.com>') with a verified domain in Resend."
      );
    }
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
    const { Resend } = await import("resend");
    const data = await new Resend(process.env.RESEND_API_KEY).emails.send({
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
