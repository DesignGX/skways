import Link from "next/link";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Truck className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold leading-tight tracking-tight">
        SK Ways
        <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Logistics
        </span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const nav = [
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/track", label: "Track" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/get-a-quote">Get a Quote</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}