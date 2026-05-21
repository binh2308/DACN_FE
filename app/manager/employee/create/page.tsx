"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createEmployee } from "@/services/DACN/employee";

// --- CÁC HÀM HELPER NẰM NGOÀI ĐỂ TRÁNH RENDER LẠI FORM (GIỮ FOCUS) ---

type DegreeFormItem = {
  school: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear: string;
  description: string;
};

function emptyDegree(): DegreeFormItem {
  return {
    school: "",
    degree: "",
    fieldOfStudy: "",
    graduationYear: "",
    description: "",
  };
}

function toOptionalNumber(value: string): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

const splitFullname = (fullname: string) => {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: "", firstName: "", middleName: "" };
  if (parts.length === 1) return { lastName: parts[0], firstName: "", middleName: "" };
  const lastName = parts[0];
  const firstName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(" ");
  return { lastName, firstName, middleName };
};

// Updated standard input styling for modern HRM look
const inputBase =
  "block w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200";

// Updated FormRow to use stacked layout for cleaner card presentation
function FormRow({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// --- COMPONENT CHÍNH ---
export default function CreateEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // State quản lý form tạo mới nhân viên (Sử dụng mảng degrees)
  const [form, setForm] = React.useState({
    role: "EMPLOYEE",
    fullname: "",
    password: "",
    gender: "Male",
    dateOfBirth: "",
    email: "",
    address: "",
    signDay: "",
    quitDay: "",
    idCard: "",
    married: false,
    children: "",
    childrenDescription: "",
    salaryBasic: "",
    phone: "",
    departmentName: "",
    
    // Khởi tạo mảng bằng cấp với 1 dòng rỗng mặc định
    degrees: [emptyDegree()] as DegreeFormItem[],
  });

  // Xử lý thay đổi các input cơ bản
  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- CÁC HÀM XỬ LÝ MẢNG DEGREES ---
  const handleDegreeChange = (index: number, field: keyof DegreeFormItem, value: string) => {
    setForm((prev) => {
      const newDegrees = [...(prev.degrees || [])];
      if (!newDegrees[index]) newDegrees[index] = emptyDegree();
      newDegrees[index] = { ...newDegrees[index], [field]: value };
      return { ...prev, degrees: newDegrees };
    });
  };

  const handleAddDegree = () => {
    setForm((prev) => ({ ...prev, degrees: [...(prev.degrees || []), emptyDegree()] }));
  };

  const handleRemoveDegree = (index: number) => {
    setForm((prev) => {
      const newDegrees = (prev.degrees || []).filter((_, i) => i !== index);
      // Giữ lại ít nhất 1 dòng rỗng nếu người dùng xóa hết
      return { ...prev, degrees: newDegrees.length > 0 ? newDegrees : [emptyDegree()] };
    });
  };

  // Helper chuyển định dạng Date
  const toIsoUtc = (date: string): string | null => {
    const d = date.trim();
    if (!d) return null;
    if (d.includes("T")) return d;
    return `${d}T00:00:00.000Z`; 
  };

  // Xử lý gửi Form
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!form.fullname.trim() || !form.email.trim() || !form.password) {
      alert("Vui lòng nhập đầy đủ Họ và tên, Email và Mật khẩu");
      return;
    }

    setIsSubmitting(true);
    try {
      const { lastName, firstName, middleName } = splitFullname(form.fullname);

      // Lọc và format mảng degrees chỉ lấy các dòng có nhập tên trường (school)
      const degreesPayload = (form.degrees || [])
        .filter((d) => d.school.trim() !== "")
        .map((d) => ({
          school: d.school.trim(),
          degree: d.degree.trim() || "Unknown",
          fieldOfStudy: d.fieldOfStudy.trim() || "Unknown",
          graduationYear: toOptionalNumber(d.graduationYear),
          description: d.description.trim() || null,
        }));

      // Payload gửi lên API
      const payload = {
        lastName,
        firstName,
        middleName: middleName || null,
        gender: form.gender || null,
        dateOfBirth: toIsoUtc(form.dateOfBirth),
        email: form.email.trim(),
        password: form.password,
        roles: form.role,
        phone: form.phone.trim() || null,
        idCard: form.idCard.trim() || null,
        address: form.address.trim() || null,
        departmentName: form.departmentName.trim() || null,
        marriedStatus: Boolean(form.married),
        numberOfChildren: form.children ? Number(form.children) : 0,
        childrenDescription: form.childrenDescription.trim() || null,
        basicSalary: form.salaryBasic !== "" ? Number(form.salaryBasic) : undefined,
        signDate: toIsoUtc(form.signDay),
        quitDate: toIsoUtc(form.quitDay),
        degrees: degreesPayload, 
      };

      console.log("Payload Create:", payload);

      await createEmployee(payload);
      alert("Tạo nhân viên thành công!");
      router.push("/manager/employee");
    } catch (error) {
      console.error("Failed to create employee", error);
      const message = (error as any)?.response?.data?.message || (error as any)?.message || "Tạo thất bại";
      alert(`Lỗi: ${Array.isArray(message) ? message.join(", ") : message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
            <span className="font-bold text-sm">+</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">Tạo mới nhân viên</h2>
            <p className="text-xs text-gray-500 font-medium">Thêm hồ sơ nhân viên mới</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/manager/employee`)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Đóng"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto p-6 max-w-[1200px] mx-auto w-full"
      >
        <fieldset disabled={isSubmitting} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLUMN 1: Profile & Account (Left Sidebar) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <div className="relative w-28 h-28 mb-4">
                    <img
                      src="https://i.pravatar.cc/150?u=new_emp"
                      alt="Ảnh đại diện"
                      className="w-full h-full object-cover rounded-full shadow-sm border-4 border-white"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center">
                    {form.fullname || "Nhân viên mới"}
                  </h3>
                  <span className="mt-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                    {form.role || "Chưa có vai trò"}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Thông tin tài khoản</h4>
                  
                  <FormRow label="ID Nhân viên">
                    <input type="text" disabled className={`${inputBase} bg-gray-50 text-gray-400`} placeholder="(Tự động tạo khi lưu)" />
                  </FormRow>

                  <FormRow label="Mật khẩu" required>
                    <input type="password" name="password" value={form.password} onChange={onChange} className={inputBase} placeholder="••••••••" />
                  </FormRow>

                  <FormRow label="Vai trò">
                    <select name="role" value={form.role} onChange={onChange} className={inputBase}>
                      <option value="" disabled>-- Chọn vai trò --</option>
                      <option value="EMPLOYEE">Nhân viên (EMPLOYEE)</option>
                      <option value="MANAGER">Quản lý (MANAGER)</option>
                    </select>
                  </FormRow>

                  <FormRow label="Email" required>
                    <input type="email" name="email" value={form.email} onChange={onChange} className={inputBase} placeholder="user@example.com" />
                  </FormRow>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Personal, Employment & Education (Main Content) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Personal Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
                  Thông tin cá nhân
                </h3>
                
                <div className="mb-5">
                  <FormRow label="Họ và tên" required>
                    <input type="text" name="fullname" value={form.fullname} onChange={onChange} className={inputBase} placeholder="VD: Nguyễn Văn A" />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Giới tính">
                    <select name="gender" value={form.gender} onChange={onChange} className={inputBase}>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                    </select>
                  </FormRow>
                  <FormRow label="Ngày sinh">
                    <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="flex flex-col md:flex-row gap-5">
                  <div className="w-full md:w-1/4">
                    <FormRow label="CMND/CCCD">
                      <input type="text" name="idCard" value={form.idCard} onChange={onChange} className={inputBase} placeholder="123456789" />
                    </FormRow>
                  </div>
                  <div className="w-full md:w-auto flex flex-col gap-1.5 flex-shrink-0">
                    <label className="text-sm font-medium text-gray-700">Tình trạng gia đình</label>
                    <div className="flex items-center gap-4 h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-md">
                      <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                        <input type="checkbox" name="married" checked={form.married} onChange={onChange} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                        <span className="text-sm text-gray-700 whitespace-nowrap">Đã kết hôn</span>
                      </label>
                      <div className="w-px h-4 bg-gray-300 flex-shrink-0"></div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-700 whitespace-nowrap">Số con:</span>
                        <input type="number" name="children" value={form.children} onChange={onChange} className="w-16 px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:flex-1">
                    <FormRow label="Mô tả về con cái">
                       <input type="text" name="childrenDescription" value={form.childrenDescription} onChange={onChange} className={inputBase} placeholder="Mô tả chi tiết..." />
                    </FormRow>
                  </div>
                </div>
              </div>

              {/* Employment Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100">
                  Thông tin công việc
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Số điện thoại">
                    <input type="text" name="phone" value={form.phone} onChange={onChange} className={inputBase} placeholder="0904000010" />
                  </FormRow>
                  <FormRow label="Địa chỉ">
                    <input type="text" name="address" value={form.address} onChange={onChange} className={inputBase} placeholder="123 Đường số 1, Quận 1, TP.HCM" />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-5">
                  <FormRow label="Tên phòng ban">
                    <input type="text" name="departmentName" value={form.departmentName} onChange={onChange} className={inputBase} placeholder="VD: Sales, IT" />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Ngày ký hợp đồng">
                    <input type="date" name="signDay" value={form.signDay} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Ngày nghỉ việc">
                    <input type="date" name="quitDay" value={form.quitDay} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormRow label="Lương cơ bản">
                    <input type="number" name="salaryBasic" value={form.salaryBasic} onChange={onChange} className={inputBase} placeholder="1400" />
                  </FormRow>
                </div>
              </div>

              {/* Education / Degrees Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Học vấn & Bằng cấp</h3>
                  <button
                    type="button"
                    onClick={handleAddDegree}
                    className="inline-flex items-center px-3 py-1.5 border border-emerald-200 text-xs font-semibold rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  >
                    + Thêm bằng cấp
                  </button>
                </div>
                <div className="overflow-x-auto p-6 pt-0 mt-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md">
                      <tr>
                        <th className="px-3 py-3 font-semibold rounded-tl-md">Trường học</th>
                        <th className="px-3 py-3 font-semibold">Bằng cấp</th>
                        <th className="px-3 py-3 font-semibold">Chuyên ngành</th>
                        <th className="px-3 py-3 font-semibold w-24">Năm TN</th>
                        <th className="px-3 py-3 font-semibold">Mô tả</th>
                        <th className="px-3 py-3 font-semibold rounded-tr-md w-16 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(form.degrees && form.degrees.length > 0 ? form.degrees : [emptyDegree()]).map((d, idx) => (
                        <tr key={`degree-${idx}`} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2">
                            <input value={d.school} onChange={(e) => handleDegreeChange(idx, "school", e.target.value)} className={inputBase} placeholder="VD: Đại học Bách Khoa" />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.degree} onChange={(e) => handleDegreeChange(idx, "degree", e.target.value)} className={inputBase} placeholder="VD: Cử nhân" />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.fieldOfStudy} onChange={(e) => handleDegreeChange(idx, "fieldOfStudy", e.target.value)} className={inputBase} placeholder="VD: CNTT" />
                          </td>
                          <td className="py-3 px-2">
                            <input type="number" value={d.graduationYear} onChange={(e) => handleDegreeChange(idx, "graduationYear", e.target.value)} className={inputBase} placeholder="2022" />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.description} onChange={(e) => handleDegreeChange(idx, "description", e.target.value)} className={inputBase} placeholder="Mô tả..." />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button type="button" onClick={() => handleRemoveDegree(idx)} className="text-red-500 hover:text-red-700 font-medium text-xs p-2 rounded-md hover:bg-red-50 transition-colors" title="Xóa">
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </fieldset>

        {/* Form Actions */}
        <div className="mt-8 flex justify-end pb-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all uppercase tracking-wider disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                ĐANG TẠO...
              </>
            ) : (
              "TẠO NHÂN VIÊN"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}