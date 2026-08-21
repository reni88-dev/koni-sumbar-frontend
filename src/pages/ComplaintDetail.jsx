import { useState } from 'react';
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, Clock3, ExternalLink, FileText, Loader2, MapPin, Monitor, UserRound, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProtectedImage } from '../components/ProtectedImage';
import { useAuth } from '../hooks/useAuth';
import { useComplaint, useReviewComplaint } from '../hooks/queries/useComplaints';
import {
  complaintCategories,
  complaintErrorMessage,
  complaintImpactClasses,
  complaintImpacts,
  complaintLabel,
  complaintStatusClasses,
  complaintStatuses,
  formatComplaintDate,
} from '../lib/complaints';

function DetailItem({ label, value, mono = false }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 break-words text-sm text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '-'}</dd>
    </div>
  );
}

function ReviewPanel({ complaint }) {
  const reviewComplaint = useReviewComplaint();
  const [status, setStatus] = useState(complaint.status);
  const [internalNotes, setInternalNotes] = useState(complaint.internal_notes || '');
  const [publicResponse, setPublicResponse] = useState(complaint.public_response || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const statusOptions = complaint.status === 'baru'
    ? ['baru', 'diproses']
    : complaint.status === 'diproses'
      ? ['diproses', 'selesai']
      : ['selesai', 'diproses'];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (status === 'selesai' && !publicResponse.trim()) {
      setError('Respons publik wajib diisi sebelum tiket diselesaikan.');
      return;
    }
    try {
      await reviewComplaint.mutateAsync({
        id: complaint.id,
        payload: {
          status,
          internal_notes: internalNotes,
          public_response: publicResponse,
        },
      });
      setMessage('Review pengaduan berhasil disimpan.');
    } catch (reviewError) {
      setError(complaintErrorMessage(reviewError, 'Review pengaduan gagal disimpan.'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Review Superadmin</h2>
        <p className="mt-1 text-sm text-slate-500">Catatan internal tidak pernah ditampilkan kepada pelapor.</p>
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-red-500">
          {statusOptions.map((value) => <option key={value} value={value}>{complaintLabel(complaintStatuses, value)}</option>)}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Catatan internal
        <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} maxLength={5000} rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="Analisis, tindak lanjut teknis, atau koordinasi internal..." />
      </label>
      <label className="block space-y-2 text-sm font-medium text-slate-700">
        Respons publik {status === 'selesai' && <span className="text-red-600">*</span>}
        <textarea value={publicResponse} onChange={(event) => setPublicResponse(event.target.value)} maxLength={5000} rows={5} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" placeholder="Respons yang dapat dibaca pelapor..." />
      </label>
      <button type="submit" disabled={reviewComplaint.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 sm:w-auto">
        {reviewComplaint.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
        {reviewComplaint.isPending ? 'Menyimpan...' : 'Simpan Review'}
      </button>
    </form>
  );
}

export function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const complaintQuery = useComplaint(id);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const isSuperAdmin = user?.role?.name === 'super_admin' || user?.role_id === 1 || user?.role?.id === 1;

  if (complaintQuery.isLoading) {
    return <DashboardLayout title="Detail Pengaduan"><div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-red-600" />Memuat detail pengaduan...</div></DashboardLayout>;
  }

  if (complaintQuery.isError) {
    const status = complaintQuery.error?.response?.status;
    return (
      <DashboardLayout title="Detail Pengaduan">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="mx-auto mb-3 h-9 w-9" />
          <h2 className="font-bold">{status === 404 ? 'Pengaduan tidak ditemukan' : 'Detail gagal dimuat'}</h2>
          <p className="mt-1 text-sm">{complaintErrorMessage(complaintQuery.error)}</p>
          <button type="button" onClick={() => navigate('/pengaduan')} className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white">Kembali</button>
        </div>
      </DashboardLayout>
    );
  }

  const complaint = complaintQuery.data;
  const viewport = complaint.client_context?.viewport;

  return (
    <DashboardLayout>
      <button type="button" onClick={() => navigate('/pengaduan')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-600"><ArrowLeft className="h-4 w-4" /> Kembali ke Pengaduan</button>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-red-600">{complaint.ticket_code}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">{complaint.title}</h1>
            <p className="mt-2 text-sm text-slate-500">Dibuat {formatComplaintDate(complaint.created_at)}</p>
          </div>
          <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${complaintStatusClasses(complaint.status)}`}>{complaintLabel(complaintStatuses, complaint.status)}</span>
        </div>
      </div>

      <div className={`grid gap-6 ${isSuperAdmin ? 'xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]' : ''}`}>
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2"><FileText className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold text-slate-800">Laporan</h2></div>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Kategori" value={complaintLabel(complaintCategories, complaint.category)} />
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dampak</dt><dd className="mt-2"><span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${complaintImpactClasses(complaint.impact)}`}>{complaintLabel(complaintImpacts, complaint.impact)}</span></dd></div>
              <DetailItem label="Halaman terdampak" value={complaint.page_path} mono />
              <DetailItem label="Jumlah screenshot" value={String(complaint.attachment_count || complaint.attachments?.length || 0)} />
            </dl>
            <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
              <div><h3 className="text-sm font-semibold text-slate-700">Deskripsi / kronologi</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{complaint.description}</p></div>
              {complaint.trigger_steps && <div><h3 className="text-sm font-semibold text-slate-700">Langkah pemicu</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{complaint.trigger_steps}</p></div>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2"><Camera className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold text-slate-800">Screenshot</h2></div>
            {(complaint.attachments?.length ?? 0) === 0 ? <p className="text-sm text-slate-500">Tidak ada screenshot pada tiket ini.</p> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {complaint.attachments.map((attachment) => (
                  <button key={attachment.id} type="button" onClick={() => setSelectedAttachment(attachment)} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left">
                    <ProtectedImage src={attachment.url} alt={attachment.original_name} className="aspect-video w-full object-contain" />
                    <div className="flex items-center justify-between gap-3 bg-white p-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{attachment.original_name}</p><p className="text-xs text-slate-400">{(attachment.size_bytes / 1024).toFixed(1)} KB</p></div><ExternalLink className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-red-600" /></div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2"><Clock3 className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold text-slate-800">Tindak Lanjut</h2></div>
            {complaint.public_response ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="whitespace-pre-wrap text-sm leading-6 text-emerald-900">{complaint.public_response}</p>{complaint.reviewed_at && <p className="mt-3 text-xs text-emerald-700">Diperbarui {formatComplaintDate(complaint.reviewed_at)}</p>}</div> : <p className="text-sm text-slate-500">Belum ada respons publik dari tim dukungan.</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-2"><Monitor className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold text-slate-800">Konteks Teknis</h2></div>
            <dl className="grid gap-5 sm:grid-cols-2"><DetailItem label="Pathname" value={complaint.client_context?.pathname} mono /><DetailItem label="Bahasa" value={complaint.client_context?.language} /><DetailItem label="Viewport" value={viewport ? `${viewport.width} x ${viewport.height}` : '-'} /><DetailItem label="User agent" value={complaint.client_context?.user_agent} /></dl>
          </section>
        </div>

        {isSuperAdmin && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-2"><UserRound className="h-5 w-5 text-red-600" /><h2 className="text-lg font-bold text-slate-800">Pelapor</h2></div>
              <dl className="space-y-4"><DetailItem label="Nama" value={complaint.reporter?.name} /><DetailItem label="Role" value={complaint.reporter?.role} /><DetailItem label="Organisasi" value={complaint.reporter?.organization} /></dl>
            </section>
            <ReviewPanel key={complaint.updated_at} complaint={complaint} />
          </div>
        )}
      </div>

      {selectedAttachment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" aria-label="Screenshot pengaduan">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-3 shadow-2xl">
            <button type="button" onClick={() => setSelectedAttachment(null)} className="absolute right-5 top-5 z-10 rounded-full bg-slate-900/70 p-2 text-white hover:bg-slate-900" aria-label="Tutup screenshot"><X className="h-5 w-5" /></button>
            <ProtectedImage src={selectedAttachment.url} alt={selectedAttachment.original_name} className="max-h-[84vh] w-full rounded-xl object-contain" />
            <p className="p-3 text-center text-sm font-medium text-slate-600">{selectedAttachment.original_name}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
