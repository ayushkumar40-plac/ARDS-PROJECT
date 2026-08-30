/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Age-Stratified Clinical Reference Ranges
 *
 * Reference norms for biomechanical and interface-pressure metrics,
 * stratified by patient age band. Consumed by the ARDSEngine to
 * contextualise live telemetry against age-appropriate clinical baselines.
 *
 * NOTE: These are *reference ranges*, not hard safety cutoffs. The engine's
 * conservative SAFETY_THRESHOLDS (static) remain authoritative for hard
 * safety-governor decisions; these references enrich the decision narrative
 * and XAI interpretability with age-appropriate context.
 */

const ARDS_CLINICAL_REFERENCES = {
    gait_velocity_mps: {
        "20-29": { min: 1.36, max: 1.39 },
        "30-39": { min: 1.37, max: 1.43 },
        "40-49": { min: 1.39, max: 1.43 },
        "50-59": { min: 1.31, max: 1.43 },
        "60-69": { min: 1.24, max: 1.34 },
        "70-79": { min: 1.13, max: 1.26 },
        "80-89": { min: 0.94, max: 0.97 },
        "90+":   { min: 0.55, max: 0.65 }
    },
    stance_asymmetry_pct: {
        "20-59": { normal_max: 10.0, pathological_min: 15.0 },
        "60-79": { normal_min: 10.0, normal_max: 15.0, pathological_min: 18.0 },
        "80+":   { normal_min: 15.0, normal_max: 20.0, pathological_min: 20.0 }
    },
    step_width_variability_cm: {
        "20-59": { normal_max: 1.50 },
        "60-79": { normal_min: 1.50, normal_max: 2.50 },
        "80+":   { normal_min: 2.00, normal_max: 2.80 }
    },
    force_control_error_pct: {
        "20-29": { min: 3.0, max: 5.0 },
        "30-39": { min: 5.0, max: 10.0 },
        "40-49": { min: 5.0, max: 10.0 },
        "50-59": { min: 10.0, max: 15.0 },
        "60-79": { min: 10.0, max: 15.0 },
        "80+":   { min: 10.0, max: 15.0 }
    },
    fatigue_durability_mpa: {
        "20-29": { min: 55, max: 60, material: "Carbon matrix" },
        "30-39": { min: 50, max: 58, material: "Carbon matrix" },
        "40-49": { min: 45, max: 55, material: "Active baseline durability" },
        "50-59": { min: 40, max: 50, material: "Moderate composite limit" },
        "60-69": { min: 25, max: 40, material: "Fiberglass/acrylic blend" },
        "70-79": { min: 18, max: 25, material: "Lightweight copolymer" },
        "80-89": { min: 14, max: 18, material: "Standard passive polymer" },
        "90+":   { min: 10, max: 14, material: "Low-impact clinical baseline" }
    },
    interface_pressure_kpa: {
        "20-29": { min: 180, max: 210 },
        "30-39": { min: 175, max: 200 },
        "40-49": { min: 160, max: 190 },
        "50-59": { min: 150, max: 180 },
        "60-69": { min: 130, max: 160 },
        "70-79": { min: 110, max: 145 },
        "80-89": { min: 90,  max: 120 },
        "90+":   { min: 70,  max: 100 }
    },
    distal_socket_pressure_kpa: {
        "20-29": { min: 45, max: 55 },
        "30-39": { min: 40, max: 50 },
        "40-49": { min: 35, max: 45 },
        "50-59": { min: 30, max: 40 },
        "60-69": { min: 25, max: 35 },
        "70-79": { min: 20, max: 30 },
        "80-89": { min: 15, max: 25 },
        "90+":   { min: 10, max: 15 }
    }
};

/**
 * Resolves the age-band key for a given age within a metric's band table.
 * Bands use either "lo-hi" (e.g. "20-29", "60-79") or "lo+" (e.g. "90+") syntax.
 * Returns the matching band key, or null when the age is below the lowest band.
 */
function resolveAgeBand(bands, age) {
    if (age == null || age === '' || !bands) return null;
    const entries = Object.keys(bands).map(key => {
        const isPlus = key.indexOf('+') !== -1;
        const parts = key.replace('+', '').split('-').map(Number);
        return { key: key, lo: parts[0], hi: isPlus ? Infinity : (parts[1] !== undefined ? parts[1] : Infinity) };
    }).sort((a, b) => a.lo - b.lo);

    for (const entry of entries) {
        if (age >= entry.lo && age <= entry.hi) return entry.key;
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

// Expose on the global namespace for the engine and UI modules.
window.ardsClinicalRefs = {
    REFERENCES: ARDS_CLINICAL_REFERENCES,
    resolveAgeBand: resolveAgeBand,
    getAgeBandForMetric: getAgeBandForMetric,
    getReferenceFor: getReferenceFor
};
