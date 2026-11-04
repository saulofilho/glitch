/**
 * CYB!RM - The 7 Sound Engines
 * 1. CYBER_ANALOG: Detuned Saw/Pulse with Resonant Lowpass & Drive
 * 2. NEON_FM: 6-Op Inspired Algorithmic FM Synthesis
 * 3. METALLIC_RESONATOR: Physical Modeling String/Pipe Resonator
 * 4. ANDROID_CHOIR: 3-Band Formant Vocal Synthesis
 * 5. CYBER_LOFI: Field Recording / Neo-Tokyo Rain / Telemetry / Lo-Fi PCM
 * 6. ACID_303: Acid Glide Lead with Screaming Resonance
 * 7. DRONE_MEGAPAD: Quad-Oscillator Ambient Cloud Drone
 */

export function midiToFreq(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Silence a voice immediately. A second oscillator.stop() throws (each note already
// scheduled its own stop), and that throw used to abort the gain ramp, so STOP left
// the note running until its original end.
function cutGain(gain, t) {
  try { gain.cancelScheduledValues(t); } catch (e) { /* already quiet */ }
  try { gain.setValueAtTime(0, t); } catch (e) { /* node gone */ }
}

export const ENGINE_TYPES = {
  CYBER_ANALOG: 'CYBER_ANALOG',
  NEON_FM: 'NEON_FM',
  METALLIC_RESONATOR: 'METALLIC_RESONATOR',
  ANDROID_CHOIR: 'ANDROID_CHOIR',
  CYBER_LOFI: 'CYBER_LOFI',
  ACID_303: 'ACID_303',
  DRONE_MEGAPAD: 'DRONE_MEGAPAD'
};

export class SoundEngines {
  constructor(audioManager) {
    this.audioMgr = audioManager;
    this.customSampleBuffer = null;
  }

  loadSampleFromArrayBuffer(arrayBuffer) {
    return this.audioMgr.ctx.decodeAudioData(arrayBuffer).then((decoded) => {
      this.customSampleBuffer = decoded;
      return true;
    });
  }

  /**
   * Dispatches note trigger to the appropriate engine.
   */
  trigger(engineType, dest, note, velocity = 0.8, time = null, duration = 0.5, params = {}) {
    const ctx = this.audioMgr.ctx;
    const startTime = time !== null ? time : ctx.currentTime;
    const freq = midiToFreq(note);

    switch (engineType) {
      case ENGINE_TYPES.CYBER_ANALOG:
        return this.triggerCyberAnalog(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.NEON_FM:
        return this.triggerNeonFM(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.METALLIC_RESONATOR:
        return this.triggerMetallicResonator(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.ANDROID_CHOIR:
        return this.triggerAndroidChoir(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.CYBER_LOFI:
        return this.triggerCyberLofi(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.ACID_303:
        return this.triggerAcid303(ctx, dest, freq, velocity, startTime, duration, params);
      case ENGINE_TYPES.DRONE_MEGAPAD:
        return this.triggerDroneMegapad(ctx, dest, freq, velocity, startTime, duration, params);
      default:
        return this.triggerCyberAnalog(ctx, dest, freq, velocity, startTime, duration, params);
    }
  }

  /* ================= 1. CYBER ANALOG ================= */
  triggerCyberAnalog(ctx, dest, freq, vel, time, dur, params) {
    const cutoff = params.cutoff !== undefined ? params.cutoff : 1800;
    const res = params.resonance !== undefined ? params.resonance : 8;
    const detuneCents = params.detune !== undefined ? params.detune : 12;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'square';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq, time);
    subOsc.frequency.setValueAtTime(freq / 2, time); // 1 octave down

    osc1.detune.setValueAtTime(-detuneCents, time);
    osc2.detune.setValueAtTime(detuneCents, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(cutoff * 2.5, 14000), time);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + Math.max(0.1, dur * 0.4));
    filter.Q.setValueAtTime(res, time);

    const amp = ctx.createGain();
    const attack = Math.max(0.005, (params.attack || 0.02));
    const release = Math.max(0.05, (params.release || 0.4));

    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.35, time + attack);
    amp.gain.setValueAtTime(vel * 0.35, time + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(amp);
    amp.connect(dest);

    osc1.start(time);
    osc2.start(time);
    subOsc.start(time);

    const stopTime = time + dur + release + 0.05;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    subOsc.stop(stopTime);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 2. NEON FM (Carrier + Modulator with Index Envelope) ================= */
  triggerNeonFM(ctx, dest, freq, vel, time, dur, params) {
    const ratio = params.fmRatio !== undefined ? params.fmRatio : 2.0; // 1, 2, 3.5, 7
    const modDepth = (params.fmDepth !== undefined ? params.fmDepth : 450) * (vel * 1.2);

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();

    carrier.type = 'sine';
    modulator.type = 'sine';

    carrier.frequency.setValueAtTime(freq, time);
    modulator.frequency.setValueAtTime(freq * ratio, time);

    // Modulation envelope (bright metallic pluck decaying to warm bell tone)
    modGain.gain.setValueAtTime(modDepth, time);
    modGain.gain.exponentialRampToValueAtTime(Math.max(5, modDepth * 0.08), time + dur);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const amp = ctx.createGain();
    const attack = Math.max(0.002, params.attack || 0.01);
    const release = Math.max(0.08, params.release || 0.6);

    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.45, time + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);

    carrier.connect(amp);
    amp.connect(dest);

    carrier.start(time);
    modulator.start(time);

    const stopTime = time + dur + release + 0.05;
    carrier.stop(stopTime);
    modulator.stop(stopTime);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 3. METALLIC RESONATOR (Physical Modeling) ================= */
  triggerMetallicResonator(ctx, dest, freq, vel, time, dur, params) {
    // Karplus-Strong string / acoustic pipe resonator
    const delayPeriod = 1.0 / Math.max(40, Math.min(2000, freq));
    const delay = ctx.createDelay(0.1);
    delay.delayTime.setValueAtTime(delayPeriod, time);

    const feedback = ctx.createGain();
    const decay = params.resonatorDecay !== undefined ? params.resonatorDecay : 0.982;
    feedback.gain.setValueAtTime(decay, time);

    // Damping lowpass filter in feedback loop
    const damping = ctx.createBiquadFilter();
    damping.type = 'lowpass';
    damping.frequency.setValueAtTime(params.dampingFreq || 3500, time);

    delay.connect(damping);
    damping.connect(feedback);
    feedback.connect(delay);

    // Excitation Noise Burst / Metallic Pluck
    const burstLength = 0.008; // 8ms
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * burstLength), ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * vel;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(vel * 0.6, time);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur * 1.5 + 0.5);

    noise.connect(delay);
    damping.connect(amp);
    amp.connect(dest);

    noise.start(time);
    const stopTime = time + dur * 1.5 + 0.6;
    setTimeout(() => {
      try {
        delay.disconnect();
        feedback.disconnect();
        damping.disconnect();
        amp.disconnect();
      } catch (e) {}
    }, (stopTime - ctx.currentTime) * 1000 + 100);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 4. ANDROID CHOIR (Formant Vocal Synthesis) ================= */
  triggerAndroidChoir(ctx, dest, freq, vel, time, dur, params) {
    // Vowel formants: [F1, F2, F3]
    // Japanese / Cyber android vowels: "A", "O", "U"
    const vowels = {
      A: [800, 1200, 2500],
      O: [500, 850, 2400],
      U: [350, 600, 2200],
      I: [270, 2200, 3000]
    };
    const chosen = vowels[params.vowel || 'O'];

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Subtle vibrato LFO
    const vibLfo = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vibLfo.frequency.setValueAtTime(4.8, time); // 4.8 Hz natural vocal vibrato
    vibGain.gain.setValueAtTime(freq * 0.015, time); // 1.5% vibrato depth
    vibLfo.connect(vibGain);
    vibGain.connect(osc.frequency);
    vibLfo.start(time);

    // 3 Parallel Formant Bandpass Filters
    const formantSum = ctx.createGain();
    formantSum.gain.setValueAtTime(0.7, time);

    chosen.forEach((fCenter, idx) => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(fCenter, time);
      bp.Q.setValueAtTime(8 + idx * 3, time);

      osc.connect(bp);
      bp.connect(formantSum);
    });

    const amp = ctx.createGain();
    const attack = Math.max(0.1, params.attack || 0.25);
    const release = Math.max(0.2, params.release || 0.8);

    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.4, time + attack);
    amp.gain.setValueAtTime(vel * 0.4, time + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);

    formantSum.connect(amp);
    amp.connect(dest);

    osc.start(time);
    const stopTime = time + dur + release + 0.1;
    osc.stop(stopTime);
    vibLfo.stop(stopTime);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 5. CYBER LO-FI (Rain / Telemetry / Sample) ================= */
  triggerCyberLofi(ctx, dest, freq, vel, time, dur, params) {
    if (this.customSampleBuffer) {
      // Play loaded sample with pitch shift according to MIDI note (base C3 = 60)
      const src = ctx.createBufferSource();
      src.buffer = this.customSampleBuffer;
      const rate = freq / 261.63; // C4 ratio
      src.playbackRate.setValueAtTime(Math.max(0.1, Math.min(4.0, rate)), time);

      const amp = ctx.createGain();
      amp.gain.setValueAtTime(vel * 0.7, time);
      amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.2);

      src.connect(amp);
      amp.connect(dest);
      src.start(time);
      src.stop(time + dur + 0.25);
      return { stop: (t) => cutGain(amp.gain, t) };
    }

    // Procedural Cyberpunk Rain & Telemetry Generator
    const noiseLength = Math.max(0.1, dur + 0.3);
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseLength), ctx.sampleRate);
    const out = buffer.getChannelData(0);
    for (let i = 0; i < out.length; i++) {
      // Pinkish noise with occasional water/glitch drop
      const drop = Math.random() < 0.0015 ? (Math.random() * 2 - 1) * 2 : 0;
      out[i] = (Math.random() * 2 - 1) * 0.4 + drop;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, time);
    filter.Q.setValueAtTime(3.5, time);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.5, time + 0.03);
    amp.gain.setValueAtTime(vel * 0.5, time + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.3);

    noiseSrc.connect(filter);
    filter.connect(amp);
    amp.connect(dest);

    noiseSrc.start(time);
    noiseSrc.stop(time + dur + 0.35);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 6. ACID 303 (Glide Lead & Resonant Filter) ================= */
  triggerAcid303(ctx, dest, freq, vel, time, dur, params) {
    const osc = ctx.createOscillator();
    osc.type = params.wave || 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    // Diode style 24dB ladder simulation with 2 cascaded filters
    const f1 = ctx.createBiquadFilter();
    const f2 = ctx.createBiquadFilter();
    f1.type = 'lowpass';
    f2.type = 'lowpass';

    const baseCutoff = params.cutoff !== undefined ? params.cutoff : 600;
    const peakCutoff = Math.min(11000, baseCutoff + 4000 * vel);
    const res = Math.min(22, (params.resonance !== undefined ? params.resonance : 14));

    f1.Q.setValueAtTime(res * 0.5, time);
    f2.Q.setValueAtTime(res * 0.7, time);

    f1.frequency.setValueAtTime(peakCutoff, time);
    f1.frequency.exponentialRampToValueAtTime(baseCutoff, time + dur * 0.7);

    f2.frequency.setValueAtTime(peakCutoff, time);
    f2.frequency.exponentialRampToValueAtTime(baseCutoff, time + dur * 0.7);

    // Overdrive shaper
    const drive = ctx.createWaveShaper();
    const curve = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const x = (i / 256) - 1;
      curve[i] = Math.tanh(x * 2.8);
    }
    drive.curve = curve;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.4, time + 0.005);
    amp.gain.setValueAtTime(vel * 0.4, time + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.15);

    osc.connect(f1);
    f1.connect(f2);
    f2.connect(drive);
    drive.connect(amp);
    amp.connect(dest);

    osc.start(time);
    const stopTime = time + dur + 0.2;
    osc.stop(stopTime);

    return { stop: (t) => cutGain(amp.gain, t) };
  }

  /* ================= 7. DRONE MEGAPAD (Quad-Oscillator Cloud) ================= */
  triggerDroneMegapad(ctx, dest, freq, vel, time, dur, params) {
    const oscs = [];
    const detunes = [-14, -4, 5, 16];
    const waves = ['sawtooth', 'triangle', 'sawtooth', 'sine'];

    const padSum = ctx.createGain();
    padSum.gain.setValueAtTime(0.25, time);

    // Multi-pole lowpass filter with slow drift
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = params.cutoff !== undefined ? params.cutoff : 1200;
    filter.frequency.setValueAtTime(cutoff * 0.8, time);
    filter.frequency.linearRampToValueAtTime(cutoff * 1.3, time + dur * 0.5);
    filter.frequency.linearRampToValueAtTime(cutoff * 0.7, time + dur);
    filter.Q.setValueAtTime(3.0, time);

    detunes.forEach((cents, i) => {
      const o = ctx.createOscillator();
      o.type = waves[i];
      o.frequency.setValueAtTime(freq, time);
      o.detune.setValueAtTime(cents, time);
      o.connect(padSum);
      oscs.push(o);
    });

    const amp = ctx.createGain();
    const attack = Math.max(0.4, params.attack || 0.8);
    const release = Math.max(0.6, params.release || 1.8);

    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.linearRampToValueAtTime(vel * 0.38, time + attack);
    amp.gain.setValueAtTime(vel * 0.38, time + dur);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + release);

    padSum.connect(filter);
    filter.connect(amp);
    amp.connect(dest);

    oscs.forEach(o => o.start(time));
    const stopTime = time + dur + release + 0.2;
    oscs.forEach(o => o.stop(stopTime));

    return { stop: (t) => cutGain(amp.gain, t) };
  }
}
