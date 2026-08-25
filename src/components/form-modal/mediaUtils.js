export const MAX_SOURCE_FILE_SIZE = 10 * 1024 * 1024;
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const DOCUMENT_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';

const DOCUMENT_MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

export function validateSourceFile(file, { allowPDF }) {
  if (file.size > MAX_SOURCE_FILE_SIZE) {
    throw new Error('Ukuran file sumber maksimal 10 MB.');
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const expectedMime = DOCUMENT_MIME_BY_EXTENSION[extension];
  if (extension === 'heic' || extension === 'heif') {
    throw new Error('Format HEIC/HEIF belum didukung. Konversi file ke JPG, PNG, atau WebP terlebih dahulu.');
  }
  if (!expectedMime || (!allowPDF && extension === 'pdf')) {
    throw new Error(allowPDF
      ? 'Format file harus PDF, JPG, PNG, atau WebP.'
      : 'Format file harus JPG, PNG, atau WebP.');
  }
  if (file.type && file.type !== expectedMime) {
    throw new Error('Ekstensi file tidak sesuai dengan tipe file.');
  }
  return { extension, expectedMime };
}

export function compressImageToWebP(file, { maxWidth, maxLongest }) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    const release = () => URL.revokeObjectURL(sourceUrl);

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const widthScale = maxWidth ? Math.min(maxWidth / image.width, 1) : 1;
      const longestScale = maxLongest ? Math.min(maxLongest / Math.max(image.width, image.height), 1) : 1;
      const scale = Math.min(widthScale, longestScale);
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        release();
        reject(new Error('File gambar gagal diproses. Silakan pilih file lain.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        release();
        if (!blob) {
          reject(new Error('File gambar gagal diproses. Silakan pilih file lain.'));
          return;
        }
        const baseName = file.name.replace(/\.[^/.]+$/, '') || 'document';
        resolve(new File([blob], `${baseName}.webp`, {
          type: 'image/webp',
          lastModified: Date.now()
        }));
      }, 'image/webp', 0.82);
    };
    image.onerror = () => {
      release();
      reject(new Error('Format gambar tidak dapat diproses. Gunakan JPG, PNG, atau WebP.'));
    };
    image.src = sourceUrl;
  });
}
