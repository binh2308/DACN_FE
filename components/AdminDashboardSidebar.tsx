"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  LayoutGrid,
  Briefcase,
  Users,
  MessageSquare,
  Home,
  Settings,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    label: "Quản lý tài sản",
    href: "/admin/assets",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: "Quản lý nhân sự",
    href: "/admin/employee",
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: "Diễn đàn",
    href: "/admin/forum",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    label: "Quản lý phòng họp",
    href: "/admin/booking-room",
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: "Cấu hình hệ thống",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export default function AdminDashboardSidebar() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="w-64 h-screen bg-[#0B2E4E] flex flex-col flex-shrink-0 transition-all duration-300">
      <div className="h-16 px-5 flex items-center justify-between">
        <h1
          className="text-xl font-bold text-[#2DD4BF] uppercase tracking-wide"
          style={{ fontFamily: "serif" }} 
        >
          HRMS LOGO
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                  active
                    ? "bg-[#154568] text-[#2DD4BF]" 
                    : "text-white hover:bg-white/5" 
                )}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>

                <span className="truncate">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}