import type { Metadata } from "next";
import { TrackForm } from "@/components/marketing/track-form";

export const metadata: Metadata = {
  title: "Track Shipment",
  description:
    "Track your SK Ways Logistics shipment by entering your tracking number.",
};

export default function TrackPage() {
  return (
    <>
      <section className="border-b bg-muted/40 py-14">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Track your shipment</h1>
          <p className="mt-3 text-muted-foreground">
            Enter your tracking number to see the latest status and timeline.
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-6">
          <TrackForm />
        </div>
      </section>
    </>
  );
}