import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Activity,
  ClipboardList,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Package,
  Tag,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PortalShell, type PortalNavItem } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: "Admin portal" };

const nav: PortalNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/admin/dashboard"] },
  { href: "/admin/orders", label: "Orders & dispatch", icon: Package, match: ["/admin/orders"] },
  { href: "/admin/customers", label: "Customers", icon: Users, match: ["/admin/customers"] },
  { href: "/admin/drivers", label: "Drivers", icon: ClipboardList, match: ["/admin/drivers"] },
  { href: "/admin/vehicles", label: "Vehicles", icon: Truck, match: ["/admin/vehicles"] },
  { href: "/admin/pricing", label: "Pricing", icon: Tag, match: ["/admin/pricing"] },
  { href: "/admin/payments", label: "Payments", icon: Wallet, match: ["/admin/payments"] },
  { href: "/admin/invoices", label: "Invoices", icon: FileText, match: ["/admin/invoices"] },
  { href: "/admin/reports", label: "Reports", icon: Gauge, match: ["/admin/reports"] },
  { href: "/admin/leads", label: "Leads", icon: Inbox, match: ["/admin/leads"] },
  { href: "/admin/settings", label: "Activity log", icon: Activity, match: ["/admin/settings"] },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSessionUser();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "ADMIN") {
    redirect(session.role === "DRIVER" ? "/driver/dashboard" : "/customer/dashboard");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const name = profile?.full_name || session.user.email?.split("@")[0] || "Admin";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PortalShell
      portal="admin"
      title="Operations"
      nav={nav}
      user={{ name, email: profile?.email ?? session.user.email ?? "", initials }}
    >
      {children}
    </PortalShell>
  );
}