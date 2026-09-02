import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { humanize } from "@/lib/utils";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { DataList, type Column } from "@/components/shared/data-list";
import { PageHeader } from "@/components/shared/page-header";
import { VehicleFormDialog } from "@/components/admin/vehicle-form-dialog";

export const metadata: Metadata = { title: "Vehicles" };
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  make: string | null;
  model: string | null;
  capacity_kg: number | null;
  driver_name: string;
  ownership: string;
  status: string;
};

const columns: Column<Row>[] = [
  { key: "number", header: "Vehicle number", cell: (r) => r.vehicle_number },
  { key: "type", header: "Type", cell: (r) => humanize(r.vehicle_type) },
  { key: "make", header: "Make / model", cell: (r) => [r.make, r.model].filter(Boolean).join(" ") || "—", hideOnMobile: true },
  { key: "capacity", header: "Capacity", cell: (r) => (r.capacity_kg ? `${r.capacity_kg} kg` : "—"), hideOnMobile: true },
  { key: "driver", header: "Driver", cell: (r) => r.driver_name },
  { key: "ownership", header: "Ownership", cell: (r) => humanize(r.ownership), hideOnMobile: true },
  { key: "status", header: "Status", cell: (r) => <GenericStatusBadge value={r.status} /> },
];

export default async function AdminVehiclesPage() {
  const admin = createAdminClient();

  const { data: vehicles } = await admin.from("vehicles").select("*").order("created_at", { ascending: false });
  const driverIds = (vehicles ?? []).map((v) => v.driver_id).filter(Boolean) as string[];
  const { data: drivers } = driverIds.length
    ? await admin.from("drivers").select("id, profile_id").in("id", driverIds)
    : { data: [] as Array<{ id: string; profile_id: string }> };
  const profileIds = (drivers ?? []).map((d) => d.profile_id);
  const { data: profiles } = profileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] as Array<{ id: string; full_name: string }> };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const driverMap = new Map((drivers ?? []).map((d) => [d.id, profileMap.get(d.profile_id) ?? "Driver"]));

  // Options for the create/edit form.
  const { data: allDrivers } = await admin.from("drivers").select("id, profile_id");
  const allProfileIds = (allDrivers ?? []).map((d) => d.profile_id);
  const { data: allProfiles } = allProfileIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", allProfileIds)
    : { data: [] as Array<{ id: string; full_name: string }> };
  const allProfileMap = new Map((allProfiles ?? []).map((p) => [p.id, p.full_name]));
  const driverOptions = (allDrivers ?? []).map((d) => ({
    id: d.id,
    name: allProfileMap.get(d.profile_id) ?? "Driver",
  }));

  const rows: Row[] = (vehicles ?? []).map((v) => ({
    id: v.id,
    vehicle_number: v.vehicle_number,
    vehicle_type: v.vehicle_type,
    make: v.make,
    model: v.model,
    capacity_kg: v.capacity_kg,
    driver_name: v.driver_id ? driverMap.get(v.driver_id) ?? "Driver" : "Unassigned",
    ownership: v.ownership,
    status: v.status,
  }));

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Fleet vehicles and their assigned drivers."
        actions={<VehicleFormDialog driverOptions={driverOptions} />}
      />
      <DataList
        columns={columns}
        rows={rows}
        empty={{
          title: "No vehicles yet",
          description: "Add vehicles to the fleet so they can be assigned to deliveries.",
          icon: Truck,
        }}
      />
    </>
  );
}