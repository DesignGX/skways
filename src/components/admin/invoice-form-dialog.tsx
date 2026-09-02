"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { createInvoice } from "@/server/invoices/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderOption = { id: string; label: string; customerId: string; price: number | null };

export function InvoiceFormDialog({
  orders,
  trigger,
}: {
  orders: OrderOption[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const selected = useMemo(
    () => orders.find((o) => o.id === orderId) ?? null,
    [orders, orderId]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <FileText className="h-4 w-4" />
            Generate invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>
            Create a customer invoice for a delivered order.
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={createInvoice} submitLabel="Generate invoice" className="space-y-3">
          <input type="hidden" name="customerId" value={selected?.customerId ?? ""} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Order</Label>
              <select
                name="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                required
              >
                <option value="">Select an order…</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Subtotal (₹)</Label>
              <Input name="subtotal" type="number" step="0.01" min="0" defaultValue={selected?.price ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label>GST (₹)</Label>
              <Input name="tax" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount (₹)</Label>
              <Input name="discount" type="number" step="0.01" min="0" defaultValue="0" />
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}