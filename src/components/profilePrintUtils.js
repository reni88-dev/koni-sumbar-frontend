import api from '../api/axios';

const PRINT_DELAY_MS = 300;
const ASSET_TIMEOUT_MS = 5000;
const POPUP_BLOCKED_MESSAGE = 'Gagal membuka jendela cetak. Pastikan popup tidak diblokir browser.';

export const PROFILE_PRINT_STYLES = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 22px; font-size: 11px; line-height: 1.45; }
    .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 14px; margin-bottom: 16px; }
    .header h1 { font-size: 17px; color: #dc2626; margin-bottom: 2px; }
    .header h2 { font-size: 14px; font-weight: 600; }
    .identity-card { display: grid; grid-template-columns: 32mm minmax(0, 1fr); align-items: stretch; gap: 12px; margin-bottom: 14px; break-inside: avoid; page-break-inside: avoid; }
    .profile-photo-frame { position: relative; width: 32mm; height: 42mm; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; }
    .profile-photo-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 8px; text-align: center; color: #64748b; }
    .profile-photo-initials { display: flex; width: 18mm; height: 18mm; align-items: center; justify-content: center; border: 1px solid #cbd5e1; border-radius: 999px; background: #fff; color: #334155; font-size: 18px; font-weight: 800; letter-spacing: 0.5px; }
    .profile-photo-empty { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
    .profile-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; background: #fff; }
    .identity-content { min-width: 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 11px 12px; background: #f8fafc; }
    .identity-eyebrow { color: #dc2626; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px; }
    .identity-name { margin-top: 3px; color: #0f172a; font-size: 19px; font-weight: 800; line-height: 1.18; overflow-wrap: anywhere; }
    .identity-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; margin-top: 11px; }
    .identity-meta-item { min-width: 0; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    .identity-meta-label { color: #64748b; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.45px; }
    .identity-meta-value { margin-top: 2px; color: #0f172a; font-size: 10.5px; font-weight: 700; overflow-wrap: anywhere; }
    .badge { display: inline-block; padding: 2px 8px; border: 1px solid currentColor; border-radius: 999px; font-size: 9px; font-weight: 700; }
    .badge-active { color: #15803d; background: #dcfce7; }
    .badge-inactive { color: #64748b; background: #f1f5f9; }
    .section { margin-top: 14px; break-inside: auto; page-break-inside: auto; }
    .section.keep-together { break-inside: avoid; page-break-inside: avoid; }
    .section h3 { margin-bottom: 8px; border-bottom: 1px solid #fee2e2; padding-bottom: 5px; color: #dc2626; font-size: 12px; break-after: avoid; page-break-after: avoid; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 8px; break-inside: avoid; page-break-inside: avoid; }
    .info-row { display: grid; grid-template-columns: 38% minmax(0, 62%); min-width: 0; min-height: 28px; border-bottom: 1px solid #e2e8f0; break-inside: avoid; page-break-inside: avoid; }
    .info-row:nth-last-child(-n+2) { border-bottom: 0; }
    .info-row .label { padding: 7px 9px; background: #f8fafc; color: #64748b; font-weight: 600; }
    .info-row .value { min-width: 0; padding: 7px 9px; font-weight: 500; overflow-wrap: anywhere; }
    .full { grid-column: 1 / -1; }
    .full.info-row { grid-template-columns: 19% minmax(0, 81%); }
    table { width: 100%; border-collapse: collapse; break-inside: auto; page-break-inside: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    th { border: 1px solid #e2e8f0; padding: 7px 8px; background: #f8fafc; color: #64748b; font-size: 9px; font-weight: 700; text-align: left; text-transform: uppercase; letter-spacing: 0.4px; }
    td { border: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: top; overflow-wrap: anywhere; }
    tbody tr { break-inside: avoid; page-break-inside: avoid; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .empty { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; background: #f8fafc; color: #64748b; break-inside: avoid; page-break-inside: avoid; }
    .warning { border: 1px solid #fecaca; border-radius: 8px; padding: 10px; background: #fef2f2; color: #991b1b; break-inside: avoid; page-break-inside: avoid; }
    .total { margin-top: 8px; font-size: 12px; font-weight: 700; text-align: right; break-inside: avoid; page-break-inside: avoid; }
    .footer { margin-top: 22px; border-top: 1px solid #e2e8f0; padding-top: 10px; color: #64748b; font-size: 9px; text-align: center; }

    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      body { margin: 0; padding: 0; }
    }
`;

export function displayPrintValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

export function escapePrintHtml(value) {
  return String(displayPrintValue(value))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '--';
}

export function buildProfilePhotoMarkup({ photoDataUrl, name }) {
  const imageMarkup = photoDataUrl
    ? `<img class="profile-photo" src="${escapePrintHtml(photoDataUrl)}" alt="Foto ${escapePrintHtml(name)}" onerror="this.style.display='none'">`
    : '';

  return `
    <div class="profile-photo-frame">
      <div class="profile-photo-placeholder">
        <span class="profile-photo-initials">${escapePrintHtml(getInitials(name))}</span>
        <span class="profile-photo-empty">Foto tidak tersedia</span>
      </div>
      ${imageMarkup}
    </div>`;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(reader.error || new Error('Gagal membaca foto.'));
    reader.readAsDataURL(blob);
  });
}

export async function fetchProtectedImageDataUrl(src) {
  if (!src) return null;

  try {
    const response = await api.get(src, { responseType: 'blob' });
    const blob = response.data;
    if (!blob || blob.size === 0 || (blob.type && !blob.type.startsWith('image/'))) return null;
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

export function openProfilePrintWindow() {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    window.alert(POPUP_BLOCKED_MESSAGE);
    return null;
  }

  try {
    printWindow.opener = null;
    printWindow.document.title = 'Menyiapkan profil...';
    printWindow.document.body.innerHTML = '<p style="font-family:Segoe UI,sans-serif;padding:24px;color:#475569">Menyiapkan profil untuk dicetak...</p>';
  } catch {
    // The print pipeline will surface document access errors when writing the final HTML.
  }

  return printWindow;
}

function waitForDocument(printWindow, html) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      printWindow.removeEventListener('load', finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, ASSET_TIMEOUT_MS);

    printWindow.addEventListener('load', finish, { once: true });

    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      if (printWindow.document.readyState === 'complete') {
        window.setTimeout(finish, 0);
      }
    } catch (error) {
      settled = true;
      window.clearTimeout(timeoutId);
      printWindow.removeEventListener('load', finish);
      reject(error);
    }
  });
}

function waitForImage(image) {
  if (image.complete) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      image.removeEventListener('load', finish);
      image.removeEventListener('error', finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, ASSET_TIMEOUT_MS);

    image.addEventListener('load', finish, { once: true });
    image.addEventListener('error', finish, { once: true });

    if (image.complete) finish();
  });
}

export async function printProfileDocument(printWindow, html) {
  if (printWindow.closed) return false;

  await waitForDocument(printWindow, html);
  if (printWindow.closed) return false;

  await Promise.all(Array.from(printWindow.document.images).map(waitForImage));
  await new Promise((resolve) => window.setTimeout(resolve, PRINT_DELAY_MS));

  if (printWindow.closed) return false;

  printWindow.focus();
  printWindow.print();
  return true;
}