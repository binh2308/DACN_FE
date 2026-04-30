import { ReactNode } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import AdminDashboardSidebar from "@/components/AdminDashboardSidebar";
import FloatingAIButton from "@/components/AIButton";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-neutral-background overflow-hidden">
      <AdminDashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <FloatingAIButton />
    </div>
  );
}