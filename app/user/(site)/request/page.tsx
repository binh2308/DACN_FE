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
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick a starting date"),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please pick ending date"),
  reason: z.string().min(3, "Reason is required").max(500),
  description: z.string().min(5, "Description is required").max(500),
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
      return "Approved";
    case "PENDING":
      return "Pending";
    case "REJECTED":
      return "Rejected";
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
  return new Date(dateStr).toLocaleDateString("en-GB", {
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
              <h2 className="text-xl font-bold text-gray-900">Leave Details</h2>
              <p className="text-sm text-gray-500">
                View detailed information of employee leave request
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
                Start Date
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
                End Date
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
                Days Remaining
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
                New Resumption Date
              </label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                {nextDay.toLocaleDateString("en-GB", {
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
              Reason
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
            {data.status === "APPROVED" ? "Approved" : "Pending"}
          </button>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full border border-red-500 text-red-500 font-semibold py-2.5 rounded hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// function LeaveCreateModal({ onClose }: { onClose: () => void }) {
//   const form = useForm<LeaveFormValues>({
//     initialValues: {
//       date_from: null,
//       date_to: null,
//       reason: "",
//       description: "",
//     },

//     validate: {
//       date_from: (value) => (!value ? "Vui lòng chọn ngày bắt đầu" : null),
//       date_to: (value, values) => {
//         if (!value) return "Vui lòng chọn ngày kết thúc";
//         if (values.date_from && value < values.date_from) {
//           return "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu";
//         }
//         return null;
//       },
//       reason: (value) =>
//         value.trim().length < 3 ? "Nhập lý do nghỉ phép" : null,
//     },
//   });

//   const handleSubmit = async (values: LeaveFormValues) => {
//     const data = {
//       date_from: values.date_from,
//       date_to: values.date_to,
//       reason: values.reason,
//       description: values.description,
//     };
//     try {
//       await createLeaveRequest(data);
//       notifications.show({
//         title: "Success",
//         message: "Leave request created successfully",
//         color: "green",
//       });
//       form.reset();
//       onClose();
//     } catch (error) {
//       notifications.show({
//         title: "Error",
//         message: "Failed to create leave request",
//         color: "red",
//       });
//     }
//   };
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
//         {/* Header Modal */}
//         <div className="p-6 pb-2">
//           <div className="flex items-start gap-3">
//             <div className="mt-1">
//               <RefreshCw size={32} className="text-gray-800" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-900">
//                 Create Leave Request
//               </h2>
//               <p className="text-sm text-gray-500">
//                 Fill in the details to create a new leave request
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-auto text-gray-400 hover:text-gray-600"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>
//         <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
//           <div className="p-6 space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <div className="relative">
//                   <DatePickerInput
//                     label="Start Date"
//                     labelProps={{
//                       className: "text-sm font-medium text-gray-600 mb-1",
//                     }}
//                     placeholder="Chọn ngày bắt đầu"
//                     valueFormat="DD/MM/YYYY"
//                     required
//                     rightSection={
//                       <Calendar size={16} className="text-gray-400" />
//                     }
//                     {...form.getInputProps("date_from")}
//                     onChange={(value) => {
//                       form.setFieldValue("date_from", value);

//                       const date_to = form.values.date_to;
//                       if (value && date_to && date_to < value) {
//                         form.setFieldValue("date_to", null);
//                       }
//                     }}
//                   />
//                 </div>
//               </div>
//               <div>
//                 <div className="relative">
//                   <DatePickerInput
//                     label="End Date"
//                     labelProps={{
//                       className: "text-sm font-medium text-gray-600 mb-1",
//                     }}
//                     placeholder="Chọn ngày kết thúc"
//                     required
//                     valueFormat="DD/MM/YYYY"
//                     minDate={form.values.date_from ?? undefined}
//                     rightSection={
//                       <Calendar size={16} className="text-gray-400" />
//                     }
//                     {...form.getInputProps("date_to")}
//                   />
//                 </div>
//               </div>
//             </div>

//             <div>
//               <TextInput
//                 label="Reason"
//                 labelProps={{
//                   className: "block text-sm font-medium text-gray-600 mb-1",
//                 }}
//                 required
//                 placeholder="Nhập lý do nghỉ phép"
//                 {...form.getInputProps("reason")}
//               />
//             </div>

//             <div>
//               <Textarea
//                 rows={3}
//                 label="Description"
//                 labelProps={{
//                   className: "block text-sm font-medium text-gray-600 mb-1",
//                 }}
//                 placeholder="Mô tả chi tiết"
//                 {...form.getInputProps("description")}
//               />
//             </div>
//           </div>

//           {/* Footer Buttons */}
//           <div className="px-6 py-3 pt-0">
//             <Button fullWidth color="green.7" type="submit" h={45} fw={600}>
//               Submit
//             </Button>
//           </div>
//         </form>
//         <div className="p-6 pt-0">
//           <button
//             onClick={onClose}
//             className="w-full border border-red-500 text-red-500 font-semibold py-2.5 rounded hover:bg-red-50 transition-colors"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  // useEffect(() => {
  //   async function fetchAttendanceHistory() {
  //     try {
  //       const res = await getMyAttendanceMonthlySummary({
  //         year: new Date().getFullYear(),
  //         month: new Date().getMonth() + 1,
  //       });
  //       console.log("Attendance history : ", res);
  //       setAttendanceHistory(res?.data);
  //     } catch (error) {
  //       console.error("Error fetching leave history:", error);
  //     }
  //   }

  //   fetchAttendanceHistory();
  // }, []);
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

  // const handleApprove = (id: number) => {
  //   setDecisions((prev) => ({ ...prev, [id]: "approved" }));
  //   setActiveActionId(null);
  // };

  // const handleDecline = (id: number) => {
  //   setDecisions((prev) => ({ ...prev, [id]: "declined" }));
  //   setActiveActionId(null);
  // };

  const onSubmit = async (data: LeaveFormData) => {
    try {
      await createLeaveRequest(data);
      reset();
      notifications.show({
        title: "Request submitted",
        message: "Your leave request has been submitted successfully.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Failed to submit request",
        message:
          "An error occurred while submitting your request. Please try again.",
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
            Create leave request and view leave history
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
            <Filter size={20} className="fill-current" />
          </button>
          <button
            className="flex items-center gap-2 bg-main-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#0c820c] transition-colors"
            onClick={() => setOpenCreateModal(true)}
          >
            New request <Plus size={16} />
          </button>
        </div> */}
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-60">
        {/* <div className="bg-white rounded-lg p-4 shadow-sm border border-grey-50">
          <h3 className="text-lg font-semibold text-grey-900 mb-3">
            Attendance Tracking
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-grey-900">Worked Days</span>
                <span className="text-sm text-muted-foreground">
                  {attendanceHistory?.workedDays} of{" "}
                  {attendanceHistory?.requiredWorkingDays} day(s)
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                <div
                  className="h-full bg-main-600 rounded-full"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        attendanceHistory?.workedDays
                          ? (attendanceHistory?.workedDays /
                              attendanceHistory?.requiredWorkingDays) *
                              100
                          : 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-grey-900">Absent</span>
                <span className="text-sm text-muted-foreground">
                  {attendanceHistory?.absentDays} of{" "}
                  {attendanceHistory?.requiredWorkingDays} day(s)
                </span>
              </div>
              <div className="w-full h-1.5 bg-neutral-bar rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        attendanceHistory?.absentDays
                          ? (attendanceHistory?.requiredWorkingDays /
                              attendanceHistory?.requiredWorkingDays) *
                              100
                          : 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div> */}

        <div className="col-span-2 bg-white rounded-lg p-4 shadow-sm border border-grey-50 flex flex-col">
          <h3 className="text-lg font-semibold text-grey-900">
            Create leave request
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-2">
              <div>
                <Label>
                  Start date <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="date_from"
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
                        className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
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
                  End date <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="date_to"
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
                        min={
                          typeof dateFromValue === "string" && dateFromValue
                            ? dateFromValue
                            : undefined
                        }
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="pl-9 cursor-pointer hover:border-[#4F7D7B] transition-colors [&::-webkit-calendar-picker-indicator]:hidden"
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
                  Reason <span className="text-red-500">*</span>
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
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  className="mt-1"
                  {...register("description")}
                  rows={5}
                  placeholder="Mô tả chi tiết"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <Button className="col-span-2" type="submit">
                Submit
              </Button>
            </div>
          </form>
        </div>
        <div className="col-span-2 border border-gray-200 rounded-xl p-6 min-h-[600px] relative flex flex-col">
          <div className="flex mb-4">
            <span className="text-sm font-semibold text-gray-600">
              Leave History
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