# 📋 Review Perubahan Kode Lokal - Portal Iskak Fatoni

Dokumen ini berisi rangkuman review perubahan kode (*code review*) terbaru yang telah diterapkan pada workspace lokal.

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
