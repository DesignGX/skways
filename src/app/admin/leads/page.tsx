import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { LeadRowActions } from "@/components/admin/lead-row-actions";
import type { LeadStatus } from "@/types/database";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  business_name: string;
  contact_name: string;
  phone: string;
  service: string | null;
  route: string;
  status: LeadStatus;
  source: string | null;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "business", header: "Business", cell: (r) => r.business_name },
  { key: "contact", header: "Contact", cell: (r) => `${r.contact_name} · ${r.phone}` },
  { key: "service", header: "Service", cell: (r) => r.service ?? "—", hideOnMobile: true },
  { key: "source", header: "Source", cell: (r) => r.source ?? "—", hideOnMobile: true },
  { key: "date", header: "Received", cell: (r) => formatDate(r.created_at), hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.status} />, hideOnMobile: true },
];

export default async function AdminLeadsPage() {
  const admin = createAdminClient();
  const { data: leads } = await admin.from("leads").select("*").order("created_at", { ascending: false });

  const rows: Row[] = (leads ?? []).map((l) => ({
    id: l.id,
    business_name: l.business_name,
    contact_name: l.contact_name,
    phone: l.phone,
    service: l.service,
    route: [l.pickup_address, l.delivery_address].filter(Boolean).join(" → "),
    status: l.status,
    source: l.source,
    created_at: l.created_at,
  }));

  const statusCounts = (leads ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const newCount = statusCounts.NEW ?? 0;

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${newCount} new · ${rows.length} total quote requests.`}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No leads yet",
          description: "Quote requests from the website appear here for follow-up.",
          icon: Inbox,
        }}
      />
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? null : (
          <div className="rounded-lg border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0">
                <div className="min-w-0">
                  <p className="font-semibold">{row.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.contact_name} · {row.phone} · {row.service ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">{row.route || "—"}</p>
                </div>
                <LeadRowActions leadId={row.id} status={row.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}