import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
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
  List,
  Power,
  PowerOff,
  MessageSquareText,
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import {
  useRoles,
  usePermissionsGrouped,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
  useSetRoleAccess,
  useSetRolesAccess,
} from '../../hooks/queries/useMasterData';
import {
  ROLE_ACCESS_DISABLED_MESSAGE,
  ROLE_ACCESS_MESSAGE_MAX_LENGTH,
  filterRolesBySearch,
  getRoleDisabledMessageLabel,
  getSelectableRoles,
  isRoleAccessEnabled,
  pruneSelectedRoleIds,
} from '../../lib/roleAccess';

function RoleAccessBadge({ role }) {
  if (role.name === 'super_admin') {
    return (
      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
        Selalu Aktif
      </span>
    );
  }

  if (!isRoleAccessEnabled(role)) {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        Dinonaktifkan
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Aktif
    </span>
  );
}

function RoleAccessStatus({ role, align = 'center' }) {
  const disabled = role.name !== 'super_admin' && !isRoleAccessEnabled(role);
  const messageLabel = disabled ? getRoleDisabledMessageLabel(role) : '';

  return (
    <div className={align === 'left' ? 'text-left' : 'text-center'}>
      <RoleAccessBadge role={role} />
      {disabled && (
        <p
          className="mt-1 max-w-64 truncate text-xs text-slate-500"
          title={messageLabel}
        >
          {messageLabel}
        </p>
      )}
    </div>
  );
}

function RoleAccessActions({ role, pending, disabled, onToggle, onEditMessage }) {
  const enabled = isRoleAccessEnabled(role);

  return (
    <>
      <button
        type="button"
        onClick={() => onToggle(role)}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled
            ? 'text-slate-500 hover:bg-red-50 hover:text-red-600'
            : 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
        title={enabled ? 'Nonaktifkan akses' : 'Aktifkan akses'}
        aria-label={`${enabled ? 'Nonaktifkan' : 'Aktifkan'} akses ${role.display_name}`}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          <PowerOff className="w-4 h-4" />
        ) : (
          <Power className="w-4 h-4" />
        )}
      </button>
      {!enabled && (
        <button
          type="button"
          onClick={() => onEditMessage(role)}
          disabled={disabled}
          className="p-2 rounded-lg text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="Ubah pesan penonaktifan"
          aria-label={`Ubah pesan penonaktifan ${role.display_name}`}
        >
          <MessageSquareText className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
export function RolesPage() {
  const { user } = useAuth();
  const { can } = usePermission();
  const canManagePermissions = can('roles.permissions');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [roleAccessDialog, setRoleAccessDialog] = useState(null);
  const [roleAccessMessage, setRoleAccessMessage] = useState('');
  const [roleAccessError, setRoleAccessError] = useState('');

  // Permission editor
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Form states
  const [formData, setFormData] = useState({ name: '', display_name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  // TanStack Query hooks
  const { data: roles = [], isLoading: loading } = useRoles();
  const { data: permissions = {} } = usePermissionsGrouped({ enabled: canManagePermissions });
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();
  const updatePermissionsMutation = useUpdateRolePermissions();
  const setRoleAccessMutation = useSetRoleAccess();
  const setRolesAccessMutation = useSetRolesAccess();
  const isSuperAdmin = user?.role?.name === 'super_admin';

  const filteredRoles = filterRolesBySearch(roles, search);
  const selectableVisibleRoles = getSelectableRoles(filteredRoles);
  const selectedRoles = getSelectableRoles(roles).filter((role) => selectedRoleIds.includes(role.id));
  const visibleSelectedCount = selectableVisibleRoles.filter((role) => selectedRoleIds.includes(role.id)).length;
  const allVisibleSelected = selectableVisibleRoles.length > 0
    && visibleSelectedCount === selectableVisibleRoles.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;
  const accessMutationPending = setRoleAccessMutation.isPending || setRolesAccessMutation.isPending;
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
    if (!canManagePermissions) return;
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
    if (!canManagePermissions) return;
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

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    setSelectedRoleIds((current) => pruneSelectedRoleIds(roles, nextSearch, current));
  };

  const toggleRoleSelection = (roleId) => {
    if (accessMutationPending) return;
    setSelectedRoleIds((current) => (
      current.includes(roleId)
        ? current.filter((selectedId) => selectedId !== roleId)
        : [...current, roleId]
    ));
  };

  const toggleAllVisibleRoleSelection = () => {
    if (accessMutationPending || selectableVisibleRoles.length === 0) return;
    const visibleIds = selectableVisibleRoles.map((role) => role.id);
    setSelectedRoleIds((current) => {
      if (visibleIds.every((roleId) => current.includes(roleId))) {
        return current.filter((roleId) => !visibleIds.includes(roleId));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const openRoleAccessDialog = (role) => {
    const accessEnabled = !isRoleAccessEnabled(role);
    setRoleAccessError('');
    setRoleAccessMessage(accessEnabled ? '' : (role.access_disabled_message || ''));
    setRoleAccessDialog({ type: 'individual', role, accessEnabled, editMessage: false });
  };

  const openRoleMessageDialog = (role) => {
    setRoleAccessError('');
    setRoleAccessMessage(role.access_disabled_message || '');
    setRoleAccessDialog({ type: 'individual', role, accessEnabled: false, editMessage: true });
  };

  const openBulkAccessDialog = (accessEnabled) => {
    if (selectedRoles.length === 0) return;
    setRoleAccessError('');
    setRoleAccessMessage('');
    setRoleAccessDialog({
      type: 'bulk',
      roleIds: selectedRoles.map((role) => role.id),
      roleCount: selectedRoles.length,
      accessEnabled,
      editMessage: false,
    });
  };

  const closeRoleAccessDialog = () => {
    if (accessMutationPending) return;
    setRoleAccessDialog(null);
    setRoleAccessMessage('');
    setRoleAccessError('');
  };

  const handleRoleAccessChange = async () => {
    if (!roleAccessDialog || accessMutationPending) return;
    setRoleAccessError('');

    try {
      if (roleAccessDialog.type === 'bulk') {
        await setRolesAccessMutation.mutateAsync({
          roleIds: roleAccessDialog.roleIds,
          accessEnabled: roleAccessDialog.accessEnabled,
          accessDisabledMessage: roleAccessDialog.accessEnabled ? '' : roleAccessMessage,
        });
        setSelectedRoleIds([]);
      } else {
        await setRoleAccessMutation.mutateAsync({
          roleId: roleAccessDialog.role.id,
          accessEnabled: roleAccessDialog.accessEnabled,
          accessDisabledMessage: roleAccessDialog.accessEnabled ? '' : roleAccessMessage,
        });
      }
      setRoleAccessDialog(null);
      setRoleAccessMessage('');
    } catch (error) {
      setRoleAccessError(
        error.response?.data?.message
          || error.response?.data?.error
          || 'Gagal memperbarui akses role. Silakan coba lagi.',
      );
    }
  };

  const formLoading = createRoleMutation.isPending || updateRoleMutation.isPending;
  const accessDialogPending = roleAccessDialog?.type === 'bulk'
    ? setRolesAccessMutation.isPending
    : setRoleAccessMutation.isPending;
  const targetWillBeEnabled = roleAccessDialog?.accessEnabled === true;
  const showAccessMessageField = Boolean(roleAccessDialog && !targetWillBeEnabled);
  const accessDialogRoleCount = roleAccessDialog?.type === 'bulk'
    ? roleAccessDialog.roleCount
    : 1;
  const accessDialogTitle = roleAccessDialog?.editMessage
    ? 'Ubah Pesan Penonaktifan?'
    : `${targetWillBeEnabled ? 'Aktifkan' : 'Nonaktifkan'} Akses ${
      roleAccessDialog?.type === 'bulk' ? `${accessDialogRoleCount} Role` : 'Role'
    }?`;
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
            onChange={handleSearchChange}
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

      {isSuperAdmin && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                ref={(input) => {
                  if (input) input.indeterminate = someVisibleSelected;
                }}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisibleRoleSelection}
                disabled={accessMutationPending || selectableVisibleRoles.length === 0}
                className="h-4 w-4 rounded border-slate-300 accent-red-600 disabled:cursor-not-allowed"
              />
              Pilih Semua Hasil
            </label>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {selectedRoles.length} role terpilih
            </span>
            <span className="text-xs text-slate-500">
              {selectableVisibleRoles.length} role dapat dipilih pada hasil ini
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => openBulkAccessDialog(true)}
              disabled={selectedRoles.length === 0 || accessMutationPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Power className="h-4 w-4" />
              Aktifkan Terpilih
            </button>
            <button
              type="button"
              onClick={() => openBulkAccessDialog(false)}
              disabled={selectedRoles.length === 0 || accessMutationPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PowerOff className="h-4 w-4" />
              Nonaktifkan Terpilih
            </button>
          </div>
        </div>
      )}

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
              <Motion.div
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${selectedRoleIds.includes(role.id) ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-100'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {isSuperAdmin && role.name !== 'super_admin' && (
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRoleSelection(role.id)}
                        disabled={accessMutationPending}
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-red-600 disabled:cursor-not-allowed"
                        aria-label={`Pilih role ${role.display_name}`}
                      />
                    )}
                    <div className={`p-3 rounded-xl ${
                      role.name === 'super_admin' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <Shield className={`w-6 h-6 ${
                        role.name === 'super_admin' ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    </div>
                  </div>
                  {role.name !== 'super_admin' && (
                    <div className="flex flex-wrap justify-end gap-1">
                      {isSuperAdmin && (
                        <RoleAccessActions
                          role={role}
                          pending={setRoleAccessMutation.isPending && setRoleAccessMutation.variables?.roleId === role.id}
                          disabled={accessMutationPending}
                          onToggle={openRoleAccessDialog}
                          onEditMessage={openRoleMessageDialog}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => openEditModal(role)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRoleToDelete(role); setIsDeleteModalOpen(true); }}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{role.display_name}</h3>
                <p className="text-sm text-slate-500 mb-3">{role.description || '-'}</p>
                <div className="mb-4">
                  <RoleAccessStatus role={role} align="left" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{role.permissions?.length || 0} Permission</span>
                  </div>
                  
                  {role.name === 'super_admin' ? (
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      All Access
                    </span>
                  ) : canManagePermissions ? (
                    <button
                      onClick={() => openPermissionEditor(role)}
                      className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                    >
                      Atur Permission
                    </button>
                  ) : null}
                </div>
              </Motion.div>
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
                  {isSuperAdmin && (
                    <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Pilih</th>
                  )}
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Akses</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Permission</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                      Tidak ada data role
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr
                      key={role.id}
                      className={`transition-colors hover:bg-slate-50 ${selectedRoleIds.includes(role.id) ? 'bg-red-50/50' : ''}`}
                    >
                      {isSuperAdmin && (
                        <td className="px-4 py-4 text-center">
                          {role.name !== 'super_admin' && (
                            <input
                              type="checkbox"
                              checked={selectedRoleIds.includes(role.id)}
                              onChange={() => toggleRoleSelection(role.id)}
                              disabled={accessMutationPending}
                              className="h-4 w-4 rounded border-slate-300 accent-red-600 disabled:cursor-not-allowed"
                              aria-label={`Pilih role ${role.display_name}`}
                            />
                          )}
                        </td>
                      )}
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
                        <RoleAccessStatus role={role} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {role.name === 'super_admin' ? (
                          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">All Access</span>
                        ) : canManagePermissions ? (
                          <button
                            onClick={() => openPermissionEditor(role)}
                            className="text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            {role.permissions?.length || 0} Permission
                          </button>
                        ) : (
                          <span className="text-sm text-slate-500">
                            {role.permissions?.length || 0} Permission
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {role.name !== 'super_admin' && (
                            <>
                              {isSuperAdmin && (
                                <RoleAccessActions
                                  role={role}
                                  pending={setRoleAccessMutation.isPending && setRoleAccessMutation.variables?.roleId === role.id}
                                  disabled={accessMutationPending}
                                  onToggle={openRoleAccessDialog}
                                  onEditMessage={openRoleMessageDialog}
                                />
                              )}
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
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <Motion.div
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
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Permission Editor Modal */}
      <AnimatePresence>
        {canManagePermissions && isPermissionModalOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsPermissionModalOpen(false)}
            />
            <Motion.div
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
            </Motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Role Access Confirmation Modal */}
      <AnimatePresence>
        {roleAccessDialog && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={closeRoleAccessDialog}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="role-access-dialog-title"
                className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  targetWillBeEnabled ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {targetWillBeEnabled ? (
                    <Power className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <PowerOff className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 id="role-access-dialog-title" className="mb-2 text-center text-lg font-bold text-slate-800">
                  {accessDialogTitle}
                </h3>
                <p className="mb-3 text-center text-sm text-slate-500">
                  {roleAccessDialog.type === 'bulk' ? (
                    <>
                      <strong>{accessDialogRoleCount} role terpilih</strong> akan{' '}
                      {targetWillBeEnabled ? 'diaktifkan' : roleAccessDialog.editMessage ? 'diperbarui pesannya' : 'dinonaktifkan'}.
                    </>
                  ) : (
                    <>
                      Role <strong>{roleAccessDialog.role.display_name}</strong> akan{' '}
                      {targetWillBeEnabled ? 'diaktifkan kembali' : roleAccessDialog.editMessage ? 'diperbarui pesannya' : 'dinonaktifkan'}.
                    </>
                  )}
                </p>
                <p className="mb-5 text-center text-sm text-slate-500">
                  {roleAccessDialog.editMessage
                    ? 'Pesan terbaru akan diterima pengguna role ini pada login atau permintaan API berikutnya.'
                    : targetWillBeEnabled
                      ? 'Pesan penonaktifan lama akan dihapus dan pengguna dapat mengakses sistem kembali.'
                      : 'Pengguna tidak dapat login dan sesi aktif akan dihentikan pada permintaan API berikutnya.'}
                </p>

                {showAccessMessageField && (
                  <div className="mb-5">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <label htmlFor="role-access-message" className="text-sm font-semibold text-slate-700">
                        Pesan untuk pengguna (opsional)
                      </label>
                      <span className="text-xs text-slate-500">
                        {roleAccessMessage.length}/{ROLE_ACCESS_MESSAGE_MAX_LENGTH}
                      </span>
                    </div>
                    <textarea
                      id="role-access-message"
                      value={roleAccessMessage}
                      onChange={(event) => setRoleAccessMessage(event.target.value)}
                      maxLength={ROLE_ACCESS_MESSAGE_MAX_LENGTH}
                      rows={4}
                      disabled={accessDialogPending}
                      placeholder="Contoh: Sistem sedang menjalani maintenance sampai pukul 18.00 WIB."
                      className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                    <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      Jika dikosongkan, pengguna menerima pesan bawaan: “{ROLE_ACCESS_DISABLED_MESSAGE}”
                    </div>
                  </div>
                )}

                {roleAccessError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{roleAccessError}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeRoleAccessDialog}
                    disabled={accessDialogPending}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleRoleAccessChange}
                    disabled={accessDialogPending}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-colors disabled:opacity-50 ${
                      targetWillBeEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {accessDialogPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    {roleAccessDialog.editMessage ? 'Simpan Pesan' : targetWillBeEnabled ? 'Aktifkan' : 'Nonaktifkan'}
                  </button>
                </div>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <Motion.div
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
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
