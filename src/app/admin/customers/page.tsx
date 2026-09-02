import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { CustomerFormDialog } from "@/components/admin/customer-form-dialog";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  company_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  orders: number;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "company", header: "Company", cell: (r) => r.company_name },
  { key: "contact", header: "Contact", cell: (r) => r.contact_person ?? "—" },
  { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—", hideOnMobile: true },
  { key: "orders", header: "Orders", cell: (r) => String(r.orders), hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.status} /> },
  { key: "date", header: "Joined", cell: (r) => formatDate(r.created_at), hideOnMobile: true },
];

export default async function AdminCustomersPage() {
  const admin = createAdminClient();

  const { data: customers } = await admin.from("customers").select("*").order("created_at", { ascending: false });
  const { data: orders } = await admin.from("orders").select("customer_id");

  const orderCounts = new Map<string, number>();
  for (const o of orders ?? []) {
    orderCounts.set(o.customer_id, (orderCounts.get(o.customer_id) ?? 0) + 1);
  }

  const rows: Row[] = (customers ?? []).map((c) => ({
    id: c.id,
    company_name: c.company_name,
    contact_person: c.contact_person,
    phone: c.phone,
    email: c.email,
    status: c.status,
    orders: orderCounts.get(c.id) ?? 0,
    created_at: c.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Customers"
        description="Company accounts that create deliveries."
        actions={<CustomerFormDialog />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No customers yet",
          description: "New customer accounts appear here once they register or are created by admin.",
          icon: Users,
        }}
      />
    </>
  );
}