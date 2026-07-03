import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`
});

export interface DashboardStats {
    overview: {
        totalSurveys: number;
        totalSurveyors: number;
        totalRespondents: number;
    };
    recentSurveys: {
        id: number;
        title: string;
        status: number;
        target: number;
        completed: number;
    }[];
}

export const useDashboardStats = () => {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/dashboard/stats`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Error al obtener estadísticas del dashboard');
            }
            return res.json();
        }
    });
};
