import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowUpDown } from 'lucide-react';
import type { SurveyorWithAssignment } from '../types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AssignmentsTableProps {
    surveyors: SurveyorWithAssignment[];
    selectedIds: number[];
    onSelect: (id: number) => void;
    onSelectAll: (checked: boolean) => void;
    onUnassign: (assignmentId: number) => void;
}

type SortField = 'name' | 'survey' | 'men' | 'women' | null;

export function AssignmentsTable({ surveyors, selectedIds, onSelect, onSelectAll, onUnassign }: AssignmentsTableProps) {
    const [sortField, setSortField] = useState<SortField>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedSurveyors = [...surveyors].sort((a, b) => {
        if (!sortField) return 0;
        let valA: any, valB: any;
        if (sortField === 'name') {
            valA = a.name; valB = b.name;
        } else if (sortField === 'survey') {
            valA = a.assignment?.survey?.title || ''; valB = b.assignment?.survey?.title || '';
        } else if (sortField === 'men') {
            valA = a.progress.men; valB = b.progress.men;
        } else if (sortField === 'women') {
            valA = a.progress.women; valB = b.progress.women;
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const allSelected = surveyors.length > 0 && selectedIds.length === surveyors.length;

    return (
        <div className="border border-border rounded-md overflow-hidden bg-card">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-12 text-center">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 accent-primary cursor-pointer"
                                checked={allSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                                aria-label="Seleccionar todos"
                            />
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('name')}>
                            <div className="flex items-center gap-1">Encuestador <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => handleSort('survey')}>
                            <div className="flex items-center gap-1">Encuesta Asignada <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors text-center" onClick={() => handleSort('men')}>
                            <div className="flex items-center justify-center gap-1">Hombres <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/80 transition-colors text-center" onClick={() => handleSort('women')}>
                            <div className="flex items-center justify-center gap-1">Mujeres <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                        </TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedSurveyors.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No se encontraron encuestadores.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedSurveyors.map((surveyor) => {
                            const isMenCompleted = surveyor.assignment && surveyor.progress.men >= surveyor.assignment.menCount;
                            const isWomenCompleted = surveyor.assignment && surveyor.progress.women >= surveyor.assignment.womenCount;

                            return (
                                <TableRow key={surveyor.id} className="hover:bg-muted/20">
                                    <TableCell className="text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 accent-primary cursor-pointer"
                                            checked={selectedIds.includes(surveyor.id)}
                                            onChange={() => onSelect(surveyor.id)}
                                            aria-label={`Seleccionar ${surveyor.name}`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{surveyor.name}</div>
                                        <div className="text-xs text-muted-foreground">@{surveyor.username}</div>
                                    </TableCell>
                                    <TableCell>
                                        {surveyor.assignment ? (
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                                {surveyor.assignment.survey?.title || `ID: ${surveyor.assignment.surveyId}`}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">Sin asignación</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {surveyor.assignment ? (
                                            <span className="text-sm">
                                                <strong className={isMenCompleted ? 'text-emerald-500 font-bold' : 'text-foreground'}>
                                                    {surveyor.progress.men}
                                                </strong> / {surveyor.assignment.menCount}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {surveyor.assignment ? (
                                            <span className="text-sm">
                                                <strong className={isWomenCompleted ? 'text-emerald-500 font-bold' : 'text-foreground'}>
                                                    {surveyor.progress.women}
                                                </strong> / {surveyor.assignment.womenCount}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {surveyor.assignment && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Remover asignación?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esto desvinculará a <strong>{surveyor.name}</strong> de su encuesta actual. Perderá el acceso para seguir respondiéndola. (Las respuestas ya enviadas están a salvo).
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onUnassign(surveyor.assignment!.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                            Remover
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
