"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createEmployee } from "@/services/DACN/employee";

// --- KHAI BÁO BIẾN & COMPONENT TĨNH Ở NGOÀI ĐỂ TRÁNH MẤT FOCUS ---
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

  // State quản lý form tạo mới nhân viên (Đã bổ sung đầy đủ trường)
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
    children: 0,
    childrenDescription: "",
    salaryGross: "",
    salaryBasic: "",
    phone: "",
    departmentName: "", // Bổ sung Department
    
    // Bổ sung University
    uniSchool: "",
    uniDegree: "",
    uniModeOfStudy: "",
    uniGraduationYear: "",
    uniDescription: "",
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }

    if (type === "number") {
      const n = Number(value);
      setForm((prev) => ({ ...prev, [name]: Number.isNaN(n) ? 0 : n }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Helper chuyển định dạng Date
  const toIsoUtc = (date: string): string | null => {
    const d = date.trim();
    if (!d) return null;
    if (d.includes("T")) return d;
    return `${d}T00:00:00.000Z`; // Hoặc tuỳ backend của bạn, nếu chỉ cần "YYYY-MM-DD" thì return d;
  };

  // Helper tách Fullname thành First/Last/Middle
  const splitFullname = (fullname: string) => {
    const parts = fullname.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { lastName: "", firstName: "", middleName: "" };
    if (parts.length === 1) return { lastName: parts[0], firstName: "", middleName: "" };
    const lastName = parts[0];
    const firstName = parts[parts.length - 1];
    const middleName = parts.slice(1, -1).join(" ");
    return { lastName, firstName, middleName };
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

      // Tạo mảng degrees chỉ khi có nhập tên trường học
      const degrees = form.uniSchool.trim() ? [
        {
          school: form.uniSchool.trim(),
          degree: form.uniDegree.trim() || "Unknown",
          fieldOfStudy: form.uniModeOfStudy.trim() || "Unknown",
          graduationYear: form.uniGraduationYear ? Number(form.uniGraduationYear) : null,
          description: form.uniDescription.trim() || null
        }
      ] : [];

      // Payload cấu trúc chính xác theo yêu cầu
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
        marriedStatus: form.married,
        numberOfChildren: form.children,
        childrenDescription: form.childrenDescription.trim() || null,
        grossSalary: form.salaryGross !== "" ? Number(form.salaryGross) : undefined,
        basicSalary: form.salaryBasic !== "" ? Number(form.salaryBasic) : undefined,
        signDate: toIsoUtc(form.signDay),
        quitDate: toIsoUtc(form.quitDay),
        degrees: degrees, // Đưa array University vào payload
      };

      console.log("Payload:", payload);

      await createEmployee(payload);
      alert("Tạo nhân viên thành công!");
      router.push("/manager/employee");
    } catch (error) {
      console.error("Failed to create employee", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

                <FormRow label="Department">
                  <input type="text" name="departmentName" value={form.departmentName} onChange={onChange} className={inputClass} placeholder="VD: Sales, Engineering" />
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

        {/* ROW 2: Other Info & University */}
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
                    <input type="number" name="children" value={form.children} onChange={onChange} className={`${inputBase} w-16 text-xs`} />
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

          {/* University Info (7 Cols) */}
          <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-fit">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">University</h3>

            <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase">Schools</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Degree</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Mode of study</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Graduation Year</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">Description</div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              <input name="uniSchool" value={form.uniSchool} onChange={onChange} className={inputClass} placeholder="MIT" />
              <input name="uniDegree" value={form.uniDegree} onChange={onChange} className={inputClass} placeholder="Bachelor" />
              <input name="uniModeOfStudy" value={form.uniModeOfStudy} onChange={onChange} className={inputClass} placeholder="Computer Science" />
              <input type="number" name="uniGraduationYear" value={form.uniGraduationYear} onChange={onChange} className={inputClass} placeholder="2022" />
              <input name="uniDescription" value={form.uniDescription} onChange={onChange} className={inputClass} placeholder="Graduated with honors" />
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