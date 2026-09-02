"use client";

import { togglePricingRule } from "@/server/pricing/actions";
import { ActionButton } from "@/components/forms/action-form";
import { Power } from "lucide-react";

export function PricingToggle({ ruleId, active }: { ruleId: string; active: boolean }) {
  return (
    <ActionButton
      action={() => togglePricingRule(ruleId, !active)}
      variant={active ? "outline" : "default"}
      size="sm"
      confirm={active ? "Disable this pricing rule?" : "Enable this pricing rule?"}
    >
      <Power className="h-3.5 w-3.5" />
      {active ? "Disable" : "Enable"}
    </ActionButton>
  );
}