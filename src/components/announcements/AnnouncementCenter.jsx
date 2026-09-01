import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAcknowledgeAnnouncement, useMarkAnnouncementSeen, usePendingAnnouncements } from '../../hooks/queries/useAnnouncements';
import { AnnouncementModal } from './AnnouncementModal';
import { getAnnouncementError } from './announcementUtils';

const deliveryKey = (announcement) => `${announcement.id}:${announcement.delivery_version}`;

export function AnnouncementCenter() {
  const { user, loading } = useAuth();
  if (loading || !user || user.must_reset_password) return null;
  return <ActiveAnnouncementCenter key={user.id} />;
}

function ActiveAnnouncementCenter() {
  const pendingQuery = usePendingAnnouncements(true);
  const seenMutation = useMarkAnnouncementSeen();
  const acknowledgeMutation = useAcknowledgeAnnouncement();
  const seenAttemptRef = useRef(new Set());
  const [handledKeys, setHandledKeys] = useState(() => new Set());
  const [acknowledgeError, setAcknowledgeError] = useState('');
  const current = pendingQuery.data?.find((announcement) => !handledKeys.has(deliveryKey(announcement))) || null;

  useEffect(() => {
    if (!current) return;
    const key = deliveryKey(current);
    if (seenAttemptRef.current.has(key)) return;
    seenAttemptRef.current.add(key);
    seenMutation.mutate({ id: current.id, deliveryVersion: current.delivery_version });
  }, [current, seenMutation]);

  const removeCurrent = () => {
    if (!current) return;
    setHandledKeys((keys) => new Set(keys).add(deliveryKey(current)));
    setAcknowledgeError('');
  };

  const handleAcknowledge = async () => {
    if (!current) return;
    setAcknowledgeError('');
    try {
      await acknowledgeMutation.mutateAsync({ id: current.id, deliveryVersion: current.delivery_version });
      removeCurrent();
    } catch (error) {
      setAcknowledgeError(getAnnouncementError(error, 'Konfirmasi belum tersimpan. Periksa koneksi dan coba lagi.'));
    }
  };

  return (
    <>
      {pendingQuery.isError && !current && (
        <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl border border-amber-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-800">Pengumuman sistem belum dapat dimuat.</p>
          <button type="button" onClick={() => pendingQuery.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"><RefreshCw className="h-3.5 w-3.5" /> Coba lagi</button>
        </div>
      )}
      <AnnouncementModal announcement={current} onClose={removeCurrent} onAcknowledge={handleAcknowledge} acknowledging={acknowledgeMutation.isPending} acknowledgeError={acknowledgeError} />
    </>
  );
}