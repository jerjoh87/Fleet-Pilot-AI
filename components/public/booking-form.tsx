"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { AvailabilityBlock, PublicVehicle } from "@/lib/data/public-data";
import { currency } from "@/lib/utils";
import { InsuranceSelection } from "@/components/public/insurance-selection";
import type { BookingInsurance } from "@/lib/insurance/data";
import { isInsuranceComplete, type InsuranceSelectionValue } from "@/lib/insurance/selection";

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

function maxDobDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 21);
  return d.toISOString().slice(0, 10);
}

function isAtLeast21(dob: string) {
  if (!dob) return false;
  const birth = new Date(`${dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 21;
}

export function BookingForm({
  slug,
  vehicle,
  brandColor,
  depositFee,
  taxRatePct,
  platformFeePct,
  availabilityBlocks,
  bookingInsurance
}: {
  slug: string;
  vehicle: PublicVehicle;
  brandColor: string;
  depositFee: number;
  taxRatePct: number;
  platformFeePct: number;
  availabilityBlocks: AvailabilityBlock[];
  bookingInsurance: BookingInsurance;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState("");
  const [calendarMonth, setCalendarMonth] = React.useState(() => new Date(`${today}T00:00:00`));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [agreementScrolled, setAgreementScrolled] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [signatureMethod, setSignatureMethod] = React.useState<"typed" | "drawn">("typed");
  const [typedSignature, setTypedSignature] = React.useState("");
  const [drawnSignature, setDrawnSignature] = React.useState("");
  const [insurance, setInsurance] = React.useState<InsuranceSelectionValue>({ type: "none" });

  const days = Math.max(1, daysBetween(startDate, endDate));
  const hasRange = Boolean(startDate && endDate && daysBetween(startDate, endDate) > 0);
  const subtotal = days * vehicle.dailyRate;
  const taxRate = taxRatePct / 100;
  const taxes = Math.round(subtotal * taxRate);
  const platformFee = Math.round(subtotal * (platformFeePct / 100));

  // Insurance affects both the amount charged today and the security deposit.
  const selectedQuote =
    insurance.type === "third_party"
      ? bookingInsurance.quotes.find((quote) => quote.providerKey === insurance.providerKey) ?? null
      : null;
  const insuranceCost = selectedQuote ? Math.round((selectedQuote.dailyPriceCents * days) / 100) : 0;
  const depositCents =
    insurance.type === "third_party"
      ? bookingInsurance.deposits.thirdParty
      : insurance.type === "own"
        ? bookingInsurance.deposits.own
        : insurance.type === "declined"
          ? bookingInsurance.deposits.declined
          : Math.round(depositFee * 100);
  const deposit = Math.max(0, Math.round(depositCents / 100));

  const rentalTotal = subtotal + taxes + platformFee + insuranceCost;
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
    if (
      !isInsuranceComplete(insurance, {
        requireInsurance: bookingInsurance.settings.requireInsurance,
        allowOwnInsurance: bookingInsurance.settings.allowOwnInsurance,
        allowDecline: bookingInsurance.settings.allowDecline
      })
    ) {
      setError(
        bookingInsurance.settings.requireInsurance
          ? "Insurance is required — choose a coverage option or upload your own policy."
          : "Choose a coverage option, upload your own insurance, or decline to continue."
      );
      return;
    }
    const dob = String(form.get("dob") ?? "");
    const licenseNumber = String(form.get("licenseNumber") ?? "");
    const licenseState = String(form.get("licenseState") ?? "");
    if (!isAtLeast21(dob)) {
      setError("You must be at least 21 years of age to rent a vehicle.");
      return;
    }
    if (licenseNumber.length < 4) {
      setError("Please enter a valid driver's license number.");
      return;
    }
    const legalName = String(form.get("legalName") ?? "");
    const signatureData = signatureMethod === "typed" ? typedSignature : drawnSignature;
    if (!agreementScrolled || !agreed || legalName.length < 2 || signatureData.length < 2) {
      setError("Please review and sign the rental agreement before continuing.");
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
          dob,
          licenseNumber,
          licenseState,
          amountCents: rentalTotal * 100,
          depositCents: deposit * 100,
          insurance,
          insuranceCostCents: insuranceCost * 100,
          agreement: {
            agreed,
            legalName,
            signatureMethod,
            signatureData,
            initialsData: String(form.get("initials") ?? ""),
            scrolledToBottom: agreementScrolled,
            browser: navigator.userAgent,
            device: `${navigator.platform || "Unknown platform"} · ${window.innerWidth}x${window.innerHeight}`
          }
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
          <legend className="px-1 text-sm font-semibold">Driver verification</legend>
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
            <label className="text-sm">
              <span className="text-muted-foreground">Date of birth</span>
              <input name="dob" type="date" required max={maxDobDate()} className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Driver&apos;s license number</span>
              <input name="licenseNumber" required minLength={4} className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">License state / province</span>
              <input name="licenseState" required className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" placeholder="e.g. TX" />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">You must be at least 21 years of age with a valid driver&apos;s license to rent.</p>
        </fieldset>

        <InsuranceSelection
          quotes={bookingInsurance.quotes}
          days={days}
          brandColor={brandColor}
          requireInsurance={bookingInsurance.settings.requireInsurance}
          allowOwnInsurance={bookingInsurance.settings.allowOwnInsurance}
          allowDecline={bookingInsurance.settings.allowDecline}
          manualApproval={bookingInsurance.settings.manualApproval}
          customTerms={bookingInsurance.settings.customTerms}
          value={insurance}
          onChange={setInsurance}
        />

        <fieldset className="rounded-2xl border bg-card p-6">
          <legend className="px-1 text-sm font-semibold">Rental agreement</legend>
          <div
            className="mt-2 max-h-72 overflow-y-auto rounded-xl border bg-background p-4 text-sm leading-6 text-muted-foreground"
            onScroll={(event) => {
              const target = event.currentTarget;
              if (target.scrollTop + target.clientHeight >= target.scrollHeight - 12) {
                setAgreementScrolled(true);
              }
            }}
          >
            <p className="font-semibold text-foreground">Digital Rental Agreement</p>
            <AgreementSection title="Terms & Conditions">By continuing, you agree to rent the selected vehicle only for the confirmed reservation dates, return it in the same condition, comply with traffic laws, report incidents immediately, and pay approved charges for tolls, citations, fuel, cleaning, late returns, damage, and prohibited use.</AgreementSection>
            <AgreementSection title="Eligibility Requirements">Renter must be at least 21 years of age (25 for certain vehicle classes), hold a valid, unrestricted driver's license, and present a matching credit or debit card at pickup. Renter represents that all identity, license, and insurance information provided is accurate and current.</AgreementSection>
            <AgreementSection title="Insurance & Deposit">You confirm your license, identity, insurance, and payment information are accurate. The host may verify eligibility before pickup. The refundable security deposit is collected or authorized according to the host policy and released after return inspection less valid charges. Insurance coverage is subject to the terms, conditions, and exclusions of the applicable policy.</AgreementSection>
            <AgreementSection title="Prohibited Uses">No smoking, unauthorized pets, racing, towing, rideshare, delivery, off-road driving, subleasing, illegal activity, or unauthorized drivers are permitted.</AgreementSection>
            <AgreementSection title="Liability Waiver & Assumption of Risk">Renter acknowledges that operating a motor vehicle involves inherent risks including accident, injury, death, and property damage. Renter voluntarily assumes all such risks and releases the vehicle owner and FleetPilot AI from any and all claims arising from the rental, except to the extent caused by the owner's willful misconduct or gross negligence.</AgreementSection>
            <AgreementSection title="Dispute Resolution">Any dispute arising from this rental agreement shall be resolved by binding arbitration under the rules of the American Arbitration Association. Each party waives any right to a jury trial or class action.</AgreementSection>
            <AgreementSection title="Platform Disclaimer">This rental is facilitated by FleetPilot AI, a technology platform. FleetPilot AI is not a party to this agreement, does not own or inspect any vehicle, and is not liable for any aspect of the rental transaction.</AgreementSection>
            <AgreementSection title="State-Specific Clauses">State-specific consumer, insurance, and e-signature laws apply where required by applicable law.</AgreementSection>
            <AgreementSection title="Electronic Signature Disclosure">You consent to using electronic records and signatures under applicable e-signature laws (including the federal ESIGN Act and state UETA) and agree your electronic signature has the same legal effect as a handwritten signature.</AgreementSection>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {agreementScrolled ? "Agreement reviewed." : "Scroll to the bottom to unlock signing."}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">
              <span className="text-muted-foreground">Full legal name</span>
              <input name="legalName" required className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Initials (optional)</span>
              <input name="initials" className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">Signature style</span>
              <select value={signatureMethod} onChange={(event) => setSignatureMethod(event.target.value as "typed" | "drawn")} className="mt-1 h-11 w-full rounded-lg border bg-background px-3 text-sm">
                <option value="typed">Typed signature</option>
                <option value="drawn">Draw signature</option>
              </select>
            </label>
            {signatureMethod === "typed" ? (
              <label className="text-sm sm:col-span-2">
                <span className="text-muted-foreground">Type signature</span>
                <input value={typedSignature} onChange={(event) => setTypedSignature(event.target.value)} className="mt-1 h-12 w-full rounded-lg border bg-background px-3 text-lg italic" />
              </label>
            ) : (
              <SignaturePad value={drawnSignature} onChange={setDrawnSignature} brandColor={brandColor} />
            )}
            <label className="flex items-start gap-3 text-sm sm:col-span-2">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1" disabled={!agreementScrolled} />
              <span>
                I agree to the rental agreement above (including the liability waiver, dispute resolution, and e-signature disclosure), the insurance and deposit terms, and the FleetPilot AI{" "}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a>{" "}
                and{" "}
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
              </span>
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
              <dt className="text-muted-foreground">Taxes ({taxRatePct}%)</dt>
              <dd>{currency.format(taxes)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Service fee ({platformFeePct}%)</dt>
              <dd>{currency.format(platformFee)}</dd>
            </div>
            {selectedQuote ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{selectedQuote.providerName} coverage</dt>
                <dd>{currency.format(insuranceCost)}</dd>
              </div>
            ) : insurance.type === "own" ? (
              <div className="flex justify-between text-muted-foreground">
                <dt>Own insurance</dt>
                <dd>{bookingInsurance.settings.manualApproval ? "Pending review" : "Approved"}</dd>
              </div>
            ) : insurance.type === "declined" ? (
              <div className="flex justify-between text-muted-foreground">
                <dt>Coverage</dt>
                <dd>Declined</dd>
              </div>
            ) : null}
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
            disabled={submitting || !agreementScrolled || !agreed}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: brandColor }}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {submitting ? "Redirecting…" : "Sign & continue to payment"}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Payments are processed securely by Stripe.</p>
        </div>
      </aside>
    </form>
  );
}

function AgreementSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="font-medium text-foreground text-xs uppercase tracking-wide">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
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

function SignaturePad({
  value,
  onChange,
  brandColor
}: {
  value: string;
  onChange: (value: string) => void;
  brandColor: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawingRef = React.useRef(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext("2d");
    const next = point(event);
    ctx?.beginPath();
    ctx?.moveTo(next.x, next.y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const next = point(event);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = brandColor;
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    onChange(canvas.toDataURL("image/png"));
  }

  function end(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    drawingRef.current = false;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
      onChange(canvas.toDataURL("image/png"));
    }
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange("");
  }

  return (
    <div className="grid gap-2 text-sm sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Draw signature</span>
        <button type="button" onClick={clear} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={900}
        height={220}
        className="h-36 w-full touch-none rounded-lg border bg-background"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <span className="text-xs text-muted-foreground">{value ? "Signature captured." : "Use mouse, touch, or tablet pencil."}</span>
    </div>
  );
}
