import { Link } from 'react-router-dom';
import { useDashboardStats } from '../api/dashboardHooks';
import { 
    FileText, 
    Users, 
    BarChart3, 
    PlusCircle,
    ClipboardList,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
    const { data: stats, isLoading, error } = useDashboardStats();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Cargando métricas...</div>;
    }

    if (error) {
        return (
            <div className="p-8 text-center text-destructive flex flex-col items-center">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p>Error al cargar el dashboard: {error.message}</p>
            </div>
        );
    }

    const { overview, recentSurveys } = stats || { 
        overview: { totalSurveys: 0, totalSurveyors: 0, totalRespondents: 0 }, 
        recentSurveys: [] 
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard General</h1>
                <p className="text-muted-foreground mt-1">Un vistazo rápido al estado de tus encuestas y operaciones.</p>
            </div>

            {/* Accesos Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/admin/forms/create" className="group">
                    <div className="bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors p-6 rounded-xl flex items-center justify-between shadow-sm cursor-pointer h-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary rounded-lg text-primary-foreground">
                                <PlusCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Nueva Encuesta</h3>
                                <p className="text-sm text-muted-foreground">Crear un formulario desde cero</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-200" />
                    </div>
                </Link>
                
                <Link to="/admin/results" className="group">
                    <div className="bg-card hover:bg-accent border border-border transition-colors p-6 rounded-xl flex items-center justify-between shadow-sm cursor-pointer h-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent text-accent-foreground rounded-lg">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Ver Resultados</h3>
                                <p className="text-sm text-muted-foreground">Analizar datos y respuestas</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-200" />
                    </div>
                </Link>

                <Link to="/admin/users" className="group">
                    <div className="bg-card hover:bg-accent border border-border transition-colors p-6 rounded-xl flex items-center justify-between shadow-sm cursor-pointer h-full">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-accent text-accent-foreground rounded-lg">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Gestionar Usuarios</h3>
                                <p className="text-sm text-muted-foreground">Administrar encuestadores</p>
                            </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 transform duration-200" />
                    </div>
                </Link>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-full">
                        <FileText className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Encuestas Totales</p>
                        <h2 className="text-3xl font-bold text-foreground">{overview.totalSurveys}</h2>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-full">
                        <Users className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Encuestadores</p>
                        <h2 className="text-3xl font-bold text-foreground">{overview.totalSurveyors}</h2>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-full">
                        <ClipboardList className="h-8 w-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Entrevistas Realizadas</p>
                        <h2 className="text-3xl font-bold text-foreground">{overview.totalRespondents}</h2>
                    </div>
                </div>
            </div>

            {/* Encuestas Recientes (Progreso) */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Progreso de Encuestas Recientes</h2>
                        <p className="text-sm text-muted-foreground">Avance real frente a las metas de asignación.</p>
                    </div>
                    <Link to="/admin/forms">
                        <Button variant="outline" size="sm">Ver Todas</Button>
                    </Link>
                </div>
                <div className="p-6 space-y-6">
                    {recentSurveys.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No hay encuestas recientes.</p>
                    ) : (
                        recentSurveys.map((survey) => {
                            // Calculate percentage safely
                            const percentage = survey.target > 0 
                                ? Math.min(Math.round((survey.completed / survey.target) * 100), 100) 
                                : (survey.completed > 0 ? 100 : 0);
                            
                            return (
                                <div key={survey.id} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-foreground truncate max-w-[60%]">{survey.title}</span>
                                        <span className="text-muted-foreground">
                                            {survey.completed} / {survey.target} ({percentage}%)
                                        </span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
