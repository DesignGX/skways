"use client";

import { useState } from "react";
import { createAddress, updateAddress } from "@/server/addresses/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddressValues = {
  id?: string;
  label: string;
  contact_name: string | null;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
};

export function AddressFormDialog({
  address,
  trigger,
}: {
  address?: AddressValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(address?.id);
  const action = editing
    ? updateAddress.bind(null, address!.id!)
    : createAddress;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{editing ? "Edit" : "Add address"}</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>
            Saved addresses can be reused for future deliveries.
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={action}
          submitLabel={editing ? "Save changes" : "Add address"}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input name="label" defaultValue={address?.label} placeholder="Warehouse, Office…" required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact name</Label>
              <Input name="contactName" defaultValue={address?.contact_name ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={address?.phone ?? ""} placeholder="+91…" />
            </div>
            <div className="space-y-1.5">
              <Label>PIN code</Label>
              <Input name="postalCode" defaultValue={address?.postal_code ?? ""} placeholder="560001" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Address line 1</Label>
              <Input name="addressLine1" defaultValue={address?.address_line_1} required />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Address line 2</Label>
              <Input name="addressLine2" defaultValue={address?.address_line_2 ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input name="city" defaultValue={address?.city} required />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input name="state" defaultValue={address?.state} required />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="ml-2">
            Cancel
          </Button>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
