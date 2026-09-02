"use client";

import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { recordPayment } from "@/server/payments/actions";
import { ActionForm } from "@/components/forms/action-form";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrderOption = { id: string; label: string; customerId: string };

export function PaymentFormDialog({
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
            <Wallet className="h-4 w-4" />
            Record payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Register a payment received from a customer for an order.
          </DialogDescription>
        </DialogHeader>
        <ActionForm action={recordPayment} submitLabel="Record payment" className="space-y-3">
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
              <Label>Amount (₹)</Label>
              <Input name="amount" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <select
                name="method"
                defaultValue="UPI"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                name="status"
                defaultValue="PAID"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["PENDING", "PAID", "PARTIAL", "FAILED", "REFUNDED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Transaction reference</Label>
              <Input name="transactionReference" placeholder="UTR / Txn id" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Input name="notes" placeholder="Optional" />
            </div>
          </div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}