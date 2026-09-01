"use client";

import { updateMyProfile } from "@/server/customers/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ProfileValues = {
  company_name: string;
  contact_person: string;
  phone: string | null;
  gst_number: string | null;
  billing_address: string | null;
};

export function ProfileForm({ values }: { values: ProfileValues }) {
  return (
    <ActionForm action={updateMyProfile} submitLabel="Save profile" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Company name</Label>
          <Input id="companyName" name="companyName" defaultValue={values.company_name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPerson">Contact person</Label>
          <Input id="contactPerson" name="contactPerson" defaultValue={values.contact_person} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={values.phone ?? ""} placeholder="+91…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gstNumber">GST number</Label>
          <Input id="gstNumber" name="gstNumber" defaultValue={values.gst_number ?? ""} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="billingAddress">Billing address</Label>
          <Textarea id="billingAddress" name="billingAddress" rows={3} defaultValue={values.billing_address ?? ""} />
        </div>
      </div>
    </ActionForm>
  );
}
