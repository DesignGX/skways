import type { Metadata } from "next";
import { Package } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, formatDate, firstRelation } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Orders & dispatch" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  tracking_number: string;
  order_number: string;
  customer_name: string;
  route: string;
  price: number | null;
  status: OrderStatus;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "tracking", header: "Tracking", cell: (r) => r.tracking_number, hideOnMobile: true },
  { key: "order", header: "Order", cell: (r) => r.order_number },
  { key: "customer", header: "Customer", cell: (r) => r.customer_name },
  { key: "route", header: "Route", cell: (r) => r.route },
  { key: "price", header: "Price", cell: (r) => formatINR(r.price), hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.status} /> },
  { key: "date", header: "Created", cell: (r) => formatDate(r.created_at), hideOnMobile: true },
];

export default async function AdminOrdersPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select(
      `id, order_number, tracking_number, status, price, created_at,
       customers(company_name, contact_person),
       pickup:addresses!orders_pickup_address_id_fkey(city),
       delivery:addresses!orders_delivery_address_id_fkey(city)`
    )
    .order("created_at", { ascending: false });

  const rows: Row[] = (orders ?? []).map((o) => {
    const customer = firstRelation(o.customers);
    return {
      id: o.id,
      tracking_number: o.tracking_number,
      order_number: o.order_number,
      customer_name: customer?.company_name ?? customer?.contact_person ?? "—",
      route: `${firstRelation(o.pickup)?.city ?? "—"} → ${firstRelation(o.delivery)?.city ?? "—"}`,
      price: o.price,
      status: o.status,
      created_at: o.created_at,
    };
  });

  const byStatus = (orders ?? []).reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Orders & dispatch"
        description="All delivery requests with dispatch actions."
      />

      {Object.keys(byStatus).length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(byStatus)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <OrderStatusBadge status={status as OrderStatus} />
                <span className="text-sm font-semibold">{count}</span>
              </span>
            ))}
        </div>
      ) : null}

      <DataList
        columns={columns}
        rows={rows}
        hrefFor={(r) => `/admin/orders/${r.id}`}
        empty={{
          title: "No orders yet",
          description: "Orders created by customers and the website will appear here for dispatch.",
          icon: Package,
        }}
      />
    </>
  );
}