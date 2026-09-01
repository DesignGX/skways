"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/session";
import { paymentSchema } from "@/lib/validations";
import { notifyUser } from "@/lib/notifications/service";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/** Admin: record a payment for an order. */
export async function recordPayment(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("ADMIN");
    const admin = createAdminClient();
    const payload = paymentSchema.parse(Object.fromEntries(formData));

    const { data: order } = await admin
      .from("orders")
      .select("order_number, price, status")
      .eq("id", payload.orderId)
      .maybeSingle();
    if (!order) return fail("Order not found.");

    const { data: payment, error } = await admin
      .from("payments")
      .insert({
        order_id: payload.orderId,
        customer_id: payload.customerId,
        amount: payload.amount,
        payment_method: payload.method,
        payment_status: payload.status,
        transaction_reference: payload.transactionReference || null,
        notes: payload.notes || null,
        recorded_by: session.profileId,
        paid_at: payload.status === "PAID" ? (payload.paidAt || new Date().toISOString()) : null,
      })
      .select()
      .single();

    if (error) return fail("Could not record the payment.");

    // Match against the invoice for this order when fully paid / refunded.
    if (payload.status === "PAID" || payload.status === "REFUNDED") {
      const { data: invoice } = await admin
        .from("invoices")
        .select("id, total")
        .eq("order_id", payload.orderId)
        .eq("status", "ISSUED")
        .maybeSingle();
      if (invoice) {
        const amount = payload.status === "PAID" ? payload.amount : -payload.amount;

        // Outstanding = total - (existing PAID payments + this one)
        const { data: paidSum } = await admin
          .from("payments")
          .select("amount")
          .eq("order_id", payload.orderId)
          .eq("payment_status", "PAID");

        const otherPaid = (paidSum ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
        const remaining = Number(invoice.total) - otherPaid;

        if (payload.status === "PAID" && Math.abs(amount - remaining) < 0.01) {
          await admin.from("invoices").update({ status: "PAID", paid_at: payment.paid_at }).eq("id", invoice.id);
        } else if (payload.status === "REFUNDED") {
          await admin.from("invoices").update({ status: "ISSUED", paid_at: null }).eq("id", invoice.id);
        }
      }
    }

    // Notify the customer about the payment.
    const { data: customer } = await admin
      .from("customers")
      .select("profile_id")
      .eq("id", payload.customerId)
      .maybeSingle();
    if (customer) {
      const { data: profile } = await admin.from("profiles").select("user_id").eq("id", customer.profile_id).maybeSingle();
      if (profile) {
        await notifyUser(profile.user_id, "Payment recorded", `A payment of ₹${Number(payload.amount).toLocaleString("en-IN")} was recorded for order ${order.order_number}.`, {
          type: "PAYMENT",
          link: "/customer/invoices",
        });
      }
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/invoices");
    return ok(undefined, "Payment recorded");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

import type { PaymentStatus } from "@/types/database";

/** Admin: update payment status (refund, fail, etc.). */
export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const { error } = await admin.from("payments").update({ payment_status: status }).eq("id", paymentId);
    if (error) return fail("Could not update the payment.");
    revalidatePath("/admin/payments");
    return ok(undefined, "Payment updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}