import React from 'react';
import { CheckCircle2, Heart, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'wishlist' | 'info' | 'error';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-70 space-y-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-zinc-900 border border-zinc-700/90 text-white p-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : toast.type === 'wishlist' ? (
              <div className="p-1 rounded-full bg-rose-500/20 text-rose-400">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
            ) : (
              <div className="p-1 rounded-full bg-zinc-800 text-zinc-300">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              {toast.message && <p className="text-[11px] text-zinc-400">{toast.message}</p>}
            </div>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
