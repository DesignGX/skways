"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { quoteFormSchema } from "@/lib/validations";
import { submitQuoteRequest } from "@/server/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/shared/select-field";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

type Values = z.infer<typeof quoteFormSchema>;

const vehicleOptions = ["Bike", "Auto", "Mini Truck", "LCV", "Truck", "Not sure yet"];
const serviceOptions = ["SK Ways Express", "SK Ways Business", "Other"];

export function QuoteForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      phone: "",
      email: "",
      pickupAddress: "",
      deliveryAddress: "",
      pickupDate: "",
    },
  });

  async function onSubmit(values: Values) {
    setBusy(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.set(key, String(value));
    });

    const result = await submitQuoteRequest(formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(
      result.data
        ? `Request ${result.data.quoteRequestNumber} received. Our team will contact you with a quote.`
        : "Request received. Our team will contact you."
    );
    form.reset();
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>{success}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Form {...form}>
            <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business name *</FormLabel>
                  <FormControl><Input placeholder="Acme Industries" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact person *</FormLabel>
                  <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone *</FormLabel>
                  <FormControl><Input type="tel" placeholder="+91 98xxxxxxxx" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@company.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="pickupAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pickup address *</FormLabel>
                <FormControl><Input placeholder="Full address with pincode" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
<div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pickupDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <SelectField value={field.value ?? ""} onChange={field.onChange} options={serviceOptions} placeholder="Select a service" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="packageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package type</FormLabel>
                  <FormControl><Input placeholder="Boxes, documents, medicines…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (approx, kg)</FormLabel>
                  <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number_of_packages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of packages</FormLabel>
                  <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredVehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred vehicle</FormLabel>
                  <SelectField value={field.value ?? ""} onChange={field.onChange} options={vehicleOptions} placeholder="Select a vehicle" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="urgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Urgency</FormLabel>
                  <FormControl><Input placeholder="Same day / by 6 PM / flexible" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="specialInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special instructions</FormLabel>
                <FormControl>
                  <Textarea placeholder="Handling notes, receiver details, gate access…" {...field} />
                </FormControl>
                <FormDescription>
                  We never share this information beyond the people handling your delivery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Submitting…" : "Request a Quote"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
