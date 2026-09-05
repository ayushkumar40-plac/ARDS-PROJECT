/**
 * Smoke test for the interactive login interface (js/auth.js).
 * Run:  node verify_auth.js   (from inside the ARDS-PROJECT directory)
 *
 * No browser required: auth.js is exercised through a minimal DOM /
 * storage shim that models just the elements + APIs it touches. The flow
 * validated is the product of "add login interface":
 *
 *   1. Loading with no existing session  -> dashboard is LOCKED behind the
 *      login screen (auth gate is interactive, no silent sign-in).
 *   2. The demo sign-in flow             -> validates credentials, persists a
 *      "Keep me signed in" session, renders the user chip, and UNLOCKS the
 *      dashboard.
 *   3. Session restore on re-init        -> an existing remember-me session
 *      re-opens the dashboard without prompting.
 *   4. Logout                            -> clears the session and re-locks.
 */
const fs = require('fs');
const path = require('path');
const AUTH_PATH = path.join(__dirname, 'js', 'auth.js');

/* ================================================================== */
/*  Minimal DOM / Storage shim                                         */
/* ================================================================== */
function makeStore() {
    const data = {};
    return {
        getItem: (k) => (Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null),
        setItem: (k, v) => { data[k] = String(v); },
        removeItem: (k) => { delete data[k]; },
        clear: () => { for (const k in data) delete data[k]; }
    };
}
const localStorage = makeStore();
const sessionStorage = makeStore();

function classList() {
    const set = new Set();
    return {
        add(...c) { for (const x of c) set.add(x); },
        remove(...c) { for (const x of c) set.delete(x); },
        toggle(c, force) {
            if (force === undefined) {
                if (set.has(c)) set.delete(c); else set.add(c);
            } else if (force) set.add(c); else set.delete(c);
        },
        contains(c) { return set.has(c); },
        _set: set
    };
}

class ShimEl {
    constructor(id) {
        this.id = id;
        this.innerHTML = '';
        this.textContent = '';
        this.value = '';
        this.type = 'text';
        this.disabled = false;
        this.checked = false;
        this.classList = classList();
        this._listeners = {};
    }
    addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
    dispatchEvent(type) { (this._listeners[type] || []).slice().forEach(fn => fn({ preventDefault() {}, stopPropagation() {}, target: this })); }
    querySelector() { return new ShimEl('__qsel__'); }
    reset() { /* no-op */ }
}

const registry = {};
function el(id) { if (!registry[id]) registry[id] = new ShimEl(id); return registry[id]; }

const body = el('body');
body.classList = classList();

const documentShim = {
    readyState: 'complete',
    body: body,
    addEventListener() {},
    getElementById: (id) => (id === 'body' ? body : (registry[id] || null)),
    querySelector() { return new ShimEl('__doc_qsel__'); }
};

const windowShim = {
    lucide: { createIcons() {} },
    localStorage,
    sessionStorage,
    document: documentShim,
    addEventListener() {},
    removeEventListener() {}
};

global.window = windowShim;
global.document = documentShim;
global.localStorage = localStorage;
global.sessionStorage = sessionStorage;
/* ------------------------------------------------------------------ */
/*  Test helpers                                                       */
/* ------------------------------------------------------------------ */
let assertCount = 0, failCount = 0;
function check(label, cond) {
    assertCount++;
    if (cond) { console.log('PASS - ' + label); }
    else { failCount++; console.log('FAIL - ' + label); }
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function requireFreshAuth() {
    delete require.cache[require.resolve(AUTH_PATH)];
    require(AUTH_PATH);
    return global.window.ardsAuth;
}

/* Pre-seed element state to mirror index.html */
el('btnLoginSubmit').innerHTML = '<i data-lucide="log-in" class="w-4 h-4"></i><span>Sign In to Dashboard</span>';
['loginScreen', 'loginCard', 'loginMessage', 'loginTabSignin', 'loginTabRegister',
 'loginFormSignin', 'loginFormRegister', 'loginEmail', 'loginPassword',
 'loginRemember', 'toggleLoginPassword', 'btnLoginSubmit', 'btnFillDemo',
 'btnRegisterSubmit', 'registerName', 'registerEmail', 'registerPassword',
 'registerConfirm', 'registerRole', 'userChip', 'userAvatar', 'userName',
 'userRole', 'btnLogout'].forEach(id => el(id));
// Mirror index.html initial class state for assertions that depend on it.
el('userChip').classList.add('hidden');
registry['loginRemember'].checked = true;

(async function main() {
    /* ---- 1. Fresh load with no session: dashboard must be gated ---- */
    let auth = requireFreshAuth();
    check('initial: dashboard locked (body.auth-locked)', body.classList.contains('auth-locked'));
    check('initial: login screen visible (no .hidden)', !registry['loginScreen'].classList.contains('hidden'));
    check('initial: user chip hidden', registry['userChip'].classList.contains('hidden'));
    check('initial: no current user before sign-in', auth.getCurrentUser() === null);

    /* ---- 2. Demo sign-in flow -> verify + unlock ---- */
    registry['loginEmail'].value = 'clinician@ards.demo';
    registry['loginPassword'].value = 'ards123';
    registry['loginFormSignin'].dispatchEvent('submit');
    // 650ms verify + 700ms unlock + 450ms fade-out reveal
    await wait(2100);

    check('signin: dashboard unlocked', !body.classList.contains('auth-locked'));
    check('signin: login screen hidden after unlock', registry['loginScreen'].classList.contains('hidden'));
    check('signin: user chip shown', !registry['userChip'].classList.contains('hidden'));
    check('signin: avatar initials = DR', registry['userAvatar'].textContent === 'DR');
    check('signin: user name = Dr. Rachel Thorne', registry['userName'].textContent === 'Dr. Rachel Thorne');
    check('signin: user role = Clinician', registry['userRole'].textContent === 'Clinician');
    check('signin: session persisted for current user',
        !!auth.getCurrentUser() && auth.getCurrentUser().email === 'clinician@ards.demo');

    /* ---- 3. Session restore: re-init opens dashboard w/o prompting ---- */
    auth = requireFreshAuth();
    check('restore: dashboard unlocked on re-init', !body.classList.contains('auth-locked'));
    await wait(600); // allow the 450ms login-screen fade-out to complete
    check('restore: login screen hidden on restore', registry['loginScreen'].classList.contains('hidden'));
    check('restore: user chip shown on restore', !registry['userChip'].classList.contains('hidden'));
    check('restore: persisted session recognised',
        !!auth.getCurrentUser() && auth.getCurrentUser().email === 'clinician@ards.demo');

    /* ---- 4. Logout -> session cleared, dashboard re-gated ---- */
    auth.logout();
    check('logout: current user cleared', auth.getCurrentUser() === null);
    check('logout: dashboard re-locked', body.classList.contains('auth-locked'));
    check('logout: login screen visible', !registry['loginScreen'].classList.contains('hidden'));

    console.log('');
    console.log(failCount === 0
        ? ('ALL LOGIN AUTH CHECKS PASSED (' + assertCount + ' assertions)')
        : (failCount + ' of ' + assertCount + ' CHECK(S) FAILED'));
    process.exit(failCount === 0 ? 0 : 1);
})();
