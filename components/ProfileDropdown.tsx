'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, Lock, LogOut } from "lucide-react";
import {useRouter} from "next/navigation";
export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleProfile = () => {
    router.push("/user/profile");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-neutral-background rounded-lg transition-colors p-1"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#21252B] cursor-pointer" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-lg shadow-lg border border-[#E9EAEC] overflow-hidden z-50">
          {/* Profile Header */}
          <div className="p-4 border-b border-[#E9EAEC]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden flex-shrink-0">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                  alt="Nguyen Thanh Nam"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-[#21252B] truncate">
                  Nguyen Thanh Nam
                </h3>
                <p className="text-sm text-[#657081] truncate">
                  namnt@911.com
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleProfile}
              className="w-full flex items-center gap-4 px-6 py-2 hover:bg-[#F5F6F8] transition-colors text-left"
            >
              <Settings className="w-6 h-6 text-[#21252B] flex-shrink-0" />
              <span className="text-base text-[#657081]">Profile</span>
            </button>

            <button
              className="w-full flex items-center gap-4 px-6 py-2 hover:bg-[#F5F6F8] transition-colors text-left"
            >
              <Lock className="w-6 h-6 text-[#21252B] flex-shrink-0" />
              <span className="text-base text-[#657081]">Change Password</span>
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-[#E9EAEC] py-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-2 hover:bg-[#F5F6F8] transition-colors text-left"
            >
              <LogOut className="w-6 h-6 text-[#21252B] flex-shrink-0" />
              <span className="text-base text-[#657081]">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}