"use client";

import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  Eye
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRequest } from "ahooks";

import { getMyPayrollByMonth } from "@/services/DACN/Payroll";

// --- Helper: Format tiền tệ ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

type SalaryHistoryItem = {
  year: number;
  month: number;
  total: number;
  deduction: number;
  taxAmount: number;
  net: number;
  status: string;
};

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

function nextPayLabel(year: number, month: number) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return "-";
  const lastDay = new Date(year, month, 0);
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "short" }).format(lastDay);
}

export default function PayrollPage() {
  const now = new Date();
  const realCurrentYear = now.getFullYear();
  const realCurrentMonth = now.getMonth() + 1;

  const [year, setYear] = useState(realCurrentYear);
  const [month, setMonth] = useState(realCurrentMonth);

  // 1. GỌI API CHO PHIẾU LƯƠNG CHI TIẾT (Bên trái)
  const { data, loading, error, refresh } = useRequest(
    () => getMyPayrollByMonth({ year, month }),
    { refreshDeps: [year, month] },
  );

  const p = (data as any)?.data ?? data;

  const totalEarnings = toNumber(p?.grossSalary);
  const totalDeductions = toNumber(p?.insuranceAmount) + toNumber(p?.taxAmount) + toNumber(p?.deduction);
  const netSalary = toNumber(p?.netSalary);

  const currentPayslip = useMemo(() => {
    const y = Number(p?.year ?? year);
    const m = Number(p?.month ?? month);
    const mm = String(m).padStart(2, "0");
    const employeeId = p?.employeeId ? String(p.employeeId) : "";
    const paymentDate = p?.paidAt ?? p?.finalizedAt ?? p?.updatedAt ?? "";

    return {
      month: `${mm}/${y}`,
      employeeId: employeeId ? `ID:${employeeId}` : "-",
      department: p?.employee?.department?.name ? String(p.employee.department.name) : "-",
      paymentDate: paymentDate ? new Intl.DateTimeFormat("vi-VN").format(new Date(paymentDate)) : "-",
      earnings: [
        { label: "Lương cơ bản", amount: toNumber(p?.basicSalarySnapshot) },
        { label: "Trợ cấp", amount: toNumber(p?.allowance) },
      ],
      deductions: [
        { label: "Bảo hiểm", amount: toNumber(p?.insuranceAmount) },
        { label: "Thuế thu nhập", amount: toNumber(p?.taxAmount) },
        { label: "Các khoản khấu trừ khác", amount: toNumber(p?.deduction) },
      ],
    };
  }, [p, year, month]);

  // 2. GỌI API CHO LỊCH SỬ (Bên phải)
  const historyMonths = useMemo(() => {
    const result: Array<{ year: number; month: number }> = [];
    const base = new Date(); 
    for (let i = 0; i < 24; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    return result;
  }, []);

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refresh: refreshHistory,
  } = useRequest(
    async () => {
      const settled = await Promise.allSettled(
        historyMonths.map(async (it) => {
          const res: any = await getMyPayrollByMonth({ year: it.year, month: it.month });
          const payload = res?.data ?? res;
          const pr = payload?.data ?? payload;
          return {
            year: Number(pr?.year ?? it.year),
            month: Number(pr?.month ?? it.month),
            total: toNumber(pr?.grossSalary),
            taxAmount: toNumber(pr?.taxAmount),
            deduction: toNumber(pr?.insuranceAmount) + toNumber(pr?.taxAmount) + toNumber(pr?.deduction),
            net: toNumber(pr?.netSalary),
            status: pr?.status ? String(pr.status) : "-",
          } satisfies SalaryHistoryItem;
        }),
      );

      return settled
        .filter((x): x is PromiseFulfilledResult<SalaryHistoryItem> => x.status === "fulfilled")
        .map((x) => x.value)
        .sort((a, b) => (b.year - a.year) || (b.month - a.month));
    },
    { refreshDeps: [historyMonths] },
  );

  const salaryHistory: SalaryHistoryItem[] = Array.isArray(historyData) ? historyData : [];

  // --- TÍNH TOÁN CÁC CHỈ SỐ THỜI GIAN THỰC (YTD) TỪ MẢNG LỊCH SỬ ---
  const currentMonthPayroll = salaryHistory.find(h => h.year === realCurrentYear && h.month === realCurrentMonth);
  const ytdPayroll = salaryHistory.filter(h => h.year === realCurrentYear); 
  const cumulativeGross = ytdPayroll.reduce((sum, h) => sum + h.total, 0);
  const cumulativeTax = ytdPayroll.reduce((sum, h) => sum + h.taxAmount, 0);

  const summaryStats = useMemo(() => {
    return [
      {
        label: `Lương hiện tại`,
        value: currentMonthPayroll?.net || 0,
        icon: DollarSign,
        iconClassName: "text-emerald-500",
      },
      {
        label: `Tổng thu nhập`,
        value: cumulativeGross,
        icon: TrendingUp,
        iconClassName: "text-sky-500",
      },
      {
        label: "Ngày lương tiếp theo",
        value: nextPayLabel(realCurrentYear, realCurrentMonth),
        isDate: true,
        icon: Calendar,
        iconClassName: "text-orange-500",
      },
      {
        label: `Tổng thuế`,
        value: cumulativeTax,
        icon: Wallet,
        iconClassName: "text-violet-500",
      },
    ];
  }, [currentMonthPayroll, cumulativeGross, cumulativeTax, realCurrentYear, realCurrentMonth]);

  return (
    <div className="p-4 space-y-3">
      <div className="bg-white rounded-xl shadow-sm border border-[#E9EAEC] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
            Bảng lương của tôi
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-lg border border-[#E9EAEC] bg-white px-3 text-xs font-semibold text-[#21252B] focus:border-blue-500 focus:outline-none"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const m = i + 1;
                return (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                );
              })}
            </select>
            <select
              className="h-9 rounded-lg border border-[#E9EAEC] bg-white px-3 text-xs font-semibold text-[#21252B] focus:border-blue-500 focus:outline-none"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 6 }).map((_, i) => {
                const y = now.getFullYear() - i;
                return (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 text-sm text-red-600">
          Không thể tải bảng lương: {(error as any)?.message || "Unknown error"}
          <button
            type="button"
            onClick={() => refresh()}
            className="ml-3 underline font-semibold"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      {/* Top summary bar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E9EAEC] overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={[
                  "p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors",
                  idx !== 0 ? "lg:border-l lg:border-[#E9EAEC]" : "",
                  idx >= 1 ? "sm:border-t sm:border-[#E9EAEC] lg:border-t-0" : "",
                ].join(" ")}
              >
                <div className="h-9 w-9 rounded-lg bg-[#F5F6F7] flex items-center justify-center shrink-0">
                  <Icon size={18} className={s.iconClassName} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px] truncate">
                    {s.label}
                  </div>
                  <div className="text-lg font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                    {"isDate" in s && s.isDate ? s.value : formatCurrency(Number(s.value))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left: Payslip */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl p-4 shadow-sm border border-[#E9EAEC] sticky top-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
              Bảng lương - Tháng {currentPayslip.month}
            </div>
            {loading ? (
              <div className="text-xs text-[#B8BDC5] animate-pulse">Đang tải…</div>
            ) : null}
          </div>

          <div className="mt-3 rounded-xl border border-[#E9EAEC] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">Mã nhân viên</div>
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  {currentPayslip.employeeId}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">Phòng ban</div>
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  {currentPayslip.department}
                </div>
              </div>
              <div className="space-y-1 sm:text-right">
                <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">Ngày trả</div>
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  {currentPayslip.paymentDate}
                </div>
              </div>
            </div>

            <div className="my-4 border-t border-[#E9EAEC]" />

            {/* Earnings */}
            <div>
              <div className="text-[10px] font-semibold text-[#B8BDC5] uppercase leading-[140%] tracking-[0.12px]">
                Thu nhập
              </div>
              <div className="mt-3 space-y-2">
                {currentPayslip.earnings.map((it) => (
                  <div key={it.label} className="flex items-center justify-between">
                    <div className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">{it.label}</div>
                    <div className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                      {formatCurrency(it.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-[#E9EAEC] flex items-center justify-between">
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">Tổng lương</div>
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  {formatCurrency(totalEarnings)}
                </div>
              </div>
            </div>

            <div className="my-4 border-t border-[#E9EAEC]" />

            {/* Deductions */}
            <div>
              <div className="text-[10px] font-semibold text-[#B8BDC5] uppercase leading-[140%] tracking-[0.12px]">
                Khấu trừ
              </div>
              <div className="mt-3 space-y-2">
                {currentPayslip.deductions.map((it) => (
                  <div key={it.label} className="flex items-center justify-between">
                    <div className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">{it.label}</div>
                    <div className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                      {formatCurrency(it.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-[#E9EAEC] flex items-center justify-between">
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  Tổng khấu trừ
                </div>
                <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                  {formatCurrency(totalDeductions)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#D1FAE5] bg-[#ECFDF5] px-4 py-3 flex items-center justify-between">
              <div className="text-xs font-semibold text-[#0B9F57] leading-[150%] tracking-[0.07px]">Lương ròng</div>
              <div className="text-xs font-semibold text-[#0B9F57] leading-[150%] tracking-[0.07px]">
                {formatCurrency(netSalary)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: History (Scrollable Box) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl p-4 shadow-sm border border-[#E9EAEC] flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
              Lịch sử tiền lương
            </div>
            {historyLoading && <div className="text-xs text-[#B8BDC5] animate-pulse">Đang tải…</div>}
          </div>

          {historyError ? (
            <div className="mb-3 text-xs text-red-600 bg-red-50 p-2 rounded">
              Lỗi tải lịch sử: {(historyError as any)?.message}
            </div>
          ) : null}

          {/* Vùng danh sách lịch sử có thanh cuộn */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {salaryHistory.length === 0 && !historyLoading ? (
              <div className="text-[10px] text-[#B8BDC5] text-center mt-10">Chưa có dữ liệu lương</div>
            ) : null}
            
            {salaryHistory.map((h) => {
              const isSelected = h.year === year && h.month === month;

              return (
                <div 
                  key={`${h.year}-${h.month}`} 
                  className={`rounded-xl border p-3 transition-all hover:shadow-sm ${
                    isSelected 
                    ? 'border-[#0B9F57] bg-[#F0FFF7]/50' 
                    : 'border-[#E9EAEC] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                        Tháng {String(h.month).padStart(2, "0")}/{h.year}
                      </div>
                      <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px] mt-0.5">
                        Tổng: {formatCurrency(h.total)} • Trừ: {formatCurrency(h.deduction)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                        {formatCurrency(h.net)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          h.status === 'PAID' ? 'bg-[#ECFDF5] text-[#0B9F57]' : 'bg-[#F5F6F7] text-gray-600'
                        }`}>
                          {h.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setYear(h.year);
                            setMonth(h.month);
                          }}
                          className={`p-1.5 rounded-md transition-colors ${
                            isSelected ? 'bg-[#0B9F57] text-white' : 'text-[#B8BDC5] hover:text-[#0B9F57] hover:bg-gray-100'
                          }`}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => refreshHistory()}
            className="mt-3 w-full rounded-lg border border-[#E9EAEC] px-3 py-2 text-xs font-semibold text-[#21252B] hover:border-[#0B9F57] transition-colors"
          >
            Làm mới lịch sử
          </button>
        </div>
      </div>

      {/* Global CSS cho thanh cuộn đẹp */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
        }
      `}</style>
    </div>
  );
}