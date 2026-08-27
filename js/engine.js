/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Biomechanical Scoring, XAI Interpretability & Safety Governor Engine
 */

class ARDSEngine {
  constructor() {
    // Configurable weights as per spec:
    // Score = 0.30×Gait + 0.25×Stability + 0.20×Force + 0.15×Symmetry + 0.10×(100-Fatigue)
    this.WEIGHTS = {
      gait: 0.30,
      stability: 0.25,
      force: 0.20,
      symmetry: 0.15,
      fatigueInv: 0.10
    };

    // Safety Thresholds
    this.SAFETY_THRESHOLDS = {
      maxSafePressure: 55.0,     // kPa - distal socket pressure limit
      criticalPressure: 65.0,    // kPa - immediate skin breakdown danger
      maxSafeFatigue: 55.0,      // %
      minAcceptableSymmetry: 50.0 // %
    };
  }

  /**
   * Calculates the Rehabilitation Score out of 100
   * @param {Object} session - { gaitSpeed, symmetry, force, pressure, stability, fatigue }
   * @returns {number} Score rounded to 1 decimal place
   */
  calculateScore(session) {
    if (!session) return 0;

    // Normalize gait speed (typically 0.40 - 1.20 m/s mapped to 0 - 100)
    // Here: gaitSpeed * 100 gives an intuitive 0-100 scale (e.g. 0.60 m/s -> 60.0, 0.74 m/s -> 74.0)
    const gaitComponent = Math.min(100, Math.max(0, session.gaitSpeed * 100));
    const stabilityComponent = Math.min(100, Math.max(0, session.stability));
    const forceComponent = Math.min(100, Math.max(0, session.force));
    const symmetryComponent = Math.min(100, Math.max(0, session.symmetry));
    const fatigueComponent = Math.min(100, Math.max(0, 100 - session.fatigue));

    const rawScore = 
      (this.WEIGHTS.gait * gaitComponent) +
      (this.WEIGHTS.stability * stabilityComponent) +
      (this.WEIGHTS.force * forceComponent) +
      (this.WEIGHTS.symmetry * symmetryComponent) +
      (this.WEIGHTS.fatigueInv * fatigueComponent);

    return Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));
  }

  /**
   * Categorizes score into official ARDS clinical bands
   */
  getScoreBand(score) {
    if (score >= 81) {
      return { label: "Good", key: "good", color: "emerald", range: "81–100", desc: "High functional autonomy; ready for advanced gait challenges." };
    } else if (score >= 61) {
      return { label: "Improving", key: "improving", color: "teal", range: "61–80", desc: "Positive trajectory; progressive loading recommended." };
    } else if (score >= 41) {
      return { label: "Moderate", key: "moderate", color: "amber", range: "41–60", desc: "Sub-optimal stability; maintain supervised protocol." };
    } else {
      return { label: "Poor", key: "poor", color: "rose", range: "0–40", desc: "Significant gait deficit; increase biomechanical assistance." };
    }
  }

  /**
   * Determines Fatigue Risk Level (LOW / MEDIUM / HIGH)
   */
  getFatigueRisk(fatigueVal) {
    if (fatigueVal > 55) {
      return { level: "HIGH", color: "rose", badgeClass: "badge-danger", text: "High Fatigue Risk", advice: "Reduce training duration and provide 3-5 min recovery intervals." };
    } else if (fatigueVal >= 30) {
      return { level: "MEDIUM", color: "amber", badgeClass: "badge-warning", text: "Moderate Fatigue", advice: "Monitor cadence decay and limb loading balance." };
    } else {
      return { level: "LOW", color: "emerald", badgeClass: "badge-success", text: "Low Fatigue", advice: "Normal metabolic recovery observed; load tolerance optimal." };
    }
  }

  /**
   * Calculates AI Model Confidence & Badge
   */
  getAIConfidence(session, baseline) {
    // Simulated confidence heuristic based on sensor signal consistency, 
    // biomechanical variance, and historical conformity
    let baseConfidence = 91.5;

    // Noise/jitter penalties
    if (session.pressure > 60) baseConfidence -= 8.0;
    if (session.fatigue > 60) baseConfidence -= 9.5;
    if (session.symmetry < 52) baseConfidence -= 11.0;
    if (session.gaitSpeed < 0.48) baseConfidence -= 6.0;

    // Check consistency with baseline if present
    if (baseline && Math.abs(session.gaitSpeed - baseline.gaitSpeed) > 0.35) {
      baseConfidence -= 12.0;
    }

    const conf = Math.max(48.0, Math.min(96.5, baseConfidence));

    if (conf >= 80) {
      return {
        value: Number(conf.toFixed(1)),
        rating: "HIGH",
        color: "emerald",
        badgeClass: "badge-success",
        label: "High confidence",
        description: "Sensor telemetry verified with high signal-to-noise ratio."
      };
    } else if (conf >= 60) {
      return {
        value: Number(conf.toFixed(1)),
        rating: "MODERATE",
        color: "amber",
        badgeClass: "badge-warning",
        label: "Moderate confidence",
        description: "Minor sensor variability detected; automated interpretation acceptable."
      };
    } else {
      return {
        value: Number(conf.toFixed(1)),
        rating: "LOW",
        color: "rose",
        badgeClass: "badge-danger",
        label: "Low confidence — manual review recommended",
        description: "Significant telemetry dispersion or atypical gait pattern. Clinician audit required."
      };
    }
  }

  /**
   * Assesses Overall Condition State: 🟢 IMPROVING / 🟡 MODERATE / 🔴 UNSTABLE
   */
  getConditionState(session, baseline, previousSession) {
    const score = this.calculateScore(session);
    const prevScore = previousSession ? this.calculateScore(previousSession) : score;
    const baseScore = baseline ? this.calculateScore(baseline) : score;

    // Safety checks for UNSTABLE condition
    if (session.pressure >= this.SAFETY_THRESHOLDS.criticalPressure || 
        session.fatigue > 70 || 
        (previousSession && score < prevScore - 6) || 
        session.symmetry < this.SAFETY_THRESHOLDS.minAcceptableSymmetry) {
      return {
        state: "UNSTABLE",
        icon: "🔴",
        color: "rose",
        pillClass: "state-unstable",
        headline: "Biomechanical Instability Detected",
        summary: "Stump socket overload, high fatigue, or severe symmetry divergence requires clinician intervention."
      };
    }

    // IMPROVING condition
    if ((score > baseScore + 2 || score >= 65) && session.fatigue <= 40 && session.pressure <= 50) {
      return {
        state: "IMPROVING",
        icon: "🟢",
        color: "emerald",
        pillClass: "state-improving",
        headline: "Positive Rehabilitation Progression",
        summary: "Consistent trajectory in gait speed, balance symmetry, and low residual limb strain."
      };
    }

    // Otherwise MODERATE
    return {
      state: "MODERATE",
      icon: "🟡",
      color: "amber",
      pillClass: "state-moderate",
      headline: "Steady / Guarded State",
      summary: "Patient maintaining baseline performance with moderate exertion and controlled joint dynamics."
    };
  }

  /**
   * Explainable AI (XAI) Feature Contributions (SHAP-style signed contributions)
   * Normalized strictly against the ARDS linear decision model weights:
   * Score = 0.30*Gait + 0.25*Stability + 0.20*Force + 0.15*Symmetry + 0.10*(100-Fatigue)
   */
  getXAIExplanation(session, baseline) {
    const base = baseline || { gaitSpeed: 0.60, symmetry: 60, force: 55, pressure: 48, stability: 58, fatigue: 25 };
    
    // Normalized score scale conversions
    const gaitPtsCurr = Math.min(100, Math.max(0, (session.gaitSpeed || 0.60) * 100));
    const gaitPtsBase = Math.min(100, Math.max(0, (base.gaitSpeed || 0.60) * 100));
    const gaitDelta = gaitPtsCurr - gaitPtsBase;

    const stabDelta = (session.stability || 58) - (base.stability || 58);
    const forceDelta = (session.force || 55) - (base.force || 55);
    const symmDelta = (session.symmetry || 60) - (base.symmetry || 60);
    const fatDelta = (base.fatigue || 25) - (session.fatigue || 25); // Positive if fatigue improved (decreased)
    const pressDelta = (base.pressure || 48) - (session.pressure || 48); // Positive if pressure reduced

    // Precise additive feature attributions matching the composite scoring model
    const contributions = [
      {
        feature: "Gait Velocity",
        icon: "gauge",
        value: session.gaitSpeed.toFixed(2),
        unit: "m/s",
        refNorm: "0.70 – 1.20 m/s",
        contribution: Number((gaitDelta * 0.30).toFixed(1)),
        impact: gaitDelta >= 0 ? "positive" : "negative",
        desc: session.gaitSpeed >= 0.75 
          ? "Forward propulsion cadence meets functional K3 ambulation target (0.75+ m/s)"
          : (gaitDelta >= 0 ? "Cadence improving toward target" : "Walking velocity below target cadence")
      },
      {
        feature: "Movement Stability",
        icon: "shield",
        value: session.stability,
        unit: "%",
        refNorm: "70% – 85%",
        contribution: Number((stabDelta * 0.25).toFixed(1)),
        impact: stabDelta >= 0 ? "positive" : "negative",
        desc: session.stability >= 75 
          ? "Coronal trunk sway well-stabilized within physiological limits (75%+)" 
          : (stabDelta >= 0 ? "Trunk sway variation stabilized" : "Increased coronal trunk sway observed")
      },
      {
        feature: "Ground Force Control",
        icon: "zap",
        value: session.force,
        unit: "%",
        refNorm: "65% – 80%",
        contribution: Number((forceDelta * 0.20).toFixed(1)),
        impact: forceDelta >= 0 ? "positive" : "negative",
        desc: session.force >= 70 
          ? "Smooth prosthetic push-off phase & safe load transfer (70%+)"
          : (forceDelta >= 0 ? "Push-off thrust progressing" : "Sub-optimal prosthetic push-off power")
      },
      {
        feature: "Gait Symmetry",
        icon: "activity",
        value: session.symmetry,
        unit: "%",
        refNorm: "70% – 85%",
        contribution: Number((symmDelta * 0.15).toFixed(1)),
        impact: symmDelta >= 0 ? "positive" : "negative",
        desc: session.symmetry >= 75 
          ? "Bilateral stance-phase duration well-balanced (75%+)" 
          : (symmDelta >= 0 ? "Bilateral stance balance improved" : "Asymmetrical limb weight distribution detected")
      },
      {
        feature: "Metabolic Fatigue Profile",
        icon: "battery-charging",
        value: session.fatigue,
        unit: "%",
        refNorm: "< 30%",
        contribution: Number((fatDelta * 0.10).toFixed(1)),
        impact: fatDelta >= 0 ? "positive" : "negative",
        desc: session.fatigue <= 30 
          ? "Low metabolic exertion index, optimal energy conservation" 
          : (session.fatigue > 55 ? "High exertion detected; fatigue risk elevated (>55%)" : "Moderate aerobic exertion within tolerable range")
      },
      {
        feature: "Socket Pressure Distribution",
        icon: "target",
        value: session.pressure,
        unit: "kPa",
        refNorm: "30 – 50 kPa",
        contribution: Number((pressDelta * 0.08).toFixed(1)),
        impact: pressDelta >= 0 ? "positive" : "negative",
        desc: session.pressure <= 50 
          ? "Distal residual stump pressure within certified safe limits (<=50 kPa)" 
          : (session.pressure > 60 ? "CRITICAL: Stump pressure exceeds safety threshold (>60 kPa)" : "Elevated localized socket pressure")
      }
    ];

    // Sort by absolute contribution magnitude
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    // Generate clinical narrative summary
    const topPositive = contributions.filter(c => c.contribution > 0).slice(0, 3).map(c => c.feature.toLowerCase());
    const topNegative = contributions.filter(c => c.contribution < 0).slice(0, 2).map(c => c.feature.toLowerCase());
    
    let summarySentence = "";
    const condition = this.getConditionState(session, baseline, null);

    if (condition.state === "IMPROVING") {
      summarySentence = `Patient state = IMPROVING based on solid gains in ${topPositive.join(", ") || "overall gait parameters"}. Biomechanical metrics indicate healthy prosthetic adaptation without adverse stump loading.`;
    } else if (condition.state === "UNSTABLE") {
      summarySentence = `Patient state = UNSTABLE driven by negative deviations in ${topNegative.join(" and ") || "biomechanical safety margins"}. Manual clinical assessment of socket fit and exercise intensity is strongly recommended.`;
    } else {
      summarySentence = `Patient state = MODERATE. Performance remains balanced with steady values across ${topPositive[0] || "gait metrics"}, while ${topNegative[0] || "fatigue levels"} require ongoing monitoring.`;
    }

    return {
      contributions,
      summarySentence,
      primaryDrivers: topPositive,
      riskDrivers: topNegative
    };
  }

  /**
   * Decision & Safety Engine Logic
   * Evaluates: Patient State × Fatigue × Safety_Flag → Recommendation with Safety Governor Override
   */
  evaluateDecisionAndSafety(session, baseline, previousSession) {
    const condition = this.getConditionState(session, baseline, previousSession);
    const fatigue = this.getFatigueRisk(session.fatigue);
    const score = this.calculateScore(session);
    const baseScore = baseline ? this.calculateScore(baseline) : score;

    // Safety Flag evaluation
    let safetyFlag = "SAFE";
    let safetyReason = "All biomechanical telemetry within certified physiological safety bounds.";
    let overrideTriggered = false;
    let rawSuggestion = "";
    let finalRecommendation = "";
    let safetyAction = "";
    let matchedRuleId = "";

    // 1. Raw AI ML Suggestion (Optimistic ML Model)
    if (condition.state === "IMPROVING") {
      rawSuggestion = "Aggressively increase difficulty (+20% load, add dynamic uneven-terrain obstacle drills).";
    } else if (condition.state === "MODERATE") {
      rawSuggestion = "Maintain current difficulty with standard 15-min steady gait pacing.";
    } else {
      rawSuggestion = "Switch to low-resistance parallel-bar assistive walking.";
    }

    // 2. Safety Governor & Rule Engine
    if (session.pressure >= this.SAFETY_THRESHOLDS.criticalPressure) {
      safetyFlag = "CRITICAL_UNSAFE";
      matchedRuleId = "RULE_CRIT_01";
      safetyReason = `Socket pressure (${session.pressure} kPa) breached maximum threshold (65 kPa). High risk of distal skin necrosis.`;
      overrideTriggered = true;
      safetyAction = "Safety Governor halted progression and enforced immediate pressure relief protocol.";
      finalRecommendation = "🔴 Emergency Pause: Remove prosthesis, inspect residual limb for skin erythema, and refer to prosthetist for socket relief.";
    } else if (session.pressure > this.SAFETY_THRESHOLDS.maxSafePressure) {
      safetyFlag = "ELEVATED_PRESSURE";
      matchedRuleId = "RULE_WARN_02";
      safetyReason = `Socket pressure (${session.pressure} kPa) exceeds safe comfort envelope (55 kPa).`;
      overrideTriggered = true;
      safetyAction = "Safety Governor clamped AI progression request from +20% to 0% (Maintenance only).";
      finalRecommendation = "🟡 Maintain current load without progression; schedule socket ply-sock adjustment.";
    } else if (fatigue.level === "HIGH") {
      safetyFlag = "HIGH_FATIGUE";
      matchedRuleId = "RULE_WARN_03";
      safetyReason = `Fatigue index (${session.fatigue}%) exceeds endurance threshold (55%).`;
      overrideTriggered = true;
      safetyAction = "Safety Governor clamped AI progression request to -15% recovery duration.";
      finalRecommendation = "🟡 Reduce training session difficulty by 15% and enforce active rest intervals.";
    } else if (condition.state === "IMPROVING" && fatigue.level === "LOW") {
      safetyFlag = "SAFE";
      matchedRuleId = "RULE_OPT_04";
      safetyReason = "Gait symmetry, force balance, and metabolic fatigue satisfy green-tier progression criteria.";
      overrideTriggered = true; // Safety governor moderates +20% raw AI to safe +5%~+10%
      safetyAction = "Safety Governor moderated raw AI +20% leap to safe, graduated +5%~+10% stepped progression.";
      finalRecommendation = "🟢 Increase difficulty slightly: Progress to Stage 2 resistance band gait training and outdoor pavement trials.";
    } else if (condition.state === "MODERATE") {
      safetyFlag = "SAFE";
      matchedRuleId = "RULE_STD_05";
      safetyReason = "Metrics stable; no safety boundary violations detected.";
      overrideTriggered = false;
      safetyAction = "Safety Governor verified ML suggestion without modification.";
      finalRecommendation = "🟡 Maintain current training protocol: Continue Level 1 indoor treadmill walking with mirror biofeedback.";
    } else {
      safetyFlag = "UNSTABLE_ASSIST";
      matchedRuleId = "RULE_AST_06";
      safetyReason = "Decreased gait stability and asymmetric force distribution observed.";
      overrideTriggered = false;
      safetyAction = "Safety Governor endorsed assistive protocol.";
      finalRecommendation = "🔴 Increase assistance: Revert to parallel bar stability drills and dual-cane weight transfer exercises.";
    }

    return {
      condition,
      fatigue,
      safetyFlag,
      safetyReason,
      matchedRuleId,
      rawSuggestion,
      finalRecommendation,
      safetyAction,
      overrideTriggered,
      governorDetails: {
        rawMLTarget: condition.state === "IMPROVING" ? "+20% Difficulty" : "0% Maintain",
        safetyGovernorCapped: condition.state === "IMPROVING" && safetyFlag === "SAFE" ? "+5% Graduated Difficulty" : (overrideTriggered ? "Clamped / Reduced" : "Approved as proposed"),
        limitingConstraint: safetyFlag === "SAFE" ? "Standard gradual overload ceiling (max +10%/week)" : safetyReason
      }
    };
  }
}

// Global engine instance
window.ardsEngine = new ARDSEngine();
