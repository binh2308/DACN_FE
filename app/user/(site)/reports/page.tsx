"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Calendar,
  RefreshCcw,
  MessageSquareText,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReadonlyTextarea } from "@/components/ReadonlyTextarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DACN } from "@/services/DACN/typings";
import { getMyReport } from "@/services/DACN/report";
import { toDateOnlyUTC, formatDate } from "@/lib/utils";
import { Center, Loader } from "@mantine/core";
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

const UserCreateReportDialog = dynamic(
  () => import("@/components/reports/UserCreateReportDialog"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <Center style={{ height: "100%" }}>
          <Loader color="green" />
        </Center>
      </div>
    ),
  },
);

export default function WeeklyReportsPage() {
  const [reports, setReports] = React.useState<DACN.ReportResponseDto[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [totalPage, setTotalPage] = React.useState<number>(0);
  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    status: "all",
    submittedAt: "",
  });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = React.useState(false);

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getMyReport({
          page: 1,
          limit: 10,
        });
        setReports(res.data?.data);
        setSelectedId(res.data?.data[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchReport();
  }, [createOpen]);

  React.useEffect(() => {
    setIsEditing(false);
  }, [selectedId]);

  const filtered = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    const filteredReports = reports
      .filter((r) => {
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
    setTotalPage(Math.ceil(filteredReports.length / 4));
    return filteredReports.slice(currentPage * 4, currentPage * 4 + 4);
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
      draft: reports.filter((r) => r.status === "DRAFT").length,
    };
  }, [reports]);

  const updateSelected = (patch: Partial<WeeklyReport>) => {
    if (!selected) return;
    const updatedAt = new Date().toISOString();
    setReports((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, ...patch, updatedAt } : r,
      ),
    );
  };

  const openCreate = () => {
    setHasOpenedCreate(true);
    setCreateOpen(true);
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
            · Bản nháp{" "}
            <span className="font-semibold text-foreground">
              {counts.draft}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button className="rounded-full" type="button" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Báo cáo mới
          </Button>
        </div>
      </div>

      {hasOpenedCreate ? (
        <UserCreateReportDialog open={createOpen} onOpenChange={setCreateOpen} />
      ) : null}

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Báo cáo của tôi</CardTitle>
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
                  placeholder="Tìm kiếm"
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                <Input
                  type="date"
                  value={filters.submittedAt}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, submittedAt: e.target.value }))
                  }
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="bg-white pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filtered.length === 0 && !loading ? (
                <EmptyState
                  title="Không có báo cáo hàng tuần"
                  hint="Hãy thử điều chỉnh bộ lọc hoặc nộp một báo cáo mới."
                />
              ) : loading ? (
                <Center style={{ height: "50vh" }}>
                  <Loader color="green" />
                </Center>
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
                            {formatDate(r.week_starting, "DD/MM/YYYY")}
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
                          <span className="text-muted-foreground">
                            Tiến độ
                          </span>
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
            {filtered.length > 0 && (
              <div className="flex justify-end gap-3">
                <ChevronLeft
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => {
                    if (currentPage > 0) setCurrentPage(currentPage - 1);
                  }}
                />
                <span>
                  {currentPage + 1} / {totalPage}
                </span>
                <ChevronRight
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => {
                    if (currentPage < totalPage - 1)
                      setCurrentPage(currentPage + 1);
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
                      {`# ${selected.id.slice(0, 5)} `}
                    </CardTitle>
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
                    <span>Cập nhật: {formatDateShort(selected.updated_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đã hoàn thành
                    </div>
                    <ReadonlyTextarea
                      value={selected?.accomplishment || "--"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đang thực hiện
                    </div>
                    <ReadonlyTextarea
                      value={selected.in_progress || "—"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Kế hoạch tuần tới
                    </div>
                    <ReadonlyTextarea
                      value={selected.plan || "—"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Khó khăn / Vướng mắc
                    </div>
                    <ReadonlyTextarea
                      value={selected.blocker || "—"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
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

                <div className="flex justify-end gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setIsEditing(false)}
                    >
                      Hủy
                    </Button>
                  )}
                  {selected.status !== "REVIEWED" && (
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Lưu" : "Chỉnh sửa"}
                    </Button>
                  )}
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