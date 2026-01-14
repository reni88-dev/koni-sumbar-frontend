import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  FileText,
  MoreVertical,
  Copy,
  Loader2,
  ClipboardList,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useFormBuilderTemplates, useDeleteFormBuilderTemplate } from '../hooks/queries/useFormBuilder';

export function FormBuilderPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, template: null });

  // TanStack Query hooks
  const { 
    data: templatesData, 
    isLoading: loading 
  } = useFormBuilderTemplates({ search: debouncedSearch });

  const deleteTemplateMutation = useDeleteFormBuilderTemplate();

  const templates = templatesData?.data || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal.template) return;
    
    try {
      await deleteTemplateMutation.mutateAsync(deleteModal.template.id);
      setDeleteModal({ open: false, template: null });
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
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
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Form Builder</h1>
            <p className="text-slate-500 mt-1">Buat dan kelola formulir dinamis</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Events
            </Link>
            <Link
              to="/form-builder/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/25"
            >
              <Plus className="w-5 h-5" />
              Buat Form Baru
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari form..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-red-100 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Belum Ada Form</h3>
            <p className="text-slate-500 mb-6">Mulai buat form pertama Anda</p>
            <Link
              to="/form-builder/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Buat Form Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="relative">
                    <button className="p-2 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 truncate">{template.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                  {template.description || 'Tidak ada deskripsi'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-4 h-4" />
                    {template.submissions_count || 0} submission
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    template.is_active 
                      ? 'bg-green-50 text-green-600' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {template.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Link
                    to={`/form-builder/${template.id}/fill`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Isi Form
                  </Link>
                  <Link
                    to={`/form-builder/${template.id}/edit`}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                    title="Edit Form"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/form-builder/${template.id}/submissions`}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700"
                    title="Lihat Submission"
                  >
                    <ClipboardList className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteModal({ open: true, template })}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600"
                    title="Hapus Form"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Form?</h3>
            <p className="text-slate-600 mb-6">
              Apakah Anda yakin ingin menghapus form "{deleteModal.template?.name}"? 
              Semua data submission juga akan dihapus.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, template: null })}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteTemplateMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTemplateMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
