"use client";

import {
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  RefreshCw,
  Plus,
  Pin,
  MessageSquare,
  Heart,
} from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import {
  Center,
  Loader,
  Button as MantineButton,
  TextInput,
} from "@mantine/core";
import { Controller, set, useForm } from "react-hook-form";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { myRequests, createLeaveRequest } from "@/services/DACN/request";
import {
  getMyAttendanceMonthlySummary,
  type MonthlyAttendanceSummaryDto,
} from "@/services/DACN/attendance";
import { formatDate } from "@/lib/utils";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// --- Types & Mock Data ---

// 1. Định nghĩa kiểu cho trạng thái quyết định (Thêm phần này để sửa lỗi)
const leaveSchema = z.object({
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày bắt đầu"),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Vui lòng chọn ngày kết thúc"),
  reason: z.string().min(3, "Lý do là bắt buộc").max(500),
  description: z.string().min(5, "Mô tả là bắt buộc").max(500),
});

type LeaveFormData = z.infer<typeof leaveSchema>;
type DecisionMap = Record<number, "approved" | "declined">;

type LeaveFormValues = {
  date_from: Date | string | null;
  date_to: Date | string | null;
  reason: string;
  description: string;
};

interface LeaveRequest {
  id: string;
  date_from: string;
  date_to: string;
  created_at?: string;
  status: string;
  reason: string;
}

function statusLabel(s: string) {
  switch (s) {
    case "APPROVED":
      return "Đã duyệt";
    case "PENDING":
      return "Đang chờ";
    case "REJECTED":
      return "Từ chối";
    default:
      return s;
  }
}

function statusVariant(s: string): "default" | "secondary" | "destructive" {
  switch (s) {
    case "REJECTED":
      return "destructive";
    case "PENDING":
      return "secondary";
    case "APPROVED":
    default:
      return "default";
  }
}

const getFormattedDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
const getDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1
  );
};
const getRemainingDays = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const currentDate = new Date();
  const duration = getDuration(start, end);
  const daysPassed = Math.ceil(
    (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, duration - daysPassed);
};

// --- Components ---

// 1. Modal Chi Tiết (Giống ảnh 2)
function LeaveDetailModal({
  data,
  onClose,
}: {
  data: LeaveRequest;
  onClose: () => void;
}) {
  const dateFrom = new Date(data.date_from);
  const dateTo = new Date(data.date_to);
  const currentDate = new Date();
  const nextDay = new Date(data.date_to);
  const statusBg =
    data.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500";
  const statusBorder =
    data.status === "APPROVED" ? "border-emerald-500" : "border-amber-500";
  nextDay.setDate(nextDay.getDate() + 1);
  const duration =
    (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (dateTo.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Modal */}
        <div className="p-6 pb-2">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <RefreshCw size={32} className="text-gray-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chi tiết nghỉ phép</h2>
              <p className="text-sm text-gray-500">
                Xem thông tin chi tiết về yêu cầu nghỉ phép của nhân viên
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Employee Name */}

          {/* Department */}

          {/* Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Ngày bắt đầu
              </label>
              <div className="relative">
                <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                  {getFormattedDate(data.date_from)}
                  {/* <Calendar size={16} className="text-gray-400" /> */}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Ngày kết thúc
              </label>
              <div className="relative">
                <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                  {getFormattedDate(data.date_to)}
                  {/* <Calendar size={16} className="text-gray-400" /> */}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining & Resumption Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Số ngày nghỉ còn lại
              </label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                {daysRemaining}
                <div className="flex flex-col">
                  <ChevronDown size={10} className="rotate-180 text-gray-400" />
                  <ChevronDown size={10} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Ngày đi làm lại
              </label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                {nextDay.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                <Calendar size={16} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Lý do
            </label>
            <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm min-h-[60px]">
              {data.reason}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-3 pt-0">
          <button
            className={`w-full ${statusBg} border ${statusBorder} text-white font-semibold py-2.5 rounded`}
          >
            {data.status === "APPROVED" ? "Đã duyệt" : "Đang chờ"}
          </button>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full border border-red-500 text-red-500 font-semibold py-2.5 rounded hover:bg-red-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Main Page
export default function LeaveManagementPage() {
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[] | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPage, setTotalPage] = useState<number>(0);
  // Sử dụng type DecisionMap đã định nghĩa
  const [render, setRender] = useState<boolean>(false);
  const actionRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,

    watch,
    formState: { errors, isSubmitted },
    reset,
  } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
  });

  const dateFromValue = watch("date_from");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await myRequests();
        if (data) {
          setMyLeaves(data.data.items);
          setTotalPage(Math.ceil(data.data.items.length / 4));
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    }

    fetchData();
  }, [isSubmitted]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionRef.current &&
        !actionRef.current.contains(event.target as Node)
      ) {
        setActiveActionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const myLeaveAtPage = myLeaves?.slice(
    currentPage * 4,
    Math.min(currentPage * 4 + 4, myLeaves.length),
  );

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setActiveActionId(null);
  };

  const onSubmit = async (data: LeaveFormData) => {
    try {
      await createLeaveRequest(data);
      reset();
      notifications.show({
        title: "Đã nộp yêu cầu",
        message: "Yêu cầu nghỉ phép của bạn đã được nộp thành công.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Nộp yêu cầu thất bại",
        message:
          "Đã có lỗi xảy ra trong quá trình nộp yêu cầu. Vui lòng thử lại.",
        color: "red",
      });
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#21252B]">Request Tracking</h1>
          <p className="text-sm text-gray-500">
            Tạo yêu cầu nghỉ phép và xem lịch sử nghỉ phép
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:h-60">
        <div className="col-span-2 bg-white rounded-lg p-4 shadow-sm border border-grey-50 flex flex-col">
          <h3 className="text-lg font-semibold text-grey-900">
            Tạo yêu cầu nghỉ phép
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2">
              <div>
                <Label>
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="date_from"
                  render={({ field }) => (
                    <div className="relative group mt-1">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                      <input
                        type="date"
                        value={
                          typeof field.value === "string" ? field.value : ""
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
                        required
                      />
                    </div>
                  )}
                />
                {errors.date_from && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.date_from.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="date_to"
                  render={({ field }) => (
                    <div className="relative group mt-1">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-[#4F7D7B] transition-colors" />
                      <input
                        type="date"
                        value={
                          typeof field.value === "string" ? field.value : ""
                        }
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        min={
                          typeof dateFromValue === "string" && dateFromValue
                            ? dateFromValue
                            : undefined
                        }
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
                        required
                      />
                    </div>
                  )}
                />
                {errors.date_to && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.date_to.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label>
                  Lý do <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  {...register("reason")}
                  min={0}
                  max={100}
                  className="mt-1 bg-white"
                />
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.reason.message}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <Label>
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  className="mt-1"
                  {...register("description")}
                  rows={5}
                  placeholder="Mô tả chi tiết lý do nghỉ phép..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <Button className="col-span-2" type="submit">
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        </div>
        <div className="col-span-2 border border-gray-200 rounded-xl p-6 min-h-[600px] relative flex flex-col">
          <div className="flex mb-4">
            <span className="text-sm font-semibold text-gray-600">
              Lịch sử nghỉ phép
            </span>
          </div>

          {/* List Posts */}
          {myLeaves === null && (
            <Center style={{ height: "50vh" }}>
              <Loader color="green" />
            </Center>
          )}
          {myLeaves && (
            <div className="space-y-4 flex-1">
              {myLeaveAtPage?.map((leave) => (
                <div
                  key={leave.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLeave(leave)}
                  className="cursor-pointer border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#0B9F57]/40"
                >
                  {/* Green Left Border Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0B9F57] rounded-l-lg"></div>

                  <div className="pl-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-800">
                          {formatDate(leave.date_from, "DD/MM/YYYY")} -{" "}
                          {formatDate(leave.date_to, "DD/MM/YYYY")}
                        </h3>
                      </div>
                      <Badge
                        variant={statusVariant(leave.status)}
                        className="rounded-full"
                      >
                        {statusLabel(leave.status)}
                      </Badge>
                    </div>

                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {leave.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <div className="flex gap-2">
                        <span className="font-medium text-gray-700">
                          {formatDate(leave.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {myLeaves && (
            <div className="flex justify-center gap-3">
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
        </div>
      </div>

      {/* Render Modal if selected */}
      {selectedLeave && (
        <LeaveDetailModal
          data={selectedLeave}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </div>
  );
}