"use client";

import * as React from "react";
import { useRequest } from "ahooks";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

import { getMySchedule, type ScheduleItemDto } from "@/services/DACN/Management";

type AnyScheduleItem = ScheduleItemDto | any;

function normalizeScheduleResponse(data: unknown): AnyScheduleItem[] {
  if (!data) return [];
  const payload = (data as any)?.data ?? data;
  const items = (payload as any)?.items ?? (payload as any)?.data?.items;
  if (Array.isArray(items)) return items as AnyScheduleItem[];
  return [];
}

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => i);

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getMiniCalendarDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = getStartOfWeek(firstDayOfMonth);
  const endDate = new Date(getStartOfWeek(lastDayOfMonth));
  endDate.setDate(endDate.getDate() + 6);

  const days: Date[] = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

const EVENT_COLORS = {
  BOOKING: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  LEAVE_REQUEST: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
  },
} as const;

type CalendarEvent = {
  id: string;
  type: "BOOKING" | "LEAVE_REQUEST";
  title: string;
  subtitle?: string;
  status?: string;
  start: Date;
  end: Date;
  color: (typeof EVENT_COLORS)[keyof typeof EVENT_COLORS];
};

function overlapsDay(event: CalendarEvent, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return event.start < dayEnd && event.end > dayStart;
}

export default function EmployeeCalendarPage() {
  const [viewMode, setViewMode] = React.useState<"day" | "week">("week");
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = React.useState(new Date());
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    setMiniCalendarDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  const { data, loading } = useRequest(getMySchedule);
  const items = React.useMemo(() => normalizeScheduleResponse(data), [data]);

  const startOfWeekDate = getStartOfWeek(currentDate);
  const displayDays = React.useMemo(() => {
    if (viewMode === "day") return [currentDate];
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));
  }, [viewMode, currentDate, startOfWeekDate]);

  const handlePrevTime = () => setCurrentDate(addDays(currentDate, viewMode === "week" ? -7 : -1));
  const handleNextTime = () => setCurrentDate(addDays(currentDate, viewMode === "week" ? 7 : 1));

  const handlePrevMonth = () =>
    setMiniCalendarDate(new Date(miniCalendarDate.setMonth(miniCalendarDate.getMonth() - 1)));
  const handleNextMonth = () =>
    setMiniCalendarDate(new Date(miniCalendarDate.setMonth(miniCalendarDate.getMonth() + 1)));
  const handleSelectDate = (date: Date) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  const miniCalDays = React.useMemo(() => {
    return getMiniCalendarDays(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth());
  }, [miniCalendarDate]);

  const mappedEvents = React.useMemo<CalendarEvent[]>(() => {
    return items
      .map((it: AnyScheduleItem) => {
        const type = String(it?.type ?? "").toUpperCase();
        if (type !== "BOOKING" && type !== "LEAVE_REQUEST") return null;
        
        // FIX: Xử lý fallback key nếu Backend đổi tên trường
        const start = new Date(it.start_time ?? it.startTime);
        const end = new Date(it.end_time ?? it.endTime);
        
        // FIX: Loại bỏ các bản ghi bị lỗi định dạng ngày giờ để tránh sập UI
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

        const color = EVENT_COLORS[type as "BOOKING" | "LEAVE_REQUEST"] ?? EVENT_COLORS.BOOKING;
        
        // FIX: Mở rộng Fallback dữ liệu cho tiêu đề
        const rawTitle = String(it.title ?? it.purpose ?? it.name ?? "").trim();
        const rawSubtitle = String(it.subtitle ?? it.roomName ?? it.room?.name ?? "").trim();

        return {
          id: String(it.id ?? Math.random()),
          type: type as "BOOKING" | "LEAVE_REQUEST",
          title: rawTitle || (type === "BOOKING" ? "Cuộc họp" : "Nghỉ phép"),
          subtitle: rawSubtitle || undefined,
          status: String(it.status ?? "").trim() || undefined,
          start,
          end,
          color,
        } satisfies CalendarEvent;
      })
      .filter(Boolean) as CalendarEvent[];
  }, [items]);

  const today = new Date();
  const tomorrow = addDays(today, 1);

  const todayEvents = mappedEvents
    .filter((e) => overlapsDay(e, today))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const tomorrowEvents = mappedEvents
    .filter((e) => overlapsDay(e, tomorrow))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();
  const redLineTop = (currentHour * 60 + currentMin) * (80 / 60);
  const isCurrentView = displayDays.some((d) => isSameDay(d, today));

  return (
    <div className="flex h-full min-h-[calc(100vh-75px)] w-full bg-white font-sans overflow-hidden rounded-xl shadow-sm border border-gray-100">
      <aside className="w-[300px] flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full min-h-0">
        <div className="p-6 pb-2 shrink-0">
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-4 space-y-8 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                {miniCalendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex items-center gap-1 text-gray-400">
                <ChevronLeft
                  size={18}
                  className="cursor-pointer hover:text-gray-900 transition-colors"
                  onClick={handlePrevMonth}
                />
                <ChevronRight
                  size={18}
                  className="cursor-pointer hover:text-gray-900 transition-colors"
                  onClick={handleNextMonth}
                />
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-500 mb-2">
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
              <div>Su</div>
            </div>

            <div className="grid grid-cols-7 text-center text-sm gap-y-1">
              {miniCalDays.map((day, i) => {
                const isThisMonth = day.getMonth() === miniCalendarDate.getMonth();
                const isSelected = isSameDay(day, currentDate);
                const isTodayLocal = isSameDay(day, today);

                let baseClass =
                  "h-8 w-8 mx-auto flex items-center justify-center rounded-full cursor-pointer transition-colors text-xs ";

                if (isSelected) {
                  baseClass += "bg-[#0B9F57] text-white font-bold shadow-md";
                } else if (isTodayLocal) {
                  baseClass += "text-[#0B9F57] font-bold bg-green-50 hover:bg-green-100";
                } else if (!isThisMonth) {
                  baseClass += "text-gray-300 hover:bg-gray-50";
                } else {
                  baseClass += "text-gray-700 font-medium hover:bg-gray-100";
                }

                return (
                  <div key={i} className={baseClass} onClick={() => handleSelectDate(day)}>
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Hôm nay</h3>
            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Không có lịch</p>
              ) : null}
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.color.dot}`}></span>
                    <span className="text-gray-700 truncate font-medium group-hover:text-black">
                      {event.title}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    {formatTime(event.start)}-{formatTime(event.end)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Ngày mai</h3>
            <div className="space-y-3">
              {tomorrowEvents.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Không có lịch</p>
              ) : null}
              {tomorrowEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm group">
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.color.dot}`}></span>
                    <span className="text-gray-700 truncate font-medium group-hover:text-black">
                      {event.title}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                    {formatTime(event.start)}-{formatTime(event.end)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white overflow-hidden min-w-0 h-full">
        <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <button
                onClick={handlePrevTime}
                className="p-1 rounded hover:bg-gray-100 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextTime}
                className="p-1 rounded hover:bg-gray-100 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {viewMode === "day"
                ? currentDate.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h2>
          </div>

          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100 text-sm font-medium">
            <button
              onClick={() => setViewMode("week")}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white text-[#0B9F57] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-4 py-1.5 rounded-md transition-colors ${
                viewMode === "day"
                  ? "bg-white text-[#0B9F57] shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Day
            </button>
          </div>
        </header>

        {loading && !data && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B9F57]"></div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col relative">
          <div className="flex border-b border-gray-100 sticky top-0 bg-white z-30 shadow-sm">
            <div className="w-20 flex-shrink-0 border-r border-gray-100 flex items-center justify-center bg-white">
              <Clock size={16} className="text-gray-300" />
            </div>

            <div
              className={`flex-1 grid ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"} bg-white`}
            >
              {displayDays.map((day, i) => {
                const isTodayLocal = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center py-3 border-r border-gray-100 last:border-r-0 ${
                      isTodayLocal ? "bg-[#F0FFF7]" : ""
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold tracking-wider mb-1 ${
                        isTodayLocal ? "text-[#0B9F57]" : "text-gray-400"
                      }`}
                    >
                      {DAYS_OF_WEEK[day.getDay()]}
                    </span>
                    <span
                      className={`text-xl font-semibold ${
                        isTodayLocal ? "text-[#0B9F57]" : "text-gray-800"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-1 relative">
            <div className="w-20 flex-shrink-0 border-r border-gray-100 bg-white z-20">
              {HOURS_OF_DAY.map((hour) => (
                <div key={hour} className="h-[80px] relative border-b border-gray-50">
                  <span className="absolute -top-3 w-full text-center text-xs font-medium text-gray-400 bg-white">
                    {hour.toString().padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            <div className={`flex-1 grid ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"} relative`}>
              <div className="absolute inset-0 pointer-events-none flex flex-col">
                {HOURS_OF_DAY.map((hour) => (
                  <div key={hour} className="h-[80px] border-b border-gray-100 w-full shrink-0"></div>
                ))}
              </div>

              {displayDays.map((day, colIndex) => {
                const isTodayLocal = isSameDay(day, today);
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);

                const dayEvents = mappedEvents.filter((e) => overlapsDay(e, day));

                return (
                  <div
                    key={colIndex}
                    className={`relative border-r border-gray-100 last:border-r-0 ${
                      isTodayLocal ? "bg-[#F0FFF7]/30" : ""
                    }`}
                  >
                    {dayEvents.map((event) => {
                      const segmentStart = event.start > dayStart ? event.start : dayStart;
                      const segmentEnd = event.end < dayEnd ? event.end : dayEnd;

                      // FIX: Đổi logic tính toán trục Y bằng Toán học tuyệt đối (Tổng số phút)
                      const startDiffMinutes = (segmentStart.getTime() - dayStart.getTime()) / 60000;
                      const endDiffMinutes = (segmentEnd.getTime() - dayStart.getTime()) / 60000;

                      const top = startDiffMinutes * (80 / 60);
                      const height = Math.max((endDiffMinutes - startDiffMinutes) * (80 / 60), 24);

                      return (
                        <div
                          key={`${event.id}:${colIndex}`}
                          className={`absolute left-1.5 right-1.5 rounded-md border-l-[3px] p-2 overflow-hidden transition-all hover:z-10 hover:shadow-md cursor-pointer ${event.color.bg} ${event.color.border}`}
                          style={{ top: `${top}px`, height: `${height}px` }}
                        >
                          <div className={`text-[11px] font-bold truncate leading-tight ${event.color.text}`}>
                            {event.title}
                          </div>
                          {height >= 40 ? (
                            <div className={`text-[10px] opacity-80 truncate mt-1 ${event.color.text}`}>
                              {formatTime(event.start)} - {formatTime(event.end)}
                              {event.subtitle ? ` • ${event.subtitle}` : ""}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {isCurrentView ? (
                <div
                  className="absolute w-full flex items-center pointer-events-none z-20"
                  style={{ top: `${redLineTop}px` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -left-1.5 shadow-sm"></div>
                  <div className="w-full h-[2px] bg-red-500 shadow-sm"></div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F8FAFC;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 20px;
          border: 2px solid #F8FAFC;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #94A3B8;
        }
      `}</style>
    </div>
  );
}