import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, formatDate } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { InvoiceFormDialog } from "@/components/admin/invoice-form-dialog";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  invoice_number: string;
  total: number;
  order_number: string;
  status: string;
  issued_at: string | null;
  due_at: string | null;
};

const columns: Column<Row>[] = [
  { key: "number", header: "Invoice", cell: (r) => r.invoice_number },
  { key: "order", header: "Order", cell: (r) => r.order_number },
  { key: "total", header: "Total", cell: (r) => formatINR(r.total) },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.status} /> },
  { key: "issued", header: "Issued", cell: (r) => formatDate(r.issued_at), hideOnMobile: true },
  { key: "due", header: "Due", cell: (r) => formatDate(r.due_at), hideOnMobile: true },
];

export default async function AdminInvoicesPage() {
  const admin = createAdminClient();

  const { data: invoices } = await admin.from("invoices").select("*").order("created_at", { ascending: false });
  const orderIds = (invoices ?? []).map((i) => i.order_id);
  const { data: orders } = orderIds.length
    ? await admin.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] as Array<{ id: string; order_number: string }> };
  const orderMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  // Options for the generate-invoice dialog (delivered orders without an invoice).
  const { data: allOrders } = await admin
    .from("orders")
    .select("id, order_number, customer_id, price")
    .eq("status", "DELIVERED")
    .order("created_at", { ascending: false });
  const invoicedOrderIds = new Set((invoices ?? []).map((i) => i.order_id));
  const invoiceOrders = (allOrders ?? [])
    .filter((o) => !invoicedOrderIds.has(o.id))
    .map((o) => ({
      id: o.id,
      label: `${o.order_number} — ${formatINR(o.price)}`,
      customerId: o.customer_id,
      price: o.price,
    }));

  const outstanding = (invoices ?? [])
    .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.total), 0);

  const rows: Row[] = (invoices ?? []).map((i) => ({
    id: i.id,
    invoice_number: i.invoice_number,
    total: i.total,
    order_number: orderMap.get(i.order_id) ?? "—",
    status: i.status,
    issued_at: i.issued_at,
    due_at: i.due_at,
  }));

  return (
    <>
      <PageHeader
        title="Invoices"
        description={`${formatINR(outstanding)} outstanding.`}
        actions={<InvoiceFormDialog orders={invoiceOrders} />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No invoices yet",
          description: "Generate invoices for delivered orders to track receivables.",
          icon: FileText,
        }}
      />
    </>
  );
}