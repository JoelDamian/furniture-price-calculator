// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,

  // Llamado al iniciar sesión
  login: (userId: string) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userId', userId);
    set({ isAuthenticated: true, userId });
  },

  // Cierra sesión y limpia sessionStorage
  logout: () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userId');
    set({ isAuthenticated: false, userId: null });
  },

  // Restaura el estado al cargar la app
  restoreSession: () => {
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    const userId = sessionStorage.getItem('userId');
    set({ isAuthenticated: isAuth, userId: isAuth ? userId : null });
  },
}));
