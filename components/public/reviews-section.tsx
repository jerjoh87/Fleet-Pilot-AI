import { Star } from "lucide-react";
import type { HostProfile, PublicReview } from "@/lib/data/public-data";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${index < rating ? "fill-foreground text-foreground" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

/** Airbnb-style reviews grid with a rating summary header. */
export function ReviewsSection({ host, reviews }: { host: HostProfile; reviews: PublicReview[] }) {
  if (!reviews.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <div className="mb-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Star className="size-6 fill-foreground text-foreground" />
          {host.rating.toFixed(2)}
        </h2>
        <span className="text-2xl font-bold text-muted-foreground">·</span>
        <h2 className="text-2xl font-bold">{host.reviewCount} reviews</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {review.initials}
              </span>
              <div>
                <p className="font-semibold leading-tight">{review.author}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Stars rating={review.rating} />
              {review.vehicle ? <span className="text-xs text-muted-foreground">· {review.vehicle}</span> : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
