const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
const maritalLabels = { single: 'Belum Menikah', married: 'Menikah', divorced: 'Cerai', widowed: 'Duda/Janda' };
const PRINT_DELAY_MS = 300;
const POPUP_BLOCKED_MESSAGE = 'Gagal membuka jendela cetak. Pastikan popup tidak diblokir browser.';

function display(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(display(value))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPrintRow(label, value) {
  return `
    <div class="info-row">
      <div class="label">${escapeHtml(label)}</div>
      <div class="value">${escapeHtml(value)}</div>
    </div>`;
}

function formatPrintDate(dateStr) {
  return escapeHtml(formatDate(dateStr));
}

export function buildAthleteProfilePrintHtml({
  athlete = {},
  educationLevelName,
  histories = [],
  funds = [],
  fundsTotalAmount,
  clusterError = false,
  fundsError = false,
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
  const topAchievements = (athlete.top_achievements || []).filter(Boolean);
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
  const activeStatus = athlete.is_active ? 'Aktif' : 'Nonaktif';

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PROFIL ATLET KONI SUMATERA BARAT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 22px; font-size: 11px; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 17px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 14px; font-weight: 600; margin-bottom: 0; }
    .summary { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; min-width: 0; }
    .summary-box .label { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .summary-box .value { font-size: 12px; font-weight: 700; color: #0f172a; overflow-wrap: anywhere; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
    .badge-active { background: #dcfce7; color: #15803d; }
    .badge-inactive { background: #f1f5f9; color: #64748b; }
    .section { margin-top: 14px; page-break-inside: avoid; }
    .section h3 { font-size: 12px; color: #dc2626; border-bottom: 1px solid #fee2e2; padding-bottom: 5px; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .info-row { display: grid; grid-template-columns: 38% 62%; min-height: 28px; border-bottom: 1px solid #e2e8f0; min-width: 0; }
    .info-row:nth-last-child(-n+2) { border-bottom: 0; }
    .info-row .label { background: #f8fafc; padding: 7px 9px; color: #64748b; font-weight: 600; }
    .info-row .value { padding: 7px 9px; font-weight: 500; overflow-wrap: anywhere; }
    .full { grid-column: 1 / -1; }
    .full.info-row { grid-template-columns: 19% 81%; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; font-weight: 700; text-align: left; padding: 7px 8px; border: 1px solid #e2e8f0; font-size: 9px; text-transform: uppercase; color: #64748b; letter-spacing: 0.4px; }
    td { padding: 7px 8px; border: 1px solid #e2e8f0; vertical-align: top; overflow-wrap: anywhere; }
    tr:nth-child(even) { background: #f8fafc; }
    .empty { padding: 10px; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; background: #f8fafc; }
    .warning { padding: 10px; border: 1px solid #fecaca; border-radius: 8px; color: #991b1b; background: #fef2f2; }
    .total { margin-top: 8px; text-align: right; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 9px; color: #64748b; }

    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      body { padding: 0; margin: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PROFIL ATLET</h1>
    <h2>KONI SUMATERA BARAT</h2>
  </div>

  <div class="summary">
    <div class="summary-box">
      <div class="label">Nama Atlet</div>
      <div class="value">${escapeHtml(athlete.name)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Cabang Olahraga</div>
      <div class="value">${escapeHtml(caborName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Status</div>
      <div class="value"><span class="badge ${athlete.is_active ? 'badge-active' : 'badge-inactive'}">${escapeHtml(activeStatus)}</span></div>
    </div>
    <div class="summary-box">
      <div class="label">Organisasi</div>
      <div class="value">${escapeHtml(organizationName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Kelas Pertandingan</div>
      <div class="value">${escapeHtml(competitionClassName)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Kluster Aktif</div>
      <div class="value">${escapeHtml(currentSubCluster ? `${currentCluster} - ${currentSubCluster}` : currentCluster)}</div>
    </div>
  </div>

  <div class="section">
    <h3>Data Pribadi</h3>
    <div class="grid">
      ${renderPrintRow('Nama', athlete.name)}
      ${renderPrintRow('Status Aktif', activeStatus)}
      ${renderPrintRow('NIK', athlete.nik)}
      ${renderPrintRow('No. Kartu Keluarga', athlete.no_kk)}
      ${renderPrintRow('No. Atlit Nasional', athlete.national_athlete_number)}
      ${renderPrintRow('Jenis Kelamin', genderLabels[athlete.gender])}
      ${renderPrintRow('Tempat Lahir', athlete.birth_place)}
      ${renderPrintRow('Tanggal Lahir', formatDate(athlete.birth_date))}
      ${renderPrintRow('Agama', athlete.religion)}
      ${renderPrintRow('Status Menikah', maritalLabels[athlete.marital_status])}
      <div class="full info-row"><div class="label">Alamat</div><div class="value">${escapeHtml(athlete.address)}</div></div>
    </div>
  </div>

  <div class="section">
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

  <div class="section">
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

  <div class="section">
    <h3>Orang Tua/Wali</h3>
    <div class="grid">
      ${renderPrintRow('Nama Ayah', athlete.father_name)}
      ${renderPrintRow('Telepon Ayah', athlete.father_phone)}
      ${renderPrintRow('Nama Ibu', athlete.mother_name)}
      ${renderPrintRow('Telepon Ibu', athlete.mother_phone)}
      <div class="full info-row"><div class="label">Alamat Orang Tua/Wali</div><div class="value">${escapeHtml(athlete.parent_address)}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Riwayat Prestasi dan Cedera</h3>
    <div class="grid">
      <div class="full info-row"><div class="label">Prestasi Tertinggi</div><div class="value">${printAchievements.map((achievement) => escapeHtml(achievement)).join('<br>')}</div></div>
      <div class="full info-row"><div class="label">Riwayat Cedera/Penyakit</div><div class="value">${escapeHtml(athlete.injury_illness_history)}</div></div>
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
              <td>${escapeHtml(history.sub_cluster_label ? `${history.cluster_label} - ${history.sub_cluster_label}` : history.cluster_label)}</td>
              <td>${escapeHtml(history.change_label || history.change_type)}</td>
              <td>${escapeHtml(history.reason)}</td>
              <td>${escapeHtml(history.decree?.decree_number)}<br>${formatPrintDate(history.decree?.decree_date)}</td>
              <td>${escapeHtml(history.created_by_user?.name)}</td>
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
              <td>${escapeHtml(formatCurrency(fund.amount))}</td>
              <td>${escapeHtml(fund.cluster_history?.sub_cluster_label || fund.cluster_history?.cluster_label)}</td>
              <td>${escapeHtml(fund.description)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="total">Total Biaya Pembinaan: ${escapeHtml(formatCurrency(totalFunds))}</div>`}
  </div>

  <div class="footer">Dicetak oleh : KONI Sumbar pada tanggal ${escapeHtml(printedDate)} jam ${escapeHtml(printedTime)}</div>
</body>
</html>`;
}

export function openAthleteProfilePrintWindow() {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    window.alert(POPUP_BLOCKED_MESSAGE);
    return null;
  }

  return printWindow;
}

export function printAthleteProfile(printWindow, options) {
  const html = buildAthleteProfilePrintHtml(options);

  return new Promise((resolve, reject) => {
    let printScheduled = false;

    const schedulePrint = () => {
      if (printScheduled) return;
      printScheduled = true;

      window.setTimeout(() => {
        try {
          if (printWindow.closed) {
            resolve(false);
            return;
          }

          printWindow.focus();
          printWindow.print();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }, PRINT_DELAY_MS);
    };

    try {
      printWindow.onload = schedulePrint;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      if (printWindow.document.readyState === 'complete') {
        schedulePrint();
      }
    } catch (error) {
      reject(error);
    }
  });
}
