import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, Building2, Clock, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description:
    "SK Ways Express same-day delivery, SK Ways Business recurring B2B delivery, plus cargo and fleet services coming soon.",
};

const services = [
  {
    icon: Clock,
    title: "SK Ways Express",
    tagline: "Same-day local delivery",
    description:
      "Door-to-door pickup and delivery within the same day for time-sensitive business shipments — from documents and spare parts to medical samples and retail stock.",
    features: ["Same-day pickup window", "Live status timeline", "OTP-verified handover"],
    available: true,
  },
  {
    icon: Building2,
    title: "SK Ways Business",
    tagline: "Recurring B2B delivery services",
    description:
      "Regular, scheduled deliveries for businesses that move goods daily — pharmacies, labs, suppliers, retailers and small manufacturers.",
    features: ["Dedicated schedule", "Priority dispatch", "Consolidated monthly invoicing"],
    available: true,
  },
  {
    icon: Boxes,
    title: "SK Ways Cargo",
    tagline: "Intercity transportation",
    description:
      "Full-load and part-load intercity transportation with transit tracking. Our team is building a partner network to make this reliable, not rushed.",
    features: ["Intercity routes", "Fleet partner network"],
    available: false,
  },
  {
    icon: Truck,
    title: "SK Ways Fleet",
    tagline: "Partner vehicle and driver network",
    description:
      "Vetted partner drivers and vehicles for flexible, on-demand capacity. We are onboarding partners city by city.",
    features: ["Vetted drivers", "Bike to truck"],
    available: false,
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="border-b bg-muted/40 py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Our services</h1>
          <p className="mt-3 text-muted-foreground">
            Built for businesses that depend on reliable, on-time local delivery.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2">
          {services.map((s) => (
            <Card key={s.title} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="flex items-center justify-between">
                  <s.icon className="h-9 w-9 text-primary" />
                  {!s.available ? (
                    <span className="rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                      Coming soon
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
                <p className="text-sm font-medium text-primary">{s.tagline}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{s.description}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                {s.available ? (
                  <Button asChild className="mt-6">
                    <Link href="/get-a-quote">Request this service</Link>
                  </Button>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Joining soon — <Link href="/get-a-quote" className="text-primary hover:underline">tell us what you need</Link>.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}