document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api'; // adjust if backend is on another origin

  // ---------- NAV + PAGE SWITCHING ----------
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const pageSections = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.main-nav a[data-target]');

  function openPage(pageId) {
    pageSections.forEach(sec => {
      sec.classList.toggle('page-active', sec.id === pageId);
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.target === pageId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // close mobile nav
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      openPage(target);
    });
  });

  // ---------- HERO BUTTON SHORTCUTS ----------
  const openCatbotFromHero = document.getElementById('openCatbotFromHero');
  const openPortalFromHero = document.getElementById('openPortalFromHero');

  if (openCatbotFromHero) {
    openCatbotFromHero.addEventListener('click', () => {
      openPage('chatbot');
      const input = document.getElementById('catbotInput');
      if (input) input.focus();
    });
  }
  if (openPortalFromHero) {
    openPortalFromHero.addEventListener('click', () => {
      openPage('portalPage');
      const email = document.getElementById('loginEmail');
      if (email) email.focus();
    });
  }

  // ---------- QUICK STATS (demo / backend) ----------
  const statDoctors = document.getElementById('statDoctors');
  const statLowStock = document.getElementById('statLowStock');
  const statAppointments = document.getElementById('statAppointments');

  async function loadQuickStats() {
    try {
      // Replace with real endpoint later
      // const res = await fetch(`${API_BASE}/stats/overview`);
      // const data = await res.json();
      const data = {
        doctors_on_duty: 5,
        low_stock_medicines: 7,
        upcoming_appointments: 3
      };
      statDoctors.textContent = data.doctors_on_duty;
      statLowStock.textContent = data.low_stock_medicines;
      statAppointments.textContent = data.upcoming_appointments;
    } catch (e) {
      statDoctors.textContent = 'N/A';
      statLowStock.textContent = 'N/A';
      statAppointments.textContent = 'N/A';
    }
  }
  loadQuickStats();

  // ---------- MEDICINE AVAILABILITY ----------
  const medicineQuery = document.getElementById('medicineQuery');
  const checkMedicineBtn = document.getElementById('checkMedicineBtn');
  const medicineResults = document.getElementById('medicineResults');

  async function checkMedicine() {
    const q = medicineQuery.value.trim();
    medicineResults.innerHTML = '';
    if (!q) return;

    try {
      const res = await fetch(`${API_BASE}/medicines/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      if (!data.length) {
        medicineResults.innerHTML = '<li>No results found.</li>';
        return;
      }
      data.forEach(m => {
        const li = document.createElement('li');
        li.textContent = `${m.name} — Stock: ${m.stock} (Location: ${m.location})`;
        medicineResults.appendChild(li);
      });
    } catch (err) {
      medicineResults.innerHTML = `
        <li>Paracetamol 500mg — Stock: 125 (Pharmacy A)</li>
        <li>Ibuprofen 200mg — Stock: 60 (Pharmacy B)</li>
        <li class="muted">[Demo data – connect to backend later]</li>
      `;
    }
  }
  checkMedicineBtn.addEventListener('click', checkMedicine);
  medicineQuery.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkMedicine();
    }
  });

  // ---------- DOCTOR AVAILABILITY ----------
  const specialitySelect = document.getElementById('specialitySelect');
  const checkDoctorsBtn = document.getElementById('checkDoctorsBtn');
  const doctorResults = document.getElementById('doctorResults');

  async function checkDoctors() {
    doctorResults.innerHTML = '';
    const speciality = specialitySelect.value;

    try {
      const url = new URL(`${API_BASE}/doctors/availability`, window.location.origin);
      if (speciality) url.searchParams.set('speciality', speciality);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();

      if (!data.length) {
        doctorResults.innerHTML = '<li>No doctors found for the selected criteria.</li>';
        return;
      }
      data.forEach(d => {
        const li = document.createElement('li');
        li.textContent = `${d.doctor_name} (${d.speciality})`;
        doctorResults.appendChild(li);
      });
    } catch (err) {
      doctorResults.innerHTML = `
        <li>Dr. Sharma (General Physician) — Slots available today & tomorrow</li>
        <li>Dr. Kaur (Cardiologist) — Limited slots in the next 3 days</li>
        <li class="muted">[Demo data – connect to backend later]</li>
      `;
    }
  }
  checkDoctorsBtn.addEventListener('click', checkDoctors);

  // ---------- CATBOT ----------
  const catbotInput = document.getElementById('catbotInput');
  const catbotTextBtn = document.getElementById('catbotTextBtn');
  const catbotVoiceBtn = document.getElementById('catbotVoiceBtn');
  const catbotStatus = document.getElementById('catbotStatus');
  const catbotResponse = document.getElementById('catbotResponse');
  const cbPriority = document.getElementById('cbPriority');
  const cbSpeciality = document.getElementById('cbSpeciality');
  const cbAction = document.getElementById('cbAction');
  const cbMessage = document.getElementById('cbMessage');

  async function sendCatbot(text) {
    if (!text) return;
    catbotStatus.textContent = 'Analyzing symptoms...';
    catbotResponse.hidden = true;

    try {
      const res = await fetch(`${API_BASE}/catbot/triage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ symptoms_text: text })
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      cbPriority.textContent = data.priority;
      cbSpeciality.textContent = data.suggested_speciality;
      cbAction.textContent = data.suggest_action;
      cbMessage.textContent = data.message;
      catbotStatus.textContent = '';
      catbotResponse.hidden = false;
    } catch (err) {
      // demo fallback
      const lower = text.toLowerCase();
      let priority = 'normal';
      let speciality = 'General Physician';
      let action = 'appointment';
      let msg = 'You should book an appointment within the next 1–2 days.';

      if (['chest', 'breath', 'unconscious', 'severe pain'].some(k => lower.includes(k))) {
        priority = 'high';
        speciality = 'Cardiologist';
        action = 'emergency';
        msg = 'High priority – contact emergency desk immediately.';
      }

      cbPriority.textContent = priority;
      cbSpeciality.textContent = speciality;
      cbAction.textContent = action;
      cbMessage.textContent = msg + ' [Demo offline mode]';
      catbotStatus.textContent = '';
      catbotResponse.hidden = false;
    }
  }

  catbotTextBtn.addEventListener('click', () => {
    const text = catbotInput.value.trim();
    sendCatbot(text);
  });

  // Voice using Web Speech API (if available)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    catbotVoiceBtn.disabled = true;
    catbotVoiceBtn.textContent = '🎤 Not supported';
  } else {
    let recognizing = false;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      recognizing = true;
      catbotStatus.textContent = 'Listening... speak your symptoms.';
    };
    recognition.onend = () => {
      recognizing = false;
      catbotStatus.textContent = '';
    };
    recognition.onerror = () => {
      recognizing = false;
      catbotStatus.textContent = 'Could not capture audio. Try again or type your symptoms.';
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      catbotInput.value = transcript;
      sendCatbot(transcript);
    };

    catbotVoiceBtn.addEventListener('click', () => {
      if (recognizing) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  // ---------- EMERGENCY LOG ----------
  const notifyEmergencyBtn = document.getElementById('notifyEmergencyBtn');
  const emergencyMsg = document.getElementById('emergencyMsg');

  notifyEmergencyBtn.addEventListener('click', async () => {
    emergencyMsg.textContent = 'Notifying emergency desk...';
    emergencyMsg.style.color = '#fee2e2';
    try {
      const res = await fetch(`${API_BASE}/emergency`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ severity: 'high', note: 'Web emergency button used' })
      });
      if (!res.ok) throw new Error('Request failed');
      emergencyMsg.textContent = 'Emergency has been logged and forwarded to the desk.';
    } catch (err) {
      emergencyMsg.textContent = 'Demo: emergency would be logged here. Connect backend to enable.';
    }
  });

  // ---------- LOGIN / PORTAL ----------
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMsg');
  const profileSummary = document.getElementById('profileSummary');
  const historyPreview = document.getElementById('historyPreview');
  const reportUploadBlock = document.getElementById('reportUploadBlock');
  let authToken = null;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    if (!email || !password) {
      loginMsg.textContent = 'Please enter both email and password.';
      loginMsg.style.color = '#fca5a5';
      return;
    }

    loginMsg.textContent = 'Signing in...';
    loginMsg.style.color = '#9ca3af';
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      authToken = data.token;
      loginMsg.textContent = `Welcome, ${data.name}.`;
      loginMsg.style.color = '#bbf7d0';

      profileSummary.innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Role:</strong> Employee</p>
        <p><strong>Dependents:</strong> Spouse, 1 Child</p>
        <p><strong>Next appointment:</strong> Dr. Sharma — Tomorrow 10:30 AM</p>
      `;
      if (historyPreview) {
        historyPreview.innerHTML = `
          <li>Jan 2025 — Annual health check-up</li>
          <li>Mar 2025 — Follow-up for blood tests</li>
          <li class="muted">More details available in full history view.</li>
        `;
      }
      reportUploadBlock.hidden = false;
    } catch (err) {
      loginMsg.textContent = 'Login failed. Use valid credentials or connect backend.';
      loginMsg.style.color = '#fca5a5';
      authToken = null;
      profileSummary.innerHTML = '<p class="muted">Sign in to view your profile and family details.</p>';
      reportUploadBlock.hidden = true;
    }
  });

  // ---------- REPORT UPLOAD ----------
  const reportForm = document.getElementById('reportForm');
  const reportFile = document.getElementById('reportFile');
  const reportMsg = document.getElementById('reportMsg');

  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!reportFile.files.length) {
        reportMsg.textContent = 'Please select a file first.';
        reportMsg.style.color = '#fca5a5';
        return;
      }
      const file = reportFile.files[0];
      const formData = new FormData();
      formData.append('file', file);

      reportMsg.textContent = 'Uploading report...';
      reportMsg.style.color = '#9ca3af';

      try {
        const res = await fetch(`${API_BASE}/reports/upload`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        reportMsg.textContent = `Uploaded: ${data.filename || file.name}`;
        reportMsg.style.color = '#bbf7d0';
      } catch (err) {
        reportMsg.textContent = 'Demo: report would be uploaded. Connect backend to enable.';
        reportMsg.style.color = '#fde68a';
      }
    });
  }

  // ---------- SUPPORT / CONTACT FORM ----------
  const contactForm = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  const resetBtn = document.getElementById('resetBtn');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();

    if (!name || !email || !message) {
      formMsg.textContent = 'Please complete all fields.';
      formMsg.style.color = '#fca5a5';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      formMsg.textContent = 'Please provide a valid email address.';
      formMsg.style.color = '#fca5a5';
      return;
    }

    formMsg.textContent = 'Thanks — your message has been recorded (demo).';
    formMsg.style.color = '#bbf7d0';

    setTimeout(() => {
      contactForm.reset();
    }, 700);
  });

  resetBtn.addEventListener('click', () => {
    contactForm.reset();
    formMsg.textContent = '';
  });
});
