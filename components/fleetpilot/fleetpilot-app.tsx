"use client";

import * as React from "react";
import {
  AlertTriangle,
  BarChart3,
  Ban,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Gauge,
  HelpCircle,
  Inbox,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Plus,
  Save,
  Landmark,
  Search,
  Settings,
  Sparkles,
  Wand2,
  Wrench,
  X,
  type LucideIcon
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";
import { archiveVehicleAction, createAvailabilityBlockAction, createContractAction, createCustomerAction, createDamageReportAction, createMaintenanceAction, createReservationAction, createVehicleAction, deleteAvailabilityBlockAction, updateVehicleAction, updateWebsiteSettingsAction } from "@/app/dashboard/actions";
import { openConnectDashboardAction, removeBankAccountAction, saveAgreementTemplateAction, saveBankingInfoAction, startConnectOnboardingAction } from "@/app/dashboard/financials/actions";
import { closeSupportMessageAction } from "@/app/dashboard/support/actions";
import { AiWorkspace } from "@/components/fleetpilot/ai-workspace";
import { AdMaker } from "@/components/fleetpilot/admaker/ad-maker";
import { BillingPanel } from "@/components/fleetpilot/billing-panel";
import { InsurancePanel } from "@/components/fleetpilot/insurance-panel";
import { ShieldCheck } from "lucide-react";
import type { InsuranceDashboard } from "@/lib/insurance/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { availabilityBlockSchema, customerSchema, damageReportSchema, maintenanceSchema, reservationSchema, vehicleSchema, vehicleUpdateSchema } from "@/lib/schemas";
import type { Activity as ActivityItem, AgreementTemplateData, AvailabilityBlock, BankAccount, Customer, FinancialSummary, FinancialTransaction, MaintenanceItem, PayoutRecord, RentalAgreementRecord, Reservation, SubscriptionInfo, SupportMessage, UsageMetrics, Vehicle, VehicleStatus } from "@/lib/types";
import type { AppSession } from "@/lib/auth/session";
import type { WebsiteSettingsData } from "@/lib/data/dashboard-data";
import { HostProfilePreview, type ProfileDraft } from "@/components/fleetpilot/host-profile-preview";
import { currency, number } from "@/lib/utils";

type Section = "Landing Page" | "Operations Dashboard" | "Fleet Management" | "Booking Portal" | "Support Inbox" | "Financials" | "AI Workspace" | "AI Ad Maker" | "Billing" | "Insurance" | "Analytics" | "Maintenance" | "Settings";

type Props = {
  initialActivity: ActivityItem[];
  initialAvailabilityBlocks: AvailabilityBlock[];
  initialAgreementTemplate: AgreementTemplateData;
  initialBankAccount: BankAccount | null;
  initialCustomers: Customer[];
  initialFinancialSummary: FinancialSummary;
  initialFinancialTransactions: FinancialTransaction[];
  initialMaintenance: MaintenanceItem[];
  initialOrganization: { id: string; name: string; slug: string; domain: string; plan: string; satisfaction: number };
  initialPayouts: PayoutRecord[];
  initialRentalAgreements: RentalAgreementRecord[];
  initialReservations: Reservation[];
  initialRevenueSeries: Array<{ month: string; revenue: number; bookings: number; profit: number }>;
  initialSession: AppSession;
  initialSubscriptionInfo: SubscriptionInfo;
  initialSupportMessages: SupportMessage[];
  initialUsageMetrics: UsageMetrics;
  initialWebsiteSettings: WebsiteSettingsData;
  initialVehicles: Vehicle[];
  aiConnected: boolean;
  adProviders: Array<{ id: string; label: string; available: boolean; comingSoon: boolean }>;
  stripeConnected: boolean;
  insuranceDashboard: InsuranceDashboard;
};

const sections: Array<{ name: Section; icon: React.ComponentType<{ className?: string }> }> = [
  { name: "Operations Dashboard", icon: BarChart3 },
  { name: "Fleet Management", icon: Car },
  { name: "Booking Portal", icon: CalendarDays },
  { name: "Support Inbox", icon: Inbox },
  { name: "Financials", icon: Landmark },
  { name: "AI Workspace", icon: Sparkles },
  { name: "AI Ad Maker", icon: Wand2 },
  { name: "Billing", icon: CreditCard },
  { name: "Insurance", icon: ShieldCheck },
  { name: "Analytics", icon: Gauge },
  { name: "Maintenance", icon: Wrench },
  { name: "Settings", icon: Settings }
];

const statusStyles: Record<VehicleStatus, string> = {
  Available: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  Reserved: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  Rented: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  Cleaning: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  Maintenance: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  "Out of Service": "border-red-400/30 bg-red-400/10 text-red-200",
  Retired: "border-slate-500/30 bg-slate-500/10 text-slate-300"
};

type ActivityRow = readonly [title: string, meta: string, Icon: LucideIcon];

function splitListInput(value?: string) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function FleetPilotApp({
  initialActivity,
  initialAvailabilityBlocks,
  initialAgreementTemplate,
  initialBankAccount,
  initialCustomers,
  initialFinancialSummary,
  initialFinancialTransactions,
  initialMaintenance,
  initialOrganization,
  initialPayouts,
  initialRentalAgreements,
  initialReservations,
  initialRevenueSeries,
  initialSession,
  initialSubscriptionInfo,
  initialSupportMessages,
  initialUsageMetrics,
  initialWebsiteSettings,
  initialVehicles,
  aiConnected,
  adProviders,
  stripeConnected,
  insuranceDashboard
}: Props) {
  const [section, setSection] = React.useState<Section>("Operations Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [vehicles, setVehicles] = React.useState(initialVehicles);
  const [availabilityBlocks, setAvailabilityBlocks] = React.useState(initialAvailabilityBlocks);
  const [bankAccount, setBankAccount] = React.useState(initialBankAccount);
  const [financialTransactions] = React.useState(initialFinancialTransactions);
  const [financialSummary] = React.useState(initialFinancialSummary);
  const [payouts] = React.useState(initialPayouts);
  const [rentalAgreements] = React.useState(initialRentalAgreements);
  const [agreementTemplate] = React.useState(initialAgreementTemplate);
  const [customers, setCustomers] = React.useState(initialCustomers);
  const [reservations, setReservations] = React.useState(initialReservations);
  const [maintenanceItems, setMaintenanceItems] = React.useState(initialMaintenance);
  const [websiteSettings, setWebsiteSettings] = React.useState(initialWebsiteSettings);
  const [activity, setActivity] = React.useState(initialActivity);
  const [supportMessages, setSupportMessages] = React.useState(initialSupportMessages);
  const [query, setQuery] = React.useState("");
  const organizationId = initialOrganization.id;

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const scopedVehicles = vehicles.filter((vehicle) => vehicle.organizationId === organizationId);
  const scopedCustomers = customers.filter((customer) => customer.organizationId === organizationId);
  const scopedReservations = reservations.filter((reservation) => reservation.organizationId === organizationId);
  const scopedAvailabilityBlocks = availabilityBlocks.filter((block) => block.organizationId === organizationId);
  const searchedVehicles = scopedVehicles.filter((vehicle) =>
    `${vehicle.make} ${vehicle.model} ${vehicle.licensePlate} ${vehicle.status}`.toLowerCase().includes(query.toLowerCase())
  );

  function addActivity(action: string, target: string) {
    setActivity((current) => [
      {
        id: `act_${crypto.randomUUID()}`,
        organizationId,
        actor: "FleetPilot AI",
        action,
        target,
        createdAt: new Date().toISOString()
      },
      ...current
    ]);
  }

  async function createVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = vehicleSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Vehicle details need attention");
      return;
    }

    let createdImageUrl = "";
    let createdImageUrls: string[] = [];
    try {
      const result = await createVehicleAction(form);
      createdImageUrl = result.imageUrl ?? "";
      createdImageUrls = result.imageUrls ?? [];
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vehicle could not be saved");
      return;
    }

    const vehicle: Vehicle = {
      ...parsed.data,
      id: `veh_${crypto.randomUUID()}`,
      organizationId,
      features: splitListInput(parsed.data.features),
      rules: splitListInput(parsed.data.rules),
      revenueMtd: 0,
      profitMtd: 0,
      nextMaintenance: "2026-08-01",
      registrationExpires: "2027-01-01",
      insuranceExpires: "2027-01-01",
      image: createdImageUrl || parsed.data.imageUrl || "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80",
      images: createdImageUrls.length ? createdImageUrls : [createdImageUrl || parsed.data.imageUrl || "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80"],
      documents: ["Registration pending"],
      damageReports: 0
    };
    setVehicles((current) => [vehicle, ...current]);
    addActivity("added vehicle", `${vehicle.make} ${vehicle.model}`);
    toast.success("Vehicle added");
    formElement.reset();
  }

  async function updateVehicle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = vehicleUpdateSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Vehicle details need attention");
      return;
    }

    let nextImageUrl = parsed.data.imageUrl || "";
    let nextImageUrls: string[] = [];
    try {
      const result = await updateVehicleAction(form);
      nextImageUrl = result.imageUrl || nextImageUrl;
      nextImageUrls = result.imageUrls ?? [];
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vehicle could not be updated");
      return;
    }

    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.id === parsed.data.id
          ? {
              ...vehicle,
              ...parsed.data,
              features: splitListInput(parsed.data.features),
              rules: splitListInput(parsed.data.rules),
              image: nextImageUrl || vehicle.image,
              images: nextImageUrls.length ? nextImageUrls : vehicle.images
            }
          : vehicle
      )
    );
    addActivity("updated vehicle", `${parsed.data.make} ${parsed.data.model}`);
    toast.success("Vehicle updated");
  }

  async function archiveVehicle(vehicleId: string) {
    try {
      await archiveVehicleAction(vehicleId);
      setVehicles((current) => current.map((vehicle) => vehicle.id === vehicleId ? { ...vehicle, status: "Retired" } : vehicle));
      addActivity("archived vehicle", vehicleId);
      toast.success("Vehicle archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vehicle could not be archived");
    }
  }

  async function createAvailabilityBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = availabilityBlockSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Blocked dates need attention");
      return;
    }

    try {
      await createAvailabilityBlockAction(form);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dates could not be blocked");
      return;
    }

    const block: AvailabilityBlock = {
      ...parsed.data,
      id: `blk_${crypto.randomUUID()}`,
      organizationId
    };
    setAvailabilityBlocks((current) => [block, ...current]);
    addActivity("blocked vehicle dates", block.reason);
    toast.success("Dates blocked");
    formElement.reset();
  }

  async function deleteAvailabilityBlock(blockId: string) {
    try {
      await deleteAvailabilityBlockAction(blockId);
      setAvailabilityBlocks((current) => current.filter((block) => block.id !== blockId));
      toast.success("Block removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Block could not be removed");
    }
  }

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = customerSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Customer details need attention");
      return;
    }

    try {
      await createCustomerAction(form);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Customer could not be saved");
      return;
    }

    const customer: Customer = {
      ...parsed.data,
      id: `cus_${crypto.randomUUID()}`,
      organizationId,
      rentals: 0,
      lifetimeValue: 0,
      rating: 5,
      blacklisted: false
    };
    setCustomers((current) => [customer, ...current]);
    addActivity("created customer", customer.name);
    toast.success("Customer created");
    formElement.reset();
  }

  async function createReservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = reservationSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Reservation details need attention");
      return;
    }
    const vehicle = scopedVehicles.find((item) => item.id === parsed.data.vehicleId);
    const days = Math.max(
      1,
      Math.round((new Date(parsed.data.endDate).getTime() - new Date(parsed.data.startDate).getTime()) / 86_400_000)
    );
    const reservation: Reservation = {
      ...parsed.data,
      id: `res_${crypto.randomUUID()}`,
      organizationId,
      status: "Confirmed",
      total: days * (vehicle?.dailyRate ?? 99),
      agreementSigned: false,
      paymentStatus: "Deposit Held"
    };

    try {
      await createReservationAction(form);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking could not be saved");
      return;
    }

    setReservations((current) => [reservation, ...current]);
    setVehicles((current) => current.map((item) => item.id === reservation.vehicleId ? { ...item, status: "Reserved" } : item));
    addActivity("confirmed booking", reservation.id);
    toast.success("Booking confirmed");
    formElement.reset();
  }

  async function createMaintenance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = maintenanceSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Maintenance details need attention");
      return;
    }

    try {
      await createMaintenanceAction(form);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Maintenance could not be saved");
      return;
    }

    const item: MaintenanceItem = {
      ...parsed.data,
      id: `mnt_${crypto.randomUUID()}`,
      organizationId
    };
    setMaintenanceItems((current) => [item, ...current]);
    addActivity("scheduled maintenance", item.kind);
    toast.success("Maintenance scheduled");
    formElement.reset();
  }

  async function createDamageReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const parsed = damageReportSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Damage report details need attention");
      return;
    }

    try {
      await createDamageReportAction(form);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Damage report could not be saved");
      return;
    }

    setVehicles((current) => current.map((item) => item.id === parsed.data.vehicleId ? { ...item, status: "Maintenance", damageReports: item.damageReports + 1 } : item));
    addActivity("filed damage report", parsed.data.phase);
    toast.success("Damage report filed");
    formElement.reset();
  }

  async function createContract(reservationId: string) {
    try {
      await createContractAction(reservationId);
      toast.success("Contract generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Contract could not be generated");
    }
  }

  async function startConnectOnboarding() {
    try {
      const result = await startConnectOnboardingAction();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success(result.message ?? "Stripe Connect onboarding started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Connect onboarding could not start");
    }
  }

  async function openConnectDashboard() {
    try {
      const result = await openConnectDashboardAction();
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success(result.message ?? "Opening Stripe Express dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stripe dashboard could not open");
    }
  }

  async function saveBankingInfo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await saveBankingInfoAction({
        accountHolderName: String(form.get("accountHolderName") ?? ""),
        businessName: String(form.get("businessName") ?? ""),
        accountType: String(form.get("accountType") ?? "checking") as "checking" | "savings",
        routingNumber: String(form.get("routingNumber") ?? ""),
        accountNumber: String(form.get("accountNumber") ?? ""),
        taxStatus: String(form.get("taxStatus") ?? "pending")
      });
      setBankAccount({
        id: `bank_${crypto.randomUUID()}`,
        organizationId,
        accountHolderName: String(form.get("accountHolderName") ?? ""),
        businessName: String(form.get("businessName") ?? ""),
        accountType: String(form.get("accountType") ?? "checking"),
        bankName: "Connected bank",
        last4: String(form.get("accountNumber") ?? "").slice(-4),
        routingLast4: String(form.get("routingNumber") ?? "").slice(-4),
        verificationStatus: "pending_verification",
        payoutSchedule: "automatic_daily",
        nextPayoutDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10),
        estimatedPayout: financialSummary.nextPayout
      });
      toast.success(result.message ?? "Banking info saved");
      formElement.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Banking info could not be saved");
    }
  }

  async function removeBankAccount() {
    try {
      const result = await removeBankAccountAction();
      setBankAccount(null);
      toast.success(result.message ?? "Bank removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bank account could not be removed");
    }
  }

  async function saveAgreementTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = await saveAgreementTemplateAction(new FormData(event.currentTarget));
      toast.success(result.message ?? "Agreement template saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Agreement template could not be saved");
    }
  }

  async function updateWebsiteSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await updateWebsiteSettingsAction(form);
      setWebsiteSettings({
        logoUrl: result.logoUrl ?? String(form.get("logoUrl") ?? ""),
        coverImageUrl: result.coverImageUrl ?? String(form.get("coverImageUrl") ?? ""),
        backgroundStyle: (String(form.get("backgroundStyle") ?? "soft") as WebsiteSettingsData["backgroundStyle"]),
        brandColor: String(form.get("brandColor") ?? "#166534"),
        heroTitle: String(form.get("heroTitle") ?? ""),
        about: String(form.get("about") ?? ""),
        serviceArea: String(form.get("serviceArea") ?? ""),
        contactEmail: String(form.get("contactEmail") ?? ""),
        contactPhone: String(form.get("contactPhone") ?? ""),
        instagramUrl: String(form.get("instagramUrl") ?? ""),
        facebookUrl: String(form.get("facebookUrl") ?? ""),
        pickupInstructions: String(form.get("pickupInstructions") ?? ""),
        cancellationPolicy: String(form.get("cancellationPolicy") ?? ""),
        depositPolicy: String(form.get("depositPolicy") ?? ""),
        businessHours: String(form.get("businessHours") ?? ""),
        trustBadges: String(form.get("trustBadges") ?? ""),
        seoTitle: String(form.get("seoTitle") ?? ""),
        customDomain: String(form.get("customDomain") ?? ""),
        depositFee: Number(form.get("depositFee") ?? 0)
      });
      toast.success(result.message ?? "Website settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Website settings could not be saved");
    }
  }

  async function closeSupportMessage(messageId: string) {
    const previous = supportMessages;
    setSupportMessages((current) => current.map((message) => message.id === messageId ? { ...message, status: "closed" } : message));
    try {
      const result = await closeSupportMessageAction(messageId);
      result.ok ? toast.success(result.message) : toast.error(result.message);
      if (!result.ok) setSupportMessages(previous);
    } catch (error) {
      setSupportMessages(previous);
      toast.error(error instanceof Error ? error.message : "Support request could not be closed");
    }
  }

  const shell = (
    <Sidebar
      active={section}
      organization={initialOrganization}
      onLanding={() => {
        setSection("Landing Page");
        setMobileNavOpen(false);
      }}
      onSelect={(next) => {
        setSection(next);
        setMobileNavOpen(false);
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.16),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.12),transparent_30%)]" />
      <div className="relative flex">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-[#0b1020]/95 xl:block">{shell}</aside>
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur xl:hidden">
            <div className="h-full w-80 border-r border-white/10 bg-[#0b1020]">
              <div className="flex justify-end p-4">
                <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
                  <X className="size-4" />
                </Button>
              </div>
              {shell}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
                <button className="flex items-center gap-3" onClick={() => setSection("Landing Page")}>
                  <LogoMark />
                  <span className="hidden text-sm font-semibold sm:inline">FleetPilot AI Rental OS</span>
                </button>
              </div>
              <div className="hidden max-w-xl flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 lg:flex">
                <Search className="size-4 text-slate-400" />
                <input
                  className="h-10 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  placeholder="Search fleet, bookings, alerts"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-white">{initialSession.user.fullName}</p>
                  <p className="text-xs text-slate-400">{initialSession.demo ? "Demo mode" : initialSession.role}</p>
                </div>
                <a
                  className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 hover:bg-white/[0.08] sm:inline-flex"
                  href={`/${initialOrganization.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-4" />
                  <span className="hidden lg:inline">Booking site</span>
                </a>
                <Button className="bg-blue-500 text-white hover:bg-blue-400" onClick={() => setSection("Booking Portal")}>
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">New Booking</span>
                </Button>
              </div>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {section === "Landing Page" ? <LandingPage onNavigate={setSection} /> : null}
            {section === "Operations Dashboard" ? (
              <OperationsDashboard
                activity={activity}
                maintenance={maintenanceItems}
                reservations={scopedReservations}
                revenueSeries={initialRevenueSeries}
                vehicles={scopedVehicles}
              />
            ) : null}
            {section === "Fleet Management" ? (
              <FleetManagement
                availabilityBlocks={scopedAvailabilityBlocks}
                reservations={scopedReservations}
                vehicles={searchedVehicles}
                onArchive={archiveVehicle}
                onCreate={createVehicle}
                onCreateBlock={createAvailabilityBlock}
                onDeleteBlock={deleteAvailabilityBlock}
                onUpdate={updateVehicle}
              />
            ) : null}
            {section === "Booking Portal" ? (
              <BookingPortal customers={scopedCustomers} vehicles={scopedVehicles} reservations={scopedReservations} onCreateContract={createContract} onCreateCustomer={createCustomer} onCreateReservation={createReservation} />
            ) : null}
            {section === "Support Inbox" ? (
              <SupportInbox messages={supportMessages} onClose={closeSupportMessage} />
            ) : null}
            {section === "Financials" ? (
              <FinancialsPanel
                agreementTemplate={agreementTemplate}
                bankAccount={bankAccount}
                financialSummary={financialSummary}
                payouts={payouts}
                rentalAgreements={rentalAgreements}
                transactions={financialTransactions}
                onAgreementSave={saveAgreementTemplate}
                onBankSave={saveBankingInfo}
                onConnect={startConnectOnboarding}
                onOpenStripeDashboard={openConnectDashboard}
                onRemoveBank={removeBankAccount}
              />
            ) : null}
            {section === "AI Workspace" ? (
              <AiWorkspace
                aiConnected={aiConnected}
                maintenance={maintenanceItems}
                reservations={scopedReservations}
                revenueSeries={initialRevenueSeries}
                vehicles={scopedVehicles}
              />
            ) : null}
            {section === "AI Ad Maker" ? (
              <AdMaker
                organizationId={organizationId}
                orgName={initialOrganization.name}
                website={websiteSettings.customDomain || initialOrganization.domain}
                brandColor={websiteSettings.brandColor}
                logoUrl={websiteSettings.logoUrl}
                aiConnected={aiConnected}
                providers={adProviders}
              />
            ) : null}
            {section === "Billing" ? (
              <BillingPanel
                customers={scopedCustomers}
                reservations={scopedReservations}
                stripeConnected={stripeConnected}
                subscriptionInfo={initialSubscriptionInfo}
                usageMetrics={initialUsageMetrics}
              />
            ) : null}
            {section === "Insurance" ? <InsurancePanel data={insuranceDashboard} /> : null}
            {section === "Analytics" ? <Analytics revenueSeries={initialRevenueSeries} vehicles={scopedVehicles} /> : null}
            {section === "Maintenance" ? <Maintenance maintenance={maintenanceItems} reservations={scopedReservations} vehicles={scopedVehicles} onCreateDamageReport={createDamageReport} onCreateMaintenance={createMaintenance} /> : null}
            {section === "Settings" ? <SettingsPanel organization={initialOrganization} settings={websiteSettings} onSave={updateWebsiteSettings} /> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  organization,
  onLanding,
  onSelect
}: {
  active: Section;
  organization: Props["initialOrganization"];
  onLanding: () => void;
  onSelect: (section: Section) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-5">
        <button className="flex items-center gap-3 text-left" onClick={onLanding}>
          <LogoMark />
          <div>
            <p className="font-semibold">FleetPilot AI</p>
            <p className="text-xs text-slate-400">{organization.domain}</p>
          </div>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-1">
          {sections.map((item) => {
            const Icon = item.icon;
            const selected = item.name === active;
            return (
              <button
                key={item.name}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${selected ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
                onClick={() => onSelect(item.name)}
              >
                <Icon className="size-4" />
                {item.name.replace("Operations ", "")}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <CheckCircle2 className="size-4" />
            System Active
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">AI optimization, telematics, booking, and fleet health modules online.</p>
        </div>
        <div className="mt-4 flex gap-2 text-sm text-slate-400">
          <HelpCircle className="size-4" /> Support
          <a className="ml-auto inline-flex items-center gap-2 hover:text-white" href="/logout" aria-label="Sign out">
            <LogOut className="size-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onNavigate }: { onNavigate: (section: Section) => void }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-20">
      <section className="grid min-h-[calc(100vh-8rem)] items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-blue-300">fleet_analytics_v4.2 / Platform Core</p>
          <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">The AI-Powered OS for Independent Car Rentals.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Scale your operations and maximize fleet ROI with the industry&apos;s most advanced intelligence layer. Automate bookings, optimize pricing, and track everything in real-time.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button className="h-12 rounded-full bg-blue-500 px-6 text-white hover:bg-blue-400" onClick={() => onNavigate("Booking Portal")}>Start Free Trial</Button>
            <Button className="h-12 rounded-full border-white/15 bg-white/[0.04] px-6 text-white hover:bg-white/[0.08]" variant="outline">Watch Demo</Button>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-blue-950/40">
          <div className="rounded-[1.5rem] border border-white/10 bg-[#0b1020] p-5">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-xs text-slate-400">LIVE DEPLOYMENT: AUSTIN, TX</span>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">AI Active</span>
            </div>
            <OperationsChart compact />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-white md:text-5xl">Designed for High-Performance Fleet Ops</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Feature icon={MapPin} title="Precision Real-Time Tracking" text="Global positioning with intelligent geofencing alerts for every vehicle in your fleet." />
          <Feature icon={CalendarDays} title="Automated Bookings" text="Zero-touch reservation management system that works while you sleep." />
          <Feature icon={Sparkles} title="AI Fleet Optimization" text="Predictive maintenance and dynamic pricing algorithms to maximize utilization." />
          <Feature icon={Car} title="Premium Fleet Assets" text="Optimized for high-value vehicle lifecycle management." />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PriceCard title="Growth" price="$299" note="/mo" features={["Up to 25 Vehicles", "Real-time Tracking", "Automated Bookings", "Basic AI Analytics"]} action="Get Started" />
        <PriceCard title="Enterprise" price="Custom" note="Recommended" features={["Unlimited Vehicles", "Dedicated Account Manager", "Custom AI Model Training", "API & Webhook Access"]} action="Contact Sales" featured />
      </section>
    </div>
  );
}

function OperationsDashboard({
  activity,
  maintenance,
  reservations,
  revenueSeries,
  vehicles
}: {
  activity: ActivityItem[];
  maintenance: MaintenanceItem[];
  reservations: Reservation[];
  revenueSeries: Props["initialRevenueSeries"];
  vehicles: Vehicle[];
}) {
  const active = reservations.filter((reservation) => ["Confirmed", "Checked In", "Late"].includes(reservation.status)).length;
  const alerts = maintenance.filter((item) => item.status !== "Completed").length;
  const revenue = revenueSeries.at(-1)?.revenue ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Operational Dashboard</h1>
          <p className="mt-2 text-slate-400">Real-time performance monitoring and fleet health.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
            <CalendarDays className="size-4" /> Last 24 Hours
          </Button>
          <Button className="bg-blue-500 text-white hover:bg-blue-400">
            <Plus className="size-4" /> New Booking
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Fleet" value="1,248" detail="+12% vs last month" icon={Car} tone="blue" />
        <Kpi label="Active Rentals" value={number.format(active + 942)} detail="86.4% utilization" icon={KeyRound} tone="emerald" />
        <Kpi label="Maint. Alerts" value={number.format(alerts + 11)} detail="3 critical actions required" icon={AlertTriangle} tone="amber" />
        <Kpi label="Revenue" value={currency.format(revenue + 81250)} detail="Daily average $5,937" icon={CircleDollarSign} tone="indigo" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Fleet Distribution">
          <OperationsChart />
        </Panel>
        <Panel title="System Health">
          <div className="flex flex-col gap-4">
            <Health label="AI Optimization" value="Active" pct={96} />
            <Health label="Cloud Gateway" value="99.9% Uptime" pct={99} />
            <Health label="Telematics Sync" value="Live" pct={91} />
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="font-medium text-white">Current Weather</p>
              <p className="mt-2 text-3xl font-black">72°F</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Ideal conditions for fleet deployment in operational hubs.</p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Recent Activity" action="View all">
        <div className="grid gap-3 lg:grid-cols-2">
          {([
            ["Vehicle #TX-204 entering maintenance", "2 mins ago • Brake pads replacement", Wrench],
            ["New Rental Confirmed #BOK-9421", "15 mins ago • User: David Miller", CheckCircle2],
            ["Low Tire Pressure Detected", "1 hour ago • Vehicle #CA-883", AlertTriangle],
            ["Telematics update: Optimized", "2 hours ago • New routes deployed to 24 units", Gauge],
            ...activity.slice(0, 2).map((item) => [`${item.actor} ${item.action}`, item.target, Sparkles] as const)
          ] satisfies ActivityRow[]).map(([title, meta, Icon]) => (
            <div key={title} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-medium text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-400">{meta}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function FleetManagement({
  availabilityBlocks,
  reservations,
  vehicles,
  onArchive,
  onCreate,
  onCreateBlock,
  onDeleteBlock,
  onUpdate
}: {
  availabilityBlocks: AvailabilityBlock[];
  reservations: Reservation[];
  vehicles: Vehicle[];
  onArchive: (vehicleId: string) => void;
  onCreate: (event: React.FormEvent<HTMLFormElement>) => void;
  onCreateBlock: (event: React.FormEvent<HTMLFormElement>) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdate: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [selectedVehicleId, setSelectedVehicleId] = React.useState(vehicles[0]?.id ?? "");
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0];
  const selectedReservations = selectedVehicle
    ? reservations.filter((reservation) => reservation.vehicleId === selectedVehicle.id)
    : [];
  const selectedBlocks = selectedVehicle
    ? availabilityBlocks.filter((block) => block.vehicleId === selectedVehicle.id)
    : [];

  React.useEffect(() => {
    if (!vehicles.length) {
      setSelectedVehicleId("");
      return;
    }
    if (!vehicles.some((vehicle) => vehicle.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [selectedVehicleId, vehicles]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Panel title="Fleet Management">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="pb-4">Vehicle</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Location</th>
                <th className="pb-4">Mileage</th>
                <th className="pb-4">Revenue</th>
                <th className="pb-4">Maintenance</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${vehicle.image})` }} />
                      <div>
                        <p className="font-semibold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-slate-500">{vehicle.licensePlate} • {vehicle.vin}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4"><span className={`rounded-full border px-3 py-1 text-xs ${statusStyles[vehicle.status]}`}>{vehicle.status}</span></td>
                  <td className="py-4 text-slate-300">{vehicle.location}</td>
                  <td className="py-4 text-slate-300">{number.format(vehicle.mileage)}</td>
                  <td className="py-4 text-slate-300">{currency.format(vehicle.revenueMtd)}</td>
                  <td className="py-4 text-slate-300">{vehicle.nextMaintenance}</td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <Button className="h-8 border-white/10 bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.08]" type="button" variant="outline" onClick={() => setSelectedVehicleId(vehicle.id)}>
                        Edit
                      </Button>
                      <Button className="h-8 border-amber-300/20 bg-amber-400/10 px-3 text-xs text-amber-100 hover:bg-amber-400/20" type="button" variant="outline" onClick={() => onArchive(vehicle.id)}>
                        Archive
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="flex flex-col gap-6">
        <Panel title="Edit Vehicle">
          {selectedVehicle ? (
            <form key={selectedVehicle.id} className="flex flex-col gap-3" onSubmit={onUpdate}>
              <input name="id" type="hidden" value={selectedVehicle.id} />
              <VehicleFields vehicle={selectedVehicle} />
              <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" type="submit"><Save className="size-4" />Save Vehicle</Button>
            </form>
          ) : (
            <p className="text-sm text-slate-400">Add a vehicle to start editing listings and availability.</p>
          )}
        </Panel>

        <Panel title="Availability Calendar">
          <form className="grid gap-3" onSubmit={onCreateBlock}>
            <DarkSelect name="vehicleId" value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} required>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}
            </DarkSelect>
            <div className="grid grid-cols-2 gap-3">
              <DarkInput name="startDate" type="date" required />
              <DarkInput name="endDate" type="date" required />
            </div>
            <DarkInput name="reason" placeholder="Reason, e.g. Owner hold or service" required />
            <Button className="bg-blue-500 text-white hover:bg-blue-400" type="submit" disabled={!vehicles.length}><Ban className="size-4" />Block Dates</Button>
          </form>
          <div className="mt-5 space-y-3">
            {[...selectedReservations.map((reservation) => ({
              id: reservation.id,
              label: "Booked",
              range: `${reservation.startDate} to ${reservation.endDate}`,
              removable: false
            })), ...selectedBlocks.map((block) => ({
              id: block.id,
              label: block.reason,
              range: `${block.startDate} to ${block.endDate}`,
              removable: true
            }))].slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.range}</p>
                </div>
                {item.removable ? (
                  <Button className="h-8 border-white/10 bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.08]" type="button" variant="outline" onClick={() => onDeleteBlock(item.id)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
            {!selectedReservations.length && !selectedBlocks.length ? <p className="text-sm text-slate-500">No bookings or blocked dates for this vehicle.</p> : null}
          </div>
        </Panel>
      </div>
      <Panel title="Add Vehicle">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
          <VehicleFields />
          <Button className="bg-blue-500 text-white hover:bg-blue-400 md:col-span-2" type="submit"><Plus className="size-4" />Add Vehicle</Button>
        </form>
      </Panel>
    </div>
  );
}

function VehicleFields({ vehicle }: { vehicle?: Vehicle }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:col-span-2">
        <DarkInput name="make" placeholder="Make" defaultValue={vehicle?.make} required />
        <DarkInput name="model" placeholder="Model" defaultValue={vehicle?.model} required />
        <DarkInput name="year" type="number" placeholder="Year" defaultValue={vehicle?.year} required />
        <DarkInput name="licensePlate" placeholder="Plate" defaultValue={vehicle?.licensePlate} required />
      </div>
      <DarkInput name="vin" placeholder="VIN" defaultValue={vehicle?.vin} required />
      <DarkInput name="dailyRate" type="number" placeholder="Daily rate" defaultValue={vehicle?.dailyRate} required />
      <DarkInput name="mileage" type="number" placeholder="Mileage" defaultValue={vehicle?.mileage} required />
      <DarkInput name="fuelLevel" type="number" placeholder="Fuel %" defaultValue={vehicle?.fuelLevel} required />
      <DarkSelect name="status" defaultValue={vehicle?.status ?? "Available"}>
        {Object.keys(statusStyles).map((status) => <option key={status}>{status}</option>)}
      </DarkSelect>
      <DarkInput name="location" placeholder="Current location" defaultValue={vehicle?.location} required />
      <label className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300 md:col-span-2">
        <span>Primary image upload</span>
        <input name="image" type="file" accept="image/*" className="text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
        <span className="text-xs text-slate-500">Uses Supabase Storage when configured.</span>
      </label>
      <label className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300 md:col-span-2">
        <span>Gallery photos</span>
        <input name="galleryImages" type="file" accept="image/*" multiple className="text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
      </label>
      <DarkInput name="imageUrl" type="url" placeholder="Or paste image URL" defaultValue={vehicle?.image} />
      <DarkInput name="publicDescription" placeholder="Public listing description" defaultValue={vehicle?.publicDescription} />
      <DarkInput name="features" placeholder="Features, comma separated" defaultValue={vehicle?.features?.join(", ")} />
      <DarkInput name="rules" placeholder="Rules, comma separated" defaultValue={vehicle?.rules?.join(", ")} />
    </>
  );
}

function BookingPortal({
  customers,
  vehicles,
  reservations,
  onCreateContract,
  onCreateCustomer,
  onCreateReservation
}: {
  customers: Customer[];
  vehicles: Vehicle[];
  reservations: Reservation[];
  onCreateContract: (reservationId: string) => void;
  onCreateCustomer: (event: React.FormEvent<HTMLFormElement>) => void;
  onCreateReservation: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="Booking Portal">
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.slice(0, 4).map((vehicle) => (
            <div key={vehicle.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="aspect-video bg-cover bg-center" style={{ backgroundImage: `url(${vehicle.image})` }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{vehicle.make} {vehicle.model}</p>
                    <p className="text-sm text-slate-400">{currency.format(vehicle.dailyRate)}/day • {vehicle.location}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-xs ${statusStyles[vehicle.status]}`}>{vehicle.status}</span>
                </div>
                <Button className="mt-4 w-full bg-blue-500 text-white hover:bg-blue-400">Reserve Vehicle</Button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <div className="flex flex-col gap-6">
        <Panel title="Create Reservation">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateReservation}>
            <DarkSelect name="customerId" required>
              <option value="">Customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </DarkSelect>
            <DarkSelect name="vehicleId" required>
              <option value="">Vehicle</option>
              {availableVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}
            </DarkSelect>
            <DarkInput name="startDate" type="date" required />
            <DarkInput name="endDate" type="date" required />
            <DarkInput name="pickupTime" type="time" required />
            <DarkInput name="returnTime" type="time" required />
            <DarkInput name="deposit" type="number" placeholder="Security deposit" required />
            <Button className="bg-emerald-500 text-slate-950 hover:bg-emerald-400" type="submit" disabled={!availableVehicles.length}>Confirm Booking</Button>
          </form>
          {!availableVehicles.length ? <p className="mt-3 text-sm text-amber-200">No vehicles are currently available for instant booking.</p> : null}
        </Panel>
        <Panel title="Add Customer">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreateCustomer}>
            <DarkInput name="name" placeholder="Name or company" required />
            <DarkInput name="email" type="email" placeholder="Email" required />
            <DarkInput name="phone" placeholder="Phone" required />
            <DarkSelect name="type" defaultValue="Retail">
              <option>Retail</option>
              <option>Corporate</option>
              <option>VIP</option>
            </DarkSelect>
            <DarkSelect name="licenseStatus" defaultValue="Pending">
              <option>Verified</option>
              <option>Pending</option>
              <option>Rejected</option>
            </DarkSelect>
            <Button className="bg-blue-500 text-white hover:bg-blue-400" type="submit">Create Customer</Button>
          </form>
        </Panel>
        <Panel title="Reservation Queue">
          <div className="flex flex-col gap-3">
            {reservations.slice(0, 4).map((reservation) => (
              <div key={reservation.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{reservation.id}</p>
                  <p className="text-sm text-slate-400">{reservation.startDate} to {reservation.endDate}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs text-blue-200">{reservation.status}</span>
                  <Button className="h-8 border-white/10 bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.08]" type="button" variant="outline" onClick={() => onCreateContract(reservation.id)}>
                    Generate
                  </Button>
                  <a className="inline-flex h-8 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white hover:bg-white/[0.08]" href={`/api/contracts/${reservation.id}`} target="_blank" rel="noreferrer">
                    Contract
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SupportInbox({
  messages,
  onClose
}: {
  messages: SupportMessage[];
  onClose: (messageId: string) => void;
}) {
  const openMessages = messages.filter((message) => message.status === "open");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Support Inbox</h1>
          <p className="mt-2 text-slate-400">Customer questions submitted from the public Help page.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Kpi label="Open Requests" value={number.format(openMessages.length)} detail="Needs admin reply" icon={Inbox} tone="blue" />
          <Kpi label="Total Requests" value={number.format(messages.length)} detail="Latest 100 loaded" icon={Mail} tone="emerald" />
        </div>
      </div>

      <Panel title="Customer Questions">
        {messages.length ? (
          <div className="grid gap-4">
            {messages.map((message) => {
              const replyHref = message.customerEmail
                ? `mailto:${message.customerEmail}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`
                : "#";
              return (
                <article key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-white">{message.subject}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${message.status === "open" ? "border-amber-300/20 bg-amber-400/10 text-amber-100" : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"}`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {message.customerName} · {message.customerEmail || "No email"}{message.reservationRef ? ` · ${message.reservationRef}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(message.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={replyHref}
                        className={`inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white hover:bg-white/[0.08] ${message.customerEmail ? "" : "pointer-events-none opacity-50"}`}
                      >
                        <Mail className="size-4" />
                        Reply
                      </a>
                      {message.status === "open" ? (
                        <Button className="h-9 border-emerald-300/20 bg-emerald-400/10 px-3 text-emerald-100 hover:bg-emerald-400/20" type="button" variant="outline" onClick={() => onClose(message.id)}>
                          Close
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-black/20 p-4 text-sm leading-6 text-slate-300">{message.body}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-400">
            No customer questions yet. Requests submitted from the public Help page will appear here.
          </div>
        )}
      </Panel>
    </div>
  );
}

type FinancialTab = "Overview" | "Transactions" | "Payouts" | "Banking" | "Taxes" | "Reports";

function FinancialsPanel({
  agreementTemplate,
  bankAccount,
  financialSummary,
  payouts,
  rentalAgreements,
  transactions,
  onAgreementSave,
  onBankSave,
  onConnect,
  onOpenStripeDashboard,
  onRemoveBank
}: {
  agreementTemplate: AgreementTemplateData;
  bankAccount: BankAccount | null;
  financialSummary: FinancialSummary;
  payouts: PayoutRecord[];
  rentalAgreements: RentalAgreementRecord[];
  transactions: FinancialTransaction[];
  onAgreementSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onBankSave: (event: React.FormEvent<HTMLFormElement>) => void;
  onConnect: () => void;
  onOpenStripeDashboard: () => void;
  onRemoveBank: () => void;
}) {
  const [tab, setTab] = React.useState<FinancialTab>("Overview");
  const [query, setQuery] = React.useState("");
  const tabs: FinancialTab[] = ["Overview", "Transactions", "Payouts", "Banking", "Taxes", "Reports"];
  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.reservationId} ${transaction.customerName} ${transaction.vehicleLabel} ${transaction.status}`.toLowerCase().includes(query.toLowerCase())
  );

  function exportCsv() {
    const header = ["Booking ID", "Customer", "Vehicle", "Gross", "Platform Fee", "Processing Fee", "Insurance", "Taxes", "Net Payout", "Status"];
    const rows = filteredTransactions.map((item) => [
      item.reservationId,
      item.customerName,
      item.vehicleLabel,
      item.grossAmount,
      item.platformFee,
      item.processingFee,
      item.insuranceRevenue,
      item.taxes,
      item.netPayout,
      item.status
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "fleetpilot-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Financials</h1>
          <p className="mt-2 text-slate-400">Payouts, banking, transactions, taxes, reports, and rental agreement records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-blue-500 text-white hover:bg-blue-400" type="button" onClick={onConnect}>Connect bank</Button>
          <Button variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" type="button" onClick={onOpenStripeDashboard}>
            Stripe Express
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.035] p-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium ${tab === item ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-white/[0.06]"}`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Available Balance" value={currency.format(financialSummary.availableBalance)} detail="Ready for payout" icon={CircleDollarSign} tone="emerald" />
            <Kpi label="Pending Balance" value={currency.format(financialSummary.pendingBalance)} detail="Processing bookings" icon={Clock} tone="amber" />
            <Kpi label="Lifetime Earnings" value={currency.format(financialSummary.lifetimeEarnings)} detail="Net payouts" icon={BarChart3} tone="indigo" />
            <Kpi label="Next Payout" value={currency.format(financialSummary.nextPayout)} detail={bankAccount?.nextPayoutDate || "Connect banking"} icon={Landmark} tone="blue" />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Panel title="Monthly Revenue"><OperationsChart compact /></Panel>
            <Panel title="Payout History">
              <div className="space-y-3">
                {payouts.slice(0, 6).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <div>
                      <p className="font-medium text-white">{currency.format(payout.amount)}</p>
                      <p className="text-xs text-slate-400">{payout.arrivalDate || payout.createdAt.slice(0, 10)}</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{payout.status}</span>
                  </div>
                ))}
                {!payouts.length ? <p className="text-sm text-slate-500">No payouts yet. Completed bookings will appear here.</p> : null}
              </div>
            </Panel>
          </div>
        </>
      ) : null}

      {tab === "Transactions" ? (
        <Panel title="Transaction History">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <DarkInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search booking, customer, vehicle, status" />
            <Button type="button" className="bg-blue-500 text-white hover:bg-blue-400" onClick={exportCsv}><Download className="size-4" />Export CSV</Button>
            <Button type="button" variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]" onClick={() => window.print()}>Export PDF</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>{["Booking ID", "Customer", "Vehicle", "Gross", "Platform", "Processing", "Insurance", "Taxes", "Net", "Status"].map((head) => <th key={head} className="pb-4">{head}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredTransactions.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 font-mono text-xs text-slate-300">{item.reservationId}</td>
                    <td className="py-4 text-white">{item.customerName}</td>
                    <td className="py-4 text-slate-300">{item.vehicleLabel}</td>
                    <td className="py-4 text-slate-300">{currency.format(item.grossAmount)}</td>
                    <td className="py-4 text-slate-300">{currency.format(item.platformFee)}</td>
                    <td className="py-4 text-slate-300">{currency.format(item.processingFee)}</td>
                    <td className="py-4 text-slate-300">{currency.format(item.insuranceRevenue)}</td>
                    <td className="py-4 text-slate-300">{currency.format(item.taxes)}</td>
                    <td className="py-4 font-medium text-emerald-200">{currency.format(item.netPayout)}</td>
                    <td className="py-4 text-slate-300">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {tab === "Payouts" || tab === "Banking" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Connected Bank">
            {bankAccount ? (
              <div className="space-y-3">
                {[
                  ["Bank", bankAccount.bankName],
                  ["Last four", bankAccount.last4 ? `•••• ${bankAccount.last4}` : "Pending"],
                  ["Routing", bankAccount.routingLast4 ? `•••• ${bankAccount.routingLast4}` : "Pending"],
                  ["Verification", bankAccount.verificationStatus],
                  ["Next payout", bankAccount.nextPayoutDate || "Pending"],
                  ["Schedule", bankAccount.payoutSchedule],
                  ["Estimated payout", currency.format(bankAccount.estimatedPayout)]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-white">{value}</span>
                  </div>
                ))}
                <Button type="button" variant="destructive" onClick={onRemoveBank}>Remove bank</Button>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No bank account connected yet. Start Stripe Connect onboarding or enter bank details for verification.</p>
            )}
          </Panel>
          <Panel title="Banking Setup">
            <form className="grid gap-3 md:grid-cols-2" onSubmit={onBankSave}>
              <DarkInput name="accountHolderName" placeholder="Account holder name" required />
              <DarkInput name="businessName" placeholder="Business name" required />
              <DarkInput name="routingNumber" inputMode="numeric" placeholder="Routing number" required />
              <DarkInput name="accountNumber" inputMode="numeric" placeholder="Account number" required />
              <DarkSelect name="accountType" defaultValue="checking">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </DarkSelect>
              <DarkSelect name="taxStatus" defaultValue="pending">
                <option value="pending">Tax info pending</option>
                <option value="submitted">Tax info submitted</option>
                <option value="verified">Tax info verified</option>
              </DarkSelect>
              <Button className="bg-blue-500 text-white hover:bg-blue-400 md:col-span-2" type="submit">Save banking details</Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">Routing and account numbers are sent to Stripe for tokenization and are never stored by FleetPilot.</p>
          </Panel>
        </div>
      ) : null}

      {tab === "Taxes" || tab === "Reports" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Tax Summary">
            <div className="grid gap-3">
              <Health label="Gross revenue" value={currency.format(financialSummary.totalRevenue)} pct={100} />
              <Health label="Platform fees" value={currency.format(financialSummary.platformFees)} pct={Math.min(100, financialSummary.platformFees)} />
              <Health label="Processing fees" value={currency.format(financialSummary.processingFees)} pct={Math.min(100, financialSummary.processingFees)} />
              <Health label="Refunds" value={currency.format(financialSummary.refunds)} pct={Math.min(100, financialSummary.refunds)} />
            </div>
          </Panel>
          <Panel title="Signed Agreements">
            <div className="space-y-3">
              {rentalAgreements.slice(0, 8).map((agreement) => (
                <div key={agreement.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div>
                    <p className="font-medium text-white">{agreement.customerName} · {agreement.vehicleLabel}</p>
                    <p className="text-xs text-slate-400">Version {agreement.version} · {agreement.signedAt.slice(0, 10)} · {agreement.signatureMethod}</p>
                  </div>
                  <a className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white hover:bg-white/[0.08]" href={agreement.pdfUrl} target="_blank" rel="noreferrer">PDF</a>
                </div>
              ))}
              {!rentalAgreements.length ? <p className="text-sm text-slate-500">Signed agreements will appear after customer checkout.</p> : null}
            </div>
          </Panel>
          <Panel title="Rental Agreement Builder">
            <AgreementTemplateForm template={agreementTemplate} onSave={onAgreementSave} />
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function AgreementTemplateForm({ template, onSave }: { template: AgreementTemplateData; onSave: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const fields: Array<[keyof AgreementTemplateData, string, "input" | "textarea"]> = [
    ["businessName", "Business name", "input"],
    ["businessAddress", "Business address", "input"],
    ["phone", "Phone", "input"],
    ["email", "Email", "input"],
    ["terms", "Terms & Conditions", "textarea"],
    ["mileagePolicy", "Mileage policy", "textarea"],
    ["fuelPolicy", "Fuel policy", "textarea"],
    ["smokingPolicy", "Smoking policy", "textarea"],
    ["petPolicy", "Pet policy", "textarea"],
    ["lateReturnPolicy", "Late return policy", "textarea"],
    ["cleaningFee", "Cleaning fee", "textarea"],
    ["damagePolicy", "Damage policy", "textarea"],
    ["insuranceTerms", "Insurance terms", "textarea"],
    ["roadsideAssistance", "Roadside assistance", "textarea"],
    ["securityDeposit", "Security deposit", "textarea"],
    ["cancellationPolicy", "Cancellation policy", "textarea"],
    ["prohibitedUses", "Prohibited uses", "textarea"],
    ["stateClauses", "State-specific clauses", "textarea"],
    ["signatureDisclosure", "Digital signature disclosure", "textarea"]
  ];

  return (
    <form className="grid max-h-[640px] gap-3 overflow-y-auto pr-2" onSubmit={onSave}>
      {fields.map(([name, label, kind]) => (
        <label key={name} className="grid gap-2 text-sm">
          <span className="text-slate-300">{label}</span>
          {kind === "input" ? (
            <DarkInput name={name} defaultValue={String(template[name] ?? "")} required={name === "businessName"} />
          ) : (
            <DarkTextarea name={name} defaultValue={String(template[name] ?? "")} required />
          )}
        </label>
      ))}
      <Button className="bg-blue-500 text-white hover:bg-blue-400" type="submit">Save legal version</Button>
    </form>
  );
}

function Analytics({ revenueSeries, vehicles }: { revenueSeries: Props["initialRevenueSeries"]; vehicles: Vehicle[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Revenue Intelligence">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <CartesianGrid stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }} />
              <Area dataKey="revenue" stroke="#3B82F6" fill="#3B82F633" strokeWidth={2} />
              <Area dataKey="profit" stroke="#10B981" fill="#10B98122" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Vehicle Profitability">
        <div className="flex flex-col gap-4">
          {vehicles.map((vehicle) => (
            <Health key={vehicle.id} label={`${vehicle.make} ${vehicle.model}`} value={currency.format(vehicle.profitMtd)} pct={(vehicle.profitMtd / Math.max(...vehicles.map((item) => item.profitMtd))) * 100} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Maintenance({
  maintenance,
  reservations,
  vehicles,
  onCreateDamageReport,
  onCreateMaintenance
}: {
  maintenance: MaintenanceItem[];
  reservations: Reservation[];
  vehicles: Vehicle[];
  onCreateDamageReport: (event: React.FormEvent<HTMLFormElement>) => void;
  onCreateMaintenance: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Panel title="Maintenance Queue">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {maintenance.map((item) => {
            const vehicle = vehicles.find((candidate) => candidate.id === item.vehicleId);
            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{item.priority}</span>
                <h3 className="mt-5 font-semibold text-white">{item.kind}</h3>
                <p className="mt-1 text-sm text-slate-400">{vehicle?.make} {vehicle?.model}</p>
                <p className="mt-4 text-sm text-slate-300">Due {item.dueDate} • {currency.format(item.costEstimate)}</p>
              </div>
            );
          })}
        </div>
      </Panel>
      <div className="grid gap-6">
        <Panel title="Schedule Service">
          <form className="grid gap-3" onSubmit={onCreateMaintenance}>
            <DarkSelect name="vehicleId" required>
              <option value="">Vehicle</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}
            </DarkSelect>
            <DarkInput name="kind" placeholder="Service type" required />
            <DarkInput name="dueAtMileage" type="number" placeholder="Due mileage" required />
            <DarkInput name="dueDate" type="date" required />
            <div className="grid grid-cols-2 gap-3">
              <DarkSelect name="priority" defaultValue="Medium">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </DarkSelect>
              <DarkSelect name="status" defaultValue="Scheduled">
                <option>Scheduled</option>
                <option>Due</option>
                <option>Completed</option>
              </DarkSelect>
            </div>
            <DarkInput name="costEstimate" type="number" placeholder="Cost estimate" required />
            <Button className="bg-blue-500 text-white hover:bg-blue-400" type="submit">Schedule</Button>
          </form>
        </Panel>
        <Panel title="Damage Report">
          <form className="grid gap-3" onSubmit={onCreateDamageReport}>
            <DarkSelect name="vehicleId" required>
              <option value="">Vehicle</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model}</option>)}
            </DarkSelect>
            <DarkSelect name="reservationId">
              <option value="">No reservation</option>
              {reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.id}</option>)}
            </DarkSelect>
            <DarkSelect name="phase" defaultValue="Inspection">
              <option>Checkout</option>
              <option>Return</option>
              <option>Inspection</option>
              <option>Maintenance</option>
            </DarkSelect>
            <div className="grid grid-cols-2 gap-3">
              <DarkInput name="mileage" type="number" placeholder="Mileage" required />
              <DarkInput name="fuelLevel" type="number" placeholder="Fuel %" required />
            </div>
            <DarkInput name="estimate" type="number" placeholder="Estimate" required />
            <DarkInput name="notes" placeholder="Damage notes" required />
            <Button className="bg-amber-400 text-slate-950 hover:bg-amber-300" type="submit">File Report</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}

function SettingsPanel({
  organization,
  settings,
  onSave
}: {
  organization: Props["initialOrganization"];
  settings: WebsiteSettingsData;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const buildDraft = (form?: HTMLFormElement): ProfileDraft => {
    const data = form ? new FormData(form) : null;
    const field = (name: string, fallback: string) => (data ? String(data.get(name) ?? fallback) : fallback);
    return {
      name: organization.name,
      slug: organization.slug,
      logoUrl: field("logoUrl", settings.logoUrl),
      coverImageUrl: field("coverImageUrl", settings.coverImageUrl),
      backgroundStyle: field("backgroundStyle", settings.backgroundStyle) as ProfileDraft["backgroundStyle"],
      brandColor: field("brandColor", settings.brandColor),
      heroTitle: field("heroTitle", settings.heroTitle),
      about: field("about", settings.about),
      serviceArea: field("serviceArea", settings.serviceArea),
      trustBadges: field("trustBadges", settings.trustBadges)
    };
  };

  const [draft, setDraft] = React.useState<ProfileDraft>(() => buildDraft());

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Panel title="Host Profile Builder">
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={onSave}
          onChange={(event) => setDraft(buildDraft(event.currentTarget))}
        >
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Hero title</span>
            <DarkInput name="heroTitle" defaultValue={settings.heroTitle} required />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">SEO title</span>
            <DarkInput name="seoTitle" defaultValue={settings.seoTitle} placeholder={`${organization.name} rentals`} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Logo URL</span>
            <DarkInput name="logoUrl" type="url" defaultValue={settings.logoUrl} placeholder="https://..." />
          </label>
          <label className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300">
            <span>Upload logo</span>
            <input name="logo" type="file" accept="image/*" className="text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Cover photo URL</span>
            <DarkInput name="coverImageUrl" type="url" defaultValue={settings.coverImageUrl} placeholder="https://..." />
          </label>
          <label className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300">
            <span>Upload cover photo</span>
            <input name="coverImage" type="file" accept="image/*" className="text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Profile background</span>
            <DarkSelect name="backgroundStyle" defaultValue={settings.backgroundStyle}>
              <option value="soft">Soft brand tint</option>
              <option value="solid">Solid brand panel</option>
              <option value="cover">Cover photo</option>
            </DarkSelect>
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Custom domain</span>
            <DarkInput name="customDomain" defaultValue={settings.customDomain} placeholder={organization.domain} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Service area</span>
            <DarkInput name="serviceArea" defaultValue={settings.serviceArea} placeholder="Austin, TX" />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">About host/business</span>
            <DarkTextarea name="about" defaultValue={settings.about} placeholder="Tell customers about your fleet, service, and pickup experience." />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Contact email</span>
            <DarkInput name="contactEmail" type="email" defaultValue={settings.contactEmail} placeholder="reservations@company.com" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Contact phone</span>
            <DarkInput name="contactPhone" defaultValue={settings.contactPhone} placeholder="(555) 555-0123" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Instagram URL</span>
            <DarkInput name="instagramUrl" type="url" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/..." />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Facebook URL</span>
            <DarkInput name="facebookUrl" type="url" defaultValue={settings.facebookUrl} placeholder="https://facebook.com/..." />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">Pickup instructions</span>
            <DarkTextarea name="pickupInstructions" defaultValue={settings.pickupInstructions} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Cancellation policy</span>
            <DarkTextarea name="cancellationPolicy" defaultValue={settings.cancellationPolicy} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Deposit policy</span>
            <DarkTextarea name="depositPolicy" defaultValue={settings.depositPolicy} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Business hours</span>
            <DarkTextarea name="businessHours" defaultValue={settings.businessHours} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Trust badges</span>
            <DarkTextarea name="trustBadges" defaultValue={settings.trustBadges} placeholder="Verified fleet, Secure checkout, Roadside support" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Brand color</span>
            <input name="brandColor" type="color" defaultValue={settings.brandColor} className="h-11 w-full rounded-md border border-white/10 bg-white/[0.04] px-3" />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Default security deposit</span>
            <DarkInput name="depositFee" type="number" min="0" step="1" defaultValue={settings.depositFee} required />
          </label>
          <div className="flex items-end">
            <Button className="w-full bg-blue-500 text-white hover:bg-blue-400" type="submit">Save booking site</Button>
          </div>
        </form>
      </Panel>

      <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
        <Panel title="Live Profile Preview">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex size-2 animate-pulse rounded-full bg-emerald-400" />
              Updates as you edit · before you save
            </div>
            <HostProfilePreview draft={draft} />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="uppercase tracking-[0.16em] text-slate-500">Booking URL</p>
                <p className="mt-1 break-words font-medium text-white">/{organization.slug}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                <p className="uppercase tracking-[0.16em] text-slate-500">Domain</p>
                <p className="mt-1 break-words font-medium text-white">{settings.customDomain || organization.domain}</p>
              </div>
            </div>
            <a className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white hover:bg-white/[0.08]" href={`/${organization.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open live booking site
            </a>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function OperationsChart({ compact }: { compact?: boolean }) {
  const data = [
    { month: "JAN", EVs: 44, Hybrids: 24, ICE: 18 },
    { month: "FEB", EVs: 52, Hybrids: 28, ICE: 20 },
    { month: "MAR", EVs: 61, Hybrids: 32, ICE: 22 },
    { month: "APR", EVs: 68, Hybrids: 37, ICE: 23 },
    { month: "MAY", EVs: 74, Hybrids: 41, ICE: 24 },
    { month: "JUN", EVs: 84, Hybrids: 44, ICE: 25 },
    { month: "JUL", EVs: 92, Hybrids: 47, ICE: 25 },
    { month: "AUG", EVs: 104, Hybrids: 51, ICE: 24 }
  ];

  return (
    <div className={compact ? "flex h-80 flex-col" : "flex h-96 flex-col"}>
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-blue-500" />EVs</span>
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-400" />Hybrids</span>
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-indigo-400" />ICE</span>
      </div>
      <div className="grid flex-1 grid-cols-8 items-end gap-3 border-b border-l border-white/10 px-3 pb-3">
        {data.map((item) => {
          const total = item.EVs + item.Hybrids + item.ICE;
          return (
            <div key={item.month} className="flex h-full flex-col justify-end gap-2">
              <div className="flex h-[calc(var(--h)*1%)] min-h-8 flex-col justify-end overflow-hidden rounded-t-lg bg-white/5" style={{ "--h": Math.min(100, total / 1.8) } as React.CSSProperties}>
                <div className="bg-blue-500" style={{ height: `${(item.EVs / total) * 100}%` }} />
                <div className="bg-emerald-400" style={{ height: `${(item.Hybrids / total) * 100}%` }} />
                <div className="bg-indigo-400" style={{ height: `${(item.ICE / total) * 100}%` }} />
              </div>
              <span className="text-center font-mono text-[10px] text-slate-500">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {action ? <Button variant="ghost" className="text-slate-300 hover:bg-white/[0.06] hover:text-white">{action}</Button> : null}
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: React.ComponentType<{ className?: string }>; tone: "blue" | "emerald" | "amber" | "indigo" }) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    indigo: "bg-indigo-500/15 text-indigo-300"
  };
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1020]/80 p-5">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className={`flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function Health({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 leading-7 text-slate-400">{text}</p>
    </div>
  );
}

function PriceCard({ title, price, note, features, action, featured }: { title: string; price: string; note: string; features: string[]; action: string; featured?: boolean }) {
  return (
    <div className={`rounded-3xl border p-6 ${featured ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 bg-white/[0.04]"}`}>
      {featured ? <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">Recommended</span> : null}
      <h3 className="mt-4 text-2xl font-bold text-white">{title}</h3>
      <div className="mt-5 flex items-end gap-2">
        <span className="text-5xl font-black text-white">{price}</span>
        <span className="pb-2 text-slate-400">{note}</span>
      </div>
      <div className="mt-6 flex flex-col gap-3">
        {features.map((feature) => (
          <p key={feature} className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="size-4 text-emerald-300" />{feature}</p>
        ))}
      </div>
      <Button className="mt-8 w-full bg-blue-500 text-white hover:bg-blue-400">{action}</Button>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/30">
      <Car className="size-5" />
    </div>
  );
}

function DarkInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...props} className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />;
}

function DarkTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className="min-h-24 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500" />;
}

function DarkSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <Select {...props} className="border-white/10 bg-white/[0.04] text-white focus-visible:ring-blue-500 [&_option]:bg-slate-950" />;
}
