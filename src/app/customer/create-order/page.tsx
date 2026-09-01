import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { CreateOrderForm, type AddressOption } from "@/components/customer/create-order-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create order" };
export const dynamic = "force-dynamic";

export default async function CreateOrderPage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, label, address_line_1, city")
    .eq("customer_id", customer?.id ?? "")
    .order("created_at", { ascending: false });

  const options: AddressOption[] = (addresses ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    address_line_1: a.address_line_1,
    city: a.city,
  }));

  return (
    <>
      <PageHeader
        title="Create delivery"
        description="Request a new pickup and delivery."
      />
      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
          <CardDescription>
            Price is calculated from the distance and weight using the current pricing rules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrderForm addresses={options} />
        </CardContent>
      </Card>
    </>
  );
}
