import assert from 'node:assert/strict';
import test from 'node:test';

import { certificateBadgeClass, certificateFilename, groupCertificatesByEvent } from '../src/lib/certificate.js';

test('certificateFilename menghasilkan nama berkas aman', () => {
  assert.equal(
    certificateFilename({ recipient_name: 'Budi / Santoso', verify_code: 'A4.abc-_' }),
    'Sertifikat_Budi_Santoso_A4abc.pdf',
  );
  assert.equal(certificateFilename({ verify_code: 'O1.x' }), 'Sertifikat_sertifikat_O1x.pdf');
});

test('certificateBadgeClass membedakan medali dan peserta', () => {
  assert.match(certificateBadgeClass(1), /amber/);
  assert.match(certificateBadgeClass(2), /slate/);
  assert.match(certificateBadgeClass(3), /orange/);
  assert.match(certificateBadgeClass(0), /red/);
});

test('groupCertificatesByEvent mengelompokkan per event dan menjaga urutan', () => {
  const groups = groupCertificatesByEvent([
    { event_id: 2, event_name: 'B', year: 2026, verify_code: 'a' },
    { event_id: 1, event_name: 'A', year: 2022, verify_code: 'b' },
    { event_id: 2, event_name: 'B', year: 2026, verify_code: 'c' },
  ]);
  assert.deepEqual(groups.map((g) => [g.eventName, g.items.length]), [['B', 2], ['A', 1]]);
});
