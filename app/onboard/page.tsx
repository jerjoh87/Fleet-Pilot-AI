import Link from "next/link";
import { redirect } from "next/navigation";
import { createOrganizationAction } from "@/app/onboard/actions";
import { getAppSession, requireAuthenticatedUser, slugifyOrganizationName } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/prisma";

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
      <main className="min-h-screen bg-[#070b16] px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-blue-300">operator_onboarding</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Database required for onboarding.</h1>
          <p className="mt-4 leading-7 text-slate-300">
            Add `DATABASE_URL` to create real organizations and memberships. Local demo mode is still available.
          </p>
          <Link className="mt-6 inline-flex rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400" href="/dashboard">
            Open demo dashboard
          </Link>
        </div>
      </main>
    );
  }

  const defaultOrg = user.fullName.includes("@") ? "FleetPilot Rentals" : `${user.fullName.split(" ")[0]}'s Rentals`;
  const defaultSlug = slugifyOrganizationName(defaultOrg);

  return (
    <main className="min-h-screen bg-[#070b16] px-4 py-10 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-blue-300">operator_onboarding / booking site setup</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-white md:text-6xl">Create your rental workspace.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Your slug becomes the public booking URL: `your-slug.fleetpilot.ai` and `/{defaultSlug}` locally.
          </p>
        </section>

        <form action={createOrganizationAction} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Company name</span>
              <input name="organizationName" defaultValue={defaultOrg} className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Booking site slug</span>
              <input name="slug" defaultValue={defaultSlug} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Custom domain (optional)</span>
              <input name="domain" placeholder={`${defaultSlug}.fleetpilot.ai`} className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Public site headline</span>
              <input name="heroTitle" defaultValue="Premium vehicles, booked in minutes." className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Service area</span>
              <input name="serviceArea" placeholder="Austin, TX" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">About your rental business</span>
              <textarea name="about" rows={4} placeholder="Tell customers what makes your fleet and service different." className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Brand color</span>
              <input name="brandColor" type="color" defaultValue="#166534" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3" required />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Profile background</span>
              <select name="backgroundStyle" defaultValue="soft" className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500">
                <option className="bg-slate-950" value="soft">Soft brand tint</option>
                <option className="bg-slate-950" value="solid">Solid brand panel</option>
                <option className="bg-slate-950" value="cover">Cover photo</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-slate-300">Default security deposit</span>
              <input name="depositFee" type="number" min="0" step="1" defaultValue={250} className="h-11 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-white outline-none focus:ring-2 focus:ring-blue-500" required />
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6">
              <input name="tosAccepted" type="checkbox" required className="mt-1 accent-blue-500" />
              <span className="text-slate-300">
                I agree to the FleetPilot AI{" "}
                <Link href={"/legal/terms" as Href} target="_blank" className="text-blue-400 underline">Host Terms of Service</Link>
                {" "}and{" "}
                <Link href={"/legal/privacy" as Href} target="_blank" className="text-blue-400 underline">Privacy Policy</Link>.
                I confirm that I am authorized to list vehicles on this platform, that my vehicles are legally registered,
                insured, and roadworthy, and that I will comply with all applicable federal, state, and local laws.
              </span>
            </label>
            <button className="mt-2 rounded-lg bg-blue-500 px-5 py-3 font-medium text-white hover:bg-blue-400">
              Create workspace
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
