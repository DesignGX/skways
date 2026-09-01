"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export type ActionInput = {
  ok: boolean;
  error?: string;
  message?: string;
};

type ActionFormProps = {
  action: (formData: FormData) => Promise<ActionInput>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  refreshOnSuccess?: boolean;
};

/**
 * Wraps a `FormData` server action with pending state, toast feedback and
 * optional reset/refresh. Keeps portal forms consistent.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className,
  resetOnSuccess = false,
  refreshOnSuccess = true,
}: ActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await action(fd);
          if (result.ok) {
            toast.success(result.message ?? "Saved");
            if (resetOnSuccess) form.reset();
            if (refreshOnSuccess) router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    >
      {children}
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

type ActionButtonProps = {
  action: () => Promise<ActionInput>;
  children: ReactNode;
  confirm?: string;
  refreshOnSuccess?: boolean;
} & Omit<ButtonProps, "onClick">;

/** Runs a no-argument server action with confirm + toast feedback. */
export function ActionButton({
  action,
  children,
  confirm,
  refreshOnSuccess = true,
  ...buttonProps
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      {...buttonProps}
      disabled={pending || buttonProps.disabled}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(result.message ?? "Done");
            if (refreshOnSuccess) router.refresh();
          } else {
            toast.error(result.error ?? "Something went wrong");
          }
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
