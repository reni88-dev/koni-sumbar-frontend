import { formatQualityDate, qualityLabel } from './formatters.js';
import { buildQualityApiParams } from './queryParams.js';

// Translate known server notices, but retain new/unknown warnings rather than hide them.
const WARNING_MESSAGES = new Map([
  ['Sumber masa berlaku dokumen/lisensi belum tersedia dan tidak masuk denominator skor.', 'Tanggal kedaluwarsa dokumen dan lisensi belum dapat diperiksa. Bagian ini tidak mengurangi skor kualitas data.'],
  ['OCR belum termasuk Tahap 1 dan tidak dinilai sebagai data kosong.', 'Sistem belum membaca isi tulisan di dalam foto atau dokumen secara otomatis. Isi yang belum terbaca tidak dianggap sebagai data kosong.'],
  ['Sumber subcluster, asal data, serta creator/updater profil belum tersedia pada schema aktif.', 'Informasi kelompok pembinaan rinci, asal data, serta siapa yang menambah atau mengubah profil belum tersedia dalam laporan ini.'],
  ['Object storage belum dikonfigurasi; status file ditandai belum terverifikasi.', 'Sistem belum terhubung ke penyimpanan dokumen. File belum dapat diperiksa; status belum diperiksa bukan berarti file hilang.'],
  ['Mode posisi tanggal memakai snapshot terakhir pada atau sebelum tanggal yang dipilih.', 'Laporan memakai hasil pemeriksaan terakhir pada atau sebelum tanggal pilihan Anda. Tanggal data yang tersedia ditampilkan di bawah.'],
  ['Hasil scan terakhir sudah lebih dari 26 jam; data laporan dapat kedaluwarsa.', 'Pemeriksaan terakhir sudah lebih dari 26 jam. Perubahan data terbaru mungkin belum terlihat dalam laporan.'],
  ['Scan terbaru gagal; laporan tetap memakai hasil sukses sebelumnya.', 'Pemeriksaan terbaru gagal. Laporan masih menampilkan hasil pemeriksaan sebelumnya yang berhasil.'],
  ['Status finding direkonstruksi dari event terakhir pada scan sumber snapshot.', 'Status masalah mengikuti catatan pada saat pemeriksaan yang digunakan untuk laporan tanggal tersebut.'],
  ['Matriks dokumen memakai hasil pemeriksaan dari scan sumber snapshot.', 'Status dokumen mengikuti hasil pemeriksaan pada tanggal data laporan, bukan kondisi file saat ini.'],
]);

export function qualityNotice(message) {
  return WARNING_MESSAGES.get(message) || message;
}

export const QUALITY_SCORE_GUIDE = [
  ['complete', '90-100%', 'Data sudah memenuhi sebagian besar pemeriksaan. Tetap periksa masalah yang masih tercatat.'],
  ['needs_completion', '75-<90%', 'Masih ada data yang perlu dilengkapi atau diperbaiki.'],
  ['many_gaps', '50-<75%', 'Cukup banyak data yang perlu dilengkapi atau diperbaiki.'],
  ['critical', '<50%', 'Banyak pemeriksaan belum terpenuhi. Dahulukan peninjauan profil ini.'],
];

export const QUALITY_REPORT_HELP = {
  summary: 'Mulai dari masalah yang perlu segera ditangani, lalu buka laporan atlet, pelatih, atau jenis masalah untuk melihat rinciannya.',
  athletes: 'Pilih nama atau baris atlet untuk melihat rincian data yang perlu dilengkapi. Skor menilai kualitas data, bukan prestasi atlet.',
  coaches: 'Pilih nama atau baris pelatih untuk melihat rincian data yang perlu dilengkapi. Skor menilai kualitas data, bukan kemampuan pelatih.',
  duplicates: 'Kemiripan belum tentu berarti orang yang sama. Cocokkan profil dan alasan kecocokannya sebelum melakukan perubahan di data utama.',
  validity: 'Daftar ini menunjukkan identitas atau kontak yang tidak lolos pemeriksaan format. Periksa kebenarannya pada data utama sebelum memperbaiki.',
  documents: 'Belum diperiksa tidak berarti file hilang. Laporan memeriksa ketersediaan dan jenis file; isi tulisan dan masa berlaku belum dinilai.',
  distribution: 'Bandingkan kualitas data antarorganisasi dan cabang olahraga. Pengcab yang belum terhubung perlu diperiksa pada data utama.',
};

const SCOPE_OPTIONS = {
  region_ids: ['Wilayah', 'regions'], organization_ids: ['Organisasi', 'organizations'],
  federation_ids: ['Federasi', 'federations'], cabor_ids: ['Cabor', 'cabors'], pengcab_ids: ['Pengcab', 'pengcabs'],
};
const FILTER_LABELS = {
  date_from: 'Tanggal awal', date_to: 'Tanggal akhir', as_of_date: 'Data hingga tanggal',
  date_basis: 'Tanggal berdasarkan', gender: 'Jenis kelamin', record_status: 'Status profil',
  account_status: 'Status akun', completeness_category: 'Kelengkapan', finding_type: 'Jenis masalah',
  priority: 'Prioritas', finding_status: 'Status penanganan', document_type: 'Jenis dokumen',
  document_status: 'Status dokumen', search: 'Pencarian', sort_by: 'Urut berdasarkan', sort_dir: 'Arah urutan',
};
const FILTER_VALUES = {
  updated_at: 'Terakhir diperbarui', created_at: 'Tanggal dibuat', finding_at: 'Masalah terdeteksi',
  document_at: 'Dokumen diperiksa', male: 'Laki-laki', female: 'Perempuan', active: 'Aktif', inactive: 'Tidak aktif',
  linked: 'Terhubung', unlinked: 'Belum terhubung', verified: 'Terverifikasi', unverified: 'Belum diverifikasi',
  asc: 'Terkecil / A-Z lebih dulu', desc: 'Terbesar / Z-A lebih dulu', name: 'Nama', score: 'Skor kualitas data',
  issue_count: 'Jumlah masalah', organization: 'Organisasi', cabor: 'Cabor', priority: 'Prioritas',
  last_seen_at: 'Terakhir terdeteksi', first_seen_at: 'Pertama terdeteksi', status: 'Status penanganan', finding_type: 'Jenis masalah',
};

export function qualityPrintFilters(reportKey, appliedFilters, options = {}) {
  const params = buildQualityApiParams(reportKey, appliedFilters, { exportRequest: true });
  return Object.entries(params).map(([key, value]) => {
    if (SCOPE_OPTIONS[key]) {
      const [label, optionKey] = SCOPE_OPTIONS[key];
      const names = new Map((options[optionKey] || []).map((option) => [String(option.id), option.name]));
      return [label, String(value).split(',').map((id) => names.get(id) || 'ID ' + id).join(', ')];
    }
    const label = FILTER_LABELS[key] || qualityLabel(key);
    if (['date_from', 'date_to', 'as_of_date'].includes(key)) return [label, formatQualityDate(value)];
    return [label, key === 'search' ? value : FILTER_VALUES[value] || qualityLabel(value)];
  });
}

export function qualityPrintRange(reportKey, response) {
  if (reportKey === 'summary') return 'Ringkasan sesuai filter yang diterapkan.';
  const count = Array.isArray(response?.data) ? response.data.length : 0;
  const { page = 1, per_page = 25, total = count } = response?.pagination || {};
  const start = count ? (page - 1) * per_page + 1 : 0;
  const end = count ? start + count - 1 : 0;
  return 'Halaman ' + page + ' | Baris ' + start + '-' + end + ' dari ' + total + ' hasil. Hanya halaman ini yang dicetak.';
}
