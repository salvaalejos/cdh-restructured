import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { LogsFilters, LogsResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL + '/api/logs';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

export const useLogs = (filters: LogsFilters) => {
  return useQuery<LogsResponse>({
    queryKey: ['logs', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(filters.page || 1));
      params.append('limit', String(filters.limit || 20));

      if (filters.level) params.append('level', filters.level);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.userId) params.append('userId', String(filters.userId));
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const res = await axios.get(`${API_URL}?${params.toString()}`, {
        headers: getHeaders(),
      });
      return res.data;
    },
    refetchInterval: 10000, // Reconsultar cada 10s automáticamente para monitoreo en vivo
  });
};
