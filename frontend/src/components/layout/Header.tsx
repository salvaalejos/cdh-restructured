import { useAuthStore } from "@/store/authStore";
import { useAccount } from "@/features/account/api/accountHooks";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import LogoHorizontal from "@/logos/HORIZONTAL.png";

export function Header() {
  const authUser = useAuthStore((state) => state.user);
  const { data: accountUser } = useAccount();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Prefer data from API if available to reflect real-time updates
  const user = accountUser || authUser;

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const API_URL = import.meta.env.VITE_API_URL || '';
    return `${API_URL}${path}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-16 bg-card border-b border-border shadow-sm flex items-center justify-between px-4 lg:px-8 z-10">
      
      {/* Mobile Menu & Logo */}
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-none">
            <Sidebar />
          </SheetContent>
        </Sheet>
        
        <img src={LogoHorizontal} alt="CDH" className="h-8 object-contain" />
      </div>

      {/* Desktop Space (empty space for alignment) */}
      <div className="hidden lg:block flex-1">
         {/* Could add a breadcrumb or page title here */}
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 ml-auto">
        
        <ModeToggle />

        <div className="hidden md:flex flex-col text-right">
          <span className="text-sm font-medium text-foreground">{user?.name}</span>
          <span className="text-xs text-muted-foreground">
            {user?.roleId === 1 ? 'Administrador' : user?.roleId === 2 ? 'Invitado' : 'Encuestador'}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border border-border">
                {user?.profilePic && <AvatarImage src={getImageUrl(user.profilePic)} alt={user.name} className="object-cover" />}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.name ? getInitials(user.name) : "US"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  @{user?.username}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.roleId !== 2 && (
              <>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/admin/account')}>
                  <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Mi Cuenta</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
