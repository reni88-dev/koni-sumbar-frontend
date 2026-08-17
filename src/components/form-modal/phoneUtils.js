import api from '../../api/axios';

export const PHONE_INPUT_PATTERN = /^\+?[0-9\s().-]+$/;
export const PHONE_PATTERN = /^628[0-9]{8,11}$/;
export const PHONE_CHECK_TIMEOUT_MS = 5000;
export const PHONE_CHECK_SKIPPED_MESSAGE = 'Format nomor valid; pengecekan WhatsApp dilewati';

export function normalizeIndonesianMobile(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!PHONE_INPUT_PATTERN.test(raw)) return null;

  let phone = raw.replace(/\D/g, '');
  if (phone.startsWith('62')) {
    // Already normalized.
  } else if (phone.startsWith('0')) {
    phone = `62${phone.slice(1)}`;
  } else if (phone.startsWith('8')) {
    phone = `62${phone}`;
  } else {
    return null;
  }

  return PHONE_PATTERN.test(phone) ? phone : null;
}

export function isCanceledRequest(error) {
  return error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED';
}

export async function checkWhatsAppPhone(phone, signal) {
  try {
    const response = await api.get('/api/check-phone', {
      params: { phone },
      signal,
      timeout: PHONE_CHECK_TIMEOUT_MS
    });
    const data = response.data;

    if (data?.validationSkipped === true || data?.error) {
      return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
    }
    if (data?.numberExists === true) {
      return { status: 'valid', message: 'WhatsApp aktif' };
    }
    if (data?.numberExists === false) {
      return { status: 'invalid', message: 'Nomor tidak terdaftar di WhatsApp' };
    }
    return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
  } catch (error) {
    if (isCanceledRequest(error)) throw error;
    return { status: 'valid', message: PHONE_CHECK_SKIPPED_MESSAGE };
  }
}
