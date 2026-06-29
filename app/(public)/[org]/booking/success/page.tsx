import { CheckCircle2 } from "lucide-react";
import { getPublicTenant } from "@/lib/data/public-data";

export const dynamic = "force-dynamic";

export default async function BookingSuccessPage({ params, searchParams }: PageProps<"/[org]/booking/success">) {
  const { org } = await params;
  const { reservation, demo } = (await searchParams) as { reservation?: string; demo?: string };
  const tenant = await getPublicTenant(org);
  const brand = tenant?.brandColor ?? "#166534";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center md:px-6">
      <span className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: `${brand}1a`, color: brand }}>
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Booking confirmed</h1>
      <p className="mt-3 text-muted-foreground">
        Thanks for booking with {tenant?.name}. A confirmation email with your rental agreement and pickup details is on
        its way.
      </p>

      {reservation ? (
        <div className="mt-6 rounded-xl border bg-card px-6 py-4 text-sm">
          <span className="text-muted-foreground">Reservation reference</span>
          <p className="font-mono font-medium">{reservation}</p>
        </div>
      ) : null}

      {demo ? (
        <p className="mt-4 max-w-md text-xs text-muted-foreground">
          Demo mode: no payment was processed. Add your Stripe keys to take live deposits and payments at checkout.
        </p>
      ) : null}

      <a
        href={`/${org}/portal?reservation=${encodeURIComponent(reservation ?? "")}`}
        className="mt-8 rounded-lg px-6 py-3 font-medium text-white"
        style={{ backgroundColor: brand }}
      >
        View reservation
      </a>
      <a href={`/${org}`} className="mt-4 text-sm font-medium text-muted-foreground hover:text-foreground">
        Back to {tenant?.name} fleet
      </a>
    </div>
  );
}
