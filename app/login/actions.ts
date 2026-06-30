"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safePath(value: FormDataEntryValue | null, fallback = "/login") {
  const path = String(value ?? fallback);
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function authError(message: string, path = "/login"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}` as never);
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

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next") ?? "/onboard");
  const errorPath = safePath(formData.get("errorPath"));

  if (!fullName || !email || password.length < 8) {
    authError("Enter your full name, email, and a password with at least 8 characters.", errorPath);
  }

  const supabase = await createSupabaseServerClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let signupResult: Awaited<ReturnType<typeof supabase.auth.signUp>> | null = null;

  try {
    signupResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        data: {
          full_name: fullName
        }
      }
    });
  } catch (error) {
    console.error("Host signup failed", error);
    authError("We could not create your account right now. Please try again.", errorPath);
  }

  if (!signupResult) {
    authError("We could not create your account right now. Please try again.", errorPath);
  }

  if (signupResult.error) {
    authError(signupResult.error.message, errorPath);
  }

  if (isDatabaseConfigured() && signupResult.data.user) {
    try {
      await prisma.user.upsert({
        where: { id: signupResult.data.user.id },
        update: { email, fullName },
        create: { id: signupResult.data.user.id, email, fullName }
      });
    } catch (error) {
      console.error("Host signup profile sync failed", error);
      authError("Your login was created, but we could not start host setup yet. Please sign in and try again.", errorPath);
    }
  }

  redirect(next as never);
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
