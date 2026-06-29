import type { Role } from "@/lib/types";

const permissions = {
  SUPER_ADMIN: ["*"],
  OWNER: ["dashboard:read", "fleet:write", "reservations:write", "customers:write", "payments:write", "settings:write", "reports:read"],
  MANAGER: ["dashboard:read", "fleet:write", "reservations:write", "customers:write", "reports:read"],
  EMPLOYEE: ["dashboard:read", "fleet:read", "reservations:write", "customers:read"],
  CUSTOMER: ["portal:read", "reservations:self", "payments:self", "contracts:self"]
} satisfies Record<Role, string[]>;

export function can(role: Role, permission: string) {
  const granted = permissions[role];
  return granted.includes("*") || granted.includes(permission);
}
