import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import {
  PasswordResetToken,
  generateResetToken,
} from "@/lib/models/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  }

  // Delete any existing tokens for this user
  await PasswordResetToken.deleteMany({ userId: user._id });

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    userId: user._id,
    token,
    expiresAt,
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(email, resetUrl);

  return NextResponse.json({
    message: "If an account exists with that email, a reset link has been sent.",
  });
}
