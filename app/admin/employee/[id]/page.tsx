"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getEmployees } from "@/services/DACN/employee";
import { employeeDtoToUI, extractEmployeesFromResponseData, type EmployeeUI } from "@/lib/employee-ui";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();

  const employeeId = React.useMemo(() => {
    const raw = params?.id;
    const idStr = Array.isArray(raw) ? raw[0] : raw;
    return (idStr ?? "").trim() || null;
  }, [params]);

  const [employees, setEmployees] = React.useState<EmployeeUI[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await getEmployees({ url: "/employee/all" });
        const list = extractEmployeesFromResponseData(res?.data);
        if (!cancelled) setEmployees(list.map((dto, idx) => employeeDtoToUI(dto, idx)));
      } catch {
        if (!cancelled) setEmployees([]);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const employee = React.useMemo(() => {
    if (!employeeId) return null;
    return employees.find((e) => e.id === employeeId) ?? null;
  }, [employeeId, employees]);

  if (!employee && !isHydrated && employeeId) {
    return (
      <div className="bg-white min-h-screen p-6">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              onClick={() => router.push("/admin/employee")}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-sm font-semibold text-gray-800">Employee Detail</div>
          </div>

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
              onClick={() => router.push("/admin/employee")}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-sm font-semibold text-gray-800">Employee Detail</div>
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
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-[900px] mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              className="h-9 w-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              onClick={() => router.push("/admin/employee")}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-sm font-semibold text-gray-900">Employee Detail</div>
              <div className="text-xs text-gray-500">{employee.fullname}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">ID: {employee.id}</div>
            <button
              type="button"
              onClick={() => router.push(`/admin/employee/${encodeURIComponent(employee.id)}/edit`)}
              className="inline-flex items-center gap-2 h-8 px-3 rounded border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} />
              Edit
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="No." value={String(employee.no)} />
            <Field label="Role" value={employee.role} />
            <Field label="Phone" value={employee.phone} />
            <Field label="Email" value={employee.email} />
            <Field label="Sign Day" value={employee.signDay} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
    </div>
  );
}
