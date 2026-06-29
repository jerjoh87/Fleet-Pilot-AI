export type Role = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "EMPLOYEE" | "CUSTOMER";

export type VehicleStatus =
  | "Available"
  | "Reserved"
  | "Rented"
  | "Cleaning"
  | "Maintenance"
  | "Out of Service"
  | "Retired";

export type ReservationStatus =
  | "Quote"
  | "Confirmed"
  | "Checked In"
  | "Checked Out"
  | "Late"
  | "Cancelled";

export type Vehicle = {
  id: string;
  organizationId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  mileage: number;
  fuelLevel: number;
  status: VehicleStatus;
  location: string;
  dailyRate: number;
  publicDescription?: string;
  features?: string[];
  rules?: string[];
  images?: string[];
  revenueMtd: number;
  profitMtd: number;
  nextMaintenance: string;
  registrationExpires: string;
  insuranceExpires: string;
  image: string;
  documents: string[];
  damageReports: number;
};

export type AvailabilityBlock = {
  id: string;
  organizationId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

export type Customer = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  licenseStatus: "Verified" | "Pending" | "Rejected";
  type: "Retail" | "Corporate" | "VIP";
  rentals: number;
  lifetimeValue: number;
  rating: number;
  blacklisted: boolean;
};

export type Reservation = {
  id: string;
  organizationId: string;
  customerId: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  status: ReservationStatus;
  total: number;
  deposit: number;
  agreementSigned: boolean;
  paymentStatus: "Paid" | "Deposit Held" | "Partial" | "Refunded";
};

export type MaintenanceItem = {
  id: string;
  organizationId: string;
  vehicleId: string;
  kind: string;
  dueAtMileage: number;
  dueDate: string;
  priority: "Low" | "Medium" | "High";
  status: "Scheduled" | "Due" | "Completed";
  costEstimate: number;
};

export type Activity = {
  id: string;
  organizationId: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export type BankAccount = {
  id: string;
  organizationId: string;
  accountHolderName: string;
  businessName: string;
  accountType: string;
  bankName: string;
  last4: string;
  routingLast4: string;
  verificationStatus: string;
  payoutSchedule: string;
  nextPayoutDate: string;
  estimatedPayout: number;
};

export type FinancialTransaction = {
  id: string;
  organizationId: string;
  reservationId: string;
  customerName: string;
  vehicleLabel: string;
  grossAmount: number;
  platformFee: number;
  processingFee: number;
  insuranceRevenue: number;
  taxes: number;
  netPayout: number;
  status: string;
  createdAt: string;
};

export type PayoutRecord = {
  id: string;
  organizationId: string;
  amount: number;
  status: string;
  arrivalDate: string;
  failureMessage: string;
  createdAt: string;
};

export type RentalAgreementRecord = {
  id: string;
  organizationId: string;
  reservationId: string;
  customerName: string;
  vehicleLabel: string;
  legalName: string;
  status: string;
  version: number;
  signedAt: string;
  ipAddress: string;
  signatureMethod: string;
  pdfUrl: string;
};

export type AgreementTemplateData = {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  terms: string;
  mileagePolicy: string;
  fuelPolicy: string;
  smokingPolicy: string;
  petPolicy: string;
  lateReturnPolicy: string;
  cleaningFee: string;
  damagePolicy: string;
  insuranceTerms: string;
  roadsideAssistance: string;
  securityDeposit: string;
  cancellationPolicy: string;
  prohibitedUses: string;
  eligibilityRequirements?: string;
  liabilityWaiver?: string;
  disputeResolution?: string;
  governingLaw?: string;
  forceMajeure?: string;
  platformDisclaimer?: string;
  stateClauses: string;
  signatureDisclosure: string;
  activeVersion: number;
};

export type FinancialSummary = {
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  lifetimeEarnings: number;
  nextPayout: number;
  lastPayout: number;
  processingFees: number;
  platformFees: number;
  refunds: number;
};

export type SubscriptionInfo = {
  planId: "trial" | "starter" | "growth" | "pro";
  planName: string;
  status: string;
  interval: "monthly" | "annual";
  trialStartedAt: string;
  trialEndsAt: string;
  trialDaysRemaining: number;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextInvoiceAmount: number;
  paymentMethod: string;
};

export type UsageMetrics = {
  vehicles: number;
  staff: number;
  locations: number;
  aiRequests: number;
  storageGb: number;
  apiRequests: number;
};
