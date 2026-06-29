/**
 * Supabase email confirmation callback.
 * Supabase redirects here after the user clicks the verification link.
 * We exchange the OTP token for a session, then send the user onward.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/onboard";

  if (!isSupabaseConfigured() || !token_hash || !type) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
      token_hash
    });

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=Confirmation+failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
