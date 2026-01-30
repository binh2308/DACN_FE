"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { type Employee, initialEmployees } from "@/lib/data";

type EmployeeRecord = Employee & {
  password?: string;
  permissionTemplate?: string;
  emailCompany?: string;
  avatar?: unknown;

  shortname?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  quitDay?: string;

  idCard?: string;
  taxNumber?: string;
  socialInsurance?: string;
  married?: boolean;
  children?: number | string;
  childrenDescription?: string;

  uniSchool?: string;
  uniDegree?: string;
  uniModeOfStudy?: string;
  uniGraduationYear?: string;
  uniDescription?: string;

  contractName?: string;
  contractNumber?: string;
  contractType?: string;
  salaryGross?: string;
  salaryBasic?: string;
  salaryCapacity?: string;
  branch?: string;
  department?: string;
  staffType?: string;
  paymentMethod?: string;
  endDay?: string;
  note?: string;
};

function readEmployees(): EmployeeRecord[] {
  if (typeof window === "undefined") return initialEmployees;
  try {
    const raw = localStorage.getItem("employees_manager");
    if (!raw) return initialEmployees;
    const parsed = JSON.parse(raw) as EmployeeRecord[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialEmployees;
  } catch {
    return initialEmployees;
  }
}

function writeEmployees(employees: EmployeeRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("employees_manager", JSON.stringify(employees));
  } catch {
    // ignore
  }
}

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const employeeId = React.useMemo(() => {
    const raw = params?.id;
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    return (idStr ?? "").trim() || null;
  }, [params]);

  const [employees, setEmployees] = React.useState<EmployeeRecord[]>(initialEmployees);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setEmployees(readEmployees());
    setIsHydrated(true);
  }, []);

  const employee = React.useMemo<EmployeeRecord | null>(() => {
    if (!employeeId) return null;
    return employees.find((e) => e.id === employeeId) ?? null;
  }, [employeeId, employees]);

  const [form, setForm] = React.useState({
    // Account Info
    id: "",
    password: "",
    role: "Member",
    permissionTemplate: "Member",
    emailCompany: "",
    avatar: null as unknown,

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

  React.useEffect(() => {
    if (!employee) return;
    setForm({
      id: employee.id,
      password: employee.password ?? "",
      role: employee.role ?? "Member",
      permissionTemplate: employee.permissionTemplate ?? "Member",
      emailCompany: employee.emailCompany ?? "",
      avatar: employee.avatar ?? null,

      fullname: employee.fullname ?? "",
      shortname: employee.shortname ?? "",
      gender: employee.gender ?? "Male",
      dateOfBirth: employee.dateOfBirth ?? "",
      email: employee.email ?? "",
      address: employee.address ?? "",
      signDay: employee.signDay ?? "",
      quitDay: employee.quitDay ?? "",

      idCard: employee.idCard ?? "",
      taxNumber: employee.taxNumber ?? "",
      socialInsurance: employee.socialInsurance ?? "",
      married: employee.married ?? false,
      children:
        typeof employee.children === "number"
          ? employee.children
          : Number(employee.children ?? 0) || 0,
      childrenDescription: employee.childrenDescription ?? "",

      uniSchool: employee.uniSchool ?? "",
      uniDegree: employee.uniDegree ?? "",
      uniModeOfStudy: employee.uniModeOfStudy ?? "",
      uniGraduationYear: employee.uniGraduationYear ?? "",
      uniDescription: employee.uniDescription ?? "",

      contractName: employee.contractName ?? "",
      contractNumber: employee.contractNumber ?? "",
      contractType: employee.contractType ?? "",
      salaryGross: employee.salaryGross ?? "",
      salaryBasic: employee.salaryBasic ?? "",
      salaryCapacity: employee.salaryCapacity ?? "",
      branch: employee.branch ?? "",
      department: employee.department ?? "",
      staffType: employee.staffType ?? "",
      paymentMethod: employee.paymentMethod ?? "",
      endDay: employee.endDay ?? "",
      note: employee.note ?? "",

      phone: employee.phone === "N/A" ? "" : employee.phone,
    });
  }, [employee]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    const nextId = String(form.id).trim();
    const fullname = String(form.fullname).trim();

    if (!nextId || !fullname) {
      alert("Vui lòng nhập ID và Fullname");
      return;
    }

    const idChanged = nextId !== employee.id;
    if (idChanged) {
      const existed = employees.some((emp) => emp.id === nextId);
      if (existed) {
        alert("ID đã tồn tại. Vui lòng chọn ID khác.");
        return;
      }
    }

    const updated: EmployeeRecord = {
      no: employee.no,
      id: nextId,
      fullname,
      role: form.role || "Member",
      phone: String(form.phone).trim() || "N/A",
      email: String(form.email).trim(),
      signDay: String(form.signDay).trim(),

      password: String(form.password ?? ""),
      permissionTemplate: String(form.permissionTemplate ?? "Member"),
      emailCompany: String(form.emailCompany ?? ""),
      avatar: form.avatar ?? null,

      shortname: String(form.shortname ?? ""),
      gender: String(form.gender ?? "Male"),
      dateOfBirth: String(form.dateOfBirth ?? ""),
      address: String(form.address ?? ""),
      quitDay: String(form.quitDay ?? ""),

      idCard: String(form.idCard ?? ""),
      taxNumber: String(form.taxNumber ?? ""),
      socialInsurance: String(form.socialInsurance ?? ""),
      married: Boolean(form.married),
      children: form.children,
      childrenDescription: String(form.childrenDescription ?? ""),

      uniSchool: String(form.uniSchool ?? ""),
      uniDegree: String(form.uniDegree ?? ""),
      uniModeOfStudy: String(form.uniModeOfStudy ?? ""),
      uniGraduationYear: String(form.uniGraduationYear ?? ""),
      uniDescription: String(form.uniDescription ?? ""),

      contractName: String(form.contractName ?? ""),
      contractNumber: String(form.contractNumber ?? ""),
      contractType: String(form.contractType ?? ""),
      salaryGross: String(form.salaryGross ?? ""),
      salaryBasic: String(form.salaryBasic ?? ""),
      salaryCapacity: String(form.salaryCapacity ?? ""),
      branch: String(form.branch ?? ""),
      department: String(form.department ?? ""),
      staffType: String(form.staffType ?? ""),
      paymentMethod: String(form.paymentMethod ?? ""),
      endDay: String(form.endDay ?? ""),
      note: String(form.note ?? ""),
    };

    const nextEmployees = employees.map((emp) =>
      emp.no === employee.no ? updated : emp
    );
    setEmployees(nextEmployees);
    writeEmployees(nextEmployees);

    router.push(`/manager/employee/${encodeURIComponent(updated.id)}`);
  };

  if (!employee && !isHydrated && employeeId) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-600">Đang tải thông tin nhân viên…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!employeeId || !employee) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              onClick={() => router.push("/manager/employee")}
              aria-label="Back"
              type="button"
            >
              ←
            </button>
            <div>
              <div className="text-sm font-semibold text-gray-900">Edit Employee</div>
              <div className="text-xs text-gray-500">Không tìm thấy nhân viên</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-800 font-medium mb-1">Không tìm thấy nhân viên</div>
            <div className="text-sm text-gray-600">Vui lòng quay lại danh sách và chọn nhân viên khác.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Header - giống layout create */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">✎</span>
          <h2 className="text-sm font-bold text-gray-700">Information User</h2>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/manager/employee`)}
          className="text-gray-400 hover:text-gray-700"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {(() => {
        const inputBase =
          "px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-green-500 transition-colors";
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

        return (
          <form
            onSubmit={onSubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px] mx-auto w-full"
          >
            {/* ROW 1: Account Info (5/12) & Main Info (7/12) */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                  Account Info
                </h3>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border-2 border-green-500">
                      <img
                        src="https://i.pravatar.cc/150?u=emp"
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded hover:bg-gray-200"
                    >
                      <Upload size={12} /> UPLOAD
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <FormRow label="Employee ID" required>
                      <input
                        type="text"
                        name="id"
                        value={String(form.id)}
                        onChange={onChange}
                        className={inputClass}
                        placeholder="account43"
                      />
                    </FormRow>

                    <FormRow label="Password">
                      <input
                        type="password"
                        name="password"
                        value={String(form.password)}
                        onChange={onChange}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </FormRow>

                    <FormRow label="Roles">
                      <select
                        name="role"
                        value={String(form.role)}
                        onChange={onChange}
                        className={inputClass}
                      >
                        <option value="Member">Member</option>
                        <option value="Manager">Manager</option>
                        <option value="Developer">Developer</option>
                        <option value="HR">HR</option>
                        <option value="Sale">Sale</option>
                      </select>
                    </FormRow>

                    <FormRow label="Permission Template">
                      <select
                        name="permissionTemplate"
                        value={String(form.permissionTemplate)}
                        onChange={onChange}
                        className={inputClass}
                      >
                        <option value="Member">Member</option>
                      </select>
                    </FormRow>

                    <FormRow label="Email Company">
                      <input
                        type="email"
                        name="emailCompany"
                        value={String(form.emailCompany)}
                        onChange={onChange}
                        className={inputClass}
                        placeholder="name@company.co"
                      />
                    </FormRow>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                  Main Info
                </h3>
                <div className="space-y-1">
                  <FormRow label="Fullname" required>
                    <input
                      type="text"
                      name="fullname"
                      value={String(form.fullname)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>

                  <FormRow label="Shortname">
                    <input
                      type="text"
                      name="shortname"
                      value={String(form.shortname)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>

                  <div className="flex items-center gap-3 mb-2">
                    <label className="w-32 shrink-0 text-xs font-medium text-gray-600">
                      Gender
                    </label>
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <select
                          name="gender"
                          value={String(form.gender)}
                          onChange={onChange}
                          className={inputClass}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 min-w-[240px]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                          Birth Day
                        </span>
                        <div className="w-[170px]">
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={String(form.dateOfBirth)}
                            onChange={onChange}
                            className={dateClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormRow label="Email Personal">
                    <input
                      type="email"
                      name="email"
                      value={String(form.email)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>

                  <FormRow label="Address">
                    <input
                      type="text"
                      name="address"
                      value={String(form.address)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>

                  <div className="flex items-center gap-3 mb-2">
                    <label className="w-32 shrink-0 text-xs font-medium text-gray-600">
                      Sign Day
                    </label>
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="w-[190px]">
                        <input
                          type="date"
                          name="signDay"
                          value={String(form.signDay)}
                          onChange={onChange}
                          className={dateClass}
                        />
                      </div>

                      <div className="flex items-center gap-2 min-w-[240px]">
                        <span className="text-[10px] font-bold text-red-500 uppercase whitespace-nowrap">
                          Quit Day
                        </span>
                        <div className="w-[170px]">
                          <input
                            type="date"
                            name="quitDay"
                            value={String(form.quitDay)}
                            onChange={onChange}
                            className={dateClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Other Info (5/12) & Banking/University (7/12) */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-5 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                  Other Info
                </h3>
                <div className="space-y-1">
                  <FormRow label="ID Card *" required>
                    <input
                      type="text"
                      name="idCard"
                      value={String(form.idCard)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>
                  <FormRow label="Tax Number">
                    <input
                      type="text"
                      name="taxNumber"
                      value={String(form.taxNumber)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>
                  <FormRow label="ID Social Insurance">
                    <input
                      type="text"
                      name="socialInsurance"
                      value={String(form.socialInsurance)}
                      onChange={onChange}
                      className={inputClass}
                    />
                  </FormRow>

                  <div className="flex items-center gap-3 mb-2">
                    <label className="w-32 shrink-0 text-xs font-medium text-gray-600">
                      Married
                    </label>
                    <div className="flex-1 min-w-0 flex items-center gap-6">
                      <input
                        type="checkbox"
                        name="married"
                        checked={Boolean(form.married)}
                        onChange={onChange}
                        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Children</span>
                        <input
                          type="number"
                          name="children"
                          value={String(form.children)}
                          onChange={onChange}
                          className={`${inputBase} w-16 text-xs`}
                        />
                      </div>
                    </div>
                  </div>

                  <FormRow label="Children Description">
                    <textarea
                      name="childrenDescription"
                      value={String(form.childrenDescription)}
                      onChange={onChange}
                      rows={3}
                      className={inputClass}
                      placeholder="Are you sure ?"
                    />
                  </FormRow>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                    University
                  </h3>
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
                          <td className="py-2 pr-1">
                            <input
                              name="uniSchool"
                              value={String(form.uniSchool)}
                              onChange={onChange}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 pr-1">
                            <input
                              name="uniDegree"
                              value={String(form.uniDegree)}
                              onChange={onChange}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 pr-1">
                            <input
                              name="uniModeOfStudy"
                              value={String(form.uniModeOfStudy)}
                              onChange={onChange}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2 pr-1">
                            <input
                              name="uniGraduationYear"
                              value={String(form.uniGraduationYear)}
                              onChange={onChange}
                              className={inputClass}
                            />
                          </td>
                          <td className="py-2">
                            <input
                              name="uniDescription"
                              value={String(form.uniDescription)}
                              onChange={onChange}
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-8" />

            <div className="flex items-center justify-center pb-8">
              <button
                type="submit"
                className="px-12 py-2 text-sm font-bold text-white bg-emerald-500 rounded shadow-md hover:bg-emerald-600 transition-all uppercase tracking-wider"
              >
                SAVE
              </button>
            </div>
          </form>
        );
      })()}
    </div>
  );
}
