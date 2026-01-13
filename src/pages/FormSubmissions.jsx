import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Eye,
  Trash2,
  Loader2,
  ClipboardList,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useFormBuilderTemplate, useFormBuilderSubmissions, useDeleteFormBuilderSubmission } from '../hooks/queries/useFormBuilder';

export function FormSubmissionsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('event_id');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, submission: null });
  const [viewModal, setViewModal] = useState({ open: false, submission: null });

  // TanStack Query hooks
  const { data: template, isLoading: templateLoading } = useFormBuilderTemplate(id);
  const { 
    data: submissionsData, 
    isLoading: submissionsLoading,
    refetch: refetchSubmissions
  } = useFormBuilderSubmissions(id, { search: debouncedSearch, eventId: eventId || '' });

  const deleteSubmissionMutation = useDeleteFormBuilderSubmission();

  const submissions = submissionsData?.data || [];
  const loading = templateLoading || submissionsLoading;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal.submission) return;
    
    try {
      await deleteSubmissionMutation.mutateAsync(deleteModal.submission.id);
      setDeleteModal({ open: false, submission: null });
    } catch (error) {
      console.error('Failed to delete submission:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(eventId ? `/events/${eventId}` : '/form-builder')}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Submissions</h1>
              <p className="text-slate-500 mt-1">{template?.name || 'Loading...'}</p>
            </div>
          </div>
          <Link
            to={`/form-builder/${id}/fill`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Isi Form Baru
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari submission code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-red-100 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Belum Ada Submission</h3>
            <p className="text-slate-500 mb-6">Belum ada data yang diisi untuk form ini</p>
            <Link
              to={`/form-builder/${id}/fill`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Isi Form
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Submission Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Submitted By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-800">{submission.submission_code}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {submission.reference_record?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-700">{submission.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(submission.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewModal({ open: true, submission })}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, submission })}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* View Modal */}
      {viewModal.open && viewModal.submission && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Detail Submission</h3>
              <span className="font-mono text-sm text-slate-500">{viewModal.submission.submission_code}</span>
            </div>
            
            <div className="space-y-4">
              {viewModal.submission.values?.map((val) => (
                <div key={val.id} className="border-b border-slate-100 pb-3">
                  <div className="text-xs font-medium text-slate-500 mb-1">{val.field?.label || 'Field'}</div>
                  <div className="text-slate-800">{val.value || '-'}</div>
                  {val.calculated_category && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                      {val.calculated_category}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModal({ open: false, submission: null })}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Submission?</h3>
            <p className="text-slate-600 mb-6">
              Apakah Anda yakin ingin menghapus submission "{deleteModal.submission?.submission_code}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, submission: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSubmissionMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteSubmissionMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
