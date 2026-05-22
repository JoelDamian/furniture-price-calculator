// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  login: (userId: string, email: string) => void;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userId: null,
  userEmail: null,

  // Llamado al iniciar sesión
  login: (userId: string, email: string) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userEmail', email);
    set({ isAuthenticated: true, userId, userEmail: email });
  },

  // Cierra sesión y limpia sessionStorage
  logout: () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    set({ isAuthenticated: false, userId: null, userEmail: null });
  },

  // Restaura el estado al cargar la app
  restoreSession: () => {
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    const userId = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');
    set({
      isAuthenticated: isAuth,
      userId: isAuth ? userId : null,
      userEmail: isAuth ? userEmail : null,
    });
  },
}));
