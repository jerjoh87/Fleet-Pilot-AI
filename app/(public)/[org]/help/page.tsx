import { CircleHelp, Clock3, FileText, LifeBuoy, Mail, ShieldCheck } from "lucide-react";
import { submitHelpQuestionAction } from "@/app/(public)/[org]/help/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPublicTenant } from "@/lib/data/public-data";
import type { OrgRoutePageProps } from "../route-types";

export const dynamic = "force-dynamic";

export default async function HelpPage({
  params,
  searchParams
}: OrgRoutePageProps<{ sent?: string; error?: string }>) {
  const { org } = await params;
  const query = (await searchParams) as { sent?: string; error?: string };
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";
  const slug = tenant?.slug ?? org;

  const topics = [
    {
      icon: FileText,
      title: "Reservation questions",
      body: "Ask about pickup details, trip changes, agreements, or reservation status."
    },
    {
      icon: ShieldCheck,
      title: "Insurance and deposits",
      body: "Get help with coverage choices, security deposit holds, and release timing."
    },
    {
      icon: Clock3,
      title: "Pickup and return",
      body: "Confirm location, timing, late returns, vehicle access, and host instructions."
    }
  ];

  return (
    <div>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <p className="text-sm font-medium text-muted-foreground">{tenant?.name} support</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Ask the rental admin for help</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            Submit a question to the host/admin team and include your reservation reference if you already booked.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={`/${slug}/portal`}
              className="inline-flex h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: brand }}
            >
              Find my reservation
            </a>
            <a
              href={`/${slug}/how-it-works`}
              className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold hover:bg-muted"
            >
              How booking works
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <article key={topic.title} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" style={{ color: brand }} />
                  </span>
                  <div>
                    <h2 className="font-semibold">{topic.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{topic.body}</p>
                  </div>
                </div>
              </article>
            );
          })}

          <article className="rounded-2xl border bg-card p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Mail className="size-5" style={{ color: brand }} />
              </span>
              <div>
                <h2 className="font-semibold">Direct contact</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {tenant?.contactEmail || tenant?.contactPhone
                    ? [tenant.contactEmail, tenant.contactPhone].filter(Boolean).join(" · ")
                    : "The host will receive your question through FleetPilot AI."}
                </p>
              </div>
            </div>
          </article>
        </div>

        <section className="rounded-3xl border bg-card p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Submit a question</h2>
              <p className="mt-1 text-sm text-muted-foreground">The admin team will use your email to reply.</p>
            </div>
            <LifeBuoy className="size-5 shrink-0" style={{ color: brand }} />
          </div>

          {query.sent ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
              Your question was sent to the rental admin.
            </div>
          ) : null}

          {query.error ? (
            <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {query.error}
            </div>
          ) : null}

          <form action={submitHelpQuestionAction} className="mt-5 grid gap-3">
            <input type="hidden" name="slug" value={slug} />
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email address" required />
            <Input name="reservation" placeholder="Reservation reference (optional)" />
            <label className="text-sm">
              <span className="text-muted-foreground">Topic</span>
              <select name="topic" required className="mt-1 h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Choose a topic</option>
                <option>Reservation question</option>
                <option>Pickup or return</option>
                <option>Insurance or deposit</option>
                <option>Rental agreement</option>
                <option>Billing or refund</option>
                <option>Other</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Question</span>
              <textarea
                name="question"
                rows={6}
                minLength={10}
                placeholder="Tell the admin what you need help with."
                required
                className="mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <Button className="mt-2" style={{ backgroundColor: brand }}>
              <CircleHelp className="size-4" />
              Send question
            </Button>
          </form>
        </section>
      </section>
    </div>
  );
}
