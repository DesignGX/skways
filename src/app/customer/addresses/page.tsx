import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { deleteAddress } from "@/server/addresses/actions";
import { PageHeader } from "@/components/shared/page-header";
import { AddressFormDialog, type AddressValues } from "@/components/customer/address-form-dialog";
import { ActionButton } from "@/components/forms/action-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Addresses" };
export const dynamic = "force-dynamic";

export default async function CustomerAddressesPage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", customer?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Addresses"
        description="Manage pickup and delivery locations."
        actions={<AddressFormDialog />}
      />

      {(addresses ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">No addresses yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add at least a pickup and delivery address to start booking deliveries.
            </p>
            <AddressFormDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(addresses ?? []).map((a) => {
            const values: AddressValues = {
              id: a.id,
              label: a.label,
              contact_name: a.contact_name,
              phone: a.phone,
              address_line_1: a.address_line_1,
              address_line_2: a.address_line_2,
              city: a.city,
              state: a.state,
              postal_code: a.postal_code,
            };
            return (
              <Card key={a.id} className="flex flex-col justify-between">
                <CardContent className="space-y-1 pt-6">
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-sm">{a.contact_name}{a.phone ? ` · ${a.phone}` : ""}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {a.city}, {a.state} {a.postal_code ?? ""}
                  </p>
                </CardContent>
                <CardContent className="flex gap-2 pb-6">
                  <AddressFormDialog
                    address={values}
                    trigger={<Button variant="outline" size="sm">Edit</Button>}
                  />
                  <ActionButton
                    action={deleteAddress.bind(null, a.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    confirm="Delete this address?"
                  >
                    Delete
                  </ActionButton>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
