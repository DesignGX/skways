"use client";

import { useRef, useState } from "react";
import { driverAddProof } from "@/server/orders/driver-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Photo + notes proof of delivery upload for the assigned driver. */
export function ProofUploadForm({ orderId }: { orderId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    const result = await driverAddProof(orderId, fd);
    setPending(false);
    if (result.ok) {
      toast.success(result.message ?? "Proof saved");
      formRef.current?.reset();
    } else {
      toast.error(result.error ?? "Could not save proof");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="photo">Photo (JPG, PNG or WEBP · max 5 MB)</Label>
        <Input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proof-notes">Notes</Label>
        <Textarea id="proof-notes" name="notes" rows={2} placeholder="Left with reception, signature captured…" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Uploading…" : "Save proof"}
      </Button>
    </form>
  );
}
