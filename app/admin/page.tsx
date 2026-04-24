"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  Clock,
  Headphones,
  Lock,
  Monitor,
  Package,
  Users,
} from "lucide-react";

import { useRequest } from "ahooks";

import { getRooms, type Room } from "@/services/DACN/Rooms";
import { getBookings, type BookingByRoom } from "@/services/DACN/Booking";
import { getAssets, type Asset } from "@/services/DACN/asset";
import { getAllEmployees, type EmployeeDto } from "@/services/DACN/employee";
import { extractEmployeesFromResponseData } from "@/lib/employee-ui";
import { getDepartmentLeaveRequests } from "@/services/DACN/request";
import { getDepartmentTodayCheckinStatus } from "@/services/DACN/attendance";
import {
  getManagementTickets,
  type ManagementTicketDto,
  type ManagementTicketStatus,
} from "@/services/DACN/Tickets";

type Tone = "blue" | "purple" | "green" | "red";

type AbsenceRow = {
  id: string;
  initials: string;
  name: string;
  dept: string;
  tag: string;
  tagTone: string;
};

function toneClasses(tone: Tone) {
  switch (tone) {
    case "blue":
      return {
        border: "border-l-blue-500",
        iconBg: "bg-blue-50",
        iconText: "text-blue-600",
      };
    case "purple":
      return {
        border: "border-l-violet-500",
        iconBg: "bg-violet-50",
        iconText: "text-violet-600",
      };
    case "green":
      return {
        border: "border-l-emerald-500",
        iconBg: "bg-emerald-50",
        iconText: "text-emerald-600",
      };
    case "red":
      return {
        border: "border-l-rose-500",
        iconBg: "bg-rose-50",
        iconText: "text-rose-600",
      };
  }
}

function SummaryCard({
  tone,
  title,
  value,
  subtitle,
  hint,
  hintTone,
  icon,
}: {
  tone: Tone;
  title: string;
  value: string;
  subtitle: string;
  hint?: string;
  hintTone?: "good" | "warn" | "bad";
  icon: React.ReactNode;
}) {
  const t = toneClasses(tone);

  const hintClass =
    hintTone === "good"
      ? "text-emerald-600"
      : hintTone === "warn"
        ? "text-amber-600"
        : hintTone === "bad"
          ? "text-rose-600"
          : "text-muted-foreground";

  return (
    <div
      className={`rounded-xl border border-grey-50 bg-white shadow-sm ${t.border} border-l-[3px]`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </div>
            <div className="mt-1 text-2xl font-semibold text-grey-900">
              {value}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {subtitle}
            </div>
            {hint ? (
              <div className={`mt-2 text-xs font-medium ${hintClass}`}>{hint}</div>
            ) : null}
          </div>
          <div
            className={`grid h-9 w-9 place-items-center rounded-lg ${t.iconBg} ${t.iconText}`}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

type RoomState = "available" | "occupied" | "upcoming";

function roomStateMeta(state: RoomState) {
  switch (state) {
    case "available":
      return {
        dot: "bg-emerald-500",
        card: "border-grey-50 bg-white",
        statusText: "text-emerald-600",
        icon: <CircleCheck className="h-4 w-4" />,
      };
    case "occupied":
      return {
        dot: "bg-rose-500",
        card: "border-rose-200 bg-rose-50",
        statusText: "text-rose-600",
        icon: <Lock className="h-4 w-4" />,
      };
    case "upcoming":
      return {
        dot: "bg-amber-500",
        card: "border-amber-200 bg-amber-50",
        statusText: "text-amber-600",
        icon: <Clock className="h-4 w-4" />,
      };
  }
}

function ProgressLine({
  percent,
  tone,
}: {
  percent: number;
  tone: "blue" | "green" | "red";
}) {
  const bar =
    tone === "blue"
      ? "bg-blue-500"
      : tone === "green"
        ? "bg-emerald-500"
        : "bg-rose-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-background">
      <div
        className={`h-full ${bar}`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseApiDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function pickBookingStart(b: any): Date | null {
  return parseApiDate(b?.startTime ?? b?.start_time);
}

function pickBookingEnd(b: any): Date | null {
  return parseApiDate(b?.endTime ?? b?.end_time);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function actorDisplayName(actor: any): string {
  if (!actor) return "";
  const direct = String(actor?.name ?? "").trim();
  if (direct) return direct;
  const parts = [actor?.lastName, actor?.middleName ?? "", actor?.firstName]
    .map((x: any) => String(x ?? "").trim())
    .filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function employeeDisplayName(actor: any): string {
  if (!actor) return "";
  const parts = [actor?.lastName, actor?.middleName ?? "", actor?.firstName]
    .map((x: any) => String(x ?? "").trim())
    .filter(Boolean);
  const full = parts.join(" ").replace(/\s+/g, " ").trim();
  return full || String(actor?.email ?? "").trim();
}

function employeeInitials(actor: any): string {
  if (!actor) return "?";
  const last = String(actor?.lastName ?? "").trim();
  const first = String(actor?.firstName ?? "").trim();
  const a = last ? last[0] : "";
  const b = first ? first[0] : "";
  const initials = (a + b).toUpperCase();
  if (initials) return initials;
  const email = String(actor?.email ?? "").trim();
  return email ? (email[0] ?? "?").toUpperCase() : "?";
}

function statusBadgeMeta(status: ManagementTicketStatus) {
  switch (status) {
    case "OPEN":
      return {
        label: "Mới",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "IN_PROGRESS":
      return {
        label: "Đang xử lý",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "RESOLVED":
      return {
        label: "Đã xử lý",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "DEFERRED":
      return {
        label: "Tạm hoãn",
        className: "bg-neutral-50 text-neutral-700 border-neutral-200",
      };
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const now = new Date();
  const todayStr = toISODate(now);

  const { data: checkinTodayRes } = useRequest(getDepartmentTodayCheckinStatus, {
    pollingInterval: 10_000,
    pollingWhenHidden: false,
  });

  const absences = React.useMemo<AbsenceRow[]>(() => {
    const payload: any = (checkinTodayRes as any)?.data ?? null;
    const deptName = String(payload?.departmentName ?? "").trim();
    const employees = Array.isArray(payload?.employees) ? payload.employees : [];
    return employees
      .filter((e: any) => !Boolean(e?.worked))
      .map((e: any) => {
        const id = String(e?.employeeId ?? e?.id ?? e?.email ?? "").trim();
        return {
          id: id || employeeDisplayName(e),
          initials: employeeInitials(e),
          name: employeeDisplayName(e),
          dept: deptName || "—",
          tag: "Chưa check-in",
          tagTone: "bg-rose-50 text-rose-700 border-rose-200",
        };
      });
  }, [checkinTodayRes]);

  const { data: roomsRes } = useRequest(getRooms, {
    pollingInterval: 5000,
    pollingWhenHidden: false,
  });
  // `request` interceptor đã trả về payload (res.data) nên `roomsRes` chính là RoomsResponse.
  const roomsAll: Room[] = Array.isArray((roomsRes as any)?.data)
    ? (((roomsRes as any).data ?? []) as Room[])
    : [];

  const { data: bookingsRes } = useRequest(getBookings, {
    pollingInterval: 15000,
    pollingWhenHidden: false,
  });
  const bookingsAll: BookingByRoom[] =
    (bookingsRes as any)?.data && Array.isArray((bookingsRes as any).data)
      ? ((bookingsRes as any).data as BookingByRoom[])
      : [];

  const { data: assetsRes } = useRequest(() => getAssets({ page: 1, pageSize: 5000 }));
  const assetsAll: Asset[] = Array.isArray((assetsRes as any)?.data?.items)
    ? ((assetsRes as any).data.items as Asset[])
    : Array.isArray((assetsRes as any)?.items)
      ? ((assetsRes as any).items as Asset[])
      : [];

  const { data: employeesRes } = useRequest(() => getAllEmployees({ page: 1, pageSize: 5000 }));
  const employeesAll: EmployeeDto[] = extractEmployeesFromResponseData((employeesRes as any)?.data ?? employeesRes);

  const { data: leaveTodayRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 500,
      fromDate: todayStr,
      toDate: todayStr,
    }),
  );
  const leaveTodayItems = (leaveTodayRes as any)?.data?.items ?? [];
  const absentTodayCount = React.useMemo(() => {
    return (leaveTodayItems as any[]).filter((it: any) => {
      const from = String(it?.date_from ?? "");
      const to = String(it?.date_to ?? "");
      const status = String(it?.status ?? "").toUpperCase();
      const overlaps = from <= todayStr && todayStr <= to;
      return overlaps && status !== "REJECTED";
    }).length;
  }, [leaveTodayItems, todayStr]);

  const { data: ticketsOpenRes } = useRequest(() =>
    getManagementTickets({ status: "OPEN", page: 1, limit: 1 }),
  );
  const { data: ticketsInProgressRes } = useRequest(() =>
    getManagementTickets({ status: "IN_PROGRESS", page: 1, limit: 1 }),
  );

  const ticketsUnresolved =
    Number((ticketsOpenRes as any)?.total ?? 0) + Number((ticketsInProgressRes as any)?.total ?? 0);

  const { data: latestTicketsRes } = useRequest(() =>
    getManagementTickets({
      page: 1,
      limit: 3,
      sort_by: "created_at",
      sort_order: "DESC",
    }),
  );
  const latestTicketsPayload: any = (latestTicketsRes as any)?.data ?? latestTicketsRes;
  const latestTickets: ManagementTicketDto[] = Array.isArray(latestTicketsPayload?.items)
    ? (latestTicketsPayload.items as ManagementTicketDto[])
    : [];

  const roomsForCards = React.useMemo(() => {
    const byRoomName = new Map<string, BookingByRoom[]>();
    for (const b of bookingsAll) {
      const roomName = String((b as any)?.roomName ?? "").trim();
      if (!roomName) continue;
      const arr = byRoomName.get(roomName) ?? [];
      arr.push(b);
      byRoomName.set(roomName, arr);
    }
    for (const [, arr] of byRoomName) {
      arr.sort((a, b) => {
        const sa = pickBookingStart(a)?.getTime() ?? 0;
        const sb = pickBookingStart(b)?.getTime() ?? 0;
        return sa - sb;
      });
    }

    const nowMs = now.getTime();
    const upcomingThresholdMs = 15 * 60 * 1000;

    const result = roomsAll.slice(0, 4).map((r) => {
      const bookings = byRoomName.get(r.name) ?? [];
      const current = bookings.find((b) => {
        const s = pickBookingStart(b);
        const e = pickBookingEnd(b);
        if (!s || !e) return false;
        const sm = s.getTime();
        const em = e.getTime();
        return sm <= nowMs && nowMs < em;
      });
      const next = bookings.find((b) => {
        const s = pickBookingStart(b);
        if (!s) return false;
        return s.getTime() > nowMs;
      });

      const roomStatus = String((r as any)?.status ?? "").toUpperCase();

      if (roomStatus === "OCCUPIED" || current) {
        const end = pickBookingEnd(current) ?? null;
        return {
          name: r.name,
          capacity: r.capacity,
          state: "occupied" as const,
          detail: current?.name ? `Đang họp: ${current.name}` : "Đang sử dụng",
          time: end ? `Đến: ${formatTime(end)}` : "",
        };
      }

      if (next) {
        const start = pickBookingStart(next);
        const msUntil = start ? start.getTime() - nowMs : Number.POSITIVE_INFINITY;
        if (msUntil <= upcomingThresholdMs) {
          return {
            name: r.name,
            capacity: r.capacity,
            state: "upcoming" as const,
            detail: next?.name ? `Sắp diễn ra: ${next.name}` : "Sắp diễn ra",
            time: start ? `Bắt đầu: ${formatTime(start)}` : "",
          };
        }

        return {
          name: r.name,
          capacity: r.capacity,
          state: "available" as const,
          detail: "Trống",
          time: start ? `Trống đến ${formatTime(start)}` : "",
        };
      }

      const maintenance = roomStatus === "MAINTENANCE";
      return {
        name: r.name,
        capacity: r.capacity,
        state: maintenance ? ("occupied" as const) : ("available" as const),
        detail: maintenance ? "Đang bảo trì" : "Trống",
        time: "",
      };
    });

    return result;
  }, [roomsAll, bookingsAll, now]);

  const roomOccupancyCounts = React.useMemo(() => {
    const byRoomName = new Map<string, BookingByRoom[]>();
    for (const b of bookingsAll) {
      const roomName = String((b as any)?.roomName ?? "").trim();
      if (!roomName) continue;
      const arr = byRoomName.get(roomName) ?? [];
      arr.push(b);
      byRoomName.set(roomName, arr);
    }

    const nowMs = now.getTime();
    let occupied = 0;

    for (const r of roomsAll) {
      const roomStatus = String((r as any)?.status ?? "").toUpperCase();
      if (roomStatus === "OCCUPIED") {
        occupied += 1;
        continue;
      }
      const bookings = byRoomName.get(r.name) ?? [];
      const hasCurrent = bookings.some((b) => {
        const s = pickBookingStart(b);
        const e = pickBookingEnd(b);
        if (!s || !e) return false;
        return s.getTime() <= nowMs && nowMs < e.getTime();
      });
      if (hasCurrent) occupied += 1;
    }

    const total = roomsAll.length;
    const available = Math.max(0, total - occupied);
    return { occupied, total, available };
  }, [roomsAll, bookingsAll, now]);

  const assetCounts = React.useMemo(() => {
    const total = assetsAll.length;
    const countNew = assetsAll.filter((x) => x.condition === "NEW").length;
    const countUsed = assetsAll.filter((x) => x.condition === "USED").length;
    const countBroken = assetsAll.filter((x) => x.condition === "BROKEN").length;
    const countMaintenance = assetsAll.filter((x) => x.condition === "UNDER_MAINTENANCE").length;
    const good = countNew + countUsed;
    const inStock = countNew;
    const bad = countBroken + countMaintenance;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return {
      total,
      needMaintenance: bad,
      pctGood: pct(good),
      pctInStock: pct(inStock),
      pctBad: pct(bad),
    };
  }, [assetsAll]);

  const summary = React.useMemo(
    () => [
      {
        tone: "blue" as const,
        title: "Phòng họp",
        value:
          roomOccupancyCounts.total > 0
            ? `${roomOccupancyCounts.occupied}/${roomOccupancyCounts.total}`
            : "0/0",
        subtitle: "Đang sử dụng",
        hint:
          roomOccupancyCounts.total > 0
            ? `↑ ${roomOccupancyCounts.available} Phòng trống`
            : undefined,
        hintTone: "good" as const,
        icon: <Monitor className="h-4 w-4" />,
      },
      {
        tone: "purple" as const,
        title: "Tổng tài sản",
        value: String(assetCounts.total),
        subtitle: "Thiết bị",
        hint:
          assetCounts.needMaintenance > 0
            ? `▲ ${assetCounts.needMaintenance} Cần bảo trì`
            : undefined,
        hintTone: assetCounts.needMaintenance > 0 ? ("bad" as const) : undefined,
        icon: <Package className="h-4 w-4" />,
      },
      {
        tone: "green" as const,
        title: "Nhân sự",
        value: String(employeesAll.length),
        subtitle: "Nhân viên",
        hint: absentTodayCount > 0 ? `● ${absentTodayCount} Nghỉ phép hôm nay` : undefined,
        hintTone: absentTodayCount > 0 ? ("warn" as const) : undefined,
        icon: <Users className="h-4 w-4" />,
      },
      {
        tone: "red" as const,
        title: "Ticket hỗ trợ",
        value: String(ticketsUnresolved),
        subtitle: "Đang chờ xử lý",
        hint:
          Number((ticketsInProgressRes as any)?.total ?? 0) > 0
            ? `● ${Number((ticketsInProgressRes as any)?.total ?? 0)} Đang xử lý`
            : undefined,
        hintTone: Number((ticketsInProgressRes as any)?.total ?? 0) > 0 ? ("warn" as const) : undefined,
        icon: <Headphones className="h-4 w-4" />,
      },
    ],
    [
      roomOccupancyCounts,
      assetCounts,
      employeesAll.length,
      absentTodayCount,
      ticketsUnresolved,
      ticketsInProgressRes,
    ],
  );

  const requests = React.useMemo(() => {
    return latestTickets.map((t) => {
      const badge = statusBadgeMeta(t.status);
      const ownerName = actorDisplayName(t.employee) || (t.employee?.email ?? "");
      const dept = (t.category as any)?.name ? String((t.category as any).name) : "";
      return {
        id: t.id,
        title: t.title,
        owner: [ownerName, dept ? `- ${dept}` : ""].join(" ").trim(),
        badge: badge.label,
        badgeTone: badge.className,
      };
    });
  }, [latestTickets]);

  return (
    <div className="min-h-screen bg-neutral-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 text-center">
          <div className="text-base font-semibold text-grey-900">
            Tổng quan hệ thống
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((s) => (
            <SummaryCard
              key={s.title}
              tone={s.tone}
              title={s.title}
              value={s.value}
              subtitle={s.subtitle}
              hint={s.hint}
              hintTone={s.hintTone}
              icon={s.icon}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-xl border border-grey-50 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-grey-900">
                Trạng thái phòng họp
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                Live Update
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {roomsForCards.map((r) => {
                const meta = roomStateMeta(r.state);
                return (
                  <div
                    key={r.name}
                    className={`rounded-xl border p-4 ${meta.card}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-grey-900">
                          {r.name}
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Sức chứa: {r.capacity}
                        </div>
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                    </div>

                    <div className={`mt-3 flex items-center gap-2 text-xs ${meta.statusText}`}>
                      {meta.icon}
                      <span className="font-medium">{r.detail}</span>
                    </div>
                    {r.time ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.time}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="rounded-xl border border-grey-50 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-grey-900">
              Yêu cầu hỗ trợ mới
            </div>

            <div className="mt-4 space-y-4">
              {requests.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-grey-900">
                      {t.title}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.owner}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold ${t.badgeTone}`}
                  >
                    {t.badge}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-5 w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/admin/support")}
            >
              Xem tất cả ticket
            </button>
          </aside>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-grey-50 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-grey-900">
              Tình trạng tài sản
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Đang hoạt động tốt
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-grey-900">
                  <div>Đang hoạt động tốt</div>
                  <div className="font-medium">{assetCounts.pctGood}%</div>
                </div>
                <ProgressLine percent={assetCounts.pctGood} tone="blue" />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-grey-900">
                  <div>Trong kho (Chưa dùng)</div>
                  <div className="font-medium">{assetCounts.pctInStock}%</div>
                </div>
                <ProgressLine percent={assetCounts.pctInStock} tone="green" />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-grey-900">
                  <div>Hỏng / Đang sửa chữa</div>
                  <div className="font-medium text-rose-600">{assetCounts.pctBad}%</div>
                </div>
                <ProgressLine percent={assetCounts.pctBad} tone="red" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-grey-50 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-grey-900">
              Nhân sự vắng mặt hôm nay ({absences.length})
            </div>

            <div className="mt-4 space-y-4">
              {absences.length > 0 ? (
                absences.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-background text-xs font-semibold text-grey-900">
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-grey-900">
                          {a.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {a.dept}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold ${a.tagTone}`}
                    >
                      {a.tag}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">
                  Hôm nay chưa ghi nhận nhân sự vắng.
                </div>
              )}
            </div>

            <button
              type="button"
              className="mt-5 text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={() => router.push("/admin/employee")}
            >
              &gt;&gt; Xem thêm
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
