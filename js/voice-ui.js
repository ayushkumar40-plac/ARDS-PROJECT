/**
 * ARDS Voice & Language Section UI Controller
 * Wires the "Voice & Language" section (section-voice) to the
 * ARDSVoiceAssistant module (js/voice-assistant.js).
 */
(function () {
    'use strict';

    function getAssistant() {
        return window.ardsVoiceAssistant || null;
    }

    /* ----------------------------------------------------
     * LANGUAGE SELECTION
     * -------------------------------------------------- */
    function populateLanguageSelect() {
        const assistant = getAssistant();
        const select = document.getElementById('voiceLanguageSelect');
        if (!assistant || !select) return;

        select.innerHTML = assistant.getLanguageList().map(lang => `
      <option value="${lang.code}" ${lang.code === assistant.currentLanguage ? 'selected' : ''}>
        ${lang.flag} ${lang.name} (${lang.code})
      </option>
    `).join('');

        select.onchange = (e) => applyLanguage(e.target.value);
    }

    function populateLanguageGrid() {
        const assistant = getAssistant();
        const grid = document.getElementById('voiceLanguageGrid');
        if (!assistant || !grid) return;

        grid.innerHTML = assistant.getLanguageList().map(lang => {
            const active = lang.code === assistant.currentLanguage;
            const cardCls = active
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 shadow-md shadow-sky-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-sky-500/40 hover:bg-slate-800/60';
            return `
        <button type="button" data-lang="${lang.code}" class="voice-lang-card p-3 rounded-xl border text-left transition ${cardCls}">
          <div class="text-xl leading-none mb-1.5">${lang.flag}</div>
          <div class="text-xs font-bold truncate">${lang.name}</div>
          <div class="text-[10px] font-mono ${active ? 'text-sky-400' : 'text-slate-500'}">${lang.code}</div>
        </button>
      `;
        }).join('');

        grid.querySelectorAll('.voice-lang-card').forEach(card => {
            card.addEventListener('click', () => applyLanguage(card.dataset.lang));
        });
    }

    function updateLanguageUI() {
        const assistant = getAssistant();
        if (!assistant) return;

        const list = assistant.getLanguageList();
        const current = list.find(l => l.code === assistant.currentLanguage) || list[0];

        const badge = document.getElementById('voiceCurrentLangBadge');
        if (badge && current) {
            badge.textContent = `${current.flag} ${current.name}`;
        }

        const select = document.getElementById('voiceLanguageSelect');
        if (select) select.value = assistant.currentLanguage;

        populateLanguageGrid();
        renderCommandExamples();
    }

    function applyLanguage(langCode) {
        const assistant = getAssistant();
        if (!assistant) return;

        const ok = assistant.setLanguage(langCode);
        if (ok) {
            updateLanguageUI();

            // Confirm the change in the transcript area
            const display = document.getElementById('voiceTranscript');
            if (display) {
                display.classList.remove('italic', 'text-slate-500', 'text-rose-300');
                display.classList.add('text-slate-300');
                display.textContent = `${assistant.translate('selectLanguage')}: ${assistant.currentLanguage}`;
            }
        }
    }

    /* ----------------------------------------------------
     * MICROPHONE & VOICE CONTROLS
     * -------------------------------------------------- */
    function setupMicButton() {
        const assistant = getAssistant();
        const btn = document.getElementById('voiceAssistantBtn');
        if (!assistant || !btn) return;

        btn.addEventListener('click', () => assistant.toggleListening());
    }

    function setupVoiceToggle() {
        const assistant = getAssistant();
        const toggle = document.getElementById('voiceEnabledToggle');
        if (!assistant || !toggle) return;

        toggle.checked = assistant.voiceEnabled;
        toggle.addEventListener('change', (e) => {
            assistant.setVoiceEnabled(e.target.checked);
        });
    }

    function setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;

            const section = document.getElementById('section-voice');
            if (!section || section.classList.contains('hidden')) return;

            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(tag)) return;

            e.preventDefault();
            const assistant = getAssistant();
            if (assistant) assistant.toggleListening();
        });
    }

    function checkBrowserSupport() {
        const assistant = getAssistant();
        const warning = document.getElementById('voiceSupportWarning');
        if (assistant && !assistant.recognition && warning) {
            warning.classList.remove('hidden');
        }
    }

    /* ----------------------------------------------------
     * COMMAND EXAMPLES (localized)
     * -------------------------------------------------- */
    function renderCommandExamples() {
        const assistant = getAssistant();
        const list = document.getElementById('voiceCommandExamples');
        if (!assistant || !list) return;

        const examples = [
            assistant.translate('sessionQuery'),
            assistant.translate('scoreQuery'),
            assistant.translate('fatigueQuery'),
            assistant.translate('pressureQuery'),
            assistant.translate('recommendationQuery')
        ];

        list.innerHTML = examples.map(cmd => `
      <li class="flex items-center gap-2 text-slate-300">
        <i data-lucide="mic" class="w-3 h-3 text-sky-400 flex-shrink-0"></i>
        <span class="font-mono">"${cmd}"</span>
      </li>
    `).join('');

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch (e) { /* noop */ }
        }
    }

    /* ----------------------------------------------------
     * TRANSCRIPT DISPLAY ENHANCEMENTS
     * -------------------------------------------------- */
    function enhanceTranscriptDisplay(assistant) {
        const originalUpdate = assistant.updateTranscriptDisplay.bind(assistant);
        assistant.updateTranscriptDisplay = function (text) {
            const display = document.getElementById('voiceTranscript');
            if (display && text) {
                display.classList.remove('italic', 'text-slate-500', 'text-rose-300');
                display.classList.add('text-slate-200');
            }
            originalUpdate(text);
        };

        const originalError = assistant.handleRecognitionError.bind(assistant);
        assistant.handleRecognitionError = function (error) {
            const display = document.getElementById('voiceTranscript');
            if (display) {
                display.classList.remove('italic', 'text-slate-500', 'text-slate-200');
                display.classList.add('text-rose-300');
            }
            originalError(error);
        };
    }

    /* ----------------------------------------------------
     * INIT
     * -------------------------------------------------- */
    function initVoiceSection() {
        const assistant = getAssistant();
        if (!assistant) {
            console.warn('ARDS Voice Assistant not available; Voice & Language section disabled.');
            return;
        }

        enhanceTranscriptDisplay(assistant);
        populateLanguageSelect();
        updateLanguageUI();
        setupMicButton();
        setupVoiceToggle();
        setupKeyboardShortcut();
        checkBrowserSupport();

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch (e) { /* noop */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initVoiceSection);
    } else {
        initVoiceSection();
    }
})();