import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Plus, Trash2, GripVertical, Loader2, AlertCircle, Check, X,
  FileText, Users, Settings, Save,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevEventDetail, useMonevEventCreate, useMonevEventUpdate, useAssignableUsers } from '../hooks/useMonev';

export default function MonevEventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const { data: existingData, loading: loadingDetail } = useMonevEventDetail(isEdit ? id : null);
  const { create, loading: creating, error: createError } = useMonevEventCreate();
  const { update, loading: updating, error: updateError } = useMonevEventUpdate();
  const { data: assignableUsers, loading: loadingUsers } = useAssignableUsers();

  const [form, setForm] = useState({
    name: '', description: '', start_date: '', end_date: '', status: 'draft',
  });
  const [items, setItems] = useState([{ group_name: 'Umum', question: '', is_negative: false }]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // Load existing data for edit
  useEffect(() => {
    if (!existingData || !isEdit) return;
    setForm({
      name: existingData.name || '',
      description: existingData.description || '',
      start_date: existingData.start_date?.split('T')[0] || '',
      end_date: existingData.end_date?.split('T')[0] || '',
      status: existingData.status || 'draft',
    });
    if (existingData.items?.length > 0) {
      setItems(existingData.items.map(i => ({
        group_name: i.group_name, question: i.question, is_negative: i.is_negative,
      })));
    }
    if (existingData.assignees?.length > 0) {
      setSelectedAssignees(existingData.assignees.map(a => a.user_id));
    }
  }, [existingData, isEdit]);

  const addItem = () => {
    const lastGroup = items.length > 0 ? items[items.length - 1].group_name : 'Umum';
    setItems([...items, { group_name: lastGroup, question: '', is_negative: false }]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const moveItem = (fromIdx, direction) => {
    const toIdx = fromIdx + direction;
    if (toIdx < 0 || toIdx >= items.length) return;
    const newItems = [...items];
    [newItems[fromIdx], newItems[toIdx]] = [newItems[toIdx], newItems[fromIdx]];
    setItems(newItems);
  };

  const toggleAssignee = (userId) => {
    setSelectedAssignees(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllAssignees = () => {
    if (selectedAssignees.length === assignableUsers.length) {
      setSelectedAssignees([]);
    } else {
      setSelectedAssignees(assignableUsers.map(u => u.id));
    }
  };

  const filteredUsers = assignableUsers.filter(u =>
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const canSubmit = form.name && items.some(i => i.question.trim()) && selectedAssignees.length > 0;

  const handleSubmit = async () => {
    const payload = {
      ...form,
      items: items.filter(i => i.question.trim()),
      assignees: selectedAssignees,
    };
    try {
      if (isEdit) await update(id, payload);
      else await create(payload);
      navigate('/monev');
    } catch {}
  };

  const error = createError || updateError;
  const submitting = creating || updating;

  if (isEdit && loadingDetail) return (
    <DashboardLayout title="Loading..."><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div></DashboardLayout>
  );

  // Group items by group_name for display
  const groups = [...new Set(items.map(i => i.group_name).filter(Boolean))];

  return (
    <DashboardLayout title={isEdit ? 'Edit Event Monev' : 'Buat Event Monev Baru'} subtitle="Kelola event monitoring & evaluasi">
      <button onClick={() => navigate('/monev')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ChevronLeft className="w-4 h-4" /> Kembali ke daftar
      </button>

      <div className="space-y-6">
        {/* Section 1: Event Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
            <Settings className="w-5 h-5 text-red-500" /> Informasi Event
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Event <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: Monitoring PLATPROV Batch 1"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Deskripsi singkat event monev ini..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none">
                <option value="draft">Draft</option>
                <option value="active">Aktif</option>
                <option value="closed">Ditutup</option>
                <option value="archived">Diarsipkan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Monitoring Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-red-500" /> Butir Monev <span className="text-sm font-normal text-slate-400">({items.length} butir)</span>
            </h3>
            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <Plus className="w-4 h-4" /> Tambah Butir
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100 group">
                <div className="flex flex-col gap-1 mt-2">
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                    className="p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-30"><GripVertical className="w-4 h-4" /></button>
                </div>
                <span className="text-sm font-bold text-slate-400 mt-3 w-6 text-right shrink-0">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={item.group_name} onChange={e => updateItem(idx, 'group_name', e.target.value)}
                      placeholder="Nama Grup" className="w-40 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-red-100 focus:border-red-300 outline-none bg-white" />
                    <input type="text" value={item.question} onChange={e => updateItem(idx, 'question', e.target.value)}
                      placeholder="Tulis pertanyaan/butir monev..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-red-100 focus:border-red-300 outline-none bg-white" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" checked={item.is_negative} onChange={e => updateItem(idx, 'is_negative', e.target.checked)}
                      className="rounded border-slate-300 text-red-500 focus:ring-red-200" />
                    <span>Logika negatif <span className="text-slate-400">(Jawab "Tidak" = skor positif, misal: pertanyaan kendala)</span></span>
                  </label>
                </div>
                <button onClick={() => removeItem(idx)} disabled={items.length <= 1}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 mt-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Assign Pemonev */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-500" /> Pemonev yang Ditugaskan <span className="text-sm font-normal text-slate-400">({selectedAssignees.length} dipilih)</span>
            </h3>
            <button onClick={selectAllAssignees} className="text-xs text-red-600 hover:text-red-700 font-medium">
              {selectedAssignees.length === assignableUsers.length ? 'Hapus Semua' : 'Pilih Semua'}
            </button>
          </div>

          <div className="mb-4">
            <input type="text" value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)}
              placeholder="Cari nama atau email pemonev..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none" />
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-red-600 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {filteredUsers.map(u => {
                const isSelected = selectedAssignees.includes(u.id);
                return (
                  <button key={u.id} onClick={() => toggleAssignee(u.id)} type="button"
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-slate-200 hover:border-red-200 hover:bg-slate-50'
                    }`}>
                    <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-colors ${
                      isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 truncate">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-red-800' : 'text-slate-700'}`}>{u.name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" /><p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <button onClick={() => navigate('/monev')} className="w-full sm:w-auto px-6 py-2.5 font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-500/20 transition-colors">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" /> {isEdit ? 'Update Event' : 'Simpan Event'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
