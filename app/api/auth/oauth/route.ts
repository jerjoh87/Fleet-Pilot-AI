"use server";

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNext(value: string | null) {
  const next = value ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const provider = searchParams.get("provider") ?? "";
  const next = safeNext(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const oauthProvider =
    provider === "google" ? "google" : provider === "yahoo" ? "custom:yahoo" : "";

  if (!oauthProvider) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Unsupported sign-in provider.")}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: oauthProvider as "google" | `custom:${string}`,
    options: {
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "Could not start social sign-in.")}`
    );
  }

  return NextResponse.redirect(data.url);
}
