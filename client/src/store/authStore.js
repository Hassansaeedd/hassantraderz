// client/src/store/authStore.js — Auto-logout on software exit using sessionStorage
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,

      // Computed
      isAuthenticated: () => !!get().user && !!get().accessToken,
      isAdmin:         () => get().user?.role === 'ADMIN',
      isManager:       () => ['ADMIN', 'MANAGER'].includes(get().user?.role),

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      logout: () => {
        set({ user: null, accessToken: null });
        sessionStorage.removeItem('auth-store');
        localStorage.removeItem('auth-store');
      },
    }),
    {
      name: 'auth-store',
      // Using sessionStorage so that closing the browser/software automatically logs out!
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
