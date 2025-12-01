import { ReactNode, useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import AdminDashboardSidebar from "./AdminDashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  isAdmin: Boolean;
}

export default function DashboardLayout({ children, isAdmin }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-background overflow-hidden">
      {isAdmin && <AdminDashboardSidebar /> || !isAdmin && <DashboardSidebar/>}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
