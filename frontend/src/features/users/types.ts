export interface User {
    id: number;
    username: string;
    name: string;
    roleId: number;
    frontId: string | null;
    backId: string | null;
    birthDate: string | null;
    permissions?: Record<string, boolean> | null;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}
