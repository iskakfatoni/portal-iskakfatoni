// assets/js/database/ai-insights.js
// 🤖 AI ATTENDANCE & SECURITY INSIGHT ENGINE
// Engine deteksi anomali presensi, manipulasi perangkat, dan analisis pola kedisiplinan siswa berbasis client-side pattern recognition.

export const AIInsightEngine = {
  // -----------------------------------------------------------------
  // 1. ANALYZER ENGINE: DETEKSI SELURUH ANOMALI
  // -----------------------------------------------------------------
  analyze({ systemLogs = [], logAbsensi = [], sesiAbsensi = [], siswaList = [] }) {
    const findings = [];

    // Normalizer Helpers
    const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1.1 Anomali 1: Frequent Device Switching (Gonta-Ganti HP & Reset Berulang)
    const resetFindings = this.detectFrequentResets(systemLogs);
    findings.push(...resetFindings);

    // 1.2 Anomali 2: Shared Device Collision (1 HP Banyak Siswa)
    const sharedFindings = this.detectSharedDevices(logAbsensi, siswaList, systemLogs);
    findings.push(...sharedFindings);

    // 1.3 Anomali 3: Chronic Last-Minute Attendance (Absen Menit Terakhir)
    const lastMinFindings = this.detectLastMinuteAttendance(logAbsensi, sesiAbsensi);
    findings.push(...lastMinFindings);

    // 1.4 Anomali 4: Chronic Absenteeism (Tren Alpa Kronis / Beruntun)
    const chronicAbsenceFindings = this.detectChronicAbsenteeism(logAbsensi, siswaList);
    findings.push(...chronicAbsenceFindings);

    // 1.5 Insight Positif: Early Bird (Siswa Teladan Tepat Waktu)
    const earlyBirdFindings = this.detectEarlyBirds(logAbsensi, sesiAbsensi);
    findings.push(...earlyBirdFindings);

    // Sort: HIGH risk first, then MEDIUM, then POSITIVE, then newest
    const severityWeight = { HIGH: 3, MEDIUM: 2, POSITIVE: 1 };
    findings.sort((a, b) => {
      const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (weightDiff !== 0) return weightDiff;
      return (b.latestTimestamp || 0) - (a.latestTimestamp || 0);
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 2. DETEKTOR 1: FREQUENT DEVICE SWITCHING (RESET HP BERULANG)
  // -----------------------------------------------------------------
  detectFrequentResets(systemLogs, windowDays = 14, threshold = 2) {
    const findings = [];
    const nowMs = Date.now();
    const windowMs = windowDays * 24 * 60 * 60 * 1000;

    // Grouping reset logs by target_nis
    const studentResetMap = new Map();

    systemLogs.forEach((docSnap) => {
      const d = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
      const action = (d.action || '').toUpperCase();
      if (!action.includes('RESET')) return;

      const nis = (d.target_nis || d.nis || '').trim();
      if (!nis || nis === '-') return;

      let tsMs = 0;
      if (d.timestamp && d.timestamp.seconds) tsMs = d.timestamp.seconds * 1000;
      else if (d.created_at && d.created_at.seconds) tsMs = d.created_at.seconds * 1000;
      else if (d.timestamp) tsMs = new Date(d.timestamp).getTime();

      // Cek dalam rentang waktu jendela (misal 14 hari)
      if (tsMs && (nowMs - tsMs) <= windowMs) {
        if (!studentResetMap.has(nis)) {
          studentResetMap.set(nis, {
            nis,
            nama: d.target_name || d.nama_siswa || 'Siswa',
            resets: []
          });
        }
        studentResetMap.get(nis).resets.push({
          docId: docSnap.id || '-',
          tsMs,
          timeStr: new Date(tsMs).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
          admin: d.admin_email || 'Admin',
          oldDeviceId: d.old_device_id || d.device_id || '-',
          oldDeviceInfo: d.old_device_info || d.device_info || '-'
        });
      }
    });

    studentResetMap.forEach((entry, nis) => {
      const resetCount = entry.resets.length;
      if (resetCount >= threshold) {
        const uniqueDevices = new Set(entry.resets.map((r) => r.oldDeviceId).filter((id) => id && id !== '-'));
        const isHighRisk = resetCount >= 3 || uniqueDevices.size >= 2;
        const severity = isHighRisk ? 'HIGH' : 'MEDIUM';

        entry.resets.sort((a, b) => b.tsMs - a.tsMs);
        const latestTs = entry.resets[0].tsMs;

        findings.push({
          id: `anomaly-reset-${nis}`,
          type: 'FREQUENT_RESET',
          categoryLabel: 'Reset HP Berulang',
          severity,
          nis,
          nama: entry.nama,
          kelas: '-',
          title: `Fluktuasi Reset Perangkat Tinggi (${resetCount}x Reset dalam ${windowDays} Hari)`,
          summary: `Siswa ini terdeteksi melakukan reset hardware HP sebanyak ${resetCount} kali dalam ${windowDays} hari terakhir (${uniqueDevices.size} perangkat unik terdeteksi). Mengindikasikan potensi gonta-ganti ponsel atau titip presensi.`,
          recommendation: `Lakukan verifikasi fisik kepemilikan smartphone siswa dan konfirmasikan alasan pergantian perangkat ke Wali Kelas.`,
          evidence: entry.resets.map((r) => ({
            label: r.timeStr,
            desc: `Reset oleh ${r.admin} • Perangkat: ${r.oldDeviceInfo} (${r.oldDeviceId})`
          })),
          rawEvidenceCount: resetCount,
          latestTimestamp: latestTs
        });
      }
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 3. DETEKTOR 2: SHARED DEVICE & MULTI-ACCOUNT COLLISION (1 HP BANYAK SISWA)
  // Analisis komprehensif 3-Vektor:
  // - Vektor A (system_logs): Riwayat reset & binding perangkat pada banyak siswa
  // - Vektor B (log_absensi): Jejak presensi siswa dengan hardware ID yang sama
  // - Vektor C (siswaList): Status aktif ganda pada koleksi siswa saat ini
  // -----------------------------------------------------------------
  detectSharedDevices(logAbsensi = [], siswaList = [], systemLogs = []) {
    const findings = [];
    const deviceMasterMap = new Map(); // Key: normalized device_id

    // Helper normalisasi ID Perangkat
    const cleanDeviceId = (id) => {
      if (!id) return '';
      const str = String(id).trim();
      if (str === '' || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return '';
      return str;
    };

    const getDeviceEntry = (devId, devInfo = '') => {
      const cleanId = cleanDeviceId(devId);
      if (!cleanId) return null;
      if (!deviceMasterMap.has(cleanId)) {
        deviceMasterMap.set(cleanId, {
          deviceId: cleanId,
          deviceInfo: devInfo && devInfo !== '-' ? devInfo : 'Perangkat Mobile',
          students: new Map(), // nis -> { nis, nama, kelas, sources: Set(), events: [] }
          sameDayCollisions: new Map(), // tanggal -> Set of nis
          allEvents: [] // chronological trace
        });
      }
      const entry = deviceMasterMap.get(cleanId);
      if (devInfo && devInfo !== '-' && entry.deviceInfo === 'Perangkat Mobile') {
        entry.deviceInfo = devInfo;
      }
      return entry;
    };

    // ---------------------------------------------------------------
    // 3.1 VEKTOR A: ANALISIS AUDIT TRAIL SYSTEM_LOGS
    // ---------------------------------------------------------------
    systemLogs.forEach((docSnap) => {
      const d = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
      const nis = (d.target_nis || d.nis || '').trim();
      const nama = d.target_name || d.nama_siswa || d.nama || 'Siswa';
      const kelas = d.target_kelas || d.kelas || '-';
      const action = (d.action || '').toUpperCase();
      
      // Ambil device ID dari berbagai kemungkinan field system_logs
      const devId = cleanDeviceId(d.old_device_id || d.device_id || d.new_device_id || d.hw_fingerprint);
      const devInfo = d.old_device_info || d.device_info || '-';

      if (!devId || !nis || nis === '-') return;

      let tsMs = 0;
      if (d.timestamp && d.timestamp.seconds) tsMs = d.timestamp.seconds * 1000;
      else if (d.created_at && d.created_at.seconds) tsMs = d.created_at.seconds * 1000;
      else if (d.timestamp) tsMs = new Date(d.timestamp).getTime();

      const timeStr = tsMs ? new Date(tsMs).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Riwayat Log';

      const entry = getDeviceEntry(devId, devInfo);
      if (!entry) return;

      if (!entry.students.has(nis)) {
        entry.students.set(nis, {
          nis,
          nama,
          kelas,
          sources: new Set(),
          events: []
        });
      }
      const st = entry.students.get(nis);
      st.sources.add('system_logs');
      if (st.nama === 'Siswa' && nama !== 'Siswa') st.nama = nama;
      if (st.kelas === '-' && kelas !== '-') st.kelas = kelas;

      const eventDesc = `[system_logs] ${action} oleh ${d.admin_email || 'Admin'} (Info: ${devInfo})`;
      st.events.push({ timeStr, tsMs, desc: eventDesc });
      entry.allEvents.push({ timeStr, tsMs, nis, nama, desc: eventDesc });
    });

    // ---------------------------------------------------------------
    // 3.2 VEKTOR B: ANALISIS LOG_ABSENSI & SAME-DAY COLLISION
    // ---------------------------------------------------------------
    logAbsensi.forEach((docSnap) => {
      const d = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
      const devId = cleanDeviceId(d.device_id);
      const devInfo = d.device_info || '-';
      const nis = (d.nis || '').trim();
      const nama = d.nama_siswa || d.nama || 'Siswa';
      const kelas = d.nama_kelas || d.id_kelas || '-';
      const tanggal = (d.tanggal || '').trim();
      const waktu = d.waktu || '-';
      const mapel = d.nama_mapel || '-';

      if (!devId || !nis || !d.status || d.status.toLowerCase().includes('tidak')) return;

      let tsMs = 0;
      if (d.created_at && d.created_at.seconds) tsMs = d.created_at.seconds * 1000;
      else if (d.tanggal) tsMs = new Date(d.tanggal).getTime();

      const entry = getDeviceEntry(devId, devInfo);
      if (!entry) return;

      if (!entry.students.has(nis)) {
        entry.students.set(nis, {
          nis,
          nama,
          kelas,
          sources: new Set(),
          events: []
        });
      }
      const st = entry.students.get(nis);
      st.sources.add('log_absensi');
      if (st.nama === 'Siswa' && nama !== 'Siswa') st.nama = nama;
      if (st.kelas === '-' && kelas !== '-') st.kelas = kelas;

      const timeStr = `${tanggal} (${waktu})`;
      const eventDesc = `[log_absensi] Presensi Mapel: ${mapel} (${kelas})`;
      st.events.push({ timeStr, tsMs, desc: eventDesc });
      entry.allEvents.push({ timeStr, tsMs, nis, nama, desc: eventDesc });

      // Catat tabrakan tanggal yang sama
      if (tanggal) {
        if (!entry.sameDayCollisions.has(tanggal)) {
          entry.sameDayCollisions.set(tanggal, new Set());
        }
        entry.sameDayCollisions.get(tanggal).add(nis);
      }
    });

    // ---------------------------------------------------------------
    // 3.3 VEKTOR C: ANALISIS KOLEKSI SISWA AKTIF (ACTIVE CONFLICT)
    // ---------------------------------------------------------------
    siswaList.forEach((docSnap) => {
      const d = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
      const devId = cleanDeviceId(d.device_id || d.device_token || d.mac_address);
      const devInfo = d.device_info || d.device_model || '-';
      const nis = (d.nis || (docSnap.id && !docSnap.id.includes('-') ? docSnap.id : '')).trim();
      const nama = d.nama_siswa || d.nama || 'Siswa';
      const kelas = d.nama_kelas || d.id_kelas || '-';

      if (!devId || !nis) return;

      const entry = getDeviceEntry(devId, devInfo);
      if (!entry) return;

      if (!entry.students.has(nis)) {
        entry.students.set(nis, {
          nis,
          nama,
          kelas,
          sources: new Set(),
          events: []
        });
      }
      const st = entry.students.get(nis);
      st.sources.add('siswa_active');
      if (st.nama === 'Siswa' && nama !== 'Siswa') st.nama = nama;
      if (st.kelas === '-' && kelas !== '-') st.kelas = kelas;

      const eventDesc = `[siswa] Status Terikat Aktif di Database (Info: ${devInfo})`;
      st.events.push({ timeStr: 'Status Saat Ini', tsMs: Date.now(), desc: eventDesc });
      entry.allEvents.push({ timeStr: 'Status Aktif', tsMs: Date.now(), nis, nama, desc: eventDesc });
    });

    // ---------------------------------------------------------------
    // 3.4 SINTESIS TEMUAN & KALKULASI TINGKAT RISIKO
    // ---------------------------------------------------------------
    deviceMasterMap.forEach((entry, devId) => {
      const distinctStudentsCount = entry.students.size;
      if (distinctStudentsCount < 2) return; // Tidak ada anomali multi-akun jika hanya 1 siswa

      const studentList = Array.from(entry.students.values());
      const studentSummaryStr = studentList.map((s) => `${s.nama} (${s.nis})`).join(', ');

      // Cari apakah ada tabrakan pada hari yang sama (Same-day collision)
      let sameDayCount = 0;
      const sameDayDates = [];
      entry.sameDayCollisions.forEach((nisSet, tanggal) => {
        if (nisSet.size >= 2) {
          sameDayCount += nisSet.size;
          sameDayDates.push(tanggal);
        }
      });

      // Hitung keterlibatan system_logs & status aktif
      const systemLogsInvolvedCount = studentList.filter((s) => s.sources.has('system_logs')).length;
      const activeConflictCount = studentList.filter((s) => s.sources.has('siswa_active')).length;

      // Evaluasi Tingkat Risiko:
      // HIGH jika:
      // 1. Terjadi same-day attendance collision (2 siswa absen dengan 1 HP di hari yang sama)
      // 2. Ada 2+ akun siswa aktif yang terikat ke 1 device ID yang sama
      // 3. Jumlah siswa >= 3 akun
      const isHighRisk = sameDayDates.length > 0 || activeConflictCount >= 2 || distinctStudentsCount >= 3;
      const severity = isHighRisk ? 'HIGH' : 'MEDIUM';

      // Susun ringkasan bukti kronologis
      entry.allEvents.sort((a, b) => (b.tsMs || 0) - (a.tsMs || 0));
      const latestTs = entry.allEvents.length > 0 ? entry.allEvents[0].tsMs : Date.now();

      let title = '';
      let summary = '';
      let recommendation = '';

      if (sameDayDates.length > 0) {
        title = `1 HP Dipakai Bersama (${distinctStudentsCount} Siswa • Tabrakan Presensi Tanggal ${sameDayDates.slice(0, 2).join(', ')})`;
        summary = `Hardware ID [${devId}] (${entry.deviceInfo}) terdeteksi digunakan untuk presensi oleh ${distinctStudentsCount} siswa berbeda pada tanggal yang sama (${sameDayDates.join(', ')}): ${studentSummaryStr}. Terkonfirmasi melalui log presensi dan audit trail sistem.`;
        recommendation = `Segera panggil siswa-siswa terkait untuk investigasi titip presensi. Lakukan reset perangkat pada siswa yang meminjamkan/meminjam HP.`;
      } else if (systemLogsInvolvedCount >= 1 && distinctStudentsCount >= 2) {
        title = `Jejak Perangkat Multi-Akun (${distinctStudentsCount} Siswa Terhubung ke 1 HP)`;
        summary = `Hardware ID [${devId}] (${entry.deviceInfo}) tercatat berpindah tangan atau digunakan bergantian oleh ${distinctStudentsCount} akun siswa (${studentSummaryStr}) berdasarkan riwayat reset di system_logs dan jejak presensi.`;
        recommendation = `Konfirmasi kepemilikan riil smartphone kepada wali kelas/orang tua untuk memastikan ponsel tidak disalahgunakan untuk presensi akun lain.`;
      } else {
        title = `Duplikasi ID Perangkat (${distinctStudentsCount} Akun Siswa)`;
        summary = `Perangkat dengan ID [${devId}] terikat pada ${distinctStudentsCount} akun siswa: ${studentSummaryStr}.`;
        recommendation = `Lakukan verifikasi identitas perangkat di Database Manager dan reset perangkat pada akun yang tidak sah.`;
      }

      // Susun list bukti (maksimal 6 bukti terbaik)
      const evidenceItems = [];
      studentList.forEach((s) => {
        const srcLabels = Array.from(s.sources).join(', ');
        const latestEvent = s.events[s.events.length - 1];
        evidenceItems.push({
          label: `${s.nama} [NIS: ${s.nis}]`,
          desc: `Terdeteksi via [${srcLabels}] • ${latestEvent ? latestEvent.desc : 'Tercatat di sistem'}`
        });
      });

      findings.push({
        id: `anomaly-shared-${devId.substring(0, 10)}`,
        type: 'SHARED_DEVICE',
        categoryLabel: 'Device Sharing (Multi-Akun 1 HP)',
        severity,
        nis: studentList.map((s) => s.nis).join(' / '),
        nama: studentList.map((s) => s.nama).join(', '),
        kelas: studentList.map((s) => s.kelas).filter((k) => k !== '-').join(', ') || '-',
        title,
        summary,
        recommendation,
        evidence: evidenceItems,
        rawEvidenceCount: distinctStudentsCount,
        latestTimestamp: latestTs
      });
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 4. DETEKTOR 3: CHRONIC LAST-MINUTE ATTENDANCE (MENIT TERAKHIR)
  // -----------------------------------------------------------------
  detectLastMinuteAttendance(logAbsensi, sesiAbsensi, thresholdCount = 2) {
    const findings = [];
    const studentLateMap = new Map();

    // Map sesi created_at
    const sessionMap = new Map();
    sesiAbsensi.forEach((docSnap) => {
      const s = docSnap.data();
      let startMs = 0;
      if (s.created_at && s.created_at.seconds) startMs = s.created_at.seconds * 1000;
      sessionMap.set(docSnap.id, {
        id: docSnap.id,
        startMs,
        kelas: s.nama_kelas || s.id_kelas || '',
        mapel: s.nama_mapel || ''
      });
    });

    logAbsensi.forEach((docSnap) => {
      const d = docSnap.data();
      const sesiId = d.id_sesi;
      const nis = (d.nis || '').trim();
      const nama = d.nama_siswa || d.nama || 'Siswa';
      const kelas = d.nama_kelas || d.id_kelas || '-';

      if (!nis || !sesiId || !d.status || d.status.toLowerCase().includes('tidak')) return;

      const session = sessionMap.get(sesiId);
      let scanMs = 0;
      if (d.created_at && d.created_at.seconds) scanMs = d.created_at.seconds * 1000;

      // Jika ada session start time dan scan timestamp
      if (session && session.startMs && scanMs) {
        const diffMinutes = Math.floor((scanMs - session.startMs) / (60 * 1000));
        // Kategori menit terakhir: scan pada menit ke-50 s.d. 60 (10 menit sebelum sesi 1 jam berakhir)
        if (diffMinutes >= 50 && diffMinutes <= 90) {
          if (!studentLateMap.has(nis)) {
            studentLateMap.set(nis, {
              nis,
              nama,
              kelas,
              lateLogs: []
            });
          }
          studentLateMap.get(nis).lateLogs.push({
            tanggal: d.tanggal || '-',
            waktu: d.waktu || '-',
            diffMinutes,
            mapel: d.nama_mapel || session.mapel || 'Mapel',
            scanMs
          });
        }
      }
    });

    studentLateMap.forEach((entry, nis) => {
      if (entry.lateLogs.length >= thresholdCount) {
        entry.lateLogs.sort((a, b) => b.scanMs - a.scanMs);
        const count = entry.lateLogs.length;

        findings.push({
          id: `anomaly-lastmin-${nis}`,
          type: 'LAST_MINUTE',
          categoryLabel: 'Presensi Menit Terakhir',
          severity: count >= 3 ? 'HIGH' : 'MEDIUM',
          nis,
          nama: entry.nama,
          kelas: entry.kelas,
          title: `Kebiasaan Absen di Menit Terakhir (${count}x Terdeteksi)`,
          summary: `Siswa ini terdeteksi memiliki pola presensi konsisten pada 10 menit terakhir sesi presensi (${count} sesi presensi dilakukan di atas menit ke-50).`,
          recommendation: `Berikan teguran dan edukasi disiplin waktu agar siswa melakukan absensi di awal jam pelajaran/praktikum.`,
          evidence: entry.lateLogs.map((l) => ({
            label: `${l.tanggal} (${l.waktu})`,
            desc: `Scan di menit ke-${l.diffMinutes} sejak sesi dibuka • Mapel: ${l.mapel}`
          })),
          rawEvidenceCount: count,
          latestTimestamp: entry.lateLogs[0].scanMs
        });
      }
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 5. DETEKTOR 4: CHRONIC ABSENTEEISM (ALPA KRONIS / BERUNTUN)
  // -----------------------------------------------------------------
  detectChronicAbsenteeism(logAbsensi, siswaList, thresholdStreak = 3) {
    const findings = [];
    const studentAbsenceMap = new Map();

    logAbsensi.forEach((docSnap) => {
      const d = docSnap.data();
      const nis = (d.nis || '').trim();
      const status = (d.status || '').toLowerCase();
      const isAlpa = status.includes('tidak') || status.includes('alpa');

      if (!nis || !isAlpa) return;

      if (!studentAbsenceMap.has(nis)) {
        studentAbsenceMap.set(nis, {
          nis,
          nama: d.nama_siswa || d.nama || 'Siswa',
          kelas: d.nama_kelas || d.id_kelas || '-',
          alpaLogs: []
        });
      }

      let tsMs = 0;
      if (d.created_at && d.created_at.seconds) tsMs = d.created_at.seconds * 1000;
      else if (d.tanggal) tsMs = new Date(d.tanggal).getTime();

      studentAbsenceMap.get(nis).alpaLogs.push({
        tanggal: d.tanggal || '-',
        waktu: d.waktu || '-',
        mapel: d.nama_mapel || '-',
        tsMs
      });
    });

    studentAbsenceMap.forEach((entry, nis) => {
      const count = entry.alpaLogs.length;
      if (count >= thresholdStreak) {
        entry.alpaLogs.sort((a, b) => b.tsMs - a.tsMs);

        findings.push({
          id: `anomaly-alpa-${nis}`,
          type: 'CHRONIC_ABSENCE',
          categoryLabel: 'Alpa Kronis',
          severity: 'HIGH',
          nis,
          nama: entry.nama,
          kelas: entry.kelas,
          title: `Tingkat Ketidakhadiran Tinggi (${count}x Tidak Hadir)`,
          summary: `Siswa ini tercatat berstatus 'Tidak Hadir' sebanyak ${count} kali dalam riwayat presensi. Memerlukan penanganan segera untuk mencegah keterlambatan akademik.`,
          recommendation: `Koordinasikan dengan Guru Bimbingan Konseling (BK) dan orang tua siswa untuk mengetahui kendala kehadiran.`,
          evidence: entry.alpaLogs.slice(0, 5).map((l) => ({
            label: `${l.tanggal} (${l.waktu})`,
            desc: `Status: Tidak Hadir • Mapel: ${l.mapel}`
          })),
          rawEvidenceCount: count,
          latestTimestamp: entry.alpaLogs[0].tsMs
        });
      }
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 6. DETEKTOR 5: EARLY BIRDS (SISWA TELADAN TEPAT WAKTU)
  // -----------------------------------------------------------------
  detectEarlyBirds(logAbsensi, sesiAbsensi, minSessions = 4) {
    const findings = [];
    const studentEarlyMap = new Map();

    const sessionMap = new Map();
    sesiAbsensi.forEach((docSnap) => {
      const s = docSnap.data();
      let startMs = 0;
      if (s.created_at && s.created_at.seconds) startMs = s.created_at.seconds * 1000;
      sessionMap.set(docSnap.id, { startMs, mapel: s.nama_mapel || '' });
    });

    logAbsensi.forEach((docSnap) => {
      const d = docSnap.data();
      const sesiId = d.id_sesi;
      const nis = (d.nis || '').trim();
      if (!nis || !sesiId || !d.status || d.status.toLowerCase().includes('tidak')) return;

      const session = sessionMap.get(sesiId);
      if (session && session.startMs && d.created_at && d.created_at.seconds) {
        const scanMs = d.created_at.seconds * 1000;
        const diffMinutes = Math.floor((scanMs - session.startMs) / (60 * 1000));

        // Scan dalam 5 menit pertama pembukaan sesi
        if (diffMinutes >= 0 && diffMinutes <= 5) {
          if (!studentEarlyMap.has(nis)) {
            studentEarlyMap.set(nis, {
              nis,
              nama: d.nama_siswa || d.nama || 'Siswa',
              kelas: d.nama_kelas || d.id_kelas || '-',
              earlyLogs: []
            });
          }
          studentEarlyMap.get(nis).earlyLogs.push({
            tanggal: d.tanggal || '-',
            waktu: d.waktu || '-',
            diffMinutes,
            scanMs
          });
        }
      }
    });

    studentEarlyMap.forEach((entry, nis) => {
      if (entry.earlyLogs.length >= minSessions) {
        entry.earlyLogs.sort((a, b) => b.scanMs - a.scanMs);
        const count = entry.earlyLogs.length;

        findings.push({
          id: `insight-early-${nis}`,
          type: 'EARLY_BIRD',
          categoryLabel: 'Siswa Teladan (Early Bird)',
          severity: 'POSITIVE',
          nis,
          nama: entry.nama,
          kelas: entry.kelas,
          title: `Konsisten Hadir Tepat Waktu (${count}x Presensi Cepat)`,
          summary: `Siswa ini menunjukkan kedisiplinan tinggi dengan selalu melakukan presensi dalam 5 menit pertama pembukaan sesi (${count} sesi berturut-turut).`,
          recommendation: `Berikan apresiasi poin keaktifan atau reward kedisiplinan positif.`,
          evidence: entry.earlyLogs.slice(0, 5).map((l) => ({
            label: `${l.tanggal} (${l.waktu})`,
            desc: `Hadir pada menit ke-${l.diffMinutes} sejak sesi dibuka`
          })),
          rawEvidenceCount: count,
          latestTimestamp: entry.earlyLogs[0].scanMs
        });
      }
    });

    return findings;
  },

  // -----------------------------------------------------------------
  // 7. RENDER INSIGHT PANEL COMPONENT (HTML UI)
  // -----------------------------------------------------------------
  renderInsightsUI(containerEl, findingsList = [], options = {}) {
    if (!containerEl) return;

    if (findingsList.length === 0) {
      containerEl.innerHTML = `
        <div class="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-1.5 shadow-inner col-span-full">
          <i class="fa-solid fa-circle-check text-xl text-emerald-400"></i>
          <p class="text-xs font-bold text-white uppercase tracking-wider">Status Integritas Presensi: Sangat Baik</p>
          <p class="text-[11px] text-slate-400 font-mono">Belum ditemukan anomali perilaku presensi atau manipulasi perangkat yang mencurigakan.</p>
        </div>
      `;
      return;
    }

    let cardsHTML = '';

    findingsList.forEach((f, idx) => {
      const isHigh = f.severity === 'HIGH';
      const isPositive = f.severity === 'POSITIVE';

      let badgeBg = isHigh
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        : isPositive
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

      let cardBorder = isHigh
        ? 'border-rose-500/30 hover:border-rose-500/60 bg-rose-950/10'
        : isPositive
        ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/10'
        : 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10';

      let iconClass = isHigh
        ? 'fa-solid fa-triangle-exclamation text-rose-400'
        : isPositive
        ? 'fa-solid fa-award text-emerald-400'
        : 'fa-solid fa-clock-rotate-left text-amber-400';

      let evidenceHTML = '';
      if (f.evidence && f.evidence.length > 0) {
        evidenceHTML = `
          <div class="pt-2 border-t border-slate-800/80 space-y-1">
            <p class="text-[10px] font-bold text-slate-400 uppercase font-mono flex items-center gap-1">
              <i class="fa-solid fa-fingerprint text-cyan-400"></i> Jejak Bukti Data (${f.evidence.length}):
            </p>
            <div class="space-y-1 max-h-24 overflow-y-auto pr-1">
              ${f.evidence
                .map(
                  (ev) => `
                <div class="text-[10px] font-mono text-slate-300 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/60 flex items-start gap-1.5">
                  <span class="text-cyan-400 font-bold shrink-0">${ev.label}:</span>
                  <span class="text-slate-300 truncate">${ev.desc}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `;
      }

      cardsHTML += `
        <div class="glass-card p-3.5 sm:p-4 rounded-xl border ${cardBorder} shadow-lg flex flex-col justify-between gap-2.5 transition-all duration-200 h-full" data-finding-id="${f.id}">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs shrink-0">
                  <i class="${iconClass}"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white tracking-wide">${f.title}</h4>
                  <p class="text-[11px] text-cyan-300 font-mono">${f.nama} <span class="text-slate-400">[NIS: ${f.nis}]</span> ${f.kelas && f.kelas !== '-' ? `• ${f.kelas}` : ''}</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-mono border ${badgeBg} shrink-0">
                ${f.categoryLabel}
              </span>
            </div>

            <p class="text-[11px] text-slate-300 leading-relaxed font-sans">${f.summary}</p>

            <div class="p-2 bg-slate-950/80 rounded-lg border border-slate-800/80 text-[10px] text-amber-300/90 font-mono flex items-start gap-1.5">
              <i class="fa-solid fa-lightbulb text-amber-400 mt-0.5 shrink-0"></i>
              <span><strong>Rekomendasi:</strong> ${f.recommendation}</span>
            </div>

            ${evidenceHTML}
          </div>

          <!-- ACTION BUTTONS -->
          <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
            <button class="btn-copy-finding px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer" data-idx="${idx}">
              <i class="fa-solid fa-share-nodes"></i> <span>Salin Laporan WA</span>
            </button>

            ${
              f.nis && !f.nis.includes('/')
                ? `
            <button class="btn-filter-nis px-2.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer" data-nis="${f.nis}">
              <i class="fa-solid fa-filter"></i> <span>Filter Log Siswa</span>
            </button>
            `
                : ''
            }
          </div>
        </div>
      `;
    });

    containerEl.innerHTML = cardsHTML;

    // Attach Event Listeners to Buttons
    containerEl.querySelectorAll('.btn-copy-finding').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        const f = findingsList[idx];
        if (!f) return;

        const textToCopy = `📋 *LAPORAN INVESTIGASI PRESENSI - PORTAL ISKAK FATONI*\n` +
          `-----------------------------------------\n` +
          `🚨 *Temuan*: ${f.title}\n` +
          `👤 *Siswa*: ${f.nama} (NIS: ${f.nis})\n` +
          `🏫 *Kelas*: ${f.kelas}\n` +
          `⚠️ *Tingkat Risiko*: ${f.severity}\n\n` +
          `📝 *Ringkasan Masalah*:\n${f.summary}\n\n` +
          `💡 *Rekomendasi*: ${f.recommendation}\n` +
          `-----------------------------------------\n` +
          `_Dicatat otomatis oleh AI Attendance & Security Engine_`;

        navigator.clipboard.writeText(textToCopy).then(() => {
          const orig = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400"></i> <span>Laporan Tersalin!</span>';
          setTimeout(() => {
            btn.innerHTML = orig;
          }, 2500);
        });
      };
    });

    containerEl.querySelectorAll('.btn-filter-nis').forEach((btn) => {
      btn.onclick = () => {
        const nis = btn.dataset.nis;
        if (options.onFilterNis && nis) {
          options.onFilterNis(nis);
        }
      };
    });
  },

  // -----------------------------------------------------------------
  // 8. EKSPOR LAPORAN ANOMALI KE EXCEL (.XLSX)
  // -----------------------------------------------------------------
  exportToExcel(findingsList = [], filenamePrefix = 'Laporan_Anomali_Presensi') {
    if (typeof XLSX === 'undefined') {
      alert('Library XLSX tidak ditemukan.');
      return;
    }

    if (findingsList.length === 0) {
      alert('Tidak ada temuan anomali untuk diekspor.');
      return;
    }

    const rows = findingsList.map((f, index) => ({
      No: index + 1,
      'Tingkat Risiko': f.severity,
      'Kategori Temuan': f.categoryLabel,
      'Judul Kasus': f.title,
      NIS: f.nis,
      'Nama Siswa': f.nama,
      Kelas: f.kelas,
      'Ringkasan AI': f.summary,
      'Rekomendasi Tindakan': f.recommendation,
      'Total Bukti Kejadian': f.rawEvidenceCount,
      'Waktu Terakhir': f.latestTimestamp ? new Date(f.latestTimestamp).toLocaleString('id-ID') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 22 },
      { wch: 35 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 50 },
      { wch: 45 },
      { wch: 18 },
      { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Temuan_Anomali');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filenamePrefix}_${today}.xlsx`);
  }
};
