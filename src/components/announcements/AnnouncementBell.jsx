import { useState } from 'react';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useAcknowledgeAnnouncement,
  useAnnouncementInbox,
  useMarkAnnouncementSeen,
} from '../../hooks/queries/useAnnouncements';
import { AnnouncementModal } from './AnnouncementModal';
import { formatJakartaDateTime, getAnnouncementError, getSeverityStyle } from './announcementUtils';

export function AnnouncementBell() {
  const { user } = useAuth();
  const enabled = Boolean(user && !user.must_reset_password);
  const inboxQuery = useAnnouncementInbox({ enabled, page: 1, perPage: 20 });
  const seenMutation = useMarkAnnouncementSeen();
  const acknowledgeMutation = useAcknowledgeAnnouncement();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [acknowledgeError, setAcknowledgeError] = useState('');
  const inbox = inboxQuery.data;
  const unreadCount = inbox?.unread_count || 0;

  const openDetail = (announcement) => {
    setOpen(false);
    setDetail(announcement);
    setAcknowledgeError('');
    if (!announcement.seen_at) {
      seenMutation.mutate({ id: announcement.id, deliveryVersion: announcement.delivery_version });
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100"
        aria-label="Buka pengumuman sistem"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" aria-label="Tutup panel pengumuman" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-3 top-20 z-40 max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[25rem]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div>
                <h3 className="font-bold text-slate-900">Pengumuman Sistem</h3>
                <p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} perlu perhatian` : 'Semua sudah dilihat'}</p>
              </div>
              <button type="button" onClick={() => inboxQuery.refetch()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Muat ulang">
                <RefreshCw className={`h-4 w-4 ${inboxQuery.isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="max-h-[min(32rem,calc(100vh-11rem))] overflow-y-auto">
              {inboxQuery.isLoading && (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Memuat pengumuman...
                </div>
              )}
              {inboxQuery.isError && (
                <div className="p-6 text-center">
                  <p className="text-sm text-red-600">Riwayat pengumuman belum dapat dimuat.</p>
                  <button type="button" onClick={() => inboxQuery.refetch()} className="mt-3 text-sm font-bold text-red-600">Coba lagi</button>
                </div>
              )}
              {!inboxQuery.isLoading && !inboxQuery.isError && !inbox?.items?.length && (
                <div className="p-10 text-center text-sm text-slate-500">
                  <CheckCheck className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                  Belum ada pengumuman untuk role Anda.
                </div>
              )}
              {inbox?.items?.map((announcement) => {
                const style = getSeverityStyle(announcement.severity);
                const needsAttention = !announcement.seen_at || (announcement.requires_acknowledgement && !announcement.acknowledged_at && announcement.status === 'active');
                return (
                  <button
                    type="button"
                    key={`${announcement.id}:${announcement.delivery_version}`}
                    onClick={() => openDetail(announcement)}
                    className={`block w-full border-b border-slate-100 px-4 py-4 text-left transition-colors hover:bg-slate-50 ${needsAttention ? 'bg-red-50/40' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${needsAttention ? style.accent : 'bg-slate-200'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>{style.label}</span>
                          <span className="text-[10px] text-slate-400">{formatJakartaDateTime(announcement.starts_at)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-800">{announcement.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{announcement.body}</p>
                        {announcement.requires_acknowledgement && !announcement.acknowledged_at && announcement.status === 'active' && (
                          <p className="mt-2 text-[11px] font-bold text-red-600">Menunggu konfirmasi Anda</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      <AnnouncementModal
        announcement={detail}
        onClose={closeDetail}
        onAcknowledge={acknowledgeDetail}
        acknowledging={acknowledgeMutation.isPending}
        acknowledgeError={acknowledgeError}
        enforceAcknowledgement={detail?.status === 'active'}
      />
    </div>
  );
}