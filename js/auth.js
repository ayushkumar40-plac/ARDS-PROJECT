/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Authentication Module (Prototype)
 *
 * Simulated client-side authentication for the research prototype.
 * - AUTO SIGN-IN: visitors are signed in automatically with the demo
 *   clinician profile and land directly on the Session Overview page.
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
        role: 'Clinician'
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
            name: user.name,
            email: user.email,
            role: user.role,
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
            const newUser = { name, email, password, role };
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
                el('loginEmail').value = DEMO_ACCOUNT.email;
                el('loginPassword').value = DEMO_ACCOUNT.password;
                clearMessage();
                showMessage('Demo credentials filled. Click "Sign In to Dashboard" to continue.', 'success');
            });
        }

        // Logout
        const logoutBtn = el('btnLogout');
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        // Remember last-used email
        const emailInput = el('loginEmail');
        if (emailInput) {
            const last = safeGet(localStorage, 'ards_last_email');
            if (last) emailInput.value = last;
            formSignin.addEventListener('submit', () => {
                safeSet(localStorage, 'ards_last_email', emailInput.value.trim().toLowerCase());
            });
        }

        // AUTO SIGN-IN: skip the login gate so visitors land straight on
        // the dashboard (first page = Session Overview) without entering
        // credentials. An existing saved session is honoured when present;
        // otherwise an automatic demo-clinician session is created locally.
        const saved = getStoredSession();
        if (saved && saved.email) {
            renderUserChip(saved);
        } else {
            const guestSession = {
                name: DEMO_ACCOUNT.name,
                email: DEMO_ACCOUNT.email,
                role: DEMO_ACCOUNT.role,
                loginAt: new Date().toISOString()
            };
            storeSession(guestSession, false);
            renderUserChip(guestSession);
        }
        unlockDashboard(true);

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
        logout: handleLogout
    };
})();