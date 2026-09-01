"use server";

import { quoteFormSchema, leadStatusSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";
import type { LeadStatus } from "@/types/database";

/** Public quote request — no auth required. Runs on the server. */
export async function submitQuoteRequest(
  formData: FormData
): Promise<ActionResult<{ quoteRequestNumber: string }>> {
  const parsed = quoteFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const firstIssue = parsed.error.errors[0];
    return fail(firstIssue?.message ?? "Please check your details and try again.");
  }

  const values = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("leads")
    .insert({
      business_name: values.businessName,
      contact_name: values.contactName,
      phone: values.phone,
      email: values.email || null,
      service: values.service,
      pickup_address: values.pickupAddress,
      delivery_address: values.deliveryAddress,
      pickup_date: values.pickupDate || null,
      package_type: values.packageType,
      weight: values.weight,
      number_of_packages: values.number_of_packages,
      message: values.specialInstructions || null,
      source: "website",
    })
    .select("quote_request_number")
    .single();

  if (error || !data) {
    return fail("We could not save your request. Please try again in a moment.");
  }

  return ok({ quoteRequestNumber: data.quote_request_number ?? "" }, "Request received");
}

/** Contact form — stored as a lead for follow-up. */
export async function submitContactForm(
  formData: FormData
): Promise<ActionResult<{ quoteRequestNumber: string }>> {
  const parsed = quoteFormSchema.safeParse({
    businessName: formData.get("name") ?? "",
    contactName: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    message: formData.get("message") ?? "",
    pickupAddress: "Contact form",
    deliveryAddress: "Contact form",
  });

  if (!parsed.success) {
    return fail(parsed.error.errors[0]?.message ?? "Please check your details.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .insert({
      business_name: String(formData.get("name") ?? ""),
      contact_name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? "").toLowerCase() || null,
      message: String(formData.get("message") ?? ""),
      source: "contact",
    })
    .select("quote_request_number")
    .single();

  if (error || !data) return fail("We could not send your message. Please try again.");

  return ok({ quoteRequestNumber: data.quote_request_number ?? "" }, "Message sent");
}

/** Admin: update a lead's status. */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const parsed = leadStatusSchema.parse({ status });
    const admin = createAdminClient();
    const { error } = await admin
      .from("leads")
      .update({ status: parsed.status })
      .eq("id", leadId);
    if (error) return fail("Could not update the lead.");
    return ok(undefined, "Lead updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: delete a lead. */
export async function deleteLead(leadId: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const { error } = await admin.from("leads").delete().eq("id", leadId);
    if (error) return fail("Could not delete the lead.");
    return ok(undefined, "Lead deleted");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}