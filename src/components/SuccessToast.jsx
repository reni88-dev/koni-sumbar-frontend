import { useEffect, useRef } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export function SuccessToast({ isOpen, message, onClose, duration = 4000 }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !message) return undefined;

    const timeoutId = window.setTimeout(() => {
      onCloseRef.current?.();
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, isOpen, message]);

  if (!isOpen || !message) return null;

  return (
    <div
      className="fixed inset-x-4 top-4 z-[120] sm:left-auto sm:right-4 sm:w-full sm:max-w-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-xl">
        <span className="rounded-xl bg-green-100 p-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 pt-1 text-sm font-semibold leading-5">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-green-700 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-green-50"
          aria-label="Tutup notifikasi sukses"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
