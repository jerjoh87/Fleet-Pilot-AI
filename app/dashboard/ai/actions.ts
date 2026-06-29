"use server";

import { requireAppSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isEmailConfigured } from "@/lib/email/client";
import { sendEmail } from "@/lib/email/send";
import type { MaintenanceItem, Reservation, Vehicle } from "@/lib/types";
import {
  detectIdleVehicles,
  generateCampaign,
  predictRevenue,
  recommendMaintenance,
  type RevenuePoint
} from "@/lib/ai/insights";

export async function predictRevenueAction(series: RevenuePoint[]) {
  await requireAppSession();
  return predictRevenue(series);
}

export async function detectIdleVehiclesAction(vehicles: Vehicle[], reservations: Reservation[]) {
  await requireAppSession();
  return detectIdleVehicles(vehicles, reservations);
}

export async function recommendMaintenanceAction(vehicles: Vehicle[], maintenance: MaintenanceItem[]) {
  await requireAppSession();
  return recommendMaintenance(vehicles, maintenance);
}

export async function generateCampaignAction(input: {
  goal: "fill_idle" | "win_back" | "seasonal" | "corporate";
  channel: string;
  vehicles: Vehicle[];
}) {
  const session = await requireAppSession();
  return generateCampaign({
    goal: input.goal,
    channel: input.channel,
    vehicles: input.vehicles,
    organizationName: session.organization.name
  });
}

export async function sendCampaignAction(campaign: {
  channel: string;
  headline: string;
  body: string;
  cta: string;
}) {
  const session = await requireAppSession();
  const channel = campaign.channel.toLowerCase();

  if (!channel.includes("email")) {
    return {
      sent: 0,
      demo: true,
      message: "SMS dispatch needs an SMS provider key before live sends are enabled."
    };
  }

  const customers = isDatabaseConfigured()
    ? await prisma.customer.findMany({
        where: { organizationId: session.organization.id, blacklisted: false },
        select: { id: true, email: true, name: true },
        take: 500
      })
    : [{ id: "demo", email: session.user.email, name: session.user.email.split("@")[0] }];

  const recipients = customers.map((customer) => customer.email).filter(Boolean);
  if (!recipients.length) {
    return { sent: 0, demo: !isEmailConfigured(), message: "No customer email addresses found." };
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111827">
      <h1 style="font-size:24px;line-height:1.2">${campaign.headline}</h1>
      <p>${campaign.body}</p>
      <p><strong>${campaign.cta}</strong></p>
      <p style="color:#6b7280;font-size:13px">Sent by ${session.organization.name} via FleetPilot AI.</p>
    </div>
  `;

  await sendEmail({
    to: recipients,
    subject: campaign.headline,
    html
  });

  if (isDatabaseConfigured()) {
    await prisma.message.createMany({
      data: customers.map((customer) => ({
        organizationId: session.organization.id,
        customerId: customer.id,
        channel: "Email",
        body: `${campaign.headline}\n\n${campaign.body}\n\n${campaign.cta}`
      }))
    });
  }

  return {
    sent: recipients.length,
    demo: !isEmailConfigured(),
    message: isEmailConfigured()
      ? `Campaign sent to ${recipients.length} customer${recipients.length === 1 ? "" : "s"}.`
      : `Demo send logged for ${recipients.length} customer${recipients.length === 1 ? "" : "s"}. Add RESEND_API_KEY for live email.`
  };
}
