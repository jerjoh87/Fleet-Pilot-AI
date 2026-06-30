"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicTenant } from "@/lib/data/public-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function supportError(slug: string, message: string): never {
  redirect(`/${slug}/help?error=${encodeURIComponent(message)}` as never);
}

export async function submitHelpQuestionAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const tenant = await getPublicTenant(slug);

  if (!tenant) {
    supportError(slug, "This rental business could not be found.");
  }

  // Throttle support submissions per IP to prevent email/spam abuse.
  const ip = clientIp(await headers()) || "unknown";
  const limit = await rateLimit(`support:${ip}`, { limit: 5, windowSec: 600 });
  if (!limit.ok) {
    supportError(tenant.slug, "You've sent several requests recently. Please wait a few minutes and try again.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const reservation = String(formData.get("reservation") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();

  if (!name || !email || !topic || question.length < 10) {
    supportError(tenant.slug, "Please include your name, email, topic, and a question with at least 10 characters.");
  }

  const adminEmail = tenant.contactEmail || process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || "support@fleetpilot.ai";
  const body = [
    `New customer help request for ${tenant.name}`,
    `Name: ${name}`,
    `Email: ${email}`,
    reservation ? `Reservation: ${reservation}` : "",
    `Topic: ${topic}`,
    "",
    question
  ].filter(Boolean).join("\n");

  if (isDatabaseConfigured()) {
    await prisma.message.create({
      data: {
        organizationId: tenant.id,
        customerId: null,
        channel: "Support",
        subject: topic,
        customerName: name,
        customerEmail: email,
        reservationRef: reservation || null,
        status: "open",
        body
      }
    });
  }

  await sendEmail({
    to: adminEmail,
    subject: `Customer help request: ${topic} · ${tenant.name}`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 16px">New customer help request</h2>
        <p><strong>Business:</strong> ${escapeHtml(tenant.name)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${reservation ? `<p><strong>Reservation:</strong> ${escapeHtml(reservation)}</p>` : ""}
        <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
        <div style="margin-top:18px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
          ${escapeHtml(question).replace(/\n/g, "<br/>")}
        </div>
      </div>
    `
  });

  redirect(`/${tenant.slug}/help?sent=1` as never);
}
