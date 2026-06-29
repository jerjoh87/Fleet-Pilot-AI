import { BadgeCheck, Clock, Star, TrendingUp } from "lucide-react";
import type { HostProfile } from "@/lib/data/public-data";

/** Airbnb-style host trust band: avatar, rating, completed trips, response time, verifications. */
export function HostTrust({ host, brand }: { host: HostProfile; brand: string }) {
  const stats = [
    { icon: Star, label: `${host.rating.toFixed(2)} rating`, sub: `${host.reviewCount} reviews` },
    { icon: TrendingUp, label: `${host.completedTrips.toLocaleString()} trips`, sub: "completed" },
    { icon: Clock, label: host.responseTime, sub: `${host.responseRate}% response rate` }
  ];

  return (
    <div className="rounded-3xl border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-white"
            style={{ backgroundColor: brand }}
          >
            {host.initials}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">Hosted by {host.name}</h3>
              <BadgeCheck className="size-5" style={{ color: brand }} />
            </div>
            <p className="text-sm text-muted-foreground">Superhost · Joined {host.joinedYear}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center md:text-left">
                <p className="flex items-center justify-center gap-1.5 font-semibold md:justify-start">
                  <Icon className="size-4 text-muted-foreground" />
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t pt-6">
        {host.verifications.map((verification) => (
          <span
            key={verification}
            className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium"
          >
            <BadgeCheck className="size-3.5 text-emerald-600" /> {verification}
          </span>
        ))}
      </div>
    </div>
  );
}
