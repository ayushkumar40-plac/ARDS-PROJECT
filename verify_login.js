/**
 * Quick verification script for the ARDS login interface integration.
 * Run: node verify_login.js
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
let failures = 0;

function check(label, condition) {
    console.log((condition ? 'PASS' : 'FAIL') + ' - ' + label);
    if (!condition) failures++;
}

// 1. auth.js syntax check via node --check equivalent (parse with Function is unsafe for IIFE; use child spawn)
const { execSync } = require('child_process');
try {
    execSync('node --check js/auth.js', { cwd: root, stdio: 'pipe' });
    check('js/auth.js passes Node syntax check', true);
} catch (e) {
    check('js/auth.js passes Node syntax check', false);
    console.error(e.stderr ? e.stderr.toString() : e.message);
}

// 2. HTML integration checks
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
check('login screen container present', html.includes('id="loginScreen"'));
check('sign-in form present', html.includes('id="loginFormSignin"'));
check('register form present', html.includes('id="loginFormRegister"'));
check('demo fill button present', html.includes('id="btnFillDemo"'));
check('password toggle present', html.includes('id="toggleLoginPassword"'));
check('header user chip present', html.includes('id="userChip"'));
check('logout button present', html.includes('id="btnLogout"'));
check('auth.js script tag present', html.includes('js/auth.js'));
check('auth.js loads before app.js',
    html.indexOf('js/auth.js') !== -1 &&
    html.indexOf('js/auth.js') < html.lastIndexOf('js/app.js'));
check('custom stylesheet linked', html.includes('css/styles.css'));

// 3. CSS checks
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
check('.login-screen style defined', css.includes('.login-screen'));
check('.login-card style defined', css.includes('.login-card'));
check('body.auth-locked rule defined', css.includes('body.auth-locked'));
check('login print exclusion defined', /@media print[\s\S]*\.login-screen\s*{\s*display:\s*none/.test(css));

// 4. auth.js references all HTML element IDs it needs
const auth = fs.readFileSync(path.join(root, 'js/auth.js'), 'utf8');
const requiredIds = [
    'loginScreen', 'loginCard', 'loginMessage', 'loginTabSignin', 'loginTabRegister',
    'loginFormSignin', 'loginFormRegister', 'userChip', 'userAvatar', 'userName',
    'userRole', 'loginEmail', 'loginPassword', 'loginRemember', 'btnLoginSubmit',
    'registerName', 'registerEmail', 'registerPassword', 'registerConfirm',
    'registerRole', 'btnRegisterSubmit', 'toggleLoginPassword', 'btnFillDemo', 'btnLogout'
];
for (const id of requiredIds) {
    check('auth.js references #' + id, auth.includes("'" + id + "'") && html.includes('id="' + id + '"'));
}

console.log('');
if (failures === 0) {
    console.log('ALL CHECKS PASSED (' + (requiredIds.length + 14) + ' checks)');
    process.exit(0);
} else {
    console.log(failures + ' CHECK(S) FAILED');
    process.exit(1);
}