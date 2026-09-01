import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatINR, formatDate, humanize, firstRelation } from "@/lib/utils";
import { OrderStatusBadge, GenericStatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Order details" };
export const dynamic = "force-dynamic";

type Address = {
  label: string;
  contact_name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  phone: string | null;
};

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const { data: order } = await supabase
    .from("orders")
    .select(`*,
      pickup:addresses!orders_pickup_address_id_fkey(*),
      delivery:addresses!orders_delivery_address_id_fkey(*)
    `)
    .eq("id", id)
    .eq("customer_id", customer?.id ?? "")
    .maybeSingle();

  if (!order) notFound();

  const [{ data: history }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("order_status_history").select("status, notes, created_at").eq("order_id", order.id).order("created_at", { ascending: true }),
    supabase.from("invoices").select("*").eq("order_id", order.id),
    supabase.from("payments").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  const pickup = firstRelation(order.pickup) as Address | null;
  const delivery = firstRelation(order.delivery) as Address | null;

  function addressBlock(a: Address | null) {
    if (!a) return <p className="text-muted-foreground">—</p>;
    return (
      <>
        <p className="font-medium">{a.label} · {a.contact_name}</p>
        <p className="text-muted-foreground">
          {a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city}, {a.state} {a.postal_code ?? ""}
        </p>
        {a.phone ? <p className="text-muted-foreground">{a.phone}</p> : null}
      </>
    );
  }

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/customer/orders"><ArrowLeft className="h-4 w-4" /> Back to orders</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.tracking_number}</h1>
            <p className="text-sm text-muted-foreground">
              Order {order.order_number} · created {formatDate(order.created_at, true)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Package</p>
                <p className="mt-1 font-medium">{order.number_of_packages} × {order.package_type}</p>
                {order.weight_kg ? <p className="text-sm text-muted-foreground">{order.weight_kg} kg</p> : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Distance</p>
                <p className="mt-1 font-medium">{order.distance_km ?? 0} km</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Scheduled pickup</p>
                <p className="mt-1 font-medium">{formatDate(order.scheduled_pickup_at, true)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                <p className="mt-1 font-medium">{formatINR(order.price)}</p>
              </div>
              {order.special_instructions ? (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Special instructions</p>
                  <p className="mt-1 text-sm">{order.special_instructions}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Pickup</p>
                {addressBlock(pickup)}
              </div>
              <Separator />
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Delivery</p>
                {addressBlock(delivery)}
              </div>
            </CardContent>
          </Card>

          {(invoices ?? []).length > 0 || (payments ?? []).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Invoices and payments for this order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(invoices ?? []).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">Due {formatDate(invoice.due_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatINR(invoice.total)}</span>
                      <GenericStatusBadge value={invoice.status} />
                    </div>
                  </div>
                ))}
                {(payments ?? []).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <p className="font-medium">{humanize(payment.payment_method)} payment</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.created_at, true)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatINR(payment.amount)}</span>
                      <GenericStatusBadge value={payment.payment_status} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Live status of this delivery.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} history={history ?? []} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
