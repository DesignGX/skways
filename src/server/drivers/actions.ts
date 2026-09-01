"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { driverSchema, newDriverAccountSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: create a driver with a new login account. */
export async function adminCreateDriver(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();

    const email = String(formData.get("loginEmail") ?? "");

    // Attempt full account creation (email + password)…
    const parsed = newDriverAccountSchema.safeParse({
      ...Object.fromEntries(formData),
      newUserEmail: email,
    });

    if (!parsed.success) {
      return fail("Email and password are required to create a driver account.");
    }

    // Full flow: create auth user → trigger provisions profile → attach fields.
    const { data: user, error: userError } = await admin.auth.admin.createUser({
      email: parsed.data.newUserEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        role: "DRIVER",
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
      },
    });
    if (userError) return fail("Could not create the login: " + userError.message);

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user!.user.id)
      .maybeSingle();
    if (!profile) return fail("Login created but profile provisioning failed.");

    const { error: driverError } = await admin.from("drivers").insert({
      profile_id: profile.id,
      license_number: parsed.data.licenseNumber || null,
      license_expiry: parsed.data.licenseExpiry || null,
      address: parsed.data.address || null,
      emergency_contact: parsed.data.emergencyContact || null,
      emergency_contact_phone: parsed.data.emergencyContactPhone || null,
      status: parsed.data.status,
    });
    if (driverError) return fail("Login created but driver details could not be saved.");

    revalidatePath("/admin/drivers");
    return ok(undefined, "Driver created with login");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: update driver details. */
export async function adminUpdateDriver(
  driverId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = driverSchema.parse(Object.fromEntries(formData));

    const { data: driver } = await admin
      .from("drivers")
      .select("profile_id")
      .eq("id", driverId)
      .maybeSingle();
    if (!driver) return fail("Driver not found.");

    const { error: driverError } = await admin.from("drivers").update({
      license_number: payload.licenseNumber || null,
      license_expiry: payload.licenseExpiry || null,
      address: payload.address || null,
      emergency_contact: payload.emergencyContact || null,
      emergency_contact_phone: payload.emergencyContactPhone || null,
      status: payload.status,
    }).eq("id", driverId);
    if (driverError) return fail("Could not update the driver.");

    const { error: profileError } = await admin.from("profiles").update({
      full_name: payload.fullName,
      phone: payload.phone || null,
      email: payload.email || null,
      status: payload.status,
    }).eq("id", driver.profile_id);
    if (profileError) return fail("Driver saved but profile could not be updated.");

    revalidatePath("/admin/drivers");
    revalidatePath(`/admin/drivers/${driverId}`);
    return ok(undefined, "Driver updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: assign a vehicle to a driver. */
export async function assignVehicleToDriver(
  driverId: string,
  vehicleId: string
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();

    // Release the vehicle currently held (if any) then assign.
    const { data: current } = await admin
      .from("vehicles")
      .select("id, driver_id")
      .eq("driver_id", driverId);
    if (current) {
      for (const row of current) {
        await admin.from("vehicles").update({ driver_id: null }).eq("id", row.id);
      }
    }
    const { error } = await admin.from("vehicles").update({ driver_id: driverId }).eq("id", vehicleId);
    if (error) return fail("Could not assign the vehicle.");

    revalidatePath("/admin/drivers");
    revalidatePath("/admin/vehicles");
    return ok(undefined, "Vehicle assigned");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}