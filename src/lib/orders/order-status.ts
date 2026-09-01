import type { OrderStatus, UserRole } from "@/types/database";

/**
 * Centralized order status state machine.
 * All status transitions in the application MUST go through these rules.
 * Keep this module free of framework imports so it can be unit tested.
 */

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "RETURNED",
];

/** Statuses a customer considers "active deliveries". */
export const CUSTOMER_ACTIVE_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export type OrderTransition = {
  from: OrderStatus;
  to: OrderStatus;
  actor: UserRole;
  /** Used internally to state why the transition is valid. */
  reason?: string;
};

/**
 * Allowable transitions. Admin can always apply a corrective transition
 * (with the special cases handled by `canTransitionOrderStatus`).
 */
const ALLOWED: OrderTransition[] = [
  // Admin
  { from: "REQUESTED", to: "CONFIRMED", actor: "ADMIN" },
  { from: "CONFIRMED", to: "DRIVER_ASSIGNED", actor: "ADMIN" },
  { from: "REQUESTED", to: "DRIVER_ASSIGNED", actor: "ADMIN" },
  { from: "DRIVER_ASSIGNED", to: "PICKED_UP", actor: "ADMIN", reason: "admin override" },
  { from: "PICKED_UP", to: "IN_TRANSIT", actor: "ADMIN", reason: "admin override" },
  { from: "IN_TRANSIT", to: "OUT_FOR_DELIVERY", actor: "ADMIN", reason: "admin override" },
  { from: "OUT_FOR_DELIVERY", to: "DELIVERED", actor: "ADMIN", reason: "admin override" },
  { from: "PICKED_UP", to: "FAILED", actor: "ADMIN" },
  { from: "IN_TRANSIT", to: "FAILED", actor: "ADMIN" },
  { from: "OUT_FOR_DELIVERY", to: "FAILED", actor: "ADMIN" },
  { from: "DELIVERED", to: "RETURNED", actor: "ADMIN", reason: "correction process" },
  // Driver (must be assigned to the order)
  { from: "DRIVER_ASSIGNED", to: "PICKED_UP", actor: "DRIVER", reason: "requires pickup OTP" },
  { from: "PICKED_UP", to: "IN_TRANSIT", actor: "DRIVER" },
  { from: "IN_TRANSIT", to: "OUT_FOR_DELIVERY", actor: "DRIVER" },
  { from: "OUT_FOR_DELIVERY", to: "DELIVERED", actor: "DRIVER", reason: "requires delivery OTP" },
];

const ALLOWED_MAP: Record<UserRole, Map<OrderStatus, Set<OrderStatus>>> = {
  ADMIN: new Map(),
  DRIVER: new Map(),
  CUSTOMER: new Map(),
};

for (const transition of ALLOWED) {
  if (!ALLOWED_MAP[transition.actor].has(transition.from)) {
    ALLOWED_MAP[transition.actor].set(transition.from, new Set());
  }
  ALLOWED_MAP[transition.actor].get(transition.from)!.add(transition.to);
}

/** Cancellation is a valid admin action from any non-terminal status. */
const CANCELLABLE_FROM: OrderStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
];

export type TransitionCheck = {
  allowed: boolean;
  reason: string;
};

/**
 * Check whether an actor may move an order from `from` to `to`.
 *
 * The verify caller always validates that:
 *  - Admin is actually an admin (permission layer).
 *  - Driver is assigned to the order (permission layer).
 */
export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  actorRole: UserRole
): TransitionCheck {
  if (currentStatus === nextStatus) {
    return { allowed: false, reason: "The order is already in this status." };
  }

  if (actorRole === "CUSTOMER") {
    return {
      allowed: false,
      reason: "Customers cannot change order status directly.",
    };
  }

  if (actorRole === "ADMIN" && nextStatus === "CANCELLED") {
    if (CANCELLABLE_FROM.includes(currentStatus)) {
      return { allowed: true, reason: "Admin cancelled the order." };
    }
    return {
      allowed: false,
      reason: `An order in ${currentStatus} status cannot be cancelled.`,
    };
  }

  if (
    actorRole === "ADMIN" &&
    nextStatus === "FAILED" &&
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(currentStatus)
  ) {
    return { allowed: true, reason: "Delivery failed in transit." };
  }

  if (actorRole === "ADMIN" && currentStatus === "DELIVERED" && nextStatus === "RETURNED") {
    return { allowed: true, reason: "Return created via admin correction process." };
  }

  const next = ALLOWED_MAP[actorRole].get(currentStatus);
  if (next && next.has(nextStatus)) {
    return { allowed: true, reason: "Valid transition." };
  }

  return {
    allowed: false,
    reason: `Invalid transition from ${currentStatus} to ${nextStatus} for a ${actorRole}.`,
  };
}

/** Next logical driver step for a status; used to build the driver UI. */
export function nextDriverStep(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case "DRIVER_ASSIGNED":
      return "PICKED_UP";
    case "PICKED_UP":
      return "IN_TRANSIT";
    case "IN_TRANSIT":
      return "OUT_FOR_DELIVERY";
    case "OUT_FOR_DELIVERY":
      return "DELIVERED";
    default:
      return null;
  }
}

/** True when the status is a live, working order for a driver. */
export function isDriverActionable(status: OrderStatus): boolean {
  return nextDriverStep(status) !== null;
}

/**
 * Ordered statuses used to render a tracking timeline. Positions in the
 * timeline indicate how far along the delivery is.
 */
export const TRACKING_TIMELINE: OrderStatus[] = [
  "REQUESTED",
  "CONFIRMED",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/** Progress fraction (0-1) for the tracking timeline. */
export function trackingProgress(
  status: OrderStatus,
  timeline: OrderStatus[] = TRACKING_TIMELINE
): number {
  const index = timeline.indexOf(status);
  return index === -1 ? 0 : index / (timeline.length - 1);
}