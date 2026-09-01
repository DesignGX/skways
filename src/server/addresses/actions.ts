"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Customer: add a reusable address. */
export async function createAddress(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("CUSTOMER");
    if (!session.profileId) return fail("Profile missing.");

    const admin = createAdminClient();
    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("profile_id", session.profileId)
      .maybeSingle();
    if (!customer) return fail("Customer account not found.");

    const payload = addressSchema.parse({
      ...Object.fromEntries(formData),
      latitude: formData.get("latitude") || null,
      longitude: formData.get("longitude") || null,
    });

    const { error } = await admin.from("addresses").insert({
      customer_id: customer.id,
      label: payload.label,
      contact_name: payload.contactName,
      phone: payload.phone || null,
      address_line_1: payload.addressLine1,
      address_line_2: payload.addressLine2 || null,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    });
    if (error) return fail("Could not save the address.");

    revalidatePath("/customer/addresses");
    revalidatePath("/customer/create-order");
    return ok(undefined, "Address saved");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Customer: update an address. */
export async function updateAddress(addressId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("CUSTOMER");
    const admin = createAdminClient();
    const payload = addressSchema.parse(Object.fromEntries(formData));

    const { error } = await admin.from("addresses").update({
      label: payload.label,
      contact_name: payload.contactName,
      phone: payload.phone || null,
      address_line_1: payload.addressLine1,
      address_line_2: payload.addressLine2 || null,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    }).eq("id", addressId);
    if (error) return fail("Could not update the address.");

    revalidatePath("/customer/addresses");
    return ok(undefined, "Address updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Customer: delete an address. */
export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    await requireRole("CUSTOMER");
    const admin = createAdminClient();
    const { error } = await admin.from("addresses").delete().eq("id", addressId);
    if (error) return fail("Could not delete the address.");
    revalidatePath("/customer/addresses");
    return ok(undefined, "Address deleted");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}