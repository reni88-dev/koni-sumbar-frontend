import {
  PROFILE_PRINT_STYLES,
  buildProfilePhotoMarkup,
  escapePrintHtml,
  fetchProtectedImageDataUrl,
  openProfilePrintWindow,
  printProfileDocument,
} from '../profilePrintUtils';

const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
const maritalLabels = { single: 'Belum Menikah', married: 'Menikah', divorced: 'Cerai', widowed: 'Duda/Janda' };

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function renderPrintRow(label, value) {
  return `
    <div class="info-row">
      <div class="label">${escapePrintHtml(label)}</div>
      <div class="value">${escapePrintHtml(value)}</div>
    </div>`;
}

function formatPrintDate(dateStr) {
  return escapePrintHtml(formatDate(dateStr));
}

function renderIdentityItem(label, value) {
  return `
    <div class="identity-meta-item">
      <div class="identity-meta-label">${escapePrintHtml(label)}</div>
      <div class="identity-meta-value">${value}</div>
    </div>`;
}

export function buildAthleteProfilePrintHtml({
  athlete = {},
  educationLevelName,
  histories = [],
  funds = [],
  fundsTotalAmount,
  clusterError = false,
  fundsError = false,
  photoDataUrl = null,
}) {
  const safeHistories = Array.isArray(histories) ? histories : [];
  const safeFunds = Array.isArray(funds) ? funds : [];
  const printedAt = new Date();
  const printedDate = printedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const printedTime = printedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const calculatedFundsTotal = safeFunds.reduce((sum, fund) => sum + Number(fund.amount || 0), 0);
  const totalFunds = fundsTotalAmount === null || fundsTotalAmount === undefined || fundsTotalAmount === ''
    ? calculatedFundsTotal
    : Number(fundsTotalAmount || 0);
  const topAchievements = Array.isArray(athlete.top_achievements)
    ? athlete.top_achievements.filter(Boolean)
    : [];
  const printAchievements = topAchievements.length > 0 ? topAchievements : ['-'];
  const educationLevel = educationLevelName
    || athlete.education_level?.name
    || athlete.education_level_name
    || '-';
  const organizationName = athlete.organization?.name || athlete.organization_name;
  const competitionClassName = athlete.competition_class?.name || athlete.competition_class_name;
  const caborName = athlete.cabor?.display_name || athlete.cabor?.name;
  const currentCluster = athlete.current_cluster_label || 'Atlet Non Binaan';
  const currentSubCluster = athlete.current_sub_cluster_label;
  const clusterLabel = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;
  const activeStatus = athlete.is_active ? 'Aktif' : 'Nonaktif';
  const statusMarkup = `<span class="badge ${athlete.is_active ? 'badge-active' : 'badge-inactive'}">${escapePrintHtml(activeStatus)}</span>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PROFIL ATLET KONI SUMATERA BARAT</title>
  <style>${PROFILE_PRINT_STYLES}</style>
</head>
<body>
  <div class="header">
    <h1>PROFIL ATLET</h1>
    <h2>KONI SUMATERA BARAT</h2>
  </div>

  <div class="identity-card">
    ${buildProfilePhotoMarkup({ photoDataUrl, name: athlete.name })}
    <div class="identity-content">
      <div class="identity-eyebrow">Identitas Atlet</div>
      <div class="identity-name">${escapePrintHtml(athlete.name)}</div>
      <div class="identity-meta">
        ${renderIdentityItem('Cabang Olahraga', escapePrintHtml(caborName))}
        ${renderIdentityItem('Organisasi', escapePrintHtml(organizationName))}
        ${renderIdentityItem('Status', statusMarkup)}
        ${renderIdentityItem('Kluster Aktif', escapePrintHtml(clusterLabel))}
        ${renderIdentityItem('Kelas Pertandingan', escapePrintHtml(competitionClassName))}
      </div>
    </div>
  </div>

  <div class="section keep-together">
    <h3>Data Pribadi</h3>
    <div class="grid">
      ${renderPrintRow('Nama', athlete.name)}
      ${renderPrintRow('Status Aktif', activeStatus)}
      ${renderPrintRow('NIK', athlete.nik)}
      ${renderPrintRow('No. Kartu Keluarga', athlete.no_kk)}
      ${renderPrintRow('No. Atlit Nasional', athlete.national_athlete_number)}
      ${renderPrintRow('Jenis Kelamin', genderLabels[athlete.gender] || athlete.gender)}
      ${renderPrintRow('Tempat Lahir', athlete.birth_place)}
      ${renderPrintRow('Tanggal Lahir', formatDate(athlete.birth_date))}
      ${renderPrintRow('Agama', athlete.religion)}
      ${renderPrintRow('Status Menikah', maritalLabels[athlete.marital_status] || athlete.marital_status)}
      <div class="full info-row"><div class="label">Alamat</div><div class="value">${escapePrintHtml(athlete.address)}</div></div>
    </div>
  </div>

  <div class="section keep-together">
    <h3>Olahraga dan Karir</h3>
    <div class="grid">
      ${renderPrintRow('Cabang Olahraga', caborName)}
      ${renderPrintRow('Kelas Pertandingan', competitionClassName)}
      ${renderPrintRow('Organisasi', organizationName)}
      ${renderPrintRow('Tahun Mulai Karir', athlete.career_start_year)}
      ${renderPrintRow('Kluster Aktif', currentCluster)}
      ${renderPrintRow('Sub-kluster Aktif', currentSubCluster)}
    </div>
  </div>

  <div class="section keep-together">
    <h3>Fisik, Kontak, Pendidikan dan Pekerjaan</h3>
    <div class="grid">
      ${renderPrintRow('Tinggi Badan', athlete.height ? `${athlete.height} cm` : '-')}
      ${renderPrintRow('Berat Badan', athlete.weight ? `${athlete.weight} kg` : '-')}
      ${renderPrintRow('Golongan Darah', athlete.blood_type)}
      ${renderPrintRow('Pendidikan', educationLevel)}
      ${renderPrintRow('Telepon', athlete.phone)}
      ${renderPrintRow('Email', athlete.email)}
      ${renderPrintRow('Pekerjaan', athlete.occupation)}
      ${renderPrintRow('Hobi', athlete.hobby)}
    </div>
  </div>

  <div class="section keep-together">
    <h3>Orang Tua/Wali</h3>
    <div class="grid">
      ${renderPrintRow('Nama Ayah', athlete.father_name)}
      ${renderPrintRow('Telepon Ayah', athlete.father_phone)}
      ${renderPrintRow('Nama Ibu', athlete.mother_name)}
      ${renderPrintRow('Telepon Ibu', athlete.mother_phone)}
      <div class="full info-row"><div class="label">Alamat Orang Tua/Wali</div><div class="value">${escapePrintHtml(athlete.parent_address)}</div></div>
    </div>
  </div>

  <div class="section keep-together">
    <h3>Riwayat Prestasi dan Cedera</h3>
    <div class="grid">
      <div class="full info-row"><div class="label">Prestasi Tertinggi</div><div class="value">${printAchievements.map((achievement) => escapePrintHtml(achievement)).join('<br>')}</div></div>
      <div class="full info-row"><div class="label">Riwayat Cedera/Penyakit</div><div class="value">${escapePrintHtml(athlete.injury_illness_history)}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Riwayat Kluster</h3>
    ${clusterError ? '<div class="warning">Riwayat kluster gagal dimuat.</div>' : safeHistories.length === 0 ? '<div class="empty">Belum ada riwayat kluster.</div>' : `
      <table>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Kluster</th>
            <th>Perubahan</th>
            <th>Alasan</th>
            <th>SK</th>
            <th>Dibuat Oleh</th>
          </tr>
        </thead>
        <tbody>
          ${safeHistories.map((history) => `
            <tr>
              <td>${formatPrintDate(history.start_date)} - ${history.end_date ? formatPrintDate(history.end_date) : 'Sekarang'}</td>
              <td>${escapePrintHtml(history.sub_cluster_label ? `${history.cluster_label} - ${history.sub_cluster_label}` : history.cluster_label)}</td>
              <td>${escapePrintHtml(history.change_label || history.change_type)}</td>
              <td>${escapePrintHtml(history.reason)}</td>
              <td>${escapePrintHtml(history.decree?.decree_number)}<br>${formatPrintDate(history.decree?.decree_date)}</td>
              <td>${escapePrintHtml(history.created_by_user?.name)}</td>
            </tr>`).join('')}
        </tbody>
      </table>`}
  </div>

  <div class="section">
    <h3>Biaya Pembinaan</h3>
    ${fundsError ? '<div class="warning">Biaya pembinaan gagal dimuat.</div>' : safeFunds.length === 0 ? '<div class="empty">Belum ada biaya pembinaan.</div>' : `
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nominal</th>
            <th>Kluster</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${safeFunds.map((fund) => `
            <tr>
              <td>${formatPrintDate(fund.fund_date)}</td>
              <td>${escapePrintHtml(formatCurrency(fund.amount))}</td>
              <td>${escapePrintHtml(fund.cluster_history?.sub_cluster_label || fund.cluster_history?.cluster_label)}</td>
              <td>${escapePrintHtml(fund.description)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="total">Total Biaya Pembinaan: ${escapePrintHtml(formatCurrency(totalFunds))}</div>`}
  </div>

  <div class="footer">Dicetak oleh : KONI Sumbar pada tanggal ${escapePrintHtml(printedDate)} jam ${escapePrintHtml(printedTime)}</div>
</body>
</html>`;
}

export function openAthleteProfilePrintWindow() {
  return openProfilePrintWindow();
}

export async function printAthleteProfile(printWindow, options) {
  const photoDataUrl = await fetchProtectedImageDataUrl(options.photoUrl);
  const html = buildAthleteProfilePrintHtml({ ...options, photoDataUrl });
  return printProfileDocument(printWindow, html);
}