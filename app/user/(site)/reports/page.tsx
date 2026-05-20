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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReadonlyTextarea } from "@/components/ReadonlyTextarea";
import { EmptyState } from "@/components/EmptyState";
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
import {
  createReport,
  getMyReport,
  updateReport,
  submitReport,
} from "@/services/DACN/report";
import { Textarea } from "@/components/ui/textarea";
import { toDateOnlyUTC, formatDate } from "@/lib/utils";
import { Controller, set, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Center, Loader } from "@mantine/core";

const reportSchema = z.object({
  week_starting: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày bắt đầu tuần"),
  progress_percentage: z.number().min(1, "Tiến độ là bắt buộc").max(100),
  accomplishment: z
    .string()
    .min(10, "Công việc đã hoàn thành là bắt buộc")
    .max(500),
  in_progress: z
    .string()
    .min(10, "Công việc đang thực hiện là bắt buộc")
    .max(500),
  plan: z.string().min(10, "Kế hoạch là bắt buộc").max(500),
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

export default function WeeklyReportsPage() {
  const [reports, setReports] = React.useState<DACN.ReportResponseDto[]>([]);
  const [selectedReport, setSelectedReport] =
    React.useState<DACN.ReportResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [updated, setUpdated] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
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
        const nextReports = res.data?.data ?? [];
        if (selectedReport) {
          setSelectedReport(
            nextReports.find(
              (r: DACN.ReportResponseDto) => r.id === selectedReport.id,
            ) ?? null,
          );
        } else {
          setSelectedReport(nextReports[0] ?? null);
        }
        setReports(nextReports);
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchReport();
  }, [createOpen, updated]);

  // React.useEffect(() => {
  //   const initial = readReports();
  //   setReports(initial);
  //   setSelectedId(initial[0]?.id ?? null);
  // }, []);
  // React.useEffect(() => {
  //   if (reports.length === 0) return;
  //   writeReports(reports);
  // }, [reports]);

  // const departments = React.useMemo(() => {
  //   const set = new Set<string>();
  //   for (const r of reports) set.add(r.department);
  //   return Array.from(set).sort();
  // }, [reports]);

  const { pagedReports, totalPage, currentPageSafe } = React.useMemo(() => {
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

    const totalPage = Math.ceil(filteredReports.length / 4);
    const currentPageSafe = Math.min(currentPage, Math.max(totalPage - 1, 0));
    const pagedReports = filteredReports.slice(
      currentPageSafe * 4,
      currentPageSafe * 4 + 4,
    );

    return { pagedReports, totalPage, currentPageSafe };
  }, [reports, filters, currentPage]);
  const counts = React.useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter((r) => r.status === "SUBMITTED").length,
      reviewed: reports.filter((r) => r.status === "REVIEWED").length,
      draft: reports.filter((r) => r.status === "DRAFT").length,
    };
  }, [reports]);

  const updateSelected = async () => {
    if (!selectedReport) return;
    if (
      selectedReport.accomplishment.trim() === "" ||
      selectedReport.in_progress.trim() === "" ||
      selectedReport.plan.trim() === ""
    )
      return;
    const updateBody: DACN.UpdateReportDto = {
      accomplishment: selectedReport.accomplishment,
      in_progress: selectedReport.in_progress,
      plan: selectedReport.plan,
      blocker: selectedReport.blocker,
      progress_percentage: Number(selectedReport.progress_percentage),
      progress_notes: selectedReport.progress_notes,
    };
    try {
      await updateReport(updateBody, selectedReport.id);
      notifications.show({
        title: "Thành công",
        message: "Cập nhật báo cáo thành công.",
        color: "green",
      });
      setUpdated(!updated);
      setIsEditing(false);
    } catch (error) {
      notifications.show({
        title: "Đã có lỗi xảy ra",
        message:
          "Đã có lỗi xảy ra khi cập nhật báo cáo. Vui lòng cập nhật lại sau.",
        color: "red",
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReport) return;
    try {
      await submitReport(selectedReport.id);
      notifications.show({
        title: "Thành công",
        message: "Báo cáo đã được nộp thành công.",
        color: "green",
      });
      setUpdated(!updated);
    } catch (error) {
      notifications.show({
        title: "Đã có lỗi xảy ra",
        message: "Đã có lỗi xảy ra khi nộp báo cáo. Vui lòng thao tác lại.",
        color: "red",
      });
    }
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
        title: "Đã nộp báo cáo",
        message: "Báo cáo hàng tuần của bạn đã được nộp thành công.",
        color: "green",
      });
      reset();
      setCreateOpen(false);
    } catch (error) {
      notifications.show({
        title: "Nộp báo cáo thất bại",
        message:
          "Đã có lỗi xảy ra trong quá trình nộp báo cáo. Vui lòng thử lại.",
        color: "red",
      });
    }
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
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full" type="button">
                <Plus className="mr-2 h-4 w-4" />
                Báo cáo mới
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="mb-4">
                <DialogTitle>NỘP BÁO CÁO HÀNG TUẦN</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2">
                  <div>
                    <Label>
                      Ngày bắt đầu tuần <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      control={control}
                      name="week_starting"
                      render={({ field }) => (
                        <div className="relative group mt-1">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                          <Input
                            type="date"
                            value={
                              typeof field.value === "string" ? field.value : ""
                            }
                            onChange={(e) => field.onChange(e.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            className="bg-white pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
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
                      Tiến độ (%) <span className="text-red-500">*</span>
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
                      Công việc đã hoàn thành{" "}
                      <span className="text-red-500">*</span>
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
                      Công việc đang thực hiện{" "}
                      <span className="text-red-500">*</span>
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
                      Kế hoạch tuần tới <span className="text-red-500">*</span>
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
                    <Label>Khó khăn / Vướng mắc</Label>
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
                    <Label>Ghi chú tiến độ</Label>
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
                    Hủy
                  </Button>
                  <Button type="submit">
                    <Send className="mr-2 h-4 w-4" />
                    Nộp báo cáo
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
              {pagedReports.length === 0 && !loading ? (
                <EmptyState
                  title="Không có báo cáo hàng tuần"
                  hint="Hãy thử điều chỉnh bộ lọc hoặc nộp một báo cáo mới."
                />
              ) : loading ? (
                <Center style={{ height: "50vh" }}>
                  <Loader color="green" />
                </Center>
              ) : (
                pagedReports.map((r) => {
                  const active = r.id === selectedReport?.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedReport(r)}
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
              <div className="flex justify-end gap-3">
                <ChevronLeft
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => {
                    if (currentPageSafe > 0)
                      setCurrentPage(currentPageSafe - 1);
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
          {selectedReport ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-sm">
                      {`# ${selectedReport.id.slice(0, 5)} `}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={statusVariant(selectedReport.status)}
                      className="rounded-full"
                    >
                      {statusLabel(selectedReport.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-semibold text-foreground">
                      {clampProgress(selectedReport.progress_percentage)}%
                    </span>
                  </div>
                  <ProgressBar value={selectedReport.progress_percentage} />
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Updated: {formatDateShort(selectedReport.updated_at)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đã hoàn thành
                    </div>
                    <ReadonlyTextarea
                      value={selectedReport?.accomplishment}
                      readonly={!isEditing}
                      onChange={(newValue) =>
                        setSelectedReport((prev) =>
                          prev ? { ...prev, accomplishment: newValue } : prev,
                        )
                      }
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                    {selectedReport?.accomplishment.trim() === "" && (
                      <span className="text-sm text-red-500">
                        Vui lòng điền thông tin
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Công việc đang thực hiện
                    </div>
                    <ReadonlyTextarea
                      value={selectedReport?.in_progress}
                      readonly={!isEditing}
                      onChange={(newValue) =>
                        setSelectedReport((prev) =>
                          prev ? { ...prev, in_progress: newValue } : prev,
                        )
                      }
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                    {selectedReport?.in_progress?.trim() === "" && (
                      <span className="text-sm text-red-500">
                        Vui lòng điền thông tin
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Kế hoạch tuần tới
                    </div>
                    <ReadonlyTextarea
                      value={selectedReport?.plan}
                      readonly={!isEditing}
                      onChange={(newValue) =>
                        setSelectedReport((prev) =>
                          prev ? { ...prev, plan: newValue } : prev,
                        )
                      }
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                    {selectedReport?.plan.trim() === "" && (
                      <span className="text-sm text-red-500">
                        Vui lòng điền thông tin
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-foreground">
                      Khó khăn / Vướng mắc
                    </div>
                    <ReadonlyTextarea
                      value={selectedReport?.blocker}
                      readonly={!isEditing}
                      onChange={(newValue) =>
                        setSelectedReport((prev) =>
                          prev ? { ...prev, blocker: newValue } : prev,
                        )
                      }
                      className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    Ghi chú tiến độ
                  </div>
                  <ReadonlyTextarea
                    value={selectedReport?.progress_notes}
                    readonly={!isEditing}
                    onChange={(newValue) =>
                      setSelectedReport((prev) =>
                        prev ? { ...prev, progress_notes: newValue } : prev,
                      )
                    }
                    className={`whitespace-pre-wrap rounded-xl border ${isEditing ? "bg-white" : "bg-muted/30"} p-3 text-sm text-foreground`}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setSelectedReport(
                          reports.find(
                            (r: DACN.ReportResponseDto) =>
                              r.id === selectedReport.id,
                          ) ?? null,
                        );
                        setIsEditing(false);
                      }}
                    >
                      Hủy
                    </Button>
                  )}
                  {selectedReport?.status === "DRAFT" && (
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={() =>
                        isEditing ? updateSelected() : setIsEditing(!isEditing)
                      }
                    >
                      {isEditing ? "Lưu" : "Chỉnh sửa"}
                    </Button>
                  )}
                  {selectedReport?.status === "DRAFT" && isEditing !== true && (
                    <Button
                      type="button"
                      className="rounded-full"
                      onClick={handleSubmitReport}
                    >
                      Nộp báo cáo
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
