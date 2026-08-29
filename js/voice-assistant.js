/**
 * ARDS Voice Assistant Module
 * Multi-language support for voice-based interaction
 */

class ARDSVoiceAssistant {
  constructor() {
    this.currentLanguage = localStorage.getItem('ards_voice_language') || 'en-US';
    this.voiceEnabled = localStorage.getItem('ards_voice_enabled') !== 'false';
    this.speechSynthesis = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.languages = {
      'en-US': { 
        name: 'English (US)',
        flag: '🇺🇸',
        voices: ['en-US']
      },
      'en-GB': { 
        name: 'English (UK)',
        flag: '🇬🇧',
        voices: ['en-GB', 'en-UK']
      },
      'es-ES': { 
        name: 'Spanish',
        flag: '🇪🇸',
        voices: ['es-ES']
      },
      'fr-FR': { 
        name: 'French',
        flag: '🇫🇷',
        voices: ['fr-FR']
      },
      'de-DE': { 
        name: 'German',
        flag: '🇩🇪',
        voices: ['de-DE']
      },
      'pt-BR': { 
        name: 'Portuguese (BR)',
        flag: '🇧🇷',
        voices: ['pt-BR']
      },
      'it-IT': { 
        name: 'Italian',
        flag: '🇮🇹',
        voices: ['it-IT']
      },
      'ja-JP': { 
        name: 'Japanese',
        flag: '🇯🇵',
        voices: ['ja-JP']
      },
      'zh-CN': { 
        name: 'Simplified Chinese',
        flag: '🇨🇳',
        voices: ['zh-CN', 'zh']
      },
      'ar-SA': { 
        name: 'Arabic',
        flag: '🇸🇦',
        voices: ['ar-SA']
      }
    };

    this.translations = {
      'en-US': {
        title: 'Voice Assistant',
        toggleListening: 'Start Listening',
        stopListening: 'Stop Listening',
        selectLanguage: 'Select Language',
        voiceEnabled: 'Voice Enabled',
        voiceDisabled: 'Voice Disabled',
        micPermissionDenied: 'Microphone permission denied',
        noSpeechDetected: 'No speech detected',
        listeningIndicator: 'Listening...',
        sessionQuery: 'Tell me about the current session',
        scoreQuery: 'What is the rehabilitation score?',
        fatigueQuery: 'Check fatigue level',
        pressureQuery: 'Alert me to pressure changes',
        recommendationQuery: 'Give me a clinical recommendation',
        searchPatient: 'Search for a patient'
      },
      'es-ES': {
        title: 'Asistente de Voz',
        toggleListening: 'Comenzar a Escuchar',
        stopListening: 'Dejar de Escuchar',
        selectLanguage: 'Seleccionar Idioma',
        voiceEnabled: 'Voz Habilitada',
        voiceDisabled: 'Voz Deshabilitada',
        micPermissionDenied: 'Permiso de micrófono denegado',
        noSpeechDetected: 'No se detectó voz',
        listeningIndicator: 'Escuchando...',
        sessionQuery: 'Cuéntame sobre la sesión actual',
        scoreQuery: '¿Cuál es la puntuación de rehabilitación?',
        fatigueQuery: 'Verificar nivel de fatiga',
        pressureQuery: 'Alertarme sobre cambios de presión',
        recommendationQuery: 'Dame una recomendación clínica',
        searchPatient: 'Buscar un paciente'
      },
      'fr-FR': {
        title: 'Assistant Vocal',
        toggleListening: 'Commencer à Écouter',
        stopListening: 'Arrêter d\'Écouter',
        selectLanguage: 'Sélectionner la Langue',
        voiceEnabled: 'Voix Activée',
        voiceDisabled: 'Voix Désactivée',
        micPermissionDenied: 'Permission du microphone refusée',
        noSpeechDetected: 'Aucune parole détectée',
        listeningIndicator: 'Écoute...',
        sessionQuery: 'Parlez-moi de la session actuelle',
        scoreQuery: 'Quel est le score de réadaptation ?',
        fatigueQuery: 'Vérifier le niveau de fatigue',
        pressureQuery: 'M\'alerter sur les changements de pression',
        recommendationQuery: 'Donnez-moi une recommandation clinique',
        searchPatient: 'Rechercher un patient'
      },
      'de-DE': {
        title: 'Sprachassistent',
        toggleListening: 'Abhören Starten',
        stopListening: 'Abhören Beenden',
        selectLanguage: 'Sprache Wählen',
        voiceEnabled: 'Sprache Aktiviert',
        voiceDisabled: 'Sprache Deaktiviert',
        micPermissionDenied: 'Mikrofonberechtigung verweigert',
        noSpeechDetected: 'Keine Sprache erkannt',
        listeningIndicator: 'Abhören...',
        sessionQuery: 'Erzählen Sie mir von der aktuellen Sitzung',
        scoreQuery: 'Wie ist der Rehabilitationsergebnis?',
        fatigueQuery: 'Müdigkeitsniveau überprüfen',
        pressureQuery: 'Warnen Sie mich vor Druckänderungen',
        recommendationQuery: 'Geben Sie mir eine klinische Empfehlung',
        searchPatient: 'Nach einem Patienten suchen'
      },
      'pt-BR': {
        title: 'Assistente de Voz',
        toggleListening: 'Começar a Ouvir',
        stopListening: 'Parar de Ouvir',
        selectLanguage: 'Selecionar Idioma',
        voiceEnabled: 'Voz Ativada',
        voiceDisabled: 'Voz Desativada',
        micPermissionDenied: 'Permissão do microfone negada',
        noSpeechDetected: 'Nenhuma fala detectada',
        listeningIndicator: 'Ouvindo...',
        sessionQuery: 'Conte-me sobre a sessão atual',
        scoreQuery: 'Qual é a pontuação de reabilitação?',
        fatigueQuery: 'Verificar nível de fadiga',
        pressureQuery: 'Alerte-me sobre mudanças de pressão',
        recommendationQuery: 'Dê-me uma recomendação clínica',
        searchPatient: 'Procurar um paciente'
      }
    };

    this.init();
  }

  init() {
    this.setupSpeechRecognition();
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateListeningUI(true);
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.processVoiceCommand(finalTranscript.trim());
      }

      this.updateTranscriptDisplay(finalTranscript || interimTranscript);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.handleRecognitionError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateListeningUI(false);
    };
  }

  toggleListening() {
    if (!this.recognition) {
      alert('Speech Recognition not supported');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.lang = this.currentLanguage;
      this.recognition.start();
    }
  }

  setLanguage(langCode) {
    if (this.languages[langCode]) {
      this.currentLanguage = langCode;
      localStorage.setItem('ards_voice_language', langCode);
      if (this.recognition) {
        this.recognition.lang = langCode;
      }
      return true;
    }
    return false;
  }

  speak(text) {
    if (!this.voiceEnabled || !this.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.currentLanguage;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;

    this.speechSynthesis.cancel();
    this.speechSynthesis.speak(utterance);
  }

  processVoiceCommand(transcript) {
    const commandLower = transcript.toLowerCase();
    const response = this.matchVoiceCommand(commandLower);
    
    if (response) {
      this.speak(response.text);
      if (response.action) {
        response.action();
      }
    }
  }

  matchVoiceCommand(transcript) {
    // Session-related commands
    if (transcript.includes('session') || transcript.includes('current')) {
      const patient = window.dataStore?.getActivePatient();
      const session = window.dataStore?.getActiveSession();
      if (patient && session) {
        const score = window.ardsEngine?.calculateScore(session) || 0;
        return {
          text: this.translate('sessionQuery') + `. Current score: ${score}`,
          action: () => window.ardsApp?.switchTab('home')
        };
      }
    }

    // Score-related commands
    if (transcript.includes('score') || transcript.includes('rehabilitation')) {
      const session = window.dataStore?.getActiveSession();
      if (session) {
        const score = window.ardsEngine?.calculateScore(session) || 0;
        const band = window.ardsEngine?.getScoreBand(score);
        return {
          text: `${this.translate('scoreQuery')}. The score is ${score} out of 100, in the ${band?.label || 'standard'} band.`,
          action: () => window.ardsApp?.switchTab('home')
        };
      }
    }

    // Fatigue-related commands
    if (transcript.includes('fatigue') || transcript.includes('tired') || transcript.includes('exhaustion')) {
      const session = window.dataStore?.getActiveSession();
      if (session) {
        const fatigue = window.ardsEngine?.getFatigueRisk(session.fatigue);
        return {
          text: `Fatigue level is ${session.fatigue}%. Risk level: ${fatigue?.level || 'normal'}.`,
          action: () => window.ardsApp?.switchTab('home')
        };
      }
    }

    // Pressure-related commands
    if (transcript.includes('pressure') || transcript.includes('socket')) {
      const session = window.dataStore?.getActiveSession();
      if (session) {
        const status = session.pressure <= 50 ? 'safe' : (session.pressure <= 60 ? 'elevated' : 'critical');
        return {
          text: `Socket pressure is ${session.pressure} kilopascals. Status: ${status}.`,
          action: () => window.ardsApp?.switchTab('home')
        };
      }
    }

    // Recommendation-related commands
    if (transcript.includes('recommendation') || transcript.includes('suggest') || transcript.includes('advice')) {
      const session = window.dataStore?.getActiveSession();
      const patient = window.dataStore?.getActivePatient();
      if (session && patient) {
        const baseline = patient.sessions?.[0] || session;
        const decision = window.ardsEngine?.evaluateDecisionAndSafety(session, baseline, null);
        return {
          text: decision?.finalRecommendation || 'Recommendation requires clinical review.',
          action: () => window.ardsApp?.switchTab('decision')
        };
      }
    }

    // Navigation commands
    if (transcript.includes('alert') || transcript.includes('notification')) {
      return {
        text: 'Opening alerts and notifications.',
        action: () => window.ardsApp?.switchTab('alerts')
      };
    }

    if (transcript.includes('report') || transcript.includes('document')) {
      return {
        text: 'Opening clinical reports.',
        action: () => window.ardsApp?.switchTab('reports')
      };
    }

    if (transcript.includes('patient') || transcript.includes('profile')) {
      return {
        text: 'Showing patient overview.',
        action: () => window.ardsApp?.switchTab('home')
      };
    }

    return null;
  }

  translate(key) {
    const langTranslations = this.translations[this.currentLanguage] || this.translations['en-US'];
    return langTranslations[key] || key;
  }

  updateListeningUI(isListening) {
    const btn = document.getElementById('voiceAssistantBtn');
    if (btn) {
      if (isListening) {
        btn.classList.add('bg-red-500', 'animate-pulse');
        btn.classList.remove('bg-sky-600');
        btn.title = this.translate('stopListening');
      } else {
        btn.classList.remove('bg-red-500', 'animate-pulse');
        btn.classList.add('bg-sky-600');
        btn.title = this.translate('toggleListening');
      }
    }

    const indicator = document.getElementById('listeningIndicator');
    if (indicator) {
      indicator.textContent = isListening ? this.translate('listeningIndicator') : '';
    }
  }

  updateTranscriptDisplay(text) {
    const display = document.getElementById('voiceTranscript');
    if (display && text) {
      display.textContent = text;
      display.classList.remove('hidden');
    }
  }

  handleRecognitionError(error) {
    let errorMessage = error;
    
    if (error === 'no-speech') {
      errorMessage = this.translate('noSpeechDetected');
    } else if (error === 'network') {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error === 'permission-denied') {
      errorMessage = this.translate('micPermissionDenied');
    }

    const display = document.getElementById('voiceTranscript');
    if (display) {
      display.textContent = errorMessage;
      display.classList.remove('hidden');
    }
  }

  getLanguageList() {
    return Object.entries(this.languages).map(([code, data]) => ({
      code,
      name: data.name,
      flag: data.flag
    }));
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = enabled;
    localStorage.setItem('ards_voice_enabled', enabled ? 'true' : 'false');
  }
}

// Initialize voice assistant
if (typeof window !== 'undefined') {
  window.ardsVoiceAssistant = new ARDSVoiceAssistant();
}
