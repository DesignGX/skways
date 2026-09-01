"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { trackShipment } from "@/server/tracking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types/database";
import { TRACKING_TIMELINE } from "@/lib/orders/order-status";

type UnwrapAction<T> = T extends { ok: true; data: infer D } ? D : never;

type TrackResult = NonNullable<UnwrapAction<Awaited<ReturnType<typeof trackShipment>>>>;

export function TrackForm() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await trackShipment(value);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  const currentIndex = result ? TRACKING_TIMELINE.indexOf(result.status as OrderStatus) : -1;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter tracking number, e.g. SKW-2026-000001"
              className="sm:flex-1"
              aria-label="Tracking number"
            />
            <Button type="submit" disabled={busy || !value.trim()}>
              {busy ? "Searching…" : "Track shipment"}
            </Button>
          </form>
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Shipment</p>
                <p className="text-lg font-semibold">{result.trackingNumber}</p>
              </div>
              <OrderStatusBadge status={result.status as OrderStatus} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold">Pickup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.pickup ? `${result.pickup.address1}, ${result.pickup.city}, ${result.pickup.state}` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold">Destination</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.delivery ? `${result.delivery.address1}, ${result.delivery.city}, ${result.delivery.state}` : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold">Driver assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.driverName ?? "Not assigned yet"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <h3 className="text-sm font-semibold">Est. delivery</h3>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(result.estimatedDelivery, true)}</p>
              </div>
            </div>

            <Timeline currentIndex={currentIndex} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Timeline({ currentIndex }: { currentIndex: number }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">Timeline</h3>
      <ol>
        {TRACKING_TIMELINE.map((status, i) => {
          const reached = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <li key={status} className="relative flex gap-3 pb-5 last:pb-0">
              {i < TRACKING_TIMELINE.length - 1 ? (
                <span
                  className={`absolute left-[11px] top-6 h-full w-0.5 ${reached && !isCurrent ? "bg-success" : "bg-border"}`}
                />
              ) : null}
              <span
                className={`relative z-10 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${
                  reached ? "border-success bg-success text-white" : "border-border bg-background text-muted-foreground"
                }`}
              >
                {reached ? <CheckCircle2 className="h-4 w-4" /> : null}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isCurrent ? "text-foreground" : reached ? "text-foreground" : "text-muted-foreground"}`}>
                  {status.replaceAll("_", " ")}
                </p>
                {isCurrent ? <p className="mt-0.5 text-xs text-muted-foreground">Current status</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}