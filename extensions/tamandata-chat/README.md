# Tamandata AI Chat Assistant for Antigravity IDE / VS Code

Ekstensi sidebar obrolan cerdas yang menghubungkan lingkungan kerja Anda langsung ke **Tamandata AI** (`https://ai.tamandata.com/v1`) dengan model unggulan `cx/gpt-6-astra`.

---

## Fitur Unggulan

- 💬 **Sidebar Chat Terintegrasi**: Ikon Tamandata di Activity Bar kiri editor untuk akses tanya-jawab cepat kapan saja.
- ⚡ **Pilihan Model Tamandata AI**:
  - `cx/gpt-6-astra` (Model Rekomendasi Utama)
  - `tamandata`
  - `z/deepseek-v4-flash`
  - `gemini/gemini-3.7-flash`
- 🎯 **Aksi Cepat Kontekstual**:
  - Klik kanan pada kode terpilih -> **Tamandata: Tanya Kode Terpilih**
  - Tombol instan: *💡 Jelaskan*, *🐞 Cari Bug*, *⚡ Refactor*, dan *🧪 Unit Test*.
- 📋 **Copy & Insert Code**: Salin blok kode hasil AI atau langsung sisipkan ke dalam editor Anda dengan satu klik.
- 🔒 **Penyimpanan Kunci Aman**: Menyimpan API Key Tamandata dengan aman via VS Code SecretStorage.

---

## Cara Memasang Ekstensi

Ekstensi ini sudah siap digunakan dan dapat dihubungkan ke instalasi VS Code atau Antigravity IDE:

### Opsi A: Symbolic Link ke Folder Ekstensi VS Code (Otomatis & Tercepat)
Cukup jalankan perintah PowerShell:
```powershell
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.vscode\extensions\tamandata-chat-assistant" -Target "c:\Users\iskak\Antigravity-Projetcs\portal-iskakfatoni\extensions\tamandata-chat"
```

### Opsi B: Menggunakan VSIX Package
Jika ingin dibundel menjadi file `.vsix`:
```bash
cd extensions/tamandata-chat
npx @vscode/vsce package
```
Lalu instal lewat menu VS Code: **Extensions** -> **...** (Views and More Actions) -> **Install from VSIX...**.

---

## Konfigurasi API Key

1. Klik tombol kunci (🔑) pada header panel Tamandata Chat, atau buka Command Palette (`Ctrl+Shift+P`) lalu ketik `Tamandata: Atur API Key`.
2. Masukkan API Key Anda dari dashboard [https://ai.tamandata.com](https://ai.tamandata.com).
3. Selesai! Anda siap mengobrol dengan Tamandata AI.
