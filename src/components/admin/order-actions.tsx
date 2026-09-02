"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { adminTransition, assignDriverToOrder, generateOtp, adminUpdateOrderMeta } from "@/server/orders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { OrderStatus, OtpType } from "@/types/database";

type DriverOption = { id: string; name: string };
type VehicleOption = { id: string; label: string; driverId: string | null };

const TRANSITION_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: "CONFIRMED", label: "Confirm order" },
  { value: "CANCELLED", label: "Cancel order" },
  { value: "PICKED_UP", label: "Mark picked up (override)" },
  { value: "IN_TRANSIT", label: "Mark in transit (override)" },
  { value: "OUT_FOR_DELIVERY", label: "Mark out for delivery (override)" },
  { value: "DELIVERED", label: "Mark delivered (override)" },
  { value: "FAILED", label: "Mark failed" },
  { value: "RETURNED", label: "Mark returned" },
];

export function OrderActions({
  orderId,
  status,
  drivers,
  vehicles,
  currentDriverId,
  currentVehicleId,
  price,
  distanceKm,
  weightKg,
  scheduledPickupAt,
  specialInstructions,
}: {
  orderId: string;
  status: OrderStatus;
  drivers: DriverOption[];
  vehicles: VehicleOption[];
  currentDriverId: string | null;
  currentVehicleId: string | null;
  price: number | null;
  distanceKm: number | null;
  weightKg: number | null;
  scheduledPickupAt: string | null;
  specialInstructions: string | null;
}) {
  const router = useRouter();
  const [assignedDriver, setAssignedDriver] = useState(currentDriverId ?? "");
  const [assignedVehicle, setAssignedVehicle] = useState(currentVehicleId ?? "");
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("CONFIRMED");
  const [otpResult, setOtpResult] = useState<string | null>(null);
  const [otpKind, setOtpKind] = useState<OtpType>("PICKUP");
  const [otpOpen, setOtpOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const filteredVehicles = assignedDriver
    ? vehicles.filter((v) => !v.driverId || v.driverId === assignedDriver)
    : vehicles;

  function onAssign(formData: FormData) {
    startTransition(async () => {
      const driverId = String(formData.get("driverId") ?? "");
      if (!driverId) {
        toast.error("Select a driver to assign.");
        return;
      }
      const vehicleIdRaw = String(formData.get("vehicleId") ?? "");
      const result = await assignDriverToOrder(orderId, driverId, vehicleIdRaw || null);
      if (result.ok) {
        toast.success(result.message ?? "Driver assigned");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not assign the driver");
      }
    });
  }

  function onTransition(formData: FormData) {
    const next = String(formData.get("status") ?? "") as OrderStatus;
    const notes = String(formData.get("notes") ?? "");
    startTransition(async () => {
      const result = await adminTransition(orderId, next, notes || undefined);
      if (result.ok) {
        toast.success(result.message ?? "Order updated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Transition failed");
      }
    });
  }

  function onMeta(formData: FormData) {
    startTransition(async () => {
      const result = await adminUpdateOrderMeta(orderId, formData);
      if (result.ok) {
        toast.success(result.message ?? "Order updated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not update the order");
      }
    });
  }

  function onGenerateOtp(type: OtpType) {
    startTransition(async () => {
      const result = await generateOtp(orderId, type);
      if (result.ok) {
        setOtpKind(type);
        setOtpResult(result.data.otp);
        setOtpOpen(true);
      } else {
        toast.error(result.error ?? "Could not generate the OTP");
      }
    });
  }

  const assignVehicleId = assignedVehicle || filteredVehicles[0]?.id || "";

  return (
    <div className="space-y-6">
      {/* Status transition */}
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Advance order</h3>
          <p className="text-sm text-muted-foreground">Move the order through the status workflow.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onTransition(new FormData(e.currentTarget));
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Next status</Label>
            <select
              name="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TRANSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input name="notes" placeholder="e.g. Customer confirmed by phone" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Update status
          </Button>
        </form>
      </section>

      {/* Assign driver */}
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Assign driver</h3>
          <p className="text-sm text-muted-foreground">Dispatch to a driver with an optional vehicle.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAssign(new FormData(e.currentTarget));
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Driver</Label>
            <select
              name="driverId"
              value={assignedDriver}
              onChange={(e) => setAssignedDriver(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <select
              name="vehicleId"
              value={assignVehicleId}
              onChange={(e) => setAssignedVehicle(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">No vehicle</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {currentDriverId ? "Reassign driver" : "Assign driver"}
          </Button>
        </form>
      </section>

      {/* OTP generation */}
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Generate OTP</h3>
          <p className="text-sm text-muted-foreground">Creates an OTP and notifies the customer in-app.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={() => onGenerateOtp("PICKUP")}>
            <KeyRound className="h-4 w-4" />
            Pickup OTP
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onGenerateOtp("DELIVERY")}>
            <KeyRound className="h-4 w-4" />
            Delivery OTP
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Status: {status}</p>
      </section>

      {/* Meta edit */}
      <section className="space-y-3 rounded-lg border p-4">
        <div>
          <h3 className="font-semibold">Booking details</h3>
          <p className="text-sm text-muted-foreground">Correct price, distance or pickup schedule.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onMeta(new FormData(e.currentTarget));
          }}
          className="grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label>Price (₹)</Label>
            <Input name="price" type="number" step="0.01" min="0" defaultValue={price ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Distance (km)</Label>
            <Input name="distanceKm" type="number" step="0.1" min="0" defaultValue={distanceKm ?? 0} />
          </div>
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input name="weightKg" type="number" step="0.1" min="0" defaultValue={weightKg ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled pickup</Label>
            <Input name="scheduledPickupAt" type="datetime-local" defaultValue={scheduledPickupAt?.slice(0, 16) ?? ""} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Special instructions</Label>
            <Textarea name="specialInstructions" defaultValue={specialInstructions ?? ""} rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save booking details
          </Button>
        </form>
      </section>

      {/* OTP result */}
      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{otpKind === "PICKUP" ? "Pickup" : "Delivery"} OTP</DialogTitle>
            <DialogDescription>
              Share this OTP with the customer. It expires shortly and can be used once.
            </DialogDescription>
          </DialogHeader>
          <p className="text-center text-4xl font-black tracking-[0.3em]">{otpResult}</p>
          <Button
            onClick={() => {
              if (otpResult) {
                void navigator.clipboard.writeText(otpResult);
                toast.success("OTP copied");
              }
            }}
          >
            Copy OTP
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}