"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { upsertPricingRule } from "@/server/pricing/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export type PricingValues = {
  id?: string;
  name: string;
  vehicleType: string;
  baseFare: number;
  perKmRate: number;
  perKgRate: number;
  waitingCharge: number;
  extraStopCharge: number;
  minimumFare: number;
  active: boolean;
};

export function PricingFormDialog({
  rule,
  trigger,
}: {
  rule?: PricingValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(rule?.id);
  const action = async (fd: FormData) => {
    fd.set("active", fd.has("active") ? "true" : "false");
    return upsertPricingRule(rule?.id ?? null, fd);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Add pricing rule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit pricing rule" : "Add pricing rule"}</DialogTitle>
          <DialogDescription>
            Fare components used to estimate the delivery price.
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={action}
          submitLabel={editing ? "Save changes" : "Create rule"}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Rule name</Label>
              <Input name="name" defaultValue={rule?.name ?? ""} required placeholder="Mini truck same city" />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle type</Label>
              <select
                name="vehicleType"
                defaultValue={rule?.vehicleType ?? "MINI_TRUCK"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["BIKE", "AUTO", "MINI_TRUCK", "LCV", "TRUCK", "OTHER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Base fare (₹)</Label>
              <Input name="baseFare" type="number" step="0.01" min="0" defaultValue={rule?.baseFare ?? "0"} required />
            </div>
            <div className="space-y-1.5">
              <Label>Per km (₹)</Label>
              <Input name="perKmRate" type="number" step="0.01" min="0" defaultValue={rule?.perKmRate ?? "0"} required />
            </div>
            <div className="space-y-1.5">
              <Label>Per kg (₹)</Label>
              <Input name="perKgRate" type="number" step="0.01" min="0" defaultValue={rule?.perKgRate ?? "0"} required />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum fare (₹)</Label>
              <Input name="minimumFare" type="number" step="0.01" min="0" defaultValue={rule?.minimumFare ?? "0"} />
            </div>
            <div className="space-y-1.5">
              <Label>Waiting charge (₹/hr)</Label>
              <Input name="waitingCharge" type="number" step="0.01" min="0" defaultValue={rule?.waitingCharge ?? "0"} />
            </div>
            <div className="space-y-1.5">
              <Label>Extra stop (₹)</Label>
              <Input name="extraStopCharge" type="number" step="0.01" min="0" defaultValue={rule?.extraStopCharge ?? "0"} />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox name="active" defaultChecked={rule?.active ?? true} />
              <Label htmlFor="active">Rule is active</Label>
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}