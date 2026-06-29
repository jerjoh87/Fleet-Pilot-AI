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
