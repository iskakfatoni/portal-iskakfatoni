# Changelog

## [1.2.0] - 2026-08-10

### Changed
- Ditingkatkan algoritma hardware fingerprinting menjadi Multi-Layer Hybrid (Persistent Device Seed + Sub-pixel 2D Canvas + WebGL + RAM/DeviceMemory).
- Diekstraksi fungsi `getHardwareFingerprint` ke ES module terpusat `assets/js/utils/device-fingerprint.js`.
- Dioptimalkan Firestore DB Manager (`db-manager.html`) dengan Batch Chunking per 400 dokumen pada hapus masal & impor Excel.
- Diproteksi tipe data NIS agar selalu disimpan sebagai String (mencegah hilangnya angka `0` di depan).
- Dihapus duplikasi skrip partikel canvas inline dan dikonsolidasikan menggunakan `assets/js/particle-bg.js`.

## [1.1.0] - 2026-08-09

### Changed
- Dioptimalkan animasi canvas partikel untuk mengurangi beban CPU.
- Dibatasi animasi pada layar yang lebih besar agar performa lebih ringan.
- Disederhanakan strategi caching pada service worker agar lebih efisien.
- Diperbaiki pengalaman loading pada halaman dengan efek visual berat.
- Dilakukan pengoptimalan aset gambar dengan mengonversi PNG ke WebP untuk loading yang lebih ringan.

### Added
- Dukungan PWA melalui manifest dan service worker.
- Struktur halaman portal sekolah yang lebih terorganisir untuk admin, guru, siswa, dan link.

## [1.0.0] - 2026-08-09

### Added
- Rilis awal portal sekolah dengan halaman utama, portal publik, halaman admin, absensi, serta halaman pendukung guru, siswa, dan link.
- Integrasi dasar Firebase untuk kebutuhan data dan autentikasi.
- Desain antarmuka awal beserta asset styling dan file manifest PWA.
