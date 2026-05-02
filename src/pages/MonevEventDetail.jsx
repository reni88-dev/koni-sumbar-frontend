import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit2, Loader2, Calendar, Users, FileText, CheckCircle2, XCircle,
  Eye, ClipboardCheck, AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevEventDetail, useMonevSubmissions } from '../hooks/useMonev';

function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-slate-100 text-slate-600', active: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600', archived: 'bg-violet-100 text-violet-600',
  };
  const labels = { draft: 'Draft', active: 'Aktif', closed: 'Ditutup', archived: 'Diarsipkan' };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
}

function ScoreBadge({ score, total }) {
  if (!total) return null;
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{score}/{total} ({pct}%)</span>;
}

export default function MonevEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: event, loading, error } = useMonevEventDetail(id);
  const { data: submissions, loading: loadingSubs, fetchData: fetchSubs } = useMonevSubmissions();

  useEffect(() => {
    if (id) fetchSubs({ event_id: id, per_page: 100 });
  }, [id, fetchSubs]);

  if (loading) return <DashboardLayout title="Loading..."><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div></DashboardLayout>;
  if (error || !event) return (
    <DashboardLayout title="Error">
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-2" /><p>{error || 'Event tidak ditemukan'}</p>
        <button onClick={() => navigate('/monev')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl">Kembali</button>
      </div>
    </DashboardLayout>
  );

  // Group items
  const groupedItems = {};
  (event.items || []).forEach(item => {
    if (!groupedItems[item.group_name]) groupedItems[item.group_name] = [];
    groupedItems[item.group_name].push(item);
  });

  return (
    <DashboardLayout title="Detail Event Monev" subtitle={event.name}>
      <button onClick={() => navigate('/monev')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
        <ChevronLeft className="w-4 h-4" /> Kembali ke daftar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Event Info */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">{event.name}</h2>
              <StatusBadge status={event.status} />
            </div>
            {event.description && <p className="text-sm text-slate-600">{event.description}</p>}

            <div className="space-y-3 pt-2 border-t border-slate-100">
              {event.start_date && (
                <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-blue-500" />
                  <div><div className="text-xs text-slate-400">Periode</div>
                    <div className="font-medium text-slate-700 text-sm">
                      {new Date(event.start_date).toLocaleDateString('id-ID')}
                      {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString('id-ID')}`}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-red-500" />
                <div><div className="text-xs text-slate-400">Butir Monev</div><div className="font-medium text-slate-700">{event.total_items} butir</div></div>
              </div>
              <div className="flex items-center gap-3"><Users className="w-5 h-5 text-violet-500" />
                <div><div className="text-xs text-slate-400">Pemonev Ditugaskan</div><div className="font-medium text-slate-700">{event.total_assignees} orang</div></div>
              </div>
              <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" />
                <div><div className="text-xs text-slate-400">Submission Masuk</div><div className="font-medium text-slate-700">{event.submission_count || 0} / {event.total_assignees}</div></div>
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-violet-500" /> Pemonev</h3>
            <div className="space-y-2">
              {(event.assignees || []).map((a, i) => {
                const hasSubmitted = submissions.some(s => s.created_by === a.user_id);
                return (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">{a.name.charAt(0)}</div>
                      <div>
                        <div className="text-sm font-medium text-slate-700 leading-none">{a.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{a.email}</div>
                      </div>
                    </div>
                    {hasSubmitted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => navigate(`/monev/events/${id}/edit`)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            <Edit2 className="w-4 h-4" /> Edit Event
          </button>
        </div>

        {/* Right: Items + Submissions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monitoring Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-red-500" /> Butir Monev ({event.total_items})</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {Object.entries(groupedItems).map(([group, gItems]) => (
                <div key={group}>
                  <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{group}</span>
                  </div>
                  {gItems.map((item, i) => (
                    <div key={item.id || i} className="px-5 py-3 flex items-start gap-3">
                      <span className="text-sm font-bold text-slate-400 mt-0.5 w-6 text-right shrink-0">{item.sort_order + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700">{item.question}</p>
                        {item.is_negative && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 mt-1">
                            Logika Negatif
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-green-500" /> Submission ({submissions.length})</h3>
            </div>
            {loadingSubs ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-red-600 animate-spin" /></div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <ClipboardCheck className="w-8 h-8 mb-2" /><p className="text-sm">Belum ada submission</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {submissions.map(sub => (
                  <div key={sub.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">{sub.creator_name?.charAt(0)}</div>
                      <div>
                        <div className="font-medium text-slate-700 text-sm">{sub.creator_name}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3" /> {new Date(sub.monitoring_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <span>•</span> {sub.cabor_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={sub.total_score} total={sub.total_items} />
                      <button onClick={() => navigate(`/monev/submissions/${sub.id}`)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
