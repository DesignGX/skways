import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult<T = void> =
  | { ok: true; message?: string; data: T }
  | { ok: false; error: string };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, message, data };
}

/** Failed result. `never` data keeps it assignable to any ActionResult<T>. */
export function fail(error: string): ActionResult<never> {
  // Safety: never echo raw database errors to users.
  return { ok: false, error };
}

/**
 * Extracts a safe message from an unknown error (Supabase / Zod / JS).
 * Keeps internal details server-side.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/** Revalidates paths touched after a mutation. */
export async function revalidateAll(...paths: string[]) {
  const { revalidatePath } = await import("next/cache");
  for (const p of paths) revalidatePath(p);
}

export { createAdminClient };