import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PortalShell, type PortalNavItem } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: "Admin portal" };

const nav: PortalNavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard", match: ["/admin/dashboard"] },
  { href: "/admin/orders", label: "Orders & dispatch", icon: "package", match: ["/admin/orders"] },
  { href: "/admin/customers", label: "Customers", icon: "users", match: ["/admin/customers"] },
  { href: "/admin/drivers", label: "Drivers", icon: "clipboard-list", match: ["/admin/drivers"] },
  { href: "/admin/vehicles", label: "Vehicles", icon: "truck", match: ["/admin/vehicles"] },
  { href: "/admin/pricing", label: "Pricing", icon: "tag", match: ["/admin/pricing"] },
  { href: "/admin/payments", label: "Payments", icon: "wallet", match: ["/admin/payments"] },
  { href: "/admin/invoices", label: "Invoices", icon: "file-text", match: ["/admin/invoices"] },
  { href: "/admin/reports", label: "Reports", icon: "gauge", match: ["/admin/reports"] },
  { href: "/admin/leads", label: "Leads", icon: "inbox", match: ["/admin/leads"] },
  { href: "/admin/settings", label: "Activity log", icon: "activity", match: ["/admin/settings"] },
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