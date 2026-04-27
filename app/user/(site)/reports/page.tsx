"use client";

import * as React from "react";
import {
  Calendar,
  Filter,
  RefreshCcw,
  MessageSquareText,
  Plus,
  Search,
  Send,
} from "lucide-react";
import { ReadonlyTextarea } from "@/components/ReadonlyTextarea";
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
import { notifications } from "@mantine/notifications";
import { DACN } from "@/services/DACN/typings";
import { createReport, getMyReport } from "@/services/DACN/report";
import { Textarea } from "@/components/ui/textarea";
import { toDateOnlyUTC } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const reportSchema = z.object({
  week_starting: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a week starting date"),
  progress_percentage: z
    .number()
    .min(1, "Progress percentage is required")
    .max(100),
  accomplishment: z.string().min(10, "Accomplishment is required").max(500),
  in_progress: z
    .string()
    .min(10, "In-progress description is required")
    .max(500),
  plan: z.string().min(10, "Plan is required").max(500),
  blocker: z.string().max(500),
  progress_notes: z.string().max(500),
});

type ReportFormData = z.infer<typeof reportSchema>;
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
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function statusLabel(s: ReportStatus) {
  switch (s) {
    case "SUBMITTED":
      return "Submitted";
    case "REVIEWED":
      return "Reviewed";
    case "DRAFT":
      return "Draft";
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

// function seedReports(): WeeklyReport[] {
//   const now = new Date();
//   const iso = now.toISOString();
//   return [
//     {
//       id: safeId(),
//       employeeId: "E-0102",
//       employeeName: "Nguyen Van A",
//       department: "Engineering",
//       weekStart: "2026-01-19",
//       weekEnd: "2026-01-25",
//       createdAt: iso,
//       updatedAt: iso,
//       progress: 78,
//       accomplishments:
//         "- Hoàn thành UI trang Booking\n- Fix lỗi date input bị vỡ layout\n- Review PR của team",
//       inProgress:
//         "- Tối ưu performance trang Employee list\n- Chuẩn hoá validation form",
//       planNextWeek:
//         "- Hoàn thiện phần Reports\n- Thêm export CSV\n- Viết unit tests cho utils",
//       blockers: "Chưa có blocker lớn.",
//       links: "PR: #123\nTicket: DACN-45",
//       hours: 40,
//       status: "submitted",
//       managerComment: "",
//     },
//     {
//       id: safeId(),
//       employeeId: "E-0220",
//       employeeName: "Tran Thi B",
//       department: "HR",
//       weekStart: "2026-01-19",
//       weekEnd: "2026-01-25",
//       createdAt: iso,
//       updatedAt: iso,
//       progress: 92,
//       accomplishments:
//         "- Tổng hợp dữ liệu chấm công\n- Làm báo cáo lương sơ bộ\n- Update policy nghỉ phép",
//       inProgress: "- Chuẩn bị onboarding batch mới",
//       planNextWeek: "- Hoàn tất payroll\n- Audit hồ sơ nhân sự",
//       blockers: "Đợi dữ liệu từ phòng IT về phân quyền.",
//       links: "",
//       hours: 38,
//       status: "reviewed",
//       managerComment: "Tốt. Tuần sau ưu tiên payroll trước thứ 4.",
//     },
//   ];
// }

// function readReports(): WeeklyReport[] {
//   if (typeof window === "undefined") return [];
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     if (!raw) return seedReports();
//     const parsed = JSON.parse(raw) as unknown;
//     if (!Array.isArray(parsed)) return seedReports();
//     return parsed as WeeklyReport[];
//   } catch {
//     return seedReports();
//   }
// }

// function writeReports(items: WeeklyReport[]) {
//   if (typeof window === "undefined") return;
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
//   } catch {
//     // ignore
//   }
// }

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
  const [reports, setReports] = React.useState<DACN.ReportResponseDto[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [filters, setFilters] = React.useState<Filters>({
    q: "",
    status: "all",
    submittedAt: "",
  });
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await getMyReport({
          page: 1,
          limit: 10,
        });
        //console.log("Fetched my report:", res.data?.data);
        setReports(res.data?.data);
        setSelectedId(res.data?.data[0]?.id ?? null);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      }
    };
    fetchReport();
  }, [createOpen]);

  // React.useEffect(() => {
  //   const initial = readReports();
  //   setReports(initial);
  //   setSelectedId(initial[0]?.id ?? null);
  // }, []);
  React.useEffect(() => {
    setIsEditing(false);
  }, [selectedId]);
  // React.useEffect(() => {
  //   if (reports.length === 0) return;
  //   writeReports(reports);
  // }, [reports]);

  // const departments = React.useMemo(() => {
  //   const set = new Set<string>();
  //   for (const r of reports) set.add(r.department);
  //   return Array.from(set).sort();
  // }, [reports]);

  const filtered = React.useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    return reports
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
  }, [reports, filters]);

  const selected = React.useMemo(
    () => reports.find((r) => r.id === selectedId) ?? null,
    [reports, selectedId],
  );
  console.log("Selected report:", selected);
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

  const onSubmit = async (data: ReportFormData) => {
    const newReport: DACN.CreateReportRequestDto = {
      week_starting: data.week_starting,
      accomplishment: data.accomplishment,
      in_progress: data.in_progress,
      plan: data.plan,
      blocker: data.blocker,
      progress_percentage: data.progress_percentage,
      progress_notes: data.progress_notes,
    };
    try {
      await createReport(newReport);
      notifications.show({
        title: "Report submitted",
        message: "Your weekly report has been submitted successfully.",
        color: "green",
      });
      reset();
      setCreateOpen(false);
    } catch (error) {
      notifications.show({
        title: "Failed to submit report",
        message:
          "An error occurred while submitting your report. Please try again.",
        color: "red",
      });
    }
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
            <span className="font-semibold text-foreground">
              {counts.total}
            </span>{" "}
            · Submitted{" "}
            <span className="font-semibold text-foreground">
              {counts.submitted}
            </span>{" "}
            · Reviewed{" "}
            <span className="font-semibold text-foreground">
              {counts.reviewed}
            </span>{" "}
            · Draft{" "}
            <span className="font-semibold text-foreground">
              {counts.draft}
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
              <DialogHeader className="mb-4">
                <DialogTitle>SUBMIT WEEKLY REPORT</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2">
                  <div>
                    <Label>
                      Week start date <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="week_starting"
                      render={({ field }) => (
                        <div className="relative group mt-1">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                          <Input
                            type="date"
                            value={typeof field.value === "string" ? field.value : ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            className="bg-white pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors"
                            required
                          />
                        </div>
                      )}
                    />
                    {errors.week_starting && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.week_starting.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Progress (%) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      {...register("progress_percentage", {
                        valueAsNumber: true,
                      })}
                      min={0}
                      max={100}
                      className="mt-1 bg-white"
                    />
                    {errors.progress_percentage && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.progress_percentage.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label>
                      Accomplishments <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      className="mt-1"
                      {...register("accomplishment")}
                      rows={5}
                      placeholder="Việc đã hoàn thành..."
                    />
                    {errors.accomplishment && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.accomplishment.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      In progress <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      {...register("in_progress")}
                      className="mt-1"
                      rows={5}
                      placeholder="Việc đang thực hiện..."
                    />
                    {errors.in_progress && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.in_progress.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Plan next week <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      {...register("plan")}
                      className="mt-1"
                      rows={5}
                      placeholder="Kế hoạch tuần tới..."
                    />
                    {errors.plan && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.plan.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Blockers</Label>
                    <Textarea
                      {...register("blocker")}
                      className="mt-1"
                      rows={5}
                      placeholder="Vướng mắc / rủi ro..."
                    />
                    {errors.blocker && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.blocker.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Progress Notes</Label>
                    <Input
                      {...register("progress_notes")}
                      className="mt-1"
                      placeholder="Ghi chú"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">My Weekly Reports</CardTitle>
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
                  placeholder="Search"
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
                Reset
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
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
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

              {/* <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={filters.weekStart}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, weekStart: e.target.value }))
                  }
                  className="bg-white pl-10"
                />
              </div> */}
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
                            {`# ${r.id.slice(0, 5)}`}
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
                            Progress
                          </span>
                          <span className="font-semibold text-foreground">
                            {clampProgress(r.progress_percentage)}%
                          </span>
                        </div>
                        <ProgressBar value={r.progress_percentage} />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Submitted: {formatDateShort(r.created_at)}</span>
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
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {clampProgress(selected.progress_percentage)}%
                    </span>
                  </div>
                  <ProgressBar value={selected.progress_percentage} />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated: {formatDateShort(selected.updated_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Accomplishments
                    </div>
                    <ReadonlyTextarea
                      value={selected?.accomplishment || "--"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      In progress
                    </div>
                    <ReadonlyTextarea
                      value={selected.in_progress || "—"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Plan next week
                    </div>
                    <ReadonlyTextarea
                      value={selected.plan || "—"}
                      readonly={!isEditing}
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Blockers
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
                    Notes
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
            <EmptyState title="Select a report to view details" />
          )}
        </div>
      </div>
    </div>
  );
}
