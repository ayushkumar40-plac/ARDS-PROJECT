/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Authentication Module (Prototype)
 *
 * Simulated client-side authentication for the research prototype.
  * - Session restore: an existing "Keep me signed in" session skips the
 *   login gate; otherwise the dashboard is gated behind an interactive
 *   login screen (no silent credential submission).
 * - Accounts are persisted in localStorage (NOT secure — demo only).
 * - Session persistence: sessionStorage by default, localStorage if
 *   "Keep me signed in" is checked.
 * - The login screen overlays the dashboard; the dashboard renders
 *   underneath so charts initialize with correct dimensions.
 */

(function () {
    'use strict';

    /* ---------------------------------------------------------
     * Constants & Storage Keys
     * ------------------------------------------------------- */
    const USERS_KEY = 'ards_users';          // registered accounts
    const SESSION_KEY = 'ards_session';      // active session (session/localStorage)
    const DEMO_ACCOUNT = {
        name: 'Dr. Rachel Thorne',
        email: 'clinician@ards.demo',
        password: 'ards123',
        role: 'Clinician',
        doctorId: 'ARDS-D-1001',
        createdAt: '2026-01-05T09:00:00.000Z'
    };

    /* ---------------------------------------------------------
     * Storage Helpers (safe against disabled storage)
     * ------------------------------------------------------- */
    function safeGet(store, key) {
        try { return store.getItem(key); } catch (e) { return null; }
    }
    function safeSet(store, key, value) {
        try { store.setItem(key, value); } catch (e) { /* storage unavailable */ }
    }
    function safeRemove(store, key) {
        try { store.removeItem(key); } catch (e) { /* ignore */ }
    }

    function loadUsers() {
        const raw = safeGet(localStorage, USERS_KEY);
        let users = [];
        try { users = raw ? JSON.parse(raw) : []; } catch (e) { users = []; }
        // Seed demo account on first run
        if (!users.some(u => u.email.toLowerCase() === DEMO_ACCOUNT.email)) {
            users.push({ ...DEMO_ACCOUNT });
            saveUsers(users);
        }
        return users;
    }

    function saveUsers(users) {
        safeSet(localStorage, USERS_KEY, JSON.stringify(users));
    }

    /* ---------------------------------------------------------
     * Doctor Profile: Doctor ID + general info management
     * ------------------------------------------------------- */
    const PROFILE_FIELDS = ['phone', 'specialization', 'qualification', 'licenseNo',
        'organization', 'city', 'experienceYears'];

    function emptyProfile() {
        return {
            phone: '', specialization: '', qualification: '', licenseNo: '',
            organization: '', city: '', experienceYears: ''
        };
    }

    // Doctor IDs are sequential: ARDS-D-1001 (demo), ARDS-D-1002, ARDS-D-1003, ...
    function nextDoctorId(users) {
        let max = 1000;
        users.forEach(u => {
            const m = /^ARDS-D-(\d+)$/.exec(String(u.doctorId || ''));
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'ARDS-D-' + (max + 1);
    }

    // One-time migration: legacy accounts get a Doctor ID + profile defaults
    function migrateUsers(users) {
        let changed = false;
        users.forEach(u => {
            if (!u.doctorId) { u.doctorId = nextDoctorId(users); changed = true; }
            if (!u.createdAt) { u.createdAt = new Date().toISOString(); changed = true; }
            PROFILE_FIELDS.forEach(f => {
                if (u[f] === undefined) { u[f] = ''; changed = true; }
            });
        });
        if (changed) saveUsers(users);
        return users;
    }

    // Full account payload (used for the header chip and the session store)
    function accountPayload(user) {
        const payload = {
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'Clinician',
            doctorId: user.doctorId || '',
            createdAt: user.createdAt || '',
            lastLoginAt: user.lastLoginAt || ''
        };
        PROFILE_FIELDS.forEach(f => { payload[f] = user[f] !== undefined ? user[f] : ''; });
        return payload;
    }

    /* ---------------------------------------------------------
     * Session Helpers
     * ------------------------------------------------------- */
    function getStoredSession() {
        // Prefer sessionStorage (per-tab), fall back to localStorage (remember me)
        const s = safeGet(sessionStorage, SESSION_KEY);
        if (s) {
            try { return JSON.parse(s); } catch (e) { /* fall through */ }
        }
        const l = safeGet(localStorage, SESSION_KEY);
        if (l) {
            try { return JSON.parse(l); } catch (e) { return null; }
        }
        return null;
    }

    function storeSession(user, remember) {
        const payload = JSON.stringify({
            ...accountPayload(user),
            loginAt: new Date().toISOString()
        });
        if (remember) {
            safeSet(localStorage, SESSION_KEY, payload);
        } else {
            safeSet(sessionStorage, SESSION_KEY, payload);
        }
    }

    function clearSession() {
        safeRemove(sessionStorage, SESSION_KEY);
        safeRemove(localStorage, SESSION_KEY);
    }

    /* ---------------------------------------------------------
     * DOM References
     * ------------------------------------------------------- */
    const el = (id) => document.getElementById(id);

    const loginScreen = el('loginScreen');
    const loginCard = el('loginCard');
    const loginMessage = el('loginMessage');

    const tabSignin = el('loginTabSignin');
    const tabRegister = el('loginTabRegister');
    const formSignin = el('loginFormSignin');
    const formRegister = el('loginFormRegister');

    const userChip = el('userChip');
    const userAvatar = el('userAvatar');
    const userName = el('userName');
    const userRole = el('userRole');
    const userDoctorId = el('userDoctorId');

    /* ---------------------------------------------------------
     * UI Helpers
     * ------------------------------------------------------- */
    function refreshIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function showMessage(text, type) {
        if (!loginMessage) return;
        loginMessage.classList.remove('hidden', 'login-message-error', 'login-message-success');
        if (type === 'error') {
            loginMessage.classList.add('login-message-error');
            loginMessage.innerHTML = '<i data-lucide="alert-circle" class="w-4 h-4 flex-shrink-0"></i><span></span>';
        } else {
            loginMessage.classList.add('login-message-success');
            loginMessage.innerHTML = '<i data-lucide="check-circle-2" class="w-4 h-4 flex-shrink-0"></i><span></span>';
        }
        loginMessage.querySelector('span').textContent = text;
        refreshIcons();
    }

    function clearMessage() {
        if (loginMessage) loginMessage.classList.add('hidden');
    }

    function setBusy(button, busy, busyText, idleHTML) {
        if (!button) return;
        button.disabled = busy;
        if (busy) {
            button.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span></span>';
            button.querySelector('span').textContent = busyText;
        } else {
            button.innerHTML = idleHTML;
        }
        refreshIcons();
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function initials(name) {
        return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '--';
    }

    /* ---------------------------------------------------------
     * Auth Mode Tabs (Sign In / Register)
     * ------------------------------------------------------- */
    function switchAuthMode(mode) {
        clearMessage();
        const isSignin = mode === 'signin';

        tabSignin.classList.toggle('login-tab-active', isSignin);
        tabRegister.classList.toggle('login-tab-active', !isSignin);
        formSignin.classList.toggle('hidden', !isSignin);
        formRegister.classList.toggle('hidden', isSignin);
    }

    /* ---------------------------------------------------------
     * Dashboard Gating
     * ------------------------------------------------------- */
    function lockDashboard() {
        document.body.classList.add('auth-locked');
        if (loginScreen) {
            loginScreen.classList.remove('hidden', 'login-screen-leaving');
            loginScreen.classList.add('login-screen-entering');
        }
        refreshIcons();
    }

    function unlockDashboard(instant) {
        document.body.classList.remove('auth-locked');
        if (loginScreen) {
            if (instant) {
                // Auto-login path: never show the login overlay at all — hide
                // it immediately so the app opens straight onto the dashboard.
                loginScreen.classList.add('hidden');
                loginScreen.classList.remove('login-screen-leaving', 'login-screen-entering');
                return;
            }
            loginScreen.classList.add('login-screen-leaving');
            setTimeout(() => {
                loginScreen.classList.add('hidden');
                loginScreen.classList.remove('login-screen-leaving', 'login-screen-entering');
            }, 450);
        }
    }

    function renderUserChip(user) {
        if (!userChip) return;
        userChip.classList.remove('hidden');
        userChip.classList.add('flex');
        if (userAvatar) userAvatar.textContent = initials(user.name);
        if (userName) userName.textContent = user.name;
        if (userRole) userRole.textContent = user.role;
        if (userDoctorId) userDoctorId.textContent = user.doctorId || 'ARDS-D-----';
    }

    /* ---------------------------------------------------------
     * Sign In Flow
     * ------------------------------------------------------- */
    function handleSignIn(event) {
        event.preventDefault();
        clearMessage();

        const email = (el('loginEmail')?.value || '').trim().toLowerCase();
        const password = el('loginPassword')?.value || '';
        const remember = !!(el('loginRemember') && el('loginRemember').checked);

        if (!email || !password) {
            showMessage('Please enter both your email address and password.', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showMessage('That email address does not look valid.', 'error');
            return;
        }

        const submitBtn = el('btnLoginSubmit');
        const idleHTML = submitBtn.innerHTML;
        setBusy(submitBtn, true, 'Verifying credentials…', idleHTML);

        // Simulated network latency for prototype realism
        setTimeout(() => {
            const users = loadUsers();
            const user = users.find(u => u.email.toLowerCase() === email);

            if (!user || user.password !== password) {
                setBusy(submitBtn, false, '', idleHTML);
                showMessage('Invalid credentials. Check your email and password, or use the demo account.', 'error');
                return;
            }

            storeSession(user, remember);
            setBusy(submitBtn, false, '', idleHTML);
            showMessage('Welcome back, ' + user.name + '. Loading dashboard…', 'success');
            renderUserChip(user);

            setTimeout(() => {
                unlockDashboard();
                formSignin.reset();
                el('loginRemember').checked = true;
            }, 700);
        }, 650);
    }

    /* ---------------------------------------------------------
     * Register Flow
     * ------------------------------------------------------- */
    function handleRegister(event) {
        event.preventDefault();
        clearMessage();

        const name = (el('registerName')?.value || '').trim();
        const email = (el('registerEmail')?.value || '').trim().toLowerCase();
        const password = el('registerPassword')?.value || '';
        const confirm = el('registerConfirm')?.value || '';
        const role = el('registerRole')?.value || 'Clinician';

        if (!name || !email || !password) {
            showMessage('All fields are required to create an account.', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long.', 'error');
            return;
        }
        if (password !== confirm) {
            showMessage('Passwords do not match. Please re-enter them.', 'error');
            return;
        }

        const users = loadUsers();
        if (users.some(u => u.email.toLowerCase() === email)) {
            showMessage('An account with this email already exists. Try signing in instead.', 'error');
            return;
        }

        const submitBtn = el('btnRegisterSubmit');
        const idleHTML = submitBtn.innerHTML;
        setBusy(submitBtn, true, 'Creating account…', idleHTML);

        setTimeout(() => {
            const newUser = {
                name,
                email,
                password,
                role,
                doctorId: nextDoctorId(users),
                createdAt: new Date().toISOString(),
                ...emptyProfile()
            };
            users.push(newUser);
            saveUsers(users);

            storeSession(newUser, true); // auto sign-in after registration
            setBusy(submitBtn, false, '', idleHTML);
            showMessage('Account created. Welcome to ARDS, ' + name + '!', 'success');
            renderUserChip(newUser);

            setTimeout(() => {
                unlockDashboard();
                formRegister.reset();
            }, 700);
        }, 650);
    }

    function currentAccount() {
        const session = getStoredSession();
        if (!session || !session.email) return null;
        const users = loadUsers();
        return users.find(u => u.email.toLowerCase() === session.email.toLowerCase()) || null;
    }

    function updateProfile(updates) {
        const session = getStoredSession();
        if (!session) return false;
        
        let users = loadUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === session.email.toLowerCase());
        if (idx === -1) return false;

        const updatedUser = { ...users[idx], ...updates };
        users[idx] = updatedUser;
        saveUsers(users);
        
        // update session but preserve loginAt
        storeSession({ ...updatedUser, loginAt: session.loginAt }, el('loginRemember') && el('loginRemember').checked);
        renderUserChip(updatedUser);
        return true;
    }

    function openProfileModal() {
        const user = currentAccount();
        if (!user || !el('modalProfile')) return;

        const form = el('formProfile');
        if (form) form.reset();

        // Populate fields
        if (el('profileDoctorId')) el('profileDoctorId').textContent = user.doctorId || 'N/A';
        if (el('profileName')) el('profileName').value = user.name || '';
        if (el('profileEmail')) el('profileEmail').value = user.email || '';
        if (el('profilePhone')) el('profilePhone').value = user.phone || '';
        if (el('profileRole')) el('profileRole').value = user.role || 'Clinician';
        if (el('profileSpecialization')) el('profileSpecialization').value = user.specialization || '';
        if (el('profileQualification')) el('profileQualification').value = user.qualification || '';
        if (el('profileLicense')) el('profileLicense').value = user.licenseNo || '';
        if (el('profileOrganization')) el('profileOrganization').value = user.organization || '';
        if (el('profileCity')) el('profileCity').value = user.city || '';
        if (el('profileExperience')) el('profileExperience').value = user.experienceYears || '';
        
        if (el('profileMemberSince')) {
            const date = new Date(user.createdAt);
            el('profileMemberSince').textContent = isNaN(date) ? 'Unknown' : date.toLocaleDateString();
        }

        // Hide errors/success
        ['profileFormError', 'profileNameError', 'profileEmailError', 'profilePhoneError', 'profileExperienceError'].forEach(id => {
            if (el(id)) el(id).classList.add('hidden');
        });
        if (el('profileSuccess')) el('profileSuccess').classList.add('hidden');

        el('modalProfile').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
    }

    function setupProfileModal() {
        if (el('btnProfileChip')) el('btnProfileChip').addEventListener('click', openProfileModal);
        if (el('btnOpenProfile')) el('btnOpenProfile').addEventListener('click', openProfileModal);
        
        const closeBtn = el('btnCloseProfileModal');
        const cancelBtn = el('btnCancelProfile');
        const successCloseBtn = el('btnCloseProfileSuccess');
        
        const closeHandler = () => {
            if (el('modalProfile')) el('modalProfile').classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        };

        if (closeBtn) closeBtn.addEventListener('click', closeHandler);
        if (cancelBtn) cancelBtn.addEventListener('click', closeHandler);
        if (successCloseBtn) successCloseBtn.addEventListener('click', closeHandler);

        if (el('btnCopyDoctorId')) {
            el('btnCopyDoctorId').addEventListener('click', () => {
                const id = el('profileDoctorId') ? el('profileDoctorId').textContent : '';
                if (!id || id === 'N/A') return;
                navigator.clipboard.writeText(id).then(() => {
                    if (el('profileCopyNote')) {
                        el('profileCopyNote').classList.remove('hidden');
                        setTimeout(() => {
                            if (el('profileCopyNote')) el('profileCopyNote').classList.add('hidden');
                        }, 2000);
                    }
                });
            });
        }

        const form = el('formProfile');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Reset errors
                ['profileFormError', 'profileNameError', 'profileEmailError', 'profilePhoneError', 'profileExperienceError'].forEach(id => {
                    if (el(id)) el(id).classList.add('hidden');
                });

                const name = (el('profileName') ? el('profileName').value : '').trim();
                const email = (el('profileEmail') ? el('profileEmail').value : '').trim();
                const phone = (el('profilePhone') ? el('profilePhone').value : '').trim();
                const exp = el('profileExperience') ? el('profileExperience').value : '';
                
                let hasError = false;
                if (!name) {
                    if (el('profileNameError')) el('profileNameError').classList.remove('hidden');
                    hasError = true;
                }
                if (!email || !isValidEmail(email)) {
                    if (el('profileEmailError')) el('profileEmailError').classList.remove('hidden');
                    hasError = true;
                }
                
                if (hasError) return;

                const success = updateProfile({
                    name,
                    email,
                    phone,
                    role: el('profileRole') ? el('profileRole').value : 'Clinician',
                    specialization: el('profileSpecialization') ? el('profileSpecialization').value : '',
                    qualification: el('profileQualification') ? el('profileQualification').value : '',
                    licenseNo: el('profileLicense') ? el('profileLicense').value : '',
                    organization: el('profileOrganization') ? el('profileOrganization').value : '',
                    city: el('profileCity') ? el('profileCity').value : '',
                    experienceYears: exp
                });

                if (success) {
                    if (el('profileSuccess')) el('profileSuccess').classList.remove('hidden');
                    setTimeout(() => closeHandler(), 1500);
                } else {
                    if (el('profileFormError')) el('profileFormError').classList.remove('hidden');
                }
            });
        }
    }

    /* ---------------------------------------------------------
     * Logout Flow
     * ------------------------------------------------------- */
    function handleLogout() {
        clearSession();
        lockDashboard();
        clearMessage();
        // Prefill last used email for convenience
        const lastEmail = safeGet(localStorage, 'ards_last_email');
        if (lastEmail && el('loginEmail')) el('loginEmail').value = lastEmail;
    }

    /* ---------------------------------------------------------
     * Initialization
     * ------------------------------------------------------- */
    function initAuth() {
        // Wire tab switching
        if (tabSignin) tabSignin.addEventListener('click', () => switchAuthMode('signin'));
        if (tabRegister) tabRegister.addEventListener('click', () => switchAuthMode('register'));

        // Wire forms
        if (formSignin) formSignin.addEventListener('submit', handleSignIn);
        if (formRegister) formRegister.addEventListener('submit', handleRegister);

        // Password visibility toggle
        const pwToggle = el('toggleLoginPassword');
        const pwInput = el('loginPassword');
        if (pwToggle && pwInput) {
            pwToggle.addEventListener('click', () => {
                const showing = pwInput.type === 'text';
                pwInput.type = showing ? 'password' : 'text';
                pwToggle.innerHTML = showing
                    ? '<i data-lucide="eye" class="w-4 h-4"></i>'
                    : '<i data-lucide="eye-off" class="w-4 h-4"></i>';
                refreshIcons();
            });
        }

        // Demo account quick-fill
        const demoBtn = el('btnFillDemo');
        if (demoBtn) {
            demoBtn.addEventListener('click', () => {
                switchAuthMode('signin');
                if (el('loginEmail')) el('loginEmail').value = DEMO_ACCOUNT.email;
                if (el('loginPassword')) el('loginPassword').value = DEMO_ACCOUNT.password;
                clearMessage();
                showMessage('Demo credentials filled. Click "Authenticate & Enter Dashboard" to continue.', 'success');
            });
        }
        
        window.fillDemo = function(email, password, role) {
            switchAuthMode('signin');
            if (el('loginEmail')) el('loginEmail').value = email;
            if (el('loginPassword')) el('loginPassword').value = password;
            clearMessage();
            showMessage(`Credentials for ${email} populated. Click below to sign in.`, 'success');
        };

        // Logout
        const logoutBtn = el('btnLogout');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        // One-time migration: ensure every account has a Doctor ID + profile defaults
        loadUsers();

        // Doctor profile modal (view / edit general info)
        setupProfileModal();

        // Remember last-used email
        const emailInput = el('loginEmail');
        if (emailInput) {
            const last = safeGet(localStorage, 'ards_last_email');
            if (last) emailInput.value = last;
            formSignin.addEventListener('submit', () => {
                safeSet(localStorage, 'ards_last_email', emailInput.value.trim().toLowerCase());
            });
        }

        
        // Restore an existing "Keep me signed in" session without re-prompting.
        // Otherwise, gate the dashboard behind the login screen so the login
        // interface remains interactive (no silent auto-submit of credentials).
        const saved = getStoredSession();
        if (saved && saved.email) {
            renderUserChip(currentAccount() || saved);
            unlockDashboard();
        } else {
            lockDashboard();
        }
        refreshIcons();
    }

    // Run once DOM is ready (auth.js loads before app.js)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    // Expose minimal API for other modules (e.g., voice assistant)
    window.ardsAuth = {
        getCurrentUser: () => getStoredSession(),
        getAccount: currentAccount,
        updateProfile: updateProfile,
        openProfile: openProfileModal,
        logout: handleLogout
    };
})();