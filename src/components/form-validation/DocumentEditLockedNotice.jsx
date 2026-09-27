import { Lock } from 'lucide-react';

export function DocumentEditLockedNotice() {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        Edit dokumen KTP dan BPJS sedang dinonaktifkan oleh Super Admin. Dokumen tersimpan tetap dapat dibuka,
        dan data lainnya tetap dapat diperbarui.
      </span>
    </div>
  );
}
