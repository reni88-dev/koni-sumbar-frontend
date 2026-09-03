const CODE_MESSAGES = {
  invalid_request_body: 'Body permintaan tidak valid. Periksa data lalu coba lagi.',
  athlete_id_required: 'Data atlet wajib dipilih.',
  athlete_id_invalid: 'ID atlet tidak valid.',
  athlete_not_found: 'Data atlet tidak ditemukan. Muat ulang halaman lalu coba lagi.',
  coach_id_required: 'Data pelatih wajib dipilih.',
  coach_id_invalid: 'ID pelatih tidak valid.',
  coach_not_found: 'Data pelatih tidak ditemukan. Muat ulang halaman lalu coba lagi.',
  cluster_not_found: 'Kluster yang dipilih tidak ditemukan. Muat ulang data lalu pilih kluster lain.',
  sub_cluster_not_found: 'Sub-kluster yang dipilih tidak ditemukan. Muat ulang data lalu pilih sub-kluster lain.',
  development_fund_id_invalid: 'ID biaya pembinaan tidak valid.',
  development_fund_not_found: 'Biaya pembinaan tidak ditemukan. Muat ulang data lalu coba lagi.',
  cluster_required: 'Pilih kluster tujuan.',
  cluster_inactive: 'Kluster yang dipilih sudah tidak aktif. Muat ulang data lalu pilih kluster lain.',
  sub_cluster_required: 'Pilih sub-kluster untuk kluster Binaan ini.',
  sub_cluster_not_allowed: 'Sub-kluster harus dikosongkan untuk kluster Non Binaan.',
  sub_cluster_inactive: 'Sub-kluster yang dipilih sudah tidak aktif. Muat ulang data lalu pilih sub-kluster lain.',
  sub_cluster_mismatch: 'Sub-kluster yang dipilih tidak sesuai dengan kluster tujuan.',
  start_date_required: 'Tanggal mulai berlaku wajib diisi.',
  invalid_start_date: 'Format tanggal mulai tidak valid.',
  cluster_period_conflict: 'Tanggal mulai harus setelah tanggal mulai periode kluster yang sedang aktif.',
  change_type_invalid: 'Jenis perubahan kluster tidak valid.',
  reason_required: 'Alasan wajib diisi untuk perubahan kluster ini.',
  invalid_decree_date: 'Format tanggal SK tidak valid.',
  decree_file_type_invalid: 'File SK harus berupa PDF, JPG, JPEG, atau PNG.',
  decree_file_upload_failed: 'File SK belum berhasil diunggah. Silakan coba lagi.',
  decree_file_not_found: 'File SK tidak ditemukan.',
  development_fund_amount_invalid: 'Nominal biaya pembinaan wajib berupa angka dan minimal 0.',
  development_fund_date_required: 'Tanggal biaya wajib diisi.',
  development_fund_date_invalid: 'Format tanggal biaya tidak valid.',
  development_fund_period_required: 'Tanggal biaya tidak berada dalam periode Binaan. Pilih tanggal sesuai Riwayat Kluster.',
  development_fund_forbidden: 'Anda tidak memiliki izin untuk mengelola biaya pembinaan.',
  cluster_forbidden: 'Anda tidak memiliki izin untuk mengelola kluster.',
  cluster_code_required: 'Kode kluster wajib diisi.',
  cluster_name_required: 'Nama kluster wajib diisi.',
  cluster_code_conflict: 'Kode kluster sudah digunakan. Gunakan kode lain.',
  sub_cluster_parent_required: 'Pilih kluster induk untuk sub-kluster.',
  sub_cluster_code_required: 'Kode sub-kluster wajib diisi.',
  sub_cluster_name_required: 'Nama sub-kluster wajib diisi.',
  sub_cluster_code_conflict: 'Kode sub-kluster sudah digunakan pada kluster ini. Gunakan kode lain.',
  cluster_in_use: 'Kluster belum dapat dihapus karena masih digunakan.',
  sub_cluster_in_use: 'Sub-kluster belum dapat dihapus karena masih digunakan.',
  internal_error: 'Server belum dapat memproses permintaan. Silakan coba beberapa saat lagi.',
};

const LEGACY_MESSAGE_RULES = [
  [/fund_date must be within an active (athlete|coach) development period/i, CODE_MESSAGES.development_fund_period_required],
  [/cluster is inactive/i, CODE_MESSAGES.cluster_inactive],
  [/sub-cluster is inactive/i, CODE_MESSAGES.sub_cluster_inactive],
  [/sub_cluster_id is required for development cluster/i, CODE_MESSAGES.sub_cluster_required],
  [/sub_cluster_id must be empty for non-development cluster/i, CODE_MESSAGES.sub_cluster_not_allowed],
  [/sub-cluster tidak sesuai dengan cluster/i, CODE_MESSAGES.sub_cluster_mismatch],
  [/tanggal mulai (tidak boleh sebelum|harus setelah)/i, CODE_MESSAGES.cluster_period_conflict],
  [/invalid file type|only pdf and image files are allowed/i, CODE_MESSAGES.decree_file_type_invalid],
  [/development fund not found/i, CODE_MESSAGES.development_fund_not_found],
  [/athlete not found/i, CODE_MESSAGES.athlete_not_found],
  [/coach not found/i, CODE_MESSAGES.coach_not_found],
  [/sub-cluster not found/i, CODE_MESSAGES.sub_cluster_not_found],
  [/cluster not found/i, CODE_MESSAGES.cluster_not_found],
  [/amount must be greater than or equal to 0/i, CODE_MESSAGES.development_fund_amount_invalid],
  [/fund_date is required/i, CODE_MESSAGES.development_fund_date_required],
  [/invalid fund_date/i, CODE_MESSAGES.development_fund_date_invalid],
  [/start_date is required/i, CODE_MESSAGES.start_date_required],
  [/invalid start_date/i, CODE_MESSAGES.invalid_start_date],
  [/reason is required/i, CODE_MESSAGES.reason_required],
  [/forbidden/i, 'Anda tidak memiliki izin untuk melakukan tindakan ini.'],
];

export function getClusterErrorMessage(error, fallback = 'Permintaan belum berhasil. Silakan coba lagi.', options = {}) {
  const response = error?.response;
  const payload = response?.data;
  const code = typeof payload?.code === 'string' ? payload.code : '';

  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const legacyMessage = [payload?.message, payload?.error, error?.message]
    .find((value) => typeof value === 'string' && value.trim()) || '';
  const legacyMatch = LEGACY_MESSAGE_RULES.find(([pattern]) => pattern.test(legacyMessage));
  if (legacyMatch) return legacyMatch[1];

  if (!response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.';
  }

  switch (response.status) {
    case 401:
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
    case 403:
      return options.permissionMessage || 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
    case 404:
      return options.notFoundMessage || 'Data yang diminta tidak ditemukan. Muat ulang halaman lalu coba lagi.';
    case 409:
      return options.conflictMessage || 'Data kluster telah berubah. Muat ulang data lalu coba lagi.';
    case 422:
      return options.validationMessage || 'Data yang diisi belum valid. Periksa kembali lalu coba lagi.';
    default:
      if (response.status >= 500) return CODE_MESSAGES.internal_error;
      return fallback;
  }
}

export { CODE_MESSAGES as clusterErrorMessages };