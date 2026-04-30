"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  getEmployeeDetail,
  type DegreeDto,
  type EmployeeDetailDto,
  type GetEmployeeDetailResponse,
  updateEmployeeByAdmin,
} from "@/services/DACN/employee";
import { getUserProfile } from "@/services/DACN/auth";

type ApiDepartment = { id: string; name: string };

type ApiProfileResponse = {
  statusCode: number;
  message?: string;
  data: {
    department?: ApiDepartment | null;
  } & Record<string, unknown>;
};

function fullNameFromApi(e: Pick<EmployeeDetailDto, "lastName" | "middleName" | "firstName">) {
  return [e.lastName, e.middleName ?? "", e.firstName]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function ymdFromIso(iso?: string | null) {
  if (!iso) return "";
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function toIsoUtcFromYmd(ymd: string): string | null {
  const d = String(ymd || "").trim();
  if (!d) return null;
  if (d.includes("T")) return d;
  return `${d}T00:00:00.000Z`;
}

function toOptionalNumber(value: unknown): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function newTempId() {
  try {
    return `tmp-${crypto.randomUUID()}`;
  } catch {
    return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function newDegreeRow(): DegreeDto {
  return {
    id: newTempId(),
    school: "",
    degree: "",
    fieldOfStudy: null,
    graduationYear: null,
    description: null,
  };
}

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

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const employeeId = React.useMemo(() => {
    const raw = params?.id;
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    return (idStr ?? "").trim() || null;
  }, [params]);

  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [employee, setEmployee] = React.useState<EmployeeDetailDto | null>(null);
  const [departmentName, setDepartmentName] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    id: "",
    password: "",
    role: "",
    permissionTemplate: "Member",
    avatar: null as unknown,

    lastName: "",
    firstName: "",
    middleName: "",

    fullname: "",
    gender: "Male",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    signDay: "",
    quitDay: "",

    basicSalary: "",
    grossSalary: "",

    departmentId: "",
    departmentEmployeeName: "",

    idCard: "",
    married: false,
    children: 0,
    childrenDescription: "",

    degrees: [] as DegreeDto[],

    uniSchool: "",
    uniDegree: "",
    uniModeOfStudy: "",
    uniGraduationYear: "",
    uniDescription: "",

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
  });

  const addDegree = React.useCallback(() => {
    setForm((prev) => ({
      ...prev,
      degrees: [...(Array.isArray(prev.degrees) ? prev.degrees : []), newDegreeRow()],
    }));
  }, []);

  const removeDegree = React.useCallback((degreeId: string) => {
    setForm((prev) => ({
      ...prev,
      degrees: (Array.isArray(prev.degrees) ? prev.degrees : []).filter((d) => d.id !== degreeId),
    }));
  }, []);

  const updateDegree = React.useCallback(
    <K extends keyof DegreeDto>(degreeId: string, key: K, value: DegreeDto[K]) => {
      setForm((prev) => ({
        ...prev,
        degrees: (Array.isArray(prev.degrees) ? prev.degrees : []).map((d) =>
          d.id === degreeId ? { ...d, [key]: value } : d
        ),
      }));
    },
    []
  );

  React.useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!employeeId) {
        setLoading(false);
        setEmployee(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);
      try {
        const profileRes = (await getUserProfile()) as unknown as ApiProfileResponse;
        const myDept = profileRes?.data?.department ?? null;
        if (!mounted) return;
        setDepartmentName(myDept?.name ?? "");

        const employeeRes = (await getEmployeeDetail(employeeId)) as unknown as GetEmployeeDetailResponse;
        const found = employeeRes?.data ?? null;

        if (!mounted) return;

        if (!found) {
          setEmployee(null);
          return;
        }

        setEmployee(found);
        setForm((prev) => ({
          ...prev,
          id: found.id,
          role: found.roles || "",
          avatar: found.avatarUrl ?? null,

          lastName: found.lastName ?? "",
          firstName: found.firstName ?? "",
          middleName: found.middleName ?? "",

          fullname: fullNameFromApi(found) || found.email,
          gender: found.gender ?? prev.gender,
          dateOfBirth: ymdFromIso(found.dateOfBirth),
          email: found.email ?? "",
          phone: found.phone ?? "",
          address: found.address ?? "",
          signDay: ymdFromIso(found.signDate),
          quitDay: ymdFromIso(found.quitDate),

          basicSalary: found.basicSalary != null ? String(found.basicSalary) : "",
          grossSalary: found.grossSalary != null ? String(found.grossSalary) : "",

          departmentId: found.department?.id ?? "",
          departmentEmployeeName: found.department?.name ?? "",

          idCard: found.idCard ?? "",
          married: Boolean(found.marriedStatus),
          children: Number(found.numberOfChildren ?? 0) || 0,
          childrenDescription: found.childrenDescription ?? "",

          degrees: Array.isArray(found.degrees) ? found.degrees : [],

          contractName: "",
          contractNumber: "",
          contractType: "",
          salaryGross: found.grossSalary != null ? String(found.grossSalary) : "",
          salaryBasic: found.basicSalary != null ? String(found.basicSalary) : "",
          salaryCapacity: "",
          branch: "",
          department: found.department?.name ?? "",
          staffType: "",
          paymentMethod: "",
          endDay: "",
          note: "",
        }));
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Không thể tải thông tin nhân viên";
        setErrorMsg(message);
        setEmployee(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const el = e.currentTarget;
    const name = el.name;
    const val = el instanceof HTMLInputElement && el.type === "checkbox" ? el.checked : el.value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || isSaving) return;

    const run = async () => {
      setIsSaving(true);
      setErrorMsg(null);
      try {
        const deptId = String(form.departmentId || "").trim();
        const deptName = String(form.departmentEmployeeName || "").trim();

        if (deptId && !deptName) {
          alert("Vui lòng nhập Department Name (hoặc để trống Department ID). ");
          return;
        }

        const degreesPayload = (Array.isArray(form.degrees) ? form.degrees : [])
          .map((d) => {
            const school = String(d.school ?? "").trim();
            const degree = String(d.degree ?? "").trim();
            const fieldOfStudy = String(d.fieldOfStudy ?? "").trim() || null;
            const description = String(d.description ?? "").trim() || null;
            const graduationYear = d.graduationYear != null ? Number(d.graduationYear) : null;
            return { school, degree, fieldOfStudy, graduationYear, description };
          })
          .filter((d) => {
            return Boolean(
              d.school ||
                d.degree ||
                d.fieldOfStudy ||
                d.description ||
                d.graduationYear != null
            );
          });

        const payload = {
          lastName: String(form.lastName || "").trim(),
          firstName: String(form.firstName || "").trim(),
          middleName: String(form.middleName || "").trim() || null,
          gender: String(form.gender || "").trim() || null,
          dateOfBirth: toIsoUtcFromYmd(String(form.dateOfBirth || "")),
          email: String(form.email || "").trim(),
          roles: String(form.role || "").trim(),
          phone: String(form.phone || "").trim() || null,
          basicSalary: toOptionalNumber(form.basicSalary),
          grossSalary: toOptionalNumber(form.grossSalary),
          signDate: toIsoUtcFromYmd(String(form.signDay || "")),
          quitDate: toIsoUtcFromYmd(String(form.quitDay || "")),
          idCard: String(form.idCard || "").trim() || null,
          address: String(form.address || "").trim() || null,
          departmentName: deptName || null,
          marriedStatus: Boolean(form.married),
          numberOfChildren: Number(form.children ?? 0) || 0,
          childrenDescription: String(form.childrenDescription || "").trim() || null,
          degrees: degreesPayload.length ? degreesPayload : undefined,
        };

        await updateEmployeeByAdmin(employeeId, payload);

        const employeeRes = (await getEmployeeDetail(employeeId)) as unknown as GetEmployeeDetailResponse;
        const found = employeeRes?.data ?? null;
        if (found) {
          setEmployee(found);
          setForm((prev) => ({
            ...prev,
            id: found.id,
            role: found.roles || "",
            avatar: found.avatarUrl ?? null,
            lastName: found.lastName ?? "",
            firstName: found.firstName ?? "",
            middleName: found.middleName ?? "",
            fullname: fullNameFromApi(found) || found.email,
            gender: found.gender ?? prev.gender,
            dateOfBirth: ymdFromIso(found.dateOfBirth),
            email: found.email ?? "",
            phone: found.phone ?? "",
            address: found.address ?? "",
            signDay: ymdFromIso(found.signDate),
            quitDay: ymdFromIso(found.quitDate),
            basicSalary: found.basicSalary != null ? String(found.basicSalary) : "",
            grossSalary: found.grossSalary != null ? String(found.grossSalary) : "",
            departmentId: found.department?.id ?? "",
            departmentEmployeeName: found.department?.name ?? "",
            idCard: found.idCard ?? "",
            married: Boolean(found.marriedStatus),
            children: Number(found.numberOfChildren ?? 0) || 0,
            childrenDescription: found.childrenDescription ?? "",
            degrees: Array.isArray(found.degrees) ? found.degrees : [],
          }));
        }

        alert("Cập nhật nhân viên thành công!");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Cập nhật thất bại";
        setErrorMsg(message);
        alert(message);
      } finally {
        setIsSaving(false);
      }
    };

    void run();
  };

  if (loading && employeeId) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-[1200px] mx-auto flex justify-center items-center h-64">
          <div className="text-sm font-medium text-gray-500 animate-pulse">Đang tải thông tin nhân viên…</div>
        </div>
      </div>
    );
  }

  if (!employeeId || !employee) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              className="h-10 w-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
              onClick={() => router.push("/admin/employee")}
              aria-label="Back"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Employee Detail</h1>
              <div className="text-sm text-gray-500">
                {departmentName ? `Phòng ban: ${departmentName}` : errorMsg ? "Lỗi truy xuất" : "Không tìm thấy dữ liệu"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            {errorMsg ? (
              <>
                <div className="text-base text-red-600 font-bold mb-2">Có lỗi xảy ra</div>
                <div className="text-sm text-gray-600">{errorMsg}</div>
              </>
            ) : (
              <>
                <div className="text-base text-gray-800 font-bold mb-2">Không tìm thấy nhân viên</div>
                <div className="text-sm text-gray-500">Vui lòng quay lại danh sách và chọn một nhân viên khác.</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
            <span className="font-bold text-sm">✎</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-800 leading-tight">Information User</h2>
            <p className="text-xs text-gray-500 font-medium">Update employee records</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/admin/employee`)}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex-1 overflow-y-auto p-6 max-w-[1200px] mx-auto w-full"
      >
        <fieldset disabled={isSaving} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* COLUMN 1: Profile & Account (Left Sidebar) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col items-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <div className="relative w-28 h-28 mb-4">
                    <img
                      src={(employee.avatarUrl as string | undefined | null) || "https://i.pravatar.cc/150?u=emp"}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full shadow-sm border-4 border-white"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center">
                    {form.fullname || `${form.lastName} ${form.firstName}` || "Unnamed Employee"}
                  </h3>
                  <span className="mt-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                    {form.role || "No Role"}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Account Details</h4>
                  <FormRow label="Employee ID" required>
                    <input type="text" name="id" value={String(form.id)} readOnly className={inputBase} />
                  </FormRow>

                  <FormRow label="Password">
                    <input type="password" name="password" value={String(form.password)} readOnly className={inputBase} placeholder="••••••••" />
                  </FormRow>

                  <FormRow label="Roles">
                    <input type="text" name="role" value={String(form.role)} onChange={onChange} className={inputBase} />
                  </FormRow>

                  <FormRow label="Email">
                    <input type="email" name="email" value={String(form.email)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Personal, Employment & Education (Main Content) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Personal Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100 flex items-center gap-2">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <FormRow label="Last Name" required>
                    <input type="text" name="lastName" value={String(form.lastName)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Middle Name">
                    <input type="text" name="middleName" value={String(form.middleName)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="First Name" required>
                    <input type="text" name="firstName" value={String(form.firstName)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Gender">
                    <select name="gender" value={String(form.gender)} onChange={onChange} className={inputBase}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </FormRow>
                  <FormRow label="Date of Birth">
                    <input type="date" name="dateOfBirth" value={String(form.dateOfBirth)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <FormRow label="ID Card *" required>
                    <input type="text" name="idCard" value={String(form.idCard)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Family Status</label>
                    <div className="flex items-center gap-4 h-[38px] px-3 bg-gray-50 border border-gray-200 rounded-md">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="married" checked={Boolean(form.married)} onChange={onChange} className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500" />
                        <span className="text-sm text-gray-700">Married</span>
                      </label>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Children:</span>
                        <input type="number" name="children" value={String(form.children)} onChange={onChange} className="w-16 px-2 py-1 text-sm border border-gray-300 rounded shadow-sm focus:ring-emerald-500 focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <FormRow label="Children Desc.">
                     <input type="text" name="childrenDescription" value={String(form.childrenDescription)} onChange={onChange} className={inputBase} placeholder="Description..." />
                  </FormRow>
                </div>
              </div>

              {/* Employment Details Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-5 pb-2 border-b border-gray-100">
                  Employment Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Phone">
                    <input type="text" name="phone" value={String(form.phone)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Address">
                    <input type="text" name="address" value={String(form.address)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Department ID">
                    <input type="text" name="departmentId" value={String(form.departmentId)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Department Name">
                    <input type="text" name="departmentEmployeeName" value={String(form.departmentEmployeeName)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <FormRow label="Sign Day">
                    <input type="date" name="signDay" value={String(form.signDay)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Quit Day">
                    <input type="date" name="quitDay" value={String(form.quitDay)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormRow label="Basic Salary">
                    <input type="text" name="basicSalary" value={String(form.basicSalary)} onChange={onChange} className={inputBase} />
                  </FormRow>
                  <FormRow label="Gross Salary">
                    <input type="text" name="grossSalary" value={String(form.grossSalary)} onChange={onChange} className={inputBase} />
                  </FormRow>
                </div>
              </div>

              {/* Education / Degrees Card */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">Education & Degrees</h3>
                  <button
                    type="button"
                    onClick={addDegree}
                    className="inline-flex items-center px-3 py-1.5 border border-emerald-200 text-xs font-semibold rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  >
                    + Add Degree
                  </button>
                </div>
                <div className="overflow-x-auto p-6 pt-0 mt-4">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-md">
                      <tr>
                        <th className="px-3 py-3 font-semibold rounded-tl-md">School</th>
                        <th className="px-3 py-3 font-semibold">Degree</th>
                        <th className="px-3 py-3 font-semibold">Field</th>
                        <th className="px-3 py-3 font-semibold w-24">Year</th>
                        <th className="px-3 py-3 font-semibold">Description</th>
                        <th className="px-3 py-3 font-semibold rounded-tr-md w-16 text-center">Act</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(form.degrees?.length ? form.degrees : []).map((d) => (
                        <tr key={d.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-2">
                            <input value={d.school ?? ""} onChange={(e) => updateDegree(d.id, "school", e.currentTarget.value)} className={inputBase} />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.degree ?? ""} onChange={(e) => updateDegree(d.id, "degree", e.currentTarget.value)} className={inputBase} />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.fieldOfStudy ?? ""} onChange={(e) => updateDegree(d.id, "fieldOfStudy", e.currentTarget.value)} className={inputBase} />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.graduationYear != null ? String(d.graduationYear) : ""} onChange={(e) => updateDegree(d.id, "graduationYear", toOptionalNumber(e.currentTarget.value))} inputMode="numeric" className={inputBase} />
                          </td>
                          <td className="py-3 px-2">
                            <input value={d.description ?? ""} onChange={(e) => updateDegree(d.id, "description", e.currentTarget.value)} className={inputBase} />
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button type="button" onClick={() => removeDegree(d.id)} className="text-red-500 hover:text-red-700 font-medium text-xs p-2 rounded-md hover:bg-red-50 transition-colors" title="Remove">
                              <X className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!form.degrees?.length && (
                        <tr>
                          <td className="py-8 text-gray-400 text-center italic" colSpan={6}>
                            Chưa có dữ liệu bằng cấp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </fieldset>

        {errorMsg && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form Actions */}
        <div className="mt-8 flex justify-end pb-8">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all uppercase tracking-wider disabled:opacity-60 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                SAVING...
              </>
            ) : (
              "SAVE CHANGES"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}