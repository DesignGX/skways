"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitQuoteRequestForm, type QuoteFormState } from "@/server/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const initialState: QuoteFormState = { ok: false, error: null, quoteNumber: null };

const vehicleOptions = ["Bike", "Auto", "Mini Truck", "LCV", "Truck", "Not sure yet"];
const serviceOptions = ["SK Ways Express", "SK Ways Business", "Other"];

/** Submit button that shows a pending state via useFormStatus. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Submitting..." : "Request a Quote"}
    </Button>
  );
}

export function QuoteForm() {
  const [state, formAction] = useActionState(submitQuoteRequestForm, initialState);

  if (state.ok && state.quoteNumber !== null) {
    return (
      <Alert>
        <AlertDescription>
          Request {state.quoteNumber ? state.quoteNumber : "received"}. Our team will contact
          you with a quote.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="q-business" className="text-sm font-medium">Business name *</label>
              <Input id="q-business" name="businessName" placeholder="Acme Industries"
                required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-contact" className="text-sm font-medium">Contact person *</label>
              <Input id="q-contact" name="contactName" placeholder="Full name"
                required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-phone" className="text-sm font-medium">Phone *</label>
              <Input id="q-phone" name="phone" type="tel" placeholder="+91 98765 43210"
                required pattern="[0-9+\-\s()]{7,15}" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-email" className="text-sm font-medium">Email</label>
              <Input id="q-email" name="email" type="email" placeholder="you@company.com" />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="q-service" className="text-sm font-medium">Service</label>
              <select id="q-service" name="service" defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select a service</option>
                {serviceOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-date" className="text-sm font-medium">Preferred pickup date</label>
              <Input id="q-date" name="pickupDate" type="date" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="q-pickup" className="text-sm font-medium">Pickup address *</label>
              <Input id="q-pickup" name="pickupAddress" placeholder="Full pickup address"
                required minLength={5} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="q-delivery" className="text-sm font-medium">Delivery address *</label>
              <Input id="q-delivery" name="deliveryAddress" placeholder="Full delivery address"
                required minLength={5} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-package" className="text-sm font-medium">Package type</label>
              <Input id="q-package" name="packageType" placeholder="Boxes, documents, medicines" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-weight" className="text-sm font-medium">Weight (approx, kg)</label>
              <Input id="q-weight" name="weight" type="number" min="0" step="0.1" placeholder="10" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-count" className="text-sm font-medium">Number of packages</label>
              <Input id="q-count" name="number_of_packages" type="number" min="1" placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="q-vehicle" className="text-sm font-medium">Preferred vehicle</label>
              <select id="q-vehicle" name="preferredVehicle" defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="">Select a vehicle</option>
                {vehicleOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="q-urgency" className="text-sm font-medium">Urgency</label>
              <Input id="q-urgency" name="urgency" placeholder="Same day / by 6 PM / flexible" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="q-notes" className="text-sm font-medium">Special instructions</label>
            <Textarea id="q-notes" name="specialInstructions"
              placeholder="Handling notes, receiver details, gate access" />
            <p className="text-sm text-muted-foreground">
              We never share this information beyond the people handling your delivery.
            </p>
          </div>

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
