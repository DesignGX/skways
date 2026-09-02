"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { updateLeadStatus, deleteLead } from "@/server/leads/actions";
import { Button } from "@/components/ui/button";
import type { LeadStatus } from "@/types/database";

const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "LOST"];

export function LeadRowActions({ leadId, status }: { leadId: string; status: LeadStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status);

  function onStatusChange() {
    startTransition(async () => {
      const result = await updateLeadStatus(leadId, value);
      if (result.ok) {
        toast.success(result.message ?? "Lead updated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not update the lead");
      }
    });
  }

  function onDelete() {
    if (!window.confirm("Delete this lead request?")) return;
    startTransition(async () => {
      const result = await deleteLead(leadId);
      if (result.ok) {
        toast.success("Lead deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Could not delete the lead");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as LeadStatus)}
        disabled={pending}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <Button type="button" size="sm" variant="outline" disabled={pending || value === status} onClick={onStatusChange}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDelete} aria-label="Delete lead">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}