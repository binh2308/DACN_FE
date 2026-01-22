"use client";

import { 
  Filter, 
  ChevronDown, 
  X, 
  Calendar, 
  RefreshCw 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

// --- Types & Mock Data ---

// 1. Định nghĩa kiểu cho trạng thái quyết định (Thêm phần này để sửa lỗi)
type DecisionMap = Record<number, "approved" | "declined">;

interface LeaveRequest {
  id: number;
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

const mockLeaves: LeaveRequest[] = [
  {
    id: 1,
    name: "abebe gemechu",
    duration: 5,
    startDate: "22/04/2022",
    endDate: "28/04/2022",
    type: "Sick",
    reason: "Personal",
    department: "Sales and Marketing",
    daysRemaining: 3,
    newResumptionDate: "29/04/2022",
    fullReason: "My wife gave birth"
  },
  {
    id: 2,
    name: "aman bey",
    duration: 7,
    startDate: "22/04/2022",
    endDate: "30/04/2022",
    type: "Exam",
    reason: "Examination",
    department: "IT Department",
    daysRemaining: 10,
    newResumptionDate: "01/05/2022",
    fullReason: "Final semester exams"
  },
  {
    id: 3,
    name: "feven tesfaye",
    duration: 120,
    startDate: "22/04/2022",
    endDate: "28/06/2022",
    type: "Maternity",
    reason: "Child Care",
    department: "Human Resources",
    daysRemaining: 0,
    newResumptionDate: "29/06/2022",
    fullReason: "Maternity leave"
  },
  {
    id: 4,
    name: "gelila moges",
    duration: 5,
    startDate: "22/04/2022",
    endDate: "28/04/2022",
    type: "Sick",
    reason: "Personal",
    department: "Finance",
    daysRemaining: 5,
    newResumptionDate: "29/04/2022",
    fullReason: "Medical checkup"
  },
  {
    id: 5,
    name: "yanet tesfaye",
    duration: 5,
    startDate: "22/04/2022",
    endDate: "28/04/2022",
    type: "Sick",
    reason: "Personal",
    department: "Operations",
    daysRemaining: 2,
    newResumptionDate: "29/04/2022",
    fullReason: "Family emergency"
  },
   {
    id: 6,
    name: "beti woloe",
    duration: 5,
    startDate: "22/04/2022",
    endDate: "28/04/2022",
    type: "Sick",
    reason: "Personal",
    department: "Operations",
    daysRemaining: 2,
    newResumptionDate: "29/04/2022",
    fullReason: "Personal leave"
  },
   {
    id: 7,
    name: "dawit int",
    duration: 5,
    startDate: "22/04/2022",
    endDate: "28/04/2022",
    type: "Sick",
    reason: "Personal",
    department: "Sales",
    daysRemaining: 2,
    newResumptionDate: "29/04/2022",
    fullReason: "Feeling unwell"
  },
];

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

           {/* Department */}
           <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
              <div className="w-full bg-gray-100 rounded px-3 py-2 text-gray-800 text-sm">
                 {data.department}
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
  const [activeActionId, setActiveActionId] = useState<number | null>(null);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  // Sử dụng type DecisionMap đã định nghĩa
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const actionRef = useRef<HTMLDivElement>(null);

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

  const handleActionClick = (id: number) => {
    setActiveActionId(activeActionId === id ? null : id);
  };

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
            {mockLeaves.map((leave, index) => {
              const decision = decisions[leave.id];

              const rowBg =
                decision === "approved"
                  ? "bg-[#CCFFCC]"
                  : decision === "declined"
                  ? "bg-[#FFBBBB]"
                  : index % 2 === 1
                  ? "bg-[#F9FAFB]"
                  : "bg-white";

              const rowHover =
                decision ? "" : "hover:bg-gray-50"; // tránh hover ghi đè màu đã chọn

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
                  <td className="py-3 px-4 font-medium">{leave.name}</td>
                  <td className="py-3 px-4 text-center">{leave.duration}</td>
                  <td className="py-3 px-4">{leave.startDate}</td>
                  <td className="py-3 px-4">{leave.endDate}</td>
                  <td className="py-3 px-4">{leave.type}</td>
                  <td className="py-3 px-4">{leave.reason}</td>
                  <td className="py-3 px-4 text-center relative">
                    <button 
                      onClick={() => handleActionClick(leave.id)}
                      className="inline-flex items-center gap-1 bg-[#536E68] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#3E524D] transition-colors"
                    >
                      Actions <ChevronDown size={14} />
                    </button>

                    {/* Dropdown Actions */}
                    {activeActionId === leave.id && (
                      <div 
                        ref={actionRef}
                        className="absolute right-4 top-10 w-32 bg-[#536E68] text-white rounded shadow-lg z-10 flex flex-col text-xs text-left overflow-hidden"
                      >
                        <button 
                          onClick={() => handleApprove(leave.id)}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleDecline(leave.id)}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => handleViewDetails(leave)}
                          className="px-3 py-2 hover:bg-[#3E524D] border-b border-[#3E524D]/50 text-left font-semibold"
                        >
                          View Details
                        </button>
                      </div>
                    )}
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