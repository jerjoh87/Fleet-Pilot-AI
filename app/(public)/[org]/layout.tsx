import { notFound } from "next/navigation";
import { Car, Instagram, Facebook, User } from "lucide-react";
import { getPublicTenant } from "@/lib/data/public-data";

export const dynamic = "force-dynamic";

export default async function PublicTenantLayout({ children, params }: LayoutProps<"/[org]">) {
  const { org } = await params;
  const tenant = await getPublicTenant(org);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <a href={`/${tenant.slug}`} className="flex items-center gap-2.5">
            <span
              className="flex size-9 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: tenant.logoUrl ? "transparent" : tenant.brandColor }}
            >
              {tenant.logoUrl ? <img src={tenant.logoUrl} alt={`${tenant.name} logo`} className="size-9 rounded-xl object-cover" /> : <Car className="size-5" />}
            </span>
            <span className="text-lg font-bold tracking-tight">{tenant.name}</span>
          </a>

          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            <a href={`/${tenant.slug}`} className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              Browse cars
            </a>
            <a href={`/${tenant.slug}#policies`} className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              How it works
            </a>
            <a href={`/${tenant.slug}#contact`} className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              Help
            </a>
            <a href={`/${tenant.slug}/portal`} className="rounded-full px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
              My reservations
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`/${tenant.slug}`}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-block"
            >
              Become a host
            </a>
            <a
              href={`/${tenant.slug}/portal`}
              className="flex items-center gap-2 rounded-full border bg-card py-1.5 pl-3 pr-1.5 text-sm font-medium shadow-sm transition hover:shadow-md"
            >
              Portal
              <span className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" />
              </span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer id="contact" className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:px-6">
          <p className="font-medium text-foreground">{tenant.name}</p>
          <p>Reservations & support · {tenant.domain}</p>
          {tenant.contactEmail || tenant.contactPhone ? (
            <p>{[tenant.contactEmail, tenant.contactPhone].filter(Boolean).join(" · ")}</p>
          ) : null}
          <div className="flex gap-3">
            {tenant.instagramUrl ? <a className="inline-flex items-center gap-1 hover:text-foreground" href={tenant.instagramUrl}><Instagram className="size-4" />Instagram</a> : null}
            {tenant.facebookUrl ? <a className="inline-flex items-center gap-1 hover:text-foreground" href={tenant.facebookUrl}><Facebook className="size-4" />Facebook</a> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span>Powered by <span className="font-medium text-foreground">FleetPilot AI</span></span>
            <a href="/legal/terms" className="hover:text-foreground transition">Terms of Service</a>
            <a href="/legal/privacy" className="hover:text-foreground transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
