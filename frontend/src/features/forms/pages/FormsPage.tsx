import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurveys } from '../api/formHooks';
import { FormsTable } from '../components/FormsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar as CalendarIcon } from 'lucide-react';
import type { Survey } from '../types';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FormsPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState<Date>();
    
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [surveyToDuplicate, setSurveyToDuplicate] = useState<Survey | null>(null);

    const dateQuery = date ? format(date, 'yyyy-MM-dd') : '';
    const { data: response, isLoading, error } = useSurveys(page, searchQuery, dateQuery);

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

    const handleDateChange = (newDate: Date | undefined) => {
        setDate(newDate);
        setPage(1);
    };

    const handleCreateNew = () => {
        navigate('/admin/forms/create');
    };

    const handleViewDetails = (survey: Survey) => {
        if ((survey._count as any)?.assignments && (survey._count as any).assignments > 0) {
            setSurveyToDuplicate(survey);
            setDuplicateDialogOpen(true);
        } else {
            navigate(`/admin/forms/edit/${survey.id}`);
        }
    };
    
    const handleDuplicate = () => {
        navigate('/admin/forms/create', { state: { duplicateData: surveyToDuplicate } });
        setDuplicateDialogOpen(false);
    };

    const handlePreview = (survey: Survey) => {
        navigate(`/admin/forms/${survey.id}/preview`);
    };

    if (error) return <div className="text-destructive font-medium p-4 bg-destructive/10 rounded-md">Error al cargar las encuestas. Verifica tu conexión.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Encuestas</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Crea formularios complejos para ser recolectados en campo por los encuestadores.
                    </p>
                </div>
                <Button onClick={handleCreateNew} className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Encuesta
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-md border border-border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar encuesta por título..." 
                        className="pl-9"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                    />
                </div>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal border-border",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>Filtrar por fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateChange}

                        />
                    </PopoverContent>
                </Popover>
                
                {date && (
                    <Button variant="ghost" onClick={() => handleDateChange(undefined)} className="text-muted-foreground">
                        Limpiar Fecha
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">
                    <p className="animate-pulse">Cargando encuestas...</p>
                </div>
            ) : (
                <FormsTable 
                    surveys={response?.data || []} 
                    meta={response?.meta}
                    onPageChange={setPage}
                    onViewDetails={handleViewDetails}
                    onPreview={handlePreview}
                />
            )}

            <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Encuesta en uso</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta encuesta ya tiene asignaciones y no puede ser modificada para mantener la integridad de los datos. 
                            ¿Deseas hacer una copia de esta encuesta para editarla?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDuplicate} className="bg-primary hover:bg-primary/90">
                            Hacer una copia
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
