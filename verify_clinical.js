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
let passed = 0;
function check(label, cond) {
    console.log((cond ? 'PASS' : 'FAIL') + ' - ' + label);
    if (!cond) failures++;
    else passed++;
}

check('clinical reference module loaded', !!refs);
check('REFERENCES exported', !!(refs && refs.REFERENCES));
check('evaluateSessionTelemetry exported', typeof refs.evaluateSessionTelemetry === 'function');

// 1. Gait Velocity (m/s)
const g42 = refs.getReferenceFor('gait_velocity_mps', 42);
check('P42 gait velocity band = 40-49', g42 && g42.ageBand === '40-49');
check('P42 gait velocity range = 1.39-1.43 m/s', g42 && g42.min === 1.39 && g42.max === 1.43);

const g25 = refs.getReferenceFor('gait_velocity_mps', 25);
check('P25 gait velocity band = 20-29 (1.36-1.39)', g25 && g25.min === 1.36 && g25.max === 1.39);

const gait90 = refs.getReferenceFor('gait_velocity_mps', 90);
check('age 90 gait band = 90+ (0.55-0.65)', gait90 && gait90.ageBand === '90+' && gait90.min === 0.55 && gait90.max === 0.65);

// 2. Stance Symmetry / Asymmetry (%)
const asym42 = refs.getReferenceFor('stance_asymmetry_pct', 42);
check('P42 stance asymmetry normal < 10, pathological > 15', asym42 && asym42.normal_max === 10 && asym42.pathological_min === 15);

const asym72 = refs.getReferenceFor('stance_asymmetry_pct', 72);
check('P72 stance asymmetry band = 60-79', asym72 && asym72.ageBand === '60-79');
check('P72 stance asymmetry normal_max = 15', asym72 && asym72.normal_max === 15);
check('P72 stance asymmetry pathological_min = 18', asym72 && asym72.pathological_min === 18);

// 3. Movement Stability (Step Width Dev)
const stab42 = refs.getReferenceFor('step_width_variability_cm', 42);
check('P42 step width normal_max = 1.50 cm', stab42 && stab42.normal_max === 1.50);

const stab65 = refs.getReferenceFor('step_width_variability_cm', 65);
check('P65 step width range = 1.50-2.50 cm', stab65 && stab65.normal_min === 1.50 && stab65.normal_max === 2.50);

// 4. Force Control (Target Accuracy Error %)
const f42 = refs.getReferenceFor('force_control_error_pct', 42);
check('P42 force control error target = 3-5%', f42 && f42.min === 3.0 && f42.max === 5.0);

const f75 = refs.getReferenceFor('force_control_error_pct', 75);
check('P75 force control error target = 5-10%', f75 && f75.min === 5.0 && f75.max === 10.0);

// 5. Fatigue (Prosthetic Cyclic Durability)
const fat42 = refs.getReferenceFor('fatigue_durability_mpa', 42);
check('P42 fatigue durability = 45-55 MPa Active baseline', fat42 && fat42.min === 45 && fat42.max === 55);

const fat25 = refs.getReferenceFor('fatigue_durability_mpa', 25);
check('P25 fatigue durability = 55-60 MPa Carbon matrix', fat25 && fat25.min === 55 && fat25.max === 60);

// 6. General Interface Pressure (Max Weight-Bearing Walls)
const ip42 = refs.getReferenceFor('interface_pressure_kpa', 42);
check('P42 interface pressure = 160-190 kPa', ip42 && ip42.min === 160 && ip42.max === 190);

const ip85 = refs.getReferenceFor('interface_pressure_kpa', 85);
check('P85 interface pressure = 90-120 kPa Fragile tissue', ip85 && ip85.min === 90 && ip85.max === 120);

// 7. Distal Socket Pressure (Bony Prominence Discomfort Threshold)
const dsp56 = refs.getReferenceFor('distal_socket_pressure_kpa', 56);
check('P56 distal socket pressure band = 50-59', dsp56 && dsp56.ageBand === '50-59');
check('P56 distal socket pressure min = 30', dsp56 && dsp56.min === 30);
check('P56 distal socket pressure max = 40', dsp56 && dsp56.max === 40);

// Age below the lowest band -> null band
const young = refs.getReferenceFor('gait_velocity_mps', 18);
check('age 18 gait band = null', young && young.ageBand === null);

// Unknown metric -> null
check('unknown metric -> null', refs.getReferenceFor('nonexistent_metric', 50) === null);

// Test evaluateSessionTelemetry for P001 Alex Mercer (Age 42, S5)
const mockPatientP1 = {
    id: "P001",
    name: "Alex Mercer",
    age: 42,
    amputationType: "Transtibial (Right)",
    prosthesis: "Ottobock Genium / ProCarve Carbon Foot",
    clinician: "Dr. Rachel Thorne, PT, DPT",
    rehabGoal: "Independent community ambulation (K3 level)"
};
const mockSessionP1S5 = {
    session: 5,
    date: "2026-07-30",
    gaitSpeed: 0.74,
    symmetry: 76,
    force: 70,
    pressure: 44,
    stability: 74,
    fatigue: 17
};

const evalP1 = refs.evaluateSessionTelemetry(mockPatientP1, mockSessionP1S5);
check('evalP1 generated successfully', !!evalP1 && !evalP1.error);
check('evalP1 resolves ageBand 40-49', evalP1.ageBand === '40-49');
check('evalP1 evaluates 7 parameters', evalP1.parameters && evalP1.parameters.length === 7);
check('evalP1 includes formattedMarkdown', evalP1.formattedMarkdown && evalP1.formattedMarkdown.includes('### Parameter Evaluation Table'));
check('evalP1 includes actionableRecommendations', evalP1.actionableRecommendations && evalP1.actionableRecommendations.length > 0);

// Test evaluateSessionTelemetry for P002 Elena Rostova (Age 56, S5 - High Pressure / Fatigue)
const mockPatientP2 = {
    id: "P002",
    name: "Elena Rostova",
    age: 56,
    amputationType: "Transfemoral (Left)",
    prosthesis: "C-Leg 4 Microprocessor Knee / Triton Harmony",
    clinician: "Dr. Samuel Vance, CPO",
    rehabGoal: "Stair descent and progressive cadence endurance"
};
const mockSessionP2S5 = {
    session: 5,
    date: "2026-08-02",
    gaitSpeed: 0.54,
    symmetry: 54,
    force: 48,
    pressure: 58,
    stability: 47,
    fatigue: 72
};
const evalP2 = refs.evaluateSessionTelemetry(mockPatientP2, mockSessionP2S5);
check('evalP2 flags tissue ulcer risk as HIGH', evalP2.safetyAndRiskAssessment.tissueUlcerRisk === 'HIGH');
check('evalP2 flags fall instability risk as HIGH', evalP2.safetyAndRiskAssessment.fallInstabilityRisk === 'HIGH');
check('evalP2 generates critical tissue alert for 58 kPa vs 40 kPa limit', evalP2.criticalAlerts.some(a => a.includes('CRITICAL TISSUE ALERT') || a.includes('58 kPa')));

// Engine syntax is valid & exposes the methods
const engineSrc = fs.readFileSync(path.join(__dirname, 'js', 'engine.js'), 'utf8');
check('engine.js defines getReferenceFor', /getReferenceFor\s*\(metric,\s*age\)/.test(engineSrc));
check('engine.js defines buildReferenceRanges', /buildReferenceRanges\s*\(session,\s*age\)/.test(engineSrc));
check('engine.js enriches governorDetails', /ageBand:\s*ageBand,\s*referenceRanges:\s*referenceRanges/.test(engineSrc));

console.log('');
console.log(failures === 0
    ? 'ALL CLINICAL CHECKS PASSED (' + passed + ' assertions)'
    : (failures + ' CHECK(S) FAILED'));
process.exit(failures === 0 ? 0 : 1);

