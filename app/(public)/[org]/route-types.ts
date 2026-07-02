import type { ReactNode } from "react";

export type OrgRouteParams = {
  org: string;
};

export type VehicleRouteParams = OrgRouteParams & {
  vehicleId: string;
};

export type OrgRoutePageProps<SearchParams = Record<string, string | string[] | undefined>> = {
  params: Promise<OrgRouteParams>;
  searchParams: Promise<SearchParams>;
};

export type OrgRouteParamsProps = {
  params: Promise<OrgRouteParams>;
};

export type VehicleRouteParamsProps = {
  params: Promise<VehicleRouteParams>;
};

export type OrgRouteLayoutProps = OrgRouteParamsProps & {
  children: ReactNode;
};
