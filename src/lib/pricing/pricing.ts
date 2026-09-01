/**
 * Centralized pricing engine.
 *
 * Total = Base Fare + (distance × per_km_rate) + (weight × per_kg_rate)
 *       + waiting_charge + extra_stop_charge
 *
 * The result is capped at `minimum_fare` and rounded to the nearest rupee
 * (Indian pricing convention).
 */

export type PricingRuleInput = {
  base_fare: number;
  per_km_rate: number;
  per_kg_rate: number;
  waiting_charge?: number;
  extra_stop_charge?: number;
  minimum_fare?: number;
};

export type PricingBreakdown = {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  waitingCharge: number;
  extraStopCharge: number;
  subtotal: number;
  minimumFare: number;
  total: number;
  appliedMinimumFare: boolean;
};

export type QuoteInput = {
  rule: PricingRuleInput;
  distanceKm: number;
  weightKg: number;
  waitingMinutes?: number;
  extraStops?: number;
  waitingChargePerMinute?: number;
};

/**
 * Calculates a delivery price from a pricing rule.
 * Rejects invalid inputs to keep business invariants out of the UI layer.
 */
export function calculatePrice(input: QuoteInput): PricingBreakdown {
  const {
    rule,
    distanceKm,
    weightKg,
    waitingMinutes = 0,
    extraStops = 0,
    waitingChargePerMinute = 0,
  } = input;

  if (distanceKm < 0 || weightKg < 0 || waitingMinutes < 0 || extraStops < 0) {
    throw new Error("Distance, weight, waiting time and extra stops cannot be negative.");
  }

  const baseFare = round2(rule.base_fare);
  const distanceCharge = round2(distanceKm * rule.per_km_rate);
  const weightCharge = round2(weightKg * rule.per_kg_rate);
  const waitingCharge = round2(waitingMinutes * waitingChargePerMinute);
  const extraStopCharge = round2(extraStops * (rule.extra_stop_charge ?? 0));

  const subtotal = round2(baseFare + distanceCharge + weightCharge + waitingCharge + extraStopCharge);
  const minimumFare = round2(rule.minimum_fare ?? 0);

  const appliedMinimumFare = minimumFare > 0 && subtotal < minimumFare;
  const total = appliedMinimumFare ? minimumFare : subtotal;

  return {
    baseFare,
    distanceCharge,
    weightCharge,
    waitingCharge,
    extraStopCharge,
    subtotal,
    minimumFare,
    total: Math.round(total),
    appliedMinimumFare,
  };
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}