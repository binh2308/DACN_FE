"use client";

import { useEffect, useState } from "react";
import { AlarmClock, Check, LogOut, MapPin } from "lucide-react";
import {
  checkIn,
  checkOut,
  getMyAttendanceMonthlySummary,
  type MonthlyAttendanceSummaryDto,
} from "@/services/DACN/attendance";

const STORAGE_KEY = "attendance.active";

// Hàm xử lý riêng cho API: Cắt bỏ ký tự Z (UTC) bị backend gắn thừa
function parseApiDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  // Loại bỏ 'Z' hoặc '+00:00' để trình duyệt hiểu đây là giờ Local (VN)
  const cleanValue = value.replace(/Z$/, '').replace(/\+00:00$/, '');
  const d = new Date(cleanValue);
  return Number.isFinite(d.getTime()) ? d : null;
}

function pickTimeIn(data: any): string | null {
  return (data?.TimeIn ?? data?.timeIn ?? data?.time_in ?? null) as string | null;
}

function pickTimeOut(data: any): string | null {
  return (data?.TimeOut ?? data?.timeOut ?? data?.time_out ?? null) as string | null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHHmm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Bổ sung thêm giây (seconds) để thấy thời gian thực đang nhảy
function formatDuration(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function StatBox({ value, label, valueClassName }: { value: string; label: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-[#E9EAEC] bg-white px-3 py-3">
      <div className={`text-lg font-semibold leading-[150%] tracking-[0.08px] ${valueClassName ?? "text-[#21252B]"}`}>
        {value}
      </div>
      <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">{label}</div>
    </div>
  );
}

type TrendRow = { month: string; present: number; absent: number; late: number };

function toYearMonth(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function shiftYearMonth(base: { year: number; month: number }, deltaMonths: number) {
  const d = new Date(base.year, base.month - 1 + deltaMonths, 1);
  return toYearMonth(d);
}

function monthShortLabel(ym: { year: number; month: number }) {
  return new Date(ym.year, ym.month - 1, 1).toLocaleString("en-US", { month: "short" });
}

function monthLongLabel(ym: { year: number; month: number }) {
  return new Date(ym.year, ym.month - 1, 1).toLocaleString("en-US", { month: "long" });
}

function buildTrendSkeleton(ym: { year: number; month: number }): TrendRow[] {
  return [-3, -2, -1, 0].map((offset) => {
    const itemYm = shiftYearMonth(ym, offset);
    return { month: monthShortLabel(itemYm), present: 0, absent: 0, late: 0 };
  });
}

function MonthlyTrendChart({ data }: { data: TrendRow[] }) {
  const computedMax = Math.max(0, ...data.map((r) => Math.max(r.present, r.absent, r.late)));
  const niceMax = Math.max(24, Math.ceil((computedMax || 24) / 6) * 6);
  const maxVal = niceMax || 24;
  const ticks = [niceMax, Math.round(niceMax * 0.75), Math.round(niceMax * 0.5), Math.round(niceMax * 0.25), 0];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
          Monthly Attendance Trend
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#1F4FBF]" />
            <span className="text-xs text-[#21252B] font-medium">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#FF7A7A]" />
            <span className="text-xs text-[#21252B] font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#21B099]" />
            <span className="text-xs text-[#21252B] font-medium">Late</span>
          </div>
        </div>
      </div>

      <div className="relative pl-8"> 
        <div className="relative h-[220px] w-full">
          {ticks.map((tick, index) => {
            const topPerc = (index / (ticks.length - 1)) * 100;
            return (
              <div 
                key={tick} 
                className="absolute w-full flex items-center" 
                style={{ top: `${topPerc}%` }}
              >
                <div className="absolute right-full mr-3 text-[10px] text-[#B8BDC5] -translate-y-1/2">
                  {tick}
                </div>
                <div className="w-full h-[1px] bg-[#F0F1F2]" />
              </div>
            );
          })}

          <div className="absolute inset-0 flex items-end justify-around px-4 sm:px-8 pt-2">
            {data.map((row) => (
              <div key={row.month} className="flex flex-col justify-end items-center h-full w-full max-w-[12%] sm:max-w-[15%]">
                <div className="w-full flex items-end justify-center gap-[2px] h-full relative z-10">
                  <div 
                    className="w-1/3 bg-[#1F4FBF] rounded-t-[2px] transition-all hover:opacity-90" 
                    style={{ height: `${(row.present / maxVal) * 100}%` }} 
                    title={`Present: ${row.present}`}
                  />
                  <div 
                    className="w-1/3 bg-[#FF7A7A] rounded-t-[2px] transition-all hover:opacity-90" 
                    style={{ height: `${(row.absent / maxVal) * 100}%` }} 
                    title={`Absent: ${row.absent}`}
                  />
                  <div 
                    className="w-1/3 bg-[#21B099] rounded-t-[2px] transition-all hover:opacity-90" 
                    style={{ height: `${(row.late / maxVal) * 100}%` }} 
                    title={`Late: ${row.late}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-around px-4 sm:px-8">
           {data.map((row) => (
              <div key={row.month} className="w-full max-w-[12%] sm:max-w-[15%] text-center text-[10px] text-[#B8BDC5]">
                  {row.month}
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

export default function ManagerCheckInPage() {
  const [now, setNow] = useState(() => new Date());
  const [currentYm, setCurrentYm] = useState(() => toYearMonth(new Date()));
  const [checkedInAt, setCheckedInAt] = useState<Date | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [monthlySummary, setMonthlySummary] = useState<MonthlyAttendanceSummaryDto | null>(null);
  const [trend, setTrend] = useState<TrendRow[]>(() => buildTrendSkeleton(toYearMonth(new Date())));

  // Interval chạy mỗi 1 giây để cập nhật thời gian thực
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cập nhật tháng/năm hiện tại (chỉ setState khi đổi tháng)
  useEffect(() => {
    const next = toYearMonth(now);
    setCurrentYm((prev) => (prev.year === next.year && prev.month === next.month ? prev : next));
  }, [now]);

  // Khôi phục trạng thái Check-in từ LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      
      // Dùng timestamp (số) để không bao giờ bị lệch múi giờ khi reload trang
      if (parsed?.timestamp) {
        setCheckedInAt(new Date(parsed.timestamp));
        if (parsed?.id) setAttendanceId(String(parsed.id));
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Load attendance summary tháng này + trend 4 tháng gần nhất
  useEffect(() => {
    let cancelled = false;

    setTrend(buildTrendSkeleton(currentYm));

    async function run() {
      try {
        const res = await getMyAttendanceMonthlySummary({ year: currentYm.year, month: currentYm.month });
        if (!cancelled && res?.statusCode === 200 && res.data) {
          setMonthlySummary(res.data);
        } else if (!cancelled) {
          setMonthlySummary(null);
        }
      } catch {
        if (!cancelled) setMonthlySummary(null);
      }

      const yms = [-3, -2, -1, 0].map((offset) => shiftYearMonth(currentYm, offset));

      try {
        const results = await Promise.all(
          yms.map(async (ym) => {
            try {
              const res = await getMyAttendanceMonthlySummary({ year: ym.year, month: ym.month });
              if (res?.statusCode === 200 && res.data) return res.data;
              return null;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;

        const rows: TrendRow[] = results.map((dto, idx) => {
          const ym = yms[idx];
          return {
            month: monthShortLabel(ym),
            present: dto?.enoughDays ?? 0,
            absent: dto?.absentDays ?? 0,
            late: dto?.lateDays ?? 0,
          };
        });

        setTrend(rows);
      } catch {
        if (!cancelled) setTrend(buildTrendSkeleton(currentYm));
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [currentYm.year, currentYm.month, refreshKey]);

  const currentTime = formatHHmm(now);
  
  // Tính toán giờ làm việc theo thời gian thực (hiển thị HH:mm:ss)
  const working = checkedInAt ? formatDuration(now.getTime() - checkedInAt.getTime()) : "00:00:00";

  const canCheckIn = !checkedInAt && !isCheckingIn && !isCheckingOut;
  const canCheckOut = !!checkedInAt && !isCheckingIn && !isCheckingOut;

  const handleCheckIn = async () => {
    if (!canCheckIn) return;
    setApiMessage(null);
    setIsCheckingIn(true);
    try {
      const res = await checkIn();
      if (!res?.success) {
        throw new Error(res?.message || "Check in failed");
      }
      
      // Lấy thời gian từ API và sử dụng parseApiDate để xử lý lỗi UTC
      const timeInRaw = pickTimeIn(res.data) ?? pickTimeIn((res as any)?.data);
      const timeIn = parseApiDate(timeInRaw) ?? new Date();

      const id = (res.data as any)?.id ?? (res as any)?.data?.id ?? null;
      setAttendanceId(id);
      setCheckedInAt(timeIn);

      // Lưu lại timestamp thay vì ISO string để tránh lỗi múi giờ khi f5
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, timestamp: timeIn.getTime() }));
      } catch {
        // ignore storage errors
      }
      setApiMessage(res.message || "Checked in successfully");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      const message = (error as any)?.response?.data?.message || (error as any)?.message || "Check in failed";
      setApiMessage(String(message));
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!canCheckOut) return;
    setApiMessage(null);
    setIsCheckingOut(true);
    try {
      const res = await checkOut();
      if (!res?.success) {
        throw new Error(res?.message || "Check out failed");
      }
      const timeOutRaw = pickTimeOut(res.data) ?? pickTimeOut((res as any)?.data);
      const timeOut = parseApiDate(timeOutRaw);

      setAttendanceId((prev) => (res.data as any)?.id ?? prev);
      setCheckedInAt(null);
      
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }

      if (timeOut) {
        setApiMessage(`${res.message || "Checked out successfully"} (${formatHHmm(timeOut)})`);
      } else {
        setApiMessage(res.message || "Checked out successfully");
      }
      setRefreshKey((k) => k + 1);
    } catch (error) {
      const message = (error as any)?.response?.data?.message || (error as any)?.message || "Check out failed";
      setApiMessage(String(message));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const summary = (() => {
    const monthTitle = `${monthLongLabel(currentYm)} ${currentYm.year} Summary`;
    const present = monthlySummary?.enoughDays ?? 0;
    const absent = monthlySummary?.absentDays ?? 0;
    const late = monthlySummary?.lateDays ?? 0;
    const rate =
      monthlySummary?.requiredWorkingDays && monthlySummary.requiredWorkingDays > 0
        ? ((monthlySummary?.workedDays ?? present + late) / monthlySummary.requiredWorkingDays) * 100
        : 0;
    return { monthTitle, present, absent, late, rate };
  })();

  return (
    <div className="p-4 space-y-3">
      {/* Title */}
      <div>
        <div className="text-lg font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
          Attendance Tracking
        </div>
        <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
          Monitor your daily attendance and working hours
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Today's Attendance */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
            Today&apos;s Attendance
          </div>

          <div className="mt-3 text-center">
            <div className="text-2xl font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
              {currentTime}
            </div>
            <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
              Current time
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              className={[
                "rounded-xl px-3 py-4 border text-center transition-colors",
                checkedInAt ? "bg-[#F5F6F7] border-[#E9EAEC] text-[#B8BDC5]" : "bg-white border-[#E9EAEC] text-[#21252B] hover:border-[#0B9F57]",
                !canCheckIn ? "cursor-not-allowed" : "",
              ].join(" ")}
            >
              <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-[#F0FFF7] flex items-center justify-center">
                <Check className="text-[#0B9F57]" size={18} />
              </div>
              <div className="text-[10px] font-semibold leading-[140%] tracking-[0.12px]">Check In</div>
              <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                {isCheckingIn ? "Đang check in..." : checkedInAt ? formatHHmm(checkedInAt) : "08:00 AM"}
              </div>
            </button>

            <div className="rounded-xl px-3 py-4 border border-[#E9EAEC] bg-[#F5F6F7] text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <AlarmClock className="text-[#FF8A00]" size={18} />
              </div>
              <div className="text-[10px] font-semibold leading-[140%] tracking-[0.12px]">Giờ làm việc</div>
              <div className="text-[12px] font-bold text-[#FF8A00] leading-[140%] tracking-[0.12px] mt-1">
                {working}
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckOut}
            disabled={!canCheckOut}
            className={[
              "mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors",
              canCheckOut ? "bg-[#FF5A5A] hover:opacity-95" : "bg-[#FF5A5A]/40 cursor-not-allowed",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <LogOut size={16} />
              {isCheckingOut ? "Đang check out..." : "Check Out"}
            </span>
          </button>

          {apiMessage ? (
            <div className="mt-3 text-[10px] text-[#657081] leading-[140%] tracking-[0.12px]">
              {apiMessage}
              {attendanceId ? ` • ID: ${attendanceId}` : ""}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
            <MapPin size={14} />
            Location: Hall A
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
            {summary.monthTitle}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatBox value={String(summary.present)} label="Days Present" valueClassName="text-[#0B9F57]" />
            <StatBox value={String(summary.absent)} label="Days Absent" valueClassName="text-[#FF5A5A]" />
            <StatBox value={String(summary.late)} label="Late Arrivals" valueClassName="text-[#FF8A00]" />
            <StatBox value={`${summary.rate.toFixed(1)}%`} label="Attendance Rate" valueClassName="text-[#06B6D4]" />
          </div>
        </div>
      </div>

      {/* Row 2: Chart */}
      <MonthlyTrendChart data={trend} />
    </div>
  );
}