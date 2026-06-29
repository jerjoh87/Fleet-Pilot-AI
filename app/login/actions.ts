"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authError(message: string) {
  redirect(`/login?error=${encodeURIComponent(message)}` as never);
}

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/dashboard");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authError(error.message);
  }

  if (isDatabaseConfigured()) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { take: 1 } }
    });

    if (!user?.memberships.length) {
      redirect("/onboard" as never);
    }
  }

  redirect(next as never);
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) {
    authError(error.message);
  }

  if (isDatabaseConfigured() && data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email, fullName },
      create: { id: data.user.id, email, fullName }
    });
    redirect("/onboard" as never);
  }

  redirect("/dashboard" as never);
}

export async function oauthSignInAction(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/dashboard" as never);
  }

  const provider = String(formData.get("provider") ?? "");
  const next = safeNext(formData.get("next"));
  const oauthProvider = provider === "google" ? "google" : provider === "yahoo" ? "custom:yahoo" : "";

  if (!oauthProvider) {
    authError("Unsupported sign-in provider.");
  }

  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: oauthProvider as "google" | `custom:${string}`,
    options: {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
    }
  });

  if (error || !data.url) {
    authError(error?.message ?? "Could not start social sign-in.");
  }

  redirect(data.url as never);
}
