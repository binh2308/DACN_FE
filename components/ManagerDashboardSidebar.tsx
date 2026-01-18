"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Calendar,
  ClipboardList,
  DollarSign,
  Home,
  GitBranch,
  FileText,
  BookOpen,
  Users,
  MessageSquare,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "CÁ NHÂN",
    items: [
      {
        label: "Dashboard",
        icon: <LayoutGrid className="w-5 h-5" />,
        href: "",
      },
      {
        label: "Lịch cá nhân",
        icon: <Calendar className="w-5 h-5" />,
        href: "/calendar",
      },
      {
        label: "Chấm công",
        icon: <ClipboardList className="w-5 h-5" />,
        href: "/attendance",
      },
      {
        label: "Bảng lương",
        icon: <DollarSign className="w-5 h-5" />,
        href: "/payroll",
      },
    ],
  },
  {
    title: "PHÒNG HỌP",
    items: [
      {
        label: "Đặt phòng",
        icon: <Home className="w-5 h-5" />,
        href: "/booking",
      },
      {
        label: "Phòng đã đặt",
        icon: <GitBranch className="w-5 h-5" />,
        href: "/booked-rooms",
      },
    ],
  },
  {
    title: "NHÂN SỰ",
    items: [
      {
        label: "Quản lý nhân sự",
        icon: <Users className="w-5 h-5" />,
        href: "/employee",
      },
    ],
  },
  {
    title: "TỔ CHỨC",
    items: [
      {
        label: "Request",
        icon: <FileText className="w-5 h-5" />,
        href: "/request",
      },
      {
        label: "Báo cáo",
        icon: <BookOpen className="w-5 h-5" />,
        href: "/reports",
      },
      {
        label: "Diễn đàn",
        icon: <MessageSquare className="w-5 h-5" />,
        href: "/forum",
      },
      {
        label: "Hỗ trợ kỹ thuật",
        icon: <Users className="w-5 h-5" />,
        href: "/support",
      },
    ],
  },
];

export default function ManagerDashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 h-screen bg-[#2A3E4C] border-r border-grey-50 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between px-5 py-3">
        <h1
          className="text-xl font-normal text-[#0B9F57] capitalize"
          style={{ fontFamily: "'Irish Grover', cursive" }}
        >
          hRMS LOGO
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {menuSections.map((section, idx) => (
          <div key={idx} className="px-3 mb-1">
            <div className="px-3 py-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">
                {section.title}
              </h2>
            </div>
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => {
                const active = pathname === "/manager" + item.href;
                return (
                  <Link
                    key={itemIdx}
                    href={"/manager" + item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-normal whitespace-nowrap",
                      active
                        ? "bg-[#3D5F5E] text-[#0B9F57] font-medium"
                        : "text-white hover:bg-[#3D5F5E]/50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0",
                        item.active ? "text-[#0B9F57]" : "text-white"
                      )}
                    >
                      {item.icon && (
                        <span style={{ width: "16px", height: "16px" }}>
                          {item.icon}
                        </span>
                      )}
                    </span>
                    <span className="tracking-[0.07px] leading-[140%] text-sm">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
