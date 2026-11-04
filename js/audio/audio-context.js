/**
 * CYB!RM - Audio Context & Master Bus Manager
 * Handles Web Audio API initialization, master bus routing,
 * limiter/compressor, analyzer nodes for oscilloscope, and live audio recording.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.limiter = null;
    this.analyser = null;
    this.recorderDest = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.isInitialized = false;

    // Send buses
    this.delaySendBus = null;
    this.reverbSendBus = null;
    this.tapeBus = null;
  }

  init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100
    });

    // Master gain: GR!MM 2.0 keeps ~6 dB headroom below the top of MASTER; default ≈ 75 %.
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.72, this.ctx.currentTime);

    // Brick-wall style limiter at the output (manual: nothing clips at LEVEL 100 + FX).
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-9.0, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(10.0, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.004, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.12, this.ctx.currentTime);

    // Spectrum & Oscilloscope Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    // Send buses: GR!MM 2.0 feeds DELAY/SPACE 6 dB lower than the dry path.
    this.delaySendBus = this.ctx.createGain();
    this.reverbSendBus = this.ctx.createGain();
    this.delaySendBus.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.reverbSendBus.gain.setValueAtTime(0.5, this.ctx.currentTime);

    // Routing Graph:
    // masterGain -> limiter -> analyser -> destination
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Live Recording destination
    try {
      this.recorderDest = this.ctx.createMediaStreamDestination();
      this.analyser.connect(this.recorderDest);
    } catch (e) {
      console.warn('MediaStreamDestination not supported:', e);
    }

    this.isInitialized = true;
  }

  async resume() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    if (!this.masterGain) return;
    const clamped = Math.max(0, Math.min(1.2, val));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  startRecording() {
    if (!this.recorderDest || this.isRecording) return false;
    this.recordedChunks = [];
    
    // Choose mime type
    let options = { mimeType: 'audio/webm' };
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else {
        options = {};
      }
    }

    try {
      this.mediaRecorder = new MediaRecorder(this.recorderDest.stream, options);
    } catch (e) {
      console.error('Failed to create MediaRecorder', e);
      return false;
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.exportRecordedAudio();
    };

    this.mediaRecorder.start(250);
    this.isRecording = true;
    return true;
  }

  stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return;
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  exportRecordedAudio() {
    if (this.recordedChunks.length === 0) return;
    const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `CYB!RM-session-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  getWaveformData(outputArray) {
    if (!this.analyser) return;
    this.analyser.getByteTimeDomainData(outputArray);
  }

  getFrequencyData(outputArray) {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(outputArray);
  }
}
