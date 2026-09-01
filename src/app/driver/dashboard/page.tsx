import type { Metadata } from "next";
import Link from "next/link";
import { Bike, CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDriver } from "@/lib/auth/session";
import { isDriverActionable } from "@/lib/orders/order-status";
import { firstRelation } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const session = await requireDriver();
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(`id, tracking_number, status, distance_km, created_at,
      pickup:addresses!orders_pickup_address_id_fkey(city),
      delivery:addresses!orders_delivery_address_id_fkey(city)`)
    .eq("driver_id", session.driverId)
    .order("created_at", { ascending: false });

  const all = orders ?? [];
  const active = all.filter((o) => isDriverActionable(o.status));
  const completed = all.filter((o) => o.status === "DELIVERED");
  const todays = all.filter(
    (o) => o.created_at && new Date(o.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your deliveries at a glance.</p>
        </div>
        <Button asChild>
          <Link href="/driver/orders">View my deliveries</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned to you" value={all.length} icon={Bike} href="/driver/orders" />
        <StatCard label="Active now" value={active.length} icon={Clock} href="/driver/orders" hint="Needs action" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} href="/driver/orders" />
        <StatCard label="Created today" value={todays.length} icon={PackageCheck} href="/driver/orders" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active deliveries</CardTitle>
          <CardDescription>Deliveries that currently need your action.</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing needs your attention right now. New assignments will appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {active.slice(0, 5).map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <Link href={`/driver/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                      {order.tracking_number}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {firstRelation(order.pickup)?.city ?? "—"} → {firstRelation(order.delivery)?.city ?? "—"}
                      {order.distance_km ? ` · ${order.distance_km} km` : ""}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
