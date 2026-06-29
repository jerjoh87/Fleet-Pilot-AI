import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// The platform root domain. Override in production (e.g. fleetpilot.ai) so the
// same code works on staging/preview domains without a rebuild.
const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "fleetpilot.ai").toLowerCase();

// Subdomains that are part of the platform itself, never a tenant.
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api", "dashboard"]);

/**
 * Resolves the [org] route segment a request host maps to:
 *  - `<slug>.<ROOT_DOMAIN>` → the tenant slug
 *  - a fully custom domain  → the hostname (resolved against Organization.domain)
 *  - the root domain, localhost, or a Vercel preview → null (no tenant rewrite)
 */
function tenantTargetFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();

  // Local development and Vercel preview builds are never tenant hosts.
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".vercel.app")) {
    return null;
  }

  // Platform subdomain: <slug>.<ROOT_DOMAIN>.
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1).split(".")[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  // The bare root (and www) host serves the marketing site / app, not a tenant.
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;

  // Anything else is a host's own custom domain, matched by Organization.domain.
  return hostname;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Tenant subdomain / custom domain → rewrite to the public /[org] routes.
  const target = tenantTargetFromHost(request.headers.get("host"));
  if (target && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
    // Guard against double-prefixing: links on tenant pages are /<org>/… so the
    // follow-up request already carries the segment — pass it straight through.
    const alreadyScoped = pathname === `/${target}` || pathname.startsWith(`/${target}/`);
    if (!alreadyScoped) {
      const url = request.nextUrl.clone();
      url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isOnboardRoute = request.nextUrl.pathname.startsWith("/onboard");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || isOnboardRoute;

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets so tenant
  // subdomains can be rewritten, while auth logic still gates /dashboard & /login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"]
};
