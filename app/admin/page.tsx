"use client";

import * as React from "react";
import {
  CalendarClock,
  CircleCheck,
  CircleDot,
  Clock,
  Headphones,
  Lock,
  Monitor,
  Package,
  Users,
} from "lucide-react";

type Tone = "blue" | "purple" | "green" | "red";

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

export default function AdminDashboardPage() {
  const summary = React.useMemo(
    () => [
      {
        tone: "blue" as const,
        title: "Phòng họp",
        value: "3/10",
        subtitle: "Đang sử dụng",
        hint: "↑ 7 Phòng trống",
        hintTone: "good" as const,
        icon: <Monitor className="h-4 w-4" />,
      },
      {
        tone: "purple" as const,
        title: "Tổng tài sản",
        value: "1,250",
        subtitle: "Thiết bị",
        hint: "▲ 5 Cần bảo trì",
        hintTone: "bad" as const,
        icon: <Package className="h-4 w-4" />,
      },
      {
        tone: "green" as const,
        title: "Nhân sự",
        value: "145",
        subtitle: "Nhân viên",
        hint: "● 3 Nghỉ phép hôm nay",
        hintTone: "warn" as const,
        icon: <Users className="h-4 w-4" />,
      },
      {
        tone: "red" as const,
        title: "Ticket hỗ trợ",
        value: "12",
        subtitle: "Đang chờ xử lý",
        hint: "● 2 Quá hạn (Overdue)",
        hintTone: "bad" as const,
        icon: <Headphones className="h-4 w-4" />,
      },
    ],
    [],
  );

  const rooms = React.useMemo(
    () => [
      {
        name: "Phòng A (Lớn)",
        capacity: 20,
        state: "occupied" as const,
        detail: "Đang họp (MKT)",
        time: "Đến: 11:30 AM",
      },
      {
        name: "Phòng B (Vừa)",
        capacity: 10,
        state: "available" as const,
        detail: "Trống",
        time: "Trống đến 14:00",
      },
      {
        name: "Phòng Training",
        capacity: 50,
        state: "upcoming" as const,
        detail: "Sắp diễn ra",
        time: "Bắt đầu sau 15p",
      },
      {
        name: "Phòng C",
        capacity: 5,
        state: "available" as const,
        detail: "Trống",
        time: "",
      },
    ],
    [],
  );

  const requests = React.useMemo(
    () => [
      {
        title: "Wifi tầng 3 yếu",
        owner: "Nguyễn Văn A - IT",
        badge: "Cao",
        badgeTone: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        title: "Cấp màn hình mới",
        owner: "Trần Thị B - Facility",
        badge: "Mới",
        badgeTone: "bg-blue-50 text-blue-700 border-blue-200",
      },
      {
        title: "Lỗi máy chấm công",
        owner: "Lê C - HR",
        badge: "Đang xử lý",
        badgeTone: "bg-amber-50 text-amber-700 border-amber-200",
      },
    ],
    [],
  );

  const absences = React.useMemo(
    () => [
      {
        initials: "PX",
        name: "Phạm Văn X",
        dept: "Phòng Marketing",
        tag: "Nghỉ ốm",
        tagTone: "bg-rose-50 text-rose-700 border-rose-200",
      },
      {
        initials: "LY",
        name: "Lê Thị Y",
        dept: "Phòng HR",
        tag: "Phép năm",
        tagTone: "bg-blue-50 text-blue-700 border-blue-200",
      },
    ],
    [],
  );

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
              {rooms.map((r) => {
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
                  key={t.title}
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
                  <div className="font-medium">85%</div>
                </div>
                <ProgressLine percent={85} tone="blue" />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-grey-900">
                  <div>Trong kho (Chưa dùng)</div>
                  <div className="font-medium">10%</div>
                </div>
                <ProgressLine percent={10} tone="green" />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-grey-900">
                  <div>Hỏng / Đang sửa chữa</div>
                  <div className="font-medium text-rose-600">5%</div>
                </div>
                <ProgressLine percent={5} tone="red" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-grey-50 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-grey-900">
              Nhân sự vắng mặt hôm nay (3)
            </div>

            <div className="mt-4 space-y-4">
              {absences.map((a) => (
                <div
                  key={a.name}
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
              ))}
            </div>

            <button
              type="button"
              className="mt-5 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              &gt;&gt; Xem thêm
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
