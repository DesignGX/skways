import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  PlusCircle,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { PortalShell, type PortalNavItem } from "@/components/portal/portal-shell";

export const metadata: Metadata = { title: "Customer portal" };

const nav: PortalNavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard, match: ["/customer/dashboard"] },
  { href: "/customer/orders", label: "My orders", icon: Package, match: ["/customer/orders"] },
  { href: "/customer/create-order", label: "Create order", icon: PlusCircle, match: ["/customer/create-order"] },
  { href: "/customer/addresses", label: "Addresses", icon: MapPin, match: ["/customer/addresses"] },
  { href: "/customer/invoices", label: "Invoices", icon: FileText, match: ["/customer/invoices"] },
  { href: "/customer/profile", label: "Profile", icon: User, match: ["/customer/profile"] },
];

export default async function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSessionUser();

  if (!session) {
    redirect("/login");
  }
  if (session.role !== "CUSTOMER") {
    redirect(session.role === "ADMIN" ? "/admin/dashboard" : "/driver/dashboard");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const name = profile?.full_name || session.user.email?.split("@")[0] || "Customer";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <PortalShell
      portal="customer"
      title="Customer Portal"
      nav={nav}
      user={{ name, email: profile?.email ?? session.user.email ?? "", initials }}
    >
      {children}
    </PortalShell>
  );
}