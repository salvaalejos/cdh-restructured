import { NavLink } from "react-router-dom";
import { Users, FileText, ClipboardList, Settings, LayoutDashboard, Map } from "lucide-react";
import LogoVertical from "@/logos/VERTICAL.png";
import { useAuthStore } from "@/store/authStore";
import { useAccount } from "@/features/account/api/accountHooks";

const ALL_NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Usuarios", href: "/admin/users", icon: Users, permissionKey: "manageUsers" },
  { name: "Encuestas", href: "/admin/forms", icon: FileText, permissionKey: "viewSurveys" },
  { name: "Asignaciones", href: "/admin/asignaciones", icon: ClipboardList, permissionKey: "assignUsers" },
  { name: "Resultados", href: "/admin/results", icon: Map, permissionKey: "viewIndividualResults" },
  { name: "Configuración", href: "/admin/account", icon: Settings, blockRole: 2 },
];

export function Sidebar() {
  const authUser = useAuthStore((state) => state.user);
  const { data: accountUser } = useAccount();
  const user = accountUser || authUser;

  return (
    <aside className="w-64 bg-card text-foreground flex flex-col h-full shadow-lg border-r border-border z-20">
      {/* Brand Logo */}
      <div className="h-28 flex items-center justify-center border-b border-border p-4 bg-background/50">
        <img src={LogoVertical} alt="CDH Platform" className="h-full w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Menú Principal
        </div>
        {ALL_NAV_ITEMS.filter(item => {
          if (item.blockRole && user?.roleId === item.blockRole) return false;
          if (!item.permissionKey) return true; // Always show items without permission requirements
          if (user?.roleId === 1) return true; // Admin sees everything
          if (user?.roleId === 2 && user.permissions) {
             const perms = user.permissions as Record<string, boolean>;
             return perms[item.permissionKey] === true;
          }
          return false; // Encuestador (role 3) or unauthorized guest sees nothing of these
        }).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-accent"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
        CDH CRM &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}
