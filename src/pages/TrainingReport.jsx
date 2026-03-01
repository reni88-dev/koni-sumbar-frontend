import { useState, useEffect } from 'react';
import { BarChart3, Users, UserCheck, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useTrainingReport } from '../hooks/queries/useTraining';
import { AthleteReportTable, CoachReportTable } from '../components/training';
import api from '../api/axios';

export function TrainingReportPage() {
  const [reportType, setReportType] = useState('athlete');
  const [caborId, setCaborId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cabors, setCabors] = useState([]);

  useEffect(() => {
    api.get('/api/cabors/all').then(r => setCabors(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => {});
  }, []);

  const { data, isLoading } = useTrainingReport({
    type: reportType,
    caborId: caborId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const reports = data?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Kehadiran Latihan</h1>
          <p className="text-sm text-slate-500 mt-1">Rekap kehadiran atlet dan pelatih dalam sesi latihan</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { key: 'athlete', label: 'Per Atlet', icon: Users },
                { key: 'coach', label: 'Per Pelatih', icon: UserCheck },
              ].map(tab => (
                <button key={tab.key} onClick={() => setReportType(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reportType === tab.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <select value={caborId} onChange={e => setCaborId(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm">
              <option value="">Semua Cabor</option>
              {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm" />
            <span className="self-center text-slate-400">s/d</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm" />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada data kehadiran</p>
          </div>
        ) : reportType === 'athlete' ? (
          <AthleteReportTable data={reports} />
        ) : (
          <CoachReportTable data={reports} />
        )}
      </div>
    </DashboardLayout>
  );
}
