/**
 * CYB!RM - Master & Send Effects Engine
 * 1. Tape Saturation & Wow/Flutter Drift
 * 2. Granular Freeze & Cyber Stutter Buffer
 * 3. Cyber Tape Echo (Stereo Filtered Ping-Pong Delay)
 * 4. Megacity Space Reverb (Massive algorithmic reverb with infinite freeze & shimmer)
 * 5. Cyber Decimator / Bitcrusher
 */

export class MasterEffects {
  constructor(audioManager) {
    this.audioMgr = audioManager;
    this.ctx = audioManager.ctx;

    // Master Insert Nodes
    this.inputGain = null;
    this.outputGain = null;

    // 1. Tape Saturation & Drift
    this.tapeShaper = null;
    this.tapeDelay = null;
    this.tapeLfo = null;
    this.tapeLfoGain = null;
    this.tapeDrive = 0.35;
    this.tapeFlutter = 0.25;

    // 2. Granular Freeze & Stutter Buffer
    this.isFrozen = false;
    this.granularMix = 0.0;
    this.grainBufferSize = 44100 * 2; // 2 seconds circular buffer
    this.grainBuffer = null;
    this.grainWritePtr = 0;
    this.grainScriptNode = null;
    this.freezeGain = null;
    this.dryThroughGain = null;

    // 3. Cyber Tape Delay
    this.delayNodeL = null;
    this.delayNodeR = null;
    this.delayFeedbackGain = null;
    this.delayFilter = null;
    this.delayReturnGain = null;
    this.delayTimeSec = 0.375; // e.g. dotted 8th at 120 bpm

    // 4. Megacity Space Reverb
    this.reverbReturnGain = null;
    this.isReverbFrozen = false;
    this.reverbDecayTime = 0.88;
    this.reverbCombFilters = [];
    this.reverbAllpassFilters = [];

    // 5. Bitcrusher
    this.bitcrusherNode = null;
    this.crushBits = 16;
    this.crushNormFreq = 1.0;
    this.crushMix = 0.0;
  }

  init() {
    this.ctx = this.audioMgr.ctx;

    this.inputGain = this.ctx.createGain();
    this.outputGain = this.ctx.createGain();

    this.initTapeSaturation();
    this.initCyberDelay();
    this.initSpaceReverb();
    this.initGranularFreeze();
    this.initBitcrusher();

    // Route:
    // Tracks sum to inputGain -> Tape Saturation -> Bitcrusher -> Granular -> outputGain -> audioMgr.masterGain
    // Send buses (audioMgr.delaySendBus, audioMgr.reverbSendBus) feed Delay & Reverb, which return to outputGain.

    this.inputGain.connect(this.tapeShaper);
    this.tapeShaper.connect(this.tapeDelay);
    this.tapeDelay.connect(this.dryThroughGain);
    this.dryThroughGain.connect(this.bitcrusherNode.input);
    this.bitcrusherNode.output.connect(this.outputGain);

    // Granular freeze layer is mixed in parallel
    this.freezeGain.connect(this.outputGain);

    // Returns for sends
    this.delayReturnGain.connect(this.outputGain);
    this.reverbReturnGain.connect(this.outputGain);

    // Master send bus connections
    this.audioMgr.delaySendBus.connect(this.delayFilter);
    this.audioMgr.reverbSendBus.connect(this.reverbInputGain);

    // A stuck feedback loop used to leave a full-scale DC offset on the master. This highpass lets the note through and sheds that offset.
    this.dcBlock = this.ctx.createBiquadFilter();
    this.dcBlock.type = 'highpass';
    this.dcBlock.frequency.setValueAtTime(18, this.ctx.currentTime);
    this.dcBlock.Q.setValueAtTime(0.7, this.ctx.currentTime);

    // Backstop: even with the comb/delay loops clamped above, this keeps any future FX
    // bug from reaching the master bus at more than unity instead of distorting or
    // crashing the audio thread.
    this.masterClamp = this.ctx.createWaveShaper();
    const clampCurve = new Float32Array(1024);
    for (let i = 0; i < clampCurve.length; i++) {
      clampCurve[i] = Math.tanh((i / 512) - 1);
    }
    this.masterClamp.curve = clampCurve;

    this.outputGain.connect(this.dcBlock);
    this.dcBlock.connect(this.masterClamp);
    this.masterClamp.connect(this.audioMgr.masterGain);
  }

  /* ================= 1. TAPE SATURATION & DRIFT ================= */
  initTapeSaturation() {
    this.tapeShaper = this.ctx.createWaveShaper();
    this.updateTapeCurve(this.tapeDrive);

    // Wow & Flutter: modulated short delay line
    this.tapeDelay = this.ctx.createDelay(0.05);
    this.tapeDelay.delayTime.setValueAtTime(0.005, this.ctx.currentTime);

    this.tapeLfo = this.ctx.createOscillator();
    this.tapeLfo.type = 'sine';
    this.tapeLfo.frequency.setValueAtTime(0.85, this.ctx.currentTime); // 0.85 Hz drift

    this.tapeLfoGain = this.ctx.createGain();
    this.tapeLfoGain.gain.setValueAtTime(0.0007 * this.tapeFlutter, this.ctx.currentTime);

    this.tapeLfo.connect(this.tapeLfoGain);
    this.tapeLfoGain.connect(this.tapeDelay.delayTime);
    this.tapeLfo.start();
  }

  updateTapeCurve(drive) {
    const k = drive * 18 + 1;
    const n_samples = 4096;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Asymmetric soft-clipping for tape saturation (adds even and odd harmonics)
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x)) + 0.05 * Math.sin(x * Math.PI);
    }
    this.tapeShaper.curve = curve;
  }

  setTapeDrive(val) {
    this.tapeDrive = Math.max(0, Math.min(1, val));
    this.updateTapeCurve(this.tapeDrive);
  }

  setTapeFlutter(val) {
    this.tapeFlutter = Math.max(0, Math.min(1, val));
    if (this.tapeLfoGain) {
      this.tapeLfoGain.gain.setTargetAtTime(0.0018 * this.tapeFlutter, this.ctx.currentTime, 0.05);
    }
  }

  /* ================= 2. GRANULAR FREEZE & CYBER STUTTER ================= */
  initGranularFreeze() {
    this.grainBuffer = new Float32Array(this.grainBufferSize);
    this.freezeGain = this.ctx.createGain();
    this.freezeGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.dryThroughGain = this.ctx.createGain();
    this.dryThroughGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Create ScriptProcessor / AudioWorklet fallback for real-time granular cloud
    // ScriptProcessor is globally supported across all browsers without external asset file loading
    const bufferSize = 2048;
    this.grainScriptNode = this.ctx.createScriptProcessor(bufferSize, 1, 1);

    let grainPlayPtr1 = 0;
    let grainPlayPtr2 = 10000;
    let grainSize1 = 44100 * 0.12; // 120ms
    let grainSize2 = 44100 * 0.18; // 180ms
    let grainPhase1 = 0;
    let grainPhase2 = 0;

    this.grainScriptNode.onaudioprocess = (audioProcessingEvent) => {
      const inputBuffer = audioProcessingEvent.inputBuffer;
      const outputBuffer = audioProcessingEvent.outputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      const outputData = outputBuffer.getChannelData(0);

      const bufLen = this.grainBufferSize;
      const buf = this.grainBuffer;

      for (let i = 0; i < inputBuffer.length; i++) {
        // If not frozen, write incoming audio into circular buffer
        if (!this.isFrozen) {
          buf[this.grainWritePtr] = inputData[i];
          this.grainWritePtr = (this.grainWritePtr + 1) % bufLen;
        }

        // Granular Cloud Playback
        if (this.isFrozen || this.granularMix > 0.01) {
          // Window 1 (Hann window)
          const win1 = 0.5 * (1 - Math.cos((2 * Math.PI * grainPhase1) / grainSize1));
          const sample1 = buf[Math.floor(grainPlayPtr1)] * win1;

          // Window 2
          const win2 = 0.5 * (1 - Math.cos((2 * Math.PI * grainPhase2) / grainSize2));
          const sample2 = buf[Math.floor(grainPlayPtr2)] * win2;

          outputData[i] = (sample1 + sample2) * 0.7;

          grainPlayPtr1 = (grainPlayPtr1 + 1) % bufLen;
          grainPhase1++;
          if (grainPhase1 >= grainSize1) {
            grainPhase1 = 0;
            // Spawn new grain position near write head or random in buffer
            const offset = Math.floor(Math.random() * (bufLen - grainSize1));
            grainPlayPtr1 = offset;
            grainSize1 = Math.floor(44100 * (0.05 + Math.random() * 0.2));
          }

          grainPlayPtr2 = (grainPlayPtr2 + 0.98) % bufLen; // slight pitch drift
          grainPhase2++;
          if (grainPhase2 >= grainSize2) {
            grainPhase2 = 0;
            const offset = Math.floor(Math.random() * (bufLen - grainSize2));
            grainPlayPtr2 = offset;
            grainSize2 = Math.floor(44100 * (0.08 + Math.random() * 0.25));
          }
        } else {
          outputData[i] = 0;
        }
      }
    };

    this.grainScriptNode.connect(this.freezeGain);
  }

  toggleGranularFreeze() {
    this.isFrozen = !this.isFrozen;
    const now = this.ctx.currentTime;
    if (this.isFrozen) {
      try { this.tapeDelay.connect(this.grainScriptNode); } catch (e) {}
      this.freezeGain.gain.setTargetAtTime(1.0, now, 0.05);
      this.dryThroughGain.gain.setTargetAtTime(0.4, now, 0.1);
    } else {
      try { this.tapeDelay.disconnect(this.grainScriptNode); } catch (e) {}
      this.freezeGain.gain.setTargetAtTime(0.0, now, 0.1);
      this.dryThroughGain.gain.setTargetAtTime(1.0, now, 0.05);
    }
    return this.isFrozen;
  }

  /* ================= 3. CYBER TAPE DELAY ================= */
  initCyberDelay() {
    this.delayNodeL = this.ctx.createDelay(2.0);
    this.delayNodeR = this.ctx.createDelay(2.0);
    this.delayNodeL.delayTime.setValueAtTime(this.delayTimeSec, this.ctx.currentTime);
    this.delayNodeR.delayTime.setValueAtTime(this.delayTimeSec * 1.333, this.ctx.currentTime); // Dotted feel

    this.delayNodeL.channelCount = 1;
    this.delayNodeL.channelCountMode = 'explicit';
    this.delayNodeR.channelCount = 1;
    this.delayNodeR.channelCountMode = 'explicit';

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.channelCount = 1;
    this.delayFeedbackGain.channelCountMode = 'explicit';
    this.delayFeedbackGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    this.delayFeedback = 0.45;

    // Tape darkening lowpass filter
    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(2600, this.ctx.currentTime);
    this.delayFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    // Highpass to cut low mud
    const delayHp = this.ctx.createBiquadFilter();
    delayHp.type = 'highpass';
    delayHp.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.delayReturnGain = this.ctx.createGain();
    this.delayReturnGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    // Delay Graph:
    // delayFilter -> delayHp -> DelayL & DelayR -> Feedback -> delayFilter
    // DelayL & DelayR -> delayReturnGain
    const merger = this.ctx.createChannelMerger(2);
    this.delayFilter.connect(delayHp);
    delayHp.connect(this.delayNodeL);
    delayHp.connect(this.delayNodeR);

    // Only the left tap feeds the loop. Both taps used to add together and push the loop over unity.
    const loopClip = this.ctx.createWaveShaper();
    const clipCurve = new Float32Array(256);
    for (let i = 0; i < clipCurve.length; i++) {
      const x = (i / 128) - 1;
      clipCurve[i] = Math.tanh(x);
    }
    loopClip.curve = clipCurve;
    this.delayNodeL.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(loopClip);
    loopClip.connect(this.delayFilter);

    this.delayNodeL.connect(merger, 0, 0);
    this.delayNodeR.connect(merger, 0, 1);
    merger.connect(this.delayReturnGain);
  }

  setDelayTime(seconds) {
    this.delayTimeSec = Math.max(0.02, Math.min(1.8, seconds));
    const now = this.ctx.currentTime;
    this.delayNodeL.delayTime.setTargetAtTime(this.delayTimeSec, now, 0.05);
    this.delayNodeR.delayTime.setTargetAtTime(this.delayTimeSec * 1.333, now, 0.05);
  }

  setDelayFeedback(val) {
    const clamped = Math.max(0, Math.min(0.72, val));
    this.delayFeedback = clamped;
    if (this._tailsHalted) return;
    this.delayFeedbackGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  setDelayFilter(freq) {
    const clamped = Math.max(300, Math.min(12000, freq));
    this.delayFilter.frequency.setTargetAtTime(clamped, this.ctx.currentTime, 0.05);
  }

  /* ================= 4. MEGACITY SPACE REVERB ================= */
  initSpaceReverb() {
    this.reverbInputGain = this.ctx.createGain();
    this.reverbReturnGain = this.ctx.createGain();
    this.reverbReturnGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    // Highpass to eliminate low-end rumble in huge reverb
    const reverbHp = this.ctx.createBiquadFilter();
    reverbHp.type = 'highpass';
    reverbHp.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.reverbInputGain.connect(reverbHp);

    // 6 Parallel Comb Filters (Schroeder / Freeverb architecture for massive space)
    // Each loop carries a hard tanh clamp: the lowpass's Q=1 resonance stacked with a
    // near-1.0 feedback gain pushed the round-trip gain just over unity at the damping
    // filter's cutoff, so the comb slowly grew without bound instead of decaying (the
    // sound that "broke" a few seconds after pressing play). The clamp caps the loop's
    // own signal, not just the final mix, so the resonance can no longer compound.
    const combDelays = [0.0297, 0.0371, 0.0411, 0.0437, 0.0493, 0.0531];
    const combGains = [];
    const combSum = this.ctx.createGain();
    combSum.gain.setValueAtTime(0.16, this.ctx.currentTime);

    const combClipCurve = new Float32Array(256);
    for (let i = 0; i < combClipCurve.length; i++) {
      combClipCurve[i] = Math.tanh(((i / 128) - 1) * 1.4);
    }

    combDelays.forEach((delayTime) => {
      const delay = this.ctx.createDelay(0.1);
      delay.delayTime.setValueAtTime(delayTime, this.ctx.currentTime);

      const feedback = this.ctx.createGain();
      feedback.gain.setValueAtTime(this.reverbDecayTime, this.ctx.currentTime);

      // Lowpass damping filter in comb loop. Explicit low Q keeps it flat (no resonant
      // peak) so the loop's gain at any frequency never exceeds the feedback value.
      const damping = this.ctx.createBiquadFilter();
      damping.type = 'lowpass';
      damping.frequency.setValueAtTime(4500, this.ctx.currentTime);
      damping.Q.setValueAtTime(0.5, this.ctx.currentTime);

      const loopClamp = this.ctx.createWaveShaper();
      loopClamp.curve = combClipCurve;

      reverbHp.connect(delay);
      delay.connect(damping);
      damping.connect(feedback);
      feedback.connect(loopClamp);
      loopClamp.connect(delay);
      damping.connect(combSum);

      combGains.push(feedback);
      this.reverbCombFilters.push({ delay, feedback, damping });
    });

    // 3 Series All-Pass Diffusers
    const allpassDelays = [0.005, 0.0017, 0.0008];
    let prevNode = combSum;

    allpassDelays.forEach((apTime) => {
      const into = this.ctx.createGain();
      const apDelay = this.ctx.createDelay(0.02);
      apDelay.delayTime.setValueAtTime(apTime, this.ctx.currentTime);
      const feed = this.ctx.createGain();
      feed.gain.setValueAtTime(0.5, this.ctx.currentTime);
      const invert = this.ctx.createGain();
      invert.gain.setValueAtTime(-0.5, this.ctx.currentTime);
      const direct = this.ctx.createGain();
      direct.gain.setValueAtTime(0.5, this.ctx.currentTime);
      const apSum = this.ctx.createGain();

      prevNode.connect(into);
      prevNode.connect(direct);
      direct.connect(apSum);
      into.connect(apDelay);
      apDelay.connect(invert);
      invert.connect(apSum);
      apDelay.connect(feed);
      feed.connect(into);

      prevNode = apSum;
      this.reverbAllpassFilters.push(apDelay);
    });

    // Shimmer / Space Tone Filter
    const shimmerFilter = this.ctx.createBiquadFilter();
    shimmerFilter.type = 'highshelf';
    shimmerFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
    shimmerFilter.gain.setValueAtTime(4.0, this.ctx.currentTime);

    prevNode.connect(shimmerFilter);
    shimmerFilter.connect(this.reverbReturnGain);
  }

  setReverbDecay(val) {
    this.reverbDecayTime = Math.max(0.2, Math.min(0.985, val));
    if (!this.isReverbFrozen && !this._tailsHalted) {
      const now = this.ctx.currentTime;
      this.reverbCombFilters.forEach(({ feedback }) => {
        feedback.gain.setTargetAtTime(this.reverbDecayTime, now, 0.05);
      });
    }
  }

  toggleInfiniteReverb() {
    this.isReverbFrozen = !this.isReverbFrozen;
    const now = this.ctx.currentTime;
    const targetGain = this.isReverbFrozen ? 0.999 : this.reverbDecayTime;
    this.reverbCombFilters.forEach(({ feedback }) => {
      feedback.gain.setTargetAtTime(targetGain, now, 0.05);
    });
    return this.isReverbFrozen;
  }

  /* ================= 5. CYBER DECIMATOR / BITCRUSHER ================= */
  initBitcrusher() {
    const input = this.ctx.createGain();
    const output = this.ctx.createGain();
    const dry = this.ctx.createGain();
    const wet = this.ctx.createGain();

    wet.gain.setValueAtTime(0.0, this.ctx.currentTime);
    dry.gain.setValueAtTime(1.0, this.ctx.currentTime);

    const bufferSize = 2048;
    const crusher = this.ctx.createScriptProcessor(bufferSize, 1, 1);

    let lastSample = 0;
    let phs = 0;

    crusher.onaudioprocess = (e) => {
      const inBuf = e.inputBuffer.getChannelData(0);
      const outBuf = e.outputBuffer.getChannelData(0);

      const bits = this.crushBits;
      const step = Math.pow(0.5, bits);
      const normFreq = this.crushNormFreq;

      for (let i = 0; i < inBuf.length; i++) {
        phs += normFreq;
        if (phs >= 1.0) {
          phs -= 1.0;
          // Quantize amplitude
          lastSample = step * Math.floor(inBuf[i] / step + 0.5);
        }
        outBuf[i] = lastSample;
      }
    };

    input.connect(dry);
    crusher.connect(wet);
    this.crusher = crusher;
    this.crusherInput = input;
    this.crusherLive = false;

    dry.connect(output);
    wet.connect(output);

    this.bitcrusherNode = { input, output, dry, wet };
  }

  setBitcrushMix(val) {
    this.crushMix = Math.max(0, Math.min(1, val));
    const now = this.ctx.currentTime;
    if (this.crushMix > 0.001 && !this.crusherLive) {
      this.crusherInput.connect(this.crusher);
      this.crusherLive = true;
    } else if (this.crushMix <= 0.001 && this.crusherLive) {
      try { this.crusherInput.disconnect(this.crusher); } catch (e) {}
      this.crusherLive = false;
    }
    this.bitcrusherNode.wet.gain.setTargetAtTime(this.crushMix, now, 0.02);
    this.bitcrusherNode.dry.gain.setTargetAtTime(1.0 - this.crushMix * 0.5, now, 0.02);
  }

  setBitcrushBits(bits) {
    this.crushBits = Math.max(3, Math.min(16, bits));
  }

  setBitcrushDownsample(val) {
    // val 0.05 to 1.0 (1.0 = normal, 0.05 = heavily downsampled)
    this.crushNormFreq = Math.max(0.02, Math.min(1.0, val));
  }

  // STOP. Notes already have a scheduled end, and the delay/reverb buses keep
  // sounding after the voices go quiet. Drop those returns until the next play.
  haltTails() {
    if (this._tailsHalted) return;
    this._tailsHalted = true;
    const now = this.ctx.currentTime;
    const zero = (node) => {
      node.gain.cancelScheduledValues(now);
      node.gain.setValueAtTime(0, now);
    };
    zero(this.delayReturnGain);
    zero(this.delayFeedbackGain);
    zero(this.reverbReturnGain);
    this.reverbCombFilters.forEach(({ feedback }) => zero(feedback));
  }

  restoreTails() {
    if (!this._tailsHalted) return;
    this._tailsHalted = false;
    const now = this.ctx.currentTime;
    const fb = this.delayFeedback !== undefined ? this.delayFeedback : 0.45;
    // Keep the returns closed long enough for the old delay line and combs to empty.
    this.delayFeedbackGain.gain.setValueAtTime(0, now);
    this.delayFeedbackGain.gain.setValueAtTime(fb, now + 0.55);
    this.delayReturnGain.gain.setValueAtTime(0, now);
    this.delayReturnGain.gain.setValueAtTime(0.7, now + 0.55);
    const decay = this.isReverbFrozen ? 0.999 : this.reverbDecayTime;
    this.reverbCombFilters.forEach(({ feedback }) => {
      feedback.gain.setValueAtTime(0, now);
      feedback.gain.setValueAtTime(decay, now + 0.12);
    });
    this.reverbReturnGain.gain.setValueAtTime(0, now);
    this.reverbReturnGain.gain.setValueAtTime(0.85, now + 0.2);
  }
}
