import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Inbox,
  Package,
  Truck,
  Users,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, formatDate } from "@/lib/utils";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orders/order-status";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const [
    { data: orders },
    { data: customers },
    { data: drivers },
    { data: leads },
    { data: payments },
  ] = await Promise.all([
    admin.from("orders").select("id, order_number, tracking_number, status, price, created_at").order("created_at", { ascending: false }),
    admin.from("customers").select("id"),
    admin.from("drivers").select("id"),
    admin.from("leads").select("id"),
    admin.from("payments").select("amount, payment_status"),
  ]);

  const allOrders = orders ?? [];
  const activeOrders = allOrders.filter((o) => (ACTIVE_ORDER_STATUSES as string[]).includes(o.status));
  const delivered = allOrders.filter((o) => o.status === "DELIVERED");
  const newLeads = leads?.filter(() => true).length ?? 0;
  const revenue = (payments ?? [])
    .filter((p) => p.payment_status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Company-wide delivery overview.</p>
        </div>
        <Button asChild>
          <Link href="/admin/orders">
            Open dispatch queue
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={allOrders.length} icon={Package} href="/admin/orders" />
        <StatCard label="Active deliveries" value={activeOrders.length} icon={Clock} href="/admin/orders" hint="In progress right now" />
        <StatCard label="Delivered" value={delivered.length} icon={CheckCircle2} href="/admin/orders" />
        <StatCard label="Collected revenue" value={formatINR(revenue)} icon={IndianRupee} href="/admin/payments" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Customers" value={customers?.length ?? 0} icon={Users} href="/admin/customers" iconClassName="bg-blue-500/10 text-blue-600" />
        <StatCard label="Drivers" value={drivers?.length ?? 0} icon={Truck} href="/admin/drivers" iconClassName="bg-emerald-500/10 text-emerald-600" />
        <StatCard label="Quote requests" value={newLeads} icon={Inbox} href="/admin/leads" iconClassName="bg-amber-500/10 text-amber-600" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>The latest delivery requests across all customers.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {allOrders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No orders yet. New deliveries created by customers will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Tracking</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Price</th>
                    <th className="pb-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {allOrders.slice(0, 8).map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/admin/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.tracking_number}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-3 pr-4">{formatINR(order.price)}</td>
                      <td className="py-3">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}