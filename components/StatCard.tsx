import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

export function StatCard({ title, value, change, isPositive }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col gap-1">
      <div className="text-sm text-black leading-[150%] tracking-[0.07px]">
        {title}
      </div>
      <div className="text-2xl font-semibold text-[#21252B] leading-[140%] tracking-[0.36px]">
        {value}
      </div>
      <div
        className={`flex items-center gap-1 text-xs font-normal leading-[140%] tracking-[0.12px] ${
          isPositive ? "text-[#0CAF60]" : "text-[#E03137]"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-2.5 h-2.5" />
        ) : (
          <TrendingDown className="w-2.5 h-2.5" />
        )}
        <span>
          {isPositive ? "↑" : "↓"} {change}
        </span>
        <span className="text-[#B8BDC5] ml-1">So với tháng trước</span>
      </div>
    </div>
  );
}