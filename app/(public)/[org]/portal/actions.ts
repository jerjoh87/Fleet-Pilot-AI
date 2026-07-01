"use server";

import { redirect } from "next/navigation";
import { getPublicTenant } from "@/lib/data/public-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function portalError(slug: string, message: string): never {
  redirect(`/${slug}/portal?error=${encodeURIComponent(message)}` as never);
}

/**
 * Update the signed-in customer's profile. Identity (email) comes from the
 * authenticated session — never from the form — so a customer can only edit
 * their own record.
 */
export async function updateCustomerProfileAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const tenant = await getPublicTenant(slug);
  if (!tenant) portalError(slug, "This rental business could not be found.");

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    portalError(tenant.slug, "Profile editing requires a signed-in account.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (!email) portalError(tenant.slug, "Please sign in to update your profile.");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "");
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "";
  if (name.length < 2) portalError(tenant.slug, "Please enter your full name.");

  const org = await prisma.organization.findFirst({
    where: { OR: [{ slug: tenant.slug }, { domain: tenant.slug }] },
    select: { id: true }
  });
  if (!org) portalError(tenant.slug, "This rental business could not be found.");

  await prisma.customer.upsert({
    where: { organizationId_email: { organizationId: org.id, email } },
    update: { name, phone: phone || null, address: address || null },
    create: { organizationId: org.id, email, name, phone: phone || null, address: address || null }
  });

  // If they were completing their profile in order to book, send them back.
  if (next) redirect(next as never);
  redirect(`/${tenant.slug}/portal?saved=1` as never);
}

/** Sign the customer out and return them to this tenant's portal. */
export async function signOutCustomerAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect(`/${slug}/portal` as never);
}
