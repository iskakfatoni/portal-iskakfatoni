# AGENTS.md - Workspace Rules

## Project Info & Live Domain
- **Live Domain / URL**: https://iskakfatoni.github.io/portal-iskakfatoni/

## Git & Review Workflow Rules
- **Prinsip Perintah "Cek" / "Audit"**: Jika user memberikan instruksi dengan kata **"cek"**, **"periksa"**, **"tinjau"**, atau **"audit"**, asisten **HANYA** melakukan investigasi, analisis, dan pelaporan temuan ke user. **DILARANG** langsung melakukan perubahan kode pada file lokal, mencatat review, apalagi melakukan `git commit` dan `git push` sebelum ada instruksi atau konfirmasi eksplisit dari user untuk mengeksekusi perbaikan.
- **Commit & Push Otomatis**: Setiap kali selesai melakukan perubahan atau edit kode pada file lokal yang diminta/disetujui user dan mencatat review ke `review.md`, AI asisten diperbolehkan dan dapat langsung menjalankan `git add`, `git commit`, serta `git push` secara otomatis tanpa perlu meminta konfirmasi ulang.
- **Selalu Catat Review ke `review.md`**: Setiap kali selesai melakukan perubahan atau edit kode pada file lokal, selalu tambahkan (*append*) entri ulasan baru ke dalam file [review.md](file:///c:/Users/iskak/Antigravity-Projetcs/portal-iskakfatoni/review.md) yang mencakup:
  1. Keterangan **Waktu & Tanggal** (contoh: `2026-08-10 08:59 WIB`).
  2. Berkas apa saja yang diubah / dibuat.
  3. Rincian baris/logika yang diperbarui.
  4. Petunjuk pengujian lokal (*local verification*).
