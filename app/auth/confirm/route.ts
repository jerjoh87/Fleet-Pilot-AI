/**
 * Supabase email confirmation callback.
 * Supabase redirects here after the user clicks the verification link.
 * We exchange the OTP token for a session, then send the user onward.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";

function safeNext(value: string | null) {
  const next = value ?? "/dashboard";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function customerPortalSlug(next: string) {
  const match = next.match(/^\/([^/?#]+)\/portal(?:$|[?#/])/);
  return match?.[1] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  let next = safeNext(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : token_hash && type
        ? await supabase.auth.verifyOtp({
            type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
            token_hash
          })
        : { error: new Error("Missing confirmation token.") };

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }

    if (isDatabaseConfigured()) {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (authUser) {
        const email = authUser.email ?? "";
        const fullName = String(authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? email);
        const portalSlug = customerPortalSlug(next);
        const user = await prisma.user.upsert({
          where: { id: authUser.id },
          update: { email, fullName },
          create: { id: authUser.id, email, fullName },
          include: { memberships: { take: 1 } }
        });
        if (portalSlug) {
          const org = await prisma.organization.findFirst({
            where: { OR: [{ slug: portalSlug }, { domain: portalSlug }] },
            select: { id: true }
          });
          if (org && email) {
            await prisma.customer.upsert({
              where: { organizationId_email: { organizationId: org.id, email } },
              update: { name: fullName },
              create: { organizationId: org.id, name: fullName, email }
            });
          }
        } else if (!user.memberships.length) {
          next = "/onboard";
        }
      }
    }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=Confirmation+failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
