import type { Metadata } from "next";
import Link from "next/link";
import { Bike } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDriver } from "@/lib/auth/session";
import { isDriverActionable } from "@/lib/orders/order-status";
import { formatDate, humanize, firstRelation } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "My deliveries" };
export const dynamic = "force-dynamic";

export default async function DriverOrdersPage() {
  const session = await requireDriver();
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(`id, tracking_number, status, distance_km, number_of_packages, package_type, created_at,
      pickup:addresses!orders_pickup_address_id_fkey(city),
      delivery:addresses!orders_delivery_address_id_fkey(city)`)
    .eq("driver_id", session.driverId)
    .order("created_at", { ascending: false });

  const all = orders ?? [];
  const active = all.filter((o) => isDriverActionable(o.status));
  const past = all.filter((o) => !isDriverActionable(o.status));

  return (
    <>
      <PageHeader
        title="My deliveries"
        description="Active assignments first, then completed history."
      />

      <Card>
        <CardHeader>
          <CardTitle>Active ({active.length})</CardTitle>
          <CardDescription>Deliveries assigned to you that need action.</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bike className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No active deliveries</p>
              <p className="text-sm text-muted-foreground">New assignments will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {active.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/driver/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.tracking_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {firstRelation(order.pickup)?.city ?? "—"} → {firstRelation(order.delivery)?.city ?? "—"}
                      </TableCell>
                      <TableCell>{order.number_of_packages} × {order.package_type}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/driver/orders/${order.id}`}>Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History ({past.length})</CardTitle>
          <CardDescription>Completed and cancelled deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {past.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/driver/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.tracking_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {firstRelation(order.pickup)?.city ?? "—"} → {firstRelation(order.delivery)?.city ?? "—"}
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "DELIVERED" ? "success" : "secondary"}>
                          {humanize(order.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
