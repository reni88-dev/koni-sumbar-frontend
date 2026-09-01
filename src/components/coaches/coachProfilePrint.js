import {
  PROFILE_PRINT_STYLES,
  buildProfilePhotoMarkup,
  escapePrintHtml,
  fetchProtectedImageDataUrl,
  openProfilePrintWindow,
  printProfileDocument,
} from '../profilePrintUtils';

const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

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

export function parseCoachAchievements(achievements) {
  if (!achievements) return [];
  if (Array.isArray(achievements)) {
    return achievements.map((item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.title || item.name || item.achievement || item.description || JSON.stringify(item);
      }
      return String(item);
    }).filter(Boolean);
  }
  if (typeof achievements === 'string') {
    const trimmed = achievements.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return parseCoachAchievements(JSON.parse(trimmed));
      } catch {
        // Continue with one achievement per line.
      }
    }
    return trimmed.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }
  return [String(achievements)];
}

export function buildCoachProfilePrintHtml({
  coach = {},
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
  const achievements = parseCoachAchievements(coach.achievements);
  const printAchievements = achievements.length > 0 ? achievements : ['-'];
  const organizationName = coach.organization?.name || coach.organization_name;
  const caborName = coach.cabor?.display_name || coach.cabor?.name;
  const currentCluster = coach.current_cluster_label || 'Pelatih Non Binaan';
  const currentSubCluster = coach.current_sub_cluster_label;
  const clusterLabel = currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster;
  const activeStatus = coach.is_active ? 'Aktif' : 'Nonaktif';
  const licenseSummary = [coach.license_level, coach.license_number].filter(Boolean).join(' / ') || '-';
  const statusMarkup = `<span class="badge ${coach.is_active ? 'badge-active' : 'badge-inactive'}">${escapePrintHtml(activeStatus)}</span>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PROFIL PELATIH KONI SUMATERA BARAT</title>
  <style>${PROFILE_PRINT_STYLES}</style>
</head>
<body>
  <div class="header">
    <h1>PROFIL PELATIH</h1>
    <h2>KONI SUMATERA BARAT</h2>
  </div>

  <div class="identity-card">
    ${buildProfilePhotoMarkup({ photoDataUrl, name: coach.name })}
    <div class="identity-content">
      <div class="identity-eyebrow">Identitas Pelatih</div>
      <div class="identity-name">${escapePrintHtml(coach.name)}</div>
      <div class="identity-meta">
        ${renderIdentityItem('Cabang Olahraga', escapePrintHtml(caborName))}
        ${renderIdentityItem('Organisasi', escapePrintHtml(organizationName))}
        ${renderIdentityItem('Status', statusMarkup)}
        ${renderIdentityItem('Kluster Aktif', escapePrintHtml(clusterLabel))}
        ${renderIdentityItem('Lisensi', escapePrintHtml(licenseSummary))}
      </div>
    </div>
  </div>

  <div class="section keep-together">
    <h3>Data Pribadi</h3>
    <div class="grid">
      ${renderPrintRow('Nama', coach.name)}
      ${renderPrintRow('Status Aktif', activeStatus)}
      ${renderPrintRow('NIK', coach.nik)}
      ${renderPrintRow('Jenis Kelamin', genderLabels[coach.gender] || coach.gender)}
      ${renderPrintRow('Tempat Lahir', coach.birth_place)}
      ${renderPrintRow('Tanggal Lahir', formatDate(coach.birth_date))}
      ${renderPrintRow('Agama', coach.religion)}
      <div class="full info-row"><div class="label">Alamat</div><div class="value">${escapePrintHtml(coach.address)}</div></div>
    </div>
  </div>

  <div class="section keep-together">
    <h3>Kepelatihan dan Lisensi</h3>
    <div class="grid">
      ${renderPrintRow('Cabang Olahraga', caborName)}
      ${renderPrintRow('Nomor Lisensi', coach.license_number)}
      ${renderPrintRow('Level Lisensi', coach.license_level)}
      ${renderPrintRow('Spesialisasi', coach.specialization)}
      ${renderPrintRow('Tahun Mulai Melatih', coach.coaching_start_year)}
      ${renderPrintRow('Organisasi', organizationName)}
      ${renderPrintRow('Kluster Aktif', currentCluster)}
      ${renderPrintRow('Sub-kluster Aktif', currentSubCluster)}
    </div>
  </div>

  <div class="section keep-together">
    <h3>Kontak</h3>
    <div class="grid">
      ${renderPrintRow('Telepon', coach.phone)}
      ${renderPrintRow('Email', coach.email)}
    </div>
  </div>

  <div class="section keep-together">
    <h3>Riwayat Prestasi Kepelatihan</h3>
    <div class="grid">
      <div class="full info-row"><div class="label">Prestasi</div><div class="value">${printAchievements.map((achievement) => escapePrintHtml(achievement)).join('<br>')}</div></div>
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
    <h3>Dana Pembinaan</h3>
    ${fundsError ? '<div class="warning">Dana pembinaan gagal dimuat. Pastikan akun memiliki izin melihat dana pembinaan.</div>' : safeFunds.length === 0 ? '<div class="empty">Belum ada dana pembinaan.</div>' : `
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
      <div class="total">Total Dana Pembinaan: ${escapePrintHtml(formatCurrency(totalFunds))}</div>`}
  </div>

  <div class="footer">Dicetak oleh : KONI Sumbar pada tanggal ${escapePrintHtml(printedDate)} jam ${escapePrintHtml(printedTime)}</div>
</body>
</html>`;
}

export function openCoachProfilePrintWindow() {
  return openProfilePrintWindow();
}

export async function printCoachProfile(printWindow, options) {
  const photoDataUrl = await fetchProtectedImageDataUrl(options.photoUrl);
  const html = buildCoachProfilePrintHtml({ ...options, photoDataUrl });
  return printProfileDocument(printWindow, html);
}