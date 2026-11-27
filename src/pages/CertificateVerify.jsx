import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { BadgeCheck, Loader2, ShieldX } from 'lucide-react';
import { PublicCertificateShell } from '../components/certificates/PublicCertificateShell';
import { fetchCertificateVerification } from '../hooks/queries/usePortal';
import { certificateBadgeClass } from '../lib/certificate';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export function CertificateVerifyPage() {
  const { code } = useParams();
  const query = useQuery({
    queryKey: ['public-certificate', code],
    queryFn: () => fetchCertificateVerification(code),
    retry: false,
  });
  const notFound = query.isError && query.error?.response?.status === 404;
  const data = query.data;

  return (
    <PublicCertificateShell title="Verifikasi Sertifikat" subtitle="KONI Sumatera Barat - Porprov">
      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : query.isError ? (
        <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <ShieldX className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-3 font-semibold text-slate-800">{notFound ? 'Sertifikat tidak ditemukan' : 'Verifikasi belum dapat dilakukan'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {notFound ? 'Kode tidak dikenali atau sertifikat ini tidak lagi berlaku. Periksa kembali kode QR pada sertifikat.' : 'Terjadi kendala. Silakan coba beberapa saat lagi.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-9 w-9 shrink-0 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Sertifikat sah</h2>
              <p className="text-xs text-slate-500">Data berikut sesuai dengan catatan penyelenggara.</p>
            </div>
          </div>
          <div className="mt-4"><span className={certificateBadgeClass(data.medal_rank)}>{data.title}</span></div>
          <dl className="mt-3 divide-y divide-slate-100">
            <Row label="Nama" value={data.recipient_name} />
            <Row label="Kontingen" value={data.contingent_name} />
            <Row label="Cabang olahraga" value={data.cabor_name} />
            <Row label="Kelas" value={data.class_name} />
            <Row label="Event" value={`${data.event_name}${data.year ? ` ${data.year}` : ''}`} />
            <Row label="Kode" value={data.verify_code} />
          </dl>
        </div>
      )}
    </PublicCertificateShell>
  );
}
