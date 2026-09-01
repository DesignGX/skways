"use client";

import { useState } from "react";
import { driverUpdateStatus } from "@/server/orders/driver-actions";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Step = "PICKED_UP" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED";

/**
 * One driver action: advance the order to `step`. PICKED_UP / DELIVERED
 * require the OTP shown to the pickup / delivery contact.
 */
export function DriverStatusForm({
  orderId,
  step,
  requiresOtp,
  otpType,
}: {
  orderId: string;
  step: Step;
  requiresOtp: boolean;
  otpType: "PICKUP" | "DELIVERY";
}) {
  const [otp, setOtp] = useState("");

  const labels: Record<Step, string> = {
    PICKED_UP: "Mark as picked up",
    IN_TRANSIT: "Start transit",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Mark as delivered",
  };

  return (
    <ActionForm
      action={(formData) => driverUpdateStatus(orderId, step, requiresOtp ? otp : null, otpType, formData)}
      submitLabel={labels[step]}
      className="space-y-3"
    >
      {requiresOtp ? (
        <div className="space-y-1.5">
          <Label htmlFor="otp">
            {otpType === "PICKUP" ? "Pickup OTP" : "Delivery OTP"}
          </Label>
          <Input
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code from the customer"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} placeholder="Anything worth recording…" />
      </div>
    </ActionForm>
  );
}
