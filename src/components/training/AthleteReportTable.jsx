import { motion } from 'framer-motion';

export function AthleteReportTable({ data }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">No</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Nama Atlet</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total Sesi</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Hadir</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Tidak Hadir</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Sakit</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Izin</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">% Kehadiran</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const pct = row.total > 0 ? Math.round((row.present / row.total) * 100) : 0;
              return (
                <motion.tr key={row.athlete_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-500">{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-800">{row.athlete_name}</td>
                  <td className="px-5 py-3 text-sm text-center text-slate-600">{row.total}</td>
                  <td className="px-5 py-3 text-sm text-center font-semibold text-green-600">{row.present}</td>
                  <td className="px-5 py-3 text-sm text-center font-semibold text-red-600">{row.absent}</td>
                  <td className="px-5 py-3 text-sm text-center text-yellow-600">{row.sick}</td>
                  <td className="px-5 py-3 text-sm text-center text-blue-600">{row.permission}</td>
                  <td className="px-5 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
