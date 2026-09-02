"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { adminCreateVehicle, adminUpdateVehicle } from "@/server/vehicles/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type VehicleValues = {
  id?: string;
  vehicleNumber: string;
  vehicleType: string;
  make: string | null;
  model: string | null;
  capacityKg: number | null;
  driverId: string | null;
  ownership: "OWNED" | "PARTNER";
  insuranceExpiry: string | null;
  permitExpiry: string | null;
  fitnessExpiry: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function VehicleFormDialog({
  vehicle,
  driverOptions,
  trigger,
}: {
  vehicle?: VehicleValues;
  driverOptions: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(vehicle?.id);
  const action = editing
    ? adminUpdateVehicle.bind(null, vehicle!.id!)
    : adminCreateVehicle;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Add vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            Vehicle details and optional driver assignment.
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={action}
          submitLabel={editing ? "Save changes" : "Create vehicle"}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Vehicle number</Label>
              <Input name="vehicleNumber" defaultValue={vehicle?.vehicleNumber ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                name="vehicleType"
                defaultValue={vehicle?.vehicleType ?? "MINI_TRUCK"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["BIKE", "AUTO", "MINI_TRUCK", "LCV", "TRUCK", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Make</Label>
              <Input name="make" defaultValue={vehicle?.make ?? ""} placeholder="Tata" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input name="model" defaultValue={vehicle?.model ?? ""} placeholder="Ace" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacity (kg)</Label>
              <Input name="capacityKg" type="number" step="0.1" min="0" defaultValue={vehicle?.capacityKg ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Ownership</Label>
              <select
                name="ownership"
                defaultValue={vehicle?.ownership ?? "OWNED"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="OWNED">Owned</option>
                <option value="PARTNER">Partner</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Driver</Label>
              <select
                name="driverId"
                defaultValue={vehicle?.driverId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Unassigned</option>
                {driverOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={vehicle?.status ?? "ACTIVE"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Insurance expiry</Label>
              <Input name="insuranceExpiry" type="date" defaultValue={vehicle?.insuranceExpiry ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Permit expiry</Label>
              <Input name="permitExpiry" type="date" defaultValue={vehicle?.permitExpiry ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Fitness expiry</Label>
              <Input name="fitnessExpiry" type="date" defaultValue={vehicle?.fitnessExpiry ?? ""} />
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}