import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAccount } from '@/features/account/api/accountHooks';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PermissionRouteProps {
  children: React.ReactNode;
  permissionKey?: string;
  blockRole?: number;
}

function RedirectWithToast() {
  useEffect(() => {
    toast.error('No tienes los permisos necesarios para acceder a esta sección.');
  }, []);
  return <Navigate to="/admin" replace />;
}

export function PermissionRoute({ children, permissionKey, blockRole }: PermissionRouteProps) {
  const authUser = useAuthStore((state) => state.user);
  const { data: accountUser, isLoading } = useAccount();
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="animate-pulse">Cargando permisos...</div></div>;
  }

  const user = accountUser || authUser;

  // Si se quiere bloquear a un rol específico directamente (ej. rol 2 en configuración de cuenta)
  if (blockRole && user?.roleId === blockRole) {
    return <RedirectWithToast />;
  }

  // Admins always have access
  if (user?.roleId === 1) return <>{children}</>;

  // Temporary admins (Guests) need the specific permission
  if (user?.roleId === 2 && permissionKey) {
    const perms = user.permissions as Record<string, boolean> | undefined;
    if (perms && perms[permissionKey] === true) {
      return <>{children}</>;
    }
  }

  // Si es rol 3 (Encuestador) y no requiere permissionKey específico (ej. cuenta), dejar pasar
  if (user?.roleId === 3 && !permissionKey) return <>{children}</>;

  return <RedirectWithToast />;
}
