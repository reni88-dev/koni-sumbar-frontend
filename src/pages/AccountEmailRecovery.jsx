import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, MailCheck, ShieldCheck, UserRoundCheck } from 'lucide-react';
import api from '../api/axios';
import { TurnstileWidget } from '../components/TurnstileWidget';
import koniLogo from '../assets/koni-sumbar.jpg';

const steps = ['Identitas', 'Konfirmasi', 'Email Baru', 'Verifikasi'];

function recoveryError(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || fallback;
}

export function AccountEmailRecovery() {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState('athlete');
  const [nik, setNik] = useState('');
  const [noKK, setNoKK] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const [profile, setProfile] = useState(null);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetCaptcha = () => {
    setTurnstileToken('');
    setTurnstileVersion((current) => current + 1);
  };

  const handleLookup = async (event) => {
    event.preventDefault();
    if (!turnstileToken) {
      setError('Selesaikan verifikasi keamanan terlebih dahulu.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/account-email-recovery/lookup', {
        account_type: accountType,
        nik,
        no_kk: accountType === 'athlete' ? noKK : '',
        birth_date: accountType === 'coach' ? birthDate : '',
        turnstile_token: turnstileToken,
      });
      setProfile(response.data.profile);
      setRecoveryToken(response.data.recovery_token);
      setNik('');
      setNoKK('');
      setBirthDate('');
      setTurnstileToken('');
      setStep(1);
    } catch (lookupError) {
      setError(recoveryError(lookupError, 'Data tidak dapat diverifikasi atau akun tidak memenuhi syarat.'));
      resetCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError('Konfirmasi email tidak sama.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/api/account-email-recovery/submit', {
        recovery_token: recoveryToken,
        email,
        confirm_email: confirmEmail,
      });
      setRecoveryToken('');
      setEmail('');
      setConfirmEmail('');
      setStep(3);
    } catch (submitError) {
      setError(recoveryError(submitError, 'Email baru tidak dapat diproses. Silakan periksa kembali.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const restart = () => {
    setStep(0);
    setProfile(null);
    setRecoveryToken('');
    setEmail('');
    setConfirmEmail('');
    setError('');
    setTurnstileError('');
    resetCaptcha();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600">
            <ArrowLeft className="h-4 w-4" /> Kembali ke login
          </Link>
          <div className="flex items-center gap-3">
            <img src={koniLogo} alt="Logo KONI Sumbar" className="h-11 w-11 rounded-xl border border-slate-200 bg-white object-contain p-1" />
            <div className="hidden sm:block">
              <p className="font-bold text-slate-800">KONI Sumbar</p>
              <p className="text-xs text-slate-500">Pemulihan Email Akun</p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="bg-gradient-to-r from-red-700 to-red-600 px-6 py-7 text-white sm:px-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-white/15 p-3"><ShieldCheck className="h-7 w-7" /></div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Pemulihan Email</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-red-100">Khusus akun atlet atau pelatih yang masih diwajibkan mengganti password. Data identitas hanya digunakan untuk verifikasi.</p>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <div className="grid grid-cols-4 gap-2">
              {steps.map((label, index) => (
                <div key={label} className="text-center">
                  <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${index <= step ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <p className={`mt-2 text-[11px] font-semibold sm:text-xs ${index <= step ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {error && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><span>{error}</span></div>}

            {step === 0 && (
              <form onSubmit={handleLookup} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Verifikasi identitas</h2>
                  <p className="mt-1 text-sm text-slate-500">Pilih jenis akun dan isi data secara tepat.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['athlete', 'Atlet'], ['coach', 'Pelatih']].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => { setAccountType(value); setError(''); }} className={`rounded-2xl border px-4 py-4 text-sm font-bold transition ${accountType === value ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-100' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>{label}</button>
                  ))}
                </div>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">NIK</span>
                  <input value={nik} onChange={(event) => setNik(event.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric" autoComplete="off" required minLength={16} maxLength={16} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100" placeholder="16 digit NIK" />
                </label>
                {accountType === 'athlete' ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">No. KK</span>
                    <input value={noKK} onChange={(event) => setNoKK(event.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric" autoComplete="off" required minLength={16} maxLength={16} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100" placeholder="16 digit nomor kartu keluarga" />
                  </label>
                ) : (
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Tanggal lahir</span>
                    <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} autoComplete="off" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100" />
                  </label>
                )}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <TurnstileWidget key={turnstileVersion} onTokenChange={(token) => { setTurnstileToken(token); setTurnstileError(''); }} onError={setTurnstileError} />
                  {turnstileError && <p className="mt-2 text-xs text-red-600">{turnstileError}</p>}
                </div>
                <button disabled={isSubmitting || !turnstileToken} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserRoundCheck className="h-5 w-5" />} Verifikasi identitas
                </button>
              </form>
            )}

            {step === 1 && profile && (
              <div className="space-y-6">
                <div><h2 className="text-xl font-bold text-slate-800">Konfirmasi profil</h2><p className="mt-1 text-sm text-slate-500">Pastikan profil ringkas berikut merupakan akun Anda.</p></div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Identitas terverifikasi</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div><dt className="text-slate-500">Nama lengkap</dt><dd className="font-bold text-slate-800">{profile.name || '-'}</dd></div>
                    <div><dt className="text-slate-500">Organisasi</dt><dd className="font-semibold text-slate-700">{profile.organization || '-'}</dd></div>
                    <div><dt className="text-slate-500">Cabang olahraga</dt><dd className="font-semibold text-slate-700">{profile.cabor || '-'}</dd></div>
                  </dl>
                </div>
                <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">Demi keamanan, email lama dan data identitas lainnya tidak ditampilkan.</p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={restart} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">Bukan akun saya</button>
                  <button type="button" onClick={() => { setError(''); setStep(2); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Lanjutkan <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div><h2 className="text-xl font-bold text-slate-800">Masukkan email baru</h2><p className="mt-1 text-sm text-slate-500">Tautan verifikasi satu kali akan dikirim ke alamat ini dan berlaku 30 menit.</p></div>
                <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">Email baru</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100" placeholder="nama@email.com" /></label>
                <label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">Konfirmasi email baru</span><input type="email" value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} autoComplete="off" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100" placeholder="Ulangi email baru" /></label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => { setError(''); setStep(1); }} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">Kembali</button>
                  <button disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60">{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailCheck className="h-5 w-5" />} Kirim tautan verifikasi</button>
                </div>
              </form>
            )}

            {step === 3 && (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><MailCheck className="h-8 w-8" /></div>
                <h2 className="mt-5 text-2xl font-bold text-slate-800">Periksa email baru Anda</h2>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Klik tautan verifikasi dalam 30 menit. Permintaan baru diteruskan ke admin setelah email berhasil diverifikasi.</p>
                <p className="mx-auto mt-4 max-w-lg rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Setelah verifikasi, admin organisasi Anda memiliki waktu maksimal tujuh hari untuk meninjau permintaan.</p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={restart} className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">Mulai ulang</button><Link to="/login" className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">Kembali ke login</Link></div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}