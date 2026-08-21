// assets/js/portal/portal-links.js
// 🌐 PUBLIC PORTAL LINK VIEWER & REAL-TIME HARDWARE STUDENT GREETING ENGINE

import { db } from "../config/firebase-config.js";
import { getHardwareFingerprint } from "../utils/device-fingerprint.js";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const dom = {
  marqueeWrapper: document.getElementById('marquee-wrapper'),
  runningTextContent: document.getElementById('running-text-content'),
  maintenanceView: document.getElementById('maintenance-view'),
  portalContentView: document.getElementById('portal-content-view'),
  publicLinksContainer: document.getElementById('public-links-container'),
  linkTotalBadge: document.getElementById('link-total-badge'),
  greetingWrapper: document.getElementById('greeting-wrapper'),
  greetingStudentName: document.getElementById('greeting-student-name'),
  greetingStudentClass: document.getElementById('greeting-student-class')
};

let unsubscribeProfile = null;

// 1. MEMERIKSA STATUS IKATAN DEVICE SECARA REAL-TIME
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const currentDeviceId = await getHardwareFingerprint();
    
    if (unsubscribeProfile) unsubscribeProfile();

    const qDevice = query(collection(db, "siswa"), where("device_id", "==", currentDeviceId));

    unsubscribeProfile = onSnapshot(qDevice, (snapshot) => {
      if (!snapshot.empty) {
        // DATA DITEMUKAN DI SERVER (HP TERIKAT)
        const studentData = snapshot.docs[0].data();
        showStudentGreeting(studentData.nama_siswa, studentData.nama_kelas || studentData.id_kelas);

        // Update LocalStorage hanya sebagai cache visual cepat
        const syncUser = {
          doc_id: snapshot.docs[0].id,
          nis: studentData.nis,
          nama_siswa: studentData.nama_siswa,
          id_kelas: studentData.id_kelas,
          nama_kelas: studentData.nama_kelas || studentData.id_kelas,
          device_id: currentDeviceId
        };
        localStorage.setItem('portal_siswa_user', JSON.stringify(syncUser));
      } else {
        // DATA TIDAK ADA DI SERVER (HP SUDAH DI-RESET)
        console.log("Portal: HP tidak terdaftar. Membersihkan sesi...");
        localStorage.removeItem('portal_siswa_user');
        localStorage.removeItem('siswa_session');
        if (dom.greetingWrapper) dom.greetingWrapper.classList.add('hidden');
      }
    });
  } catch (err) {
    console.error("Gagal memuat profil real-time:", err);
  }
});

function showStudentGreeting(name, kelas) {
  if (!name || !dom.greetingStudentName || !dom.greetingWrapper) return;
  dom.greetingStudentName.innerText = name;
  if (dom.greetingStudentClass) dom.greetingStudentClass.innerText = kelas || 'TEI';
  dom.greetingWrapper.classList.remove('hidden');
}

// 2. FUNGSI MENENTUKAN IKON & WARNA
function getLinkIconConfig(data) {
  let dbIcon = data.icon || "fa-solid fa-link";
  
  if (dbIcon.includes('fa-file-pen')) return { icon: dbIcon, cls: 'link-type-form' };
  if (dbIcon.includes('fa-palette')) return { icon: dbIcon, cls: 'link-type-canva' };
  if (dbIcon.includes('fa-file-pdf')) return { icon: dbIcon, cls: 'link-type-drive' };
  if (dbIcon.includes('fa-youtube')) return { icon: dbIcon, cls: 'link-type-youtube' };
  if (dbIcon.includes('fa-gamepad')) return { icon: dbIcon, cls: 'link-type-quiz' };
  if (dbIcon.includes('fa-whatsapp')) return { icon: dbIcon, cls: 'link-type-whatsapp' };
  if (dbIcon.includes('fa-github')) return { icon: dbIcon, cls: 'link-type-github' };
  if (dbIcon.includes('fa-google-drive')) return { icon: dbIcon, cls: 'link-type-drive' };
  if (dbIcon.includes('fa-file-lines')) return { icon: dbIcon, cls: 'link-type-form' };
  if (dbIcon.includes('fa-table-cells')) return { icon: dbIcon, cls: 'link-type-canva' };
  if (dbIcon.includes('fa-file-signature')) return { icon: dbIcon, cls: 'link-type-form' };
  if (dbIcon.includes('fa-cubes')) return { icon: dbIcon, cls: 'link-type-default' };
  if (dbIcon.includes('fa-android')) return { icon: dbIcon, cls: 'link-type-whatsapp' };
  
  const t = (data.title || "").toLowerCase();
  const u = (data.url || "").toLowerCase();

  if (u.includes('forms.google.com') || u.includes('forms.gle') || u.includes('/forms/') || t.includes('form') || t.includes('tugas') || t.includes('upload')) {
    return { icon: 'fa-solid fa-file-pen', cls: 'link-type-form' };
  }

  if (u.includes('canva.com') || u.includes('canva.link') || t.includes('canva')) {
    return { icon: 'fa-solid fa-palette', cls: 'link-type-canva' };
  }

  if (u.includes('drive.google.com') || u.includes('docs.google.com') || t.includes('drive') || t.includes('modul') || t.includes('pdf')) {
    return { icon: 'fa-solid fa-file-pdf', cls: 'link-type-drive' };
  }

  if (u.includes('youtube.com') || u.includes('youtu.be') || t.includes('video') || t.includes('youtube')) {
    return { icon: 'fa-brands fa-youtube', cls: 'link-type-youtube' };
  }

  if (u.includes('quizizz.com') || t.includes('quiz') || t.includes('ujian')) {
    return { icon: 'fa-solid fa-gamepad', cls: 'link-type-quiz' };
  }

  if (u.includes('wa.me') || u.includes('whatsapp.com') || t.includes('wa') || t.includes('grup')) {
    return { icon: 'fa-brands fa-whatsapp', cls: 'link-type-whatsapp' };
  }

  if (u.includes('github.com') || t.includes('github') || t.includes('koding') || t.includes('code')) {
    return { icon: 'fa-brands fa-github', cls: 'link-type-github' };
  }

  return { icon: dbIcon, cls: 'link-type-default' };
}

// 3. LISTEN REALTIME STATUS PORTAL ON / OFF
if (dom.maintenanceView && dom.portalContentView) {
  onSnapshot(doc(db, "settings", "portal_status"), (docSnap) => {
    let isOnline = true;

    if (docSnap.exists()) {
      const data = docSnap.data();
      isOnline = data.is_online !== false;
    }

    if (isOnline) {
      dom.maintenanceView.classList.add('hidden');
      dom.portalContentView.classList.remove('hidden');
    } else {
      dom.maintenanceView.classList.remove('hidden');
      dom.portalContentView.classList.add('hidden');
    }
  });
}

// 4. LISTEN REALTIME RUNNING TEXT
if (dom.runningTextContent && dom.marqueeWrapper) {
  onSnapshot(doc(db, "settings", "announcement"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const textVal = data.text || data.announcement || data.content || "";

      if (textVal && textVal.trim() !== "") {
        dom.runningTextContent.innerText = textVal;
        dom.marqueeWrapper.classList.remove('hidden');
        return;
      }
    }
    dom.marqueeWrapper.classList.add('hidden');
  });
}

// 5. LISTEN REALTIME DAFTAR LINK TERURUT
if (dom.publicLinksContainer) {
  const qLinks = query(collection(db, "links"), orderBy("order", "asc"));

  onSnapshot(qLinks, (snapshot) => {
    dom.publicLinksContainer.innerHTML = '';

    let activeCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      if (data.is_active === false) return;

      activeCount++;
      const iconConfig = getLinkIconConfig(data);

      const a = document.createElement('a');
      a.href = data.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "link-card-item";

      // FIX NATIVE 1.5.0: Jika di Android Native, buka di browser eksternal
      a.addEventListener('click', (e) => {
        if (window.AndroidNativeBridge && typeof window.AndroidNativeBridge.openExternalBrowser === 'function') {
          e.preventDefault();
          console.log("Membuka via Native Browser:", data.url);
          window.AndroidNativeBridge.openExternalBrowser(data.url);
        }
      });

      a.innerHTML = `
        <div class="link-info">
          <div class="link-icon-box ${iconConfig.cls}">
            <i class="${iconConfig.icon}"></i>
          </div>
          <div class="link-text">
            <h3><span class="link-number">${activeCount}.</span>${data.title}</h3>
          </div>
        </div>
        <i class="fa-solid fa-arrow-up-right-from-square arrow-icon"></i>
      `;

      dom.publicLinksContainer.appendChild(a);
    });

    if (dom.linkTotalBadge) dom.linkTotalBadge.innerText = `${activeCount} Link`;

    if (activeCount === 0) {
      dom.publicLinksContainer.innerHTML = '<p class="muted-note">// Belum ada tautan aktif yang dibagikan.</p>';
    }
  });
}
