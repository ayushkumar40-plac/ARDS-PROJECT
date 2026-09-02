/**
 * ARDS - Feedback Form Integration Smoke Test
 * Uses the same DOM-mock harness pattern as test_app_integration.js
 * to exercise the local-only feedback modal end-to-end.
 */
const fs = require("fs");
const path = require("path");

const load = (f) => fs.readFileSync(path.join(__dirname, "js", f), "utf8");

/* ------------------------------------------------------------------
 * Minimal but stateful DOM mock (classList backed by a real Set)
 * ---------------------------------------------------------------- */
function makeClassList() {
  const set = new Set();
  return {
    add: (...cls) => cls.forEach(c => set.add(c)),
    remove: (...cls) => cls.forEach(c => set.delete(c)),
    toggle: (c, force) => {
      const on = force === undefined ? !set.has(c) : !!force;
      if (on) set.add(c); else set.delete(c);
      return on;
    },
    contains: (c) => set.has(c)
  };
}

const mockCtx = {
  clearRect: () => { }, beginPath: () => { }, moveTo: () => { },
  lineTo: () => { }, stroke: () => { }, arc: () => { }, fill: () => { }, fillText: () => { }
};

function makeEl(id, props = {}) {
  const listeners = {};
  const el = {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    dataset: props.dataset || {},
    classList: makeClassList(),
    addEventListener: (evt, fn) => { (listeners[evt] = listeners[evt] || []).push(fn); },
    dispatch: (evt, evtObj = {}) => (listeners[evt] || []).forEach(fn => fn(evtObj)),
    querySelectorAll: () => [],
    querySelector: () => null,
    focus: () => { },
    reset: () => { el.value = ""; },
    getContext: () => mockCtx,
    ...props
  };
  return el;
}

// Registry of known elements used by the feedback modal
const registry = {};
const reg = (id, props) => { registry[id] = makeEl(id, props); return registry[id]; };

reg("modalFeedback");
const form = reg("formFeedback");
reg("feedbackType", { value: "General" });
reg("feedbackRating", {
  querySelectorAll: (sel) => (sel === ".feedback-star" ? starButtons : [])
});
reg("feedbackMessage");
reg("feedbackName");
reg("feedbackEmail");
reg("feedbackError");
reg("feedbackEmailError");
reg("feedbackIntroNote");
reg("feedbackSuccess");
reg("feedbackHistorySection");
reg("feedbackHistoryList");
reg("feedbackHistoryCount");
reg("btnOpenFeedback");
reg("btnCloseFeedbackModal");
reg("btnCancelFeedback");
reg("btnCloseFeedbackSuccess");
reg("btnSubmitAnotherFeedback");
reg("btnClearFeedback");

// Five clickable star buttons, each with a child icon element
const starButtons = [];
for (let i = 1; i <= 5; i++) {
  const icon = makeEl(`star-icon-${i}`);
  starButtons.push(makeEl(`star-${i}`, { dataset: { value: String(i) }, querySelector: () => icon }));
}

// Mimic real form.reset() semantics (clears fields, restores default select)
form.reset = function () {
  registry["feedbackMessage"].value = "";
  registry["feedbackName"].value = "";
  registry["feedbackEmail"].value = "";
  registry["feedbackType"].value = "General";
};

/* ------------------------------------------------------------------
 * Browser globals (same approach as test_app_integration.js)
 * ---------------------------------------------------------------- */
const docListeners = {};
global.window = global;
global.document = {
  documentElement: { getAttribute: () => "dark", setAttribute: () => { } },
  getElementById: (id) => registry[id] || makeEl(id),
  querySelectorAll: () => [],
  addEventListener: (evt, fn) => { (docListeners[evt] = docListeners[evt] || []).push(fn); },
  readyState: "complete",
  scrollTo: () => { }
};
global.localStorage = {
  _store: {},
  getItem: (k) => (k in global.localStorage._store ? global.localStorage._store[k] : null),
  setItem: (k, v) => { global.localStorage._store[k] = String(v); }
};
global.lucide = { createIcons: () => { } };
global.confirm = () => true;

console.log("Evaluating script files...");
eval(load("data.js"));
eval(load("engine.js"));
eval(load("pipeline.js"));
eval(load("charts.js"));
eval(load("app.js"));

const app = window.ardsApp;
let failures = 0;
const assert = (cond, msg) => {
  if (!cond) { failures++; console.error("[FAIL] " + msg); }
  else console.log("[PASS] " + msg);
};

// Simulate a signed-in clinician (prefill source)
window.ardsAuth = {
  getCurrentUser: () => ({ name: "Dr. Rachel Thorne", email: "clinician@ards.demo", role: "Clinician" })
};

// 1. Open modal + prefill
app.openFeedbackModal();
assert(!registry["modalFeedback"].classList.contains("hidden"), "openFeedbackModal() shows the modal");
assert(registry["feedbackName"].value === "Dr. Rachel Thorne", "Name prefilled from signed-in user");
assert(registry["feedbackEmail"].value === "clinician@ards.demo", "Email prefilled from signed-in user");

// 2. Validation: empty message rejected
form.dispatch("submit", { preventDefault: () => { } });
assert(app.getFeedbackEntries().length === 0, "Empty message is rejected (no entry saved)");
assert(!registry["feedbackError"].classList.contains("hidden"), "Message validation error is shown");

// 3. Validation: malformed email rejected
registry["feedbackMessage"].value = "The dashboard layout is very intuitive!";
registry["feedbackEmail"].value = "not-an-email";
form.dispatch("submit", { preventDefault: () => { } });
assert(app.getFeedbackEntries().length === 0, "Invalid email is rejected (no entry saved)");
assert(!registry["feedbackEmailError"].classList.contains("hidden"), "Email validation error is shown");

// 4. Star rating interaction
starButtons[3].dispatch("click");
assert(app.feedbackRatingValue === 4, "Clicking the 4th star sets rating to 4");
assert(starButtons[3].querySelector().classList.contains("fill-amber-400"), "4th star renders as filled");
assert(!starButtons[4].querySelector().classList.contains("fill-amber-400"), "5th star remains unfilled");

// 5. Valid submission
registry["feedbackEmail"].value = "clinician@ards.demo";
form.dispatch("submit", { preventDefault: () => { } });
assert(app.getFeedbackEntries().length === 1, "Valid feedback saved to localStorage");
const saved = app.getFeedbackEntries()[0];
assert(saved.rating === 4 && saved.type === "General" && saved.name === "Dr. Rachel Thorne",
  "Entry fields (rating/type/name) captured correctly");
assert(saved.message === "The dashboard layout is very intuitive!", "Entry message captured correctly");
assert(String(saved.id).startsWith("fb-"), "Entry gets an fb- prefixed id");
assert(JSON.parse(global.localStorage.getItem("ards_feedback_entries")).length === 1,
  "Entry persisted under ards_feedback_entries key");
assert(!registry["feedbackSuccess"].classList.contains("hidden"), "Success panel shown after submit");
assert(form.classList.contains("hidden"), "Form hidden while success panel is visible");
assert(registry["feedbackMessage"].value === "", "Message cleared after successful submit");

// 6. "Submit Another" restores the form view
registry["btnSubmitAnotherFeedback"].dispatch("click");
assert(!form.classList.contains("hidden"), "'Submit Another' restores the form");
assert(registry["feedbackSuccess"].classList.contains("hidden"), "Success panel hidden after reset");
assert(app.feedbackRatingValue === 0, "Rating reset to 0");
assert(starButtons[2].querySelector().classList.contains("text-slate-600"), "Stars visually reset to grey");

// 7. Close / reopen keeps history
app.closeFeedbackModal();
assert(registry["modalFeedback"].classList.contains("hidden"), "closeFeedbackModal() hides the modal");
window.openFeedbackModal();
assert(!registry["modalFeedback"].classList.contains("hidden"), "window.openFeedbackModal global helper works");
assert(String(registry["feedbackHistoryCount"].textContent) === "1", "History count shows 1 entry");
assert(registry["feedbackHistoryList"].innerHTML.includes("The dashboard layout is very intuitive!"),
  "History list renders the submitted message");
assert(registry["feedbackHistoryList"].innerHTML.includes("Dr. Rachel Thorne"),
  "History list renders the submitter name");

// 8. Escape key closes the modal
(docListeners["keydown"] || []).forEach(fn => fn({ key: "Escape" }));
assert(registry["modalFeedback"].classList.contains("hidden"), "Escape key closes the open modal");

// 9. Backdrop click closes the modal
window.openFeedbackModal();
registry["modalFeedback"].dispatch("click", { target: registry["modalFeedback"] });
assert(registry["modalFeedback"].classList.contains("hidden"), "Clicking the backdrop closes the modal");

// 10. Clear history
window.openFeedbackModal();
registry["btnClearFeedback"].dispatch("click");
assert(app.getFeedbackEntries().length === 0, "Clear History empties feedback entries");
assert(registry["feedbackHistorySection"].classList.contains("hidden"), "History section hidden when empty");

if (failures > 0) {
  console.error(`=== Feedback Form Tests: ${failures} FAILURE(S) ===`);
  process.exit(1);
}
console.log("=== Feedback Form Integration Tests 100% PASSED ===");