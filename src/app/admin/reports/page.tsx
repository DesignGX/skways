import type { Metadata } from "next";
import { Gauge, IndianRupee, Package, TrendingUp, Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, humanize } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge, GenericStatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderStatus } from "@/types/database";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const admin = createAdminClient();

  const [{ data: orders }, { data: payments }, { data: customers }, { data: drivers }] = await Promise.all([
    admin.from("orders").select("id, status, customer_id, price").order("created_at", { ascending: false }),
    admin.from("payments").select("amount, payment_method, payment_status, created_at"),
    admin.from("customers").select("id, company_name, contact_person"),
    admin.from("drivers").select("id"),
  ]);

  const allOrders = orders ?? [];
  const byStatus = allOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = (payments ?? [])
    .filter((p) => p.payment_status === "PAID" && new Date(p.created_at) >= monthStart)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRevenue = (payments ?? [])
    .filter((p) => p.payment_status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const methodSplit: Record<string, number> = {};
  for (const p of payments ?? []) {
    if (p.payment_status !== "PAID") continue;
    methodSplit[p.payment_method] = (methodSplit[p.payment_method] ?? 0) + Number(p.amount);
  }

  const perCustomer = new Map<string, { name: string; orders: number; value: number }>();
  for (const o of allOrders) {
    if (Number(o.price) > 0 && o.customer_id) {
      const entry = perCustomer.get(o.customer_id) ?? { name: "Customer", orders: 0, value: 0 };
      entry.orders += 1;
      entry.value += Number(o.price);
      perCustomer.set(o.customer_id, entry);
    }
  }
  const customerNames = new Map((customers ?? []).map((c) => [c.id, c.company_name ?? c.contact_person ?? "Customer"]));
  const topCustomers = [...perCustomer.entries()]
    .map(([id, v]) => ({ ...v, name: customerNames.get(id) ?? "Customer" }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const pricedCount = allOrders.filter((o) => Number(o.price) > 0).length;
  const avgOrderValue = pricedCount ? totalRevenue / pricedCount : 0;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Operating metrics across orders, revenue and customers."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={formatINR(totalRevenue)} icon={IndianRupee} href="/admin/payments" />
        <StatCard label="This month" value={formatINR(monthRevenue)} icon={TrendingUp} href="/admin/payments" />
        <StatCard label="Orders placed" value={allOrders.length} icon={Package} href="/admin/orders" />
        <StatCard label="Active accounts" value={(customers?.length ?? 0) + (drivers?.length ?? 0)} icon={Users} href="/admin/customers" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
            <CardDescription>Current distribution of delivery states.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(byStatus).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              Object.entries(byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <OrderStatusBadge status={status as OrderStatus} />
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / allOrders.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments by method</CardTitle>
            <CardDescription>Collected revenue split by payment channel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(methodSplit).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No collected payments yet.</p>
            ) : (
              Object.entries(methodSplit)
                .sort((a, b) => b[1] - a[1])
                .map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between gap-3">
                    <GenericStatusBadge value={method} />
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${(amount / Math.max(totalRevenue, 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">{formatINR(amount)}</span>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top customers</CardTitle>
          <CardDescription>Customers ranked by booking value · avg order value {formatINR(avgOrderValue)}.</CardDescription>
        </CardHeader>
        <CardContent>
          {topCustomers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No priced orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Orders</th>
                    <th className="pb-2 font-medium">Booking value</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{c.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{c.orders}</td>
                      <td className="py-3">{formatINR(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(byStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{humanize(status)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{count}</p>
              </CardContent>
            </Card>
          ))}
        {Object.keys(byStatus).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Gauge className="mx-auto mb-2 h-8 w-8" />
              No data to report yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}