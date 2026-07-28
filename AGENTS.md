# AGENTS.md

## Tujuan dan Cakupan

Dokumen ini adalah kontrak kerja utama bagi AI/coding agent yang bekerja di repository `koni-sumbar-frontend`. Aturan ini berlaku untuk seluruh repository karena tidak ada `AGENTS.md` yang lebih dalam.

Baca juga:

- [`MEMORY.md`](./MEMORY.md) untuk snapshot fakta repository, arsitektur, baseline validasi, dan watchlist.
- [`TOOLS.md`](./TOOLS.md) untuk command lokal, pencarian source, dan prosedur validasi.

Pekerjaan harus mengikuti source aktif. Jika dokumen berbeda dengan implementasi, ikuti urutan sumber kebenaran di bawah dan perbarui dokumentasi hanya bila masih termasuk scope.

## Urutan Sumber Kebenaran

Untuk menentukan perilaku frontend, gunakan urutan berikut:

1. Wiring provider dan bootstrap di [`src/main.jsx`](./src/main.jsx).
2. Route aktif dan komposisi page di [`src/App.jsx`](./src/App.jsx).
3. API client aktif di [`src/api/axios.js`](./src/api/axios.js).
4. Hook data/query di [`src/hooks/`](./src/hooks/) dan [`src/hooks/queries/`](./src/hooks/queries/), termasuk query key serta invalidation.
5. Consumer UI aktual di [`src/pages/`](./src/pages/) dan [`src/components/`](./src/components/).
6. Kontrak backend sibling di `../golang-koni-sumbar`, dimulai dari `main.go`, lalu handler/service/model terkait.
7. Dokumentasi seperti `README.md`, `DOKUMENTASI_FORM_BUILDER_ADMIN.md`, dan dokumen operasional ini.

Backend tetap menjadi sumber kebenaran untuk authorization, scope data, validasi bisnis, dan persistence. Namun jangan menebak cara frontend mengonsumsi backend tanpa memeriksa client, hook, dan component/page aktual.

## Grounding Wajib Sebelum Coding

Sebelum mengubah file:

1. Pastikan berada di root repository yang berisi `package.json`, `src/`, `Dockerfile`, dan `nginx.conf`.
2. Baca `git status --short --branch`, branch, commit aktif, dan diff yang sudah ada.
3. Jangan menimpa, membuang, melakukan restore, atau memformat ulang perubahan lokal pengguna.
4. Temukan route UI di `src/App.jsx` dan item navigasi terkait di `src/components/Sidebar.jsx`.
5. Ikuti alur data lengkap: page/component -> hook/query atau Axios langsung -> `src/api/axios.js` -> route backend sibling.
6. Periksa method HTTP, path, query parameter, content type, payload, response envelope, permission, organization scope, serta error status yang dipakai consumer.
7. Jika mutation terlibat, temukan semua query key yang harus dibuat stale atau dibersihkan.
8. Jika effect, upload, download, preview, atau protected image terlibat, tentukan cleanup untuk timer, listener, request, dan object URL.
9. Tetapkan scope perubahan dan validation matrix yang relevan sebelum mulai mengedit.

Gunakan command aman pada [`TOOLS.md`](./TOOLS.md). Jangan mengandalkan `rg`, Bash, Docker, test runner, atau tool lain yang belum tersedia pada snapshot lokal.

## Arsitektur Aktual

Aplikasi adalah single-page application React berbasis Vite dan JavaScript/JSX.

### Bootstrap dan Provider Global

`src/main.jsx` merangkai aplikasi dengan urutan:

1. React `StrictMode`;
2. `QueryClientProvider` dengan singleton dari `src/lib/queryClient.js`;
3. `BrowserRouter`;
4. `AuthProvider`;
5. `App`.

Pertahankan urutan provider jika menambah consumer context. Jangan membuat `QueryClient`, router, atau auth provider kedua di subtree hanya untuk menyelesaikan masalah lokal.

`App` memasang `VersionChecker` dan seluruh `Routes`. Route root dan route tidak dikenal diarahkan ke `/dashboard`.

### Tanggung Jawab Struktur

- `src/App.jsx`: deklarasi route, route publik/protected, redirect dashboard berbasis role.
- `src/api/axios.js`: base URL, header default, injeksi bearer token, dan handling global response tertentu.
- `src/contexts/AuthContext.jsx`: user session, login/logout/register, bootstrap `/api/user`, dan pembersihan cache antar-user.
- `src/hooks/useAuth.js`: akses aman ke `AuthContext`.
- `src/hooks/usePermission.js`: helper presentasional `can`, `canAny`, dan `canAll`.
- `src/hooks/queries/`: query key factory, query/mutation TanStack Query, dan invalidation per domain.
- `src/hooks/useMonev.js`: state/fetching Monev manual; belum menggunakan TanStack Query.
- `src/pages/`: screen yang diroute dan orkestrasi state tingkat page.
- `src/components/`: layout, modal, tabel, form, print, protected media, serta component domain.
- `src/lib/queryClient.js`: default cache global.
- `src/index.css`: entry Tailwind CSS v4 dan keyframe global yang memang diperlukan.
- `Dockerfile` dan `nginx.conf`: build image multi-stage dan static SPA serving.

### Routing dan Layout

- Semua screen non-publik saat ini dibungkus `ProtectedRoute` di `src/App.jsx`.
- Screen dashboard memakai `DashboardLayout` dan `Sidebar` sebagai shell responsif.
- Athlete dan coach diarahkan dari `/dashboard` ke portal masing-masing oleh `SmartDashboard`.
- Path, item sidebar, active-state logic, breadcrumb/back link, dan redirect harus diperbarui bersama bila route berubah.
- Jangan menganggap item yang disembunyikan dari sidebar berarti route tidak bisa diakses langsung.

### Server State dan Local UI State

Gunakan TanStack Query untuk server state pada domain yang sudah mempunyai hook query. Gunakan `useState`/state component untuk state UI sementara seperti modal terbuka, tab, draft input, dan filter lokal.

Jangan:

- menyalin server state ke local state tanpa alasan yang jelas;
- melakukan fetch duplikat di component bila hook domain aktif sudah menyediakan kontrak yang sama;
- memigrasikan semua Axios manual ke TanStack Query dalam bugfix sempit;
- membuat global context baru untuk state yang hanya dipakai satu page/modal.

Repository masih mencampur TanStack Query dengan Axios/state manual. Untuk perubahan sempit, ikuti pola domain yang disentuh. Refactor konsolidasi data layer harus menjadi scope terpisah.

## Kontrak API dan Axios

### Client Tunggal

Gunakan instance default export dari `src/api/axios.js` untuk API backend aplikasi. Jangan membuat instance Axios baru atau memanggil URL production secara tersebar tanpa kebutuhan eksplisit.

Pada implementasi saat ini:

- `baseURL` aktif adalah `https://api.satudata.konisumbar.or.id` dan masih hardcoded;
- header default adalah JSON;
- token dibaca dari `localStorage` pada setiap request;
- response `401` menghapus token dan memancarkan event `auth:unauthorized`;
- response protected `403` dengan `code: ROLE_ACCESS_DISABLED` menghapus token, menyimpan pesan one-shot di `sessionStorage`, dan memancarkan `auth:role-access-disabled`; response login dengan code yang sama ditangani inline oleh page login dan tidak memancarkan popup global;
- response `429` hanya dicatat ke console sebelum error diteruskan.

`VITE_API_URL` di `Dockerfile` belum dikonsumsi oleh kode aktif karena baris env pada Axios masih berupa komentar. Jangan mengklaim build argument tersebut mengubah target API. Perubahan strategi base URL adalah perubahan konfigurasi/runtime tersendiri dan harus divalidasi pada development serta deployment.

### Sebelum Mengubah Kontrak

Untuk perubahan endpoint, method, query, payload, atau response:

1. Cari semua caller di `src/`.
2. Baca hook dan consumer; perhatikan apakah consumer mengharapkan `response.data`, `response.data.data`, metadata pagination, atau array langsung.
3. Periksa route dan handler aktual pada `../golang-koni-sumbar`.
4. Pertahankan nama field, tipe, nullability, enum/status, pagination, dan vocabulary error kecuali perubahan itu diminta.
5. Periksa semua UI state yang bergantung pada status/error tersebut.
6. Jika backend ikut berubah, validasi kedua repository tanpa menyentuh perubahan lokal sibling yang tidak terkait.

Jangan menyimpulkan bentuk response hanya dari nama endpoint atau dokumentasi lama.

### Error Handling

- Tampilkan pesan yang dapat ditindaklanjuti pengguna, dengan fallback aman bila payload backend tidak sesuai harapan.
- Jangan menampilkan stack trace, token, payload sensitif, atau object error mentah di UI.
- Jangan menelan error mutation sehingga UI terlihat berhasil padahal request gagal.
- Bedakan loading awal, refetch, empty state, validation error, forbidden, not found, dan server/network error bila alur membutuhkan pembedaan tersebut.
- Logging browser harus terbatas; jangan log password, NIK/No. KK, token, foto blob, atau response sensitif.

## Autentikasi, JWT, dan Session

`AuthProvider` adalah pemilik state user aktif.

- Login dikirim ke `/api/login` sebagai `application/x-www-form-urlencoded`.
- JWT disimpan di `localStorage` dengan key `token`.
- Bootstrap session membaca token lalu memanggil `/api/user`.
- Login dan logout membersihkan seluruh QueryClient agar data user sebelumnya tidak bocor ke user berikutnya.
- Logout tetap menghapus token/cache dalam `finally`, termasuk saat request backend gagal.
- Event global `auth:unauthorized` menyinkronkan response interceptor dengan AuthContext.
- Event `auth:role-access-disabled` memicu satu dialog global, mengosongkan token/user/QueryClient, lalu membawa user ke login setelah konfirmasi. Listener harus terpasang sebelum bootstrap `/api/user` agar sesi yang sudah diblokir tidak kehilangan pesan.
- `ProtectedRoute` menunggu bootstrap auth, mengarahkan guest ke `/login`, dan memaksa `/reset-password` jika `must_reset_password` aktif.

Aturan perubahan auth:

- Jangan mengganti nama key, format bearer token, atau endpoint auth sepihak.
- Jangan menyimpan password, refresh payload, permission tambahan, atau data sensitif lain ke localStorage tanpa desain keamanan eksplisit.
- Pertahankan pembersihan cache ketika identity berubah.
- Hindari redirect loop antara login, dashboard, dan reset password.
- Uji refresh browser, token invalid/expired, login user kedua, logout gagal-network, dan forced password reset untuk perubahan auth.

## Permission UI Bukan Security Boundary

Frontend memakai `user.permissions`, wildcard `*`, helper `usePermission`, role checks tertentu, dan filter sidebar untuk menentukan visibilitas aksi/navigasi. Itu hanya kontrol presentasi dan pengalaman pengguna.

- `ProtectedRoute` saat ini tidak menerima atau memeriksa permission per route.
- Route dapat diakses langsung selama user authenticated dan tidak wajib reset password.
- Setiap read/write sensitif harus tetap ditolak oleh backend bila permission atau organization scope tidak sesuai.
- Jangan menghapus enforcement backend karena tombol sudah disembunyikan.
- Jangan menganggap role name setara permission kecuali backend dan alur aktif memang menetapkannya.
- Saat menambah aksi, gunakan permission string yang sama dengan backend dan tempatkan check sedekat mungkin dengan UI aksi.
- Tangani `403` dengan benar walaupun UI diperkirakan telah menyembunyikan aksi.
- Halaman `/master/roles` menampilkan `access_enabled`; hanya actor dengan `user.role.name === 'super_admin'` yang melihat toggle untuk role non-superadmin. Ini kontrol UI saja; endpoint backend tetap menjadi enforcement dan `super_admin` tidak boleh menjadi target.

Jika requirement meminta route-level authorization, implementasikan secara eksplisit dan tetap pertahankan enforcement backend; jangan menyamarkannya sebagai perubahan sidebar saja.

## TanStack Query, Query Key, dan Invalidation

`src/lib/queryClient.js` menetapkan default:

- `staleTime` lima menit;
- `retry` satu kali;
- `refetchOnWindowFocus: false`.

Aturan query:

1. Gunakan key factory domain yang sudah ada; jangan menulis array key ad hoc bila factory tersedia.
2. Sertakan semua filter/pagination yang memengaruhi hasil pada query key dengan nilai yang stabil dan serializable.
3. Gunakan `enabled` untuk query yang memerlukan ID/model, bukan request dengan identifier kosong.
4. Mutation harus menginvalidasi list, detail, report, dropdown, atau domain silang yang benar-benar berubah.
5. Jangan menginvalidasi seluruh cache untuk mutation biasa jika root key domain cukup.
6. Jangan mengandalkan invalidation prefix yang salah casing/ejaan; root key seperti `athletes`, `coachClusters`, dan `coachClusterMaster` berbeda.
7. Pertahankan `queryClient.clear()` pada pergantian identity.
8. Jika melakukan optimistic update, sediakan cancel, snapshot, rollback, dan final invalidation; jangan menambah optimistic behavior spekulatif.

Periksa domain silang. Contoh: perpindahan cluster dapat mengubah histori cluster, cluster aktif, daftar atlet/pelatih, dan report dana terkait.

## Form, Upload Multipart, dan Download

### Form

- Gunakan controlled input dan pola validasi yang sudah aktif pada modal/page terkait.
- Bedakan string kosong, `null`, boolean, angka, tanggal, dan ID; jangan mengirim nilai hanya berdasarkan truthiness.
- Pertahankan format tanggal yang diharapkan input HTML dan backend.
- Disable submit selama mutation berlangsung dan cegah submit ganda.
- Pertahankan data draft saat validation error bila aman; jangan menutup modal seolah berhasil.
- Berikan label, state disabled, dan pesan error yang dapat diakses.

### Multipart dan File

Repository memakai `FormData` untuk foto/logo, import spreadsheet, cluster document, Monev photo, event, venue, serta training photo.

- Cocokkan nama field dan method dengan backend aktual.
- Jangan `JSON.stringify` seluruh `FormData`.
- Jangan mengubah header default Axios global menjadi multipart.
- Ikuti pola endpoint yang ada untuk header multipart dan verifikasi boundary/request aktual bila pola diubah.
- Validasi type/size di UI untuk feedback cepat, tetapi backend tetap wajib memvalidasi ulang.
- Jangan menaruh file/blob besar ke localStorage atau Query cache tanpa kebutuhan.
- Untuk download, gunakan `responseType: 'blob'`, nama file yang aman, lalu revoke object URL setelah selesai.

## Protected Image, Object URL, dan Effect Cleanup

Asset di `/api/storage/...` dapat memerlukan bearer token dan tidak selalu dapat ditampilkan langsung oleh `<img src>` biasa. Gunakan `ProtectedImage` atau pola Axios blob yang setara untuk protected media.

Setiap effect/resource asynchronous harus mempunyai lifecycle yang jelas:

- hapus event listener yang ditambahkan;
- `clearTimeout`/`clearInterval` pada cleanup;
- abort request yang dapat berlanjut setelah input/component berubah bila relevan;
- cegah state update setelah unmount;
- revoke setiap URL dari `URL.createObjectURL`, termasuk preview yang diganti sebelum submit;
- jangan memasukkan object URL stale ke state/cache persisten.

Saat mengubah code yang ada, audit closure cleanup dan dependency array; jangan hanya menambah suppress lint.

## Konvensi Komponen dan UI

### Komponen

- Gunakan function component dan named export sesuai pola directory, kecuali file aktif memakai default export.
- Pecah component bila ada boundary tanggung jawab nyata atau reuse aktual, bukan untuk abstraksi spekulatif.
- Letakkan component domain dekat domainnya (`athletes`, `training`, cluster, dan sebagainya).
- Pertahankan barrel `index.js` bila directory domain sudah menggunakannya.
- Props harus jelas; hindari object "options" besar yang menyembunyikan kontrak.
- Jangan menambahkan library UI/state/form baru tanpa kebutuhan dan persetujuan scope.

### Styling dan Responsiveness

- Gunakan utility Tailwind CSS v4 melalui `@tailwindcss/vite` dan `@import "tailwindcss"` yang sudah aktif.
- Pertahankan visual language yang ada: slate/red palette, rounded panel/modal, responsive breakpoint, dan `DashboardLayout`.
- Verifikasi minimal mobile, tablet, dan desktop untuk page/layout yang disentuh.
- Tabel lebar harus mempunyai strategi overflow atau representasi mobile.
- Modal harus tetap dapat discroll pada viewport pendek dan action utama tetap dapat dijangkau.
- Jangan menambah CSS global bila utility/local class cukup.
- Framer Motion dipakai untuk animasi tertentu; jangan mewajibkan animasi pada setiap component.

### Loading, Empty, dan Error State

Setiap data surface yang diubah harus mempertimbangkan:

- loading awal yang tidak menampilkan data palsu;
- loading mutation/refetch yang tidak menyebabkan aksi ganda;
- empty state yang berbeda dari error;
- error state dengan retry/back action bila masuk akal;
- disabled/read-only state berdasarkan permission dan proses;
- fallback media bila protected asset gagal.

Jangan menyelesaikan alur hanya untuk happy path.

### Route dan Sidebar

Jika menambah/mengubah route:

1. edit `src/App.jsx`;
2. putuskan public atau protected;
3. sinkronkan `Sidebar.jsx` bila harus dapat dinavigasi;
4. tentukan permission/role visibility;
5. verifikasi direct URL, refresh, back/forward, wildcard redirect, dan mobile sidebar;
6. pastikan Nginx SPA fallback tetap kompatibel;
7. jangan menganggap hidden sidebar sebagai route guard.

## Deployment dan Version Checker

Build production menghasilkan static asset di `dist/`. Docker memakai build stage Node 20 Alpine dan production stage Nginx stable Alpine. `nginx.conf`:

- melakukan SPA fallback ke `index.html`;
- memberi cache satu tahun/immutable pada static asset;
- menonaktifkan cache `index.html`;
- menyediakan `/health` yang mengembalikan `OK`.

`VersionChecker` hanya berjalan ketika `import.meta.env.DEV` false. Ia memeriksa `index.html` dengan cache-busting setiap 30 detik dan menampilkan banner refresh bila referensi asset berubah.

Jangan:

- mengubah caching `index.html` tanpa mempertimbangkan update checker;
- mengklaim Docker tervalidasi bila tool tidak tersedia;
- mengklaim `VITE_API_URL` aktif sebelum Axios benar-benar membacanya;
- menambahkan service worker/caching layer tanpa desain invalidation dan rollback yang jelas.

## Perlindungan Perubahan Lokal dan Scope

- Edit hanya file yang diperlukan.
- Jangan menjalankan formatter repository-wide atau normalisasi line ending.
- Jangan mengubah dependency, lockfile, route, API, styling global, atau deployment config sebagai efek samping.
- Jangan memperbaiki seluruh baseline lint dalam pekerjaan sempit.
- Jangan menghapus code/comment yang tampak usang sebelum membuktikan tidak dipakai.
- Jangan mengubah sibling backend atau frontend lain secara diam-diam.
- Jangan melakukan `git reset --hard`, `git clean`, restore, rebase, force push, atau operasi destruktif lain tanpa permintaan eksplisit.

## Larangan Anti-AI-Slop

Jangan:

- melakukan rewrite page besar untuk bug kecil;
- membuat design system, data layer, route guard framework, generic modal/form builder, atau wrapper Axios baru untuk satu pemakaian;
- menambah dependency hanya untuk helper yang dapat ditulis kecil dan lokal;
- meninggalkan TODO, mock production, placeholder, dead code, atau console log sensitif;
- mengganti semua direct Axios dengan TanStack Query dalam scope tidak terkait;
- mengubah response envelope, permission string, role name, query key root, atau route secara sepihak;
- mengklaim test, Docker, runtime API, atau browser flow berhasil bila tidak dijalankan;
- menyamarkan masalah baseline sebagai regresi baru atau sebaliknya.

Pilih perubahan terkecil yang lengkap, konsisten dengan pola aktif, dan dapat diverifikasi.

## Validation Matrix

| Jenis perubahan | Validasi minimum |
| --- | --- |
| Dokumentasi saja | Review heading/fence/link, `git diff --check`, pastikan hanya file scope yang berubah |
| Component/UI lokal | `npx eslint <file...>`, `npm run build`, inspeksi loading/error/empty/disabled, cek responsive pada viewport relevan |
| Form atau modal | Validasi component, submit sukses/gagal, double-submit, mapping payload, reset/reopen state, mobile/viewport pendek |
| API query/read | Validasi path/query/response dengan backend, query key lengkap, loading/error/empty, targeted ESLint, build |
| API mutation | Semua validasi API read plus invalidation list/detail/report/dropdown dan error/rollback UI |
| Auth/session | Login, refresh, invalid token/401, logout, user switch/cache clear, forced reset password, build |
| Permission/role | UI allow/deny, direct-route behavior, backend `403`/scope enforcement, wildcard `*`, build |
| Upload/download/protected media | Multipart field/method, size/type feedback, progress/loading, blob/object URL cleanup, auth header, failure path, build |
| Routing/sidebar | Direct URL, refresh, redirect, back/forward, active nav, mobile sidebar, Nginx SPA fallback bila tersedia, build |
| Cache/query refactor | Key uniqueness, enabled condition, invalidation domain silang, auth clear, stale data setelah mutation, build |
| Deployment/config | `npm run build`; Docker/Nginx smoke test hanya bila Docker tersedia; verifikasi base URL hasil build, cache header, `/health` |
| Dependency/config tooling | Review `package.json` dan lockfile diff, install dari lockfile, lint/build, jelaskan alasan dependency |

Tidak ada automated test suite pada snapshot. Karena itu lint/build bukan pengganti browser verification atau validasi kontrak backend. Jika browser/runtime tidak dijalankan, laporkan batas tersebut.

Baseline full lint saat dokumentasi dibuat memang gagal. Gunakan targeted ESLint untuk file yang disentuh dan bandingkan full lint terhadap baseline di [`MEMORY.md`](./MEMORY.md#baseline-validasi). Jangan menyatakan pekerjaan gagal hanya karena issue lama, tetapi jangan menambah error/warning baru.

## Completion Checklist

Sebelum menyatakan selesai:

- [ ] Branch, commit, status, dan diff awal/akhir telah diperiksa.
- [ ] Perubahan lokal pengguna tetap utuh.
- [ ] Scope hanya mencakup file yang diperlukan; dependency dan lockfile tidak berubah tanpa permintaan.
- [ ] Route, API caller, hook/query, consumer UI, dan backend sibling telah diperiksa bila relevan.
- [ ] Method, path, query, payload, response envelope, pagination, dan error mapping tetap kompatibel.
- [ ] JWT/localStorage, event `auth:unauthorized`, redirect, dan cache antar-user tetap aman.
- [ ] Permission UI tidak dianggap sebagai enforcement; backend tetap fail-closed.
- [ ] Query key dan invalidation mencakup list/detail/report/dropdown/domain silang yang berubah.
- [ ] Form menangani loading, validation error, submit ganda, dan state reset dengan benar.
- [ ] Multipart, download, protected media, object URL, timer, listener, dan request mempunyai cleanup yang sesuai.
- [ ] Loading, empty, error, disabled, dan responsive state telah ditinjau.
- [ ] Route dan sidebar sinkron; direct URL dan refresh dipertimbangkan.
- [ ] Tidak ada refactor besar, abstraksi spekulatif, TODO, secret, atau console log sensitif.
- [ ] Validasi matrix yang relevan dijalankan dan hasilnya dilaporkan apa adanya.
- [ ] `git diff --check` bersih dan final `git status --short --branch` ditinjau.
