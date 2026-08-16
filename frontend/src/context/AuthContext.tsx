import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';
import { login as apiLogin } from '../api/client';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('keystone-auth');
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser());

  async function login(email: string, password: string) {
    const auth = await apiLogin(email, password);
    localStorage.setItem('keystone-auth', JSON.stringify(auth));
    setUser(auth);
  }

  function logout() {
    localStorage.removeItem('keystone-auth');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
