import type { Metadata } from "next";
import { QuoteForm } from "@/components/marketing/quote-form";

export const metadata: Metadata = {
  title: "Get a Quote",
  description:
    "Request a delivery quote from SK Ways Logistics. Same-day local delivery for businesses in Bengaluru.",
};

export default function GetAQuotePage() {
  return (
    <>
      <section className="border-b bg-muted/40 py-14">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get a Quote</h1>
          <p className="mt-3 text-muted-foreground">
            Tell us about your delivery and we will come back with a clear,
            no-surprises quote — usually within an hour.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <QuoteForm />
        </div>
      </section>
    </>
  );
}