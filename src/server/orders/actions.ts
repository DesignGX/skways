"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { createOrderSchema, otpSchema } from "@/lib/validations";
import { calculatePrice } from "@/lib/pricing/pricing";
import { notifyUser } from "@/lib/notifications/service";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";
import type { OrderStatus, OtpType } from "@/types/database";

/** Public-safe pricing estimate using the active default rule. */
export async function estimateDelivery(input: {
  distanceKm: number;
  weightKg: number;
}): Promise<ActionResult<{ total: number }>> {
  try {
    const admin = createAdminClient();
    const { data: rule } = await admin
      .from("pricing_rules")
      .select("*")
      .eq("active", true)
      .in("vehicle_type", ["MINI_TRUCK", "LCV", "AUTO", "BIKE"])
      .order("vehicle_type", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rule) return fail("Pricing is not configured yet.");

    const breakdown = calculatePrice({
      rule,
      distanceKm: Math.max(0, input.distanceKm || 0),
      weightKg: Math.max(0, input.weightKg || 0),
      waitingMinutes: 0,
      extraStops: 0,
    });

    return ok({ total: breakdown.total });
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/**
 * Create an order. Customers create for their own account;
 * admins may create for any customer.
 */
export async function createOrder(
  formData: FormData
): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const session = await requireRole("ADMIN", "CUSTOMER");
    if (session.role === "CUSTOMER" && !session.profileId) return fail("Profile missing.");

    const admin = createAdminClient();
    const payload = createOrderSchema.parse(Object.fromEntries(formData));

    // Resolve the customer row.
    let customerId: string | null = null;
    let customerProfileId: string | null = null;

    if (session.role === "CUSTOMER") {
      const { data, error } = await admin
        .from("customers")
        .select("id, profile_id, status")
        .eq("profile_id", session.profileId!)
        .maybeSingle();
      if (error || !data) return fail("Your customer account could not be found.");
      if (data.status !== "ACTIVE") return fail("Your account is inactive.");
      customerId = data.id;
      customerProfileId = data.profile_id;
    } else {
      const customerIdParam = String(formData.get("customerId") ?? "");
      if (!customerIdParam) return fail("Select a customer.");
      const { data } = await admin.from("customers").select("id, profile_id").eq("id", customerIdParam).maybeSingle();
      if (!data) return fail("Customer not found.");
      customerId = data.id;
      customerProfileId = data.profile_id;
    }

    // Verify the addresses belong to this customer.
    const { data: addressRows } = await admin
      .from("addresses")
      .select("id")
      .eq("customer_id", customerId);

    const allowed = new Set((addressRows ?? []).map((a) => a.id));
    if (!allowed.has(payload.pickupAddressId) || !allowed.has(payload.deliveryAddressId)) {
      return fail("One of the selected addresses is not valid for this customer.");
    }

    // Estimate price from the active default pricing rule.
    const { data: rule } = await admin
      .from("pricing_rules")
      .select("*")
      .eq("active", true)
      .in("vehicle_type", ["MINI_TRUCK", "LCV", "AUTO", "BIKE"])
      .order("vehicle_type", { ascending: false })
      .limit(1)
      .maybeSingle();

    let price: number | null = null;
    if (rule) {
      price = calculatePrice({
        rule,
        distanceKm: Number(payload.distanceKm),
        weightKg: Number(payload.weightKg ?? 0),
      }).total;
    }

    const { data: order, error } = await admin.from("orders").insert({
      customer_id: customerId,
      pickup_address_id: payload.pickupAddressId,
      delivery_address_id: payload.deliveryAddressId,
      package_type: payload.packageType,
      weight_kg: payload.weightKg ?? null,
      number_of_packages: payload.numberOfPackages,
      distance_km: payload.distanceKm,
      price,
      status: "REQUESTED",
      scheduled_pickup_at: payload.scheduledPickupAt || null,
      special_instructions: payload.specialInstructions || null,
    }).select("order_number, tracking_number").single();

    if (error) return fail("Could not create the order. " + error.message);

    if (customerProfileId) {
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .eq("id", customerProfileId)
        .maybeSingle();

      if (profile) {
        await notifyUser(
          profile.user_id,
          "Order requested",
          `Order ${order.order_number} has been received. We will confirm shortly.`,
          { type: "ORDER", link: "/customer/orders" }
        );
      }
    }

    revalidatePath("/customer/orders");
    revalidatePath("/admin/orders");
    return ok({ orderNumber: order.order_number }, "Order created");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: confirm / cancel / fail / return via the state machine. */
export async function adminTransition(orderId: string, status: OrderStatus, notes?: string): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_order_status", {
      p_order_id: orderId,
      p_new_status: status,
      p_notes: notes ?? null,
    });
    if (error) return fail(error.message);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return ok(undefined, "Order updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: assign (or reassign) a driver and optional vehicle. */
export async function assignDriverToOrder(
  orderId: string,
  driverId: string,
  vehicleId: string | null,
  notes?: string
): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const supabase = await createClient();
    const { error } = await supabase.rpc("assign_driver_to_order", {
      p_order_id: orderId,
      p_driver_id: driverId,
      p_vehicle_id: vehicleId || null,
      p_notes: notes ?? null,
    });
    if (error) return fail(error.message);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return ok(undefined, "Driver assigned");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: generate a pickup or delivery OTP. Returns the OTP to share with the customer. */
export async function generateOtp(orderId: string, type: OtpType): Promise<ActionResult<{ otp: string }>> {
  try {
    await requireRole("ADMIN");

    const supabase = await createClient();
    const { data: otp, error } = await supabase.rpc("create_order_otp", {
      p_order_id: orderId,
      p_otp_type: type,
    });
    if (error || !otp) return fail("Could not generate the OTP.");

    // Deliver to the customer in-app (MVP channel; SMS/WhatsApp plug in later).
    const admin = createAdminClient();
    const { data: order } = await admin.from("orders").select("order_number, customer_id").eq("id", orderId).maybeSingle();
    if (order) {
      const { data: customer } = await admin.from("customers").select("profile_id").eq("id", order.customer_id).maybeSingle();
      if (customer) {
        const { data: profile } = await admin.from("profiles").select("user_id").eq("id", customer.profile_id).maybeSingle();
        if (profile) {
          await notifyUser(
            profile.user_id,
            `${type === "PICKUP" ? "Pickup" : "Delivery"} OTP ready`,
            `Share OTP ${otp} with your driver for ${type === "PICKUP" ? "pickup" : "delivery"} of order ${order.order_number}.`,
            { type: "ORDER", link: "/customer/orders/" + orderId }
          );
        }
      }
    }

    return ok({ otp }, `OTP generated for ${type.toLowerCase()}`);
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Admin: update an order's meta fields (price, distance, weight…). */
export async function adminUpdateOrderMeta(orderId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();

    const price = Number(formData.get("price") ?? 0);
    const distanceKm = Number(formData.get("distanceKm") ?? 0);
    const weightKg = formData.get("weightKg") ? Number(formData.get("weightKg")) : null;
    const scheduledPickupAt = String(formData.get("scheduledPickupAt") ?? "") || null;
    const specialInstructions = String(formData.get("specialInstructions") ?? "") || null;

    const { error } = await admin.from("orders").update({
      price: price >= 0 ? price : null,
      distance_km: distanceKm >= 0 ? distanceKm : 0,
      weight_kg: weightKg,
      scheduled_pickup_at: scheduledPickupAt,
      special_instructions: specialInstructions,
    }).eq("id", orderId);
    if (error) return fail("Could not update the order.");

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return ok(undefined, "Order updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

export { otpSchema };