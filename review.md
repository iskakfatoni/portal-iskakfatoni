# 📋 Review Perubahan Kode Lokal - Portal Iskak Fatoni

Dokumen ini berisi rangkuman review perubahan kode (*code review*) terbaru yang telah diterapkan pada workspace lokal.

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
