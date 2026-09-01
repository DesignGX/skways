import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatINR, formatDate, humanize } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

export default async function CustomerInvoicesPage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", session?.profileId ?? "")
    .maybeSingle();

  const customerId = customer?.id ?? "";

  const [{ data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("invoices").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("customer_id", customerId).order("created_at", { ascending: false }),
  ]);

  const outstanding = (invoices ?? [])
    .filter((i) => i.status === "ISSUED" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <>
      <PageHeader title="Invoices" description="Your invoices and payment history." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total invoiced</p>
            <p className="mt-1 text-2xl font-bold">
              {formatINR((invoices ?? []).filter((i) => i.status !== "CANCELLED").reduce((s, i) => s + Number(i.total), 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-2xl font-bold">{formatINR(outstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Payments recorded</p>
            <p className="mt-1 text-2xl font-bold">
              {formatINR((payments ?? []).filter((p) => p.payment_status === "PAID").reduce((s, p) => s + Number(p.amount), 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>All invoices issued to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {(invoices ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No invoices yet</p>
              <p className="text-sm text-muted-foreground">Invoices appear here once issued.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(invoices ?? []).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{formatDate(invoice.issued_at)}</TableCell>
                      <TableCell>{formatDate(invoice.due_at)}</TableCell>
                      <TableCell>{formatINR(invoice.total)}</TableCell>
                      <TableCell><GenericStatusBadge value={invoice.status} /></TableCell>
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
          <CardTitle>Payments</CardTitle>
          <CardDescription>Payments recorded against your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {(payments ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No payments yet</p>
              <p className="text-sm text-muted-foreground">Recorded payments will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(payments ?? []).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.created_at, true)}</TableCell>
                      <TableCell>{humanize(payment.payment_method)}</TableCell>
                      <TableCell className="text-muted-foreground">{payment.transaction_reference ?? "—"}</TableCell>
                      <TableCell>{formatINR(payment.amount)}</TableCell>
                      <TableCell><GenericStatusBadge value={payment.payment_status} /></TableCell>
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
