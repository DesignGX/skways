import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType = "ORDER" | "PAYMENT" | "SYSTEM";

type NotifyOptions = {
  type?: NotificationType;
  link?: string;
};

/**
 * Notification abstraction. Currently delivers in-app notifications only.
 *
 * Future providers (email, WhatsApp, SMS, push) plug in here without
 * changing call sites.
 */
export async function notifyUser(
  userId: string,
  title: string,
  body?: string,
  options: NotifyOptions = {}
): Promise<void> {
  const admin = createAdminClient();

  let type = options.type ?? "SYSTEM";
  if (!["ORDER", "PAYMENT", "SYSTEM"].includes(type)) type = "SYSTEM";

  await admin.from("notifications").insert({
    user_id: userId,
    title,
    body: body ?? null,
    type,
    link: options.link ?? null,
  });
}

/**
 * Async notification delivery queue — kept here so an outbox/email worker
 * can be added later without changing application code.
 */
export async function enqueueNotification(
  userId: string,
  title: string,
  body?: string,
  options: NotifyOptions = {}
): Promise<void> {
  await notifyUser(userId, title, body, options);
}