import { useState, useEffect } from 'react';
import { useUsers } from '../api/userHooks';
import { UsersTable } from '../components/UsersTable';
import { UserFormModal } from '../components/UserFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import type { User } from '../types';

export default function UsersPage() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [roleId, setRoleId] = useState('all');

    const { data: response, isLoading, error } = useUsers(page, searchQuery, roleId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== searchInput) {
                setSearchQuery(searchInput);
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput, searchQuery]);

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRoleId(e.target.value);
        setPage(1);
    }

    const handleOpenCreate = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    if (error) return <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-md">Error de conexión al cargar usuarios. Verifica tu conexión al backend.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Crea y administra los encuestadores y administradores del sistema.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-md border border-border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o usuario..."
                        className="pl-9"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                </div>
                <select
                    className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                    value={roleId}
                    onChange={handleRoleChange}
                >
                    <option value="all">Todos los Roles</option>
                    <option value="1">Administradores</option>
                    <option value="2">Supervisores</option>
                    <option value="3">Encuestadores</option>
                </select>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                    <p className="animate-pulse">Sincronizando datos...</p>
                </div>
            ) : (
                <UsersTable
                    users={response?.data || []}
                    meta={response?.meta}
                    onEditUser={handleOpenEdit}
                    onPageChange={setPage}
                />
            )}

            <UserFormModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userToEdit={userToEdit}
            />
        </div>
    );
}
