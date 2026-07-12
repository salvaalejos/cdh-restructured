import { useParams, useNavigate } from 'react-router-dom';
import { useResponseDetails } from '../api/responseHooks';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, User, GraduationCap, Calendar, Download, Music, Image as ImageIcon, Map as MapIcon, ClipboardCheck, CheckCircle2, Circle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AudioPlayerWavesurfer } from '../components/AudioPlayerWavesurfer';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ResponseDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: respondent, isLoading, error } = useResponseDetails(parseInt(id || '0'));

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando detalles de la respuesta...</div>;
    if (error || !respondent) return <div className="p-8 text-center text-destructive">Error al cargar la respuesta o no fue encontrada.</div>;

    const hasLocation = respondent.latitude !== null && respondent.longitude !== null;
    const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');
    const mediaUrl = (path: string | null) => path ? `${API_BASE}/${path}` : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Detalles del Encuestado #{respondent.id}</h1>
                    <p className="text-muted-foreground text-sm">Recopilado por <span className="font-semibold">{respondent.surveyor?.name}</span></p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column: Context & Evidence */}
                <div className="w-full md:w-1/3 space-y-6">
                    {/* Demographics Card */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2 font-semibold text-foreground">
                            <User className="h-4 w-4 text-primary" /> Perfil Demográfico
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Edad</span>
                                <span className="font-medium">{respondent.age ? `${respondent.age} años` : 'N/D'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm flex items-center gap-2"><User className="h-4 w-4" /> Género</span>
                                <span className="font-medium capitalize">{respondent.gender || 'N/D'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Escolaridad</span>
                                <span className="font-medium">{respondent.schooling || 'N/D'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Card */}
                    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                                <MapIcon className="h-4 w-4 text-primary" /> Ubicación
                            </div>
                            {hasLocation ? (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-normal">
                                    Registrada
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs font-normal">
                                    Sin Registro
                                </Badge>
                            )}
                        </div>
                        <div className="h-48 w-full bg-muted relative">
                            {hasLocation ? (
                                <MapContainer 
                                    center={[respondent.latitude!, respondent.longitude!]} 
                                    zoom={13} 
                                    scrollWheelZoom={false} 
                                    className="w-full h-full z-0"
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[respondent.latitude!, respondent.longitude!]} />
                                </MapContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground flex-col">
                                    <MapPin className="h-8 w-8 mb-2 opacity-20" />
                                    <span className="text-sm">Ubicación no disponible</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evidence Card */}
                        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2 font-semibold text-foreground">
                                <ImageIcon className="h-4 w-4 text-primary" /> Evidencia Multimedia
                            </div>
                            <div className="p-4 space-y-4">
                                {respondent.imagePath ? (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Fotografía</div>
                                        <div className="relative group rounded-md overflow-hidden border border-border aspect-video bg-black/5 flex items-center justify-center">
                                            <img src={mediaUrl(respondent.imagePath)} alt="Evidencia" className="object-contain w-full h-full" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <a 
                                                    href={mediaUrl(respondent.imagePath)} 
                                                    download={`evidencia_${respondent.id}.jpg`}
                                                    className="bg-primary text-primary-foreground p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                                                    title="Descargar Imagen"
                                                    aria-label="Descargar imagen de evidencia"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-md border border-border/50">
                                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                            <ImageIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Sin fotografía disponible</span>
                                    </div>
                                )}
                                {respondent.audioPath ? (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Music className="h-4 w-4"/> Grabación de Audio</div>
                                        <AudioPlayerWavesurfer src={mediaUrl(respondent.audioPath)!} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-md border border-border/50">
                                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                            <Music className="h-5 w-5 text-muted-foreground opacity-50" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">Sin grabación de audio disponible</span>
                                    </div>
                                )}
                            </div>
                        </div>
                </div>

                {/* Right Column: Survey Context & Questionnaire */}
                <div className="w-full md:w-2/3 space-y-6">
                    {/* Survey Header */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-2">
                        <div className="flex items-center gap-2 text-primary font-medium text-sm mb-1">
                            <ClipboardCheck className="h-4 w-4" /> Cuestionario
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{respondent.survey?.title}</h2>
                        <p className="text-muted-foreground">{respondent.survey?.description}</p>
                        {respondent.survey?.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                <MapPin className="h-3 w-3" /> Contexto: {respondent.survey.location}
                            </div>
                        )}
                    </div>

                    {/* Answers List */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2 mb-4">
                            Cuestionario Completo ({respondent.survey?.questions.length || 0} Preguntas)
                        </h3>
                        
                        {(!respondent.survey?.questions || respondent.survey.questions.length === 0) ? (
                            <div className="text-center py-8 text-muted-foreground bg-card border rounded-lg">
                                La encuesta no tiene preguntas registradas.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {respondent.survey.questions.map((question, index) => {
                                    const relatedAnswers = respondent.answers.filter(a => a.questionId === question.id);
                                    const type = question.typeId;
                                    const isAnswered = relatedAnswers.length > 0;

                                    return (
                                        <div key={question.id} className="bg-card border border-border rounded-lg p-5 shadow-sm space-y-4">
                                            <div className="flex gap-2 items-start">
                                                <span className="font-bold text-primary">{index + 1}.</span>
                                                <div className="font-medium text-foreground text-lg">{question.text}</div>
                                            </div>
                                            
                                            <div className="pl-6 border-l-2 border-primary/20">
                                                {!isAnswered && (
                                                    <div className="text-muted-foreground italic text-sm text-destructive/80 bg-destructive/5 p-2 rounded-md inline-block">
                                                        Sin respuesta registrada
                                                    </div>
                                                )}

                                                {isAnswered && type === 1 && (
                                                    <div className="text-foreground whitespace-pre-wrap italic bg-muted/30 p-3 rounded-md border border-border/50">
                                                        "{relatedAnswers[0].openText || ''}"
                                                    </div>
                                                )}
                                                
                                                {type === 2 && (
                                                    <div className="flex flex-col gap-2">
                                                        {question.options.map(opt => {
                                                            const selected = relatedAnswers.some(a => a.optionId === opt.id);
                                                            return (
                                                                <div key={opt.id} className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/10 border-transparent'}`}>
                                                                    {selected ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground opacity-30" />}
                                                                    <span className={selected ? 'font-medium text-foreground' : 'text-muted-foreground'}>{opt.text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {type === 3 && (
                                                    <div className="flex flex-col gap-2">
                                                        {question.options.map(opt => {
                                                            const selected = relatedAnswers.some(a => a.optionId === opt.id);
                                                            return (
                                                                <div key={opt.id} className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${selected ? 'bg-primary/5 border-primary/30' : 'bg-muted/10 border-transparent'}`}>
                                                                    <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-muted-foreground opacity-30'}`}>
                                                                        {selected && <div className="h-2 w-2 bg-white rounded-sm" />}
                                                                    </div>
                                                                    <span className={selected ? 'font-medium text-foreground' : 'text-muted-foreground'}>{opt.text}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {[4, 5].includes(type) && (
                                                    <div className="overflow-x-auto border rounded-md">
                                                        <table className="w-full text-sm text-left">
                                                            <thead className="bg-muted text-muted-foreground">
                                                                <tr>
                                                                    <th className="px-4 py-3 font-medium border-b border-border">Ítem</th>
                                                                    {question.subOptions.map(sub => (
                                                                        <th key={sub.id} className="px-2 py-3 font-medium text-center border-b border-l border-border">{sub.text}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {question.options.map(opt => (
                                                                    <tr key={opt.id} className="hover:bg-muted/30 transition-colors">
                                                                        <td className="px-4 py-3 font-medium text-foreground">
                                                                            <div className="flex items-center gap-2">
                                                                                {opt.image && (
                                                                                    <img src={opt.image} alt={opt.text} className="w-8 h-8 object-contain rounded-sm border border-border shrink-0" />
                                                                                )}
                                                                                <span>{opt.text}</span>
                                                                            </div>
                                                                        </td>
                                                                        {question.subOptions.map(sub => {
                                                                            const isSelected = relatedAnswers.some(a => a.optionId === opt.id && a.subOptionId === sub.id);
                                                                            return (
                                                                                <td key={sub.id} className="px-2 py-3 text-center border-l border-border">
                                                                                    {isSelected ? (
                                                                                        type === 4 ? (
                                                                                            <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                                                                                        ) : (
                                                                                            <div className="h-4 w-4 bg-primary rounded-sm mx-auto flex items-center justify-center">
                                                                                                <div className="h-2 w-2 bg-white rounded-sm" />
                                                                                            </div>
                                                                                        )
                                                                                    ) : (
                                                                                        <div className={`h-4 w-4 border border-muted-foreground/30 mx-auto ${type === 4 ? 'rounded-full' : 'rounded-sm'}`} />
                                                                                    )}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
