import Link from "next/link";
import { Car } from "lucide-react";
import { redirect } from "next/navigation";
import { createOrganizationAction } from "@/app/onboard/actions";
import { getAppSession, requireAuthenticatedUser, slugifyOrganizationName } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Href = Parameters<typeof Link>[0]["href"];

export const dynamic = "force-dynamic";

export default async function OnboardPage() {
  const user = await requireAuthenticatedUser();
  const session = await getAppSession();

  if (session && !session.demo) {
    redirect("/dashboard" as never);
  }

  if (!isDatabaseConfigured()) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
            <a href="/" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Car className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">FleetPilot AI</span>
            </a>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-2xl rounded-3xl border bg-card p-8 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">onboarding</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Database required for onboarding.</h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              Add `DATABASE_URL` to create real organizations and memberships. Local demo mode is still available.
            </p>
            <Link className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90" href="/dashboard">
              Open demo dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const defaultOrg = user.fullName.includes("@") ? "FleetPilot Rentals" : `${user.fullName.split(" ")[0]}'s Rentals`;
  const defaultSlug = slugifyOrganizationName(defaultOrg);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 md:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Car className="size-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">FleetPilot AI</span>
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <section>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">booking site setup</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Create your rental workspace.</h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">
              Your slug becomes the public booking URL for your customers.
            </p>
          </section>

          <form action={createOrganizationAction} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Company name</span>
                <Input name="organizationName" defaultValue={defaultOrg} required />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Booking site slug</span>
                <Input name="slug" defaultValue={defaultSlug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="font-mono" required />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Custom domain (optional)</span>
                <Input name="domain" placeholder={`${defaultSlug}.fleetpilot.ai`} />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Public site headline</span>
                <Input name="heroTitle" defaultValue="Premium vehicles, booked in minutes." required />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Service area</span>
                <Input name="serviceArea" placeholder="Austin, TX" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">About your rental business</span>
                <textarea name="about" rows={4} placeholder="Tell customers what makes your fleet and service different." className="rounded-md border bg-card px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Brand color</span>
                <input name="brandColor" type="color" defaultValue="#166534" className="h-11 w-full rounded-md border bg-card px-3" required />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Profile background</span>
                <select name="backgroundStyle" defaultValue="soft" className="h-10 rounded-md border bg-card px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="soft">Soft brand tint</option>
                  <option value="solid">Solid brand panel</option>
                  <option value="cover">Cover photo</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-muted-foreground">Default security deposit</span>
                <Input name="depositFee" type="number" min="0" step="1" defaultValue={250} required />
              </label>
              <label className="flex items-start gap-3 rounded-xl border bg-muted/50 p-4 text-sm leading-6">
                <input name="tosAccepted" type="checkbox" required className="mt-1 accent-primary" />
                <span className="text-muted-foreground">
                  I agree to the FleetPilot AI{" "}
                  <Link href={"/legal/terms" as Href} target="_blank" className="text-primary underline">Host Terms of Service</Link>
                  {" "}and{" "}
                  <Link href={"/legal/privacy" as Href} target="_blank" className="text-primary underline">Privacy Policy</Link>.
                  I confirm that I am authorized to list vehicles on this platform, that my vehicles are legally registered,
                  insured, and roadworthy, and that I will comply with all applicable federal, state, and local laws.
                </span>
              </label>
              <Button className="mt-2">
                Create workspace
              </Button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground md:px-6">
          <p className="font-medium text-foreground">FleetPilot AI</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <a href="/legal/terms" className="hover:text-foreground transition">Terms of Service</a>
            <a href="/legal/privacy" className="hover:text-foreground transition">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
