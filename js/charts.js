/**
 * ARDS - Adaptive Rehabilitation Decision Support System
 * Chart.js Integration & Dynamic Telemetry Visualizations
 */

class ARDSCharts {
  constructor() {
    this.mainScoreChart = null;
    this.gaitSymmetryChart = null;
    this.stabilityForceChart = null;
    this.fatiguePressureChart = null;
    this.biomRadarChart = null;
  }

  isDarkTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  getThemeColors() {
    const isDark = this.isDarkTheme();
    return {
      text: isDark ? '#94a3b8' : '#334155',
      textHeading: isDark ? '#f1f5f9' : '#0f172a',
      grid: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)',
      cardBg: isDark ? '#1e293b' : '#ffffff',
      primary: '#0284c7',
      primaryAlpha: 'rgba(2, 132, 199, 0.15)',
      emerald: isDark ? '#10b981' : '#059669',
      emeraldAlpha: 'rgba(16, 185, 129, 0.15)',
      amber: isDark ? '#f59e0b' : '#d97706',
      rose: isDark ? '#f43f5e' : '#e11d48',
      cyan: '#06b6d4',
      purple: '#8b5cf6'
    };
  }

  /**
   * Initializes or updates the primary Rehabilitation Score Line Chart
   */
  renderMainScoreChart(sessions) {
    const ctx = document.getElementById('mainScoreChart');
    if (!ctx) return;

    if (typeof Chart === 'undefined') {
      this.drawCanvasLineFallback(ctx, sessions);
      return;
    }

    try {
      const colors = this.getThemeColors();
      const labels = sessions.map(s => `Session ${s.session}`);
      const scores = sessions.map(s => window.ardsEngine.calculateScore(s));
      const baselineScore = scores[0] || 60;

      if (this.mainScoreChart) {
        this.mainScoreChart.destroy();
      }

      this.mainScoreChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Rehabilitation Score',
              data: scores,
              borderColor: colors.primary,
              backgroundColor: (context) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return 'rgba(2, 132, 199, 0.2)';
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
                gradient.addColorStop(1, 'rgba(2, 132, 199, 0.01)');
                return gradient;
              },
              fill: true,
              tension: 0.35,
              borderWidth: 3,
              pointBackgroundColor: colors.primary,
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointHoverBackgroundColor: colors.emerald,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 3
            },
            {
              label: 'S1 Baseline Reference',
              data: Array(sessions.length).fill(baselineScore),
              borderColor: colors.text,
              borderDash: [5, 5],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false
            },
            {
              label: 'Target Green Zone (80+)',
              data: Array(sessions.length).fill(80),
              borderColor: 'rgba(16, 185, 129, 0.4)',
              borderDash: [2, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: colors.text,
                font: { family: 'Inter', size: 12, weight: '500' },
                usePointStyle: true,
                boxWidth: 8
              }
            },
            tooltip: {
              backgroundColor: colors.cardBg,
              titleColor: colors.textHeading,
              bodyColor: colors.text,
              borderColor: colors.grid,
              borderWidth: 1,
              padding: 12,
              boxPadding: 6,
              usePointStyle: true,
              callbacks: {
                label: function(context) {
                  if (context.datasetIndex === 0) {
                    const band = window.ardsEngine.getScoreBand(context.raw);
                    return ` Rehab Score: ${context.raw}/100 (${band.label} Band)`;
                  }
                  return ` ${context.dataset.label}: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { family: 'Inter', size: 11 } }
            },
            y: {
              min: 30,
              max: 100,
              grid: { color: colors.grid },
              ticks: {
                color: colors.text,
                font: { family: 'Inter', size: 11 },
                stepSize: 10,
                callback: (value) => `${value} pts`
              }
            }
          }
        }
      });
    } catch(e) {
      console.warn("Chart.js mainScoreChart init fallback", e);
      this.drawCanvasLineFallback(ctx, sessions);
    }
  }

  /**
   * Dual-axis Gait Speed & Symmetry Chart
   */
  renderGaitSymmetryChart(sessions) {
    const ctx = document.getElementById('gaitSymmetryChart');
    if (!ctx || typeof Chart === 'undefined') return;

    try {
      const colors = this.getThemeColors();
      const labels = sessions.map(s => `S${s.session}`);
      const gaitSpeeds = sessions.map(s => s.gaitSpeed);
      const symmetries = sessions.map(s => s.symmetry);

      if (this.gaitSymmetryChart) {
        this.gaitSymmetryChart.destroy();
      }

      this.gaitSymmetryChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Gait Speed (m/s)',
              data: gaitSpeeds,
              borderColor: colors.cyan,
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2.5,
              pointRadius: 4,
              yAxisID: 'yGait'
            },
            {
              label: 'Symmetry (%)',
              data: symmetries,
              borderColor: colors.purple,
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2.5,
              pointRadius: 4,
              yAxisID: 'ySymm'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: colors.text, font: { family: 'Inter', size: 11 }, boxWidth: 6 }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 10 } } },
            yGait: {
              type: 'linear',
              position: 'left',
              min: 0.3,
              max: 1.0,
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 }, callback: v => `${v.toFixed(1)} m/s` }
            },
            ySymm: {
              type: 'linear',
              position: 'right',
              min: 40,
              max: 100,
              grid: { display: false },
              ticks: { color: colors.text, font: { size: 10 }, callback: v => `${v}%` }
            }
          }
        }
      });
    } catch(e) {
      console.warn("Chart.js gaitSymmetryChart fallback", e);
    }
  }

  /**
   * Stability & Force Control Trends
   */
  renderStabilityForceChart(sessions) {
    const ctx = document.getElementById('stabilityForceChart');
    if (!ctx || typeof Chart === 'undefined') return;

    try {
      const colors = this.getThemeColors();
      const labels = sessions.map(s => `S${s.session}`);
      const stability = sessions.map(s => s.stability);
      const force = sessions.map(s => s.force);

      if (this.stabilityForceChart) {
        this.stabilityForceChart.destroy();
      }

      this.stabilityForceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Stability (%)',
              data: stability,
              backgroundColor: colors.emerald,
              borderRadius: 4,
              barPercentage: 0.6
            },
            {
              label: 'Force Control (%)',
              data: force,
              backgroundColor: colors.primary,
              borderRadius: 4,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: colors.text, font: { family: 'Inter', size: 11 }, boxWidth: 6 }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 10 } } },
            y: {
              min: 30,
              max: 100,
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 }, callback: v => `${v}%` }
            }
          }
        }
      });
    } catch(e) {
      console.warn("Chart.js stabilityForceChart fallback", e);
    }
  }

  /**
   * Fatigue vs Socket Pressure Vital Correlation
   */
  renderFatiguePressureChart(sessions) {
    const ctx = document.getElementById('fatiguePressureChart');
    if (!ctx || typeof Chart === 'undefined') return;

    try {
      const colors = this.getThemeColors();
      const labels = sessions.map(s => `S${s.session}`);
      const fatigue = sessions.map(s => s.fatigue);
      const pressure = sessions.map(s => s.pressure);

      if (this.fatiguePressureChart) {
        this.fatiguePressureChart.destroy();
      }

      this.fatiguePressureChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Fatigue (%)',
              data: fatigue,
              borderColor: colors.amber,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 4
            },
            {
              label: 'Socket Pressure (kPa)',
              data: pressure,
              borderColor: colors.rose,
              backgroundColor: 'transparent',
              borderDash: [4, 4],
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: colors.text, font: { family: 'Inter', size: 11 }, boxWidth: 6 }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.text, font: { size: 10 } } },
            y: {
              min: 10,
              max: 80,
              grid: { color: colors.grid },
              ticks: { color: colors.text, font: { size: 10 } }
            }
          }
        }
      });
    } catch(e) {
      console.warn("Chart.js fatiguePressureChart fallback", e);
    }
  }

  /**
   * Biomechanical Balance Radar Chart for Current Session
   */
  renderBiomRadarChart(session) {
    const ctx = document.getElementById('biomRadarChart');
    if (!ctx || !session || typeof Chart === 'undefined') return;

    try {
      const colors = this.getThemeColors();
      const normalizedGait = Math.min(100, session.gaitSpeed * 100);
      const invertedFatigue = Math.max(0, 100 - session.fatigue);
      const invertedPressure = Math.max(0, 100 - session.pressure);

      if (this.biomRadarChart) {
        this.biomRadarChart.destroy();
      }

      this.biomRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Gait Velocity', 'Symmetry Index', 'Force Control', 'Stability Index', 'Energy / Stamina', 'Socket Comfort'],
          datasets: [
            {
              label: `Session ${session.session} Profile`,
              data: [normalizedGait, session.symmetry, session.force, session.stability, invertedFatigue, invertedPressure],
              borderColor: colors.primary,
              backgroundColor: 'rgba(2, 132, 199, 0.25)',
              borderWidth: 2,
              pointBackgroundColor: colors.primary,
              pointRadius: 3
            },
            {
              label: 'K3 Reference Target',
              data: [75, 80, 75, 80, 85, 80],
              borderColor: colors.emerald,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderWidth: 1.5,
              borderDash: [3, 3],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: colors.text, font: { family: 'Inter', size: 10 }, boxWidth: 6 }
            }
          },
          scales: {
            r: {
              angleLines: { color: colors.grid },
              grid: { color: colors.grid },
              pointLabels: {
                color: colors.text,
                font: { family: 'Inter', size: 9, weight: '500' }
              },
              ticks: { display: false, min: 0, max: 100 }
            }
          }
        }
      });
    } catch(e) {
      console.warn("Chart.js biomRadarChart fallback", e);
    }
  }

  /**
   * Native Canvas Fallback if Chart.js is not loaded
   */
  drawCanvasLineFallback(canvas, sessions) {
    if (!canvas || !sessions || sessions.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    const h = canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : 280;
    const pad = 40;

    ctx.clearRect(0, 0, w, h);

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = pad + (i * (h - 2 * pad) / 5);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    // Plot scores
    const scores = sessions.map(s => window.ardsEngine.calculateScore(s));
    const stepX = (w - 2 * pad) / Math.max(1, scores.length - 1);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    scores.forEach((s, idx) => {
      const x = pad + idx * stepX;
      const y = h - pad - ((s - 30) / 70) * (h - 2 * pad);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Plot points
    scores.forEach((s, idx) => {
      const x = pad + idx * stepX;
      const y = h - pad - ((s - 30) / 70) * (h - 2 * pad);
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px sans-serif';
      ctx.fillText(`S${sessions[idx].session}: ${s}`, x - 15, y - 10);
    });
  }

  /**
   * Re-renders all charts with current theme & active patient data
   */
  updateAllCharts(patient) {
    if (!patient || !patient.sessions || patient.sessions.length === 0) return;
    const activeSession = window.dataStore.getActiveSession();

    this.renderMainScoreChart(patient.sessions);
    this.renderGaitSymmetryChart(patient.sessions);
    this.renderStabilityForceChart(patient.sessions);
    this.renderFatiguePressureChart(patient.sessions);
    this.renderBiomRadarChart(activeSession);
  }
}

// Global charts manager instance
window.ardsCharts = new ARDSCharts();
