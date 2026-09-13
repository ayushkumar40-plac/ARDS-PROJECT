/* Full-page boot test: loads index.html in jsdom, stubs CDN libs,
 * executes the real local scripts, captures every error, then
 * simulates clicks to verify the login UI actually responds. */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('log', (...a) => console.log('[page] ' + a.join(' ')));

const dom = new JSDOM(html, {
  url: 'https://ayushkumar40-plac.github.io/ARDS-PROJECT/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    /* CDN stubs (external resources are not fetched by jsdom) */
    window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    window.Chart = function () { return { destroy() {}, update() {}, resize() {} }; };
    window.Chart.defaults = { font: {}, color: '' };
    window.Chart.register = function () {};
    window.lucide = { createIcons() {} };
    window.mqtt = { connect() { return { on() {}, end() {} }; } };
    window.tailwind = { config: {} };
    window.IntersectionObserver = window.IntersectionObserver || class { observe() {} unobserve() {} disconnect() {} };
    window.onerror = (msg, src, line, col) => { errors.push(`window.onerror: ${msg} @ ${src}:${line}:${col}`); };
    window.addEventListener('error', (e) => errors.push('error-event: ' + (e.message || e.error)));
    window.addEventListener('unhandledrejection', (e) => errors.push('unhandledrejection: ' + String(e.reason && e.reason.message || e.reason)));
  },
});

/* Execute the real local scripts in page order (jsdom does not fetch
 * even same-origin resources without the resources loader). */
const scriptOrder = ['js/data.js', 'js/clinical-reference.js', 'js/engine.js', 'js/pipeline.js', 'js/charts.js', 'js/auth.js', 'js/app.js', 'js/voice-assistant.js', 'js/voice-ui.js', 'js/chatbot.js', 'js/ai-insights.js'];
for (const src of scriptOrder) {
  try {
    dom.window.eval(fs.readFileSync(path.join(__dirname, src), 'utf8'));
  } catch (err) {
    errors.push(`EVAL-FAIL ${src}: ${err.message}`);
  }
}


function report(label) {
  const d = dom.window.document;
  const out = {
    label,
    ardsAuth: typeof dom.window.ardsAuth,
    ardsApp: typeof dom.window.ardsApp,
    dataStore: typeof dom.window.dataStore,
    ardsAI: typeof dom.window.ardsAI,
    bodyLocked: d.body.classList.contains('auth-locked'),
    loginVisible: !d.getElementById('loginScreen').classList.contains('hidden'),
    registerFormHidden: d.getElementById('loginFormRegister').classList.contains('hidden'),
    errors: errors.slice(0, 10),
  };
  console.log('[BOOT] ' + JSON.stringify(out, null, 1));
}

setTimeout(() => {
  report('after-boot');
  const d = dom.window.document;
  const t0 = Date.now();
  const hb = setInterval(() => console.log('[HB +' + (Date.now() - t0) + 'ms] alive'), 400);

  /* 1. click the Register tab — UI must respond (form swap) */
  const regTab = d.getElementById('loginTabRegister');
  regTab.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  setTimeout(() => {
    const signin = d.getElementById('loginFormSignin');
    const register = d.getElementById('loginFormRegister');
    console.log('[CLICK register tab] signinHidden=' + signin.classList.contains('hidden') +
                ' registerShown=' + !register.classList.contains('hidden'));

    /* 2. fill demo credentials and submit sign-in */
    d.getElementById('loginEmail').value = 'clinician@ards.demo';
    d.getElementById('loginPassword').value = 'ards123';
    const form = d.getElementById('loginFormSignin');
    console.log('[DISPATCH submit at +' + (Date.now() - t0) + 'ms]');
    try {
      form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
      console.log('[DISPATCH returned cleanly]');
    } catch (e) {
      console.log('[DISPATCH THREW] ' + e.message + '\n' + e.stack);
    }
    setTimeout(() => {
      clearInterval(hb);
      const out = {
        bodyLockedAfterSignin: d.body.classList.contains('auth-locked'),
        loginScreenHidden: d.getElementById('loginScreen').classList.contains('hidden'),
        totalErrors: errors.length,
        errors: errors.slice(0, 10),
      };
      console.log('[SIGNIN] ' + JSON.stringify(out, null, 1));
      console.log(errors.length === 0 ? 'BOOT-TEST: CLEAN' : 'BOOT-TEST: ERRORS FOUND');
      console.log(!d.body.classList.contains('auth-locked') ? 'SIGNIN-TEST: DASHBOARD UNLOCKED' : 'SIGNIN-TEST: STILL LOCKED');
      const code = errors.length === 0 ? 0 : 1;
      setTimeout(() => process.exit(code), 500); /* let stdout flush */
    }, 3000);
  }, 300);
}, 1200);
