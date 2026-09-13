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
    let thenCalls = 0;
    const origThen = window.Promise.prototype.then;
    window.Promise.prototype.then = function (ok, bad) {
      thenCalls++;
      if (thenCalls === 2000 || thenCalls === 20000 || (thenCalls % 100000 === 0)) {
        const st = (new window.Error('trace')).stack || 'no-stack';
        console.log('[THEN#' + thenCalls + '] ' + st.split('\n').slice(1, 5).join(' | '));
      }
      return origThen.call(this, ok, bad);
    };
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
    d.getElementById('loginFormRegister').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    setTimeout(() => {
      console.log('[RESULT] locked=' + d.body.classList.contains('auth-locked') + ' errors=' + errors.length);
      setTimeout(() => process.exit(0), 400);
    }, 2600);
  }, 300);
}, 1200);
