import assert from 'node:assert/strict';
import { Blob } from 'node:buffer';
import test from 'node:test';

import {
  fetchAndOpenStoredDocument,
  getAthleteStoredDocumentOpenError,
  revokeStoredDocumentObjectUrls,
} from '../src/components/athlete-form/athleteDocumentPreview.js';

test('dokumen atlet diambil sebagai blob dan diarahkan ke tab yang sudah dibuka', async () => {
  const controller = new AbortController();
  const blob = new Blob(['identity'], { type: 'application/pdf' });
  const calls = [];
  let openedUrl = '';
  const previewWindow = {
    close() {},
    location: {
      replace(url) {
        openedUrl = url;
      },
    },
  };

  const objectUrl = await fetchAndOpenStoredDocument({
    apiClient: {
      async get(url, config) {
        calls.push({ url, config });
        return { data: blob };
      },
    },
    documentUrl: '/api/athletes/12/identity-document?t=123',
    signal: controller.signal,
    isCurrent: () => true,
    previewWindow,
    createObjectURL: (value) => {
      assert.equal(value, blob);
      return 'blob:athlete-identity';
    },
    documentRef: null,
  });

  assert.equal(objectUrl, 'blob:athlete-identity');
  assert.equal(openedUrl, 'blob:athlete-identity');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/athletes/12/identity-document?t=123');
  assert.equal(calls[0].config.responseType, 'blob');
  assert.equal(calls[0].config.signal, controller.signal);
});

test('popup blocker menggunakan tautan fallback menuju object URL', async () => {
  const controller = new AbortController();
  const appended = [];
  let clicked = false;
  let removed = false;
  const link = {
    click() {
      clicked = true;
    },
    remove() {
      removed = true;
    },
  };
  const documentRef = {
    createElement(tagName) {
      assert.equal(tagName, 'a');
      return link;
    },
    body: {
      appendChild(element) {
        appended.push(element);
      },
    },
  };

  const objectUrl = await fetchAndOpenStoredDocument({
    apiClient: { get: async () => ({ data: new Blob(['bpjs']) }) },
    documentUrl: '/api/athletes/12/bpjs-document',
    signal: controller.signal,
    isCurrent: () => true,
    previewWindow: null,
    createObjectURL: () => 'blob:athlete-bpjs',
    documentRef,
  });

  assert.equal(objectUrl, 'blob:athlete-bpjs');
  assert.deepEqual(appended, [link]);
  assert.equal(link.href, 'blob:athlete-bpjs');
  assert.equal(link.target, '_blank');
  assert.equal(link.rel, 'noopener noreferrer');
  assert.equal(clicked, true);
  assert.equal(removed, true);
});

test('request yang sudah dibatalkan menutup tab kosong dan tidak membuat object URL', async () => {
  const controller = new AbortController();
  let closed = false;
  let objectUrlCreated = false;

  const result = await fetchAndOpenStoredDocument({
    apiClient: {
      async get() {
        controller.abort();
        return { data: new Blob(['identity']) };
      },
    },
    documentUrl: '/api/athletes/12/identity-document',
    signal: controller.signal,
    isCurrent: () => true,
    previewWindow: {
      close() {
        closed = true;
      },
    },
    createObjectURL: () => {
      objectUrlCreated = true;
      return 'blob:should-not-exist';
    },
    documentRef: null,
  });

  assert.equal(result, '');
  assert.equal(closed, true);
  assert.equal(objectUrlCreated, false);
});

test('cleanup me-revoke seluruh object URL dokumen yang tersimpan', () => {
  const revoked = [];

  revokeStoredDocumentObjectUrls({
    identity: 'blob:athlete-identity',
    bpjs: 'blob:athlete-bpjs',
    empty: '',
  }, (url) => revoked.push(url));

  assert.deepEqual(revoked, ['blob:athlete-identity', 'blob:athlete-bpjs']);
});

test('pesan pembukaan dokumen atlet membedakan 404 dan kegagalan lain', () => {
  assert.equal(
    getAthleteStoredDocumentOpenError('identity', 404),
    'Dokumen identitas tersimpan tidak ditemukan.',
  );
  assert.equal(
    getAthleteStoredDocumentOpenError('bpjs', 404),
    'Dokumen BPJS tersimpan tidak ditemukan.',
  );
  assert.equal(
    getAthleteStoredDocumentOpenError('identity', 500),
    'Gagal membuka dokumen identitas tersimpan.',
  );
});
