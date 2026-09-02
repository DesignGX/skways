"use client";

import { useState } from "react";
import { submitContactForm } from "@/server/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await submitContactForm(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Thanks for reaching out. We will get back to you within one business day.");
      form.reset();
    } catch (err) {
      console.error("[ContactForm] submit failed:", err);
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Your name *</label>
          <Input id="name" name="name" required placeholder="Full name" />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium">Phone</label>
          <Input id="phone" name="phone" type="tel" placeholder="+91 98xxxxxxxx" />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email *</label>
        <Input id="email" name="email" type="email" required placeholder="you@company.com" />
      </div>
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">Message *</label>
        <Textarea id="message" name="message" required rows={4} placeholder="How can we help?" />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}