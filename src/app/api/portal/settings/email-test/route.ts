import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { sendEmail } from "@/lib/email/mailer";

/**
 * POST /api/portal/settings/email-test — sends a test message to the caller's
 * own address so they can verify the SMTP credentials before relying on them.
 * Requires settings:system.
 */
export const POST = withPermission("settings:system", async (_request, { user }) => {
  const result = await sendEmail({
    to: user.email,
    subject: "MCBHLUES Staff Portal — email delivery test",
    text:
      `Hello ${user.firstName},\n\n` +
      "This is a test message from the MCBHLUES Staff Portal.\n\n" +
      "If you are reading this, your email delivery settings are working — " +
      "customer enquiry replies, auto-replies and staff invitations will now be sent automatically.\n\n" +
      "MCBHLUES ENTERPRISES",
    purpose: "email_test",
  });

  if (result.status === "sent") {
    return NextResponse.json({ ok: true, result });
  }
  return NextResponse.json(
    { ok: false, result, error: result.error ?? "The test email could not be delivered." },
    { status: result.status === "queued" ? 200 : 502 }
  );
});
