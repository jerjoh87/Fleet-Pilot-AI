import { FleetPilotApp } from "@/components/fleetpilot/fleetpilot-app";
import { requireAppSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard-data";
import { getInsuranceDashboard } from "@/lib/insurance/data";
import { listProviders } from "@/lib/admaker/providers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAppSession();
  const [data, insuranceDashboard] = await Promise.all([
    getDashboardData(session),
    getInsuranceDashboard(session.organization.id)
  ]);

  return (
    <FleetPilotApp
      aiConnected={Boolean(process.env.OPENAI_API_KEY)}
      adProviders={listProviders()}
      insuranceDashboard={insuranceDashboard}
      initialActivity={data.activity}
      initialAvailabilityBlocks={data.availabilityBlocks}
      initialAgreementTemplate={data.agreementTemplate}
      initialBankAccount={data.bankAccount}
      initialCustomers={data.customers}
      initialFinancialSummary={data.financialSummary}
      initialFinancialTransactions={data.financialTransactions}
      initialMaintenance={data.maintenance}
      initialOrganization={session.organization}
      initialPayouts={data.payouts}
      initialRentalAgreements={data.rentalAgreements}
      initialReservations={data.reservations}
      initialRevenueSeries={data.revenueSeries}
      initialSession={session}
      initialSubscriptionInfo={data.subscriptionInfo}
      initialSupportMessages={data.supportMessages}
      initialUsageMetrics={data.usageMetrics}
      initialWebsiteSettings={data.websiteSettings}
      initialVehicles={data.vehicles}
      stripeConnected={Boolean(process.env.STRIPE_SECRET_KEY)}
    />
  );
}
