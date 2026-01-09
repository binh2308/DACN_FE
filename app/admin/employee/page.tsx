"use client";

import { Search, Plus, Filter, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRequest } from "ahooks";
import { getEmployees } from "@/services/DACN/employee"; // Đảm bảo đường dẫn import đúng

// Định nghĩa kiểu dữ liệu hiển thị trên bảng
interface Employee {
  no: number;
  id: string;
  fullname: string;
  role: string;
  phone: string;
  email: string;
  signDay: string;
}

export default function EmployeePage() {
  // 1. Khởi tạo state rỗng (tránh hiện dữ liệu giả)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 2. Gọi API lấy danh sách
  const { loading, error, run: refreshData } = useRequest(getEmployees, {
    manual: false, // Tự động chạy khi vào trang
    onSuccess: (res: any) => {
      // Kiểm tra cấu trúc response (res.data hoặc res)
      const dataList = Array.isArray(res) ? res : res?.data || [];

      // Map dữ liệu từ Backend sang format của Frontend
      const mappedData = dataList.map((item: any, index: number) => ({
        no: index + 1,
        // Map _id thành id hiển thị
        id: item._id ? item._id.slice(-6).toUpperCase() : `EMP${index}`,
        // Xử lý họ tên (nếu backend tách rời)
        fullname: item.fullname || `${item.lastName || ""} ${item.middleName || ""} ${item.firstName || ""}`.trim(),
        // Lấy role đầu tiên hoặc mặc định
        role: item.roles && item.roles.length > 0 ? item.roles[0] : "Employee",
        phone: item.phone || "N/A",
        email: item.email || "",
        // Format ngày tháng
        signDay: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "N/A",
      }));

      setEmployees(mappedData);
    },
    onError: (err) => {
      console.error("Lỗi khi tải danh sách nhân viên:", err);
    },
  });

  // 3. Xử lý xóa (Frontend only - cần gắn thêm API xóa nếu muốn)
  const handleDelete = (no: number) => {
    if (confirm("Bạn có chắc muốn xóa dòng này không?")) {
      setEmployees(employees.filter((emp) => emp.no !== no));
    }
  };

  // 4. Logic lọc tìm kiếm
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-white h-full min-h-screen">
      <div className="flex items-center justify-between mb-4">
        {/* Ô tìm kiếm */}
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by ID, Name, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Các nút chức năng */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-center">No.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fullname</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sign Day</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Trạng thái Loading */}
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Trạng thái Lỗi */}
              {error && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-red-500 bg-red-50">
                    Không thể tải dữ liệu. Vui lòng kiểm tra kết nối hoặc đăng nhập lại.
                    <br />
                    <button onClick={refreshData} className="mt-2 text-blue-600 underline text-sm">Thử lại</button>
                  </td>
                </tr>
              )}

              {/* Trạng thái Rỗng */}
              {!loading && !error && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 italic">
                    Không tìm thấy nhân viên nào.
                  </td>
                </tr>
              )}

              {/* Dữ liệu */}
              {!loading && !error && filteredEmployees.map((employee) => (
                <tr key={employee.no} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-center text-gray-900">{employee.no}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{employee.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{employee.fullname}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{employee.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{employee.signDay}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(employee.no)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          Hiển thị {filteredEmployees.length} kết quả
        </div>
      </div>
    </div>
  );
}