import { Award, Loader2, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CertificateDownloadButton } from '../components/certificates/CertificateDownloadButton';
import { fetchPortalCertificatePdf, usePortalCertificates } from '../hooks/queries/usePortal';
import { certificateBadgeClass, certificateFilename, groupCertificatesByEvent } from '../lib/certificate';

export function PortalCertificatesPage() {
  const query = usePortalCertificates();
  const groups = groupCertificatesByEvent(query.data || []);

  return (
    <DashboardLayout title="Sertifikat" subtitle="Sertifikat digital Porprov Anda">
      <div className="space-y-6">
        {query.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : query.isError ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-800">Daftar sertifikat gagal dimuat.</p>
            <p className="mt-1 text-sm text-amber-700">Periksa koneksi Anda lalu coba kembali.</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />
              Coba Lagi
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Award className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">Belum ada sertifikat</h3>
            <p className="mt-1 text-sm text-slate-500">Sertifikat tersedia setelah pendaftaran disahkan dan hasil event dipublikasikan.</p>
          </div>
        ) : groups.map((group) => (
          <section key={`${group.eventName}-${group.year}`}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {group.eventName}{group.year ? ` ${group.year}` : ''}
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              {group.items.map((item) => {
                const isOfficial = item.kind === 'O';
                const id = isOfficial ? item.official_id : item.participant_id;
                return (
                  <article key={item.verify_code} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <span className={certificateBadgeClass(item.medal_rank)}>{item.title}</span>
                      <p className="truncate font-semibold text-slate-800">{item.cabor_name || (isOfficial ? 'Official' : '')}</p>
                      {!isOfficial && item.class_name && <p className="text-sm text-slate-500">{item.class_name}</p>}
                      {item.contingent_name && <p className="text-xs text-slate-400">Kontingen {item.contingent_name}</p>}
                    </div>
                    <CertificateDownloadButton
                      loadBlob={() => fetchPortalCertificatePdf(isOfficial ? 'official' : 'athlete', id)}
                      filename={certificateFilename(item)}
                    />
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
