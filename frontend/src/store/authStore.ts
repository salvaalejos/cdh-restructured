import { create } from 'zustand'

export interface User {
    id: number;
    username: string;
    name: string;
    roleId: number;
    profilePic?: string | null;
}

interface AuthState {
    token: string | null;
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('cdh-token'),
    user: JSON.parse(localStorage.getItem('cdh-user') || 'null'),
    login: (token, user) => {
        localStorage.setItem('cdh-token', token)
        localStorage.setItem('cdh-user', JSON.stringify(user))
        set({ token, user })
    },
    logout: () => {
        localStorage.removeItem('cdh-token')
        localStorage.removeItem('cdh-user')
        set({ token: null, user: null })
    }
}))
