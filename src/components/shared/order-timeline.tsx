import { CheckCircle2, Circle } from "lucide-react";
import { TRACKING_TIMELINE, trackingProgress } from "@/lib/orders/order-status";
import type { OrderStatus } from "@/types/database";
import { humanize, formatDate } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Vertical status timeline for an order. Shows all standard tracking stages
 * and highlights completed ones.
 */
export function OrderTimeline({
  status,
  history,
  className,
}: {
  status: OrderStatus;
  history?: Array<{ status: string; notes: string | null; created_at: string | null }>;
  className?: string;
}) {
  const currentIndex = TRACKING_TIMELINE.indexOf(status);
  const isTerminalBad = status === "CANCELLED" || status === "FAILED";
  const progress = isTerminalBad ? 0 : trackingProgress(status);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <Progress value={progress * 100} className="h-2" />
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {isTerminalBad ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          This delivery was {humanize(status).toLowerCase()}.
        </p>
      ) : null}

      <ol className="space-y-3">
        {TRACKING_TIMELINE.map((step, index) => {
          const done = currentIndex >= index && !isTerminalBad;
          const entry = history?.find((h) => h.status === step);
          return (
            <li key={step} className="flex items-start gap-3">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", !done && "text-muted-foreground")}>
                  {humanize(step)}
                </p>
                {entry ? (
                  <p className="text-xs text-muted-foreground">
                    {formatDate(entry.created_at, true)}
                    {entry.notes ? ` — ${entry.notes}` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
