import { useParams, useNavigate } from 'react-router-dom';
import { useSurveyDetails } from '../api/formHooks';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LogoHorizontal from '@/logos/HORIZONTAL.png';

export default function FormPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const surveyId = parseInt(id as string);
    const { data: survey, isLoading, error } = useSurveyDetails(surveyId);
    const printRef = useRef<HTMLDivElement>(null);

    const handleGeneratePDF = useCallback(async () => {
        if (!printRef.current || !survey) return;

        const element = printRef.current;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = 210;
        const pdfHeight = 297;
        const margin = 10;

        const imgWidth = pdfWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = pdfHeight - 2 * margin;

        let yOffset = 0;
        let pageNum = 1;

        while (yOffset < imgHeight) {
            if (pageNum > 1) pdf.addPage();

            pdf.addImage(imgData, 'JPEG', margin, margin - yOffset, imgWidth, imgHeight);

            yOffset += pageHeight;
            pageNum++;
        }

        pdf.save(`${survey.title.replace(/[^a-zA-Z0-9áéíóúñü ]/g, '').trim() || 'encuesta'}.pdf`);
    }, [survey]);

    if (isLoading) return <div className="p-8 text-center animate-pulse">Cargando previsualización...</div>;
    if (error || !survey) return <div className="p-8 text-destructive">Error al cargar la encuesta.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/admin/forms')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Previsualización</h1>
                        <p className="text-muted-foreground text-sm">Así verán los encuestadores el formulario.</p>
                    </div>
                </div>
                <Button onClick={handleGeneratePDF} className="bg-primary text-primary-foreground">
                    <FileDown className="w-4 h-4 mr-2" />
                    Generar PDF
                </Button>
            </div>

            <div ref={printRef} className="bg-card border border-border p-8 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                    <img src={LogoHorizontal} alt="CDH" className="h-10 object-contain" />
                    <div className="flex-1 text-right text-xs text-muted-foreground">
                        {new Date().toLocaleDateString('es-MX', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </div>
                </div>

                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-3xl font-bold text-foreground">{survey.title}</h1>
                    {survey.description && <p className="text-muted-foreground">{survey.description}</p>}
                    {survey.location && <p className="text-sm text-muted-foreground">Ubicación: {survey.location}</p>}
                </div>

                <div className="space-y-12">
                    {survey.questions?.map((q: any, i: number) => (
                        <div key={q.id} className="space-y-4">
                            <Label className="text-lg font-semibold text-foreground">
                                {i + 1}. {q.text}
                            </Label>

                            {q.typeId === 1 && (
                                <div className="w-full h-12 border-b border-dashed border-border mt-4"></div>
                            )}

                            {(q.typeId === 2 || q.typeId === 3) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    {q.options?.map((opt: any) => (
                                        <div key={opt.id} className="flex items-start gap-3 p-3 border border-border rounded-md">
                                            <div className={`w-5 h-5 border border-muted-foreground mt-0.5 shrink-0 flex items-center justify-center ${q.typeId === 2 ? 'rounded-full' : 'rounded-sm'}`}>
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <span className="text-foreground">{opt.text}</span>
                                                {opt.image && (
                                                    <img src={opt.image} alt={opt.text} className="w-full max-w-[200px] max-h-40 object-contain rounded-md border border-border mt-2" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(q.typeId === 4 || q.typeId === 5) && (
                                <div className="overflow-x-auto mt-4 border border-border rounded-md">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50 text-muted-foreground">
                                            <tr>
                                                <th className="p-3 border-b border-border font-medium">Ítem</th>
                                                {q.subOptions?.map((sub: any) => (
                                                    <th key={sub.id} className="p-3 border-b border-l border-border text-center font-medium">
                                                        <span>{sub.text}</span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.options?.map((opt: any) => (
                                                <tr key={opt.id} className="border-b border-border last:border-0">
                                                    <td className="p-3 font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            {opt.image && (
                                                                <img src={opt.image} alt={opt.text} className="w-10 h-10 object-contain rounded-sm border border-border shrink-0" />
                                                            )}
                                                            <span>{opt.text}</span>
                                                        </div>
                                                    </td>
                                                    {q.subOptions?.map((sub: any) => (
                                                        <td key={`${opt.id}-${sub.id}`} className="p-3 border-l border-border text-center">
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
