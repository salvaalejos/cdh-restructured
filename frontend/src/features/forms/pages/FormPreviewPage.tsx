import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyDetails } from '../api/formHooks';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function FormPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const surveyId = parseInt(id as string);
    const { data: survey, isLoading, error } = useSurveyDetails(surveyId);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando previsualización...</div>;
    if (error || !survey) return <div className="p-8 text-destructive">Error al cargar la encuesta.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header (Hidden on print) */}
            <div className="flex items-center justify-between print:hidden mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/forms')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Previsualización</h1>
                        <p className="text-muted-foreground text-sm">Así verán los encuestadores el formulario.</p>
                    </div>
                </div>
                <Button onClick={handlePrint} className="bg-primary text-primary-foreground">
                    <Printer className="w-4 h-4 mr-2" />
                    Generar PDF
                </Button>
            </div>

            {/* Print Container */}
            <div className="bg-card border border-border p-8 rounded-lg shadow-sm print:shadow-none print:border-none print:p-0">
                <div className="text-center space-y-2 mb-10 border-b border-border pb-6 print:border-black">
                    <h1 className="text-3xl font-bold text-foreground print:text-black">{survey.title}</h1>
                    {survey.description && <p className="text-muted-foreground print:text-gray-700">{survey.description}</p>}
                    {survey.location && <p className="text-sm text-muted-foreground print:text-gray-600">Ubicación: {survey.location}</p>}
                </div>

                <div className="space-y-12">
                    {survey.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="space-y-4 print:break-inside-avoid">
                            <Label className="text-lg font-semibold text-foreground print:text-black">
                                {i + 1}. {q.text}
                            </Label>

                            {/* Text Input */}
                            {q.typeId === 1 && (
                                <div className="w-full h-12 border-b border-dashed border-border mt-4"></div>
                            )}

                            {/* Single / Multiple Choice */}
                            {(q.typeId === 2 || q.typeId === 3) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    {q.options?.map((opt: any) => (
                                        <div key={opt.id} className="flex items-start gap-3 p-3 border border-border rounded-md print:border-gray-300">
                                            <div className={`w-5 h-5 border border-muted-foreground mt-0.5 shrink-0 flex items-center justify-center ${q.typeId === 2 ? 'rounded-full' : 'rounded-sm'}`}>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <span className="text-foreground print:text-black">{opt.text}</span>
                                                {opt.image && (
                                                    <img src={opt.image} alt={opt.text} className="w-full max-w-[200px] h-32 object-cover rounded-md border border-border mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Matrix */}
                            {(q.typeId === 4 || q.typeId === 5) && (
                                <div className="overflow-x-auto mt-4 border border-border rounded-md print:border-gray-300">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground print:bg-gray-100 print:text-black">
                                            <tr>
                                                <th className="p-3 border-b border-border font-medium"></th>
                                                {q.options?.map((opt: any) => (
                                                    <th key={opt.id} className="p-3 border-b border-l border-border text-center font-medium print:border-gray-300 align-bottom">
                                                        <div className="flex flex-col items-center justify-end gap-2">
                                                            {opt.image && (
                                                                <img src={opt.image} alt={opt.text} className="w-16 h-16 object-cover rounded-sm border border-border" />
                                                            )}
                                                            <span>{opt.text}</span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.subOptions?.map((sub: any) => (
                                                <tr key={sub.id} className="border-b border-border last:border-0 print:border-gray-300">
                                                    <td className="p-3 font-medium text-foreground print:text-black">{sub.text}</td>
                                                    {q.options?.map((opt: any) => (
                                                        <td key={`${sub.id}-${opt.id}`} className="p-3 border-l border-border text-center print:border-gray-300">
                                                            <div className="mx-auto w-4 h-4 rounded-full border border-muted-foreground"></div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
