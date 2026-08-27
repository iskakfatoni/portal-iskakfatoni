# 🖥️ Portal Iskak Fatoni - Windows Desktop App (.EXE)

Aplikasi desktop Windows mandiri (*standalone executable*) untuk **Portal Iskak Fatoni** yang ditenagai oleh **Microsoft Edge WebView2 Engine**, dilengkapi dengan **Bottom Navigation Toolbar** modern bertema *dark slate & cyan*.

---

## ✨ Fitur Unggulan
1. **⚡ Super Ringan & Cepat**: Menggunakan runtime WebView2 bawaan Windows (hemat RAM & baterai dibanding Electron).
2. **🧭 Bottom Navigation Toolbar**:
   - 🏠 **Portal** (`portal.html`)
   - 📱 **Presensi Siswa** (`absensi.html`)
   - 👨‍🏫 **Sesi Guru & QR** (`pages/guru/index.html`)
   - 📊 **Rekap Presensi** (`pages/guru/rekap.html`)
   - 🗄️ **Database Manager** (`pages/database/db-manager.html`)
   - 🛡️ **Admin Hub** (`admin.html`)
3. **🎮 Kontrol Navigasi & Pintasan Keyboard**:
   - `◀` Kembali (`Alt + Panah Kiri`)
   - `▶` Maju (`Alt + Panah Kanan`)
   - `🔄` Muat Ulang (`F5`)
   - `⛶` Layar Penuh (*Borderless Fullscreen*) (`F11`)
4. **📸 Izin Kamera Otomatis**: Fitur scanner QR presensi siswa dan sesi guru langsung diizinkan tanpa pop-up izin browser yang mengganggu.
5. **🔒 Penyimpanan Sesi Terisolasi**: Sesi login dan riwayat tersimpan aman di folder `%LOCALAPPDATA%\PortalIskakFatoni\WebView2UserData`.

---

## 🚀 Cara Menjalankan Aplikasi
Cukup buka / klik ganda berkas berikut:
```text
app/Portal-IskakFatoni.exe
```

---

## 🔨 Cara Kompilasi Ulang (Rebuild)
Jika Anda mengubah kode di `app/src/Program.cs`, Anda dapat melakukan build ulang dengan salah satu cara berikut:
- **Opsi A**: Klik ganda file `app/build.bat`
- **Opsi B**: Jalankan perintah terminal dari folder `app/`:
```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /optimize+ /platform:x64 /win32icon:app_icon.ico /reference:System.dll,System.Windows.Forms.dll,System.Drawing.dll,System.Core.dll,Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.WinForms.dll /out:Portal-IskakFatoni.exe src\Program.cs
```
