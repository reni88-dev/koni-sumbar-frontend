import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Image as ImageIcon,
  Loader2,
  Search,
} from 'lucide-react';
import api from '../api/axios';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

const COACH_PHOTO_PREFIX = 'coaches/photos/';

function fallbackResolvedObjectKey(value) {
  const trimmedValue = value.trim();
  if (trimmedValue.startsWith(`/${COACH_PHOTO_PREFIX}`)) {
    return trimmedValue.slice(1);
  }
  if (trimmedValue.startsWith(COACH_PHOTO_PREFIX)) {
    return trimmedValue;
  }
  return `${COACH_PHOTO_PREFIX}${trimmedValue}`;
}

function formatBlobSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KiB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MiB`;
}

function getPhotoCheckError(status) {
  switch (status) {
    case 400:
      return 'Object key tidak valid. Gunakan nama file atau key yang berada di bawah prefix coaches/photos/.';
    case 403:
      return 'Akses ditolak. Pemeriksaan foto ini hanya dapat digunakan oleh superadmin.';
    case 404:
      return 'Object tidak ditemukan atau tidak dapat dibaca dari MinIO.';
    case 503:
      return 'Storage MinIO belum tersedia atau belum dikonfigurasi.';
    default:
      return 'Gagal memeriksa object foto. Silakan coba lagi.';
  }
}

export function CoachPhotoCheckPage() {
  const { user } = useAuth();
  const [objectName, setObjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const objectURLRef = useRef(null);
  const abortControllerRef = useRef(null);

  const isSuperAdmin = user?.role_id === 1 || user?.role?.name === 'super_admin';

  useEffect(() => () => {
    const activeRequest = abortControllerRef.current;
    abortControllerRef.current = null;
    activeRequest?.abort();
    if (objectURLRef.current) {
      URL.revokeObjectURL(objectURLRef.current);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requestedObject = objectName.trim();

    if (!requestedObject) {
      setError('Masukkan nama file atau full object key terlebih dahulu.');
      return;
    }

    abortControllerRef.current?.abort();
    const requestController = new AbortController();
    abortControllerRef.current = requestController;
    if (objectURLRef.current) {
      URL.revokeObjectURL(objectURLRef.current);
      objectURLRef.current = null;
    }
    setResult(null);
    setError('');
    setIsLoading(true);

    try {
      const response = await api.get('/api/admin/coach-photo-check', {
        params: { object: requestedObject },
        responseType: 'blob',
        signal: requestController.signal,
      });
      const objectURL = URL.createObjectURL(response.data);
      objectURLRef.current = objectURL;
      setResult({
        objectURL,
        objectKey: response.headers['x-object-key'] || fallbackResolvedObjectKey(requestedObject),
        mimeType: response.data.type || response.headers['content-type'] || 'Tidak diketahui',
        size: response.data.size,
      });
    } catch (requestError) {
      if (requestError.code !== 'ERR_CANCELED') {
        setError(getPhotoCheckError(requestError.response?.status));
      }
    } finally {
      if (abortControllerRef.current === requestController) {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    }
  };

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout
      title="Cek Foto Pelatih"
      subtitle="Diagnostik langsung object foto pelatih di MinIO"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Pemeriksaan object MinIO</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Halaman ini membaca object secara langsung tanpa menggunakan data pada tabel pelatih.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Prefix aktif: <code className="font-semibold">{COACH_PHOTO_PREFIX}</code>. Anda dapat memasukkan
              nama file, nested path, atau full object key.
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="coach-photo-object" className="block text-sm font-semibold text-slate-700">
                Nama file atau object key
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="coach-photo-object"
                  type="text"
                  value={objectName}
                  onChange={(event) => setObjectName(event.target.value)}
                  placeholder="contoh: foto.jpg atau coaches/photos/foto.jpg"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                />
                <button
                  type="submit"
                  disabled={isLoading || !objectName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Cek Foto
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">Tekan Enter untuk menjalankan pemeriksaan.</p>
            </form>
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Pemeriksaan gagal</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 sm:px-6">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Object ditemukan</p>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3">
                <img
                  src={result.objectURL}
                  alt={`Foto dari object ${result.objectKey}`}
                  className="max-h-[65vh] max-w-full rounded-lg object-contain"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <ImageIcon className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">Informasi object</h3>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-medium text-slate-500">Resolved object key</dt>
                    <dd className="mt-1 break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800">
                      {result.objectKey}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">MIME type</dt>
                    <dd className="mt-1 break-all text-slate-800">{result.mimeType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Ukuran blob</dt>
                    <dd className="mt-1 text-slate-800">
                      {formatBlobSize(result.size)} ({result.size.toLocaleString('id-ID')} byte)
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
