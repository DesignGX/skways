"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { noteSchema, otpSchema } from "@/lib/validations";
import { fail, ok, toErrorMessage, type ActionResult } from "@/server/utils";
import type { OtpType } from "@/types/database";

/** Driver: accept an assigned delivery. */
export async function driverAcceptOrder(orderId: string): Promise<ActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.rpc("driver_accept_order", { p_order_id: orderId });
    if (error) return fail(error.message);

    revalidatePath("/driver/orders");
    revalidatePath(`/driver/orders/${orderId}`);
    return ok(undefined, "Delivery accepted");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/**
 * Driver: advance a delivery.
 * PICKED_UP and DELIVERED require the matching OTP.
 */
export async function driverUpdateStatus(
  orderId: string,
  status: "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED",
  otp: string | null,
  otpType: OtpType,
  formData?: FormData
): Promise<ActionResult> {
  try {
    await requireUser();
    const lat = formData ? Number(formData.get("lat") ?? null) : null;
    const lng = formData ? Number(formData.get("lng") ?? null) : null;
    const notes = formData ? String(formData.get("notes") ?? "") : "";

    const parsed = noteSchema.parse({ notes, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null });

    let otpValue: string | null = null;
    if (otp) {
      const parsedOtp = otpSchema.parse({ otp });
      otpValue = parsedOtp.otp;
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("driver_update_order_status", {
      p_order_id: orderId,
      p_new_status: status,
      p_otp: otpValue,
      p_otp_type: otpType,
      p_notes: parsed.notes || null,
      p_latitude: parsed.lat,
      p_longitude: parsed.lng,
    });
    if (error) return fail(error.message);

    revalidatePath("/driver/orders");
    revalidatePath(`/driver/orders/${orderId}`);
    return ok(undefined, "Status updated");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Driver: upload proof of delivery (photo + notes). */
export async function driverAddProof(
  orderId: string,
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  try {
    const session = await requireUser();
    const admin = createAdminClient();

    // Confirm this driver is assigned to the order.
    const user = session.user;
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) return fail("Profile not found.");

    const { data: order } = await admin
      .from("orders")
      .select("id, driver_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return fail("Order not found.");

    const { data: driver } = await admin
      .from("drivers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!driver || !order.driver_id || driver.id !== order.driver_id) {
      return fail("You are not assigned to this order.");
    }

    const file = formData.get("photo");
    const notes = String(formData.get("notes") ?? "").trim();

    let photoPath: string | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_SIZE) return fail("Photo must be smaller than 5 MB.");
      if (!ALLOWED_TYPES.includes(file.type)) return fail("Only JPG, PNG or WEBP photos are allowed.");

      const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
      photoPath = `proofs/${orderId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await admin.storage
        .from("proofs")
        .upload(photoPath, new Uint8Array(await file.arrayBuffer()), {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) return fail("Could not upload the photo: " + uploadError.message);
    }

    const { error: insertError } = await admin.from("delivery_proofs").insert({
      order_id: orderId,
      driver_id: driver.id,
      photo_url: photoPath,
      notes: notes || null,
    });
    if (insertError) return fail("Could not save the proof record.");

    revalidatePath(`/driver/orders/${orderId}`);
    revalidatePath(`/admin/orders/${orderId}`);
    return ok({ url: photoPath ?? "" }, "Proof saved");
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}

/** Signs an existing proof photo so it can be previewed. */
export async function signProofUrl(
  photoUrl: string
): Promise<ActionResult<{ url: string | null }>> {
  try {
    await requireUser();
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("proofs")
      .createSignedUrl(photoUrl, 60 * 60);
    if (error || !data) return fail("Could not prepare the image.");
    return ok({ url: data.signedUrl });
  } catch (err) {
    return fail(toErrorMessage(err));
  }
}