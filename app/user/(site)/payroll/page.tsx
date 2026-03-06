"use client";

import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Wallet, 
  Eye, 
  Download,
  Printer
} from "lucide-react";
import { useState } from "react";

// --- Helper: Format tiền tệ ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Mock Data (Dữ liệu mẫu dựa trên ảnh) ---
const summaryStats = [
  {
    label: "Lương hiện tại",
    value: 10500,
    icon: DollarSign,
    iconClassName: "text-emerald-500",
  },
  {
    label: "Tổng thu nhập",
    value: 126000,
    icon: TrendingUp,
    iconClassName: "text-sky-500",
  },
  {
    label: "Ngày lương tiếp theo",
    value: "30 thg 11", 
    isDate: true,
    icon: Calendar,
    iconClassName: "text-orange-500",
  },
  {
    label: "Tổng thuế",
    value: 18360,
    icon: Wallet,
    iconClassName: "text-violet-500",
  },
];

const currentPayslip = {
  month: "10/2025",
  employeeId: "ID:EMP001",
  department: "Kinh doanh",
  paymentDate: "30-10-2025",
  earnings: [
    { label: "Lương cơ bản", amount: 8500 },
    { label: "Thưởng thêm", amount: 2550 },
    { label: "Trợ cấp đi lại", amount: 1000 },
    { label: "Trợ cấp y tế", amount: 500 },
    { label: "Trợ cấp ăn uống", amount: 800 },
  ],
  deductions: [
    { label: "Quỹ Dự phòng", amount: 1020 },
    { label: "Thuế thu nhập", amount: 1530 },
    { label: "Bảo hiểm", amount: 200 },
    { label: "Các khoản khấu trừ khác", amount: 100 },
  ],
};

const salaryHistory = [
  { month: "Tháng 10/2025", total: 13350, deduction: 2850, net: 10500, status: "Paid" },
  { month: "Tháng 9/2025", total: 13350, deduction: 2850, net: 10500, status: "Paid" },
  { month: "Tháng 8/2025", total: 13350, deduction: 2850, net: 10500, status: "Paid" },
  { month: "Tháng 7/2025", total: 13350, deduction: 2850, net: 10500, status: "Paid" },
  { month: "Tháng 6/2025", total: 13350, deduction: 2850, net: 10500, status: "Paid" },
];

export default function PayrollPage() {
  const totalEarnings = currentPayslip.earnings.reduce((acc, item) => acc + item.amount, 0);
  const totalDeductions = currentPayslip.deductions.reduce((acc, item) => acc + item.amount, 0);
  const netSalary = totalEarnings - totalDeductions;

  return (
    <div className="p-4 space-y-3">
      {/* Top summary bar (1 card, chia 4 cột) */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E9EAEC] overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={[
                  "p-4 flex items-center gap-3",
                  idx !== 0 ? "lg:border-l lg:border-[#E9EAEC]" : "",
                  idx >= 1 ? "sm:border-t sm:border-[#E9EAEC] lg:border-t-0" : "",
                ].join(" ")}
              >
                <div className="h-9 w-9 rounded-lg bg-[#F5F6F7] flex items-center justify-center">
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Payslip */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-xl p-4 shadow-sm border border-[#E9EAEC]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
              Bảng lương - Tháng {currentPayslip.month}
            </div>
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

        {/* Right: History */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-xl p-4 shadow-sm border border-[#E9EAEC] h-fit">
          <div className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
            Lịch sử tiền lương
          </div>

          <div className="mt-3 space-y-3">
            {salaryHistory.map((h) => (
              <div key={h.month} className="rounded-xl border border-[#E9EAEC] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                      {h.month}
                    </div>
                    <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px] mt-0.5">
                      Tổng cộng: {formatCurrency(h.total)} | Trừ: {formatCurrency(h.deduction)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-[#21252B] leading-[150%] tracking-[0.07px]">
                      {formatCurrency(h.net)}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#0B9F57] text-[10px] font-semibold">
                      {h.status}
                    </span>
                    <button className="text-[#B8BDC5] hover:text-[#0B9F57]" aria-label="View">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-3 w-full rounded-lg border border-[#E9EAEC] px-3 py-2 text-xs font-semibold text-[#21252B] hover:border-[#0B9F57]">
            Xem toàn bộ lịch sử
          </button>
        </div>
      </div>
    </div>
  );
}