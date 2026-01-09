import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

type CalendarEvent = {
  id: string;
  title: string;
  dayIndex: number; // 0..6 (Sun..Sat)
  start: string; // "HH:mm"
  end: string; // "HH:mm"
  color: "green" | "pink" | "violet" | "yellow";
};

const COLOR = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  pink: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  yellow: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function MiniCalendar() {
  // Mock tháng "February 2021" như ảnh (chỉ UI)
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const selected = 23;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
          February 2021
        </div>
        <div className="flex items-center gap-2 text-[#21252B]">
          <button className="hover:text-[#0B9F57]" aria-label="Prev month">
            <ChevronLeft size={18} />
          </button>
          <button className="hover:text-[#0B9F57]" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-2 text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="text-center font-semibold">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-y-2 text-xs text-[#21252B]">
        {/* căn lề cho tháng mock */}
        {Array.from({ length: 0 }).map((_, i) => (
          <div key={`sp-${i}`} />
        ))}

        {days.map((d) => (
          <button
            key={d}
            className={classNames(
              "h-7 w-7 mx-auto rounded-full flex items-center justify-center hover:bg-[#E9EAEC]",
              d === selected && "bg-[#0B9F57] text-white hover:bg-[#0B9F57]"
            )}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgendaBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; time: string; color: keyof typeof COLOR }>;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
        {title}
      </div>

      <div className="mt-2 space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={classNames("w-2 h-2 rounded-full", COLOR[it.color].dot)} />
              <div className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                {it.label}
              </div>
            </div>
            <div className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
              {it.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewSwitch() {
  const items = ["Year", "Week", "Month", "Day"] as const;
  const active = "Week";

  return (
    <div className="inline-flex rounded-full bg-[#F5F6F7] p-1">
      {items.map((x) => (
        <button
          key={x}
          className={classNames(
            "px-3 py-1 text-xs font-semibold rounded-full",
            x === active ? "bg-white text-[#21252B] shadow-sm" : "text-[#B8BDC5] hover:text-[#21252B]"
          )}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

function WeekView() {
  const startHour = 9;
  const endHour = 18;
  const slotH = 56; // px / hour
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  const days = [
    { key: "SUN", date: 24 },
    { key: "MON", date: 25 },
    { key: "TUE", date: 26 },
    { key: "WED", date: 27 },
    { key: "THU", date: 28 },
    { key: "FRI", date: 29 },
    { key: "SAT", date: 30 },
  ];

  const events: CalendarEvent[] = [
    { id: "e1", title: "Review team", dayIndex: 0, start: "09:00", end: "10:00", color: "green" },
    { id: "e2", title: "Review team", dayIndex: 1, start: "10:00", end: "11:00", color: "green" },
    { id: "e3", title: "Review team", dayIndex: 1, start: "12:00", end: "13:00", color: "violet" },
    { id: "e4", title: "Họp nội bộ", dayIndex: 0, start: "14:00", end: "15:00", color: "pink" },
    { id: "e5", title: "Báo cáo", dayIndex: 1, start: "15:00", end: "16:00", color: "yellow" },
    { id: "e6", title: "Phỏng vấn", dayIndex: 0, start: "16:00", end: "17:00", color: "violet" },
    { id: "e7", title: "Báo cáo", dayIndex: 4, start: "11:00", end: "12:00", color: "yellow" },
    { id: "e8", title: "Review team", dayIndex: 5, start: "16:00", end: "17:00", color: "green" },
    { id: "e9", title: "Review team", dayIndex: 5, start: "09:00", end: "10:00", color: "violet" },
  ];

  // Mock "now line" 11:00 như ảnh
  const nowMinutes = toMinutes("11:00");
  const nowTop = ((nowMinutes - startHour * 60) / 60) * slotH;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="text-[#21252B] hover:text-[#0B9F57]" aria-label="Prev">
            <ChevronLeft size={18} />
          </button>
          <button className="text-[#21252B] hover:text-[#0B9F57]" aria-label="Next">
            <ChevronRight size={18} />
          </button>
          <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
            August 2023
          </div>
        </div>

        <ViewSwitch />
      </div>

      <div className="mt-3 border border-[#E9EAEC] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
          <div className="bg-white border-b border-r border-[#E9EAEC]" />
          {days.map((d) => (
            <div key={d.key} className="bg-white border-b border-[#E9EAEC] px-3 py-2">
              <div className="text-[10px] font-semibold text-[#B8BDC5] uppercase leading-[140%] tracking-[0.12px]">
                {d.key}
              </div>
              <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                {d.date}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
            {/* Time column */}
            <div className="bg-white border-r border-[#E9EAEC]">
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-b border-[#F0F1F2] text-[10px] text-[#B8BDC5] px-2"
                  style={{ height: slotH }}
                >
                  <div className="mt-2">{pad2(h)}:00</div>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((d, dayIdx) => (
              <div key={d.key} className="relative bg-white">
                {hours.map((h) => (
                  <div
                    key={`${d.key}-${h}`}
                    className="border-b border-[#F0F1F2] border-r border-[#F0F1F2]"
                    style={{ height: slotH }}
                  />
                ))}

                {/* Events */}
                {events
                  .filter((e) => e.dayIndex === dayIdx)
                  .map((e) => {
                    const top = ((toMinutes(e.start) - startHour * 60) / 60) * slotH + 8;
                    const height = ((toMinutes(e.end) - toMinutes(e.start)) / 60) * slotH - 10;

                    return (
                      <div
                        key={e.id}
                        className={classNames(
                          "absolute left-2 right-2 rounded-lg px-2 py-1 border",
                          COLOR[e.color].bg,
                          COLOR[e.color].text,
                          "border-transparent"
                        )}
                        style={{ top, height }}
                      >
                        <div className="text-[10px] font-semibold leading-[140%] tracking-[0.12px]">
                          {e.title}
                        </div>
                        <div className="text-[9px] opacity-80 leading-[140%] tracking-[0.12px]">
                          {e.start}-{e.end}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>

          {/* Now line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: 48 + nowTop, // 48px ~ header row height (xấp xỉ)
              height: 0,
              pointerEvents: "none",
            }}
          >
            <div className="relative">
              <div className="h-[2px] bg-[#FF6A3D] opacity-90" />
              <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-[#FF6A3D]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCalendarPage() {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Left */}
        <div className="space-y-3">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B9F57] px-3 py-2 text-xs font-semibold text-white hover:opacity-95">
            <Plus size={16} />
            Tạo lịch
          </button>

          <MiniCalendar />

          <AgendaBlock
            title="Hôm nay"
            items={[
              { label: "Review team", time: "9:00-10:00", color: "green" },
              { label: "Họp nội bộ", time: "14:00-15:00", color: "pink" },
              { label: "Báo cáo", time: "16:00-16:30", color: "yellow" },
            ]}
          />

          <AgendaBlock
            title="Ngày mai"
            items={[
              { label: "Review team", time: "10:00-11:00", color: "green" },
              { label: "Họp nội bộ", time: "12:00-12:30", color: "pink" },
              { label: "Báo cáo", time: "15:00-16:00", color: "yellow" },
            ]}
          />
        </div>

        {/* Right */}
        <div className="lg:col-span-3">
          <WeekView />
        </div>
      </div>
    </div>
  );
}
