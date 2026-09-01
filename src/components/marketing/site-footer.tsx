import Link from "next/link";
import { Logo } from "@/components/marketing/site-header";

const services = [
  { name: "SK Ways Express", href: "/services" },
  { name: "SK Ways Business", href: "/services" },
  { name: "SK Ways Cargo", href: "/services", soon: true },
  { name: "SK Ways Fleet", href: "/services", soon: true },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            The Smarter Way to Move. Reliable local business deliveries,
            managed simply.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Services</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {services.map((s) => (
              <li key={s.name}>
                <Link href={s.href} className="hover:text-foreground">
                  {s.name}
                  {s.soon ? (
                    <span className="ml-2 rounded bg-warning/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-warning">
                      Coming soon
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-foreground">About us</Link></li>
            <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link href="/get-a-quote" className="hover:text-foreground">Get a quote</Link></li>
            <li><Link href="/track" className="hover:text-foreground">Track shipment</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Contact</h3>
          <address className="space-y-2 text-sm not-italic text-muted-foreground">
            <p>Peenya Industrial Area, Bengaluru, Karnataka 560058</p>
            <p>
              <a href="tel:+919845000000" className="hover:text-foreground">+91 98450 00000</a>
            </p>
            <p>
              <a href="mailto:hello@skways.in" className="hover:text-foreground">hello@skways.in</a>
            </p>
          </address>
        </div>
      </div>
      <div className="border-t py-5">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} SK Ways Logistics. All rights reserved.</p>
          <p>Bengaluru · Mysuru · Tumakuru</p>
        </div>
      </div>
    </footer>
  );
}