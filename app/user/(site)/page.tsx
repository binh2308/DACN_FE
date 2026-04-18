"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useRequest } from "ahooks";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

import { myRequests } from "@/services/DACN/request";
import {
  getMyAttendanceMonthlySummary,
  type MonthlyAttendanceSummaryDto,
} from "@/services/DACN/attendance";
import { getMyPayrollByMonth } from "@/services/DACN/Payroll";
import { getMySchedule, type ScheduleItemDto } from "@/services/DACN/Management";
import { getListAnnouncement } from "@/services/DACN/announcement";

type AnyScheduleItem = ScheduleItemDto | any;

function normalizeScheduleResponse(data: unknown): AnyScheduleItem[] {
  if (!data) return [];
  const payload = (data as any)?.data ?? data;
  const items = (payload as any)?.items ?? (payload as any)?.data?.items;
  if (Array.isArray(items)) return items as AnyScheduleItem[];
  return [];
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeToISODateOnly(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? toISODate(d) : null;
  }
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? toISODate(value) : null;
  return null;
}

function parseISODateOnlyToUtcMs(iso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const ms = Date.UTC(y, m - 1, d);
  return Number.isFinite(ms) ? ms : null;
}

function daysInclusiveBetweenISO(fromISO: string, toISO: string): number {
  const fromMs = parseISODateOnlyToUtcMs(fromISO);
  const toMs = parseISODateOnlyToUtcMs(toISO);
  if (fromMs == null || toMs == null || toMs < fromMs) return 0;
  return Math.floor((toMs - fromMs) / 86_400_000) + 1;
}

function overlappedDaysInRange(fromISO: string, toISO: string, rangeFromISO: string, rangeToISO: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromISO)) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(toISO)) return 0;
  const effectiveFrom = fromISO < rangeFromISO ? rangeFromISO : fromISO;
  const effectiveTo = toISO > rangeToISO ? rangeToISO : toISO;
  if (effectiveFrom > effectiveTo) return 0;
  return daysInclusiveBetweenISO(effectiveFrom, effectiveTo);
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value: unknown): string {
  const n = toNumber(value);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function formatMoneySigned(value: unknown): string {
  const n = toNumber(value);
  const abs = Math.abs(n);
  const formatted = formatMoney(abs);
  return n < 0 ? `-${formatted}` : formatted;
}

function overlapsDay(start: Date, end: Date, day: Date): boolean {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return start < dayEnd && end > dayStart;
}

export default function Index() {
  const router = useRouter();

  // Thêm state để lưu ID của Announcement đang được mở rộng
  const [expandedAnnouncementId, setExpandedAnnouncementId] = React.useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthLabel = now.toLocaleString("en-US", { month: "long" });

  const yearStartStr = `${year}-01-01`;
  const yearEndStr = `${year}-12-31`;
  const today = React.useMemo(() => new Date(), []);

  // 1) Lịch
  const { data: scheduleRes } = useRequest(getMySchedule);
  const scheduleItems = React.useMemo(
    () => normalizeScheduleResponse(scheduleRes),
    [scheduleRes],
  );
  const todayMeetingsCount = React.useMemo(() => {
    const count = scheduleItems.filter((it: AnyScheduleItem) => {
      const type = String(it?.type ?? "").toUpperCase();
      if (type !== "BOOKING") return false;

      const start = new Date(it?.start_time ?? it?.startTime);
      const end = new Date(it?.end_time ?? it?.endTime);
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return false;

      const status = String(it?.status ?? "").toUpperCase();
      if (status === "CANCELLED") return false;

      return overlapsDay(start, end, today);
    }).length;
    return count;
  }, [scheduleItems, today]);

  // 2) Leave requests
  const { data: myLeaveRes } = useRequest(() =>
    myRequests({ page: 1, pageSize: 1000, fromDate: yearStartStr, toDate: yearEndStr }),
  );
  const myLeaveItems = React.useMemo(() => {
    const payload = (myLeaveRes as any)?.data ?? myLeaveRes;
    const items =
      (payload as any)?.items ??
      (payload as any)?.data?.items ??
      (payload as any)?.data?.data?.items;
    return Array.isArray(items) ? (items as any[]) : [];
  }, [myLeaveRes]);

  const leaveStats = React.useMemo(() => {
    let usedDays = 0;
    let pending = 0;
    for (const it of myLeaveItems) {
      const fromISO = normalizeToISODateOnly(it?.date_from);
      const toISO = normalizeToISODateOnly(it?.date_to);
      if (!fromISO || !toISO) continue;

      const status = String(it?.status ?? "").toUpperCase();
      if (status === "REJECTED") continue;

      usedDays += overlappedDaysInRange(fromISO, toISO, yearStartStr, yearEndStr);
      if (status === "PENDING" || status === "SUBMITTED") pending += 1;
    }
    return { usedDays, pending };
  }, [myLeaveItems, yearStartStr, yearEndStr]);

  // 3) Chấm công tháng
  const { data: monthlyAttendanceRes } = useRequest(() =>
    getMyAttendanceMonthlySummary({ year, month }),
  );
  const monthlyAttendance: MonthlyAttendanceSummaryDto | null =
    (monthlyAttendanceRes as any)?.data ?? null;

  // 4) Payslip tháng
  const { data: payrollRes } = useRequest(() => getMyPayrollByMonth({ year, month }));
  const payroll = React.useMemo(() => {
    const response = (payrollRes as any)?.data ?? payrollRes;
    const p = (response as any)?.data ?? response;
    return p && typeof p === "object" ? (p as any) : null;
  }, [payrollRes]);

  // 5) Announcements
  const { data: announcementsRes } = useRequest(() =>
    getListAnnouncement({ page: 1, pageSize: 20 }),
  );
  const announcements = React.useMemo(() => {
    const payload = (announcementsRes as any)?.data ?? announcementsRes;
    if (Array.isArray(payload)) return payload as any[];
    if (Array.isArray((payload as any)?.items)) return (payload as any).items as any[];
    if (Array.isArray((payload as any)?.data?.items)) return (payload as any).data.items as any[];
    if (Array.isArray((payload as any)?.data)) return (payload as any).data as any[];
    if (Array.isArray((payload as any)?.data?.data?.items)) return (payload as any).data.data.items as any[];
    return [] as any[];
  }, [announcementsRes]);

  const announcementsForWidget = React.useMemo(() => {
    const items = [...announcements];
    items.sort((a, b) => {
      const ap = Boolean((a as any)?.pinned);
      const bp = Boolean((b as any)?.pinned);
      if (ap !== bp) return ap ? -1 : 1;

      const ad = new Date((a as any)?.created_at ?? 0).getTime();
      const bd = new Date((b as any)?.created_at ?? 0).getTime();
      return (Number.isFinite(bd) ? bd : 0) - (Number.isFinite(ad) ? ad : 0);
    });

    return items.slice(0, 20).map((it) => {
      const title = String((it as any)?.title ?? "").trim();
      const content = String((it as any)?.content ?? "").trim();
      return {
        id: String((it as any)?.id ?? title),
        title: title || "(No title)",
        description: content || undefined,
        highlighted: Boolean((it as any)?.pinned),
      };
    });
  }, [announcements]);

  const payrollComputed = React.useMemo(() => {
    if (!payroll) return null;
    const basic = toNumber(payroll?.basicSalarySnapshot);
    const allowance = toNumber(payroll?.allowance);
    const gross = toNumber(payroll?.grossSalary);
    const insurance = toNumber(payroll?.insuranceAmount);
    const tax = toNumber(payroll?.taxAmount);
    const otherDeduction = toNumber(payroll?.deduction);
    const totalDeductions = insurance + tax + otherDeduction;
    const net = toNumber(payroll?.netSalary);
    return { basic, allowance, gross, totalDeductions, net };
  }, [payroll]);

  const quickActions = React.useMemo(
    () =>
      [
        { id: "leave", label: "Apply for Leave", href: "/user/request" },
        {
          id: "meetings",
          label: `Today's Meetings${todayMeetingsCount > 0 ? ` (${todayMeetingsCount})` : ""}`,
          href: "/user/calendar",
        },
        { id: "report", label: "Write a Report", href: "/user/reports" },
        { id: "payslip", label: "View Payslip", href: "/user/payroll" },
        { id: "profile", label: "Update Profile", href: "/user/profile" },
        { id: "events", label: "Events", href: "/user/forum" },
      ] as const,
    [todayMeetingsCount],
  );

  const leaveQuota = React.useMemo(
    () => ({ annual: 60, sick: 10, compassionate: 15 }),
    [],
  );
  const leaveUsed = React.useMemo(
    () => ({ annual: leaveStats.usedDays, sick: 0, compassionate: 0 }),
    [leaveStats.usedDays],
  );

  const attendanceRows = React.useMemo(() => {
    if (!monthlyAttendance) return null;
    const required = toNumber(monthlyAttendance.requiredWorkingDays);
    const worked = toNumber(monthlyAttendance.workedDays);
    const enough = toNumber(monthlyAttendance.enoughDays);
    const late = toNumber(monthlyAttendance.lateDays);
    const absent = toNumber(monthlyAttendance.absentDays);
    const hours = toNumber(monthlyAttendance.totalWorkedHours);

    return [
      {
        title: `Tháng ${String(month).padStart(2, "0")}/${year}`,
        subtitle: `Ngày công: ${worked}/${required}`,
        status: worked >= required && required > 0 ? "Đủ" : "Chưa đủ",
        type: worked >= required && required > 0 ? "success" : "warning",
      },
      {
        title: `Đủ công: ${enough} ngày`,
        subtitle: "Số ngày đạt yêu cầu",
        status: enough > 0 ? "OK" : "-",
        type: enough > 0 ? "success" : "neutral",
      },
      {
        title: `Đi muộn: ${late} ngày`,
        subtitle: "Tổng ngày đi muộn trong tháng",
        status: late > 0 ? "Cần chú ý" : "Tốt",
        type: late > 0 ? "warning" : "success",
      },
      {
        title: `Vắng: ${absent} ngày`,
        subtitle: "Tổng ngày vắng trong tháng",
        status: absent > 0 ? "Có vắng" : "Không",
        type: absent > 0 ? "warning" : "success",
      },
      {
        title: `Giờ làm: ${formatMoney(hours)}`,
        subtitle: "Tổng số giờ làm",
        status: "Giờ",
        type: "neutral",
      },
    ] as const;
  }, [monthlyAttendance, month, year]);

  return (
      <div className="p-4 space-y-5">
        <section>
          <h2 className="text-base font-semibold text-grey-900 mb-2">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="bg-white rounded-full px-4 py-1 h-auto text-xs font-normal text-grey-900 border-grey-50 hover:bg-neutral-background"
                onClick={() => router.push(action.href)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-60">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-3">
              Available Leave Days
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">Annual Leave</span>
                  <span className="text-sm text-muted-foreground">
                    {leaveUsed.annual} of {leaveQuota.annual} day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          leaveQuota.annual
                            ? (leaveUsed.annual / leaveQuota.annual) * 100
                            : 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">Sick Leave</span>
                  <span className="text-sm text-muted-foreground">
                    {leaveUsed.sick} of {leaveQuota.sick} day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          leaveQuota.sick
                            ? (leaveUsed.sick / leaveQuota.sick) * 100
                            : 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-grey-900">
                    Compassionate Leave
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {leaveUsed.compassionate} of {leaveQuota.compassionate} day(s)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                  <div
                    className="h-full bg-main-600 rounded-full"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          leaveQuota.compassionate
                            ? (leaveUsed.compassionate / leaveQuota.compassionate) * 100
                            : 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {leaveStats.pending > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Pending requests: {leaveStats.pending}
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50 flex flex-col">
            <h3 className="text-lg font-semibold text-grey-900 mb-3">
              Chấm công tháng này
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {(attendanceRows ??
                [
                  {
                    title: "Thứ 6, 17/04",
                    subtitle: "In: 07:58 — Out: 17:05",
                    status: "Đúng giờ",
                    type: "success",
                  },
                  {
                    title: "Thứ 5, 16/04",
                    subtitle: "In: 08:15 — Out: 17:00",
                    status: "Đi muộn",
                    type: "warning",
                  },
                  {
                    title: "Thứ 4, 15/04",
                    subtitle: "In: 07:50 — Out: 17:30",
                    status: "Đúng giờ",
                    type: "success",
                  },
                  {
                    title: "Thứ 3, 14/04",
                    subtitle: "In: 08:00 — Out: 17:00",
                    status: "Đúng giờ",
                    type: "success",
                  },
                  {
                    title: "Thứ 2, 13/04",
                    subtitle: "In: --:-- — Out: --:--",
                    status: "Nghỉ phép",
                    type: "neutral",
                  },
                ])
                .map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-grey-50 hover:border-main-600 transition-colors bg-white group cursor-default"
                >
                  <div>
                    <p className="text-sm font-medium text-grey-900 group-hover:text-main-600 transition-colors">
                      {log.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.subtitle}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-1 rounded-full ${
                      log.type === "success"
                        ? "bg-green-50 text-green-600"
                        : log.type === "warning"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-neutral-background text-muted-foreground"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-60">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
            <h3 className="text-lg font-semibold text-grey-900 mb-2">
              Announcement(s)
            </h3>
            {/* Thêm pb-2 để tránh việc đổ bóng của phần tử cuối cùng bị cắt mất do overflow */}
            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 pb-2">
              {announcementsForWidget.map((announcement) => {
                const isExpanded = expandedAnnouncementId === announcement.id;
                
                return (
                  <div
                    key={announcement.id}
                    onClick={() => setExpandedAnnouncementId(isExpanded ? null : announcement.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer shadow-md hover:shadow-lg ${
                      isExpanded || announcement.highlighted
                        ? "bg-main-50 border-main-600"
                        : "bg-white border-grey-50 hover:border-main-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-grey-900 font-medium">
                          {announcement.title}
                        </p>
                        
                        {/* Nội dung chi tiết chỉ hiển thị khi isExpanded = true */}
                        {isExpanded && announcement.description && (
                          <p className="text-sm text-main-600 mt-2">
                            {announcement.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Icon mũi tên sẽ xoay 90 độ cắm xuống dưới khi được mở rộng */}
                      <ChevronRight 
                        className={`w-4 h-4 text-grey-900 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50 overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold text-grey-900 mb-2">
              {monthLabel} Pay Slip Breakdown
            </h3>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-grey-50">
                    <th className="text-left py-2 px-2 font-medium text-grey-900">
                      Earnings
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Amount
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Deductions
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-grey-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-grey-50 bg-neutral-background">
                    <td className="py-2 px-2 text-grey-900">Basic Wage</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.basic) : "150,000"}
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">0</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.basic) : "150,000"}
                    </td>
                  </tr>
                  <tr className="border-b border-grey-50">
                    <td className="py-2 px-2 text-grey-900">Allowance</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.allowance) : "15,000"}
                    </td>
                    <td className="py-2 px-2 text-grey-900 text-right">0</td>
                    <td className="py-2 px-2 text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.allowance) : "15,000"}
                    </td>
                  </tr>
                  <tr className="bg-main-50">
                    <td className="py-2 px-2 font-semibold text-grey-900">
                      Total Earning
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.gross) : "150,000"}
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      {payrollComputed
                        ? formatMoneySigned(-payrollComputed.totalDeductions)
                        : "-50,000"}
                    </td>
                    <td className="py-2 px-2 font-semibold text-grey-900 text-right">
                      {payrollComputed ? formatMoney(payrollComputed.net) : "114,000"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
}