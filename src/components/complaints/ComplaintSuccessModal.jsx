import { useState } from 'react';
import { Check, CheckCircle2, Clipboard, ExternalLink, X } from 'lucide-react';

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

export function ComplaintSuccessModal({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const openWhatsApp = () => {
    if (result.whatsapp?.url) {
      window.open(result.whatsapp.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = async () => {
    try {
      await copyText(result.whatsapp?.message || '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="complaint-success-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></span>
            <div>
              <h2 id="complaint-success-title" className="text-xl font-bold text-slate-800">Pengaduan tersimpan</h2>
              <p className="mt-1 text-sm text-slate-500">Nomor tiket <strong className="text-slate-800">{result.data?.ticket_code}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {result.whatsappOpened ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">WhatsApp telah dibuka. Periksa isi pesan lalu tekan kirim dari aplikasi WhatsApp.</p>
          ) : result.whatsapp?.available ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">WhatsApp tidak terbuka otomatis atau popup diblokir. Gunakan tombol di bawah untuk membukanya.</p>
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Nomor WhatsApp Support belum dikonfigurasi. Tiket tetap tersimpan dan dapat dilihat pada riwayat.</p>
          )}

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pesan WhatsApp</p>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700">{result.whatsapp?.message}</pre>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={openWhatsApp}
              disabled={!result.whatsapp?.available || !result.whatsapp?.url}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" /> Buka WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!result.whatsapp?.message}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              {copied ? 'Pesan disalin' : 'Salin pesan'}
            </button>
          </div>
          <button type="button" onClick={onClose} className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50">Tutup</button>
        </div>
      </div>
    </div>
  );
}
