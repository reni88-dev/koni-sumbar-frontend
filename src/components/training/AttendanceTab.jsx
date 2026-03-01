import { Users, Save, Loader2 } from 'lucide-react';
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from './trainingConstants';

export function AttendanceTab({
  attendanceData,
  isOngoing,
  isCompleted,
  onUpdateAttendance,
  onMarkAllPresent,
  onSaveAttendance,
  isSaving,
}) {
  const totalCount = attendanceData.length;
  const presentCount = attendanceData.filter(a => a.status === 'present').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: totalCount, color: 'bg-slate-50 text-slate-700' },
          { label: 'Hadir', value: presentCount, color: 'bg-green-50 text-green-700' },
          { label: 'Sakit', value: attendanceData.filter(a => a.status === 'sick').length, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Izin', value: attendanceData.filter(a => a.status === 'permission').length, color: 'bg-blue-50 text-blue-700' },
        ].map(stat => (
          <div key={stat.label} className={`p-3 rounded-xl text-center ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {(isOngoing || isCompleted) && attendanceData.length > 0 && (
        <>
          {isOngoing && (
            <div className="flex justify-between items-center">
              <button onClick={onMarkAllPresent} className="text-sm text-green-600 hover:text-green-700 font-medium">
                ✓ Tandai Semua Hadir
              </button>
              <button onClick={onSaveAttendance} disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Absensi
              </button>
            </div>
          )}

          <div className="space-y-2">
            {attendanceData.map((a, i) => (
              <div key={a.athlete_id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{a.athlete_name}</div>
                </div>
                {isOngoing ? (
                  <div className="flex gap-1">
                    {['present', 'absent', 'sick', 'permission'].map(s => (
                      <button key={s} onClick={() => onUpdateAttendance(a.athlete_id, 'status', s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          a.status === s ? ATTENDANCE_STATUS_COLORS[s] : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                        }`}>
                        {ATTENDANCE_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${ATTENDANCE_STATUS_COLORS[a.status]}`}>
                    {ATTENDANCE_STATUS_LABELS[a.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {attendanceData.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Belum ada atlet terdaftar untuk sesi ini</p>
        </div>
      )}
    </div>
  );
}
