interface EmployeeRowProps {
  name: string;
  email: string;
  avatar: string;
  daysOff: number;
  salary: string;
  status: "Đã đóng" | "Chưa đóng";
  onEditDaysOff?: () => void;
  onToggleStatus?: () => void;
}

export function EmployeeRow({
  name,
  email,
  avatar,
  daysOff,
  salary,
  status,
  onEditDaysOff,
  onToggleStatus,
}: EmployeeRowProps) {
  const statusClass =
    status === "Đã đóng"
      ? "bg-[#D1FAE5] text-[#065F46]"
      : "bg-[#FEF3C7] text-[#92400E]";

  return (
    <div className="grid grid-cols-4 gap-3 py-1.5 border-b border-[#E9EAEC] last:border-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
          <img
            src={avatar}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-xs font-medium text-[#21252B] leading-[150%] tracking-[0.07px] truncate">
            {name}
          </div>
          <div className="text-[10px] text-[#B8BDC5] leading-[140%] tracking-[0.12px] truncate">
            {email}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
        {onEditDaysOff ? (
          <button
            type="button"
            onClick={onEditDaysOff}
            className="px-2 py-1 rounded-md hover:bg-gray-50"
            title="Chỉnh sửa"
          >
            {daysOff}
          </button>
        ) : (
          daysOff
        )}
      </div>

      <div className="flex items-center justify-center text-xs text-[#21252B] leading-[150%] tracking-[0.07px]">
        {salary}
      </div>

      <div className="flex items-center justify-center">
        {onToggleStatus ? (
          <button
            type="button"
            onClick={onToggleStatus}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-[140%] tracking-[0.12px] ${statusClass}`}
            title="Bấm để đổi trạng thái"
          >
            {status}
          </button>
        ) : (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-[140%] tracking-[0.12px] ${statusClass}`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}