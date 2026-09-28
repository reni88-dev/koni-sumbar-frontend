import test from 'node:test';
import assert from 'node:assert/strict';
import { transferStatusLabel, transferStatusStyle } from '../src/components/coach-transfers/transferPresentation.js';

test('status transfer pelatih menggunakan label Bahasa Indonesia', () => {
  assert.equal(transferStatusLabel('pending_destination'), 'Menunggu Persetujuan Tujuan');
  assert.equal(transferStatusLabel('pending_koni'), 'Menunggu Persetujuan KONI Sumbar');
  assert.equal(transferStatusLabel('completed'), 'Selesai');
  assert.equal(transferStatusLabel('rejected_destination'), 'Ditolak Tujuan');
  assert.equal(transferStatusLabel('rejected_koni'), 'Ditolak KONI Sumbar');
  assert.equal(transferStatusLabel('cancelled'), 'Dibatalkan');
});

test('seluruh status publik transfer memiliki gaya badge', () => {
  for (const status of ['pending_destination', 'pending_koni', 'completed', 'rejected_destination', 'rejected_koni', 'cancelled']) {
    assert.match(transferStatusStyle(status), /bg-/);
    assert.match(transferStatusStyle(status), /text-/);
  }
});
