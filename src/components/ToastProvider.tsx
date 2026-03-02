'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-[min(92vw,360px)]" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl toast-enter ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-[#0A0A0B] border-white/10 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return ctx;
}
