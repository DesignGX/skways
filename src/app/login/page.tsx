import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/roles";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/marketing/site-header";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getCurrentSessionUser();
  if (session) redirect(homePathForRole(session.role));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-6">
        <Logo />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your customer, driver or admin portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">← Back to website</Link>
      </p>
    </div>
  );
}