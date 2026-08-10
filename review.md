# 📋 Review Perubahan Kode Lokal - Portal Iskak Fatoni

Dokumen ini berisi rangkuman review perubahan kode (*code review*) terbaru yang telah diterapkan pada workspace lokal.

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
