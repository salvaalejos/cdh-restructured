import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { PaginatedResponse } from '../../users/types';
import type { Survey } from '../types';

const API_URL = import.meta.env.VITE_API_URL + '/api/forms';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
}

export const useSurveys = (page: number = 1, search: string = '', date: string = '') => {
    return useQuery<PaginatedResponse<Survey>>({
        queryKey: ['surveys', page, search, date],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (date) params.append('date', date);

            const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getHeaders() });
            return res.data;
        }
    });
};

export const useSurveyDetails = (id?: number) => {
    return useQuery<Survey>({
        queryKey: ['surveys', id],
        queryFn: async () => {
            if (!id) return null as any;
            const res = await axios.get(`${API_URL}/${id}`, { headers: getHeaders() });
            return res.data;
        },
        enabled: !!id
    });
};

export const useCreateSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await axios.post(API_URL, data, { headers: getHeaders() });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
        }
    });
};

export const useUpdateSurvey = (id?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await axios.put(`${API_URL}/${id}`, data, { headers: getHeaders() });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
            queryClient.invalidateQueries({ queryKey: ['surveys', id] });
        }
    });
};

export const useDeleteSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
        }
    });
};
