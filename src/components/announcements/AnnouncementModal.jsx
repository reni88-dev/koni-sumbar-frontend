import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, Info, LockKeyhole, X } from 'lucide-react';
import { formatJakartaDateTime, getSeverityStyle } from './announcementUtils';

const severityIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export function AnnouncementModal({
  announcement,
  onClose,
  onAcknowledge,
  acknowledging = false,
  acknowledgeError = '',
  enforceAcknowledgement = true,
}) {
  const navigate = useNavigate();
  const required = Boolean(announcement?.requires_acknowledgement && enforceAcknowledgement);
  const style = getSeverityStyle(announcement?.severity);
  const SeverityIcon = severityIcons[announcement?.severity] || Info;

  useEffect(() => {
    if (!announcement || required) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [announcement, onClose, required]);

  if (!announcement) return null;

  const handleCTA = () => {
    if (!announcement.cta_url) return;
    if (announcement.cta_url.startsWith('/')) {
      navigate(announcement.cta_url);
    } else {
      window.open(announcement.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="presentation">
      <button
        type="button"
        aria-label={required ? 'Pengumuman wajib tidak dapat ditutup' : 'Tutup pengumuman'}
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={() => { if (!required) onClose?.(); }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`announcement-title-${announcement.id || 'preview'}`}
        className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]"
      >
        <div className={`h-1.5 w-full ${style.accent}`} />
        <div className="flex items-start gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border ${style.panel}`}>
            <SeverityIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}>{style.label}</span>
              {announcement.requires_acknowledgement && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                  <LockKeyhole className="h-3 w-3" /> Wajib dikonfirmasi
                </span>
              )}
              {announcement.delivery_version > 1 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Versi {announcement.delivery_version}
                </span>
              )}
            </div>
            <h2 id={`announcement-title-${announcement.id || 'preview'}`} className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
              {announcement.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Mulai {formatJakartaDateTime(announcement.starts_at)}</p>
          </div>
          {!required && (
            <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">{announcement.body}</p>
          {announcement.ends_at && (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              Berlaku sampai {formatJakartaDateTime(announcement.ends_at)}
            </div>
          )}
          {acknowledgeError && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {acknowledgeError}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:justify-end sm:p-5">
          {!required && (
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Tutup
            </button>
          )}
          {announcement.cta_url && (
            <button type="button" onClick={handleCTA} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100">
              {announcement.cta_label || 'Buka'} <ExternalLink className="h-4 w-4" />
            </button>
          )}
          {required && (
            <button
              type="button"
              onClick={onAcknowledge}
              disabled={acknowledging}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {acknowledging ? 'Menyimpan konfirmasi...' : 'Saya Mengerti dan Konfirmasi'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}