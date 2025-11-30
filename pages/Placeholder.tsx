import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "react-router-dom";

export default function Placeholder() {
  const location = useLocation();
  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-grey-900 mb-4">
            {pageName || "Page"}
          </h1>
          <p className="text-muted-foreground mb-6">
            This page is a placeholder. Continue prompting to add content here.
          </p>
          <div className="w-16 h-16 mx-auto bg-main-50 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-main-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
