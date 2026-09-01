"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { pricingRuleSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: create or update a pricing rule. id = null creates. */
export async function upsertPricingRule(
  id: string | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = pricingRuleSchema.parse(Object.fromEntries(formData));

    const record = {
      name: payload.name,
      vehicle_type: payload.vehicleType,
      base_fare: payload.baseFare,
      per_km_rate: payload.perKmRate,
      per_kg_rate: payload.perKgRate,
      waiting_charge: payload.waitingCharge,
      extra_stop_charge: payload.extraStopCharge,
      minimum_fare: payload.minimumFare,
      active: payload.active,
    };

    let error;
    if (id) {
      ({ error } = await admin.from("pricing_rules").update(record).eq("id", id));
    } else {
      ({ error } = await admin.from("pricing_rules").insert(record));
    }
    if (error) return fail("Could not save the pricing rule.");

    revalidatePath("/admin/pricing");
    return ok(undefined, id ? "Pricing rule updated" : "Pricing rule created");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: toggle a pricing rule active/inactive. */
export async function togglePricingRule(
  id: string,
  active: boolean
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const { error } = await admin.from("pricing_rules").update({ active }).eq("id", id);
    if (error) return fail("Could not update the pricing rule.");
    revalidatePath("/admin/pricing");
    return ok(undefined, active ? "Rule enabled" : "Rule disabled");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}