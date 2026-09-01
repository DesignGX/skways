import Link from "next/link";
import { ArrowRight, Boxes, Building2, Clock, MapPin, PackageCheck, ShieldCheck, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  { icon: Clock, title: "SK Ways Express", description: "Same-day local delivery for urgent business shipments." },
  { icon: Building2, title: "SK Ways Business", description: "Recurring B2B delivery service on dependable schedules." },
  { icon: Boxes, title: "SK Ways Cargo", description: "Intercity transportation for larger consignments.", soon: true },
  { icon: Truck, title: "SK Ways Fleet", description: "A growing partner network of vehicles and drivers.", soon: true },
];

const steps = [
  { step: "01", title: "Request a delivery", description: "Tell us what you need moved — we confirm within the hour." },
  { step: "02", title: "We assign a driver", description: "Your order is matched with a vetted, nearby driver." },
  { step: "03", title: "Track in real time", description: "Follow the status timeline from pickup to delivery." },
  { step: "04", title: "Delivered & verified", description: "OTP verification and proof of delivery complete the job." },
];

const industries = [
  "Medical supplies", "Pharmacies", "Hospitals", "Diagnostic laboratories",
  "Auto spare parts", "Electrical suppliers", "Hardware suppliers",
  "E-commerce businesses", "Retail businesses", "Small manufacturers",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary to-[#0b2242] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              B2B local delivery · Bengaluru
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              The Smarter Way to Move.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              Reliable B2B pickup and delivery services for businesses that
              need their goods delivered on time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-amber-400 text-slate-950 hover:bg-amber-300">
                <Link href="/get-a-quote">
                  Get a Quote <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/track">Track Shipment</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Clock, title: "Same-day", text: "pickup and delivery window" },
              { icon: ShieldCheck, title: "Vetted drivers", text: "checked licenses & background" },
              { icon: Wallet, title: "Clear pricing", text: "no surprise billing" },
              { icon: MapPin, title: "City-wide", text: "bike to truck, one partner" },
            ].map((c) => (
              <Card key={c.title} className="border-white/10 bg-white/5 text-white backdrop-blur">
                <CardContent className="pt-6">
                  <c.icon className="h-7 w-7 text-amber-300" />
                  <p className="mt-3 text-2xl font-bold">{c.title}</p>
                  <p className="text-sm text-white/70">{c.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Services built for business</h2>
            <p className="mt-3 text-muted-foreground">One partner for the deliveries your business depends on.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <Card key={s.title} className="relative overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <s.icon className="h-8 w-8 text-primary" />
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  {s.soon ? (
                    <span className="mt-3 inline-block rounded bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                      Coming soon
                    </span>
                  ) : (
                    <Link href="/get-a-quote" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      Request service <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground">A straightforward delivery workflow designed for busy operations.</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative">
                <span className="text-4xl font-extrabold text-primary/15">{s.step}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Industries we serve</h2>
              <p className="mt-3 max-w-lg text-muted-foreground">
                From medical supplies to manufacturing — if it needs to arrive reliably, we move it.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <span key={industry} className="rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                    {industry}
                  </span>
                ))}
              </div>
            </div>
            <Card className="bg-gradient-to-br from-primary to-[#0b2242] text-white">
              <CardContent className="space-y-5 pt-6">
                <PackageCheck className="h-9 w-9 text-amber-300" />
                <blockquote className="text-lg font-medium leading-relaxed">
                  &ldquo;We moved 100% of our same-day hospital supply deliveries to SK Ways — and stopped chasing couriers.&rdquo;
                </blockquote>
                <p className="text-sm text-white/70">Operations head, diagnostic laboratory network, Bengaluru</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to move your business forward?</h2>
          <p className="max-w-xl text-white/80">Get a custom quote for your delivery volumes in under a minute.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-amber-400 text-slate-950 hover:bg-amber-300">
              <Link href="/get-a-quote">
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
