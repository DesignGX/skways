import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, humanize } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { DriverFormDialog } from "@/components/admin/driver-form-dialog";

export const metadata: Metadata = { title: "Drivers" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  license: string | null;
  vehicle: string;
  orders: number;
  status: string;
};

const columns: Column<Row>[] = [
  { key: "name", header: "Driver", cell: (r) => r.name },
  { key: "phone", header: "Phone", cell: (r) => r.phone ?? "—", hideOnMobile: true },
  { key: "license", header: "License", cell: (r) => r.license ?? "—", hideOnMobile: true },
  { key: "vehicle", header: "Vehicle", cell: (r) => r.vehicle || "—" },
  { key: "orders", header: "Orders", cell: (r) => String(r.orders), hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.status} /> },
];

export default async function AdminDriversPage() {
  const admin = createAdminClient();

  const { data: drivers } = await admin.from("drivers").select("*").order("created_at", { ascending: false });
  const profileIds = (drivers ?? []).map((d) => d.profile_id);
  const { data: profiles } = profileIds.length
    ? await admin.from("profiles").select("id, full_name, phone").in("id", profileIds)
    : { data: [] as Array<{ id: string; full_name: string; phone: string | null }> };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const driverIds = (drivers ?? []).map((d) => d.id);
  const { data: vehicles } = driverIds.length
    ? await admin.from("vehicles").select("id, vehicle_number, vehicle_type, driver_id").in("driver_id", driverIds)
    : { data: [] as Array<{ id: string; vehicle_number: string; vehicle_type: string; driver_id: string | null }> };
  const vehicleMap = new Map((vehicles ?? []).map((v) => [v.driver_id, `${v.vehicle_number} (${humanize(v.vehicle_type)})`]));

  const { data: orders } = await admin.from("orders").select("driver_id");
  const orderCounts = new Map<string, number>();
  for (const o of orders ?? []) {
    if (o.driver_id) orderCounts.set(o.driver_id, (orderCounts.get(o.driver_id) ?? 0) + 1);
  }

  const rows: Row[] = (drivers ?? []).map((d) => {
    const profile = profileMap.get(d.profile_id);
    return {
      id: d.id,
      name: profile?.full_name ?? "Driver",
      phone: profile?.phone ?? null,
      license: d.license_number,
      vehicle: vehicleMap.get(d.id) ?? "",
      orders: orderCounts.get(d.id) ?? 0,
      status: d.status,
    };
  });

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Driver accounts, licenses and assigned vehicles."
        actions={<DriverFormDialog />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No drivers yet",
          description: "Add drivers so dispatchers can assign deliveries.",
          icon: ClipboardList,
        }}
      />
      <p className="mt-2 text-sm text-muted-foreground">{rows.length} drivers · {formatDate(new Date().toISOString())}</p>
    </>
  );
}