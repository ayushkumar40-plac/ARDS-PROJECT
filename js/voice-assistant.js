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
    this.currentVoice = localStorage.getItem('ards_voice_voice') || null;
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
      },
      'hi-IN': {
        name: 'Hindi',
        flag: '🇮🇳',
        voices: ['hi-IN']
      },
      'ta-IN': {
        name: 'Tamil',
        flag: '🇮🇳',
        voices: ['ta-IN']
      },
      'te-IN': {
        name: 'Telugu',
        flag: '🇮🇳',
        voices: ['te-IN']
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
        languageChanged: 'Language changed. I will now reply in the selected language.',
        sessionQuery: 'Tell me about the current session',
        scoreQuery: 'What is the rehabilitation score?',
        fatigueQuery: 'Check fatigue level',
        pressureQuery: 'Alert me to pressure changes',
        recommendationQuery: 'Give me a clinical recommendation',
        searchPatient: 'Search for a patient',
        alertsQuery: 'Show me the alerts',
        reportsQuery: 'Open the clinical reports',
        patientQuery: 'Show the patient overview',
        sessionResponse: 'Current score: {score}. Opening the patient overview.',
        scoreResponse: 'The score is {score} out of 100, in the {band} band.',
        fatigueResponse: 'Fatigue level is {value} percent. Risk level: {level}.',
        pressureResponse: 'Socket pressure is {value} kilopascals. Status: {status}.',
        recommendationFallback: 'Recommendation requires clinical review.',
        alertsOpening: 'Opening alerts and notifications.',
        reportsOpening: 'Opening clinical reports.',
        patientOpening: 'Showing patient overview.',
        noSessionResponse: 'No active session. Please select a patient first.',
        noMatchResponse: 'Sorry, I did not understand. Try one of the suggested voice commands.',
        networkError: 'Network error. Please check your connection.',
        recognitionUnsupported: 'Speech Recognition is not supported in this browser.',
        statusSafe: 'safe', statusElevated: 'elevated', statusCritical: 'critical',
        riskLow: 'low', riskMedium: 'medium', riskHigh: 'high',
        bandGood: 'Good', bandImproving: 'Improving', bandModerate: 'Moderate', bandPoor: 'Poor',
        cmdSession: 'Session', cmdScore: 'Score', cmdFatigue: 'Fatigue', cmdPressure: 'Pressure',
        cmdRecommendation: 'Recommendation', cmdAlerts: 'Alerts', cmdReports: 'Reports', cmdPatient: 'Patient',
        commands: {
          session: ['session', 'current', 'progress'],
          score: ['score', 'rehabilitation', 'rehab', 'band'],
          fatigue: ['fatigue', 'tired', 'exhaustion'],
          pressure: ['pressure', 'socket'],
          recommendation: ['recommendation', 'recommend', 'suggest', 'advice'],
          alerts: ['alert', 'alerts', 'notification', 'warning'],
          reports: ['report', 'reports', 'document', 'summary'],
          patient: ['patient', 'profile', 'overview']
        }
      },
      'en-GB': {
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
        searchPatient: 'Search for a patient',
        alertsQuery: 'Show me the alerts',
        reportsQuery: 'Open the clinical reports',
        patientQuery: 'Show the patient overview',
        sessionResponse: 'Current score: {score}. Opening the patient overview.',
        scoreResponse: 'The score is {score} out of 100, in the {band} band.',
        fatigueResponse: 'Fatigue level is {value} percent. Risk level: {level}.',
        pressureResponse: 'Socket pressure is {value} kilopascals. Status: {status}.',
        recommendationFallback: 'Recommendation requires clinical review.',
        alertsOpening: 'Opening alerts and notifications.',
        reportsOpening: 'Opening clinical reports.',
        patientOpening: 'Showing patient overview.',
        noSessionResponse: 'No active session. Please select a patient first.',
        noMatchResponse: 'Sorry, I did not understand. Try one of the suggested voice commands.',
        networkError: 'Network error. Please check your connection.',
        recognitionUnsupported: 'Speech Recognition is not supported in this browser.',
        statusSafe: 'safe', statusElevated: 'elevated', statusCritical: 'critical',
        riskLow: 'low', riskMedium: 'medium', riskHigh: 'high',
        bandGood: 'Good', bandImproving: 'Improving', bandModerate: 'Moderate', bandPoor: 'Poor',
        cmdSession: 'Session', cmdScore: 'Score', cmdFatigue: 'Fatigue', cmdPressure: 'Pressure',
        cmdRecommendation: 'Recommendation', cmdAlerts: 'Alerts', cmdReports: 'Reports', cmdPatient: 'Patient',
        commands: {
          session: ['session', 'current', 'progress'],
          score: ['score', 'rehabilitation', 'rehab', 'band'],
          fatigue: ['fatigue', 'tired', 'exhaustion'],
          pressure: ['pressure', 'socket'],
          recommendation: ['recommendation', 'recommend', 'suggest', 'advice'],
          alerts: ['alert', 'alerts', 'notification', 'warning'],
          reports: ['report', 'reports', 'document', 'summary'],
          patient: ['patient', 'profile', 'overview']
        }
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
        searchPatient: 'Buscar un paciente',
        alertsQuery: 'Muéstrame las alertas',
        reportsQuery: 'Abre los informes clínicos',
        patientQuery: 'Muestra el resumen del paciente',
        sessionResponse: 'Puntuación actual: {score}. Abriendo el resumen del paciente.',
        scoreResponse: 'La puntuación es {score} de 100, en la banda {band}.',
        fatigueResponse: 'El nivel de fatiga es {value} por ciento. Nivel de riesgo: {level}.',
        pressureResponse: 'La presión del socket es {value} kilopascales. Estado: {status}.',
        recommendationFallback: 'La recomendación requiere revisión clínica.',
        alertsOpening: 'Abriendo alertas y notificaciones.',
        reportsOpening: 'Abriendo los informes clínicos.',
        patientOpening: 'Mostrando el resumen del paciente.',
        noSessionResponse: 'No hay ninguna sesión activa. Seleccione primero un paciente.',
        noMatchResponse: 'Lo siento, no entendí. Prueba uno de los comandos de voz sugeridos.',
        networkError: 'Error de red. Comprueba tu conexión.',
        recognitionUnsupported: 'El reconocimiento de voz no es compatible con este navegador.',
        statusSafe: 'seguro', statusElevated: 'elevado', statusCritical: 'crítico',
        riskLow: 'bajo', riskMedium: 'medio', riskHigh: 'alto',
        bandGood: 'Buena', bandImproving: 'Mejorando', bandModerate: 'Moderada', bandPoor: 'Baja',
        cmdSession: 'Sesión', cmdScore: 'Puntuación', cmdFatigue: 'Fatiga', cmdPressure: 'Presión',
        cmdRecommendation: 'Recomendación', cmdAlerts: 'Alertas', cmdReports: 'Informes', cmdPatient: 'Paciente',
        commands: {
          session: ['sesión', 'sesion', 'actual', 'progreso'],
          score: ['puntuación', 'puntuacion', 'puntaje', 'rehabilitación', 'rehabilitacion'],
          fatigue: ['fatiga', 'cansancio', 'agotamiento'],
          pressure: ['presión', 'presion', 'socket', 'soquete'],
          recommendation: ['recomendación', 'recomendacion', 'sugerencia', 'consejo'],
          alerts: ['alerta', 'alertas', 'aviso', 'notificación', 'notificacion'],
          reports: ['informe', 'informes', 'documento'],
          patient: ['paciente', 'perfil', 'resumen del paciente']
        }
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
        searchPatient: 'Rechercher un patient',
        alertsQuery: 'Montrez-moi les alertes',
        reportsQuery: 'Ouvrez les rapports cliniques',
        patientQuery: "Affichez l'aperçu du patient",
        sessionResponse: 'Score actuel : {score}. Ouverture de l\'aperçu du patient.',
        scoreResponse: 'Le score est de {score} sur 100, dans la bande {band}.',
        fatigueResponse: 'Le niveau de fatigue est de {value} pour cent. Niveau de risque : {level}.',
        pressureResponse: 'La pression du socket est de {value} kilopascals. État : {status}.',
        recommendationFallback: 'La recommandation nécessite une revue clinique.',
        alertsOpening: 'Ouverture des alertes et notifications.',
        reportsOpening: 'Ouverture des rapports cliniques.',
        patientOpening: "Affichage de l'aperçu du patient.",
        noSessionResponse: "Aucune séance active. Veuillez d'abord sélectionner un patient.",
        noMatchResponse: "Désolé, je n'ai pas compris. Essayez l'une des commandes vocales suggérées.",
        networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
        recognitionUnsupported: "La reconnaissance vocale n'est pas prise en charge par ce navigateur.",
        statusSafe: 'sûr', statusElevated: 'élevé', statusCritical: 'critique',
        riskLow: 'faible', riskMedium: 'moyen', riskHigh: 'élevé',
        bandGood: 'Bonne', bandImproving: 'En amélioration', bandModerate: 'Modérée', bandPoor: 'Faible',
        cmdSession: 'Séance', cmdScore: 'Score', cmdFatigue: 'Fatigue', cmdPressure: 'Pression',
        cmdRecommendation: 'Recommandation', cmdAlerts: 'Alertes', cmdReports: 'Rapports', cmdPatient: 'Patient',
        commands: {
          session: ['séance', 'session', 'actuelle', 'actuel', 'progression'],
          score: ['score', 'réadaptation', 'rééducation'],
          fatigue: ['fatigue', 'fatigué', 'épuisement'],
          pressure: ['pression', 'socket', 'manchon'],
          recommendation: ['recommandation', 'suggestion', 'conseil'],
          alerts: ['alerte', 'alertes', 'notification', 'avertissement'],
          reports: ['rapport', 'rapports', 'document', 'compte rendu'],
          patient: ['patient', 'profil', 'aperçu']
        }
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
        searchPatient: 'Nach einem Patienten suchen',
        alertsQuery: 'Zeig mir die Warnungen',
        reportsQuery: 'Öffne die klinischen Berichte',
        patientQuery: 'Zeig die Patientenübersicht',
        sessionResponse: 'Aktuelle Punktzahl: {score}. Patientenübersicht wird geöffnet.',
        scoreResponse: 'Die Punktzahl ist {score} von 100, im Bereich {band}.',
        fatigueResponse: 'Das Müdigkeitsniveau liegt bei {value} Prozent. Risikostufe: {level}.',
        pressureResponse: 'Der Socketdruck beträgt {value} Kilopascal. Status: {status}.',
        recommendationFallback: 'Die Empfehlung erfordert eine klinische Überprüfung.',
        alertsOpening: 'Warnungen und Benachrichtigungen werden geöffnet.',
        reportsOpening: 'Klinische Berichte werden geöffnet.',
        patientOpening: 'Patientenübersicht wird angezeigt.',
        noSessionResponse: 'Keine aktive Sitzung. Bitte wählen Sie zuerst einen Patienten aus.',
        noMatchResponse: 'Entschuldigung, ich habe das nicht verstanden. Versuchen Sie einen der vorgeschlagenen Sprachbefehle.',
        networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
        recognitionUnsupported: 'Spracherkennung wird von diesem Browser nicht unterstützt.',
        statusSafe: 'sicher', statusElevated: 'erhöht', statusCritical: 'kritisch',
        riskLow: 'niedrig', riskMedium: 'mittel', riskHigh: 'hoch',
        bandGood: 'Gut', bandImproving: 'Verbessernd', bandModerate: 'Mäßig', bandPoor: 'Schwach',
        cmdSession: 'Sitzung', cmdScore: 'Punktzahl', cmdFatigue: 'Müdigkeit', cmdPressure: 'Druck',
        cmdRecommendation: 'Empfehlung', cmdAlerts: 'Warnungen', cmdReports: 'Berichte', cmdPatient: 'Patient',
        commands: {
          session: ['sitzung', 'aktuell', 'fortschritt'],
          score: ['punktzahl', 'ergebnis', 'rehabilitation', 'reha'],
          fatigue: ['müdigkeit', 'ermüdung', 'erschöpfung', 'müde'],
          pressure: ['druck', 'socket', 'stumpfdruck'],
          recommendation: ['empfehlung', 'vorschlag'],
          alerts: ['warnung', 'benachrichtigung', 'alarm', 'hinweis'],
          reports: ['bericht', 'dokument', 'zusammenfassung'],
          patient: ['patient', 'profil', 'übersicht']
        }
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
        searchPatient: 'Procurar um paciente',
        alertsQuery: 'Mostre-me os alertas',
        reportsQuery: 'Abra os relatórios clínicos',
        patientQuery: 'Mostre a visão geral do paciente',
        sessionResponse: 'Pontuação atual: {score}. Abrindo a visão geral do paciente.',
        scoreResponse: 'A pontuação é {score} de 100, na faixa {band}.',
        fatigueResponse: 'O nível de fadiga é {value} por cento. Nível de risco: {level}.',
        pressureResponse: 'A pressão do soquete é {value} quilopascais. Estado: {status}.',
        recommendationFallback: 'A recomendação requer revisão clínica.',
        alertsOpening: 'Abrindo alertas e notificações.',
        reportsOpening: 'Abrindo os relatórios clínicos.',
        patientOpening: 'Mostrando a visão geral do paciente.',
        noSessionResponse: 'Nenhuma sessão ativa. Selecione primeiro um paciente.',
        noMatchResponse: 'Desculpe, não entendi. Tente um dos comandos de voz sugeridos.',
        networkError: 'Erro de rede. Verifique sua conexão.',
        recognitionUnsupported: 'O reconhecimento de fala não é compatível com este navegador.',
        statusSafe: 'seguro', statusElevated: 'elevado', statusCritical: 'crítico',
        riskLow: 'baixo', riskMedium: 'médio', riskHigh: 'alto',
        bandGood: 'Boa', bandImproving: 'Melhorando', bandModerate: 'Moderada', bandPoor: 'Ruim',
        cmdSession: 'Sessão', cmdScore: 'Pontuação', cmdFatigue: 'Fadiga', cmdPressure: 'Pressão',
        cmdRecommendation: 'Recomendação', cmdAlerts: 'Alertas', cmdReports: 'Relatórios', cmdPatient: 'Paciente',
        commands: {
          session: ['sessão', 'sessao', 'atual', 'progresso'],
          score: ['pontuação', 'pontuacao', 'reabilitação', 'reabilitacao', 'pontuar'],
          fatigue: ['fadiga', 'cansaço', 'cansaco', 'exaustão', 'exaustao'],
          pressure: ['pressão', 'pressao', 'socket', 'soquete'],
          recommendation: ['recomendação', 'recomendacao', 'sugestão', 'sugestao', 'conselho'],
          alerts: ['alerta', 'alertas', 'aviso', 'notificação', 'notificacao'],
          reports: ['relatório', 'relatorio', 'relatórios', 'documento'],
          patient: ['paciente', 'perfil', 'visão geral', 'visao geral']
        }
      },
      'it-IT': {
        title: 'Assistente Vocale',
        toggleListening: 'Inizia ad Ascoltare',
        stopListening: 'Smetti di Ascoltare',
        selectLanguage: 'Seleziona Lingua',
        voiceEnabled: 'Voce Abilitata',
        voiceDisabled: 'Voce Disabilitata',
        micPermissionDenied: 'Permesso del microfono negato',
        noSpeechDetected: 'Nessun parlato rilevato',
        listeningIndicator: 'Ascolto...',
        sessionQuery: 'Parlami della sessione attuale',
        scoreQuery: 'Qual è il punteggio di riabilitazione?',
        fatigueQuery: 'Controlla il livello di fatica',
        pressureQuery: 'Avvisami dei cambiamenti di pressione',
        recommendationQuery: 'Dammi una raccomandazione clinica',
        searchPatient: 'Cerca un paziente',
        alertsQuery: 'Mostrami gli avvisi',
        reportsQuery: 'Apri i referti clinici',
        patientQuery: 'Mostra la panoramica del paziente',
        sessionResponse: 'Punteggio attuale: {score}. Apertura della panoramica del paziente.',
        scoreResponse: 'Il punteggio è {score} su 100, nella fascia {band}.',
        fatigueResponse: 'Il livello di fatica è {value} per cento. Livello di rischio: {level}.',
        pressureResponse: 'La pressione del socket è {value} kilopascal. Stato: {status}.',
        recommendationFallback: 'La raccomandazione richiede una revisione clinica.',
        alertsOpening: 'Apertura di avvisi e notifiche.',
        reportsOpening: 'Apertura dei referti clinici.',
        patientOpening: 'Visualizzazione della panoramica del paziente.',
        noSessionResponse: 'Nessuna sessione attiva. Seleziona prima un paziente.',
        noMatchResponse: 'Mi dispiace, non ho capito. Prova uno dei comandi vocali suggeriti.',
        networkError: 'Errore di rete. Controlla la tua connessione.',
        recognitionUnsupported: 'Il riconoscimento vocale non è supportato in questo browser.',
        statusSafe: 'sicuro', statusElevated: 'elevato', statusCritical: 'critico',
        riskLow: 'basso', riskMedium: 'medio', riskHigh: 'alto',
        bandGood: 'Buona', bandImproving: 'In miglioramento', bandModerate: 'Moderata', bandPoor: 'Scarsa',
        cmdSession: 'Sessione', cmdScore: 'Punteggio', cmdFatigue: 'Fatica', cmdPressure: 'Pressione',
        cmdRecommendation: 'Raccomandazione', cmdAlerts: 'Avvisi', cmdReports: 'Referti', cmdPatient: 'Paziente',
        commands: {
          session: ['sessione', 'attuale', 'corrente', 'progresso'],
          score: ['punteggio', 'punteggi', 'riabilitazione'],
          fatigue: ['fatica', 'stanco', 'stanchezza', 'esaurimento'],
          pressure: ['pressione', 'socket'],
          recommendation: ['raccomandazione', 'suggerimento', 'consiglio'],
          alerts: ['avviso', 'avvisi', 'allarme', 'notifica', 'notifiche'],
          reports: ['referto', 'referti', 'rapporto', 'documento', 'riassunto'],
          patient: ['paziente', 'profilo', 'panoramica']
        }
      },
      'ja-JP': {
        title: '音声アシスタント',
        toggleListening: '聴取を開始',
        stopListening: '聴取を停止',
        selectLanguage: '言語を選択',
        voiceEnabled: '音声有効',
        voiceDisabled: '音声無効',
        micPermissionDenied: 'マイクの権限が拒否されました',
        noSpeechDetected: '音声が検出されません',
        listeningIndicator: '聴取中...',
        sessionQuery: '現在のセッションについて教えてください',
        scoreQuery: 'リハビリテーションスコアは何ですか？',
        fatigueQuery: '疲労レベルを確認してください',
        pressureQuery: '圧力の変化を通知してください',
        recommendationQuery: '臨床推奨を教えてください',
        searchPatient: '患者を検索',
        alertsQuery: 'アラートを表示して',
        reportsQuery: '臨床レポートを開いて',
        patientQuery: '患者の概要を表示して',
        sessionResponse: '現在のスコア: {score}。患者の概要を開いています。',
        scoreResponse: 'スコアは100点中{score}点、{band}バンドです。',
        fatigueResponse: '疲労度は{value}パーセントです。リスクレベル: {level}。',
        pressureResponse: 'ソケット圧は{value}キロパスカルです。状態: {status}。',
        recommendationFallback: '推奨事項には臨床レビューが必要です。',
        alertsOpening: 'アラートと通知を開いています。',
        reportsOpening: '臨床レポートを開いています。',
        patientOpening: '患者の概要を表示しています。',
        noSessionResponse: 'アクティブなセッションがありません。先に患者を選択してください。',
        noMatchResponse: 'すみません、理解できませんでした。提案された音声コマンドをお試しください。',
        networkError: 'ネットワークエラーです。接続を確認してください。',
        recognitionUnsupported: 'このブラウザは音声認識に対応していません。',
        statusSafe: '安全', statusElevated: '注意', statusCritical: '危険',
        riskLow: '低', riskMedium: '中', riskHigh: '高',
        bandGood: '良好', bandImproving: '改善中', bandModerate: '中程度', bandPoor: '不良',
        cmdSession: 'セッション', cmdScore: 'スコア', cmdFatigue: '疲労', cmdPressure: '圧力',
        cmdRecommendation: '推奨', cmdAlerts: 'アラート', cmdReports: 'レポート', cmdPatient: '患者',
        commands: {
          session: ['セッション', '現在', '進捗'],
          score: ['スコア', '点数', 'リハビリ', 'リハビリテーション'],
          fatigue: ['疲労', '疲れ', 'だるさ'],
          pressure: ['圧力', '圧', 'ソケット'],
          recommendation: ['推奨', 'アドバイス', '提案'],
          alerts: ['アラート', '警告', '通知'],
          reports: ['レポート', '報告書'],
          patient: ['患者', 'プロフィール', '概要']
        }
      },
      'zh-CN': {
        title: '语音助手',
        toggleListening: '开始聆听',
        stopListening: '停止聆听',
        selectLanguage: '选择语言',
        voiceEnabled: '语音已启用',
        voiceDisabled: '语音已禁用',
        micPermissionDenied: '麦克风权限被拒绝',
        noSpeechDetected: '未检测到语音',
        listeningIndicator: '聆听中...',
        sessionQuery: '告诉我当前训练的情况',
        scoreQuery: '康复评分是多少？',
        fatigueQuery: '检查疲劳程度',
        pressureQuery: '压力变化时提醒我',
        recommendationQuery: '给我一个临床建议',
        searchPatient: '搜索患者',
        alertsQuery: '显示警报',
        reportsQuery: '打开临床报告',
        patientQuery: '显示患者概览',
        sessionResponse: '当前分数：{score}。正在打开患者概览。',
        scoreResponse: '分数为{score}分（满分100），属于{band}区间。',
        fatigueResponse: '疲劳程度为{value}%。风险等级：{level}。',
        pressureResponse: '接受腔压力为{value}千帕。状态：{status}。',
        recommendationFallback: '该建议需要进行临床审查。',
        alertsOpening: '正在打开警报和通知。',
        reportsOpening: '正在打开临床报告。',
        patientOpening: '正在显示患者概览。',
        noSessionResponse: '没有活动会话。请先选择一位患者。',
        noMatchResponse: '抱歉，我没有听懂。请尝试建议的语音命令之一。',
        networkError: '网络错误。请检查您的连接。',
        recognitionUnsupported: '此浏览器不支持语音识别。',
        statusSafe: '安全', statusElevated: '偏高', statusCritical: '危险',
        riskLow: '低', riskMedium: '中', riskHigh: '高',
        bandGood: '良好', bandImproving: '改善中', bandModerate: '中等', bandPoor: '较差',
        cmdSession: '会话', cmdScore: '分数', cmdFatigue: '疲劳', cmdPressure: '压力',
        cmdRecommendation: '建议', cmdAlerts: '警报', cmdReports: '报告', cmdPatient: '患者',
        commands: {
          session: ['会话', '当前', '训练', '进度'],
          score: ['分数', '得分', '评分', '康复'],
          fatigue: ['疲劳', '疲倦', '乏力', '累'],
          pressure: ['压力', '压强', '接受腔', '残肢'],
          recommendation: ['建议', '推荐'],
          alerts: ['警报', '提醒', '通知'],
          reports: ['报告', '报表'],
          patient: ['患者', '病人', '概览', '概况']
        }
      },
      'ar-SA': {
        title: 'المساعد الصوتي',
        toggleListening: 'بدء الاستماع',
        stopListening: 'إيقاف الاستماع',
        selectLanguage: 'اختر اللغة',
        voiceEnabled: 'الصوت مُمكّن',
        voiceDisabled: 'الصوت مُعطّل',
        micPermissionDenied: 'تم رفض إذن الميكروفون',
        noSpeechDetected: 'لم يتم اكتشاف أي كلام',
        listeningIndicator: 'جارٍ الاستماع...',
        sessionQuery: 'أخبرني عن الجلسة الحالية',
        scoreQuery: 'ما هي درجة التأهيل؟',
        fatigueQuery: 'تحقق من مستوى التعب',
        pressureQuery: 'نبّهني عند تغيرات الضغط',
        recommendationQuery: 'أعطني توصية سريرية',
        searchPatient: 'ابحث عن مريض',
        alertsQuery: 'اعرض التنبيهات',
        reportsQuery: 'افتح التقارير السريرية',
        patientQuery: 'اعرض نظرة عامة على المريض',
        sessionResponse: 'الدرجة الحالية: {score}. جارٍ فتح نظرة عامة على المريض.',
        scoreResponse: 'الدرجة هي {score} من 100، في نطاق {band}.',
        fatigueResponse: 'مستوى التعب هو {value} بالمئة. مستوى الخطر: {level}.',
        pressureResponse: 'ضغط التجويف هو {value} كيلوباسكال. الحالة: {status}.',
        recommendationFallback: 'التوصية تتطلب مراجعة سريرية.',
        alertsOpening: 'جارٍ فتح التنبيهات والإشعارات.',
        reportsOpening: 'جارٍ فتح التقارير السريرية.',
        patientOpening: 'جارٍ عرض نظرة عامة على المريض.',
        noSessionResponse: 'لا توجد جلسة نشطة. يرجى اختيار مريض أولاً.',
        noMatchResponse: 'عذراً، لم أفهم. جرّب أحد أوامر الصوت المقترحة.',
        networkError: 'خطأ في الشبكة. يرجى التحقق من اتصالك.',
        recognitionUnsupported: 'التعرف على الكلام غير مدعوم في هذا المتصفح.',
        statusSafe: 'آمن', statusElevated: 'مرتفع', statusCritical: 'حرج',
        riskLow: 'منخفض', riskMedium: 'متوسط', riskHigh: 'مرتفع',
        bandGood: 'جيدة', bandImproving: 'في تحسن', bandModerate: 'متوسطة', bandPoor: 'ضعيفة',
        cmdSession: 'الجلسة', cmdScore: 'الدرجة', cmdFatigue: 'التعب', cmdPressure: 'الضغط',
        cmdRecommendation: 'التوصية', cmdAlerts: 'التنبيهات', cmdReports: 'التقارير', cmdPatient: 'المريض',
        commands: {
          session: ['جلسة', 'حالية', 'تقدم'],
          score: ['درجة', 'نتيجة', 'تأهيل'],
          fatigue: ['تعب', 'إرهاق', 'ارهاق'],
          pressure: ['ضغط', 'تجويف', 'مفصل'],
          recommendation: ['توصية', 'نصيحة', 'اقتراح'],
          alerts: ['تنبيه', 'تنبيهات', 'إشعار', 'اشعار', 'تحذير'],
          reports: ['تقرير', 'تقارير', 'ملخص'],
          patient: ['مريض', 'ملف', 'نظرة عامة']
        }
      },
      'hi-IN': {
        title: 'वॉइस असिस्टेंट',
        toggleListening: 'सुनना शुरू करें',
        stopListening: 'सुनना बंद करें',
        selectLanguage: 'भाषा चुनें',
        voiceEnabled: 'वॉइस सक्षम',
        voiceDisabled: 'वॉइस अक्षम',
        micPermissionDenied: 'माइक्रोफ़ोन की अनुमति अस्वीकृत',
        noSpeechDetected: 'कोई आवाज़ नहीं मिली',
        listeningIndicator: 'सुन रहा है...',
        languageChanged: 'भाषा बदल दी गई। अब मैं चुनी गई भाषा में जवाब दूंगा।',
        sessionQuery: 'वर्तमान सत्र के बारे में बताएं',
        scoreQuery: 'पुनर्वास स्कोर क्या है?',
        fatigueQuery: 'थकान का स्तर जांचें',
        pressureQuery: 'दबाव परिवर्तनों पर मुझे सचेत करें',
        recommendationQuery: 'मुझे एक नैदानिक सिफारिश दें',
        searchPatient: 'एक रोगी खोजें',
        alertsQuery: 'मुझे अलर्ट दिखाएं',
        reportsQuery: 'नैदानिक रिपोर्ट खोलें',
        patientQuery: 'रोगी का अवलोकन दिखाएं',
        sessionResponse: 'वर्तमान स्कोर: {score}। रोगी का अवलोकन खोल रहा हूं।',
        scoreResponse: 'स्कोर 100 में से {score} है, {band} श्रेणी में।',
        fatigueResponse: 'थकान का स्तर {value} प्रतिशत है। जोखिम स्तर: {level}।',
        pressureResponse: 'सॉकेट दबाव {value} किलोपास्कल है। स्थिति: {status}।',
        recommendationFallback: 'सिफारिश के लिए नैदानिक समीक्षा आवश्यक है।',
        alertsOpening: 'अलर्ट और सूचनाएं खोल रहा हूं।',
        reportsOpening: 'नैदानिक रिपोर्ट खोल रहा हूं।',
        patientOpening: 'रोगी का अवलोकन दिखा रहा हूं।',
        noSessionResponse: 'कोई सक्रिय सत्र नहीं है। कृपया पहले एक रोगी चुनें।',
        noMatchResponse: 'क्षमा करें, मैं समझ नहीं पाया। सुझाए गए वॉइस कमांड में से कोई आज़माएं।',
        networkError: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
        recognitionUnsupported: 'इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है।',
        statusSafe: 'सुरक्षित', statusElevated: 'उच्च', statusCritical: 'गंभीर',
        riskLow: 'कम', riskMedium: 'मध्यम', riskHigh: 'उच्च',
        bandGood: 'अच्छा', bandImproving: 'सुधर रहा', bandModerate: 'मध्यम', bandPoor: 'कमजोर',
        cmdSession: 'सत्र', cmdScore: 'स्कोर', cmdFatigue: 'थकान', cmdPressure: 'दबाव',
        cmdRecommendation: 'सिफारिश', cmdAlerts: 'अलर्ट', cmdReports: 'रिपोर्ट', cmdPatient: 'रोगी',
        commands: {
          session: ['सत्र', 'वर्तमान', 'प्रगति'],
          score: ['स्कोर', 'अंक', 'पुनर्वास'],
          fatigue: ['थकान', 'थका', 'श्रांति'],
          pressure: ['दबाव', 'सॉकेट'],
          recommendation: ['सिफारिश', 'सुझाव', 'सलाह'],
          alerts: ['अलर्ट', 'सूचना', 'सूचनाएं', 'चेतावनी'],
          reports: ['रिपोर्ट', 'रिपोर्ट्स', 'दस्तावेज', 'दस्तावेज़', 'सारांश'],
          patient: ['रोगी', 'मरीज', 'प्रोफ़ाइल', 'प्रोफाइल', 'अवलोकन']
        }
      },
      'ta-IN': {
        title: 'குரல் உதவியாளர்',
        toggleListening: 'கேட்கத் தொடங்கு',
        stopListening: 'கேட்பதை நிறுத்து',
        selectLanguage: 'மொழியைத் தேர்ந்தெடுக்கவும்',
        voiceEnabled: 'குரல் இயக்கப்பட்டது',
        voiceDisabled: 'குரல் முடக்கப்பட்டது',
        micPermissionDenied: 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது',
        noSpeechDetected: 'பேச்சு கண்டறியப்படவில்லை',
        listeningIndicator: 'கேட்கிறது...',
        languageChanged: 'மொழி மாற்றப்பட்டது. இனி தேர்ந்தெடுத்த மொழியில் பதிலளிக்கிறேன்.',
        sessionQuery: 'தற்போதைய அமர்வைப் பற்றி எனக்குச் சொல்லுங்கள்',
        scoreQuery: 'மறுவாழ்வு மதிப்பெண் என்ன?',
        fatigueQuery: 'சோர்வு நிலையைச் சரிபார்க்கவும்',
        pressureQuery: 'அழுத்த மாற்றங்கள் குறித்து என்னை எச்சரிக்கவும்',
        recommendationQuery: 'எனக்கு ஒரு மருத்துவ பரிந்துரையைத் தாருங்கள்',
        searchPatient: 'ஒரு நோயாளியைத் தேடு',
        alertsQuery: 'எச்சரிக்கைகளைக் காட்டு',
        reportsQuery: 'மருத்துவ அறிக்கைகளைத் திற',
        patientQuery: 'நோயாளி கண்ணோட்டத்தைக் காட்டு',
        sessionResponse: 'தற்போதைய மதிப்பெண்: {score}. நோயாளி கண்ணோட்டத்தைத் திறக்கிறது.',
        scoreResponse: 'மதிப்பெண் 100-இல் {score}, {band} பிரிவில் உள்ளது.',
        fatigueResponse: 'சோர்வு நிலை {value} சதவீதம். ஆபத்து நிலை: {level}.',
        pressureResponse: 'சாக்கெட் அழுத்தம் {value} கிலோபாஸ்கல். நிலை: {status}.',
        recommendationFallback: 'பரிந்துரைக்கு மருத்துவ மறுஆய்வு தேவை.',
        alertsOpening: 'எச்சரிக்கைகள் மற்றும் அறிவிப்புகளைத் திறக்கிறது.',
        reportsOpening: 'மருத்துவ அறிக்கைகளைத் திறக்கிறது.',
        patientOpening: 'நோயாளி கண்ணோட்டத்தைக் காட்டுகிறது.',
        noSessionResponse: 'செயலில் உள்ள அமர்வு இல்லை. முதலில் ஒரு நோயாளியைத் தேர்ந்தெடுக்கவும்.',
        noMatchResponse: 'மன்னிக்கவும், எனக்குப் புரியவில்லை. பரிந்துரைக்கப்பட்ட குரல் கட்டளைகளில் ஒன்றை முயற்சிக்கவும்.',
        networkError: 'நெட்வொர்க் பிழை. உங்கள் இணைப்பைச் சரிபார்க்கவும்.',
        recognitionUnsupported: 'இந்த உலாவியில் பேச்சு அறிதல் ஆதரிக்கப்படவில்லை.',
        statusSafe: 'பாதுகாப்பான', statusElevated: 'உயர்ந்த', statusCritical: 'மிக மோசமான',
        riskLow: 'குறைவு', riskMedium: 'நடுத்தர', riskHigh: 'அதிக',
        bandGood: 'நல்ல', bandImproving: 'முன்னேறும்', bandModerate: 'நடுத்தர', bandPoor: 'மோசமான',
        cmdSession: 'அமர்வு', cmdScore: 'மதிப்பெண்', cmdFatigue: 'சோர்வு', cmdPressure: 'அழுத்தம்',
        cmdRecommendation: 'பரிந்துரை', cmdAlerts: 'எச்சரிக்கை', cmdReports: 'அறிக்கை', cmdPatient: 'நோயாளி',
        commands: {
          session: ['அமர்', 'அமர்வு', 'தற்போதைய', 'முன்னேற்றம்'],
          score: ['மதிப்பெண்', 'புள்ளி', 'மறுவாழ்வு'],
          fatigue: ['சோர்வு', 'களைப்பு'],
          pressure: ['அழுத்த', 'அழுத்தம்', 'சாக்கெட்'],
          recommendation: ['பரிந்துரை', 'ஆலோசனை'],
          alerts: ['எச்சரிக்கை', 'அறிவிப்பு', 'அலர்ட்'],
          reports: ['அறிக்கை', 'ஆவணம்'],
          patient: ['நோயாளி', 'சுயவிவரம்', 'கண்ணோட்டம்']
        }
      },
      'te-IN': {
        title: 'వాయిస్ అసిస్టెంట్',
        toggleListening: 'వినడం ప్రారంభించు',
        stopListening: 'వినడం ఆపు',
        selectLanguage: 'భాషను ఎంచుకోండి',
        voiceEnabled: 'వాయిస్ ప్రారంభించబడింది',
        voiceDisabled: 'వాయిస్ నిలిపివేయబడింది',
        micPermissionDenied: 'మైక్రోఫోన్ అనుమతి తిరస్కరించబడింది',
        noSpeechDetected: 'మాట గుర్తించబడలేదు',
        listeningIndicator: 'వింటున్నాను...',
        languageChanged: 'భాష మార్చబడింది. ఇకపై ఎంచుకున్న భాషలో సమాధానం ఇస్తాను.',
        sessionQuery: 'ప్రస్తుత సెషన్ గురించి చెప్పండి',
        scoreQuery: 'పునరావాస స్కోరు ఎంత?',
        fatigueQuery: 'అలసట స్థాయిని తనిఖీ చేయండి',
        pressureQuery: 'ఒత్తిడి మార్పుల గురించి నన్ను హెచ్చరించండి',
        recommendationQuery: 'నాకు ఒక క్లినికల్ సిఫారసు ఇవ్వండి',
        searchPatient: 'రోగిని వెతకండి',
        alertsQuery: 'అలర్ట్‌లను చూపించు',
        reportsQuery: 'క్లినికల్ రిపోర్ట్‌లను తెరువు',
        patientQuery: 'రోగి అవలోకనాన్ని చూపించు',
        sessionResponse: 'ప్రస్తుత స్కోరు: {score}. రోగి అవలోకనాన్ని తెరుస్తోంది.',
        scoreResponse: 'స్కోరు 100లో {score}, {band} వర్గంలో ఉంది.',
        fatigueResponse: 'అలసట స్థాయి {value} శాతం. ప్రమాద స్థాయి: {level}.',
        pressureResponse: 'సాకెట్ ఒత్తిడి {value} కిలోపాస్కల్స్. స్థితి: {status}.',
        recommendationFallback: 'సిఫారసుకు క్లినికల్ సమీక్ష అవసరం.',
        alertsOpening: 'అలర్ట్‌లు మరియు నోటిఫికేషన్‌లను తెరుస్తోంది.',
        reportsOpening: 'క్లినికల్ రిపోర్ట్‌లను తెరుస్తోంది.',
        patientOpening: 'రోగి అవలోకనాన్ని చూపుతోంది.',
        noSessionResponse: 'యాక్టివ్ సెషన్ లేదు. దయచేసి ముందుగా ఒక రోగిని ఎంచుకోండి.',
        noMatchResponse: 'క్షమించండి, అర్థం కాలేదు. సూచించిన వాయిస్ కమాండ్‌లలో ఒకదాన్ని ప్రయత్నించండి.',
        networkError: 'నెట్‌వర్క్ లోపం. దయచేసి మీ కనెక్షన్‌ను తనిఖీ చేయండి.',
        recognitionUnsupported: 'ఈ బ్రౌజర్‌లో స్పీచ్ రికగ్నిషన్ మద్దతు లేదు.',
        statusSafe: 'సురక్షితం', statusElevated: 'ఎక్కువ', statusCritical: 'ప్రమాదకరం',
        riskLow: 'తక్కువ', riskMedium: 'మధ్యస్థం', riskHigh: 'అధికం',
        bandGood: 'మంచి', bandImproving: 'మెరుగుతున్న', bandModerate: 'మధ్యస్త', bandPoor: 'బలహీన',
        cmdSession: 'సెషన్', cmdScore: 'స్కోరు', cmdFatigue: 'అలసట', cmdPressure: 'ఒత్తిడి',
        cmdRecommendation: 'సిఫారసు', cmdAlerts: 'అలర్ట్', cmdReports: 'రిపోర్ట్', cmdPatient: 'రోగి',
        commands: {
          session: ['సెషన్', 'ప్రస్తుత', 'పురోగతి'],
          score: ['స్కోరు', 'మార్కు', 'పునరావాస'],
          fatigue: ['అలసట', 'నీరసం'],
          pressure: ['ఒత్తిడి', 'సాకెట్'],
          recommendation: ['సిఫారసు', 'సూచన', 'సలహా'],
          alerts: ['అలర్ట్', 'హెచ్చరిక', 'నోటీసు'],
          reports: ['రిపోర్ట్', 'పత్రం', 'నివేదిక'],
          patient: ['రోగి', 'ప్రొఫైల్', 'అవలోకనం']
        }
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
      } else {
        this.updateTranscriptDisplay(interimTranscript);
      }
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

  getAvailableVoices() {
    if (!this.speechSynthesis || typeof this.speechSynthesis.getVoices !== 'function') {
      return [];
    }
    try {
      this._voiceMap = {};
      const rawVoices = this.speechSynthesis.getVoices();
      return rawVoices.map((v) => {
        // Use a stable identifier: prefer the spec `uri`, fall back to the
        // vendor `name` (Chrome/Edge expose voices via name, not uri).
        const key = v.uri || v.name || v.lang;
        this._voiceMap[key] = v;
        return {
          uri: key,
          name: v.name,
          lang: v.lang,
          localService: !!v.localService
        };
      });
    } catch (e) {
      console.warn('Unable to enumerate TTS voices:', e);
      return [];
    }
  }

  pickVoice() {
    const voices = this.getAvailableVoices();
    if (!voices.length) return null;

    const langHint = String(this.currentLanguage || 'en-US').split('-')[0].toLowerCase();
    const matchesLang = (v) => String(v.lang || '').toLowerCase().split('-')[0] === langHint;

    // Prefer the user-selected voice if it is still available and matches the active language.
    if (this.currentVoice) {
      const saved = voices.find((v) => v.uri === this.currentVoice);
      if (saved && matchesLang(saved)) return saved;
    }

    // Prefer an online (network) voice for that language for better quality.
    const onlineMatch = voices.find((v) => matchesLang(v) && !v.localService);
    if (onlineMatch) return onlineMatch;

    // Fall back to any voice of that language.
    const anyMatch = voices.find((v) => matchesLang(v));
    if (anyMatch) return anyMatch;

    // Last resort: for English, any remaining voice is acceptable. For
    // non-English languages (Hindi/Tamil/Telugu, ...) return null so that
    // speak() leaves utterance.voice unset and hints utterance.lang instead.
    // Forcing an English voice here made Indian-language TTS silent/garbled.
    if (langHint === 'en') {
      return voices[0];
    }
    return null;
  }

  getCurrentVoice() {
    return this.pickVoice();
  }

  setVoice(voiceURI) {
    this.currentVoice = voiceURI || null;
    if (voiceURI) {
      localStorage.setItem('ards_voice_voice', voiceURI);
    } else {
      localStorage.removeItem('ards_voice_voice');
    }
    return true;
  }

  speak(text) {
    if (!this.voiceEnabled || !this.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = this.getCurrentVoice();
    if (voice && voice.lang) {
      // Resolve the actual SpeechSynthesisVoice object from the map.
      // We must assign a real SpeechSynthesisVoice (not a string URI) to
      // utterance.voice, otherwise the browser ignores it and falls back
      // to the default voice — which breaks Hindi/Tamil/Telugu TTS.
      const vObj = (this._voiceMap && this._voiceMap[voice.uri]) || null;
      if (vObj && typeof vObj === 'object') {
        utterance.voice = vObj;
      }
      utterance.lang = vObj ? (vObj.lang || this.currentLanguage) : (voice.lang || this.currentLanguage);
    } else {
      // No language-matched voice is available (voices load asynchronously).
      // Leave utterance.voice unset and hint the language so the browser can
      // resolve a capable voice instead of silently using a default one.
      utterance.lang = this.currentLanguage;
    }
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
      // Show the localized response so it is readable even without audio.
      this.updateTranscriptDisplay('▶ ' + response.text);
      this.speak(response.text);
      if (response.action) {
        response.action();
      }
    } else {
      this.updateTranscriptDisplay(this.translate('noMatchResponse'));
    }
  }

  getCommandKeywords(cmdKey) {
    const langTranslations = this.translations[this.currentLanguage] || this.translations['en-US'];
    const keywords = (langTranslations.commands && langTranslations.commands[cmdKey]) ||
      this.translations['en-US'].commands[cmdKey] || [];

    // Verified baseline keyword lists for the supported Indian languages so that
    // command recognition works even if a translation block is incomplete.
    const langHint = String(this.currentLanguage || 'en-US').split('-')[0].toLowerCase();
    const fallback = {
      hi: {
        session: ['सत्र', 'वर्तमान', 'प्रगति'],
        score: ['स्कोर', 'अंक', 'पुनर्वास'],
        fatigue: ['थकान', 'थका', 'थकावट'],
        pressure: ['दबाव', 'प्रेशर', 'सॉकेट'],
        recommendation: ['सिफारिश', 'सुझाव', 'सलाह'],
        alerts: ['अलर्ट', 'चेतावनी', 'सूचना'],
        reports: ['रिपोर्ट', 'दस्तावेज़'],
        patient: ['रोगी', 'मरीज', 'प्रोफ़ाइल']
      },
      ta: {
        session: ['அமர்வு', 'தற்போதைய', 'முன்னேற்றம்'],
        score: ['மதிப்பெண்', 'ஸ்கோர்'],
        fatigue: ['சோர்வு', 'சோர்வாக'],
        pressure: ['அழுத்தம்', 'பிரஷர்'],
        recommendation: ['பரிந்துரை', 'ஆலோசனை'],
        alerts: ['எச்சரிக்கை', 'அறிவிப்பு'],
        reports: ['அறிக்கை', 'சான்று'],
        patient: ['நோயாளி', 'நோயாளி விவரம்']
      },
      te: {
        session: ['సెషన్', 'ప్రస్తుత', 'పురోగతి'],
        score: ['స్కోర్', 'మార్కు'],
        fatigue: ['అలసట', 'అలసటగా'],
        pressure: ['పీడనం', 'ప్రెషర్'],
        recommendation: ['సిఫార్సు', 'సలహా'],
        alerts: ['హెచ్చరిక', 'నోటిఫికేషన్'],
        reports: ['రిపోర్ట్', 'నివేదిక'],
        patient: ['రోగి', 'మరోగి']
      }
    };

    const cmdSet = (fallback[langHint] && fallback[langHint][cmdKey]) || [];
    return Array.from(new Set(keywords.concat(cmdSet)));
  }

  matchesCommand(transcript, cmdKey) {
    const keywords = this.getCommandKeywords(cmdKey);
    return keywords.some((kw) => transcript.includes(kw));
  }

  substitute(template, values) {
    let text = template || '';
    Object.keys(values).forEach((k) => {
      text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), String(values[k]));
    });
    return text;
  }

  translateBand(key) {
    const map = { good: 'bandGood', improving: 'bandImproving', moderate: 'bandModerate', poor: 'bandPoor' };
    return this.translate(map[key] || 'bandModerate');
  }

  translateRisk(level) {
    const map = { LOW: 'riskLow', MEDIUM: 'riskMedium', HIGH: 'riskHigh' };
    return this.translate(map[level] || 'riskLow');
  }

  translateStatus(status) {
    const map = { safe: 'statusSafe', elevated: 'statusElevated', critical: 'statusCritical' };
    return this.translate(map[status] || 'statusSafe');
  }

  matchVoiceCommand(transcript) {
    const patient = window.dataStore?.getActivePatient();
    const session = window.dataStore?.getActiveSession();
    const noSessionReply = { text: this.translate('noSessionResponse'), action: () => window.ardsApp?.switchTab('home') };

    // Session-related commands
    if (this.matchesCommand(transcript, 'session')) {
      if (patient && session) {
        const score = window.ardsEngine?.calculateScore(session) || 0;
        return {
          text: this.substitute(this.translate('sessionResponse'), { score }),
          action: () => window.ardsApp?.switchTab('home')
        };
      }
      return noSessionReply;
    }

    // Score-related commands
    if (this.matchesCommand(transcript, 'score')) {
      if (session) {
        const score = window.ardsEngine?.calculateScore(session) || 0;
        const band = window.ardsEngine?.getScoreBand(score);
        return {
          text: this.substitute(this.translate('scoreResponse'), {
            score,
            band: this.translateBand(band?.key)
          }),
          action: () => window.ardsApp?.switchTab('home')
        };
      }
      return noSessionReply;
    }

    // Fatigue-related commands
    if (this.matchesCommand(transcript, 'fatigue')) {
      if (session) {
        const fatigue = window.ardsEngine?.getFatigueRisk(session.fatigue) || {};
        return {
          text: this.substitute(this.translate('fatigueResponse'), {
            value: session.fatigue,
            level: this.translateRisk(fatigue.level)
          }),
          action: () => window.ardsApp?.switchTab('home')
        };
      }
      return noSessionReply;
    }

    // Pressure-related commands
    if (this.matchesCommand(transcript, 'pressure')) {
      if (session) {
        const status = session.pressure <= 50 ? 'safe' : (session.pressure <= 60 ? 'elevated' : 'critical');
        return {
          text: this.substitute(this.translate('pressureResponse'), {
            value: session.pressure,
            status: this.translateStatus(status)
          }),
          action: () => window.ardsApp?.switchTab('home')
        };
      }
      return noSessionReply;
    }

    // Recommendation-related commands
    if (this.matchesCommand(transcript, 'recommendation')) {
      if (session && patient) {
        const baseline = patient.sessions?.[0] || session;
        const decision = window.ardsEngine?.evaluateDecisionAndSafety(session, baseline, null);
        const rec = decision?.finalRecommendation || this.translate('recommendationFallback');
        return {
          text: this.translate('recommendationQuery') + '. ' + rec,
          action: () => window.ardsApp?.switchTab('decision')
        };
      }
      return { text: this.translate('noSessionResponse'), action: () => window.ardsApp?.switchTab('decision') };
    }

    // Navigation commands
    if (this.matchesCommand(transcript, 'alerts')) {
      return {
        text: this.translate('alertsOpening'),
        action: () => window.ardsApp?.switchTab('alerts')
      };
    }

    if (this.matchesCommand(transcript, 'reports')) {
      return {
        text: this.translate('reportsOpening'),
        action: () => window.ardsApp?.switchTab('reports')
      };
    }

    if (this.matchesCommand(transcript, 'patient')) {
      return {
        text: this.translate('patientOpening'),
        action: () => window.ardsApp?.switchTab('home')
      };
    }

    return null;
  }

  translate(key) {
    const langTranslations = this.translations[this.currentLanguage] || this.translations['en-US'];
    return langTranslations[key] || this.translations['en-US'][key] || key;
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
      errorMessage = this.translate('networkError');
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
