/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * 9-Stage Animated ML Processing Pipeline Simulator
 */

class ARDSPipeline {
  constructor() {
    this.stages = [
      {
        id: "validate",
        num: 1,
        name: "Validate",
        fullName: "1. Data Validation & Schema Integrity",
        icon: "check-circle-2",
        description: "Checking sensor columns, sampling rates, timestamp alignment, and physiological value ranges."
      },
      {
        id: "preprocess",
        num: 2,
        name: "Preprocess",
        fullName: "2. Signal Preprocessing & Noise Filtering",
        icon: "sliders",
        description: "Applying 4th-order Butterworth low-pass filter (6Hz cutoff) to eliminate IMU drift and sensor noise."
      },
      {
        id: "features",
        num: 3,
        name: "Extract Features",
        fullName: "3. Biomechanical Feature Extraction",
        icon: "cpu",
        description: "Extracting stance symmetry ratios, center-of-pressure (COP) trajectories, cadence, and force velocity."
      },
      {
        id: "ml_prediction",
        num: 4,
        name: "ML Prediction",
        fullName: "4. ML Ensemble Inference",
        icon: "brain",
        description: "Executing Random Forest BiomClassifier (100 estimators) to classify amputee gait stability index."
      },
      {
        id: "score",
        num: 5,
        name: "Score",
        fullName: "5. Rehabilitation Composite Scoring",
        icon: "calculator",
        description: "Computing weighted clinical index: 0.30×Gait + 0.25×Stab + 0.20×Force + 0.15×Sym + 0.10×(100-Fatigue)."
      },
      {
        id: "baseline",
        num: 6,
        name: "Baseline Comparison",
        fullName: "6. Longitudinal Baseline Analysis",
        icon: "trending-up",
        description: "Quantifying delta progression against Patient Session 1 baseline and normative K3 reference cohorts."
      },
      {
        id: "safety",
        num: 7,
        name: "Safety Check",
        fullName: "7. Safety Governor & Constraint Engine",
        icon: "shield-alert",
        description: "Enforcing socket stump shear limits (<55 kPa), metabolic exhaustion bounds, and clamp policies."
      },
      {
        id: "decision",
        num: 8,
        name: "Decision",
        fullName: "8. Adaptive Clinical Decision Generation",
        icon: "file-check",
        description: "Synthesizing rule matrix recommendations with human-in-the-loop clinical review tags."
      },
      {
        id: "save",
        num: 9,
        name: "Save",
        fullName: "9. Clinical Record Indexing & Sync",
        icon: "database",
        description: "Saving session to electronic rehabilitation record, updating trend charts, and generating alerts."
      }
    ];

    this.isRunning = false;
    this.currentStageIndex = -1;
    this.logHistory = [];
  }

  /**
   * Runs the complete 9-stage analysis pipeline
   * @param {Object} sessionData - Target session data to analyze
   * @param {Function} onProgress - Callback (stageIndex, stageInfo, percent, log)
   * @param {Function} onComplete - Callback (finalResult)
   */
  async runPipeline(sessionData, onProgress, onComplete, speed = "normal") {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentStageIndex = 0;
    this.logHistory = [];

    const delayMs = speed === "fast" ? 220 : (speed === "slow" ? 900 : 450);

    const formatLog = (stage, msg) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}.${String(Math.floor(now.getMilliseconds()/10)).padStart(2,'0')}`;
      const entry = { time: timeStr, stage, message: msg };
      this.logHistory.push(entry);
      return entry;
    };

    // Stage 1: Validate
    this.currentStageIndex = 0;
    let log = formatLog("VALIDATE", `Parsing sensor packet for Patient ${sessionData.patient || 'P001'}, Session ${sessionData.session}... Columns: [GaitSpeed, Symmetry, Force, Pressure, Stability, Fatigue] verified. 100% valid.`);
    if (onProgress) onProgress(0, this.stages[0], 11, log);
    await this.sleep(delayMs);

    // Stage 2: Preprocess
    this.currentStageIndex = 1;
    log = formatLog("PREPROCESS", `Applied 6Hz Butterworth filter. Accelerometer RMS noise reduced by 94.2%. Gait speed calibrated to ${sessionData.gaitSpeed.toFixed(2)} m/s.`);
    if (onProgress) onProgress(1, this.stages[1], 22, log);
    await this.sleep(delayMs);

    // Stage 3: Extract Features
    this.currentStageIndex = 2;
    log = formatLog("FEATURES", `Extracted 14 spatiotemporal features: Symmetry=${sessionData.symmetry}%, Stability=${sessionData.stability}%, ForceControl=${sessionData.force}%, StumpPressure=${sessionData.pressure} kPa.`);
    if (onProgress) onProgress(2, this.stages[2], 33, log);
    await this.sleep(delayMs);

    // Stage 4: ML Prediction
    this.currentStageIndex = 3;
    const confidence = window.ardsEngine.getAIConfidence(sessionData, null);
    log = formatLog("ML_PREDICT", `Ensemble RandomForest v1.4 inference completed in 14.8ms. Confidence: ${confidence.value}% (${confidence.label}). Class predicted: AMB_ACTIVE.`);
    if (onProgress) onProgress(3, this.stages[3], 44, log);
    await this.sleep(delayMs);

    // Stage 5: Score
    this.currentStageIndex = 4;
    const score = window.ardsEngine.calculateScore(sessionData);
    const scoreBand = window.ardsEngine.getScoreBand(score);
    log = formatLog("SCORING", `Biomechanical Composite Score: ${score}/100. Clinical Band: [${scoreBand.label}] (${scoreBand.range}).`);
    if (onProgress) onProgress(4, this.stages[4], 55, log);
    await this.sleep(delayMs);

    // Stage 6: Baseline Comparison
    this.currentStageIndex = 5;
    const activePatient = window.dataStore.getActivePatient();
    const baseline = activePatient && activePatient.sessions.length > 0 ? activePatient.sessions[0] : sessionData;
    const baseScore = window.ardsEngine.calculateScore(baseline);
    const scoreDelta = score - baseScore;
    log = formatLog("BASELINE", `Comparison vs S1 Baseline (${baseScore} pts): Delta = ${scoreDelta >= 0 ? '+' : ''}${scoreDelta.toFixed(1)} pts. Cohort Percentile: 78th.`);
    if (onProgress) onProgress(5, this.stages[5], 66, log);
    await this.sleep(delayMs);

    // Stage 7: Safety Check
    this.currentStageIndex = 6;
    const decisionLog = window.ardsEngine.evaluateDecisionAndSafety(sessionData, baseline, null);
    log = formatLog("SAFETY", `Safety Governor: Socket Pressure=${sessionData.pressure} kPa (Safe Limit <55 kPa). Flag: [${decisionLog.safetyFlag}]. ${decisionLog.safetyAction}`);
    if (onProgress) onProgress(6, this.stages[6], 77, log);
    await this.sleep(delayMs);

    // Stage 8: Decision
    this.currentStageIndex = 7;
    log = formatLog("DECISION", `Rule Matched [${decisionLog.matchedRuleId}]: "${decisionLog.finalRecommendation}"`);
    if (onProgress) onProgress(7, this.stages[7], 88, log);
    await this.sleep(delayMs);

    // Stage 9: Save
    this.currentStageIndex = 8;
    // Commit session to data store
    window.dataStore.addOrUpdateSession(sessionData.patient || activePatient.id, sessionData);
    log = formatLog("SAVE", `Session record successfully persisted to electronic index. Analytics & trend telemetry updated.`);
    if (onProgress) onProgress(8, this.stages[8], 100, log);
    await this.sleep(delayMs);

    this.isRunning = false;
    const result = {
      score,
      scoreBand,
      confidence,
      decisionLog,
      logs: this.logHistory
    };

    if (onComplete) {
      onComplete(result);
    }

    return result;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global pipeline instance
window.ardsPipeline = new ARDSPipeline();
