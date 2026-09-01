"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder, estimateDelivery } from "@/server/orders/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

export type AddressOption = {
  id: string;
  label: string;
  address_line_1: string;
  city: string;
};

const inputClasses =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function CreateOrderForm({ addresses }: { addresses: AddressOption[] }) {
  const [pickupAddressId, setPickupAddressId] = useState("");
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const [distanceKm, setDistanceKm] = useState("5");
  const [weightKg, setWeightKg] = useState("");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const router = useRouter();

  async function getEstimate() {
    setEstimating(true);
    const result = await estimateDelivery({
      distanceKm: Number(distanceKm) || 0,
      weightKg: Number(weightKg) || 0,
    });
    setEstimating(false);
    if (result.ok && result.data) setEstimate(result.data.total);
    else setEstimate(null);
  }

  if (addresses.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-semibold">Add at least two addresses first</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            A delivery needs a pickup and a delivery address. Manage your saved addresses to get started.
          </p>
          <Button onClick={() => router.push("/customer/addresses")}>Go to addresses</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ActionForm action={createOrder} submitLabel="Place order" resetOnSuccess>
      <input type="hidden" name="pickupAddressId" value={pickupAddressId} />
      <input type="hidden" name="deliveryAddressId" value={deliveryAddressId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Pickup address</Label>
          <select className={inputClasses} value={pickupAddressId} onChange={(e) => setPickupAddressId(e.target.value)}>
            <option value="">Select pickup…</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>{a.label} — {a.address_line_1}, {a.city}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Delivery address</Label>
          <select className={inputClasses} value={deliveryAddressId} onChange={(e) => setDeliveryAddressId(e.target.value)}>
            <option value="">Select delivery…</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>{a.label} — {a.address_line_1}, {a.city}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="packageType">Package type</Label>
          <Input id="packageType" name="packageType" placeholder="e.g. Documents, Electronics" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="numberOfPackages">Number of packages</Label>
          <Input id="numberOfPackages" name="numberOfPackages" type="number" min={1} defaultValue={1} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weightKg">Total weight (kg)</Label>
          <Input id="weightKg" name="weightKg" type="number" min={0} step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="distanceKm">Distance (km)</Label>
          <Input id="distanceKm" name="distanceKm" type="number" min={0} step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduledPickupAt">Preferred pickup time</Label>
          <Input id="scheduledPickupAt" name="scheduledPickupAt" type="datetime-local" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="specialInstructions">Special instructions</Label>
          <Textarea id="specialInstructions" name="specialInstructions" rows={3} placeholder="Landmarks, handling notes…" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <Button type="button" variant="outline" size="sm" onClick={getEstimate} disabled={estimating}>
          {estimating ? "Estimating…" : "Estimate price"}
        </Button>
        {estimate !== null ? (
          <span className="text-sm font-semibold">Estimated total: {formatINR(estimate)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Get an instant price estimate before placing the order.</span>
        )}
      </div>
    </ActionForm>
  );
}
