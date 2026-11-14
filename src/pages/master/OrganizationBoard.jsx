import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit2, Trash2, FileText, Upload, Loader2, AlertCircle, RefreshCw, Users, CalendarDays,
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SuccessToast } from '../../components/SuccessToast';
import { DecreeFormModal } from '../../components/organization-board/DecreeFormModal';
import { MemberFormModal } from '../../components/organization-board/MemberFormModal';
import {
  BOARD_SOURCE_LABELS, GENDER_LABELS, DECREE_STATUS, formatDecreeDate,
} from '../../components/organization-board/boardLabels';
import { useOrganization } from '../../hooks/queries/useOrganizations';
import {
  useOrganizationDecrees,
  useOrganizationDecree,
  useDeleteOrganizationDecree,
  useDeleteOrganizationDecreeFile,
  useDeleteDecreeMember,
  openOrganizationDecreeFile,
  getDecreeErrorMessage,
} from '../../hooks/queries/useOrganizationDecrees';
import { usePermission } from '../../hooks/usePermission';

function StatusBadge({ status }) {
  const config = DECREE_STATUS[status] || DECREE_STATUS.expired;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>{config.label}</span>;
}

function ErrorPanel({ error, fallback, onRetry, isRetrying }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
      <p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{getDecreeErrorMessage(error, fallback)}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />Coba Lagi
      </button>
    </div>
  );
}

export function OrganizationBoardPage() {
  const { id } = useParams();
  const organizationId = Number(id) > 0 ? Number(id) : null;
  const { can } = usePermission();
  const canEdit = can('organizations.edit');

  const organizationQuery = useOrganization(organizationId);
  const decreesQuery = useOrganizationDecrees(organizationId);
  const decrees = decreesQuery.data || [];
  const [selectedId, setSelectedId] = useState(null);
  // Fall back to the newest SK while nothing (or a deleted SK) is selected.
  const selectedDecreeId = decrees.some((d) => d.id === selectedId) ? selectedId : decrees[0]?.id ?? null;
  const decreeQuery = useOrganizationDecree(organizationId, selectedDecreeId);
  const decree = decreeQuery.data;
  const members = decree?.members || [];

  const [decreeModal, setDecreeModal] = useState({ open: false, decree: null });
  const [memberModal, setMemberModal] = useState({ open: false, member: null });
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState('');
  const [actionError, setActionError] = useState('');
  const [openingFile, setOpeningFile] = useState(false);

  const deleteDecree = useDeleteOrganizationDecree(organizationId);
  const deleteFile = useDeleteOrganizationDecreeFile(organizationId);
  const deleteMember = useDeleteDecreeMember(organizationId);

  const showToast = (message) => {
    setActionError('');
    setToast(message);
  };

  const handleOpenFile = async () => {
    setOpeningFile(true);
    setActionError('');
    try {
      await openOrganizationDecreeFile(organizationId, decree.id);
    } catch (error) {
      setActionError(getDecreeErrorMessage(error, 'Gagal membuka file SK. Silakan coba lagi.'));
    } finally {
      setOpeningFile(false);
    }
  };

  const confirmConfig = {
    decree: {
      title: 'Hapus SK',
      message: `SK ${decree?.decree_number || ''} akan dihapus dari daftar. Lanjutkan?`,
      mutation: deleteDecree,
      run: () => deleteDecree.mutateAsync({ decreeId: decree.id }),
      success: 'SK berhasil dihapus',
    },
    file: {
      title: 'Hapus File SK',
      message: 'File SK akan dihapus. Data SK dan pengurus tetap tersimpan.',
      mutation: deleteFile,
      run: () => deleteFile.mutateAsync({ decreeId: decree.id }),
      success: 'File SK berhasil dihapus',
    },
    member: {
      title: 'Hapus Pengurus',
      message: `${confirm?.member?.name || 'Pengurus'} akan dihapus dari SK ini.`,
      mutation: deleteMember,
      run: () => deleteMember.mutateAsync({ decreeId: decree.id, memberId: confirm.member.id }),
      success: 'Pengurus berhasil dihapus',
    },
  }[confirm?.type];

  const handleConfirm = async () => {
    if (!confirmConfig) return;
    try {
      await confirmConfig.run();
      setConfirm(null);
      showToast(confirmConfig.success);
    } catch (error) {
      setConfirm(null);
      setActionError(getDecreeErrorMessage(error, 'Aksi gagal. Silakan coba lagi.'));
    }
  };

  const organizationName = organizationQuery.data?.name;

  return (
    <DashboardLayout title="Kepengurusan Organisasi" subtitle={organizationName || 'SK dan susunan pengurus'}>
      <Link to="/master/organizations" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-red-600">
        <ArrowLeft className="w-4 h-4" />Kembali ke Organisasi
      </Link>

      {!organizationId ? (
        <p className="rounded-xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Organisasi tidak valid.</p>
      ) : organizationQuery.isError ? (
        <ErrorPanel
          error={organizationQuery.error}
          fallback="Organisasi tidak ditemukan atau di luar wilayah akses Anda."
          onRetry={() => organizationQuery.refetch()}
          isRetrying={organizationQuery.isFetching}
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* SK list */}
          <section className="w-full lg:w-80 lg:shrink-0" aria-labelledby="decree-list-title">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="decree-list-title" className="text-sm font-bold uppercase tracking-wider text-slate-700">Daftar SK</h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setDecreeModal({ open: true, decree: null })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <Plus className="h-3.5 w-3.5" />Tambah SK
                </button>
              )}
            </div>
            {decreesQuery.isLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>
            ) : decreesQuery.isError ? (
              <ErrorPanel error={decreesQuery.error} fallback="Daftar SK belum dapat dimuat." onRetry={() => decreesQuery.refetch()} isRetrying={decreesQuery.isFetching} />
            ) : decrees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Belum ada SK kepengurusan.{canEdit && ' Klik "Tambah SK" untuk mulai.'}
              </div>
            ) : (
              <ul className="space-y-2">
                {decrees.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-current={item.id === selectedDecreeId ? 'true' : undefined}
                      className={`w-full rounded-2xl border bg-white p-4 text-left transition-colors ${
                        item.id === selectedDecreeId ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="break-all text-sm font-semibold text-slate-800">{item.decree_number}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5" />{formatDecreeDate(item.issued_date)} – {formatDecreeDate(item.valid_until)}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3.5 w-3.5" />{item.member_count} pengurus
                        {item.has_file && <><span aria-hidden="true">·</span><FileText className="h-3.5 w-3.5" />File SK</>}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Selected SK */}
          <section className="min-w-0 flex-1" aria-label="Detail SK">
            {actionError && (
              <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}
            {!selectedDecreeId ? (
              decrees.length === 0 && !decreesQuery.isLoading && !decreesQuery.isError ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
                  Pilih atau tambahkan SK untuk mengelola susunan pengurus.
                </div>
              ) : null
            ) : decreeQuery.isLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" /></div>
            ) : decreeQuery.isError ? (
              <ErrorPanel error={decreeQuery.error} fallback="Detail SK belum dapat dimuat." onRetry={() => decreeQuery.refetch()} isRetrying={decreeQuery.isFetching} />
            ) : decree && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-all text-lg font-bold text-slate-800">SK {decree.decree_number}</h2>
                        <StatusBadge status={decree.status} />
                      </div>
                      <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                        <div><dt className="inline text-slate-500">Diterbitkan: </dt><dd className="inline font-medium text-slate-700">{formatDecreeDate(decree.issued_date)}</dd></div>
                        <div><dt className="inline text-slate-500">Berlaku sampai: </dt><dd className="inline font-medium text-slate-700">{formatDecreeDate(decree.valid_until)}</dd></div>
                      </dl>
                      {decree.notes && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{decree.notes}</p>}
                    </div>
                    {canEdit && (
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => setDecreeModal({ open: true, decree })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" title="Edit SK" aria-label="Edit SK">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setConfirm({ type: 'decree' })} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" title="Hapus SK" aria-label="Hapus SK">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    {decree.has_file ? (
                      <>
                        <button
                          type="button"
                          onClick={handleOpenFile}
                          disabled={openingFile}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {openingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                          Lihat File SK
                        </button>
                        <span className="truncate text-xs text-slate-500">{decree.file_name}</span>
                        {canEdit && (
                          <button type="button" onClick={() => setConfirm({ type: 'file' })} className="text-xs font-semibold text-red-600 hover:underline">
                            Hapus file
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Belum ada file SK.</span>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setDecreeModal({ open: true, decree })}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Upload className="h-3.5 w-3.5" />{decree.has_file ? 'Ganti file' : 'Unggah file'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Susunan Pengurus ({members.length})</h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setMemberModal({ open: true, member: null })}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        <Plus className="h-3.5 w-3.5" />Tambah Pengurus
                      </button>
                    )}
                  </div>
                  {members.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-500">Belum ada pengurus pada SK ini.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            <th className="px-4 py-3 w-14">No</th>
                            <th className="px-4 py-3">Jabatan</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">L/P</th>
                            <th className="px-4 py-3">Sumber</th>
                            {canEdit && <th className="px-4 py-3 text-right">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                          {members.map((member, index) => (
                            <tr key={member.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-800">{member.position_title}</td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-slate-800">{member.name || '-'}</span>
                                {!member.source_available && (
                                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-500">data dihapus</span>
                                )}
                                {(member.cabor_name || member.organization_name) && (
                                  <span className="block text-xs text-slate-500">{[member.cabor_name, member.organization_name].filter(Boolean).join(' · ')}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600">{member.gender === 'male' ? 'L' : member.gender === 'female' ? 'P' : '-'}<span className="sr-only">{GENDER_LABELS[member.gender]}</span></td>
                              <td className="px-4 py-3">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{BOARD_SOURCE_LABELS[member.source_type] || member.source_type}</span>
                              </td>
                              {canEdit && (
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-1">
                                    <button type="button" onClick={() => setMemberModal({ open: true, member })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600" aria-label={`Edit ${member.name}`}>
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => setConfirm({ type: 'member', member })} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Hapus ${member.name}`}>
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <DecreeFormModal
        isOpen={decreeModal.open}
        organizationId={organizationId}
        decree={decreeModal.decree}
        onClose={() => setDecreeModal({ open: false, decree: null })}
        onSaved={(saved, complete) => {
          setSelectedId(saved.id);
          if (complete) {
            setDecreeModal({ open: false, decree: null });
            showToast('SK berhasil disimpan');
          }
        }}
      />
      {decree && (
        <MemberFormModal
          isOpen={memberModal.open}
          organizationId={organizationId}
          decreeId={decree.id}
          member={memberModal.member}
          defaultSortOrder={members.length + 1}
          onClose={() => setMemberModal({ open: false, member: null })}
          onSaved={(message) => {
            setMemberModal({ open: false, member: null });
            showToast(message);
          }}
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(confirmConfig)}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
        isPending={confirmConfig?.mutation.isPending}
      />
      <SuccessToast isOpen={Boolean(toast)} message={toast} onClose={() => setToast('')} />
    </DashboardLayout>
  );
}
