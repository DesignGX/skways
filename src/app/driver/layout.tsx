import { redirect } from "next/navigation";
import { LayoutDashboard, Package, User, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PortalShell, type PortalNavItem } from "@/components/portal/portal-shell";

export const metadata = { title: "Driver portal" };

const nav: PortalNavItem[] = [
  { href: "/driver/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/driver/dashboard"] },
  { href: "/driver/orders", label: "Deliveries", icon: Package, match: ["/driver/orders"] },
  { href: "/driver/earnings", label: "Earnings", icon: Wallet, match: ["/driver/earnings"] },
  { href: "/driver/profile", label: "Profile", icon: User, match: ["/driver/profile"] },
];

export default async function DriverLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSessionUser();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "DRIVER") {
    redirect(session.role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const name = profile?.full_name || session.user.email?.split("@")[0] || "Driver";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PortalShell
      portal="driver"
      title="Driver Portal"
      nav={nav}
      user={{ name, email: profile?.email ?? session.user.email ?? "", initials }}
    >
      {children}
    </PortalShell>
  );
}