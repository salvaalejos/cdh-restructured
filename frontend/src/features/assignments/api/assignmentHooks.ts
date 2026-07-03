import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { SurveyorWithAssignment } from '../types';
import type { PaginatedResponse } from '../../users/types';

const API_URL = import.meta.env.VITE_API_URL + '/api/assignments';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
}

export const useSurveyorsWithAssignments = (page: number = 1, search: string = '') => {
    return useQuery<PaginatedResponse<SurveyorWithAssignment>>({
        queryKey: ['surveyors', page, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });
            if (search) params.append('search', search);

            const res = await axios.get(`${API_URL}/surveyors?${params.toString()}`, { headers: getHeaders() });
            return res.data;
        }
    });
};

export const useBulkAssign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { surveyId: number, userIds: number[], womenCount: number, menCount: number }) => {
            const res = await axios.post(`${API_URL}/bulk`, data, { headers: getHeaders() });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyors'] });
        }
    });
};

export const useUnassign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const res = await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveyors'] });
        }
    });
};
