import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ROLE_ACCESS_MESSAGE_LABEL,
  buildRoleAccessScheduleRequest,
  buildRolesAccessRequest,
  filterRolesBySearch,
  getRoleAccessScheduleLabel,
  getRoleDisabledMessageLabel,
  getSelectableRoles,
  groupPendingSchedulesByRole,
  isRoleAccessEnabled,
  pruneSelectedRoleIds,
  validateRoleAccessScheduleInput,
} from '../src/lib/roleAccess.js';

const roles = [
  { id: 1, name: 'super_admin', display_name: 'Super Admin', access_enabled: true },
  { id: 2, name: 'admin', display_name: 'Administrator', access_enabled: true },
  { id: 3, name: 'coach', display_name: 'Pelatih', access_enabled: false, access_disabled_message: ' Maintenance ' },
];

test('role search and select-all candidates exclude super_admin', () => {
  assert.deepEqual(filterRolesBySearch(roles, 'pelatih').map((role) => role.id), [3]);
  assert.deepEqual(getSelectableRoles(roles).map((role) => role.id), [2, 3]);
});

test('changing search prunes selected roles that are no longer visible', () => {
  assert.deepEqual(pruneSelectedRoleIds(roles, 'admin', [1, 2, 3]), [2]);
  assert.deepEqual(pruneSelectedRoleIds(roles, 'pelatih', [2, 3]), [3]);
});

test('role access helpers preserve custom message and label empty message as system default', () => {
  assert.equal(isRoleAccessEnabled(roles[2]), false);
  assert.equal(getRoleDisabledMessageLabel(roles[2]), 'Maintenance');
  assert.equal(getRoleDisabledMessageLabel({ access_disabled_message: '   ' }), DEFAULT_ROLE_ACCESS_MESSAGE_LABEL);
});

test('single selected role uses the individual access endpoint for backward-compatible routing', () => {
  assert.deepEqual(buildRolesAccessRequest({
    roleIds: [3],
    accessEnabled: false,
    accessDisabledMessage: 'Maintenance.',
  }), {
    url: '/api/master/roles/3/access',
    data: {
      access_enabled: false,
      access_disabled_message: 'Maintenance.',
    },
  });
});

test('multiple selected roles keep using the atomic bulk endpoint', () => {
  assert.deepEqual(buildRolesAccessRequest({
    roleIds: [2, 3],
    accessEnabled: true,
  }), {
    url: '/api/master/roles/access',
    data: {
      role_ids: [2, 3],
      access_enabled: true,
      access_disabled_message: '',
    },
  });
});

// 2026-09-26 10:00 WIB
const scheduleNow = new Date('2026-09-26T03:00:00Z');

test('schedule validation requires a future WIB time within one year and enable after disable', () => {
  const validate = (input) => validateRoleAccessScheduleInput({ now: scheduleNow, ...input });

  assert.match(validate({}), /minimal satu jadwal/);
  assert.match(validate({ disableAt: '2026-09-26T10:00' }), /masa depan/);
  assert.match(validate({ enableAt: '2026-09-26T09:59' }), /masa depan/);
  assert.match(validate({ disableAt: '2027-09-27T10:00' }), /1 tahun/);
  assert.match(validate({ disableAt: '2026-10-01T18:00', enableAt: '2026-10-01T08:00' }), /setelah waktu penonaktifan/);
  assert.match(validate({ disableAt: '2026-10-01T08:00', enableAt: '2026-10-01T08:00' }), /setelah waktu penonaktifan/);
  assert.equal(validate({ disableAt: '2026-09-26T10:01' }), '');
  assert.equal(validate({ disableAt: '2026-10-01T08:00', enableAt: '2026-10-01T18:00' }), '');
  assert.equal(validate({ enableAt: '2026-10-01T18:00' }), '');
});

test('schedule request sends explicit WIB offsets and drops the message without a disable time', () => {
  assert.deepEqual(buildRoleAccessScheduleRequest({
    roleIds: [2, 3],
    disableAt: '2026-10-01T08:00',
    enableAt: '2026-10-01T18:00',
    accessDisabledMessage: 'Maintenance.',
  }), {
    role_ids: [2, 3],
    disable_at: '2026-10-01T08:00:00+07:00',
    enable_at: '2026-10-01T18:00:00+07:00',
    access_disabled_message: 'Maintenance.',
  });

  assert.deepEqual(buildRoleAccessScheduleRequest({
    roleIds: [3],
    enableAt: '2026-10-01T18:00',
    accessDisabledMessage: 'Tidak dipakai',
  }), {
    role_ids: [3],
    disable_at: null,
    enable_at: '2026-10-01T18:00:00+07:00',
    access_disabled_message: '',
  });
});

test('pending schedules are grouped per role in run order and labelled by action', () => {
  const grouped = groupPendingSchedulesByRole([
    { id: 4, role_id: 3, action: 'enable', run_at: '2026-10-01T18:00:00+07:00', status: 'pending' },
    { id: 3, role_id: 3, action: 'disable', run_at: '2026-10-01T08:00:00+07:00', status: 'pending' },
    { id: 5, role_id: 2, action: 'disable', run_at: '2026-10-02T08:00:00+07:00', status: 'pending' },
    { id: 6, role_id: 2, action: 'enable', run_at: '2026-10-03T08:00:00+07:00', status: 'cancelled' },
  ]);

  assert.deepEqual(grouped.get(3).map((schedule) => schedule.id), [3, 4]);
  assert.deepEqual(grouped.get(2).map((schedule) => schedule.id), [5]);
  assert.equal(grouped.has(1), false);
  assert.equal(getRoleAccessScheduleLabel(grouped.get(3)[0]), 'Nonaktif terjadwal');
  assert.equal(getRoleAccessScheduleLabel(grouped.get(3)[1]), 'Aktif terjadwal');
  assert.equal(groupPendingSchedulesByRole(undefined).size, 0);
});
