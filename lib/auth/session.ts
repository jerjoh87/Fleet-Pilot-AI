import { redirect } from "next/navigation";
import type { Role } from "@/lib/types";
import { isDatabaseConfigured, prisma } from "@/lib/db/prisma";
import { resolveUserProfile, syncUserProfile } from "@/lib/auth/users";
import { organization as demoOrganization } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppSession = {
  demo: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    domain: string;
    plan: string;
    satisfaction: number;
  };
  role: Role;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
};

const demoSession: AppSession = {
  demo: true,
  user: {
    id: "demo_user",
    email: "operator@fleetpilot.ai",
    fullName: "Demo Operator"
  },
  organization: demoOrganization,
  role: "OWNER"
};

export async function getAppSession(): Promise<AppSession | null> {
  if (!isSupabaseConfigured()) {
    return demoSession;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;

  if (!authUser) {
    return null;
  }

  if (!isDatabaseConfigured()) {
    return {
      ...demoSession,
      demo: true,
      user: {
        id: authUser.id,
        email: authUser.email ?? demoSession.user.email,
        fullName: String(authUser.user_metadata?.full_name ?? authUser.email ?? "Fleet Operator")
      }
    };
  }

  const profile = await syncUserProfile({
    id: authUser.id,
    email: authUser.email ?? "",
    fullName: String(authUser.user_metadata?.full_name ?? authUser.email ?? "Fleet Operator")
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: profile.id },
    include: {
      memberships: {
        include: { organization: true },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  });

  const membership = user.memberships[0];
  if (!membership) {
    return null;
  }

  return {
    demo: false,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? user.email
    },
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      domain: membership.organization.domain ?? `${membership.organization.slug}.fleetpilot.ai`,
      plan: "Growth",
      satisfaction: 97
    },
    role: membership.role
  };
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isSupabaseConfigured()) {
    return demoSession.user;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;

  if (!authUser) {
    return null;
  }

  const user = {
    id: authUser.id,
    email: authUser.email ?? "",
    fullName: String(authUser.user_metadata?.full_name ?? authUser.email ?? "Fleet Operator")
  };

  if (!isDatabaseConfigured()) {
    return user;
  }

  const profile = await resolveUserProfile(user);

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName ?? profile.email
  };
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login" as never);
  }

  return user;
}

export async function requireAppSession() {
  const session = await getAppSession();

  if (!session) {
    redirect("/login" as never);
  }

  return session;
}

export function slugifyOrganizationName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "fleetpilot-org";
}
