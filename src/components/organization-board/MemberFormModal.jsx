import { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, Search, CheckCircle2, UserPlus, Users } from 'lucide-react';
import {
  useAddDecreeMember,
  useUpdateDecreeMember,
  useBoardCandidates,
  lookupBoardNIK,
  getDecreeErrorMessage,
  BOARD_CANDIDATE_MIN_QUERY,
} from '../../hooks/queries/useOrganizationDecrees';
import { BOARD_SOURCE_LABELS, GENDER_LABELS } from './boardLabels';

const POSITION_SUGGESTIONS = [
  'Ketua Umum', 'Wakil Ketua Umum', 'Ketua Harian', 'Sekretaris Umum', 'Wakil Sekretaris',
  'Bendahara Umum', 'Wakil Bendahara', 'Ketua Bidang', 'Anggota',
];

const inputClass = 'w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm';
const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function CandidateCard({ candidate, note }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        {candidate.name}
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          {BOARD_SOURCE_LABELS[candidate.source_type] || candidate.source_type}
        </span>
      </p>
      <p className="mt-1 text-xs text-emerald-700">
        {[GENDER_LABELS[candidate.gender], candidate.cabor_name, candidate.organization_name].filter(Boolean).join(' · ') || '-'}
      </p>
      {note && <p className="mt-1 text-xs text-emerald-700">{note}</p>}
    </div>
  );
}

// MemberFormModal adds a pengurus (edit mode changes only jabatan and urutan).
export function MemberFormModal({ isOpen, organizationId, decreeId, member, defaultSortOrder, onClose, onSaved }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <MemberForm
          key={member?.id ?? 'new'}
          organizationId={organizationId}
          decreeId={decreeId}
          member={member}
          defaultSortOrder={defaultSortOrder}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </AnimatePresence>
  );
}

function MemberForm({ organizationId, decreeId, member, defaultSortOrder, onClose, onSaved }) {
  const isEdit = Boolean(member);
  const [tab, setTab] = useState('satudata');
  const [positionTitle, setPositionTitle] = useState(member?.position_title || '');
  const [sortOrder, setSortOrder] = useState(String(member?.sort_order ?? defaultSortOrder ?? 0));
  const [error, setError] = useState('');

  // Tab "Dari Satudata": pick an athlete or coach by name.
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const candidatesQuery = useBoardCandidates(isEdit ? '' : debouncedSearch);
  const [selected, setSelected] = useState(null);

  // Tab "Pengurus Baru": NIK is checked against Satudata as soon as it has 16 digits.
  const [nik, setNik] = useState('');
  // The last lookup result, tagged with the NIK it belongs to; the shown status is derived from it.
  const [nikResult, setNikResult] = useState({ nik: '', status: 'idle', candidate: null });
  const nikCheck = nik.length !== 16
    ? { status: 'idle', candidate: null }
    : nikResult.nik === nik ? nikResult : { status: 'checking', candidate: null };
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');

  const addMember = useAddDecreeMember(organizationId);
  const updateMember = useUpdateDecreeMember(organizationId);
  const isPending = addMember.isPending || updateMember.isPending;

  useEffect(() => {
    if (nik.length !== 16) return undefined;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const result = await lookupBoardNIK(nik, controller.signal);
        setNikResult(result?.found
          ? { nik, status: 'found', candidate: result.candidate }
          : { nik, status: 'not_found', candidate: null });
      } catch (lookupError) {
        if (controller.signal.aborted) return;
        setNikResult({ nik, status: 'error', candidate: null, message: getDecreeErrorMessage(lookupError, 'NIK belum dapat diperiksa.') });
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [nik]);

  const buildPayload = () => {
    const base = { position_title: positionTitle.trim(), sort_order: Number(sortOrder) || 0 };
    if (isEdit) return base;
    if (tab === 'satudata') {
      return selected.source_type === 'athlete'
        ? { ...base, source_type: 'athlete', athlete_id: selected.id }
        : { ...base, source_type: 'coach', coach_id: selected.id };
    }
    const payload = { ...base, source_type: 'person', nik };
    if (nikCheck.status === 'not_found') {
      payload.name = name.trim();
      payload.gender = gender;
    }
    return payload;
  };

  const validate = () => {
    if (!positionTitle.trim()) return 'Jabatan wajib diisi';
    const order = Number(sortOrder);
    if (!Number.isInteger(order) || order < 0 || order > 9999) return 'Urutan harus angka 0–9999';
    if (isEdit) return '';
    if (tab === 'satudata') return selected ? '' : 'Pilih atlet atau pelatih terlebih dahulu';
    if (nik.length !== 16) return 'NIK harus 16 digit angka';
    if (nikCheck.status === 'checking' || nikCheck.status === 'idle') return 'Tunggu pemeriksaan NIK selesai';
    if (nikCheck.status === 'error') return nikCheck.message;
    if (nikCheck.status === 'not_found') {
      if (!name.trim()) return 'Nama wajib diisi untuk pengurus baru';
      if (!gender) return 'Jenis kelamin wajib dipilih';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isPending) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    try {
      if (isEdit) {
        await updateMember.mutateAsync({ decreeId, memberId: member.id, data: buildPayload() });
        onSaved?.('Pengurus berhasil diperbarui');
        return;
      }
      const created = await addMember.mutateAsync({ decreeId, data: buildPayload() });
      const linked = tab === 'nik' && created?.source_type && created.source_type !== 'person';
      onSaved?.(linked
        ? `NIK terdaftar sebagai ${BOARD_SOURCE_LABELS[created.source_type]}; data ${created.name} diambil dari Satudata`
        : 'Pengurus berhasil ditambahkan');
    } catch (saveError) {
      setError(getDecreeErrorMessage(saveError, 'Gagal menyimpan pengurus. Silakan coba lagi.'));
    }
  };

  const candidates = candidatesQuery.data || [];
  const searchTooShort = debouncedSearch.trim().length < BOARD_CANDIDATE_MIN_QUERY;

  return (
    <>
      <Motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={isPending ? undefined : onClose}
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-form-title"
          className="pointer-events-auto bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 id="member-form-title" className="text-lg font-bold text-slate-800">
              {isEdit ? `Edit Pengurus: ${member.name}` : 'Tambah Pengurus'}
            </h2>
            <button type="button" onClick={onClose} disabled={isPending} className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50" aria-label="Tutup">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
            {error && (
              <div role="alert" className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {!isEdit && (
              <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {[
                  { id: 'satudata', label: 'Atlet / Pelatih', icon: <Users className="w-4 h-4" /> },
                  { id: 'nik', label: 'Pengurus Baru (NIK)', icon: <UserPlus className="w-4 h-4" /> },
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => { setTab(id); setError(''); }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                      tab === id ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {icon}{label}
                  </button>
                ))}
              </div>
            )}

            {!isEdit && tab === 'satudata' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="candidate_search" className={labelClass}>Cari Nama Atlet / Pelatih</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="candidate_search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`${inputClass} pl-9`}
                      placeholder={`Ketik minimal ${BOARD_CANDIDATE_MIN_QUERY} huruf`}
                      autoComplete="off"
                    />
                  </div>
                </div>
                {selected ? (
                  <div className="space-y-2">
                    <CandidateCard candidate={selected} />
                    <button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-red-600 hover:underline">
                      Ganti pilihan
                    </button>
                  </div>
                ) : searchTooShort ? null : candidatesQuery.isLoading ? (
                  <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Mencari...</p>
                ) : candidatesQuery.isError ? (
                  <p className="text-sm text-red-600">{getDecreeErrorMessage(candidatesQuery.error, 'Pencarian gagal. Silakan coba lagi.')}</p>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Tidak ada atlet atau pelatih dengan nama tersebut. Gunakan tab <strong>Pengurus Baru (NIK)</strong>.
                  </p>
                ) : (
                  <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                    {candidates.map((candidate) => (
                      <li key={`${candidate.source_type}-${candidate.id}`}>
                        <button
                          type="button"
                          onClick={() => setSelected(candidate)}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            {candidate.name}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              {BOARD_SOURCE_LABELS[candidate.source_type]}
                            </span>
                          </span>
                          <span className="block text-xs text-slate-500">
                            {[candidate.cabor_name, candidate.organization_name].filter(Boolean).join(' · ') || '-'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!isEdit && tab === 'nik' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="board_nik" className={labelClass}>NIK <span className="text-red-500">*</span></label>
                  <input
                    id="board_nik"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className={inputClass}
                    placeholder="16 digit NIK"
                  />
                  <p className="mt-1 text-xs text-slate-500">NIK otomatis dicek ke data atlet dan pelatih Satudata.</p>
                </div>
                {nikCheck.status === 'checking' && (
                  <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Memeriksa NIK...</p>
                )}
                {nikCheck.status === 'error' && <p className="text-sm text-red-600">{nikCheck.message}</p>}
                {nikCheck.status === 'found' && (
                  <CandidateCard
                    candidate={nikCheck.candidate}
                    note={nikCheck.candidate.source_type === 'person'
                      ? 'NIK sudah tercatat sebagai pengurus; data yang ada akan dipakai.'
                      : 'NIK ditemukan di Satudata; data akan diambil dari sana.'}
                  />
                )}
                {nikCheck.status === 'not_found' && (
                  <>
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      NIK tidak ditemukan di Satudata. Lengkapi data dasar pengurus baru.
                    </p>
                    <div>
                      <label htmlFor="board_name" className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
                      <input id="board_name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={255} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="board_gender" className={labelClass}>Jenis Kelamin <span className="text-red-500">*</span></label>
                      <select id="board_gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                        <option value="">Pilih jenis kelamin</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="position_title" className={labelClass}>Jabatan <span className="text-red-500">*</span></label>
                <input
                  id="position_title"
                  type="text"
                  list="position_suggestions"
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  maxLength={100}
                  className={inputClass}
                  placeholder="Contoh: Ketua Umum"
                />
                <datalist id="position_suggestions">
                  {POSITION_SUGGESTIONS.map((title) => <option key={title} value={title} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor="sort_order" className={labelClass}>Urutan</label>
                <input
                  id="sort_order"
                  type="number"
                  min={0}
                  max={9999}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} disabled={isPending} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                Batal
              </button>
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? 'Simpan' : 'Tambah Pengurus'}
              </button>
            </div>
          </form>
        </div>
      </Motion.div>
    </>
  );
}
