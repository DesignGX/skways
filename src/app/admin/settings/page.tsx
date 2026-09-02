import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, humanize } from "@/lib/utils";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Activity log" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  action: string;
  entity_type: string | null;
  actor: string;
  created_at: string;
};

const columns: Column<Row>[] = [
  { key: "action", header: "Action", cell: (r) => humanize(r.action) },
  { key: "entity", header: "Entity", cell: (r) => r.entity_type ?? "—", hideOnMobile: true },
  { key: "actor", header: "Actor", cell: (r) => r.actor },
  { key: "date", header: "When", cell: (r) => formatDate(r.created_at, true) },
];

export default async function AdminSettingsPage() {
  const admin = createAdminClient();

  const { data: logs } = await admin
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const userIds = (logs ?? []).map((l) => l.user_id).filter(Boolean) as string[];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("user_id, full_name, role").in("user_id", userIds)
    : { data: [] as Array<{ user_id: string; full_name: string; role: string }> };
  const actorMap = new Map((profiles ?? []).map((p) => [p.user_id, `${p.full_name} (${humanize(p.role)})`]));

  const rows: Row[] = (logs ?? []).map((l) => ({
    id: l.id,
    action: l.action,
    entity_type: l.entity_type,
    actor: l.user_id ? actorMap.get(l.user_id) ?? "—" : "System",
    created_at: l.created_at,
  }));

  return (
    <>
      <PageHeader
        title="Activity log"
        description={`Last ${rows.length} system actions recorded.`}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No activity yet",
          description: "Audited actions such as status changes and dispatches appear here.",
          icon: Activity,
        }}
      />
    </>
  );
}