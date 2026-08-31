const fs = require("fs");
const path = require("path");

const dataCode = fs.readFileSync(path.join(__dirname, "js", "data.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "js", "engine.js"), "utf8");
const pipelineCode = fs.readFileSync(path.join(__dirname, "js", "pipeline.js"), "utf8");
const chartsCode = fs.readFileSync(path.join(__dirname, "js", "charts.js"), "utf8");
const authCode = fs.readFileSync(path.join(__dirname, "js", "auth.js"), "utf8");
const appCode = fs.readFileSync(path.join(__dirname, "js", "app.js"), "utf8");

// Mock browser DOM & Storage
global.window = global;
global.document = {
  documentElement: {
    getAttribute: () => "dark",
    setAttribute: () => {}
  },
  getElementById: (id) => {
    return {
      id,
      innerHTML: "",
      textContent: "",
      value: "0.70",
      type: "password",
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      addEventListener: () => {},
      getContext: () => ({
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
        fillText: () => {}
      })
    };
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  readyState: "complete",
  scrollTo: () => {}
};

global.localStorage = {
  _store: {},
  getItem: (k) => global.localStorage._store[k] || null,
  setItem: (k, v) => { global.localStorage._store[k] = v; },
  removeItem: (k) => { delete global.localStorage._store[k]; }
};

global.sessionStorage = {
  _store: {},
  getItem: (k) => global.sessionStorage._store[k] || null,
  setItem: (k, v) => { global.sessionStorage._store[k] = v; },
  removeItem: (k) => { delete global.sessionStorage._store[k]; }
};

global.lucide = {
  createIcons: () => {}
};

console.log("Evaluating script files...");
eval(dataCode);
eval(engineCode);
eval(pipelineCode);
eval(chartsCode);
eval(authCode);
eval(appCode);

console.log("Testing ARDSAuth module...");
const auth = window.ardsAuth;
if (!auth) throw new Error("ARDSAuth failed to initialize!");

// Test quick login
auth.quickLogin("USR-001");
if (!auth.isAuthenticated() || auth.getCurrentUser()?.id !== "USR-001") {
  throw new Error("Quick login USR-001 failed");
}
console.log(`[PASS] Quick login for ${auth.getCurrentUser().name} succeeded.`);

// Test session lock
auth.lockSession();
if (!auth.isLocked()) throw new Error("Session lock failed");
console.log("[PASS] Session lock succeeded.");

// Test session unlock
const unlockRes = auth.unlockSession("1234");
if (!unlockRes.success || auth.isLocked()) throw new Error("Session unlock failed");
console.log("[PASS] Session unlock succeeded.");

// Test logout
auth.logout();
if (auth.isAuthenticated()) throw new Error("Logout failed");
console.log("[PASS] Logout succeeded.");

console.log("Testing ARDSApp instantiation & all methods...");
const app = window.ardsApp;

// Test tabs
const tabs = ['home', 'upload', 'progress', 'xai', 'alerts', 'decision', 'reports', 'about'];
tabs.forEach(t => {
  app.switchTab(t);
  console.log(`[PASS] switchTab('${t}') executed cleanly.`);
});

// Test Patient switching
app.openAddPatientModal();
app.openAddSessionModal();
console.log("[PASS] Modals opened cleanly.");

// Test global helper functions
window.switchTab('progress');
window.viewSessionDetails(2);
window.acknowledgeAlert('alt-101');
console.log("[PASS] Global helper functions executed cleanly.");

console.log("=== ARDS Integration Tests 100% PASSED ===");
