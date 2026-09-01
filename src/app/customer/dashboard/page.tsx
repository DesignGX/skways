import type { Metadata } from "next";
import Link from "next/link";
import { Package, CheckCircle2, Clock, IndianRupee, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatINR, formatDate } from "@/lib/utils";
import { CUSTOMER_ACTIVE_STATUSES } from "@/lib/orders/order-status";
import { StatCard } from "@/components/shared/stat-card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationBell } from "@/components/portal/notification-bell";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, company_name")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const customerId = customer?.id ?? "";

  const [{ data: orders }, { data: payments }, { data: invoices }] = await Promise.all([
    supabase.from("orders").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
    supabase.from("payments").select("payment_status, amount").eq("customer_id", customerId),
    supabase.from("invoices").select("status, total").eq("customer_id", customerId),
  ]);

  const activeCount = (orders ?? []).filter((o) => CUSTOMER_ACTIVE_STATUSES.includes(o.status)).length;
  const completedCount = (orders ?? []).filter((o) => o.status === "DELIVERED").length;
  const totalOrders = orders?.length ?? 0;
  const pendingAmount = (invoices ?? [])
    .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.total), 0);
  const paidCount = (payments ?? []).filter((p) => p.payment_status === "PAID").length;

  const firstName = (session?.user.email?.split("@")[0] ?? "there")
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hello, {firstName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {customer?.company_name ?? "Your business"} — here is your delivery overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden lg:block">
            <NotificationBell portal="customer" />
          </span>
          <Button asChild>
            <Link href="/customer/create-order">
              <PlusCircle className="h-4 w-4" />
              New delivery
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={totalOrders} icon={Package} href="/customer/orders" />
        <StatCard label="Active deliveries" value={activeCount} icon={Clock} href="/customer/orders" hint="Currently in progress" />
        <StatCard label="Completed deliveries" value={completedCount} icon={CheckCircle2} href="/customer/orders" />
        <StatCard label="Pending payments" value={formatINR(pendingAmount)} icon={IndianRupee} href="/customer/invoices" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>Your latest delivery requests.</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/customer/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(orders ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Package className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No deliveries yet</p>
              <p className="text-sm text-muted-foreground">
                Once you create deliveries, they will appear here.
              </p>
              <Button asChild>
                <Link href="/customer/create-order">Create your first delivery</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Tracking</th>
                    <th className="pb-2 pr-4 font-medium">Package</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Price</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(orders ?? []).slice(0, 5).map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/customer/orders/${order.id}`} className="font-semibold text-primary hover:underline">
                          {order.tracking_number}
                        </Link>
                      </td>
                      <td className="max-w-52 truncate py-3 pr-4 text-muted-foreground">
                        {order.number_of_packages} pkg · {order.package_type}
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

      <Card>
        <CardHeader>
          <CardTitle>Payment summary</CardTitle>
          <CardDescription>Invoice and payment position.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Open invoices</p>
            <p className="mt-1 text-xl font-bold">{(invoices ?? []).filter((i) => i.status === "ISSUED").length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Recorded payments</p>
            <p className="mt-1 text-xl font-bold">{paidCount}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-xl font-bold">{formatINR(pendingAmount)}</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
