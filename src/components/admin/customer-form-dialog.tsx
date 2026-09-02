"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { adminCreateCustomer, adminUpdateCustomer } from "@/server/customers/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CustomerValues = {
  id?: string;
  companyName: string;
  contactPerson: string;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  billingAddress: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE";
};

export function CustomerFormDialog({
  customer,
  trigger,
}: {
  customer?: CustomerValues;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(customer?.id);
  const action = editing
    ? adminUpdateCustomer.bind(null, customer!.id!)
    : adminCreateCustomer;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit customer" : "Add customer"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the customer company details."
              : "Creates a login account and a customer record."}
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={action}
          submitLabel={editing ? "Save changes" : "Create customer"}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company name</Label>
              <Input name="companyName" defaultValue={customer?.companyName ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact person</Label>
              <Input name="contactPerson" defaultValue={customer?.contactPerson ?? ""} required />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={customer?.phone ?? ""} placeholder="+91…" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={customer?.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>GST number</Label>
              <Input name="gstNumber" defaultValue={customer?.gstNumber ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue={customer?.status ?? "ACTIVE"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Billing address</Label>
              <Textarea name="billingAddress" defaultValue={customer?.billingAddress ?? ""} rows={2} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea name="notes" defaultValue={customer?.notes ?? ""} rows={2} />
            </div>
            {!editing ? (
              <>
                <div className="space-y-1.5">
                  <Label>Login email</Label>
                  <Input name="loginEmail" type="email" required placeholder="billing@company.in" />
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