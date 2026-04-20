"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Bell } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDate } from "@/lib/utils";
import { getMyNotifications, type NotificationItemDto } from "@/services/DACN/notifications";
export default function DashboardHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);

  const hasUnread = useMemo(
    () => notifications.some((n) => n.status === "UNREAD"),
    [notifications],
  );

  useEffect(() => {
    if (!notificationsOpen) return;

    let cancelled = false;

    async function load() {
      setLoadingNotifications(true);
      setNotificationsError(null);
      try {
        const res = await getMyNotifications({ page: 1, pageSize: 20 });
        if (cancelled) return;
        const items = res?.data?.items ?? [];
        setNotifications(items);
      } catch (err) {
        if (!cancelled) {
          const message =
            (err as any)?.response?.data?.message ||
            (err as any)?.message ||
            "Failed to load notifications.";
          setNotificationsError(Array.isArray(message) ? message.join(", ") : String(message));
        }
      } finally {
        if (!cancelled) setLoadingNotifications(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [notificationsOpen]);

  return (
    <header className="h-12 bg-white border-b border-grey-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        {/* <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-full h-9 pl-10 pr-4 bg-neutral-background border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div> */}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-neutral-background rounded-lg transition-colors">
          <Mail className="w-5 h-5 text-grey-900" />
        </button>
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative p-2 hover:bg-neutral-background rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-grey-900" />
              {hasUnread ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-foreground">Notifications</div>
            </div>

            <ScrollArea className="max-h-96">
              <div className="py-1">
                {loadingNotifications ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Loading...</div>
                ) : notificationsError ? (
                  <div className="px-4 py-3 text-sm text-destructive">{notificationsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    No notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                    >
                      <div
                        className={cn(
                          "text-sm text-foreground",
                          n.status === "UNREAD" ? "font-semibold" : "font-normal",
                        )}
                      >
                        {n.message}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDate(n.created_at, "YYYY-MM-DD HH:mm")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <ProfileDropdown />
      </div>
    </header>
  );
}
