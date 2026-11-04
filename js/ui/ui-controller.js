/**
 * CYB!RM - UI Controller
 * Bridges DOM elements, CyberKnobs, Sequencer step pads,
 * Track tabs, Master FX rack, and preset management.
 */

import { CyberKnob } from './knob.js';
import { ENGINE_TYPES } from '../audio/engines.js';
import { SCALES, NOTE_NAMES, CYBER_CHORDS, generateChordNotes } from '../sequencer/scales.js';
import { PRESETS } from '../presets/presets.js';

export class UIController {
  constructor(app) {
    this.app = app;
    this.activeTrackIdx = 0; // 0, 1, 2, 3
    this.selectedStepIdx = 0; // 0 to 63

    this.knobs = {};
    this.dom = {};
  }

  init() {
    this.cacheDOMElements();
    this.initMasterKnobs();
    this.initTrackKnobs();
    this.populateSelects();
    this.renderChordPads();
    this.bindEvents();
    this.renderSequencerGrid();
    this.updateTrackUI();
    this.verifyControls();
  }

  /** Logs missing DOM / knobs at boot (console). */
  verifyControls() {
    const buttonIds = [
      'btn-play', 'btn-stop', 'btn-tap-tempo', 'btn-generative', 'btn-record',
      'btn-vis-mode', 'btn-granular-freeze', 'btn-reverb-infinite',
      'btn-track-mute', 'btn-track-solo'
    ];
    const knobIds = [
      'knob-tape-drive', 'knob-tape-flutter', 'knob-delay-time', 'knob-delay-feedback',
      'knob-reverb-decay', 'knob-bitcrush-mix', 'knob-master-vol', 'knob-swing',
      'knob-track-vol', 'knob-track-pan', 'knob-track-cutoff', 'knob-track-res',
      'knob-track-send-delay', 'knob-track-send-reverb', 'knob-track-attack', 'knob-track-release'
    ];
    const missingEl = [...buttonIds, ...knobIds].filter((id) => !document.getElementById(id));
    const brokenKnob = Object.entries(this.knobs)
      .filter(([, k]) => !k || !k.el || !k.el.querySelector('.knob-dial'))
      .map(([name]) => name);
    if (missingEl.length || brokenKnob.length) {
      console.error('[CYB!RM] Deck control check failed', { missingEl, brokenKnob });
      return false;
    }
    console.info(`[CYB!RM] Deck OK: ${buttonIds.length} buttons, ${knobIds.length} knobs, ${this.dom.pageBtns.length} page tabs, ${this.dom.trackTabs.length} tracks`);
    return true;
  }

  cacheDOMElements() {
    this.dom.playBtn = document.getElementById('btn-play');
    this.dom.stopBtn = document.getElementById('btn-stop');
    this.dom.bpmVal = document.getElementById('bpm-display');
    this.dom.bpmInput = document.getElementById('bpm-input');
    this.dom.tapTempoBtn = document.getElementById('btn-tap-tempo');
    this.dom.generativeBtn = document.getElementById('btn-generative');
    this.dom.recordBtn = document.getElementById('btn-record');
    this.dom.recordTimer = document.getElementById('record-timer');

    this.dom.presetSelect = document.getElementById('preset-select');
    this.dom.scaleSelect = document.getElementById('scale-select');
    this.dom.rootNoteSelect = document.getElementById('root-note-select');

    this.dom.trackTabs = document.querySelectorAll('.track-tab');
    this.dom.engineSelect = document.getElementById('track-engine-select');
    this.dom.trackMuteBtn = document.getElementById('btn-track-mute');
    this.dom.trackSoloBtn = document.getElementById('btn-track-solo');

    this.dom.stepGrid = document.getElementById('step-grid');
    this.dom.pageBtns = document.querySelectorAll('.page-btn');
    this.dom.stepLenSelect = document.getElementById('step-len-select');

    // Step inspector
    this.dom.stepPitchSelect = document.getElementById('step-pitch-select');
    this.dom.stepRatchetSelect = document.getElementById('step-ratchet-select');
    this.dom.stepProbInput = document.getElementById('step-prob-input');

    // Granular & Reverb Freeze buttons
    this.dom.freezeBtn = document.getElementById('btn-granular-freeze');
    this.dom.reverbInfiniteBtn = document.getElementById('btn-reverb-infinite');

    this.dom.visModeBtn = document.getElementById('btn-vis-mode');
    this.dom.chordPadsContainer = document.getElementById('chord-pads-container');
    this.dom.midiStatus = document.getElementById('midi-status');
  }

  initMasterKnobs() {
    // Tape Saturation
    this.knobs.tapeDrive = new CyberKnob(document.getElementById('knob-tape-drive'), {
      label: 'DRIVE', min: 0, max: 1, value: 0.35, unit: '%',
      onChange: (v) => this.app.masterFx.setTapeDrive(v)
    });
    this.knobs.tapeFlutter = new CyberKnob(document.getElementById('knob-tape-flutter'), {
      label: 'FLUTTER', min: 0, max: 1, value: 0.25, unit: '%',
      onChange: (v) => this.app.masterFx.setTapeFlutter(v)
    });

    // Delay
    this.knobs.delayTime = new CyberKnob(document.getElementById('knob-delay-time'), {
      label: 'TIME', min: 0.05, max: 1.5, value: 0.375, unit: 'ms', decimals: 0,
      onChange: (v) => this.app.masterFx.setDelayTime(v)
    });
    this.knobs.delayFeedback = new CyberKnob(document.getElementById('knob-delay-feedback'), {
      label: 'FEEDBK', min: 0, max: 0.62, value: 0.5, unit: '%',
      onChange: (v) => this.app.masterFx.setDelayFeedback(v)
    });

    // Space Reverb
    this.knobs.reverbDecay = new CyberKnob(document.getElementById('knob-reverb-decay'), {
      label: 'SPACE', min: 0.2, max: 0.9, value: 0.82, unit: '%',
      onChange: (v) => this.app.masterFx.setReverbDecay(v)
    });

    // Bitcrusher
    this.knobs.bitcrushMix = new CyberKnob(document.getElementById('knob-bitcrush-mix'), {
      label: 'CRUSH', min: 0, max: 1, value: 0.0, unit: '%',
      onChange: (v) => this.app.masterFx.setBitcrushMix(v)
    });

    // Master Volume
    this.knobs.masterVol = new CyberKnob(document.getElementById('knob-master-vol'), {
      label: 'MASTER', min: 0, max: 1.2, value: 0.72, unit: '%',
      onChange: (v) => this.app.audioMgr.setMasterVolume(v)
    });

    // Swing
    this.knobs.swing = new CyberKnob(document.getElementById('knob-swing'), {
      label: 'SWING', min: 0, max: 0.75, value: 0.0, unit: '%',
      onChange: (v) => { this.app.sequencer.swing = v; }
    });
  }

  initTrackKnobs() {
    this.knobs.trackVol = new CyberKnob(document.getElementById('knob-track-vol'), {
      label: 'VOL', min: 0, max: 1.2, value: 0.65, unit: '%',
      onChange: (v) => this.getActiveTrack().setVolume(v)
    });
    this.knobs.trackPan = new CyberKnob(document.getElementById('knob-track-pan'), {
      label: 'PAN', min: -1, max: 1, value: 0.0, decimals: 2,
      onChange: (v) => this.getActiveTrack().setPan(v)
    });
    this.knobs.trackCutoff = new CyberKnob(document.getElementById('knob-track-cutoff'), {
      label: 'CUTOFF', min: 80, max: 16000, value: 3000, unit: 'Hz', decimals: 0,
      onChange: (v) => this.getActiveTrack().setCutoff(v)
    });
    this.knobs.trackRes = new CyberKnob(document.getElementById('knob-track-res'), {
      label: 'RES', min: 0.5, max: 20, value: 6, decimals: 1,
      onChange: (v) => this.getActiveTrack().setResonance(v)
    });
    this.knobs.trackSendDelay = new CyberKnob(document.getElementById('knob-track-send-delay'), {
      label: 'DELAY', min: 0, max: 1, value: 0.22, unit: '%',
      onChange: (v) => this.getActiveTrack().setSendDelay(v)
    });
    this.knobs.trackSendReverb = new CyberKnob(document.getElementById('knob-track-send-reverb'), {
      label: 'REVERB', min: 0, max: 1, value: 0.28, unit: '%',
      onChange: (v) => this.getActiveTrack().setSendReverb(v)
    });
    this.knobs.trackAttack = new CyberKnob(document.getElementById('knob-track-attack'), {
      label: 'ATK', min: 0.005, max: 2.0, value: 0.02, unit: 's', decimals: 2,
      onChange: (v) => { this.getActiveTrack().attack = v; }
    });
    this.knobs.trackRelease = new CyberKnob(document.getElementById('knob-track-release'), {
      label: 'REL', min: 0.05, max: 4.0, value: 0.4, unit: 's', decimals: 2,
      onChange: (v) => { this.getActiveTrack().release = v; }
    });
  }

  populateSelects() {
    // Engine select
    this.dom.engineSelect.innerHTML = '';
    Object.keys(ENGINE_TYPES).forEach((type) => {
      const opt = document.createElement('option');
      opt.value = type;
      opt.textContent = type.replace('_', ' ');
      this.dom.engineSelect.appendChild(opt);
    });

    // Preset select
    this.dom.presetSelect.innerHTML = '<option value="">-- CYBERPUNK SCENES --</option>';
    PRESETS.forEach((preset) => {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = preset.name;
      this.dom.presetSelect.appendChild(opt);
    });

    // Scales select
    this.dom.scaleSelect.innerHTML = '';
    Object.keys(SCALES).forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = SCALES[key].name;
      this.dom.scaleSelect.appendChild(opt);
    });

    // Root notes
    this.dom.rootNoteSelect.innerHTML = '';
    NOTE_NAMES.forEach((note, idx) => {
      const opt = document.createElement('option');
      opt.value = 36 + idx; // C2 octave base
      opt.textContent = `${note} (Oct 2)`;
      this.dom.rootNoteSelect.appendChild(opt);
    });

    // Step Pitch Select (populate from C1 to C6)
    this.dom.stepPitchSelect.innerHTML = '';
    for (let midi = 24; midi <= 84; midi++) {
      const opt = document.createElement('option');
      opt.value = midi;
      const note = NOTE_NAMES[midi % 12];
      const oct = Math.floor(midi / 12) - 1;
      opt.textContent = `${note}${oct} (${midi})`;
      this.dom.stepPitchSelect.appendChild(opt);
    }
  }

  renderChordPads() {
    this.dom.chordPadsContainer.innerHTML = '';
    CYBER_CHORDS.forEach((chord, idx) => {
      const pad = document.createElement('button');
      pad.className = 'cyber-btn chord-pad-btn';
      pad.innerHTML = `
        <span class="chord-title">${chord.name}</span>
        <span class="chord-desc">${chord.desc}</span>
      `;
      pad.addEventListener('mousedown', async () => {
        await this.app.audioMgr.resume();
        const root = parseInt(this.dom.rootNoteSelect.value, 10) || 36;
        const notes = generateChordNotes(root + 12, idx);
        const track = this.getActiveTrack();
        notes.forEach(n => track.triggerNote(n, 0.7, null, 2.5));
      });
      this.dom.chordPadsContainer.appendChild(pad);
    });
  }

  getActiveTrack() {
    return this.app.tracks[this.activeTrackIdx];
  }

  bindEvents() {
    // Transport
    this._playToken = 0;
    this.app.sequencer.onTransport = (playing) => {
      this.dom.playBtn.classList.toggle('active', playing);
    };
    this.dom.playBtn.addEventListener('click', async () => {
      const token = ++this._playToken;
      await this.app.audioMgr.resume();
      // A STOP click that landed while the context was resuming must win.
      if (token !== this._playToken) return;
      this.app.sequencer.start();
    });

    this.dom.stopBtn.addEventListener('click', () => {
      this._playToken++;
      this.app.sequencer.stop();
    });

    // BPM input
    this.dom.bpmInput.addEventListener('input', (e) => {
      const bpm = parseInt(e.target.value, 10);
      this.dom.bpmVal.textContent = bpm;
      this.app.sequencer.setBpm(bpm);
    });

    // Tap Tempo
    let tapTimes = [];
    if (this.dom.tapTempoBtn) {
      this.dom.tapTempoBtn.addEventListener('click', () => {
        const now = performance.now();
        tapTimes.push(now);
        if (tapTimes.length > 4) tapTimes.shift();
        if (tapTimes.length >= 2) {
          const intervals = [];
          for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
          }
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          if (avgInterval > 200 && avgInterval < 2000) {
            const calculatedBpm = Math.round(60000 / avgInterval);
            this.dom.bpmInput.value = calculatedBpm;
            this.dom.bpmVal.textContent = calculatedBpm;
            this.app.sequencer.setBpm(calculatedBpm);
          }
        }
      });
    }

    // Generative Ambient Matrix Toggle
    this.dom.generativeBtn.addEventListener('click', async () => {
      await this.app.audioMgr.resume();
      const isActive = this.app.generative.toggle();
      if (isActive) {
        this.dom.generativeBtn.classList.add('active-cyber-glow');
        this.dom.generativeBtn.innerHTML = '<span class="pulse-dot"></span> MATRIX RUNNING (AUTO-AMBIENT)';
      } else {
        this.dom.generativeBtn.classList.remove('active-cyber-glow');
        this.dom.generativeBtn.innerHTML = '⚡ SELF-HACK MATRIX (OFF)';
      }
    });

    // Record WAV/WebM
    let recordInterval = null;
    let recordSec = 0;
    this.dom.recordBtn.addEventListener('click', async () => {
      await this.app.audioMgr.resume();
      if (!this.app.audioMgr.isRecording) {
        const ok = this.app.audioMgr.startRecording();
        if (ok) {
          this.dom.recordBtn.classList.add('recording-pulse');
          this.dom.recordBtn.textContent = '⏹ STOP REC & EXPORT';
          recordSec = 0;
          this.dom.recordTimer.textContent = '00:00';
          recordInterval = setInterval(() => {
            recordSec++;
            const mins = String(Math.floor(recordSec / 60)).padStart(2, '0');
            const secs = String(recordSec % 60).padStart(2, '0');
            this.dom.recordTimer.textContent = `${mins}:${secs}`;
          }, 1000);
        }
      } else {
        this.app.audioMgr.stopRecording();
        this.dom.recordBtn.classList.remove('recording-pulse');
        this.dom.recordBtn.textContent = '⏺ REC SESSION';
        clearInterval(recordInterval);
        this.dom.recordTimer.textContent = 'SAVED!';
      }
    });

    // Preset select
    this.dom.presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        this.loadPreset(e.target.value);
      }
    });

    // Scale / Root change
    this.dom.scaleSelect.addEventListener('change', (e) => {
      this.app.generative.setScale(e.target.value, parseInt(this.dom.rootNoteSelect.value, 10));
    });
    this.dom.rootNoteSelect.addEventListener('change', (e) => {
      this.app.generative.setScale(this.dom.scaleSelect.value, parseInt(e.target.value, 10));
    });

    // Track tabs
    this.dom.trackTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const trackIdx = parseInt(tab.dataset.track, 10);
        this.selectTrack(trackIdx);
      });
    });

    // Engine select
    this.dom.engineSelect.addEventListener('change', (e) => {
      this.getActiveTrack().setEngine(e.target.value);
      this.updateTrackTabLabel(this.activeTrackIdx);
    });

    // Mute / Solo
    this.dom.trackMuteBtn.addEventListener('click', () => {
      const track = this.getActiveTrack();
      track.setMute(!track.muted);
      this.dom.trackMuteBtn.classList.toggle('active', track.muted);
    });

    this.dom.trackSoloBtn.addEventListener('click', () => {
      const track = this.getActiveTrack();
      track.setSolo(!track.soloed);
      this.dom.trackSoloBtn.classList.toggle('active', track.soloed);
    });

    // Page Buttons (1-16, 17-32, 33-48, 49-64)
    this.dom.pageBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dom.pageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pageIdx = parseInt(btn.dataset.page, 10);
        this.app.sequencer.setPage(pageIdx);
        this.renderSequencerGrid();
      });
    });

    // Step length select
    this.dom.stepLenSelect.addEventListener('change', (e) => {
      this.app.sequencer.setStepCount(parseInt(e.target.value, 10));
    });

    // Granular Freeze
    this.dom.freezeBtn.addEventListener('click', async () => {
      await this.app.audioMgr.resume();
      const isFrozen = this.app.masterFx.toggleGranularFreeze();
      this.dom.freezeBtn.classList.toggle('active-cyber-glow', isFrozen);
      this.dom.freezeBtn.textContent = isFrozen ? '❄ FREEZE LOCKED' : '❄ GRANULAR FREEZE';
    });

    // Reverb Infinite Space
    this.dom.reverbInfiniteBtn.addEventListener('click', async () => {
      await this.app.audioMgr.resume();
      const isInf = this.app.masterFx.toggleInfiniteReverb();
      this.dom.reverbInfiniteBtn.classList.toggle('active-cyber-glow', isInf);
      this.dom.reverbInfiniteBtn.textContent = isInf ? '∞ SPACE FROZEN' : '∞ SPACE INFINITY';
    });

    // Visualizer Mode
    this.dom.visModeBtn.addEventListener('click', () => {
      const mode = this.app.visualizer.toggleMode();
      this.dom.visModeBtn.textContent = mode === 'oscilloscope' ? 'MODE: OSCILLOSCOPE' : 'MODE: SPECTRUM';
    });

    // Step Inspector inputs
    this.dom.stepPitchSelect.addEventListener('change', (e) => {
      const note = parseInt(e.target.value, 10);
      this.app.sequencer.setStepNote(this.activeTrackIdx, this.selectedStepIdx, note);
      this.renderSequencerGrid();
    });

    this.dom.stepRatchetSelect.addEventListener('change', (e) => {
      const ratchet = parseInt(e.target.value, 10);
      this.app.sequencer.setStepRatchet(this.activeTrackIdx, this.selectedStepIdx, ratchet);
      this.renderSequencerGrid();
    });

    this.dom.stepProbInput.addEventListener('input', (e) => {
      const prob = parseInt(e.target.value, 10);
      this.app.sequencer.setStepProbability(this.activeTrackIdx, this.selectedStepIdx, prob);
    });

    // Custom sample drag and drop
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.includes('audio') || file.name.endsWith('.wav') || file.name.endsWith('.mp3')) {
          const ab = await file.arrayBuffer();
          await this.app.engines.loadSampleFromArrayBuffer(ab);
          alert(`CYB!RM: Custom Sample "${file.name}" loaded into Cyber Lo-Fi Engine!`);
        }
      }
    });

    // MIDI status listener
    this.app.midi.onDeviceStatusChange = (devices) => {
      if (devices.length > 0) {
        this.dom.midiStatus.innerHTML = `🟢 MIDI: ${devices.map(d => d.name).join(', ')}`;
        this.dom.midiStatus.classList.add('connected');
      } else {
        this.dom.midiStatus.innerHTML = `⚪ NO MIDI CONNECTED (PLAY WITH KEYBOARD)`;
        this.dom.midiStatus.classList.remove('connected');
      }
    };
  }

  selectTrack(trackIdx) {
    this.activeTrackIdx = trackIdx;
    this.dom.trackTabs.forEach((tab, idx) => {
      tab.classList.toggle('active', idx === trackIdx);
    });
    this.updateTrackUI();
    this.renderSequencerGrid();
  }

  updateTrackTabLabel(trackIdx) {
    const tab = this.dom.trackTabs[trackIdx];
    const track = this.app.tracks[trackIdx];
    if (tab && track) {
      const sub = tab.querySelector('.track-engine-name');
      if (sub) sub.textContent = track.engineType.replace('_', ' ');
    }
  }

  updateTrackUI() {
    const track = this.getActiveTrack();
    this.dom.engineSelect.value = track.engineType;
    this.dom.trackMuteBtn.classList.toggle('active', track.muted);
    this.dom.trackSoloBtn.classList.toggle('active', track.soloed);

    this.knobs.trackVol.setValue(track.volume);
    this.knobs.trackPan.setValue(track.pan);
    this.knobs.trackCutoff.setValue(track.cutoff);
    this.knobs.trackRes.setValue(track.resonance);
    this.knobs.trackSendDelay.setValue(track.sendDelay);
    this.knobs.trackSendReverb.setValue(track.sendReverb);
    this.knobs.trackAttack.setValue(track.attack);
    this.knobs.trackRelease.setValue(track.release);
  }

  renderSequencerGrid() {
    this.dom.stepGrid.innerHTML = '';
    const page = this.app.sequencer.activePage;
    const startIndex = page * 16;
    const trackIdx = this.activeTrackIdx;
    const pattern = this.app.sequencer.patterns[trackIdx];

    for (let i = 0; i < 16; i++) {
      const stepIdx = startIndex + i;
      const stepData = pattern[stepIdx] || { active: false, note: 60, ratchet: 1, probability: 100 };

      const stepBtn = document.createElement('div');
      stepBtn.className = `step-button ${stepData.active ? 'active' : ''} ${stepIdx === this.selectedStepIdx ? 'selected' : ''}`;
      stepBtn.dataset.stepIndex = stepIdx;

      // Note display label
      const noteName = NOTE_NAMES[stepData.note % 12];
      const oct = Math.floor(stepData.note / 12) - 1;
      const ratchetText = stepData.ratchet > 1 ? `<span class="step-ratchet">${stepData.ratchet}x</span>` : '';

      stepBtn.innerHTML = `
        <div class="step-led"></div>
        <div class="step-num">${stepIdx + 1}</div>
        <div class="step-note">${stepData.active ? `${noteName}${oct}` : '—'}</div>
        ${ratchetText}
      `;

      // Click toggles step or selects it
      stepBtn.addEventListener('click', (e) => {
        // Toggle active
        this.app.sequencer.toggleStep(trackIdx, stepIdx);
        this.selectStep(stepIdx);
        this.renderSequencerGrid();
      });

      // Right-click or Alt-click selects without toggling
      stepBtn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.selectStep(stepIdx);
        this.renderSequencerGrid();
      });

      this.dom.stepGrid.appendChild(stepBtn);
    }
  }

  selectStep(stepIdx) {
    this.selectedStepIdx = stepIdx;
    const stepData = this.app.sequencer.patterns[this.activeTrackIdx][stepIdx];
    if (stepData) {
      this.dom.stepPitchSelect.value = stepData.note;
      this.dom.stepRatchetSelect.value = stepData.ratchet || 1;
      this.dom.stepProbInput.value = stepData.probability !== undefined ? stepData.probability : 100;
    }
  }

  updatePlayhead(currentStep) {
    const page = this.app.sequencer.activePage;
    const startIndex = page * 16;
    const stepBtns = this.dom.stepGrid.children;

    for (let i = 0; i < 16; i++) {
      const stepIdx = startIndex + i;
      const btn = stepBtns[i];
      if (btn) {
        if (stepIdx === currentStep) {
          btn.classList.add('playing');
        } else {
          btn.classList.remove('playing');
        }
      }
    }
  }

  loadPreset(presetId) {
    const p = PRESETS.find(item => item.id === presetId);
    if (!p) return;

    this.app.sequencer.setBpm(p.bpm);
    this.dom.bpmInput.value = p.bpm;
    this.dom.bpmVal.textContent = p.bpm;

    this.app.generative.setScale(p.scale, p.rootNote);
    this.dom.scaleSelect.value = p.scale;
    this.dom.rootNoteSelect.value = p.rootNote;

    this.knobs.tapeDrive.setValue(p.tapeDrive, true);
    this.knobs.tapeFlutter.setValue(p.tapeFlutter, true);
    this.knobs.delayTime.setValue(p.delayTime, true);
    this.knobs.delayFeedback.setValue(Math.min(p.delayFeedback, 0.62), true);
    this.knobs.reverbDecay.setValue(Math.min(p.reverbDecay, 0.9), true);

    // Clear and load track patterns
    this.app.sequencer.clearAll();

    p.tracks.forEach((trackData, tIdx) => {
      const track = this.app.tracks[tIdx];
      track.setEngine(trackData.engine);
      track.setVolume(trackData.volume);
      track.setCutoff(trackData.cutoff);
      track.setResonance(trackData.resonance);
      track.setSendDelay(trackData.sendDelay);
      track.setSendReverb(trackData.sendReverb);

      this.updateTrackTabLabel(tIdx);

      // Load steps
      trackData.steps.forEach((s) => {
        this.app.sequencer.patterns[tIdx][s.step].active = s.active;
        this.app.sequencer.patterns[tIdx][s.step].note = s.note;
        this.app.sequencer.patterns[tIdx][s.step].velocity = s.vel || 0.8;
        this.app.sequencer.patterns[tIdx][s.step].ratchet = s.ratchet || 1;
      });
    });

    this.updateTrackUI();
    this.renderSequencerGrid();
  }
}
