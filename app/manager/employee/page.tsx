"use client";

import { Search, Plus, Filter, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequest } from "ahooks";

import { getEmployees, deleteEmployee, type GetEmployeesResponse } from "@/services/DACN/employee";
import { getUserProfile } from "@/services/DACN/auth";
import { employeeDtoToUI, extractEmployeesFromResponseData, type EmployeeUI } from "@/lib/employee-ui";

type ApiProfileResponse = {
  statusCode?: number;
  message?: string;
  data?: Record<string, any>;
};

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function findFirstEmailLike(obj: unknown, maxDepth = 4): string | undefined {
  const visit = (node: unknown, depth: number): string | undefined => {
    if (depth > maxDepth || node == null) return undefined;
    if (typeof node === "string") {
      const s = node.trim();
      if (s.includes("@") && s.includes(".")) return s;
      return undefined;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const hit = visit(item, depth + 1);
        if (hit) return hit;
      }
      return undefined;
    }
    if (typeof node === "object") {
      for (const v of Object.values(node as Record<string, unknown>)) {
        const hit = visit(v, depth + 1);
        if (hit) return hit;
      }
    }
    return undefined;
  };

  return visit(obj, 0);
}

function getCurrentUserIdentifier(profile: unknown): { id?: string; email?: string } {
  const p = profile as ApiProfileResponse | undefined;
  const data = p?.data;
  if (!data) return {};

  const idCandidate =
    pickString((data as any).id) ||
    pickString((data as any).employeeId) ||
    pickString((data as any).userId) ||
    pickString((data as any).employee?.id) ||
    pickString((data as any).user?.id) ||
    pickString((data as any).profile?.id);

  const emailCandidate =
    pickString((data as any).email) ||
    pickString((data as any).emailCompany) ||
    pickString((data as any).employee?.email) ||
    pickString((data as any).user?.email) ||
    findFirstEmailLike(data);

  return { id: idCandidate, email: emailCandidate };
}

// --- CẤU HÌNH SỐ LƯỢNG HIỂN THỊ MỖI TRANG ---
const ITEMS_PER_PAGE = 10;

export default function EmployeeManage() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: employeesData,
    loading: isLoading,
    error,
    refresh,
  } = useRequest(async () => {
    const [profileResRaw, employeesResRaw] = await Promise.all([
      getUserProfile(),
      getEmployees({ page: 1, pageSize: 1000 } as any),
    ]);

    const profileRes = profileResRaw as unknown as ApiProfileResponse;
    const employeesRes = employeesResRaw as unknown as GetEmployeesResponse;

    const all = extractEmployeesFromResponseData(employeesRes?.data);

    let { id: myId, email: myEmail } = getCurrentUserIdentifier(profileRes);
    if (myId && !all.some((e) => e.id === myId)) myId = undefined;
    if (myEmail && !all.some((e) => (e.email || "").trim() === myEmail)) {
      myEmail = undefined;
    }

    const filtered = all.filter((e: any) => {
      // FIX LỖI "never": Ép kiểu e.roles về any[] trước khi dùng .some()
      const rolesArray = Array.isArray(e.roles) ? (e.roles as any[]) : [];
      
      const isEmployeeRole = typeof e.roles === 'string' 
        ? e.roles.toUpperCase() === 'EMPLOYEE' 
        : rolesArray.length > 0
          ? rolesArray.some((r: any) => String(r).toUpperCase() === 'EMPLOYEE')
          : false;

      if (!isEmployeeRole) return false;

      // Lọc bỏ chính user đang đăng nhập
      if (myId) return e.id !== myId;
      if (myEmail) return (e.email || "").trim() !== myEmail;
      
      return true;
    });

    return filtered.map((dto, idx) => employeeDtoToUI(dto, idx));
  });

  const employees = useMemo(() => (employeesData ?? []) as EmployeeUI[], [employeesData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(id);
      refresh();
    } catch (err) {
      console.error("Failed to delete employee", err);
      alert("Xóa nhân viên thất bại. Vui lòng thử lại.");
    }
  };

  // --- LOGIC TÌM KIẾM VÀ PHÂN TRANG ---
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Tự động quay về trang 1 nếu người dùng gõ tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
          <button onClick={() => router.push("/manager/employee/create")} className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D] hover:bg-[#D6D9E0] transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#C1C7D0] rounded overflow-hidden flex flex-col">
        {isLoading ? (
            <div className="p-10 text-center text-gray-500 text-sm">Loading data from API...</div>
        ) : error ? (
          <div className="p-10 text-center text-red-600 text-sm">Failed to load employees. Please try again.</div>
        ) : (
          <>
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
                  {paginatedEmployees.length > 0 ? (
                      paginatedEmployees.map((employee, index) => (
                      <tr
                          key={employee.id}
                          onClick={() => router.push(`/manager/employee/${encodeURIComponent(employee.id)}`)}
                          className="border-b border-[#C1C7D0] last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                          <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
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

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 items-center px-4 py-3 border-t border-[#C1C7D0] bg-white gap-4">
                {/* Cột 1: Thông tin hiển thị (Nằm bên trái) */}
                <div className="flex justify-center md:justify-start">
                  <span className="text-sm text-gray-500" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} entries
                  </span>
                </div>
                
                {/* Cột 2: Các nút phân trang (Được đẩy vào chính giữa) */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-[#C1C7D0] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <span className="text-sm text-gray-700 font-medium px-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-[#C1C7D0] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Cột 3: Khối trống để cân bằng lưới, giúp tránh icon chatbox ở góc phải */}
                <div className="hidden md:block"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}