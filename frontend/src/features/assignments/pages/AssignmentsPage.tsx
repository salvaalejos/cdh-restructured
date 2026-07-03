import { useState, useEffect } from 'react';
import { useSurveyorsWithAssignments, useUnassign } from '../api/assignmentHooks';
import { AssignmentsTable } from '../components/AssignmentsTable';
import { AssignModal } from '../components/AssignModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignmentsPage() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: response, isLoading, error } = useSurveyorsWithAssignments(page, searchQuery);
    const { mutate: unassign } = useUnassign();

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery !== searchInput) {
                setSearchQuery(searchInput);
                setPage(1);
                setSelectedIds([]);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput, searchQuery]);

    const handleSelect = (id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (!response?.data) return;
        if (checked) {
            setSelectedIds(response.data.map(s => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleUnassign = (assignmentId: number) => {
        unassign(assignmentId, {
            onSuccess: () => {
                toast.success('Asignación removida correctamente');
            },
            onError: () => {
                toast.error('Error al remover la asignación');
            }
        });
    };

    const handleOpenAssignModal = () => {
        if (selectedIds.length === 0) {
            return toast.error('Selecciona al menos un encuestador');
        }
        setIsModalOpen(true);
    };

    const handleAssignSuccess = () => {
        setIsModalOpen(false);
        setSelectedIds([]);
    };

    if (error) return <div className="p-4 text-destructive bg-destructive/10 rounded-md">Error al cargar la lista de encuestadores.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Asignaciones
                    </h1>
                    <p className="text-muted-foreground text-sm">Gestiona la carga de trabajo de los encuestadores.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar encuestador..." 
                            className="pl-9 bg-background" 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <Button 
                        onClick={handleOpenAssignModal}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        disabled={selectedIds.length === 0}
                    >
                        <Link2 className="w-4 h-4 mr-2" />
                        Asignar ({selectedIds.length})
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando encuestadores...</div>
            ) : (
                <AssignmentsTable 
                    surveyors={response?.data || []}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onSelectAll={handleSelectAll}
                    onUnassign={handleUnassign}
                />
            )}

            {/* Pagination Controls */}
            {response?.meta && response.meta.lastPage > 1 && (
                <div className="flex justify-between items-center bg-card p-4 rounded-md border shadow-sm">
                    <div className="text-sm text-muted-foreground">
                        Mostrando página {response.meta.page} de {response.meta.lastPage}
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setPage(p => Math.max(1, p - 1)); setSelectedIds([]); }}
                            disabled={page === 1}
                        >
                            Anterior
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setPage(p => Math.min(response.meta.lastPage, p + 1)); setSelectedIds([]); }}
                            disabled={page === response.meta.lastPage}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

            <AssignModal 
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                selectedUserIds={selectedIds}
                onSuccess={handleAssignSuccess}
            />
        </div>
    );
}
