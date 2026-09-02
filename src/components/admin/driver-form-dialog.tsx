"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { adminCreateDriver, adminUpdateDriver } from "@/server/drivers/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DriverValues = {
  id?: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyContactPhone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export function DriverFormDialog({
  driver,
  trigger,
}: {
  driver?: DriverValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(driver?.id);
  const action = editing
    ? adminUpdateDriver.bind(null, driver!.id!)
    : adminCreateDriver;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Add driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit driver" : "Add driver"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update driver and license details."
              : "Creates a login account and a driver record."}
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={action}
          submitLabel={editing ? "Save changes" : "Create driver"}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input name="fullName" defaultValue={driver?.fullName ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={driver?.phone ?? ""} placeholder="+91…" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={driver?.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>License number</Label>
              <Input name="licenseNumber" defaultValue={driver?.licenseNumber ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>License expiry</Label>
              <Input name="licenseExpiry" type="date" defaultValue={driver?.licenseExpiry ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={driver?.status ?? "ACTIVE"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input name="address" defaultValue={driver?.address ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency contact</Label>
              <Input name="emergencyContact" defaultValue={driver?.emergencyContact ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency contact phone</Label>
              <Input name="emergencyContactPhone" defaultValue={driver?.emergencyContactPhone ?? ""} />
            </div>
            {!editing ? (
              <>
                <div className="space-y-1.5">
                  <Label>Login email</Label>
                  <Input name="loginEmail" type="email" required placeholder="driver@skways.in" />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input name="password" type="password" required minLength={8} placeholder="min 8 characters" />
                </div>
              </>
            ) : null}
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}