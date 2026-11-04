/**
 * CYB!RM - Track DSP Module
 * Represents one of the 4 independent tracks in the groovebox/sound generator.
 * Handles engine routing, volume, panning, filter, FX sends, and active voice tracking.
 */

import { ENGINE_TYPES } from './engines.js';

export class Track {
  constructor(id, name, defaultEngine, audioMgr, engines, masterEffects) {
    this.id = id;
    this.name = name;
    this.audioMgr = audioMgr;
    this.engines = engines;
    this.masterFx = masterEffects;
    this.ctx = audioMgr.ctx;

    this.engineType = defaultEngine;
    this.muted = false;
    this.soloed = false;

    // Track Parameters
    this.volume = 0.65;
    this.pan = 0.0;
    this.sendDelay = 0.22;
    this.sendReverb = 0.28;
    this.cutoff = 3000;
    this.resonance = 6;
    this.attack = 0.02;
    this.release = 0.4;
    this.engineParams = {
      fmRatio: 2.0,
      fmDepth: 450,
      vowel: 'O',
      resonatorDecay: 0.98,
      detune: 12
    };

    // Active voice map { note: voiceHandle }
    this.activeVoices = new Map();

    // Node graph
    this.trackInput = null;
    this.trackFilter = null;
    this.trackGain = null;
    this.panner = null;
    this.sendDelayGain = null;
    this.sendReverbGain = null;
  }

  init() {
    this.ctx = this.audioMgr.ctx;

    this.trackInput = this.ctx.createGain();

    // Dedicated Track Multi-Mode Filter
    this.trackFilter = this.ctx.createBiquadFilter();
    this.trackFilter.type = 'lowpass';
    this.trackFilter.frequency.setValueAtTime(this.cutoff, this.ctx.currentTime);
    this.trackFilter.Q.setValueAtTime(this.resonance, this.ctx.currentTime);

    // Track Volume Gain
    this.trackGain = this.ctx.createGain();
    this.trackGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Stereo Panner
    if (this.ctx.createStereoPanner) {
      this.panner = this.ctx.createStereoPanner();
      this.panner.pan.setValueAtTime(this.pan, this.ctx.currentTime);
    } else {
      // Fallback for older browsers
      this.panner = this.ctx.createGain();
    }

    // Sends to Master Effects Buses
    this.sendDelayGain = this.ctx.createGain();
    this.sendDelayGain.gain.setValueAtTime(this.sendDelay, this.ctx.currentTime);

    this.sendReverbGain = this.ctx.createGain();
    this.sendReverbGain.gain.setValueAtTime(this.sendReverb, this.ctx.currentTime);

    // Graph Connection:
    // trackInput -> trackFilter -> trackGain -> panner
    // panner -> masterEffects.inputGain (Dry)
    // panner -> sendDelayGain -> audioMgr.delaySendBus
    // panner -> sendReverbGain -> audioMgr.reverbSendBus

    this.trackInput.connect(this.trackFilter);
    this.trackFilter.connect(this.trackGain);
    this.trackGain.connect(this.panner);

    this.panner.connect(this.masterFx.inputGain);
    this.panner.connect(this.sendDelayGain);
    this.sendDelayGain.connect(this.audioMgr.delaySendBus);

    this.panner.connect(this.sendReverbGain);
    this.sendReverbGain.connect(this.audioMgr.reverbSendBus);
  }

  triggerNote(note, velocity = 0.8, time = null, duration = 0.5) {
    if (this.muted) return null;
    const now = time !== null ? time : this.ctx.currentTime;

    const mergedParams = {
      cutoff: this.cutoff,
      resonance: this.resonance,
      attack: this.attack,
      release: this.release,
      ...this.engineParams
    };

    const handle = this.engines.trigger(
      this.engineType,
      this.trackInput,
      note,
      velocity,
      now,
      duration,
      mergedParams
    );

    this.activeVoices.set(note, handle);
    return handle;
  }

  stopNote(note, time = null) {
    const handle = this.activeVoices.get(note);
    if (handle && handle.stop) {
      const now = time !== null ? time : this.ctx.currentTime;
      handle.stop(now);
      this.activeVoices.delete(note);
    }
  }

  stopAllNotes() {
    const now = this.ctx.currentTime;
    this.activeVoices.forEach((handle) => {
      if (handle && handle.stop) {
        handle.stop(now);
      }
    });
    this.activeVoices.clear();
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1.2, val));
    if (this.trackGain) {
      this.trackGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setPan(val) {
    this.pan = Math.max(-1, Math.min(1, val));
    if (this.panner && this.panner.pan) {
      this.panner.pan.setTargetAtTime(this.pan, this.ctx.currentTime, 0.02);
    }
  }

  setCutoff(freq) {
    this.cutoff = Math.max(50, Math.min(18000, freq));
    if (this.trackFilter) {
      this.trackFilter.frequency.setTargetAtTime(this.cutoff, this.ctx.currentTime, 0.02);
    }
  }

  setResonance(res) {
    this.resonance = Math.max(0.1, Math.min(24, res));
    if (this.trackFilter) {
      this.trackFilter.Q.setTargetAtTime(this.resonance, this.ctx.currentTime, 0.02);
    }
  }

  setSendDelay(val) {
    this.sendDelay = Math.max(0, Math.min(1, val));
    if (this.sendDelayGain) {
      this.sendDelayGain.gain.setTargetAtTime(this.sendDelay, this.ctx.currentTime, 0.02);
    }
  }

  setSendReverb(val) {
    this.sendReverb = Math.max(0, Math.min(1, val));
    if (this.sendReverbGain) {
      this.sendReverbGain.gain.setTargetAtTime(this.sendReverb, this.ctx.currentTime, 0.02);
    }
  }

  setMute(state) {
    this.muted = !!state;
    if (this.trackGain) {
      this.trackGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  setSolo(state) {
    this.soloed = !!state;
  }

  setEngine(type) {
    if (ENGINE_TYPES[type]) {
      this.engineType = type;
    }
  }
}
