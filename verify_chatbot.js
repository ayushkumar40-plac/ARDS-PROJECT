const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = __dirname;
let failures = 0;
function check(label, condition) {
  console.log((condition ? 'PASS' : 'FAIL') + ' - ' + label);
  if (!condition) failures++;
}

try {
  execFileSync(process.execPath, ['--check', path.join(root, 'js', 'chatbot.js')], { stdio: 'pipe' });
  check('chatbot.js passes syntax check', true);
} catch (e) {
  check('chatbot.js passes syntax check', false);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'chatbot.js'), 'utf8');

check('chatbot script is included', html.includes('js/chatbot.js'));
check('chatbot loads after app and engine',
  html.indexOf('js/chatbot.js') > html.indexOf('js/app.js') &&
  html.indexOf('js/chatbot.js') > html.indexOf('js/engine.js'));
check('floating action button is generated', js.includes("id=\"ardsChatbotFab\""));
check('accessible chat dialog is generated', js.includes('aria-label="Clinical assistant"'));
check('chatbot uses active patient context', js.includes('getActivePatient'));
check('chatbot uses active session context', js.includes('getActiveSession'));
check('chatbot uses ARDS scoring engine', js.includes('calculateScore'));
check('chatbot uses safety decision engine', js.includes('evaluateDecisionAndSafety'));
check('chatbot supports keyboard Escape', js.includes("e.key === 'Escape'"));
check('chatbot UI styles are defined', css.includes('.ards-chatbot-panel'));
check('chatbot is hidden while login is locked', css.includes('body.auth-locked .ards-chatbot-root'));
check('chatbot has responsive mobile styles', /@media \(max-width: 640px\)[\s\S]*\.ards-chatbot-panel/.test(css));
check('chatbot has clinical disclaimer', js.includes('not for primary diagnosis'));
check('chatbot UI copy uses full system name', js.includes('Adaptive Rehabilitation Decision Support System'));
check('chatbot no longer brands itself with the ARDS acronym',
  !js.includes('ARDS Clinical Assistant') && !js.includes('the ARDS clinical assistant'));
check('page title uses full system name without acronym',
  html.includes('<title>Adaptive Rehabilitation Decision Support System</title>') && !html.includes('ARDS &mdash;'));
check('login screen is de-acronymized', !html.includes('ARDS Secure Login'));

// Exercise chatbot intent generation against the real ARDS data + engine.
try {
  global.window = global;
  global.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] || null; },
    setItem(key, value) { this._store[key] = String(value); }
  };
  global.document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; }
  };
  global.window.lucide = null;

  eval(fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8'));
  eval(fs.readFileSync(path.join(root, 'js', 'engine.js'), 'utf8'));
  eval(js);

  const scoreReply = window.ardsChatbot.generateReply('What is the rehab score?');
  const recommendationReply = window.ardsChatbot.generateReply('Clinical recommendation');
  const patientReply = window.ardsChatbot.generateReply('Tell me about this patient');
  const navigationReply = window.ardsChatbot.generateReply('Open decision log');

  check('score intent returns the active-session score',
    scoreReply.text.includes('74.4/100') && scoreReply.text.includes('Improving'));
  check('recommendation intent returns an engine recommendation',
    recommendationReply.text.includes('Clinical recommendation') && recommendationReply.text.includes('RULE_OPT_05'));
  check('patient intent returns active patient context',
    patientReply.text.includes('Alex Mercer') && patientReply.text.includes('P001'));
  check('navigation intent targets decision tab', navigationReply.navigate === 'decision');
} catch (e) {
  console.error(e);
  check('live chatbot intent validation', false);
}


console.log('');
if (failures) {
  console.log(failures + ' CHATBOT CHECK(S) FAILED');
  process.exit(1);
}
console.log('ALL CHATBOT CHECKS PASSED');
