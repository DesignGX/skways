import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatINR, humanize } from "@/lib/utils";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { PricingFormDialog } from "@/components/admin/pricing-form-dialog";
import { PricingToggle } from "@/components/admin/pricing-toggle";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Pricing" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  vehicle_type: string;
  base_fare: number;
  per_km_rate: number;
  per_kg_rate: number;
  minimum_fare: number;
  active: boolean;
};

const columns: Column<Row>[] = [
  { key: "name", header: "Rule", cell: (r) => r.name },
  { key: "type", header: "Vehicle", cell: (r) => humanize(r.vehicle_type), hideOnMobile: true },
  { key: "base", header: "Base fare", cell: (r) => formatINR(r.base_fare) },
  { key: "km", header: "Per km", cell: (r) => formatINR(r.per_km_rate), hideOnMobile: true },
  { key: "kg", header: "Per kg", cell: (r) => formatINR(r.per_kg_rate), hideOnMobile: true },
  { key: "minimum", header: "Minimum", cell: (r) => formatINR(r.minimum_fare), hideOnMobile: true },
  {
    key: "active",
    header: "Active",
    cell: (r) =>
      r.active ? <Badge variant="success">Enabled</Badge> : <Badge variant="secondary">Disabled</Badge>,
  },
];

export default async function AdminPricingPage() {
  const admin = createAdminClient();
  const { data: rules } = await admin.from("pricing_rules").select("*").order("created_at", { ascending: true });

  const rows: Row[] = (rules ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    vehicle_type: r.vehicle_type,
    base_fare: r.base_fare,
    per_km_rate: r.per_km_rate,
    per_kg_rate: r.per_kg_rate,
    minimum_fare: r.minimum_fare,
    active: r.active,
  }));

  return (
    <>
      <PageHeader
        title="Pricing rules"
        description="Configure fares used to estimate delivery prices."
        actions={<PricingFormDialog />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No pricing rules yet",
          description: "Add pricing rules so the website and customer portals can estimate fares.",
          icon: Tag,
        }}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {rows.map((r) => (
          <PricingToggle key={r.id} ruleId={r.id} active={r.active} />
        ))}
      </div>
    </>
  );
}