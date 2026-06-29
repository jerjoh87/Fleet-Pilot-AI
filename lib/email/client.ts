import { Resend } from "resend";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(apiKey);
}

/** The "from" address for all outgoing mail. Verified in your Resend domain. */
export function fromAddress() {
  return process.env.EMAIL_FROM ?? "FleetPilot AI <noreply@fleetpilot.ai>";
}
