import { LogOut, RefreshCw, ShieldAlert } from 'lucide-react';

export function AccessServiceUnavailableScreen({ message, onRetry, onLogout, retrying }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-slate-800">Layanan Akses Tidak Tersedia</h1>
        <p className="mb-7 text-sm leading-6 text-slate-600">{message}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            disabled={retrying}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
