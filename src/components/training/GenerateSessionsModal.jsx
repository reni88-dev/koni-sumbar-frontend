import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { useGenerateScheduleSessions } from '../../hooks/queries/useTraining';

export function GenerateSessionsModal({ schedule, onClose }) {
  const generate = useGenerateScheduleSessions();
  const [result, setResult] = useState(null);

  // Default: from today to 1 month from now
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const [dateFrom, setDateFrom] = useState(today.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(nextMonth.toISOString().split('T')[0]);

  const handleGenerate = async () => {
    try {
      const res = await generate.mutateAsync({
        scheduleId: schedule.id,
        dateFrom,
        dateTo,
      });
      setResult(res);
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    }
  };

  // Calculate expected sessions preview
  const previewCount = (() => {
    if (!dateFrom || !dateTo || !schedule.day_of_week?.length) return 0;
    let count = 0;
    const start = new Date(dateFrom);
    const end = new Date(dateTo);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (schedule.day_of_week.includes(d.getDay())) count++;
    }
    return count;
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Generate Sesi Latihan</h2>
            <p className="text-sm text-slate-500 mt-0.5">{schedule.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {result ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-slate-800">{result.count} Sesi Dibuat</p>
              <p className="text-sm text-slate-500 mt-1">Sesi latihan telah di-generate dan muncul di daftar</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Dari Tanggal</label>
                  <input
                    type="date" value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Sampai Tanggal</label>
                  <input
                    type="date" value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-indigo-800">
                    Estimasi: <strong>{previewCount} sesi</strong> akan dibuat
                  </p>
                  <p className="text-xs text-indigo-600 mt-0.5">
                    Sesi yang sudah ada pada tanggal yang sama akan di-skip (tidak duplikat)
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            {result ? 'Tutup' : 'Batal'}
          </button>
          {!result && (
            <button
              onClick={handleGenerate}
              disabled={generate.isPending || !dateFrom || !dateTo || previewCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
            >
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate {previewCount} Sesi
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
