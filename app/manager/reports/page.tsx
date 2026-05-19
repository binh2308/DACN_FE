"use client";

import * as React from "react";
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  RefreshCcw,
  MessageSquareText,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DACN } from "@/services/DACN/typings";
import { getListReports, reviewReport } from "@/services/DACN/report";
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
import { MyDatePicker } from "@/components/MyDatePicker";
import { toDateOnlyUTC } from "@/lib/utils";
import { Center, Loader } from "@mantine/core";
import { set } from "react-hook-form";
import { notifications } from "@mantine/notifications";

type ReportStatus = "SUBMITTED" | "REVIEWED" | "DRAFT";

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
  return d.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusLabel(s: ReportStatus) {
  switch (s) {
    case "SUBMITTED":
      return "Đã nộp";
    case "REVIEWED":
      return "Đã duyệt";
    case "DRAFT":
      return "Bản nháp";
    default:
      return s;
  }
}

function statusVariant(
  s: ReportStatus,
): "default" | "secondary" | "destructive" {
  switch (s) {
    case "REVIEWED":
      return "default";
    case "DRAFT":
      return "secondary";
    case "SUBMITTED":
    default:
      return "default";
  }
}

type Filters = {
  q: string;
  status: "all" | ReportStatus;
  submittedAt: string;
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
  const [reports, setReports] = React.useState<DACN.ManagerReportResponseDto[]>(
    [],
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [review, setReview] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [updated, setUpdated] = React.useState<boolean>(false);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    status: "all",
    submittedAt: "",
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
    status: "SUBMITTED",
    managerComment: "",
  });

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getListReports({
          page: 1,
          limit: 10,
        });
        setReports(
          res.data?.data.filter(
            (r: DACN.ManagerReportResponseDto) => r.status !== "DRAFT",
          ) ?? [],
        );
      } catch (error) {
        console.error("Failed to fetch report:", error);
      }
    };
    fetchReport();
  }, [createOpen, updated]);

  const { pagedReports, totalPage, currentPageSafe } = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const filterReports = reports
      .filter((r) => {
        if (
          q.length > 0 &&
          q.includes(r.employee?.firstName.toLowerCase()) === false &&
          q.includes(r.employee?.middleName.toLowerCase()) === false &&
          q.includes(r.employee?.lastName.toLowerCase()) === false
        )
          return false;
        if (filters.status !== "all" && r.status !== filters.status)
          return false;

        if (
          filters.submittedAt &&
          toDateOnlyUTC(r.created_at) !== toDateOnlyUTC(filters.submittedAt)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    const totalPage = Math.ceil(filterReports.length / 4);
    const currentPageSafe = Math.min(currentPage, Math.max(totalPage - 1, 0));
    const pagedReports = filterReports.slice(
      currentPageSafe * 4,
      currentPageSafe * 4 + 4,
    );

    return { pagedReports, totalPage, currentPageSafe };
  }, [reports, filters, currentPage]);

  const selected = React.useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId],
  );

  const counts = React.useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter((r) => r.status === "SUBMITTED").length,
      reviewed: reports.filter((r) => r.status === "REVIEWED").length,
      needsChanges: reports.filter((r) => r.status === "DRAFT").length,
    };
  }, [reports]);

  const handleReview = async () => {
    if (!selectedId) return;
    if (review.trim().length === 0) {
      setError("Vui lòng nhập feedback trước khi duyệt báo cáo.");
      return;
    }
    try {
      await reviewReport(selectedId, { review });
      notifications.show({
        title: "Thành công",
        message: "Báo cáo đã được duyệt thành công.",
        color: "green",
      });
      setError(null);
      setUpdated(!updated);
    } catch (error) {
      notifications.show({
        title: "Lỗi",
        message: "Đã có lỗi xảy ra khi duyệt báo cáo. Vui lòng thử lại.",
        color: "red",
      });
    }
  };

  const submitDraft = () => {
    if (!draft.employeeId.trim() || !draft.employeeName.trim()) return;
    if (!draft.weekStart || !draft.weekEnd) return;

    const nowIso = new Date().toISOString();
    const item: DACN.ManagerReportResponseDto = {
      ...draft,
      id: safeId(),
      week_starting: draft.weekStart,
      created_at: nowIso,
      updated_at: nowIso,
      accomplishment: draft.accomplishments,
      employee: draft.employeeName,
      in_progress: draft.inProgress,
      plan: draft.planNextWeek,
      progress_percentage: clampProgress(draft.progress),
      status: "SUBMITTED",
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
            Báo cáo hàng tuần
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Tổng:{" "}
            <span className="font-semibold text-foreground">
              {counts.total}
            </span>{" "}
            · Đã nộp{" "}
            <span className="font-semibold text-foreground">
              {counts.submitted}
            </span>{" "}
            · Đã duyệt{" "}
            <span className="font-semibold text-foreground">
              {counts.reviewed}
            </span>{" "}
            · Cần thay đổi{" "}
            <span className="font-semibold text-foreground">
              {counts.needsChanges}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" type="button">
                <Plus className="mr-2 h-4 w-4" />
                Tạo báo cáo
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nộp báo cáo hàng tuần</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mã nhân viên</Label>
                  <Input
                    value={draft.employeeId}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, employeeId: e.target.value }))
                    }
                    placeholder="E-0001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tên nhân viên</Label>
                  <Input
                    value={draft.employeeName}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, employeeName: e.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phòng ban</Label>
                  <Select
                    value={draft.department}
                    onValueChange={(v) =>
                      setDraft((p) => ({ ...p, department: v }))
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Kỹ thuật</SelectItem>
                      <SelectItem value="HR">Nhân sự</SelectItem>
                      <SelectItem value="Sales">Kinh doanh</SelectItem>
                      <SelectItem value="Finance">Tài chính</SelectItem>
                      <SelectItem value="Operations">Vận hành</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Bắt đầu tuần</Label>
                    <input
                      type="date"
                      value={draft.weekStart}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, weekStart: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kết thúc tuần</Label>
                    <input
                      type="date"
                      value={draft.weekEnd}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, weekEnd: e.target.value }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tiến độ (%)</Label>
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
                  <Label>Số giờ làm việc</Label>
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
                  <Label>Công việc đã hoàn thành</Label>
                  <Textarea
                    value={draft.accomplishments}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        accomplishments: e.target.value,
                      }))
                    }
                    rows={5}
                    placeholder="Việc đã hoàn thành..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Công việc đang thực hiện</Label>
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
                  <Label>Kế hoạch tuần tới</Label>
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
                  <Label>Khó khăn / Vướng mắc</Label>
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
                <Label>Liên kết (PR/Ticket)</Label>
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
                  Hủy
                </Button>
                <Button
                  onClick={submitDraft}
                  type="button"
                  disabled={!draft.employeeId || !draft.employeeName}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Nộp báo cáo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Báo cáo của nhóm</CardTitle>
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
                  placeholder="Tìm kiếm theo nhân viên"
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
                    submittedAt: "",
                  })
                }
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Đặt lại
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(v) =>
                    setFilters((p) => ({
                      ...p,
                      status: v as Filters["status"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
                    <SelectItem value="REVIEWED">Đã duyệt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <MyDatePicker
                value={filters.submittedAt}
                onChange={(v) =>
                  setFilters((p) => ({ ...p, submittedAt: v || "" }))
                }
                placeholder="Chọn ngày nộp"
              />
            </div>

            <div className="space-y-3">
              {pagedReports.length === 0 && reports.length > 0 ? (
                <EmptyState
                  title="Không có báo cáo tuần"
                  hint="Hãy thử điều chỉnh bộ lọc hoặc nộp một báo cáo mới."
                />
              ) : reports.length === 0 ? (
                <Center style={{ height: "50vh" }}>
                  <Loader color="green" />
                </Center>
              ) : (
                pagedReports.map((r) => {
                  const active = r.id === selectedId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(r.id);
                        setReview(r.review || "");
                      }}
                      className={
                        "w-full rounded-xl border bg-white p-4 text-left transition-shadow hover:shadow-sm " +
                        (active ? "ring-2 ring-emerald-300" : "")
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {r.employee?.firstName} {r.employee?.middleName}{" "}
                            {r.employee?.lastName}
                            <span className="text-xs text-muted-foreground">
                              ({`#${r.employee?.id.slice(0, 5)}`})
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>({`#${r.id.slice(0, 5)}`})</span>
                            <span>·</span>
                            <span>{formatDateShort(r.week_starting)}</span>
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
                          <span className="text-muted-foreground">Tiến độ</span>
                          <span className="font-semibold text-foreground">
                            {clampProgress(r.progress_percentage)}%
                          </span>
                        </div>
                        <ProgressBar value={r.progress_percentage} />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Đã nộp: {formatDateShort(r.created_at)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {pagedReports.length > 0 && (
              <div className="p-2 flex justify-end gap-3">
                <ChevronLeft
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => {
                    if (currentPageSafe > 0) setCurrentPage(currentPageSafe - 1);
                  }}
                />
                <span>
                  {currentPageSafe + 1} / {totalPage}
                </span>
                <ChevronRight
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => {
                    if (currentPageSafe < totalPage - 1)
                      setCurrentPage(currentPageSafe + 1);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-7">
          {selected ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-sm">
                      {selected.employee?.firstName}{" "}
                      {selected.employee?.middleName}{" "}
                      {selected.employee?.lastName}
                      <span className="text-muted-foreground">
                        ({`#${selected.employee?.id.slice(0, 5)}`})
                      </span>
                    </CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDateShort(selected.week_starting)}
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
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-semibold text-foreground">
                      {clampProgress(selected.progress_percentage)}%
                    </span>
                  </div>
                  <ProgressBar value={selected.progress_percentage} />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Cập nhật: {formatDateShort(selected.updated_at)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đã hoàn thành
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.accomplishment || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đang thực hiện
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.in_progress || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Kế hoạch tuần tới
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.plan || "—"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Khó khăn / Vướng mắc
                    </div>
                    <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                      {selected.blocker || "—"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    Ghi chú tiến độ
                  </div>
                  <div className="whitespace-pre-wrap rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                    {selected.progress_notes || "—"}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-foreground">
                      Quản lý duyệt
                    </div>
                    {selected.status !== "REVIEWED" && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          className="rounded-full"
                          onClick={handleReview}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Đánh dấu đã duyệt
                        </Button>
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    readOnly={selected.status === "REVIEWED"}
                    rows={4}
                    placeholder="Feedback cho nhân viên..."
                  />
                  <span className="text-sm text-red-500">{error}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState title="Chọn một báo cáo để xem chi tiết" />
          )}
        </div>
      </div>
    </div>
  );
}
