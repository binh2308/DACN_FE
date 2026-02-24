"use client";

import { Search, Plus, Filter, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEmployee, getEmployees } from "@/services/DACN/employee";
import { employeeDtoToUI, extractEmployeesFromResponseData, type EmployeeUI } from "@/lib/employee-ui";

export default function EmployeeManage() {
  const router = useRouter();
  
  // Khởi tạo danh sách rỗng
  const [employees, setEmployees] = useState<EmployeeUI[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true);

        // Admin: lấy danh sách tất cả nhân viên
        const res = await getEmployees({ url: "/employee/all" });
        const list = extractEmployeesFromResponseData(res?.data);
        setEmployees(list.map((dto, idx) => employeeDtoToUI(dto, idx)));
      } catch (error) {
        console.error("Failed to fetch employees", error);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []); // Chỉ chạy 1 lần khi load trang

  // --- ĐÃ XÓA useEffect LƯU VÀO LOCALSTORAGE ---

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (error) {
      console.error("Failed to delete employee", error);
      alert("Xóa nhân viên thất bại. Vui lòng thử lại.");
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header Search & Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-52">
          <input
            type="text"
            placeholder="Search by ID, Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-xs italic text-[#A2A2A2] border border-[#B6B6B6] rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            style={{ fontFamily: "Poppins, sans-serif" }}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2A2]" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/employee/create")} className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D] hover:bg-[#D6D9E0] transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#C1C7D0] rounded overflow-hidden">
        {isLoading ? (
            <div className="p-10 text-center text-gray-500 text-sm">Loading data from API...</div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: "Poppins, sans-serif" }}>
                <thead>
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
                {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee, index) => (
                    <tr
                        key={employee.id} // Nên dùng ID làm key thay vì index/no nếu có thể
                        onClick={() => router.push(`/admin/employee/${encodeURIComponent(employee.id)}`)}
                        className="border-b border-[#C1C7D0] last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{index + 1}</td>
                        <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.id}</td>
                        <td className="px-10 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.fullname}</td>
                        <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.role}</td>
                        <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.phone}</td>
                        <td className="px-9 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.email}</td>
                        <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">{employee.signDay}</td>
                        <td className="px-3 py-2.5 text-center border-[#C1C7D0]">
                        <button
                          onClick={(e) => { e.stopPropagation(); void handleDelete(employee.id); }}
                            className="inline-flex items-center justify-center hover:bg-red-50 rounded p-1 transition-colors"
                        >
                            <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500 italic">
                        No employees found.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
}