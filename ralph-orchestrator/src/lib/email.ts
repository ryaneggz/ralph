/**
 * Email utility placeholder.
 * Replace with a real email service (e.g., Resend, SendGrid, SES) in production.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  // TODO: Integrate real email provider
  console.log(`[EMAIL] Password reset for ${email}: ${resetUrl}`);
}
