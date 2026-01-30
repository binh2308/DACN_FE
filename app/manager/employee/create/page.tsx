"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Employee, initialEmployees } from "@/lib/data";

// Logic quản lý dữ liệu từ page.tsx gốc
function readEmployees(): Employee[] {
  if (typeof window === "undefined") return initialEmployees;
  try {
    const raw = localStorage.getItem("employees_manager");
    if (!raw) return initialEmployees;
    const parsed = JSON.parse(raw) as Employee[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialEmployees;
  } catch {
    return initialEmployees;
  }
}

function writeEmployees(employees: Employee[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("employees_manager", JSON.stringify(employees));
  } catch { /* ignore */ }
}

export default function CreateEmployeePage() {
  const router = useRouter();

  // Khởi tạo State với đầy đủ các trường từ CreateEmployeeModal.tsx
  const [form, setForm] = React.useState({
    // Account Info
    id: "",
    password: "",
    role: "Member",
    permissionTemplate: "Member",
    emailCompany: "",
    avatar: null,

    // Main Info
    fullname: "",
    shortname: "",
    gender: "Male",
    dateOfBirth: "",
    email: "",
    address: "",
    signDay: "",
    quitDay: "",

    // Other Info
    idCard: "",
    taxNumber: "",
    socialInsurance: "",
    married: false,
    children: 0,
    childrenDescription: "",

    // University
    uniSchool: "",
    uniDegree: "",
    uniModeOfStudy: "",
    uniGraduationYear: "",
    uniDescription: "",

    // Contract
    contractName: "",
    contractNumber: "",
    contractType: "",
    salaryGross: "",
    salaryBasic: "",
    salaryCapacity: "",
    branch: "",
    department: "",
    staffType: "",
    paymentMethod: "",
    endDay: "",
    note: "",
    
    phone: "", 
  });

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id || !form.fullname) {
      alert("Vui lòng nhập ID và Fullname");
      return;
    }

    const employees = readEmployees();
    if (employees.some((emp) => emp.id === form.id)) {
      alert("ID đã tồn tại. Vui lòng chọn ID khác.");
      return;
    }

    // Tạo nhân viên mới theo cấu trúc của page.tsx
    const newEmployee: Employee = {
      no: Date.now(),
      id: form.id,
      fullname: form.fullname,
      role: form.role,
      phone: form.phone || "N/A",
      email: form.email,
      signDay: form.signDay,
    };

    writeEmployees([newEmployee, ...employees]);
    router.push("/manager/employee");
  };

  // Thành phần dòng của Form để đảm bảo căn lề chính xác như Modal
  const FormRow = ({ label, children, required = false }: { label: string, children: React.ReactNode, required?: boolean }) => (
    <div className="flex items-center gap-3 mb-2">
      <label className="w-32 shrink-0 text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );

  const inputBase = "px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500 transition-colors";
  const inputClass = `${inputBase} w-full`;
  const dateClass = `${inputBase} w-full pr-8`;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Header - Cố định và có định dạng giống Modal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">✎</span>
          <h2 className="text-sm font-bold text-gray-700">Information User</h2>
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

      {/* Nội dung chính - Layout grid chia cột giống hệt Modal */}
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        
        {/* ROW 1: Account Info (5/12) & Main Info (7/12) */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Account Info</h3>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2 w-1/3">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border-2 border-green-500">
                  <img src="https://i.pravatar.cc/150?u=emp" alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <button type="button" className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200">
                  <Upload size={12} /> UPLOAD
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <FormRow label="Employee ID" required>
                  <input type="text" name="id" value={form.id} onChange={onChange} className={inputClass} placeholder="account43" />
                </FormRow>
                <FormRow label="Password">
                  <input type="password" name="password" value={form.password} onChange={onChange} className={inputClass} placeholder="••••••••" />
                </FormRow>
                <FormRow label="Roles">
                  <select name="role" value={form.role} onChange={onChange} className={inputClass}>
                    <option value="Member">Member</option>
                    <option value="Manager">Manager</option>
                  </select>
                </FormRow>
                <FormRow label="Permission Template">
                  <select name="permissionTemplate" value={form.permissionTemplate} onChange={onChange} className={inputClass}>
                    <option value="Member">Member</option>
                  </select>
                </FormRow>
                <FormRow label="Email Company">
                  <input type="email" name="emailCompany" value={form.emailCompany} onChange={onChange} className={inputClass} placeholder="name@company.co" />
                </FormRow>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Main Info</h3>
            <div className="space-y-1">
              <FormRow label="Fullname" required>
                <input type="text" name="fullname" value={form.fullname} onChange={onChange} className={inputClass} />
              </FormRow>
              <FormRow label="Shortname">
                <input type="text" name="shortname" value={form.shortname} onChange={onChange} className={inputClass} />
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

              <FormRow label="Email Personal">
                <input type="email" name="email" value={form.email} onChange={onChange} className={inputClass} />
              </FormRow>
              <FormRow label="Address">
                <input type="text" name="address" value={form.address} onChange={onChange} className={inputClass} />
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

        {/* ROW 2: Other Info (5/12) & University (7/12) */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Other Info</h3>
            <div className="space-y-1">
              <FormRow label="ID Card *" required>
                <input type="text" name="idCard" value={form.idCard} onChange={onChange} className={inputClass} />
              </FormRow>
              <FormRow label="Tax Number">
                <input type="text" name="taxNumber" value={form.taxNumber} onChange={onChange} className={inputClass} />
              </FormRow>
              <FormRow label="ID Social Insurance">
                <input type="text" name="socialInsurance" value={form.socialInsurance} onChange={onChange} className={inputClass} />
              </FormRow>
              <div className="flex items-center gap-2 mb-2">
                <label className="w-1/3 text-xs font-medium text-gray-600">Married</label>
                <div className="w-2/3 flex items-center gap-6">
                    <input type="checkbox" name="married" checked={form.married} onChange={onChange} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Children</span>
                        <input type="number" name="children" value={form.children} onChange={onChange} className={`${inputClass} w-16`} />
                    </div>
                </div>
              </div>
              <FormRow label="Children Description">
                <textarea name="childrenDescription" value={form.childrenDescription} onChange={onChange} rows={3} className={inputClass} placeholder="Are you sure ?" />
              </FormRow>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">University</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-left text-gray-500 uppercase border-b border-gray-100">
                      <th className="pb-2 font-bold w-1/5">Schools</th>
                      <th className="pb-2 font-bold w-1/6">Degree</th>
                      <th className="pb-2 font-bold w-1/5">Mode of study</th>
                      <th className="pb-2 font-bold w-1/5">Graduation Year</th>
                      <th className="pb-2 font-bold">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 pr-1"><input name="uniSchool" value={form.uniSchool} onChange={onChange} className={inputClass} /></td>
                      <td className="py-2 pr-1"><input name="uniDegree" value={form.uniDegree} onChange={onChange} className={inputClass} /></td>
                      <td className="py-2 pr-1"><input name="uniModeOfStudy" value={form.uniModeOfStudy} onChange={onChange} className={inputClass} /></td>
                      <td className="py-2 pr-1"><input name="uniGraduationYear" value={form.uniGraduationYear} onChange={onChange} className={inputClass} /></td>
                      <td className="py-2"><input name="uniDescription" value={form.uniDescription} onChange={onChange} className={inputClass} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8"></div>

        {/* Footer - Nút Lưu canh giữa giống ảnh */}
        <div className="flex items-center justify-center pb-8">
          <button
            type="submit"
            className="px-12 py-2 text-sm font-bold text-white bg-emerald-500 rounded shadow-md hover:bg-emerald-600 transition-all uppercase tracking-wider"
          >
            SAVE
          </button>
        </div>
      </form>
    </div>
  );
}