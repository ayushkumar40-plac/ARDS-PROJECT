const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
vc.on('log', (...a) => console.log('[page] ' + a.join(' ')));
const dom = new JSDOM(html, {
  url: 'https://ards.local/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {} }));
    window.Chart = function () { return { destroy() {}, update() {} }; };
    window.Chart.defaults = { font: {}, color: '' };
    window.lucide = { createIcons() {} };
    window.mqtt = { connect() { return { on() {}, end() {} }; } };
    window.tailwind = { config: {} };
    window.onerror = (m) => errors.push('onerror: ' + m);
  },
});
const order = ['js/data.js','js/clinical-reference.js','js/engine.js','js/pipeline.js','js/charts.js','js/auth.js','js/app.js','js/voice-assistant.js','js/voice-ui.js','js/chatbot.js','js/ai-insights.js'];
for (const s of order) { try { dom.window.eval(fs.readFileSync(path.join(__dirname, s), 'utf8')); } catch (e) { errors.push('EVAL ' + s + ': ' + e.message); } }
const d = dom.window.document;
setTimeout(() => {
  d.getElementById('loginTabRegister').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  setTimeout(() => {
    d.getElementById('registerName').value = 'Dr. Probe';
    d.getElementById('registerEmail').value = 'probe@ards.demo';
    d.getElementById('registerPassword').value = 'probe123';
    d.getElementById('registerConfirm').value = 'probe123';
    d.getElementById('registerRole').value = 'Clinician';
    console.log('[REG] dispatching submit; locked=' + d.body.classList.contains('auth-locked'));
    d.getElementById('loginFormRegister').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    console.log('[REG] submit dispatched cleanly');
    setTimeout(() => {
      const out = {
        lockedAfterRegister: d.body.classList.contains('auth-locked'),
        loginHidden: d.getElementById('loginScreen').classList.contains('hidden'),
        usersStored: JSON.parse(d.window.localStorage.getItem('ards_users') || '[]').map(u => u.email),
        sessionStored: !!d.window.localStorage.getItem('ards_session') || !!d.window.sessionStorage.getItem('ards_session'),
        totalErrors: errors.length,
        errors: errors.slice(0, 8),
      };
      console.log('[REG-RESULT] ' + JSON.stringify(out, null, 1));
      console.log(out.lockedAfterRegister ? 'REGISTER-TEST: STILL LOCKED (loop reproduced)' : 'REGISTER-TEST: UNLOCKED OK');
      setTimeout(() => process.exit(0), 400);
    }, 2600);
  }, 300);
}, 1200);
