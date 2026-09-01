# MEMORY.md

## Fungsi Dokumen

Dokumen ini adalah basis pengetahuan terkurasi untuk repository `koni-sumbar-frontend`. Isinya merupakan snapshot fakta yang diverifikasi dari source dan command lokal, bukan log percakapan, bukan spesifikasi masa depan, dan bukan pengganti inspeksi kode terbaru.

- Kebijakan kerja wajib: [`AGENTS.md`](./AGENTS.md)
- Command dan prosedur operasional: [`TOOLS.md`](./TOOLS.md)

Jika branch, commit, dependency, backend sibling, atau source berubah, verifikasi ulang fakta yang relevan sebelum mengandalkan snapshot ini.

## Snapshot Repository

Snapshot diverifikasi ulang pada **2026-08-24** di Windows, timezone `Asia/Jakarta`.

| Item | Nilai pada snapshot |
| --- | --- |
| Repository | `koni-sumbar-frontend` |
| Package | `frontend@0.0.0`, private, ESM |
| Branch | `coach-cluster`, tracking `origin/coach-cluster` |
| Commit | `304701f4e041d1ed3d6ae3152e714dae9c55abd8` (`304701f`) |
| Commit subject | `update accountemailrecovery.jsx` |
| Waktu commit | `2026-08-24T06:51:41+07:00` |
| Working tree awal task access hardening | Bersih |
| Git line ending | `core.autocrlf=true` |
| Backend sibling saat diperiksa | `../golang-koni-sumbar`, branch `refactor`, commit `b06682b01b133e0d8dd8269beb7e09e44514bd40` |

Snapshot branch/commit bukan fakta permanen. Selalu mulai sesi baru dengan status, branch, dan commit terbaru.

## Toolchain dan Stack

### Toolchain Lokal

- Windows PowerShell `5.1.26100.8655`.
- Git `2.55.0.windows.2`.
- Node.js `v24.18.0`.
- npm dan npx `11.16.0`.

### Dependency Utama yang Terpasang

Versi berikut berasal dari `npm ls --depth=0` pada snapshot lockfile/node_modules aktif:

- React `19.2.3` dan React DOM `19.2.3`.
- React Router DOM `7.12.0`.
- Vite `7.3.1` dengan `@vitejs/plugin-react` `5.1.2`.
- Tailwind CSS `4.1.18` dan `@tailwindcss/vite` `4.1.18`.
- TanStack React Query `5.90.16`.
- Axios `1.13.2`.
- Framer Motion `12.25.0`.
- Lucide React `0.562.0`.
- Leaflet `1.9.4` dan React Leaflet `5.0.0`.
- React Markdown `10.1.0`, Remark GFM `4.0.1`.
- ESLint `9.39.2` dengan plugin React Hooks dan React Refresh.

`package.json` memakai range caret untuk dependency. `package-lock.json` adalah sumber instalasi reproducible dan harus dipertahankan kecuali perubahan dependency memang diminta.

## Entrypoint dan Wiring Aktif

Entrypoint browser adalah [`src/main.jsx`](./src/main.jsx). Urutan provider aktif:

1. `StrictMode`;
2. `QueryClientProvider` memakai singleton `queryClient`;
3. `BrowserRouter`;
4. `AuthProvider`;
5. `App`.

`src/App.jsx` memasang `VersionChecker` di luar `Routes`, lalu mendaftarkan seluruh route publik dan protected. Tidak ada lazy route atau code splitting route pada snapshot; seluruh page di-import statis ke bundle utama.

Vite config hanya mengaktifkan:

- `@vitejs/plugin-react`;
- `@tailwindcss/vite`.

Source memakai JavaScript/JSX, bukan TypeScript. Tailwind masuk melalui `@import "tailwindcss"` di `src/index.css`.

## Struktur Source

Pada snapshot setelah fitur role access terdapat 126 file di bawah `src/`: 36 `.js`, 87 `.jsx`, satu `.css`, dan dua asset gambar/SVG.

- `src/main.jsx`: bootstrap React dan provider global.
- `src/App.jsx`: route aktif dan `SmartDashboard`.
- `src/api/axios.js`: API client global/interceptor.
- `src/contexts/AuthContext.jsx`: state session user, cleanup cache, listener auth global, dan dialog role access disabled.
- `src/contexts/auth-context.js`: object `AuthContext` terpisah agar file provider tetap kompatibel dengan Fast Refresh.
- `src/hooks/useAuth.js`: consumer AuthContext.
- `src/hooks/usePermission.js`: helper permission presentasional.
- `src/hooks/useMonev.js`: fetching/state Monev manual.
- `src/hooks/queries/`: 19 file hook domain plus barrel `index.js`.
- `src/lib/queryClient.js`: default TanStack Query.
- `src/pages/`: page utama, portal, auth, event, training, Monev, form builder, log, AI, dan settings.
- `src/pages/master/`: user, role, cabor, federasi, cluster, pendidikan, kelas pertandingan, wilayah, organisasi, dan venue.
- `src/components/`: layout, sidebar, route guard, protected image, modal, print, dan component domain.
- `src/components/athletes/`: filter, tabel/row, delete, export, dan utility atlet.
- `src/components/athlete-clusters/` dan `coach-clusters/`: histori, perpindahan cluster, dan dana pembinaan.
- `src/components/coach-athletes/`: assignment pelatih-atlet.
- `src/components/training/`: schedule, session, attendance, photo, report, dan print.
- `src/assets/`: logo KONI dan asset template React yang belum dihapus.

Banyak page/component berukuran besar dan menyimpan state/form logic langsung. Refactor pemecahan component harus dilakukan bertahap dan hanya bila termasuk scope.

## Route Family Aktif

Semua route berikut berasal dari `src/App.jsx` pada snapshot.

### Publik

- `/login`
- `/forgot-password`
- `/reset-password/:token`

### Protected Umum dan Portal

- `/reset-password`
- `/settings`
- `/dashboard`
- `/portal/atlet`
- `/portal/pelatih`

`SmartDashboard` mengarahkan role `athlete` ke `/portal/atlet` dan role `coach` ke `/portal/pelatih`. Role lain melihat dashboard reguler.

### Pembinaan dan Training

- `/atlet`
- `/pelatih`
- `/coach-athletes`
- `/training`
- `/training/report`
- `/training/:id`

### Monitoring dan Evaluasi

- `/monev`
- `/monev/events`
- `/monev/events/create`
- `/monev/events/:id`
- `/monev/events/:id/edit`
- `/monev/submit/:eventId`
- `/monev/submissions/:id`
- `/monev/submissions/:id/edit`

### Event dan Form Builder

- `/event`
- `/event/:id`
- `/form-builder`
- `/form-builder/create`
- `/form-builder/:id/edit`
- `/form-builder/:id/fill`
- `/form-builder/:id/submissions`

### Master Data

- `/master/users`
- `/master/roles`
- `/master/cabors`
- `/master/federations`
- `/master/athlete-clusters`
- `/master/coach-clusters`
- `/master/education-levels`
- `/master/competition-classes`
- `/master/regions`
- `/master/organizations`
- `/master/venues`

### Sistem dan Fallback

- `/activity-logs`
- `/ai-analytics`
- `/` diarahkan ke `/dashboard`.
- `*` diarahkan ke `/dashboard`.

Seluruh route selain tiga route publik dibungkus `ProtectedRoute`. Route `/atlet` mempunyai lapisan tambahan `PermissionRoute permission="athletes.view"`; user tanpa permission melihat halaman **Akses Ditolak** dan `AthletesPage` beserta query atlet/master tidak dimount. Route lain belum otomatis mempunyai permission guard per route.

Pada halaman Data Role, field backend `access_enabled` yang belum ada diperlakukan aktif untuk rollout kompatibel. Badge menampilkan `Aktif`, `Dinonaktifkan`, atau `Selalu Aktif`; hanya superadmin melihat toggle role non-superadmin. Mutation memakai `PUT /api/master/roles/{id}/access` dan meng-invalidasi seluruh `roleKeys.all`.

## Sidebar dan Permission Flow

`src/components/Sidebar.jsx` membentuk navigasi dinamis dari user aktif.

- Wildcard permission `*` dianggap mempunyai semua permission.
- Super admin dikenali melalui wildcard atau role name `super_admin`.
- Athlete dan coach memperoleh link dashboard portal masing-masing.
- Item pembinaan, kegiatan, master data, dan settings difilter berdasarkan permission string.
- Activity Log dan AI Analytics hanya ditampilkan untuk super admin.
- Submenu aktif dibuka berdasarkan exact pathname dan dapat ditutup manual.

Permission yang dipakai UI mencakup antara lain:

- `athletes.view`, `athletes.sensitive.read`, `coaches.view`, `coaches.sensitive.read`, `coaching.view`;
- `training.view`, `training.report`;
- `events.view`, `monev.view`, `monev.manage`, `forms.view`;
- `users.view`, `roles.view`, `roles.permissions`, `cabors.view`;
- `athlete_cluster_master.view`, `coach_cluster_master.view`;
- `regions.view`, `organizations.view`, `education_levels.view`, `competition_classes.view`, `venues.view`;
- `settings.view`;
- permission cluster/dana yang diperiksa component detail seperti `athlete_clusters.manage`, `development_funds.view`, `coach_clusters.manage`, dan `coach_development_funds.manage`.

`usePermission` menyediakan `can`, `canAny`, dan `canAll`. Beberapa page juga memakai role name langsung, misalnya `admin_monev`, `athlete`, dan `coach`.

Pada halaman atlet, list dan detail data olahraga tetap memakai `athletes.view`, sedangkan ekspor PII, hint pencarian NIK, cetak profil penuh, field sensitif detail, serta form create/edit/import penuh juga memerlukan `athletes.sensitive.read` di samping permission aksi dasarnya. Hapus tetap memakai `athletes.delete`, dan print daftar non-PII tetap tersedia. Halaman pelatih menerapkan pola yang sama dengan `coaches.sensitive.read`, termasuk penyembunyian NIK/telepon tabel, nomor lisensi, dokumen, kontak, dan cetak profil. Wildcard `*` tetap diterima.

Query `/api/master/roles/all` pada halaman User hanya aktif bila user memiliki `roles.view`; query katalog `/api/master/permissions` dan editor permission pada halaman Role hanya aktif bila user memiliki `roles.permissions`. Delapan role organisasi Pengprov, Pengkot, Komcab, dan Porprov mewajibkan pilihan organisasi pada form User.

**Fakta keamanan penting:** permission frontend hanya mengatur visibilitas dan interaksi UI. Backend sibling tetap harus menegakkan permission, role, dan organization scope. `ProtectedRoute` memeriksa auth dan `must_reset_password`; `PermissionRoute` baru dipakai pada `/atlet` untuk read permission.

## Auth Flow Aktual

### Login dan Bootstrap

1. Login page mengambil target kembali dari `location.state.from` lengkap dengan pathname, search, dan hash; default `/dashboard`.
2. `AuthContext.login` membersihkan seluruh QueryClient tepat sebelum setiap request `POST /api/login`, termasuk percobaan yang akhirnya gagal; token dan browser storage tidak dihapus pada tahap ini.
3. Request login mengirim `URLSearchParams` dengan content type form-urlencoded.
4. Response diharapkan berisi `token` dan `user`; token tetap disimpan sebagai `localStorage['token']`.
5. Login sukses membersihkan session-expired notice, account-block state, permission notice, dan access-unavailable state; kemudian menyimpan token dan user sebelum berpindah ke URL protected sebelumnya.
6. Saat aplikasi mount/refresh, `fetchUser` memeriksa token lalu memanggil `/api/user`.
7. Bootstrap `/api/user` yang gagal karena network/5xx/`ACCESS_SERVICE_UNAVAILABLE` mempertahankan token dan menampilkan layar **Layanan Akses Tidak Tersedia** dengan tindakan **Coba Lagi** dan **Keluar**.
8. `AUTH_REQUIRED`/`AUTH_SESSION_INVALID` pada protected request membersihkan user/token/cache dan menyimpan session-expired notice satu kali di session storage.
9. `ROLE_ACCESS_DISABLED` dan `ORGANIZATION_ASSIGNMENT_REQUIRED` membersihkan sesi dan membuka account-blocking dialog global yang tidak dapat ditutup lewat backdrop/Escape.
10. `INSUFFICIENT_PERMISSION` tidak logout; event global menampilkan notice, me-refresh `/api/user` secara terdeduplikasi, lalu membersihkan cache setelah permission terbaru diterima.
11. Login membedakan credential salah, role disabled, organization assignment required, service unavailable/network, validation, dan rate limit tanpa mengungkap keberadaan email.

### Axios Interceptor

Request interceptor menambahkan `Authorization: Bearer <token>` hanya pada endpoint protected. Daftar public endpoint mencakup login, forgot/reset password, dan account-email-recovery.

Response interceptor mengklasifikasikan code akses bersama. Protected `401` hanya memanipulasi auth bila request semula membawa token yang masih sama dengan token aktif; ini mendeduplikasi request paralel dan mencegah respons terlambat dari sesi lama menghapus login baru. Account-blocking code memakai aturan token yang sama. Permission deny hanya memicu permission-refresh event, sedangkan `503`, network failure, 5xx, dan `429` tidak menghapus sesi.

### Logout dan Password Reset

- Logout memanggil `/api/logout`, lalu dalam `finally` menghapus token, user, dan seluruh query cache.
- Forgot password memanggil `/api/forgot-password`.
- Public reset memakai token route dan `/api/reset-password/confirm`, lalu mengarahkan ke login.
- Forced reset memakai `/api/reset-password`, memanggil ulang `fetchUser`, lalu menuju dashboard.
- `ProtectedRoute` memaksa user dengan `must_reset_password` ke `/reset-password`.

Ada method `register` di AuthContext yang memanggil `/api/register`, tetapi `src/App.jsx` tidak mendaftarkan page/route register pada snapshot.

## Query Cache dan Data Fetching

Query client global menetapkan:

- `staleTime: 5 * 60 * 1000`;
- `retry: 1`;
- `refetchOnWindowFocus: false`.

Root query key yang terverifikasi:

- `activityLogs`, `errorLogs`, `userActivity`;
- `athletes`, `athleteClusters`, `athleteClusterMaster`;
- `coaches`, `coachClusters`, `coachClusterMaster`, `coach-athletes`;
- `cabors`, `federations`, `educationLevels`, `competitionClasses`;
- `roles`, `permissions`, `users`;
- `regions`, `organizations`, `venues`;
- `events`, `training`, `portal`;
- `formBuilder` dan `formTemplates`.

Factory key menambahkan list/detail/filter/dropdown/report/session/schedule sesuai domain. Mutation umumnya menginvalidasi root domain atau key detail terkait. Mutation cluster juga menginvalidasi daftar atlet/pelatih yang terpengaruh.

Data layer belum seragam:

- banyak master data, atlet/pelatih, event, training, portal, log, cluster, dan form memakai TanStack Query;
- `useMonev.js` memakai `useState`/`useEffect` serta Axios manual;
- sejumlah page/modal tetap memanggil Axios langsung untuk detail, dropdown, dashboard stats, import/export, phone check, wilayah, settings, form fill, dan portal/profile lookup tertentu.

Ini adalah baseline aktual, bukan pola ideal yang sudah selesai dikonsolidasikan.

## API Base URL Aktif

`src/api/axios.js` saat ini mempunyai:

```js
baseURL: "https://api.satudata.konisumbar.or.id"
```

Alternatif Easypanel dan `import.meta.env.VITE_API_URL || 'http://localhost:8080'` hanya berada dalam komentar.

`Dockerfile` mendefinisikan:

```dockerfile
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
```

Namun build argument tersebut **belum memengaruhi Axios aktif**. Menjalankan Docker build dengan `--build-arg VITE_API_URL=...` tidak cukup untuk mengganti target API selama source Axios tidak membaca env tersebut.

## API Endpoint Families yang Dikonsumsi

Daftar ini merangkum caller frontend; periksa file caller dan backend untuk detail method/payload/response.

| Family | Contoh endpoint aktif |
| --- | --- |
| Auth/session | `/api/login`, `/api/user`, `/api/logout`, `/api/forgot-password`, `/api/reset-password`, `/api/reset-password/confirm` |
| Settings | `/api/settings/me`, `/api/settings/me/password` |
| Dashboard | `/api/dashboard/stats` |
| User/role/permission | `/api/master/users`, `/api/master/roles`, `/api/master/roles/all`, `/api/master/permissions`, role permissions |
| Cabor/federasi | `/api/master/cabors`, `/api/cabors/all`, `/api/master/federations`, `/api/federations/all` |
| Cluster master | athlete/coach cluster dan sub-cluster di `/api/master/...` |
| Atlet | `/api/athletes`, detail, import/template, export, cluster, development funds |
| Pelatih | `/api/coaches`, detail, import/template, cluster, coach development funds |
| Pelatih-atlet | `/api/coach-athletes` dan detail assignment |
| Event | `/api/events`, athlete registration/status, available athletes |
| Training | `/api/training/sessions`, attendance, check-in, complete, photo, report, schedules, generate sessions |
| Monev | `/api/monev/events`, my-events, submissions, assignable-users, upload-photo |
| Form builder baru | `/api/form-builder/models`, templates, submissions, reference/records |
| Form template lama | `/api/form-templates`, available-models, model-fields, submissions |
| Portal | `/api/portal/profile`, clusters/funds, events, submissions, dashboard, athletes |
| Activity/error log | `/api/activity-logs`, stats/users/detail/cleanup/export; `/api/error-logs`, resolve; user activity stats |
| Master lain | education levels, competition classes, regions, organizations, venues |
| Proxy/helper | `/api/wilayah/...`, `/api/check-phone` |
| Protected storage | `/api/storage/...` |
| AI | `/api/ai/chat` |

Backend sibling juga mempunyai family Porprov, tetapi repository frontend ini tidak ditemukan memanggil `/api/porprov/...` pada snapshot.

## Domain UI Utama

- **Atlet:** infinite/page list, filter, form multipart, detail, print/export/import, cluster history, dan dana pembinaan. Route/read/action mengikuti matrix `athletes.view/create/edit/delete`. Validasi email membedakan format lokal, available/duplicate, backend 422, permission, 503, network, dan global auth flow; error retryable menyediakan tombol **Coba Lagi** dengan abort dan request-ID race protection.
- **Pelatih:** list/filter, form multipart, detail, import, cluster, dana pembinaan, dan relasi atlet.
- **Master data:** user/role/permission, cabor/federasi, cluster/sub-cluster, pendidikan, kelas pertandingan, wilayah, organisasi, venue.
- **Event:** CRUD event dan registrasi/status atlet dalam event.
- **Training:** jadwal, generate session, session detail, attendance, check-in/complete, photo, report, dan print.
- **Monev:** event Monev, assignment, submission monitoring, photo, role `admin_monev`, dan detail/edit.
- **Form builder:** model/field metadata, template, fill/reference record, submission, dan grading-related UI.
- **Portal:** profile atlet/pelatih, cluster/fund, event, submission, dashboard, serta atlet binaan pelatih.
- **Operasional sistem:** activity/error logs, settings, AI analytics, version checker.

## Multipart, Protected Media, dan Blob

`FormData` dipakai pada athlete/coach form, cabor/event/venue, cluster movement document, training photo, Monev photo, dan import spreadsheet.

Protected media diambil melalui Axios dengan `responseType: 'blob'` agar bearer token ikut terkirim. `ProtectedImage` membuat object URL dan menampilkan fallback/loading. Download export/template/log juga membuat object URL sementara dan melakukan revoke.

Source mempunyai beberapa preview object URL, timer debounce, `AbortController`, event listener, dan interval version checker. Perubahan pada area tersebut harus memeriksa cleanup; keberadaan cleanup di sebagian component tidak membuktikan semua lifecycle sudah bebas leak.

## Docker, Nginx, dan Runtime Static

`Dockerfile` mempunyai dua stage:

1. `node:20-alpine` menjalankan `npm ci` dan `npm run build` dengan memory limit 4096 MB;
2. `nginx:stable-alpine` menyajikan isi `dist` pada port 80.

`nginx.conf`:

- root `/usr/share/nginx/html`;
- SPA fallback `try_files $uri $uri/ /index.html`;
- gzip untuk text/CSS/JS/XML/JSON;
- security header dasar;
- static asset cache satu tahun dengan `public, immutable`;
- `index.html` no-store/no-cache;
- `/health` mengembalikan `OK`.

Docker tidak tersedia pada mesin snapshot, sehingga image build, container startup, header runtime, dan health endpoint belum divalidasi lokal dalam pekerjaan dokumentasi ini.

## Version Checker

`VersionChecker`:

- dilewati pada mode Vite development (`import.meta.env.DEV`);
- fetch `/?_v=<timestamp>` dengan `cache: 'no-store'`;
- mengambil baseline saat mount;
- polling setiap 30 detik;
- menampilkan banner jika hash yang dihitung berubah;
- dapat di-dismiss atau melakukan full reload;
- membersihkan interval pada effect cleanup.

Implementasi mencoba mengekstrak referensi asset dengan regex tertentu. Jika tidak cocok, hash fallback hanya memakai panjang HTML. Karena nama asset Vite dapat berubah format, efektivitas deteksi perlu diuji bila logic version checker disentuh.

## Test dan Automation

Pada snapshot:

- tidak ada script `test` di `package.json`;
- tidak ditemukan file `*.test.*` atau `*.spec.*` di source repository;
- tidak ditemukan konfigurasi Vitest, Jest, Playwright, atau Cypress;
- tidak ditemukan workflow CI di `.github/workflows`.

Karena itu repository **belum mempunyai automated test suite**. Jangan mengklaim test coverage atau regression suite yang belum ada. Validasi aktif mengandalkan targeted ESLint, full lint baseline, production build, review kontrak, dan browser/runtime check manual bila tersedia.

## Baseline Validasi

Baseline diverifikasi ulang pada **2026-08-24** setelah access hardening.

### Build

`npm run build` berhasil dengan Vite `7.3.1`: 2.672 module transformed, bundle JS utama `1,679.05 kB` minified/`422.71 kB` gzip. Warning non-blocking chunk >500 kB tetap ada; build ini tidak membuktikan browser/runtime flow.

### Lint

Targeted ESLint untuk seluruh file JS/JSX yang disentuh berhasil tanpa output. Full `npm run lint` tetap nonzero dengan:

```text
104 problems (90 errors, 14 warnings)
```

Seluruh issue full lint yang dilaporkan berada pada file lama di luar scope perubahan access hardening. Baseline mencakup unused variable/import, React Hooks dependency, `set-state-in-effect`, dan rule lain; jangan klaim full lint lulus dan jangan melakukan cleanup repository-wide dalam pekerjaan sempit.

Pada **2026-08-25**, targeted ESLint untuk `App.jsx`, `PortalRoute.jsx`, `mediaUtils.js`, `usePortal.js`, `ActivityLogs.jsx`, `AthletePortal.jsx`, dan `CoachPortal.jsx` berhasil tanpa output. `npm run build` juga berhasil dengan warning chunk yang sama. Source sekarang membatasi direct route portal berdasarkan role, menunda query turunan sampai `profile.type` sesuai, menampilkan state provisioning untuk profile yang belum terhubung, menggunakan `event_key`, dan membedakan kejadian Error Log dari pola unik. Browser/runtime API belum dijalankan dari workspace ini.

Pada **2026-08-25**, targeted ESLint untuk gating katalog dan UI sensitif atlet/pelatih berhasil tanpa output. `npm run build` juga berhasil: 2.672 module transformed, bundle JS utama `1,681.14 kB` minified/`423.24 kB` gzip, dengan warning chunk >500 kB yang tetap non-blocking. Browser flow dan runtime API tidak dijalankan dari workspace ini.

## Watchlist: Jangan Ikuti Asumsi Usang

1. **README masih template Vite generik.** Ia tidak menjelaskan domain KONI, route, auth, API, Docker, atau baseline repository aktual.
2. **API URL production hardcoded.** `VITE_API_URL` ada di Dockerfile tetapi belum dibaca Axios aktif.
3. **Route permission belum menyeluruh.** `/atlet` sekarang memakai `PermissionRoute athletes.view`, tetapi route lain masih bergantung pada kombinasi sidebar/action gating dan enforcement backend.
4. **Permission UI bukan boundary keamanan.** Sidebar/tombol yang tersembunyi tidak mencegah direct URL atau request manual. Backend harus tetap enforce.
5. **Data fetching belum konsisten.** TanStack Query hidup berdampingan dengan Axios/state manual, terutama Monev, form/detail/dropdown/import/export, dan beberapa page besar.
6. **Tidak ada automated test suite.** Build/lint tidak membuktikan seluruh browser flow, auth, upload, atau cache behavior.
7. **Full lint sudah merah.** Hasil terbaru tetap nonzero dan harus dipisahkan dari regresi baru; gunakan angka validasi bertanggal pada bagian baseline.
8. **Bundle utama besar.** Build hijau tetapi menghasilkan warning chunk >500 kB; jangan menyatakan optimasi code splitting sudah aktif.
9. **Version detection perlu dibuktikan.** Regex asset pada `VersionChecker` dapat jatuh ke fallback panjang HTML.
10. **Route dan sidebar adalah dua sumber yang harus sinkron.** Route yang ada di `App.jsx` tidak otomatis muncul/terguard di sidebar.
11. **Register tidak diroute.** AuthContext mempunyai method register, tetapi tidak ada route/page register aktif.
12. **Form builder mempunyai dua family API.** Hook/source masih memuat `/api/form-builder` dan `/api/form-templates`; jangan menggabungkan atau menghapus family tanpa audit consumer/backend.
13. **Docker belum tervalidasi lokal.** Docker tidak tersedia pada snapshot.
14. **Line ending dapat berubah otomatis.** `core.autocrlf=true`; hindari normalisasi repository-wide.
15. **Asset template masih ada.** `src/assets/react.svg` dan README template bukan bukti fitur React demo masih diroute.

## Aturan Pemeliharaan MEMORY

Perbarui bagian snapshot/fakta volatil setelah perubahan yang menyentuh:

- provider/entrypoint/router;
- auth, token storage, permission, atau route guard;
- API base URL/interceptor dan environment variable;
- query client, query key root, atau strategi invalidation;
- route family, sidebar, atau domain page;
- endpoint/payload/response family penting;
- dependency/toolchain/script npm;
- Docker/Nginx/version checker;
- test suite/CI;
- baseline build/lint.

Aturan umum:

- simpan hanya fakta yang stabil, terverifikasi, dan mencegah kesalahan berulang;
- beri tanggal pada fakta yang bergantung waktu;
- jangan menyimpan secret, token, password, data pribadi, dump, atau payload sensitif;
- jangan menjadikan MEMORY sebagai changelog percakapan;
- hapus atau koreksi fakta usang setelah source berubah;
- untuk keputusan kerja, tetap ikuti [`AGENTS.md`](./AGENTS.md) dan inspeksi source aktif.
