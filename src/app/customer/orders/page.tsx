import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatINR, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  tracking_number: string;
  package_type: string;
  number_of_packages: number;
  price: number | null;
  status: OrderStatus;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "tracking", header: "Tracking number", cell: (r) => r.tracking_number },
  { key: "package", header: "Package", cell: (r) => `${r.number_of_packages} × ${r.package_type}` },
  { key: "status", header: "Status", cell: (r) => <OrderStatusBadge status={r.status} /> },
  { key: "price", header: "Price", cell: (r) => formatINR(r.price) },
  { key: "date", header: "Created", cell: (r) => formatDate(r.created_at) },
];

export default async function CustomerOrdersPage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customer?.id ?? "")
    .order("created_at", { ascending: false });

  const rows: Row[] = (orders ?? []).map((o) => ({
    id: o.id,
    tracking_number: o.tracking_number,
    package_type: o.package_type,
    number_of_packages: o.number_of_packages,
    price: o.price,
    status: o.status,
    created_at: o.created_at,
  }));

  return (
    <>
      <PageHeader
        title="My orders"
        description="Track and manage your delivery requests."
        actions={
          <Button asChild>
            <Link href="/customer/create-order">Create order</Link>
          </Button>
        }
      />
      <DataList
        columns={columns}
        rows={rows}
        hrefFor={(r) => `/customer/orders/${r.id}`}
        empty={{
          title: "No deliveries yet",
          description: "Once customers create deliveries, they will appear here.",
          icon: Package,
        }}
      />
    </>
  );
}