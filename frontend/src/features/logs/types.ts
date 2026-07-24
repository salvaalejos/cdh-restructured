export interface AppLog {
  id: number;
  userId?: number | null;
  level: 'ERROR' | 'WARN' | 'INFO';
  tag: 'UPLOAD' | 'DATABASE' | 'NETWORK' | 'SYSTEM' | 'AUTH';
  message: string;
  details?: any;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    username: string;
  } | null;
}

export interface LogsResponse {
  logs: AppLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    totalErrors: number;
    uploadErrors: number;
    totalLogs: number;
  };
}

export interface LogsFilters {
  page: number;
  limit?: number;
  level?: string;
  tag?: string;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}
