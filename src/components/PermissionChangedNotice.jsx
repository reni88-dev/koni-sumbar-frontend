import { X } from 'lucide-react';

export function PermissionChangedNotice({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-[110] max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-xl" role="status">
      <div className="flex items-start gap-3">
        <p className="flex-1 leading-5">{message}</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-amber-100" aria-label="Tutup pemberitahuan">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
