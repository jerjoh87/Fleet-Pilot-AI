"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicTenant } from "@/lib/data/public-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

function safeNext(value: FormDataEntryValue | null, slug: string) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : `/${slug}/portal`;
}

function signupError(slug: string, message: string, next?: string): never {
  const params = new URLSearchParams({ error: message });
  if (next) params.set("next", next);
  redirect(`/${slug}/signup?${params.toString()}` as never);
}

export async function customerSignUpAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const tenant = await getPublicTenant(slug);

  if (!tenant) {
    signupError(slug, "This rental business could not be found.");
  }

  const nextPath = safeNext(formData.get("next"), tenant.slug);

  // Throttle account creation per IP to prevent auth-user flooding.
  const ip = clientIp(await headers()) || "unknown";
  const limit = await rateLimit(`signup:${ip}`, { limit: 5, windowSec: 600 });
  if (!limit.ok) {
    signupError(tenant.slug, "Too many signups from this network. Please wait a few minutes and try again.", nextPath);
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!fullName || !email || password.length < 8) {
    signupError(tenant.slug, "Enter your name, email, and an 8+ character password.", nextPath);
  }

  // After signup, send the renter on to wherever they were headed (a booking
  // page if they were trying to book) with their email pre-filled.
  const postAuthPath = nextPath.includes("?")
    ? `${nextPath}&email=${encodeURIComponent(email)}`
    : `${nextPath}?email=${encodeURIComponent(email)}`;

  if (!isSupabaseConfigured()) {
    redirect(postAuthPath as never);
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  let authUserId: string | null = null;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(postAuthPath)}`,
        data: {
          full_name: fullName,
          account_type: "customer",
          tenant_slug: tenant.slug
        }
      }
    });

    if (error) {
      signupError(tenant.slug, error.message, nextPath);
    }

    authUserId = data.user?.id ?? null;
  } catch (error) {
    console.error("[customer-signup:auth]", error);
    signupError(tenant.slug, "Customer signup could not be completed. Please try again.", nextPath);
  }

  if (isDatabaseConfigured()) {
    try {
      const org = await prisma.organization.findFirst({
        where: { OR: [{ slug: tenant.slug }, { domain: tenant.slug }] },
        select: { id: true }
      });

      if (org) {
        await prisma.customer.upsert({
          where: { organizationId_email: { organizationId: org.id, email } },
          update: { name: fullName },
          create: {
            organizationId: org.id,
            name: fullName,
            email
          }
        });
      }

      if (authUserId) {
        await prisma.user.upsert({
          where: { id: authUserId },
          update: { email, fullName },
          create: { id: authUserId, email, fullName }
        });
      }
    } catch (error) {
      console.error("[customer-signup:db]", error);
      redirect(postAuthPath as never);
    }
  }

  redirect(postAuthPath as never);
}

/** Sign an existing renter in with email + password, then continue to `next`. */
export async function customerSignInAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const tenant = await getPublicTenant(slug);
  if (!tenant) {
    signupError(slug, "This rental business could not be found.");
  }

  const nextPath = safeNext(formData.get("next"), tenant.slug);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    redirect(nextPath as never);
  }

  if (!email || !password) {
    signupError(tenant.slug, "Enter your email and password to sign in.", nextPath);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    signupError(tenant.slug, error.message, nextPath);
  }

  redirect(nextPath as never);
}
