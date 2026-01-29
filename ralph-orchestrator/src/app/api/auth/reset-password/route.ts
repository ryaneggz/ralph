import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/user";
import { PasswordResetToken } from "@/lib/models/password-reset-token";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "Token and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  await connectDB();

  const resetToken = await PasswordResetToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  if (!resetToken) {
    return NextResponse.json(
      { error: "Invalid or expired reset token" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await User.findByIdAndUpdate(resetToken.userId, {
    password: hashedPassword,
  });

  await PasswordResetToken.deleteMany({ userId: resetToken.userId });

  return NextResponse.json({
    message: "Password has been reset successfully",
  });
}
