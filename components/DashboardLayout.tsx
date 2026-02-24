import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import ManagerDashboardSidebar from "./ManagerDashboardSidebar";
import AdminDashboardSidebar from "./AdminDashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  isManager?: boolean;
  isAdmin?: boolean;
}

export default function DashboardLayout({
	children,
	isManager = false,
	isAdmin = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-background overflow-hidden">
      {(isAdmin && <AdminDashboardSidebar />) || (isManager && <ManagerDashboardSidebar />) || (!isManager && !isAdmin && <DashboardSidebar />)}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
