"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { firstRelation } from "@/lib/utils";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";

/**
 * Public shipment tracking. Anyone holding a valid tracking number can see
 * the current status timeline.
 */
export async function trackShipment(
  trackingNumber: string
): Promise<
  ActionResult<{
    orderNumber: string;
    trackingNumber: string;
    status: string;
    createdAt: string;
    scheduledPickupAt: string | null;
    estimatedDelivery: string | null;
    timeline: Array<{ status: string; notes: string | null; createdAt: string | null }>;
    pickup: { address1: string; city: string; state: string } | null;
    delivery: { address1: string; city: string; state: string } | null;
    driverName: string | null;
  }>
> {
  try {
    const normalized = trackingNumber.trim().toUpperCase();
    if (!normalized) return fail("Enter a tracking number.");

    const admin = createAdminClient();
    const { data: order, error } = await admin
      .from("orders")
      .select(
        `id, order_number, tracking_number, status, created_at, scheduled_pickup_at, delivered_at,
         driver_id,
         pickup:addresses!orders_pickup_address_id_fkey(address_line_1, city, state),
         delivery:addresses!orders_delivery_address_id_fkey(address_line_1, city, state),
         drivers(profile_id)`
      )
      .eq("tracking_number", normalized)
      .maybeSingle();

    if (error || !order) {
      return fail("We could not find a shipment with that tracking number.");
    }

    const { data: history } = await admin
      .from("order_status_history")
      .select("status, notes, created_at")
      .eq("order_id", order.id || "")
      .order("created_at", { ascending: true });

    let driverName: string | null = null;
    if (order.driver_id) {
      const driver = firstRelation(order.drivers);
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", driver?.profile_id ?? "")
        .maybeSingle();
      driverName = profile?.full_name ?? null;
    }

    return ok({
      orderNumber: order.order_number,
      trackingNumber: order.tracking_number,
      status: order.status,
      createdAt: order.created_at,
      scheduledPickupAt: order.scheduled_pickup_at,
      estimatedDelivery: order.delivered_at ?? order.scheduled_pickup_at,
      timeline: (history ?? []).map((h) => ({
        status: h.status,
        notes: h.notes,
        createdAt: h.created_at,
      })),
      pickup: firstRelation(order.pickup)
        ? {
            address1: firstRelation(order.pickup)!.address_line_1,
            city: firstRelation(order.pickup)!.city,
            state: firstRelation(order.pickup)!.state,
          }
        : null,
      delivery: firstRelation(order.delivery)
        ? {
            address1: firstRelation(order.delivery)!.address_line_1,
            city: firstRelation(order.delivery)!.city,
            state: firstRelation(order.delivery)!.state,
          }
        : null,
      driverName,
    });
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Marks a customer notification as read. */
export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").update({ read: true }).eq("id", notificationId);
    if (error) return fail("Could not update the notification.");
    return ok(undefined, "Marked as read");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}