import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ResponsesResponse, RespondentDetails } from '../types';

const API_URL = import.meta.env.VITE_API_URL + '/api/responses';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
}

interface ResponsesFilters {
    page: number;
    surveyId: number | null;
    surveyorId?: number;
    age?: number;
    gender?: string;
    schooling?: string;
}

export const useResponses = (filters: ResponsesFilters) => {
    return useQuery<ResponsesResponse>({
        queryKey: ['responses', filters],
        queryFn: async () => {
            if (!filters.surveyId) return { data: [], mapData: [], meta: { page: 1, lastPage: 1, total: 0 } };

            const params = new URLSearchParams({
                surveyId: String(filters.surveyId),
                page: String(filters.page),
                limit: '20',
            });

            if (filters.surveyorId) params.append('surveyorId', String(filters.surveyorId));
            if (filters.age) params.append('age', String(filters.age));
            if (filters.gender) params.append('gender', filters.gender);
            if (filters.schooling) params.append('schooling', filters.schooling);

            const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getHeaders() });
            return res.data;
        },
        enabled: !!filters.surveyId
    });
};

export const useResponseDetails = (id?: number) => {
    return useQuery<RespondentDetails>({
        queryKey: ['response', id],
        queryFn: async () => {
            const res = await axios.get(`${API_URL}/${id}`, { headers: getHeaders() });
            return res.data;
        },
        enabled: !!id
    });
};
