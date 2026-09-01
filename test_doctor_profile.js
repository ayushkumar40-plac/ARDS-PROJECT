/**
 * ARDS - Doctor Profile Integration Test
 * Exercises Doctor ID generation/migration, the header chip display,
 * and the editable Doctor Profile modal (validation + persistence).
 */
const fs = require("fs");
const path = require("path");

const load = (f) => fs.readFileSync(path.join(__dirname, "js", f), "utf8");

/* ------------------------------------------------------------------
 * Minimal but stateful DOM mock (classList backed by a real Set)
 * ---------------------------------------------------------------- */
function makeClassList() {
  const set = new Set();
  return {
    add: (...cls) => cls.forEach(c => set.add(c)),
    remove: (...cls) => cls.forEach(c => set.delete(c)),
    toggle: (c, force) => {
      const on = force === undefined ? !set.has(c) : !!force;
      if (on) set.add(c); else set.delete(c);
      return on;
    },
    contains: (c) => set.has(c)
  };
}

function makeEl(id, props = {}) {
  const listeners = {};
  const el = {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    checked: false,
    disabled: false,
    dataset: {},
    classList: makeClassList(),
    addEventListener: (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); },
    dispatch: (evt, evtObj = {}) => (listeners[evt] || []).forEach(fn => fn(evtObj)),
    querySelector: () => null,
    focus: () => { },
    reset: () => { el.value = ""; },
    ...props
  };
  return el;
}

const registry = {};
const reg = (id, props) => { registry[id] = makeEl(id, props); return registry[id]; };

// Auth / login screen elements referenced by auth.js
reg("loginScreen"); reg("loginCard"); reg("loginMessage");
reg("loginTabSignin"); reg("loginTabRegister");
reg("loginFormSignin"); reg("loginFormRegister");
reg("loginEmail"); reg("loginPassword");
const loginRemember = reg("loginRemember"); loginRemember.checked = true;
reg("btnFillDemo"); reg("btnLogout");
reg("toggleLoginPassword");
reg("registerName"); reg("registerEmail"); reg("registerPassword");
reg("registerConfirm"); reg("registerRole");
reg("btnLoginSubmit"); reg("btnRegisterSubmit");

// Dashboard header chip
reg("userChip");
reg("userAvatar"); reg("userName"); reg("userRole"); reg("userDoctorId");

// Doctor profile modal
reg("modalProfile");
const formProfile = reg("formProfile");
reg("btnProfileChip"); reg("btnOpenProfile"); reg("btnCloseProfileModal");
reg("btnCancelProfile"); reg("btnCloseProfileSuccess"); reg("btnCopyDoctorId");
reg("profileDoctorId");
reg("profileName"); reg("profileEmail"); reg("profilePhone"); reg("profileRole");
reg("profileSpecialization"); reg("profileQualification"); reg("profileLicense");
reg("profileOrganization"); reg("profileCity"); reg("profileExperience");
reg("profileNameError"); reg("profileEmailError"); reg("profilePhoneError");
reg("profileExperienceError"); reg("profileFormError"); reg("profileSuccess");
reg("profileMemberSince"); reg("profileLastLogin"); reg("profileCopyNote");

/* ------------------------------------------------------------------
 * Browser globals
 * ---------------------------------------------------------------- */
const docListeners = {};
global.window = global;
global.document = {
  documentElement: { getAttribute: () => "dark", setAttribute: () => { } },
  body: { classList: makeClassList(), appendChild: () => { }, removeChild: () => { } },
  getElementById: (id) => registry[id] || makeEl(id),
  createElement: (tag) => makeEl("mock-" + tag),
  querySelectorAll: () => [],
  addEventListener: (evt, fn) => { (docListeners[evt] = docListeners[evt] || []).push(fn); },
  readyState: "complete",
  scrollTo: () => { }
};
global.localStorage = {
  _store: {},
  getItem: (k) => (k in global.localStorage._store ? global.localStorage._store[k] : null),
  setItem: (k, v) => { global.localStorage._store[k] = String(v); }
};
global.sessionStorage = {
  _store: {},
  getItem: (k) => (k in global.sessionStorage._store ? global.sessionStorage._store[k] : null),
  setItem: (k, v) => { global.sessionStorage._store[k] = String(v); }
};
global.lucide = { createIcons: () => { } };
global.confirm = () => true;

/* ------------------------------------------------------------------
 * Seed: demo account (has Doctor ID) + a legacy account (no Doctor ID),
 * plus an active session for the legacy account.
 * ---------------------------------------------------------------- */
global.localStorage._store["ards_users"] = JSON.stringify([
  {
    name: "Dr. Rachel Thorne", email: "clinician@ards.demo", password: "ards123",
    role: "Clinician", doctorId: "ARDS-D-1001", createdAt: "2026-01-05T09:00:00.000Z"
  },
  {
    name: "Dr. Old Legacy", email: "legacy@ards.demo", password: "abc123", role: "Researcher"
  }
]);
global.localStorage._store["ards_session"] = JSON.stringify({
  name: "Dr. Old Legacy", email: "legacy@ards.demo", role: "Researcher",
  loginAt: "2026-08-30T10:00:00.000Z"
});

console.log("Evaluating auth.js...");
eval(load("auth.js"));

const auth = window.ardsAuth;
let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { failures++; console.error("[FAIL] " + msg); }
  else console.log("[PASS] " + msg);
};
const storedUsers = () => JSON.parse(global.localStorage.getItem("ards_users"));

// __PROFILE_TESTS_PART2__