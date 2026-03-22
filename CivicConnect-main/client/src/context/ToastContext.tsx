import { createContext, useMemo, useState, type PropsWithChildren } from "react";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone?: "success" | "error" | "info";
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneClassName: Record<NonNullable<ToastItem["tone"]>, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-100",
  error: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-100",
  info: "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
};

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo<ToastContextValue>(() => ({
    showToast: (toast) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, tone: "info", ...toast }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 4200);
    },
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur transition ${toneClassName[toast.tone || "info"]}`}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message ? <p className="mt-1 text-sm opacity-90">{toast.message}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
