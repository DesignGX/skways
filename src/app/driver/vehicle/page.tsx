import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDriver } from "@/lib/auth/session";
import { formatDate, humanize } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { GenericStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "My vehicle" };
export const dynamic = "force-dynamic";

export default async function DriverVehiclePage() {
  const session = await requireDriver();
  const admin = createAdminClient();

  const { data: vehicles } = await admin
    .from("vehicles")
    .select("*")
    .eq("driver_id", session.driverId)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="My vehicle" description="Vehicles assigned to you by the operations team." />

      {(vehicles ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Truck className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">No vehicle assigned</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When the operations team assigns a vehicle to you it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(vehicles ?? []).map((v) => (
            <Card key={v.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{v.vehicle_number}</span>
                  <GenericStatusBadge value={v.status} />
                </CardTitle>
                <CardDescription>
                  {humanize(v.vehicle_type)} · {humanize(v.ownership)}
                  {v.make || v.model ? ` · ${[v.make, v.model].filter(Boolean).join(" ")}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {v.capacity_kg ? <p><span className="text-muted-foreground">Capacity:</span> {v.capacity_kg} kg</p> : null}
                <p><span className="text-muted-foreground">Insurance expiry:</span> {formatDate(v.insurance_expiry)}</p>
                <p><span className="text-muted-foreground">Permit expiry:</span> {formatDate(v.permit_expiry)}</p>
                <p><span className="text-muted-foreground">Fitness expiry:</span> {formatDate(v.fitness_expiry)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
