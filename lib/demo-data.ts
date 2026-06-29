import type { Activity, Customer, MaintenanceItem, Reservation, Vehicle } from "@/lib/types";

export const organization = {
  id: "org_luxe_drive",
  name: "LuxeDrive Rentals",
  slug: "luxedrive",
  domain: "luxedrive.fleetpilot.ai",
  plan: "Scale",
  satisfaction: 4.8
};

export const vehicles: Vehicle[] = [
  {
    id: "veh_001",
    organizationId: organization.id,
    make: "Tesla",
    model: "Model Y",
    year: 2024,
    vin: "7SAYGDEE8RF000001",
    licensePlate: "FP-2401",
    mileage: 18420,
    fuelLevel: 84,
    status: "Rented",
    location: "Downtown garage",
    dailyRate: 128,
    revenueMtd: 4864,
    profitMtd: 3110,
    nextMaintenance: "2026-07-08",
    registrationExpires: "2026-11-20",
    insuranceExpires: "2026-10-15",
    image: "https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=900&q=80",
    documents: ["Registration", "Insurance", "Inspection"],
    damageReports: 1
  },
  {
    id: "veh_002",
    organizationId: organization.id,
    make: "BMW",
    model: "X5",
    year: 2023,
    vin: "5UXCR6C03P9000002",
    licensePlate: "FP-2308",
    mileage: 32610,
    fuelLevel: 61,
    status: "Available",
    location: "Airport lot",
    dailyRate: 155,
    revenueMtd: 6045,
    profitMtd: 3822,
    nextMaintenance: "2026-07-03",
    registrationExpires: "2026-09-12",
    insuranceExpires: "2026-10-15",
    image: "https://images.unsplash.com/photo-1607853554439-0069ec0f29b6?auto=format&fit=crop&w=900&q=80",
    documents: ["Registration", "Insurance"],
    damageReports: 0
  },
  {
    id: "veh_003",
    organizationId: organization.id,
    make: "Mercedes-Benz",
    model: "C300",
    year: 2022,
    vin: "55SWF8DB2NU000003",
    licensePlate: "FP-2217",
    mileage: 41192,
    fuelLevel: 38,
    status: "Maintenance",
    location: "Service bay 2",
    dailyRate: 119,
    revenueMtd: 3213,
    profitMtd: 1788,
    nextMaintenance: "2026-06-30",
    registrationExpires: "2027-01-05",
    insuranceExpires: "2026-10-15",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=900&q=80",
    documents: ["Registration", "Insurance", "Repair invoice"],
    damageReports: 2
  },
  {
    id: "veh_004",
    organizationId: organization.id,
    make: "Toyota",
    model: "Sienna",
    year: 2024,
    vin: "5TDYSKFC1RS000004",
    licensePlate: "FP-2414",
    mileage: 12088,
    fuelLevel: 72,
    status: "Reserved",
    location: "North branch",
    dailyRate: 92,
    revenueMtd: 2760,
    profitMtd: 1925,
    nextMaintenance: "2026-08-18",
    registrationExpires: "2027-02-02",
    insuranceExpires: "2026-10-15",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=900&q=80",
    documents: ["Registration", "Insurance"],
    damageReports: 0
  }
];

export const customers: Customer[] = [
  { id: "cus_001", organizationId: organization.id, name: "Avery Johnson", email: "avery@example.com", phone: "(404) 555-0192", licenseStatus: "Verified", type: "VIP", rentals: 14, lifetimeValue: 10420, rating: 4.9, blacklisted: false },
  { id: "cus_002", organizationId: organization.id, name: "Northstar Productions", email: "ops@northstar.example", phone: "(404) 555-0171", licenseStatus: "Verified", type: "Corporate", rentals: 42, lifetimeValue: 33800, rating: 4.7, blacklisted: false },
  { id: "cus_003", organizationId: organization.id, name: "Mia Chen", email: "mia@example.com", phone: "(404) 555-0128", licenseStatus: "Pending", type: "Retail", rentals: 1, lifetimeValue: 890, rating: 4.4, blacklisted: false }
];

export const reservations: Reservation[] = [
  { id: "res_001", organizationId: organization.id, customerId: "cus_001", vehicleId: "veh_001", startDate: "2026-06-27", endDate: "2026-06-30", pickupTime: "09:00", returnTime: "10:00", status: "Checked In", total: 384, deposit: 500, agreementSigned: true, paymentStatus: "Deposit Held" },
  { id: "res_002", organizationId: organization.id, customerId: "cus_002", vehicleId: "veh_004", startDate: "2026-06-28", endDate: "2026-07-05", pickupTime: "13:30", returnTime: "15:00", status: "Confirmed", total: 644, deposit: 350, agreementSigned: true, paymentStatus: "Paid" },
  { id: "res_003", organizationId: organization.id, customerId: "cus_003", vehicleId: "veh_002", startDate: "2026-06-26", endDate: "2026-06-28", pickupTime: "11:00", returnTime: "11:00", status: "Late", total: 310, deposit: 400, agreementSigned: false, paymentStatus: "Partial" }
];

export const maintenance: MaintenanceItem[] = [
  { id: "mnt_001", organizationId: organization.id, vehicleId: "veh_003", kind: "Brake inspection", dueAtMileage: 41200, dueDate: "2026-06-30", priority: "High", status: "Due", costEstimate: 480 },
  { id: "mnt_002", organizationId: organization.id, vehicleId: "veh_002", kind: "Oil change", dueAtMileage: 33000, dueDate: "2026-07-03", priority: "Medium", status: "Scheduled", costEstimate: 140 },
  { id: "mnt_003", organizationId: organization.id, vehicleId: "veh_001", kind: "Tire rotation", dueAtMileage: 19000, dueDate: "2026-07-08", priority: "Low", status: "Scheduled", costEstimate: 95 }
];

export const activity: Activity[] = [
  { id: "act_001", organizationId: organization.id, actor: "Sam Rivera", action: "checked in", target: "Tesla Model Y", createdAt: "2026-06-28T13:20:00Z" },
  { id: "act_002", organizationId: organization.id, actor: "FleetPilot AI", action: "flagged maintenance", target: "Mercedes-Benz C300", createdAt: "2026-06-28T12:42:00Z" },
  { id: "act_003", organizationId: organization.id, actor: "Avery Johnson", action: "signed agreement", target: "Reservation res_001", createdAt: "2026-06-28T11:15:00Z" }
];

export const revenueSeries = [
  { month: "Jan", revenue: 42100, bookings: 166, profit: 24800 },
  { month: "Feb", revenue: 38900, bookings: 151, profit: 22100 },
  { month: "Mar", revenue: 47600, bookings: 188, profit: 28500 },
  { month: "Apr", revenue: 51200, bookings: 204, profit: 31800 },
  { month: "May", revenue: 55800, bookings: 219, profit: 34200 },
  { month: "Jun", revenue: 61250, bookings: 236, profit: 38600 }
];
