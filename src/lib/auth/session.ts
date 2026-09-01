import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/types/database";

export type SessionUser = {
  user: User;
  profileId: string | null;
  role: UserRole | null;
};

/**
 * Resolves the current user together with their profile role.
 * Returns null when there is no active session.
 */
export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    profileId: profile?.id ?? null,
    role: profile?.role ?? null,
  };
}

/**
 * Requires an active session and returns the user context.
 * Throws when unauthenticated so server actions / components fail closed.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getCurrentSessionUser();
  if (!session) {
    throw new Error("You must be signed in. Redirecting…");
  }
  return session;
}

/**
 * Requires the caller to have one of the given roles.
 * Throws a Forbidden error otherwise. Fails closed by default.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!session.role || !roles.includes(session.role)) {
    throw new ForbiddenError("You do not have permission to perform this action.");
  }
  return session;
}

/**
 * Requires the caller to be a CUSTOMER and returns their customer record.
 */
export async function requireCustomer(): Promise<SessionUser & { customerId: string }> {
  const session = await requireRole("CUSTOMER");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("id")
    .eq("profile_id", session.profileId!)
    .maybeSingle();
  if (error || !data) throw new Error("Customer account not found.");
  return { ...session, customerId: data.id };
}

/**
 * Requires the caller to be a DRIVER and returns their driver record.
 */
export async function requireDriver(): Promise<SessionUser & { driverId: string }> {
  const session = await requireRole("DRIVER");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("drivers")
    .select("id")
    .eq("profile_id", session.profileId!)
    .maybeSingle();
  if (error || !data) throw new Error("Driver account not found.");
  return { ...session, driverId: data.id };
}

/** Error type used for authorization failures. */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}