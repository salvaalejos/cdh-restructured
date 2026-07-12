import React, { useState, useEffect } from 'react';
import { useAccount, useUpdateAccount } from '../api/accountHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, KeyRound, Upload, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const API_URL = import.meta.env.VITE_API_URL || '';
    return `${API_URL}${path}`;
};

export default function AccountPage() {
    const { data: user, isLoading } = useAccount();
    const { mutateAsync: updateAccount, isPending } = useUpdateAccount();
    const navigate = useNavigate();
    const logout = useAuthStore(state => state.logout);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setProfilePicUrl(getImageUrl(user.profilePic));
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicFile(file);
            const objectUrl = URL.createObjectURL(file);
            setProfilePicUrl(objectUrl);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('username', username);
        if (password) {
            formData.append('password', password);
        }
        if (profilePicFile) {
            formData.append('profilePic', profilePicFile);
        }

        try {
            await updateAccount(formData);
            toast.success('Perfil actualizado correctamente');
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar el perfil');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando perfil...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Configuración de Cuenta</h1>
                <p className="text-muted-foreground text-sm">Actualiza tus datos personales y tu contraseña.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna Izquierda: Foto de Perfil */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-card border border-border rounded-lg p-6 flex flex-col items-center justify-center space-y-4 shadow-sm text-center">
                        <div className="relative group w-32 h-32 rounded-full overflow-hidden border-4 border-muted flex items-center justify-center bg-muted">
                            {profilePicUrl ? (
                                <img src={profilePicUrl} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-muted-foreground opacity-50" />
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white backdrop-blur-sm">
                                <Upload className="w-6 h-6" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} aria-label="Subir foto de perfil" />
                            </label>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-lg">{name}</h3>
                            <p className="text-muted-foreground text-sm">@{username}</p>
                            <p className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full inline-block mt-2">
                                {user?.roleId === 1 || user?.roleId === 2 ? 'Administrador' : 'Encuestador'}
                            </p>
                        </div>
                    </div>

                    <Button variant="destructive" className="w-full" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>

                {/* Columna Derecha: Formulario */}
                <div className="md:col-span-2">
                    <div className="bg-card border border-border rounded-lg shadow-sm">
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" /> Datos Personales
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nombre Completo</Label>
                                        <Input 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nombre de Usuario</Label>
                                        <Input 
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h3 className="text-lg font-medium border-b pb-2 flex items-center gap-2">
                                    <KeyRound className="w-5 h-5 text-primary" /> Seguridad
                                </h3>
                                <p className="text-sm text-muted-foreground">Deja los campos en blanco si no deseas cambiar tu contraseña actual.</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nueva Contraseña</Label>
                                        <Input 
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmar Contraseña</Label>
                                        <Input 
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isPending} className="w-full sm:w-auto min-w-[120px]">
                                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    {isPending ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
