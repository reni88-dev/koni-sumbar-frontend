import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Shield,
  X,
  Loader2,
  AlertCircle,
  Check,
  Users,
  LayoutGrid,
  List
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { 
  useRoles, 
  usePermissionsGrouped, 
  useCreateRole, 
  useUpdateRole, 
  useDeleteRole,
  useUpdateRolePermissions 
} from '../../hooks/queries/useMasterData';

export function RolesPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  
  // Permission editor
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Form states
  const [formData, setFormData] = useState({ name: '', display_name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  // TanStack Query hooks
  const { data: roles = [], isLoading: loading } = useRoles();
  const { data: permissions = {} } = usePermissionsGrouped();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updatePermissionsMutation = useUpdateRolePermissions();

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', display_name: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode('edit');
    setSelectedRole(role);
    setFormData({ 
      name: role.name, 
      display_name: role.display_name, 
      description: role.description || '' 
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openPermissionEditor = (role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    setIsPermissionModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (modalMode === 'create') {
        await createRoleMutation.mutateAsync(formData);
      } else {
        await updateRoleMutation.mutateAsync({ id: selectedRole.id, data: formData });
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    }
  };

  const handlePermissionUpdate = async () => {
    try {
      await updatePermissionsMutation.mutateAsync({ 
        roleId: editingRole.id, 
        permissions: selectedPermissions 
      });
      setIsPermissionModalOpen(false);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleGroup = (groupPermissions) => {
    const groupIds = groupPermissions.map(p => p.id);
    const allSelected = groupIds.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupIds])]);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoleMutation.mutateAsync(roleToDelete.id);
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const formLoading = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <DashboardLayout title="Data Role" subtitle="Kelola role dan hak akses pengguna">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Role</span>
          </button>
        </div>
      </div>

      {/* Roles View */}
      {viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              Tidak ada data role
            </div>
          ) : (
            filteredRoles.map((role) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    role.name === 'super_admin' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <Shield className={`w-6 h-6 ${
                      role.name === 'super_admin' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  {role.name !== 'super_admin' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(role)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setRoleToDelete(role); setIsDeleteModalOpen(true); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-slate-800 text-lg mb-1">{role.display_name}</h3>
                <p className="text-sm text-slate-500 mb-4">{role.description || '-'}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{role.permissions?.length || 0} Permission</span>
                  </div>
                  
                  {role.name === 'super_admin' ? (
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      All Access
                    </span>
                  ) : (
                    <button
                      onClick={() => openPermissionEditor(role)}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Atur Permission
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        /* List/Table View */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permission</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada data role
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            role.name === 'super_admin' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            <Shield className={`w-4 h-4 ${
                              role.name === 'super_admin' ? 'text-purple-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <span className="font-medium text-slate-800">{role.display_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-500">{role.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{role.description || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {role.name === 'super_admin' ? (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">All Access</span>
                        ) : (
                          <button
                            onClick={() => openPermissionEditor(role)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            {role.permissions?.length || 0} Permission
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {role.name !== 'super_admin' && (
                            <>
                              <button
                                onClick={() => openEditModal(role)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setRoleToDelete(role); setIsDeleteModalOpen(true); }}
                                className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Role Baru' : 'Edit Role'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Role (slug)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_')})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="contoh: editor"
                      required
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={e => setFormData({...formData, display_name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                      placeholder="contoh: Editor"
                      required
                    />
                    {formErrors.display_name && <p className="text-red-500 text-xs mt-1">{formErrors.display_name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={3}
                      placeholder="Deskripsi role..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {modalMode === 'create' ? 'Simpan' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Permission Editor Modal */}
      <AnimatePresence>
        {isPermissionModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsPermissionModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Atur Permission</h2>
                    <p className="text-sm text-slate-500">Role: {editingRole?.display_name}</p>
                  </div>
                  <button onClick={() => setIsPermissionModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {Object.entries(permissions).map(([group, groupPermissions]) => (
                      <div key={group} className="border border-slate-100 rounded-xl overflow-hidden">
                        <div 
                          className="bg-slate-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                          onClick={() => toggleGroup(groupPermissions)}
                        >
                          <span className="font-semibold text-slate-700">{group}</span>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            groupPermissions.every(p => selectedPermissions.includes(p.id))
                              ? 'bg-red-600 border-red-600 text-white'
                              : groupPermissions.some(p => selectedPermissions.includes(p.id))
                                ? 'bg-red-200 border-red-400'
                                : 'border-slate-300'
                          }`}>
                            {groupPermissions.every(p => selectedPermissions.includes(p.id)) && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {groupPermissions.map((permission) => (
                            <label 
                              key={permission.id}
                              className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg"
                            >
                              <div 
                                onClick={() => togglePermission(permission.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedPermissions.includes(permission.id)
                                    ? 'bg-red-600 border-red-600 text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {selectedPermissions.includes(permission.id) && (
                                  <Check className="w-3 h-3" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-slate-700">{permission.display_name}</span>
                                <span className="text-xs text-slate-400 ml-2">({permission.name})</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => setIsPermissionModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePermissionUpdate}
                    disabled={updatePermissionsMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {updatePermissionsMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan Permission
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Role?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Anda yakin ingin menghapus role <strong>{roleToDelete?.display_name}</strong>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteRoleMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteRoleMutation.isPending ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
