import { ReactNode } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import ManagerDashboardSidebar from "./ManagerDashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  isManager?: boolean;
}

export default function DashboardLayout({
	children,
	isManager = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-background overflow-hidden">
      {(isManager && <ManagerDashboardSidebar />) || (!isManager && <DashboardSidebar />)}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
