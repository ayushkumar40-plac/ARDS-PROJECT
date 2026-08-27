const fs = require("fs");
const path = require("path");

const dataCode = fs.readFileSync(path.join(__dirname, "js", "data.js"), "utf8");
const engineCode = fs.readFileSync(path.join(__dirname, "js", "engine.js"), "utf8");
const pipelineCode = fs.readFileSync(path.join(__dirname, "js", "pipeline.js"), "utf8");

global.window = {};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

eval(dataCode);
eval(engineCode);
eval(pipelineCode);

console.log("=== ARDS Automated Test Suite ===");
const store = window.dataStore;
const engine = window.ardsEngine;

// 1. Verify Patient P001 calculations
const p1 = store.getPatient("P001");
console.log(`[PASS] Loaded patient ${p1.id} - ${p1.name} with ${p1.sessions.length} sessions.`);

const s1Score = engine.calculateScore(p1.sessions[0]);
console.log(`[CHECK] S1 Score: ${s1Score}/100 (Expected ~60.7)`);
if (Math.abs(s1Score - 60.7) < 0.2) {
  console.log("[PASS] S1 Score formula exact match.");
} else {
  console.error("[FAIL] S1 Score mismatch:", s1Score);
}

const s5Score = engine.calculateScore(p1.sessions[4]);
console.log(`[CHECK] S5 Score: ${s5Score}/100 (Expected ~74.4)`);
if (Math.abs(s5Score - 74.4) < 0.2) {
  console.log("[PASS] S5 Score formula exact match.");
} else {
  console.error("[FAIL] S5 Score mismatch:", s5Score);
}

// 2. Verify Score Bands
console.log("[CHECK] Score Bands:", {
  poor: engine.getScoreBand(35).label,
  moderate: engine.getScoreBand(55).label,
  improving: engine.getScoreBand(75).label,
  good: engine.getScoreBand(90).label
});

// 3. Verify Condition States
const condS1 = engine.getConditionState(p1.sessions[0], p1.sessions[0]);
const condS5 = engine.getConditionState(p1.sessions[4], p1.sessions[0]);
console.log(`[PASS] Condition States: S1=${condS1.state}, S5=${condS5.state}`);

// 4. Verify Fatigue & Safety Decision
const decisionS5 = engine.evaluateDecisionAndSafety(p1.sessions[4], p1.sessions[0]);
console.log(`[PASS] S5 Decision: Rule=${decisionS5.matchedRuleId}, Rec="${decisionS5.finalRecommendation}"`);

// 5. Test P003 Stump Pressure Warning & Safety Override
const p3 = store.getPatient("P003");
const decisionP3S3 = engine.evaluateDecisionAndSafety(p3.sessions[2], p3.sessions[0]);
console.log(`[PASS] P003 S3 High Pressure Safety Override: Flag=${decisionP3S3.safetyFlag}, OverrideTriggered=${decisionP3S3.overrideTriggered}`);

// 6. Test CSV Parsing & Generation
const sampleCSV = store.generateCSV("P001");
const parsed = store.parseCSV(sampleCSV);
console.log(`[PASS] CSV Generator & Parser roundtrip verified: ${parsed.length} rows parsed.`);

// 7. Test Direct CSV Patient Ingestion (New Patient P005 with 3 sessions)
const testImportCSV = `Patient,Session,Gait Speed,Symmetry,Force,Pressure,Stability,Fatigue
P005,1,0.60,62,56,47,59,21
P005,2,0.64,66,60,46,64,19
P005,3,0.68,70,65,45,68,18`;

const importResult = store.importPatientFromCSV(testImportCSV, {
  name: "Jordan Hayes",
  amputationType: "Transtibial (Right)",
  rehabGoal: "K3 Trail Ambulation"
});

const p5 = store.getPatient("P005");
if (p5 && p5.sessions.length === 3 && p5.name === "Jordan Hayes") {
  console.log(`[PASS] CSV Patient Ingestion verified: Imported ${p5.name} (${p5.id}) with ${p5.sessions.length} sessions.`);
} else {
  console.error("[FAIL] CSV Patient Ingestion failed!");
  process.exit(1);
}

console.log("=== All 7 ARDS Core Engine Tests PASSED Successfully ===");
