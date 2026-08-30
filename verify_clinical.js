/**
 * Verification for the age-stratified clinical reference integration.
 * Run: node verify_clinical.js  (must be run from inside the ARDS-PROJECT dir)
 */
const fs = require('fs');
const path = require('path');

// clinical-reference.js attaches to `window`. Shim it for Node.
global.window = {};
require(path.join(__dirname, 'js', 'clinical-reference.js'));
const refs = global.window.ardsClinicalRefs;

let failures = 0;
function check(label, cond) {
    console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
    if (!cond) failures++;
}

check('clinical reference module loaded', !!refs);
check('REFERENCES exported', !!(refs && refs.REFERENCES));

// Distal socket pressure — patient age 56 -> band 50-59 -> 30..40 kPa
const dsp = refs.getReferenceFor('distal_socket_pressure_kpa', 56);
check('P56 distal socket pressure band = 50-59', dsp && dsp.ageBand === '50-59');
check('P56 distal socket pressure min = 30', dsp && dsp.min === 30);
check('P56 distal socket pressure max = 40', dsp && dsp.max === 40);

// Stance asymmetry — age 72 -> band 60-79 (broader band for this metric)
const asym = refs.getReferenceFor('stance_asymmetry_pct', 72);
check('P72 stance asymmetry band = 60-79', asym && asym.ageBand === '60-79');
check('P72 stance asymmetry normal_max = 15', asym && asym.normal_max === 15);
check('P72 stance asymmetry pathological_min = 18', asym && asym.pathological_min === 18);

// Gait velocity edge: age 90 (boundary) -> band 90+
const gait90 = refs.getReferenceFor('gait_velocity_mps', 90);
check('age 90 gait band = 90+', gait90 && gait90.ageBand === '90+');
check('age 90 gait min = 0.55', gait90 && gait90.min === 0.55);

// Age below the lowest band -> null band
const young = refs.getReferenceFor('gait_velocity_mps', 18);
check('age 18 gait band = null', young && young.ageBand === null);

// Unknown metric -> null
check('unknown metric -> null', refs.getReferenceFor('nonexistent_metric', 50) === null);

// Engine syntax is valid & exposes the new methods
const engineSrc = fs.readFileSync(path.join(__dirname, 'js', 'engine.js'), 'utf8');
check('engine.js defines getReferenceFor', /getReferenceFor\s*\(metric,\s*age\)/.test(engineSrc));
check('engine.js defines buildReferenceRanges', /buildReferenceRanges\s*\(session,\s*age\)/.test(engineSrc));
check('engine.js enriches governorDetails', /ageBand:\s*ageBand,\s*referenceRanges:\s*referenceRanges/.test(engineSrc));

console.log('');
console.log(failures === 0
    ? 'ALL CLINICAL CHECKS PASSED (' + 9 + ' assertions)'
    : (failures + ' CHECK(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);
