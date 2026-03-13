"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
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

const inputBase = "px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500 transition-colors";
const inputClass = `${inputBase} w-full`;
const dateClass = `${inputBase} w-full pr-8`;

const FormRow = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="flex items-center gap-3 mb-2">
    <label className="w-32 shrink-0 text-xs font-medium text-gray-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

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
    salaryGross: "",
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
      alert("Vui lòng nhập đầy đủ Fullname, Email và Password");
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
        grossSalary: form.salaryGross !== "" ? Number(form.salaryGross) : undefined,
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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">✎</span>
          <h2 className="text-sm font-bold text-gray-700 uppercase">Create Employee</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push("/manager/employee")}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        
        {/* ROW 1: Account Info & Main Info */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Account Info (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Account Info</h3>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border-2 border-green-500">
                  <img
                    src="https://i.pravatar.cc/150?u=new_emp"
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button type="button" className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
                  <Upload size={12} /> UPLOAD
                </button>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <FormRow label="Employee ID">
                  <input type="text" disabled className={`${inputClass} bg-gray-100 text-gray-400`} placeholder="(Auto-generated)" />
                </FormRow>

                <FormRow label="Password" required>
                  <input type="password" name="password" value={form.password} onChange={onChange} className={inputClass} placeholder="••••••••" />
                </FormRow>

                <FormRow label="Roles">
                  <select name="role" value={form.role} onChange={onChange} className={inputClass}>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </FormRow>

                <FormRow label="Email" required>
                  <input type="email" name="email" value={form.email} onChange={onChange} className={inputClass} placeholder="user@example.com" />
                </FormRow>

                <FormRow label="Phone">
                  <input type="text" name="phone" value={form.phone} onChange={onChange} className={inputClass} placeholder="+1234567890" />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Main Info (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Main Info</h3>
            <div className="space-y-1">
              <FormRow label="Fullname" required>
                <input type="text" name="fullname" value={form.fullname} onChange={onChange} className={inputClass} placeholder="John Michael Doe" />
              </FormRow>

              <div className="flex items-center gap-3 mb-2">
                <label className="w-32 shrink-0 text-xs font-medium text-gray-600">Gender</label>
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <select name="gender" value={form.gender} onChange={onChange} className={inputClass}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 min-w-[240px]">
                    <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Birth Day</span>
                    <div className="w-[170px]">
                      <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className={dateClass} />
                    </div>
                  </div>
                </div>
              </div>

              <FormRow label="Address">
                <input type="text" name="address" value={form.address} onChange={onChange} className={inputClass} placeholder="123 Main St, City, Country" />
              </FormRow>

              <div className="flex items-center gap-3 mb-2">
                <label className="w-32 shrink-0 text-xs font-medium text-gray-600">Sign Day</label>
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="w-[190px]">
                    <input type="date" name="signDay" value={form.signDay} onChange={onChange} className={dateClass} />
                  </div>

                  <div className="flex items-center gap-2 min-w-[240px]">
                    <span className="text-[10px] font-bold text-red-500 uppercase whitespace-nowrap">Quit Day</span>
                    <div className="w-[170px]">
                      <input type="date" name="quitDay" value={form.quitDay} onChange={onChange} className={dateClass} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Other Info & Department/University */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Other Info (5 Cols) */}
          <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Other Info</h3>
            <div className="space-y-1">
              <FormRow label="ID Card">
                <input type="text" name="idCard" value={form.idCard} onChange={onChange} className={inputClass} placeholder="123456789" />
              </FormRow>

              <div className="flex items-center gap-3 mb-2">
                <label className="w-32 shrink-0 text-xs font-medium text-gray-600">Married</label>
                <div className="flex-1 min-w-0 flex items-center gap-6">
                  <input
                    type="checkbox"
                    name="married"
                    checked={form.married}
                    onChange={onChange}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Children</span>
                    <input type="number" name="children" value={form.children} onChange={onChange} className={`${inputBase} w-16 text-xs text-center`} />
                  </div>
                </div>
              </div>

              <FormRow label="Children Description">
                <textarea
                  name="childrenDescription"
                  value={form.childrenDescription}
                  onChange={onChange}
                  rows={1}
                  className={inputClass}
                  placeholder="Two kids, ages 5 and 8"
                />
              </FormRow>

              <FormRow label="Gross Salary">
                <input type="number" name="salaryGross" value={form.salaryGross} onChange={onChange} className={inputClass} placeholder="60000" />
              </FormRow>

              <FormRow label="Basic Salary">
                <input type="number" name="salaryBasic" value={form.salaryBasic} onChange={onChange} className={inputClass} placeholder="50000" />
              </FormRow>
            </div>
          </div>

          {/* Department & University Info (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Department</h3>
              <FormRow label="Department Name">
                <input name="departmentName" value={form.departmentName} onChange={onChange} className={inputClass} placeholder="VD: Sales, Engineering" />
              </FormRow>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">University</h3>

              <div className="grid grid-cols-6 gap-2 mb-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Schools</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Degree</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Field of study</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Graduation Year</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Description</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase text-center">Xóa</div>
              </div>

              <div className="space-y-2">
                {(form.degrees && form.degrees.length > 0 ? form.degrees : [emptyDegree()]).map((d, idx) => (
                  <div key={`degree-${idx}`} className="grid grid-cols-6 gap-2 items-center">
                    <input
                      type="text"
                      value={d.school}
                      onChange={(e) => handleDegreeChange(idx, "school", e.target.value)}
                      className={inputClass}
                      placeholder="VD: MIT"
                    />
                    <input
                      type="text"
                      value={d.degree}
                      onChange={(e) => handleDegreeChange(idx, "degree", e.target.value)}
                      className={inputClass}
                      placeholder="VD: Bachelor"
                    />
                    <input
                      type="text"
                      value={d.fieldOfStudy}
                      onChange={(e) => handleDegreeChange(idx, "fieldOfStudy", e.target.value)}
                      className={inputClass}
                      placeholder="VD: CS"
                    />
                    <input
                      type="number"
                      value={d.graduationYear}
                      onChange={(e) => handleDegreeChange(idx, "graduationYear", e.target.value)}
                      className={inputClass}
                      placeholder="2022"
                    />
                    <input
                      type="text"
                      value={d.description}
                      onChange={(e) => handleDegreeChange(idx, "description", e.target.value)}
                      className={inputClass}
                      placeholder="Mô tả..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDegree(idx)}
                      className="h-8 w-full rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      title="Xóa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddDegree}
                    className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
                  >
                    + ADD DEGREE
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="h-8" />

        {/* Footer Button */}
        <div className="flex items-center justify-center pb-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-12 py-2 text-sm font-bold text-white bg-emerald-500 rounded shadow-md hover:bg-emerald-600 transition-all uppercase tracking-wider disabled:opacity-60"
          >
            {isSubmitting ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </form>
    </div>
  );
}