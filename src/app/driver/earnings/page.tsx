import type { Metadata } from "next";
import { Bike } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDriver } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function DriverEarningsPage() {
  const session = await requireDriver();
  const admin = createAdminClient();

  // Earnings = completed deliveries. The MVP does not model payout rates;
  // this lists completed work that feed the settlement report.
  const { data: orders } = await admin
    .from("orders")
    .select("id, tracking_number, status, distance_km, delivered_at")
    .eq("driver_id", session.driverId)
    .eq("status", "DELIVERED")
    .order("delivered_at", { ascending: false });

  const completed = orders ?? [];
  const thisMonth = completed.filter(
    (o) => o.delivered_at && new Date(o.delivered_at).getMonth() === new Date().getMonth()
  );
  const totalDistance = completed.reduce((s, o) => s + Number(o.distance_km ?? 0), 0);

  return (
    <>
      <PageHeader title="Earnings" description="Your completed delivery record." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed deliveries</p>
            <p className="mt-1 text-2xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completed this month</p>
            <p className="mt-1 text-2xl font-bold">{thisMonth.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total distance</p>
            <p className="mt-1 text-2xl font-bold">{totalDistance.toFixed(1)} km</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed deliveries</CardTitle>
          <CardDescription>Basis for your settlement report.</CardDescription>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bike className="h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">No completed deliveries yet</p>
              <p className="text-sm text-muted-foreground">Completed work will be listed here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Delivered at</TableHead>
                    <TableHead>Distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.tracking_number}</TableCell>
                      <TableCell>{formatDate(o.delivered_at, true)}</TableCell>
                      <TableCell>{Number(o.distance_km ?? 0).toFixed(1)} km</TableCell>
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
