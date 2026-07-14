import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCreateUser, useUpdateUser } from '../api/userHooks';
import type { User } from '../types';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, FileText, CheckSquare, Users, UserPlus, FileBarChart, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface UserFormModalProps {
    open: boolean;
    onClose: () => void;
    userToEdit?: User | null;
}

const permissionCards = [
    { key: 'createSurvey', label: 'Crear encuesta', icon: FileText },
    { key: 'viewSurveys', label: 'Ver encuestas', icon: CheckSquare },
    { key: 'manageUsers', label: 'Gestionar usuarios', icon: Users },
    { key: 'assignUsers', label: 'Asignar usuarios', icon: UserPlus },
    { key: 'viewIndividualResults', label: 'Ver resultados', icon: FileBarChart },
];

export function UserFormModal({ open, onClose, userToEdit }: UserFormModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [roleId, setRoleId] = useState('3');
    const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        createSurvey: false,
        viewSurveys: false,
        manageUsers: false,
        assignUsers: false,
        viewIndividualResults: false,
    });
    
    const { mutate: createUser, isPending: isCreating } = useCreateUser();
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
    
    const isPending = isCreating || isUpdating;

    useEffect(() => {
        if (userToEdit) {
            setUsername(userToEdit.username);
            setName(userToEdit.name);
            setRoleId(String(userToEdit.roleId));
            setPassword(''); 
            if (userToEdit.roleId === 2 && userToEdit.permissions) {
                setPermissions(userToEdit.permissions);
            } else {
                setPermissions({
                    createSurvey: false,
                    viewSurveys: false,
                    manageUsers: false,
                    assignUsers: false,
                    viewIndividualResults: false,
                });
            }
            if (userToEdit.birthDate) {
                // Ensure correct timezone parsing
                const d = new Date(userToEdit.birthDate);
                // Adjust for local timezone drift if necessary
                setBirthDate(new Date(d.getTime() + Math.abs(d.getTimezoneOffset()*60000)));
            } else {
                setBirthDate(undefined);
            }
        } else {
            setUsername('');
            setName('');
            setRoleId('3');
            setPassword('');
            setBirthDate(undefined);
            setPermissions({
                createSurvey: false,
                viewSurveys: false,
                manageUsers: false,
                assignUsers: false,
                viewIndividualResults: false,
            });
        }
        setFrontFile(null);
        setBackFile(null);
    }, [userToEdit, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const formData = new FormData();
        if (username !== userToEdit?.username) formData.append('username', username);
        if (password) formData.append('password', password);
        if (name !== userToEdit?.name) formData.append('name', name);
        if (roleId !== String(userToEdit?.roleId)) {
            formData.append('roleId', roleId);
        }
        if (roleId === '2') {
            formData.append('permissions', JSON.stringify(permissions));
        }
        
        if (birthDate) {
            const formattedDate = format(birthDate, 'yyyy-MM-dd');
            const originalDate = userToEdit?.birthDate?.split('T')[0];
            if (formattedDate !== originalDate) {
                formData.append('birthDate', formattedDate);
            }
        } else if (userToEdit?.birthDate) {
            formData.append('birthDate', '');
        }
        
        if (frontFile) formData.append('frontId', frontFile);
        if (backFile) formData.append('backId', backFile);

        const handleSuccess = () => {
            onClose();
            setUsername('');
            setPassword('');
            setName('');
            setBirthDate(undefined);
            setFrontFile(null);
            setBackFile(null);
        };

        const handleError = (err: any) => {
            toast.error(err.response?.data?.error || 'Error al guardar usuario');
        };

        if (userToEdit) {
            updateUser({ id: userToEdit.id, formData }, { onSuccess: handleSuccess, onError: handleError });
        } else {
            createUser(formData, { onSuccess: handleSuccess, onError: handleError });
        }
    };

    const handlePermissionChange = (key: string, checked: boolean) => {
        if (key === 'all') {
            setPermissions({
                createSurvey: checked,
                viewSurveys: checked,
                manageUsers: checked,
                assignUsers: checked,
                viewIndividualResults: checked,
            });
            return;
        }

        const isViewSurveysLocked = permissions.createSurvey || permissions.assignUsers || permissions.viewIndividualResults;
        
        // Block unchecking viewSurveys if any dependent is active
        if (key === 'viewSurveys' && !checked && isViewSurveysLocked) {
            return;
        }

        const newPerms = { ...permissions, [key]: checked };
        
        if (checked && ['createSurvey', 'assignUsers', 'viewIndividualResults'].includes(key)) {
            newPerms.viewSurveys = true;
        }

        setPermissions(newPerms);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre Completo</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Usuario</Label>
                            <Input value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Contraseña {userToEdit && <span className="text-xs text-muted-foreground">(Opcional)</span>}</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required={!userToEdit} placeholder={userToEdit ? 'Vacío para no cambiar' : ''} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="role-select">Rol</Label>
                            <select 
                                id="role-select"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                value={roleId} 
                                onChange={e => setRoleId(e.target.value)}
                                aria-label="Seleccionar rol"
                            >
                                <option value="3">Encuestador</option>
                                <option value="1">Administrador Principal</option>
                                <option value="2">Admin Temporal / Invitado</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Nacimiento <span className="text-xs text-muted-foreground">(Opcional)</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal border-input bg-background text-foreground",
                                            !birthDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {birthDate ? format(birthDate, "PPP", { locale: es }) : <span>Seleccionar</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 z-50">
                                    <Calendar
                                        mode="single"
                                        selected={birthDate}
                                        onSelect={setBirthDate}

                                        locale={es}
                                        captionLayout="dropdown"
                                        fromYear={1920}
                                        toYear={new Date().getFullYear()}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    
                    {roleId === '2' && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Permisos del Invitado</Label>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className={cn(
                                        "h-8 text-xs transition-colors",
                                        Object.values(permissions).every(Boolean) 
                                            ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground" 
                                            : "hover:text-primary hover:border-primary/50"
                                    )}
                                    onClick={() => handlePermissionChange('all', !Object.values(permissions).every(Boolean))}
                                >
                                    <CheckCheck className="mr-2 h-3.5 w-3.5" />
                                    Todos los permisos
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {permissionCards.map((card) => {
                                    const Icon = card.icon;
                                    const isSelected = permissions[card.key];
                                    const isLocked = card.key === 'viewSurveys' && isSelected && (permissions.createSurvey || permissions.assignUsers || permissions.viewIndividualResults);
                                    
                                    return (
                                        <button 
                                            key={card.key}
                                            type="button"
                                            onClick={() => {
                                                if (!isLocked) handlePermissionChange(card.key, !isSelected);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 select-none w-full",
                                                isLocked ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                                                isSelected 
                                                    ? cn("border-primary bg-primary text-primary-foreground shadow-md", !isLocked && "scale-[1.02]") 
                                                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary"
                                            )}
                                        >
                                            <Icon className="h-6 w-6 mb-2" />
                                            <span className="text-xs font-semibold text-center leading-tight">{card.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label>INE (Frente) {userToEdit && userToEdit.frontId && <span className="text-xs text-accent">Ya cuenta con documento</span>}</Label>
                        <Input type="file" accept="image/*" onChange={e => setFrontFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="space-y-2">
                        <Label>INE (Reverso) {userToEdit && userToEdit.backId && <span className="text-xs text-accent">Ya cuenta con documento</span>}</Label>
                        <Input type="file" accept="image/*" onChange={e => setBackFile(e.target.files?.[0] || null)} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending}>
                            {isPending ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
