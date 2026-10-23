import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, ChevronLeft, ChevronRight, Clock3, Eye, Loader2, Mail, Search, Send, UserPlus, Users, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { usePermission } from '../hooks/usePermission';
import { useEmailBroadcastDetail, useEmailBroadcastHistory, useEmailBroadcastPorprovEvents, useEmailBroadcastRoles, useEmailBroadcastUsers, usePreviewEmailBroadcast, useSendEmailBroadcast } from '../hooks/queries/useEmailBroadcasts';
import { MEDALS } from '../components/athletes/porprovMedals';

const DEFAULT_DELAY = 2;
const MEDAL_RANKS = [{ rank: 1, key: 'gold' }, { rank: 2, key: 'silver' }, { rank: 3, key: 'bronze' }];
const TARGET_TYPE_LABELS = {
  roles: 'Berdasarkan role',
  users: 'User manual',
  athletes_all: 'Semua atlet Satu Data',
  porprov_event: 'Atlet per event Sirimau',
  porprov_medal: 'Peraih medali Sirimau',
};
const isEventTarget = (type) => type === 'porprov_event' || type === 'porprov_medal';
const medalNames = (ranks = []) => MEDAL_RANKS.filter(({ rank }) => ranks.includes(rank)).map(({ key }) => MEDALS[key].label).join(', ');
const LARGE_DELIVERY_THRESHOLD = 10000;
const apiError = (error, fallback) => error?.response?.data?.message || error?.response?.data?.error || fallback;

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}

function formatWIB(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' WIB';
}

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function formatDuration(seconds = 0) {
  if (seconds <= 0) return 'Tanpa waktu tunggu';
  const parts = [];
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  if (days) parts.push(`${days} hari`);
  if (hours) parts.push(`${hours} jam`);
  if (minutes) parts.push(`${minutes} menit`);
  if (remaining && parts.length < 2) parts.push(`${remaining} detik`);
  return `Sekitar ${parts.slice(0, 2).join(' ')}`;
}

function targetLabel(item) {
  if (item.target_type === 'roles') return (item.target_roles || []).map((role) => role.display_name).join(', ') || 'Role';
  if (item.target_type === 'athletes_all') return 'Seluruh atlet aktif dengan email';
  if (isEventTarget(item.target_type)) {
    const medals = item.target_type === 'porprov_medal' ? ` · Medali ${medalNames(item.medal_ranks)}` : '';
    return `${item.porprov_event_name || 'Event Sirimau'}${medals}`;
  }
  return (item.target_users || []).map((user) => user.name).join(', ') || 'User terpilih';
}

export function EmailBroadcastsPage() {
  const { can } = usePermission();
  const canSend = can('email_broadcasts.send');
  const [targetType, setTargetType] = useState('roles');
  const [selectedRoleIDs, setSelectedRoleIDs] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [porprovEventID, setPorprovEventID] = useState('');
  const [medalRanks, setMedalRanks] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(DEFAULT_DELAY);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [largeConfirmed, setLargeConfirmed] = useState(false);
  const submittingRef = useRef(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleID, setUserRoleID] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTargetType, setHistoryTargetType] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [detailID, setDetailID] = useState(null);
  const debouncedUserSearch = useDebouncedValue(userSearch);
  const debouncedHistorySearch = useDebouncedValue(historySearch);

  const rolesQuery = useEmailBroadcastRoles(canSend);
  const eventsQuery = useEmailBroadcastPorprovEvents(canSend && isEventTarget(targetType));
  const selectedEvent = (eventsQuery.data || []).find((event) => String(event.id) === String(porprovEventID));
  const userFilters = useMemo(() => ({ search: debouncedUserSearch, roleId: userRoleID, page: userPage, perPage: 10 }), [debouncedUserSearch, userPage, userRoleID]);
  const usersQuery = useEmailBroadcastUsers(userFilters, canSend && targetType === 'users');
  const historyFilters = useMemo(() => ({ search: debouncedHistorySearch, targetType: historyTargetType, page: historyPage, perPage: 10 }), [debouncedHistorySearch, historyPage, historyTargetType]);
  const historyQuery = useEmailBroadcastHistory(historyFilters);
  const previewMutation = usePreviewEmailBroadcast();
  const sendMutation = useSendEmailBroadcast();
  const selectedUserIDs = useMemo(() => new Set(selectedUsers.map((user) => user.user_id)), [selectedUsers]);

  useEffect(() => setUserPage(1), [debouncedUserSearch, userRoleID]);
  useEffect(() => setHistoryPage(1), [debouncedHistorySearch, historyTargetType]);

  const switchTargetType = (nextType) => {
    if (nextType === targetType) return;
    setTargetType(nextType);
    setPreview(null);
    setConfirmOpen(false);
    setLargeConfirmed(false);
    setSelectedUsers([]);
    setSelectedRoleIDs([]);
    if (!isEventTarget(nextType)) setPorprovEventID('');
    if (nextType !== 'porprov_medal') setMedalRanks([]);
  };
  const toggleMedal = (rank) => {
    setPreview(null);
    setMedalRanks((current) => current.includes(rank) ? current.filter((item) => item !== rank) : [...current, rank].sort());
  };
  const changeEvent = (value) => {
    setPreview(null);
    setPorprovEventID(value);
  };
  const toggleRole = (roleID) => setSelectedRoleIDs((current) => current.includes(roleID) ? current.filter((id) => id !== roleID) : [...current, roleID]);
  const toggleUser = (user) => setSelectedUsers((current) => current.some((item) => item.user_id === user.user_id) ? current.filter((item) => item.user_id !== user.user_id) : [...current, user]);
  const targetPayload = () => ({
    target_type: targetType,
    role_ids: targetType === 'roles' ? selectedRoleIDs : [],
    user_ids: targetType === 'users' ? selectedUsers.map((user) => user.user_id) : [],
    porprov_event_id: isEventTarget(targetType) ? Number(porprovEventID) : 0,
    medal_ranks: targetType === 'porprov_medal' ? medalRanks : [],
    delay_seconds: Number(delaySeconds),
  });
  const validateForm = () => {
    const delay = Number(delaySeconds);
    if (!subject.trim()) return 'Subjek wajib diisi.';
    if (subject.trim().length > 200) return 'Subjek maksimal 200 karakter.';
    if (!message.trim()) return 'Pesan wajib diisi.';
    if (message.trim().length > 20000) return 'Pesan maksimal 20.000 karakter.';
    if (!Number.isInteger(delay) || delay < 0 || delay > 300) return 'Jeda harus berupa angka bulat antara 0 dan 300 detik.';
    if (targetType === 'roles' && selectedRoleIDs.length === 0) return 'Pilih setidaknya satu role tujuan.';
    if (targetType === 'users' && selectedUsers.length === 0) return 'Pilih setidaknya satu user tujuan.';
    if (isEventTarget(targetType) && !porprovEventID) return 'Pilih event Sirimau terlebih dahulu.';
    if (targetType === 'porprov_medal' && medalRanks.length === 0) return 'Pilih setidaknya satu jenis medali.';
    return '';
  };
  const openPreview = async () => {
    const validationError = validateForm();
    if (validationError) return setFormError(validationError);
    setFormError('');
    setSuccessMessage('');
    try {
      setPreview(await previewMutation.mutateAsync(targetPayload()));
      setLargeConfirmed(false);
    } catch (error) {
      setFormError(apiError(error, 'Pratinjau penerima tidak dapat dibuat.'));
    }
  };
  const resetForm = () => {
    setTargetType('roles'); setSelectedRoleIDs([]); setSelectedUsers([]); setPorprovEventID(''); setMedalRanks([]); setSubject(''); setMessage('');
    setDelaySeconds(DEFAULT_DELAY); setUserSearch(''); setUserRoleID(''); setUserPage(1);
    setPreview(null); setConfirmOpen(false); setLargeConfirmed(false);
  };
  const sendBroadcast = async () => {
    if (submittingRef.current || sendMutation.isPending) return;
    if (preview?.recipient_count > LARGE_DELIVERY_THRESHOLD && !largeConfirmed) return;
    const validationError = validateForm();
    if (validationError) { setFormError(validationError); setConfirmOpen(false); setPreview(null); return; }
    submittingRef.current = true;
    setFormError('');
    try {
      await sendMutation.mutateAsync({ subject: subject.trim(), message: message.trim(), ...targetPayload() });
      resetForm();
      setSuccessMessage('Pengiriman email berhasil diterima dan akan diproses secara bertahap.');
    } catch (error) {
      setConfirmOpen(false);
      setFormError(apiError(error, 'Pengiriman email belum dapat diproses. Silakan coba lagi.'));
    } finally {
      submittingRef.current = false;
    }
  };
  const previewOversized = preview && preview.payload_size_bytes > preview.max_payload_size_bytes;
  const audienceDescription = targetType === 'athletes_all'
    ? 'seluruh atlet aktif di Satu Data'
    : `${targetType === 'porprov_medal' ? `peraih medali ${medalNames(medalRanks)}` : 'seluruh atlet'} pada ${selectedEvent?.name || 'event Sirimau'}`;

  return (
    <DashboardLayout title="Pengiriman Email" subtitle="Kirim satu kampanye email ke beberapa role atau user yang dipilih.">
      <div className="space-y-6">
        {successMessage && <Notice success>{successMessage}</Notice>}
        {formError && <Notice>{formError}</Notice>}
        {canSend && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-red-50 p-2.5 text-red-600"><Send className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Buat Pengiriman Baru</h2><p className="mt-0.5 text-sm text-slate-500">Penerima diproses bertahap sesuai jeda yang ditentukan.</p></div></div></div>
            <div className="space-y-6 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 lg:grid-cols-5">
                <Tab active={targetType === 'roles'} onClick={() => switchTargetType('roles')}>Berdasarkan Role</Tab>
                <Tab active={targetType === 'users'} onClick={() => switchTargetType('users')}>Pilih User Manual</Tab>
                <Tab active={targetType === 'athletes_all'} onClick={() => switchTargetType('athletes_all')}>Semua Atlet</Tab>
                <Tab active={targetType === 'porprov_event'} onClick={() => switchTargetType('porprov_event')}>Atlet per Event Sirimau</Tab>
                <Tab active={targetType === 'porprov_medal'} onClick={() => switchTargetType('porprov_medal')}>Peraih Medali Sirimau</Tab>
              </div>
              {targetType === 'roles' ? (
                <RoleSelector roles={rolesQuery.data || []} selectedRoleIDs={selectedRoleIDs} onToggle={toggleRole} loading={rolesQuery.isLoading} error={rolesQuery.isError ? apiError(rolesQuery.error, 'Daftar role tidak dapat dimuat.') : ''} />
              ) : targetType === 'athletes_all' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">Email dikirim ke seluruh atlet aktif di Satu Data yang memiliki alamat email valid, termasuk atlet tanpa akun login. Satu alamat email hanya menerima satu kali. Jumlah penerima ditampilkan pada langkah pratinjau.</div>
              ) : isEventTarget(targetType) ? (
                <AthleteAudienceSelector targetType={targetType} events={eventsQuery.data || []} loading={eventsQuery.isLoading} error={eventsQuery.isError ? apiError(eventsQuery.error, 'Daftar event Sirimau tidak dapat dimuat.') : ''} eventID={porprovEventID} onEventChange={changeEvent} medalRanks={medalRanks} onToggleMedal={toggleMedal} selectedEvent={selectedEvent} />
              ) : (
                <UserSelector roles={rolesQuery.data || []} usersResponse={usersQuery.data} loading={usersQuery.isLoading || usersQuery.isFetching} error={usersQuery.isError ? apiError(usersQuery.error, 'Daftar user tidak dapat dimuat.') : ''} search={userSearch} onSearch={setUserSearch} roleID={userRoleID} onRoleChange={setUserRoleID} page={userPage} onPageChange={setUserPage} selectedUsers={selectedUsers} selectedUserIDs={selectedUserIDs} onToggle={toggleUser} />
              )}
              <div className="grid gap-5 lg:grid-cols-[1fr_180px]">
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Subjek email</span><input type="text" value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} placeholder="Contoh: Informasi KONI Sumatera Barat" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50" /><span className="mt-1 block text-right text-xs text-slate-400">{subject.length}/200</span></label>
                <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Jeda antar-email</span><div className="relative"><input type="number" min="0" max="300" step="1" value={delaySeconds} onChange={(event) => setDelaySeconds(event.target.value === '' ? '' : Number(event.target.value))} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-16 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50" /><span className="absolute right-4 top-3 text-sm text-slate-400">detik</span></div><span className="mt-1 block text-xs text-slate-400">0–300 detik</span></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Pesan</span><textarea value={message} maxLength={20000} rows={8} onChange={(event) => setMessage(event.target.value)} placeholder="Tulis pesan plain text yang akan diterima seluruh penerima..." className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50" /><span className="mt-1 block text-right text-xs text-slate-400">{message.length}/20.000</span></label>
              <div className="flex justify-end"><button type="button" onClick={openPreview} disabled={previewMutation.isPending || sendMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}Tinjau Pengiriman</button></div>
            </div>
          </section>
        )}
        <HistorySection query={historyQuery} search={historySearch} onSearch={setHistorySearch} targetType={historyTargetType} onTargetType={setHistoryTargetType} page={historyPage} onPage={setHistoryPage} onDetail={setDetailID} />
      </div>
      {preview && !confirmOpen && <PreviewDialog preview={preview} targetType={targetType} selectedRoleCount={selectedRoleIDs.length} selectedUserCount={selectedUsers.length} targetDescription={audienceDescription} oversized={previewOversized} onClose={() => setPreview(null)} onContinue={() => setConfirmOpen(true)} />}
      {preview && confirmOpen && <ConfirmationDialog preview={preview} subject={subject} pending={sendMutation.isPending} largeConfirmed={largeConfirmed} onLargeConfirmed={setLargeConfirmed} onBack={() => setConfirmOpen(false)} onConfirm={sendBroadcast} />}
      {detailID && <HistoryDetailDialog id={detailID} onClose={() => setDetailID(null)} />}
    </DashboardLayout>
  );
}

function Notice({ success = false, children }) {
  const Icon = success ? Check : AlertCircle;
  return <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}><Icon className="mt-0.5 h-5 w-5 shrink-0" /><span>{children}</span></div>;
}

function Tab({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{children}</button>;
}
function RoleSelector({ roles, selectedRoleIDs, onToggle, loading, error }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-700">Role tujuan</span><span className="text-xs text-slate-400">{selectedRoleIDs.length} dipilih</span></div>
      {loading ? <Loading text="Memuat role..." /> : error ? <InlineError>{error}</InlineError> : (
        <div className="grid max-h-72 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const checked = selectedRoleIDs.includes(role.role_id);
            return (
              <button key={role.role_id} type="button" onClick={() => onToggle(role.role_id)} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${checked ? 'border-red-300 bg-red-50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{role.display_name}</span><span className="mt-0.5 block text-xs text-slate-500">{role.recipient_count.toLocaleString('id-ID')} penerima</span></span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white'}`}>{checked && <Check className="h-3.5 w-3.5" />}</span>
              </button>
            );
          })}
          {roles.length === 0 && <p className="col-span-full py-6 text-center text-sm text-slate-500">Belum ada role aktif.</p>}
        </div>
      )}
    </div>
  );
}

function AthleteAudienceSelector({ targetType, events, loading, error, eventID, onEventChange, medalRanks, onToggleMedal, selectedEvent }) {
  const isMedal = targetType === 'porprov_medal';
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Event Sirimau</span>
        {loading ? <Loading text="Memuat event Sirimau..." /> : error ? <InlineError>{error}</InlineError> : (
          <select value={eventID} onChange={(event) => onEventChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50">
            <option value="">Pilih event...</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.name} ({event.year}){isMedal && !event.results_published ? ' - hasil belum dipublikasikan' : ''}</option>)}
          </select>
        )}
      </label>
      {isMedal && (
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">Jenis medali</span><span className="text-xs text-slate-400">{medalRanks.length} dipilih</span></div>
          <div className="grid gap-2 sm:grid-cols-3">
            {MEDAL_RANKS.map(({ rank, key }) => {
              const checked = medalRanks.includes(rank);
              return (
                <button key={rank} type="button" onClick={() => onToggleMedal(rank)} aria-pressed={checked} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${checked ? 'border-red-300 bg-red-50 text-slate-800' : 'border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${MEDALS[key].className}`}>{MEDALS[key].label}</span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 bg-white'}`}>{checked && <Check className="h-3.5 w-3.5" />}</span>
                </button>
              );
            })}
          </div>
          {selectedEvent && !selectedEvent.results_published && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">Hasil event ini belum dipublikasikan, sehingga belum ada peraih medali yang dapat dikirimi email. Publikasikan hasil di aplikasi Sirimau terlebih dahulu.</p>}
        </div>
      )}
      <p className="text-sm leading-6 text-slate-500">{isMedal ? 'Penerima: atlet peraih medali terpilih yang pendaftarannya telah disahkan, pada hasil yang tidak ditolak. ' : 'Penerima: atlet dengan pendaftaran yang telah disahkan pada event ini. '}Atlet tanpa akun login ikut dikirimi selama email di data atlet valid.</p>
    </div>
  );
}

function UserSelector({ roles, usersResponse, loading, error, search, onSearch, roleID, onRoleChange, page, onPageChange, selectedUsers, selectedUserIDs, onToggle }) {
  const users = usersResponse?.data || [];
  const pagination = usersResponse?.pagination || { page: 1, total_pages: 0, total: 0 };
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">User terpilih</span><span className="text-xs text-slate-400">{selectedUsers.length} dipilih</span></div>
        <div className="flex min-h-12 flex-wrap gap-2 rounded-xl border border-slate-200 p-2">
          {selectedUsers.map((user) => <span key={user.user_id} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700"><span className="truncate">{user.name}</span><button type="button" onClick={() => onToggle(user)} aria-label={`Hapus ${user.name}`}><X className="h-3.5 w-3.5" /></button></span>)}
          {selectedUsers.length === 0 && <span className="px-2 py-1.5 text-sm text-slate-400">Belum ada user dipilih.</span>}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <label className="relative block"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari nama atau email..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-50" /></label>
        <select value={roleID} onChange={(event) => onRoleChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"><option value="">Semua role</option>{roles.map((role) => <option key={role.role_id} value={role.role_id}>{role.display_name}</option>)}</select>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        {error ? <InlineError>{error}</InlineError> : loading && !usersResponse ? <Loading text="Mencari user..." /> : (
          <>
            <div className="divide-y divide-slate-100">
              {users.map((user) => {
                const selected = selectedUserIDs.has(user.user_id);
                return (
                  <div key={user.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email} · {user.role_display_name}</p></div>
                    <button type="button" onClick={() => onToggle(user)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${selected ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>{selected ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}{selected ? 'Dipilih' : 'Pilih'}</button>
                  </div>
                );
              })}
              {users.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Tidak ada user dengan email valid yang ditemukan.</p>}
            </div>
            <PaginationBar pagination={pagination} page={page} onPage={onPageChange} loading={loading} />
          </>
        )}
      </div>
    </div>
  );
}

function PreviewDialog({ preview, targetType, selectedRoleCount, selectedUserCount, targetDescription, oversized, onClose, onContinue }) {
  return (
    <ModalShell title="Pratinjau Pengiriman" onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">Target: {targetType === 'roles' ? `${selectedRoleCount} role` : targetType === 'users' ? `${selectedUserCount} user manual` : targetDescription}.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={Users} label="Penerima valid" value={preview.recipient_count.toLocaleString('id-ID')} />
          <Metric icon={AlertTriangle} label="Data dilewati" value={preview.skipped_count.toLocaleString('id-ID')} />
          <Metric icon={Clock3} label="Perkiraan durasi" value={formatDuration(preview.estimated_duration_seconds)} />
          <Metric icon={Mail} label="Ukuran data" value={`${formatBytes(preview.payload_size_bytes)} / ${formatBytes(preview.max_payload_size_bytes)}`} />
        </div>
        {preview.skipped_count > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">Data dilewati karena email tidak valid, duplikat, atau profil penerima tidak aktif/lengkap.</div>}
        {oversized && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">Ukuran data melampaui kapasitas pengiriman. Persempit target atau hubungi administrator untuk menaikkan kapasitas.</div>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><SecondaryButton onClick={onClose}>Kembali</SecondaryButton><PrimaryButton onClick={onContinue} disabled={oversized}>Lanjutkan</PrimaryButton></div>
      </div>
    </ModalShell>
  );
}

function ConfirmationDialog({ preview, subject, pending, largeConfirmed, onLargeConfirmed, onBack, onConfirm }) {
  const isLarge = preview.recipient_count > LARGE_DELIVERY_THRESHOLD;
  return (
    <ModalShell title="Konfirmasi Pengiriman" onClose={pending ? undefined : onBack}>
      <div className="space-y-5">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subjek</p><p className="mt-1 font-bold text-slate-800">{subject}</p><p className="mt-3 text-sm text-slate-600">Email akan dikirim kepada <strong>{preview.recipient_count.toLocaleString('id-ID')} penerima</strong>. {formatDuration(preview.estimated_duration_seconds)}.</p></div>
        {isLarge && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><input type="checkbox" checked={largeConfirmed} onChange={(event) => onLargeConfirmed(event.target.checked)} disabled={pending} className="mt-1 h-4 w-4 accent-red-600" /><span>Ini adalah pengiriman besar ke <strong>{preview.recipient_count.toLocaleString('id-ID')} penerima</strong> dengan durasi {formatDuration(preview.estimated_duration_seconds).toLowerCase()}. Saya memahami proses akan berjalan bertahap.</span></label>
        )}
        <p className="text-sm leading-6 text-slate-500">Setelah dikonfirmasi, pengiriman tidak dapat diedit atau dibatalkan dari halaman ini.</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><SecondaryButton onClick={onBack} disabled={pending}>Kembali ke pratinjau</SecondaryButton><PrimaryButton onClick={onConfirm} disabled={pending || (isLarge && !largeConfirmed)}>{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? 'Mengirim...' : 'Kirim Sekarang'}</PrimaryButton></div>
      </div>
    </ModalShell>
  );
}

function Metric({ icon: Icon, label, value }) {
  return <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{createElement(Icon, { className: 'h-4 w-4' })}{label}</div><p className="mt-2 text-lg font-bold text-slate-800">{value}</p></div>;
}
function HistorySection({ query, search, onSearch, targetType, onTargetType, page, onPage, onDetail }) {
  const items = query.data?.data || [];
  const pagination = query.data?.pagination || { page: 1, total_pages: 0, total: 0 };
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><h2 className="font-bold text-slate-900">Riwayat Pengiriman</h2><p className="mt-1 text-sm text-slate-500">Daftar pengiriman email terdahulu.</p></div>
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[1fr_220px] sm:px-6">
        <label className="relative block"><Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari subjek, pesan, atau pengirim..." className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50" /></label>
        <select value={targetType} onChange={(event) => onTargetType(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"><option value="">Semua target</option>{Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {query.isLoading ? <Loading text="Memuat riwayat..." large /> : query.isError ? <div className="m-5"><InlineError>{apiError(query.error, 'Riwayat pengiriman tidak dapat dimuat.')}</InlineError></div> : items.length === 0 ? (
        <div className="px-5 py-16 text-center"><Mail className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Belum ada riwayat pengiriman.</p></div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Tujuan</th><th className="px-6 py-3">Tanggal</th><th className="px-6 py-3">Pengirim</th><th className="px-6 py-3 text-right">Detail</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="max-w-md px-6 py-4"><p className="font-semibold text-slate-800">{item.subject}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.message}</p></td>
                    <td className="max-w-xs px-6 py-4 text-sm text-slate-600"><span className="mb-1 block text-xs font-semibold uppercase text-slate-400">{TARGET_TYPE_LABELS[item.target_type] || item.target_type}</span>{targetLabel(item)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatWIB(item.sent_at)}</td>
                    <td className="px-6 py-4"><p className="text-sm font-semibold text-slate-700">{item.sent_by?.name}</p><p className="text-xs text-slate-500">{item.sent_by?.role_display_name || item.sent_by?.role}</p></td>
                    <td className="px-6 py-4 text-right"><button type="button" onClick={() => onDetail(item.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Lihat detail"><Eye className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 lg:hidden">
            {items.map((item) => <button key={item.id} type="button" onClick={() => onDetail(item.id)} className="block w-full p-5 text-left hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><p className="font-bold text-slate-800">{item.subject}</p><Eye className="h-4 w-4 shrink-0 text-slate-400" /></div><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.message}</p><p className="mt-3 text-xs text-slate-500">{targetLabel(item)} · {formatWIB(item.sent_at)}</p><p className="mt-1 text-xs font-semibold text-slate-600">{item.sent_by?.name} ({item.sent_by?.role_display_name || item.sent_by?.role})</p></button>)}
          </div>
          <PaginationBar pagination={pagination} page={page} onPage={onPage} loading={query.isFetching} />
        </>
      )}
    </section>
  );
}

function HistoryDetailDialog({ id, onClose }) {
  const [targetPage, setTargetPage] = useState(1);
  const detailQuery = useEmailBroadcastDetail(id, targetPage, 20);
  const item = detailQuery.data?.data;
  const pagination = detailQuery.data?.target_pagination;
  return (
    <ModalShell title="Detail Pengiriman" onClose={onClose} wide>
      {detailQuery.isLoading && !item ? <Loading text="Memuat detail..." large /> : detailQuery.isError ? <InlineError>{apiError(detailQuery.error, 'Detail pengiriman tidak dapat dimuat.')}</InlineError> : item ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2"><DetailField label="Subjek" value={item.subject} /><DetailField label="Tanggal pengiriman" value={formatWIB(item.sent_at)} /><DetailField label="Pengirim" value={`${item.sent_by?.name} (${item.sent_by?.role_display_name || item.sent_by?.role})`} /><DetailField label="Jenis target" value={TARGET_TYPE_LABELS[item.target_type] || item.target_type} />{isEventTarget(item.target_type) && <DetailField label="Event Sirimau" value={item.porprov_event_name} />}{item.target_type === 'porprov_medal' && <DetailField label="Medali" value={medalNames(item.medal_ranks)} />}</div>
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pesan</p><div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.message}</div></div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tujuan</p>
            {item.target_type === 'roles' ? <div className="flex flex-wrap gap-2">{(item.target_roles || []).map((role) => <span key={role.role_id} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{role.display_name}</span>)}</div> : (
              <div className="overflow-hidden rounded-xl border border-slate-200"><div className="divide-y divide-slate-100">{(item.target_users || []).map((user) => <div key={user.athlete_id ? `athlete-${user.athlete_id}` : user.user_id} className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email} · {user.role_display_name}</p></div>)}</div>{pagination && <PaginationBar pagination={pagination} page={targetPage} onPage={setTargetPage} loading={detailQuery.isFetching} />}</div>
            )}
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}

function DetailField({ label, value }) {
  return <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value || '-'}</p></div>;
}

function PaginationBar({ pagination, page, onPage, loading }) {
  if (!pagination || pagination.total_pages <= 1) return null;
  return <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm"><span className="text-xs text-slate-500">Total {pagination.total?.toLocaleString('id-ID') || 0}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-16 text-center text-xs font-semibold text-slate-600">{page} / {pagination.total_pages}</span><button type="button" disabled={page >= pagination.total_pages || loading} onClick={() => onPage(page + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></div>;
}

function ModalShell({ title, onClose, wide = false, children }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-xl'}`}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><h3 className="font-bold text-slate-900">{title}</h3>{onClose && <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>}</div><div className="p-5 sm:p-6">{children}</div></div></div>;
}

function Loading({ text, large = false }) {
  return <div className={`flex items-center justify-center text-sm text-slate-500 ${large ? 'py-16' : 'py-10'}`}><Loader2 className="mr-2 h-5 w-5 animate-spin" />{text}</div>;
}
function InlineError({ children }) {
  return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{children}</p>;
}
function PrimaryButton({ onClick, disabled = false, children }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{children}</button>;
}
function SecondaryButton({ onClick, disabled = false, children }) {
  return <button type="button" onClick={onClick} disabled={disabled} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{children}</button>;
}