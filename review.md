# 📋 Review Perubahan Kode Lokal - Portal Iskak Fatoni

Dokumen ini berisi rangkuman review perubahan kode (*code review*) terbaru yang telah diterapkan pada workspace lokal.

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
