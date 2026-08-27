/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Core Mock Data & Storage Layer
 */

const ARDS_INITIAL_DATA = {
  patients: [
    {
      id: "P001",
      name: "Alex Mercer",
      age: 42,
      amputationType: "Transtibial (Right)",
      amputationDate: "2025-06-12",
      prosthesis: "Ottobock Genium / ProCarve Carbon Foot",
      clinician: "Dr. Rachel Thorne, PT, DPT",
      rehabGoal: "Independent community ambulation & uneven terrain walking (K3 level)",
      sessions: [
        { session: 1, date: "2026-07-02", gaitSpeed: 0.60, symmetry: 61, force: 55, pressure: 48, stability: 58, fatigue: 20 },
        { session: 2, date: "2026-07-09", gaitSpeed: 0.63, symmetry: 65, force: 59, pressure: 47, stability: 63, fatigue: 22 },
        { session: 3, date: "2026-07-16", gaitSpeed: 0.67, symmetry: 69, force: 64, pressure: 46, stability: 67, fatigue: 19 },
        { session: 4, date: "2026-07-23", gaitSpeed: 0.71, symmetry: 73, force: 68, pressure: 45, stability: 72, fatigue: 18 },
        { session: 5, date: "2026-07-30", gaitSpeed: 0.74, symmetry: 76, force: 70, pressure: 44, stability: 74, fatigue: 17 }
      ],
      alerts: [
        { id: "alt-101", timestamp: "2026-07-30 14:35", session: 5, type: "normal", title: "Milestone Reached", message: "Gait symmetry reached 76% (+15% above S1 baseline). Patient achieved K3 ambulation criteria.", acknowledged: false },
        { id: "alt-102", timestamp: "2026-07-23 11:10", session: 4, type: "normal", title: "Progressive Load Approved", message: "Stability index reached 72%. AI recommendation: Increase resistance band load slightly.", acknowledged: true },
        { id: "alt-103", timestamp: "2026-07-09 10:15", session: 2, type: "warning", title: "Minor Asymmetry Detected", message: "Stance phase asymmetry was 35% during initial warm-up trials; stabilized in second set.", acknowledged: true }
      ]
    },
    {
      id: "P002",
      name: "Elena Rostova",
      age: 56,
      amputationType: "Transfemoral (Left)",
      amputationDate: "2025-09-20",
      prosthesis: "C-Leg 4 Microprocessor Knee / Triton Harmony",
      clinician: "Dr. Samuel Vance, CPO",
      rehabGoal: "Stair descent and progressive cadence endurance (K2 to K3)",
      sessions: [
        { session: 1, date: "2026-07-05", gaitSpeed: 0.52, symmetry: 55, force: 50, pressure: 52, stability: 50, fatigue: 25 },
        { session: 2, date: "2026-07-12", gaitSpeed: 0.55, symmetry: 58, force: 52, pressure: 53, stability: 52, fatigue: 32 },
        { session: 3, date: "2026-07-19", gaitSpeed: 0.57, symmetry: 60, force: 54, pressure: 54, stability: 53, fatigue: 46 },
        { session: 4, date: "2026-07-26", gaitSpeed: 0.56, symmetry: 57, force: 51, pressure: 56, stability: 49, fatigue: 65 },
        { session: 5, date: "2026-08-02", gaitSpeed: 0.54, symmetry: 54, force: 48, pressure: 58, stability: 47, fatigue: 72 }
      ],
      alerts: [
        { id: "alt-201", timestamp: "2026-08-02 15:40", session: 5, type: "warning", title: "Elevated Fatigue Spike (72%)", message: "Patient reported residual limb muscle fatigue. Force control dropped by 6%. Safety Engine enforced difficulty reduction.", acknowledged: false },
        { id: "alt-202", timestamp: "2026-07-26 14:20", session: 4, type: "warning", title: "Stability Degradation Under Fatigue", message: "Stability index fell below 50% at minute 18 of treadmill session.", acknowledged: true }
      ]
    },
    {
      id: "P003",
      name: "Marcus Vance",
      age: 38,
      amputationType: "Bilateral Transtibial",
      amputationDate: "2025-03-15",
      prosthesis: "Dual Endolite Blade XT / Vacuum Suspension",
      clinician: "Dr. Rachel Thorne, PT, DPT",
      rehabGoal: "High-level sports agility and dynamic dual-limb ground force distribution",
      sessions: [
        { session: 1, date: "2026-07-03", gaitSpeed: 0.58, symmetry: 62, force: 58, pressure: 46, stability: 60, fatigue: 22 },
        { session: 2, date: "2026-07-10", gaitSpeed: 0.62, symmetry: 66, force: 62, pressure: 49, stability: 64, fatigue: 24 },
        { session: 3, date: "2026-07-17", gaitSpeed: 0.64, symmetry: 68, force: 65, pressure: 68, stability: 65, fatigue: 28 },
        { session: 4, date: "2026-07-24", gaitSpeed: 0.65, symmetry: 67, force: 64, pressure: 62, stability: 66, fatigue: 26 },
        { session: 5, date: "2026-07-31", gaitSpeed: 0.68, symmetry: 71, force: 67, pressure: 49, stability: 70, fatigue: 21 }
      ],
      alerts: [
        { id: "alt-301", timestamp: "2026-07-17 16:05", session: 3, type: "critical", title: "High Socket Pressure Warning (68 kPa)", message: "Peak stump socket pressure breached 60 kPa safety boundary. Safety Governor overrode ML progression request to prevent skin breakdown.", acknowledged: true },
        { id: "alt-302", timestamp: "2026-07-31 11:50", session: 5, type: "normal", title: "Pressure Normalized (49 kPa)", message: "Socket adjustment by prosthetist restored distal stump pressure to optimal safe operating range.", acknowledged: false }
      ]
    },
    {
      id: "P004",
      name: "Sarah Lin",
      age: 29,
      amputationType: "Transtibial (Left)",
      amputationDate: "2025-11-04",
      prosthesis: "Ossur Rheo Knee / Pro-Flex LP Align",
      clinician: "Dr. Kevin Patel, MD, PM&R",
      rehabGoal: "Post-operative initial gait retraining and weight-bearing confidence",
      sessions: [
        { session: 1, date: "2026-07-08", gaitSpeed: 0.45, symmetry: 48, force: 44, pressure: 50, stability: 46, fatigue: 30 },
        { session: 2, date: "2026-07-15", gaitSpeed: 0.49, symmetry: 52, force: 47, pressure: 51, stability: 49, fatigue: 32 },
        { session: 3, date: "2026-07-22", gaitSpeed: 0.51, symmetry: 54, force: 49, pressure: 52, stability: 51, fatigue: 35 },
        { session: 4, date: "2026-07-29", gaitSpeed: 0.53, symmetry: 55, force: 50, pressure: 53, stability: 52, fatigue: 52 }
      ],
      alerts: [
        { id: "alt-401", timestamp: "2026-07-29 13:20", session: 4, type: "warning", title: "Low AI Confidence (58%)", message: "Inconsistent step cadence and sensor jitter observed during transition drills. Manual clinical assessment requested.", acknowledged: false }
      ]
    }
  ]
};

class ARDSDataStore {
  constructor() {
    this.STORAGE_KEY = "ards_clinical_db_v1";
    this.data = this.loadData();
    this.activePatientId = "P001";
    this.activeSessionNum = 5;
  }

  loadData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read localStorage, using default seed data", e);
    }
    return JSON.parse(JSON.stringify(ARDS_INITIAL_DATA));
  }

  saveData() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(ARDS_INITIAL_DATA));
    this.activePatientId = "P001";
    this.activeSessionNum = 5;
    this.saveData();
  }

  getPatients() {
    return this.data.patients;
  }

  getPatient(id) {
    return this.data.patients.find(p => p.id === id) || this.data.patients[0];
  }

  getActivePatient() {
    return this.getPatient(this.activePatientId);
  }

  setActivePatient(id) {
    this.activePatientId = id;
    const patient = this.getPatient(id);
    if (patient && patient.sessions.length > 0) {
      this.activeSessionNum = patient.sessions[patient.sessions.length - 1].session;
    }
  }

  getActiveSession() {
    const patient = this.getActivePatient();
    if (!patient || !patient.sessions || patient.sessions.length === 0) return null;
    const s = patient.sessions.find(item => item.session === Number(this.activeSessionNum));
    return s || patient.sessions[patient.sessions.length - 1];
  }

  setActiveSession(sessionNum) {
    this.activeSessionNum = Number(sessionNum);
  }

  addPatient(patientObj) {
    this.data.patients.push(patientObj);
    this.saveData();
  }

  addOrUpdateSession(patientId, sessionData) {
    let patient = this.getPatient(patientId);
    if (!patient) {
      patient = {
        id: patientId,
        name: `Patient ${patientId}`,
        age: 45,
        amputationType: "Lower Limb Amputation",
        amputationDate: "2025-01-01",
        prosthesis: "Standard Modular Prosthesis",
        clinician: "Attending Physiotherapist",
        rehabGoal: "Gait symmetry and functional independence",
        sessions: [],
        alerts: []
      };
      this.data.patients.push(patient);
    }

    const existingIdx = patient.sessions.findIndex(s => s.session === Number(sessionData.session));
    if (existingIdx >= 0) {
      patient.sessions[existingIdx] = { ...patient.sessions[existingIdx], ...sessionData };
    } else {
      patient.sessions.push(sessionData);
      patient.sessions.sort((a, b) => a.session - b.session);
    }

    this.saveData();
  }

  addAlert(patientId, alert) {
    const patient = this.getPatient(patientId);
    if (patient) {
      if (!patient.alerts) patient.alerts = [];
      patient.alerts.unshift({
        id: `alt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        acknowledged: false,
        ...alert
      });
      this.saveData();
    }
  }

  acknowledgeAlert(patientId, alertId) {
    const patient = this.getPatient(patientId);
    if (patient && patient.alerts) {
      const target = patient.alerts.find(a => a.id === alertId);
      if (target) {
        target.acknowledged = true;
        this.saveData();
      }
    }
  }

  parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing data rows.");
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));
    
    // Expected column mapping
    const colMap = {
      patient: headers.findIndex(h => h.includes('patient')),
      session: headers.findIndex(h => h.includes('session')),
      gaitspeed: headers.findIndex(h => h.includes('gait') || h.includes('speed')),
      symmetry: headers.findIndex(h => h.includes('symmetry') || h.includes('sym')),
      force: headers.findIndex(h => h.includes('force')),
      pressure: headers.findIndex(h => h.includes('pressure') || h.includes('press')),
      stability: headers.findIndex(h => h.includes('stability') || h.includes('stab')),
      fatigue: headers.findIndex(h => h.includes('fatigue') || h.includes('fat'))
    };

    if (colMap.patient === -1 || colMap.session === -1 || colMap.gaitspeed === -1) {
      throw new Error("CSV header missing required columns. Expected: Patient, Session, Gait Speed, Symmetry, Force, Pressure, Stability, Fatigue.");
    }

    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim());

      const row = {
        patient: cols[colMap.patient] || "P001",
        session: parseInt(cols[colMap.session], 10) || i,
        gaitSpeed: parseFloat(cols[colMap.gaitspeed]) || 0.6,
        symmetry: parseFloat(cols[colMap.symmetry]) || 60,
        force: parseFloat(cols[colMap.force]) || 55,
        pressure: parseFloat(cols[colMap.pressure]) || 45,
        stability: parseFloat(cols[colMap.stability]) || 55,
        fatigue: parseFloat(cols[colMap.fatigue]) || 20,
        date: new Date(Date.now() - (lines.length - i) * 7 * 86400000).toISOString().split('T')[0]
      };

      parsedRows.push(row);
    }

    return parsedRows;
  }

  /**
   * Imports one or multiple patients with all their session rows from CSV
   * @param {string} csvText - Raw CSV data
   * @param {Object} metadata - Optional demographic overrides
   * @returns {Object} { patientsImported: Array, totalRows: number }
   */
  importPatientFromCSV(csvText, metadata = {}) {
    const rows = this.parseCSV(csvText);
    if (!rows || rows.length === 0) {
      throw new Error("No valid data rows found in CSV.");
    }

    // Group rows by patient ID
    const patientMap = {};
    rows.forEach(r => {
      const pId = (r.patient || "P001").trim();
      if (!patientMap[pId]) patientMap[pId] = [];
      patientMap[pId].push(r);
    });

    const importedIds = [];

    Object.keys(patientMap).forEach(pId => {
      const patientRows = patientMap[pId];
      let patient = this.data.patients.find(p => p.id === pId);

      if (!patient) {
        // Create new patient record
        patient = {
          id: pId,
          name: metadata.name || `Patient ${pId}`,
          age: parseInt(metadata.age, 10) || 45,
          amputationType: metadata.amputationType || "Transtibial (Right)",
          amputationDate: new Date().toISOString().split('T')[0],
          prosthesis: metadata.prosthesis || "Modular Dynamic Prosthesis",
          clinician: metadata.clinician || "Attending Physiotherapist",
          rehabGoal: metadata.rehabGoal || "Progressive functional gait retraining",
          sessions: [],
          alerts: [
            {
              id: `alt-${Date.now()}-${Math.floor(Math.random()*1000)}`,
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
              session: patientRows[0].session || 1,
              type: "normal",
              title: "Patient Registered via CSV Import",
              message: `Patient ${pId} imported with ${patientRows.length} session records.`,
              acknowledged: false
            }
          ]
        };
        this.data.patients.push(patient);
      }

      // Add or update all session rows
      patientRows.forEach(row => {
        const existingIdx = patient.sessions.findIndex(s => s.session === Number(row.session));
        if (existingIdx >= 0) {
          patient.sessions[existingIdx] = { ...patient.sessions[existingIdx], ...row };
        } else {
          patient.sessions.push(row);
        }
      });

      patient.sessions.sort((a, b) => a.session - b.session);
      importedIds.push(pId);
    });

    this.saveData();
    return {
      patientsImported: importedIds,
      totalRows: rows.length
    };
  }

  generateCSV(patientId) {
    const patient = this.getPatient(patientId);
    if (!patient || !patient.sessions) return "";

    const headers = "Patient,Session,Gait Speed,Symmetry,Force,Pressure,Stability,Fatigue\n";
    const rows = patient.sessions.map(s => 
      `${patient.id},${s.session},${s.gaitSpeed.toFixed(2)},${s.symmetry},${s.force},${s.pressure},${s.stability},${s.fatigue}`
    ).join("\n");

    return headers + rows;
  }
}

// Global data store instance
window.dataStore = new ARDSDataStore();
