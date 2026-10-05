import { useParams } from 'react-router-dom';
import { BadgeCheck, Medal, ShieldAlert } from 'lucide-react';
import { usePublicAthleteCard } from '../hooks/queries/useAthleteCards';
import { athleteCardPhotoSrc, formatCardDate } from '../components/athletes/athleteCardUtils';
import logo from '../assets/koni-logo-card.png';

const MEDAL_STYLES = {
  Emas: 'bg-amber-100 text-amber-800 border-amber-300',
  Perak: 'bg-slate-100 text-slate-700 border-slate-300',
  Perunggu: 'bg-orange-100 text-orange-800 border-orange-300',
};

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <img src={logo} alt="" className="h-12 w-12 rounded-full bg-white p-1 shadow" />
          <div>
            <p className="text-sm font-extrabold text-slate-900 leading-tight">KONI Sumatera Barat</p>
            <p className="text-xs text-slate-500">Pemeriksaan keanggotaan atlet</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900 break-words">{value || '-'}</p>
    </div>
  );
}

export function PublicAthleteCardPage() {
  const { token } = useParams();
  const { data: card, isLoading, isError, error } = usePublicAthleteCard(token);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
        </div>
      </Shell>
    );
  }

  if (isError || !card) {
    const notFound = error?.response?.status === 404;
    return (
      <Shell>
        <div className="rounded-2xl bg-white p-6 text-center shadow">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mt-3 text-lg font-bold text-slate-900">
            {notFound ? 'Kartu tidak ditemukan' : 'Data belum dapat dimuat'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {notFound
              ? 'Kode QR tidak valid atau atlet tidak lagi terdaftar aktif.'
              : 'Terjadi gangguan. Silakan pindai ulang beberapa saat lagi.'}
          </p>
        </div>
      </Shell>
    );
  }

  const photo = athleteCardPhotoSrc(card.photo_url);
  const achievements = card.achievements || [];

  return (
    <Shell>
      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="bg-[#f7cd0d] px-5 pb-16 pt-5">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${card.expired ? 'bg-red-700 text-white' : 'bg-[#12263f] text-[#f7cd0d]'}`}>
            <BadgeCheck className="h-4 w-4" />
            {card.expired ? 'Kartu kedaluwarsa' : 'Anggota terdaftar'}
          </span>
        </div>
        <div className="-mt-12 flex flex-col items-center px-5 pb-6">
          <div className="h-40 w-32 overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow">
            {photo ? (
              <img src={photo} alt={`Foto ${card.name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">Tanpa foto</div>
            )}
          </div>
          <h1 className="mt-3 text-center text-xl font-extrabold text-slate-900">{card.name}</h1>
          <div className="mt-4 grid w-full grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <Info label="Asal KONI" value={card.organization_name} />
            <Info label="Cabor" value={card.cabor_name} />
            <Info label="No. anggota" value={card.member_number} />
            <Info label="Berlaku s.d." value={card.valid_until ? formatCardDate(card.valid_until) : '-'} />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-5 shadow">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Medal className="h-5 w-5 text-red-600" /> Prestasi
        </h2>
        {achievements.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Belum ada prestasi yang dipublikasikan.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {achievements.map((item, index) => (
              <li key={`${item.event_name}-${item.class_name}-${item.date}-${index}`} className="flex items-start gap-3">
                <span className={`mt-0.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${MEDAL_STYLES[item.medal] || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                  {item.medal}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.event_name}</p>
                  <p className="text-xs text-slate-600">
                    {[item.cabor_name, item.class_name].filter(Boolean).join(' - ')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
