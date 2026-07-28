# TOOLS.md

## Fungsi Dokumen

Dokumen ini adalah referensi operasional untuk bekerja pada `koni-sumbar-frontend` di environment Windows/PowerShell yang diverifikasi pada 2026-07-28.

- Aturan kerja dan invariant: [`AGENTS.md`](./AGENTS.md)
- Fakta repository dan baseline: [`MEMORY.md`](./MEMORY.md)

Command di bawah sengaja menghindari operasi destruktif. Baca target command sebelum menjalankannya dan jangan memakai network, filesystem di luar workspace, atau service eksternal tanpa kebutuhan dan izin.

## Kapabilitas Lokal

### Tersedia pada Snapshot

| Tool | Versi/path snapshot | Kegunaan |
| --- | --- | --- |
| PowerShell | `5.1.26100.8655` | shell utama, pencarian source, orchestration |
| Git | `2.55.0.windows.2` | status, history, diff |
| Node.js | `v24.18.0` | runtime tooling frontend |
| npm | `11.16.0` | install dari lockfile, script dev/lint/build/preview |
| npx | `11.16.0` | menjalankan ESLint lokal secara terarah |

### Tidak Tersedia pada Snapshot

- `rg`/ripgrep;
- Bash;
- Docker.

Jangan menulis atau menjalankan prosedur seolah tool tersebut tersedia. Gunakan PowerShell untuk pencarian. Jangan menginstal tool/dependency tanpa kebutuhan dan izin eksplisit.

Verifikasi ulang tool bila environment berubah:

```powershell
Get-Command git, node, npm, npx, rg, bash, docker -ErrorAction SilentlyContinue |
  Select-Object Name, Source, Version

$PSVersionTable.PSVersion
```

## Lokasi Kerja

Masuk ke root repository:

```powershell
Set-Location D:\Projects\KONI\koni-sumbar-frontend
Get-Location
Get-ChildItem -Force
```

Root yang benar berisi:

- `package.json` dan `package-lock.json`;
- `src/main.jsx` dan `src/App.jsx`;
- `Dockerfile` dan `nginx.conf`;
- `vite.config.js` dan `eslint.config.js`.

## Git: Grounding, History, dan Diff

### Grounding Awal

```powershell
git status --short --branch
git branch --show-current
git log -1 --date=iso-strict --pretty=format:'%H%n%h%n%ad%n%s'
git config --get core.autocrlf
```

Catat file modified/untracked sebelum mengedit. Jangan menganggap semua perubahan yang ada dibuat oleh agent.

### Review Perubahan

```powershell
git diff --stat
git diff --name-status
git status --short --branch
git diff --check
```

Review file tertentu:

```powershell
git diff -- .\src\App.jsx
git diff -- .\src\hooks\queries\useAthletes.js
git diff -- AGENTS.md MEMORY.md TOOLS.md
```

Untuk file untracked, `git diff` biasa belum menampilkan isi. Baca dengan `Get-Content` atau gunakan `git diff --no-index` terhadap file kosong sementara hanya bila benar-benar diperlukan. Agent tidak perlu staging untuk validasi.

### Batas Aman Git

Jangan menjalankan tanpa permintaan eksplisit dan verifikasi target:

- `git reset --hard`;
- `git clean -fd` atau variannya;
- `git checkout -- <file>`/`git restore` yang membuang perubahan;
- rebase, force push, atau penghapusan branch;
- normalisasi line ending repository-wide.

## Membaca File dengan Nomor Baris

Satu file:

```powershell
$file = '.\src\api\axios.js'
$line = 0
Get-Content -LiteralPath $file | ForEach-Object {
  $line++
  '{0,4}: {1}' -f $line, $_
}
```

Rentang baris:

```powershell
$file = '.\src\App.jsx'
$start = 60
$end = 120
$line = 0
Get-Content -LiteralPath $file | ForEach-Object {
  $line++
  if ($line -ge $start -and $line -le $end) {
    '{0,4}: {1}' -f $line, $_
  }
}
```

Baca file utuh hanya bila ukurannya wajar. Untuk page/component besar, cari symbol dulu lalu baca rentang relevan.

## Inventaris Source Tanpa `rg`

Daftar seluruh source:

```powershell
Get-ChildItem .\src -Recurse -File |
  Sort-Object FullName |
  ForEach-Object {
    '{0}`t{1}' -f $_.FullName.Substring((Get-Location).Path.Length + 1), $_.Length
  }
```

Daftar JS/JSX saja:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-Object -ExpandProperty FullName
```

Cari import atau symbol:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'NamaSymbol' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Tambahkan `-CaseSensitive` bila casing adalah bagian kontrak.

## Pencarian Route, Navigasi, dan Layout

### Route Aktif

```powershell
Select-String -Path .\src\App.jsx -Pattern 'path=' |
  ForEach-Object { '{0}:{1}' -f $_.LineNumber, $_.Line.Trim() }
```

Cari route tertentu dan caller navigasi:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern '/training|navigate\(|<Link|to=' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

### Sidebar dan Protected Route

```powershell
Select-String -Path .\src\components\Sidebar.jsx -Pattern 'path:|permission:|isSuperAdmin|isAthlete|isCoach' |
  ForEach-Object { '{0}:{1}' -f $_.LineNumber, $_.Line.Trim() }

Get-Content -LiteralPath .\src\components\ProtectedRoute.jsx
```

Saat route berubah, review `App.jsx`, `Sidebar.jsx`, redirect, `DashboardLayout`, dan Nginx SPA fallback bersama-sama.

## Pencarian API dan Kontrak Consumer

### Semua Pemanggilan Axios

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'api\.(get|post|put|patch|delete)\(' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Cari endpoint/family tertentu:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern '/api/athletes|/api/coaches|/api/training' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Cari asumsi response/pagination:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'response\.data\.data|response\.data|data\?\.data|current_page|per_page|total' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Jangan berhenti pada endpoint string. Baca mapping params/payload dan consumer rendering yang bergantung pada bentuk response.

### Axios Global dan Environment

```powershell
Get-Content -LiteralPath .\src\api\axios.js
Get-ChildItem -Recurse -File -Exclude package-lock.json |
  Where-Object { $_.FullName -notlike '*\node_modules\*' -and $_.FullName -notlike '*\dist\*' } |
  Select-String -Pattern 'VITE_API_URL|baseURL|import\.meta\.env'
```

Pada baseline, `VITE_API_URL` di Dockerfile belum dikonsumsi Axios. Verifikasi source dan hasil build bila strategi base URL diubah.

## Pencarian Permission dan Auth

Cari permission/role UI:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern "can\(|canAny\(|canAll\(|permission:|permissions\?\.includes|role\?\.name" |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Cari token dan auth flow:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern "localStorage|Authorization|auth:unauthorized|must_reset_password|/api/login|/api/user|/api/logout" |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Permission frontend bukan enforcement. Setelah menemukan check UI, lanjutkan inspeksi backend sibling.

## Pencarian Query Key dan Invalidation

Daftar factory root:

```powershell
Get-ChildItem .\src\hooks\queries -File |
  Select-String -Pattern "all:\s*\['" |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Cari pemakaian query dan invalidation:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'queryKey\s*:|invalidateQueries\(|setQueryData\(|removeQueries\(|cancelQueries\(|queryClient\.clear\(' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Cari root domain tertentu:

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'athleteKeys|athleteClusterKeys|coachKeys|trainingKeys|portalKeys' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Periksa key list/detail/report/dropdown yang terkena mutation, bukan hanya hook tempat mutation didefinisikan.

## Pencarian Multipart, Blob, dan Cleanup

```powershell
Get-ChildItem .\src -Recurse -File -Include *.js,*.jsx |
  Select-String -Pattern 'new FormData\(|multipart/form-data|responseType:\s*.+blob|URL\.createObjectURL|URL\.revokeObjectURL|AbortController|clearInterval|clearTimeout|removeEventListener' |
  ForEach-Object {
    '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
  }
```

Untuk preview/upload, baca lifecycle lengkap dari pemilihan file sampai modal ditutup/unmount. Untuk download, pastikan object URL dicabut setelah browser menerima klik.

## Memeriksa Kontrak Backend Sibling

Backend sibling berada di `..\golang-koni-sumbar`. Periksa statusnya tanpa mengubah file:

```powershell
Push-Location ..\golang-koni-sumbar
try {
  git status --short --branch
  git log -1 --oneline
} finally {
  Pop-Location
}
```

Cari route aktif di `main.go`:

```powershell
Push-Location ..\golang-koni-sumbar
try {
  Select-String -Path .\main.go -Pattern 'mux\.Handle|mux\.HandleFunc' |
    ForEach-Object { '{0}:{1}' -f $_.LineNumber, $_.Line.Trim() }
} finally {
  Pop-Location
}
```

Cari endpoint, permission, request field, atau response field terkait:

```powershell
Push-Location ..\golang-koni-sumbar
try {
  Get-ChildItem .\handlers, .\services, .\models, .\repositories -File -Filter *.go |
    Select-String -Pattern 'HandleAthletes|athletes\.view|nama_field_kontrak' |
    ForEach-Object {
      '{0}:{1}:{2}' -f $_.Path, $_.LineNumber, $_.Line.Trim()
    }
} finally {
  Pop-Location
}
```

Ikuti route ke handler/service/model. Jangan menebak authorization atau response hanya dari frontend.

## Dependency Workflow

### Inspeksi Baseline

```powershell
Get-Content -LiteralPath .\package.json
npm ls --depth=0
git diff -- package.json package-lock.json
```

### Instalasi Reproducible

Jika dependency perlu dipulihkan, gunakan lockfile sebagai default:

```powershell
npm ci
```

`npm ci` memerlukan network/cache yang memadai dan mengganti isi `node_modules` agar persis mengikuti lockfile. Jangan menjalankannya bila `node_modules` aktif sudah cukup untuk pekerjaan dokumentasi atau inspeksi.

Jangan memakai `npm install` hanya untuk "menyegarkan" dependency. Ia dapat mengubah lockfile. Perubahan dependency harus:

1. termasuk scope pengguna;
2. mempunyai alasan teknis nyata;
3. memperbarui `package.json` dan `package-lock.json` secara konsisten;
4. ditinjau dengan `npm ls`, targeted lint, full lint, dan build;
5. tidak menyelundupkan upgrade massal.

Jangan menghapus `node_modules`, lockfile, atau cache secara manual tanpa kebutuhan dan izin.

## Menjalankan Development Server

```powershell
npm run dev
```

Untuk binding eksplisit lokal:

```powershell
npm run dev -- --host 127.0.0.1
```

Command ini long-running. Hentikan dengan `Ctrl+C`. Development frontend tetap mengarah ke API production selama `src/api/axios.js` masih hardcoded; jangan menganggap ada backend localhost otomatis.

## ESLint Terarah

Jalankan ESLint hanya pada file JS/JSX yang disentuh:

```powershell
npx eslint .\src\components\NamaKomponen.jsx
npx eslint .\src\pages\NamaPage.jsx .\src\hooks\queries\useDomain.js
```

Jika file sudah mempunyai issue baseline, catat output sebelum/sesudah atau gunakan diff untuk memastikan perubahan tidak menambah issue. Jangan menambahkan disable comment hanya untuk membuat command hijau tanpa memperbaiki penyebabnya.

## Full Lint dan Interpretasi Baseline

```powershell
npm run lint
```

Baseline 2026-07-28:

```text
135 problems (116 errors, 19 warnings)
```

Interpretasi yang benar:

- full lint exit nonzero sudah terjadi sebelum pekerjaan dokumentasi;
- kegagalan lama bukan alasan mengubah seluruh repository dalam task sempit;
- targeted lint file yang disentuh tetap wajib untuk perubahan source;
- jika full count naik atau file baru muncul, perlakukan sebagai kemungkinan regresi;
- jika count turun karena perubahan scoped, laporkan tanpa mengklaim seluruh lint sudah sehat;
- sertakan ringkasan issue baru vs baseline, bukan hanya "lint gagal".

Untuk menangkap ringkasan tanpa kehilangan exit code, jalankan command normal terlebih dahulu. Jangan mem-pipe output sedemikian rupa sehingga exit code ESLint tertutup.

## Production Build

```powershell
npm run build
```

Output berada di `dist/` dan di-ignore Git pada snapshot. Baseline build berhasil dengan warning chunk JS lebih besar dari 500 kB. Warning tersebut non-blocking tetapi harus dilaporkan.

Review artifact dasar:

```powershell
Get-ChildItem .\dist -Recurse -File |
  Select-Object FullName, Length

Get-Content -LiteralPath .\dist\index.html
```

Jika base URL/config berubah, cari string hasil build:

```powershell
Get-ChildItem .\dist -Recurse -File -Include *.js,*.html |
  Select-String -Pattern 'api\.satudata\.konisumbar\.or\.id|VITE_API_URL|localhost:8080'
```

Jangan mengedit `dist` secara manual; ubah source/config lalu build ulang.

## Preview Build

```powershell
npm run preview -- --host 127.0.0.1
```

Command ini long-running dan hanya menyajikan artifact Vite untuk smoke test. Ia bukan pengganti Nginx production config. Hentikan dengan `Ctrl+C`.

Smoke test manual minimum bila browser tersedia:

- `/login` terbuka;
- direct URL protected mengarah ke login saat unauthenticated;
- refresh pada route nested tetap ditangani preview/server;
- asset JS/CSS termuat tanpa 404;
- console tidak menunjukkan error startup baru.

## Automated Test

Tidak ada script `npm test` atau test runner/config aktif pada snapshot. Jangan menjalankan atau mengklaim test suite yang tidak ada.

Cari ulang bila repository berubah:

```powershell
Get-ChildItem -Recurse -File -Include *.test.js,*.test.jsx,*.spec.js,*.spec.jsx,*.test.ts,*.test.tsx,*.spec.ts,*.spec.tsx |
  Where-Object {
    $_.FullName -notlike '*\node_modules\*' -and
    $_.FullName -notlike '*\dist\*'
  } |
  Select-Object -ExpandProperty FullName
```

Jika test suite ditambahkan, dokumentasikan runner, command targeted/full, fixture, dan batas runtime di ketiga dokumen operasional.

## Validasi Markdown

### Daftar Heading

```powershell
Get-ChildItem AGENTS.md, MEMORY.md, TOOLS.md |
  ForEach-Object {
    Write-Output "--- $($_.Name) ---"
    Select-String -LiteralPath $_.FullName -Pattern '^#{1,6}\s'
  }
```

### Periksa Code Fence Berpasangan

```powershell
Get-ChildItem AGENTS.md, MEMORY.md, TOOLS.md |
  ForEach-Object {
    $count = (Select-String -LiteralPath $_.FullName -Pattern '^```').Count
    [PSCustomObject]@{
      File = $_.Name
      FenceCount = $count
      Even = ($count % 2 -eq 0)
    }
  }
```

`Even=True` adalah pemeriksaan struktural dasar, bukan parser Markdown lengkap.

### Periksa Link Relatif File

```powershell
Get-ChildItem AGENTS.md, MEMORY.md, TOOLS.md |
  ForEach-Object {
    $file = $_
    $text = Get-Content -LiteralPath $file.FullName -Raw
    foreach ($match in [regex]::Matches($text, '\]\(\./([^\)#]+)(?:#[^\)]*)?\)')) {
      $target = Join-Path $file.DirectoryName $match.Groups[1].Value
      [PSCustomObject]@{
        Source = $file.Name
        Target = $match.Groups[1].Value
        Exists = Test-Path -LiteralPath $target
      }
    }
  } | Format-Table -AutoSize
```

Link anchor masih perlu direview terhadap heading tujuan. Untuk tiga dokumen ini, periksa minimal link ke `AGENTS.md`, `MEMORY.md`, `TOOLS.md`, source entrypoint, API client, hook, page, dan component.

### Whitespace dan Diff

```powershell
git diff --check
git status --short --branch
git diff --name-status
git diff --stat
```

## Docker dan Nginx Bila Tool Tersedia

Docker tidak tersedia pada snapshot. Jika tersedia di environment lain, validasi dasar:

```powershell
docker build --tag koni-sumbar-frontend:local .
docker run --rm --name koni-sumbar-frontend-local -p 8081:80 koni-sumbar-frontend:local
```

Pada terminal lain:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8081/health
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8081/login
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8081/index.html |
  Select-Object StatusCode, Headers
```

Hentikan container dengan `Ctrl+C` pada terminal `docker run`.

Build argument dapat diberikan untuk menguji plumbing Docker:

```powershell
docker build --build-arg VITE_API_URL=http://example.invalid --tag koni-sumbar-frontend:arg-test .
```

Namun pada baseline, argument itu belum dibaca oleh Axios. Keberhasilan build bukan bukti target API berubah. Jika source Axios diperbaiki untuk memakai env, inspeksi bundle dan lakukan request runtime untuk membuktikannya.

Review config tanpa Docker:

```powershell
Get-Content -LiteralPath .\Dockerfile
Get-Content -LiteralPath .\nginx.conf
```

## Batasan Tool dan Operasi

Tanpa permintaan/izin eksplisit, jangan:

- menginstal dependency/tool sistem;
- mengubah `package.json` atau lockfile;
- menjalankan service development/preview/container di background tanpa lifecycle jelas;
- mengakses API production untuk write/import/upload/delete;
- memakai credential atau data pribadi nyata untuk smoke test;
- mengubah backend sibling secara diam-diam;
- menghapus file/directory recursive;
- memakai command Git destruktif;
- mengedit artifact `dist` sebagai source;
- memperbaiki baseline lint repository-wide di luar scope.

Jika runtime API, browser, Docker, atau akses backend tidak tersedia, laporkan batas validasi dan command yang dapat dijalankan operator berizin.

## Checklist Operasional Akhir

### Untuk Perubahan Source

```powershell
# 1. Grounding akhir
git status --short --branch
git diff --name-status
git diff --stat

# 2. Review diff file yang disentuh
git diff -- .\src\path\file.jsx

# 3. Targeted lint
npx eslint .\src\path\file.jsx

# 4. Full baseline lint
npm run lint

# 5. Production build
npm run build

# 6. Whitespace/final scope
git diff --check
git status --short --branch
```

Tambahkan browser/API/backend check sesuai validation matrix di [`AGENTS.md`](./AGENTS.md#validation-matrix).

### Untuk Dokumentasi Saja

```powershell
# Heading/fence/link
Get-ChildItem AGENTS.md, MEMORY.md, TOOLS.md |
  ForEach-Object {
    Write-Output "--- $($_.Name) ---"
    Select-String -LiteralPath $_.FullName -Pattern '^#{1,6}\s'
  }

git diff --check
npm run build
npm run lint
git status --short --branch
git diff --name-status
git diff --stat
```

Untuk baseline dokumentasi ini, build diharapkan hijau dengan warning chunk >500 kB dan lint diharapkan tetap melaporkan 116 error serta 19 warning lama. Laporkan hasil aktual, jangan mengubah source aplikasi hanya untuk mengubah baseline tersebut.
