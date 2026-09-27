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

const RESCAN_NOTE = 'Laporan tidak langsung berubah saat data diperbaiki. Angka baru muncul setelah sistem melakukan pemeriksaan berikutnya; lihat "Scan berhasil terakhir" pada kotak informasi laporan.';

// Shared by every tab: explains the metadata box shown above each report.
export const QUALITY_METADATA_GUIDE = [
  ['Scan berhasil terakhir', 'Waktu sistem terakhir kali memeriksa seluruh data. Laporan menampilkan hasil pemeriksaan tersebut.'],
  ['Snapshot', '"Data terkini" berarti hasil pemeriksaan terbaru. Jika berisi tanggal, laporan menampilkan kondisi data pada tanggal itu.'],
  ['Scope', 'Wilayah atau organisasi yang datanya boleh Anda lihat.'],
  ['Status data', '"Mutakhir" berarti hasil pemeriksaan masih baru. "Perlu diperbarui" berarti pemeriksaan terakhir sudah lebih dari sehari.'],
];

function profileGuide(person, menu, notMeasured) {
  return {
    intro: `Daftar setiap ${person} beserta nilai kelengkapan datanya. Makin tinggi skornya, makin lengkap dan rapi datanya.`,
    terms: [
      ['Skor', 'Persentase pemeriksaan data yang sudah terpenuhi. 100% berarti semua data yang diperiksa sudah lengkap dan benar.'],
      ['Kategori', 'Kelompok berdasarkan skor: Lengkap, Perlu dilengkapi, Banyak kekurangan, atau Perlu segera ditangani (lihat tabel arti skor).'],
      ['Masalah', `Jumlah data ${person} yang masih kurang atau salah.`],
      ['Perlu diperbaiki', 'Nama data yang harus dilengkapi atau dibetulkan, misalnya NIK, foto, atau nomor telepon.'],
      ['Prioritas', 'Urutan penanganan: Perlu segera ditangani (kerjakan lebih dulu), lalu Sedang, lalu Rendah.'],
      ['Kontak (disamarkan)', 'Sebagian nomor telepon dan email sengaja ditutup tanda bintang untuk menjaga privasi. Ini bukan kesalahan data.'],
      ['Diperbarui', `Waktu terakhir profil ${person} diubah.`],
    ],
    steps: [
      'Urutkan berdasarkan Skor dari yang terkecil, atau saring Prioritas "Perlu segera ditangani".',
      `Klik baris ${person} untuk melihat rincian data yang perlu diperbaiki.`,
      `Lengkapi atau betulkan datanya melalui menu ${menu}.`,
    ],
    notes: [`Skor menilai kelengkapan data, bukan ${notMeasured}.`, RESCAN_NOTE],
    showScoreGuide: true,
  };
}

// Plain-language reading guide per report tab for admins unfamiliar with the report.
export const QUALITY_READING_GUIDE = {
  summary: {
    intro: 'Gambaran umum seberapa lengkap dan benar data atlet dan pelatih yang Anda kelola.',
    terms: [
      ['Total profil', 'Jumlah atlet dan pelatih yang boleh Anda lihat, sesuai filter yang dipilih.'],
      ['Rata-rata kualitas data', 'Nilai 0 sampai 100%. Makin tinggi, makin lengkap datanya. Ini bukan nilai prestasi.'],
      ['Masalah belum selesai', 'Jumlah kekurangan data yang belum dibereskan. Satu orang bisa punya beberapa masalah.'],
      ['Perlu segera ditangani', 'Bagian dari masalah yang paling penting dan sebaiknya dikerjakan lebih dulu.'],
      ['Kategori kelengkapan', 'Jumlah orang pada setiap tingkat kelengkapan data (lihat tabel arti skor).'],
      ['Jenis masalah', 'Jumlah masalah per jenis. Klik kartunya untuk membuka daftar orang yang bermasalah.'],
      ['Perkembangan kualitas data', 'Naik turunnya skor dari satu pemeriksaan ke pemeriksaan berikutnya.'],
      ['Peringkat kualitas data', 'Organisasi dan cabor diurutkan dari data paling lengkap. Klik untuk melihat rinciannya.'],
    ],
    steps: [
      'Lihat angka "Perlu segera ditangani" lebih dulu.',
      'Klik kartu Atlet, Pelatih, atau jenis masalah untuk melihat nama orangnya.',
      'Perbaiki datanya melalui menu data atlet atau pelatih.',
    ],
    notes: [RESCAN_NOTE],
    showScoreGuide: true,
  },
  athletes: profileGuide('atlet', 'Atlet', 'prestasi atlet'),
  coaches: profileGuide('pelatih', 'Pelatih', 'kemampuan pelatih'),
  duplicates: {
    intro: 'Pasangan profil yang terlihat mirip dan mungkin merupakan orang yang sama yang tercatat dua kali.',
    terms: [
      ['Data ganda terdeteksi', 'Hampir pasti orang yang sama, misalnya NIK-nya sama persis.'],
      ['Identitas tidak cocok', 'NIK atau nomor KK sama, tetapi nama atau tanggal lahirnya berbeda. Salah satu data kemungkinan salah ketik.'],
      ['Kemungkinan data ganda', 'Nama dan tanggal lahir mirip. Perlu dicek apakah benar orang yang sama.'],
      ['Kontak dipakai beberapa profil', 'Nomor telepon atau email yang sama dipakai lebih dari satu orang. Bisa wajar, misalnya nomor orang tua atau pelatih.'],
      ['Alasan kecocokan', 'Bagian data yang membuat kedua profil dianggap mirip.'],
      ['Status', 'Belum ditangani, Sedang ditangani, Selesai, atau Tidak ditindaklanjuti.'],
    ],
    steps: [
      'Bandingkan kedua profil pada kartu, terutama nama, organisasi, dan alasan kecocokannya.',
      'Jika benar orang yang sama, rapikan datanya melalui menu Analisis Duplikat atau data atlet/pelatih.',
      'Jika ternyata orang yang berbeda, tidak perlu diubah.',
    ],
    notes: ['Mirip belum tentu orang yang sama. Laporan ini tidak menghapus atau menggabungkan data apa pun.', RESCAN_NOTE],
  },
  validity: {
    intro: 'Daftar NIK, nomor KK, telepon, dan email yang masih kosong atau penulisannya tidak sesuai aturan.',
    terms: [
      ['NIK tidak valid', 'NIK kosong, bukan 16 angka, kode wilayahnya tidak dikenal, atau tanggal lahir di dalam NIK berbeda dengan tanggal lahir di profil.'],
      ['KK tidak valid', 'Nomor KK kosong, bukan 16 angka, atau berisi angka asal-asalan seperti 0000000000000000.'],
      ['Telepon tidak valid', 'Nomor telepon kosong atau formatnya salah.'],
      ['Email tidak valid', 'Email kosong, berupa email contoh/dummy, formatnya salah, berbeda dengan email akun, atau akunnya belum diverifikasi.'],
      ['Profil terkait', 'Nama atlet atau pelatih yang datanya bermasalah.'],
      ['Prioritas', 'Urutan penanganan: Perlu segera ditangani, lalu Sedang, lalu Rendah.'],
      ['Judul', 'Data yang perlu ditindaklanjuti.'],
    ],
    steps: [
      'Cocokkan data dengan dokumen asli seperti KTP atau Kartu Keluarga.',
      'Betulkan datanya pada profil atlet atau pelatih.',
    ],
    notes: ['Sistem hanya memeriksa penulisan, bukan memastikan data itu benar milik orang tersebut. Data pribadi tetap disamarkan.', RESCAN_NOTE],
  },
  documents: {
    intro: 'Status dokumen (Foto, Identitas, BPJS, dan Sertifikat) milik setiap atlet dan pelatih.',
    terms: [
      ['Tersedia', 'Dokumen ada dan dapat dibuka. Tidak perlu tindakan.'],
      ['Dokumen belum tercatat', 'Dokumen belum pernah diunggah.'],
      ['File tidak ditemukan', 'Dokumen tercatat, tetapi filenya tidak ada di penyimpanan. Unggah ulang.'],
      ['Tipe file tidak valid', 'File bukan jenis yang diterima, misalnya bukan gambar atau PDF.'],
      ['File dipakai beberapa profil', 'File yang sama terpasang pada lebih dari satu orang. Periksa apakah salah unggah.'],
      ['Kedaluwarsa', 'Masa berlaku dokumen sudah habis.'],
      ['Belum diperiksa', 'Sistem belum bisa mengecek file ini. Bukan berarti file hilang.'],
      ['Jenis file', 'Format file yang terdeteksi, misalnya image/jpeg atau application/pdf.'],
      ['Diperiksa', 'Waktu sistem terakhir mengecek dokumen.'],
    ],
    steps: [
      'Saring "Status pemeriksaan" untuk menampilkan dokumen yang belum berstatus Tersedia.',
      'Unggah atau ganti dokumennya melalui profil atlet atau pelatih.',
    ],
    notes: ['Isi tulisan dan masa berlaku dokumen belum dinilai oleh sistem.', RESCAN_NOTE],
  },
  distribution: {
    intro: 'Perbandingan kualitas data per wilayah, organisasi, dan cabor. Gunakan untuk melihat kelompok mana yang datanya paling perlu dibantu.',
    terms: [
      ['Profil', 'Jumlah atlet dan pelatih pada baris tersebut.'],
      ['Skor rata-rata', 'Rata-rata kelengkapan data semua orang pada baris tersebut. Makin tinggi makin baik.'],
      ['Masalah', 'Total kekurangan data pada baris tersebut.'],
    ],
    steps: [
      'Cari baris dengan skor rata-rata paling rendah atau jumlah masalah paling banyak.',
      'Pilih organisasi atau cabor tersebut di filter, lalu buka tab Kelengkapan Atlet atau Kelengkapan Pelatih untuk melihat nama orangnya.',
    ],
    notes: ['Ini perbandingan kerapian data, bukan peringkat prestasi.', RESCAN_NOTE],
  },
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
