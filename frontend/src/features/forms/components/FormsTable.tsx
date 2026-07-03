import { Edit2, Eye, Trash2, PieChart, LayoutList } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Survey } from '../types';
import { useDeleteSurvey } from '../api/formHooks';
import { toast } from 'sonner';

interface FormsTableProps {
    surveys: Survey[];
    meta?: { page: number, lastPage: number, total: number };
    onPageChange?: (page: number) => void;
    onViewDetails: (survey: Survey) => void;
    onPreview?: (survey: Survey) => void;
}

export function FormsTable({ surveys, meta, onPageChange, onViewDetails, onPreview }: FormsTableProps) {
    const { mutate: deleteSurvey } = useDeleteSurvey();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const handleDelete = (id: number) => {
        deleteSurvey(id, {
            onSuccess: () => toast.success('Encuesta eliminada correctamente'),
            onError: () => toast.error('Error al eliminar la encuesta')
        });
    };

    const currentPage = meta?.page || 1;
    const itemsPerPage = 10; // As defined in useSurveys

    return (
        <div className="space-y-4">
            <div className="rounded-md border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border">
                            <TableHead className="text-muted-foreground font-semibold w-16">#</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Título</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Preguntas</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Respuestas</TableHead>
                            <TableHead className="text-muted-foreground font-semibold">Creación</TableHead>
                            <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {surveys.map((survey, index) => (
                            <TableRow key={survey.id} className="border-border">
                                <TableCell className="text-muted-foreground font-medium">
                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                </TableCell>
                                <TableCell className="font-medium text-foreground">
                                    <div className="flex items-center gap-2">
                                        <LayoutList className="h-5 w-5 text-muted-foreground" />
                                        {survey.title}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-muted text-foreground">
                                        {survey._count?.questions || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20">
                                        {survey._count?.respondents || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(survey.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {onPreview && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-muted-foreground hover:bg-muted hover:text-foreground"
                                            onClick={() => onPreview(survey)}
                                            title="Previsualizar y Exportar"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                                        onClick={() => window.location.href = `/admin/results?surveyId=${survey.id}`}
                                        title="Ver Resultados y Mapa"
                                    >
                                        <PieChart className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-primary hover:bg-primary/10 hover:text-primary"
                                        onClick={() => onViewDetails(survey)}
                                        title="Editar o Duplicar"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Eliminar encuesta?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la encuesta "{survey.title}" y todas sus respuestas asociadas.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={() => handleDelete(survey.id)}
                                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                >
                                                    Sí, eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                        {surveys.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No se encontraron encuestas.
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
