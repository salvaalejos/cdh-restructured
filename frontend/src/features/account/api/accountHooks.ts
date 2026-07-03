import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = () => ({
    'Authorization': `Bearer ${useAuthStore.getState().token}`
});

export const useAccount = () => {
    return useQuery({
        queryKey: ['account'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/api/users/me`, {
                headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error('Error al obtener los detalles de la cuenta');
            return res.json();
        }
    });
};

export const useUpdateAccount = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await fetch(`${API_URL}/api/users/me`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: formData
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Error al actualizar el perfil');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['account'] });
        }
    });
};
