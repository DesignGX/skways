"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { invoiceSchema } from "@/lib/validations";
import { notifyUser } from "@/lib/notifications/service";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: generate an invoice for an order. */
export async function createInvoice(
  formData: FormData
): Promise<ActionResult<{ invoiceNumber: string }>> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = invoiceSchema.parse(Object.fromEntries(formData));

    const subtotal = payload.subtotal;
    const total = Math.max(0, subtotal - payload.discount);

    const { data: invoice, error } = await admin
      .from("invoices")
      .insert({
        customer_id: payload.customerId,
        order_id: payload.orderId,
        subtotal,
        tax: payload.tax,
        discount: payload.discount,
        total,
        status: "ISSUED",
        issued_at: new Date().toISOString(),
        due_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select("invoice_number, customer_id, total")
      .single();

    if (error) return fail("Could not generate the invoice.");

    // Notify the customer.
    const { data: customer } = await admin
      .from("customers")
      .select("profile_id")
      .eq("id", invoice.customer_id)
      .maybeSingle();
    if (customer) {
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("id", customer.profile_id)
        .maybeSingle();
      if (profile) {
        await notifyUser(
          profile.user_id,
          "Invoice generated",
          `Invoice ${invoice.invoice_number} for ₹${Number(invoice.total).toLocaleString("en-IN")} is ready.`,
          { type: "PAYMENT", link: "/customer/invoices" }
        );
      }
    }

    revalidatePath("/admin/invoices");
    return ok({ invoiceNumber: invoice.invoice_number }, "Invoice generated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: cancel an invoice. */
export async function cancelInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const { error } = await admin.from("invoices").update({ status: "CANCELLED" }).eq("id", invoiceId);
    if (error) return fail("Could not cancel the invoice.");
    revalidatePath("/admin/invoices");
    return ok(undefined, "Invoice cancelled");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}