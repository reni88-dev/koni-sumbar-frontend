import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CalendarClock, Loader2, Power, PowerOff } from 'lucide-react';
import {
  useCancelRoleAccessSchedule,
  useCreateRoleAccessSchedules,
} from '../../hooks/queries/useMasterData';
import {
  formatJakartaDateTime,
  formatJakartaDateTimeInput,
} from '../announcements/announcementUtils';
import {
  ROLE_ACCESS_DISABLED_MESSAGE,
  ROLE_ACCESS_MESSAGE_MAX_LENGTH,
  ROLE_ACCESS_SCHEDULE_ACTIONS,
  getRoleAccessScheduleLabel,
  getRoleDisabledMessageLabel,
  isRoleAccessEnabled,
  validateRoleAccessScheduleInput,
} from '../../lib/roleAccess';

const HOUR = 60 * 60 * 1000;

function toJakartaInput(offsetMs) {
  return formatJakartaDateTimeInput(new Date(Date.now() + offsetMs).toISOString());
}

// An enabled role (or a bulk selection) usually needs a disable first; a disabled role needs an enable.
function createScheduleDraft(target) {
  const roleDisabled = target.type === 'individual' && !isRoleAccessEnabled(target.role);
  return {
    minInput: toJakartaInput(60 * 1000),
    disableChecked: !roleDisabled,
    disableAt: toJakartaInput(HOUR),
    enableChecked: roleDisabled,
    enableAt: toJakartaInput(roleDisabled ? HOUR : 2 * HOUR),
    message: '',
  };
}

function getRequestErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function PendingScheduleList({ schedules, cancellingId, disabled, onCancel }) {
  if (schedules.length === 0) {
    return <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Belum ada jadwal pending.</p>;
  }

  return (
    <ul className="space-y-2">
      {schedules.map((schedule) => {
        const disable = schedule.action === ROLE_ACCESS_SCHEDULE_ACTIONS.disable;
        return (
          <li key={schedule.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <div className={`mt-0.5 rounded-lg p-1.5 ${disable ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {disable ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800">{getRoleAccessScheduleLabel(schedule)}</p>
              <p className="text-xs text-slate-500">{formatJakartaDateTime(schedule.run_at)}</p>
              {disable && (
                <p className="mt-1 truncate text-xs text-slate-500" title={getRoleDisabledMessageLabel(schedule)}>
                  Pesan: {getRoleDisabledMessageLabel(schedule)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCancel(schedule)}
              disabled={disabled}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Batalkan ${getRoleAccessScheduleLabel(schedule).toLowerCase()} ${formatJakartaDateTime(schedule.run_at)}`}
            >
              {cancellingId === schedule.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Batalkan
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ScheduleTimeField({ id, label, checked, value, min, disabled, onCheckedChange, onValueChange }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <label htmlFor={`${id}-checkbox`} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          id={`${id}-checkbox`}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 rounded border-slate-300 accent-red-600 disabled:cursor-not-allowed"
        />
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled || !checked}
        aria-label={`${label} (WIB)`}
        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}

function ScheduleDialogContent({ target, pendingSchedules, onClose, onCreated }) {
  const createMutation = useCreateRoleAccessSchedules();
  const cancelMutation = useCancelRoleAccessSchedule();
  const [draft, setDraft] = useState(() => createScheduleDraft(target));
  const [error, setError] = useState('');
  const pending = createMutation.isPending || cancelMutation.isPending;
  const isBulk = target.type === 'bulk';
  const cancellingId = cancelMutation.isPending ? cancelMutation.variables : null;

  const updateDraft = (changes) => setDraft((current) => ({ ...current, ...changes }));

  const handleClose = () => {
    if (!pending) onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;

    const disableAt = draft.disableChecked ? draft.disableAt : '';
    const enableAt = draft.enableChecked ? draft.enableAt : '';
    const validationError = validateRoleAccessScheduleInput({ disableAt, enableAt, now: new Date() });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    try {
      await createMutation.mutateAsync({
        roleIds: isBulk ? target.roleIds : [target.role.id],
        disableAt,
        enableAt,
        accessDisabledMessage: draft.message,
      });
      onCreated(target);
      onClose();
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Gagal menyimpan jadwal akses role. Silakan coba lagi.'));
    }
  };

  const handleCancelSchedule = async (schedule) => {
    if (pending) return;
    setError('');
    try {
      await cancelMutation.mutateAsync(schedule.id);
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError, 'Gagal membatalkan jadwal. Silakan coba lagi.'));
    }
  };

  return (
    <>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-access-schedule-title"
          onSubmit={handleSubmit}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <CalendarClock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 id="role-access-schedule-title" className="mb-2 text-center text-lg font-bold text-slate-800">
            {isBulk ? `Jadwalkan Akses ${target.roleCount} Role` : 'Jadwalkan Akses Role'}
          </h3>
          <p className="mb-5 text-center text-sm text-slate-500">
            {isBulk ? (
              <>Jadwal yang sama akan dibuat untuk <strong>{target.roleCount} role terpilih</strong>.</>
            ) : (
              <>Atur jadwal penonaktifan dan pengaktifan untuk role <strong>{target.role.display_name}</strong>.</>
            )}
          </p>

          {!isBulk && (
            <section className="mb-5">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Jadwal pending</h4>
              <PendingScheduleList
                schedules={pendingSchedules}
                cancellingId={cancellingId}
                disabled={pending}
                onCancel={handleCancelSchedule}
              />
            </section>
          )}

          <section className="mb-5 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">Buat jadwal baru</h4>
            <ScheduleTimeField
              id="role-access-schedule-disable"
              label="Nonaktifkan akses pada"
              checked={draft.disableChecked}
              value={draft.disableAt}
              min={draft.minInput}
              disabled={pending}
              onCheckedChange={(disableChecked) => updateDraft({ disableChecked })}
              onValueChange={(disableAt) => updateDraft({ disableAt })}
            />
            <ScheduleTimeField
              id="role-access-schedule-enable"
              label="Aktifkan kembali pada"
              checked={draft.enableChecked}
              value={draft.enableAt}
              min={draft.minInput}
              disabled={pending}
              onCheckedChange={(enableChecked) => updateDraft({ enableChecked })}
              onValueChange={(enableAt) => updateDraft({ enableAt })}
            />

            {draft.disableChecked && (
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label htmlFor="role-access-schedule-message" className="text-sm font-semibold text-slate-700">
                    Pesan untuk pengguna (opsional)
                  </label>
                  <span className="text-xs text-slate-500">
                    {draft.message.length}/{ROLE_ACCESS_MESSAGE_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id="role-access-schedule-message"
                  value={draft.message}
                  onChange={(event) => updateDraft({ message: event.target.value })}
                  maxLength={ROLE_ACCESS_MESSAGE_MAX_LENGTH}
                  rows={3}
                  disabled={pending}
                  placeholder="Contoh: Sistem sedang menjalani maintenance sampai pukul 18.00 WIB."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Jika dikosongkan, pengguna menerima pesan bawaan: “{ROLE_ACCESS_DISABLED_MESSAGE}”
                </p>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
              Waktu dalam WIB. Jadwal dijalankan otomatis oleh server, paling lambat sekitar 15 detik setelah
              waktu yang ditentukan. Perubahan akses manual tidak membatalkan jadwal yang sudah dibuat.
            </div>
          </section>

          {error && (
            <div role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleClose}
              disabled={pending}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Jadwal
            </button>
          </div>
        </form>
      </Motion.div>
    </>
  );
}

export function RoleAccessScheduleDialog({ target, pendingSchedules = [], onClose, onCreated }) {
  return (
    <AnimatePresence>
      {target && (
        <ScheduleDialogContent
          key={target.type === 'bulk' ? `bulk-${target.roleIds.join('-')}` : `role-${target.role.id}`}
          target={target}
          pendingSchedules={pendingSchedules}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </AnimatePresence>
  );
}
