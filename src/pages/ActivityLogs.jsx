import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Database,
  MoreHorizontal,
  Eye,
  X,
  Plus,
  Edit,
  Trash,
  RotateCcw,
  Clock,
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogIn,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  useActivityLogs,
  useActivityLogStats,
  useActivityLogUsers,
  useActivityLogDetail,
  useCleanupActivityLogs,
  exportActivityLogs,
  useErrorLogs,
  useErrorLogStats,
  useResolveError,
  useUserActivity,
} from '../hooks/queries/useActivityLogs';

// Action badge colors
const ACTION_COLORS = {
  created: 'bg-green-100 text-green-700 border-green-200',
  updated: 'bg-blue-100 text-blue-700 border-blue-200',
  deleted: 'bg-red-100 text-red-700 border-red-200',
  restored: 'bg-purple-100 text-purple-700 border-purple-200',
};

const ACTION_ICONS = {
  created: Plus,
  updated: Edit,
  deleted: Trash,
  restored: RotateCcw,
};

const ACTION_LABELS = {
  created: 'Membuat',
  updated: 'Memperbarui',
  deleted: 'Menghapus',
  restored: 'Memulihkan',
};

// Stats Card Component
function StatsCard({ label, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Data Diff Viewer Component
function DataDiffViewer({ oldValues, newValues, changedFields }) {
  if (!changedFields || changedFields.length === 0) {
    return <p className="text-sm text-slate-500 italic">Tidak ada perubahan data</p>;
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-slate-700 mb-3">Perubahan Data:</h4>
      <div className="space-y-2">
        {changedFields.map((field) => (
          <div key={field} className="flex items-start gap-4 text-sm">
            <span className="font-medium text-slate-600 w-32 shrink-0">{field}:</span>
            <div className="flex-1 flex gap-2">
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded line-through">
                {JSON.stringify(oldValues?.[field]) ?? 'null'}
              </span>
              <span className="text-slate-400">→</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                {JSON.stringify(newValues?.[field]) ?? 'null'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Log Item Component
function ActivityLogItem({ log, onViewDetail }) {
  const ActionIcon = ACTION_ICONS[log.action] || Activity;
  const timeAgo = useMemo(() => {
    const date = new Date(log.created_at);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [log.created_at]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition-colors shadow-sm"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
          {log.user_name?.[0]?.toUpperCase() || 'S'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-800">{log.user_name || 'System'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action]}`}>
              <ActionIcon className="w-3 h-3 inline mr-1" />
              {ACTION_LABELS[log.action]}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              {log.model_name}
            </span>
          </div>
          
          <p className="text-sm text-slate-600">
            {log.record_name ? (
              <>
                {ACTION_LABELS[log.action]} <span className="font-medium">"{log.record_name}"</span>
              </>
            ) : (
              <>
                {ACTION_LABELS[log.action]} record ID #{log.model_id}
              </>
            )}
          </p>

          {/* Changed fields summary */}
          {log.changed_fields && log.changed_fields.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              Field berubah: {log.changed_fields.slice(0, 3).join(', ')}
              {log.changed_fields.length > 3 && ` +${log.changed_fields.length - 3} lainnya`}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            {log.ip_address && (
              <span>IP: {log.ip_address}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={() => onViewDetail(log)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          title="Lihat Detail"
        >
          <Eye className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </motion.div>
  );
}

// Detail Modal Component
function DetailModal({ log, onClose }) {
  if (!log) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Detail Activity Log</h2>
            <p className="text-sm text-slate-500">ID: {log.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">User</label>
              <p className="font-medium text-slate-800">{log.user_name || 'System'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Waktu</label>
              <p className="font-medium text-slate-800">
                {new Date(log.created_at).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Aksi</label>
              <p className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ACTION_COLORS[log.action]}`}>
                {ACTION_LABELS[log.action]}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Model</label>
              <p className="font-medium text-slate-800">{log.model_name}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Record ID</label>
              <p className="font-medium text-slate-800">{log.model_id}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Nama Record</label>
              <p className="font-medium text-slate-800">{log.record_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">IP Address</label>
              <p className="font-medium text-slate-800">{log.ip_address || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">URL</label>
              <p className="font-medium text-slate-800 text-xs truncate" title={log.url}>
                {log.url || '-'}
              </p>
            </div>
          </div>

          {/* Data Diff */}
          {log.action === 'updated' && (
            <DataDiffViewer
              oldValues={log.old_values}
              newValues={log.new_values}
              changedFields={log.changed_fields}
            />
          )}

          {/* New Values for Created */}
          {log.action === 'created' && log.new_values && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">Data Baru:</h4>
              <pre className="text-xs text-green-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(log.new_values, null, 2)}
              </pre>
            </div>
          )}

          {/* Old Values for Deleted */}
          {log.action === 'deleted' && log.old_values && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">Data Dihapus:</h4>
              <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(log.old_values, null, 2)}
              </pre>
            </div>
          )}

          {/* User Agent */}
          {log.user_agent && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">User Agent</label>
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 break-all">
                {log.user_agent}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Severity colors for error logs
const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  critical: 'bg-purple-100 text-purple-700 border-purple-200',
};

const SEVERITY_LABELS = {
  info: 'Info',
  warning: 'Peringatan',
  error: 'Error',
  critical: 'Kritis',
};

// Error Log Item Component
function ErrorLogItem({ log, onResolve }) {
  const timeAgo = useMemo(() => {
    const date = new Date(log.created_at);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [log.created_at]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 border shadow-sm ${log.is_resolved ? 'border-green-200 bg-green-50/30' : 'border-slate-200 hover:border-slate-300'} transition-colors`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${log.is_resolved ? 'bg-green-100' : 'bg-red-100'}`}>
          {log.is_resolved ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-800">{log.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[log.severity]}`}>
              {SEVERITY_LABELS[log.severity]}
            </span>
            {log.is_resolved && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Resolved
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-600">{log.message}</p>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            <span>{log.user_name || 'Guest'}</span>
            {log.url && (
              <span className="truncate max-w-[150px]" title={log.url}>{log.url}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!log.is_resolved && (
          <button
            onClick={() => onResolve(log.id)}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
            title="Tandai Resolved"
          >
            Resolve
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Main Activity Logs Page with Tabs
export function ActivityLogsPage() {
  const [activeTab, setActiveTab] = useState('activity'); // 'activity', 'error', or 'users'
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Activity Log Hooks
  const { data: logsData, isLoading: logsLoading } = useActivityLogs({ ...filters, page, per_page: 15 });
  const { data: stats, isLoading: statsLoading } = useActivityLogStats();
  const { data: users = [] } = useActivityLogUsers();
  const cleanupMutation = useCleanupActivityLogs();

  // Error Log Hooks
  const { data: errorData, isLoading: errorLoading } = useErrorLogs({ ...filters, page, per_page: 15 });
  const { data: errorStats } = useErrorLogStats();
  const resolveErrorMutation = useResolveError();

  // User Activity Hooks
  const { data: userActivityData, isLoading: userActivityLoading } = useUserActivity();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportActivityLogs(filters);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanup = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus log yang lebih dari 90 hari?')) {
      cleanupMutation.mutate(90);
    }
  };

  const handleResolveError = (id) => {
    if (window.confirm('Tandai error ini sebagai resolved?')) {
      resolveErrorMutation.mutate({ id });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">System Logs</h1>
            <p className="text-slate-500">Pantau aktivitas dan error dalam sistem</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup
            </button>
            {activeTab === 'activity' && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => { setActiveTab('activity'); setPage(1); setFilters({}); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'activity' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Activity className="w-4 h-4" />
            Activity Log
            {stats?.today > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {stats.today}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('error'); setPage(1); setFilters({}); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'error' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Error Log
            {errorStats?.unresolved > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                {errorStats.unresolved}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('users'); setPage(1); setFilters({}); }}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users' 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            User Activity
          </button>
        </div>

        {/* Stats Cards */}
        {activeTab === 'activity' && !statsLoading && stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Aktivitas" value={stats.total?.toLocaleString() || 0} icon={Activity} color="blue" />
            <StatsCard label="Hari Ini" value={stats.today?.toLocaleString() || 0} icon={TrendingUp} color="green" />
            <StatsCard label="Minggu Ini" value={stats.this_week?.toLocaleString() || 0} icon={Calendar} color="purple" />
            <StatsCard label="Model Tercatat" value={stats.models?.length || 0} icon={Database} color="blue" />
          </div>
        )}

        {activeTab === 'error' && errorStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Error" value={errorStats.total?.toLocaleString() || 0} icon={AlertTriangle} color="red" />
            <StatsCard label="Belum Resolved" value={errorStats.unresolved?.toLocaleString() || 0} icon={XCircle} color="red" />
            <StatsCard label="Hari Ini" value={errorStats.today?.toLocaleString() || 0} icon={TrendingUp} color="purple" />
            <StatsCard label="Kritis" value={errorStats.by_severity?.critical?.toLocaleString() || 0} icon={AlertTriangle} color="purple" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'activity' ? "Cari nama record atau user..." : "Cari error..."}
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {activeTab === 'activity' && (
              <>
                <select value={filters.user_id || ''} onChange={(e) => handleFilterChange('user_id', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Semua User</option>
                  {users.map((user) => (<option key={user.id} value={user.id}>{user.name}</option>))}
                </select>
                <select value={filters.model || ''} onChange={(e) => handleFilterChange('model', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Semua Model</option>
                  {stats?.models?.map((model) => (<option key={model} value={model}>{model}</option>))}
                </select>
                <select value={filters.action || ''} onChange={(e) => handleFilterChange('action', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Semua Aksi</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="deleted">Deleted</option>
                </select>
              </>
            )}

            {activeTab === 'error' && (
              <>
                <select value={filters.severity || ''} onChange={(e) => handleFilterChange('severity', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Semua Severity</option>
                  <option value="critical">Kritis</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
                <select value={filters.is_resolved ?? ''} onChange={(e) => handleFilterChange('is_resolved', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg">
                  <option value="">Semua Status</option>
                  <option value="false">Belum Resolved</option>
                  <option value="true">Sudah Resolved</option>
                </select>
              </>
            )}

            {/* Date Range */}
            <input type="date" value={filters.date_from || ''} onChange={(e) => handleFilterChange('date_from', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg" />
            <input type="date" value={filters.date_to || ''} onChange={(e) => handleFilterChange('date_to', e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg" />

            {Object.keys(filters).length > 0 && (
              <button onClick={() => { setFilters({}); setPage(1); }} className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Activity Log List */}
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {logsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Memuat data...</p>
              </div>
            ) : logsData?.data?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Tidak ada activity log ditemukan</p>
              </div>
            ) : (
              logsData?.data?.map((log) => (
                <ActivityLogItem key={log.id} log={log} onViewDetail={setSelectedLog} />
              ))
            )}
          </div>
        )}

        {/* Error Log List */}
        {activeTab === 'error' && (
          <div className="space-y-3">
            {errorLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Memuat data...</p>
              </div>
            ) : errorData?.data?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <p className="text-slate-500">Tidak ada error log ditemukan</p>
              </div>
            ) : (
              errorData?.data?.map((log) => (
                <ErrorLogItem key={log.id} log={log} onResolve={handleResolveError} />
              ))
            )}
          </div>
        )}

        {/* User Activity List */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {userActivityLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500">Memuat data...</p>
              </div>
            ) : userActivityData?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Tidak ada user ditemukan</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Aktivitas</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userActivityData?.map((user) => {
                    // Format time ago
                    const formatTimeAgo = (dateStr) => {
                      if (!dateStr) return 'Belum pernah aktif';
                      const date = new Date(dateStr);
                      const now = new Date();
                      const diff = Math.floor((now - date) / 1000);
                      if (diff < 60) return `${diff} detik lalu`;
                      if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
                      if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
                      if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
                      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    };

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                              {user.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                            {user.role_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <LogIn className="w-4 h-4 text-slate-400" />
                            {user.last_login_ago || 'Belum pernah login'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {formatTimeAgo(user.last_active_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {user.total_activities?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              Online
                            </span>
                          ) : user.last_active_at ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                              <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                              Offline
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                              Never
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {((activeTab === 'activity' && logsData?.last_page > 1) || (activeTab === 'error' && errorData?.last_page > 1)) && (
          <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">
              Menampilkan {(activeTab === 'activity' ? logsData : errorData)?.from}-{(activeTab === 'activity' ? logsData : errorData)?.to} dari {(activeTab === 'activity' ? logsData : errorData)?.total} hasil
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">{page} / {(activeTab === 'activity' ? logsData : errorData)?.last_page}</span>
              <button onClick={() => setPage((p) => Math.min((activeTab === 'activity' ? logsData : errorData)?.last_page, p + 1))} disabled={page === (activeTab === 'activity' ? logsData : errorData)?.last_page} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedLog && (
            <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

export default ActivityLogsPage;
