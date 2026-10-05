'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
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

// Avisos de sucesso/informação somem sozinhos; erros e alertas ficam até serem
// fechados, para que quem lê mais devagar ou usa leitor de tela não perca a
// mensagem (WCAG 2.2.1 — tempo ajustável).
const AUTO_DISMISS_MS: Partial<Record<ToastType, number>> = { success: 8000, info: 8000 };

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ToastIcon({ type }: { type: ToastType }) {
  const icons = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info };
  const Icon = icons[type];
  return <Icon size={20} aria-hidden="true" />;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<{ message: string; resolve: (value: boolean) => void } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const dismiss = (id: number) => setToasts(current => current.filter(toast => toast.id !== id));

  const notify = (type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current.slice(-3), { id, type, message }]);
    const timeout = AUTO_DISMISS_MS[type];
    if (timeout) window.setTimeout(() => dismiss(id), timeout);
  };

  const confirm = (message: string) => new Promise<boolean>(resolve => {
    // Guarda quem abriu o diálogo para devolver o foco ao fechar (WCAG 2.4.3).
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmation({ message, resolve });
  });

  const closeConfirmation = (accepted: boolean) => {
    confirmation?.resolve(accepted);
    setConfirmation(null);
    const opener = openerRef.current;
    openerRef.current = null;
    // Se a ação removeu o elemento (ex.: linha excluída), o foco vai para o conteúdo principal.
    window.setTimeout(() => {
      if (opener && document.contains(opener)) opener.focus();
      else document.getElementById('conteudo')?.focus();
    }, 0);
  };

  useEffect(() => {
    if (!confirmation) return;
    // O foco entra no diálogo, na opção que não destrói nada.
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeConfirmation(false);
        return;
      }
      // Mantém o Tab dentro do diálogo enquanto ele estiver aberto.
      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const inside = dialogRef.current.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || !inside)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
          event.preventDefault();
          first.focus();
        }
      }
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
          <div
            ref={dialogRef}
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-message"
          >
            <TriangleAlert size={22} aria-hidden="true" />
            <h2 id="confirmation-title">Confirmar ação</h2>
            <p id="confirmation-message">{confirmation.message}</p>
            <div className="confirmation-actions">
              <button ref={cancelRef} type="button" className="btn" onClick={() => closeConfirmation(false)}>Cancelar</button>
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
