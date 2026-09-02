"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ClipboardList,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  PlusCircle,
  Tag,
  Truck,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/portal/user-menu";
import { NotificationBell } from "@/components/portal/notification-bell";

/** Serializable icon name -> Lucide component (resolved inside this client component). */
const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  "clipboard-list": ClipboardList,
  "file-text": FileText,
  gauge: Gauge,
  inbox: Inbox,
  dashboard: LayoutDashboard,
  "map-pin": MapPin,
  package: Package,
  "plus-circle": PlusCircle,
  tag: Tag,
  truck: Truck,
  user: User,
  users: Users,
  wallet: Wallet,
};

export type PortalNavItem = {
  href: string;
  label: string;
  /** Key into the ICONS map above — plain string so it can cross the RSC boundary. */
  icon: keyof typeof ICONS | string;
  /** Path prefixes (e.g. ["/admin/orders"] matches /admin/orders/[id]). */
  match: string[];
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

export function PortalShell({
  portal,
  title,
  nav,
  user,
  children,
}: {
  portal: "customer" | "driver" | "admin";
  title: string;
  nav: PortalNavItem[];
  user: { name: string; email: string; initials: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (item: PortalNavItem) =>
    item.match.some((m) => pathname.startsWith(m) || item.href === pathname);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-4">
        <Link href={`/${portal}/dashboard`} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">SK Ways</p>
            <p className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">{title}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Portal navigation">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive(item)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <NavIcon name={item.icon} className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <UserMenu user={user} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-background lg:block">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>
        <p className="font-semibold">{title}</p>
        <div className="ml-auto flex items-center gap-1">
          <NotificationBell portal={portal} />
        </div>
      </header>

      {/* Main */}
      <div className="lg:pl-64">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}