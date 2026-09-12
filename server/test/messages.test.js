'use strict';

const assert = require('assert');
const { buildMessages } = require('../messages');

const payload = {
  patient: { id: 'P002', name: 'Elena Rostova', phone: '+14155551234' },
  doctor: { name: 'Dr. Samuel Vance, CPO', phone: '+14155559876' },
  risk: {
    score: 38.4,
    band: 'Poor',
    state: 'UNSTABLE',
    severity: 'critical',
    safetyFlag: 'HIGH_FATIGUE',
    reasons: ['Fatigue index 72% exceeds the 55% endurance threshold.'],
    recommendation: 'Reduce training session difficulty by 15%.',
    sessionNumber: 5,
    date: '2026-08-02'
  }
};

const messages = buildMessages(payload);

assert.ok(messages.patient.sms.includes('Elena'), 'patient SMS greets the patient by first name');
assert.ok(messages.patient.sms.includes('38.4'), 'patient SMS carries the rehab score');
assert.ok(messages.patient.sms.length <= 320, 'patient SMS stays within two SMS segments');
assert.ok(!messages.patient.sms.includes('\n'), 'patient SMS is a single line');

assert.ok(messages.doctor.sms.includes('P002'), 'doctor SMS identifies the patient record');
assert.ok(messages.doctor.sms.includes('UNSTABLE'), 'doctor SMS carries the condition state');

assert.ok(messages.patient.whatsapp.includes('What to do now'), 'patient WhatsApp gives instructions');
assert.ok(messages.patient.whatsapp.includes('Dr. Samuel Vance, CPO'), 'patient WhatsApp names the clinician');
assert.ok(messages.doctor.whatsapp.includes('Risk drivers'), 'doctor WhatsApp lists risk drivers');
assert.ok(messages.doctor.whatsapp.includes('Fatigue index 72%'), 'doctor WhatsApp includes the driver detail');

console.log('messages.test.js: all assertions passed');
