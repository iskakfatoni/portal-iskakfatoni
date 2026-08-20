// scripts/auto-alpa.js
// Skrip otomatisasi untuk menyimpan data siswa yang 'Tidak Hadir' ke Firestore
// Dijalankan setiap hari Senin - Jumat pukul 15:30 WIB via GitHub Actions atau Manual Run

const https = require('https');

const PROJECT_ID = 'portal-iskakfatoni';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper HTTP Request
function httpRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

// Fetch all documents with pagination
async function fetchAllDocuments(collectionName) {
  let allDocs = [];
  let pageToken = '';

  while (true) {
    const url = `${FIRESTORE_BASE_URL}/${collectionName}?pageSize=300${pageToken ? '&pageToken=' + pageToken : ''}`;
    const res = await httpRequest(url, { method: 'GET' });

    if (res.documents) allDocs = allDocs.concat(res.documents);
    if (res.nextPageToken) pageToken = res.nextPageToken;
    else break;
  }
  return allDocs;
}

// Normalisasi Nama Kelas (menghapus spasi, strip, case-insensitive)
function normClass(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Ambil Tanggal Hari Ini dalam format WIB (Asia/Jakarta)
function getTodayWIB() {
  const now = new Date();
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  
  const yyyy = jakartaTime.getFullYear();
  const mm = String(jakartaTime.getMonth() + 1).padStart(2, '0');
  const dd = String(jakartaTime.getDate()).padStart(2, '0');
  const todayISO = `${yyyy}-${mm}-${dd}`;

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariStr = days[jakartaTime.getDay()];

  return { todayISO, hariStr, jakartaTime };
}

// Eksekusi Batch Create Log Absensi
async function createLogAbsensiDoc(logData) {
  const url = `${FIRESTORE_BASE_URL}/log_absensi`;
  
  const body = {
    fields: {
      nis: { stringValue: logData.nis },
      nama_siswa: { stringValue: logData.nama_siswa },
      id_kelas: { stringValue: logData.id_kelas },
      id_sesi: { stringValue: logData.id_sesi || '-' },
      nama_mapel: { stringValue: logData.nama_mapel || '-' },
      hari: { stringValue: logData.hari },
      tanggal: { stringValue: logData.tanggal },
      waktu: { stringValue: logData.waktu },
      status: { stringValue: logData.status },
      created_at: { timestampValue: new Date().toISOString() }
    }
  };

  return httpRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, body);
}

// Helper Pengiriman WhatsApp Fonnte
async function sendWhatsAppFonnte(target, message) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.log('   ℹ️ [WhatsApp] FONNTE_TOKEN tidak diatur di environment secrets. Pengiriman WA dilewati.');
    return;
  }
  if (!target) {
    console.log('   ℹ️ [WhatsApp] Target / wa_group_id untuk kelas ini belum diatur di database.');
    return;
  }

  const url = 'https://api.fonnte.com/send';
  try {
    await httpRequest(url, {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    }, {
      target: target,
      message: message,
      countryCode: '62'
    });
    console.log(`   📲 [WhatsApp] Pesan laporan berhasil dikirim ke grup: ${target}`);
  } catch (errWA) {
    console.error(`   ❌ [WhatsApp] Gagal mengirim pesan ke ${target}:`, errWA.message);
  }
}

// MAIN FUNCTION
async function main() {
  const { todayISO, hariStr } = getTodayWIB();
  console.log(`=======================================================`);
  console.log(`🤖 AUTO-ALPA CRON JOB: ${hariStr}, ${todayISO} 15:30 WIB`);
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

    // 2. Kumpulkan NIS siswa yang sudah memiliki log absensi hari ini
    const todayLogs = logDocs.filter(doc => {
      const f = doc.fields || {};
      return f.tanggal && f.tanggal.stringValue === todayISO;
    });

    const recordedNisSet = new Set();
    todayLogs.forEach(doc => {
      const f = doc.fields || {};
      const nis = (f.nis && f.nis.stringValue || '').trim();
      if (nis) recordedNisSet.add(nis);
    });

    console.log(`👥 Sudah Tercatat Presensi Hari Ini: ${recordedNisSet.size} siswa`);

    // 3. Proses setiap sesi untuk mencari siswa yang belum absen & kirim notifikasi WhatsApp
    let totalSavedAlpa = 0;

    for (const sessionDoc of todaySessions) {
      const sFields = sessionDoc.fields || {};
      const sId = sessionDoc.name.split('/').pop();
      const sKelas = (sFields.id_kelas && sFields.id_kelas.stringValue) || '';
      const sMapel = (sFields.nama_mapel && sFields.nama_mapel.stringValue) || 'Mapel';
      const normSKelas = normClass(sKelas);

      if (!normSKelas) continue;

      // Cari metadata kelas (misal wa_group_id)
      const matchingKelasDoc = kelasDocs.find(kd => {
        const kf = kd.fields || {};
        const k1 = normClass(kf.nama_kelas && kf.nama_kelas.stringValue);
        const k2 = normClass(kf.id_kelas && kf.id_kelas.stringValue);
        const k3 = normClass(kd.name.split('/').pop());
        return k1 === normSKelas || k2 === normSKelas || k3 === normSKelas;
      });

      let targetWaGroup = '';
      if (matchingKelasDoc && matchingKelasDoc.fields) {
        const kf = matchingKelasDoc.fields;
        targetWaGroup = (kf.wa_group_id && kf.wa_group_id.stringValue) || 
                         (kf.group_id && kf.group_id.stringValue) || '';
      }
      if (!targetWaGroup && process.env.WHATSAPP_TARGET) {
        targetWaGroup = process.env.WHATSAPP_TARGET;
      }

      // Cari siswa di kelas ini
      const classStudents = siswaDocs.filter(sw => {
        const swF = sw.fields || {};
        const k1 = normClass(swF.id_kelas && swF.id_kelas.stringValue);
        const k2 = normClass(swF.nama_kelas && swF.nama_kelas.stringValue);
        const k3 = normClass(swF.kelas && swF.kelas.stringValue);
        return k1 === normSKelas || k2 === normSKelas || k3 === normSKelas;
      });

      console.log(`\n📌 Memeriksa Kelas [${sKelas}] (Total Rombel: ${classStudents.length} siswa)...`);

      const alpaStudents = classStudents.filter(sw => {
        const swF = sw.fields || {};
        const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
        return !recordedNisSet.has(nis);
      });

      const presentStudentsCount = classStudents.length - alpaStudents.length;

      // Simpan alpa ke Firestore
      if (alpaStudents.length > 0) {
        console.log(`   ⚠️ Menyimpan ${alpaStudents.length} siswa 'Tidak Hadir' ke Firestore...`);

        for (const sw of alpaStudents) {
          const swF = sw.fields || {};
          const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
          const nama = (swF.nama_siswa && swF.nama_siswa.stringValue) || (swF.nama && swF.nama.stringValue) || 'Siswa';
          const namaKelas = (swF.nama_kelas && swF.nama_kelas.stringValue) || sKelas;

          try {
            await createLogAbsensiDoc({
              nis,
              nama_siswa: nama,
              id_kelas: namaKelas,
              id_sesi: sId,
              nama_mapel: sMapel,
              hari: hariStr,
              tanggal: todayISO,
              waktu: '15:30 WIB',
              status: 'Tidak Hadir'
            });

            recordedNisSet.add(nis);
            totalSavedAlpa++;
            console.log(`      + [Alpa] ${nis} - ${nama}`);
          } catch (errPost) {
            console.error(`      ❌ Gagal simpan alpa ${nis}:`, errPost.message);
          }
        }
      } else {
        console.log(`   ✨ Seluruh siswa kelas [${sKelas}] sudah memiliki catatan presensi hari ini.`);
      }

      // SUSUN PESAN LAPORAN WHATSAPP UNTUK GRUP KELAS INI
      if (targetWaGroup) {
        const pctHadir = classStudents.length > 0 ? Math.round((presentStudentsCount / classStudents.length) * 100) : 0;
        const pctAlpa = classStudents.length > 0 ? Math.round((alpaStudents.length / classStudents.length) * 100) : 0;

        let alpaListText = '';
        alpaStudents.forEach((sw, idx) => {
          const swF = sw.fields || {};
          const nis = (swF.nis && swF.nis.stringValue || sw.name.split('/').pop()).trim();
          const nama = (swF.nama_siswa && swF.nama_siswa.stringValue) || (swF.nama && swF.nama.stringValue) || 'Siswa';
          alpaListText += `${idx + 1}. *${nis}* - ${nama}\n`;
        });

        const waMessage = 
`📢 *LAPORAN PRESENSI HARIAN SISWA*
📅 *${hariStr}, ${todayISO}* (Pukul 15:30 WIB)
🏫 *SMK Negeri 1 Wonosobo - TEI*
━━━━━━━━━━━━━━━━━━━━━━━
📌 *Kelas:* *${sKelas}*
📖 *Mapel:* ${sMapel}

📊 *Ringkasan Kehadiran:*
• Total Siswa : *${classStudents.length}*
• Hadir        : *${presentStudentsCount} Siswa* (${pctHadir}%) ✅
• Tidak Hadir  : *${alpaStudents.length} Siswa* (${pctAlpa}%) ⚠️

${alpaStudents.length > 0 
  ? `❌ *Daftar Siswa Belum Presensi (Alpa):*\n${alpaListText}` 
  : `✨ *Alhamdulillah, seluruh siswa hadir lengkap (100%)!*`}
━━━━━━━━━━━━━━━━━━━━━━━
🤖 _Data telah disinkronkan otomatis ke Database Firestore._`;

        await sendWhatsAppFonnte(targetWaGroup, waMessage);
      }
    }

    console.log(`\n=======================================================`);
    console.log(`🎉 SUKSES: Total ${totalSavedAlpa} log 'Tidak Hadir' berhasil disimpan permanen ke Firestore.`);
    console.log(`=======================================================`);

  } catch (err) {
    console.error('❌ Terjadi kesalahan pada Auto-Alpa Cron:', err);
    process.exit(1);
  }
}

main();

