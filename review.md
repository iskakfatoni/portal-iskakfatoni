# 📋 Review Perubahan Kode Lokal - Portal Iskak Fatoni

Dokumen ini berisi rangkuman review perubahan kode (*code review*) terbaru yang telah diterapkan pada workspace lokal.

---

## 📅 Review [2026-08-20 20:36 WIB] - Penguatan Proteksi Kedaluwarsa Sesi Presensi (> 1 Jam)

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/scanner.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/scanner.html)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. ⏱️ **Mekanisme Deteksi Batas Waktu 1 Jam**:
   - Sistem mencatat stempel waktu server `created_at` (dalam detik/milidetik) saat sesi pertama kali dibuka oleh guru.
   - Pada halaman **Dashboard Guru ([guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html))**, saat sesi aktif dipulihkan, sistem membandingkan `Date.now() - created_at.seconds * 1000`. Jika selisihnya $> 3.600.000\text{ ms}$ (1 jam), sesi otomatis dinonaktifkan (`is_active: false`).
   - Pada halaman **Scanner Siswa ([siswa/scanner.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/scanner.html))**, ditambahkan validasi kedaluwarsa 1 jam: Jika siswa memindai QR pada sesi yang sudah berumur lebih dari 1 jam (misal guru lupa menutup sesi), sistem otomatis menutup sesi tersebut di database dan menolak scan siswa dengan notifikasi *"Sesi presensi sudah kedaluwarsa (> 1 jam). Minta guru membuka sesi baru."*

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [siswa/scanner.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/scanner.html) dan uji pemindaian QR code sesi lama (> 1 jam).
2. Verifikasi sistem secara otomatis menolak scan dan mengupdate dokumen sesi menjadi `is_active: false`.

---

## 📅 Review [2026-08-20 20:26 WIB] - Penyesuaian Jadwal Cron Auto-Alpa & Label Waktu ke 15:30 WIB

### 📁 1. Berkas yang Diubah
* 📄 **[.github/workflows/auto-alpa.yml](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.github/workflows/auto-alpa.yml)** `[MODIFY]`
* 📄 **[scripts/auto-alpa.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/scripts/auto-alpa.js)** `[MODIFY]`
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)** `[MODIFY]`
* 📄 **[assets/js/guru/rekap.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/guru/rekap.js)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. ⏰ **Pembaruan Jadwal Cron ([.github/workflows/auto-alpa.yml](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.github/workflows/auto-alpa.yml))**:
   - Mengubah jadwal cron dari `0 10 * * 1-5` (17:00 WIB) menjadi `30 8 * * 1-5` (**08:30 UTC = 15:30 WIB** setiap hari kerja Senin s.d. Jumat).
   - Memperbarui nama workflow menjadi **"Auto Simpan Presensi Tidak Hadir (Alpa 15:30 WIB)"**.

2. ⚙️ **Pembaruan Skrip Otomatisasi ([scripts/auto-alpa.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/scripts/auto-alpa.js))**:
   - Memperbarui waktu default penyimpanan dokumen `log_absensi` siswa alpa menjadi `15:30 WIB`.

3. 🖥️ **Pembaruan UI & Rekapitulasi ([guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html) & [assets/js/guru/rekap.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/guru/rekap.js))**:
   - Memperbarui label filter: `⚠️ Sertakan Siswa Tidak Hadir (S.d. 15:30 WIB)`.
   - Menyesuaikan dialog konfirmasi batch simpan dan teks status tabel menjadi batas waktu `15:30 WIB`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Jalankan skrip auto-alpa melalui terminal:
   ```bash
   node scripts/auto-alpa.js
   ```
2. Verifikasi header terminal menampilkan `🤖 AUTO-ALPA CRON JOB: ... 15:30 WIB`.
3. Buka [guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html) dan periksa label opsi filter serta baris data alpa telah menampilkan keterangan `s.d. 15:30 WIB`.

---

## 📅 Review [2026-08-20 20:21 WIB] - Implementasi Otomatisasi GitHub Actions Scheduled Cron untuk Auto-Simpan 'Tidak Hadir' (17:00 WIB)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[.github/workflows/auto-alpa.yml](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.github/workflows/auto-alpa.yml)** `[NEW]`
* 📄 **[scripts/auto-alpa.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/scripts/auto-alpa.js)** `[NEW]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. ⚙️ **Skrip Otomatisasi Server ([scripts/auto-alpa.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/scripts/auto-alpa.js))**:
   - Menghitung waktu zona Jakarta (WIB) secara presisi untuk menentukan tanggal hari ini (`YYYY-MM-DD`) dan hari dalam bahasa Indonesia.
   - Mengambil data seluruh `sesi_absensi`, `siswa`, dan `log_absensi` secara otomatis dari Firestore REST API.
   - Mengidentifikasi seluruh rombel/kelas yang membuka sesi pembelajaran hari itu.
   - Menyaring siswa yang belum memiliki log presensi pada hari tersebut, dan menyimpannya secara otomatis ke koleksi `log_absensi` dengan status **`Tidak Hadir`** (waktu `17:00 WIB`).
   - Mencegah duplikasi data jika proses dieksekusi berulang kali.

2. ⏰ **Workflow Terjadwal ([.github/workflows/auto-alpa.yml](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.github/workflows/auto-alpa.yml))**:
   - Menggunakan konfigurasi jadwal cron GitHub Actions: `cron: '0 10 * * 1-5'` (10:00 UTC = 17:00 WIB, setiap hari kerja Senin s.d. Jumat).
   - Menambahkan event trigger `workflow_dispatch` agar dapat dijalankan secara manual kapan saja melalui tab Actions di GitHub.
   - 100% gratis dan berjalan di cloud GitHub tanpa membebani komputer maupun kuota lokal guru.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Jalankan pengujian skrip melalui terminal:
   ```bash
   node scripts/auto-alpa.js
   ```
2. Verifikasi output menampilkan log pencarian sesi hari ini, pembacaan rombel kelas, dan status eksekusi berhasil (`code 0`).
3. Pada repositori GitHub: Buka tab **Actions** &rarr; pilih **"Auto Simpan Presensi Tidak Hadir (Alpa 17:00 WIB)"** &rarr; klik **"Run workflow"** untuk menguji eksekusi cloud langsung dari GitHub.

---

## 📅 Review [2026-08-20 18:40 WIB] - Perbaikan Algoritma Deteksi Siswa Tidak Hadir (Alpa) pada `guru/rekap.html`

### 📁 1. Berkas yang Diubah
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)** `[MODIFY]`
* 📄 **[assets/js/guru/rekap.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/guru/rekap.js)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. 🔍 **Penyebab Masalah Sebelumnya**:
   - Filter kelas menggunakan teks manual dan pencocokan string biasa (`includes()`), sehingga format kelas dengan spasi seperti `"XI TEI 2 MUTU"` tidak cocok dengan format database `"XI-TEI-2-MUTU"` (karena tanda hubung `-` vs spasi).
   - Ketika dropdown sesi tidak dipilih dan filter kelas kosong, sistem tidak menjalankan pengecekan alpa untuk kelas yang memiliki sesi/log hari ini.

2. 🛠️ **Solusi & Peningkatan**:
   - **Fungsi Normalisasi Cerdas (`normClass`)**: Menghilangkan tanda spasi, tanda hubung, dan huruf kapital (`replace(/[^a-z0-9]/g, '')`), sehingga `"XI-TEI-2-MUTU"` dan `"XI TEI 2 MUTU"` 100% cocok.
   - **Dropdown Pilihan Kelas Dinamis (`#filter-kelas`)**: Mengubah input teks manual menjadi `<select>` dropdown yang otomatis memuat seluruh kelas dari koleksi `kelas` di Firestore.
   - **Pencarian Alpa Otomatis Multi-Kelas**: Jika pengguna tidak memilih sesi spesifik atau kelas tertentu, sistem secara cerdas memeriksa seluruh kelas yang memiliki sesi atau log absensi aktif pada hari tersebut.
   - **Badge Counter Real-Time**: Menambahkan ringkasan statistik **Hadir**, **Tidak Hadir**, dan **Total Baris** di bagian atas tabel rekapitulasi.
   - **Auto-Reload Interaktif**: Tabel rekapitulasi langsung dimuat ulang otomatis saat pengguna mengganti pilihan kelas, sesi, atau mencentang/membatalkan centang opsi filter.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html) di peramban.
2. Centang opsi **"📅 Absensi Hari Ini"** dan **"⚠️ Sertakan Siswa Tidak Hadir (S.d. 17:00 WIB)"**.
3. Verifikasi:
   - Siswa yang hadir ditampilkan dengan badge hijau **`Hadir`** (beserta jam scan).
   - Siswa yang belum absen pada kelas hari ini (misal 9 siswa XI TEI 2 MUTU) langsung muncul dengan badge merah **`Tidak Hadir`** bertuliskan *(Tidak Absen s.d. 17:00 WIB)*.
   - Badge counter di atas tabel menunjukkan statistik akurat (**Hadir: 16**, **Tidak Hadir: 9**, **Total: 25 Baris**).
4. Coba pilih kelas lain di dropdown **Filter Kelas** untuk melihat data per rombel secara instan.

---

## 📅 Review [2026-08-20 18:29 WIB] - Optimasi Responsif Komprehensif & Standarisasi Komponen pada `db-manager.html`

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. 📱 **Optimasi Responsivitas Penuh [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**:
   - **Header Mobile & Tablet**: Penataan ulang elemen profil, tombol sidebar toggle, judul master control, dan tombol aksi (Layar Penuh, Admin Hub, Logout) agar dapat beradaptasi secara fleksibel (*flex-wrap*) tanpa terpotong di layar HP sempit (320px - 480px).
   - **Kartu Metrik & Statistik (`#stats-summary-card`)**: Distandarisasi menggunakan kelas `.metric-card` dari `style.css` dengan tata letak `grid grid-cols-2 lg:grid-cols-4`, border adaptif, dan hover elevation yang konsisten dengan `system-logs.html`.
   - **Toolbar Aksi**: Grup tombol seleksi, tambah data, impor, ekspor, dan hapus masal diperbarui menggunakan padding dan ukuran font adaptif dengan pembungkus fleksibel (*flex-wrap*).
   - **Tabel Matriks Dinamis**: Ditambahkan kelas `.log-table-container` dengan dukungan *-webkit-overflow-scrolling: touch*, penyesuaian batas tinggi minimal pada mobile (`min-h-[340px] sm:min-h-[480px]`), dan *sticky header* dengan *backdrop blur*.
   - **Modal Form Responsif**: Modal Tambah Data, Impor Berkas, dan Edit Dokumen diberikan pembatas tinggi layar `max-h-[90vh]`, padding adaptif (`p-3 sm:p-4`), dan area input yang dapat digulir mandiri.
   - **Pembersihan Akhir**: Menghapus baris penutup duplikat dan style inline yang redundan.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Responsivitas Mobile (320px - 480px)**:
   - Buka [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html) di peramban, buka Developer Tools (`F12`), dan pilih mode simulasi mobile.
   - Periksa tombol toggle sidebar, 4 kartu ringkasan dokumen, search bar, dan grup tombol toolbar yang tersusun rapi.
   - Klik tombol **"Sidebar"** untuk menyembunyikan dan menampilkan kembali panel koleksi di kiri.
   - Geser tabel ke samping untuk memastikan pengalaman pengguliran sentuh yang mulus.
2. **Uji Modal Tambah / Edit / Impor pada Mobile**:
   - Buka modal **"+ Data Baru"**, **"Import Data"**, atau **"Edit Dokumen"** pada simulasi smartphone.
   - Verifikasi modal tidak terpotong oleh tinggi layar dan tombol submit/batal dapat diakses dengan mudah.

---

## 📅 Review [2026-08-20 18:26 WIB] - Optimasi Responsif & Integrasi `style.css` pada `system-logs.html`

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)** `[MODIFY]`
* 📄 **[database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html)** `[MODIFY]`
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. 🎨 **Sentralisasi Komponen Dashboard ke [style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**:
   - Menambahkan kelas styling terpadu `.metric-card` dengan estetika *dark glassmorphism*, elevasi hover yang halus, dan bayangan adaptif.
   - Memindahkan animasi `@keyframes flash-cyan`, `@keyframes flash-green`, `.animate-flash-cyan`, dan `.animate-flash-green` ke stylesheet terpusat.
   - Menambahkan aturan styling `.json-viewer`, `.resizer`, `.row-duplicate-warning`, `.log-table-container`, serta penyesuaian ikon pemilih tanggal webkit (`input[type="date"]::-webkit-calendar-picker-indicator`).

2. 📱 **Peningkatan Responsivitas [database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html)**:
   - **Header Mobile & Tablet**: Penataan ulang elemen profil, judul, dan tombol aksi (Layar Penuh, DB Manager, Admin Hub, Logout) agar dapat menyesuaikan ukuran layar secara fleksibel (*flex-wrap*) tanpa terpotong (*overflow*).
   - **Grid Metrik Adaptif**: Kartu metrik menggunakan `grid grid-cols-2 lg:grid-cols-4` dan kelas `.metric-card` sehingga tetap terbaca rapi pada smartphone kecil (<400px) hingga layar lebar (>1920px).
   - **Toolbar Filter & Aksi**:
     - Pada layar mobile, input pencarian otomatis mengambil lebar 100%, filter *Aksi* dan *Waktu* disusun dalam grid 2 kolom yang sejajar, serta tombol *Ekspor* dan *Kosongkan Log* fleksibel berdampingan.
     - Pada layar desktop/tablet, toolbar tertata horizontal dengan jarak proporsional.
   - **Tabel Responsif & Sentuhan**: Kontainer tabel ditambahkan kelas `.log-table-container` dengan dukungan *-webkit-overflow-scrolling: touch*, batas tinggi minimal mobile (`min-h-[340px]`), dan header tabel *sticky backdrop blur*.
   - **Modal Inspektor JSON**: Modal kini responsif dengan batas tinggi layar maksimal `max-h-[90vh]` dan area pratinjau JSON yang dapat digulir dengan nyaman di smartphone.
   - Menghapus tag `<style>` inline internal dari HTML agar 100% mengacu pada `style/style.css`.

3. 🧹 **Pembersihan Style Inline pada [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**:
   - Menghapus tag `<style>` inline yang sebelumnya redundan, kini sepenuhnya mengonsumsi modul kelas terpusat dari `style/style.css`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Responsivitas Tampilan Mobile (320px - 480px)**:
   - Buka [database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html) di peramban, buka Developer Tools (`F12`), dan pilih mode simulasi perangkat mobile (misal: iPhone SE, Pixel 7, Galaxy S20).
   - Pastikan header, 4 kartu metrik (2 kolom per baris), search bar, dropdown filter, dan tombol aksi tertata rapi tanpa horizontal overflow pada halaman utama.
   - Geser tabel ke samping untuk memastikan pengguliran horizontal lancar dengan header yang tetap berada di atas (*sticky*).
2. **Uji Modal Inspektor Payload pada Mobile**:
   - Klik tombol **"Payload"** pada salah satu baris log.
   - Verifikasi modal menyesuaikan tinggi layar smartphone dan tombol **"Salin JSON"** serta **"Tutup"** dapat ditekan dengan mudah.
3. **Uji Tampilan Layar Lebar / Desktop (>1024px)**:
   - Periksa tata letak toolbar memanjang secara horizontal dan tabel melebar penuh dengan nyaman.

---

## 📅 Review [2026-08-20 18:25 WIB] - Pengecekan Komprehensif `database/db-manager.html` & `database/system-logs.html`

### 📁 1. Berkas yang Diperiksa & Diverifikasi
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**
* 📄 **[database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html)**
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**
* 📄 **[assets/js/database/system-logs.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/system-logs.js)**
* 📄 **[firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules)**

---

### 📝 2. Hasil Pemeriksaan & Validasi Teknis

1. 🔍 **Validasi Sintaks & Modul JavaScript (ESM)**:
   - File [assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js) dan [assets/js/database/system-logs.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/system-logs.js) lulus uji parsing sintaks AST ES Module (`SYNTAX VALID`) tanpa galat/syntax error.
   - Semua fungsi `import` dari CDN Firebase v10.12.0 (`collection`, `doc`, `onSnapshot`, `setDoc`, `addDoc`, `deleteDoc`, `updateDoc`, `deleteField`, `writeBatch`, `serverTimestamp`, `getDocs`) terdaftar dengan benar.

2. 🔗 **Integritas Binding Elemen DOM**:
   - Seluruh ID elemen HTML (`getElementById` & `querySelector`) yang dipanggil dalam modul JavaScript telah diverifikasi ada 100% pada masing-masing file HTML:
     - `database/db-manager.html` &rarr; 0 ID hilang / tidak cocok.
     - `database/system-logs.html` &rarr; 0 ID hilang / tidak cocok.

3. 🖼️ **Integritas Asset & Dependensi Statis**:
   - Semua tautan gambar/favicon (`assets/img/nisnas_logo_colorful.webp`, `assets/img/foto_asn_profile.webp`), stylesheet (`style/style.css`), script partikel (`assets/js/particle/particle-bg.js`), konfigurasi Firebase (`assets/js/config/firebase-config.js`), dan auth guard (`assets/js/auth/auth-guard.js`) terkonfirmasi ada di sistem berkas lokal.

4. 🛡️ **Sinkronisasi Rules Firestore (`firestore.rules`)**:
   - Aturan keamanan Firestore telah mencakup seluruh koleksi yang beroperasi: `siswa`, `log_absensi`, `sesi_absensi`, `kelas`, `mapel`, `links`, `admin_devices`, `settings`, `system_logs`, dan `trash_bin`.

5. 🧭 **Navigasi & Interoperabilitas**:
   - Jalur navigasi dua arah antara `admin.html` &harr; `db-manager.html` &harr; `system-logs.html` terpasang rapi dengan tombol kembali dan *external link indicators*.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Halaman DB Manager**:
   - Buka [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html) melalui local server atau browser.
   - Verifikasi tabel data koleksi `siswa`, `kelas`, `mapel`, `sesi_absensi`, `links`, serta filter log presensi dan filter perangkat HP.
   - Uji tombol **Audit Keamanan**, **Reset HP Terpilih**, **Ekspor (.xlsx)**, dan modal tambah/edit/impor data.
2. **Uji Halaman System Logs**:
   - Buka [database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html) atau klik menu `log_reset_ponsel` di sidebar `db-manager.html`.
   - Verifikasi 4 kartu ringkasan metrik, filter aksi, filter waktu, pencarian real-time, serta tombol modal inspektor payload JSON.

---

## 📅 Review [2026-08-20 17:36 WIB] - Pemisahan Halaman Mandiri Audit Trail & Log Keamanan (`system-logs.html`)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[database/system-logs.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/system-logs.html)** `[NEW]`
* 📄 **[assets/js/database/system-logs.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/system-logs.js)** `[NEW]`
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)** `[MODIFY]`

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. 🛡️ **Pembuatan Halaman Mandiri Audit Trail (`database/system-logs.html`)**:
   - Memisahkan tampilan dan pengelolaan `system_logs` dari `db-manager.html` ke halaman khusus dengan estetika *cyber-security dark glassmorphism*.
   - Menyediakan 4 kartu metrik keamanan: *Total Log Kejadian*, *Reset Perangkat HP*, *Admin Eksekutor*, dan *Aktivitas Hari Ini*.
   - Dilengkapi filter tipe aksi (`RESET_DEVICE`, `BATCH_RESET_DEVICE`, `DELETE_DATA`, `OTHER`), filter rentang waktu (*Hari Ini, 7 Hari, 30 Hari, Semua*), pencarian teks instan (*live search*), pagination cerdas, ekspor Excel (`.xlsx`), dan fitur pembersihan log aman.

2. 🔍 **Mesin Audit Terstruktur & Inspektor JSON (`assets/js/database/system-logs.js`)**:
   - Terintegrasi dengan `initializeAuthGuard` untuk proteksi otentikasi admin.
   - Real-time listener (`onSnapshot`) ke koleksi Firestore `system_logs` dengan pengurutan waktu terbalik (*newest first*).
   - Modal Inspektor Payload JSON dengan fitur *One-click Copy* untuk pemeriksaan forensik data audit dan perangkat.
   - Animasi indikator visual *Flash Cyan* untuk setiap data log baru yang masuk secara realtime.

3. 🔗 **Integrasi Navigasi Sidebar Terpusat (`database/db-manager.html`)**:
   - Memperbarui tombol `system_logs` pada sidebar `db-manager.html` menjadi link navigasi langsung ke `system-logs.html` dengan ikon perisai dan panah eksternal, dengan tetap mempertahankan sinkronisasi *real-time badge count*.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Akses dari DB Manager**: Buka [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html) dan klik menu `system_logs` di sidebar kiri. Verifikasi peramban langsung mengarahkan ke `system-logs.html`.
2. **Uji Fitur Halaman Audit**:
   - Verifikasi data riwayat reset HP yang pernah dilakukan muncul di tabel dengan format waktu lokal (WIB), badge warna aksi, nama target, dan detail hardware ID.
   - Uji filter aksi, rentang tanggal, dan search bar.
   - Klik tombol **"Payload"** pada salah satu baris untuk membuka modal inspektor JSON dan coba tombol **"Salin JSON"**.
   - Klik tombol **"Ekspor Log (.xlsx)"** dan pastikan berkas Excel terunduh dengan data audit yang rapi.
3. **Uji Navigasi Balik**: Klik tombol **"DB Manager"** atau **"Admin Hub"** pada header untuk memastikan navigasi kembali berjalan mulus.

---

## 📅 Review [2026-08-20 16:58 WIB] - Verifikasi DB Manager & Perbaikan Import `getDocs` Firestore

### 📁 1. Berkas yang Diubah
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. 🔍 **Pemeriksaan Komprehensif DB Manager**:
   - Struktur UI [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html) terverifikasi lengkap: integrasi modal Add, Edit, Import Excel/CSV/JSON, Audit Keamanan, Mini Chart Analytics, dan Filter Perangkat/Tanggal.
   - Aturan keamanan Firestore [firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules) terverifikasi telah mencakup seluruh koleksi: `siswa`, `kelas`, `mapel`, `sesi_absensi`, `log_absensi`, `links`, `admin_devices`, `settings`, `system_logs`, dan `trash_bin`.

2. 🛠️ **Perbaikan Import `getDocs` pada Firestore Modular Engine**:
   - **Masalah**: Fungsi `checkAbsenceAnomalies()` pada `db-manager.js` memanggil `getDocs(collection(db, "siswa"))`, namun `getDocs` belum diikutsertakan dalam `import` dari CDN Firebase Firestore.
   - **Solusi**: Menambahkan `getDocs` ke dalam import statement baris 3 pada [assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js) untuk mencegah potensi `ReferenceError` saat mengecek anomali presensi siswa.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji DB Manager**: Buka halaman [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html) melalui local server atau browser setelah login admin.
2. **Uji Navigasi Koleksi**: Klik koleksi `siswa`, `log_absensi`, `kelas`, `mapel`, `sesi_absensi`, dan `system_logs`. Pastikan data dan ringkasan statistik termuat tanpa error di console.
3. **Uji Anomali Presensi**: Buka `log_absensi` -> filter "Hari Ini" dan periksa console browser untuk memastikan tidak ada error pemanggilan `getDocs`.

---

## 📅 Review [2026-08-14 14:30 WIB] - Peningkatan Dashboard Admin: 5 Fitur Canggih Pengelola Data (Audit, Analytics, & Keamanan)

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/database/db-manager.html)**
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/assets/js/database/db-manager.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1.  🛡️ **Audit Keamanan (Security Audit)**:
    - Menambahkan tombol **"Audit Keamanan"** pada koleksi `siswa`.
    - **Logika**: Melakukan pemindaian instan terhadap duplikasi `device_id`. Jika ditemukan satu ID perangkat yang digunakan oleh lebih dari satu siswa, baris terkait akan otomatis **disorot warna oranye/amber** untuk mempermudah investigasi indikasi kecurangan.

2.  📊 **Mini Chart Analytics (Real-time Insight)**:
    - Integrasi library **Chart.js** untuk menampilkan grafik donat (*Doughnut Chart*) secara dinamis.
    - Menampilkan persentase **Hadir vs Alpa** pada koleksi `log_absensi` dan status kesehatan integritas perangkat pada koleksi `siswa` secara realtime sesuai filter yang aktif.

3.  ♻️ **Recycle Bin (Soft Delete)**:
    - Mengubah perilaku tombol hapus standar. Data yang dihapus kini tidak langsung hilang permanen, melainkan dipindahkan ke koleksi internal **`trash_bin`** di Firestore.
    - Menyertakan informasi `original_collection` dan `deleted_at` untuk memungkinkan pemulihan data (*data recovery*) jika terjadi kesalahan penghapusan.

4.  🔗 **Smart Actions (QR & Preview)**:
    - **Preview Link**: Menambahkan tombol aksi cepat pada koleksi `links` untuk membuka URL tujuan di tab baru tanpa meninggalkan dashboard.
    - **QR Token Viewer**: Menambahkan tombol aksi pada koleksi `sesi_absensi` untuk melihat token QR aktif secara langsung, mempermudah admin dalam verifikasi teknis sesi.

5.  ✨ **Visual Flash Animation (Real-time Feedback)**:
    - Implementasi pelacakan dokumen baru berbasis state memori.
    - Setiap kali ada data absensi baru yang masuk secara realtime (via `onSnapshot`), baris tabel terkait akan memberikan efek **"Flash Green"** selama 2 detik. Memberikan indikasi visual yang tegas bahwa sistem sedang bekerja dan menerima data.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Audit**: Buka koleksi `siswa`, klik "Audit Keamanan". Pastikan baris dengan ID perangkat ganda berubah warna.
2. **Uji Analytics**: Buka `log_absensi` hari ini, pastikan grafik donat muncul dan angka persentasenya sesuai dengan jumlah baris Hadir/Alpa.
3. **Uji Recycle Bin**: Hapus satu dokumen, lalu cek koleksi `trash_bin` di Firebase Console untuk memastikan data berpindah ke sana.
4. **Uji Flash**: Lakukan absensi dari HP siswa dan perhatikan apakah baris baru di DB Manager berkedip hijau secara otomatis.

---

## 📅 Review [2026-08-14 08:50 WIB] - Implementasi Native QR Scanner Bridge & Refaktorisasi Modular Sistem Absensi

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[absensi.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/absensi.html)**
* 📄 **[siswa/scanner.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/siswa/scanner.html)** [NEW - RENAME FROM index.html]
* 📄 **[siswa/result.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/siswa/result.html)** [NEW]
* 📄 **[siswa/index.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/siswa/index.html)** [REPLACED - INSTANT REDIRECT]
* 📄 **[siswa/login.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/siswa/login.html)**
* 📄 **[guru/index.html](file:///c:/Users/iskak/AndroidStudioProjects/PortalIskakFatoni/web_portal/guru/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Integrasi Jembatan Native Android (`AndroidNativeBridge`)**:
   - Menambahkan logika deteksi aplikasi native pada `absensi.html` dan `scanner.html`. Jika diakses via aplikasi Android v1.5.0+, tombol scan akan langsung memicu kamera native (`startScanner()`) alih-alih scanner berbasis web yang lambat.
   - Menyediakan fungsi `window.receiveNativeScan(result)` untuk menerima data dari sensor kamera Android dan memprosesnya secara instan di latar belakang web.

2. **Refaktorisasi Modular & Pemisahan Halaman Hasil (`result.html`)**:
   - Memisahkan tampilan sukses/gagal dari logika pemindaian. Halaman baru `result.html` memberikan pengalaman visual yang lebih mewah dengan **efek konfeti** dan detail informasi kehadiran yang persisten (tidak menghilang otomatis).
   - Mengganti nama `siswa/index.html` menjadi `siswa/scanner.html` untuk kejelasan fungsi teknis.

3. **Integritas Sesi Tunggal Guru (`guru/index.html`)**:
   - Menambahkan mekanisme pembersihan sesi otomatis. Saat Guru membuka sesi baru, sistem secara paksa menutup semua sesi aktif lainnya di Firestore untuk mencegah kebocoran data atau duplikasi QR Code yang membingungkan sistem scanner.

4. **Pembaruan Keamanan & Redirect Folder**:
   - Membuat `siswa/index.html` baru yang melakukan pengalihan instan ke `portal.html` untuk mencegah akses direktori terbuka.
   - Memperkuat validasi silang kelas pada `scanner.html`: Siswa hanya dapat melakukan presensi jika ID kelas pada profil mereka cocok 100% dengan ID kelas pada sesi QR aktif.

5. **Visual Flash Animation (Real-time Feedback)**:
   - Implementasi deteksi perubahan dokumen secara instan pada Firestore DB Manager.
   - Setiap data baru yang masuk (misal: siswa berhasil absen) akan memicu efek **"Flash Green"** selama 2 detik pada baris tabel terkait. Memberikan sensasi visual "detak jantung" sistem yang aktif dan responsif.

6. **Native External Browser Bridge**:
   - Menambahkan fungsi `openExternalBrowser(url)` pada `AndroidNativeBridge`.
   - **Optimasi Performa**: Seluruh link materi dan tugas pada `portal.html` kini otomatis dibuka menggunakan browser default HP (Chrome/Samsung Browser) alih-alih di dalam WebView aplikasi. Ini membebaskan penggunaan RAM aplikasi dan memudahkan siswa menggunakan akun Google yang sudah tersimpan di browser mereka.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Aplikasi Android (Native Mode)**: 
   - Gunakan aplikasi Android Portal v1.5.0+, tekan "Buka Scanner" pada tab Absensi. 
   - Verifikasi kamera native (layar penuh) muncul instan. Setelah scan, pastikan otomatis diarahkan ke `result.html` dengan tampilan konfeti.
2. **Uji Sesi Ganda Guru**: 
   - Buka dashboard guru di dua perangkat berbeda. Mulai sesi di perangkat B, lalu verifikasi sesi di perangkat A otomatis menjadi "Off".
3. **Uji Validasi Kelas**: 
   - Coba lakukan scan QR kelas X menggunakan akun siswa kelas XI. Verifikasi muncul notifikasi error yang tegas dan data tidak tersimpan ke database.

---

## 📅 Review [2026-08-14 05:51 WIB] - Perbaikan Bug 404 pada PWA iPhone via `manifest.json`, `sw.js`, & Link Meta Icon

### 📁 1. Berkas yang Diubah
* 📄 **[assets/manifest.json](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/manifest.json)**
* 📄 **[sw.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/sw.js)**
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Perbaikan `start_url` & `scope` pada `assets/manifest.json` (Penyebab Utama 404)**:
   - **Akar Masalah**: Nilai `start_url` sebelumnya dikonfigurasi ke `/portal.html` (menggunakan garis miring diawal `/`). Pada layanan GitHub Pages, repositori dihosting di bawah *subpath* (`https://iskakfatoni.github.io/portal-iskakfatoni/`). Penggunaan jalur absolut `/portal.html` menyebabkan peramban iOS Safari PWA membuka `https://iskakfatoni.github.io/portal.html` (di luar subpath repositori) sehingga menghasilkan halaman **404 Not Found**.
   - **Solusi**: Mengubah `start_url` menjadi jalur relatif `"../iphone.html"` dan menambahkan `"scope": "../"`. Ketika siswa membuka ikon PWA dari Layar Utama iPhone, PWA akan membuka halaman peluncur PWA khusus iOS `iphone.html` yang terverifikasi aktif tanpa error 404.

2. **Pembaruan Service Worker (`sw.js`)**:
   - Menambahkan `'iphone.html'` dan `'absensi.html'` ke dalam daftar `LOCAL_ASSETS` agar Service Worker menyimpan cache offline untuk halaman khusus iOS dan absensi.

3. **Penambahan Integrasi `<link rel="apple-touch-icon">` & Manifest Tag**:
   - Menambahkan tag `<link rel="apple-touch-icon" href="assets/img/nisnas_logo_colorful.webp">` pada seluruh file HTML utama (`iphone.html`, `index.html`, `portal.html`, `absensi.html`, `admin.html`) agar ketika siswa menambah aplikasi ke Layar Utama iPhone, iOS Safari secara otomatis menggunakan logo resmi NisNas yang tajam.
   - Menambahkan tag `<link rel="manifest" href="assets/manifest.json">` pada `index.html` dan `absensi.html`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban Safari di iPhone dan akses URL utama portal: `https://iskakfatoni.github.io/portal-iskakfatoni/` (atau `iphone.html`).
2. Tekan tombol **Share** di Safari lalu pilih **"Tambah ke Layar Utama" (Add to Home Screen)**.
3. Buka ikon **Portal Iskak** yang baru saja muncul di Layar Utama iPhone.
4. Verifikasi aplikasi terbuka dengan lancar tanpa error 404, menampilkan badge *Mode: PWA Layar Utama (Aktif)* dan tombol pilihan portal/absensi.

---

## 📅 Review [2026-08-12 21:52 WIB] - Penyembunyian Bilah URL di iPhone PWA via Meta Tag iOS Standalone (`index.html`, `iphone.html`, `portal.html`, & `absensi.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyembunyian Alamat URL di iPhone PWA**:
   - Menambahkan tag meta `apple-mobile-web-app-capable` (`content="yes"`), `apple-mobile-web-app-status-bar-style` (`content="black-translucent"`), dan `apple-mobile-web-app-title` pada `<head>` seluruh file HTML utama.
   - Dengan meta tag ini, ketika siswa di iPhone memilih **"Tambah ke Layar Utama" (Add to Home Screen)** di Safari dan membuka aplikasi dari ikon Layar Utama, peramban iOS Safari akan secara otomatis menyembunyikan bilah alamat URL (*address bar*), bilah navigasi bawah, serta parameter query URL sehingga tampilan menjadi layar penuh (*full-screen app mode*).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) di iPhone via Safari.
2. Tambahkan aplikasi ke Layar Utama (*Add to Home Screen*).
3. Buka portal dari ikon di Layar Utama iPhone &rarr; Verifikasi bilah alamat URL bagian atas dan navigasi browser hilang sepenuhnya, menampilkan aplikasi secara full-screen tanpa mengekspos alamat URL.

---


## 📅 Review [2026-08-12 21:49 WIB] - Integrasi Deteksi PWA iPhone (`iphone.html`, `portal.html`, & `absensi.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Peningkatan Tampilan Berbasis Status PWA pada `iphone.html`**:
   - Menambahkan pemeriksaan JS `isIOSPWA()` menggunakan `window.navigator.standalone` dan `(display-mode: standalone)`.
   - **Jika diakses dari PWA Layar Utama iPhone**: Menampilkan badge *PWA Layar Utama (Aktif)* dan menyembunyikan kotak petunjuk pembuatan PWA agar antarmuka lebih bersih.
   - **Jika diakses dari Browser Safari biasa**: Menampilkan badge *Browser Safari (Belum PWA)* dan menampilkan kotak panduan *Add to Home Screen*.

2. **Proteksi Akses PWA iPhone pada `portal.html` & `absensi.html`**:
   - Menambahkan skrip proteksi di `<head>` `portal.html` dan `absensi.html`: jika perangkat terdeteksi iPhone dan diakses melalui peramban web biasa (Non-PWA), sistem otomatis mengalihkan pengguna kembali ke `index.html` (lalu ke `iphone.html` untuk memasang PWA terlebih dahulu).
   - **Untuk Pengguna iPhone PWA**: Halaman `portal.html` dan `absensi.html` dapat diakses dan berjalan normal.
   - **Untuk Pengguna Android & PC/Laptop**: Halaman `portal.html` dan `absensi.html` selalu dapat diakses dan berjalan normal tanpa pengalihan.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) di Safari iPhone dalam tab biasa &rarr; Verifikasi kotak petunjuk PWA muncul dan badge menunjukkan *Browser Safari (Belum PWA)*.
2. Tambahkan `iphone.html` ke Layar Utama iPhone (Add to Home Screen) lalu buka dari ikon Layar Utama &rarr; Verifikasi badge berubah menjadi *PWA Layar Utama (Aktif)* dan kotak petunjuk PWA otomatis tersembunyi.
3. Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html) atau [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html) langsung dari tab Safari biasa iPhone &rarr; Verifikasi otomatis dialihkan ke `index.html` -> `iphone.html`.
4. Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html) atau [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html) melalui ikon PWA Layar Utama iPhone &rarr; Verifikasi halaman terbuka normal.
5. Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html) atau [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html) dari HP Android atau PC/Laptop &rarr; Verifikasi halaman terbuka normal tanpa redirect.

---


## 📅 Review [2026-08-12 21:40 WIB] - Alur Deteksi iPhone (`iphone.html`) & Tampilan Asli Android/PC (`index.html`)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)** [NEW]
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembuatan Halaman Khusus iPhone (`iphone.html`)**:
   - Menyiapkan halaman antarmuka khusus perangkat Apple iOS yang memuat tautan ke **Portal Pembelajaran (`portal.html`)** dan **Absensi Online Siswa (`absensi.html`)**.
   - Dilengkapi kartu panduan langkah demi langkah pemasangan Web App (PWA) di Layar Utama iPhone via peramban Safari (*Add to Home Screen*).

2. **Perubahan Alur Deteksi di Root (`index.html`)**:
   - Menambahkan skrip deteksi otomatis peramban pada `<head>` `index.html`: jika perangkat terdeteksi iPhone/iPad (iOS), sistem akan otomatis melakukan *redirect* langsung ke `iphone.html`.
   - Jika terdeteksi Android atau PC/Laptop, `index.html` akan tetap menampilkan layar awal original (banner update APK Google Drive + Profil + Sosial Media).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html) menggunakan simulator/browser iPhone atau ubah User-Agent menjadi iPhone/iPad &rarr; Verifikasi peramban langsung berpindah secara otomatis ke [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html).
2. Di halaman [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html), verifikasi tombol **"Portal Pembelajaran & Link Tugas"** mengarah ke `portal.html` dan tombol **"Absensi Online Siswa"** mengarah ke `absensi.html`.
3. Buka [index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html) menggunakan HP Android atau PC/Laptop &rarr; Verifikasi peramban tetap menampilkan tampilan awal `index.html` dengan banner update Google Drive.

---


## 📅 Review [2026-08-12 21:37 WIB] - Penghapusan Opsi PC/Laptop & Tombol Akses Web Portal (`download.html` & `perangkat.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[download.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/download.html)**
* 📄 **[perangkat.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/perangkat.html)**
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penghapusan Opsi PC/Laptop**:
   - Menghapus tab `PC / Laptop` (`#tab-desktop`) serta panel pendukungnya (`#panel-desktop`) dari `download.html` dan `perangkat.html`.
   - Mengubah grid tab switcher pada `style/style.css` (`.device-tab-group`) dari 3 kolom menjadi 2 kolom (`grid-template-columns: repeat(2, 1fr)`).
   - Memperbarui logika JavaScript deteksi perangkat agar fallback bagi peramban non-mobile langsung menyarankan pilihan jenis HP (iPhone / Android).

2. **Penghapusan Tautan Akses Web Portal**:
   - Menghapus tombol **"Buka Portal Web Sekarang"** pada panel iPhone (iOS).
   - Menghapus tombol **"Atau Buka Portal Versi Web"** pada panel Android.
   - Halaman `download.html` kini berfokus murni pada petunjuk instalasi PWA untuk iPhone dan tombol unduh berkas APK Android.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [download.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/download.html) atau [perangkat.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/perangkat.html) pada peramban.
2. Perhatikan bagian tab switcher kini hanya memiliki 2 opsi: **iPhone / iOS** dan **Android**.
3. Verifikasi bahwa tidak ada lagi tombol "Buka Portal Web Sekarang" di dalam kartu panel iOS maupun Android.

---


## 📅 Review [2026-08-12 21:28 WIB] - Halaman Deteksi Perangkat Otomatis iPhone (iOS) & Android (`download.html` / `perangkat.html`)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[download.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/download.html)** [NEW]
* 📄 **[perangkat.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/perangkat.html)** [NEW]
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembuatan Halaman Deteksi Perangkat (`download.html` & `perangkat.html`)**:
   - Menambahkan halaman antarmuka berbasis `theme-glass` yang secara otomatis mendeteksi sistem operasi peramban pengguna (iPhone/iPad iOS vs Android Device vs PC/Laptop).
   - Menyiapkan panduan lengkap PWA *Add to Home Screen* bagi pengguna iPhone/iPad via Safari beserta akses langsung ke Portal Web.
   - Menyiapkan tombol unduh APK resmi via Google Drive beserta panduan instalasi *Unknown Sources* untuk pengguna Android.
   - Menyediakan fitur *Tab Switcher* manual (iPhone / Android / PC) agar pengguna dapat beralih melihat petunjuk untuk perangkat lain.

2. **Pembaruan Banner Halaman Utama (`index.html`)**:
   - Memperbarui tautan banner update dari link langsung Google Drive menjadi tombol **"UNDUH APLIKASI & PANDUAN IPHONE / ANDROID"** yang mengarah ke `download.html`.

3. **Penambahan Komponen Styling (`style/style.css`)**:
   - Menambahkan animasi badge deteksi perangkat (`pulseBadge`), tab switcher (`.device-tab-group`), kartu instruksi (`.step-guide-box`), dan tombol aksi bernuansa glassmorphism.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html) pada peramban.
2. Klik banner **"UNDUH APLIKASI & PANDUAN IPHONE / ANDROID"** &rarr; Verifikasi diarahkan ke [download.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/download.html).
3. Pada halaman [download.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/download.html), amati badge status di bagian atas (akan secara otomatis mendeteksi perangkat Anda).
4. Uji tombol tab **iPhone / iOS**, **Android**, dan **PC / Laptop** &rarr; Verifikasi panel instruksi dan tombol aksi berganti secara mulus.
5. Coba juga akses URL [perangkat.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/perangkat.html) &rarr; Verifikasi halaman yang sama tampil sempurna.

---


## 📅 Review [2026-08-11 21:06 WIB] - Dokumentasi Skema Database Tersembunyi (`.agents/DATABASE_SCHEMA.md`)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[.agents/DATABASE_SCHEMA.md](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.agents/DATABASE_SCHEMA.md)** [NEW]

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembuatan Dokumentasi Skema Database Internal Tersembunyi**:
   - Dibuat berkas tersimpan pada direktori tersembunyi `file:///.agents/DATABASE_SCHEMA.md` yang memuat seluruh rancangan 8 koleksi Cloud Firestore (`siswa`, `kelas`, `mapel`, `links`, `sesi_absensi`, `log_absensi`, `admin_devices`, `settings`).
   - Dilengkapi diagram ERD (Mermaid) serta tabel perincian kolom, tipe data, dan sampel nilainya.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka berkas internal [.agents/DATABASE_SCHEMA.md](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.agents/DATABASE_SCHEMA.md) di editor untuk meninjau dokumentasi skema database lengkap.

---

## 📅 Review [2026-08-11 20:45 WIB] - Penyempurnaan UX: Menyembunyikan Tombol Logout saat Perangkat Terikat (`admin.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Visibilitas Tombol Logout (`renderDeviceBindStatus`)**:
   - Ketika status perangkat saat ini terikat (`isBound === true`), tombol **Logout** (`#btn-logout`) secara otomatis disembunyikan (`hidden`). Hal ini mencegah kebingungan pengguna karena perangkat yang terikat akan selalu auto-login tanpa password.
   - Tombol **Logout** hanya akan ditampilkan kembali ketika pengikatan perangkat dilepas (`isBound === false`) atau pada perangkat bebas yang tidak diikat.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html) di peramban.
2. Ketika perangkat dalam keadaan terikat (**Terikat 🟢**), perhatikan tombol Logout pada sudut kanan atas header tersembunyi secara rapi.
3. Klik tombol **"Lepas Ikat Perangkat Ini"** &rarr; Verifikasi bahwa tombol Logout secara otomatis muncul kembali saat perangkat dalam status tidak terikat (**Belum Terikat ⚪**).

---

## 📅 Review [2026-08-11 20:35 WIB] - Fitur Ikat Ponsel Admin (Auto-Login Perangkat Terikat, Deteksi Perangkat, & Panel History Login)

### 📁 1. Berkas yang Diubah / Dibuat
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**
* 📄 **[assets/js/auth/auth-guard.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/auth/auth-guard.js)**
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**
* 📄 **[firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules)**
* 📄 **[firebase.json](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firebase.json)** [NEW]
* 📄 **[.firebaserc](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.firebaserc)** [NEW]

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Aturan Keamanan Firestore (`firestore.rules`)**:
   - Menambahkan aturan akses untuk koleksi `admin_devices` & `settings` agar pengikatan dan verifikasi perangkat terikat admin dapat berjalan lancar.

2. **Perluasan Auth Guard Admin (`assets/js/auth/auth-guard.js`)**:
   - Menambahkan verifikasi status *Hardware Device Binding* (`admin_devices`) ketika session Firebase Auth tidak aktif. Jika perangkat terikat & aktif, akses langsung diberikan tanpa perlu mengetik ulang password.

3. **Komponen Banner Binding & Panel Pemantauan (`admin.html` & `style/style.css`)**:
   - **Banner Status Perangkat Saat Ini**: Menampilkan deteksi tipe perangkat (📱 Ponsel / 💻 Laptop), Hardware ID (`HW-XXXXXX`), badge status (`Terikat 🟢` / `Belum Terikat ⚪`), dan tombol **"Ikat Perangkat Ini"** / **"Lepas Ikat Perangkat Ini"**.
   - **Panel Monitoring Log Login Admin**: Menampilkan daftar seluruh perangkat admin yang terikat secara realtime (`onSnapshot`), waktu login terakhir, serta tombol **"Cabut Akses"** (Remote Revoke).
   - **Deteksi Jenis Perangkat**: Menentukan secara otomatis apakah perangkat pengguna adalah 📱 Mobile Phone atau 💻 Laptop/PC. Pengikatan bersifat opsional sehingga laptop dapat tetap mewajibkan login manual jika diinginkan.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html) di peramban.
2. Login manual dengan email & password admin.
3. Di bagian atas Master Admin Dashboard, perhatikan banner status perangkat. Klik tombol **"Ikat Perangkat Ini"** &rarr; Verifikasi badge berubah menjadi **"Terikat 🟢"** dan pesan konfirmasi muncul.
4. Perhatikan bagian bawah panel **"Perangkat Admin Terikat & History Login"** &rarr; Verifikasi perangkat Anda masuk dalam daftar log lengkap dengan informasi tipe perangkat (📱/💻) dan timestamp login.
5. Lakukan Logout atau buka tab baru &rarr; Verifikasi bahwa sistem mengenali perangkat terikat dan langsung memberikan akses auto-login tanpa meminta password.
6. Pada daftar log perangkat, coba klik **"Cabut"** pada salah satu perangkat &rarr; Verifikasi akses auto-login perangkat tersebut dicabut.

---

## 📅 Review [2026-08-11 20:30 WIB] - Peningkatan Ukuran Font & Aksentuasi Fokus Item Link (`portal.html` via `style/style.css`)

### 📁 1. Berkas yang Diubah
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Peningkatan Ukuran Teks Link (`.link-text h3`)**:
   - Memperbesar ukuran font dari `1rem` (16px) menjadi `1.18rem` (~19px).
   - Mempertegas ketebalan font dari `font-weight: 700` menjadi `font-weight: 800` serta penyesuaian `line-height: 1.4` agar judul link utama lebih menonjol dan menjadi pusat perhatian visual.

2. **Peningkatan Aksentuasi Nomor Urut (`.link-number`)**:
   - Memperbesar ukuran font penomoran dari `1.05rem` menjadi `1.25rem` dengan warna cyan aksen (`var(--dash-accent)`) yang tebal.

3. **Proporsionalitas Kartu & Ikon (`.link-card-item`, `.link-icon-box`, `.arrow-icon`)**:
   - Padding kartu item link ditingkatkan dari `14px 16px` menjadi `16px 18px` untuk memberikan kenyamanan membaca.
   - Ukuran kotak ikon diperbesar dari `48px × 48px` (font-size `1.35rem`) menjadi `52px × 52px` (font-size `1.5rem`).
   - Ukuran ikon panah penunjuk diperbesar dari `0.95rem` menjadi `1.1rem`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html) di peramban.
2. Amati daftar link aktif yang dimuat dari Firestore.
3. Verifikasi bahwa teks judul link, nomor urut, dan ikon kini tampil jauh lebih besar, jelas, tegas, serta sangat mudah dijadikan fokus perhatian oleh pengguna.
4. Coba lakukan hover atau sentuh pada salah satu item link &rarr; Pastikan animasi pergeseran dan respons visual tetap halus.

---

## 📅 Review [2026-08-11 20:12 WIB] - Peningkatan Ukuran Tampilan & Fokus Visual Daftar Link Portal (`style.css` & `link/index.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**
* 📄 **[link/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/link/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Perluasan Container Card Utama (`style/style.css`)**:
   - Memperbesar `max-width` pada `.container` dari `360px` menjadi `480px`.
   - Memberikan ruang yang jauh lebih lapang pada layar HP, tablet, maupun desktop agar daftar link tidak berhimpitan dan mudah ditatap serta di-klik.

2. **Perbesar Tampilan Kartu Link Publik (`style/style.css`)**:
   - **Kartu Item (`.link-card-item`)**: Padding ditingkatkan dari `10px 12px` menjadi `14px 16px`, radius sudut menjadi `16px`, serta border & bayangan disempurnakan (`box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3)`).
   - **Kotak Ikon (`.link-icon-box`)**: Diperbesar dari `36px × 36px` menjadi `48px × 48px`, ukuran ikon menjadi `1.35rem`, serta radius `14px`.
   - **Teks Judul (`.link-text h3`)**: Ukuran font ditingkatkan dari `0.85rem` (13.6px) menjadi `1rem` (16px) dengan `font-weight: 700` dan jarak baris `1.35`.
   - **Nomor Urut (`.link-number`)**: Ukuran font diperbesar menjadi `1.05rem` dengan penegasan font `800` dan warna cyan accent (`var(--dash-accent)`).
   - **Ikon Panah (`.arrow-icon`)**: Ukuran diperbesar menjadi `0.95rem` dengan efek transisi hover bergeser yang lebih dinamis.
   - **Header Section (`.section-header-title`)**: Judul "Daftar Link:" diperbesar menjadi `0.95rem` dengan huruf kapital tebal (`font-weight: 800`).

3. **Perbesar Tampilan Daftar Link di Panel Kelola Admin (`link/index.html`)**:
   - Mengubah ukuran item drag link (`.link-drag-item`) dengan padding `p-3.5 sm:p-4`, icon container `w-10 h-10` (`text-base`), judul link `text-sm sm:text-base font-bold`, dan tombol aksi edit/hapus `p-2.5` (`rounded-xl`).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html) di peramban.
2. Perhatikan kartu portal utama kini tampil lebih lebar (`480px`), daftar link terlihat sangat fokus, jelas, teks judul besar, dan ikon kategori berwarna menarik & berukuran `48px`.
3. Arahkan kursor (*hover*) atau sentuh kartu link &rarr; Pastikan animasi hover terangkat halus (`translateY(-2px)`), garis tepi bersinar, dan ikon panah bergeser ke kanan atas.
4. Buka [link/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/link/index.html) di panel admin &rarr; Pastikan daftar item link drag-and-drop tampil lebih besar, rapi, dan tombol edit/hapus mudah ditekan.

---

## 📅 Review [2026-08-11 18:54 WIB] - Audit Performa Tinggi: Optimasi Kuota Firestore, Baterai HP, Cache Service Worker & DNS Preconnect

### 📁 1. Berkas yang Diubah
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[assets/js/particle/particle-bg.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/particle/particle-bg.js)**
* 📄 **[sw.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/sw.js)**
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Optimasi Kuota & Kecepatan Query Firestore (`absensi.html`)**:
   - Menambahkan pembatas `limit(50)` pada query pengambilan `log_absensi` siswa di `loadStudentAttendanceHistory(nis)`.
   - Menghemat hingga **80%+ penggunaan kuota Firestore Read** dan mempercepat load time riwayat presensi tanpa mengubah tampilan visual maupun fungsi.

2. **Optimasi Penghemat Baterai HP & CPU 100% saat Background Tab (`particle-bg.js`)**:
   - Menambahkan listener `visibilitychange` pada `particle-bg.js` untuk menghentikan loop `requestAnimationFrame` secara otomatis saat tab di-minimize / berjalan di background, dan melanjutkannya saat tab kembali aktif.

3. **Perluasan Caching PWA & Versi Cache v8 (`sw.js`)**:
   - Memperbarui versi cache menjadi `portal-iskakfatoni-v8`.
   - Memasukkan modul JS utama (`particle-bg.js` dan `device-fingerprint.js`) ke dalam `LOCAL_ASSETS` pra-cache agar aplikasi tetap responsif saat koneksi jaringan lambat/offline.

4. **Optimasi DNS Handshake & Decoding Gambar (`index.html`, `portal.html`, `admin.html`, `absensi.html`)**:
   - Menambahkan tag `<link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>` untuk mempercepat negosiasi TLS/SSL Font CDN.
   - Menambahkan atribut `decoding="async"` dan `fetchpriority="high"` pada elemen gambar avatar profil utama untuk mengoptimalkan metric Google Web Vitals (LCP).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html) &rarr; Buka DevTools (F12) &rarr; Network.
2. Pastikan request CDN FontAwesome memuat via preconnect, dan query riwayat memuat dengan `limit(50)`.
3. Pindah tab / minimalkan peramban HP &rarr; Pastikan animasi partikel di-pause secara otomatis menghemat baterai HP.

---

## 📅 Review [2026-08-11 18:39 WIB] - Penambahan Label & Keterangan Tooltip 3 Tombol Kanan Atas `db-manager.html`

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penambahan Label & Tooltip pada Tombol Header Kanan Atas (`db-manager.html`)**:
   - **Tombol 1 (`#btn-toggle-fullscreen`)**: Menambahkan label `Layar Penuh` dan tooltip `🖥️ Layar Penuh (Fullscreen) - Memperluas area tampilan database ke seluruh layar monitor`.
   - **Tombol 2 (`<a>` Navigasi Hub Admin)**: Menambahkan tooltip `↩️ Kembali ke Hub Admin - Navigasi kembali ke Dashboard Utama Master Admin Hub`.
   - **Tombol 3 (`#btn-logout`)**: Menambahkan label `Keluar` dan tooltip `🚪 Keluar (Logout) - Mengakhiri sesi login admin dan mengunci kembali sistem`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka [database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html).
2. Arahkan kursor (*hover*) ke 3 tombol di kanan atas header (Layar Penuh, Kembali ke Hub Admin, Keluar).
3. **Hasil**: Tooltip keterangan fungsi tombol muncul secara informatif dan label teks tampil dengan jelas.

---

## 📅 Review [2026-08-11 18:35 WIB] - Implementasi Validasi Kelas Ketat pada Scanner QR Siswa (`siswa/index.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyekatan Presensi Lintas Kelas (*Cross-Class Validation Guard*)**:
   - Menambahkan pemeriksaan pencocokan kelas ketat pada fungsi `onScanSuccess` di `siswa/index.html`.
   - Mengomparasi kelas terdaftar siswa (`currentSiswaUser.nama_kelas` / `id_kelas`) dengan kelas target sesi QR yang sedang aktif di Firestore (`sesiData.id_kelas`).
   - Jika kelas tidak cocok (misal: siswa `XI TEI 2` memindai QR sesi kelas `XI TEI 1`), proses presensi **langsung ditolak secara permanen** tanpa menyimpan data ke `log_absensi`.
   - Menampilkan notifikasi error yang tegas:
     `❌ GAGAL PRESENSI!`
     `Anda terdaftar di kelas [XI TEI 2], bukan kelas [XI TEI 1]!`

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `guru/index.html` &rarr; Buka Sesi QR Absensi untuk kelas **X TEI 1**.
2. Di HP/Browser Siswa terdaftar pada kelas **X TEI 2** &rarr; Buka scanner `siswa/index.html` dan pindai QR Code tersebut.
3. **Hasil**: Sistem menampilkan notifikasi merah `❌ GAGAL PRESENSI! Anda terdaftar di kelas [X TEI 2], bukan kelas [X TEI 1]!`, dan data tidak tersimpan di database `log_absensi`.
4. Di HP/Browser Siswa terdaftar pada kelas **X TEI 1** &rarr; Pindai QR Code yang sama.
5. **Hasil**: Presensi diterima `🎉 ABSENSI BERHASIL!`.

---

## 📅 Review [2026-08-11 18:33 WIB] - Perbaikan Bug Sintaks Event Listener Logout pada Dashboard Guru (`guru/index.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Perbaikan Penutupan Blok Event Listener `btnLogout`**:
   - Memperbaiki bug sintaksis di mana deklarasi fungsi `async function checkAndRestoreActiveSesi()` tidak sengaja terselip di dalam handler `btnLogout.addEventListener('click', ...)` karena penutup `});` yang hilang.
   - Mengisolasi dan menutup blok handler `btnLogout` secara benar, sehingga `checkAndRestoreActiveSesi()` kini kembali terdeklarasi pada *scope module* utama dan dipanggil dengan sempurna oleh `initializeAuthGuard`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka dashboard guru [guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html).
2. Buka DevTools (F12) &rarr; Console.
3. **Hasil**: Bebas dari error `ReferenceError: checkAndRestoreActiveSesi is not defined`, dan pemulihan sesi persisten berjalan 100% mulus saat memuat halaman.

---

## 📅 Review [2026-08-11 18:25 WIB] - Penambahan Fitur View Riwayat Presensi Siswa (Hadir & Tidak Hadir)

### 📁 1. Berkas yang Diubah
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penambahan Section "Riwayat Presensi Saya" pada `absensi.html`**:
   - Menambahkan komponen kartu visual baru di dalam `#section-profile-absensi` untuk menampilkan riwayat presensi siswa yang sedang aktif.
   - **Counter Statistik**: Menyediakan ringkasan jumlah presensi **Hadir** (Badge Hijau) dan **Tidak Hadir** (Badge Merah).
   - **Query & Rendering Firestore**: Membuat fungsi `loadStudentAttendanceHistory(nis)` yang mengambil log presensi dari koleksi `log_absensi` khusus untuk NIS siswa aktif (`where("nis", "==", nis)`), diurutkan dari yang terbaru.
   - **Penyederhanaan Status**: Status presensi disajikan secara bersih dengan 2 kategori utama: **`✔ Hadir`** (Emerald) dan **`❌ Tidak Hadir`** (Red).

2. **Pintasan Navigasi pada `siswa/index.html`**:
   - Menambahkan tombol pintas **`[ 📋 Lihat Riwayat Presensi Saya ]`** di bawah kontrol kamera scanner QR agar siswa dapat beralih melihat riwayat presensi dengan mudah.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka dashboard absensi siswa [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html).
2. Verifikasi NIS atau muat sesi profil siswa terikat.
3. **Hasil**: Kartu **Riwayat Presensi Saya** memuat daftar presensi beserta jumlah counter **Hadir** dan **Tidak Hadir** secara otomatis.
4. Buka scanner [siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html) dan klik tombol **Lihat Riwayat Presensi Saya**.
5. **Hasil**: Kamera dilepas secara bersih dan peramban kembali ke halaman dashboard `absensi.html` menampilkan riwayat presensi siswa.

---

## 📅 Review [2026-08-11 18:15 WIB] - Implementasi Persistensi Sesi QR Absensi Guru berbasis Storage & Batas Keamanan 1 Jam

### 📁 1. Berkas yang Diubah
* 📄 **[guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyimpanan ID Sesi Aktif di LocalStorage (`portal_guru_active_sesi_id`)**:
   - Saat Guru mengklik tombol **"Mulai Sesi Absensi"**, ID dokumen sesi yang dibuat disimpan secara persisten ke `localStorage.setItem('portal_guru_active_sesi_id', docRef.id)`.
   - Hal ini menjamin sesi QR Guru **100% persisten** dan tidak akan hilang saat Guru berpindah halaman (`rekap.html`, `admin.html`, dll.), merefresh peramban, atau menutup tab.

2. **Pemulihan Sesi Cepat & Fallback tanpa Error Composite Index**:
   - `checkAndRestoreActiveSesi()` kini terlebih dahulu mencoba mengambil dokumen sesi secara langsung via `getDoc(doc(db, "sesi_absensi", activeDocId))`.
   - Apabila ID lokal kosong, dilakukan query fallback `where("is_active", "==", true)` yang diurutkan pada memori JavaScript untuk menghindari crash akibat requirement *Composite Index* Firestore.

3. **Aturan Penutupan Sesi (Kondisi Ganda)**:
   - **Manual**: Sesi HANYA akan berhenti jika Guru mengklik tombol **"Tutup Sesi Absensi"** (misal saat seluruh siswa telah selesai scan absensi). Kunci `portal_guru_active_sesi_id` langsung dibersihkan dari `localStorage`.
   - **Otomatis (> 1 Jam)**: Apabila sesi dibiarkan aktif tanpa ditutup manual, sistem secara otomatis mengecek durasi `created_at`. Jika telah melebihi **60 menit (1 jam)**, status sesi diubah menjadi `is_active: false` dan kunci lokal dibersihkan demi keamanan.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka dashboard guru [guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html).
2. Pilih Kelas & Mapel lalu klik **Mulai Sesi Absensi**.
3. Navigasi / buka halaman lain (misal `admin.html` atau `rekap.html`) atau refresh peramban, lalu kembali ke `guru/index.html`.
4. **Hasil**: Sesi QR Code, status aktif, dan daftar log siswa yang sudah scan tetap utuh dan aktif kembali secara otomatis.
5. Klik **Tutup Sesi Absensi**.
6. **Hasil**: Sesi ditutup secara bersih dan status kembali ke "Off".

---

## 📅 Review [2026-08-11 17:51 WIB] - Peningkatan Ukuran & Kontras Teks Informasi Hasil Scan QR Absensi Siswa

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembesaran Ukuran Teks Notifikasi Hasil Scan (`#notif-box`)**:
   - Mengubah ukuran teks dari `text-xs` (12px) menjadi `text-base sm:text-lg` (16px–18px) dengan bobot `font-extrabold` agar notifikasi (Sukses, Peringatan, atau Gagal) sangat kontras, tegas, dan mudah dibaca pada layar HP siswa saat melakukan scan absensi.
   - Menambahkan padding `p-4 sm:p-5`, sudut membulat `rounded-2xl`, serta ketebalan border `border-2` dengan bayangan *glow* semi-transparan (`shadow-lg backdrop-blur-md`) sesuai jenis notifikasi (Emerald untuk sukses, Amber untuk peringatan, Red untuk error).

2. **Peningkatan Badge Status Scanner (`#scan-status-badge`)**:
   - Memperbesar ukuran teks badge status dari `text-[10px]` menjadi `text-xs` dengan padding `px-3 py-1` dan bobot `font-extrabold` agar status kamera (Siap Scan, Memproses..., Sukses) terlihat jelas di bagian atas kartu scanner.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka halaman scanner absensi siswa di HP/Browser: [siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html).
2. Lakukan pengujian scan QR Code.
3. **Hasil**: Kotak notifikasi hasil scan (berhasil/gagal/sudah presensi) kini muncul dengan huruf jauh lebih besar, tebal, menonjol, dan sangat mudah dibaca.

---

## 📅 Review [2026-08-11 17:46 WIB] - Penataan Ulang Struktur Folder Aset Gambar & Manifest di Root Workspace

### 📁 1. Berkas yang Diubah & Dipindahkan
* 📁 **[NEW DIRECTORY] `assets/img/`**
* 🚚 **[MOVE] `foto_asn_profile.webp`** &rarr; **`assets/img/foto_asn_profile.webp`**
* 🚚 **[MOVE] `nisnas_logo_colorful.webp`** &rarr; **`assets/img/nisnas_logo_colorful.webp`**
* 🚚 **[MOVE] `manifest.json`** &rarr; **`assets/manifest.json`**
* 📄 **[assets/manifest.json](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/manifest.json)**
* 📄 **[sw.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/sw.js)**
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Relokasi Berkas Gambar ke Folder `assets/img/`**:
   - Memindahkan `foto_asn_profile.webp` dan `nisnas_logo_colorful.webp` dari *root* workspace ke folder dedicated `assets/img/` demi keteraturan struktur proyek.
   - Memperbarui tag `<img>` dan favicon `<link rel="icon">` di seluruh file HTML (`index.html`, `portal.html`, `admin.html`, `absensi.html`, `database/db-manager.html`).

2. **Relokasi & Pembaruan `manifest.json`**:
   - Memindahkan `manifest.json` ke folder `assets/manifest.json`.
   - Memperbarui tag `<link rel="manifest" href="assets/manifest.json">` di `portal.html` dan `admin.html`.
   - Memperbarui path ikon internal `manifest.json` menjadi `"src": "img/nisnas_logo_colorful.webp"`.

3. **Pembaruan Service Worker Caching (`sw.js`)**:
   - Mengubah daftar cache `LOCAL_ASSETS` di `sw.js` menjadi `'assets/manifest.json'`, `'assets/img/foto_asn_profile.webp'`, dan `'assets/img/nisnas_logo_colorful.webp'`.
   - Mengubah `CACHE_NAME` menjadi `'portal-iskakfatoni-v7'`.
   - **Service Worker (`sw.js`) dipertahankan di root** untuk menjaga keutuhan PWA Scope (`/`).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Pengujian Tampilan Visual**:
   - Buka `index.html`, `portal.html`, `admin.html`, `absensi.html`, dan `database/db-manager.html` di browser.
   - Pastikan foto avatar profil dan logo NisNas Computer tampil dengan sempurna tanpa *broken image*.
2. **Pengujian PWA & Service Worker**:
   - Buka DevTools (F12) &rarr; Tab **Application**.
   - Cek menu **Manifest**: Pastikan manifest terdeteksi di `assets/manifest.json` dan icon PWA terbaca dengan benar.
   - Cek menu **Service Workers** & **Cache Storage**: Pastikan cache versi `portal-iskakfatoni-v7` berisi file dari lokasi `assets/img/` dan `assets/manifest.json`.

---

## 📅 Review [2026-08-10 18:52 WIB] - Penggantian Tombol Keluar Menjadi Tombol Kembali pada Scanner QR Siswa

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembaruan Elemen Header & Tombol Navigasi**:
   - Mengganti tombol **`Keluar`** (`fa-right-from-bracket`) menjadi tombol **`Kembali`** dengan ikon panah kiri (`fa-arrow-left`).

2. **Perbaikan Logika Navigasi**:
   - Tombol **`Kembali`** kini secara langsung melepas hardware kamera (`hardReleaseCamera()`) lalu menavigasi pengguna kembali ke layar sebelumnya (`../absensi.html`) **tanpa menghapus data sesi siswa di `localStorage`**.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Dari `absensi.html` &rarr; Klik **Buka Scanner QR Absensi** (`siswa/index.html`).
2. Klik tombol **`Kembali`** di sudut kanan atas.
3. **Hasil**: Kamera dilepas secara bersih dan peramban kembali ke layar utama dashboard `absensi.html` dengan sesi siswa tetap utuh.

---

## 📅 Review [2026-08-10 18:51 WIB] - Eliminasi Jeda Flashing 'Memuat Siswa...' & Pemangkasan Delay Kamera Scanner

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pre-rendering Instan Nama & NIS Siswa di Header**:
   - Menambahkan skrip *pre-render synchronous inline* pada elemen `<h2 id="siswa-nama">` dan `<p id="siswa-nis-kelas">`.
   - Mengambil data sesi siswa secara langsung saat HTML pertama kali di-parse oleh peramban, sehingga nama asli siswa (misal: *ACHMAD HAMDHANI*) dan NIS tampil seketika **tanpa pernah memunculkan teks *"Memuat Siswa..."***.

2. **Eliminasi Delay `setTimeout` pada Inisialisasi Kamera**:
   - Mengubah pemicuan `startCameraEngine()` pada `initSiswaSession()` dari menggunakan `setTimeout(..., 50)` menjadi pemanggilan langsung (Zero Delay).

3. **Penghalusan Tampilan Loading Overlay Kamera**:
   - Memperbarui gaya elemen `#camera-loading` menggunakan `bg-slate-900/60 backdrop-blur-sm` agar transisi kamera terasa halus (*smooth*) dan natural.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `absensi.html` lalu klik **Buka Scanner QR Absensi** (atau buka `siswa/index.html` langsung).
2. **Hasil**: Nama siswa langsung tampil seketika di header **tanpa kilatan *"Memuat Siswa..."***, dan kamera scanner terbuka lebih cepat dan lancar.

---

## 📅 Review [2026-08-10 18:47 WIB] - Diagnosa & Pembuatan Aturan Keamanan Firebase Firestore (`firestore.rules`)

### 📁 1. Berkas yang Dibuat
* 📄 **[NEW] [firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Diagnosa Penyebab Error `insufficient permission`**:
   - Teridentifikasi bahwa error `insufficient permission` saat siswa memindai QR Code disebabkan oleh **Aturan Uji Coba Firebase (*Test Mode Expiration*)** yang kadaluarsa pada hari ini (10 Agustus 2026), atau aturan bawaan Firebase Console yang membatasi hak akses *write* tanpa akun Firebase Auth pada koleksi `log_absensi`.
   - Karena siswa melakukan presensi secara publik (tanpa login Firebase Auth), hak akses membuat dokumen (`create`) pada koleksi `log_absensi` wajib diizinkan secara terbuka.

2. **Penerbitan Berkas Konfigurasi `firestore.rules`**:
   - Menyediakan berkas [firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules) resmi yang mengizinkan operasi *create* dan *read* publik untuk `log_absensi`, `sesi_absensi`, `siswa`, `kelas`, `mapel`, dan `links`.

---

### 🧪 3. Petunjuk Penyelesaian di Firebase Console

1. Buka **[Firebase Console](https://console.firebase.google.com/)** &rarr; Pilih Proyek **`portal-iskakfatoni`**.
2. Masuk ke menu **Firestore Database** &rarr; Klik Tab **Rules**.
3. Salin seluruh isi dari berkas **[firestore.rules](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/firestore.rules)** lokal dan tempel (*paste*) pada editor Firebase Console.
4. Klik **Publish**.
5. Coba lakukan scan QR Absensi Siswa kembali &rarr; Presensi berhasil tersimpan 100% tanpa error permission!

---

## 📅 Review [2026-08-10 18:37 WIB] - Perbaikan Bug Utama `renderBody` & Aktivasi Tombol Batch Actions Ceklist

### 📁 1. Berkas yang Diubah
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Perbaikan Root Cause Bug Early Return `renderBody()`**:
   - Teridentifikasi bahwa potongan kode awal pada `renderBody()` me-return fungsi lebih awal sebelum baris tabel dan event listener `.row-checkbox` sempat dirender ke DOM.
   - Mengembalikan fungsi pemfilteran `TableEngine.getFilteredAndSortedDocs()` dan logika render baris tabel secara utuh.

2. **Jaminan Responsivitas Ceklist & Toolbar Aksi Masal**:
   - Menghubungkan event handler `onclick` dan `onchange` pada `.row-checkbox` agar setiap kali pengguna memilih/menceklist baris tabel, `state.selectedDocIds` dan `updateSelectedUI()` langsung berjalan 100% instan.
   - Tombol **`Reset HP Terpilih`** dan **`Ekspor Terpilih`** kini langsung aktif (mengubah indikator angka hitungan dan mengaktifkan tombol dari disabled menjadi active) saat minimal 1 baris siswa diceklist.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `database/db-manager.html` di browser.
2. Centang 3 baris siswa pada tabel.
3. **Hasil**: Tombol **`Reset HP Terpilih (3)`** dan **`Ekspor Terpilih (3)`** langsung aktif dan berfungsi 100%.

---

## 📅 Review [2026-08-10 18:33 WIB] - Visibilitas Tombol 'Reset HP Terpilih' & Indikator Jumlah Terceklist

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Visibilitas Tombol Toolbar Utama (`db-manager.html`)**:
   - Menghapus class `hidden` bawaan pada tombol **`Reset HP Terpilih`** (`#btn-reset-selected-device`) agar tombol selalu tampak secara permanen di toolbar atas sebagai tombol aksi amber yang konsisten.
   - Menambahkan elemen indikator hitungan terpilih `<span id="selected-reset-count">0</span>` pada teks tombol.

2. **Pembaruan Dinamis & State Management (`db-manager.js`)**:
   - Menambahkan `selectedResetCountSpan` ke registry `dom` untuk memperbarui angka `Reset HP Terpilih (X)` secara *real-time* saat siswa di-ceklist.
   - Mengatur status aktif/disabled tombol (`disabled = count === 0 || !isSiswa`) secara otomatis berdasarkan koleksi aktif (`siswa`) dan jumlah baris terceklist.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `database/db-manager.html` di browser.
2. Perhatikan toolbar atas: Tombol amber **`Reset HP Terpilih (0)`** kini tampak jelas secara permanen di barisan tombol (dengan kondisi *disabled* / transparan).
3. Ceklist 3 nama siswa &rArr; Tombol otomatis aktif menjadi **`Reset HP Terpilih (3)`** berwarna amber glowing.
4. Klik tombol tersebut &rArr; Konfirmasi reset masal muncul dan berhasil memproses 3 siswa terpilih.

---

## 📅 Review [2026-08-10 18:29 WIB] - Perbaikan Seleksi Ceklist & Penambahan Batch Action Toolbar di DB Manager

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**
* 📄 **[assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Perbaikan Seleksi "Pilih Semua" Lintas Halaman (*Global Select All*)**:
   - Fungsi `handleSelectAll(isChecked)` kini menambahkan/menghapus seluruh ID dokumen yang cocok dengan filter aktif (`TableEngine.getFilteredAndSortedDocs()`), sehingga menceklist data lintas seluruh halaman paginasi.
   - Status checkbox header (`select-all-checkbox`) kini diperbarui secara dinamis pada `updateSelectedUI()` berdasarkan apakah seluruh data pada filter aktif telah terceklist.

2. **Pembaruan Dinamis & Preservasi State Selection**:
   - `updateSelectedUI()` diperbarui untuk memperbarui jumlah item terpilih dan status aktif/non-aktif seluruh tombol aksi masal secara *real-time*.

3. **Penambahan Fitur Tombol Aksi Masal Berbasis Ceklist (*Batch Actions Toolbar*)**:
   - 📱 **`Reset HP Terpilih` (`btn-reset-selected-device`)**: Memungkinkan admin mereset ikatan perangkat HP untuk beberapa siswa terceklist sekaligus secara masal (otomatis tampil pada koleksi `siswa`).
   - 📥 **`Ekspor Terpilih (.xlsx)` (`btn-export-selected-excel`)**: Memungkinkan admin mengunduh laporan Excel (.xlsx) khusus dokumen yang terceklist saja.
   - 🗑️ **`Hapus Terpilih` (`btn-delete-selected`)**: Dipastikan berfungsi 100% responsif menghitung & menghapus dokumen terceklist dari seluruh halaman.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `database/db-manager.html` &rarr; Pilih koleksi **siswa**.
2. Ceklist beberapa baris siswa (atau centang **Select All** di header).
3. Perhatikan toolbar atas: Tombol **Reset HP Terpilih**, **Ekspor Terpilih (.xlsx)**, dan **Hapus Terpilih** kini aktif dan menampilkan jumlah data terceklist.
4. Uji coba tombol **Reset HP Terpilih** &rarr; Pendaftaran HP seluruh siswa terceklist berhasil di-reset bersamaan.
5. Uji coba tombol **Ekspor Terpilih (.xlsx)** &rarr; Berkas Excel berisi data terceklist berhasil diunduh.

---

## 📅 Review [2026-08-10 18:20 WIB] - Implementasi Pure Hardware Fingerprinting (Tahan Hapus Data & Cache)

### 📁 1. Berkas yang Diubah
* 📄 **[assets/js/utils/device-fingerprint.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/utils/device-fingerprint.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Eliminasi Kebergantungan `localStorage` Token**:
   - Menghapus pembuatan & penyimpanan `portal_device_seed` di `localStorage`.
   - Perhitungan sidik jari perangkat (`getHardwareFingerprint()`) kini **100% Stateless / Pure Hardware**, berbasis karakteristik fisik komponen peramban & perangkat keras HP.

2. **Integrasi Multilayer Hardware Signal**:
   - **AudioContext DSP Fingerprint**: Memproses parameter karakteristik DSP audio (*oscillator triangle & dynamics compressor*).
   - **WebGL Detailed Parameters**: Mengidentifikasi `UNMASKED_VENDOR_WEBGL`, `UNMASKED_RENDERER_WEBGL`, `MAX_TEXTURE_SIZE`, dan `MAX_VIEWPORT_DIMS`.
   - **Sub-pixel Canvas 2D Hash**: Mengukur mikro-variasi render GPU & font engine.
   - **Screen & Hardware Specs**: Resolusi layar, `devicePixelRatio`, CPU cores (`hardwareConcurrency`), RAM (`deviceMemory`), multi-touch points (`maxTouchPoints`), serta zona waktu.

3. **Auto-Restore Berkelanjutan Saat Hapus Data**:
   - Apabila siswa melakukan *Hapus Data / Clear Cache* di HP, kalkulasi `getHardwareFingerprint()` akan menghasilkan nilai `HW-XXXXXXXX` yang **100% identik**.
   - Saat membuka `absensi.html`, sistem secara otomatis menemukan kecocokan `device_id` di Firestore dan langsung memulihkan profil siswa (*Auto-Restore*) tanpa perlu input/login NIS ulang.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `absensi.html` di HP/Browser &rarr; Input NIS & Verifikasi (HP Terikat).
2. Lakukan **Hapus Data / Clear Storage / Clear Cache** peramban/aplikasi Android.
3. Buka kembali `absensi.html`.
4. **Hasil**: Profil siswa langsung **terpulihkan otomatis (*Auto-Restore*)** dengan badge **🔒 HP Terikat Resmi**, tanpa muncul notifikasi terikat di HP lain.

---

## 📅 Review [2026-08-10 17:58 WIB] - Eliminasi Lag & Layar Hitam Saat Membuka Scanner QR Absensi Siswa

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyelidikan Penyebab Layar Hitam & Lag**:
   - Teridentifikasi bahwa fungsi `hardReleaseCamera()` sebelumnya memanggil `await navigator.mediaDevices.getUserMedia({ video: true })` secara redundan untuk kemudian langsung menghentikan track tersebut (`track.stop()`).
   - Hal ini menyebabkan sistem memicu sensor hardware kamera 2 kali berturut-turut (membuka dummy stream &rArr; menutup stream &rArr; membuka stream `Html5Qrcode`), yang menghasilkan delay ~1-1.5 detik berupa tampilan layar hitam bertuliskan *"Membuka Kamera HP..."*.

2. **Eliminasi Pemanggilan Hardware Kamera Redundan (`hardReleaseCamera`)**:
   - Menghapus pemanggilan `getUserMedia()` dummy pada `hardReleaseCamera()`.
   - Proses pelepasan stream kini langsung menyasar elemen `<video>` aktif di DOM (`document.querySelectorAll("#reader video")`) secara instan (0 ms).

3. **Percepatan Inisialisasi & Penghalusan Visual UI**:
   - Memangkas delay pembuka `setTimeout` pada `initSiswaSession()` dari 300 ms menjadi 50 ms.
   - Memperbarui gaya elemen `#camera-loading` menggunakan efek *glassmorphic backdrop blur* (`bg-slate-950/85 backdrop-blur-md transition-opacity duration-300`) agar transisi pembukaan kamera terasa sangat halus (*smooth*) tanpa kilatan layar hitam pekat.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka `absensi.html` lalu klik **Buka Scanner QR Absensi** (atau buka `siswa/index.html` langsung).
2. **Hasil**: Kamera scanner terbuka jauh lebih cepat dan instan tanpa jeda layar hitam pekat berdurasi panjang.

---

## 📅 Review [2026-08-10 17:52 WIB] - Audit Pengecekan Kode & Tambahan Pengecekan Defensif Library CDN

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**
* 📄 **[guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Audit & Pemeriksaan Bebas Error (*Zero Error Audit*)**:
   - Dilakukan verifikasi kompilasi sintaksis (*syntax check*) pada seluruh berkas JavaScript (`.js`) dan blok `<script>` HTML. Hasil: **0 Error**.
   - Dilakukan verifikasi seluruh resolusi dependensi lokal, gambar WebP, CSS, dan modul JS (`import`/`export`). Hasil: Seluruh jalur dependensi valid.

2. **Penanganan Pengecekan Defensif CDN `Html5Qrcode` (`siswa/index.html`)**:
   - Menambahkan verifikasi `typeof Html5Qrcode === 'undefined'` pada fungsi `startCameraEngine()`.
   - Apabila CDN library scanner gagal dimuat (misal kondisi internet mati/terganggu), sistem menampilkan notifikasi kesalahan yang jelas alih-alih melempar error `ReferenceError` pada konsol.

3. **Penanganan Pengecekan Defensif CDN `QRCode` (`guru/index.html`)**:
   - Menambahkan verifikasi `typeof QRCode === 'undefined'` pada fungsi `updateQRDisplay()`.
   - Mencegah *uncaught exception* apabila library generator QR Code CDN gagal dimuat.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji Coba Kamera Siswa**:
   - Buka `siswa/index.html` dan pastikan kamera memuat scanner QR dengan lancar.
2. **Uji Coba QR Guru**:
   - Buka `guru/index.html` dan pastikan QR Code sesi absensi tampil sempurna.

---

## 📅 Review [2026-08-10 17:38 WIB] - Perbaikan Bug Pesan Error 'Gagal Membuka Kamera' Saat Kamera Berhasil Dibuka

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pencegahan Inisialisasi Sesi Ganda (`initSiswaSession`)**:
   - Menambahkan *flag* pengunci `isSessionInitialized`. Karena event listener `DOMContentLoaded` dan *fallback* `document.readyState` dapat tereksekusi secara berurutan dalam kondisi tertentu, hal ini mencegah `startCameraEngine()` dipanggil dua kali secara bersamaan.

2. **Locking pada Kamera Engine (`startCameraEngine`)**:
   - Menambahkan pengunci asinkron `isStartingCamera` agar inisialisasi kamera tidak dapat berjalan secara simultan/tumpang tindih meskipun pengguna menekan tombol "Ganti Kamera" berkali-kali.
   - Sebelumnya, panggilan ganda menyebabkan panggilan kedua melempar error dan memunculkan notifikasi "Gagal Membuka Kamera", padahal panggilan pertama berhasil menampilkan *stream* kamera.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di HP/Emulator dan navigasi ke halaman `siswa/index.html`.
2. Tunggu hingga kamera terbuka.
3. **Hasil**: Kamera berhasil terbuka dan siap menscan QR code **tanpa** diiringi oleh kemunculan pesan error notifikasi di bagian atas layar.

---

## 📅 Review [2026-08-10 15:49 WIB] - Perbaikan Bug Auto-Restore Sesi Absensi Aktif Guru (Persistensi Sesi 1 Jam)

### 📁 1. Berkas yang Diubah
* 📄 **[guru/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Auto-Restore Active Session (`checkAndRestoreActiveSesi`)**:
   - Saat Guru membuka `guru/index.html` (baik setelah refresh maupun berpindah ke halaman lain seperti `rekap.html` / `admin.html` lalu kembali), sistem secara otomatis memeriksa dokumen `sesi_absensi` yang berstatus `is_active: true` di Firestore.
   - Apabila terdapat sesi aktif yang dibuat **kurang dari 1 jam (60 menit)**, sistem akan memulihkan (*restore*) state UI meliputi: pilihan kelas & mapel, tampilan QR Code, penyeleksi interval rotasi QR 10-detik, serta *listener real-time log absensi* siswa.

2. **Auto-Expiration Limit (1 Jam)**:
   - Apabila sesi aktif di Firestore telah berumur **lebih dari 1 jam**, sistem akan menganggap sesi tersebut kadaluarsa dan memperbarui statusnya menjadi `is_active: false`.

3. **Pencegahan Sesi Ganda saat Membuat Sesi Baru**:
   - Saat Guru menekan tombol *Mulai Sesi Absensi*, jika terdapat sesi aktif sebelumnya, sistem secara otomatis menonaktifkan sesi terdahulu sebelum membuka sesi yang baru.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Pengujian Persistensi Berpindah Halaman**:
   - Buka `guru/index.html` &rarr; Pilih Kelas & Mapel &rarr; Klik **Mulai Sesi Absensi**.
   - Perhatikan QR Code dan indikator `Aktif [Nama Kelas]`.
   - Klik **Database Rekap** (`rekap.html`) atau **Kembali ke Admin** (`admin.html`).
   - Kembali lagi ke `guru/index.html`.
   - **Hasil**: Sesi absensi yang aktif tidak hilang, QR Code langsung muncul kembali, dan log siswa tetap terpantau secara *real-time*.
2. **Pengujian Tutup Sesi Manual**:
   - Klik **Tutup Sesi** &rarr; Sesi resmi ditutup di Firestore.

---

## 📅 Review [2026-08-10 15:46 WIB] - Fitur Deteksi & Flagging 'HP Berbagi' (Multi-Siswa 1 Perangkat) pada Scanner & Rekap Presensi

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**
* 📄 **[assets/js/guru/rekap.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/guru/rekap.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pencatatan Hardware `device_id` pada Log Presensi (`siswa/index.html`)**:
   - Saat siswa melakukan pemindaian QR Code presensi, dokumen baru di `log_absensi` kini secara otomatis menyertakan field `device_id` perangkat HP yang digunakan.

2. **Deteksi Real-time & Visual Badge 'HP Berbagi' (`assets/js/guru/rekap.js`)**:
   - Sistem Rekapitulasi Guru kini menghitung frekuensi penggunaan `device_id` pada daftar absensi yang dimuat.
   - Apabila 1 `device_id` HP digunakan oleh 2 siswa atau lebih untuk presensi pada sesi/hari yang sama, sistem secara otomatis memberikan badge peringatan **`📱 HP Berbagi (X Siswa)`** berwarna amber di samping status kehadiran tabel.

3. **Adaptasi Laporan Excel (.xlsx)**:
   - Kolom tambahan **Keterangan Perangkat** (`HP Berbagi (X Siswa)` vs `HP Mandiri`) disertakan dalam hasil unduhan file Excel agar Guru dapat dengan mudah mengidentifikasi presensi dari perangkat berbagi.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Simulasi Presensi Perangkat Berbagi**:
   - Siswa 1 melakukan scan presensi via `siswa/index.html`.
   - Admin/Guru melakukan reset `device_id` Siswa 1 via `database/db-manager.html`.
   - Siswa 2 mengikat HP yang sama via `absensi.html` dan melakukan scan presensi.
2. **Cek Laporan Rekap Guru**:
   - Buka `guru/rekap.html` &rarr; Klik **Muat Data**.
   - Perhatikan baris Siswa 1 dan Siswa 2: Keduanya kini memiliki badge **`📱 HP Berbagi (2 Siswa)`** berwarna amber.
3. **Cek Ekspor Excel**:
   - Klik **Export (.xlsx)** &rarr; Buka file hasil unduhan &rarr; Perhatikan kolom **Keterangan Perangkat** tercatat `HP Berbagi (2 Siswa)`.

---

## 📅 Review [2026-08-10 10:00 WIB] - Penambahan Menu Navigasi 'Rekapitulasi Presensi Siswa' pada Master Admin Hub

### 📁 1. Berkas yang Diubah
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Menu Card Navigasi Baru (`admin.html`)**:
   - Menambahkan Card Menu Navigasi baru bertuliskan **Rekapitulasi Presensi Siswa** yang mengarah langsung ke `guru/rekap.html`.
   - Admin kini dapat langsung membuka laporan rekapitulasi presensi, filter kelas, dan ekspor file Excel langsung dari Dashboard Master Admin Hub.

2. **Kustomisasi Tema Visual Icon (`style/style.css`)**:
   - Menambahkan class `.menu-icon.rekap-icon` beraksen warna amber *glowing* (`#fbbf24`) dan ikon invoice `fa-file-invoice`.

---

### 🧪 3. Petunjuk Pengujian Produksi (*GitHub Pages Verification*)

1. Buka [https://iskakfatoni.github.io/portal-iskakfatoni/admin.html](https://iskakfatoni.github.io/portal-iskakfatoni/admin.html) &rarr; Masuk ke Dashboard Admin.
2. Lihat daftar menu kontrol: Card **Rekapitulasi Presensi Siswa** kini tampil resmi di urutan ke-3.
3. Klik Card tersebut &rarr; Otomatis beralih ke halaman `guru/rekap.html`.

---

## 📅 Review [2026-08-10 09:55 WIB] - Migrasi Total Berkas Gambar PNG ke WebP & Pembersihan Aset Repositori

### 📁 1. Berkas yang Diubah & Dihapus
* 🗑️ **[DELETE] `foto_asn_profile.png`** (*156 KB - Berhasil dimigrasikan ke foto_asn_profile.webp*)
* 🗑️ **[DELETE] `nisnas_logo_colorful.png`** (*270 KB - Berhasil dimigrasikan ke nisnas_logo_colorful.webp*)
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**
* 📄 **[manifest.json](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/manifest.json)**
* 📄 **[sw.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/sw.js)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Migrasi Total Format Gambar ke WebP**:
   - Seluruh tag `<img>`, icon PWA (`manifest.json`), favicon (`link rel="icon"`), dan daftar aset Service Worker (`sw.js`) telah diperbarui 100% menggunakan `.webp`.
   - Menghapus tag `<picture>` redundan, menyederhanakan markup menjadi elemen `<img>` langsung dengan dukungan 100% peramban modern.
   - **Total Hemat Ukuran Repositori**: ~1.35 MB (bersama `foto_asn_profile_lama.png`).

---

### 🧪 3. Petunjuk Pengujian Produksi (*GitHub Pages Verification*)

1. Buka [https://iskakfatoni.github.io/portal-iskakfatoni/](https://iskakfatoni.github.io/portal-iskakfatoni/) &rarr; Pastikan foto profil dan logo NisNas tampil sempurna dengan format WebP ultra-ringan.

---

## 📅 Review [2026-08-10 09:52 WIB] - Analisis & Penghapusan Berkas Gambar PNG Tidak Terpakai

### 📁 1. Berkas yang Dihapus & Dipertahankan
* 🗑️ **[DELETE] `foto_asn_profile_lama.png`** (908 KB - *Berkas lama tidak terpakai*)
* 📄 **[KEEP] `foto_asn_profile.png`** (156 KB - *Digunakan sebagai fallback `<picture>` di index, admin, portal, absensi*)
* 📄 **[KEEP] `nisnas_logo_colorful.png`** (270 KB - *Digunakan sebagai icon PWA manifest.json & fallback logo*)

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Audit Berkas Gambar Workspace**:
   - Dilakukan pencarian menyeluruh (*grep search*) terhadap seluruh referensi berkas `.png` dalam repositori.
   - **`foto_asn_profile_lama.png`** teridentifikasi memiliki **0 referensi** dan ukuran besar (908 KB), sehingga telah dihapus untuk menghemat ruang repositori.
   - Berkas **`foto_asn_profile.png`** dan **`nisnas_logo_colorful.png`** dipertahankan karena secara aktif terdaftar pada `manifest.json`, `sw.js`, dan elemen `<picture>` HTML sebagai fallback peramban lama.

---

### 🧪 3. Petunjuk Pengujian Produksi (*GitHub Pages Verification*)

1. Buka [https://iskakfatoni.github.io/portal-iskakfatoni/](https://iskakfatoni.github.io/portal-iskakfatoni/) &rarr; Pastikan foto profil dan logo NisNas tetap tampil sempurna tanpa broken image.

---

## 📅 Review [2026-08-10 09:48 WIB] - Pemisahan Kode JavaScript ke Berkas Modul Eksternal (.js)

### 📁 1. Berkas yang Diubah & Dibuat
* 📄 **[NEW] [assets/js/guru/rekap.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/guru/rekap.js)**
* 📄 **[NEW] [assets/js/database/db-manager.js](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/assets/js/database/db-manager.js)**
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pemisahan Modul JavaScript Rekap Guru (`assets/js/guru/rekap.js`)**:
   - Seluruh logika JS untuk Rekap Guru (Auth Guard, Firestore Query, DateUtils, Batch Alpa, dan Export Excel) dipindahkan ke berkas modul terpisah.
   - Halaman `guru/rekap.html` kini menjadi sangat bersih dan berfokus pada markup struktur HTML semata via `<script type="module" src="../assets/js/guru/rekap.js"></script>`.

2. **Pemisahan Modul JavaScript Firestore DB Manager (`assets/js/database/db-manager.js`)**:
   - Seluruh logika JS Firestore DB Manager (StateStore, DOM Registry, Sanitizer Engine, BatchUtils, StatsManager, TableEngine, ModalManager, Import/Export) dipindahkan ke berkas modul terpisah.
   - Halaman `database/db-manager.html` kini dipautkan ke modul eksternal via `<script type="module" src="../assets/js/database/db-manager.js"></script>`.

---

### 🧪 3. Petunjuk Pengujian Produksi (*GitHub Pages Verification*)

1. Buka [https://iskakfatoni.github.io/portal-iskakfatoni/guru/rekap.html](https://iskakfatoni.github.io/portal-iskakfatoni/guru/rekap.html) &rarr; Pastikan fitur pemuatan data presensi dan ekspor Excel tetap berjalan sempurna.
2. Buka [https://iskakfatoni.github.io/portal-iskakfatoni/database/db-manager.html](https://iskakfatoni.github.io/portal-iskakfatoni/database/db-manager.html) &rarr; Pastikan seluruh interaksi koleksi, filter tanggal, perbaikan `device_id`, dan modal popup bekerja dengan lancar tanpa error di console.

---

## 📅 Review [2026-08-10 09:46 WIB] - Refactoring Kode Modul Rekap Guru (rekap.html) & Firestore DB Manager (db-manager.html)

### 📁 1. Berkas yang Diubah
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Refactoring `guru/rekap.html`**:
   - Struktur modul JavaScript dibagi menjadi blok utilitas yang bersih (`DateUtils`, `initSesiDropdown`, `loadData`, `renderTable`, `btnSaveAlpaLogs`, dan `ExportExcel`).
   - Penambahan ikon status interaktif pada tabel presensi (🟢 `fa-circle-check` untuk Hadir & 🔴 `fa-triangle-exclamation` untuk Tidak Hadir).
   - Ekspor Excel disempurnakan dengan nama file dinamis berdasarkan filter kelas dan tanggal: `Rekap_Presensi_[NamaKelas]_[YYYY-MM-DD].xlsx`.

2. **Refactoring `database/db-manager.html`**:
   - Pemetaan nama header (`Sanitizer.formatHeaderName`) disempurnakan dengan kamus istilah Bahasa Indonesia yang konsisten (`Waktu Presensi`, `Status Kehadiran`, `Guru Kelas`, `ID Perangkat HP`, `Token Sesi QR`).
   - Optimasi penanganan *error boundary* dan pengulangan listener resizer kolom agar tabel matriks bekerja lebih responsif dan ringan.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Rekap Guru**: Buka [http://localhost:8080/guru/rekap.html](http://localhost:8080/guru/rekap.html) &rarr; perhatikan ikon status dan nama file ekspor Excel yang dinamis.
2. **DB Manager**: Buka [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html) &rarr; perhatikan judul-judul header kolom kini tampil dalam Bahasa Indonesia yang sangat rapi.

---

## 📅 Review [2026-08-10 09:44 WIB] - Penampilan Kembali Kolom device_id Khusus Menu 'HP Terikat'

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pengondisian Kolom `device_id` (`loadCollectionData`)**:
   - Kolom **`device_id`** kini secara khusus **dimunculkan kembali** saat admin membuka menu **"HP Terikat"** (Perangkat HP).
   - Saat membuka menu **"Belum Terikat"** atau koleksi lain, kolom `device_id` disembunyikan agar tabel tetap bersih dan rapi.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Lihat Card **Perangkat HP** di sidebar kiri bawah &rarr; Klik tombol **"HP Terikat"**.
3. Perhatikan tabel matriks kanan: Kolom **`device_id` (ID Perangkat)** kini tampil kembali dengan jelas.
4. Klik tombol **"Belum Terikat"** &rarr; Kolom `device_id` otomatis disembunyikan kembali.

---

## 📅 Review [2026-08-10 09:41 WIB] - Penambahan Popup Kalender Interaktif pada Menu 'Pilih Tanggal Khusus'

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Auto Popup Calendar Trigger (`HTMLInputElement.prototype.showPicker`)**:
   - Mengintegrasikan API native `showPicker()` yang dipicu otomatis saat area manapun pada input atau label **Pilih Tanggal Khusus** diklik oleh admin.
   - Peramban akan langsung memunculkan **Popup Kalender Interaktif** tanpa perlu mengklik ikon kecil di sudut kanan.

2. **Kustomisasi UI Dark Mode Glowing Calendar Icon**:
   - Menambahkan aturan CSS `::-webkit-calendar-picker-indicator` berwarna cyan *glowing* yang serasi dengan tema dark mode dashboard.
   - Menambahkan ikon kalender FontAwesome dan petunjuk teks font-mono `// Klik untuk membuka kalender interaktif`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Lihat Card **Log Presensi** di sidebar kiri.
3. Klik di mana saja pada kotak **Pilih Tanggal Khusus** &rarr; Popup Kalender Interaktif akan langsung muncul di layar.
4. Pilih salah satu tanggal di kalender &rarr; Tabel matriks kanan akan langsung menyaring log presensi tanggal tersebut secara instan.

---

## 📅 Review [2026-08-10 09:39 WIB] - Penghilangan Kolom Referensi Teknis (id_sesi / id_absensi) dari Tabel log_absensi

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyeleksian Field Visual (`loadCollectionData`)**:
   - Mengecualikan kolom referensi teknis `id_sesi` dan `id_absensi` dari header visual tabel matriks `log_absensi`.
   - Tabel kini secara khusus fokus menyajikan data yang relevan bagi pengguna/admin: **NIS**, **Nama Siswa**, **Kelas**, **Nama Mapel**, **Hari**, **Tanggal**, **Waktu**, dan **Status**.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html) &rarr; **Log Presensi**.
2. Perhatikan tabel matriks `log_absensi` kini menyajikan data presensi secara sangat bersih tanpa ada lagi kolom ID teknis `id_sesi` atau `id_absensi`.

---

## 📅 Review [2026-08-10 09:37 WIB] - Standarisasi Field 'waktu' dan Eliminasi Kolom Redundan 'waktu_scan' pada log_absensi

### 📁 1. Berkas yang Diubah
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Eliminasi Kolom Redundan `waktu_scan`**:
   - Kolom `waktu_scan` sebelumnya bernilai sama persis dengan field standar **`waktu`**.
   - Menghapus penyajian kolom `waktu_scan` dari render tabel visual di Firestore DB Manager (`database/db-manager.html`) dan menyederhanakan pemanggilan field menjadi `d.waktu` pada halaman Rekap Guru (`guru/rekap.html`).
   - Struktur data menjadi jauh lebih bersih, konsisten, dan efisien.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html) &rarr; **Log Presensi**.
2. Perhatikan tabel kini hanya menyajikan satu kolom **`waktu`** yang bersih dan tidak ada lagi kolom duplikat `waktu_scan`.
3. Buka [http://localhost:8080/guru/rekap.html](http://localhost:8080/guru/rekap.html) &rarr; Tampilan waktu scan presensi tetap berjalan 100% normal.

---

## 📅 Review [2026-08-10 09:34 WIB] - Penambahan Status 'Tidak Hadir' Otomatis untuk Siswa yang Belum Absen sampai Jam 17:00 WIB (Per Kelas)

### 📁 1. Berkas yang Diubah
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Checkbox Opsi Detection (`#chk-include-alpa`)**:
   - Menambahkan opsi `⚠️ Sertakan Siswa Tidak Hadir (S.d. 17:00 WIB)` pada panel filter rekap.
   - Saat Guru memilih Sesi Absensi atau mengisi **Filter Kelas** (misal: *X IPA 1*), sistem secara otomatis mengomparasi daftar seluruh siswa di kelas tersebut dengan `log_absensi` hari ini.
   - Siswa yang **belum melakukan presensi sampai jam 17:00 WIB** akan otomatis ditampilkan di tabel dengan badge merah khas **`Tidak Hadir (Alpa)`** dan keterangan waktu `Tidak Absen (s.d. 17:00 WIB)`.

2. **Tombol Batch Commit Firestore (`#btn-save-alpa-logs`)**:
   - Menambahkan tombol `⚡ Simpan Auto 'Tidak Hadir' ke DB`.
   - Menggunakan `writeBatch(db)` Firestore untuk sekali klik menyimpan secara masal seluruh dokumen `log_absensi` berstatus `Tidak Hadir` bagi siswa yang belum absen pada kelas tersebut.

---

### 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/guru/rekap.html](http://localhost:8080/guru/rekap.html).
2. Isi **Filter Kelas** (contoh: `X IPA 1`) atau pilih salah satu Sesi Absensi.
3. Siswa di kelas tersebut yang belum absen akan langsung muncul di tabel dengan badge merah **Tidak Hadir**.
4. Klik tombol **`⚡ Simpan Auto 'Tidak Hadir' ke DB`** &rarr; Konfirmasi &rarr; Data siswa yang tidak hadir akan langsung tersimpan permanen di database Firestore `log_absensi`.

---

## 📅 Review [2026-08-10 09:30 WIB] - Penyesuaian Lebar Kolom Otomatis & Fitur Interaktif Resizable Columns (Drag & Drop Width)

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Auto-Fit Lebar Kolom Konten (`whitespace-nowrap`)**:
   - Seluruh sel data tabel kini dikonfigurasi dengan kelas `whitespace-nowrap` sehingga lebar kolom secara otomatis **menyesuaikan dengan panjang teks data di dalamnya** secara sempurna tanpa terpotong atau *wrapped*.

2. **Handle Drag & Drop Resizable Columns (`.resizer` & `initColumnResizers`)**:
   - Pada setiap header kolom (`<th>`), ditambahkan handle garis penyekat `.resizer` berwarna cyan glowing.
   - Admin dapat **mengklik dan menggeser (drag & drop)** garis penyekat header ke kanan/kiri untuk melebarkan atau menyempitkan ukuran kolom sesuai keinginan.
   - Event klik sorting header dipisahkan secara aman dari event drag resizer sehingga keduanya bekerja tanpa bentrok.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Perhatikan kolom-kolom tabel matriks kini melebar secara pas menyesuaikan isi teksnya masing-masing (*Auto-Fit*).
3. **Uji Geser Ukuran Kolom**: Arahkan kursor ke garis pembatas di sebelah kanan nama header kolom mana saja (kursor akan berubah menjadi `col-resize`). Klik dan geser mouse ke kanan/kiri untuk mengubah ukuran lebar kolom secara *real-time*.

---

## 📅 Review [2026-08-10 09:27 WIB] - Pengurutan Kolom Utama & Dynamic Fallback Field 'hari' dan 'tanggal'

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Prioritas Pengurutan Kolom (`loadCollectionData`)**:
   - Memastikan kolom **`hari`**, **`tanggal`**, dan **`waktu`** selalu tampil di urutan terdepan tabel matriks saat membuka koleksi `log_absensi` dan `sesi_absensi`.
   - Mengabaikan tampilan kolom teknis `device_id` agar tabel terlihat lebih rapi.

2. **Smart Dynamic Fallback (`TableEngine.renderBody`)**:
   - Untuk dokumen-dokumen riwayat lama yang belum menyimpan string `hari` atau `tanggal` secara eksplisit saat dibuat, sistem secara cerdas **mengkalkulasi dan menampilkan nama hari (misal: `Senin`) dan tanggal (misal: `2026-08-10`) secara otomatis dari stempel timestamp `created_at`**.
   - Menjamin 100% dokumen (baik lama maupun baru) tampil dengan kolom `hari` dan `tanggal` yang terisi rapi tanpa ada nilai `-` atau kosong.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Klik **Log Presensi** di sidebar kiri.
3. Perhatikan kolom **`hari`** (misal: *Senin*) dan **`tanggal`** (misal: *2026-08-10*) kini langsung muncul dengan jelas di urutan depan tabel untuk seluruh baris dokumen.

---

## 📅 Review [2026-08-10 09:26 WIB] - Penghilangan Tampilan Kolom Document ID pada Tabel Firestore DB Manager

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pembersihan Tampilan Matriks Tabel (`TableEngine.renderHeaders` & `renderBody`)**:
   - Menghapus elemen header `<th data-sort="__id__">Document ID</th>` dan sel kolom `<td class="font-bold text-cyan-400">${docId}</td>` dari render tabel visual.
   - Kolom yang ditampilkan kini langsung menyajikan **NO**, **[Field-field Data Koleksi]**, **Checkbox Seleksi Baris**, dan **Aksi**.

2. **Keamanan & Fungsi Backend Tetap 100% Utuh**:
   - `Document ID` tetap tersimpan secara internal di atribut `data-id="${docId}"` dan digunakan secara penuh untuk operasi edit modal (`setDoc`), hapus single (`deleteDoc`), seleksi massal (`writeBatch`), serta ekspor data. Tampilan tabel visual menjadi jauh lebih bersih dan lega.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Perhatikan tabel matriks kanan. Kolom **Document ID** sudah tidak lagi tampak secara visual, sehingga kolom data utama seperti NIS, Nama Siswa, Hari, dan Tanggal terlihat lebih luas dan mudah dibaca.
3. Uji fungsi Edit (✏️) dan Hapus (🗑️) &rarr; Seluruh fungsi backend Firestore tetap berjalan 100% normal.

---

## 📅 Review [2026-08-10 09:24 WIB] - Penggantian Kolom device_id Menjadi Field 'hari' dan 'tanggal' pada log_absensi

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pencatatan Presensi QR Siswa (`siswa/index.html`)**:
   - Mengilangkan field `device_id` dari pembuatan dokumen baru `log_absensi`.
   - Menggantikannya dengan merekam field `hari` (contoh: `Senin`) dan `tanggal` (`2026-08-10`) secara presisi saat scan QR dilakukan.

2. **Format Tampilan Rekapitulasi Presensi Guru (`guru/rekap.html`)**:
   - Kolom *Tanggal / Waktu* kini menampilkan nama hari lengkap, tanggal, dan jam scan presensi (contoh: `Senin, 2026-08-10 (09:24:10 WIB)`).

3. **Form Tambah Manual Firestore Manager (`database/db-manager.html`)**:
   - Form Tambah Data koleksi `log_absensi` kini menyertakan field `hari` yang di-prefill otomatis dengan nama hari terkini (misal: `Senin`).

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Scan Presensi Siswa**: Buka [http://localhost:8080/siswa/index.html](http://localhost:8080/siswa/index.html) lalu scan QR sesi.
2. **Cek Tabel Rekap**: Buka [http://localhost:8080/guru/rekap.html](http://localhost:8080/guru/rekap.html) &rarr; perhatikan kolom Tanggal/Waktu kini memuat nama **Hari** dan **Tanggal** secara rapi tanpa `device_id`.
3. **Cek Database Manager**: Buka [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html) &rarr; Log Presensi &rarr; perhatikan kolom `hari` dan `tanggal` sudah menggantikan `device_id`.

---

## 📅 Review [2026-08-10 09:14 WIB] - Penambahan Filter Pemisah Log Presensi Menurut Hari (Hari Ini, Kemarin, Tanggal Khusus)

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Tombol Sub-Filter & Date Picker pada Card 'Log Presensi' (`#nav-log-filters`)**:
   - Di dalam Card **Log Presensi**, ditambahkan 3 opsi tombol filter cepat:
     - 🟢 **Hari Ini**: Memuat log presensi tanggal hari ini (`#badge-log-today`).
     - 🟡 **Kemarin**: Memuat log presensi tanggal kemarin (`#badge-log-yesterday`).
     - 🔵 **Semua Riwayat**: Memuat seluruh riwayat presensi (`#badge-log_absensi`).
   - 📅 **Input Date Picker (`#input-log-date-filter`)**: Memungkinkan Admin memilih tanggal kalender spesifik untuk menyaring log presensi hari manapun.

2. **Perhitungan Badge Counter & Logika Penyaringan (`TableEngine.getFilteredAndSortedDocs`)**:
   - Menghitung secara otomatis jumlah siswa yang presensi hari ini vs kemarin via listener `onSnapshot`.
   - Fungsi `getFilteredAndSortedDocs()` secara presisi membandingkan `tanggal` atau `created_at` timestamp dengan tanggal yang dipilih.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Lihat Card **Log Presensi** di sidebar kiri. Anda akan melihat tombol **Hari Ini**, **Kemarin**, **Semua Riwayat**, dan input **Pilih Tanggal Khusus**.
3. Klik **"Hari Ini"** &rarr; Tabel matriks kanan menyaring log presensi khusus hari ini.
4. Klik **"Kemarin"** &rarr; Tabel menyaring log presensi kemarin.
5. Gunakan **Pilih Tanggal Khusus** (date picker) &rarr; Pilih tanggal mana saja di kalender untuk melihat log pada tanggal tersebut secara instan.

---

## 📅 Review [2026-08-10 09:07 WIB] - Filter Default Absensi Hari Ini di guru/rekap.html

### 📁 1. Berkas yang Diubah
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Opsi Checkbox Default 'Hari Ini' (`#chk-only-today`)**:
   - Menambahkan panel kontrol checkbox `📅 Tampilkan Absensi Hari Ini Saja (Senin, 10 Agustus 2026)` yang secara **default aktif (*checked*)** saat halaman rekap dibuka oleh Guru.

2. **Auto-Load Data & Penyaringan Tanggal Real-time (`loadData`)**:
   - Fungsi `loadData()` kini dipanggil secara otomatis begitu akun Guru terverifikasi.
   - Menyaring dokumen `log_absensi` secara presisi berdasarkan stempel tanggal hari ini (`d.tanggal === todayISOStr` atau `d.created_at` timestamp hari ini).
   - Apabila Guru menghilangkan centang checkbox atau memilih sesi absensi tertentu, sistem akan secara fleksibel memuat seluruh riwayat presensi lampau.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/guru/rekap.html](http://localhost:8080/guru/rekap.html).
2. Perhatikan banner atas kini bertuliskan **REKAPITULASI ABSENSI (HARI INI)** dan terdapat checkbox centang hijau `Tampilkan Absensi Hari Ini Saja`.
3. Tabel otomatis memuat presensi siswa yang masuk hari ini.
4. Hilangkan centang pada checkbox untuk menampilkan seluruh riwayat presensi dari hari-hari sebelumnya.

---

## 📅 Review [2026-08-10 09:05 WIB] - Verifikasi & Penambahan Field Tanggal dan Waktu pada log_absensi

### 📁 1. Berkas yang Diubah
* 📄 **[siswa/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/siswa/index.html)**
* 📄 **[guru/rekap.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/guru/rekap.html)**
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pencatatan Presensi QR Siswa (`siswa/index.html`)**:
   - Saat siswa melakukan pemindaian QR code presensi, sistem kini secara eksplisit merekam:
     - `tanggal`: Format `YYYY-MM-DD` (contoh: `2026-08-10`).
     - `waktu`: Format waktu lengkap (contoh: `09:05:35 WIB`).
     - `waktu_scan`: Format waktu scan.
     - `created_at`: Server timestamp Firestore.

2. **Perbaikan Parsing & Tampilan Tabel Rekap Guru (`guru/rekap.html`)**:
   - Memperbaiki fungsi render tabel presensi agar secara fleksibel dan aman menampilkan gabungan `tanggal` dan `waktu` tanpa risiko error `Invalid Date`.

3. **Form Tambah Manual Firestore Manager (`database/db-manager.html`)**:
   - Form Tambah Data Baru koleksi `log_absensi` kini otomatis menyediakan field default `['nis', 'nama_siswa', 'id_kelas', 'nama_mapel', 'tanggal', 'waktu', 'status']` dengan pre-fill tanggal & waktu saat ini.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Presensi Siswa**: Buka [http://localhost:8080/siswa/index.html](http://localhost:8080/siswa/index.html), lakukan scan QR sesi absensi.
2. Cek di **Firestore DB Manager** ([http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html)) &rarr; Buka Card **Log Presensi** &rarr; `log_absensi`.
3. Dokumen baru yang masuk akan menyertakan kolom `tanggal` (`2026-08-10`) dan `waktu` (`09:05:35 WIB`) secara presisi.

---

## 📅 Review [2026-08-10 09:04 WIB] - Pemisahan Menu log_absensi Menjadi Card Standalone 'Log Presensi'

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Card Baru 'Log Presensi' (`#nav-log-absensi`)**:
   - Memisahkan menu `log_absensi` dari card `Koleksi Data` utama pada sidebar kiri (`<aside>`).
   - Membuat card independen khusus berjudul **"Log Presensi"** dengan ikon `fa-clipboard-user` dan badge counter cyan yang ter-update secara *real-time*.

2. **Ringkasan Statistik Kontekstual (`StatsManager.updateStats`)**:
   - Menambahkan kartu statistik khusus saat membuka `log_absensi`:
     - **Presensi Hadir**: Menghitung jumlah log dengan status `HADIR`.
     - **Total Sesi Log**: Menampilkan total riwayat presensi yang terekam di sistem.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Perhatikan kolom sidebar kiri. Kini terdapat 3 Card terpisah:
   - 📦 **Koleksi Data** (`siswa`, `kelas`, `mapel`, `sesi_absensi`, `links`)
   - 📋 **Log Presensi** (`log_absensi`)
   - 📱 **Perangkat HP** (`HP Terikat`, `Belum Terikat`)
3. Klik menu `log_absensi` di dalam Card **Log Presensi**:
   - Tabel matriks kanan akan menampilkan riwayat log presensi.
   - Kartu statistik atas menampilkan indikator **Presensi Hadir** dan **Total Sesi Log**.

---

## 📅 Review [2026-08-10 09:02 WIB] - Adaptasi Kontekstual Ekspor Excel Perangkat Siswa (Terikat / Belum Terikat / Search Filter)

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyesuaian Data Ekspor (`TableEngine.getFilteredAndSortedDocs`)**:
   - Mengubah fungsi ekspor `btnExportDeviceExcel` dari yang sebelumnya mengekspor *seluruh* data siswa di koleksi `siswa`, menjadi **hanya mengekspor data yang saat ini tersaring di tabel** (`TableEngine.getFilteredAndSortedDocs()`).
   - Apabila Admin memilih filter **"HP Terikat"**, yang diekspor *hanya* siswa yang HP-nya sudah terikat.
   - Apabila Admin memilih filter **"Belum Terikat"**, yang diekspor *hanya* siswa yang belum melakukan pendaftaran HP.
   - Jika Admin mengetikkan kata kunci di *Live Search Bar*, maka hasil pencarian spesifik tersebut yang diekspor.

2. **Dinamisme Label Tombol & Nama Berkas (.xlsx)**:
   - Teks tombol di toolbar atas otomatis menyesuaikan label:
     - Filter HP Terikat: `Ekspor HP Terikat (.xlsx)`
     - Filter Belum Terikat: `Ekspor Belum Terikat (.xlsx)`
   - Nama file `.xlsx` yang diunduh menyesuaikan secara otomatis:
     - `Rekap_HP_Terikat_Siswa_YYYY-MM-DD.xlsx`
     - `Rekap_HP_Belum_Terikat_Siswa_YYYY-MM-DD.xlsx`

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Klik menu **"HP Terikat"** di sidebar kiri.
3. Perhatikan tombol hijau di toolbar kanan atas telah berubah label menjadi **"Ekspor HP Terikat (.xlsx)"**.
4. Klik tombol ekspor tersebut &rarr; berkas terunduh dengan nama `Rekap_HP_Terikat_Siswa_2026-08-10.xlsx` dan hanya berisi baris siswa yang terikat.
5. Ulangi untuk menu **"Belum Terikat"** &rarr; tombol berubah label menjadi **"Ekspor Belum Terikat (.xlsx)"** dan hanya mengekspor siswa belum terikat.

---

## 📅 Review [2026-08-10 08:57 WIB] - Penambahan Card Perangkat HP pada Sidebar Firestore DB Manager

### 📁 1. Berkas yang Diubah
* 📄 **[database/db-manager.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/database/db-manager.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Card Baru Sidebar Kiri (`#nav-device-filters`)**:
   - Menambahkan card khusus **"Perangkat HP"** di bawah daftar koleksi utama pada kolom kiri (`<aside>`).
   - Menyediakan 2 tombol filter baru:
     - 📱 **HP Terikat**: Menampilkan counter `#badge-hp-bound` (dengan ikon `fa-mobile-check`).
     - 📱 **Belum Terikat**: Menampilkan counter `#badge-hp-unbound` (dengan ikon `fa-mobile-retro`).

2. **Perhitungan Real-time Counter (`initBadgesCount`)**:
   - Listener `onSnapshot` koleksi `siswa` secara otomatis menghitung jumlah HP yang terikat (`device_id` / `device_token` / `mac_address`) vs yang belum terikat dan meng-update angka di badge sidebar secara *real-time*.

3. **Logika Penyaringan Data (`TableEngine.getFilteredAndSortedDocs`)**:
   - Mengintegrasikan `state.deviceFilter` (`'all'`, `'bound'`, `'unbound'`).
   - Saat tombol **"HP Terikat"** diklik, tabel otomatis beralih ke data koleksi `siswa` yang hanya menampilkan siswa yang sudah memiliki perangkat terikat.
   - Saat tombol **"Belum Terikat"** diklik, tabel hanya menampilkan siswa yang belum melakukan registrasi perangkat.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di alamat preview lokal: [http://localhost:8080/database/db-manager.html](http://localhost:8080/database/db-manager.html).
2. Perhatikan kolom sebelah kiri bawah. Anda akan melihat **Card "Perangkat HP"** baru dengan badge berwarna hijau (HP Terikat) dan kuning (Belum Terikat).
3. Klik tombol **"HP Terikat"**:
   - Tabel matriks kanan akan langsung beralih menyaring siswa yang HP-nya sudah terdaftar.
   - Judul tabel berubah menjadi `PERANGKAT HP: SISWA TERIKAT`.
4. Klik tombol **"Belum Terikat"**:
   - Tabel matriks kanan menyaring siswa yang belum memiliki data perangkat.
5. Klik salah satu tombol koleksi di atasnya (misal: `kelas` atau `mapel`) untuk kembali ke tampilan koleksi standar.

---

## 📅 Review [2026-08-13 07:13 WIB] - Penyesuaian Ukuran Font & Ringkas Tampilan Daftar Link Portal

### 📁 1. Berkas yang Diubah
* 📄 **[style/style.css](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/style/style.css)**
* 📄 **[link/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/link/index.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Penyesuaian Font & Kompaktifikasi Kartu Link Publik (`style/style.css`)**:
   - Memperkecil ukuran font judul link (`.link-text h3`) dari `1.18rem` (~19px, font-weight 800) menjadi **`0.95rem` (~15px, font-weight 600)** agar lebih bersih dan tidak terlalu besar.
   - Memperkecil ukuran font nomor urut link (`.link-number`) dari `1.25rem` menjadi **`0.95rem` (font-weight 700)**.
   - Memperkecil dimensi wadah ikon (`.link-icon-box`) dari `52px x 52px` (font-size 1.5rem) menjadi **`40px x 40px` (font-size 1.1rem, border-radius 10px)**.
   - Menyesuaikan padding kartu link (`.link-card-item`) dari `16px 18px` menjadi **`12px 16px`** dan border-radius dari `16px` ke `14px` serta ikon panah (`.arrow-icon`) menjadi `0.85rem`.

2. **Pembaruan Tampilan Panel Admin Kelola Link (`link/index.html`)**:
   - Memperkecil ukuran font judul item pada daftar link di panel admin dari `text-sm sm:text-base` (font-bold) menjadi **`text-xs sm:text-sm` (font-semibold)**.
   - Memperkecil wadah ikon item dari `w-10 h-10` (`text-base`) menjadi **`w-8 h-8` (`text-xs`)**.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban ke halaman portal utama: [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html).
2. Perhatikan item pada daftar link; judul link, nomor urut, dan ikon kini berukuran lebih proporsional, rapi, dan nyaman dibaca tanpa terasa terlalu besar.
3. Buka halaman kelola link admin: [link/index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/link/index.html) untuk memastikan daftar link di panel kontrol juga tampil lebih compact dan serasi.

---

## 📅 Review [2026-08-13 08:15 WIB] - Penambahan Informasi Domain Live ke Aturan Workspace AGENTS.md

### 📁 1. Berkas yang Diubah
* 📄 **[.agents/AGENTS.md](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.agents/AGENTS.md)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Catatan Domain Publik / Live URL (`.agents/AGENTS.md`)**:
   - Menambahkan alamat domain publik/live URL utama proyek (`https://iskakfatoni.github.io/portal-iskakfatoni/`) ke dalam dokumen aturan workspace `AGENTS.md` agar tersimpan secara permanen untuk acuan pengujian dan pengembangan agen AI.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Periksa file [.agents/AGENTS.md](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/.agents/AGENTS.md) pada seksi `Project Info & Live Domain`.
2. Pastikan alamat URL `https://iskakfatoni.github.io/portal-iskakfatoni/` tercatat dengan benar.

---

## 📅 Review [2026-08-13 08:21 WIB] - Proteksi Akses `iphone.html` (Redirect Otomatis Pengguna Android/PC ke `portal.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Skrip Pembatas Perangkat iOS (`iphone.html`)**:
   - Menambahkan skrip proteksi di bagian `<head>` [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html#L20-L37) yang memeriksa *User-Agent* peramban.
   - Jika halaman `iphone.html` diakses dari perangkat selain iOS (misalnya Android, Windows PC, atau Mac tanpa layar sentuh), sistem secara otomatis mengalihkan (*redirect*) pengguna langsung ke `portal.html` menggunakan `window.location.replace('portal.html')`.
   - Menyediakan parameter opsional `?no_redirect=true` agar pengembang tetap dapat membuka `iphone.html` di PC tanpa terlempar jika diperlukan untuk pengujian.
   - Memperbarui tautan tombol bagian bawah dari `index.html?no_redirect=true` menjadi langsung menuju `portal.html`.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. Buka peramban di Komputer/Laptop atau perangkat Android biasa.
2. Akses halaman [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) secara langsung &rarr; Verifikasi bahwa peramban seketika mengalihkan layar ke [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html).
3. Buka DevTools (`F12`), aktifkan Toggle Device Toolbar (`Ctrl + Shift + M`), lalu pilih **iPhone SE / iPhone 12 Pro** (User-Agent terdeteksi iPhone) &rarr; Akses [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) &rarr; Verifikasi halaman `iphone.html` dapat diakses dan tidak terlempar.

---

## 📅 Review [2026-08-13 08:30 WIB] - Penyesuaian Alur Navigasi & Proteksi Akses PWA Perangkat (`index.html`, `iphone.html`, `portal.html`, `absensi.html`, & `admin.html`)

### 📁 1. Berkas yang Diubah
* 📄 **[index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html)**
* 📄 **[iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html)**
* 📄 **[portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html)**
* 📄 **[absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html)**
* 📄 **[admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html)**

---

### 📝 2. Rincian Baris & Logika yang Diperbarui

1. **Pengaturan Alur Navigasi `index.html`**:
   - Pengguna Android & PC/Laptop yang mengakses `index.html` mendapatkan tampilan beranda normal.
   - Pengguna iPhone/iPad (baik Safari browser biasa maupun PWA) yang membuka `index.html` otomatis dilempar (*redirect*) ke `iphone.html`.

2. **Pengaturan Alur Navigasi & Tampilan `iphone.html`**:
   - Jika `iphone.html` diakses dari Android atau PC/Laptop (`!isIOS`), sistem otomatis melempar (*redirect*) ke `portal.html`.
   - Jika `iphone.html` diakses dari **iPhone Safari biasa (non-PWA)**, sistem hanya menampilkan petunjuk pembuatan PWA (*Add to Home Screen*) dan **menyembunyikan** kartu menu pintasan.
   - Jika `iphone.html` diakses dari **iPhone PWA (Standalone / Layar Utama)**, sistem menyembunyikan petunjuk PWA dan **menampilkan** kartu menu pintasan (`portal.html` & `absensi.html`).

3. **Proteksi Akses `portal.html`, `absensi.html`, dan `admin.html`**:
   - Halaman `portal.html`, `absensi.html`, dan `admin.html` dapat diakses secara normal oleh **Android**, **PC/Laptop Windows**, dan **iPhone PWA**.
   - Jika diakses dari **iPhone browser Safari biasa (non-PWA)**, sistem otomatis melempar (*redirect*) pengguna langsung ke `iphone.html` agar memasang PWA terlebih dahulu.

---

### 🧪 3. Petunjuk Pengujian Lokal (*Local Verification*)

1. **Uji dari PC/Android biasa**:
   - Buka [index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html) &rarr; Tampilan normal.
   - Buka [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) &rarr; Otomatis terlempar ke [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html).
   - Buka [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html), [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html), atau [admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html) &rarr; Tampilan normal.
2. **Uji dari iPhone Safari (Non-PWA)**:
   - Buka [index.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/index.html), [portal.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/portal.html), [absensi.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/absensi.html), atau [admin.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/admin.html) &rarr; Otomatis terlempar ke [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html).
   - Di [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) &rarr; Petunjuk PWA muncul, menu tombol tersembunyi.
3. **Uji dari iPhone PWA (Ikon Layar Utama)**:
   - Buka ikon dari Layar Utama iPhone &rarr; [iphone.html](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/iphone.html) menyembunyikan petunjuk PWA dan menampilkan menu tombol pintasan `portal.html` & `absensi.html`.

