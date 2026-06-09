# Dokumentasi Penggunaan Form Builder untuk Admin

Dokumentasi ini menjelaskan alur penggunaan **Form Builder** untuk admin dengan bahasa non teknis. Fokus utama dokumen ini adalah membantu admin memahami cara membuat, mengelola, mengisi, melihat hasil, serta menggunakan fitur relasi ke data lain seperti dropdown dari data master dan pengisian otomatis.

## Gambaran Umum

**Form Builder** adalah fitur untuk membuat formulir digital secara fleksibel. Admin dapat menentukan sendiri isi formulir, seperti kolom nama, nomor, tanggal, pilihan dropdown, pilihan ganda, checkbox, tabel penilaian, dan data yang diambil otomatis dari data lain di sistem.

Dengan Form Builder, admin tidak perlu membuat halaman baru setiap kali membutuhkan formulir baru. Admin cukup membuat template form, mengatur field yang dibutuhkan, lalu form tersebut dapat digunakan untuk mengumpulkan data.

Contoh penggunaan Form Builder:

- Form pendaftaran atlet.
- Form pendataan peserta event.
- Form tes kondisi fisik.
- Form monitoring dan evaluasi.
- Form verifikasi data atlet atau pelatih.
- Form survei internal.
- Form yang pilihan jawabannya mengambil data dari master seperti atlet, cabang olahraga, organisasi, venue, atau data lain yang tersedia.

## Istilah Penting

Sebelum menggunakan Form Builder, admin perlu memahami beberapa istilah berikut.

| Istilah | Arti Sederhana |
| --- | --- |
| **Form** | Formulir digital yang akan diisi. |
| **Template Form** | Rancangan atau struktur form sebelum digunakan. |
| **Section** | Bagian dalam form untuk mengelompokkan beberapa pertanyaan. |
| **Field** | Satu isian atau satu pertanyaan dalam form. |
| **Dropdown** | Pilihan berbentuk daftar turun. Pengisi form memilih satu data. |
| **Radio** | Pilihan satu jawaban dari beberapa opsi. |
| **Checkbox** | Pilihan yang bisa dipilih lebih dari satu. |
| **Submission** | Data hasil pengisian form yang sudah dikirim. |
| **Data Master** | Data utama yang sudah tersimpan di sistem, misalnya data atlet, pelatih, cabor, organisasi, atau venue. |
| **Relasi Data** | Form mengambil atau menghubungkan isian dengan data lain yang sudah ada di sistem. |
| **Auto-fill** | Sistem mengisi data secara otomatis setelah admin memilih data tertentu. |
| **Calculated** | Nilai yang dihitung otomatis oleh sistem dari field lain. |

## Cara Membuka Halaman Form Builder

1. Masuk ke sistem sebagai admin.
2. Buka menu **Form Builder** pada dashboard.
3. Sistem akan menampilkan daftar form yang sudah dibuat.

Pada halaman utama Form Builder, admin dapat melakukan beberapa hal:

- Melihat daftar form.
- Mencari form.
- Membuat form baru.
- Mengisi form.
- Mengedit form.
- Melihat data submission.
- Menghapus form.
- Membuka halaman event melalui tombol **Events**.

## Tampilan Halaman Utama Form Builder

Halaman utama Form Builder menampilkan daftar form dalam bentuk kartu. Setiap kartu menunjukkan informasi penting dari form tersebut.

Informasi yang ditampilkan pada kartu form:

- **Nama Form**: nama utama form.
- **Deskripsi Form**: penjelasan singkat tentang tujuan form.
- **Jumlah Submission**: jumlah data yang sudah masuk dari form tersebut.
- **Status Form**: menunjukkan apakah form aktif atau nonaktif.

Status form memiliki arti sebagai berikut:

- **Aktif**: form dapat digunakan untuk pengisian data.
- **Nonaktif**: form tidak sedang digunakan atau tidak disarankan untuk diisi.

## Fungsi Tombol pada Halaman Utama

| Tombol | Fungsi |
| --- | --- |
| **Events** | Membuka halaman event atau kegiatan. |
| **Buat Form Baru** | Membuat template form baru. |
| **Isi Form** | Membuka halaman pengisian form. |
| Ikon mata | Membuka halaman edit form. |
| Ikon clipboard | Melihat data submission yang masuk. |
| Ikon tempat sampah | Menghapus form. |
| **Batal** | Membatalkan penghapusan. |
| **Hapus** | Menghapus form atau submission sesuai konfirmasi. |

## Cara Mencari Form

Admin dapat mencari form melalui kolom pencarian **Cari form...**.

Langkah-langkah:

1. Klik kolom pencarian.
2. Ketik nama atau kata kunci form.
3. Tunggu sebentar sampai sistem menampilkan hasil yang sesuai.

Contoh:

Jika ingin mencari form tes fisik, ketik **tes fisik**.

## Tampilan Jika Belum Ada Form

Jika belum ada form yang dibuat, sistem akan menampilkan pesan **Belum Ada Form**.

Admin dapat langsung membuat form pertama dengan menekan tombol **Buat Form Baru**.

## Alur Besar Penggunaan Form Builder

Alur umum penggunaan Form Builder adalah sebagai berikut:

1. Admin membuat template form.
2. Admin mengatur section atau bagian form.
3. Admin menambahkan field atau isian form.
4. Admin menentukan jenis field, misalnya text, tanggal, dropdown, atau checkbox.
5. Jika dibutuhkan, admin menghubungkan field ke data master atau tabel lain.
6. Admin menyimpan form.
7. Admin atau pengguna mengisi form.
8. Data yang dikirim tersimpan sebagai submission.
9. Admin melihat dan memeriksa data submission.

## Cara Membuat Form Baru

1. Klik tombol **Buat Form Baru**.
2. Sistem membuka halaman pembuatan form.
3. Isi **Nama Form**.
4. Isi **Deskripsi** agar tujuan form mudah dipahami.
5. Tentukan apakah form **Aktif** atau tidak.
6. Tambahkan section sesuai kebutuhan.
7. Tambahkan field pada setiap section.
8. Atur jenis field dan pengaturan lainnya.
9. Klik **Simpan Form**.

Contoh nama form yang baik:

- **Form Tes Kondisi Fisik Atlet**.
- **Form Pendataan Peserta Event Porprov**.
- **Form Evaluasi Pelatih**.

Hindari nama form yang terlalu umum seperti **Form 1** atau **Data Baru**, karena akan sulit dicari di kemudian hari.

## Informasi Dasar Form

Pada halaman pembuatan atau edit form, bagian **Informasi Dasar** berisi data utama form.

### Nama Form

Nama form adalah judul utama yang akan terlihat di daftar Form Builder dan saat form diisi.

Contoh:

- **Tes Kondisi Fisik Atlet**.
- **Pendaftaran Peserta Kejuaraan**.

### Form Aktif

Centang **Form Aktif** jika form boleh digunakan.

Jika form belum selesai disiapkan, admin dapat menonaktifkannya terlebih dahulu agar tidak digunakan sebelum siap.

### Deskripsi

Deskripsi menjelaskan tujuan form.

Contoh:

**Form ini digunakan untuk mencatat hasil tes fisik atlet berdasarkan event yang sedang berjalan.**

## Mengenal Section

**Section** adalah bagian dalam form. Section membantu admin mengelompokkan pertanyaan agar form lebih rapi.

Contoh pembagian section:

- **Data Atlet**.
- **Data Event**.
- **Hasil Tes Fisik**.
- **Catatan Evaluasi**.

Admin dapat menambahkan lebih dari satu section dengan tombol **Tambah Section**.

## Jenis Section

Form Builder menyediakan dua jenis section.

| Jenis Section | Kegunaan |
| --- | --- |
| **Normal** | Untuk isian biasa seperti teks, tanggal, dropdown, radio, checkbox, dan auto-fill. |
| **Table** | Untuk isian berbentuk tabel, biasanya cocok untuk penilaian berulang seperti komponen tes fisik. |

## Section Normal

Gunakan section **Normal** untuk pertanyaan umum.

Contoh isi section Normal:

- Nama atlet.
- Tanggal pemeriksaan.
- Cabang olahraga.
- Lokasi kegiatan.
- Catatan admin.
- Status verifikasi.

## Section Table

Gunakan section **Table** jika data lebih cocok ditampilkan sebagai tabel.

Contoh penggunaan section Table:

- Tes sit up.
- Tes push up.
- Tes lari.
- Tes kelentukan.
- Tes kekuatan otot.

Pada section Table, setiap baris field dapat memiliki informasi seperti:

- **Group Label**: kelompok utama, misalnya **Kekuatan**.
- **Sub Label**: bagian yang diuji, misalnya **Otot Perut**.
- **Technique**: teknik atau metode, misalnya **Sit Up**.
- **Unit**: satuan nilai, misalnya **kali**, **cm**, atau **detik**.

Saat form diisi, section Table akan menampilkan kolom seperti komponen, teknik, skor, dan kategori. Kategori dapat dihitung otomatis oleh sistem jika aturan penilaian sudah tersedia.

## Mengenal Field

**Field** adalah satu isian atau satu pertanyaan dalam form.

Contoh field:

- Nama atlet.
- Tanggal lahir.
- Jenis kelamin.
- Cabang olahraga.
- Hasil sit up.
- Keterangan.

Admin menambahkan field dengan tombol **Tambah Field** pada section yang dipilih.

## Pengaturan Dasar Field

Setiap field memiliki beberapa pengaturan dasar.

| Pengaturan | Penjelasan |
| --- | --- |
| **Label** | Teks pertanyaan yang terlihat oleh pengisi form. |
| **Name** | Nama singkat untuk penanda field di sistem. Gunakan huruf kecil dan tanpa spasi. |
| **Tipe** | Jenis isian, misalnya text, number, dropdown, atau checkbox. |
| **Unit** | Satuan nilai, misalnya cm, kg, kali, detik. |
| **Required** | Jika dicentang, field wajib diisi. |
| **Auto-grading** | Jika dicentang, sistem dapat memberi kategori atau penilaian otomatis jika aturan tersedia. |

Contoh pengisian field:

| Label | Name | Tipe | Unit | Required |
| --- | --- | --- | --- | --- |
| Nama Atlet | nama_atlet | Text | kosong | Ya |
| Tanggal Tes | tanggal_tes | Date | kosong | Ya |
| Tinggi Badan | tinggi_badan | Number | cm | Ya |
| Catatan | catatan | Text Area | kosong | Tidak |

## Jenis-Jenis Field

Form Builder menyediakan beberapa jenis field.

| Jenis Field | Kegunaan |
| --- | --- |
| **Text** | Isian teks pendek. |
| **Text Area** | Isian teks panjang atau catatan. |
| **Number** | Isian angka. |
| **Email** | Isian alamat email. |
| **Date** | Isian tanggal. |
| **Dropdown** | Memilih satu jawaban dari daftar pilihan. |
| **Radio** | Memilih satu jawaban dari beberapa pilihan yang langsung terlihat. |
| **Checkbox** | Memilih satu atau lebih jawaban. |
| **Auto-fill dari Model** | Mengambil data dari data master atau tabel lain dan mengisi nilai secara otomatis. |
| **Calculated** | Menghitung nilai otomatis dari field lain. |

## Field Text

Gunakan **Text** untuk isian pendek.

Contoh:

- Nama lengkap.
- Nomor peserta.
- Tempat lahir.

## Field Text Area

Gunakan **Text Area** untuk jawaban panjang.

Contoh:

- Catatan evaluasi.
- Keterangan tambahan.
- Alasan perubahan data.

## Field Number

Gunakan **Number** untuk angka.

Contoh:

- Berat badan.
- Tinggi badan.
- Jumlah repetisi.
- Nilai tes.

Tambahkan **Unit** agar pengisi form memahami satuannya.

Contoh unit:

- kg.
- cm.
- kali.
- detik.
- menit.

## Field Date

Gunakan **Date** untuk tanggal.

Contoh:

- Tanggal tes.
- Tanggal lahir.
- Tanggal pemeriksaan.

## Field Dropdown, Radio, dan Checkbox

Ketiga field ini digunakan untuk pilihan jawaban.

Perbedaannya:

| Jenis | Cara Kerja | Contoh Penggunaan |
| --- | --- | --- |
| **Dropdown** | Pengisi memilih satu dari daftar turun. | Memilih cabor, venue, organisasi. |
| **Radio** | Pengisi memilih satu dari beberapa pilihan yang terlihat. | Jenis kelamin, status aktif, kategori. |
| **Checkbox** | Pengisi bisa memilih lebih dari satu pilihan. | Fasilitas tersedia, dokumen lengkap. |

## Sumber Pilihan pada Dropdown, Radio, dan Checkbox

Untuk field pilihan, admin dapat menentukan sumber datanya.

Ada dua sumber pilihan:

| Sumber Data | Penjelasan |
| --- | --- |
| **Custom Options** | Pilihan diketik manual oleh admin. |
| **From Database** | Pilihan diambil dari data yang sudah ada di sistem. |

## Custom Options

Gunakan **Custom Options** jika pilihan bersifat sederhana dan tidak perlu mengambil data dari tabel lain.

Contoh pilihan manual:

- Laki-laki.
- Perempuan.
- Ya.
- Tidak.
- Rendah.
- Sedang.
- Tinggi.

Cara membuat Custom Options:

1. Buat field dengan tipe **Dropdown**, **Radio**, atau **Checkbox**.
2. Pada **Data Source**, pilih **Custom Options**.
3. Klik **Tambah Opsi**.
4. Ketik label pilihan.
5. Tambahkan opsi lain sesuai kebutuhan.
6. Simpan form.

Contoh Custom Options untuk status verifikasi:

| Label Opsi | Arti |
| --- | --- |
| Menunggu Verifikasi | Data belum diperiksa. |
| Valid | Data sudah benar. |
| Perlu Perbaikan | Data perlu dilengkapi. |

## From Database

Gunakan **From Database** jika pilihan harus mengikuti data yang sudah tersimpan di sistem.

Dengan cara ini, admin tidak perlu mengetik pilihan satu per satu. Sistem akan mengambil daftar pilihan dari data master yang tersedia.

Contoh penggunaan From Database:

- Dropdown cabang olahraga mengambil data dari master cabor.
- Dropdown atlet mengambil data dari master atlet.
- Dropdown pelatih mengambil data dari master pelatih.
- Dropdown organisasi mengambil data dari master organisasi.
- Dropdown venue mengambil data dari master venue.
- Dropdown event mengambil data dari data event.

Catatan: Daftar model atau sumber data yang tersedia mengikuti pilihan yang muncul di sistem. Jika suatu data master tidak muncul di pilihan model, berarti data tersebut belum disediakan sebagai sumber untuk Form Builder.

## Cara Membuat Dropdown dari Data Master

1. Tambahkan field baru.
2. Isi **Label**, misalnya **Cabang Olahraga**.
3. Isi **Name**, misalnya **cabor_id**.
4. Pilih tipe **Dropdown**.
5. Pada **Data Source**, pilih **From Database**.
6. Pada pilihan model, pilih data master yang ingin digunakan, misalnya **Cabor** jika tersedia.
7. Simpan form.
8. Saat form diisi, dropdown akan menampilkan pilihan dari data master tersebut.

Contoh:

Jika admin membuat field **Cabang Olahraga** dan memilih sumber data dari master cabor, maka pengisi form akan melihat daftar cabor yang sudah tersimpan di sistem. Ketika data cabor di master diperbarui, pilihan dropdown juga mengikuti data yang disediakan sistem.

## Kapan Menggunakan Custom Options dan From Database?

Gunakan panduan berikut.

| Kebutuhan | Pilihan yang Disarankan |
| --- | --- |
| Pilihan sederhana dan jarang berubah | **Custom Options** |
| Pilihan berasal dari data master | **From Database** |
| Pilihan harus selalu mengikuti data terbaru di sistem | **From Database** |
| Pilihan hanya berlaku untuk satu form tertentu | **Custom Options** |
| Pilihan digunakan di banyak bagian sistem | **From Database** |

Contoh:

- **Jenis Kelamin** lebih cocok menggunakan Custom Options.
- **Cabang Olahraga** lebih cocok menggunakan From Database.
- **Venue** lebih cocok menggunakan From Database.
- **Status Pemeriksaan** bisa menggunakan Custom Options.

## Relasi Form ke Data Lain

Form Builder dapat menghubungkan form dengan data lain yang sudah ada di sistem. Fitur ini berguna agar data tidak perlu diketik ulang dan mengurangi risiko salah input.

Contoh relasi:

- Form tes fisik berelasi dengan data atlet.
- Field cabor mengambil daftar dari master cabor.
- Field venue mengambil daftar dari master venue.
- Field organisasi mengambil daftar dari master organisasi.
- Field tertentu otomatis terisi setelah admin memilih atlet.

Manfaat relasi data:

- Data lebih konsisten.
- Admin tidak perlu mengetik data yang sudah ada.
- Pilihan dropdown lebih rapi.
- Risiko salah penulisan berkurang.
- Submission dapat dikaitkan dengan data utama seperti atlet atau event.

## Reference Model atau Data Acuan Utama

Pada beberapa form, sistem dapat menggunakan satu data acuan utama. Data acuan utama ini adalah data yang dipilih di awal saat form diisi, lalu digunakan untuk mengisi beberapa field secara otomatis.

Contoh:

Form **Tes Kondisi Fisik Atlet** menggunakan data acuan utama **Atlet**.

Saat admin mengisi form:

1. Admin memilih atlet terlebih dahulu.
2. Sistem mengambil data atlet tersebut.
3. Field seperti nama atlet, jenis kelamin, cabor, atau data lain dapat terisi otomatis jika sudah dikonfigurasi.
4. Admin melanjutkan mengisi hasil tes.
5. Submission tersimpan dan terhubung dengan atlet tersebut.

Jika form dibuka dari halaman event, data acuan dapat mengikuti konteks event. Contohnya, pilihan atlet dapat dibatasi hanya atlet yang terkait dengan event tersebut jika sistem menyediakan filter tersebut.

## Auto-fill dari Model

**Auto-fill dari Model** adalah field yang mengambil nilai dari data master atau data lain di sistem.

Gunakan fitur ini jika admin ingin field terisi otomatis setelah data tertentu dipilih.

Contoh penggunaan:

- Setelah memilih atlet, field **Nama Atlet** otomatis terisi.
- Setelah memilih atlet, field **Tanggal Lahir** otomatis terisi.
- Setelah memilih atlet, field **Cabang Olahraga** otomatis terisi.
- Setelah memilih pelatih, field **Nama Pelatih** otomatis terisi.

Cara membuat field Auto-fill:

1. Tambahkan field baru.
2. Pilih tipe **Auto-fill dari Model**.
3. Pilih **Source Model** atau sumber data, misalnya atlet, pelatih, cabor, atau data lain yang tersedia.
4. Pilih **Field to Auto-fill**, yaitu data mana yang ingin diambil.
5. Centang **Read-only** jika nilai tersebut hanya boleh dibaca dan tidak boleh diubah saat pengisian form.
6. Simpan form.

Contoh:

Admin ingin menampilkan nama atlet secara otomatis.

| Pengaturan | Isi |
| --- | --- |
| Tipe Field | Auto-fill dari Model |
| Source Model | Atlet |
| Field to Auto-fill | name |
| Read-only | Ya |

Hasilnya, saat pengisi memilih atlet, field nama atlet akan otomatis menampilkan nama dari data atlet.

## Read-only pada Auto-fill

**Read-only** berarti field hanya ditampilkan dan tidak bisa diubah oleh pengisi form.

Gunakan Read-only jika data berasal dari master dan tidak boleh diganti secara manual.

Contoh field yang sebaiknya Read-only:

- Nama atlet dari data master.
- Tanggal lahir dari data master.
- Cabor dari data master.
- Nama organisasi dari data master.

Field Read-only membantu menjaga agar data master tidak berbeda dengan data di submission.

## Dropdown yang Terhubung dengan Data Acuan

Pada field Dropdown, Radio, atau Checkbox yang sumbernya **From Database**, terdapat pilihan untuk menghubungkan field dengan data acuan utama.

Contoh sederhana:

Form menggunakan data acuan utama **Atlet**. Di dalam data atlet terdapat informasi cabor. Admin membuat field **Cabang Olahraga** yang sumber pilihannya dari master cabor. Field tersebut dapat dihubungkan dengan data cabor milik atlet.

Saat form diisi:

1. Admin memilih atlet.
2. Sistem membaca data atlet.
3. Sistem melihat cabor atlet tersebut.
4. Dropdown **Cabang Olahraga** dapat otomatis memilih cabor yang sesuai.

Manfaat fitur ini:

- Pengisi form tidak perlu memilih ulang data yang sudah diketahui sistem.
- Data lebih cepat diisi.
- Risiko salah memilih cabor atau data terkait menjadi lebih kecil.

## Contoh Relasi Dropdown dengan Data Master

Berikut contoh relasi yang umum digunakan.

| Field di Form | Sumber Data | Cara Kerja |
| --- | --- | --- |
| Cabang Olahraga | Master Cabor | Dropdown menampilkan daftar cabor. |
| Atlet | Master Atlet | Dropdown menampilkan daftar atlet. |
| Pelatih | Master Pelatih | Dropdown menampilkan daftar pelatih. |
| Organisasi | Master Organisasi | Dropdown menampilkan daftar organisasi. |
| Venue | Master Venue | Dropdown menampilkan daftar venue. |
| Event | Data Event | Dropdown menampilkan daftar event jika tersedia. |

## Contoh Form yang Menggunakan Relasi Data

Contoh form: **Form Tes Kondisi Fisik Atlet**.

Struktur form:

| Bagian | Isi |
| --- | --- |
| Data Atlet | Memilih atlet dari data master. |
| Identitas Atlet | Nama, cabor, jenis kelamin, atau data lain terisi otomatis. |
| Data Tes | Tanggal tes, lokasi, petugas. |
| Hasil Tes | Nilai sit up, push up, lari, dan tes lainnya. |
| Catatan | Evaluasi atau keterangan tambahan. |

Alur pengisian:

1. Admin membuka form tes kondisi fisik.
2. Admin memilih atlet pada pilihan data acuan.
3. Sistem memuat data atlet.
4. Field identitas atlet terisi otomatis jika sudah diatur.
5. Admin mengisi hasil tes fisik.
6. Sistem menghitung field calculated jika tersedia.
7. Admin klik **Submit**.
8. Data tersimpan sebagai submission.

## Field Calculated

**Calculated** adalah field yang nilainya dihitung otomatis oleh sistem.

Contoh penggunaan:

- Menghitung total skor.
- Menghitung rata-rata nilai.
- Menghitung hasil dari beberapa komponen tes.

Contoh sederhana:

Jika form memiliki field **nilai_1** dan **nilai_2**, field calculated dapat digunakan untuk menghitung total.

Saat pengisi memasukkan nilai, sistem akan menampilkan hasil perhitungan secara otomatis.

Catatan: Field calculated perlu dikonfigurasi dengan benar agar sistem mengetahui field mana saja yang digunakan untuk perhitungan.

## Auto-grading

**Auto-grading** digunakan jika nilai pada field perlu diberi kategori otomatis.

Contoh kategori:

- Sangat Baik.
- Baik.
- Cukup.
- Kurang.

Contoh penggunaan:

Pada tes fisik, nilai sit up dapat diberi kategori otomatis berdasarkan aturan penilaian yang tersedia di sistem. Saat submission dilihat, kategori dapat muncul bersama nilai.

Catatan: Auto-grading bergantung pada aturan penilaian yang dikonfigurasi. Jika aturan belum tersedia, kategori mungkin belum muncul.

## Cara Mengisi Form

1. Buka halaman **Form Builder**.
2. Cari form yang ingin diisi.
3. Klik **Isi Form**.
4. Jika form menggunakan data acuan, pilih data acuan terlebih dahulu, misalnya atlet.
5. Tunggu sampai sistem memuat data terkait.
6. Periksa field yang terisi otomatis.
7. Isi field lain yang masih kosong.
8. Periksa kembali data yang diisi.
9. Klik **Submit**.
10. Sistem akan menyimpan data sebagai submission.

Jika form berhasil disimpan, sistem akan menampilkan pesan bahwa form berhasil disimpan, lalu mengarahkan admin kembali ke halaman terkait.

## Mengisi Form dari Halaman Event

Form juga dapat digunakan dari halaman event jika form tersebut dipasang atau tersedia di event.

Alurnya:

1. Admin membuka halaman event.
2. Admin memilih form yang tersedia pada event tersebut.
3. Admin klik isi form.
4. Sistem membuka form dengan konteks event.
5. Jika form menggunakan data atlet, pilihan atlet dapat mengikuti data pada event tersebut jika fitur tersebut tersedia.
6. Admin mengisi dan mengirim form.
7. Submission tersimpan dengan informasi event.

Keuntungan mengisi form dari event:

- Data submission dapat dikaitkan dengan event.
- Admin lebih mudah melihat submission berdasarkan event.
- Pilihan data dapat lebih terarah sesuai kegiatan.

## Cara Mengedit Form

1. Buka halaman **Form Builder**.
2. Cari form yang ingin diubah.
3. Klik ikon mata pada kartu form.
4. Sistem membuka halaman edit form.
5. Ubah informasi dasar, section, field, atau relasi data sesuai kebutuhan.
6. Klik **Simpan Form**.

Contoh perubahan yang dapat dilakukan:

- Mengubah nama form.
- Mengubah deskripsi form.
- Menambah section.
- Menambah field baru.
- Mengubah tipe field.
- Mengubah pilihan dropdown.
- Mengubah sumber dropdown dari Custom Options ke From Database.
- Mengatur field agar mengambil data otomatis dari model.
- Mengaktifkan atau menonaktifkan form.

Catatan penting: Jika form sudah memiliki submission, berhati-hatilah saat mengubah atau menghapus field. Perubahan struktur form dapat memengaruhi cara admin membaca data lama.

## Cara Melihat Submission

Submission adalah data hasil pengisian form.

Langkah-langkah melihat submission:

1. Buka halaman **Form Builder**.
2. Cari form yang ingin diperiksa.
3. Klik ikon clipboard pada kartu form.
4. Sistem membuka halaman **Submissions**.
5. Admin dapat melihat daftar data yang sudah masuk.

Informasi yang ditampilkan pada daftar submission:

- **Submission Code**: kode unik submission.
- **Reference**: data acuan yang terkait, misalnya nama atlet jika form menggunakan acuan atlet.
- **Submitted By**: pengguna yang mengirim data.
- **Date**: tanggal dan waktu data dikirim.
- **Actions**: tombol untuk melihat detail atau menghapus submission.

## Cara Melihat Detail Submission

1. Masuk ke halaman **Submissions**.
2. Klik ikon mata pada submission yang ingin dilihat.
3. Sistem menampilkan detail jawaban.
4. Periksa nilai setiap field.
5. Jika ada kategori hasil perhitungan atau penilaian, kategori tersebut dapat ditampilkan pada detail.
6. Klik **Tutup** setelah selesai.

## Cara Mencari Submission

Pada halaman submission tersedia kolom pencarian **Cari submission code...**.

Langkah-langkah:

1. Ketik kode submission atau kata kunci yang diketahui.
2. Tunggu sebentar.
3. Sistem menampilkan hasil yang sesuai.

Gunakan fitur ini jika data submission sudah banyak.

## Cara Menghapus Submission

1. Buka halaman **Submissions**.
2. Cari submission yang ingin dihapus.
3. Klik ikon tempat sampah.
4. Sistem menampilkan konfirmasi **Hapus Submission?**.
5. Klik **Hapus** jika yakin.
6. Klik **Batal** jika tidak jadi menghapus.

Peringatan: Submission yang dihapus tidak akan muncul lagi di daftar submission. Pastikan data tersebut memang tidak diperlukan.

## Cara Menghapus Form

1. Buka halaman **Form Builder**.
2. Cari form yang ingin dihapus.
3. Klik ikon tempat sampah pada kartu form.
4. Sistem menampilkan konfirmasi **Hapus Form?**.
5. Baca peringatan yang muncul.
6. Klik **Hapus** jika yakin.
7. Klik **Batal** jika tidak jadi menghapus.

Peringatan penting: Jika form dihapus, semua data submission dari form tersebut juga akan ikut dihapus. Jangan menghapus form jika data submission masih dibutuhkan.

## Contoh Skenario 1: Membuat Dropdown Cabor dari Data Master

Tujuan: Admin ingin membuat field **Cabang Olahraga** yang pilihannya otomatis mengambil data dari master cabor.

Langkah-langkah:

1. Klik **Buat Form Baru** atau edit form yang sudah ada.
2. Tambahkan section, misalnya **Data Atlet**.
3. Klik **Tambah Field**.
4. Isi **Label** dengan **Cabang Olahraga**.
5. Isi **Name** dengan **cabor_id**.
6. Pilih tipe **Dropdown**.
7. Pada **Data Source**, pilih **From Database**.
8. Pada model, pilih data cabor jika tersedia.
9. Simpan form.
10. Saat form diisi, field tersebut menampilkan daftar cabor dari data master.

## Contoh Skenario 2: Membuat Field Jenis Kelamin Manual

Tujuan: Admin ingin membuat pilihan jenis kelamin tanpa mengambil dari data master.

Langkah-langkah:

1. Tambahkan field baru.
2. Isi **Label** dengan **Jenis Kelamin**.
3. Isi **Name** dengan **jenis_kelamin**.
4. Pilih tipe **Radio** atau **Dropdown**.
5. Pada **Data Source**, pilih **Custom Options**.
6. Tambahkan opsi **Laki-laki**.
7. Tambahkan opsi **Perempuan**.
8. Simpan form.

## Contoh Skenario 3: Membuat Auto-fill Nama Atlet

Tujuan: Admin ingin nama atlet otomatis muncul setelah atlet dipilih.

Langkah-langkah:

1. Pastikan form menggunakan data acuan atau model atlet jika tersedia.
2. Tambahkan field baru.
3. Isi **Label** dengan **Nama Atlet**.
4. Isi **Name** dengan **nama_atlet** atau nama yang sesuai.
5. Pilih tipe **Auto-fill dari Model**.
6. Pilih **Source Model** atlet jika tersedia.
7. Pilih field yang ingin diambil, misalnya **name**.
8. Centang **Read-only** agar nama tidak dapat diubah saat pengisian.
9. Simpan form.
10. Saat form diisi dan atlet dipilih, nama atlet akan muncul otomatis.

## Contoh Skenario 4: Membuat Form Tes Fisik dengan Section Table

Tujuan: Admin ingin membuat form untuk mencatat hasil tes fisik atlet.

Langkah-langkah:

1. Klik **Buat Form Baru**.
2. Isi nama form dengan **Form Tes Kondisi Fisik Atlet**.
3. Tambahkan section **Identitas Atlet** dengan tipe Normal.
4. Tambahkan field untuk memilih atau menampilkan data atlet.
5. Tambahkan section **Hasil Tes Fisik**.
6. Ubah tipe section menjadi **Table**.
7. Tambahkan field untuk setiap komponen tes.
8. Isi **Group Label**, misalnya **Kekuatan**.
9. Isi **Sub Label**, misalnya **Otot Perut**.
10. Isi **Technique**, misalnya **Sit Up**.
11. Isi **Unit**, misalnya **kali**.
12. Tambahkan komponen tes lain sesuai kebutuhan.
13. Simpan form.

Saat form diisi, admin akan melihat tabel hasil tes fisik dan dapat memasukkan skor pada setiap baris.

## Contoh Skenario 5: Mengisi Form yang Terhubung dengan Event

Tujuan: Admin ingin mencatat data form untuk event tertentu.

Langkah-langkah:

1. Buka halaman event.
2. Pilih form yang tersedia pada event tersebut.
3. Klik tombol untuk mengisi form.
4. Pilih data acuan jika diminta, misalnya atlet.
5. Isi data yang belum otomatis terisi.
6. Klik **Submit**.
7. Submission tersimpan dan terhubung dengan event tersebut.

## Rekomendasi Penamaan Field

Gunakan nama field yang rapi agar mudah dipahami dan mudah digunakan ulang.

Rekomendasi:

- Gunakan huruf kecil.
- Gunakan garis bawah sebagai pengganti spasi.
- Buat nama sesuai isi field.
- Hindari nama yang terlalu pendek dan tidak jelas.

Contoh yang baik:

- nama_atlet.
- tanggal_tes.
- cabor_id.
- tinggi_badan.
- berat_badan.
- hasil_sit_up.
- catatan_evaluasi.

Contoh yang kurang baik:

- field1.
- data.
- input_baru.
- abc.

## Rekomendasi Saat Menggunakan Relasi Data

- Gunakan relasi data untuk pilihan yang berasal dari data master.
- Gunakan Custom Options hanya untuk pilihan sederhana.
- Pastikan data master sudah lengkap sebelum digunakan sebagai dropdown.
- Gunakan Read-only untuk data yang diambil otomatis dan tidak boleh diubah.
- Periksa hasil auto-fill dengan mencoba mengisi form sebelum form digunakan secara resmi.
- Jangan menghapus field yang sudah dipakai pada submission lama tanpa pertimbangan.
- Gunakan nama field yang jelas agar data submission mudah dibaca.

## Kesalahan yang Sering Terjadi dan Cara Menghindarinya

| Masalah | Penyebab Umum | Cara Menghindari |
| --- | --- | --- |
| Dropdown kosong | Data master belum tersedia atau model belum dipilih. | Pastikan data master sudah ada dan sumber database sudah dipilih. |
| Auto-fill tidak muncul | Field sumber belum dipilih atau data acuan belum dipilih saat mengisi form. | Pilih data acuan terlebih dahulu dan pastikan pengaturan auto-fill benar. |
| Field wajib tidak bisa dikosongkan | Field dicentang Required. | Isi field tersebut atau hapus centang Required jika tidak wajib. |
| Data submission sulit dipahami | Label dan name field kurang jelas. | Gunakan label dan name yang deskriptif. |
| Pilihan dropdown tidak sesuai | Salah memilih model sumber data. | Periksa kembali Data Source dan model yang dipilih. |
| Data lama sulit dibaca setelah edit form | Struktur field berubah setelah ada submission. | Hindari perubahan besar pada form yang sudah banyak digunakan. |

## Checklist Sebelum Form Digunakan

Gunakan checklist berikut sebelum form dibagikan atau digunakan resmi.

- Nama form sudah jelas.
- Deskripsi form sudah menjelaskan tujuan form.
- Form sudah dalam status aktif jika siap digunakan.
- Section sudah rapi dan mudah dipahami.
- Label field sudah jelas untuk pengisi form.
- Field wajib sudah ditentukan dengan benar.
- Dropdown manual sudah memiliki semua opsi yang diperlukan.
- Dropdown database sudah mengambil data master yang benar.
- Auto-fill sudah diuji dengan memilih data acuan.
- Field calculated sudah menampilkan hasil yang benar jika digunakan.
- Form sudah dicoba minimal satu kali sebelum digunakan resmi.
- Admin sudah memastikan data submission dapat dilihat dengan benar.

## Checklist Saat Menghapus Form atau Submission

Sebelum menghapus, pastikan hal-hal berikut.

- Data sudah tidak dibutuhkan.
- Tidak ada laporan yang masih membutuhkan data tersebut.
- Admin lain sudah mengetahui jika data penting akan dihapus.
- Form yang dihapus bukan form yang masih digunakan pada event aktif.
- Submission yang dihapus memang salah atau tidak diperlukan.

## Ringkasan Alur Admin

1. Buka **Form Builder**.
2. Klik **Buat Form Baru**.
3. Isi informasi dasar form.
4. Tambahkan section.
5. Tambahkan field.
6. Pilih jenis field.
7. Jika perlu, hubungkan field ke data master melalui **From Database**.
8. Jika perlu, gunakan **Auto-fill dari Model** agar data terisi otomatis.
9. Simpan form.
10. Coba isi form.
11. Periksa submission.
12. Gunakan form untuk kebutuhan operasional.

## Kesimpulan

Form Builder membantu admin membuat formulir digital yang fleksibel. Selain membuat isian biasa, admin juga dapat membuat dropdown dari data master, menghubungkan form dengan data lain, menggunakan auto-fill, membuat section tabel, dan melihat hasil pengisian sebagai submission.

Gunakan fitur relasi data jika pilihan atau nilai field berasal dari data yang sudah ada di sistem. Gunakan fitur hapus dengan hati-hati karena penghapusan form juga menghapus seluruh submission yang terkait dengan form tersebut.
