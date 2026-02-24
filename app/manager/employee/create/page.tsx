"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createEmployee } from "@/services/DACN/employee";

// --- KHAI BÁO BIẾN & COMPONENT TĨNH Ở NGOÀI ---

const inputClass = "w-full h-9 px-2 rounded border border-gray-300 text-sm text-gray-700 focus:outline-none focus:border-green-500 transition-colors";

const FormRow = ({ 
  label, 
  required, 
  children,
  labelClass = "w-28",
}: { 
  label: string, 
  required?: boolean, 
  children: React.ReactNode,
  labelClass?: string
}) => (
  <div className="flex items-center mb-3">
    <label className={`text-xs font-semibold text-gray-500 ${labelClass} flex-shrink-0`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex-1">
      {children}
    </div>
  </div>
);

// --- COMPONENT CHÍNH ---

export default function CreateEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    // Identity
    lastName: "",
    firstName: "",
    middleName: "",
    gender: "Male",
    dateOfBirth: "",

    // Account
    email: "",
    password: "",
    roles: "MANAGER",

    // Contact
    phone: "",
    idCard: "",
    address: "",

    // Department
    departmentName: "",
  });

  const toIsoUtc = (date: string): string | null => {
    const d = date.trim();
    if (!d) return null;
    if (d.includes("T")) return d;
    return `${d}T00:00:00.000Z`;
  };

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = type === "checkbox" ? (e.target as any).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate cơ bản
    if (!form.lastName.trim() || !form.firstName.trim() || !form.email.trim() || !form.password) {
      alert("Vui lòng nhập đầy đủ Last name, First name, Email và Password");
      return;
    }

    const run = async () => {
      setIsSubmitting(true);
      try {
        const payload = {
          lastName: form.lastName.trim(),
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || null,
          gender: form.gender || null,
          dateOfBirth: toIsoUtc(form.dateOfBirth),
          email: form.email.trim(),
          password: form.password,
          roles: form.roles,
          phone: form.phone.trim() || null,
          idCard: form.idCard.trim() || null,
          address: form.address.trim() || null,
          department: form.departmentName.trim() || null
        };

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
    void run();
  };

  return (
      <div className="bg-white w-full mx-auto flex flex-col rounded-lg shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-gray-400">✎</span>
            <h2 className="text-sm font-bold uppercase">Information User</h2>
          </div>
          <button 
            onClick={() => router.push("/manager/employee")} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form id="create-employee-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT: Account Info */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-5 uppercase">Account Info</h3>
              
              <div className="flex gap-6">
                <div className="flex-1">
                  {/* Nếu backend không cần ID mà tự sinh, bạn có thể bỏ trường này hoặc dùng nó làm ID Card */}
                  <FormRow label="Employee ID">
                    <input name="id" disabled className={`${inputClass} bg-gray-100 text-gray-400`} placeholder="(Auto-generated)" />
                  </FormRow>
                  <FormRow label="Password" required>
                    <input type="password" name="password" value={form.password} onChange={onChange} className={inputClass} placeholder="••••••••" />
                  </FormRow>
                  <FormRow label="Roles">
                    <select name="roles" value={form.roles} onChange={onChange} className={inputClass}>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                    </select>
                  </FormRow>
                  <FormRow label="Email" required>
                    <input type="email" name="email" value={form.email} onChange={onChange} className={inputClass} placeholder="user@example.com" />
                  </FormRow>
                </div>
              </div>
            </div>

            {/* RIGHT: Main Info */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-5 uppercase">Main Info</h3>
              
              <FormRow label="Last Name" required labelClass="w-24">
                <input name="lastName" value={form.lastName} onChange={onChange} className={inputClass} placeholder="Pham" />
              </FormRow>

              <FormRow label="First Name" required labelClass="w-24">
                <input name="firstName" value={form.firstName} onChange={onChange} className={inputClass} placeholder="Duy" />
              </FormRow>

              <FormRow label="Middle Name" labelClass="w-24">
                <input name="middleName" value={form.middleName} onChange={onChange} className={inputClass} placeholder="Phuong" />
              </FormRow>

              <div className="flex items-center mb-3">
                <label className="text-xs font-semibold text-gray-500 w-24 flex-shrink-0">Gender</label>
                <div className="flex-1 flex gap-4">
                  <div className="w-1/2">
                    <select name="gender" value={form.gender} onChange={onChange} className={inputClass}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="w-1/2 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Birth Day</span>
                    <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={onChange} className={inputClass} />
                  </div>
                </div>
              </div>

              <FormRow label="Phone" labelClass="w-24">
                <input name="phone" value={form.phone} onChange={onChange} className={inputClass} placeholder="012345678" />
              </FormRow>

              <FormRow label="Address" labelClass="w-24">
                <input name="address" value={form.address} onChange={onChange} className={inputClass} />
              </FormRow>
            </div>
          </div>

          {/* BOTTOM ROW: Other Info & Department */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-5 uppercase">Other Info</h3>
              <FormRow label="ID Card *" required labelClass="w-32">
                <input name="idCard" value={form.idCard} onChange={onChange} className={inputClass} placeholder="123456789" />
              </FormRow>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 mb-5 uppercase">Department</h3>

              <FormRow label="Department Name" labelClass="w-32">
                <input name="departmentName" value={form.departmentName} onChange={onChange} className={inputClass} placeholder="Sales" />
              </FormRow>
            </div>
          </div>

          <div className="flex items-center justify-center pb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-12 rounded shadow text-sm uppercase transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
  );
}