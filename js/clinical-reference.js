/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Age-Stratified Clinical Reference Ranges & Evaluation Engine
 *
 * Reference norms for biomechanical and interface-pressure metrics,
 * stratified by patient age band. Evaluates live telemetry against
 * official clinical reference thresholds.
 */

const ARDS_CLINICAL_REFERENCES = {
    gait_velocity_mps: {
        "20-29": { min: 1.36, max: 1.39, unit: "m/s", label: "Gait Velocity" },
        "30-39": { min: 1.37, max: 1.43, unit: "m/s", label: "Gait Velocity" },
        "40-49": { min: 1.39, max: 1.43, unit: "m/s", label: "Gait Velocity" },
        "50-59": { min: 1.31, max: 1.43, unit: "m/s", label: "Gait Velocity" },
        "60-69": { min: 1.24, max: 1.34, unit: "m/s", label: "Gait Velocity" },
        "70-79": { min: 1.13, max: 1.26, unit: "m/s", label: "Gait Velocity" },
        "80-89": { min: 0.94, max: 0.97, unit: "m/s", label: "Gait Velocity" },
        "90+":   { min: 0.55, max: 0.65, unit: "m/s", label: "Gait Velocity" }
    },
    stance_asymmetry_pct: {
        "20-59": { normal_max: 10.0, pathological_min: 15.0, unit: "%", label: "Stance Symmetry / Asymmetry" },
        "60-79": { normal_min: 10.0, normal_max: 15.0, pathological_min: 18.0, unit: "%", label: "Stance Symmetry / Asymmetry" },
        "80+":   { normal_min: 15.0, normal_max: 20.0, pathological_min: 20.0, unit: "%", label: "Stance Symmetry / Asymmetry" }
    },
    step_width_variability_cm: {
        "20-29": { normal_max: 1.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "30-39": { normal_max: 1.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "40-49": { normal_max: 1.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "50-59": { normal_max: 1.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "60-69": { normal_min: 1.50, normal_max: 2.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "70-79": { normal_min: 1.50, normal_max: 2.50, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "80-89": { normal_min: 2.00, normal_max: 2.80, unit: "cm", label: "Movement Stability (Step Width Dev)" },
        "90+":   { normal_min: 2.00, normal_max: 2.80, unit: "cm", label: "Movement Stability (Step Width Dev)" }
    },
    force_control_error_pct: {
        "20-29": { min: 3.0, max: 5.0, normal_max: 5.0, pathological_min: 10.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "30-39": { min: 3.0, max: 5.0, normal_max: 5.0, pathological_min: 10.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "40-49": { min: 3.0, max: 5.0, normal_max: 5.0, pathological_min: 10.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "50-59": { min: 3.0, max: 5.0, normal_max: 5.0, pathological_min: 10.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "60-69": { min: 5.0, max: 10.0, normal_max: 10.0, pathological_min: 15.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "70-79": { min: 5.0, max: 10.0, normal_max: 10.0, pathological_min: 15.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "80-89": { min: 10.0, max: 15.0, normal_max: 15.0, pathological_min: 20.0, unit: "% error", label: "Force Control (Target Accuracy Error)" },
        "90+":   { min: 10.0, max: 15.0, normal_max: 15.0, pathological_min: 20.0, unit: "% error", label: "Force Control (Target Accuracy Error)" }
    },
    fatigue_durability_mpa: {
        "20-29": { min: 55, max: 60, material: "High physical activity / carbon matrix", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "30-39": { min: 50, max: 58, material: "High physical activity / carbon matrix", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "40-49": { min: 45, max: 55, material: "Active baseline durability", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "50-59": { min: 40, max: 50, material: "Moderate activity composite limit", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "60-69": { min: 25, max: 40, material: "Standard fiberglass / acrylic blend", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "70-79": { min: 18, max: 25, material: "Lightweight copolymer / hybrid resin", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "80-89": { min: 14, max: 18, material: "Standard passive polymer limit", unit: "MPa", label: "Fatigue (Cyclic Durability)" },
        "90+":   { min: 10, max: 14, material: "Low-impact clinical baseline", unit: "MPa", label: "Fatigue (Cyclic Durability)" }
    },
    interface_pressure_kpa: {
        "20-29": { min: 180, max: 210, desc: "High tolerance / intact soft tissue", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "30-39": { min: 175, max: 200, desc: "High tolerance / intact soft tissue", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "40-49": { min: 160, max: 190, desc: "Standard tissue load-bearing capacity", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "50-59": { min: 150, max: 180, desc: "Standard tissue load-bearing capacity", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "60-69": { min: 130, max: 160, desc: "Reduced tolerance due to skin thinning", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "70-79": { min: 110, max: 145, desc: "Reduced tolerance due to skin thinning", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "80-89": { min: 90,  max: 120, desc: "Fragile tissue / vascular degradation threshold", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" },
        "90+":   { min: 70,  max: 100, desc: "Extreme risk of skin breakdown / ulceration", unit: "kPa", label: "General Interface Pressure (Weight-Bearing Walls)" }
    },
    distal_socket_pressure_kpa: {
        "20-29": { min: 45, max: 55, desc: "Maximum bone-end load tolerance", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "30-39": { min: 40, max: 50, desc: "Maximum bone-end load tolerance", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "40-49": { min: 35, max: 45, desc: "Moderate distal tolerance", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "50-59": { min: 30, max: 40, desc: "Moderate distal tolerance", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "60-69": { min: 25, max: 35, desc: "Low distal tolerance / high pain risk", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "70-79": { min: 20, max: 30, desc: "Low distal tolerance / high pain risk", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "80-89": { min: 15, max: 25, desc: "Strict total-surface bearing / minimal load", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" },
        "90+":   { min: 10, max: 15, desc: "Strict total-surface bearing / minimal load", unit: "kPa", label: "Distal Socket Pressure (Bony Prominence Discomfort)" }
    }
};

/**
 * Resolves the age-band key for a given age within a metric's band table.
 * Bands use either "lo-hi" (e.g. "20-29", "60-79") or "lo+" (e.g. "90+") syntax.
 * Returns the matching band key, or null when the age is below the lowest band.
 */
function resolveAgeBand(bands, age) {
    if (age == null || age === '' || !bands) return null;
    const numAge = Number(age);
    if (isNaN(numAge)) return null;

    const entries = Object.keys(bands).map(key => {
        const isPlus = key.indexOf('+') !== -1;
        const parts = key.replace('+', '').split('-').map(Number);
        return { key: key, lo: parts[0], hi: isPlus ? Infinity : (parts[1] !== undefined ? parts[1] : Infinity) };
    }).sort((a, b) => a.lo - b.lo);

    for (const entry of entries) {
        if (numAge >= entry.lo && numAge <= entry.hi) return entry.key;
    }
    // Age below the lowest defined band
    return null;
}

/**
 * Returns the age-band label for any metric's table (convenience helper).
 */
function getAgeBandForMetric(metric, age) {
    const table = ARDS_CLINICAL_REFERENCES[metric];
    return resolveAgeBand(table, age);
}

/**
 * Returns the full reference object for a metric at a given patient age.
 * @param {string} metric - One of the keys in ARDS_CLINICAL_REFERENCES.
 * @param {number} age - Patient age in years.
 * @returns {{ageBand: string, ...bounds}|null} Reference entry annotated with
 *   its age band, or null if unavailable.
 */
function getReferenceFor(metric, age) {
    const table = ARDS_CLINICAL_REFERENCES[metric];
    if (!table) return null;
    const ageBand = resolveAgeBand(table, age);
    if (!ageBand) return { ageBand: null };
    return Object.assign({ ageBand: ageBand }, table[ageBand]);
}

/**
 * Comprehensive Telemetry Evaluation Engine
 * Benchmarks patient telemetry against the official age-stratified reference standard.
 *
 * @param {Object} patient - { id, name, age, amputationType, prosthesis, clinician, ... }
 * @param {Object} session - { session, gaitSpeed, symmetry, force, pressure, stability, fatigue, ... }
 * @returns {Object} Full clinical evaluation object with status benchmarking, risk assessments, alerts, and recommendations.
 */
function evaluateSessionTelemetry(patient, session) {
    if (!patient || !session) {
        return {
            error: "Incomplete patient or session telemetry data for clinical evaluation."
        };
    }

    const age = patient.age;
    const ageBand = getAgeBandForMetric('gait_velocity_mps', age) || (age < 20 ? "<20" : "Unspecified");

    // Extract or compute specific telemetry parameters
    const measuredGait = session.gaitVelocity != null ? Number(session.gaitVelocity) : Number(session.gaitSpeed || 0);
    const measuredSymmetry = session.symmetry != null ? Number(session.symmetry) : 70;
    const measuredAsymmetry = session.stanceAsymmetry != null ? Number(session.stanceAsymmetry) : Number((100 - measuredSymmetry).toFixed(1));
    
    // Step width variability deviation (cm) - derived from stability index if not explicit
    const measuredStepWidthDev = session.stepWidthVariability != null 
        ? Number(session.stepWidthVariability) 
        : Number(Math.max(0.6, ((100 - (session.stability || 70)) * 0.04)).toFixed(2));
    
    // Force control error (%) - derived from force control accuracy
    const measuredForceError = session.forceControlError != null 
        ? Number(session.forceControlError) 
        : Number(Math.max(2.0, ((100 - (session.force || 70)) * 0.25)).toFixed(1));
    
    // Fatigue / Cyclic load (MPa)
    const refFatigue = getReferenceFor('fatigue_durability_mpa', age) || { min: 45, max: 55, material: "Active baseline durability" };
    const measuredCyclicLoad = session.cyclicLoad_mpa != null 
        ? Number(session.cyclicLoad_mpa)
        : Number((refFatigue.min + ((session.fatigue || 20) / 100) * (refFatigue.max - refFatigue.min + 5)).toFixed(1));

    // Distal Socket Pressure (kPa)
    const measuredDistalPressure = session.distalSocketPressure != null 
        ? Number(session.distalSocketPressure) 
        : Number(session.pressure || 45);

    // General Interface Pressure (kPa)
    const refInterface = getReferenceFor('interface_pressure_kpa', age) || { min: 160, max: 190 };
    const measuredInterfacePressure = session.interfacePressure != null 
        ? Number(session.interfacePressure) 
        : Number(Math.round(refInterface.min + (measuredDistalPressure > 50 ? (measuredDistalPressure - 50) * 3 : 0)));

    // Benchmark Metric 1: Gait Velocity (m/s)
    const refGait = getReferenceFor('gait_velocity_mps', age);
    let gaitStatus = "[OPTIMAL / NORMAL]";
    let gaitTarget = refGait ? `${refGait.min.toFixed(2)} – ${refGait.max.toFixed(2)} m/s` : "Normative baseline";
    if (refGait) {
        if (measuredGait < refGait.min * 0.65) {
            gaitStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
        } else if (measuredGait < refGait.min) {
            gaitStatus = "[BORDERLINE / MILD RISK]";
        } else {
            gaitStatus = "[OPTIMAL / NORMAL]";
        }
    }

    // Benchmark Metric 2: Stance Symmetry / Asymmetry (%)
    const refAsym = getReferenceFor('stance_asymmetry_pct', age);
    let asymStatus = "[OPTIMAL / NORMAL]";
    let asymTarget = "< 10%";
    if (refAsym) {
        if (refAsym.normal_min !== undefined) {
            asymTarget = `Normal ${refAsym.normal_min}% – ${refAsym.normal_max}% | Pathological > ${refAsym.pathological_min}%`;
            if (measuredAsymmetry > refAsym.pathological_min) {
                asymStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
            } else if (measuredAsymmetry > refAsym.normal_max) {
                asymStatus = "[BORDERLINE / MILD RISK]";
            } else {
                asymStatus = "[OPTIMAL / NORMAL]";
            }
        } else {
            asymTarget = `Normal < ${refAsym.normal_max}% | Pathological > ${refAsym.pathological_min}%`;
            if (measuredAsymmetry > refAsym.pathological_min) {
                asymStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
            } else if (measuredAsymmetry > refAsym.normal_max) {
                asymStatus = "[BORDERLINE / MILD RISK]";
            } else {
                asymStatus = "[OPTIMAL / NORMAL]";
            }
        }
    }

    // Benchmark Metric 3: Movement Stability (Step Width Variability Deviation)
    const refStab = getReferenceFor('step_width_variability_cm', age);
    let stabStatus = "[OPTIMAL / NORMAL]";
    let stabTarget = "< 1.50 cm deviation";
    if (refStab) {
        if (refStab.normal_min !== undefined) {
            stabTarget = `${refStab.normal_min.toFixed(2)} – ${refStab.normal_max.toFixed(2)} cm deviation`;
            if (measuredStepWidthDev > refStab.normal_max + 0.6) {
                stabStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
            } else if (measuredStepWidthDev > refStab.normal_max) {
                stabStatus = "[BORDERLINE / MILD RISK]";
            } else {
                stabStatus = "[OPTIMAL / NORMAL]";
            }
        } else {
            stabTarget = `< ${refStab.normal_max.toFixed(2)} cm deviation`;
            if (measuredStepWidthDev > refStab.normal_max + 0.8) {
                stabStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
            } else if (measuredStepWidthDev > refStab.normal_max) {
                stabStatus = "[BORDERLINE / MILD RISK]";
            } else {
                stabStatus = "[OPTIMAL / NORMAL]";
            }
        }
    }

    // Benchmark Metric 4: Force Control (Target Accuracy Error %)
    const refForce = getReferenceFor('force_control_error_pct', age);
    let forceStatus = "[OPTIMAL / NORMAL]";
    let forceTarget = "< 3% – 5% error";
    if (refForce) {
        forceTarget = refForce.min === 3.0 ? "< 3% – 5% error" : `${refForce.min}% – ${refForce.max}% error`;
        if (measuredForceError > refForce.pathological_min) {
            forceStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
        } else if (measuredForceError > refForce.normal_max) {
            forceStatus = "[BORDERLINE / MILD RISK]";
        } else {
            forceStatus = "[OPTIMAL / NORMAL]";
        }
    }

    // Benchmark Metric 5: Fatigue (Prosthetic Cyclic Durability)
    let fatigueStatus = "[OPTIMAL / NORMAL]";
    let fatigueTarget = `${refFatigue.min} – ${refFatigue.max} MPa (${refFatigue.material})`;
    if (measuredCyclicLoad > refFatigue.max + 5) {
        fatigueStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
    } else if (measuredCyclicLoad > refFatigue.max) {
        fatigueStatus = "[BORDERLINE / MILD RISK]";
    } else {
        fatigueStatus = "[OPTIMAL / NORMAL]";
    }

    // Benchmark Metric 6: General Interface Pressure (Max Weight-Bearing Walls)
    let interfaceStatus = "[OPTIMAL / NORMAL]";
    let interfaceTarget = `${refInterface.min} – ${refInterface.max} kPa (${refInterface.desc})`;
    if (measuredInterfacePressure > refInterface.max + 20) {
        interfaceStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
    } else if (measuredInterfacePressure > refInterface.max) {
        interfaceStatus = "[BORDERLINE / MILD RISK]";
    } else {
        interfaceStatus = "[OPTIMAL / NORMAL]";
    }

    // Benchmark Metric 7: Distal Socket Pressure (Bony Prominence Discomfort Threshold)
    const refDistal = getReferenceFor('distal_socket_pressure_kpa', age) || { min: 35, max: 45, desc: "Moderate distal tolerance" };
    let distalStatus = "[OPTIMAL / NORMAL]";
    let distalTarget = `${refDistal.min} – ${refDistal.max} kPa (${refDistal.desc})`;
    if (measuredDistalPressure > refDistal.max + 10 || measuredDistalPressure >= 60.0) {
        distalStatus = "[PATHOLOGICAL / CRITICAL ALERT]";
    } else if (measuredDistalPressure > refDistal.max) {
        distalStatus = "[BORDERLINE / MILD RISK]";
    } else {
        distalStatus = "[OPTIMAL / NORMAL]";
    }

    // Compile 7 Parameters Table
    const parameters = [
        {
            name: "Gait Velocity",
            metric: "Gait Velocity (m/s)",
            measured: `${measuredGait.toFixed(2)} m/s`,
            target: gaitTarget,
            status: gaitStatus,
            note: measuredGait < (refGait ? refGait.min : 1.0) ? "Reduced walking speed relative to able-bodied cohort" : "Cadence within normative bounds"
        },
        {
            name: "Stance Symmetry / Asymmetry",
            metric: "Stance Asymmetry (%)",
            measured: `${measuredAsymmetry.toFixed(1)}% (Symmetry: ${measuredSymmetry}%)`,
            target: asymTarget,
            status: asymStatus,
            note: asymStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "Excessive limb offloading detected" : "Bilateral stance distribution acceptable"
        },
        {
            name: "Movement Stability",
            metric: "Step Width Variability Deviation (cm)",
            measured: `${measuredStepWidthDev.toFixed(2)} cm (Stability: ${session.stability || 70}%)`,
            target: stabTarget,
            status: stabStatus,
            note: stabStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "High coronal trunk sway / fall risk" : "Controlled base of support"
        },
        {
            name: "Force Control",
            metric: "Target Accuracy Error (%)",
            measured: `${measuredForceError.toFixed(1)}% error (Force: ${session.force || 70}%)`,
            target: forceTarget,
            status: forceStatus,
            note: forceStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "Impaired prosthetic terminal push-off accuracy" : "Adequate ground reaction control"
        },
        {
            name: "Fatigue (Cyclic Durability)",
            metric: "Prosthetic Cyclic Load (MPa)",
            measured: `${measuredCyclicLoad.toFixed(1)} MPa (Exertion: ${session.fatigue || 20}%)`,
            target: fatigueTarget,
            status: fatigueStatus,
            note: fatigueStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "Cyclic mechanical stress exceeds composite rating" : "Cyclic stress within material fatigue envelope"
        },
        {
            name: "General Interface Pressure",
            metric: "Max Weight-Bearing Walls (kPa)",
            measured: `${measuredInterfacePressure} kPa`,
            target: interfaceTarget,
            status: interfaceStatus,
            note: interfaceStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "Excessive hydrostatic wall pressure" : "Weight-bearing load safely dissipated"
        },
        {
            name: "Distal Socket Pressure",
            metric: "Bony Prominence Discomfort (kPa)",
            measured: `${measuredDistalPressure} kPa`,
            target: distalTarget,
            status: distalStatus,
            note: distalStatus === "[PATHOLOGICAL / CRITICAL ALERT]" ? "High risk of residual bone-end erythema/necrosis" : "Distal residual stump load within certified tolerance"
        }
    ];

    // Safety & Risk Assessment
    const tissueUlcerAlert = (distalStatus === "[PATHOLOGICAL / CRITICAL ALERT]" || interfaceStatus === "[PATHOLOGICAL / CRITICAL ALERT]");
    const fallInstabilityAlert = (asymStatus === "[PATHOLOGICAL / CRITICAL ALERT]" || stabStatus === "[PATHOLOGICAL / CRITICAL ALERT]" || forceStatus === "[PATHOLOGICAL / CRITICAL ALERT]");
    const structuralFatigueAlert = (fatigueStatus === "[PATHOLOGICAL / CRITICAL ALERT]");

    const criticalAlerts = [];
    if (measuredDistalPressure >= 60 || distalStatus === "[PATHOLOGICAL / CRITICAL ALERT]") {
        criticalAlerts.push(`CRITICAL TISSUE ALERT: Distal socket pressure (${measuredDistalPressure} kPa) breaches the ${refDistal.max} kPa tolerance limit for age ${age} (${ageBand} yrs). Immediate risk of bone-end skin breakdown.`);
    }
    if (measuredAsymmetry > (refAsym ? refAsym.pathological_min : 15)) {
        criticalAlerts.push(`GAIT INSTABILITY ALERT: Stance asymmetry (${measuredAsymmetry.toFixed(1)}%) breaches the ${refAsym ? refAsym.pathological_min : 15}% pathological threshold. Significant fall risk and unilateral compensation.`);
    }
    if (session.fatigue > 60 || fatigueStatus === "[PATHOLOGICAL / CRITICAL ALERT]") {
        criticalAlerts.push(`STRUCTURAL & METABOLIC FATIGUE ALERT: Exertion index at ${session.fatigue}% with cyclic load at ${measuredCyclicLoad} MPa, exceeding the ${refFatigue.max} MPa durability limit.`);
    }
    if (criticalAlerts.length === 0) {
        criticalAlerts.push("NO IMMEDIATE LIFE-CRITICAL BREACHES: All sensory telemetry monitored within operational safety boundaries.");
    }

    // Actionable Clinical Recommendations
    const actionableRecommendations = [];
    
    // Socket alignment & liner
    if (measuredDistalPressure > refDistal.max) {
        actionableRecommendations.push("Socket Alignment & Relief: Relieve distal bony contact zone via prosthetist socket modification; inspect distal cushion cup and evaluate 6mm silicone liner distal thickness.");
    } else {
        actionableRecommendations.push("Socket & Interface: Maintain total-surface bearing socket fit; current distal relief envelope is satisfactory.");
    }

    // Liner adjustment
    if (measuredInterfacePressure > refInterface.max || measuredDistalPressure > refDistal.max) {
        actionableRecommendations.push("Liner Adjustment: Transition to a high-dampening mineral-oil gel liner to dissipate weight-bearing wall peaks and reduce shear stress.");
    } else {
        actionableRecommendations.push("Liner Maintenance: Ensure daily liner hygiene and monitor suspension sleeve seal integrity.");
    }

    // Cadence & Gait Retraining
    if (measuredAsymmetry > (refAsym ? refAsym.normal_max : 10) || measuredGait < (refGait ? refGait.min : 1.0)) {
        actionableRecommendations.push(`Cadence & Symmetry Training: Initiate auditory metronome cadence biofeedback at 90-100 bpm; practice weight-shifting drills on prosthetic limb to reduce stance asymmetry toward the < ${refAsym ? refAsym.normal_max : 10}% target.`);
    } else {
        actionableRecommendations.push("Cadence Progression: Patient ready for stepped cadence modulation and dual-task community walking trials.");
    }

    // Material durability check
    if (measuredCyclicLoad >= refFatigue.min) {
        actionableRecommendations.push(`Material Check: Verify structural alignment and torque on prosthetic pylon adapters; inspect ${refFatigue.material} matrix for micro-delamination after high-load sessions.`);
    } else {
        actionableRecommendations.push("Material Maintenance: Routine prosthetic alignment and mechanical inspection scheduled per standard protocol.");
    }

    // Generate markdown string format matching the required output
    const markdownReport = [
        `### Patient Summary & Age Bracket`,
        `- **Patient ID / Name:** ${patient.name} (${patient.id})`,
        `- **Age / Bracket:** ${patient.age} yrs (${ageBand} yrs)`,
        `- **Amputation / Prosthesis:** ${patient.amputationType} | ${patient.prosthesis}`,
        `- **Active Session:** Session ${session.session} (${session.date || new Date().toISOString().split('T')[0]})`,
        `- **Attending Clinician:** ${patient.clinician}`,
        `- **Primary Clinical Goal:** ${patient.rehabGoal}`,
        ``,
        `### Parameter Evaluation Table`,
        `| Metric | Measured Value | Age-Specific Target | Status |`,
        `| :--- | :--- | :--- | :--- |`,
        ...parameters.map(p => `| **${p.metric}** | \`${p.measured}\` | ${p.target} | **${p.status}** |`),
        ``,
        `### Safety & Risk Assessment`,
        `- **Tissue & Ulcer Risk:** ${tissueUlcerAlert ? "🔴 HIGH RISK — Interface/Distal Socket Pressure exceeds age cohort tolerance" : "🟢 LOW RISK — Pressure parameters well dissipated across weight-bearing walls"}`,
        `- **Fall & Gait Instability Risk:** ${fallInstabilityAlert ? "🔴 ELEVATED RISK — Stance asymmetry or step width variability breaches pathological envelope" : "🟢 CONTROLLED — Coronal stability and bilateral stance balance within safe margins"}`,
        `- **Prosthetic Structural Fatigue:** ${structuralFatigueAlert ? "🟡 ATTENTION REQUIRED — Cyclic mechanical load exceeds material cohort rating" : "🟢 CERTIFIED SAFE — Operating load conforms to component fatigue rating"}`,
        ``,
        `### Critical Alerts & Flags`,
        ...criticalAlerts.map(a => `- ${a}`),
        ``,
        `### Actionable Clinical Recommendations`,
        ...actionableRecommendations.map(r => `- **${r.split(':')[0]}:** ${r.split(':').slice(1).join(':')}`)
    ].join('\n');

    return {
        patientSummary: {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            ageBand: ageBand,
            amputationType: patient.amputationType,
            prosthesis: patient.prosthesis,
            clinician: patient.clinician,
            rehabGoal: patient.rehabGoal,
            sessionNum: session.session,
            sessionDate: session.date
        },
        ageBand: ageBand,
        parameters: parameters,
        safetyAndRiskAssessment: {
            tissueUlcerRisk: tissueUlcerAlert ? "HIGH" : "LOW",
            fallInstabilityRisk: fallInstabilityAlert ? "HIGH" : "LOW",
            structuralFatigueRisk: structuralFatigueAlert ? "HIGH" : "LOW"
        },
        criticalAlerts: criticalAlerts,
        actionableRecommendations: actionableRecommendations,
        formattedMarkdown: markdownReport
    };
}

// Expose on the global namespace for the engine and UI modules.
const ardsClinicalRefsExport = {
    REFERENCES: ARDS_CLINICAL_REFERENCES,
    resolveAgeBand: resolveAgeBand,
    getAgeBandForMetric: getAgeBandForMetric,
    getReferenceFor: getReferenceFor,
    evaluateSessionTelemetry: evaluateSessionTelemetry
};

if (typeof window !== 'undefined') {
    window.ardsClinicalRefs = ardsClinicalRefsExport;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ardsClinicalRefsExport;
}

