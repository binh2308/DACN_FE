"use client";

import { EllipsisVertical } from "lucide-react";
import { DonutChart } from "@mantine/charts";
import { StatCard } from "@/components/StatCard";
import { useEffect, useMemo, useState } from "react";
import { useRequest } from "ahooks";

import { getEmployees, type EmployeeDto } from "@/services/DACN/employee";
import { extractEmployeesFromResponseData } from "@/lib/employee-ui";
import { getDepartmentLeaveRequests } from "@/services/DACN/request";
import { getManagementTickets } from "@/services/DACN/Tickets";
import { getBookings, type BookingByRoom } from "@/services/DACN/Booking";

function toISODate(d: Date) {
  // Trích xuất YYYY-MM-DD chuẩn theo giờ Việt Nam (Local Time)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(base: Date) {
  const d = new Date(base);
  const day = d.getDay(); // 0=Sun, 1=Mon
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

function overlappedLeaveDaysInRange(
  fromISO: string,
  toISO: string,
  rangeFromISO: string,
  rangeToISO: string,
): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromISO)) return 0;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(toISO)) return 0;
  const effectiveFrom = fromISO < rangeFromISO ? rangeFromISO : fromISO;
  const effectiveTo = toISO > rangeToISO ? rangeToISO : toISO;
  if (effectiveFrom > effectiveTo) return 0;
  return daysInclusiveBetweenISO(effectiveFrom, effectiveTo);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildRoomHeatmap(bookings: BookingByRoom[], weekStart: Date) {
  const weekDays = ["T2", "T3", "T4", "T5", "T6"]; // Mon-Fri
  const hourLabels = Array.from({ length: 10 }, (_, i) => 8 + i); // 8..17

  const counts: number[][] = hourLabels.map(() => Array(weekDays.length).fill(0));

  for (const b of bookings || []) {
    const start = pickBookingStart(b);
    const end = pickBookingEnd(b) ?? (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
    if (!start || !end) continue;

    const day = start.getDay();
    if (day < 1 || day > 5) continue; // Mon-Fri

    // Chỉ thống kê trong tuần hiện tại
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + (day - 1));
    const dayEnd = addDays(dayStart, 1);
    if (end <= dayStart || start >= dayEnd) continue;

    const dayIndex = day - 1; // 0..4

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

  const ymKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const lateStorageKey = `manager_late_fines_v1_${ymKey}`;

  const [lateHoursByEmployee, setLateHoursByEmployee] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lateStorageKey);
      if (!raw) {
        setLateHoursByEmployee({});
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        setLateHoursByEmployee({});
        return;
      }

      // Backward-compatible: có thể lưu dạng { id: { lateHours, status } } từ bản trước
      const next: Record<string, number> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, any>)) {
        if (typeof v === "number") next[k] = v;
        else if (v && typeof v === "object") next[k] = Number(v.lateHours ?? 0) || 0;
        else next[k] = 0;
      }
      setLateHoursByEmployee(next);
    } catch {
      setLateHoursByEmployee({});
    }
  }, [lateStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(lateStorageKey, JSON.stringify(lateHoursByEmployee));
    } catch {
      // ignore
    }
  }, [lateStorageKey, lateHoursByEmployee]);

  // 1) Tổng nhân viên
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

  // 2) Nghỉ phép hôm nay (department)
  const { data: leaveTodayRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 500,
      fromDate: todayStr,
      toDate: todayStr,
    }),
  );
  const leaveTodayItems = leaveTodayRes?.data?.items ?? [];
  const absentToday = useMemo(() => {
    // Count các đơn có khoảng ngày bao phủ hôm nay, loại REJECTED
    return leaveTodayItems.filter((it: any) => {
      const from = String(it?.date_from ?? "");
      const to = String(it?.date_to ?? "");
      const status = String(it?.status ?? "").toUpperCase();
      const overlaps = from <= todayStr && todayStr <= to;
      return overlaps && status !== "REJECTED";
    }).length;
  }, [leaveTodayItems, todayStr]);

  // 3) Đơn nghỉ phép đang chờ duyệt (department)
  const { data: leaveMonthRes } = useRequest(() =>
    getDepartmentLeaveRequests({
      page: 1,
      pageSize: 1000,
      fromDate: toISODate(monthStart),
      toDate: toISODate(monthEnd),
    }),
  );
  const leavePending = useMemo(() => {
    const items = leaveMonthRes?.data?.items ?? [];
    return items.filter((it: any) => {
      const s = String(it?.status ?? "").toUpperCase();
      return s === "PENDING" || s === "SUBMITTED";
    }).length;
  }, [leaveMonthRes]);

  // 4) Tickets chưa xử lý = OPEN + IN_PROGRESS
  const { data: ticketsOpenRes } = useRequest(() =>
    getManagementTickets({ status: "OPEN", page: 1, limit: 1 }),
  );
  const { data: ticketsInProgressRes } = useRequest(() =>
    getManagementTickets({ status: "IN_PROGRESS", page: 1, limit: 1 }),
  );
  const ticketsUnresolved =
    (ticketsOpenRes?.total ?? 0) + (ticketsInProgressRes?.total ?? 0);

  // 5) Bookings để dựng heatmap
  const { data: bookingsRes } = useRequest(() => getBookings());
  const bookings = (bookingsRes?.data ?? []) as BookingByRoom[];
  const heatmap = useMemo(() => buildRoomHeatmap(bookings, weekStart), [bookings, weekStart]);

  const stats = useMemo(
    () => [
      {
        title: "Tổng nhân viên",
        value: genderCounts.total,
        change: "0%",
        isPositive: true,
      },
      {
        title: "Vắng/ nghỉ phép hôm nay",
        value: absentToday,
        change: "0%",
        isPositive: true,
      },
      {
        title: "Ticket chưa xử lý",
        value: ticketsUnresolved,
        change: "0%",
        isPositive: false,
      },
      {
        title: "Đơn phép đang chờ duyệt",
        value: leavePending,
        change: "0%",
        isPositive: true,
      },
    ],
    [genderCounts.total, absentToday, ticketsUnresolved, leavePending],
  );

  const getHeatmapColor = (val: number) => {
    if (val <= 0) return "#F3F4F6";
    if (val === 1) return "#D1FAE5";
    if (val === 2) return "#6EE7B7";
    if (val === 3) return "#34D399";
    if (val === 4) return "#10B981";
    return "#0B9F57";
  };

  const monthStartStr = useMemo(() => toISODate(monthStart), [monthStart]);
  const monthEndStr = useMemo(() => toISODate(monthEnd), [monthEnd]);

  const leaveMonthStatsByEmployeeId = useMemo(() => {
    const items = (leaveMonthRes?.data?.items ?? []) as any[];
    const daysById: Record<string, number> = {};
    const pendingById: Record<string, number> = {};

    for (const it of items) {
      const empId = String(it?.employee?.id ?? "");
      if (!empId) continue;

      const from = String(it?.date_from ?? "");
      const to = String(it?.date_to ?? "");
      const status = String(it?.status ?? "").toUpperCase();
      if (status === "REJECTED") continue;

      const days = overlappedLeaveDaysInRange(from, to, monthStartStr, monthEndStr);
      if (days > 0) daysById[empId] = (daysById[empId] ?? 0) + days;

      if (status === "PENDING" || status === "SUBMITTED") {
        pendingById[empId] = (pendingById[empId] ?? 0) + 1;
      }
    }

    return { daysById, pendingById };
  }, [leaveMonthRes, monthStartStr, monthEndStr]);

  const absentTodayByEmployeeId = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const it of leaveTodayItems as any[]) {
      const empId = String(it?.employee?.id ?? "");
      if (!empId) continue;

      const from = String(it?.date_from ?? "");
      const to = String(it?.date_to ?? "");
      const status = String(it?.status ?? "").toUpperCase();
      const overlaps = from <= todayStr && todayStr <= to;
      if (overlaps && status !== "REJECTED") map[empId] = true;
    }
    return map;
  }, [leaveTodayItems, todayStr]);

  const editLateHours = (employeeId: string, employeeName: string) => {
    const current = lateHoursByEmployee[employeeId] ?? 0;
    const raw = window.prompt(
      `Nhập số giờ đi muộn của "${employeeName}" (giờ).`,
      String(current),
    );
    if (raw == null) return;
    const next = Number(raw);
    if (!Number.isFinite(next) || next < 0) {
      alert("Số giờ không hợp lệ");
      return;
    }

    setLateHoursByEmployee((prev) => ({
      ...prev,
      [employeeId]: next,
    }));
  };

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
              <DonutChart
                size={140}
                thickness={22}
                data={[
                  { name: "Nam", value: genderCounts.male, color: "green" },
                  { name: "Nữ", value: genderCounts.female, color: "violet" },
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
              {/* Trục X: Khung giờ */}
              <div className="flex w-full mb-1">
                <div className="w-6"></div>
                <div className="flex-1 flex justify-between text-[10px] text-[#B8BDC5] px-1 leading-[140%] tracking-[0.12px]">
                  {heatmap.hourLabels.filter(h => h % 2 === 0).map(h => (
                    <span key={h}>{h}h</span>
                  ))}
                </div>
              </div>
              
              {/* Lưới Heatmap */}
              <div className="flex flex-col gap-1 w-full">
                {heatmap.weekDays.map((d, di) => (
                  <div key={d} className="flex items-center gap-1">
                    {/* Trục Y: Thứ */}
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

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 w-full justify-end">
                <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                  Trống
                </span>
                <div className="flex gap-0.5">
                  {/* Truyền trực tiếp các số lượng phòng từ 0 đến 5 vào thay vì tính tỷ lệ t */}
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
              <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                Tip: bấm vào số giờ để nhập.
              </div>
            </div>
            <button className="text-[#21252B] hover:text-[#0B9F57]" type="button">
              <EllipsisVertical />
            </button>
          </div>

          <div className="mb-2">
            <div className="grid grid-cols-4 gap-3 text-[10px] font-semibold text-[#B8BDC5] uppercase pb-2 border-b border-[#E9EAEC] leading-[140%] tracking-[0.12px]">
              <div>Nhân viên</div>
              <div className="text-center">Số giờ đi muộn</div>
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

                const lateHours = lateHoursByEmployee[e.id] ?? 0;
                const leaveDaysMonth = leaveMonthStatsByEmployeeId.daysById[e.id] ?? 0;
                const pendingCount = leaveMonthStatsByEmployeeId.pendingById[e.id] ?? 0;
                const isAbsentToday = Boolean(absentTodayByEmployeeId[e.id]);

                const todayBadgeClass = isAbsentToday
                  ? "bg-[#FEE2E2] text-[#991B1B]"
                  : "bg-[#D1FAE5] text-[#065F46]";

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
                      <button
                        type="button"
                        onClick={() => editLateHours(e.id, displayName)}
                        className="px-2 py-1 rounded-md hover:bg-gray-50"
                        title="Chỉnh sửa"
                      >
                        {lateHours}
                      </button>
                    </div>

                    <div className="flex flex-col items-center justify-center text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                      <div>{leaveDaysMonth}</div>
                      {pendingCount > 0 ? (
                        <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                          ({pendingCount} chờ duyệt)
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-[140%] tracking-[0.12px] ${todayBadgeClass}`}
                      >
                        {isAbsentToday ? "Nghỉ" : "Đi làm"}
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
