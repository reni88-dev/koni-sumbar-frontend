import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import api from '../api/axios';
import koniLogo from '../assets/koni-sumbar.jpg';

export function AccountEmailRecoveryVerification() {
  const initialToken = new URLSearchParams(window.location.search).get('token') || '';
  const tokenRef = useRef(initialToken);
  const startedRef = useRef(false);
  const [status, setStatus] = useState(initialToken ? 'loading' : 'error');
  const [message, setMessage] = useState(initialToken ? 'Memverifikasi email baru Anda...' : 'Tautan verifikasi tidak valid atau sudah kedaluwarsa.');

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const token = tokenRef.current;
    window.history.replaceState({}, document.title, '/pemulihan-email/verifikasi');
    tokenRef.current = '';
    if (!token) return;

    api.post('/api/account-email-recovery/verify', { token })
      .then((response) => {
        setStatus('success');
        setMessage(response.data.message || 'Email berhasil diverifikasi dan menunggu persetujuan admin.');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Tautan verifikasi tidak valid, sudah digunakan, atau sudah kedaluwarsa.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={koniLogo} alt="Logo KONI Sumbar" className="h-12 w-12 rounded-xl border border-slate-200 bg-white object-contain p-1" />
          <div><p className="font-bold text-slate-800">KONI Sumbar</p><p className="text-xs text-slate-500">Verifikasi Pemulihan Email</p></div>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-200/50 sm:p-10">
          {status === 'loading' && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {status === 'success' && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>}
          {status === 'error' && <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"><AlertCircle className="h-8 w-8" /></div>}
          <h1 className="mt-5 text-2xl font-bold text-slate-800">{status === 'loading' ? 'Memverifikasi email' : status === 'success' ? 'Email berhasil diverifikasi' : 'Verifikasi gagal'}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          {status === 'success' && <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-sm leading-6 text-slate-600"><div className="flex gap-3"><MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p>Permintaan kini menunggu admin dari organisasi yang sama. Jika disetujui, kredensial sementara akan dikirim ke email yang sudah diverifikasi.</p></div></div>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/pemulihan-email" className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">Pemulihan email</Link><Link to="/login" className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Kembali ke login</Link></div>
        </section>
      </div>
    </div>
  );
}