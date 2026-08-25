import { AnimatePresence, motion as Motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export function AccountBlockedDialog({ block, onReturnToLogin }) {
  return (
    <AnimatePresence>
      {block && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <Motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="account-blocked-title"
            aria-describedby="account-blocked-message"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert className="h-8 w-8 text-amber-600" />
            </div>
            <h2 id="account-blocked-title" className="mb-2 text-xl font-bold text-slate-800">
              {block.title}
            </h2>
            <p id="account-blocked-message" className="mb-6 text-sm leading-6 text-slate-600">
              {block.message}
            </p>
            <button
              type="button"
              onClick={onReturnToLogin}
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Kembali ke Login
            </button>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
