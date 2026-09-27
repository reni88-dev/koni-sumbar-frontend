// Message for a failed stored-document open. The backend returns 404 when the file is missing
// from storage (or was never uploaded) and 503 when storage cannot be reached.
export function getStoredDocumentOpenErrorMessage(label, status) {
  if (status === 404) {
    return `File ${label} tidak ditemukan di penyimpanan server. Unggah ulang dokumen melalui form edit.`;
  }
  if (status === 503) {
    return 'Penyimpanan dokumen sedang tidak dapat diakses. Coba lagi nanti.';
  }
  return `Gagal membuka ${label} tersimpan.`;
}
