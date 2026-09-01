import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  LockKeyhole,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useAcknowledgeAnnouncement,
  useAnnouncementInbox,
  useMarkAnnouncementSeen,
} from '../../hooks/queries/useAnnouncements';
import { AnnouncementModal } from './AnnouncementModal';
import { getAnnouncementError, getSeverityStyle } from './announcementUtils';

const severityIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export function AnnouncementBanner() {
  const { user } = useAuth();
  const enabled = Boolean(user && !user.must_reset_password);
  const inboxQuery = useAnnouncementInbox({ enabled, page: 1, perPage: 20 });
  const seenMutation = useMarkAnnouncementSeen();
  const acknowledgeMutation = useAcknowledgeAnnouncement();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detail, setDetail] = useState(null);
  const [acknowledgeError, setAcknowledgeError] = useState('');
  const announcements = (inboxQuery.data?.items || []).filter((announcement) => announcement.status === 'active');

  if (inboxQuery.isLoading || inboxQuery.isError || !announcements.length) return null;

  const safeIndex = Math.min(currentIndex, announcements.length - 1);
  const current = announcements[safeIndex];
  const style = getSeverityStyle(current.severity);
  const SeverityIcon = severityIcons[current.severity] || Info;
  const canNavigate = announcements.length > 1;

  const openDetail = () => {
    setDetail(current);
    setAcknowledgeError('');
    if (!current.seen_at) {
      seenMutation.mutate({ id: current.id, deliveryVersion: current.delivery_version });
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setAcknowledgeError('');
  };

  const acknowledgeDetail = async () => {
    if (!detail) return;
    setAcknowledgeError('');
    try {
      await acknowledgeMutation.mutateAsync({ id: detail.id, deliveryVersion: detail.delivery_version });
      closeDetail();
    } catch (error) {
      setAcknowledgeError(getAnnouncementError(error, 'Konfirmasi belum tersimpan. Silakan coba lagi.'));
    }
  };

  const showPrevious = () => {
    setCurrentIndex((safeIndex - 1 + announcements.length) % announcements.length);
  };

  const showNext = () => {
    setCurrentIndex((safeIndex + 1) % announcements.length);
  };

  return (
    <>
      <section className={`mb-6 overflow-hidden rounded-2xl border shadow-sm sm:mb-8 ${style.panel}`} aria-label="Pengumuman aktif">
        <div className={`h-1.5 w-full ${style.accent}`} />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:h-12 sm:w-12 ${style.accent}`}>
              <SeverityIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.badge}`}>{style.label}</span>
                {current.requires_acknowledgement && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                    <LockKeyhole className="h-3 w-3" />
                    {current.acknowledged_at ? 'Sudah dikonfirmasi' : 'Perlu konfirmasi'}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pengumuman Sistem</p>
              <h2 className="mt-1 line-clamp-2 break-words text-lg font-bold text-slate-900 sm:text-xl">{current.title}</h2>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{current.body}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-900/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={openDetail}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-slate-800 sm:w-auto"
            >
              Lihat Detail
            </button>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <button
                type="button"
                onClick={showPrevious}
                disabled={!canNavigate}
                className="rounded-xl border border-slate-300/80 bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Pengumuman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-14 text-center text-sm font-bold text-slate-700" aria-live="polite">
                {safeIndex + 1} / {announcements.length}
              </span>
              <button
                type="button"
                onClick={showNext}
                disabled={!canNavigate}
                className="rounded-xl border border-slate-300/80 bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Pengumuman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <AnnouncementModal
        announcement={detail}
        onClose={closeDetail}
        onAcknowledge={acknowledgeDetail}
        acknowledging={acknowledgeMutation.isPending}
        acknowledgeError={acknowledgeError}
        enforceAcknowledgement={detail?.status === 'active'}
      />
    </>
  );
}
