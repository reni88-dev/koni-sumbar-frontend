import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { triggerBlobDownload } from '../../features/data-quality-report/exportUtils.js';

// Body error berupa Blob (responseType: 'blob'), jadi pesan dipetakan dari status HTTP.
function errorMessage(error) {
  const status = error?.response?.status;
  if (status === 404) return 'Sertifikat tidak tersedia.';
  if (status === 403) return 'Anda tidak berhak mengunduh sertifikat ini.';
  if (status === 429) return 'Terlalu banyak permintaan. Coba lagi sebentar lagi.';
  return 'Sertifikat belum dapat diunduh. Silakan coba kembali.';
}

/** `loadBlob` mengembalikan Blob PDF; berkas disimpan lewat object URL (tidak ada tautan langsung). */
export function CertificateDownloadButton({ loadBlob, filename }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      triggerBlobDownload(await loadBlob(), filename);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {busy ? 'Menyiapkan...' : 'Unduh PDF'}
      </button>
      {error && <p role="alert" className="max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}
