import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, formatDate } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { PaymentFormDialog } from "@/components/admin/payment-form-dialog";

export const metadata: Metadata = { title: "Payments" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  order_number: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "order", header: "Order", cell: (r) => r.order_number },
  { key: "amount", header: "Amount", cell: (r) => formatINR(r.amount) },
  { key: "method", header: "Method", cell: (r) => r.payment_method, hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.payment_status} /> },
  { key: "date", header: "Received", cell: (r) => formatDate(r.paid_at ?? r.created_at, true), hideOnMobile: true },
];

export default async function AdminPaymentsPage() {
  const admin = createAdminClient();

  const { data: payments } = await admin.from("payments").select("*").order("created_at", { ascending: false });
  const orderIds = (payments ?? []).map((p) => p.order_id);
  const { data: orders } = orderIds.length
    ? await admin.from("orders").select("id, order_number").in("id", orderIds)
    : { data: [] as Array<{ id: string; order_number: string }> };
  const orderMap = new Map((orders ?? []).map((o) => [o.id, o.order_number]));

  // Options for the record-payment dialog.
  const { data: allOrders } = await admin
    .from("orders")
    .select("id, order_number, customer_id, status")
    .in("status", ["CONFIRMED", "DRIVER_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"])
    .order("created_at", { ascending: false });
  const paymentOrders = (allOrders ?? []).map((o) => ({
    id: o.id,
    label: `${o.order_number}`,
    customerId: o.customer_id,
  }));

  const totalPaid = (payments ?? [])
    .filter((p) => p.payment_status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const rows: Row[] = (payments ?? []).map((p) => ({
    id: p.id,
    order_number: orderMap.get(p.order_id) ?? "—",
    amount: p.amount,
    payment_method: p.payment_method,
    payment_status: p.payment_status,
    paid_at: p.paid_at,
    created_at: p.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Payments"
        description={`${formatINR(totalPaid)} collected across ${rows.length} records.`}
        actions={<PaymentFormDialog orders={paymentOrders} />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No payments yet",
          description: "Recorded payments for orders will appear here.",
          icon: Wallet,
        }}
      />
    </>
  );
}