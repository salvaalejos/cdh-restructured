import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useSurveys } from '../../forms/api/formHooks';
import { useBulkAssign } from '../api/assignmentHooks';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface AssignModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedUserIds: number[];
    onSuccess: () => void;
}

export function AssignModal({ open, onOpenChange, selectedUserIds, onSuccess }: AssignModalProps) {
    const { data: surveysData } = useSurveys(1, '', ''); // We assume first page has most active surveys, or we could fetch all.
    const { mutate: bulkAssign, isPending } = useBulkAssign();

    const [surveyId, setSurveyId] = useState<string>('');
    const [menCount, setMenCount] = useState<string>('');
    const [womenCount, setWomenCount] = useState<string>('');

    const handleOpenChange = (newOpen: boolean) => {
        if (newOpen) {
            setSurveyId('');
            setMenCount('');
            setWomenCount('');
        }
        onOpenChange(newOpen);
    };

    const handleSubmit = () => {
        if (!surveyId) return toast.error('Selecciona una encuesta');
        if (!menCount || parseInt(menCount) < 0) return toast.error('Ingresa una meta válida para hombres');
        if (!womenCount || parseInt(womenCount) < 0) return toast.error('Ingresa una meta válida para mujeres');

        bulkAssign({
            surveyId: parseInt(surveyId),
            userIds: selectedUserIds,
            menCount: parseInt(menCount),
            womenCount: parseInt(womenCount)
        }, {
            onSuccess: () => {
                toast.success(`Asignación aplicada a ${selectedUserIds.length} encuestador(es)`);
                onSuccess();
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.error || 'Error al asignar encuestas');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Encuesta Masivamente</DialogTitle>
                    <DialogDescription>
                        Estás a punto de asignar una encuesta a <strong>{selectedUserIds.length} encuestador(es)</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-amber-500/15 border border-amber-500/50 text-amber-600 p-3 rounded-md flex items-start gap-3 mt-2 text-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                        Si alguno de estos encuestadores ya tiene una asignación activa, <strong>será reemplazada</strong> y podrían perder su progreso local no sincronizado.
                    </p>
                </div>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="survey-assign-select">Encuesta a Asignar</Label>
                        <select 
                            id="survey-assign-select"
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={surveyId}
                            onChange={(e) => setSurveyId(e.target.value)}
                            aria-label="Seleccionar encuesta"
                        >
                            <option value="" disabled>Selecciona una encuesta...</option>
                            {surveysData?.data?.map(survey => (
                                <option key={survey.id} value={survey.id}>{survey.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Meta Hombres</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                placeholder="Ej. 50" 
                                value={menCount} 
                                onChange={(e) => setMenCount(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Meta Mujeres</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                placeholder="Ej. 50" 
                                value={womenCount} 
                                onChange={(e) => setWomenCount(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        {isPending ? 'Asignando...' : 'Guardar Asignación'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
