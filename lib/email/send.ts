/**
 * All outbound email goes through this module. When RESEND_API_KEY is not
 * set we log to the console so local development never hard-errors.
 */
import { fromAddress, getResend, isEmailConfigured } from "@/lib/email/client";

type SendInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(input: SendInput): Promise<void> {
  if (!isEmailConfigured()) {
    console.log("[email:demo]", input.subject, "→", input.to);
    return;
  }

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html
  });

  if (error) {
    console.error("[email:error]", error.message);
  }
}
