# 🤖 Rencana Implementasi: AI Attendance Insight & Deteksi Anomali Presensi Siswa
**Portal Iskak Fatoni - Dashboard Super Admin**  
*Dokumen Rencana Arsitektur & Spesifikasi Teknis*  
*Tanggal: 2026-08-20*

---

## 🎯 1. Latar Belakang & Tujuan Fitur

Data pada Firestore saat ini telah tercatat secara rapi dan terstruktur:
* `system_logs`: Merekam seluruh jejak reset HP, NIS, nama siswa, admin eksekutor, ID hardware perangkat lama, dan stempel waktu kejadian.
* `log_absensi`: Merekam data presensi harian, NIS, nama siswa, kelas, mata pelajaran, tanggal, jam scan, status (Hadir / Tidak Hadir), dan hardware device ID.
* `sesi_absensi`: Merekam waktu buka dan tutup sesi presensi oleh guru, durasi sesi, dan token rotasi QR.
* `siswa`: Merekam profil siswa, NIS, nama, rombel kelas, sekolah, dan binding perangkat HP aktif.

**Tujuan**: Membangun modul analitik **AI Attendance Insight & Deteksi Anomali** yang secara otomatis mengidentifikasi pola ketidakdisiplinan, indikasi titip absen/kecurangan perangkat, serta pola keterlambatan presensi sebelum menjadi masalah yang lebih besar.

---

## 🧠 2. Matriks Algoritma Deteksi Anomali

Sistem dirancang menggunakan **Client-Side Pattern Recognition Engine** yang efisien, tanpa dependensi server eksternal, dan bebas biaya API:

| No | Kategori Anomali | Indikator & Ambang Batas (*Threshold*) | Tingkat Risiko | Dampak / Potensi Isu |
| :--- | :--- | :--- | :---: | :--- |
| **1** | 📱 **Frequent Device Switching (Gonta-ganti HP)** | Terdeteksi $\ge 2\text{ kali}$ reset HP dalam 7 hari terakhir, atau $\ge 3\text{ kali}$ dalam 30 hari di `system_logs`. | 🔴 **HIGH RISK** | Indikasi titip absen, pinjam HP teman bergantian, atau penyalahgunaan akun NIS. |
| **2** | ⏱️ **Chronic Last-Minute Attendance (Absen Menit Terakhir)** | Siswa scan $\ge 3\text{ kali}$ pada 5–10 menit terakhir sebelum batas waktu sesi ditutup (contoh: menit ke-55 s.d. 60). | 🟡 **MEDIUM RISK** | Indikasi sering terlambat masuk kelas atau kebiasaan menunda presensi. |
| **3** | 👥 **Shared Device Collision (1 HP Banyak Siswa)** | 1 `device_id` yang sama digunakan oleh $\ge 2$ siswa berbeda untuk presensi pada hari yang sama. | 🔴 **HIGH RISK** | Indikasi satu HP dibawa ke sekolah untuk mengabsenkan siswa lain. |
| **4** | 📉 **Chronic Absenteeism (Tren Alpa Beruntun)** | Siswa tercatat `Tidak Hadir` $\ge 3\text{ sesi}$ berturut-turut atau rasio kehadiran bulanan $< 75\%$. | 🔴 **HIGH RISK** | Indikasi potensi masalah kehadiran serius yang memerlukan intervensi Wali Kelas / BK. |
| **5** | ⚡ **Early Bird (Kedisiplinan Tinggi)** | Siswa yang selalu scan dalam 5 menit pertama pembukaan sesi presensi ($\ge 90\%$ sesi). | 🟢 **POSITIF** | Identifikasi siswa teladan untuk apresiasi kedisiplinan. |

---

## 🖥️ 3. Rancangan Antarmuka Pengguna (*UI/UX Design*)

### A. Lokasi Panel
1. **`database/system-logs.html`**:
   - Ditempatkan di bagian atas tabel log audit sebagai panel radar cerdas (*Cyber-Security Anomaly Radar*).
2. **`database/db-manager.html`**:
   - Mengaktifkan kontainer `#analytics-panel` dan `#analytics-insights` yang terintegrasi dengan filter koleksi aktif.

### B. Komponen Antarmuka yang Dirancang
1. **Radar Status Header**:
   - Badge status: `🤖 AI Insight Engine: Active & Analyzing`.
2. **4 Kartu Metrik Ringkasan Cepat**:
   - 🚨 *Total Anomali Terdeteksi*
   - 🔴 *Kasus Risiko Tinggi (Perlu Tindakan)*
   - 📱 *Siswa Sering Reset HP*
   - ⏱️ *Pola Presensi Menit Terakhir*
3. **Filter Kategori Anomali Tab**:
   - `Semua Anomali` | `Reset HP Berulang` | `Menit Terakhir` | `Device Sharing` | `Alpa Kronis`
4. **Daftar Kartu Temuan Anomali (*Insight Finding Cards*)**:
   - **Header**: Badge Keparahan (`🔴 HIGH RISK` / `🟡 MEDIUM RISK`), Nama Siswa, NIS, Rombel Kelas, & Sekolah.
   - **Narasi Penjelasan Alami (*AI Summary*)**: Contoh: *"Siswa M. Rizky terdeteksi melakukan reset perangkat sebanyak 4 kali dalam 5 hari terakhir dengan 3 hardware ID berbeda."*
   - **Bukti Data (*Audit Evidence*)**: Daftar riwayat stempel waktu kejadian, nama admin pengeksekusi, atau jam scan relatif terhadap sesi.
   - **Tombol Aksi Cepat**:
     - 🔍 *Filter Log Siswa Ini*: Otomatis memfilter tabel audit log untuk NIS siswa terkait.
     - 📋 *Salin Ringkasan Kasus*: Menyalin teks laporan formal siap dikirim ke WhatsApp Wali Kelas / Guru BK.
5. **Ekspor Laporan Anomali Excel (`.xlsx`)**:
   - Tombol ekspor laporan investigasi rekapitulasi anomali lengkap ke dalam format spreadsheet.

---

## 🛠️ 4. Rincian Berkas yang Akan Dibuat & Diperbarui

### 1. Berkas Baru
* 📄 **`[NEW]` `assets/js/database/ai-insights.js`**:
  - Modul mandiri `AIInsightEngine` dengan fungsi:
    - `detectFrequentResets(systemLogs, timeWindowDays = 7, threshold = 2)`
    - `detectLastMinuteAttendance(logAbsensi, sesiAbsensi)`
    - `detectSharedDevices(logAbsensi, siswaList)`
    - `detectChronicAbsence(logAbsensi, siswaList)`
    - `generateNarrativeSummary(finding)`
    - `exportAnomalyReportExcel(findingsList)`

### 2. Berkas yang Diperbarui
* 📄 **`[MODIFY]` `database/system-logs.html`**:
  - Menambahkan wadah UI `#ai-insights-panel` responsif dengan estetika *dark glassmorphism*.
* 📄 **`[MODIFY]` `assets/js/database/system-logs.js`**:
  - Mengintegrasikan `AIInsightEngine` dengan listener Firestore real-time.
* 📄 **`[MODIFY]` `database/db-manager.html`** & **`assets/js/database/db-manager.js`**:
  - Menghubungkan `#analytics-insights` dengan temuan mesin anomali.

---

## 🧪 5. Skenario Pengujian & Validasi

1. **Uji Reset Berulang**: Simulasi 3 kali reset HP pada 1 akun NIS dalam 3 hari $\rightarrow$ muncul kartu `🔴 Frequent Device Reset`.
2. **Uji Menit Terakhir**: Simulasi scan presensi di menit ke-55 dari sesi 60 menit $\rightarrow$ muncul kartu `🟡 Chronic Last-Minute Attendance`.
3. **Uji Tabrakan Perangkat**: Simulasi 2 siswa scan menggunakan `device_id` yang identik $\rightarrow$ muncul peringatan `🔴 Device Sharing Collision`.
4. **Uji Responsivitas**: Tampilan kartu rapi di mobile (320px–480px) dan desktop lebar (>1024px).
5. **Uji Ekspor Spreadsheet**: File `.xlsx` terunduh dengan metadata investigasi yang lengkap.
