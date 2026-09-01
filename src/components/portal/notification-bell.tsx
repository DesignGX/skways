"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/server/tracking/actions";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Notification = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  link: string | null;
  created_at: string;
};

export function NotificationBell({
  className,
}: {
  portal: "customer" | "driver" | "admin";
  className?: string;
}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, read, link, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (active && data) setItems(data);
    }
    load();

    // Realtime: RLS still applies, so we only receive our own rows.
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((i) => !i.read).length;

  async function openNotification(item: Notification) {
    setOpen(false);
    if (!item.read) {
      await markNotificationRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.65rem] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-3 py-2">Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            items.map((item) => {
              const content = (
                <div className="flex w-full flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.title}</span>
                  {item.body ? <span className="text-xs text-muted-foreground">{item.body}</span> : null}
                  <span className="text-[0.7rem] text-muted-foreground">
                    {formatDate(item.created_at, true)}
                  </span>
                </div>
              );
              return (
                <button
                  key={item.id}
                  onClick={() => openNotification(item)}
                  className="flex w-full items-start gap-2 border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-accent"
                >
                  <span
                    className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-primary")}
                  />
                  {item.link ? (
                    <Link href={item.link} onClick={() => openNotification(item)} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}