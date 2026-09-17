// scripts/auto-alpa.js
// Skrip otomatisasi untuk menyimpan data siswa yang 'Tidak Hadir' ke Firestore
// Dijalankan via GitHub Actions (repository_dispatch) atau Manual Run

const https = require('https');

const PROJECT_ID = 'portal-iskakfatoni';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// 1. Helper HTTP Request dengan Timeout dan Error Handling Ketat
function httpRequest(url, options = {}, postData = null, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const postDataStr = postData ? (typeof postData === 'string' ? postData : JSON.stringify(postData)) : null;
    const headers = Object.assign({}, options.headers || {});
    
    if (postDataStr) {
      headers['Content-Length'] = Buffer.byteLength(postDataStr);
    }

    const reqOptions = Object.assign({}, options, { headers });

    const req = https.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch (e) {
          parsed = { rawBody: body };
        }

        // Hanya resolve jika HTTP Status Code 2xx
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const errMsg = (parsed && parsed.error && (parsed.error.message || JSON.stringify(parsed.error))) || `HTTP ${res.statusCode}: ${body}`;
          const err = new Error(errMsg);
          err.statusCode = res.statusCode;
          err.response = parsed;
          reject(err);
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`HTTP Timeout (${timeoutMs}ms) saat menghubungi: ${url}`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postDataStr) req.write(postDataStr);
    req.end();
  });
}

// 2. Fetch all documents dengan Pagination & Propagasi Error
async function fetchAllDocuments(collectionName) {
  let allDocs = [];
  let pageToken = '';

  while (true) {
    const url = `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`;
    const res = await httpRequest(url, { method: 'GET' });

    if (res && res.documents) {
      allDocs = allDocs.concat(res.documents);
    }
    if (res && res.nextPageToken) {
      pageToken = res.nextPageToken;
    } else {
      break;
    }
  }
  return allDocs;
}

// 3. Normalisasi Nama Kelas (menghapus spasi, strip, case-insensitive)
function normClass(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// 4. Hitung Waktu WIB (UTC+7) secara Deterministik & Aman dari Variasi Locale
function getTodayWIB() {
  const now = new Date();
  // Hitung offset UTC + 7 jam secara matematis
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibDate = new Date(utcMs + (7 * 3600000));

  const yyyy = wibDate.getFullYear();
  const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
  const dd = String(wibDate.getDate()).padStart(2, '0');
  const todayISO = `${yyyy}-${mm}-${dd}`;

  const hh = String(wibDate.getHours()).padStart(2, '0');
  const min = String(wibDate.getMinutes()).padStart(2, '0');
  const waktuStr = `${hh}:${min} WIB`;

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariStr = days[wibDate.getDay()];

  return { todayISO, hariStr, waktuStr, wibDate };
}

// 5. Eksekusi Create Log Absensi (Memvalidasi Dokumen Terbuat)
async function createLogAbsensiDoc(logData) {
  const url = `${FIRESTORE_BASE_URL}/log_absensi`;
  
  const body = {
    fields: {
      nis: { stringValue: logData.nis },
      nama_siswa: { stringValue: logData.nama_siswa },
      id_kelas: { stringValue: logData.id_kelas },
      nama_kelas: { stringValue: logData.nama_kelas || logData.id_kelas },
      nama_sekolah: { stringValue: logData.nama_sekolah || '-' },
      id_sesi: { stringValue: logData.id_sesi || '-' },
      nama_mapel: { stringValue: logData.nama_mapel || '-' },
      hari: { stringValue: logData.hari },
      tanggal: { stringValue: logData.tanggal },
      waktu: { stringValue: logData.waktu },
      status: { stringValue: logData.status },
      created_at: { timestampValue: new Date().toISOString() }
    }
  };

  const res = await httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);

  if (!res || !res.name) {
    throw new Error(`Firestore tidak mengembalikan id dokumen valid: ${JSON.stringify(res)}`);
  }
  return res;
}

// 6. Helper Pengiriman WhatsApp Fonnte dengan Verifikasi Status Ketat
async function sendWhatsAppFonnte(target, message) {
  const rawToken = process.env.FONNTE_TOKEN || '';
  const token = rawToken.trim();

  if (!token) {
    console.log('   ℹ️ [WhatsApp] FONNTE_TOKEN tidak diatur di environment secrets. Pengiriman WA dilewati.');
    return { success: false, reason: 'no_token' };
  }
  if (!target) {
    console.log('   ℹ️ [WhatsApp] Target / wa_group_id untuk kelas ini belum diatur di database.');
    return { success: false, reason: 'no_target' };
  }

  const url = 'https://api.fonnte.com/send';
  try {
    const res = await httpRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    }, {
      target: target.trim(),
      message: message,
      countryCode: '62'
    });

    if (res && res.status === true) {
      console.log(`   📲 [WhatsApp] Pesan laporan berhasil dikirim ke: ${target}`);
      return { success: true, res };
    } else {
      const reason = res && (res.reason || res.detail || JSON.stringify(res));
      console.warn(`   ⚠️ [WhatsApp] Fonnte mengembalikan status gagal: ${reason}`);
      return { success: false, reason };
    }
  } catch (errWA) {
    console.error(`   ❌ [WhatsApp] Gagal mengirim pesan ke ${target}:`, errWA.message);
    return { success: false, error: errWA.message };
  }
}

// MAIN FUNCTION
async function main() {
  const { todayISO, hariStr, waktuStr } = getTodayWIB();
  console.log(`=======================================================`);
  console.log(`🤖 AUTO-ALPA SCRIPT: ${hariStr}, ${todayISO} (${waktuStr})`);
  console.log(`=======================================================`);

  try {
    console.log('📡 Mengambil data sesi, siswa, kelas, dan log absensi dari Firestore...');
    const [sesiDocs, siswaDocs, logDocs, kelasDocs] = await Promise.all([
      fetchAllDocuments('sesi_absensi'),
      fetchAllDocuments('siswa'),
      fetchAllDocuments('log_absensi'),
      fetchAllDocuments('kelas')
    ]);

    console.log(`📊 Data Terbaca: ${sesiDocs.length} Sesi, ${siswaDocs.length} Siswa, ${kelasDocs.length} Kelas, ${logDocs.length} Total Log`);

    // Guard Keamanan: Pastikan data master tidak kosong
    if (siswaDocs.length === 0 || kelasDocs.length === 0) {
      throw new Error(`Data master kosong (Siswa: ${siswaDocs.length}, Kelas: ${kelasDocs.length}). Auto-alpa dibatalkan demi mencegah silent failure alpa massal.`);
    }

    // 1. Temukan sesi yang aktif atau dibuka HARI INI
    const todaySessions = sesiDocs.filter(doc => {
      const f = doc.fields || {};
      return f.tanggal && f.tanggal.stringValue === todayISO;
    });

    if (todaySessions.length === 0) {
      console.log(`ℹ️ Tidak ada sesi absensi yang dibuka untuk tanggal hari ini (${todayISO}).`);
      console.log('✅ Selesai tanpa perubahan.');
      return;
    }

    console.log(`🎯 Ditemukan ${todaySessions.length} sesi absensi hari ini:`);
    todaySessions.forEach(s => {
      const f = s.fields || {};
      console.log(`   - Kelas: ${f.id_kelas && f.id_kelas.stringValue} | Mapel: ${f.nama_mapel && f.nama_mapel.stringValue} (${s.name.split('/').pop()})`);
    });

    // 2. Kumpulkan NIS siswa yang hadir vs tidak hadir hari ini dengan binding per ID Sesi
    const todayLogs = logDocs.filter(doc => {
      const f = doc.fields || {};
      return f.tanggal && f.tanggal.stringValue === todayISO;
    });

    // Set spesifik per sesi dan per hari
    const presentSessionNisSet = new Set();
    const existingAlpaSessionNisSet = new Set();

    todayLogs.forEach(doc => {
      const f = doc.fields || {};
      const nis = (f.nis && f.nis.stringValue || '').trim();
      const sId = (f.id_sesi && f.id_sesi.stringValue || '').trim();
      const status = (f.status && f.status.stringValue || '').toLowerCase();
      if (!nis) return;

      const isHadir = status.includes('hadir') && !status.includes('tidak');
      if (isHadir) {
        if (sId && sId !== '-') presentSessionNisSet.add(`${sId}_${nis}`);
        presentSessionNisSet.add(`any_${nis}`);
      } else {
        if (sId && sId !== '-') existingAlpaSessionNisSet.add(`${sId}_${nis}`);
        existingAlpaSessionNisSet.add(`any_${nis}`);
      }
    });

    // 3. Proses setiap sesi untuk mencari siswa yang belum absen & kirim notifikasi WhatsApp
    let totalSavedAlpa = 0;
    const sentWaTargets = new Set(); // Mencegah pesan WhatsApp ganda ke grup yang sama dalam 1 run

    for (const sessionDoc of todaySessions) {
      const sFields = sessionDoc.fields || {};
      const sId = sessionDoc.name.split('/').pop();
      const sKelas = (sFields.id_kelas && sFields.id_kelas.stringValue) || '';
      const sMapel = (sFields.nama_mapel && sFields.nama_mapel.stringValue) || 'Mapel';
      const normSKelas = normClass(sKelas);

      if (!normSKelas) continue;

      // Cari metadata kelas (misal wa_group_id dan nama_sekolah)
      const matchingKelasDoc = kelasDocs.find(kd => {
        const kf = kd.fields || {};
        const docId = kd.name.split('/').pop();
        const kId = normClass(kf.id_kelas && kf.id_kelas.stringValue) || normClass(docId);
        const kNama = normClass(kf.nama_kelas && kf.nama_kelas.stringValue);
        return docId === sKelas || kId === normSKelas || kNama === normSKelas;
      });

      let targetWaGroup = '';
      let namaSekolah = process.env.SCHOOL_NAME || (sFields.nama_sekolah && sFields.nama_sekolah.stringValue) || 'SMK Negeri 1 Jetis Mojokerto';
      let namaKelasDisplay = sKelas;

      if (matchingKelasDoc && matchingKelasDoc.fields) {
        const kf = matchingKelasDoc.fields;
        targetWaGroup = (kf.wa_group_id && kf.wa_group_id.stringValue) || 
                         (kf.group_id && kf.group_id.stringValue) || '';
        if (kf.nama_sekolah && kf.nama_sekolah.stringValue) {
          namaSekolah = kf.nama_sekolah.stringValue;
        }
        if (kf.nama_kelas && kf.nama_kelas.stringValue) {
          namaKelasDisplay = kf.nama_kelas.stringValue;
        }
      }
      if (!targetWaGroup && process.env.WHATSAPP_TARGET) {
        targetWaGroup = process.env.WHATSAPP_TARGET;
      }

      // Cari siswa di kelas ini dengan toleransi penulisan nama sekolah
      const targetDocId = matchingKelasDoc ? matchingKelasDoc.name.split('/').pop() : sKelas;
      const classStudents = siswaDocs.filter(sw => {
        const swF = sw.fields || {};
        const swIdKelas = (swF.id_kelas && swF.id_kelas.stringValue) || '';
        const swNamaKelas = (swF.nama_kelas && swF.nama_kelas.stringValue) || '';
        const swSekolah = (swF.nama_sekolah && swF.nama_sekolah.stringValue) || '';

        if (swIdKelas && targetDocId && normClass(swIdKelas) === normClass(targetDocId)) return true;
        if (swIdKelas && normClass(swIdKelas) === normSKelas) return true;
        if (normClass(swNamaKelas) === normClass(namaKelasDisplay)) {
          if (!swSekolah || !namaSekolah || normClass(swSekolah) === normClass(namaSekolah) || swSekolah.toLowerCase().includes('jetis')) {
            return true;
          }
        }
        return false;
      });

      console.log(`\n📌 Memeriksa Kelas [${namaKelasDisplay} - ${namaSekolah}] (Total Rombel: ${classStudents.length} siswa)...`);

      // Siswa yang Hadir pada sesi ini
      const presentStudents = classStudents.filter(sw => {
        const swF = sw.fields || {};
        const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
        return presentSessionNisSet.has(`${sId}_${nis}`) || presentSessionNisSet.has(`any_${nis}`);
      });

      // Siswa yang Tidak Hadir (Alpa)
      const alpaStudents = classStudents.filter(sw => {
        const swF = sw.fields || {};
        const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
        return !(presentSessionNisSet.has(`${sId}_${nis}`) || presentSessionNisSet.has(`any_${nis}`));
      });

      // Simpan alpa yang belum tersimpan di Firestore ke database
      const unsavedAlpaStudents = alpaStudents.filter(sw => {
        const swF = sw.fields || {};
        const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
        return !(existingAlpaSessionNisSet.has(`${sId}_${nis}`) || existingAlpaSessionNisSet.has(`any_${nis}`));
      });

      if (unsavedAlpaStudents.length > 0) {
        console.log(`   ⚠️ Menyimpan ${unsavedAlpaStudents.length} siswa 'Tidak Hadir' baru ke Firestore...`);

        for (const sw of unsavedAlpaStudents) {
          const swF = sw.fields || {};
          const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
          const nama = (swF.nama_siswa && swF.nama_siswa.stringValue) || (swF.nama && swF.nama.stringValue) || 'Siswa';
          const namaKelas = (swF.nama_kelas && swF.nama_kelas.stringValue) || namaKelasDisplay;
          const idKelasVal = (swF.id_kelas && swF.id_kelas.stringValue) || targetDocId;

          try {
            await createLogAbsensiDoc({
              nis,
              nama_siswa: nama,
              id_kelas: idKelasVal,
              nama_kelas: namaKelas,
              nama_sekolah: namaSekolah,
              id_sesi: sId,
              nama_mapel: sMapel,
              hari: hariStr,
              tanggal: todayISO,
              waktu: waktuStr,
              status: 'Tidak Hadir'
            });

            existingAlpaSessionNisSet.add(`${sId}_${nis}`);
            existingAlpaSessionNisSet.add(`any_${nis}`);
            totalSavedAlpa++;
            console.log(`      + [Alpa Baru Tersimpan] ${nis} - ${nama}`);
          } catch (errPost) {
            console.error(`      ❌ Gagal simpan alpa ${nis}:`, errPost.message);
          }
        }
      } else {
        console.log(`   ✨ Seluruh status siswa kelas [${namaKelasDisplay}] sudah tersimpan di database.`);
      }

      // SUSUN PESAN LAPORAN WHATSAPP UNTUK GRUP KELAS INI
      if (targetWaGroup) {
        if (sentWaTargets.has(targetWaGroup)) {
          console.log(`   ℹ️ [WhatsApp] Pesan laporan untuk grup ${targetWaGroup} sudah dikirim pada sesi sebelumnya dalam run ini.`);
          continue;
        }

        const presentCount = presentStudents.length;
        const alpaCount = alpaStudents.length;
        const totalStudents = classStudents.length;
        const pctHadir = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
        const pctAlpa = totalStudents > 0 ? Math.round((alpaCount / totalStudents) * 100) : 0;

        let alpaListText = '';
        alpaStudents.forEach((sw, idx) => {
          const swF = sw.fields || {};
          const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
          const nama = (swF.nama_siswa && swF.nama_siswa.stringValue) || (swF.nama && swF.nama.stringValue) || 'Siswa';
          alpaListText += `${idx + 1}. *${nis}* - ${nama}\n`;
        });

        const waMessage = 
`📢 *LAPORAN PRESENSI HARIAN*
📅 *${hariStr}, ${todayISO}* (${waktuStr})
🏫 *${namaSekolah}*
━━━━━━━━━━━━━━━━━━━━━━━
📌 *Kelas:* *${namaKelasDisplay}*
📖 *Mapel:* ${sMapel}

📊 *Kehadiran:*
• Total Siswa : *${totalStudents}*
• Hadir        : *${presentCount} Siswa* (${pctHadir}%) ✅
• Tidak Hadir  : *${alpaCount} Siswa* (${pctAlpa}%) ⚠️

${alpaCount > 0 
  ? `❌ *Daftar Siswa Tidak Hadir:*\n${alpaListText}` 
  : `✨ *Alhamdulillah, seluruh siswa hadir lengkap (100%)!*`}`;

        const sendResult = await sendWhatsAppFonnte(targetWaGroup, waMessage);
        if (sendResult && sendResult.success) {
          sentWaTargets.add(targetWaGroup);
        }
      }
    }

    console.log(`\n=======================================================`);
    console.log(`🎉 SUKSES: Total ${totalSavedAlpa} log 'Tidak Hadir' baru berhasil diverifikasi & disimpan permanen.`);
    console.log(`=======================================================`);

  } catch (err) {
    console.error('❌ Terjadi kesalahan pada Auto-Alpa Cron:', err.message);
    process.exit(1);
  }
}

main();
