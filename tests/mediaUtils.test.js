import assert from 'node:assert/strict';
import { Blob, File as NodeFile } from 'node:buffer';
import test from 'node:test';

import {
  compressImageForUpload,
  prepareDocumentForUpload,
  validateSourceFile,
} from '../src/components/form-modal/mediaUtils.js';

function installCanvasMock(t, outputMime) {
  const originalImage = globalThis.Image;
  const originalDocument = globalThis.document;
  const originalFile = globalThis.File;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let toBlobCalls = 0;
  let revokedUrl = '';

  globalThis.File = NodeFile;
  globalThis.Image = class MockImage {
    width = 1200;
    height = 600;

    set src(value) {
      this.source = value;
      queueMicrotask(() => this.onload?.());
    }
  };
  globalThis.document = {
    createElement(tagName) {
      assert.equal(tagName, 'canvas');
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage() {} }),
        toBlob(callback, requestedMime, quality) {
          toBlobCalls += 1;
          assert.equal(requestedMime, 'image/webp');
          assert.equal(quality, 0.82);
          callback(new Blob(['encoded-image'], { type: outputMime }));
        },
      };
    },
  };
  URL.createObjectURL = () => 'blob:source-image';
  URL.revokeObjectURL = (url) => {
    revokedUrl = url;
  };

  t.after(() => {
    globalThis.Image = originalImage;
    globalThis.document = originalDocument;
    globalThis.File = originalFile;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  return {
    getToBlobCalls: () => toBlobCalls,
    getRevokedUrl: () => revokedUrl,
  };
}

function sourceFile(name, type) {
  return new NodeFile(['source-image'], name, { type });
}

test('compressImageForUpload memakai WebP aktual untuk nama dan MIME file', async (t) => {
  const canvas = installCanvasMock(t, 'image/webp');

  const result = await compressImageForUpload(sourceFile('portrait.jpg', 'image/jpeg'), { maxWidth: 800 });

  assert.equal(result.name, 'portrait.webp');
  assert.equal(result.type, 'image/webp');
  assert.equal(canvas.getToBlobCalls(), 1);
  assert.equal(canvas.getRevokedUrl(), 'blob:source-image');
});

test('compressImageForUpload menormalkan fallback canvas PNG', async (t) => {
  installCanvasMock(t, 'image/png');

  const result = await compressImageForUpload(sourceFile('identity.jpeg', 'image/jpeg'), { maxLongest: 1600 });

  assert.equal(result.name, 'identity.png');
  assert.equal(result.type, 'image/png');
});

test('compressImageForUpload memakai ekstensi jpg untuk keluaran JPEG', async (t) => {
  installCanvasMock(t, 'image/jpeg');

  const result = await compressImageForUpload(sourceFile('photo.png', 'image/png'), { maxWidth: 800 });

  assert.equal(result.name, 'photo.jpg');
  assert.equal(result.type, 'image/jpeg');
});

test('compressImageForUpload menolak MIME encoder yang tidak dikenal sebelum upload', async (t) => {
  installCanvasMock(t, 'application/octet-stream');

  await assert.rejects(
    compressImageForUpload(sourceFile('photo.png', 'image/png'), { maxWidth: 800 }),
    /Format hasil kompresi gambar tidak didukung/,
  );
});

test('compressImageForUpload menolak MIME encoder kosong sebelum upload', async (t) => {
  installCanvasMock(t, '');

  await assert.rejects(
    compressImageForUpload(sourceFile('photo.jpg', 'image/jpeg'), { maxWidth: 800 }),
    /Format hasil kompresi gambar tidak didukung/,
  );
});
test('prepareDocumentForUpload mengirim PDF asli tanpa memanggil canvas', async (t) => {
  const canvas = installCanvasMock(t, 'image/webp');
  const pdf = sourceFile('identity.pdf', 'application/pdf');

  const result = await prepareDocumentForUpload(pdf, { maxLongest: 1600 });

  assert.equal(result, pdf);
  assert.equal(canvas.getToBlobCalls(), 0);
});
test('validateSourceFile menolak HEIC/HEIF dengan panduan konversi tanpa membuka canvas', () => {
  for (const [name, type] of [
    ['photo.heic', 'image/heic'],
    ['photo.heif', 'image/heif'],
    ['photo.jpg', 'image/heic-sequence'],
    ['photo.jpeg', 'image/heif-sequence'],
  ]) {
    assert.throws(
      () => validateSourceFile(sourceFile(name, type), { allowPDF: false }),
      /HEIC\/HEIF belum didukung.*Konversi file ke JPG, PNG, atau WebP/,
    );
  }
});
