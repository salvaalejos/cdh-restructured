import type { User } from '../types';
import { useDeleteUser } from '../api/userHooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, UserCircle, Edit2 } from 'lucide-react';

interface UsersTableProps {
    users: User[];
    meta?: { page: number, lastPage: number, total: number };
    onEditUser: (user: User) => void;
    onPageChange?: (page: number) => void;
}

export function UsersTable({ users, meta, onEditUser, onPageChange }: UsersTableProps) {
    const { mutate: deleteUser } = useDeleteUser();
    const API_URL = import.meta.env.VITE_API_URL;

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border">
                            <TableHead className="text-muted-foreground font-semibold">Nombre</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Usuario</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Rol</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Identificación</TableHead>
                            <TableHead className="text-right text-muted-foreground font-semibold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id} className="border-border">
                                <TableCell className="font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell className="text-foreground">{user.username}</TableCell>
                                <TableCell>
                                    {user.roleId === 1 ? (
                                        <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary">Administrador</Badge>
                                    ) : user.roleId === 2 ? (
                                        <Badge variant="secondary" className="text-muted-foreground border-border bg-background">Supervisor</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-muted-foreground border-border bg-background">Encuestador</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {user.frontId ? (
                                        <a href={`${API_URL}${user.frontId}`} target="_blank" rel="noreferrer" className="text-accent text-sm font-medium hover:underline">
                                            Ver INE
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">Sin documento</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-foreground hover:bg-accent/10"
                                        onClick={() => onEditUser(user)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            if (confirm('¿Seguro que deseas eliminar a este usuario?')) {
                                                deleteUser(user.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No se encontraron usuarios.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {meta && onPageChange && meta.lastPage > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground">
                        Mostrando página <span className="font-medium text-foreground">{meta.page}</span> de <span className="font-medium text-foreground">{meta.lastPage}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page <= 1}
                            onClick={() => onPageChange(meta.page - 1)}
                        >
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={meta.page >= meta.lastPage}
                            onClick={() => onPageChange(meta.page + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
