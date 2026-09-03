import test from 'node:test';
import assert from 'node:assert/strict';
import { getClusterErrorMessage } from './clusterErrors.js';

test('backend code has priority over backend technical text', () => {
  const error = {
    response: {
      status: 422,
      data: {
        code: 'development_fund_period_required',
        error: 'fund_date must be within an active athlete development period',
      },
    },
  };
  assert.equal(
    getClusterErrorMessage(error),
    'Tanggal biaya tidak berada dalam periode Binaan. Pilih tanggal sesuai Riwayat Kluster.',
  );
});

test('legacy backend messages remain compatible', () => {
  const error = {
    response: {
      status: 400,
      data: { error: 'sub_cluster_id is required for development cluster' },
    },
  };
  assert.equal(getClusterErrorMessage(error), 'Pilih sub-kluster untuk kluster Binaan ini.');
});

test('network errors get a friendly connection message', () => {
  assert.equal(
    getClusterErrorMessage(new Error('Network Error')),
    'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.',
  );
});

test('403 supports a module-specific permission message', () => {
  const error = { response: { status: 403, data: {} } };
  assert.equal(
    getClusterErrorMessage(error, 'fallback', { permissionMessage: 'Anda tidak memiliki izin untuk mengelola biaya pembinaan.' }),
    'Anda tidak memiliki izin untuk mengelola biaya pembinaan.',
  );
});

test('404 uses the configured not-found fallback', () => {
  const error = { response: { status: 404, data: {} } };
  assert.equal(
    getClusterErrorMessage(error, 'fallback', { notFoundMessage: 'Riwayat Kluster tidak ditemukan.' }),
    'Riwayat Kluster tidak ditemukan.',
  );
});

test('500 never exposes an unknown backend detail', () => {
  const error = {
    response: {
      status: 500,
      data: { error: 'pq: password=secret relation athlete_cluster_histories' },
    },
  };
  const message = getClusterErrorMessage(error);
  assert.equal(message, 'Server belum dapat memproses permintaan. Silakan coba beberapa saat lagi.');
  assert.equal(message.includes('password'), false);
  assert.equal(message.includes('pq:'), false);
});

test('known permission and master codes map directly', () => {
  assert.equal(
    getClusterErrorMessage({ response: { status: 403, data: { code: 'development_fund_forbidden' } } }),
    'Anda tidak memiliki izin untuk mengelola biaya pembinaan.',
  );
  assert.equal(
    getClusterErrorMessage({ response: { status: 409, data: { code: 'cluster_code_conflict' } } }),
    'Kode kluster sudah digunakan. Gunakan kode lain.',
  );
});

test('unknown validation errors use the status fallback instead of raw text', () => {
  const error = {
    response: {
      status: 422,
      data: { code: 'future_validation_code', error: 'technical validation detail' },
    },
  };
  assert.equal(getClusterErrorMessage(error), 'Data yang diisi belum valid. Periksa kembali lalu coba lagi.');
});