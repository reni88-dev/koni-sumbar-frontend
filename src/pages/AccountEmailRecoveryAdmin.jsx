import { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Inbox, Loader2, MailCheck, RefreshCw, Search, Send, XCircle } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { usePermission } from '../hooks/usePermission';
import {
  useAccountEmailRecoveries,
  useAccountEmailRecovery,
  useApproveAccountEmailRecovery,
  useRejectAccountEmailRecovery,
  useResendAccountEmailRecovery,
} from '../hooks/queries/useAccountEmailRecovery';

const statusOptions = [
  ['', 'Semua status'], ['pending_admin', 'Menunggu admin'], ['approved', 'Disetujui'],
  ['rejected', 'Ditolak'], ['email_verification_pending', 'Menunggu verifikasi email'],
  ['expired', 'Kedaluwarsa'], ['cancelled', 'Dibatalkan'],
];

const statusLabel = (value) => ({
  identity_verified: 'Identitas terverifikasi', email_verification_pending: 'Menunggu verifikasi email',
  pending_admin: 'Menunggu admin', approved: 'Disetujui', rejected: 'Ditolak', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan',
}[value] || value || '-');
const statusClass = (value) => ({
  pending_admin: 'border-amber-200 bg-amber-50 text-amber-700', approved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-red-200 bg-red-50 text-red-700', expired: 'border-slate-200 bg-slate-100 text-slate-600',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-600', email_verification_pending: 'border-blue-200 bg-blue-50 text-blue-700',
}[value] || 'border-slate-200 bg-slate-50 text-slate-600');
const deliveryLabel = (value) => ({ not_queued: 'Belum diantrikan', pending: 'Menunggu kirim', processing: 'Sedang dikirim', sent: 'Terkirim', retrying: 'Menunggu percobaan ulang', failed: 'Gagal', expired: 'Kedaluwarsa', cancelled: 'Dibatalkan' }[value] || value || '-');
const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '-';
const recoveryError = (error) => error.response?.data?.message || error.response?.data?.error || 'Permintaan tidak dapat diproses.';

export function AccountEmailRecoveryAdmin() {
  const { can } = usePermission();
  const canView = can('account_email_recovery.view');
  const canReview = can('account_email_recovery.review');
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending_admin');
  const [accountType, setAccountType] = useState('');
  const [page, setPage] = useState(1);
  const [selectedID, setSelectedID] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const actionLockRef = useRef(false);
  const filters = useMemo(() => ({ page, perPage: 20, status, accountType, search }), [accountType, page, search, status]);
  const listQuery = useAccountEmailRecoveries(filters, canView);
  const detailQuery = useAccountEmailRecovery(selectedID, canView);
  const approveMutation = useApproveAccountEmailRecovery();
  const rejectMutation = useRejectAccountEmailRecovery();
  const resendMutation = useResendAccountEmailRecovery();
  const actionPending = approveMutation.isPending || rejectMutation.isPending || resendMutation.isPending;
  const detail = detailQuery.data;
  const resendCount = Number(detail?.resend_count ?? 0);
  const resendLimitReached = resendCount >= 3;

  if (!canView) {
    return <DashboardLayout title="Pemulihan Email" subtitle="Tinjau perubahan email akun atlet dan pelatih"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Anda tidak memiliki permission untuk melihat antrean pemulihan email.</div></DashboardLayout>;
  }

  const resetActionFeedback = () => {
    setActionError('');
    setActionSuccess('');
  };

  const selectRequest = (id) => {
    setSelectedID(id);
    setConfirmAction(null);
    setRejectOpen(false);
    setReason('');
    resetActionFeedback();
  };

  const closeDetail = () => {
    if (actionLockRef.current) return;
    setSelectedID(null);
    setConfirmAction(null);
    setRejectOpen(false);
    setReason('');
    resetActionFeedback();
  };

  const openConfirmation = (action) => {
    resetActionFeedback();
    setConfirmAction(action);
  };

  const cancelConfirmation = () => {
    if (actionLockRef.current) return;
    setConfirmAction(null);
    setActionError('');
  };

  const openRejection = () => {
    resetActionFeedback();
    setReason('');
    setRejectOpen(true);
  };

  const cancelRejection = () => {
    if (actionLockRef.current) return;
    setRejectOpen(false);
    setReason('');
    setActionError('');
  };

  const runAction = async (mutation, { payload, successMessage, onSuccess } = {}) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    resetActionFeedback();
    try {
      await mutation.mutateAsync({ id: selectedID, payload });
      if (successMessage) setActionSuccess(successMessage);
      onSuccess?.();
    } catch (error) {
      setActionError(recoveryError(error));
    } finally {
      actionLockRef.current = false;
    }
  };

  const confirmSelectedAction = () => {
    if (!detail || !confirmAction) return;
    const destinationEmail = detail.proposed_email || 'email baru terverifikasi';

    if (confirmAction === 'approve') {
      runAction(approveMutation, {
        successMessage: `Permintaan disetujui. Kredensial sudah otomatis masuk antrean pengiriman ke ${destinationEmail}; Anda tidak perlu langsung membuat dan mengirim ulang password.`,
        onSuccess: () => setConfirmAction(null),
      });
      return;
    }

    if (resendLimitReached) return;
    runAction(resendMutation, {
      successMessage: `Password sementara baru sudah masuk antrean pengiriman ke ${destinationEmail}, dan password sementara sebelumnya telah dinonaktifkan.`,
      onSuccess: () => setConfirmAction(null),
    });
  };

  return (
    <DashboardLayout title="Pemulihan Email" subtitle="Tinjau email baru yang telah diverifikasi sebelum kredensial diterbitkan">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(draftSearch.trim()); }} className="grid gap-3 lg:grid-cols-[1fr_190px_180px_auto]">
            <label className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="Cari nama atau email baru" /></label>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-500">{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={accountType} onChange={(event) => { setAccountType(event.target.value); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-red-500"><option value="">Atlet & pelatih</option><option value="athlete">Atlet</option><option value="coach">Pelatih</option></select>
            <button className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">Terapkan</button>
          </form>
        </section>

        {listQuery.isLoading && <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20"><Loader2 className="h-7 w-7 animate-spin text-red-600" /></div>}
        {listQuery.isError && <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" />{recoveryError(listQuery.error)}</div><button type="button" onClick={() => listQuery.refetch()} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" /> Coba lagi</button></div>}
        {!listQuery.isLoading && !listQuery.isError && listQuery.data?.data?.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Inbox className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-700">Tidak ada permintaan</h3><p className="mt-1 text-sm text-slate-500">Permintaan yang sesuai filter akan muncul di sini.</p></div>}

        {listQuery.data?.data?.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Pemohon</th><th className="px-5 py-3">Email baru</th><th className="px-5 py-3">Organisasi / Cabor</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Dibuat</th></tr></thead><tbody className="divide-y divide-slate-100">{listQuery.data.data.map((item) => <tr key={item.id} onClick={() => selectRequest(item.id)} className="cursor-pointer hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-slate-800">{item.name}</p><p className="text-xs capitalize text-slate-500">{item.subject_type === 'athlete' ? 'Atlet' : 'Pelatih'}</p></td><td className="px-5 py-4 font-medium text-slate-700">{item.proposed_email || '-'}</td><td className="px-5 py-4"><p className="font-medium text-slate-700">{item.organization || '-'}</p><p className="text-xs text-slate-500">{item.cabor || '-'}</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDate(item.created_at)}</td></tr>)}</tbody></table></div>
            </div>
            <div className="space-y-3 md:hidden">{listQuery.data.data.map((item) => <button key={item.id} type="button" onClick={() => selectRequest(item.id)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-800">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.organization || '-'} · {item.cabor || '-'}</p></div><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></div><p className="mt-3 break-all text-sm font-medium text-slate-700">{item.proposed_email || '-'}</p><p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p></button>)}</div>
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"><p className="text-sm text-slate-500">Halaman {listQuery.data.current_page} dari {listQuery.data.last_page} · {listQuery.data.total} permintaan</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Sebelumnya</button><button type="button" disabled={page >= listQuery.data.last_page} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Berikutnya <ChevronRight className="h-4 w-4" /></button></div></div>
          </>
        )}
      </div>

      {selectedID && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !actionPending) closeDetail(); }}><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><h2 className="text-lg font-bold text-slate-800">Detail Pemulihan Email</h2><p className="text-xs text-slate-500">Request #{selectedID}</p></div><button type="button" disabled={actionPending} onClick={closeDetail} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">×</button></div>
        {detailQuery.isLoading && <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-600" /></div>}
        {detailQuery.isError && <div className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{recoveryError(detailQuery.error)}</div>}
        {detail && <div className="space-y-5 p-5 sm:p-6">
          {actionSuccess && <div role="status" className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />{actionSuccess}</div>}
          {actionError && !rejectOpen && !confirmAction && <div role="alert" className="flex gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{actionError}</div>}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xl font-bold text-slate-800">{detail.name}</p><p className="mt-1 text-sm text-slate-500">{detail.subject_type === 'athlete' ? 'Atlet' : 'Pelatih'} · {detail.organization || '-'} · {detail.cabor || '-'}</p></div><span className={`self-start rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(detail.status)}`}>{statusLabel(detail.status)}</span></div>
          {detail.status === 'pending_admin' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-emerald-100 p-2 text-emerald-700"><MailCheck className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-emerald-900">Menunggu persetujuan admin</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-emerald-800">Email baru telah diverifikasi dan menunggu persetujuan admin. Kredensial belum dibuat.</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">Jika permintaan ini disetujui, sistem akan:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-emerald-800">
                    <li>mengubah email akun ke email baru yang telah diverifikasi, <span className="font-semibold">{detail.proposed_email || '-'}</span>;</li>
                    <li>membuat password sementara baru;</li>
                    <li>otomatis memasukkan kredensial ke antrean pengiriman email; dan</li>
                    <li>mewajibkan pengguna mengganti password saat login.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {detail.status === 'email_verification_pending' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-blue-100 p-2 text-blue-700"><MailCheck className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-blue-900">Menunggu verifikasi email baru</h3>
                  <p className="mt-1 text-sm leading-6 text-blue-800">Sistem sedang menunggu pemohon memverifikasi alamat email baru. Setelah terverifikasi, permintaan akan masuk ke antrean persetujuan admin.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2"><Info label="Email entity saat pengajuan" value={detail.entity_email_snapshot || '-'} /><Info label="Email user saat pengajuan" value={detail.user_email_snapshot || '-'} /><Info label={detail.email_verified_at ? 'Email baru terverifikasi' : 'Email baru diajukan'} value={detail.proposed_email || '-'} highlight /><Info label="Email diverifikasi" value={formatDate(detail.email_verified_at)} /><Info label="Batas review admin" value={formatDate(detail.admin_expires_at)} /><Info label="Terakhir ditinjau" value={formatDate(detail.reviewed_at)} /></div>
          {detail.status === 'approved' && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800">Status pengiriman kredensial</h3>
              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Status" value={deliveryLabel(detail.delivery_status)} />
                <Info label="Terakhir masuk antrean" value={formatDate(detail.credentials_last_queued_at)} />
                <Info label="Password berlaku hingga" value={formatDate(detail.temporary_password_expires_at)} />
                <Info label="Pengiriman ulang" value={`${resendCount}/3`} />
                <Info label="Percobaan pengiriman" value={String(detail.delivery_attempts ?? 0)} />
                <Info label="Terkirim" value={formatDate(detail.delivery_sent_at)} />
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Pengiriman password baru dibatasi maksimal tiga kali dengan cooldown 10 menit antarpermintaan. Backend tetap memvalidasi batas dan cooldown tersebut.
                {resendLimitReached && <span className="mt-1 block font-bold">Batas tiga kali sudah tercapai. Aksi pembuatan password baru dinonaktifkan.</span>}
              </div>
              {detail.delivery_last_error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{detail.delivery_last_error}</p>}
            </div>
          )}
          {detail.rejection_reason && <div className="rounded-2xl border border-red-100 bg-red-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-red-600">Alasan penolakan</p><p className="mt-2 text-sm leading-6 text-red-800">{detail.rejection_reason}</p></div>}
          {canReview && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-end">
              {detail.status === 'pending_admin' && (
                <>
                  <button type="button" disabled={actionPending} onClick={openRejection} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:w-auto"><XCircle className="h-5 w-5" /> Tolak</button>
                  <button type="button" disabled={actionPending} onClick={() => openConfirmation('approve')} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"><CheckCircle2 className="h-5 w-5" /> Setujui &amp; kirim kredensial</button>
                </>
              )}
              {detail.status === 'approved' && (
                <>
                  <div className="sm:mr-auto sm:max-w-md">
                    <p className="text-xs leading-5 text-slate-500">Tindakan ini selalu merotasi password, bukan mengirim ulang password lama. Cooldown 10 menit tetap berlaku.</p>
                    {resendLimitReached && <p className="mt-1 text-xs font-bold text-amber-700">Batas pengiriman ulang 3/3 sudah tercapai.</p>}
                  </div>
                  <button type="button" disabled={actionPending || resendLimitReached} onClick={() => openConfirmation('resend')} title={resendLimitReached ? 'Batas pengiriman ulang sudah tercapai' : undefined} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><Send className="h-5 w-5" /> Buat &amp; kirim password baru</button>
                </>
              )}
            </div>
          )}
        </div>}
      </div></div>}
      {confirmAction && detail && (
        <ConfirmationDialog
          action={confirmAction}
          email={detail.proposed_email || '-'}
          error={actionError}
          isPending={confirmAction === 'approve' ? approveMutation.isPending : resendMutation.isPending}
          onCancel={cancelConfirmation}
          onConfirm={confirmSelectedAction}
        />
      )}
      {rejectOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="reject-recovery-title" aria-describedby="reject-recovery-description">
          <form onSubmit={(event) => { event.preventDefault(); runAction(rejectMutation, { payload: { reason }, onSuccess: () => { setRejectOpen(false); setReason(''); } }); }} aria-busy={rejectMutation.isPending} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-600"><XCircle className="h-6 w-6" /></div>
              <div><h3 id="reject-recovery-title" className="text-lg font-bold text-slate-800">Tolak permintaan</h3><p id="reject-recovery-description" className="mt-1 text-sm text-slate-500">Alasan akan dikirim ke email yang sudah diverifikasi. Jangan memasukkan data sensitif.</p></div>
            </div>
            <label className="mt-5 block"><span className="text-sm font-semibold text-slate-700">Alasan penolakan</span><textarea value={reason} onChange={(event) => setReason(event.target.value.slice(0, 500))} required minLength={3} maxLength={500} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></label>
            <div className="mt-1 text-right text-xs text-slate-400">{reason.length}/500</div>
            {actionError && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{actionError}</div>}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={actionPending} onClick={cancelRejection} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 disabled:opacity-50">Batal</button>
              <button type="submit" disabled={actionPending || reason.trim().length < 3} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white disabled:opacity-50">{rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} {rejectMutation.isPending ? 'Memproses...' : 'Tolak permintaan'}</button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}

function ConfirmationDialog({ action, email, error, isPending, onCancel, onConfirm }) {
  const isApproval = action === 'approve';
  const titleID = `${action}-recovery-title`;
  const descriptionID = `${action}-recovery-description`;
  const title = isApproval ? 'Setujui & kirim kredensial?' : 'Buat & kirim password baru?';
  const confirmLabel = isApproval ? 'Setujui & kirim kredensial' : 'Buat & kirim password baru';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby={titleID} aria-describedby={descriptionID}>
      <form onSubmit={(event) => { event.preventDefault(); if (!isPending) onConfirm(); }} aria-busy={isPending} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-xl p-2 ${isApproval ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {isApproval ? <MailCheck className="h-6 w-6" /> : <Send className="h-6 w-6" />}
          </div>
          <div>
            <h3 id={titleID} className="text-lg font-bold text-slate-800">{title}</h3>
            <p id={descriptionID} className="mt-1 text-sm leading-6 text-slate-500">Pastikan email tujuan dan seluruh dampak tindakan ini sudah benar sebelum melanjutkan.</p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Email tujuan kredensial</p>
          <p className="mt-1 break-all text-sm font-bold text-slate-800">{email}</p>
        </div>

        {isApproval ? (
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Email akun akan diubah ke email baru terverifikasi di atas.</li>
            <li>Password sementara baru akan dibuat.</li>
            <li>Kredensial otomatis masuk antrean pengiriman ke email tersebut.</li>
            <li>Pengguna wajib mengganti password saat login.</li>
          </ul>
        ) : (
          <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Password sementara sebelumnya langsung dinonaktifkan.</li>
            <li>Password sementara dan masa berlaku baru akan dibuat.</li>
            <li>Semua sesi login aktif akun akan dinonaktifkan.</li>
            <li>Kredensial baru otomatis masuk antrean pengiriman ke email terverifikasi di atas.</li>
          </ul>
        )}

        {error && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={isPending} onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-600 disabled:opacity-50">Batal</button>
          <button type="submit" disabled={isPending} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-white disabled:opacity-50 ${isApproval ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}{isPending ? 'Memproses...' : confirmLabel}</button>
        </div>
      </form>
    </div>
  );
}
function Info({ label, value, highlight = false }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 break-words text-sm font-semibold ${highlight ? 'text-emerald-700' : 'text-slate-700'}`}>{value}</p></div>;
}
