"use client";

import { 
  Filter, 
  ChevronDown, 
  X, 
  Calendar, 
  RefreshCw 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRequest } from "ahooks";

import {
  getDepartmentLeaveRequests,
  getLeaveRequestById,
  processLeaveRequest,
  type DepartmentLeaveRequestsResponse,
  type LeaveRequestDetailResponse,
} from "@/services/DACN/request";

// --- Types & Mock Data ---

// 1. Định nghĩa kiểu cho trạng thái quyết định (Thêm phần này để sửa lỗi)
type DecisionMap = Record<string, "approved" | "REJECTED">;

interface LeaveRequest {
  id: string;
  name: string;
  duration: number; // số ngày
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  department: string; // Thêm trường này cho modal
  daysRemaining: number; // Thêm trường này cho modal
  newResumptionDate: string; // Thêm trường này cho modal
  fullReason: string; // Lý do chi tiết
}

function formatDateDmy(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function diffDaysInclusive(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const ms = to.getTime() - from.getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, days);
}

function addDaysDmy(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return formatDateDmy(d.toISOString());
}

function mapApiToUi(res: DepartmentLeaveRequestsResponse | null | undefined): LeaveRequest[] {
  const items = res?.data?.items ?? [];
  return items.map((it) => {
    const startDate = formatDateDmy(it.date_from);
    const endDate = formatDateDmy(it.date_to);
    return {
      id: it.id,
      name: it.employee?.name ?? "",
      duration: diffDaysInclusive(it.date_from, it.date_to),
      startDate,
      endDate,
      // API không trả type -> dùng status để vẫn lấp cột Type mà không đổi layout
      type: String(it.status ?? "").toUpperCase(),
      reason: it.reason ?? "",
      department: "",
      daysRemaining: 0,
      newResumptionDate: addDaysDmy(it.date_to, 1),
      fullReason: it.reason ?? "",
    };
  });
}

function mapDetailToUi(
  res: LeaveRequestDetailResponse | null | undefined,
): Partial<LeaveRequest> {
  const data = res?.data;
  if (!data) return {};
  return {
    name: data.employee?.name ?? "",
    startDate: formatDateDmy(data.date_from),
    endDate: formatDateDmy(data.date_to),
    duration: diffDaysInclusive(data.date_from, data.date_to),
    type: String(data.status ?? "").toUpperCase(),
    reason: data.reason ?? "",
    newResumptionDate: addDaysDmy(data.date_to, 1),
    // Ưu tiên description (chi tiết), fallback reason
    fullReason: data.description || data.reason || "",
  };
}

// --- Components ---

// 1. Modal Chi Tiết (Giống ảnh 2)
function LeaveDetailModal({ 
  data, 
  onClose 
}: { 
  data: LeaveRequest; 
  onClose: () => void; 
}) {
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
                <p className="text-sm text-gray-500">View detailed information of employee leave request</p>
             </div>
             <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={24} />
             </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
           {/* Employee Name */}
           <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Employee Name</label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm">
                 {data.name}
              </div>
           </div>

           {/* Date Row */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                 <div className="relative">
                    <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                       {data.startDate}
                       <Calendar size={16} className="text-gray-400"/>
                    </div>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                 <div className="relative">
                    <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                       {data.endDate}
                       <Calendar size={16} className="text-gray-400"/>
                    </div>
                 </div>
              </div>
           </div>

           {/* Remaining & Resumption Row */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">Days Remaining</label>
                 <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                    {data.daysRemaining}
                    <div className="flex flex-col gap-0.5">
                       <ChevronDown size={12} className="rotate-180 text-gray-400"/>
                       <ChevronDown size={12} className="text-gray-400"/>
                    </div>
                 </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-600 mb-1">New Resumption Date</label>
                 <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm flex items-center justify-between">
                    {data.newResumptionDate}
                    <Calendar size={16} className="text-gray-400"/>
                 </div>
              </div>
           </div>

           {/* Reason */}
           <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Reason</label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm min-h-[60px]">
                 {data.fullReason}
              </div>
           </div>
        </div>

        {/* Footer Buttons */}
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

// 2. Main Page (Giống ảnh 1)
export default function LeaveManagementPage() {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  // Sử dụng type DecisionMap đã định nghĩa
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const actionRef = useRef<HTMLDivElement>(null);

  const {
    data: leaveRes,
    loading: isLoading,
    error,
    refresh: refreshLeaves,
  } = useRequest(async () => {
    const resRaw = await getDepartmentLeaveRequests({ page: 1, pageSize: 20 });
    return resRaw as unknown as DepartmentLeaveRequestsResponse;
  });

  const {
    runAsync: fetchLeaveDetail,
  } = useRequest(
    async (id: string) => {
      const resRaw = await getLeaveRequestById(id);
      return resRaw as unknown as LeaveRequestDetailResponse;
    },
    { manual: true },
  );

  const {
    runAsync: processLeave,
  } = useRequest(
    async (id: string, status: "APPROVED" | "REJECTED") => {
      const description =
        status === "APPROVED"
          ? "Approved"
          : "REJECTED";

      return processLeaveRequest(id, {
        status
      });
    },
    { manual: true },
  );

  const leaves = mapApiToUi(leaveRes);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
        setActiveActionId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleActionClick = (id: string) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

  const handleRowClick = async (leave: LeaveRequest) => {
    setActiveActionId(null);
    try {
      const detailRes = await fetchLeaveDetail(leave.id);
      const merged: LeaveRequest = {
        ...leave,
        ...mapDetailToUi(detailRes),
      };
      setSelectedLeave(merged);
    } catch {
      // Fallback: vẫn mở modal với dữ liệu list nếu call detail fail
      setSelectedLeave(leave);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await processLeave(id, "APPROVED");
      setDecisions((prev) => ({ ...prev, [id]: "approved" }));
      refreshLeaves();
    } catch (e) {
      console.error("Failed to approve leave request", e);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await processLeave(id, "REJECTED");
      setDecisions((prev) => ({ ...prev, [id]: "REJECTED" }));
      refreshLeaves();
    } catch (e) {
      console.error("Failed to decline leave request", e);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Leave History</h1>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
             <Filter size={20} className="fill-current" />
          </button>
          <button className="flex items-center gap-2 bg-[#2D2D2D] text-white px-4 py-2 rounded text-sm font-medium hover:bg-black transition-colors">
             Export <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pb-20"> {/* pb-20 để chừa chỗ cho dropdown cuối bảng */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FFFF99] text-gray-800 text-sm font-bold">
              <th className="py-3 px-4">Name(s)</th>
              <th className="py-3 px-4 text-center">Duration(s)</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4">End Date</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Reason(s)</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  Loading data from API...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-red-600">
                  Failed to load leave requests. Please try again.
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500 italic">
                  No leave requests found.
                </td>
              </tr>
            ) : (
            leaves.map((leave, index) => {
              const decision =
                decisions[leave.id] ??
                (leave.type === "APPROVED"
                  ? "approved"
                  : leave.type === "REJECTED"
                  ? "REJECTED"
                  : undefined);

              const rowBg =
                decision === "approved"
                  ? "bg-[#CCFFCC]"
                  : decision === "REJECTED"
                  ? "bg-[#FFBBBB]"
                  : index % 2 === 1
                  ? "bg-[#F9FAFB]"
                  : "bg-white";

              const rowHover =
                decision ? "" : "hover:bg-gray-50"; // tránh hover ghi đè màu đã chọn

              const rowAccent =
                decision === "approved"
                  ? "border-l-4 border-l-[#0B9F57]"
                  : decision === "REJECTED"
                  ? "border-l-4 border-l-[#FF5A5A]"
                  : "";

              return (
                <tr
                  key={leave.id}
                  onClick={() => handleRowClick(leave)}
                  className={`border-b border-gray-100 transition-colors cursor-pointer ${rowBg} ${rowHover} ${rowAccent}`}
                >
                  <td className="py-3 px-4 font-medium">{leave.name}</td>
                  <td className="py-3 px-4 text-center">{leave.duration}</td>
                  <td className="py-3 px-4">{leave.startDate}</td>
                  <td className="py-3 px-4">{leave.endDate}</td>
                  <td className="py-3 px-4">{leave.type}</td>
                  <td className="py-3 px-4">{leave.reason}</td>
                  <td className="py-3 px-4 text-center relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActionClick(leave.id);
                      }}
                      className="inline-flex items-center gap-1 bg-[#536E68] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#3E524D] transition-colors"
                    >
                      Actions <ChevronDown size={14} />
                    </button>

                    {/* Dropdown Actions */}
                    {activeActionId === leave.id && (
                      <div 
                        ref={actionRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-4 top-10 w-32 bg-[#536E68] text-white rounded shadow-lg z-10 flex flex-col text-xs text-left overflow-hidden"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleApprove(leave.id);
                          }}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDecline(leave.id);
                          }}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleRowClick(leave);
                          }}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
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