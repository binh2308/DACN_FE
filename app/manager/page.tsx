"use client";

import Link from "next/link";
import { AlertCircle, EllipsisVertical } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useMemo } from "react";
import { useRequest } from "ahooks";

import { getEmployees, type EmployeeDto } from "@/services/DACN/employee";
import { extractEmployeesFromResponseData } from "@/lib/employee-ui";
import { getDepartmentLeaveRequests } from "@/services/DACN/request";
import { getManagementTickets, type ManagementTicketDto } from "@/services/DACN/Tickets";
import { getBookings, type BookingByRoom } from "@/services/DACN/Booking";
import {
  getDepartmentAttendanceMonthlySummary,
  getDepartmentTodayCheckinStatus,
} from "@/services/DACN/attendance";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(base: Date) {
  const d = new Date(base);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function parseApiDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function normalizeApiDateToISODateOnly(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  return toISODate(d);
}

function pickBookingStart(b: any): Date | null {
  return parseApiDate(b?.startTime ?? b?.start_time);
}

function pickBookingEnd(b: any): Date | null {
  return parseApiDate(b?.endTime ?? b?.end_time);
}

function fullNameFromApi(e: EmployeeDto) {
  return [e.lastName, e.middleName ?? "", e.firstName]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function ticketActorName(actor: any) {
  if (!actor) return "Nhân viên ẩn danh";
  const direct = String(actor?.name ?? "").trim();
  if (direct) return direct;

  const parts = [actor?.lastName, actor?.middleName, actor?.firstName]
    .map((x: any) => String(x ?? "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" ").replace(/\s+/g, " ").trim();

  const email = String(actor?.email ?? "").trim();
  return email || "Nhân viên ẩn danh";
}

function formatDateTimeVi(iso: unknown) {
  if (typeof iso !== "string") return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildRoomHeatmap(bookings: BookingByRoom[], weekStart: Date) {
  const weekDays = ["T2", "T3", "T4", "T5", "T6"]; 
  const hourLabels = Array.from({ length: 10 }, (_, i) => 8 + i); 

  const counts: number[][] = hourLabels.map(() => Array(weekDays.length).fill(0));

  for (const b of bookings || []) {
    const start = pickBookingStart(b);
    const end = pickBookingEnd(b) ?? (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
    if (!start || !end) continue;

    const day = start.getDay();
    if (day < 1 || day > 5) continue; 

    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + (day - 1));
    const dayEnd = addDays(dayStart, 1);
    if (end <= dayStart || start >= dayEnd) continue;

    const dayIndex = day - 1; 

    for (let i = 0; i < hourLabels.length; i++) {
      const hour = hourLabels[i];
      const slotStart = new Date(dayStart);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(dayStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const overlaps = start < slotEnd && end > slotStart;
      if (overlaps) counts[i][dayIndex] += 1;
    }
  }

  const max = Math.max(0, ...counts.flat());
  return { weekDays, hourLabels, counts, max };
}

function DonutRing({
  size,
  thickness,
  segments,
}: {
  size: number;
  thickness: number;
  segments: Array<{ value: number; color: string }>;
}) {
  const total = segments.reduce((sum, s) => sum + (Number.isFinite(s.value) ? s.value : 0), 0);
  const safeTotal = total > 0 ? total : 0;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="-rotate-90"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="transparent"
        stroke="#E9EAEC"
        strokeWidth={thickness}
      />

      {safeTotal > 0
        ? segments.map((s, idx) => {
            const value = Number.isFinite(s.value) ? Math.max(0, s.value) : 0;
            const length = (value / safeTotal) * circumference;

            const circle = (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
              />
            );

            offset += length;
            return circle;
          })
        : null}
    </svg>
  );
}

export default function ManagerIndex() {
  const today = new Date();
  const todayStr = toISODate(today);
  const weekStart = useMemo(() => startOfWeekMonday(today), [todayStr]);

  const monthStart = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [todayStr]);
  const monthEnd = useMemo(() => {
    const d = endOfMonth(today);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [todayStr]);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  // Tính toán tháng và năm trước đó
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const { data: deptMonthlySummaryRes, loading: loadingDeptMonthlySummary } = useRequest(() =>
    getDepartmentAttendanceMonthlySummary({ year: currentYear, month: currentMonth }),
  );

  // API 1: Thống kê nhân sự tháng trước
  const { data: deptPreviousMonthlySummaryRes } = useRequest(() =>
    getDepartmentAttendanceMonthlySummary({ year: previousYear, month: previousMonth }),
  );

  const deptMonthlySummaryOk = useMemo(
    () => deptMonthlySummaryRes?.statusCode === 200,
    [deptMonthlySummaryRes],
  );

  const deptMonthlyAttendanceByEmployeeId = useMemo(() => {
    const lateDaysById: Record<string, number> = {};
    const absentDaysById: Record<string, number> = {};

    if (deptMonthlySummaryRes?.statusCode !== 200) {
      return { lateDaysById, absentDaysById };
    }

    for (const it of deptMonthlySummaryRes.data.employees) {
      lateDaysById[it.employeeId] = it.lateDays;
      absentDaysById[it.employeeId] = it.absentDays;
    }

    return { lateDaysById, absentDaysById };
  }, [deptMonthlySummaryRes]);

  // Tổng nhân viên tháng này
  const { data: employeesData, loading: loadingEmployees } = useRequest(async () => {
    const res = await getEmployees();
    return extractEmployeesFromResponseData(res?.data);
  });
  const employees = useMemo(() => (employeesData ?? []) as EmployeeDto[], [employeesData]);

  const genderCounts = useMemo(() => {
    let male = 0;
    let female = 0;
    for (const e of employees) {
      const g = (e.gender || "").toLowerCase();
      if (g === "male") male += 1;
      else if (g === "female") female += 1;
    }
    return { male, female, total: employees.length };
  }, [employees]);

  // Đơn phép hôm nay
  const { data: leaveTodayRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 500,
      fromDate: todayStr,
      toDate: todayStr,
    }),
  );
  const leaveTodayItems = leaveTodayRes?.data?.items ?? [];

  // Lấy dữ liệu phép tháng này
  const { data: leaveCurrentMonthRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 1000,
      fromDate: toISODate(monthStart),
      toDate: toISODate(monthEnd),
    }),
  );

  // API 2: Lấy dữ liệu phép tháng trước
  const { data: leavePreviousMonthRes } = useRequest(() => {
    const prevMonthStart = new Date(previousYear, previousMonth - 1, 1);
    prevMonthStart.setHours(0, 0, 0, 0);
    const prevMonthEnd = endOfMonth(prevMonthStart);
    prevMonthEnd.setHours(23, 59, 59, 999);
    return getDepartmentLeaveRequests({
      page: 1,
      pageSize: 1000,
      fromDate: toISODate(prevMonthStart),
      toDate: toISODate(prevMonthEnd),
    });
  });

  const absentToday = useMemo(() => {
    return leaveTodayItems.filter((it: any) => {
      const from = normalizeApiDateToISODateOnly(it?.date_from);
      const to = normalizeApiDateToISODateOnly(it?.date_to);
      if (!from || !to) return false;
      const status = String(it?.status ?? "").toUpperCase();
      const overlaps = from <= todayStr && todayStr <= to;
      return overlaps && status !== "REJECTED";
    }).length;
  }, [leaveTodayItems, todayStr]);

  const { data: checkinTodayRes } = useRequest(getDepartmentTodayCheckinStatus, {
    pollingInterval: 10_000,
    pollingWhenHidden: false,
  });

  const notCheckedInTodayCount = useMemo(() => {
    const n = Number((checkinTodayRes as any)?.data?.notCheckedInCount);
    return Number.isFinite(n) ? n : null;
  }, [checkinTodayRes]);

  const workedTodayByEmployeeId = useMemo(() => {
    const map: Record<string, boolean> = {};
    const employees = (checkinTodayRes as any)?.data?.employees;
    if (Array.isArray(employees)) {
      for (const it of employees as any[]) {
        const id = String(it?.employeeId ?? "");
        if (!id) continue;
        map[id] = Boolean(it?.worked);
      }
    }
    return map;
  }, [checkinTodayRes]);

  const approvedLeaveReasonTodayByEmployeeId = useMemo(() => {
    const items = (leaveCurrentMonthRes?.data?.items ?? []) as any[];
    const map: Record<string, string> = {};
    for (const it of items) {
      const empId = String(it?.employee?.id ?? "").trim();
      if (!empId) continue;

      const status = String(it?.status ?? "").toUpperCase();
      if (status !== "APPROVED") continue;

      const from = normalizeApiDateToISODateOnly(it?.date_from);
      const to = normalizeApiDateToISODateOnly(it?.date_to);
      if (!from || !to) continue;

      const overlaps = from <= todayStr && todayStr <= to;
      if (!overlaps) continue;

      const reason = String(it?.reason ?? "").trim();
      if (reason) map[empId] = reason;
    }
    return map;
  }, [leaveCurrentMonthRes, todayStr]);

  const { data: pendingLeaveRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 1000,
    }),
  );

  const leavePending = useMemo(() => {
    const items = pendingLeaveRes?.data?.items ?? [];
    return items.filter((it: any) => String(it?.status ?? "").toUpperCase() === "PENDING").length;
  }, [pendingLeaveRes]);

  const { data: ticketsOpenRes, loading: loadingTicketsOpen } = useRequest(() =>
    getManagementTickets({
      status: "OPEN",
      page: 1,
      limit: 5,
      sort_by: "created_at",
      sort_order: "DESC",
    }),
  );

  const ticketsOpenPayload = useMemo(
    () => (ticketsOpenRes as any)?.data ?? ticketsOpenRes,
    [ticketsOpenRes],
  );

  const ticketsUnresolved = useMemo(
    () => Number((ticketsOpenPayload as any)?.total ?? 0),
    [ticketsOpenPayload],
  );

  const openTicketsPreview = useMemo(() => {
    const items = (ticketsOpenPayload as any)?.items;
    return Array.isArray(items) ? (items as ManagementTicketDto[]) : [];
  }, [ticketsOpenPayload]);

  // API 3: Ticket chưa xử lý của tháng trước
  const { data: ticketsOpenPreviousMonthRes } = useRequest(() => {
    const prevMonthStart = new Date(previousYear, previousMonth - 1, 1);
    prevMonthStart.setHours(0, 0, 0, 0);
    const prevMonthEnd = endOfMonth(prevMonthStart);
    prevMonthEnd.setHours(23, 59, 59, 999);
    return getManagementTickets({
      status: "OPEN",
      from_date: toISODate(prevMonthStart),
      to_date: toISODate(prevMonthEnd),
    });
  });

  const ticketsOpenPreviousMonthPayload = useMemo(
    () => (ticketsOpenPreviousMonthRes as any)?.data ?? ticketsOpenPreviousMonthRes,
    [ticketsOpenPreviousMonthRes],
  );

  const { data: bookingsRes } = useRequest(() => getBookings());
  const bookings = (bookingsRes?.data ?? []) as BookingByRoom[];
  const heatmap = useMemo(() => buildRoomHeatmap(bookings, weekStart), [bookings, weekStart]);

  // =============== Tính toán phần trăm và isPositive ===============
  
  // Tổng nhân viên (Tăng là Tốt)
  const previousMonthEmployeeCount = useMemo(() => {
    return deptPreviousMonthlySummaryRes?.data?.totalEmployees ?? 0;
  }, [deptPreviousMonthlySummaryRes]);

  const employeeCountChange = useMemo(() => {
    if (previousMonthEmployeeCount === 0) return { change: "0%", isPositive: true };
    const diff = genderCounts.total - previousMonthEmployeeCount;
    const percentChange = Math.round((diff / previousMonthEmployeeCount) * 100);
    return {
      change: `${percentChange > 0 ? "+" : ""}${percentChange}%`,
      isPositive: percentChange >= 0,
    };
  }, [genderCounts.total, previousMonthEmployeeCount]);

  // Vắng/nghỉ phép (Giảm là Tốt)
  const absentCurrentMonth = useMemo(() => {
    const items = leaveCurrentMonthRes?.data?.items ?? [];
    if (Array.isArray(items)) {
      return items.filter((it: any) => String(it?.status ?? "").toUpperCase() !== "REJECTED").length;
    }
    return 0;
  }, [leaveCurrentMonthRes]);

  const absentPreviousMonth = useMemo(() => {
    const items = leavePreviousMonthRes?.data?.items ?? [];
    if (Array.isArray(items)) {
      return items.filter((it: any) => String(it?.status ?? "").toUpperCase() !== "REJECTED").length;
    }
    return 0;
  }, [leavePreviousMonthRes]);

  const absentChange = useMemo(() => {
    if (absentPreviousMonth === 0) return { change: "0%", isPositive: true };
    const diff = absentCurrentMonth - absentPreviousMonth;
    const percentChange = Math.round((diff / absentPreviousMonth) * 100);
    return {
      change: `${diff > 0 ? "+" : ""}${percentChange}%`,
      isPositive: diff <= 0,
    };
  }, [absentCurrentMonth, absentPreviousMonth]);

  // Ticket chưa xử lý (Giảm là Tốt)
  const ticketsUnresolvedPreviousMonth = useMemo(() => {
    return Number((ticketsOpenPreviousMonthPayload as any)?.total ?? 0);
  }, [ticketsOpenPreviousMonthPayload]);

  const ticketChange = useMemo(() => {
    if (ticketsUnresolvedPreviousMonth === 0) return { change: "0%", isPositive: true };
    const diff = ticketsUnresolved - ticketsUnresolvedPreviousMonth;
    const percentChange = Math.round((diff / ticketsUnresolvedPreviousMonth) * 100);
    return {
      change: `${diff > 0 ? "+" : ""}${percentChange}%`,
      isPositive: diff <= 0,
    };
  }, [ticketsUnresolved, ticketsUnresolvedPreviousMonth]);

  // Đơn phép đang chờ duyệt (Giảm là Tốt)
  const leavePendingPreviousMonth = useMemo(() => {
    const items = leavePreviousMonthRes?.data?.items ?? [];
    if (Array.isArray(items)) {
      return items.filter((it: any) => String(it?.status ?? "").toUpperCase() === "PENDING").length;
    }
    return 0;
  }, [leavePreviousMonthRes]);

  const leavePendingChange = useMemo(() => {
    if (leavePendingPreviousMonth === 0) return { change: "0%", isPositive: true };
    const diff = leavePending - leavePendingPreviousMonth;
    const percentChange = Math.round((diff / leavePendingPreviousMonth) * 100);
    return {
      change: `${diff > 0 ? "+" : ""}${percentChange}%`,
      isPositive: diff <= 0,
    };
  }, [leavePending, leavePendingPreviousMonth]);

  // Khởi tạo stats map với các giá trị đã được tính
  const stats = useMemo(
    () => [
      {
        title: "Tổng nhân viên",
        value: genderCounts.total,
        change: employeeCountChange.change,
        isPositive: employeeCountChange.isPositive,
      },
      {
        title: "Vắng/ nghỉ phép hôm nay",
        value: notCheckedInTodayCount ?? absentToday,
        change: absentChange.change,
        isPositive: absentChange.isPositive,
      },
      {
        title: "Ticket chưa xử lý",
        value: ticketsUnresolved,
        change: ticketChange.change,
        isPositive: ticketChange.isPositive,
      },
      {
        title: "Đơn phép đang chờ duyệt",
        value: leavePending,
        change: leavePendingChange.change,
        isPositive: leavePendingChange.isPositive,
      },
    ],
    [
      genderCounts.total,
      employeeCountChange,
      notCheckedInTodayCount,
      absentToday,
      absentChange,
      ticketsUnresolved,
      ticketChange,
      leavePending,
      leavePendingChange,
    ],
  );

  const getHeatmapColor = (val: number) => {
    if (val <= 0) return "#F3F4F6";
    if (val === 1) return "#D1FAE5";
    if (val === 2) return "#6EE7B7";
    if (val === 3) return "#34D399";
    if (val === 4) return "#10B981";
    return "#0B9F57";
  };

  const absentTodayByEmployeeId = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const it of leaveTodayItems as any[]) {
      const empId = String(it?.employee?.id ?? "");
      if (!empId) continue;

      const from = normalizeApiDateToISODateOnly(it?.date_from);
      const to = normalizeApiDateToISODateOnly(it?.date_to);
      if (!from || !to) continue;
      const status = String(it?.status ?? "").toUpperCase();
      const overlaps = from <= todayStr && todayStr <= to;
      if (overlaps && status !== "REJECTED") map[empId] = true;
    }
    return map;
  }, [leaveTodayItems, todayStr]);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3">
          {/* Card: Số lượng nhân viên */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                  Số lượng nhân viên
                </h3>
                <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                  Tính đến hôm nay {new Date().toLocaleDateString()}
                </div>
              </div>
              <button className="text-[#21252B] hover:text-[#0B9F57]" type="button">
                <EllipsisVertical />
              </button>
            </div>

            <div className="relative w-fit mx-auto">
              <DonutRing
                size={140}
                thickness={22}
                segments={[
                  { value: genderCounts.female, color: "#A78BFA" },
                  { value: genderCounts.male, color: "#34D399" },
                ]}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                <div className="font-bold text-xl">{genderCounts.total}</div>
                <div className="text-sm">Tổng số</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#A78BFA]" />
                  <span className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                    Nữ
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                    {genderCounts.female}
                  </span>
                  <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                    {genderCounts.total > 0
                      ? `${Math.round((genderCounts.female / genderCounts.total) * 100)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                  <span className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                    Nam
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                    {genderCounts.male}
                  </span>
                  <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                    {genderCounts.total > 0
                      ? `${Math.round((genderCounts.male / genderCounts.total) * 100)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Heatmap Tần suất sử dụng phòng họp */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                  Tần suất sử dụng phòng họp
                </h3>
                <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                  Thống kê theo tuần
                </div>
              </div>
              <button className="text-[#21252B] hover:text-[#0B9F57]" type="button">
                <EllipsisVertical />
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <div className="flex w-full mb-1">
                <div className="w-6"></div>
                <div className="flex-1 flex justify-between text-[10px] text-[#B8BDC5] px-1 leading-[140%] tracking-[0.12px]">
                  {heatmap.hourLabels.filter(h => h % 2 === 0).map(h => (
                    <span key={h}>{h}h</span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col gap-1 w-full">
                {heatmap.weekDays.map((d, di) => (
                  <div key={d} className="flex items-center gap-1">
                    <span className="w-6 text-[10px] font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                      {d}
                    </span>
                    <div className="flex-1 flex gap-1">
                      {heatmap.hourLabels.map((h, hi) => {
                        const val = heatmap.counts[hi]?.[di] ?? 0;
                        return (
                          <div 
                            key={`${h}-${di}`} 
                            className="flex-1 aspect-square rounded-[2px] transition-opacity duration-200 hover:opacity-80 cursor-pointer" 
                            style={{ backgroundColor: getHeatmapColor(val) }} 
                            title={`${val} lượt đặt`} 
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-4 w-full justify-end">
                <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                  Trống
                </span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((v) => {
                    return (
                      <div
                        key={v}
                        className="w-3 h-3 rounded-[2px]"
                        style={{ backgroundColor: getHeatmapColor(v) }}
                        title={v >= 5 ? "Từ 5 phòng trở lên" : `${v} phòng`}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                  Đông
                </span>
              </div>
            </div>
          </div>

          {/* Card: Ticket chờ xử lý */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                  Ticket chờ xử lý
                </h3>
                <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                  Mới nhất • Tổng {ticketsUnresolved}
                </div>
              </div>

              <Link
                href="/manager/support"
                className="text-xs font-medium text-[#21252B] hover:text-[#0B9F57]"
              >
                Xem tất cả
              </Link>
            </div>

            {loadingTicketsOpen ? (
              <div className="py-4 text-center text-xs text-[#B8BDC5]">
                Đang tải ticket…
              </div>
            ) : openTicketsPreview.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#B8BDC5]">
                Không có ticket chờ xử lý
              </div>
            ) : (
              <div className="space-y-2">
                {openTicketsPreview.map((t) => (
                  <Link
                    key={t.id}
                    href={`/manager/support/${t.id}`}
                    className="block rounded-lg border border-[#E9EAEC] p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px] truncate">
                          {String(t.title || "").trim() || "Ticket"}
                        </div>
                        <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px] truncate">
                          {ticketActorName(t.employee)} • {formatDateTimeVi(t.created_at) || "—"}
                        </div>
                      </div>

                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Chờ xử lý
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card: Tổng quan chuyên cần */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                Tổng quan chuyên cần
              </h3>
              <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                Tháng {(new Date().getMonth() + 1).toString().padStart(2, "0")}/
                {new Date().getFullYear()}
              </div>
            </div>
            <button className="text-[#21252B] hover:text-[#0B9F57]" type="button">
              <EllipsisVertical />
            </button>
          </div>

          <div className="mb-2">
            <div className="grid grid-cols-4 gap-3 text-[10px] font-semibold text-[#B8BDC5] uppercase pb-2 border-b border-[#E9EAEC] leading-[140%] tracking-[0.12px]">
              <div>Nhân viên</div>
              <div className="text-center">Số ngày đi muộn</div>
              <div className="text-center">Nghỉ phép (tháng)</div>
              <div className="text-center">Hôm nay</div>
            </div>
          </div>

          <div className="space-y-0 max-h-[400px] overflow-y-auto">
            {loadingEmployees ? (
              <div className="py-6 text-center text-xs text-[#B8BDC5]">Đang tải nhân viên…</div>
            ) : employees.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#B8BDC5]">Chưa có dữ liệu nhân viên</div>
            ) : (
              employees.map((e) => {
                const displayName = fullNameFromApi(e) || e.email;
                const avatar =
                  e.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(e.id)}`;

                const lateDaysDisplay = deptMonthlySummaryOk
                  ? (deptMonthlyAttendanceByEmployeeId.lateDaysById[e.id] ?? 0)
                  : loadingDeptMonthlySummary
                    ? "…"
                    : "—";

                const absentDaysDisplay = deptMonthlySummaryOk
                  ? (deptMonthlyAttendanceByEmployeeId.absentDaysById[e.id] ?? 0)
                  : loadingDeptMonthlySummary
                    ? "…"
                    : "—";
                const isAbsentToday = Boolean(absentTodayByEmployeeId[e.id]);

                const hasWorkedFlag = Object.prototype.hasOwnProperty.call(
                  workedTodayByEmployeeId,
                  e.id,
                );
                const workedToday = hasWorkedFlag
                  ? Boolean(workedTodayByEmployeeId[e.id])
                  : !isAbsentToday;

                const absentReason = approvedLeaveReasonTodayByEmployeeId[e.id];
                const todayLabel = workedToday ? "Đi làm" : absentReason || "Vắng";

                const todayBadgeClass = workedToday
                  ? "bg-emerald-50 text-emerald-700"
                  : absentReason
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700";

                return (
                  <div
                    key={e.id}
                    className="grid grid-cols-4 gap-3 py-1.5 border-b border-[#E9EAEC] last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
                        <img
                          src={avatar}
                          alt={displayName}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px] truncate">
                          {displayName}
                        </div>
                        <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px] truncate">
                          {e.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                      <span className="px-2 py-1 rounded-md">{lateDaysDisplay}</span>
                    </div>

                    <div className="flex items-center justify-center text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                      <span className="px-2 py-1 rounded-md">{absentDaysDisplay}</span>
                    </div>

                    <div className="flex items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-[140%] tracking-[0.12px] ${todayBadgeClass}`}
                      >
                        {todayLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}