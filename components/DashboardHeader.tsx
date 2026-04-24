"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, CalendarDays, Ticket as TicketIcon, Palmtree, Info } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDate } from "@/lib/utils";
import {
  getMyNotifications,
  markAllMyNotificationsRead,
  type NotificationItemDto,
} from "@/services/DACN/notifications";

const UNREAD_POLLING_INTERVAL_MS = 15_000;

// --- HÀM XỬ LÝ THỜI GIAN CHUNG ---
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatNotificationTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const todayYmd = ymdLocal(now);
  const dateYmd = ymdLocal(date);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayYmd = ymdLocal(yesterday);

  const timePart = formatDate(date, "HH:mm");

  if (dateYmd === todayYmd) return `Hôm nay ${timePart}`;
  if (dateYmd === yesterdayYmd) return `Hôm qua ${timePart}`;

  return formatDate(date, "DD/MM/YYYY HH:mm");
}

// --- HÀM LÀM ĐẸP & DỊCH NỘI DUNG THÔNG BÁO ---
function parseMessageContent(text: string) {
  if (!text) return "";
  let msg = text;

  // 1. Dịch các từ khóa Backend sang Tiếng Việt
  msg = msg.replace("You have been added to recurring booking", "Bạn được thêm vào lịch họp định kỳ");
  msg = msg.replace("You have been added to booking", "Bạn được thêm vào lịch họp");
  msg = msg.replace("in room", "tại");
  msg = msg.replace("from", "từ");
  msg = msg.replace("to", "đến");
  msg = msg.replace("Ticket", "Yêu cầu");
  msg = msg.replace("was assigned to", "đã được phân công cho");
  msg = msg.replace("status changed from", "đã đổi trạng thái từ");
  msg = msg.replace("Your leave request", "Đơn xin nghỉ phép của bạn");
  msg = msg.replace("is APPROVED", "đã được DUYỆT ✅");
  msg = msg.replace("is REJECTED", "đã bị TỪ CHỐI ❌");
  msg = msg.replace("OPEN", "CHỜ XỬ LÝ");
  msg = msg.replace("IN_PROGRESS", "ĐANG XỬ LÝ");

  // 2. Chuyển giờ quốc tế (ISO) trong chuỗi thành giờ Việt Nam
  msg = msg.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/g, (match) => {
    const d = new Date(match);
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${time} ngày ${date}`;
  });

  // 3. Chuyển các ngày YYYY-MM-DD thành DD/MM/YYYY
  msg = msg.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3/$2/$1");

  return msg;
}

// --- HÀM PHÂN LOẠI ICON ---
function getNotificationIcon(type?: string) {
  switch (type) {
    case "BOOKING":
      return <CalendarDays className="w-8 h-8 p-1.5 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-100/50" />;
    case "TICKET":
      return <TicketIcon className="w-8 h-8 p-1.5 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100/50" />;
    case "LEAVE_REQUEST":
      return <Palmtree className="w-8 h-8 p-1.5 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/50" />;
    default:
      return <Info className="w-8 h-8 p-1.5 rounded-full bg-gray-50 text-gray-600 ring-1 ring-gray-200/50" />;
  }
}

export default function DashboardHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);

  const [hasUnread, setHasUnread] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Show unread indicator immediately on page load, and keep it up-to-date.
  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function checkUnread() {
      try {
        if (cancelled) return;
        if (markingAllRead) return;
        if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

        const res = await getMyNotifications({ page: 1, pageSize: 1, status: "UNREAD" });
        if (cancelled) return;
        // FIX TS ERROR: Ép kiểu as any để lấy đúng key
        const totalUnread = Number((res as any)?.data?.total ?? (res as any)?.total ?? 0);
        setHasUnread(totalUnread > 0);
      } catch {
        // ignore
      }
    }

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(() => {
        void checkUnread();
      }, UNREAD_POLLING_INTERVAL_MS);
    };

    const stop = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stop();
        return;
      }
      void checkUnread();
      start();
    };

    checkUnread();
    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [markingAllRead]);

  useEffect(() => {
    if (!notificationsOpen) return;

    let cancelled = false;

    async function load() {
      setLoadingNotifications(true);
      setNotificationsError(null);
      try {
        const res = await getMyNotifications({ page: 1, pageSize: 20 });
        if (cancelled) return;
        // FIX TS ERROR: Ép kiểu as any để truy xuất items an toàn
        const items = (res as any)?.data?.items ?? (res as any)?.items ?? [];
        setNotifications(items);
        if (items.some((n: any) => n.status === "UNREAD")) setHasUnread(true);
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

  const handleNotificationsOpenChange = (nextOpen: boolean) => {
    const hadUnread = hasUnread || notifications.some((n) => n.status === "UNREAD");
    if (!nextOpen && hadUnread) {
      setMarkingAllRead(true);
      setHasUnread(false);
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
      void markAllMyNotificationsRead()
        .catch(() => {
          // If marking read fails, refresh unread indicator.
          void getMyNotifications({ page: 1, pageSize: 1, status: "UNREAD" })
            .then((res) => {
              const totalUnread = Number((res as any)?.data?.total ?? (res as any)?.total ?? 0);
              setHasUnread(totalUnread > 0);
            })
            .catch(() => {
              // ignore
            });
        })
        .finally(() => {
          setMarkingAllRead(false);
        });
    }
    setNotificationsOpen(nextOpen);
  };

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
        {/* <button className="relative p-2 hover:bg-neutral-background rounded-lg transition-colors">
          <Mail className="w-5 h-5 text-grey-900" />
        </button> */}
        <Popover open={notificationsOpen} onOpenChange={handleNotificationsOpenChange}>
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
          <PopoverContent align="end" className="w-96 p-0 shadow-lg">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="text-sm font-semibold text-foreground">Thông báo</div>
            </div>

            <ScrollArea className="max-h-[400px]">
              <div className="py-1">
                {loadingNotifications ? (
                  <div className="px-4 py-8 flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Đang tải...
                  </div>
                ) : notificationsError ? (
                  <div className="px-4 py-3 text-sm text-destructive bg-destructive/10">{notificationsError}</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Bạn chưa có thông báo nào.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors border-b border-border last:border-b-0 hover:bg-accent/50 cursor-default",
                        n.status === "UNREAD" ? "bg-primary/5" : "bg-transparent"
                      )}
                    >
                      <div className="shrink-0 mt-0.5">
                        {/* Dùng as any để tránh lỗi nếu Type chưa cập nhật trường type */}
                        {getNotificationIcon((n as any).type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm text-foreground leading-snug",
                            n.status === "UNREAD" ? "font-semibold" : "font-normal"
                          )}
                        >
                          {parseMessageContent(n.message)}
                        </div>
                        <div className="mt-1.5 text-xs text-muted-foreground font-medium">
                          {formatNotificationTime(n.created_at)}
                        </div>
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