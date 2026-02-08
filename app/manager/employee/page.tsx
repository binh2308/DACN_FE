"use client";

import { Search, Plus, Filter, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Employee, initialEmployees } from "@/lib/data";
import { getEmployees, type EmployeeDto, type GetEmployeesResponse } from "@/services/DACN/employee";
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

export default function EmployeeManage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // quick cache hydration (optional)
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("employees_manager");
        if (raw) {
          const parsed = JSON.parse(raw) as Employee[];
          if (Array.isArray(parsed) && parsed.length > 0) setEmployees(parsed);
        }
      }
    } catch {
      // ignore
    }

    const run = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const profileRes = (await getUserProfile()) as unknown as ApiProfileResponse;
        const myDept = profileRes?.data?.department ?? null;
        if (!mounted) return;
        setDepartmentId(myDept?.id ?? null);
        setDepartmentName(myDept?.name ?? "");

        const employeesRes = (await getEmployees()) as unknown as GetEmployeesResponse;
        const all = employeesRes?.data?.items ?? [];

        const filtered = all.filter((e) => {
          if (e.roles !== "EMPLOYEE") return false;
          if (myDept?.id) return e.department?.id === myDept.id;
          return e.department == null;
        });

        const mapped: Employee[] = filtered.map((e, idx) => ({
          no: idx + 1,
          id: e.id,
          fullname: fullNameFromApi(e) || e.email,
          role: e.roles || "--",
          phone: e.phone ?? "N/A",
          email: e.email,
          signDay: ymdFromIso(e.signDate) || "",
        }));

        if (!mounted) return;
        setEmployees(mapped);

        try {
          localStorage.setItem("employees_manager", JSON.stringify(mapped));
        } catch {
          // ignore
        }
      } catch (err) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : "Không thể tải danh sách nhân viên";
        setErrorMsg(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (typeof window !== "undefined") run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = (no: number) => {
    setEmployees(employees.filter((emp) => emp.no !== no));
  };

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.id.toLowerCase().includes(q) ||
        emp.fullname.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  return (
    <div className="p-6 bg-white">
      {departmentId || departmentName ? (
        <div className="mb-3 text-xs text-muted-foreground">
          Phòng ban hiện tại:{" "}
          <span className="font-semibold text-foreground">
            {departmentName || departmentId}
          </span>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-52">
          <input
            type="text"
            placeholder="Search by ID, Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-3 pr-8 text-xs italic text-[#A2A2A2] border border-[#B6B6B6] rounded focus:outline-none focus:ring-1 focus:ring-primary"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A2A2A2]" />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D]"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <Filter className="w-4 h-4" />
            <span>Inactive</span>
          </button>
          <button
            onClick={() => router.push("/manager/employee/create")}
            className="flex items-center gap-2 h-8 px-3 bg-[#EBEDF0] rounded text-xs text-[#172B4D] hover:bg-[#D6D9E0] transition-colors"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      <div className="border border-[#C1C7D0] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{
              fontFamily:
                "Poppins, -apple-system, Roboto, Helvetica, sans-serif",
            }}
          >
            <thead>
              <tr className="border-b border-[#C1C7D0]">
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-16">
                  No.
                </th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  ID
                </th>
                <th className="px-10 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-48">
                  Fullname
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  Role
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-32">
                  Phone
                </th>
                <th className="px-9 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-44">
                  Email
                </th>
                <th className="px-5 py-2.5 text-center text-sm font-normal text-black border-r border-[#C1C7D0] w-36">
                  Sign Day
                </th>
                <th className="px-3 py-2.5 text-center text-sm font-normal text-black w-32">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Đang tải danh sách nhân viên…
                  </td>
                </tr>
              ) : null}

              {!loading && filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    Không có nhân viên trong phòng ban này.
                  </td>
                </tr>
              ) : null}

              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.no}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/manager/employee/${encodeURIComponent(employee.id)}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/manager/employee/${encodeURIComponent(employee.id)}`);
                    }
                  }}
                  className="border-b border-[#C1C7D0] last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.no}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.id}
                  </td>
                  <td className="px-10 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.fullname}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.role}
                  </td>
                  <td className="px-3 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.phone}
                  </td>
                  <td className="px-9 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.email}
                  </td>
                  <td className="px-5 py-2.5 text-center text-sm text-black border-r border-[#C1C7D0]">
                    {employee.signDay}
                  </td>
                  <td className="px-3 py-2.5 text-center border-[#C1C7D0]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(employee.no);
                      }}
                      className="inline-flex items-center justify-center hover:bg-red-50 rounded p-1 transition-colors"
                      aria-label="Delete employee"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
