"use client";

import { get } from "http";
import {
  Filter,
  ChevronDown,
  X,
  Calendar,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import { myRequests } from "@/services/DACN/request";
import next from "next";
// --- Types & Mock Data ---

// 1. Định nghĩa kiểu cho trạng thái quyết định (Thêm phần này để sửa lỗi)
type DecisionMap = Record<number, "approved" | "declined">;

interface LeaveRequest {
  date_from: string;
  date_to: string;
  status: string;
  reason: string;
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
  return Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
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
    duration -
      Math.ceil(
        (currentDate.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24),
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
                  <Calendar size={16} className="text-gray-400" />
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
                  <Calendar size={16} className="text-gray-400" />
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

// 2. Main Page (Giống ảnh 1)
export default function LeaveManagementPage() {
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [myLeaves, setMyLeaves] = useState<any | null>([
    {
      date_from: "22/04/2022",
      date_to: "28/04/2022",
      status: "APPROVED",
      reason: "Personal",
    },
  ]);
  // Sử dụng type DecisionMap đã định nghĩa
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const actionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await myRequests();
        if (data) {
          console.log("Fetched leave requests:", data.data);
          setMyLeaves(data.data.items);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    }
    fetchData();
  }, []);

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

  const handleViewDetails = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setActiveActionId(null);
  };

  const handleApprove = (id: number) => {
    setDecisions((prev) => ({ ...prev, [id]: "approved" }));
    setActiveActionId(null);
  };

  const handleDecline = (id: number) => {
    setDecisions((prev) => ({ ...prev, [id]: "declined" }));
    setActiveActionId(null);
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
          <button className="flex items-center gap-2 bg-main-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#0c820c] transition-colors">
            New request <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto pb-20">
        {" "}
        {/* pb-20 để chừa chỗ cho dropdown cuối bảng */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FFFF99] text-gray-800 text-sm font-bold">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Duration(s)</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4">End Date</th>
              <th className="py-3 px-4">Reason(s)</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {myLeaves.map((leave, index) => {
              const decision = decisions[leave.id];
              const textColor =
                leave.status === "APPROVED"
                  ? "text-emerald-500"
                  : "text-amber-500";
              const rowBg =
                decision === "approved"
                  ? "bg-[#CCFFCC]"
                  : decision === "declined"
                    ? "bg-[#FFBBBB]"
                    : index % 2 === 1
                      ? "bg-[#F9FAFB]"
                      : "bg-white";

              const rowHover = decision ? "" : "hover:bg-gray-50"; // tránh hover ghi đè màu đã chọn

              const rowAccent =
                decision === "approved"
                  ? "border-l-4 border-l-[#0B9F57]"
                  : decision === "declined"
                    ? "border-l-4 border-l-[#FF5A5A]"
                    : "";

              return (
                <tr
                  key={leave.id}
                  className={`border-b border-gray-100 transition-colors ${rowBg} ${rowHover} ${rowAccent}`}
                >
                  <td className={`py-3 px-4 font-medium ${textColor}`}>
                    {leave.status}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getDuration(leave.date_from, leave.date_to)}
                  </td>
                  <td className="py-3 px-4">
                    {getFormattedDate(leave.date_from)}
                  </td>
                  <td className="py-3 px-4">
                    {getFormattedDate(leave.date_to)}
                  </td>
                  <td className="py-3 px-4">{leave.reason}</td>
                  <td className="py-3 px-4 text-center relative">
                    <button
                      onClick={() => handleViewDetails(leave)}
                      className="inline-flex items-center gap-1 bg-[#536E68] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#3E524D] transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
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
