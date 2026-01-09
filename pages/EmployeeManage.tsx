// EmployeeManage.tsx
"use client"; // Thêm dòng này nếu dùng Next.js App Router

import { Search, Plus, Filter, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRequest } from "ahooks"; // 1. Import hook
import { getEmployees } from "@/services/DACN/employee"; // 2. Import api service

interface Employee {
  no: number;
  id: string;
  fullname: string;
  role: string;
  phone: string;
  email: string;
  signDay: string;
}

export default function EmployeeManage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 3. Sử dụng useRequest để gọi API
  const { loading, error } = useRequest(getEmployees, {
    manual: false, // Tự động chạy khi component mount
    onSuccess: (data: any) => {
      // Xử lý dữ liệu trả về từ API để khớp với giao diện
      // Lưu ý: Kiểm tra cấu trúc data trả về thực tế (data.data hoặc data)
      const listData = Array.isArray(data) ? data : data?.data || [];
      
      const mappedData = listData.map((item: any, index: number) => ({
        no: index + 1,
        id: item._id || item.id || "N/A", // Map trường ID từ API
        fullname: item.fullname || `${item.lastName || ""} ${item.middleName || ""} ${item.firstName || ""}`.trim(),
        role: item.roles ? item.roles.join(", ") : "Employee",
        phone: item.phone || "N/A",
        email: item.email || "N/A",
        signDay: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A",
      }));
      
      setEmployees(mappedData);
    },
    onError: (err) => {
      console.error("Failed to fetch employees:", err);
    }
  });

  // ... Phần xử lý xóa (handleDelete) và lọc (filteredEmployees) giữ nguyên ...
  const handleDelete = (no: number) => {
    setEmployees(employees.filter((emp) => emp.no !== no));
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-white">
      {/* ... Phần Header giữ nguyên ... */}
      <div className="flex items-center justify-between mb-4">
         {/* ... (Code input search, button filter/create giữ nguyên) ... */}
         <div className="relative w-52">
          <input
            type="text"
            placeholder="Search by ID, Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-xs italic text-[#A2A2A2] border border-[#B6B6B6] rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2A2]" />
        </div>
        
        <div className="flex items-center gap-3">
             {/* ... (Buttons giữ nguyên) ... */}
             <button className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D]">
                <Filter className="w-4 h-4" /> <span>Inactive</span>
             </button>
             <button className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D]">
                <Plus className="w-4 h-4" /> <span>Create Account</span>
             </button>
        </div>
      </div>

      <div className="border border-[#C1C7D0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontFamily: "Poppins, sans-serif" }}>
            <thead>
               {/* ... (Phần Thead giữ nguyên) ... */}
              <tr className="border-b border-[#C1C7D0]">
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-16">No.</th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">ID</th>
                <th className="px-10 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-48">Fullname</th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">Role</th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">Phone</th>
                <th className="px-9 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-44">Email</th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-36">Sign Day</th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black w-32">Action</th>
              </tr>
            </thead>
            <tbody>
              {/* 4. Hiển thị trạng thái Loading hoặc Lỗi */}
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">Loading data...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-red-500">Error loading data</td>
                </tr>
              )}

              {/* 5. Hiển thị dữ liệu */}
              {!loading && !error && filteredEmployees.map((employee) => (
                <tr
                  key={employee.no}
                  className="border-b border-[#C1C7D0] last:border-0"
                >
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.no}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.id}
                  </td>
                  <td className="px-10 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.fullname}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.role}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.phone}
                  </td>
                  <td className="px-9 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.email}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.signDay}
                  </td>
                  <td className="px-3 py-2.5 text-center border-[#C1C7D0]">
                    <button
                      onClick={() => handleDelete(employee.no)}
                      className="inline-flex items-center justify-center hover:bg-red-50 rounded p-1 transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}