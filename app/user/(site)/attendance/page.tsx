"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Bell, Check, LogOut, Mail, MapPin, Search } from "lucide-react";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getMonthlySummary,
} from "@/services/DACN/attendance";
import { formatDate } from "@/lib/utils";


function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getDaysInCurrentMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// function formatHHmm(d: Date) {
//   return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
// }

// function formatDateTime(d: Date) {
//   return `${pad2(d.getHours())}:${pad2(d.getMinutes())} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
// }

function formatDuration(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${pad2(h)}:${pad2(m)}`;
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

function MonthlyTrendChart({ data }: { data: TrendRow[] }) {
  // Cấu hình các mốc trục Y cố định theo thiết kế (0, 6, 12, 18, 24)
  const ticks = [24, 18, 12, 6, 0];
  const maxVal = 24;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header: Title & Legend */}
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

      {/* Chart Area */}
      <div className="relative pl-8"> {/* pl-8 để dành chỗ cho label trục Y */}
        <div className="relative h-[220px] w-full">
          
          {/* Grid Lines & Y-Axis Labels */}
          {ticks.map((tick, index) => {
            // Tính toán vị trí top (%) cho từng dòng kẻ
            const topPerc = (index / (ticks.length - 1)) * 100;
            return (
              <div 
                key={tick} 
                className="absolute w-full flex items-center" 
                style={{ top: `${topPerc}%` }}
              >
                {/* Label trục Y (nằm bên trái chart area) */}
                <div className="absolute right-full mr-3 text-[10px] text-[#B8BDC5] -translate-y-1/2">
                  {tick}
                </div>
                {/* Đường kẻ ngang */}
                <div className="w-full h-[1px] bg-[#F0F1F2]" />
              </div>
            );
          })}

          {/* Bars Container */}
          <div className="absolute inset-0 flex items-end justify-around px-4 sm:px-8 pt-2">
            {data.map((row) => (
              <div key={row.month} className="flex flex-col justify-end items-center h-full w-full max-w-[12%] sm:max-w-[15%]">
                <div className="w-full flex items-end justify-center gap-[2px] h-full relative z-10">
                  {/* Present Bar */}
                  <div 
                    className="w-1/3 bg-[#1F4FBF] rounded-t-[2px] transition-all hover:opacity-90" 
                    style={{ height: `${(row.present / maxVal) * 100}%` }} 
                    title={`Present: ${row.present}`}
                  />
                  {/* Absent Bar */}
                  <div 
                    className="w-1/3 bg-[#FF7A7A] rounded-t-[2px] transition-all hover:opacity-90" 
                    style={{ height: `${(row.absent / maxVal) * 100}%` }} 
                    title={`Absent: ${row.absent}`}
                  />
                  {/* Late Bar */}
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

        {/* X-Axis Labels */}
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
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkedoutToday, setCheckedOutToday] = useState(false);
  const [checkedInAt, setCheckedInAt] = useState<Date | null>(null);
  const [monthlySummary, setMonthlySummary] = useState({
    workedDays: 0,
    lateDays: 0,
    absentDays: 0,
  });
  const handleCheckIn = async () => {
    await checkIn();
    setCheckedInAt(new Date());
  };
  const handleCheckOut = async () => {
    await checkOut();
  };
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await getMyAttendance();
        const records = res.data;
        const todayVN = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        if (records) console.log("Fetched attendance records:", records);
        const hasCheckedInToday = records.some((item) => {
          const timeInVN = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.timeIn));
          // console.log(
          //   "Comparing check-in date:",
          //   timeInVN,
          //   "with today:",
          //   todayVN,
          // );
          return timeInVN === todayVN;
        });
        const hasCheckedOutToday = records.some((item) => {
          const timeOutVN = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(item.timeOut));
          return timeOutVN === todayVN;
        });
        setCheckedInToday(hasCheckedInToday);
        setCheckedOutToday(hasCheckedOutToday);
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      }
    };
    fetchAttendance();
  }, []);
  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        const now = new Date();
        const res = await getMonthlySummary({
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });
        setMonthlySummary(res.data);
      } catch (error) {
        console.error("Failed to fetch monthly summary:", error);
      }
    };
    fetchMonthlySummary();
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currentTime = formatDate(now, "HH:mm DD/MM/YYYY");
  const working = checkedInAt ? formatDuration(now.getTime() - checkedInAt.getTime()) : "00:00";

  const trend: TrendRow[] = [
    { month: "Jul", present: 23, absent: 1, late: 15 },
    { month: "Aug", present: 24, absent: 2, late: 16 },
    { month: "Sep", present: 24, absent: 1, late: 16 },
    { month: "Oct", present: 24, absent: 2, late: 17 },
  ];

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
              className={[
                "rounded-xl px-3 py-4 border text-center transition-colors",
                checkedInAt || checkedInToday
                  ? "bg-[#F5F6F7] border-[#E9EAEC] text-[#B8BDC5]"
                  : "bg-white border-[#E9EAEC] text-[#21252B] hover:border-[#0B9F57]",
              ].join(" ")}
            >
              <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-[#F0FFF7] flex items-center justify-center">
                <Check className="text-[#0B9F57]" size={18} />
              </div>
              <div className="text-[10px] font-semibold leading-[140%] tracking-[0.12px]">
                Check In
              </div>
              <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                {checkedInToday
                  ? "You have checked in today"
                  : checkedInAt
                    ? `Checked in at ${formatDate(checkedInAt, "HH:mm")}`
                    : "08:00 AM"}
              </div>
            </button>

            <div className="rounded-xl px-3 py-4 border border-[#E9EAEC] bg-[#F5F6F7] text-center">
              <div className="mx-auto mb-2 h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                <AlarmClock className="text-[#FF8A00]" size={18} />
              </div>
              <div className="text-[10px] font-semibold leading-[140%] tracking-[0.12px]">
                Giờ làm việc
              </div>
              <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                {working}
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckOut}
            disabled={!checkedInAt || checkedoutToday}
            className={[
              "mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors",
              checkedInAt || checkedoutToday
                ? "bg-[#FF5A5A] hover:opacity-95"
                : "bg-[#FF5A5A]/40 cursor-not-allowed",
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <LogOut size={16} />
              Check Out
            </span>
          </button>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
            <MapPin size={14} />
            Location: Hall A
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
            {formatDate(new Date(), "MMMM YYYY")} Summary
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatBox
              value={String(monthlySummary.workedDays)}
              label="Days Present"
              valueClassName="text-[#0B9F57]"
            />
            <StatBox
              value={String(monthlySummary.absentDays)}
              label="Days Absent"
              valueClassName="text-[#FF5A5A]"
            />
            <StatBox
              value={String(monthlySummary.lateDays)}
              label="Late Arrivals"
              valueClassName="text-[#FF8A00]"
            />
            <StatBox
              value={`${((monthlySummary.absentDays / getDaysInCurrentMonth()) * 100).toFixed(1)}%`}
              label="Attendance Rate"
              valueClassName="text-[#06B6D4]"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Chart */}
      <MonthlyTrendChart data={trend} />
    </div>
  );
}