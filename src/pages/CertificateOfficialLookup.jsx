import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { PublicCertificateShell } from '../components/certificates/PublicCertificateShell';
import { CertificateDownloadButton } from '../components/certificates/CertificateDownloadButton';
import { fetchOfficialCertificatePdf, lookupOfficialCertificates } from '../hooks/queries/usePortal';
import { certificateBadgeClass, certificateFilename } from '../lib/certificate';

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100';

export function CertificateOfficialLookupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setItems(null);
    try {
      setItems(await lookupOfficialCertificates(name.trim(), phone.trim()));
    } catch (err) {
      setError(err?.response?.status === 429
        ? 'Terlalu banyak percobaan. Coba lagi sebentar lagi.'
        : 'Pencarian belum dapat dilakukan. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicCertificateShell title="Sertifikat Official" subtitle="KONI Sumatera Barat - Porprov">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Masukkan nama dan nomor HP sesuai yang didaftarkan oleh kontingen. Keduanya harus cocok.</p>
        <label className="block text-sm font-medium text-slate-700">
          Nama lengkap
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} autoComplete="name" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Nomor HP
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim() || !phone.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {busy ? 'Mencari...' : 'Cari Sertifikat'}
        </button>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </form>

      {items && items.length === 0 && (
        <div role="status" className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          Sertifikat tidak ditemukan. Pastikan nama dan nomor HP sama dengan data yang didaftarkan, atau hubungi admin kontingen Anda.
        </div>
      )}
      {items && items.map((item) => (
        <article key={item.verify_code} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <span className={certificateBadgeClass(0)}>{item.title}</span>
            <p className="font-semibold text-slate-800">{item.recipient_name}</p>
            <p className="text-xs text-slate-500">{item.event_name}{item.year ? ` ${item.year}` : ''}{item.contingent_name ? ` - Kontingen ${item.contingent_name}` : ''}</p>
          </div>
          <CertificateDownloadButton
            loadBlob={() => fetchOfficialCertificatePdf(item.download_token)}
            filename={certificateFilename(item)}
          />
        </article>
      ))}
    </PublicCertificateShell>
  );
}
