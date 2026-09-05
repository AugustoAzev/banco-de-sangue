'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextData {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

function ToastIcon({ type }: { type: ToastType }) {
  const icons = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };
  const Icon = icons[type];
  return <Icon size={20} aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<{ message: string; resolve: (value: boolean) => void } | null>(null);

  const dismiss = (id: number) => setToasts(current => current.filter(toast => toast.id !== id));

  const notify = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current.slice(-3), { id, type, message }]);
    window.setTimeout(() => dismiss(id), 6000);
  };

  const confirm = (message: string) => new Promise<boolean>(resolve => setConfirmation({ message, resolve }));

  const closeConfirmation = (accepted: boolean) => {
    confirmation?.resolve(accepted);
    setConfirmation(null);
  };

  useEffect(() => {
    if (!confirmation) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeConfirmation(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmation]);

  return (
    <ToastContext.Provider value={{
      success: message => notify('success', message),
      error: message => notify('error', message),
      warning: message => notify('warning', message),
      info: message => notify('info', message),
      confirm,
    }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map(toast => (
          <div key={toast.id} className={`system-toast system-toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <ToastIcon type={toast.type} />
            <span>{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Fechar mensagem">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {confirmation && (
        <div className="confirmation-backdrop" role="presentation">
          <div className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title">
            <TriangleAlert size={22} aria-hidden="true" />
            <h2 id="confirmation-title">Confirmar ação</h2>
            <p>{confirmation.message}</p>
            <div className="confirmation-actions">
              <button type="button" className="btn" onClick={() => closeConfirmation(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={() => closeConfirmation(true)}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}