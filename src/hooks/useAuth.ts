'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('narrativeOS_auth');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setState({ user, loading: false, error: null });
      } catch {
        localStorage.removeItem('narrativeOS_auth');
        setState({ user: null, loading: false, error: null });
      }
    } else {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const user: AuthUser = {
        id: data.data.user_id,
        email: data.data.email || email,
        name: data.data.name || email.split('@')[0],
        token: data.data.token,
      };
      localStorage.setItem('narrativeOS_auth', JSON.stringify(user));
      setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
      return { success: false, error: err.message };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      const user: AuthUser = {
        id: data.data.user_id,
        email: data.data.email || email,
        name: data.data.name || name,
        token: data.data.token,
      };
      localStorage.setItem('narrativeOS_auth', JSON.stringify(user));
      setState({ user, loading: false, error: null });
      return { success: true };
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message }));
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('narrativeOS_auth');
    setState({ user: null, loading: false, error: null });
    router.push('/login');
  }, [router]);

  const getHeaders = useCallback((): Record<string, string> => {
    const stored = localStorage.getItem('narrativeOS_auth');
    if (!stored) return {};
    try {
      const user = JSON.parse(stored);
      return {
        'Authorization': `Bearer ${user.token}`,
        'x-user-id': user.id,
        'Content-Type': 'application/json',
      };
    } catch {
      return {};
    }
  }, []);

  return { ...state, login, register, logout, getHeaders };
}
