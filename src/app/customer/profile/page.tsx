import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm, type ProfileValues } from "@/components/customer/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function CustomerProfilePage() {
  const session = await getCurrentSessionUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: customer }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, phone").eq("user_id", session?.user.id ?? "").maybeSingle(),
    supabase.from("customers").select("*").eq("profile_id", session?.profileId ?? "").maybeSingle(),
  ]);

  const values: ProfileValues = {
    company_name: customer?.company_name ?? "",
    contact_person: customer?.contact_person ?? profile?.full_name ?? "",
    phone: customer?.phone ?? profile?.phone ?? null,
    gst_number: customer?.gst_number ?? null,
    billing_address: customer?.billing_address ?? null,
  };

  return (
    <>
      <PageHeader title="Profile" description="Your account and company details." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Company details</CardTitle>
            <CardDescription>Used on invoices and delivery documents.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm values={values} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Email:</span> {profile?.email ?? session?.user.email}</p>
            <p><span className="text-muted-foreground">Name:</span> {profile?.full_name ?? "—"}</p>
            <p className="pt-2 text-xs text-muted-foreground">
              To change your password, sign out and use “Forgot password” on the login page.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
