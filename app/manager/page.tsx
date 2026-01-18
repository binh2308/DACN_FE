import {
  EllipsisVertical,
  Donut,
} from "lucide-react";
import { DonutChart } from "@mantine/charts";
import { StatCard } from "@/components/StatCard";
import {stats, employees} from "../../lib/data"
import { EmployeeRow } from "@/components/EmployeeRow";


export default function ManagerIndex() {
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                  Số lượng nhân viên
                </h3>
                <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                  Tính đến hôm nay {new Date().toLocaleDateString()}
                </div>
              </div>
              <button className="text-[#21252B] hover:text-[#0B9F57]">
                <EllipsisVertical />
              </button>
            </div>

            <div className="relative w-fit mx-auto">
              <DonutChart
                size={140}
                thickness={22}
                data={[
                  { name: "Nam", value: 350, color: "green" },
                  { name: "Nữ", value: 700, color: "violet" },
                ]}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                <div className="font-bold text-xl">500</div>
                <div className="text-sm">Tổng số</div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#A78BFA]"></div>
                  <span className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                    Nữ
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                    350
                  </span>
                  <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                    70%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#34D399]"></div>
                  <span className="text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
                    Nam
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px]">
                    150
                  </span>
                  <span className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px]">
                    30%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                  Tỷ lệ hoàn thành check list
                </h3>
                <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                  Tính đến hôm nay {new Date().toLocaleDateString()}
                </div>
              </div>
              <button className="text-[#21252B] hover:text-[#0B9F57]">
                <EllipsisVertical />
              </button>
            </div>

            <div className="relative w-fit mx-auto">
              <DonutChart
                size={140}
                thickness={22}
                data={[
                  { name: "Completed", value: 60, color: "yellow" },
                  { name: "Not", value: 40, color: "gray" },
                ]}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center leading-none text-center">
                <div className="font-bold text-xl">1340</div>
              </div>
            </div>

            <div className="mt-2 text-center">
              <div className="text-xs text-[#B8BDC5] leading-[150%] tracking-[0.07px]">
                Tỷ lệ đã hoàn thành checklist
              </div>
              <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                đến tháng{" "}
                {(new Date().getMonth() + 1).toString().padStart(2, "0")} năm{" "}
                {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-[#21252B] leading-[150%] tracking-[0.08px]">
                Thông kê thời gian đi muộn
              </h3>
              <div className="text-[10px] text-[#B8BDC5] mt-0.5 leading-[140%] tracking-[0.12px]">
                Tháng {(new Date().getMonth() + 1).toString().padStart(2, "0")}/
                {new Date().getFullYear()}
              </div>
            </div>
            <button className="text-[#21252B] hover:text-[#0B9F57]">
              <EllipsisVertical />
            </button>
          </div>

          <div className="mb-2">
            <div className="grid grid-cols-4 gap-3 text-[10px] font-semibold text-[#B8BDC5] uppercase pb-2 border-b border-[#E9EAEC] leading-[140%] tracking-[0.12px]">
              <div>Nhân viên</div>
              <div className="text-center">Số giờ đi muộn</div>
              <div className="text-center">Thành tiền</div>
              <div className="text-center">Tình trạng</div>
            </div>
          </div>

          <div className="space-y-0 max-h-[400px] overflow-y-auto">
            {employees.map((employee, index) => (
              <EmployeeRow key={index} {...employee} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
