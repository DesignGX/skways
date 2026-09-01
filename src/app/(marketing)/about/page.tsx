import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Handshake, MapPin, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About us",
  description:
    "SK Ways Logistics is a Bengaluru-based B2B local delivery company built on the principle that business deliveries should be simple, reliable and transparent.",
};

const values = [
  {
    icon: Target,
    title: "On time, every time",
    text: "We run a small, focused operation so we can hold ourselves to a higher standard than the big anonymous couriers.",
  },
  {
    icon: Handshake,
    title: "Partners, not gig workers",
    text: "Our drivers are vetted partners with proper documentation — paid fairly, equipped properly, treated well.",
  },
  {
    icon: CheckCircle2,
    title: "Radical transparency",
    text: "Live status, clear pricing and proof of delivery on every single shipment.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="border-b bg-muted/40 py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built to move business goods — simply.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            SK Ways Logistics started with a simple observation: Bengaluru
            businesses spend too much time worrying about delivery. We set out
            to build a local delivery partner that runs like a business —
            not like a marketplace.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title}>
                <CardContent className="pt-6">
                  <v.icon className="h-8 w-8 text-primary" />
                  <h2 className="mt-4 font-semibold">{v.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Our story</h2>
              <p className="mt-4 text-muted-foreground">
                SK Ways began as an asset-light B2B local delivery service in
                Bengaluru&rsquo;s industrial belt — moving medicines, spare
                parts, hardware and e-commerce orders between businesses.
              </p>
              <p className="mt-3 text-muted-foreground">
                Today we operate a transparent delivery platform with vetted
                partner drivers, a growing vehicle fleet and a simple promise:
                you always know where your shipment is and who is moving it.
              </p>
              <p className="mt-3 text-muted-foreground">
                As our network grows, we will expand into intercity cargo,
                warehousing and full 3PL services — one reliable mile at a time.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/get-a-quote">Get a Quote</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border bg-primary p-8 text-white">
              <MapPin className="h-9 w-9 text-amber-300" />
              <h3 className="mt-4 text-lg font-semibold">Based in Bengaluru</h3>
              <p className="mt-2 text-sm text-white/80">
                Serving the city&rsquo;s businesses with same-day local
                delivery and scheduled B2B runs.
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/70">Founded</dt>
                  <dd className="font-medium">2026</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                  <dt className="text-white/70">Focus</dt>
                  <dd className="font-medium">B2B local delivery</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-white/70">Service area</dt>
                  <dd className="font-medium">Bengaluru metropolitan</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}