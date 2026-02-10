"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
  getEmployeeDetail,
  type EmployeeDto,
  type GetEmployeeDetailResponse,
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

function fullNameFromApi(e: EmployeeDto) {
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
  const [employee, setEmployee] = React.useState<EmployeeDto | null>(null);
  const [departmentName, setDepartmentName] = React.useState<string>("");

  const [form, setForm] = React.useState({
    // Account Info
    id: "",
    password: "",
    role: "",
    permissionTemplate: "Member",
    avatar: null as unknown,

    // Main Info
    fullname: "",
    gender: "Male",
    dateOfBirth: "",
    email: "",
    address: "",
    signDay: "",
    quitDay: "",

    // Other Info
    idCard: "",
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
        const found = (employeeRes?.data as unknown as EmployeeDto) ?? null;

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

          fullname: fullNameFromApi(found) || found.email,
          gender: found.gender ?? prev.gender,
          dateOfBirth: ymdFromIso(found.dateOfBirth),
          email: found.email ?? "",
          address: found.address ?? "",
          signDay: ymdFromIso(found.signDate),
          quitDay: ymdFromIso(found.quitDate),

          idCard: found.idCard ?? "",
          married: Boolean(found.marriedStatus),
          children: Number(found.numberOfChildren ?? 0) || 0,
          childrenDescription: found.childrenDescription ?? "",

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

          phone: found.phone ?? "",
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
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (loading && employeeId) {
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
              <div className="text-sm font-semibold text-gray-900">Employee Detail</div>
              <div className="text-xs text-gray-500">
                {departmentName ? `Phòng ban: ${departmentName}` : errorMsg ? "Có lỗi" : ""}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            {errorMsg ? (
              <>
                <div className="text-sm text-red-700 font-medium mb-1">Có lỗi xảy ra</div>
                <div className="text-sm text-red-700">{errorMsg}</div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-800 font-medium mb-1">Không tìm thấy nhân viên</div>
                <div className="text-sm text-gray-600">Vui lòng quay lại danh sách và chọn nhân viên khác.</div>
              </>
            )}
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
            <fieldset disabled>
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
                        src={(employee.avatarUrl as string | undefined | null) || "https://i.pravatar.cc/150?u=emp"}
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
                        className={inputClass}
                        placeholder="account43"
                      />
                    </FormRow>

                    <FormRow label="Password">
                      <input
                        type="password"
                        name="password"
                        value={String(form.password)}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </FormRow>

                    <FormRow label="Roles">
                      <input
                        type="text"
                        name="role"
                        value={String(form.role)}
                        className={inputClass}
                        placeholder="account43"
                      />
                    </FormRow>

                   <FormRow label="Email">
                    <input
                      type="email"
                      name="email"
                      value={String(form.email)}
                      className={inputClass}
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
                            className={dateClass}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormRow label="Address">
                    <input
                      type="text"
                      name="address"
                      value={String(form.address)}
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
                      rows={1}
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

            </fieldset>

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
