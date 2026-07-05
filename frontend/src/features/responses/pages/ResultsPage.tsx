import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'sonner';
import { useResponses } from '../api/responseHooks';
import { useSurveys } from '../../forms/api/formHooks';
import { ResultsTable } from '../components/ResultsTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Map, Users, Filter, Download } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Fix Leaflet's default icon path issues with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ResultsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlSurveyId = searchParams.get('surveyId');

    const [surveyId, setSurveyId] = useState<number | null>(urlSurveyId ? parseInt(urlSurveyId) : null);
    const [page, setPage] = useState(1);
    
    // Filters
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [schooling, setSchooling] = useState('');

    const { data: surveysData } = useSurveys(1, '', ''); 
    const { data: responseData, isLoading } = useResponses({
        surveyId,
        page,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        schooling: schooling || undefined
    });

    // Sync URL when survey changes
    const handleSurveyChange = (id: number) => {
        setSurveyId(id);
        setPage(1);
        setSearchParams({ surveyId: String(id) });
    };

    const apiUrl = import.meta.env.VITE_API_URL || ''

    const downloadExcel = async () => {
        try {
            const token = useAuthStore.getState().token
            const res = await fetch(`${apiUrl}/api/responses/export/${surveyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Error al descargar el Excel' }))
                throw new Error(err.error || 'Error al descargar el Excel')
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const disposition = res.headers.get('Content-Disposition')
            const filename = disposition?.match(/filename="?(.+?)"?$/)?.[1] || `resultados_${surveyId}.xlsx`
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success('Excel descargado correctamente')
        } catch (error: any) {
            toast.error(error.message || 'Error al descargar el Excel')
        }
    }

    // Calculate Map Center dynamically based on mapData
    const mapCenter = responseData?.mapData && responseData.mapData.length > 0
        ? [responseData.mapData[0].latitude, responseData.mapData[0].longitude] as [number, number]
        : [23.6345, -102.5528] as [number, number]; // Default to center of Mexico

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Map className="w-6 h-6 text-primary" />
                        Resultados y Mapa
                    </h1>
                    <p className="text-muted-foreground text-sm">Visualiza los datos recolectados y su ubicación.</p>
                </div>

                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                    <select 
                        className="flex h-10 w-full sm:w-72 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={surveyId || ''}
                        onChange={(e) => handleSurveyChange(parseInt(e.target.value))}
                    >
                        <option value="" disabled>Selecciona una encuesta...</option>
                        {surveysData?.data?.map(survey => (
                            <option key={survey.id} value={survey.id}>{survey.title}</option>
                        ))}
                    </select>

                    {surveyId && (
                        <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            onClick={() => downloadExcel()}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Excel
                        </Button>
                    )}
                </div>
            </div>

            {/* Map Section */}
            {surveyId && (
                <div className="w-full h-[400px] border border-border rounded-lg overflow-hidden bg-muted relative z-0">
                    <MapContainer center={mapCenter} zoom={5} scrollWheelZoom={false} className="w-full h-full">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {responseData?.mapData?.map((pin) => (
                            <Marker key={pin.id} position={[pin.latitude, pin.longitude]}>
                                <Popup>
                                    <div className="font-semibold">ID: {pin.id}</div>
                                    <div className="text-sm">Encuestador: {pin.surveyor?.name || 'Desconocido'}</div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            )}

            {/* Filters & Table */}
            {surveyId && (
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-lg p-4 flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <Label className="mb-2 block">Edad exacta</Label>
                            <Input type="number" placeholder="Ej. 25" value={age} onChange={e => {setAge(e.target.value); setPage(1)}} />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <Label className="mb-2 block">Género</Label>
                            <select 
                                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={gender}
                                onChange={e => {setGender(e.target.value); setPage(1)}}
                            >
                                <option value="">Todos</option>
                                <option value="Hombre">Hombre</option>
                                <option value="Mujer">Mujer</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <Label className="mb-2 block">Escolaridad</Label>
                            <Input type="text" placeholder="Ej. Licenciatura" value={schooling} onChange={e => {setSchooling(e.target.value); setPage(1)}} />
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => { setAge(''); setGender(''); setSchooling(''); setPage(1); }}
                        >
                            Limpiar Filtros
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-10 text-muted-foreground animate-pulse">Cargando resultados...</div>
                    ) : (
                        <>
                            <ResultsTable 
                                respondents={responseData?.data || []} 
                                page={page} 
                                limit={20} 
                            />
                            
                            {/* Pagination Controls */}
                            {responseData?.meta && responseData.meta.lastPage > 1 && (
                                <div className="flex justify-between items-center bg-card p-4 rounded-md border shadow-sm mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando página {responseData.meta.page} de {responseData.meta.lastPage}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            Anterior
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.min(responseData.meta.lastPage, p + 1))}
                                            disabled={page === responseData.meta.lastPage}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
