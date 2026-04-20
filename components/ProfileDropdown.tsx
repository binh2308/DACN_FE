'use client';

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, Lock, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getEmployeeProfile, type EmployeeDetailDto } from "@/services/DACN/employee";
import ChangePasswordPage from "@/components/ChangePasswordPage";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function buildFullName(p: Pick<EmployeeDetailDto, "lastName" | "middleName" | "firstName">) {
  return [p.lastName, p.middleName, p.firstName].filter(Boolean).join(" ").trim();
}

function safeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function fallbackAvatar(seed: string) {
  const cleanSeed = seed || "user";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanSeed)}`;
}

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const [profile, setProfile] = useState<EmployeeDetailDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getEmployeeProfile();
        if (!cancelled && res?.statusCode === 200 && res.data) {
          setProfile(res.data);
        }
      } catch {
        // ignore
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  const handleProfile = () => {
    const prefix = pathname?.startsWith("/admin")
      ? "/admin"
      : pathname?.startsWith("/manager")
        ? "/manager"
        : pathname?.startsWith("/user")
          ? "/user"
          : "";

    router.push(prefix ? `${prefix}/profile` : "/profile");
    setIsOpen(false);
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
    setIsOpen(false);
  };

  const fullName = profile ? buildFullName(profile) : "User";
  const email = safeString(profile?.email);
  const avatarUrl = safeString(profile?.avatarUrl) || fallbackAvatar(fullName || email || "user");

  return (
    <>
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="p-0 border-0 bg-transparent shadow-none">
          <ChangePasswordPage embedded />
        </DialogContent>
      </Dialog>

      <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-neutral-background rounded-lg transition-colors p-1"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
          <img
            src={avatarUrl}
            alt={fullName || "User"}
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
                  src={avatarUrl}
                  alt={fullName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-[#21252B] truncate">
                  {fullName || "User"}
                </h3>
                <p className="text-sm text-[#657081] truncate">
                  {email}
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
              onClick={handleChangePassword}
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
    </>
  );
}