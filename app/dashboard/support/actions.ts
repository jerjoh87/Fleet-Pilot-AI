"use server";

import { revalidatePath } from "next/cache";
import { requireAppSession } from "@/lib/auth/session";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

type ActionResult = { ok: boolean; message: string; demo?: boolean };

export async function closeSupportMessageAction(messageId: string): Promise<ActionResult> {
  const session = await requireAppSession();

  if (!messageId) {
    return { ok: false, message: "Support message not found." };
  }

  if (!isDatabaseConfigured()) {
    return { ok: true, demo: true, message: "Demo mode: support request closed." };
  }

  await prisma.message.updateMany({
    where: {
      id: messageId,
      organizationId: session.organization.id,
      channel: "Support"
    },
    data: { status: "closed" }
  });

  revalidatePath("/dashboard");
  return { ok: true, message: "Support request closed." };
}
