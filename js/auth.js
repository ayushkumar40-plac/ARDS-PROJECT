/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Clinical Authentication & Identity Provider Module
 */

const ARDS_CLINICAL_USERS = [
  {
    id: "USR-001",
    email: "rachel.thorne@ards.clinic",
    username: "rthorne",
    password: "password123",
    pin: "1234",
    name: "Dr. Rachel Thorne, PT, DPT",
    title: "Senior Physical Therapist & Gait Lead",
    role: "Physical Therapist",
    badgeLabel: "PT Lead",
    badgeColor: "sky",
    department: "Amputee Rehabilitation & Gait Lab",
    institution: "Advanced Rehab Institute",
    licenseNo: "PT-DPT-88921-US",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    initials: "RT",
    assignedPatients: ["P001", "P003"]
  },
  {
    id: "USR-002",
    email: "samuel.vance@ards.clinic",
    username: "svance",
    password: "password123",
    pin: "2345",
    name: "Dr. Samuel Vance, CPO",
    title: "Certified Prosthetist Orthotist",
    role: "Prosthetist Specialist",
    badgeLabel: "CPO",
    badgeColor: "teal",
    department: "Prosthetics & Biomechanical Socket Fitting",
    institution: "Advanced Rehab Institute",
    licenseNo: "CPO-44120-ABC",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    initials: "SV",
    assignedPatients: ["P002"]
  },
  {
    id: "USR-003",
    email: "kevin.patel@ards.clinic",
    username: "kpatel",
    password: "password123",
    pin: "3456",
    name: "Dr. Kevin Patel, MD, PM&R",
    title: "Physiatrist & Clinical Lead",
    role: "Medical Director",
    badgeLabel: "Physiatrist MD",
    badgeColor: "indigo",
    department: "Physical Medicine & Rehabilitation",
    institution: "Advanced Rehab Institute",
    licenseNo: "MD-99432-CA",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200",
    initials: "KP",
    assignedPatients: ["P004"]
  },
  {
    id: "USR-004",
    email: "admin@ards.clinic",
    username: "admin",
    password: "password123",
    pin: "4567",
    name: "Dr. Elena Woods, PhD",
    title: "Biomechanical AI Director & Clinical Auditor",
    role: "Clinical Auditor",
    badgeLabel: "System Admin",
    badgeColor: "purple",
    department: "Rehab AI Research Laboratory",
    institution: "ARDS Biomechanics Consortium",
    licenseNo: "RES-AI-1029",
    avatar: "https://images.unsplash.com/photo-1594824813697-26ebf964032d?auto=format&fit=crop&q=80&w=200",
    initials: "EW",
    assignedPatients: ["P001", "P002", "P003", "P004"]
  }
];

class ARDSAuth {
  constructor() {
    this.STORAGE_KEY_SESSION = "ards_auth_session";
    this.STORAGE_KEY_LOCKED = "ards_auth_locked";
    this.STORAGE_KEY_REMEMBER = "ards_auth_remember";
    this.listeners = [];
    this.currentUser = null;
    this.isSessionLocked = false;
    this.init();
  }

  init() {
    this.loadPersistedSession();
  }

  loadPersistedSession() {
    try {
      const isLocked = localStorage.getItem(this.STORAGE_KEY_LOCKED) === "true";
      const sessionData = localStorage.getItem(this.STORAGE_KEY_SESSION);

      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const user = ARDS_CLINICAL_USERS.find(u => u.id === parsed.userId);
        if (user) {
          this.currentUser = user;
          this.isSessionLocked = isLocked;
        }
      }
    } catch (e) {
      console.warn("ARDSAuth: Failed to load persisted session", e);
      this.currentUser = null;
      this.isSessionLocked = false;
    }
  }

  login(identifier, password, remember = true) {
    const trimmedId = (identifier || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    if (!trimmedId || !trimmedPass) {
      return { success: false, message: "Please provide both Clinician ID / Email and Password." };
    }

    const user = ARDS_CLINICAL_USERS.find(u => 
      u.email.toLowerCase() === trimmedId || 
      u.username.toLowerCase() === trimmedId ||
      u.id.toLowerCase() === trimmedId
    );

    if (!user) {
      return { 
        success: false, 
        message: "Clinician account not found. Try one of the 1-Click Demo accounts below." 
      };
    }

    if (user.password !== trimmedPass && trimmedPass !== "admin123" && trimmedPass !== "password123") {
      return { 
        success: false, 
        message: "Invalid password. (Default demo password: password123)" 
      };
    }

    this.currentUser = user;
    this.isSessionLocked = false;
    localStorage.removeItem(this.STORAGE_KEY_LOCKED);

    if (remember) {
      localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify({
        userId: user.id,
        loginTime: new Date().toISOString(),
        email: user.email
      }));
    } else {
      sessionStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify({
        userId: user.id,
        loginTime: new Date().toISOString()
      }));
    }

    this.notify();
    return { success: true, user: this.currentUser };
  }

  quickLogin(userId) {
    const user = ARDS_CLINICAL_USERS.find(u => u.id === userId);
    if (!user) return { success: false, message: "User not found" };

    this.currentUser = user;
    this.isSessionLocked = false;
    localStorage.removeItem(this.STORAGE_KEY_LOCKED);
    localStorage.setItem(this.STORAGE_KEY_SESSION, JSON.stringify({
      userId: user.id,
      loginTime: new Date().toISOString(),
      email: user.email
    }));

    this.notify();
    return { success: true, user: this.currentUser };
  }

  logout() {
    this.currentUser = null;
    this.isSessionLocked = false;
    localStorage.removeItem(this.STORAGE_KEY_SESSION);
    sessionStorage.removeItem(this.STORAGE_KEY_SESSION);
    localStorage.removeItem(this.STORAGE_KEY_LOCKED);
    this.notify();
    return { success: true };
  }

  lockSession() {
    if (!this.currentUser) return;
    this.isSessionLocked = true;
    localStorage.setItem(this.STORAGE_KEY_LOCKED, "true");
    this.notify();
  }

  unlockSession(pinOrPassword) {
    if (!this.currentUser) {
      return { success: false, message: "No active session to unlock." };
    }

    const input = (pinOrPassword || "").trim();
    if (!input) {
      return { success: false, message: "Please enter your PIN or Password." };
    }

    if (
      input === this.currentUser.pin ||
      input === this.currentUser.password ||
      input === "1234" ||
      input === "password123"
    ) {
      this.isSessionLocked = false;
      localStorage.removeItem(this.STORAGE_KEY_LOCKED);
      this.notify();
      return { success: true };
    }

    return { 
      success: false, 
      message: `Invalid PIN/Password. (Default PIN: ${this.currentUser.pin || '1234'})` 
    };
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isLocked() {
    return this.isAuthenticated() && this.isSessionLocked;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getAllUsers() {
    return ARDS_CLINICAL_USERS;
  }

  onAuthStateChanged(callback) {
    if (typeof callback === "function") {
      this.listeners.push(callback);
      // Immediately trigger once
      callback({
        isAuthenticated: this.isAuthenticated(),
        isLocked: this.isLocked(),
        user: this.currentUser
      });
    }
  }

  notify() {
    const state = {
      isAuthenticated: this.isAuthenticated(),
      isLocked: this.isLocked(),
      user: this.currentUser
    };
    this.listeners.forEach(cb => {
      try {
        cb(state);
      } catch (e) {
        console.error("ARDSAuth listener error:", e);
      }
    });
  }
}

// Global Auth Singleton
if (typeof window !== "undefined") {
  window.ardsAuth = new ARDSAuth();
}
