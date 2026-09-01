"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole, requireUser } from "@/lib/auth/session";
import { customerSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: create a customer account (credentials created via admin API). */
export async function adminCreateCustomer(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");

    const email = String(formData.get("loginEmail") ?? "");
    const password = String(formData.get("password") ?? "");
    const payload = customerSchema.parse(Object.fromEntries(formData));

    const admin = createAdminClient();

    // 1. Create the auth user (auto-provisions profile + customer via trigger).
    const { data: user, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "CUSTOMER",
        full_name: payload.contactPerson,
        phone: payload.phone,
        company_name: payload.companyName,
      },
    });
    if (userError) return fail("Could not create the account: " + userError.message);

    // 2. Fill in the remaining customer fields.
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user!.user.id)
      .maybeSingle();
    if (!profile) return fail("Account created but profile provisioning failed.");

    const { error: updateError } = await admin
      .from("customers")
      .update({
        gst_number: payload.gstNumber || null,
        billing_address: payload.billingAddress || null,
        notes: payload.notes || null,
        status: payload.status,
      })
      .eq("profile_id", profile.id);

    if (updateError) return fail("Account created but details could not be saved.");

    revalidatePath("/admin/customers");
    return ok(undefined, "Customer created");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: update an existing customer. */
export async function adminUpdateCustomer(
  customerId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const payload = customerSchema.parse(Object.fromEntries(formData));
    const admin = createAdminClient();

    const { data: customer } = await admin
      .from("customers")
      .select("profile_id")
      .eq("id", customerId)
      .maybeSingle();
    if (!customer) return fail("Customer not found.");

    const { error: customerError } = await admin
      .from("customers")
      .update({
        company_name: payload.companyName,
        contact_person: payload.contactPerson,
        phone: payload.phone || null,
        email: payload.email || null,
        gst_number: payload.gstNumber || null,
        billing_address: payload.billingAddress || null,
        notes: payload.notes || null,
        status: payload.status,
      })
      .eq("id", customerId);

    if (customerError) return fail("Could not update the customer.");

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: payload.contactPerson,
        phone: payload.phone || null,
        email: payload.email || null,
        status: payload.status,
      })
      .eq("id", customer.profile_id);

    if (profileError) return fail("Customer saved but profile could not be updated.");

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${customerId}`);
    return ok(undefined, "Customer updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Customer portal: update my profile + my customer record. */
export async function updateMyProfile(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireUser();
    const payload = customerSchema.parse(Object.fromEntries(formData));

    if (session.role !== "CUSTOMER") {
      return fail("This action is for customer accounts.");
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!profile) return fail("Profile not found.");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: payload.contactPerson,
        phone: payload.phone || null,
      })
      .eq("id", profile.id);
    if (profileError) return fail("Could not update your profile.");

    const { error: customerError } = await supabase
      .from("customers")
      .update({
        company_name: payload.companyName,
        contact_person: payload.contactPerson,
        phone: payload.phone || null,
        gst_number: payload.gstNumber || null,
        billing_address: payload.billingAddress || null,
      })
      .eq("profile_id", profile.id);
    if (customerError) return fail("Could not update your company details.");

    revalidatePath("/customer/profile");
    return ok(undefined, "Profile updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}