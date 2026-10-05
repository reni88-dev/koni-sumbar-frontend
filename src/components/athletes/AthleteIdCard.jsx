import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { athleteCardPhotoSrc, athleteCardPublicUrl, formatCardDate } from './athleteCardUtils';
import logo from '../../assets/koni-logo-card.png';
import './athleteIdCard.css';

function nameSizeClass(name) {
  if (name.length > 24) return 'sm';
  if (name.length > 16) return 'md';
  return '';
}

function PhotoPlaceholder() {
  return (
    <svg viewBox="0 0 24 30" aria-label="Foto belum tersedia">
      <rect width="24" height="30" fill="#e8eef5" />
      <circle cx="12" cy="11" r="5" fill="#8aa2bd" />
      <path d="M2 30c0-8 4-12 10-12s10 4 10 12z" fill="#8aa2bd" />
    </svg>
  );
}

// Foto bisa hilang dari storage meski record punya path; saat gambar gagal dimuat tampilkan
// siluet, bukan ikon gambar rusak. Pemanggil memberi key={src} agar status gagal ter-reset.
function CardPhoto({ src }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <PhotoPlaceholder />;
  return <img src={src} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} />;
}

/** Sisi depan kartu. `item` berasal dari POST /api/athlete-cards/render-data. */
export function AthleteIdCardFront({ item, validUntil }) {
  const photo = athleteCardPhotoSrc(item.photo_url);
  const cardName = item.name.toLocaleUpperCase('id-ID');
  return (
    <div className="kic" aria-label="Kartu anggota bagian depan">
      <div className="a yel" />
      <div className="a hole" />
      <div className="a logo">
        <div className="badge"><img src={logo} alt="" /></div>
        <span>KONI<br />Sumatera Barat</span>
      </div>
      <div className="a tier">{item.member_type_label || 'ATLET'}</div>
      <div className="a photo">
        <CardPhoto key={photo} src={photo} />
      </div>
      <p className={`a name ${nameSizeClass(cardName)}`}>{cardName}</p>
      <div className="a pair">
        <p><span className="lbl">Asal KONI</span><span className="val">{item.organization_name || '-'}</span></p>
        <p><span className="lbl">Cabor</span><span className="val">{item.cabor_name || '-'}</span></p>
      </div>
      <div className="a dv" />
      <div className="a grid">
        <p><span className="lbl">No. anggota</span><span className="val">-</span></p>
        <p><span className="lbl">Berlaku s.d.</span><span className="val">{formatCardDate(validUntil)}</span></p>
        <p className="span2"><span className="lbl">ID Nasional</span><span className="val">{item.national_number || '-'}</span></p>
      </div>
      <div className="a strip" />
    </div>
  );
}

/** Sisi belakang kartu; QR membuka halaman publik atlet. */
export function AthleteIdCardBack({ item }) {
  return (
    <div className="kic back" aria-label="Kartu anggota bagian belakang">
      <div className="a hole" />
      <div className="a b-logo badge"><img src={logo} alt="" /></div>
      <div className="a panel">
        <div className="a qr"><QRCodeSVG value={athleteCardPublicUrl(item.token)} size={256} level="M" marginSize={0} /></div>
        <p className="a cap">Pindai untuk memeriksa keanggotaan</p>
        <div className="a pdv" />
        <p className="a ci" style={{ top: '71cqw' }}><i />www.konisumbar.or.id</p>
        <p className="a ci" style={{ top: '77.5cqw' }}><i />info@konisumbar.or.id</p>
        <p className="a ci" style={{ top: '84cqw' }}><i />Padang, Sumatera Barat</p>
      </div>
      <p className="a terms"><b>Ketentuan.</b> Kartu ini milik KONI Sumatera Barat, hanya berlaku untuk pemegang yang tertera, dan tidak boleh dipindahtangankan. Jika hilang, hubungi sekretariat.</p>
      <div className="a strip" />
    </div>
  );
}
