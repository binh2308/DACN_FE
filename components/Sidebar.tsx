import React from "react";
import { Home, Users, Briefcase, FileText, Calendar } from "lucide-react";

export function Sidebar() {
  const navItems = [
    { icon: Home, label: "Home", isActive: true },
    { icon: Briefcase, label: "Jobs", isActive: false },
    { icon: Users, label: "Candidates", isActive: false },
    { icon: FileText, label: "Reports", isActive: false },
    { icon: Calendar, label: "Calendar", isActive: false },
  ];

  return (
    <div className="w-[126px] h-screen bg-dashboard-sidebar relative flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-6 pb-8">
        <div className="relative">
          <svg width="32" height="50" viewBox="0 0 32 50" fill="none">
            <path
              d="M15.6993 40.4396C6.87073 31.1906 -5.48926 14.6912 15.6993 22.6854V40.4396Z"
              stroke="#4B93E7"
              strokeWidth="7.61799"
            />
            <path
              d="M15.6993 40.4396C24.5279 31.1906 36.8879 14.6912 15.6993 22.6854V40.4396Z"
              stroke="#4B93E7"
              strokeWidth="7.61799"
            />
            <path
              d="M15.6993 40.4396C6.87073 31.1906 -5.48926 14.6912 15.6993 22.6854V40.4396Z"
              fill="#082777"
            />
            <path
              d="M15.6993 40.4396C24.5279 31.1906 36.8879 14.6912 15.6993 22.6854V40.4396Z"
              fill="#F7AC25"
            />
            <ellipse
              cx="15.8334"
              cy="7.6424"
              rx="8.23194"
              ry="7.20294"
              fill="#4B93E7"
            />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-6 px-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex flex-col items-center gap-1 py-3 px-2 text-sm font-semibold transition-all relative ${
                item.isActive
                  ? "text-[#F0F7FF] text-shadow"
                  : "text-[#CFD8DC] opacity-40 hover:opacity-60"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>

              {item.isActive && (
                <div className="absolute -left-4 top-0 bottom-0 w-2 bg-dashboard-orange rounded-r-lg" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
