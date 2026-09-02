/**
 * Adaptive Rehabilitation Decision Support System - Clinical Chatbot
 * Floating assistant that answers questions about the active patient,
 * session metrics, rehab score, safety, alerts, and navigation using
 * dataStore + ardsEngine (no external API).
 */
(function () {
  'use strict';

  var SUGGESTIONS = [
    'Evaluate telemetry',
    'What is the rehab score?',
    'Tell me about this patient',
    'Check fatigue level',
    'Socket pressure status',
    'Clinical recommendation',
    'Show open alerts',
    'How is progress trending?'
  ];

  var HELP_TEXT =
    'I can help with the active patient and session. Try asking to "evaluate telemetry" against clinical reference standards, ' +
    'or ask about rehab score, fatigue, socket pressure, gait/symmetry, clinical recommendation, alerts, ' +
    'progress trends, or say "open alerts / reports / XAI / decision log".';

  function ARDSChatbot() {
    this.isOpen = false;
    this.history = [];
    this.init();
  }

  ARDSChatbot.prototype.init = function () {
    var self = this;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { self.mount(); });
    } else {
      this.mount();
    }
  };

  ARDSChatbot.prototype.mount = function () {
    if (document.getElementById('ardsChatbotRoot')) return;
    this.injectMarkup();
    this.cacheDom();
    this.bindEvents();
    this.renderSuggestions();
    this.addBotMessage(
      'Hello \u2014 I\'m the clinical assistant for the Adaptive Rehabilitation Decision Support System. ' +
      'Ask me about the active patient, session metrics, safety flags, or say "help" for ideas.'
    );
    this.refreshIcons();
  };

  ARDSChatbot.prototype.injectMarkup = function () {
    var root = document.createElement('div');
    root.id = 'ardsChatbotRoot';
    root.className = 'ards-chatbot-root no-print';
    root.setAttribute('aria-live', 'polite');
    root.innerHTML =
      '<button type="button" id="ardsChatbotFab" class="ards-chatbot-fab" ' +
      'title="Open clinical assistant" aria-label="Open clinical assistant" ' +
      'aria-expanded="false" aria-controls="ardsChatbotPanel">' +
      '<i data-lucide="message-circle" class="ards-chatbot-fab-icon ards-chatbot-fab-icon-open"></i>' +
      '<i data-lucide="x" class="ards-chatbot-fab-icon ards-chatbot-fab-icon-close hidden"></i>' +
      '<span class="ards-chatbot-fab-pulse" aria-hidden="true"></span>' +
      '</button>' +
      '<div id="ardsChatbotPanel" class="ards-chatbot-panel hidden" role="dialog" ' +
      'aria-modal="false" aria-label="Clinical assistant" aria-hidden="true">' +
      '<header class="ards-chatbot-header">' +
      '<div class="ards-chatbot-header-brand">' +
      '<div class="ards-chatbot-avatar" aria-hidden="true"><i data-lucide="bot" class="w-4 h-4"></i></div>' +
      '<div class="min-w-0">' +
      '<div class="ards-chatbot-title">Clinical Assistant</div>' +
      '<div class="ards-chatbot-subtitle">' +
      '<span class="ards-chatbot-status-dot" aria-hidden="true"></span>' +
      '<span id="ardsChatbotContextLabel">Online \u00b7 local clinical context</span>' +
      '</div></div></div>' +
      '<div class="ards-chatbot-header-actions">' +
      '<button type="button" id="ardsChatbotClear" class="ards-chatbot-icon-btn" ' +
      'title="Clear conversation" aria-label="Clear conversation">' +
      '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>' +
      '<button type="button" id="ardsChatbotClose" class="ards-chatbot-icon-btn" ' +
      'title="Close chatbot" aria-label="Close chatbot">' +
      '<i data-lucide="x" class="w-4 h-4"></i></button>' +
      '</div></header>' +
      '<div id="ardsChatbotMessages" class="ards-chatbot-messages" role="log" aria-relevant="additions"></div>' +
      '<div id="ardsChatbotSuggestions" class="ards-chatbot-suggestions" aria-label="Suggested questions"></div>' +
      '<form id="ardsChatbotForm" class="ards-chatbot-form" autocomplete="off">' +
      '<input type="text" id="ardsChatbotInput" class="ards-chatbot-input" ' +
      'placeholder="Ask about score, fatigue, pressure, alerts\u2026" maxlength="500" aria-label="Chat message">' +
      '<button type="submit" id="ardsChatbotSend" class="ards-chatbot-send" title="Send message" aria-label="Send message">' +
      '<i data-lucide="send" class="w-4 h-4"></i></button>' +
      '</form>' +
      '<footer class="ards-chatbot-footer">' +
      'Research prototype \u00b7 answers use on-device clinical engine \u00b7 not for primary diagnosis' +
      '</footer></div>';
    document.body.appendChild(root);
  };

  ARDSChatbot.prototype.cacheDom = function () {
    this.root = document.getElementById('ardsChatbotRoot');
    this.fab = document.getElementById('ardsChatbotFab');
    this.panel = document.getElementById('ardsChatbotPanel');
    this.messagesEl = document.getElementById('ardsChatbotMessages');
    this.suggestionsEl = document.getElementById('ardsChatbotSuggestions');
    this.form = document.getElementById('ardsChatbotForm');
    this.input = document.getElementById('ardsChatbotInput');
    this.closeBtn = document.getElementById('ardsChatbotClose');
    this.clearBtn = document.getElementById('ardsChatbotClear');
    this.contextLabel = document.getElementById('ardsChatbotContextLabel');
    this.fabOpenIcon = this.fab ? this.fab.querySelector('.ards-chatbot-fab-icon-open') : null;
    this.fabCloseIcon = this.fab ? this.fab.querySelector('.ards-chatbot-fab-icon-close') : null;
  };

  ARDSChatbot.prototype.bindEvents = function () {
    var self = this;
    if (this.fab) this.fab.addEventListener('click', function () { self.toggle(); });
    if (this.closeBtn) this.closeBtn.addEventListener('click', function () { self.close(); });
    if (this.clearBtn) this.clearBtn.addEventListener('click', function () { self.clearConversation(); });
    if (this.form) {
      this.form.addEventListener('submit', function (e) {
        e.preventDefault();
        self.handleSubmit();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self.isOpen) self.close();
    });
  };

  ARDSChatbot.prototype.refreshIcons = function () {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) { /* noop */ }
    }
  };

  ARDSChatbot.prototype.updateContextLabel = function () {
    if (!this.contextLabel) return;
    var patient = window.dataStore && window.dataStore.getActivePatient ? window.dataStore.getActivePatient() : null;
    var session = window.dataStore && window.dataStore.getActiveSession ? window.dataStore.getActiveSession() : null;
    if (patient && session) {
      this.contextLabel.textContent = patient.id + ' \u00b7 ' + patient.name + ' \u00b7 Session ' + session.session;
    } else if (patient) {
      this.contextLabel.textContent = patient.id + ' \u00b7 ' + patient.name;
    } else {
      this.contextLabel.textContent = 'Online \u00b7 local clinical context';
    }
  };

  ARDSChatbot.prototype.toggle = function () {
    if (this.isOpen) this.close(); else this.open();
  };

  ARDSChatbot.prototype.open = function () {
    var self = this;
    if (!this.panel || !this.fab) return;
    this.isOpen = true;
    this.panel.classList.remove('hidden');
    this.panel.setAttribute('aria-hidden', 'false');
    this.fab.setAttribute('aria-expanded', 'true');
    this.fab.classList.add('ards-chatbot-fab-open');
    if (this.fabOpenIcon) this.fabOpenIcon.classList.add('hidden');
    if (this.fabCloseIcon) this.fabCloseIcon.classList.remove('hidden');
    this.updateContextLabel();
    this.scrollToBottom();
    setTimeout(function () { if (self.input) self.input.focus(); }, 80);
    this.refreshIcons();
  };

  ARDSChatbot.prototype.close = function () {
    if (!this.panel || !this.fab) return;
    this.isOpen = false;
    this.panel.classList.add('hidden');
    this.panel.setAttribute('aria-hidden', 'true');
    this.fab.setAttribute('aria-expanded', 'false');
    this.fab.classList.remove('ards-chatbot-fab-open');
    if (this.fabOpenIcon) this.fabOpenIcon.classList.remove('hidden');
    if (this.fabCloseIcon) this.fabCloseIcon.classList.add('hidden');
    this.refreshIcons();
  };

  ARDSChatbot.prototype.clearConversation = function () {
    if (this.messagesEl) this.messagesEl.innerHTML = '';
    this.history = [];
    this.addBotMessage('Conversation cleared. How can I help with the active patient?');
    this.renderSuggestions();
  };

  ARDSChatbot.prototype.renderSuggestions = function () {
    var self = this;
    if (!this.suggestionsEl) return;
    this.suggestionsEl.innerHTML = SUGGESTIONS.map(function (text) {
      return '<button type="button" class="ards-chatbot-chip" data-q="' +
        self.escapeAttr(text) + '">' + self.escapeHtml(text) + '</button>';
    }).join('');
    var chips = this.suggestionsEl.querySelectorAll('.ards-chatbot-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].addEventListener('click', function () {
        var q = this.getAttribute('data-q') || this.textContent || '';
        self.sendUserMessage(q.trim());
      });
    }
  };

  ARDSChatbot.prototype.handleSubmit = function () {
    var text = (this.input && this.input.value ? this.input.value : '').trim();
    if (!text) return;
    if (this.input) this.input.value = '';
    this.sendUserMessage(text);
  };

  ARDSChatbot.prototype.sendUserMessage = function (text) {
    var self = this;
    if (!text) return;
    if (!this.isOpen) this.open();
    this.addUserMessage(text);
    this.showTyping();
    var delay = 280 + Math.min(420, text.length * 8);
    window.setTimeout(function () {
      self.hideTyping();
      var reply = self.generateReply(text);
      self.addBotMessage(reply.text, { actions: reply.actions });
      if (reply.navigate && window.ardsApp && window.ardsApp.switchTab) {
        try { window.ardsApp.switchTab(reply.navigate); } catch (e) { /* noop */ }
      }
    }, delay);
  };

  ARDSChatbot.prototype.showTyping = function () {
    if (!this.messagesEl || document.getElementById('ardsChatbotTyping')) return;
    var el = document.createElement('div');
    el.id = 'ardsChatbotTyping';
    el.className = 'ards-chatbot-row ards-chatbot-row-bot';
    el.innerHTML =
      '<div class="ards-chatbot-bubble ards-chatbot-bubble-bot ards-chatbot-typing">' +
      '<span></span><span></span><span></span></div>';
    this.messagesEl.appendChild(el);
    this.scrollToBottom();
  };

  ARDSChatbot.prototype.hideTyping = function () {
    var el = document.getElementById('ardsChatbotTyping');
    if (el) el.remove();
  };

  ARDSChatbot.prototype.addUserMessage = function (text) {
    this.history.push({ role: 'user', text: text });
    this.appendBubble('user', text);
  };

  ARDSChatbot.prototype.addBotMessage = function (text, opts) {
    opts = opts || {};
    this.history.push({ role: 'bot', text: text });
    this.appendBubble('bot', text, opts);
  };

  ARDSChatbot.prototype.appendBubble = function (role, text, opts) {
    opts = opts || {};
    if (!this.messagesEl) return;
    var self = this;
    var row = document.createElement('div');
    row.className = 'ards-chatbot-row ards-chatbot-row-' + role;

    var bubble = document.createElement('div');
    bubble.className = 'ards-chatbot-bubble ards-chatbot-bubble-' + role;
    bubble.innerHTML = this.formatMessage(text);
    row.appendChild(bubble);

    if (opts.actions && opts.actions.length) {
      var actions = document.createElement('div');
      actions.className = 'ards-chatbot-msg-actions';
      opts.actions.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ards-chatbot-action-btn';
        b.textContent = a.label;
        b.addEventListener('click', function () {
          if (a.tab && window.ardsApp && window.ardsApp.switchTab) window.ardsApp.switchTab(a.tab);
          if (a.ask) self.sendUserMessage(a.ask);
        });
        actions.appendChild(b);
      });
      row.appendChild(actions);
    }

    this.messagesEl.appendChild(row);
    this.scrollToBottom();
    this.refreshIcons();
  };

  ARDSChatbot.prototype.formatMessage = function (text) {
    var str = String(text || '');
    var lines = str.split('\n');
    var inTable = false;
    var tableHtml = '';
    var outLines = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        var cells = line.split('|').map(function(c) { return c.trim(); }).filter(function(c, idx, arr) { return idx > 0 && idx < arr.length; });
        if (cells.every(function(c) { return /^:?-+:?$/.test(c); })) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="ards-chatbot-table-wrap"><table class="ards-chatbot-table"><thead><tr>' +
            cells.map(function(c) { return '<th>' + c + '</th>'; }).join('') +
            '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>' + cells.map(function(c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
        }
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</tbody></table></div>';
          outLines.push(tableHtml);
          tableHtml = '';
        }
        outLines.push(lines[i]);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      outLines.push(tableHtml);
    }

    var html = this.escapeHtml(outLines.join('\n'));
    html = html.replace(/&lt;div class=&quot;ards-chatbot-table-wrap&quot;&gt;&lt;table class=&quot;ards-chatbot-table&quot;&gt;/g, '<div class="ards-chatbot-table-wrap"><table class="ards-chatbot-table">');
    html = html.replace(/&lt;\/tbody&gt;&lt;\/table&gt;&lt;\/div&gt;/g, '</tbody></table></div>');
    html = html.replace(/&lt;thead&gt;&lt;tr&gt;/g, '<thead><tr>');
    html = html.replace(/&lt;\/tr&gt;&lt;\/thead&gt;&lt;tbody&gt;/g, '</tr></thead><tbody>');
    html = html.replace(/&lt;tr&gt;/g, '<tr>');
    html = html.replace(/&lt;\/tr&gt;/g, '</tr>');
    html = html.replace(/&lt;th&gt;/g, '<th>');
    html = html.replace(/&lt;\/th&gt;/g, '</th>');
    html = html.replace(/&lt;td&gt;/g, '<td>');
    html = html.replace(/&lt;\/td&gt;/g, '</td>');

    html = html.replace(/### (.+?)(?:\n|<br>|$)/g, '<div class="ards-chatbot-heading"><strong>$1</strong></div>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
  };

  ARDSChatbot.prototype.scrollToBottom = function () {
    if (!this.messagesEl) return;
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  };

  ARDSChatbot.prototype.escapeHtml = function (str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  ARDSChatbot.prototype.escapeAttr = function (str) {
    return this.escapeHtml(str).replace(/\n/g, ' ');
  };

  ARDSChatbot.prototype.getContext = function () {
    var patient = window.dataStore && window.dataStore.getActivePatient ? window.dataStore.getActivePatient() : null;
    var session = window.dataStore && window.dataStore.getActiveSession ? window.dataStore.getActiveSession() : null;
    var baseline = (patient && patient.sessions && patient.sessions[0]) || session || null;
    var engine = window.ardsEngine || null;
    var score = null, scoreBand = null, fatigue = null, condition = null;
    var confidence = null, decision = null, xai = null;

    if (engine && session) {
      try {
        score = engine.calculateScore(session);
        scoreBand = engine.getScoreBand(score);
        fatigue = engine.getFatigueRisk(session.fatigue);
        if (engine.getConditionState) condition = engine.getConditionState(session, baseline, null);
        if (engine.getAIConfidence) confidence = engine.getAIConfidence(session, baseline);
        if (engine.evaluateDecisionAndSafety) decision = engine.evaluateDecisionAndSafety(session, baseline, null);
        if (engine.getXAIExplanation) xai = engine.getXAIExplanation(session, baseline);
      } catch (e) {
        console.warn('ARDS chatbot context error:', e);
      }
    }

    var allAlerts = (patient && patient.alerts) ? patient.alerts : [];
    var openAlerts = allAlerts.filter(function (a) { return !a.acknowledged; });

    return {
      patient: patient,
      session: session,
      baseline: baseline,
      score: score,
      scoreBand: scoreBand,
      fatigue: fatigue,
      condition: condition,
      confidence: confidence,
      decision: decision,
      xai: xai,
      openAlerts: openAlerts,
      allAlerts: allAlerts
    };
  };

  ARDSChatbot.prototype.pressureStatus = function (pressure) {
    if (pressure == null) return { label: 'unknown', detail: 'No pressure reading.' };
    if (pressure <= 50) return { label: 'safe', detail: 'Within typical safe operating range (\u226450 kPa).' };
    if (pressure <= 55) return { label: 'borderline', detail: 'Approaching the 55 kPa safety governor limit.' };
    if (pressure <= 65) return { label: 'elevated', detail: 'Above safe limit \u2014 monitor stump tissue closely.' };
    return { label: 'critical', detail: 'Critical pressure \u2014 skin breakdown risk; reduce loading immediately.' };
  };

  ARDSChatbot.prototype.trendSummary = function (patient) {
    if (!patient || !patient.sessions || patient.sessions.length < 2 || !window.ardsEngine) {
      return 'Not enough sessions yet to describe a trend.';
    }
    var sessions = patient.sessions;
    var first = sessions[0];
    var last = sessions[sessions.length - 1];
    var s0 = window.ardsEngine.calculateScore(first);
    var sN = window.ardsEngine.calculateScore(last);
    var delta = Number((sN - s0).toFixed(1));
    var gaitD = Number((last.gaitSpeed - first.gaitSpeed).toFixed(2));
    var symD = last.symmetry - first.symmetry;
    var fatD = last.fatigue - first.fatigue;
    var direction = delta > 2 ? 'improving' : (delta < -2 ? 'declining' : 'stable');
    return (
      'From session ' + first.session + ' \u2192 ' + last.session + ': rehab score ' + s0 +
      ' \u2192 **' + sN + '** (' + (delta >= 0 ? '+' : '') + delta + ', ' + direction + '). ' +
      'Gait ' + (gaitD >= 0 ? '+' : '') + gaitD + ' m/s, symmetry ' + (symD >= 0 ? '+' : '') +
      symD + '%, fatigue ' + (fatD >= 0 ? '+' : '') + fatD + '%.'
    );
  };

  ARDSChatbot.prototype.matches = function (q, keywords) {
    for (var i = 0; i < keywords.length; i++) {
      if (q.indexOf(keywords[i]) !== -1) return true;
    }
    return false;
  };

  ARDSChatbot.prototype.generateReply = function (raw) {
    var text = String(raw || '').trim();
    var q = text.toLowerCase();
    var ctx = this.getContext();

    if (this.matches(q, ['help', 'what can you', 'commands', 'how do i', 'examples'])) {
      return {
        text: HELP_TEXT,
        actions: [
          { label: 'Rehab score', ask: 'What is the rehab score?' },
          { label: 'Recommendation', ask: 'Clinical recommendation' },
          { label: 'Open alerts', tab: 'alerts' }
        ]
      };
    }
    if (this.matches(q, ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening']) || q === 'hi') {
      var name = ctx.patient && ctx.patient.name ? ' for **' + ctx.patient.name + '**' : '';
      return {
        text: 'Hi \u2014 ready to help' + name + '. ' + HELP_TEXT,
        actions: [
          { label: 'Patient overview', ask: 'Tell me about this patient' },
          { label: 'Rehab score', ask: 'What is the rehab score?' }
        ]
      };
    }
    if (this.matches(q, ['who are you', 'what are you', 'about ards', 'disclaimer'])) {
      return {
        text:
          'I\'m the **clinical assistant** for the **Adaptive Rehabilitation Decision Support System** \u2014 ' +
          'a research prototype chatbot wired to the dashboard. I read the active patient/session from local browser storage and the on-device ' +
          'scoring & safety engine. I am **not** a substitute for clinical judgment or primary diagnosis.',
        actions: [{ label: 'About page', tab: 'about' }]
      };
    }

    var nav = this.matchNavigation(q);
    if (nav) return nav;

    if (!ctx.patient) {
      return { text: 'No active patient is loaded. Select a patient from the dashboard header, then ask again.' };
    }

    if (this.matches(q, ['patient', 'profile', 'who is', 'demographics', 'amputation', 'prosthes', 'about this', 'tell me about'])) {
      return this.replyPatient(ctx);
    }
    if (this.matches(q, ['score', 'rehab', 'rehabilitation', 'rating', 'band'])) {
      return this.replyScore(ctx);
    }
    if (this.matches(q, ['fatigue', 'tired', 'exhaust', 'exertion'])) {
      return this.replyFatigue(ctx);
    }
    if (this.matches(q, ['pressure', 'socket', 'stump', 'kpa'])) {
      return this.replyPressure(ctx);
    }
    if (this.matches(q, ['gait', 'speed', 'velocity', 'walk', 'cadence'])) {
      return this.replyGait(ctx);
    }
    if (this.matches(q, ['symmetry', 'asymm', 'stance'])) {
      return this.replySymmetry(ctx);
    }
    if (this.matches(q, ['stability', 'stable', 'balance', 'fall'])) {
      return this.replyStability(ctx);
    }
    if (this.matches(q, ['force', 'loading', 'load control'])) {
      return this.replyForce(ctx);
    }
    if (this.matches(q, ['recommend', 'suggest', 'advice', 'what should', 'next step', 'decision', 'safety log', 'governor', 'override'])) {
      return this.replyRecommendation(ctx, q);
    }
    if (this.matches(q, ['alert', 'notification', 'warning', 'triage'])) {
      return this.replyAlerts(ctx);
    }
    if (this.matches(q, ['progress', 'trend', 'history', 'improv', 'over time', 'session history'])) {
      return this.replyProgress(ctx);
    }
    if (this.matches(q, ['session', 'current metrics', 'vitals', 'metrics', 'overview', 'summary', 'status'])) {
      return this.replySession(ctx);
    }
    if (this.matches(q, ['xai', 'explain', 'shap', 'why', 'contribution', 'confidence', 'ai model'])) {
      return this.replyXAI(ctx);
    }
    if (this.matches(q, ['condition', 'state', 'classif'])) {
      return this.replyCondition(ctx);
    }
    if (this.matches(q, ['weight', 'formula', 'how is score', 'calculate'])) {
      return {
        text:
          'Rehab score weights: **30% gait**, **25% stability**, **20% force**, **15% symmetry**, ' +
          '**10% inverse fatigue**. Gait speed (m/s) is scaled \u00d7100. Bands: Poor 0\u201340 \u00b7 Moderate 41\u201360 \u00b7 ' +
          'Improving 61\u201380 \u00b7 Good 81\u2013100. Safety governor can still override progression when pressure/fatigue breach limits.',
        actions: [{ label: 'About & formula', tab: 'about' }]
      };
    }
    if (this.matches(q, ['evaluat', 'clinical evaluation', 'reference standard', 'normative', 'benchmark', 'threshold', 'biomechanical eval', 'age bracket', 'standards', 'age norms'])) {
      return this.replyClinicalEvaluation(ctx);
    }

    return this.replyFallback(ctx, text);
  };

  ARDSChatbot.prototype.matchNavigation = function (q) {
    var map = [
      { keys: ['open alert', 'go to alert', 'show alert', 'alerts tab', 'open notifications'], tab: 'alerts', label: 'Alerts' },
      { keys: ['open report', 'go to report', 'clinical report', 'show report'], tab: 'reports', label: 'Clinical Reports' },
      { keys: ['open decision', 'safety log', 'go to decision', 'decision tab', 'open decision log'], tab: 'decision', label: 'Decision & Safety Log' },
      { keys: ['open xai', 'go to xai', 'explanation tab', 'what-if'], tab: 'xai', label: 'AI Explanation (XAI)' },
      { keys: ['open progress', 'analytics', 'go to progress', 'charts'], tab: 'progress', label: 'Progress & Analytics' },
      { keys: ['open upload', 'pipeline', 'import csv', 'data upload'], tab: 'upload', label: 'Data Upload & Pipeline' },
      { keys: ['open voice', 'language tab', 'microphone'], tab: 'voice', label: 'Voice & Language' },
      { keys: ['open home', 'session overview', 'dashboard home', 'go home'], tab: 'home', label: 'Session Overview' },
      { keys: ['open about', 'disclaimer page'], tab: 'about', label: 'About & Disclaimer' }
    ];
    for (var i = 0; i < map.length; i++) {
      var item = map[i];
      for (var k = 0; k < item.keys.length; k++) {
        if (q.indexOf(item.keys[k]) !== -1) {
          return {
            text: 'Opening **' + item.label + '**.',
            navigate: item.tab,
            actions: [{ label: 'Go to ' + item.label, tab: item.tab }]
          };
        }
      }
    }
    if (q.indexOf('switch to') !== -1 || q.indexOf('navigate to') !== -1 || q.indexOf('take me to') !== -1) {
      if (q.indexOf('alert') !== -1) return { text: 'Opening **Alerts**.', navigate: 'alerts' };
      if (q.indexOf('report') !== -1) return { text: 'Opening **Clinical Reports**.', navigate: 'reports' };
      if (q.indexOf('decision') !== -1 || q.indexOf('safety') !== -1) return { text: 'Opening **Decision & Safety Log**.', navigate: 'decision' };
      if (q.indexOf('xai') !== -1 || q.indexOf('explain') !== -1) return { text: 'Opening **AI Explanation**.', navigate: 'xai' };
      if (q.indexOf('progress') !== -1 || q.indexOf('chart') !== -1) return { text: 'Opening **Progress & Analytics**.', navigate: 'progress' };
      if (q.indexOf('upload') !== -1 || q.indexOf('pipeline') !== -1) return { text: 'Opening **Data Upload**.', navigate: 'upload' };
      if (q.indexOf('voice') !== -1) return { text: 'Opening **Voice & Language**.', navigate: 'voice' };
      if (q.indexOf('home') !== -1 || q.indexOf('overview') !== -1) return { text: 'Opening **Session Overview**.', navigate: 'home' };
    }
    return null;
  };

  ARDSChatbot.prototype.replyPatient = function (ctx) {
    var p = ctx.patient;
    var n = (p.sessions && p.sessions.length) || 0;
    var sessLine = ctx.session
      ? ' \u00b7 active session **' + ctx.session.session + '** (' + (ctx.session.date || 'n/a') + ')'
      : '';
    return {
      text:
        '**' + p.name + '** (`' + p.id + '`) \u00b7 age ' + p.age + '\n' +
        '\u2022 Amputation: ' + p.amputationType + ' (date ' + (p.amputationDate || 'n/a') + ')\n' +
        '\u2022 Prosthesis: ' + p.prosthesis + '\n' +
        '\u2022 Clinician: ' + p.clinician + '\n' +
        '\u2022 Goal: ' + p.rehabGoal + '\n' +
        '\u2022 Sessions on file: **' + n + '**' + sessLine,
      actions: [
        { label: 'Session metrics', ask: 'Current session summary' },
        { label: 'Progress trend', ask: 'How is progress trending?' },
        { label: 'Home overview', tab: 'home' }
      ]
    };
  };

  ARDSChatbot.prototype.replySession = function (ctx) {
    var s = ctx.session;
    if (!s) return { text: 'Patient **' + ctx.patient.name + '** has no session records yet.' };
    var press = this.pressureStatus(s.pressure);
    var scoreLine = ctx.score != null
      ? 'Rehab score **' + ctx.score + '/100** (' + ((ctx.scoreBand && ctx.scoreBand.label) || 'n/a') + ' band)'
      : 'Rehab score unavailable';
    var cond = (ctx.condition && ctx.condition.state) ? ' \u00b7 condition **' + ctx.condition.state + '**' : '';
    return {
      text:
        '**Session ' + s.session + '** (' + (s.date || 'n/a') + ') for ' + ctx.patient.name + '\n' +
        '\u2022 ' + scoreLine + cond + '\n' +
        '\u2022 Gait **' + s.gaitSpeed + ' m/s** \u00b7 Symmetry **' + s.symmetry + '%** \u00b7 Force **' + s.force + '%**\n' +
        '\u2022 Stability **' + s.stability + '%** \u00b7 Fatigue **' + s.fatigue + '%** (' +
        ((ctx.fatigue && ctx.fatigue.level) || 'n/a') + ')\n' +
        '\u2022 Socket pressure **' + s.pressure + ' kPa** (' + press.label + ') \u2014 ' + press.detail,
      actions: [
        { label: 'Recommendation', ask: 'Clinical recommendation' },
        { label: 'Session overview', tab: 'home' }
      ]
    };
  };

  ARDSChatbot.prototype.replyScore = function (ctx) {
    if (!ctx.session || ctx.score == null) {
      return { text: 'No active session available to compute a rehab score.' };
    }
    var band = ctx.scoreBand;
    return {
      text:
        'Rehabilitation score for **' + ctx.patient.name + '** (session ' + ctx.session.session + '): ' +
        '**' + ctx.score + '/100** \u2014 **' + ((band && band.label) || 'n/a') + '** band' +
        (band && band.range ? ' (' + band.range + ')' : '') +
        (band && band.desc ? '.\n' + band.desc : '.'),
      actions: [
        { label: 'Explain drivers (XAI)', tab: 'xai' },
        { label: 'Progress chart', tab: 'progress' }
      ]
    };
  };

  ARDSChatbot.prototype.replyFatigue = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var f = ctx.fatigue;
    return {
      text:
        'Fatigue exertion is **' + ctx.session.fatigue + '%** \u2192 risk **' +
        ((f && f.level) || 'n/a') + '**' +
        (f && f.text ? ' (' + f.text + ')' : '') +
        (f && f.advice ? '.\nAdvice: ' + f.advice : '.'),
      actions: [
        { label: 'Safety decision', ask: 'Clinical recommendation' },
        { label: 'Session overview', tab: 'home' }
      ]
    };
  };

  ARDSChatbot.prototype.replyPressure = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var press = this.pressureStatus(ctx.session.pressure);
    var flag = (ctx.decision && ctx.decision.safetyFlag)
      ? '\nSafety flag: **' + ctx.decision.safetyFlag + '**' : '';
    var action = (ctx.decision && ctx.decision.safetyAction)
      ? '\nGovernor: ' + ctx.decision.safetyAction : '';
    return {
      text:
        'Socket pressure is **' + ctx.session.pressure + ' kPa** \u2014 status **' + press.label +
        '**. ' + press.detail + flag + action,
      actions: [
        { label: 'Decision & safety log', tab: 'decision' },
        { label: 'Recommendation', ask: 'Clinical recommendation' }
      ]
    };
  };

  ARDSChatbot.prototype.replyGait = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var base = (ctx.baseline && ctx.baseline !== ctx.session)
      ? ' Baseline session ' + ctx.baseline.session + ' was ' + ctx.baseline.gaitSpeed + ' m/s.'
      : '';
    return {
      text: 'Gait velocity is **' + ctx.session.gaitSpeed + ' m/s** (session ' + ctx.session.session + ').' + base,
      actions: [{ label: 'Progress charts', tab: 'progress' }]
    };
  };

  ARDSChatbot.prototype.replySymmetry = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var s = ctx.session.symmetry;
    var note = s < 50
      ? 'Below the 50% minimum acceptable symmetry threshold used by the safety engine.'
      : (s < 70
        ? 'Moderate asymmetry \u2014 continue supervised gait retraining.'
        : 'Good stance symmetry for community ambulation goals.');
    return {
      text: 'Stance symmetry is **' + s + '%**. ' + note,
      actions: [{ label: 'Session overview', tab: 'home' }]
    };
  };

  ARDSChatbot.prototype.replyStability = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    return {
      text: 'Stability index is **' + ctx.session.stability + '%** (weighted 25% of the rehab score).',
      actions: [{ label: 'XAI contributions', tab: 'xai' }]
    };
  };

  ARDSChatbot.prototype.replyForce = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    return {
      text: 'Force control is **' + ctx.session.force + '%** (weighted 20% of the rehab score).',
      actions: [{ label: 'Progress charts', tab: 'progress' }]
    };
  };

  ARDSChatbot.prototype.replyRecommendation = function (ctx, q) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var d = ctx.decision;
    if (!d) {
      return { text: 'Decision engine is unavailable right now. Open the Decision & Safety Log tab for details.' };
    }
    var wantLog = this.matches(q, ['log', 'rule', 'governor', 'override', 'matrix']);
    var text =
      '**Clinical recommendation** (rule `' + (d.matchedRuleId || 'n/a') + '`):\n' +
      (d.finalRecommendation || 'Requires clinician review.');
    if (d.overrideTriggered) {
      text += '\n\u26a0 Safety override **triggered** \u2014 flag **' + (d.safetyFlag || 'n/a') + '**. ' +
        (d.safetyAction || '');
    } else if (d.safetyFlag) {
      text += '\nSafety flag: **' + d.safetyFlag + '**. ' + (d.safetyAction || '');
    }
    if (wantLog && d.ruleDescription) {
      text += '\nRule rationale: ' + d.ruleDescription;
    }
    return {
      text: text,
      navigate: wantLog ? 'decision' : undefined,
      actions: [
        { label: 'Inspect decision log', tab: 'decision' },
        { label: 'Session overview', tab: 'home' }
      ]
    };
  };

  ARDSChatbot.prototype.replyAlerts = function (ctx) {
    var open = ctx.openAlerts || [];
    var all = ctx.allAlerts || [];
    if (all.length === 0) {
      return {
        text: 'No alerts on file for **' + ctx.patient.name + '**.',
        actions: [{ label: 'Alerts tab', tab: 'alerts' }]
      };
    }
    if (open.length === 0) {
      return {
        text: 'All **' + all.length + '** alert(s) for **' + ctx.patient.name +
          '** are acknowledged. Nothing pending in the triage feed.',
        actions: [{ label: 'View alert history', tab: 'alerts' }]
      };
    }
    var lines = open.slice(0, 4).map(function (a, i) {
      return (i + 1) + '. **[' + String(a.type || 'info').toUpperCase() + ']** ' + a.title +
        (a.message ? ' \u2014 ' + a.message : '');
    });
    var more = open.length > 4 ? '\n\u2026and ' + (open.length - 4) + ' more.' : '';
    return {
      text: '**' + open.length + ' open alert(s)** for ' + ctx.patient.name + ':\n' + lines.join('\n') + more,
      navigate: 'alerts',
      actions: [{ label: 'Open alerts feed', tab: 'alerts' }]
    };
  };

  ARDSChatbot.prototype.replyProgress = function (ctx) {
    var trend = this.trendSummary(ctx.patient);
    var n = (ctx.patient.sessions && ctx.patient.sessions.length) || 0;
    return {
      text: 'Progress for **' + ctx.patient.name + '** (' + n + ' session' + (n === 1 ? '' : 's') + '):\n' + trend,
      actions: [
        { label: 'Open analytics', tab: 'progress' },
        { label: 'Session scores table', tab: 'progress' }
      ]
    };
  };

  ARDSChatbot.prototype.replyCondition = function (ctx) {
    if (!ctx.condition) return this.replySession(ctx);
    return {
      text:
        'Condition classification: **' + ctx.condition.state + '**' +
        (ctx.condition.reason ? '\n' + ctx.condition.reason : '') +
        (ctx.score != null
          ? '\nCurrent rehab score **' + ctx.score + '/100** (' +
            ((ctx.scoreBand && ctx.scoreBand.label) || 'n/a') + ').'
          : ''),
      actions: [{ label: 'Session overview', tab: 'home' }]
    };
  };

  ARDSChatbot.prototype.extractContributions = function (xai) {
    if (!xai) return [];
    var out = [];
    function push(name, value) {
      var n = Number(value);
      if (name && !isNaN(n)) out.push({ name: name, value: Number(n.toFixed(2)) });
    }
    if (Array.isArray(xai)) {
      xai.forEach(function (item) {
        push(item.name || item.feature || item.label, item.value != null ? item.value : (item.contribution != null ? item.contribution : item.shap));
      });
    } else if (Array.isArray(xai.contributions)) {
      xai.contributions.forEach(function (item) {
        push(item.name || item.feature || item.label, item.value != null ? item.value : item.contribution);
      });
    } else if (typeof xai === 'object') {
      Object.keys(xai).forEach(function (k) {
        var v = xai[k];
        if (typeof v === 'number') push(k, v);
        else if (v && typeof v === 'object') {
          var val = v.value != null ? v.value : v.contribution;
          if (typeof val === 'number') push(v.name || k, val);
        }
      });
    }
    return out;
  };

  ARDSChatbot.prototype.replyXAI = function (ctx) {
    if (!ctx.session) return { text: 'No active session loaded.' };
    var confVal = ctx.confidence && ctx.confidence.value != null ? ctx.confidence.value : 'n/a';
    var confRating = (ctx.confidence && (ctx.confidence.rating || ctx.confidence.label)) || 'n/a';
    var text = 'AI confidence on the active session: **' + confVal + '%** (' + confRating + ').';
    if (ctx.confidence && ctx.confidence.description) text += '\n' + ctx.confidence.description;

    var contribs = this.extractContributions(ctx.xai);
    if (contribs.length) {
      var top = contribs
        .slice()
        .sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); })
        .slice(0, 4)
        .map(function (c) {
          return '\u2022 ' + c.name + ': **' + (c.value > 0 ? '+' : '') + c.value + '**';
        })
        .join('\n');
      text += '\nTop drivers:\n' + top;
    } else {
      text += '\nOpen the XAI tab for signed feature contributions and the what-if simulator.';
    }
    return {
      text: text,
      navigate: 'xai',
      actions: [{ label: 'Open XAI panel', tab: 'xai' }]
    };
  };

  ARDSChatbot.prototype.replyClinicalEvaluation = function (ctx) {
    if (!ctx.patient || !ctx.session) {
      return { text: 'No active patient and session telemetry loaded to evaluate against clinical thresholds.' };
    }
    var refs = window.ardsClinicalRefs;
    if (refs && typeof refs.evaluateSessionTelemetry === 'function') {
      var evalResult = refs.evaluateSessionTelemetry(ctx.patient, ctx.session);
      return {
        text: evalResult.formattedMarkdown,
        actions: [
          { label: 'Printable Clinical Report', tab: 'reports' },
          { label: 'Decision & Safety Log', tab: 'decision' },
          { label: 'AI Interpretability (XAI)', tab: 'xai' }
        ]
      };
    }
    return { text: 'Clinical reference evaluation engine is currently unavailable.' };
  };

  ARDSChatbot.prototype.replyFallback = function (ctx, original) {
    var bits = [];
    if (ctx.patient) bits.push('active patient **' + ctx.patient.name + '** (`' + ctx.patient.id + '`)');
    if (ctx.session && ctx.score != null) {
      bits.push('session ' + ctx.session.session + ' score **' + ctx.score + '/100** (' +
        ((ctx.scoreBand && ctx.scoreBand.label) || 'n/a') + ')');
    }
    var ctxLine = bits.length ? ' Right now I see ' + bits.join(', ') + '.' : '';
    return {
      text:
        'I\'m not sure how to answer "' + original + '".' + ctxLine + '\n' + HELP_TEXT,
      actions: [
        { label: 'Help', ask: 'help' },
        { label: 'Session summary', ask: 'Current session summary' },
        { label: 'Rehab score', ask: 'What is the rehab score?' }
      ]
    };
  };

  if (typeof window !== 'undefined') {
    window.ardsChatbot = new ARDSChatbot();
  }
})();
