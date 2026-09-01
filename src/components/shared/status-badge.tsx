import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/database";
import { humanize } from "@/lib/utils";

const STATUS_VARIANT: Record<OrderStatus, BadgeProps["variant"]> = {
  REQUESTED: "secondary",
  CONFIRMED: "secondary",
  DRIVER_ASSIGNED: "warning",
  PICKED_UP: "warning",
  IN_TRANSIT: "warning",
  OUT_FOR_DELIVERY: "warning",
  DELIVERED: "success",
  CANCELLED: "destructive",
  FAILED: "destructive",
  RETURNED: "secondary",
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={className}>
      {humanize(status)}
    </Badge>
  );
}

type GenericBadgeProps = {
  value: string;
  className?: string;
};

/**
 * Maps generic ACTIVE/INACTIVE/SUSPENDED and payment/invoice/lead statuses
 * to semantically correct badge variants.
 */
export function GenericStatusBadge({ value, className }: GenericBadgeProps) {
  let variant: BadgeProps["variant"] = "secondary";
  const upper = value.toUpperCase();

  if (["ACTIVE", "PAID", "ISSUED", "CONVERTED", "DELIVERED"].includes(upper)) {
    variant = "success";
  } else if (["INACTIVE", "SUSPENDED", "FAILED", "CANCELLED", "OVERDUE", "REFUNDED", "LOST"].includes(upper)) {
    variant = "destructive";
  } else if (["PENDING", "PARTIAL", "DRAFT", "NEW", "CONTACTED", "QUOTED"].includes(upper)) {
    variant = "warning";
  }

  return (
    <Badge variant={variant} className={className}>
      {humanize(value)}
    </Badge>
  );
}