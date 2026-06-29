import { FleetPilotApp } from "@/components/fleetpilot/fleetpilot-app";
import { requireAppSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppSession();
  const data = await getDashboardData(session);

  return (
    <FleetPilotApp
      aiConnected={Boolean(process.env.OPENAI_API_KEY)}
      initialActivity={data.activity}
      initialAvailabilityBlocks={data.availabilityBlocks}
      initialCustomers={data.customers}
      initialMaintenance={data.maintenance}
      initialOrganization={session.organization}
      initialReservations={data.reservations}
      initialRevenueSeries={data.revenueSeries}
      initialSession={session}
      initialWebsiteSettings={data.websiteSettings}
      initialVehicles={data.vehicles}
      stripeConnected={Boolean(process.env.STRIPE_SECRET_KEY)}
    />
  );
}
