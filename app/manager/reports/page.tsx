"use client";

import * as React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  ListFilter,
  MessageSquareText,
  Plus,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReportStatus = "submitted" | "reviewed" | "needs_changes";

type WeeklyReport = {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  createdAt: string; // ISO
  updatedAt: string; // ISO
  progress: number; // 0..100
  accomplishments: string;
  inProgress: string;
  planNextWeek: string;
  blockers: string;
  links: string;
  hours: number;
  status: ReportStatus;
  managerComment: string;
};

const STORAGE_KEY = "weekly_reports";

function safeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (crypto as any).randomUUID() as string;
  }
  return `wr_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clampProgress(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatDateShort(ymdOrIso: string) {
  const d = new Date(ymdOrIso);
  if (Number.isNaN(d.getTime())) return ymdOrIso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusLabel(s: ReportStatus) {
  switch (s) {
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "needs_changes":
      return "Needs changes";
    default:
      return s;
  }
}

function statusVariant(
  s: ReportStatus
): "default" | "secondary" | "destructive" {
  switch (s) {
    case "reviewed":
      return "default";
    case "needs_changes":
      return "destructive";
    case "submitted":
    default:
      return "secondary";
  }
}

function seedReports(): WeeklyReport[] {
  const now = new Date();
  const iso = now.toISOString();
  return [
    {
      id: safeId(),
      employeeId: "E-0102",
      employeeName: "Nguyen Van A",
      department: "Engineering",
      weekStart: "2026-01-19",
      weekEnd: "2026-01-25",
      createdAt: iso,
      updatedAt: iso,
      progress: 78,
      accomplishments:
        "- Hoàn thành UI trang Booking\n- Fix lỗi date input bị vỡ layout\n- Review PR của team",
      inProgress:
        "- Tối ưu performance trang Employee list\n- Chuẩn hoá validation form",
      planNextWeek:
        "- Hoàn thiện phần Reports\n- Thêm export CSV\n- Viết unit tests cho utils",
      blockers: "Chưa có blocker lớn.",
      links: "PR: #123\nTicket: DACN-45",
      hours: 40,
      status: "submitted",
      managerComment: "",
    },
    {
      id: safeId(),
      employeeId: "E-0220",
      employeeName: "Tran Thi B",
      department: "HR",
      weekStart: "2026-01-19",
      weekEnd: "2026-01-25",
      createdAt: iso,
      updatedAt: iso,
      progress: 92,
      accomplishments:
        "- Tổng hợp dữ liệu chấm công\n- Làm báo cáo lương sơ bộ\n- Update policy nghỉ phép",
      inProgress: "- Chuẩn bị onboarding batch mới",
      planNextWeek: "- Hoàn tất payroll\n- Audit hồ sơ nhân sự",
      blockers: "Đợi dữ liệu từ phòng IT về phân quyền.",
      links: "",
      hours: 38,
      status: "reviewed",
      managerComment: "Tốt. Tuần sau ưu tiên payroll trước thứ 4.",
    },
  ];
}

function readReports(): WeeklyReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedReports();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedReports();
    return parsed as WeeklyReport[];
  } catch {
    return seedReports();
  }
}

function writeReports(items: WeeklyReport[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

type Filters = {
  q: string;
  status: "all" | ReportStatus;
  department: "all" | string;
  weekStart: string;
};

function ProgressBar({ value }: { value: number }) {
  const v = clampProgress(value);
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className="h-2 rounded-full bg-emerald-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted">
        <MessageSquareText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {hint ? (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

export default function WeeklyReportsPage() {
  const [reports, setReports] = React.useState<WeeklyReport[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    status: "all",
    department: "all",
    weekStart: "",
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<
    Omit<WeeklyReport, "id" | "createdAt" | "updatedAt">
  >({
    employeeId: "",
    employeeName: "",
    department: "Engineering",
    weekStart: "",
    weekEnd: "",
    progress: 0,
    accomplishments: "",
    inProgress: "",
    planNextWeek: "",
    blockers: "",
    links: "",
    hours: 40,
    status: "submitted",
    managerComment: "",
  });

  React.useEffect(() => {
    const initial = readReports();
    setReports(initial);
    setSelectedId(initial[0]?.id ?? null);
  }, []);

  React.useEffect(() => {
    if (reports.length === 0) return;
    writeReports(reports);
  }, [reports]);

  const departments = React.useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) set.add(r.department);
    return Array.from(set).sort();
  }, [reports]);

  const filtered = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return reports
      .filter((r) => {
        if (filters.status !== "all" && r.status !== filters.status)
          return false;
        if (
          filters.department !== "all" &&
          r.department !== filters.department
        )
          return false;
        if (filters.weekStart && r.weekStart !== filters.weekStart)
          return false;
        if (q) {
          const hay =
            `${r.employeeId} ${r.employeeName} ${r.department}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [reports, filters]);

  const selected = React.useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId]
  );

  const counts = React.useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter((r) => r.status === "submitted").length,
      reviewed: reports.filter((r) => r.status === "reviewed").length,
      needsChanges: reports.filter((r) => r.status === "needs_changes").length,
    };
  }, [reports]);

  const updateSelected = (patch: Partial<WeeklyReport>) => {
    if (!selected) return;
    const updatedAt = new Date().toISOString();
    setReports((prev) =>
      prev.map((r) => (r.id === selected.id ? { ...r, ...patch, updatedAt } : r))
    );
  };

  const submitDraft = () => {
    if (!draft.employeeId.trim() || !draft.employeeName.trim()) return;
    if (!draft.weekStart || !draft.weekEnd) return;

    const nowIso = new Date().toISOString();
    const item: WeeklyReport = {
      ...draft,
      id: safeId(),
      createdAt: nowIso,
      updatedAt: nowIso,
      progress: clampProgress(draft.progress),
      hours: Number(draft.hours) || 0,
      status: "submitted",
      managerComment: "",
    };
    setReports((prev) => [item, ...prev]);
    setSelectedId(item.id);
    setCreateOpen(false);
    setDraft((p) => ({
      ...p,
      employeeId: "",
      employeeName: "",
      weekStart: "",
      weekEnd: "",
      accomplishments: "",
      inProgress: "",
      planNextWeek: "",
      blockers: "",
      links: "",
      progress: 0,
      hours: 40,
    }));
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold text-foreground">
            Weekly Reports
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Tổng:{" "}
            <span className="font-semibold text-foreground">{counts.total}</span>{" "}
            · Submitted{" "}
            <span className="font-semibold text-foreground">
              {counts.submitted}
            </span>{" "}
            · Reviewed{" "}
            <span className="font-semibold text-foreground">
              {counts.reviewed}
            </span>{" "}
            · Needs changes{" "}
            <span className="font-semibold text-foreground">
              {counts.needsChanges}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full" type="button">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" type="button">
                <Plus className="mr-2 h-4 w-4" />
                New report
              </Button>
            </DialogTrigger>
            {/* Responsive fix: 
                - max-h-[90vh] & overflow-y-auto: Giúp cuộn khi màn hình nhỏ
                - w-full: Đảm bảo độ rộng
            */}
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit weekly report</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    value={draft.employeeId}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, employeeId: e.target.value }))
                    }
                    placeholder="E-0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee name</Label>
                  <Input
                    value={draft.employeeName}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, employeeName: e.target.value }))
                    }
                    placeholder="Nguyen Van A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={draft.department}
                    onValueChange={(v) =>
                      setDraft((p) => ({ ...p, department: v }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsive fix: sm:grid-cols-2 giúp xếp chồng trên mobile và song song trên tablet trở lên.
                    Icon fix: Xóa icon CalendarDays custom, để trình duyệt tự render icon mặc định.
                */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Week start</Label>
                    <Input
                      type="date"
                      value={draft.weekStart}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, weekStart: e.target.value }))
                      }
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Week end</Label>
                    <Input
                      type="date"
                      value={draft.weekEnd}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, weekEnd: e.target.value }))
                      }
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Progress (%)</Label>
                  <Input
                    type="number"
                    value={String(draft.progress)}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        progress: clampProgress(Number(e.target.value)),
                      }))
                    }
                    min={0}
                    max={100}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hours</Label>
                  <Input
                    type="number"
                    value={String(draft.hours)}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, hours: Number(e.target.value) }))
                    }
                    min={0}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Accomplishments</Label>
                  <Textarea
                    value={draft.accomplishments}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, accomplishments: e.target.value }))
                    }
                    rows={5}
                    placeholder="Việc đã hoàn thành..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>In progress</Label>
                  <Textarea
                    value={draft.inProgress}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, inProgress: e.target.value }))
                    }
                    rows={5}
                    placeholder="Việc đang thực hiện..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan next week</Label>
                  <Textarea
                    value={draft.planNextWeek}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, planNextWeek: e.target.value }))
                    }
                    rows={5}
                    placeholder="Kế hoạch tuần tới..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Blockers</Label>
                  <Textarea
                    value={draft.blockers}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, blockers: e.target.value }))
                    }
                    rows={5}
                    placeholder="Vướng mắc / rủi ro..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Links (PR/Ticket)</Label>
                <Textarea
                  value={draft.links}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, links: e.target.value }))
                  }
                  rows={3}
                  placeholder="PR: ...\nTicket: ..."
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitDraft}
                  type="button"
                  disabled={!draft.employeeId || !draft.employeeName}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Inbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.q}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, q: e.target.value }))
                  }
                  placeholder="Search by employee"
                  className="bg-white pl-10"
                />
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                type="button"
                onClick={() =>
                  setFilters({
                    q: "",
                    status: "all",
                    department: "all",
                    weekStart: "",
                  })
                }
              >
                <ListFilter className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(v) =>
                    setFilters((p) => ({ ...p, status: v as Filters["status"] }))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="needs_changes">Needs changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.department}
                  onValueChange={(v) =>
                    setFilters((p) => ({ ...p, department: v }))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={filters.weekStart}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, weekStart: e.target.value }))
                  }
                  className="bg-white pl-10"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <EmptyState
                  title="No weekly reports"
                  hint="Try adjusting filters or submit a new report."
                />
              ) : (
                filtered.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      className={
                        "w-full rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-sm " +
                        (active ? "ring-2 ring-emerald-300" : "")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {r.employeeName}{" "}
                            <span className="text-xs text-muted-foreground">
                              ({r.employeeId})
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{r.department}</span>
                            <span>·</span>
                            <span>
                              {formatDateShort(r.weekStart)} –{" "}
                              {formatDateShort(r.weekEnd)}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={statusVariant(r.status)}
                          className="rounded-full"
                        >
                          {statusLabel(r.status)}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">
                            {clampProgress(r.progress)}%
                          </span>
                        </div>
                        <ProgressBar value={r.progress} />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Submitted: {formatDateShort(r.createdAt)}</span>
                        <span>{r.hours}h</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-7">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-sm">
                      {selected.employeeName}{" "}
                      <span className="text-muted-foreground">
                        ({selected.employeeId})
                      </span>
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {selected.department} · {formatDateShort(selected.weekStart)} –{" "}
                      {formatDateShort(selected.weekEnd)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant(selected.status)}
                      className="rounded-full"
                    >
                      {statusLabel(selected.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {clampProgress(selected.progress)}%
                    </span>
                  </div>
                  <ProgressBar value={selected.progress} />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Hours: {selected.hours}h</span>
                    <span>Updated: {formatDateShort(selected.updatedAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Accomplishments
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.accomplishments || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      In progress
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.inProgress || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Plan next week
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.planNextWeek || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Blockers
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.blockers || "—"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">Links</div>
                  <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                    {selected.links || "—"}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">
                      Manager review
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() =>
                          updateSelected({ status: "needs_changes" })
                        }
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Request changes
                      </Button>
                      <Button
                        type="button"
                        className="rounded-full"
                        onClick={() => updateSelected({ status: "reviewed" })}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark reviewed
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={selected.managerComment}
                    onChange={(e) =>
                      updateSelected({ managerComment: e.target.value })
                    }
                    rows={4}
                    placeholder="Feedback cho nhân viên..."
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="Select a report to view details" />
          )}
        </div>
      </div>
    </div>
  );
}