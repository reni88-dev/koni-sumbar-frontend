import { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Filter, Inbox, MessageSquarePlus, RefreshCw, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ComplaintForm } from '../components/complaints/ComplaintForm';
import { ComplaintSuccessModal } from '../components/complaints/ComplaintSuccessModal';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { useComplaints, useComplaintSummary } from '../hooks/queries/useComplaints';
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

const emptyFilters = {
  search: '', status: '', category: '', impact: '', dateFrom: '', dateTo: '',
};

export function ComplaintsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role?.name === 'super_admin' || user?.role_id === 1 || user?.role?.id === 1;
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'list' : 'create');
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [successResult, setSuccessResult] = useState(null);
  const queryFilters = { ...appliedFilters, page, perPage: 15 };
  const complaintsQuery = useComplaints(queryFilters);
  const summaryQuery = useComplaintSummary(isSuperAdmin);

  const statePath = typeof location.state?.fromPath === 'string' ? location.state.fromPath : '';
  const initialPagePath = statePath && !statePath.startsWith('/pengaduan') ? statePath : '';

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleCreated = (result) => {
    setSuccessResult(result);
  };

  const closeSuccess = () => {
    setSuccessResult(null);
    setActiveTab('list');
  };

  return (
    <DashboardLayout
      title="Pengaduan"
      subtitle="Laporkan kendala penggunaan aplikasi dan pantau tindak lanjutnya."
    >
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'create' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <MessageSquarePlus className="h-4 w-4" /> Buat Pengaduan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab === 'list' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Inbox className="h-4 w-4" /> {isSuperAdmin ? 'Semua Pengaduan' : 'Riwayat Saya'}
          {isSuperAdmin && (summaryQuery.data?.new_count ?? 0) > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === 'list' ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'}`}>
              {summaryQuery.data.new_count}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'create' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Buat Pengaduan</h2>
            <p className="mt-1 text-sm text-slate-500">Jangan memasukkan password, token, NIK, atau data sensitif lain ke dalam laporan maupun screenshot.</p>
          </div>
          <ComplaintForm initialPagePath={initialPagePath} onCreated={handleCreated} />
        </section>
      ) : (
        <section className="space-y-5">
          <form onSubmit={applyFilters} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="relative xl:col-span-2">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  value={draftFilters.search}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Cari nomor tiket, judul, atau pelapor..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <select
                value={draftFilters.status}
                onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              >
                <option value="">Semua status</option>
                {complaintStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                value={draftFilters.category}
                onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              >
                <option value="">Semua kategori</option>
                {complaintCategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select
                value={draftFilters.impact}
                onChange={(event) => setDraftFilters((current) => ({ ...current, impact: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500"
              >
                <option value="">Semua dampak</option>
                {complaintImpacts.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input
                type="date"
                value={draftFilters.dateFrom}
                onChange={(event) => setDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                aria-label="Tanggal mulai"
              />
              <input
                type="date"
                value={draftFilters.dateTo}
                onChange={(event) => setDraftFilters((current) => ({ ...current, dateTo: event.target.value }))}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500"
                aria-label="Tanggal akhir"
              />
              <div className="flex gap-2">
                <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"><Filter className="h-4 w-4" /> Terapkan</button>
                <button type="button" onClick={resetFilters} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Reset</button>
              </div>
            </div>
          </form>

          {complaintsQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              <RefreshCw className="mx-auto mb-3 h-7 w-7 animate-spin text-red-600" /> Memuat pengaduan...
            </div>
          ) : complaintsQuery.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              <AlertCircle className="mx-auto mb-2 h-7 w-7" />
              <p>{complaintErrorMessage(complaintsQuery.error, 'Riwayat pengaduan gagal dimuat.')}</p>
              <button type="button" onClick={() => complaintsQuery.refetch()} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">Coba lagi</button>
            </div>
          ) : (complaintsQuery.data?.data?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="font-semibold text-slate-700">Belum ada pengaduan</h3>
              <p className="mt-1 text-sm text-slate-500">Pengaduan yang sesuai filter akan muncul di sini.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr><th className="px-5 py-3">Tiket</th><th className="px-5 py-3">Pengaduan</th>{isSuperAdmin && <th className="px-5 py-3">Pelapor</th>}<th className="px-5 py-3">Status</th><th className="px-5 py-3">Dibuat</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complaintsQuery.data.data.map((complaint) => (
                        <tr key={complaint.id} onClick={() => navigate(`/pengaduan/${complaint.id}`)} className="cursor-pointer transition hover:bg-slate-50">
                          <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-red-600">{complaint.ticket_code}</td>
                          <td className="min-w-72 px-5 py-4"><p className="font-semibold text-slate-800">{complaint.title}</p><p className="mt-1 text-xs text-slate-500">{complaintLabel(complaintCategories, complaint.category)} ? {complaint.attachment_count || 0} screenshot</p></td>
                          {isSuperAdmin && <td className="px-5 py-4"><p className="font-medium text-slate-700">{complaint.reporter?.name}</p><p className="text-xs text-slate-500">{complaint.reporter?.organization || complaint.reporter?.role}</p></td>}
                          <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${complaintStatusClasses(complaint.status)}`}>{complaintLabel(complaintStatuses, complaint.status)}</span></td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatComplaintDate(complaint.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-3 md:hidden">
                {complaintsQuery.data.data.map((complaint) => (
                  <button key={complaint.id} type="button" onClick={() => navigate(`/pengaduan/${complaint.id}`)} className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                    <div className="flex items-start justify-between gap-3"><span className="font-mono text-xs font-semibold text-red-600">{complaint.ticket_code}</span><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${complaintStatusClasses(complaint.status)}`}>{complaintLabel(complaintStatuses, complaint.status)}</span></div>
                    <h3 className="mt-3 font-semibold text-slate-800">{complaint.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{complaintLabel(complaintCategories, complaint.category)}</span><span className={`rounded-md px-2 py-1 ${complaintImpactClasses(complaint.impact)}`}>{complaintLabel(complaintImpacts, complaint.impact)}</span></div>
                    {isSuperAdmin && <p className="mt-3 text-sm text-slate-600">{complaint.reporter?.name} ? {complaint.reporter?.organization || complaint.reporter?.role}</p>}
                    <p className="mt-2 text-xs text-slate-400">{formatComplaintDate(complaint.created_at)}</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
                <p className="text-sm text-slate-500">Halaman {complaintsQuery.data.current_page} dari {complaintsQuery.data.last_page} ? {complaintsQuery.data.total} tiket</p>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Sebelumnya</button>
                  <button type="button" disabled={page >= complaintsQuery.data.last_page} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">Berikutnya <ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <ComplaintSuccessModal result={successResult} onClose={closeSuccess} />
    </DashboardLayout>
  );
}
