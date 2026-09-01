import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function DriverProfilePage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: driver }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone").eq("user_id", session?.user.id ?? "").maybeSingle(),
    supabase.from("drivers").select("*").eq("profile_id", session?.profileId ?? "").maybeSingle(),
  ]);

  return (
    <>
      <PageHeader title="Profile" description="Your driver details on file." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {profile?.email ?? session?.user.email}</p>
            <p><span className="text-muted-foreground">Name:</span> {profile?.full_name ?? "—"}</p>
            <p><span className="text-muted-foreground">Phone:</span> {profile?.phone ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver record</CardTitle>
            <CardDescription>Contact admin to correct any details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">License number:</span> {driver?.license_number ?? "—"}</p>
            <p><span className="text-muted-foreground">License expiry:</span> {formatDate(driver?.license_expiry)}</p>
            {driver?.address ? <p><span className="text-muted-foreground">Address:</span> {driver.address}</p> : null}
            {driver?.emergency_contact ? (
              <>
                <Separator />
                <p><span className="text-muted-foreground">Emergency contact:</span> {driver.emergency_contact}</p>
                <p><span className="text-muted-foreground">Emergency phone:</span> {driver.emergency_contact_phone ?? "—"}</p>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
