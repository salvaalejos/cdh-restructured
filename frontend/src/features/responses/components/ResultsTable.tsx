import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Respondent } from '../types';

interface ResultsTableProps {
    respondents: Respondent[];
    page: number;
    limit: number;
}

export function ResultsTable({ respondents, page, limit }: ResultsTableProps) {
    const navigate = useNavigate();

    return (
        <div className="border border-border rounded-md overflow-hidden bg-card">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-16 text-center">#</TableHead>
                        <TableHead>Encuestador</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead>Género</TableHead>
                        <TableHead>Escolaridad</TableHead>
                        <TableHead className="text-center">Ubicación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {respondents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No se encontraron respuestas para esta encuesta.
                            </TableCell>
                        </TableRow>
                    ) : (
                        respondents.map((respondent, index) => {
                            // Dynamic ID: (page - 1) * limit + index + 1
                            const dynamicId = (page - 1) * limit + index + 1;
                            
                            return (
                                <TableRow key={respondent.id} className="hover:bg-muted/20">
                                    <TableCell className="text-center font-medium text-muted-foreground">
                                        {dynamicId}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{respondent.surveyor?.name || 'Desconocido'}</div>
                                        {respondent.surveyor?.username && (
                                            <div className="text-xs text-muted-foreground">@{respondent.surveyor.username}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {respondent.age ? `${respondent.age} años` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {respondent.gender ? (
                                            <Badge variant="outline" className="font-normal capitalize">
                                                {respondent.gender}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {respondent.schooling || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {respondent.latitude && respondent.longitude ? (
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                Registrada
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-primary hover:bg-primary/10"
                                            onClick={() => navigate(`/admin/results/${respondent.id}`)}
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            Ver Detalles
                                        </Button>
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
