const fs = require('fs');
let c = fs.readFileSync('boot_test3.js', 'utf8');
c = c.replace(/const scriptOrder = \[[^\]]+\]/,
  "const scriptOrder = ['js/data.js', 'js/clinical-reference.js', 'js/engine.js', 'js/auth.js']");
fs.writeFileSync('boot_test3.js', c);
console.log('patched:', /'js\/app\.js'/.test(c) ? 'APP-STILL-PRESENT' : 'app.js removed OK');
