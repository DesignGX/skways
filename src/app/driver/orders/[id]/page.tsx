import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDriver } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { DriverStatusForm } from "@/components/driver/driver-status-form";
import { ProofUploadForm } from "@/components/driver/proof-upload-form";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { driverAcceptOrder } from "@/server/orders/driver-actions";
import { ActionButton } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Delivery details" };
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

export default async function DriverOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireDriver();
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(`*,
      pickup:addresses!orders_pickup_address_id_fkey(*),
      delivery:addresses!orders_delivery_address_id_fkey(*)
    `)
    .eq("id", id)
    .eq("driver_id", session.driverId)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: history }, { data: proofs }] = await Promise.all([
    admin.from("order_status_history").select("status, notes, created_at").eq("order_id", order.id).order("created_at", { ascending: true }),
    admin.from("delivery_proofs").select("id, photo_url, notes, created_at").eq("order_id", order.id).order("created_at", { ascending: false }),
  ]);

  const pickup = order.pickup as Address | null;
  const delivery = order.delivery as Address | null;

  function addressBlock(title: string, a: Address | null) {
    return (
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
        {a ? (
          <>
            <p className="font-medium">{a.label} · {a.contact_name}</p>
            <p className="text-sm text-muted-foreground">
              {a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ""}, {a.city}, {a.state} {a.postal_code ?? ""}
            </p>
            {a.phone ? <p className="text-sm text-muted-foreground">{a.phone}</p> : null}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>
    );
  }

  const status = order.status;
  const nextStep =
    status === "DRIVER_ASSIGNED" ? "PICKED_UP" :
    status === "PICKED_UP" ? "IN_TRANSIT" :
    status === "IN_TRANSIT" ? "OUT_FOR_DELIVERY" :
    status === "OUT_FOR_DELIVERY" ? "DELIVERED" : null;

  return (
    <>
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/driver/orders"><ArrowLeft className="h-4 w-4" /> Back to deliveries</Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{order.tracking_number}</h1>
            <p className="text-sm text-muted-foreground">Order {order.order_number}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {addressBlock("Pickup", pickup)}
              <Separator />
              {addressBlock("Delivery", delivery)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipment</CardTitle>
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
              <CardTitle>Proof of delivery</CardTitle>
              <CardDescription>Attach a photo or notes as delivery evidence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProofUploadForm orderId={order.id} />
              {(proofs ?? []).length > 0 ? (
                <>
                  <Separator />
                  <ul className="space-y-2 text-sm">
                    {(proofs ?? []).map((p) => (
                      <li key={p.id} className="rounded-lg border p-3">
                        <p className="font-medium">{formatDate(p.created_at, true)}</p>
                        {p.notes ? <p className="text-muted-foreground">{p.notes}</p> : null}
                        {p.photo_url ? <p className="text-xs text-muted-foreground">Photo attached</p> : null}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next action</CardTitle>
              <CardDescription>Keep the customer informed with each step.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "DRIVER_ASSIGNED" && !order.accepted_at ? (
                <ActionButton action={driverAcceptOrder.bind(null, order.id)} className="w-full">
                  Accept delivery
                </ActionButton>
              ) : nextStep ? (
                <DriverStatusForm
                  orderId={order.id}
                  step={nextStep}
                  requiresOtp={nextStep === "PICKED_UP" || nextStep === "DELIVERED"}
                  otpType={nextStep === "PICKED_UP" ? "PICKUP" : "DELIVERY"}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {status === "DELIVERED"
                    ? "Delivered. Nothing left to do."
                    : "No action available for this status."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline status={order.status} history={history ?? []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
