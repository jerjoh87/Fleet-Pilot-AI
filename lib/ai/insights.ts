import type { MaintenanceItem, Reservation, Vehicle } from "@/lib/types";
import { generateNarrative, isAiConfigured } from "@/lib/ai/provider";

export type RevenuePoint = { month: string; revenue: number; bookings: number; profit: number };

export type AiInsightSource = "openai" | "heuristic";

export type RevenuePrediction = {
  source: AiInsightSource;
  nextMonthRevenue: number;
  nextMonthProfit: number;
  growthPct: number;
  confidence: number;
  forecast: Array<{ month: string; revenue: number; projected: boolean }>;
  narrative: string;
};

export type IdleVehicle = {
  vehicleId: string;
  label: string;
  status: Vehicle["status"];
  idleScore: number;
  reason: string;
  recommendedAction: string;
  potentialMonthlyRevenue: number;
};

export type IdleDetection = {
  source: AiInsightSource;
  idle: IdleVehicle[];
  estimatedRecoverableRevenue: number;
  narrative: string;
};

export type MaintenanceRecommendation = {
  vehicleId: string;
  label: string;
  priority: "Low" | "Medium" | "High";
  recommendation: string;
  reason: string;
};

export type MaintenanceAdvice = {
  source: AiInsightSource;
  recommendations: MaintenanceRecommendation[];
  narrative: string;
};

export type MarketingCampaign = {
  source: AiInsightSource;
  channel: string;
  audience: string;
  headline: string;
  body: string;
  cta: string;
  estimatedReach: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function nextMonthLabel(last: string | undefined) {
  const index = MONTHS.indexOf(last ?? "Jun");
  return MONTHS[(index + 1) % 12];
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

/** Revenue prediction — linear trend + recent momentum, optional OpenAI narrative. */
export async function predictRevenue(series: RevenuePoint[]): Promise<RevenuePrediction> {
  const recent = series.slice(-4);
  const deltas = recent.slice(1).map((point, index) => point.revenue - recent[index].revenue);
  const momentum = average(deltas);
  const last = series.at(-1);
  const lastRevenue = last?.revenue ?? 0;
  const lastProfit = last?.profit ?? 0;
  const margin = lastRevenue > 0 ? lastProfit / lastRevenue : 0.6;

  const nextMonthRevenue = Math.max(0, Math.round(lastRevenue + momentum));
  const nextMonthProfit = Math.round(nextMonthRevenue * margin);
  const growthPct = lastRevenue > 0 ? ((nextMonthRevenue - lastRevenue) / lastRevenue) * 100 : 0;
  const variance = average(deltas.map((delta) => Math.abs(delta - momentum)));
  const confidence = Math.max(40, Math.min(96, Math.round(95 - (variance / Math.max(1, lastRevenue)) * 400)));

  const forecast = [
    ...series.slice(-5).map((point) => ({ month: point.month, revenue: point.revenue, projected: false })),
    { month: nextMonthLabel(last?.month), revenue: nextMonthRevenue, projected: true }
  ];

  const narrative =
    (isAiConfigured() &&
      (await generateNarrative({
        system: "You are a fleet revenue analyst. Summarize the revenue outlook for an independent car rental operator.",
        context: { series: recent, nextMonthRevenue, growthPct: Number(growthPct.toFixed(1)) }
      }))) ||
    `Momentum of ${momentum >= 0 ? "+" : ""}${Math.round(momentum).toLocaleString()} per month points to roughly $${nextMonthRevenue.toLocaleString()} next month (${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%). Hold pricing on high-demand classes and push midweek promos to protect the trend.`;

  return {
    source: isAiConfigured() ? "openai" : "heuristic",
    nextMonthRevenue,
    nextMonthProfit,
    growthPct: Number(growthPct.toFixed(1)),
    confidence,
    forecast,
    narrative
  };
}

/** Idle / underutilized vehicle detection. */
export async function detectIdleVehicles(
  vehicles: Vehicle[],
  reservations: Reservation[]
): Promise<IdleDetection> {
  const activeVehicleIds = new Set(
    reservations
      .filter((reservation) => ["Confirmed", "Checked In", "Checked Out", "Late"].includes(reservation.status))
      .map((reservation) => reservation.vehicleId)
  );

  const idle = vehicles
    .map((vehicle) => {
      const isBooked = activeVehicleIds.has(vehicle.id);
      let idleScore = 0;
      const reasons: string[] = [];

      if (vehicle.status === "Available" && !isBooked) {
        idleScore += 60;
        reasons.push("available with no upcoming booking");
      }
      if (vehicle.status === "Out of Service" || vehicle.status === "Retired") {
        idleScore += 80;
        reasons.push(`status ${vehicle.status.toLowerCase()}`);
      }
      if (vehicle.revenueMtd < 1500 && vehicle.status !== "Maintenance") {
        idleScore += 25;
        reasons.push("revenue MTD below target");
      }
      if (vehicle.fuelLevel < 30 && vehicle.status === "Available") {
        idleScore += 10;
        reasons.push("low fuel may block instant bookings");
      }

      return {
        vehicleId: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        status: vehicle.status,
        idleScore: Math.min(100, idleScore),
        reason: reasons.join("; ") || "performing within range",
        recommendedAction:
          idleScore >= 60
            ? "Feature on the booking site and apply a 10–15% dynamic discount to drive utilization."
            : "Monitor; keep in standard rotation.",
        potentialMonthlyRevenue: Math.round(vehicle.dailyRate * 18)
      };
    })
    .filter((entry) => entry.idleScore >= 50)
    .sort((a, b) => b.idleScore - a.idleScore);

  const estimatedRecoverableRevenue = idle.reduce((sum, entry) => sum + entry.potentialMonthlyRevenue, 0);

  const narrative =
    (isAiConfigured() &&
      (await generateNarrative({
        system: "You are a fleet utilization optimizer. Recommend how to re-activate idle rental vehicles.",
        context: { idle: idle.slice(0, 6), estimatedRecoverableRevenue }
      }))) ||
    (idle.length
      ? `${idle.length} vehicle${idle.length > 1 ? "s are" : " is"} sitting idle, leaving about $${estimatedRecoverableRevenue.toLocaleString()}/mo on the table. Prioritize the ${idle[0].label} — list it on the booking site with a short-term promo.`
      : "Fleet utilization is healthy — no idle vehicles detected this cycle.");

  return { source: isAiConfigured() ? "openai" : "heuristic", idle, estimatedRecoverableRevenue, narrative };
}

/** Predictive maintenance recommendations from mileage, due dates, and history. */
export async function recommendMaintenance(
  vehicles: Vehicle[],
  maintenance: MaintenanceItem[]
): Promise<MaintenanceAdvice> {
  const today = new Date();

  const recommendations: MaintenanceRecommendation[] = [];

  for (const vehicle of vehicles) {
    const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const open = maintenance.filter((item) => item.vehicleId === vehicle.id && item.status !== "Completed");

    for (const item of open) {
      const due = new Date(item.dueDate);
      const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      const priority: MaintenanceRecommendation["priority"] = days <= 3 ? "High" : days <= 14 ? "Medium" : "Low";
      recommendations.push({
        vehicleId: vehicle.id,
        label,
        priority,
        recommendation: `${item.kind} ${days < 0 ? `overdue by ${Math.abs(days)} days` : `due in ${days} days`}`,
        reason: `Scheduled at ${item.dueAtMileage.toLocaleString()} mi; current ${vehicle.mileage.toLocaleString()} mi.`
      });
    }

    if (vehicle.mileage > 0 && vehicle.mileage % 5000 > 4500 && !open.length) {
      recommendations.push({
        vehicleId: vehicle.id,
        label,
        priority: "Medium",
        recommendation: "Approaching a 5,000-mile service interval — schedule oil & inspection.",
        reason: `Odometer at ${vehicle.mileage.toLocaleString()} mi with no open work order.`
      });
    }
  }

  recommendations.sort((a, b) => {
    const rank = { High: 0, Medium: 1, Low: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });

  const narrative =
    (isAiConfigured() &&
      (await generateNarrative({
        system: "You are a fleet maintenance planner. Summarize the most urgent service actions.",
        context: { recommendations: recommendations.slice(0, 8) }
      }))) ||
    (recommendations.length
      ? `${recommendations.filter((rec) => rec.priority === "High").length} high-priority service item(s) need attention now. Batch the ${recommendations[0].label} first to avoid downtime during peak bookings.`
      : "No maintenance flags — every vehicle is within its service window.");

  return { source: isAiConfigured() ? "openai" : "heuristic", recommendations, narrative };
}

/** Generate a marketing campaign tailored to the fleet and a chosen goal. */
export async function generateCampaign(input: {
  goal: "fill_idle" | "win_back" | "seasonal" | "corporate";
  channel: string;
  vehicles: Vehicle[];
  organizationName: string;
}): Promise<MarketingCampaign> {
  const topVehicle = [...input.vehicles].sort((a, b) => b.dailyRate - a.dailyRate)[0];
  const hero = topVehicle ? `${topVehicle.make} ${topVehicle.model}` : "premium fleet";

  const presets: Record<typeof input.goal, { audience: string; headline: string; body: string; cta: string }> = {
    fill_idle: {
      audience: "Local leisure renters within 25 miles",
      headline: `Midweek escape in a ${hero} — 15% off`,
      body: `${input.organizationName} just opened limited midweek availability. Book a ${hero} today and save 15% on 3+ day rentals.`,
      cta: "Reserve your weekday rate"
    },
    win_back: {
      audience: "Past customers inactive for 60+ days",
      headline: "We saved your seat — come back for 20% off",
      body: `It's been a while! Return to ${input.organizationName} and enjoy 20% off your next booking, plus priority pickup.`,
      cta: "Claim your welcome-back offer"
    },
    seasonal: {
      audience: "Travelers searching for summer rentals",
      headline: `Summer roads, ${hero} energy`,
      body: `Make this season unforgettable with ${input.organizationName}. Reserve a ${hero} now — flexible cancellation included.`,
      cta: "Plan your summer trip"
    },
    corporate: {
      audience: "Local businesses & production crews",
      headline: "Reliable fleet partners for your team",
      body: `${input.organizationName} offers corporate accounts with consolidated invoicing, priority availability, and dedicated support.`,
      cta: "Set up a corporate account"
    }
  };

  const preset = presets[input.goal];
  const estimatedReach = 1200 + input.vehicles.length * 180;

  const aiCopy =
    isAiConfigured() &&
    (await generateNarrative({
      system: `You are a marketing copywriter for a car rental brand named ${input.organizationName}. Write a punchy ${input.channel} ad body for the given goal and hero vehicle.`,
      context: { goal: input.goal, hero, audience: preset.audience },
      maxWords: 60
    }));

  return {
    source: isAiConfigured() ? "openai" : "heuristic",
    channel: input.channel,
    audience: preset.audience,
    headline: preset.headline,
    body: (aiCopy && aiCopy.length > 0 ? aiCopy : preset.body),
    cta: preset.cta,
    estimatedReach
  };
}
