"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPublicTenant } from "@/lib/data/public-data";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function signupError(slug: string, message: string): never {
  redirect(`/${slug}/signup?error=${encodeURIComponent(message)}` as never);
}

export async function customerSignUpAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const tenant = await getPublicTenant(slug);

  if (!tenant) {
    signupError(slug, "This rental business could not be found.");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const portalPath = `/${tenant.slug}/portal?email=${encodeURIComponent(email)}`;

  if (!fullName || !email || password.length < 8) {
    signupError(tenant.slug, "Enter your name, email, and an 8+ character password.");
  }

  if (!isSupabaseConfigured()) {
    redirect(portalPath as never);
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
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(portalPath)}`,
        data: {
          full_name: fullName,
          account_type: "customer",
          tenant_slug: tenant.slug
        }
      }
    });

    if (error) {
      signupError(tenant.slug, error.message);
    }

    authUserId = data.user?.id ?? null;
  } catch (error) {
    console.error("[customer-signup:auth]", error);
    signupError(tenant.slug, "Customer signup could not be completed. Please try again.");
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
          update: { name: fullName, phone: phone || null },
          create: {
            organizationId: org.id,
            name: fullName,
            email,
            phone: phone || null
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
      redirect(portalPath as never);
    }
  }

  redirect(portalPath as never);
}
