import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Banknote, CalendarClock, MapPin, Package, PersonStanding, Truck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatINR, formatDate, firstRelation, humanize } from "@/lib/utils";
import { OrderStatusBadge, GenericStatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { OrderActions } from "@/components/admin/order-actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Order detail" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getCurrentSessionUser();
  if (!session || session.role !== "ADMIN") {
    redirect(session ? (session.role === "DRIVER" ? "/driver/dashboard" : "/customer/dashboard") : "/login");
  }

  const admin = createAdminClient();
  const { data: order } = await admin.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) {
    redirect("/admin/orders");
  }

  const [addresses, customerRes, driverRes, historyRes, otpsRes, paymentsRes, vehiclesRes] = await Promise.all([
    admin.from("addresses").select("*").in("id", [order.pickup_address_id, order.delivery_address_id]),
    admin.from("customers").select("id, company_name, contact_person, phone, email").eq("id", order.customer_id).maybeSingle(),
    order.driver_id
      ? admin.from("drivers").select("id, profile_id, license_number").eq("id", order.driver_id).maybeSingle()
      : Promise.resolve(null),
    admin.from("order_status_history").select("*").eq("order_id", id).order("created_at", { ascending: true }),
    admin.from("order_otps").select("*").eq("order_id", id),
    admin.from("payments").select("*").eq("order_id", id).order("created_at", { ascending: false }),
    admin.from("vehicles").select("id, vehicle_number, vehicle_type").eq("id", order.vehicle_id ?? "").maybeSingle(),
  ]);

  const addressMap = new Map((addresses?.data ?? []).map((a) => [a.id, a]));
  const pickup = addressMap.get(order.pickup_address_id);
  const delivery = addressMap.get(order.delivery_address_id);
  const customerName = customerRes?.data?.company_name ?? "—";

  let driverName = "Not assigned";
  let driverPhone: string | null = null;
  if (driverRes?.data) {
    const profileId = driverRes.data.profile_id;
    const { data: profile } = await admin.from("profiles").select("full_name, phone").eq("id", profileId).maybeSingle();
    driverName = profile?.full_name ?? "Driver";
    driverPhone = profile?.phone ?? null;
  }

  const { data: allDrivers } = await admin.from("drivers").select("id, profile_id");
  const profileIds = (allDrivers ?? []).map((d) => d.profile_id);
  const { data: driverProfiles } = profileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as Array<{ id: string; full_name: string }> };
  const profileMap = new Map((driverProfiles ?? []).map((p) => [p.id, p.full_name]));
  const driverOptions = (allDrivers ?? []).map((d) => ({
    id: d.id,
    name: profileMap.get(d.profile_id) ?? "Driver",
  }));

  const { data: allVehicles } = await admin.from("vehicles").select("id, vehicle_number, vehicle_type, driver_id");
  const vehicleOptions = (allVehicles ?? []).map((v) => ({
    id: v.id,
    label: `${v.vehicle_number} (${humanize(v.vehicle_type)})`,
    driverId: v.driver_id,
  }));

  const vehicleNumber = firstRelation(vehiclesRes?.data)?.vehicle_number;

  return (
    <>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
      </div>
      <PageHeader
        title={order.order_number}
        description={`Tracking ${order.tracking_number}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Route</CardTitle>
              <CardDescription>Pickup and drop-off addresses.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Pickup
                </p>
                {pickup ? (
                  <>
                    <p className="text-sm text-muted-foreground">{pickup.contact_name ?? "—"}</p>
                    <p className="text-sm">{pickup.address_line_1}</p>
                    {pickup.address_line_2 ? <p className="text-sm">{pickup.address_line_2}</p> : null}
                    <p className="text-sm text-muted-foreground">
                      {pickup.city}, {pickup.state} {pickup.postal_code ?? ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Address missing</p>
                )}
              </div>
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Delivery
                </p>
                {delivery ? (
                  <>
                    <p className="text-sm text-muted-foreground">{delivery.contact_name ?? "—"}</p>
                    <p className="text-sm">{delivery.address_line_1}</p>
                    {delivery.address_line_2 ? <p className="text-sm">{delivery.address_line_2}</p> : null}
                    <p className="text-sm text-muted-foreground">
                      {delivery.city}, {delivery.state} {delivery.postal_code ?? ""}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Address missing</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Package & billing</CardTitle>
              <CardDescription>Consignment and value details.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Package" value={`${order.number_of_packages} × ${order.package_type}`} icon={Package} />
              <Detail label="Weight" value={order.weight_kg ? `${order.weight_kg} kg` : "—"} icon={Package} />
              <Detail label="Distance" value={order.distance_km ? `${order.distance_km} km` : "—"} icon={Truck} />
              <Detail label="Price" value={formatINR(order.price)} icon={Banknote} />
              <Detail label="Scheduled pickup" value={formatDate(order.scheduled_pickup_at, true)} icon={CalendarClock} />
              <Detail label="Customer" value={customerName} icon={PersonStanding} />
              <Detail label="Driver" value={driverName} icon={PersonStanding} hint={driverPhone ?? undefined} />
              <Detail label="Vehicle" value={vehicleNumber ?? "—"} icon={Truck} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
              <CardDescription>Full tracking history for this order.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                status={order.status}
                history={(historyRes?.data ?? []).map((h) => ({
                  status: h.status,
                  notes: h.notes,
                  created_at: h.created_at,
                }))}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch</CardTitle>
              <CardDescription>Assign, advance and generate OTPs.</CardDescription>
            </CardHeader>
            <CardContent>
              <OrderActions
                orderId={order.id}
                status={order.status}
                drivers={driverOptions}
                vehicles={vehicleOptions}
                currentDriverId={order.driver_id}
                currentVehicleId={order.vehicle_id}
                price={order.price}
                distanceKm={order.distance_km}
                weightKg={order.weight_kg}
                scheduledPickupAt={order.scheduled_pickup_at}
                specialInstructions={order.special_instructions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Recorded payments against this order.</CardDescription>
            </CardHeader>
            <CardContent>
              {(paymentsRes?.data ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {(paymentsRes?.data ?? []).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-semibold">{formatINR(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.created_at, true)}</p>
                      </div>
                      <GenericStatusBadge value={p.payment_status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {(otpsRes?.data ?? []).length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>OTPs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(otpsRes?.data ?? []).map((otp) => (
                  <div key={otp.id} className="flex items-center justify-between rounded-md bg-muted/50 p-3 text-sm">
                    <span className="capitalize">{otp.type.toLowerCase()}</span>
                    <GenericStatusBadge
                      value={
                        otp.used_at
                          ? "USED"
                          : otp.expires_at && new Date(otp.expires_at) < new Date()
                            ? "EXPIRED"
                            : "ACTIVE"
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}