document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = '/api'; // adjust if your backend is on another path/origin

  // ---------- NAV ----------
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
  });

  // ---------- HERO CATBOT SHORTCUT ----------
  const openCatbotFromHero = document.getElementById('openCatbotFromHero');
  if (openCatbotFromHero) {
    openCatbotFromHero.addEventListener('click', () => {
      document.getElementById('catbot').scrollIntoView({ behavior: 'smooth' });
      document.getElementById('catbotInput').focus();
    });
  }

  // ---------- QUICK STATS (demo / backend) ----------
  const statDoctors = document.getElementById('statDoctors');
  const statLowStock = document.getElementById('statLowStock');
  const statAppointments = document.getElementById('statAppointments');

  async function loadQuickStats() {
    try {
      // You can replace this with real endpoints later, like:
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
      // demo fallback
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
      // demo logic fallback similar to backend
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
    try {
      const res = await fetch(`${API_BASE}/emergency`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ severity: 'high', note: 'Web emergency button used' })
      });
      if (!res.ok) throw new Error('Request failed');
      emergencyMsg.textContent = 'Emergency has been logged and forwarded to the desk.';
      emergencyMsg.style.color = '#bbf7d0';
    } catch (err) {
      emergencyMsg.textContent = 'Demo: emergency would be logged here. Connect backend to enable.';
      emergencyMsg.style.color = '#fde68a';
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
      loginMsg.style.color = '#b91c1c';
      return;
    }

    loginMsg.textContent = 'Signing in...';
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
      loginMsg.style.color = '#064e3b';

      // Load profile summary (for now demo data)
      profileSummary.innerHTML = `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Role:</strong> Employee</p>
        <p><strong>Dependents:</strong> Spouse, 1 Child</p>
        <p><strong>Next appointment:</strong> Dr. Sharma — Tomorrow 10:30 AM</p>
      `;
      historyPreview.innerHTML = `
        <li>Jan 2025 — Annual health check-up</li>
        <li>Mar 2025 — Follow-up for blood tests</li>
        <li class="muted">More details available in full history view.</li>
      `;
      reportUploadBlock.hidden = false;
    } catch (err) {
      loginMsg.textContent = 'Login failed. Use valid credentials or connect backend.';
      loginMsg.style.color = '#b91c1c';
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
        reportMsg.style.color = '#b91c1c';
        return;
      }
      const file = reportFile.files[0];
      const formData = new FormData();
      formData.append('file', file);

      reportMsg.textContent = 'Uploading report...';

      try {
        const res = await fetch(`${API_BASE}/reports/upload`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        reportMsg.textContent = `Uploaded: ${data.filename || file.name}`;
        reportMsg.style.color = '#064e3b';
      } catch (err) {
        reportMsg.textContent = 'Demo: report would be uploaded. Connect backend to enable.';
        reportMsg.style.color = '#b45309';
      }
    });
  }

  // ---------- SUPPORT / CONTACT FORM (same as before) ----------
  const form = document.getElementById('contactForm');
  const formMsg = document.getElementById('formMsg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      formMsg.textContent = 'Please complete all fields.';
      formMsg.style.color = '#b91c1c';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      formMsg.textContent = 'Please provide a valid email address.';
      formMsg.style.color = '#b91c1c';
      return;
    }

    formMsg.textContent = 'Thanks — your message has been recorded (demo).';
    formMsg.style.color = '#064e3b';

    setTimeout(() => {
      form.reset();
    }, 700);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    form.reset();
    formMsg.textContent = '';
  });
});
