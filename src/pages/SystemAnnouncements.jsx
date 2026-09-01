import { createElement, useMemo, useState } from 'react';
import { AlertCircle, Archive, BarChart3, CheckCircle2, Clock3, Edit3, Eye, FilePlus2, Loader2, Megaphone, Radio, Search, Send, Trash2, Users, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { AnnouncementModal } from '../components/announcements/AnnouncementModal';
import { announcementTargetLabel, formatJakartaDateTime, formatJakartaDateTimeInput, getAnnouncementError, getSeverityStyle, jakartaInputToRFC3339 } from '../components/announcements/announcementUtils';
import { usePermission } from '../hooks/usePermission';
import { useAdminAnnouncements, useAnnouncementRecipients, useAnnouncementRoles, useArchiveAnnouncement, useCreateAnnouncement, useDeleteAnnouncement, usePublishAnnouncement, useUpdateAnnouncement } from '../hooks/queries/useAnnouncements';

const lifecycleLabels = { draft: 'Draft', scheduled: 'Terjadwal', active: 'Aktif', expired: 'Berakhir', archived: 'Diarsipkan', published: 'Terbit' };
const lifecycleStyles = { draft: 'bg-slate-100 text-slate-700', scheduled: 'bg-violet-100 text-violet-700', active: 'bg-emerald-100 text-emerald-700', expired: 'bg-amber-100 text-amber-800', archived: 'bg-slate-800 text-white' };
const defaultStartsAt = () => formatJakartaDateTimeInput(new Date(Date.now() + 5 * 60 * 1000).toISOString());
const emptyForm = () => ({ title: '', body: '', severity: 'info', requiresAcknowledgement: false, targetAllRoles: true, roleIds: [], startsAt: defaultStartsAt(), endsAt: '', ctaLabel: '', ctaUrl: '' });
const announcementToForm = (item) => ({
  title: item.title || '', body: item.body || '', severity: item.severity || 'info', requiresAcknowledgement: Boolean(item.requires_acknowledgement),
  targetAllRoles: Boolean(item.target_all_roles), roleIds: (item.target_roles || []).map((role) => role.id),
  startsAt: formatJakartaDateTimeInput(item.starts_at), endsAt: formatJakartaDateTimeInput(item.ends_at), ctaLabel: item.cta_label || '', ctaUrl: item.cta_url || '',
});
const formPayload = (form, resendConfirmed = false) => ({
  title: form.title, body: form.body, severity: form.severity, requires_acknowledgement: form.requiresAcknowledgement,
  target_all_roles: form.targetAllRoles, role_ids: form.targetAllRoles ? [] : form.roleIds,
  starts_at: jakartaInputToRFC3339(form.startsAt), ends_at: form.endsAt ? jakartaInputToRFC3339(form.endsAt) : null,
  cta_label: form.ctaLabel.trim() || null, cta_url: form.ctaUrl.trim() || null, resend_confirmed: resendConfirmed,
});

function StatusBadge({ announcement }) {
  const status = announcement.status || announcement.lifecycle;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${lifecycleStyles[status] || lifecycleStyles.draft}`}>{lifecycleLabels[status] || status}</span>;
}

export function SystemAnnouncementsPage() {
  const { can } = usePermission();
  const [filters, setFilters] = useState({ page: 1, perPage: 15, search: '', lifecycle: '', severity: '', roleId: '' });
  const [formModal, setFormModal] = useState(null);
  const [reportAnnouncement, setReportAnnouncement] = useState(null);
  const [actionError, setActionError] = useState('');
  const announcementsQuery = useAdminAnnouncements(filters);
  const rolesQuery = useAnnouncementRoles(true);
  const publishMutation = usePublishAnnouncement();
  const archiveMutation = useArchiveAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const permissions = {
    create: can('announcements.create'), edit: can('announcements.edit'), publish: can('announcements.publish'),
    archive: can('announcements.archive'), delete: can('announcements.delete'), reports: can('announcements.reports'),
  };
  const announcements = announcementsQuery.data?.data || [];
  const pagination = announcementsQuery.data?.pagination || { page: 1, total_pages: 0, total: 0 };

  const performAction = async (callback, fallback) => {
    setActionError('');
    try { await callback(); } catch (error) { setActionError(getAnnouncementError(error, fallback)); }
  };
  const publish = (item) => {
    if (window.confirm(`Terbitkan pengumuman “${item.title}”? Penerima akan melihat pesan sesuai jadwal.`)) performAction(() => publishMutation.mutateAsync({ id: item.id }), 'Pengumuman belum dapat diterbitkan.');
  };
  const archive = (item) => {
    if (window.confirm(`Arsipkan pengumuman “${item.title}”? Pesan akan berhenti menjadi pop-up.`)) performAction(() => archiveMutation.mutateAsync({ id: item.id }), 'Pengumuman belum dapat diarsipkan.');
  };
  const remove = (item) => {
    if (window.confirm(`Hapus draft “${item.title}”?`)) performAction(() => deleteMutation.mutateAsync({ id: item.id }), 'Draft belum dapat dihapus.');
  };

  return (
    <DashboardLayout title="Pengumuman Sistem" subtitle="Buat pesan terjadwal berbasis role dan pantau penerimaannya.">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="relative sm:col-span-2 xl:col-span-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filters.search} onChange={(e) => setFilters((v) => ({ ...v, search: e.target.value, page: 1 }))} placeholder="Cari judul atau isi..." className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-500" /></label>
            <select value={filters.lifecycle} onChange={(e) => setFilters((v) => ({ ...v, lifecycle: e.target.value, page: 1 }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Semua status</option><option value="draft">Draft</option><option value="scheduled">Terjadwal</option><option value="active">Aktif</option><option value="expired">Berakhir</option><option value="archived">Diarsipkan</option></select>
            <select value={filters.severity} onChange={(e) => setFilters((v) => ({ ...v, severity: e.target.value, page: 1 }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Semua severity</option><option value="info">Informasi</option><option value="success">Berhasil</option><option value="warning">Peringatan</option><option value="critical">Kritis</option></select>
            <select value={filters.roleId} onChange={(e) => setFilters((v) => ({ ...v, roleId: e.target.value, page: 1 }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Semua target role</option>{(rolesQuery.data || []).map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}</select>
          </div>
          {permissions.create && <button type="button" onClick={() => setFormModal({ mode: 'create', announcement: null })} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"><FilePlus2 className="h-4 w-4" /> Buat Pengumuman</button>}
        </div>

        {actionError && <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{actionError}</div>}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {announcementsQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Memuat pengumuman...</div>
            : announcementsQuery.isError ? <div className="p-12 text-center text-red-600"><p>Daftar pengumuman belum dapat dimuat.</p><button type="button" onClick={() => announcementsQuery.refetch()} className="mt-3 font-bold">Coba lagi</button></div>
              : !announcements.length ? <div className="p-16 text-center text-slate-500"><Megaphone className="mx-auto mb-3 h-10 w-10 text-slate-300" />Belum ada pengumuman pada filter ini.</div>
                : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead className="bg-slate-50"><tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-3">Pengumuman</th><th className="px-5 py-3">Target</th><th className="px-5 py-3">Jadwal</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">
                  {announcements.map((item) => {
                    const severity = getSeverityStyle(item.severity);
                    const editable = item.lifecycle === 'draft' ? permissions.edit : item.lifecycle === 'published' && permissions.edit && permissions.publish;
                    return <tr key={item.id} className="align-top hover:bg-slate-50/60"><td className="max-w-md px-5 py-4"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severity.badge}`}>{severity.label}</span>{item.requires_acknowledgement && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">Wajib</span>}<span className="text-[10px] text-slate-400">v{item.delivery_version}</span></div><p className="mt-2 font-bold text-slate-900">{item.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.body}</p></td><td className="max-w-xs px-5 py-4 text-sm text-slate-600">{announcementTargetLabel(item)}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500"><p className="font-semibold text-slate-700">{formatJakartaDateTime(item.starts_at)}</p><p className="mt-1">s.d. {formatJakartaDateTime(item.ends_at)}</p></td><td className="px-5 py-4"><StatusBadge announcement={item} /></td><td className="px-5 py-4"><div className="flex min-w-max justify-end gap-1.5"><Action icon={Eye} title="Lihat" onClick={() => setFormModal({ mode: 'view', announcement: item })} />{permissions.reports && item.lifecycle !== 'draft' && <Action icon={BarChart3} title="Laporan" color="text-blue-600 hover:bg-blue-50" onClick={() => setReportAnnouncement(item)} />}{editable && <Action icon={Edit3} title="Edit" color="text-amber-600 hover:bg-amber-50" onClick={() => setFormModal({ mode: 'edit', announcement: item })} />}{permissions.publish && item.lifecycle === 'draft' && <Action icon={Send} title="Terbitkan" color="text-emerald-600 hover:bg-emerald-50" onClick={() => publish(item)} />}{permissions.archive && item.lifecycle === 'published' && <Action icon={Archive} title="Arsipkan" onClick={() => archive(item)} />}{permissions.delete && item.lifecycle === 'draft' && <Action icon={Trash2} title="Hapus" color="text-red-600 hover:bg-red-50" onClick={() => remove(item)} />}</div></td></tr>;
                  })}
                </tbody></table></div>}
          {pagination.total_pages > 1 && <div className="flex items-center justify-between border-t px-5 py-4 text-sm"><span className="text-slate-500">Total {pagination.total}</span><div className="flex items-center gap-2"><button type="button" disabled={filters.page <= 1} onClick={() => setFilters((v) => ({ ...v, page: v.page - 1 }))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sebelumnya</button><span>{filters.page} / {pagination.total_pages}</span><button type="button" disabled={filters.page >= pagination.total_pages} onClick={() => setFilters((v) => ({ ...v, page: v.page + 1 }))} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Berikutnya</button></div></div>}
        </div>
      </div>
      {formModal && <AnnouncementFormModal mode={formModal.mode} announcement={formModal.announcement} roles={rolesQuery.data || []} canPublish={permissions.publish} onActionError={setActionError} onClose={() => setFormModal(null)} />}
      {reportAnnouncement && <RecipientReportModal announcement={reportAnnouncement} onClose={() => setReportAnnouncement(null)} />}
    </DashboardLayout>
  );
}

function Action({ icon, title, onClick, color = 'text-slate-600 hover:bg-slate-100' }) {
  return <button type="button" onClick={onClick} className={`rounded-lg p-2 ${color}`} title={title}>{createElement(icon, { className: 'h-4 w-4' })}</button>;
}
function AnnouncementFormModal({ mode, announcement, roles, canPublish, onActionError, onClose }) {
  const readOnly = mode === 'view';
  const editing = mode === 'edit';
  const publishedEdit = editing && announcement?.lifecycle === 'published';
  const [form, setForm] = useState(() => announcement ? announcementToForm(announcement) : emptyForm());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [error, setError] = useState('');
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const publishMutation = usePublishAnnouncement();
  const pending = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;
  const preview = useMemo(() => ({
    id: 'preview', title: form.title || 'Judul pengumuman', body: form.body || 'Isi pengumuman akan tampil di sini.', severity: form.severity,
    requires_acknowledgement: form.requiresAcknowledgement, starts_at: jakartaInputToRFC3339(form.startsAt), ends_at: form.endsAt ? jakartaInputToRFC3339(form.endsAt) : null,
    cta_label: form.ctaLabel || null, cta_url: form.ctaUrl || null, delivery_version: announcement?.delivery_version || 1,
  }), [announcement?.delivery_version, form]);
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleRole = (roleID) => setForm((current) => ({ ...current, roleIds: current.roleIds.includes(roleID) ? current.roleIds.filter((id) => id !== roleID) : [...current.roleIds, roleID] }));
  const validate = () => {
    if (form.title.trim().length < 3) return 'Judul minimal 3 karakter.';
    if (!form.body.trim()) return 'Isi pengumuman wajib diisi.';
    if (!form.startsAt) return 'Jadwal mulai wajib diisi.';
    if (form.endsAt && form.endsAt <= form.startsAt) return 'Masa berlaku harus setelah jadwal mulai.';
    if (!form.targetAllRoles && !form.roleIds.length) return 'Pilih minimal satu target role.';
    if (Boolean(form.ctaLabel.trim()) !== Boolean(form.ctaUrl.trim())) return 'Label dan URL CTA harus diisi bersama.';
    const ctaURL = form.ctaUrl.trim();
    if (ctaURL && !((ctaURL.startsWith('/') && !ctaURL.startsWith('//')) || ctaURL.startsWith('https://'))) return 'URL CTA harus berupa path internal atau HTTPS.';
    return '';
  };
  const save = async (publishAfterSave) => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    let resendConfirmed = false;
    if (publishedEdit) {
      resendConfirmed = window.confirm('Perubahan pengumuman terbit akan menaikkan delivery version dan mengirim modal ulang kepada pengguna yang masih sesuai target. Lanjutkan?');
      if (!resendConfirmed) return;
    }
    setError('');
    let createdDraft = false;
    try {
      const saved = editing
        ? await updateMutation.mutateAsync({ id: announcement.id, payload: formPayload(form, resendConfirmed) })
        : await createMutation.mutateAsync(formPayload(form));
      createdDraft = !editing && Boolean(saved.data?.id);
      if (publishAfterSave && saved.data?.lifecycle === 'draft') await publishMutation.mutateAsync({ id: saved.data.id });
      onClose();
    } catch (mutationError) {
      const message = getAnnouncementError(mutationError, 'Pengumuman belum dapat disimpan.');
      if (createdDraft && publishAfterSave) {
        onActionError?.(`Draft berhasil disimpan, tetapi belum dapat diterbitkan: ${message}`);
        onClose();
        return;
      }
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <button type="button" aria-label="Tutup form" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => { if (!pending) onClose(); }} />
      <div className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h2 className="text-xl font-bold text-slate-900">{readOnly ? 'Detail Pengumuman' : editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}</h2><p className="text-xs text-slate-500">Semua waktu menggunakan Asia/Jakarta (WIB).</p></div><button type="button" onClick={onClose} disabled={pending} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <div className="overflow-y-auto p-5 sm:p-6">
          {error && <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div>}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <Field label="Judul"><input disabled={readOnly} value={form.title} maxLength={200} onChange={(e) => setField('title', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50" /></Field>
              <Field label="Isi plain text"><textarea disabled={readOnly} value={form.body} maxLength={10000} rows={8} onChange={(e) => setField('body', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50 resize-y leading-6" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{form.body.length}/10000</span></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Severity"><select disabled={readOnly} value={form.severity} onChange={(e) => setField('severity', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50"><option value="info">Informasi</option><option value="success">Berhasil</option><option value="warning">Peringatan</option><option value="critical">Kritis</option></select></Field>
                <Field label="Jenis pesan"><select disabled={readOnly} value={form.requiresAcknowledgement ? 'required' : 'normal'} onChange={(e) => setField('requiresAcknowledgement', e.target.value === 'required')} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50"><option value="normal">Normal — tampil sekali</option><option value="required">Wajib — harus dikonfirmasi</option></select></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mulai (WIB)"><input disabled={readOnly} type="datetime-local" value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50" /></Field>
                <Field label="Berakhir (opsional, WIB)"><input disabled={readOnly} type="datetime-local" value={form.endsAt} onChange={(e) => setField('endsAt', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label CTA (opsional)"><input disabled={readOnly} value={form.ctaLabel} maxLength={80} onChange={(e) => setField('ctaLabel', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50" placeholder="Buka halaman" /></Field>
                <Field label="URL internal / HTTPS"><input disabled={readOnly} value={form.ctaUrl} onChange={(e) => setField('ctaUrl', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-red-500 disabled:bg-slate-50" placeholder="/settings atau https://..." /></Field>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3"><div><p className="font-bold text-slate-800">Target penerima</p><p className="text-xs text-slate-500">Dievaluasi dari role pengguna saat pesan aktif.</p></div><label className="inline-flex items-center gap-2 text-sm font-semibold"><input disabled={readOnly} type="checkbox" checked={form.targetAllRoles} onChange={(e) => setField('targetAllRoles', e.target.checked)} className="h-4 w-4 accent-red-600" /> Semua role</label></div>
                {!form.targetAllRoles && <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2.5 text-sm hover:bg-slate-50"><input disabled={readOnly} type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} className="h-4 w-4 accent-red-600" /><span><strong className="block">{role.display_name}</strong><span className="text-xs text-slate-400">{role.name}</span></span></label>)}</div>}
              </div>
              <div className={`rounded-2xl border p-5 ${getSeverityStyle(form.severity).panel}`}><div className="flex items-center gap-2 text-sm font-bold"><Radio className="h-4 w-4" /> Ringkasan delivery</div><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>• {form.requiresAcknowledgement ? 'Modal tidak dapat ditutup sebelum konfirmasi berhasil.' : 'Modal tampil satu kali per delivery version.'}</li><li>• Target: {form.targetAllRoles ? 'semua role' : `${form.roleIds.length} role dipilih`}.</li><li>• Pengguna baru/berganti role menerima pesan selama masih aktif.</li>{publishedEdit && <li className="font-bold text-red-700">• Simpan akan menaikkan version dan mengirim ulang.</li>}</ul></div>
              {announcement && <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"><Meta label="Lifecycle" value={lifecycleLabels[announcement.status] || announcement.status} /><Meta label="Delivery version" value={announcement.delivery_version} /><Meta label="Dibuat" value={formatJakartaDateTime(announcement.created_at)} /><Meta label="Diperbarui" value={formatJakartaDateTime(announcement.updated_at)} /></div>}
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-bold"><Eye className="h-4 w-4" /> Preview</button><div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={onClose} disabled={pending} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold">Tutup</button>{!readOnly && <><button type="button" onClick={() => save(false)} disabled={pending} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{pending ? 'Menyimpan...' : publishedEdit ? 'Simpan & Kirim Ulang' : 'Simpan Draft'}</button>{!publishedEdit && canPublish && <button type="button" onClick={() => save(true)} disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Simpan & Terbitkan</button>}</>}</div></div>
      </div>
      {previewOpen && <AnnouncementModal announcement={preview} onClose={() => setPreviewOpen(false)} enforceAcknowledgement={false} />}
    </div>
  );
}

function Field({ label, children }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function Meta({ label, value }) { return <div><span className="block font-semibold text-slate-700">{label}</span>{value}</div>; }
function RecipientReportModal({ announcement, onClose }) {
  const [version, setVersion] = useState(announcement.delivery_version);
  const [page, setPage] = useState(1);
  const reportQuery = useAnnouncementRecipients({ id: announcement.id, version, page, perPage: 20 });
  const report = reportQuery.data;
  const versions = Array.from({ length: announcement.delivery_version }, (_, index) => announcement.delivery_version - index);
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-6">
      <button type="button" aria-label="Tutup laporan" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b p-5 sm:px-6"><div><h2 className="text-xl font-bold text-slate-900">Laporan Penerima</h2><p className="mt-1 text-sm text-slate-500">{announcement.title}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" /> Delivery version <select value={version} onChange={(e) => { setVersion(Number(e.target.value)); setPage(1); }} className="rounded-lg border px-3 py-1.5">{versions.map((item) => <option key={item} value={item}>Versi {item}</option>)}</select></div><span className="text-xs text-slate-500">Target saat ini ditambah pengguna dengan receipt historis versi terpilih.</span></div>
          {reportQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Memuat laporan...</div>
            : reportQuery.isError ? <div className="p-12 text-center text-red-600"><p>{getAnnouncementError(reportQuery.error, 'Laporan belum dapat dimuat.')}</p><button type="button" onClick={() => reportQuery.refetch()} className="mt-3 font-bold">Coba lagi</button></div>
              : <><div className="grid gap-3 sm:grid-cols-3"><ReportCard icon={Users} label="Total target" value={report?.total_target || 0} color="bg-blue-50 text-blue-600" /><ReportCard icon={Eye} label="Sudah melihat" value={report?.seen_count || 0} color="bg-amber-50 text-amber-600" /><ReportCard icon={CheckCircle2} label="Sudah konfirmasi" value={report?.acknowledged_count || 0} color="bg-emerald-50 text-emerald-600" /></div>
                <div className="mt-5 overflow-x-auto rounded-2xl border"><table className="min-w-full divide-y text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Pengguna</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Dilihat</th><th className="px-4 py-3">Dikonfirmasi</th></tr></thead><tbody className="divide-y">{(report?.recipients || []).map((recipient) => <tr key={recipient.user_id}><td className="px-4 py-3"><strong className="block">{recipient.name}</strong><span className="text-xs text-slate-500">{recipient.email}</span></td><td className="px-4 py-3">{recipient.role_display_name}</td><td className="px-4 py-3 text-xs">{formatJakartaDateTime(recipient.seen_at)}</td><td className="px-4 py-3 text-xs">{formatJakartaDateTime(recipient.acknowledged_at)}</td></tr>)}</tbody></table>{!report?.recipients?.length && <div className="p-10 text-center text-sm text-slate-500">Belum ada pengguna pada laporan versi ini.</div>}</div>
                {report?.pagination?.total_pages > 1 && <div className="mt-4 flex justify-end gap-2 text-sm"><button type="button" disabled={page <= 1} onClick={() => setPage((v) => v - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sebelumnya</button><span>{page} / {report.pagination.total_pages}</span><button type="button" disabled={page >= report.pagination.total_pages} onClick={() => setPage((v) => v + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Berikutnya</button></div>}</>}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ icon, label, value, color }) {
  return <div className="rounded-2xl border p-4"><div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{createElement(icon, { className: 'h-5 w-5' })}</div><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-500">{label}</p></div>;
}