/**
 * CYB!RM - Glowing CRT Oscilloscope & Spectrum Visualizer
 * Real-time canvas rendering with phosphor persistence, neon beam,
 * and 64-band cybernetic spectrum analyzer.
 */

export class AudioVisualizer {
  constructor(canvasElement, audioManager) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.audioMgr = audioManager;

    this.mode = 'oscilloscope'; // 'oscilloscope' or 'spectrum'
    this.animId = null;

    // Buffers
    this.timeDomainBuffer = new Uint8Array(1024);
    this.freqBuffer = new Uint8Array(256);
    this.peakLevels = new Float32Array(64).fill(0);

    // Auto-resize
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
  }

  start() {
    if (this.animId) return;
    const render = () => {
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  setMode(mode) {
    if (mode === 'oscilloscope' || mode === 'spectrum') {
      this.mode = mode;
    }
  }

  toggleMode() {
    this.mode = this.mode === 'oscilloscope' ? 'spectrum' : 'oscilloscope';
    return this.mode;
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Dark phosphor CRT decay effect
    ctx.fillStyle = 'rgba(10, 14, 22, 0.28)';
    ctx.fillRect(0, 0, w, h);

    if (!this.audioMgr || !this.audioMgr.analyser) {
      this.drawIdleGrid(ctx, w, h);
      return;
    }

    if (this.mode === 'oscilloscope') {
      this.drawOscilloscope(ctx, w, h);
    } else {
      this.drawSpectrum(ctx, w, h);
    }
  }

  drawIdleGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  drawOscilloscope(ctx, w, h) {
    this.audioMgr.getWaveformData(this.timeDomainBuffer);

    // Grid center line
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Oscilloscope Trace
    ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = '#00f3ff';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f3ff';

    ctx.beginPath();
    const sliceWidth = w / this.timeDomainBuffer.length;
    let x = 0;

    for (let i = 0; i < this.timeDomainBuffer.length; i++) {
      const v = this.timeDomainBuffer[i] / 128.0; // 0.0 to 2.0
      const y = (v * h) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();
    ctx.shadowBlur = 0; // Reset shadow
  }

  drawSpectrum(ctx, w, h) {
    this.audioMgr.getFrequencyData(this.freqBuffer);

    const numBars = 48;
    const barWidth = (w / numBars) * 0.75;
    const gap = (w / numBars) * 0.25;

    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0055';

    for (let i = 0; i < numBars; i++) {
      const freqIdx = Math.floor(Math.pow(i / numBars, 1.8) * 180);
      const val = this.freqBuffer[freqIdx] / 255.0; // 0 to 1
      const barHeight = val * h * 0.9;

      const x = i * (barWidth + gap);
      const y = h - barHeight;

      // Peak decay
      if (val > this.peakLevels[i]) {
        this.peakLevels[i] = val;
      } else {
        this.peakLevels[i] = Math.max(0, this.peakLevels[i] - 0.015);
      }

      // Neon Gradient Bar
      const grad = ctx.createLinearGradient(0, h, 0, y);
      grad.addColorStop(0, '#00f3ff');
      grad.addColorStop(0.5, '#ffaa00');
      grad.addColorStop(1, '#ff0055');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Peak Indicator
      const peakY = h - (this.peakLevels[i] * h * 0.9);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, peakY - 2, barWidth, 2);
    }

    ctx.shadowBlur = 0;
  }
}
