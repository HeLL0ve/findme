import { create } from 'zustand';
import { api } from '../api/axios';

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
  notificationSettings?: {
    notifyWeb: boolean;
    notifyTelegram: boolean;
  } | null;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  initialized: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (u: User | null) => void;
  setInitialized?: (v: boolean) => void;
  logout: () => Promise<void>;
};

const initialAccess = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
const initialUser = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialAccess,
  user: initialUser ? JSON.parse(initialUser) : null,
  initialized: false,
  setAccessToken: (token) => {
    try { if (token) localStorage.setItem('accessToken', token); else localStorage.removeItem('accessToken'); } catch(_){}
    set({ accessToken: token });
  },
  setUser: (u) => { try { if (u) localStorage.setItem('user', JSON.stringify(u)); else localStorage.removeItem('user'); } catch(_){}; set({ user: u }) },
  setInitialized: (v: boolean) => set({ initialized: v }),
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('user'); } catch(_){}
    set({ accessToken: null, user: null });
  },
}));
