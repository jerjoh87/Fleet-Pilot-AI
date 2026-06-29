"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { AvailabilityBlock, PublicVehicle } from "@/lib/data/public-data";
import { currency } from "@/lib/utils";

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function overlapsRange(startDate: string, endDate: string, blocks: AvailabilityBlock[]) {
  if (!startDate || !endDate) return false;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return blocks.some((block) => {
    const blockStart = new Date(`${block.startsAt}T00:00:00`);
    const blockEnd = new Date(`${block.endsAt}T00:00:00`);
    return blockStart < end && blockEnd > start;
  });
}

export function BookingForm({
  slug,
  vehicle,
  brandColor,
  depositFee,
  availabilityBlocks
}: {
  slug: string;
  vehicle: PublicVehicle;
  brandColor: string;
  depositFee: number;
  availabilityBlocks: AvailabilityBlock[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState("");
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date(`${today}T00:00:00`));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const days = Math.max(1, daysBetween(startDate, endDate));
  const hasRange = Boolean(startDate && endDate && daysBetween(startDate, endDate) > 0);
  const subtotal = days * vehicle.dailyRate;
  const taxes = Math.round(subtotal * 0.08);
  const deposit = Math.max(0, Math.round(depositFee));
  const rentalTotal = subtotal + taxes;
  const dueToday = rentalTotal + deposit;
  const rangeBlocked = overlapsRange(startDate, endDate, availabilityBlocks);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    if (!hasRange) {
      setError("Please choose a valid pickup and return date.");
      return;
    }
    if (rangeBlocked) {
      setError("Those dates overlap an unavailable window. Please choose another range.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/public/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          vehicleId: vehicle.id,
          startDate,
          endDate,
          customerName: form.get("name"),
          customerEmail: form.get("email"),
          customerPhone: form.get("phone"),
          amountCents: rentalTotal * 100,
          depositCents: deposit * 100
        })
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <fieldset className="rounded-2xl border bg-card p-6">
          <legend className="px-1 text-sm font-semibold">Trip dates</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-muted-foreground">Pickup date</span>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Return date</span>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm"
                required
              />
            </label>
          </div>
          <AvailabilityCalendar
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            startDate={startDate}
            endDate={endDate}
            blocks={availabilityBlocks}
            brandColor={brandColor}
          />
          {rangeBlocked ? (
            <p className="mt-3 text-sm text-destructive">Selected dates overlap a blocked range on the calendar.</p>
          ) : null}
        </fieldset>

        <fieldset className="rounded-2xl border bg-card p-6">
          <legend className="px-1 text-sm font-semibold">Driver details</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="text-muted-foreground">Full name</span>
              <input name="name" required className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Email</span>
              <input name="email" type="email" required className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Phone</span>
              <input name="phone" required className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border bg-card p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="size-16 rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${vehicle.image})` }} />
            <div>
              <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-muted-foreground">{currency.format(vehicle.dailyRate)}/day</p>
            </div>
          </div>

          <dl className="mt-6 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{currency.format(vehicle.dailyRate)} × {days} day{days === 1 ? "" : "s"}</dt>
              <dd>{currency.format(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Taxes & fees</dt>
              <dd>{currency.format(taxes)}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Refundable security deposit</dt>
              <dd>{currency.format(deposit)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold">
              <dt>Due today</dt>
              <dd>{currency.format(dueToday)}</dd>
            </div>
          </dl>

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: brandColor }}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Redirecting…" : "Continue to secure checkout"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Payments are processed securely by Stripe.</p>
        </div>
      </aside>
    </form>
  );
}

function AvailabilityCalendar({
  month,
  onMonthChange,
  startDate,
  endDate,
  blocks,
  brandColor
}: {
  month: Date;
  onMonthChange: (date: Date) => void;
  startDate: string;
  endDate: string;
  blocks: AvailabilityBlock[];
  brandColor: string;
}) {
  const blockedDays = React.useMemo(() => {
    const days = new Set<string>();
    for (const block of blocks) {
      let cursor = new Date(`${block.startsAt}T00:00:00`);
      const end = new Date(`${block.endsAt}T00:00:00`);
      while (cursor < end) {
        days.add(dateKey(cursor));
        cursor = addDays(cursor, 1);
      }
    }
    return days;
  }, [blocks]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const cells = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const selectedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const selectedEnd = endDate ? new Date(`${endDate}T00:00:00`) : null;

  function inSelectedRange(day: Date) {
    if (!selectedStart || !selectedEnd) return false;
    return day >= selectedStart && day < selectedEnd;
  }

  return (
    <div className="mt-5 rounded-2xl border bg-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border text-muted-foreground hover:text-foreground"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border text-muted-foreground hover:text-foreground"
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const key = dateKey(day);
          const blocked = blockedDays.has(key);
          const currentMonth = day.getMonth() === month.getMonth();
          const selected = inSelectedRange(day);
          return (
            <span
              key={key}
              className={`flex aspect-square items-center justify-center rounded-md text-xs ${
                blocked
                  ? "bg-muted text-muted-foreground line-through"
                  : selected
                    ? "text-white"
                    : currentMonth
                      ? "bg-card text-foreground"
                      : "text-muted-foreground/40"
              }`}
              style={selected && !blocked ? { backgroundColor: brandColor } : undefined}
              title={blocked ? "Unavailable" : undefined}
            >
              {day.getDate()}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm bg-muted" />Unavailable</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm" style={{ backgroundColor: brandColor }} />Selected trip</span>
      </div>
    </div>
  );
}
