import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { User, PaginatedResponse } from '../types';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL + '/api/users';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return { Authorization: `Bearer ${token}` };
}

export const useUsers = (page: number = 1, search: string = '', roleId: string = '') => {
    return useQuery<PaginatedResponse<User>>({
        queryKey: ['users', page, search, roleId],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
            });
            if (search) params.append('search', search);
            if (roleId && roleId !== 'all') params.append('roleId', roleId);

            const res = await axios.get(`${API_URL}?${params.toString()}`, { headers: getHeaders() });
            return res.data;
        }
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await axios.post(API_URL, formData, {
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number, formData: FormData }) => {
            const res = await axios.put(`${API_URL}/${id}`, formData, {
                headers: {
                    ...getHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (id: number) => {
            await axios.delete(`${API_URL}/${id}`, { headers: getHeaders() });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        }
    });
};
