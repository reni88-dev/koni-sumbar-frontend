import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Medal,
  Trophy,
  Calendar,
  Users,
  Activity,
  Loader2
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../api/axios';

export function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Total Atlet', value: '-', change: '', icon: Users, color: 'bg-blue-500' },
    { label: 'Cabang Olahraga', value: '-', change: '', icon: Trophy, color: 'bg-yellow-500' },
    { label: 'Medali Emas', value: '-', change: '', icon: Medal, color: 'bg-red-500' },
    { label: 'Event Aktif', value: '-', change: '', icon: Calendar, color: 'bg-green-500' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard/stats');
        const data = response.data;
        
        setStats([
          { label: 'Total Atlet', value: data.total_athletes.toLocaleString('id-ID'), change: 'Aktif', icon: Users, color: 'bg-blue-500' },
          { label: 'Cabang Olahraga', value: data.total_cabor.toString(), change: 'Cabor', icon: Trophy, color: 'bg-yellow-500' },
          { label: 'Medali Emas', value: data.gold_medals.toString(), change: '-', icon: Medal, color: 'bg-red-500' },
          { label: 'Event Aktif', value: data.active_events.toString(), change: 'Running', icon: Calendar, color: 'bg-green-500' },
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout 
      title="Dashboard Overview" 
      subtitle="Selamat datang kembali, berikut adalah ringkasan data hari ini."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                stat.change.includes('+') 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity / Content Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">Statistik Prestasi</h3>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-100">
              <option>Tahun Ini</option>
              <option>Tahun Lalu</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Grafik Statistik akan ditampilkan di sini</p>
            </div>
          </div>
        </div>

        {/* Recent Items */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Event Terbaru</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-100 flex-shrink-0 text-lg font-bold text-red-600">
                    {item + 10}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Porprov Sumbar {2026}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Stadion H. Agus Salim, Padang</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
            Lihat Semua Event
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
