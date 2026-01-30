import { Search, Mail, Bell } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
export default function DashboardHeader() {
  return (
    <header className="h-12 bg-white border-b border-grey-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-full h-9 pl-10 pr-4 bg-neutral-background border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-neutral-background rounded-lg transition-colors">
          <Mail className="w-5 h-5 text-grey-900" />
        </button>
        <button className="relative p-2 hover:bg-neutral-background rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-grey-900" />
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}
