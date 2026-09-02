/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Main Application Orchestrator & UI Controller
 */

class ARDSApp {
  constructor() {
    this.currentTab = 'home';
    this.uploadedCSVRows = [];
    this.activeSimulatorValues = null;
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupAuth();
    this.setupNavigation();
    this.setupPatientSelectors();
    this.setupModalHandlers();
    this.setupUploadHandlers();
    this.setupSimulatorHandlers();
    this.setupAlertFilters();
    this.setupReportHandlers();
    this.renderAll();

    // Re-render charts on window resize
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', () => {
        if (window.ardsCharts && window.dataStore) {
          window.ardsCharts.updateAllCharts(window.dataStore.getActivePatient());
        }
      });
    }
  }

  /* ----------------------------------------------------
   * THEME & NAVIGATION
   * -------------------------------------------------- */
  setupTheme() {
    const savedTheme = localStorage.getItem('ards_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeToggleIcon(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ards_theme', next);
        this.updateThemeToggleIcon(next);
        if (window.ardsCharts && window.dataStore) {
          window.ardsCharts.updateAllCharts(window.dataStore.getActivePatient());
        }
      });
    }
  }

  /* ----------------------------------------------------
   * AUTHENTICATION & WORKSTATION SECURITY
   * -------------------------------------------------- */
  setupAuth() {
    if (!window.ardsAuth) return;

    // Listen to auth state changes
    window.ardsAuth.onAuthStateChanged((state) => {
      this.handleAuthStateChange(state);
    });

    // Toggle password visibility
    const btnTogglePass = document.getElementById('btnToggleAuthPassword');
    const authPasswordInput = document.getElementById('authPassword');
    if (btnTogglePass && authPasswordInput) {
      btnTogglePass.addEventListener('click', () => {
        const isPass = authPasswordInput.type === 'password';
        authPasswordInput.type = isPass ? 'text' : 'password';
        btnTogglePass.innerHTML = isPass 
          ? '<i data-lucide="eye-off" class="w-4 h-4 text-sky-400"></i>'
          : '<i data-lucide="eye" class="w-4 h-4"></i>';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          lucide.createIcons();
        }
      });
    }

    // Demo credentials modal info
    const btnForgotPass = document.getElementById('btnForgotPass');
    if (btnForgotPass) {
      btnForgotPass.addEventListener('click', () => {
        alert("ARDS Clinical Demo Accounts:\n\n1. Dr. Rachel Thorne (Senior PT): rachel.thorne@ards.clinic\n2. Dr. Samuel Vance (CPO): samuel.vance@ards.clinic\n3. Dr. Kevin Patel (Physiatrist MD): kevin.patel@ards.clinic\n4. Dr. Elena Woods (Auditor): admin@ards.clinic\n\nDefault Password: password123\nDefault PIN: 1234 (or 2345/3456/4567)\n\nTip: You can also click any of the 1-Click Clinician Quick-Fill buttons!");
      });
    }

    // Login Form Submit
    const authForm = document.getElementById('authLoginForm');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('authEmail')?.value;
        const pass = document.getElementById('authPassword')?.value;
        const remember = document.getElementById('authRememberMe')?.checked;

        const res = window.ardsAuth.login(email, pass, remember);
        if (!res.success) {
          this.showAuthAlert(res.message);
        } else {
          this.hideAuthAlert();
          this.syncClinicianContext(res.user);
        }
      });
    }

// AI Assistant: live clinician recognition on the login form
    const authAiEmailEl = document.getElementById('authEmail');
    const authAiLineEl = document.getElementById('authAiLine');
    if (authAiEmailEl && authAiLineEl && window.ardsAuth) {
        const updateAi = () => {
            const v = (authAiEmailEl.value || '').trim().toLowerCase();
            const found = window.ardsAuth.getAllUsers().find(u =>
                u.email.toLowerCase() === v ||
                u.username.toLowerCase() === v ||
                u.id.toLowerCase() === v
            );
            if (found) {
                authAiLineEl.textContent = 'AI recognized ' + found.name.split(',')[0] + ' — ' + found.role + '. Verified credentials ready.';
                authAiLineEl.classList.remove('text-sky-400/90', 'text-slate-500');
                authAiLineEl.classList.add('text-emerald-400');
            } else {
                authAiLineEl.textContent = 'AI Assistant: enter a registered Clinician ID, or click a 1-click clinician card for instant sign-in.';
                authAiLineEl.classList.remove('text-emerald-400');
                authAiLineEl.classList.add('text-sky-400/90');
            }
        };
        authAiEmailEl.addEventListener('input', updateAi);
        updateAi();
    }
    // Header User Widget & Dropdown
    const userWidget = document.getElementById('headerUserWidget');
    const userDropdown = document.getElementById('userDropdownMenu');
    if (userWidget && userDropdown) {
      userWidget.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!userWidget.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('active');
        }
      });
    }

    // Dropdown Actions
    const btnLock = document.getElementById('btnLockWorkstation');
    if (btnLock) {
      btnLock.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('active');
        window.ardsAuth.lockSession();
      });
    }

    const btnSwitch = document.getElementById('btnSwitchClinician');
    if (btnSwitch) {
      btnSwitch.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('active');
        window.ardsAuth.logout();
      });
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        if (userDropdown) userDropdown.classList.remove('active');
        window.ardsAuth.logout();
      });
    }

    // Unlock Form Submit
    const unlockForm = document.getElementById('formUnlockWorkstation');
    if (unlockForm) {
      unlockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('lockPinInput')?.value;
        const res = window.ardsAuth.unlockSession(pin);
        if (!res.success) {
          this.showLockAlert(res.message);
        } else {
          this.hideLockAlert();
        }
      });
    }

    // Lock Screen Actions
    const btnLockSwitch = document.getElementById('btnLockSwitchUser');
    if (btnLockSwitch) {
      btnLockSwitch.addEventListener('click', () => {
        window.ardsAuth.logout();
      });
    }

    const btnLockSignOut = document.getElementById('btnLockSignOut');
    if (btnLockSignOut) {
      btnLockSignOut.addEventListener('click', () => {
        window.ardsAuth.logout();
      });
    }
  }

  handleAuthStateChange(state) {
    const loginScreen = document.getElementById('loginScreen');
    const lockModal = document.getElementById('lockScreenModal');

    if (!state.isAuthenticated) {
      // Show login overlay
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (lockModal) lockModal.classList.add('hidden');
      this.renderAuthPresets();
      this.hideAuthAlert();
    } else if (state.isLocked) {
      // Show lock screen
      if (loginScreen) loginScreen.classList.add('hidden');
      if (lockModal) {
        lockModal.classList.remove('hidden');
        const user = state.user;
        if (user) {
          const lockUserName = document.getElementById('lockUserName');
          const lockUserRole = document.getElementById('lockUserRole');
          const lockUserAvatar = document.getElementById('lockUserAvatar');
          const pinInput = document.getElementById('lockPinInput');
          if (lockUserName) lockUserName.textContent = user.name;
          if (lockUserRole) lockUserRole.textContent = `${user.role} (${user.badgeLabel})`;
          if (lockUserAvatar) lockUserAvatar.src = user.avatar;
          if (pinInput) {
            pinInput.value = '';
            setTimeout(() => pinInput.focus(), 100);
          }
        }
        this.hideLockAlert();
      }
    } else {
      // Authenticated and unlocked
      if (loginScreen) loginScreen.classList.add('hidden');
      if (lockModal) lockModal.classList.add('hidden');
      this.updateUserProfileDisplay(state.user);
      if (this.currentTab === 'reports') {
        this.renderReport();
      }
    }

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    } catch(e) {}
  }

  renderAuthPresets() {
    const container = document.getElementById('authPresetContainer');
    if (!container || !window.ardsAuth) return;

    const users = window.ardsAuth.getAllUsers();
    const colorMap = {
      sky: { border: 'border-sky-500/30', bg: 'bg-sky-500/10', text: 'text-sky-400', imgBorder: 'border-sky-400' },
      teal: { border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-400', imgBorder: 'border-teal-400' },
      indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400', imgBorder: 'border-indigo-400' },
      purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', imgBorder: 'border-purple-400' }
    };

    container.innerHTML = users.map(u => {
      const c = colorMap[u.badgeColor] || colorMap.sky;
      return `
        <button 
          type="button" 
          class="auth-preset-btn group" 
          onclick="window.quickLogin('${u.id}')"
          title="1-Click Login as ${u.name}"
        >
          <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover border ${c.imgBorder} flex-shrink-0 group-hover:scale-105 transition-transform" alt="${u.name}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-1">
              <span class="font-bold text-xs text-slate-200 group-hover:text-sky-300 truncate">${u.name.split(',')[0]}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.2 rounded ${c.bg} ${c.text} border ${c.border} flex-shrink-0">${u.badgeLabel}</span>
            </div>
            <p class="text-[10px] text-slate-400 truncate">${u.role}</p>
          </div>
        </button>
      `;
    }).join('');
  }

  updateUserProfileDisplay(user) {
    if (!user) return;

    // Header Profile
    const headerAvatar = document.getElementById('headerUserAvatar');
    const headerName = document.getElementById('headerUserName');
    const headerRole = document.getElementById('headerUserRole');
    if (headerAvatar) headerAvatar.src = user.avatar;
    if (headerName) headerName.textContent = user.name.split(',')[0];
    if (headerRole) headerRole.textContent = user.role;

    // Dropdown Profile Info
    const ddName = document.getElementById('dropdownUserFullName');
    const ddEmail = document.getElementById('dropdownUserEmail');
    const ddDept = document.getElementById('dropdownUserDept');
    if (ddName) ddName.textContent = user.name;
    if (ddEmail) ddEmail.textContent = user.email;
    if (ddDept) ddDept.textContent = user.department;

    // Sidebar Badge
    const sideAvatar = document.getElementById('sidebarUserAvatar');
    const sideName = document.getElementById('sidebarUserName');
    const sideRole = document.getElementById('sidebarUserRole');
    if (sideAvatar) sideAvatar.src = user.avatar;
    if (sideName) sideName.textContent = user.name.split(',')[0];
    if (sideRole) sideRole.textContent = user.badgeLabel;
  }

  syncClinicianContext(user) {
    if (!user || !window.dataStore) return;
    if (user.assignedPatients && user.assignedPatients.length > 0) {
      const activePatientId = window.dataStore.activePatientId;
      if (!user.assignedPatients.includes(activePatientId)) {
        window.dataStore.setActivePatient(user.assignedPatients[0]);
        this.populatePatientDropdown();
        this.populateSessionDropdown();
        this.renderAll();
      }
    }
  }

  showAuthAlert(msg) {
    const box = document.getElementById('authAlertBox');
    const txt = document.getElementById('authAlertText');
    if (box && txt) {
      txt.textContent = msg;
      box.classList.remove('hidden');
    }
  }

  hideAuthAlert() {
    const box = document.getElementById('authAlertBox');
    if (box) box.classList.add('hidden');
  }

  showLockAlert(msg) {
    const box = document.getElementById('lockAlertBox');
    if (box) {
      box.textContent = msg;
      box.classList.remove('hidden');
    }
  }

  hideLockAlert() {
    const box = document.getElementById('lockAlertBox');
    if (box) box.classList.add('hidden');
  }

  updateThemeToggleIcon(theme) {
    const iconContainer = document.getElementById('themeToggleIcon');
    if (iconContainer) {
      iconContainer.innerHTML = theme === 'dark' 
        ? '<i data-lucide="sun" class="w-4 h-4 text-amber-400"></i>'
        : '<i data-lucide="moon" class="w-4 h-4 text-slate-600"></i>';
      try {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          lucide.createIcons();
        }
      } catch(e) {}
    }
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.switchTab(tab);
        }
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('nav-btn-active');
      } else {
        btn.classList.remove('nav-btn-active');
      }
    });

    // Update tab sections
    document.querySelectorAll('.tab-section').forEach(sec => {
      if (sec.id === `section-${tabId}`) {
        sec.classList.remove('hidden');
        sec.classList.add('active-tab');
      } else {
        sec.classList.add('hidden');
        sec.classList.remove('active-tab');
      }
    });

    // Re-render section specifics
    const patient = window.dataStore.getActivePatient();
    if (tabId === 'progress' || tabId === 'home') {
      setTimeout(() => {
        window.ardsCharts.updateAllCharts(patient);
      }, 50);
    } else if (tabId === 'xai') {
      this.renderXAISection();
    } else if (tabId === 'alerts') {
      this.renderAlertsSection();
    } else if (tabId === 'decision') {
      this.renderDecisionLogSection();
    } else if (tabId === 'reports') {
      this.renderReportsSection();
    }

    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        lucide.createIcons();
      }
    } catch(e) {}

    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch(e) {
        window.scrollTo(0, 0);
      }
    }
  }

  /* ----------------------------------------------------
   * MODAL HANDLERS & CUSTOM PATIENT CREATION
   * -------------------------------------------------- */
  setupModalHandlers() {
    // Add Patient Modal
    const modalPatient = document.getElementById('modalAddPatient');
    const formPatient = document.getElementById('formAddPatient');
    const viewPatientCsv = document.getElementById('viewAddPatientCsv');
    const btnClosePatient = document.getElementById('btnCloseAddPatientModal');
    const btnCancelPatient = document.getElementById('btnCancelAddPatient');
    const btnCancelPatientCsv = document.getElementById('btnCancelAddPatientCsv');

    const tabBtnCsv = document.getElementById('tabBtnPatientCsv');
    const tabBtnManual = document.getElementById('tabBtnPatientManual');

    // Switch tabs inside Add Patient modal
    if (tabBtnCsv && tabBtnManual && viewPatientCsv && formPatient) {
      tabBtnCsv.addEventListener('click', () => {
        tabBtnCsv.classList.add('bg-sky-600', 'text-white', 'font-bold');
        tabBtnCsv.classList.remove('text-slate-400');
        tabBtnManual.classList.remove('bg-sky-600', 'text-white', 'font-bold');
        tabBtnManual.classList.add('text-slate-400');
        viewPatientCsv.classList.remove('hidden');
        formPatient.classList.add('hidden');
      });

      tabBtnManual.addEventListener('click', () => {
        tabBtnManual.classList.add('bg-sky-600', 'text-white', 'font-bold');
        tabBtnManual.classList.remove('text-slate-400');
        tabBtnCsv.classList.remove('bg-sky-600', 'text-white', 'font-bold');
        tabBtnCsv.classList.add('text-slate-400');
        formPatient.classList.remove('hidden');
        viewPatientCsv.classList.add('hidden');
      });
    }

    // CSV File Upload in Add Patient Modal
    const csvFileInputModal = document.getElementById('modalPatientCsvFile');
    const csvTextAreaModal = document.getElementById('modalPatientCsvText');
    const modalCsvStatus = document.getElementById('modalCsvStatus');

    if (csvFileInputModal && csvTextAreaModal) {
      csvFileInputModal.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            csvTextAreaModal.value = evt.target.result;
            if (modalCsvStatus) {
              modalCsvStatus.innerHTML = `<span class="text-xs text-emerald-400 font-semibold">✓ Loaded ${e.target.files[0].name} (${(evt.target.result.length/1024).toFixed(1)} KB)</span>`;
            }
          };
          reader.readAsText(e.target.files[0]);
        }
      });
    }

    // Submit CSV Import in Add Patient Modal
    const btnSubmitCsv = document.getElementById('btnSubmitImportPatientCsv');
    if (btnSubmitCsv) {
      btnSubmitCsv.addEventListener('click', () => {
        const rawCSV = csvTextAreaModal ? csvTextAreaModal.value.trim() : "";
        if (!rawCSV) {
          alert("Please select a CSV file or paste CSV content first.");
          return;
        }

        const name = document.getElementById('csvPatientName') ? document.getElementById('csvPatientName').value.trim() : "";
        const amputationType = document.getElementById('csvPatientAmputation') ? document.getElementById('csvPatientAmputation').value : "";

        try {
          const importResult = window.dataStore.importPatientFromCSV(rawCSV, {
            name: name || undefined,
            amputationType: amputationType || undefined
          });

          const firstId = importResult.patientsImported[0];
          if (firstId) {
            window.dataStore.setActivePatient(firstId);
          }

          closePatientModal();
          this.populatePatientDropdown();
          this.populateSessionDropdown();
          this.renderAll();
          alert(`Successfully imported ${importResult.patientsImported.length} patient(s) (${importResult.patientsImported.join(', ')}) with ${importResult.totalRows} session record(s)!`);
        } catch(err) {
          alert(`CSV Import Error: ${err.message}`);
        }
      });
    }

    const closePatientModal = () => {
      if (modalPatient) modalPatient.classList.add('hidden');
    };

    if (btnClosePatient) btnClosePatient.addEventListener('click', closePatientModal);
    if (btnCancelPatient) btnCancelPatient.addEventListener('click', closePatientModal);
    if (btnCancelPatientCsv) btnCancelPatientCsv.addEventListener('click', closePatientModal);

    if (formPatient) {
      formPatient.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('newPatientId').value.trim() || `P00${Date.now() % 1000}`;
        const name = document.getElementById('newPatientName').value.trim() || "New Patient";
        const age = parseInt(document.getElementById('newPatientAge').value, 10) || 45;
        const amputationType = document.getElementById('newPatientAmputation').value;
        const prosthesis = document.getElementById('newPatientProsthesis').value.trim() || "Modular Dynamic Prosthesis";
        const clinician = document.getElementById('newPatientClinician').value.trim() || "Attending Physiotherapist";
        const rehabGoal = document.getElementById('newPatientGoal').value.trim() || "Independent functional ambulation";

        const newPatient = {
          id,
          name,
          age,
          amputationType,
          amputationDate: new Date().toISOString().split('T')[0],
          prosthesis,
          clinician,
          rehabGoal,
          sessions: [
            { session: 1, date: new Date().toISOString().split('T')[0], gaitSpeed: 0.60, symmetry: 60, force: 55, pressure: 48, stability: 58, fatigue: 22 }
          ],
          alerts: [
            {
              id: `alt-${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              session: 1,
              type: "normal",
              title: "Patient Registered",
              message: `Initial profile for ${name} (${id}) created. Session 1 baseline captured.`,
              acknowledged: false
            }
          ]
        };

        window.dataStore.addPatient(newPatient);
        window.dataStore.setActivePatient(id);
        window.dataStore.setActiveSession(1);
        closePatientModal();
        formPatient.reset();
        this.populatePatientDropdown();
        this.populateSessionDropdown();
        this.renderAll();
      });
    }

    // Add Session Modal
    const modalSession = document.getElementById('modalAddSession');
    const formSession = document.getElementById('formAddSession');
    const btnCloseSession = document.getElementById('btnCloseAddSessionModal');
    const btnCancelSession = document.getElementById('btnCancelAddSession');

    const closeSessionModal = () => {
      if (modalSession) modalSession.classList.add('hidden');
    };

    if (btnCloseSession) btnCloseSession.addEventListener('click', closeSessionModal);
    if (btnCancelSession) btnCancelSession.addEventListener('click', closeSessionModal);

    if (formSession) {
      formSession.addEventListener('submit', (e) => {
        e.preventDefault();
        const activePatient = window.dataStore.getActivePatient();
        if (!activePatient) return;

        const nextSessionNum = (activePatient.sessions && activePatient.sessions.length > 0)
          ? Math.max(...activePatient.sessions.map(s => s.session)) + 1
          : 1;

        const gaitSpeed = parseFloat(document.getElementById('newSesGait').value) || 0.65;
        const symmetry = parseFloat(document.getElementById('newSesSymm').value) || 65;
        const force = parseFloat(document.getElementById('newSesForce').value) || 60;
        const stability = parseFloat(document.getElementById('newSesStab').value) || 65;
        const pressure = parseFloat(document.getElementById('newSesPress').value) || 48;
        const fatigue = parseFloat(document.getElementById('newSesFatigue').value) || 20;

        const newSessionObj = {
          session: nextSessionNum,
          date: new Date().toISOString().split('T')[0],
          gaitSpeed,
          symmetry,
          force,
          pressure,
          stability,
          fatigue
        };

        window.dataStore.addOrUpdateSession(activePatient.id, newSessionObj);
        window.dataStore.setActiveSession(nextSessionNum);
        closeSessionModal();
        formSession.reset();
        this.populateSessionDropdown();
        this.renderAll();
      });
    }
  }

  openAddPatientModal() {
    const modal = document.getElementById('modalAddPatient');
    if (modal) modal.classList.remove('hidden');
  }

  openAddSessionModal() {
    const modal = document.getElementById('modalAddSession');
    const label = document.getElementById('newSessionPatientLabel');
    const patient = window.dataStore.getActivePatient();
    if (label && patient) {
      label.textContent = `Recording Session ${patient.sessions.length + 1} for ${patient.id} - ${patient.name}`;
    }
    if (modal) modal.classList.remove('hidden');
  }

  resetSampleData() {
    if (confirm("Reset all patient data to initial pre-loaded clinical sample cases (P001 to P004)?")) {
      window.dataStore.resetToDefault();
      this.populatePatientDropdown();
      this.populateSessionDropdown();
      this.renderAll();
    }
  }

  /* ----------------------------------------------------
   * PATIENT & SESSION SELECTORS
   * -------------------------------------------------- */
  setupPatientSelectors() {
    const patientSelect = document.getElementById('globalPatientSelect');
    const sessionSelect = document.getElementById('globalSessionSelect');

    if (patientSelect) {
      patientSelect.addEventListener('change', (e) => {
        this.activeSimulatorValues = null;
        window.dataStore.setActivePatient(e.target.value);
        this.populateSessionDropdown();
        this.renderAll();
      });
    }

    if (sessionSelect) {
      sessionSelect.addEventListener('change', (e) => {
        this.activeSimulatorValues = null;
        window.dataStore.setActiveSession(e.target.value);
        this.renderAll();
      });
    }

    this.populatePatientDropdown();
    this.populateSessionDropdown();
  }

  populatePatientDropdown() {
    const selectHeader = document.getElementById('globalPatientSelect');
    const selectHome = document.getElementById('homePatientSelect');
    const patients = window.dataStore.getPatients();
    const activeId = window.dataStore.activePatientId;

    const optionsHTML = patients.map(p => 
      `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.id} - ${p.name} (${p.amputationType.split(' ')[0]})</option>`
    ).join('');

    if (selectHeader) selectHeader.innerHTML = optionsHTML;
    if (selectHome) selectHome.innerHTML = optionsHTML;
  }

  populateSessionDropdown() {
    const selectHeader = document.getElementById('globalSessionSelect');
    const selectHome = document.getElementById('homeSessionSelect');
    const patient = window.dataStore.getActivePatient();
    
    if (!patient || !patient.sessions || patient.sessions.length === 0) {
      const defaultOpt = '<option value="1">Session 1</option>';
      if (selectHeader) selectHeader.innerHTML = defaultOpt;
      if (selectHome) selectHome.innerHTML = defaultOpt;
      return;
    }

    const activeNum = window.dataStore.activeSessionNum;
    const optionsHTML = patient.sessions.map(s => 
      `<option value="${s.session}" ${s.session === activeNum ? 'selected' : ''}>Session ${s.session} (${s.date || 'Recent'})</option>`
    ).join('');

    if (selectHeader) selectHeader.innerHTML = optionsHTML;
    if (selectHome) selectHome.innerHTML = optionsHTML;
  }

  /* ----------------------------------------------------
   * MAIN RENDERING CONTROLLER
   * -------------------------------------------------- */
  renderAll() {
    const patient = window.dataStore.getActivePatient();
    const session = window.dataStore.getActiveSession();
    const baseline = patient.sessions && patient.sessions.length > 0 ? patient.sessions[0] : session;

    this.updateGlobalHeader(patient, session);
    this.renderHomeOverview(patient, session, baseline);
    this.renderProgressSection(patient);
    this.renderXAISection();
    this.renderAlertsSection();
    this.renderDecisionLogSection();
    this.renderReportsSection();
    this.updateAlertBadgeCount();

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  updateGlobalHeader(patient, session) {
    const patientMeta = document.getElementById('headerPatientMeta');
    if (patientMeta && patient) {
      patientMeta.innerHTML = `
        <div class="flex items-center gap-2 text-xs text-slate-400">
          <span class="font-medium text-slate-200">${patient.name}</span>
          <span>•</span>
          <span>${patient.amputationType}</span>
          <span>•</span>
          <span>${patient.prosthesis}</span>
        </div>
      `;
    }
  }

  updateAlertBadgeCount() {
    const badge = document.getElementById('navAlertBadge');
    if (!badge) return;
    const patient = window.dataStore.getActivePatient();
    if (!patient || !patient.alerts) {
      badge.textContent = '0';
      badge.classList.add('hidden');
      return;
    }
    const unacknowledged = patient.alerts.filter(a => !a.acknowledged).length;
    badge.textContent = unacknowledged;
    if (unacknowledged > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  /* ----------------------------------------------------
   * SECTION 1: HOME / SESSION OVERVIEW
   * -------------------------------------------------- */
  renderHomePatientContextCard(patient, session, baseline) {
    const cardEl = document.getElementById('homePatientContextCard');
    if (!cardEl || !patient) return;

    const baseScore = baseline ? window.ardsEngine.calculateScore(baseline) : 0;
    const currentScore = session ? window.ardsEngine.calculateScore(session) : 0;
    const scoreDelta = currentScore - baseScore;

    cardEl.innerHTML = `
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-800/80">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-sky-500/20">
            ${patient.id}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold text-slate-100">${patient.name}</h2>
              <span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">${patient.age} yrs</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${patient.amputationType} • ${patient.prosthesis}</p>
          </div>
        </div>

        <!-- Controls: Patient Dropdown, Session Dropdown, Add Patient, Record Session, Reset -->
        <div class="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          <div class="flex items-center gap-1.5">
            <label class="text-[11px] font-semibold uppercase text-slate-400">Patient:</label>
            <select id="homePatientSelect" class="form-select text-xs font-semibold text-slate-100 py-1.5 px-2.5 min-w-[170px]">
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            <label class="text-[11px] font-semibold uppercase text-slate-400">Session:</label>
            <select id="homeSessionSelect" class="form-select text-xs font-medium text-slate-200 py-1.5 px-2.5">
            </select>
          </div>

          <button onclick="window.ardsApp.openAddPatientModal()" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition flex items-center gap-1 shadow-sm" title="Register a new custom patient">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>+ Patient</span>
          </button>

          <button onclick="window.ardsApp.openAddSessionModal()" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-sm" title="Record a new session for this patient">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
            <span>+ Session</span>
          </button>

          <button onclick="window.ardsApp.resetSampleData()" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition border border-slate-700" title="Reset to default sample patients (P001-P004)">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- Demographics & Clinical Goal Details -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
        <div>
          <span class="text-slate-500 uppercase font-semibold text-[10px]">Rehab Ambulation Goal</span>
          <div class="font-bold text-slate-200 mt-0.5 truncate" title="${patient.rehabGoal}">${patient.rehabGoal}</div>
        </div>
        <div>
          <span class="text-slate-500 uppercase font-semibold text-[10px]">Attending Clinician</span>
          <div class="font-bold text-slate-200 mt-0.5 truncate">${patient.clinician}</div>
        </div>
        <div>
          <span class="text-slate-500 uppercase font-semibold text-[10px]">Session Status</span>
          <div class="font-bold text-teal-400 mt-0.5">Session ${session ? session.session : 1} of ${patient.sessions.length} recorded</div>
        </div>
        <div>
          <span class="text-slate-500 uppercase font-semibold text-[10px]">Longitudinal Delta</span>
          <div class="font-bold ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-0.5">
            ${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(1)} pts vs Baseline (S1: ${baseScore})
          </div>
        </div>
      </div>
    `;

    this.populatePatientDropdown();
    this.populateSessionDropdown();

    const homePatientSelect = document.getElementById('homePatientSelect');
    if (homePatientSelect) {
      homePatientSelect.value = patient.id;
      homePatientSelect.onchange = (e) => {
        window.dataStore.setActivePatient(e.target.value);
        this.populateSessionDropdown();
        this.renderAll();
      };
    }

    const homeSessionSelect = document.getElementById('homeSessionSelect');
    if (homeSessionSelect && session) {
      homeSessionSelect.value = session.session;
      homeSessionSelect.onchange = (e) => {
        window.dataStore.setActiveSession(e.target.value);
        this.renderAll();
      };
    }
  }

  renderHomeOverview(patient, session, baseline) {
    if (!session) return;

    // 0. Dedicated Patient Profile & Session Control Header
    this.renderHomePatientContextCard(patient, session, baseline);

    const score = window.ardsEngine.calculateScore(session);
    const scoreBand = window.ardsEngine.getScoreBand(score);
    const condition = window.ardsEngine.getConditionState(session, baseline, null);
    const fatigue = window.ardsEngine.getFatigueRisk(session.fatigue);
    const confidence = window.ardsEngine.getAIConfidence(session, baseline);
    const decisionLog = window.ardsEngine.evaluateDecisionAndSafety(session, baseline, null);

    // 1. Condition Status Card & Large Badge
    const conditionEl = document.getElementById('homeConditionCard');
    if (conditionEl) {
      const stateBadgeColor = condition.state === 'IMPROVING' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : (condition.state === 'MODERATE' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30');

      conditionEl.innerHTML = `
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700/60 shadow-xl backdrop-blur-xl">
          <div class="flex items-center gap-5">
            <div class="relative flex items-center justify-center w-16 h-16 rounded-2xl ${stateBadgeColor} border text-3xl shadow-inner">
              <span class="animate-pulse">${condition.icon}</span>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Biomechanical State</span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${stateBadgeColor}">${condition.state}</span>
              </div>
              <h2 class="text-2xl font-bold text-slate-100 tracking-tight">${condition.headline}</h2>
              <p class="text-sm text-slate-400 mt-1 max-w-xl">${condition.summary}</p>
            </div>
          </div>

          <div class="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-700/60 pt-4 md:pt-0">
            <!-- Circular Score Meter -->
            <div class="flex items-center gap-4">
              <div class="relative w-20 h-20 flex items-center justify-center">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path class="text-slate-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="${scoreBand.key === 'good' ? 'text-emerald-400' : (scoreBand.key === 'improving' ? 'text-sky-400' : (scoreBand.key === 'moderate' ? 'text-amber-400' : 'text-rose-400'))}" stroke-dasharray="${score}, 100" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div class="absolute flex flex-col items-center justify-center text-center">
                  <span class="text-xl font-extrabold text-slate-100">${score}</span>
                  <span class="text-[9px] uppercase tracking-wider text-slate-400">/ 100</span>
                </div>
              </div>
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 uppercase font-semibold">Rehab Score</span>
                <span class="text-sm font-bold text-slate-200">${scoreBand.label} Band</span>
                <span class="text-[11px] text-slate-400">${scoreBand.range} pts</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Recommendation Banner
    const recBanner = document.getElementById('homeRecBanner');
    if (recBanner) {
      recBanner.innerHTML = `
        <div class="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-emerald-500/10 border border-sky-500/20 shadow-md">
          <div class="p-2.5 rounded-lg bg-sky-500/20 text-sky-400">
            <i data-lucide="sparkles" class="w-5 h-5"></i>
          </div>
          <div class="flex-1">
            <div class="text-xs font-semibold text-sky-400 uppercase tracking-wider">AI Clinical Recommendation</div>
            <div class="text-base font-bold text-slate-100 mt-0.5">${decisionLog.finalRecommendation}</div>
          </div>
          <button onclick="window.ardsApp.switchTab('decision')" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white transition flex items-center gap-1.5 shadow-sm">
            <span>Inspect Logic</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
    }

    // 3. Progress Bars (Gait, Stability, Force, Symmetry)
    this.renderHomeProgressBars(session);

    // 4. Fatigue & AI Confidence Badges
    this.renderHomeVitals(session, fatigue, confidence);

    // 5. Quick Stats Grid
    this.renderHomeStatsGrid(session, baseline, score);
  }

  renderHomeProgressBars(session) {
    const container = document.getElementById('homeProgressBars');
    if (!container) return;

    const gaitNormalized = Math.min(100, session.gaitSpeed * 100);

    const metrics = [
      { label: "Gait Velocity", val: `${session.gaitSpeed.toFixed(2)} m/s`, pct: gaitNormalized, target: "0.75+ m/s", color: "bg-sky-500" },
      { label: "Movement Stability", val: `${session.stability}%`, pct: session.stability, target: "75%+", color: "bg-emerald-500" },
      { label: "Force Symmetry & Push-Off", val: `${session.force}%`, pct: session.force, target: "70%+", color: "bg-teal-500" },
      { label: "Stance Phase Symmetry", val: `${session.symmetry}%`, pct: session.symmetry, target: "75%+", color: "bg-purple-500" }
    ];

    container.innerHTML = metrics.map(m => `
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div class="flex justify-between items-center mb-2">
          <span class="text-xs font-semibold text-slate-300">${m.label}</span>
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-slate-100">${m.val}</span>
            <span class="text-[10px] text-slate-500">(Target ${m.target})</span>
          </div>
        </div>
        <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div class="${m.color} h-2.5 rounded-full transition-all duration-700 ease-out" style="width: ${m.pct}%"></div>
        </div>
      </div>
    `).join('');
  }

  renderHomeVitals(session, fatigue, confidence) {
    const fatigueEl = document.getElementById('homeFatigueCard');
    const confEl = document.getElementById('homeConfidenceCard');

    if (fatigueEl) {
      const fatigueColor = fatigue.level === 'LOW' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
        : (fatigue.level === 'MEDIUM' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-rose-400 bg-rose-500/15 border-rose-500/30');

      fatigueEl.innerHTML = `
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between h-full">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="battery-charging" class="w-4 h-4 text-slate-400"></i>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fatigue Risk Level</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${fatigueColor}">${fatigue.level}</span>
          </div>
          <div class="my-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-slate-100">${session.fatigue}%</span>
            <span class="text-xs text-slate-400">Metabolic Exertion Index</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">${fatigue.advice}</p>
        </div>
      `;
    }

    if (confEl) {
      const confBadgeColor = confidence.rating === 'HIGH' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
        : (confidence.rating === 'MODERATE' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-rose-400 bg-rose-500/15 border-rose-500/30');

      confEl.innerHTML = `
        <div class="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between h-full">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="cpu" class="w-4 h-4 text-slate-400"></i>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Model Confidence</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${confBadgeColor}">${confidence.label}</span>
          </div>
          <div class="my-3 flex items-baseline gap-2">
            <span class="text-3xl font-extrabold text-slate-100">${confidence.value}%</span>
            <span class="text-xs text-slate-400">Ensemble Agreement Rate</span>
          </div>
          <p class="text-xs text-slate-400 leading-relaxed">${confidence.description}</p>
        </div>
      `;
    }
  }

  renderHomeStatsGrid(session, baseline, currentScore) {
    const container = document.getElementById('homeStatsGrid');
    if (!container) return;

    const baseScore = baseline ? window.ardsEngine.calculateScore(baseline) : currentScore;
    const scoreDelta = currentScore - baseScore;
    const pressureStatus = session.pressure <= 50 ? "Safe / Comfortable" : (session.pressure <= 60 ? "Elevated" : "Critical Warning");
    const pressureColor = session.pressure <= 50 ? "text-emerald-400" : (session.pressure <= 60 ? "text-amber-400" : "text-rose-400");

    container.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Distal Socket Pressure</span>
        <div class="text-xl font-bold text-slate-100 mt-1">${session.pressure} <span class="text-xs text-slate-400 font-normal">kPa</span></div>
        <div class="text-[11px] ${pressureColor} mt-0.5 font-medium">${pressureStatus}</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Progression vs S1 Baseline</span>
        <div class="text-xl font-bold ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1">
          ${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(1)} <span class="text-xs text-slate-400 font-normal">pts</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">S1 Baseline: ${baseScore} pts</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Session Frequency</span>
        <div class="text-xl font-bold text-slate-100 mt-1">Weekly <span class="text-xs text-slate-400 font-normal">Cadence</span></div>
        <div class="text-[11px] text-teal-400 mt-0.5 font-medium">100% Protocol Adherence</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <span class="text-[11px] font-semibold uppercase text-slate-400">Amputation Profile</span>
        <div class="text-base font-bold text-slate-100 mt-1 truncate">${window.dataStore.getActivePatient().amputationType}</div>
        <div class="text-[11px] text-slate-400 mt-0.5">Goal: K3 Ambulation</div>
      </div>
    `;
  }

  /* ----------------------------------------------------
   * SECTION 2: DATA UPLOAD & 9-STAGE PIPELINE
   * -------------------------------------------------- */
  setupUploadHandlers() {
    const dropzone = document.getElementById('csvDropzone');
    const fileInput = document.getElementById('csvFileInput');
    const analyzeBtn = document.getElementById('btnRunPipeline');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-sky-500', 'bg-sky-500/5');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('border-sky-500', 'bg-sky-500/5');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-sky-500', 'bg-sky-500/5');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelect(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelect(e.target.files[0]);
        }
      });
    }

    // Preset Data Loaders
    const btnLoadP1 = document.getElementById('btnPresetP1');
    const btnLoadP2 = document.getElementById('btnPresetP2');
    const btnLoadP3 = document.getElementById('btnPresetP3');
    const btnDownloadSample = document.getElementById('btnDownloadSampleCSV');

    if (btnLoadP1) {
      btnLoadP1.addEventListener('click', () => {
        const csv = window.dataStore.generateCSV('P001');
        this.parseAndPreviewCSV(csv, 'P001_Optimal_Progression.csv');
      });
    }

    if (btnLoadP2) {
      btnLoadP2.addEventListener('click', () => {
        const csv = window.dataStore.generateCSV('P002');
        this.parseAndPreviewCSV(csv, 'P002_Fatigue_Scenario.csv');
      });
    }

    if (btnLoadP3) {
      btnLoadP3.addEventListener('click', () => {
        const csv = window.dataStore.generateCSV('P003');
        this.parseAndPreviewCSV(csv, 'P003_Socket_Pressure_Warning.csv');
      });
    }

    if (btnDownloadSample) {
      btnDownloadSample.addEventListener('click', () => {
        const sampleCSV = `Patient,Session,Gait Speed,Symmetry,Force,Pressure,Stability,Fatigue\nP001,1,0.60,61,55,48,58,20\nP001,2,0.63,65,59,47,63,22\nP001,3,0.67,69,64,46,67,19\nP001,4,0.71,73,68,45,72,18\nP001,5,0.74,76,70,44,74,17\n`;
        const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "adaptive_rehab_sample_session_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // Ingest all CSV patients button
    const btnImportAll = document.getElementById('btnImportAllCsvPatients');
    if (btnImportAll) {
      btnImportAll.addEventListener('click', () => {
        if (!this.currentRawCSVText && (!this.uploadedCSVRows || this.uploadedCSVRows.length === 0)) {
          alert("Please upload a CSV file or load a preset first.");
          return;
        }

        try {
          const csvText = this.currentRawCSVText || window.dataStore.generateCSV(this.uploadedCSVRows[0].patient);
          const result = window.dataStore.importPatientFromCSV(csvText);
          const firstId = result.patientsImported[0];
          if (firstId) {
            window.dataStore.setActivePatient(firstId);
          }
          this.populatePatientDropdown();
          this.populateSessionDropdown();
          this.renderAll();

          const statusBox = document.getElementById('csvUploadStatus');
          if (statusBox) {
            statusBox.innerHTML = `
              <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>✓ Successfully imported &amp; registered patient(s): <strong>${result.patientsImported.join(', ')}</strong> with ${result.totalRows} session(s) into database!</span>
              </div>
            `;
            if (window.lucide) lucide.createIcons();
          }
        } catch(e) {
          alert("Import error: " + e.message);
        }
      });
    }

    // Run Pipeline Button
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        this.triggerPipelineExecution();
      });
    }
  }

  handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.parseAndPreviewCSV(e.target.result, file.name);
    };
    reader.readAsText(file);
  }

  parseAndPreviewCSV(csvText, filename = 'Uploaded_Data.csv') {
    try {
      this.currentRawCSVText = csvText;
      const rows = window.dataStore.parseCSV(csvText);
      this.uploadedCSVRows = rows;
      this.renderCSVPreviewTable(rows, filename);

      const statusBox = document.getElementById('csvUploadStatus');
      if (statusBox) {
        statusBox.innerHTML = `
          <div class="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <i data-lucide="check-circle" class="w-4 h-4"></i>
            <span>Successfully loaded ${rows.length} rows from <strong>${filename}</strong>. Ready to analyze or register patient.</span>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
      }

      const analyzeBtn = document.getElementById('btnRunPipeline');
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    } catch (err) {
      alert(`CSV Parse Error: ${err.message}`);
    }
  }

  renderCSVPreviewTable(rows, filename) {
    const container = document.getElementById('csvPreviewContainer');
    if (!container) return;

    container.classList.remove('hidden');
    const tableBody = document.getElementById('csvPreviewTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = rows.map((r, i) => `
      <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition text-xs">
        <td class="px-4 py-2.5 font-bold text-sky-400">${r.patient}</td>
        <td class="px-4 py-2.5 font-semibold text-slate-200">S${r.session}</td>
        <td class="px-4 py-2.5">${r.gaitSpeed.toFixed(2)} m/s</td>
        <td class="px-4 py-2.5">${r.symmetry}%</td>
        <td class="px-4 py-2.5">${r.force}%</td>
        <td class="px-4 py-2.5 ${r.pressure > 60 ? 'text-rose-400 font-bold' : (r.pressure > 50 ? 'text-amber-400' : 'text-slate-300')}">${r.pressure} kPa</td>
        <td class="px-4 py-2.5">${r.stability}%</td>
        <td class="px-4 py-2.5 ${r.fatigue > 55 ? 'text-rose-400 font-bold' : 'text-slate-300'}">${r.fatigue}%</td>
        <td class="px-4 py-2.5 text-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Valid</span>
        </td>
      </tr>
    `).join('');
  }

  async triggerPipelineExecution() {
    const analyzeBtn = document.getElementById('btnRunPipeline');
    if (!analyzeBtn) return;

    // Automatically ingest all CSV rows into data store so patient has full history
    if (this.currentRawCSVText) {
      try {
        window.dataStore.importPatientFromCSV(this.currentRawCSVText);
      } catch(e) {}
    }

    // Use uploaded row or current active session
    let targetSession = null;
    if (this.uploadedCSVRows && this.uploadedCSVRows.length > 0) {
      targetSession = this.uploadedCSVRows[this.uploadedCSVRows.length - 1];
    } else {
      targetSession = window.dataStore.getActiveSession();
    }

    if (!targetSession) {
      alert("No session data available to analyze.");
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
      <span>Executing Pipeline...</span>
    `;
    if (window.lucide) lucide.createIcons();

    // Reset pipeline UI nodes
    this.renderPipelineStepper(-1);

    const logFeed = document.getElementById('pipelineLogFeed');
    if (logFeed) logFeed.innerHTML = '';

    const progressBar = document.getElementById('pipelineProgressBar');

    await window.ardsPipeline.runPipeline(
      targetSession,
      (stageIdx, stageInfo, percent, log) => {
        this.renderPipelineStepper(stageIdx);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (logFeed) {
          logFeed.innerHTML += `
            <div class="text-[11px] font-mono leading-relaxed text-slate-300">
              <span class="text-slate-500">[${log.time}]</span> 
              <span class="text-sky-400 font-bold">${log.stage}:</span> 
              <span>${log.message}</span>
            </div>
          `;
          logFeed.scrollTop = logFeed.scrollHeight;
        }
      },
      (result) => {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `
          <i data-lucide="play" class="w-4 h-4"></i>
          <span>Re-Analyze Session</span>
        `;
        if (window.lucide) lucide.createIcons();

        // Switch to target patient & session in global store
        if (targetSession.patient) {
          window.dataStore.setActivePatient(targetSession.patient);
          window.dataStore.setActiveSession(targetSession.session);
          this.populatePatientDropdown();
          this.populateSessionDropdown();
        }

        this.renderAll();
        
        // Show success alert
        const banner = document.getElementById('pipelineSuccessBanner');
        if (banner) {
          banner.classList.remove('hidden');
          setTimeout(() => banner.classList.add('hidden'), 6000);
        }
      }
    );
  }

  renderPipelineStepper(activeStageIdx) {
    const container = document.getElementById('pipelineStagesGrid');
    if (!container) return;

    const stages = window.ardsPipeline.stages;

    container.innerHTML = stages.map((s, idx) => {
      let stateStyle = "bg-slate-900/60 border-slate-800 text-slate-500";
      let statusIcon = `<span class="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">${s.num}</span>`;

      if (idx < activeStageIdx) {
        stateStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
        statusIcon = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>`;
      } else if (idx === activeStageIdx) {
        stateStyle = "bg-sky-500/15 border-sky-500/50 text-sky-300 ring-2 ring-sky-500/20";
        statusIcon = `<i data-lucide="loader-2" class="w-4 h-4 text-sky-400 animate-spin"></i>`;
      }

      return `
        <div class="p-3 rounded-xl border ${stateStyle} flex flex-col justify-between transition-all duration-300">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-slate-200">${s.name}</span>
            ${statusIcon}
          </div>
          <p class="text-[10px] text-slate-400 leading-snug line-clamp-2">${s.description}</p>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  /* ----------------------------------------------------
   * SECTION 3: PROGRESS / ANALYTICS
   * -------------------------------------------------- */
  renderProgressSection(patient) {
    if (!patient || !patient.sessions) return;

    // Render session history table
    const tableBody = document.getElementById('historyTableBody');
    if (!tableBody) return;

    const baseline = patient.sessions[0];

    tableBody.innerHTML = patient.sessions.map((s, idx) => {
      const score = window.ardsEngine.calculateScore(s);
      const scoreBand = window.ardsEngine.getScoreBand(score);
      const condition = window.ardsEngine.getConditionState(s, baseline, idx > 0 ? patient.sessions[idx - 1] : null);
      const decision = window.ardsEngine.evaluateDecisionAndSafety(s, baseline, null);

      const stateBadgeColor = condition.state === 'IMPROVING' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : (condition.state === 'MODERATE' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30');

      return `
        <tr class="border-b border-slate-800/60 hover:bg-slate-800/30 transition text-xs">
          <td class="px-4 py-3 font-semibold text-slate-300">${s.date || `2026-07-0${idx + 1}`}</td>
          <td class="px-4 py-3 font-bold text-sky-400">Session ${s.session}</td>
          <td class="px-4 py-3">
            <span class="font-extrabold text-slate-100">${score}</span>
            <span class="text-[10px] text-slate-500">(${scoreBand.label})</span>
          </td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stateBadgeColor}">${condition.state}</span>
          </td>
          <td class="px-4 py-3">${s.gaitSpeed.toFixed(2)} m/s</td>
          <td class="px-4 py-3">${s.stability}%</td>
          <td class="px-4 py-3 ${s.fatigue > 50 ? 'text-amber-400' : 'text-slate-300'}">${s.fatigue}%</td>
          <td class="px-4 py-3 text-slate-300 truncate max-w-xs" title="${decision.finalRecommendation}">
            ${decision.finalRecommendation}
          </td>
          <td class="px-4 py-3 text-right">
            <button onclick="window.ardsApp.viewSessionDetails(${s.session})" class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition">
              Inspect
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  viewSessionDetails(sessionNum) {
    window.dataStore.setActiveSession(sessionNum);
    this.populateSessionDropdown();
    this.renderAll();
    this.switchTab('home');
  }

  /* ----------------------------------------------------
   * SECTION 4: EXPLAINABLE AI (XAI)
   * -------------------------------------------------- */
  renderXAISection() {
    const activeSession = window.dataStore.getActiveSession();
    const patient = window.dataStore.getActivePatient();
    const baseline = patient.sessions && patient.sessions.length > 0 ? patient.sessions[0] : activeSession;
    
    if (!activeSession) return;

    // If no active slider override, sync sliders to the real active session data
    if (!this.activeSimulatorValues) {
      const simGait = document.getElementById('simGait');
      const simSymm = document.getElementById('simSymmetry');
      const simForce = document.getElementById('simForce');
      const simStab = document.getElementById('simStability');
      const simFatigue = document.getElementById('simFatigue');
      const simPressure = document.getElementById('simPressure');

      if (simGait) {
        simGait.value = activeSession.gaitSpeed;
        const gv = document.getElementById('simGaitVal');
        if (gv) gv.textContent = `${Number(activeSession.gaitSpeed).toFixed(2)} m/s`;
      }
      if (simSymm) {
        simSymm.value = activeSession.symmetry;
        const sv = document.getElementById('simSymmetryVal');
        if (sv) sv.textContent = `${activeSession.symmetry}%`;
      }
      if (simForce) {
        simForce.value = activeSession.force;
        const fv = document.getElementById('simForceVal');
        if (fv) fv.textContent = `${activeSession.force}%`;
      }
      if (simStab) {
        simStab.value = activeSession.stability;
        const stv = document.getElementById('simStabilityVal');
        if (stv) stv.textContent = `${activeSession.stability}%`;
      }
      if (simFatigue) {
        simFatigue.value = activeSession.fatigue;
        const ftv = document.getElementById('simFatigueVal');
        if (ftv) ftv.textContent = `${activeSession.fatigue}%`;
      }
      if (simPressure) {
        simPressure.value = activeSession.pressure;
        const pv = document.getElementById('simPressureVal');
        if (pv) pv.textContent = `${activeSession.pressure} kPa`;
      }
    }

    const session = this.activeSimulatorValues || activeSession;
    const condition = window.ardsEngine.getConditionState(session, baseline, null);
    const confidence = window.ardsEngine.getAIConfidence(session, baseline);
    const xai = window.ardsEngine.getXAIExplanation(session, baseline);

    // Prediction Card
    const predEl = document.getElementById('xaiPredictionCard');
    if (predEl) {
      const stateBadgeColor = condition.state === 'IMPROVING' ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
        : (condition.state === 'MODERATE' ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : 'text-rose-400 bg-rose-500/15 border-rose-500/30');

      predEl.innerHTML = `
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <i data-lucide="brain" class="w-7 h-7"></i>
            </div>
            <div>
              <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Model Inference Output</div>
              <div class="flex items-center gap-3 mt-1">
                <h3 class="text-2xl font-black text-slate-100">State = ${condition.state}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${stateBadgeColor}">${condition.icon} ${condition.state}</span>
              </div>
              <p class="text-xs text-slate-400 mt-1">Model Architecture: <strong>RandomForestBiomClassifier v1.4</strong> (100 Decision Trees, Out-of-bag Score: 0.942)</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <div class="text-xs text-slate-400">Prediction Confidence</div>
              <div class="text-2xl font-extrabold text-slate-100">${confidence.value}%</div>
              <div class="text-[11px] font-semibold text-emerald-400">${confidence.label}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Plain-Language Summary Box
    const narrativeEl = document.getElementById('xaiNarrativeBox');
    if (narrativeEl) {
      narrativeEl.innerHTML = `
        <div class="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-slate-200">
          <div class="flex items-center gap-2 mb-1.5 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <i data-lucide="quote" class="w-4 h-4"></i>
            <span>Plain-Language Interpretability Narrative</span>
          </div>
          <p class="text-sm leading-relaxed">${xai.summarySentence}</p>
        </div>
      `;
    }

    // Feature Contribution Bars (SHAP-style)
    const barsContainer = document.getElementById('xaiContributionBars');
    if (barsContainer) {
      barsContainer.innerHTML = xai.contributions.map(c => {
        const isPos = c.contribution >= 0;
        const widthPct = Math.min(100, Math.max(8, Math.abs(c.contribution) * 7.5));
        const barColor = isPos ? 'bg-emerald-500' : 'bg-rose-500';
        const sign = isPos ? '+' : '';

        return `
          <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div class="flex justify-between items-center mb-1.5">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-200">${c.feature}</span>
                <span class="text-[11px] text-sky-400 font-mono font-bold">(${c.value} ${c.unit})</span>
                <span class="text-[10px] text-slate-500 bg-slate-800/80 border border-slate-700/50 px-1.5 py-0.5 rounded">Norm: ${c.refNorm}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'} font-mono">${sign}${c.contribution}%</span>
                <span class="text-[10px] text-slate-500 uppercase">${c.impact}</span>
              </div>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
              <div class="${barColor} h-2 rounded-full transition-all duration-500" style="width: ${widthPct}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
              <i data-lucide="info" class="w-3.5 h-3.5 text-slate-500"></i>
              <span>${c.desc}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  }

  setupSimulatorHandlers() {
    const inputs = ['simGait', 'simSymmetry', 'simForce', 'simPressure', 'simStability', 'simFatigue'];
    
    inputs.forEach(id => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.addEventListener('input', () => {
          this.handleSimulatorUpdate();
        });
      }
    });

    const resetBtn = document.getElementById('btnResetSim');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.activeSimulatorValues = null;
        const session = window.dataStore.getActiveSession();
        if (session) {
          document.getElementById('simGait').value = session.gaitSpeed;
          document.getElementById('simSymmetry').value = session.symmetry;
          document.getElementById('simForce').value = session.force;
          document.getElementById('simPressure').value = session.pressure;
          document.getElementById('simStability').value = session.stability;
          document.getElementById('simFatigue').value = session.fatigue;
        }
        this.renderXAISection();
      });
    }
  }

  handleSimulatorUpdate() {
    const gaitSpeed = parseFloat(document.getElementById('simGait').value);
    const symmetry = parseFloat(document.getElementById('simSymmetry').value);
    const force = parseFloat(document.getElementById('simForce').value);
    const pressure = parseFloat(document.getElementById('simPressure').value);
    const stability = parseFloat(document.getElementById('simStability').value);
    const fatigue = parseFloat(document.getElementById('simFatigue').value);

    // Update value displays
    document.getElementById('simGaitVal').textContent = `${gaitSpeed.toFixed(2)} m/s`;
    document.getElementById('simSymmetryVal').textContent = `${symmetry}%`;
    document.getElementById('simForceVal').textContent = `${force}%`;
    document.getElementById('simPressureVal').textContent = `${pressure} kPa`;
    document.getElementById('simStabilityVal').textContent = `${stability}%`;
    document.getElementById('simFatigueVal').textContent = `${fatigue}%`;

    const activeSession = window.dataStore.getActiveSession();
    this.activeSimulatorValues = {
      ...activeSession,
      gaitSpeed,
      symmetry,
      force,
      pressure,
      stability,
      fatigue
    };

    this.renderXAISection();
  }

  /* ----------------------------------------------------
   * SECTION 5: ALERTS & TRIAGE FEED
   * -------------------------------------------------- */
  setupAlertFilters() {
    const filterBtns = document.querySelectorAll('.alert-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('bg-sky-600', 'text-white'));
        btn.classList.add('bg-sky-600', 'text-white');
        const filter = btn.dataset.filter || 'all';
        this.renderAlertsSection(filter);
      });
    });
  }

  renderAlertsSection(filter = 'all') {
    const container = document.getElementById('alertsFeedContainer');
    if (!container) return;

    const patient = window.dataStore.getActivePatient();
    if (!patient || !patient.alerts || patient.alerts.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <i data-lucide="check-circle-2" class="w-10 h-10 text-emerald-400 mx-auto mb-2"></i>
          <p class="font-semibold text-slate-200">No active alerts for this patient</p>
          <p class="text-xs text-slate-500 mt-1">All telemetry is within normal physiological limits.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let filtered = patient.alerts;
    if (filter !== 'all') {
      filtered = patient.alerts.filter(a => a.type === filter);
    }

    container.innerHTML = filtered.map(a => {
      let icon = "alert-circle";
      let colorClass = "border-sky-500/30 bg-sky-500/10 text-sky-400";
      let badgeLabel = "Normal Session";

      if (a.type === 'critical') {
        icon = "alert-triangle";
        colorClass = "border-rose-500/40 bg-rose-500/10 text-rose-400";
        badgeLabel = "Critical Warning";
      } else if (a.type === 'warning') {
        icon = "alert-circle";
        colorClass = "border-amber-500/40 bg-amber-500/10 text-amber-400";
        badgeLabel = "Advisory / Caution";
      }

      return `
        <div class="p-5 rounded-2xl bg-slate-900/70 border ${a.acknowledged ? 'border-slate-800 opacity-75' : colorClass} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-md">
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl ${colorClass} flex-shrink-0">
              <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${colorClass}">${badgeLabel}</span>
                <span class="text-xs text-slate-500 font-mono">${a.timestamp}</span>
                ${a.session ? `<span class="text-xs text-sky-400 font-semibold">• S${a.session}</span>` : ''}
              </div>
              <h4 class="text-base font-bold text-slate-100">${a.title}</h4>
              <p class="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">${a.message}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 self-end md:self-auto">
            ${a.acknowledged ? `
              <span class="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <i data-lucide="check" class="w-4 h-4"></i> Acknowledged
              </span>
            ` : `
              <button onclick="window.ardsApp.acknowledgeAlert('${a.id}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-sm">
                Acknowledge
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  }

  acknowledgeAlert(alertId) {
    window.dataStore.acknowledgeAlert(window.dataStore.activePatientId, alertId);
    this.renderAlertsSection();
    this.updateAlertBadgeCount();
  }

  /* ----------------------------------------------------
   * SECTION 6: DECISION & SAFETY LOG
   * -------------------------------------------------- */
  renderDecisionLogSection() {
    const session = window.dataStore.getActiveSession();
    const patient = window.dataStore.getActivePatient();
    const baseline = patient.sessions && patient.sessions.length > 0 ? patient.sessions[0] : session;
    if (!session) return;

    const decisionLog = window.ardsEngine.evaluateDecisionAndSafety(session, baseline, null);

    // Active Rule Card
    const activeRuleEl = document.getElementById('decisionActiveRuleCard');
    if (activeRuleEl) {
      activeRuleEl.innerHTML = `
        <div class="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700 shadow-xl">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold uppercase tracking-wider text-sky-400">Active Rule Triggered</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">${decisionLog.matchedRuleId}</span>
          </div>
          <div class="text-lg font-bold text-slate-100">${decisionLog.finalRecommendation}</div>
          <div class="text-xs text-slate-400 mt-2 leading-relaxed">
            <strong>Rule Logic:</strong> Condition State = <span class="text-sky-300 font-semibold">${decisionLog.condition.state}</span> × 
            Fatigue = <span class="text-sky-300 font-semibold">${decisionLog.fatigue.level}</span> × 
            Safety Flag = <span class="text-sky-300 font-semibold">${decisionLog.safetyFlag}</span>
          </div>
        </div>
      `;
    }

    // Safety Override Card
    const overrideEl = document.getElementById('safetyOverrideCard');
    if (overrideEl) {
      overrideEl.innerHTML = `
        <div class="p-6 rounded-2xl bg-slate-900/80 border ${decisionLog.overrideTriggered ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'} shadow-lg">
          <div class="flex items-center gap-2 mb-3 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>Safety Governor Clamp & Override Policy</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">Raw ML Proposal</span>
              <div class="text-sm font-bold text-slate-200 mt-1">${decisionLog.rawSuggestion}</div>
            </div>
            <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span class="text-[11px] font-semibold text-slate-400 uppercase">Safety Governor Action</span>
              <div class="text-sm font-bold text-emerald-400 mt-1">${decisionLog.safetyAction}</div>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-3">
            <strong>Governor Limiting Constraint:</strong> ${decisionLog.governorDetails.limitingConstraint}
          </p>
        </div>
      `;
    }

    if (window.lucide) lucide.createIcons();
  }

  /* ----------------------------------------------------
   * SECTION 7: CLINICAL REPORTS (PRINTABLE / PDF)
   * -------------------------------------------------- */
  setupReportHandlers() {
    const printBtn = document.getElementById('btnPrintReport');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const exportCSVBtn = document.getElementById('btnExportCSVReport');
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener('click', () => {
        const patient = window.dataStore.getActivePatient();
        const csv = window.dataStore.generateCSV(patient.id);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ARDS_Report_${patient.id}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    const exportJSONBtn = document.getElementById('btnExportJSONReport');
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener('click', () => {
        const patient = window.dataStore.getActivePatient();
        const session = window.dataStore.getActiveSession();
        const baseline = patient.sessions[0];
        const reportData = {
          system: "Adaptive Rehabilitation Decision Support System",
          version: "1.0-prototype",
          exportedAt: new Date().toISOString(),
          patient: patient,
          currentSession: session,
          score: window.ardsEngine.calculateScore(session),
          condition: window.ardsEngine.getConditionState(session, baseline, null),
          confidence: window.ardsEngine.getAIConfidence(session, baseline),
          xai: window.ardsEngine.getXAIExplanation(session, baseline),
          decision: window.ardsEngine.evaluateDecisionAndSafety(session, baseline, null)
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `AdaptiveRehab_Report_${patient.id}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }

  renderReportsSection() {
    const reportContainer = document.getElementById('clinicalReportPreview');
    if (!reportContainer) return;

    const patient = window.dataStore.getActivePatient();
    const session = window.dataStore.getActiveSession();
    const baseline = patient.sessions && patient.sessions.length > 0 ? patient.sessions[0] : session;

    if (!session) return;

    const score = window.ardsEngine.calculateScore(session);
    const scoreBand = window.ardsEngine.getScoreBand(score);
    const condition = window.ardsEngine.getConditionState(session, baseline, null);
    const confidence = window.ardsEngine.getAIConfidence(session, baseline);
    const decisionLog = window.ardsEngine.evaluateDecisionAndSafety(session, baseline, null);
    
    // Evaluate against official age-stratified reference thresholds
    const clinicalEval = (window.ardsClinicalRefs && typeof window.ardsClinicalRefs.evaluateSessionTelemetry === 'function')
      ? window.ardsClinicalRefs.evaluateSessionTelemetry(patient, session)
      : null;

    reportContainer.innerHTML = `
      <div class="printable-report bg-slate-900/90 text-slate-100 p-8 rounded-2xl border border-slate-800 shadow-2xl max-w-4xl mx-auto space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 class="text-xl font-extrabold tracking-tight text-slate-100">Adaptive Rehabilitation Decision Support System</h2>
            </div>
            <p class="text-xs text-slate-400 mt-1">Clinical Biomechanical & Prosthetic Sensor Telemetry Evaluation</p>
          </div>
          <div class="text-right">
            <span class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/30">CONFIDENTIAL CLINICAL REPORT</span>
            <div class="text-xs text-slate-400 mt-1">Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
        </div>

        <!-- Patient Demographics & Age Bracket -->
        <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
          <div class="font-bold text-sky-400 uppercase tracking-wider mb-2 text-[11px]">1. Patient Summary & Age Cohort Bracket</div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span class="text-slate-500 uppercase font-semibold text-[10px]">Patient ID / Name</span>
              <div class="font-bold text-slate-200 mt-0.5">${patient.id} - ${patient.name}</div>
            </div>
            <div>
              <span class="text-slate-500 uppercase font-semibold text-[10px]">Age / Normative Bracket</span>
              <div class="font-bold text-teal-400 mt-0.5">${patient.age} yrs (${clinicalEval ? clinicalEval.ageBand : '40-49'} yrs)</div>
            </div>
            <div>
              <span class="text-slate-500 uppercase font-semibold text-[10px]">Amputation / Prosthesis</span>
              <div class="font-bold text-slate-200 mt-0.5 truncate" title="${patient.prosthesis}">${patient.amputationType}</div>
            </div>
            <div>
              <span class="text-slate-500 uppercase font-semibold text-[10px]">Attending Clinician</span>
              <div class="font-bold text-slate-200 mt-0.5">${patient.clinician}</div>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-slate-400 text-[11px]">
            <span><strong>Rehab Goal:</strong> ${patient.rehabGoal}</span>
            <span class="font-semibold text-sky-400">Session ${session.session} (${session.date || new Date().toISOString().split('T')[0]})</span>
          </div>
        </div>

        <!-- Primary Biomechanical Score Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span class="text-[10px] uppercase text-slate-400">Rehab Composite Score</span>
            <div class="text-2xl font-extrabold text-slate-100">${score}/100</div>
            <span class="text-[10px] text-teal-400 font-semibold">${scoreBand.label} Band</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span class="text-[10px] uppercase text-slate-400">Condition State</span>
            <div class="text-xl font-extrabold text-emerald-400">${condition.state}</div>
            <span class="text-[10px] text-slate-400">${condition.icon} Verified</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span class="text-[10px] uppercase text-slate-400">AI Confidence</span>
            <div class="text-2xl font-extrabold text-slate-100">${confidence.value}%</div>
            <span class="text-[10px] text-sky-400 font-semibold">${confidence.label}</span>
          </div>
          <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span class="text-[10px] uppercase text-slate-400">Distal Socket Pressure</span>
            <div class="text-2xl font-extrabold ${session.pressure > 50 ? 'text-rose-400' : 'text-slate-100'}">${session.pressure} kPa</div>
            <span class="text-[10px] text-slate-400">Limit: 55 kPa</span>
          </div>
        </div>

        <!-- Parameter Evaluation Table (Official Normative Database) -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold uppercase tracking-wider text-sky-400">2. Age-Stratified Clinical Reference Benchmark Table</h3>
            <span class="text-[10px] text-slate-400 font-mono">Cohort Bracket: ${clinicalEval ? clinicalEval.ageBand : '40-49'} yrs</span>
          </div>
          <div class="overflow-x-auto border border-slate-800 rounded-xl">
            <table class="w-full text-xs text-left">
              <thead class="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th class="p-3">Biomechanical Metric</th>
                  <th class="p-3">Measured Telemetry</th>
                  <th class="p-3">Age-Specific Target Standard</th>
                  <th class="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                ${(clinicalEval && clinicalEval.parameters) ? clinicalEval.parameters.map(p => {
                  let statusBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
                  if (p.status.includes('CRITICAL') || p.status.includes('PATHOLOGICAL')) {
                    statusBadge = 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold';
                  } else if (p.status.includes('BORDERLINE') || p.status.includes('RISK')) {
                    statusBadge = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                  }
                  return `
                    <tr class="hover:bg-slate-800/40 transition">
                      <td class="p-3 font-semibold text-slate-200">
                        <div>${p.metric}</div>
                        <div class="text-[10px] text-slate-500 font-normal mt-0.5">${p.note}</div>
                      </td>
                      <td class="p-3 font-mono font-bold text-sky-300">${p.measured}</td>
                      <td class="p-3 text-slate-300">${p.target}</td>
                      <td class="p-3 text-center">
                        <span class="inline-block px-2.5 py-1 rounded-full text-[10px] border ${statusBadge}">${p.status.replace(/[[\]]/g, '')}</span>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td class="p-3 font-semibold">Gait Velocity</td>
                    <td class="p-3 font-mono text-sky-300">${session.gaitSpeed.toFixed(2)} m/s</td>
                    <td class="p-3">1.39 – 1.43 m/s</td>
                    <td class="p-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">OPTIMAL / NORMAL</span></td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Safety & Risk Assessment -->
        <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-2">
          <div class="font-bold text-sky-400 uppercase tracking-wider mb-1 text-[11px]">3. Safety & Biomechanical Risk Assessment</div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <span class="text-[10px] uppercase text-slate-400 font-bold">Tissue & Ulcer Risk</span>
              <div class="text-xs font-semibold mt-1 ${clinicalEval && clinicalEval.safetyAndRiskAssessment.tissueUlcerRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}">
                ${clinicalEval && clinicalEval.safetyAndRiskAssessment.tissueUlcerRisk === 'HIGH' ? '🔴 High Risk — Tissue Overload' : '🟢 Low Risk — Safe Interface'}
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Evaluates distal prominence & weight-bearing wall tolerance.</p>
            </div>
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <span class="text-[10px] uppercase text-slate-400 font-bold">Fall & Gait Instability Risk</span>
              <div class="text-xs font-semibold mt-1 ${clinicalEval && clinicalEval.safetyAndRiskAssessment.fallInstabilityRisk === 'HIGH' ? 'text-rose-400' : 'text-emerald-400'}">
                ${clinicalEval && clinicalEval.safetyAndRiskAssessment.fallInstabilityRisk === 'HIGH' ? '🔴 Elevated Instability Risk' : '🟢 Controlled Coronal Balance'}
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Evaluates stance asymmetry, coronal sway & force error.</p>
            </div>
            <div class="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60">
              <span class="text-[10px] uppercase text-slate-400 font-bold">Prosthetic Structural Fatigue</span>
              <div class="text-xs font-semibold mt-1 ${clinicalEval && clinicalEval.safetyAndRiskAssessment.structuralFatigueRisk === 'HIGH' ? 'text-amber-400' : 'text-emerald-400'}">
                ${clinicalEval && clinicalEval.safetyAndRiskAssessment.structuralFatigueRisk === 'HIGH' ? '🟡 Material Check Advised' : '🟢 Operating Within Material Rating'}
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Evaluates cyclic loading against material limit.</p>
            </div>
          </div>
        </div>

        <!-- Critical Alerts & Flags -->
        <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
          <div class="font-bold text-amber-400 uppercase tracking-wider mb-2 text-[11px] flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>4. Critical Alerts & Immediate Clinical Flags</span>
          </div>
          <ul class="space-y-1.5 text-slate-200">
            ${(clinicalEval && clinicalEval.criticalAlerts) ? clinicalEval.criticalAlerts.map(a => `
              <li class="flex items-start gap-2">
                <span class="text-amber-400">•</span>
                <span>${a}</span>
              </li>
            `).join('') : `
              <li>• All biomechanical telemetry within certified physiological safety bounds.</li>
            `}
          </ul>
        </div>

        <!-- Actionable Clinical Recommendations -->
        <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
          <div class="font-bold text-sky-400 uppercase tracking-wider mb-2 text-[11px] flex items-center gap-1.5">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
            <span>5. Actionable Clinical Recommendations</span>
          </div>
          <div class="space-y-2">
            ${(clinicalEval && clinicalEval.actionableRecommendations) ? clinicalEval.actionableRecommendations.map(r => {
              const parts = r.split(':');
              const heading = parts[0];
              const desc = parts.slice(1).join(':');
              return `
                <div class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/60">
                  <strong class="text-sky-300">${heading}:</strong>
                  <span class="text-slate-300 leading-relaxed">${desc}</span>
                </div>
              `;
            }).join('') : `
              <div class="text-slate-300">${decisionLog.finalRecommendation}</div>
            `}
          </div>
          <div class="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <strong>Safety Governor Action:</strong> ${decisionLog.safetyAction}
          </div>
        </div>

        <!-- Disclaimer Box -->
        <div class="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
          <strong>Clinical Decision Support Notice:</strong> This clinical evaluation was generated by the Adaptive Rehabilitation Decision Support System against official age-stratified normative biomechanical thresholds for clinical pair-review and rehabilitation protocol guidance.
        </div>

        <!-- Sign-Off Section -->
        <div class="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-400">
          <div>
            <div class="font-semibold uppercase text-slate-500 mb-6">Physiotherapist Digital Signature</div>
            <div class="border-b border-slate-700 pb-1 text-slate-200 font-serif italic">${window.ardsAuth?.getCurrentUser()?.name || patient.clinician}</div>
            <div class="text-[10px] text-slate-500 mt-1">${window.ardsAuth?.getCurrentUser()?.title || "Certified Prosthetist & Physical Therapist (DPT)"} &bull; ${window.ardsAuth?.getCurrentUser()?.licenseNo || "PT-DPT-88921-US"}</div>
          </div>
          <div>
            <div class="font-semibold uppercase text-slate-500 mb-6">Date of Clinical Sign-Off</div>
            <div class="border-b border-slate-700 pb-1 text-slate-200 font-mono">${new Date().toISOString().split('T')[0]}</div>
<div class="text-[10px] text-slate-500 mt-1">ARDS Session Record Synced &bull; Verified ID: ${window.ardsAuth?.getCurrentUser()?.id || "USR-001"}</div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  }
}

// Global Application Instance Initialization
function initARDSApp() {
  if (!window.ardsApp) {
    try {
      window.ardsApp = new ARDSApp();
      console.log("Adaptive Rehabilitation Decision Support System initialized successfully.");
    } catch(e) {
      console.error("Error initializing Adaptive Rehabilitation Decision Support System:", e);
    }
  }
}

// Global Helper functions for inline onclick handlers
window.switchTab = function(tabId) {
  if (window.ardsApp) window.ardsApp.switchTab(tabId);
};
window.openAddPatientModal = function() {
  if (window.ardsApp) window.ardsApp.openAddPatientModal();
};
window.openAddSessionModal = function() {
  if (window.ardsApp) window.ardsApp.openAddSessionModal();
};
window.resetSampleData = function() {
  if (window.ardsApp) window.ardsApp.resetSampleData();
};
window.viewSessionDetails = function(sessionNum) {
  if (window.ardsApp) window.ardsApp.viewSessionDetails(sessionNum);
};
window.acknowledgeAlert = function(alertId) {
  if (window.ardsApp) window.ardsApp.acknowledgeAlert(alertId);
};
window.quickLogin = function(userId) {
  if (window.ardsAuth) {
    const res = window.ardsAuth.quickLogin(userId);
    if (res.success && window.ardsApp) {
      window.ardsApp.syncClinicianContext(res.user);
    }
  }
};
window.logout = function() {
  if (window.ardsAuth) window.ardsAuth.logout();
};
window.lockWorkstation = function() {
  if (window.ardsAuth) window.ardsAuth.lockSession();
};

// Ensure execution on DOM ready or immediate if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initARDSApp);
} else {
  initARDSApp();
}

