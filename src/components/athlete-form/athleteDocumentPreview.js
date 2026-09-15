export async function fetchAndOpenStoredDocument({
  apiClient,
  documentUrl,
  signal,
  isCurrent,
  previewWindow,
  createObjectURL,
  documentRef,
}) {
  const response = await apiClient.get(documentUrl, {
    responseType: 'blob',
    signal,
  });
  if (!isCurrent() || signal.aborted) {
    previewWindow?.close();
    return '';
  }

  const objectUrl = createObjectURL(response.data);
  if (previewWindow) {
    previewWindow.location.replace(objectUrl);
  } else {
    const link = documentRef.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    documentRef.body.appendChild(link);
    link.click();
    link.remove();
  }
  return objectUrl;
}

export function revokeStoredDocumentObjectUrls(urls, revokeObjectURL) {
  Object.values(urls).forEach((url) => {
    if (url) revokeObjectURL(url);
  });
}

export function getAthleteStoredDocumentOpenError(kind, status) {
  const label = kind === 'identity' ? 'dokumen identitas' : 'dokumen BPJS';
  return status === 404
    ? `${label[0].toUpperCase()}${label.slice(1)} tersimpan tidak ditemukan.`
    : `Gagal membuka ${label} tersimpan.`;
}
