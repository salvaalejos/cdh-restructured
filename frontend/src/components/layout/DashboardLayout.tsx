import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        
        {/* Main Content Scroll Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
