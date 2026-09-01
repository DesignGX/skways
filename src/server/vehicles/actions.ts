"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { vehicleSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: create a vehicle. */
export async function adminCreateVehicle(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = vehicleSchema.parse({
      ...Object.fromEntries(formData),
      driverId: formData.get("driverId") || null,
    });

    const { error } = await admin.from("vehicles").insert({
      vehicle_number: payload.vehicleNumber,
      vehicle_type: payload.vehicleType,
      make: payload.make || null,
      model: payload.model || null,
      capacity_kg: payload.capacityKg ?? null,
      driver_id: payload.driverId || null,
      ownership: payload.ownership,
      insurance_expiry: payload.insuranceExpiry || null,
      permit_expiry: payload.permitExpiry || null,
      fitness_expiry: payload.fitnessExpiry || null,
      status: payload.status,
    });
    if (error) return fail("Could not create the vehicle: " + error.message);

    revalidatePath("/admin/vehicles");
    return ok(undefined, "Vehicle created");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: update a vehicle. */
export async function adminUpdateVehicle(
  vehicleId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = vehicleSchema.parse({
      ...Object.fromEntries(formData),
      driverId: formData.get("driverId") || null,
    });

    const { error } = await admin.from("vehicles").update({
      vehicle_number: payload.vehicleNumber,
      vehicle_type: payload.vehicleType,
      make: payload.make || null,
      model: payload.model || null,
      capacity_kg: payload.capacityKg ?? null,
      driver_id: payload.driverId || null,
      ownership: payload.ownership,
      insurance_expiry: payload.insuranceExpiry || null,
      permit_expiry: payload.permitExpiry || null,
      fitness_expiry: payload.fitnessExpiry || null,
      status: payload.status,
    }).eq("id", vehicleId);
    if (error) return fail("Could not update the vehicle.");

    revalidatePath("/admin/vehicles");
    return ok(undefined, "Vehicle updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}