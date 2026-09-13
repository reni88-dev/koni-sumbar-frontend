import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_ROLE_ACCESS_MESSAGE_LABEL,
  buildRolesAccessRequest,
  filterRolesBySearch,
  getRoleDisabledMessageLabel,
  getSelectableRoles,
  isRoleAccessEnabled,
  pruneSelectedRoleIds,
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
