import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  undoFn?: () => void;
  timeoutId?: ReturnType<typeof setTimeout>;
}

interface ToastContextValue {
  showToast: (message: string, undoFn?: () => void, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, undoFn?: () => void, duration = 5000) => {
    const id = Math.random().toString(36).slice(2);
    const timeoutId = setTimeout(() => removeToast(id), duration);
    setToasts(prev => [...prev, { id, message, undoFn, timeoutId }]);
  }, [removeToast]);

  const handleUndo = (toast: Toast) => {
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    removeToast(toast.id);
    toast.undoFn?.();
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            background: 'rgba(30,20,10,0.97)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '10px 16px',
            color: '#f0ead6',
            fontSize: 14,
            fontFamily: 'Lora, Georgia, serif',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            pointerEvents: 'all',
            backdropFilter: 'blur(8px)',
            minWidth: 240,
          }}>
            <span>{toast.message}</span>
            {toast.undoFn && (
              <button
                onClick={() => handleUndo(toast)}
                style={{
                  color: '#FFD93D', fontWeight: 600, fontSize: 13,
                  padding: '2px 8px', borderRadius: 4,
                  border: '1px solid rgba(255,217,61,0.4)',
                  background: 'rgba(255,217,61,0.1)',
                  flexShrink: 0,
                }}
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
