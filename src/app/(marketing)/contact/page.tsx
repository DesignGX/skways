import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/marketing/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact SK Ways Logistics — sales, support and partnership enquiries. We respond within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b bg-muted/40 py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
          <p className="mt-3 text-muted-foreground">
            Sales, support or partnerships — we respond within one business day.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="pt-6">
              <ContactForm />
            </CardContent>
          </Card>
          <div className="space-y-4 lg:col-span-2">
            {[
              { icon: MapPin, title: "Head office", lines: ["Peenya Industrial Area", "Bengaluru, Karnataka 560058"] },
              { icon: Phone, title: "Phone", lines: ["+91 98450 00000", "Mon–Sat, 8:00–20:00 IST"] },
              { icon: Mail, title: "Email", lines: ["hello@skways.in", "support@skways.in"] },
            ].map((c) => (
              <Card key={c.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <c.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h2 className="font-semibold">{c.title}</h2>
                    {c.lines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}