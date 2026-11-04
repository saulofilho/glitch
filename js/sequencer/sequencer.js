/**
 * CYB!RM - 4-Track 64-Step Sequencer
 * Precision Lookahead Audio Scheduler (zero jitter)
 * Features per step: Active, Note, Velocity, Ratchet (1x, 2x, 3x, 4x), Probability (0-100%)
 */

export class StepSequencer {
  constructor(audioManager, tracks, masterFx) {
    this.audioMgr = audioManager;
    this.tracks = tracks; // Array of 4 Track instances
    this.masterFx = masterFx || null;
    this.ctx = audioManager.ctx;

    this.isPlaying = false;
    this.bpm = 84;
    this.swing = 0.0; // 0 to 0.75
    this.stepCount = 16; // 16, 32, or 64
    this.currentStep = 0;
    this.activePage = 0; // 0: 1-16, 1: 17-32, 2: 33-48, 3: 49-64

    // Precision lookahead timing variables
    this.lookaheadMs = 25.0; // How frequently to call scheduling function (ms)
    this.scheduleAheadTimeSec = 0.1; // How far ahead to schedule audio (sec)
    this.nextStepTime = 0.0;
    this.timerId = null;

    // Pattern data: 4 tracks x 64 steps
    this.patterns = [];
    this.initPatterns();

    // UI step change callback
    this.onStepChange = null;
  }

  initPatterns() {
    this.patterns = [];
    for (let t = 0; t < 4; t++) {
      const steps = [];
      const defaultNotes = [36, 48, 60, 48]; // Base octave per track
      for (let s = 0; s < 64; s++) {
        steps.push({
          active: false,
          note: defaultNotes[t],
          velocity: 0.85,
          ratchet: 1, // 1 = normal, 2 = double, 3 = triplet, 4 = quad
          probability: 100 // 100% trigger chance
        });
      }
      this.patterns.push(steps);
    }
  }

  setBpm(bpm) {
    this.bpm = Math.max(30, Math.min(260, bpm));
  }

  setStepCount(count) {
    this.stepCount = [16, 32, 64].includes(count) ? count : 16;
    if (this.currentStep >= this.stepCount) {
      this.currentStep = 0;
    }
  }

  setPage(pageIndex) {
    this.activePage = Math.max(0, Math.min(3, pageIndex));
  }

  start() {
    if (this.isPlaying) return;
    this.ctx = this.audioMgr.ctx;
    if (this.masterFx) this.masterFx.restoreTails();
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.scheduleLoop();
    if (this.onTransport) this.onTransport(true);
  }

  stop() {
    // Always close the effect tails, even if the clock was already stopped.
    if (this.masterFx) this.masterFx.haltTails();
    if (!this.isPlaying) {
      if (this.onTransport) this.onTransport(false);
      return;
    }
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.tracks.forEach(track => track.stopAllNotes());
    if (this.onStepChange) {
      this.onStepChange(-1);
    }
    if (this.onTransport) this.onTransport(false);
  }

  scheduleLoop() {
    if (!this.isPlaying) return;

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTimeSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.timerId = setTimeout(() => this.scheduleLoop(), this.lookaheadMs);
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = 0.25 * secondsPerBeat; // 16th note

    // Apply swing on odd steps (1, 3, 5, etc.)
    let swingOffset = 0;
    if (this.currentStep % 2 === 1) {
      swingOffset = stepDuration * (this.swing * 0.35);
    }

    this.nextStepTime += stepDuration + swingOffset;
    this.currentStep = (this.currentStep + 1) % this.stepCount;
  }

  scheduleStep(stepIndex, time) {
    // Notify UI for current step display at exact audio time
    const timeDeltaMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying && this.onStepChange) {
        this.onStepChange(stepIndex);
      }
    }, timeDeltaMs);

    // Schedule audio for all 4 tracks
    for (let t = 0; t < 4; t++) {
      const track = this.tracks[t];
      const stepData = this.patterns[t][stepIndex];

      if (stepData && stepData.active) {
        // Probability check (0-100%)
        if (stepData.probability < 100) {
          const roll = Math.random() * 100;
          if (roll > stepData.probability) {
            continue; // Skipped by chance
          }
        }

        const ratchet = Math.max(1, Math.min(4, stepData.ratchet || 1));
        const secondsPerBeat = 60.0 / this.bpm;
        const subStepDuration = (0.25 * secondsPerBeat) / ratchet;
        const noteDuration = subStepDuration * 0.85;

        for (let r = 0; r < ratchet; r++) {
          const subTime = time + r * subStepDuration;
          const subVel = stepData.velocity * (1.0 - r * 0.12); // subtle roll decay
          track.triggerNote(stepData.note, subVel, subTime, noteDuration);
        }
      }
    }
  }

  toggleStep(trackIdx, stepIdx) {
    if (this.patterns[trackIdx] && this.patterns[trackIdx][stepIdx]) {
      this.patterns[trackIdx][stepIdx].active = !this.patterns[trackIdx][stepIdx].active;
      return this.patterns[trackIdx][stepIdx].active;
    }
    return false;
  }

  setStepNote(trackIdx, stepIdx, note) {
    if (this.patterns[trackIdx] && this.patterns[trackIdx][stepIdx]) {
      this.patterns[trackIdx][stepIdx].note = note;
    }
  }

  setStepVelocity(trackIdx, stepIdx, vel) {
    if (this.patterns[trackIdx] && this.patterns[trackIdx][stepIdx]) {
      this.patterns[trackIdx][stepIdx].velocity = Math.max(0.1, Math.min(1.0, vel));
    }
  }

  setStepRatchet(trackIdx, stepIdx, ratchet) {
    if (this.patterns[trackIdx] && this.patterns[trackIdx][stepIdx]) {
      this.patterns[trackIdx][stepIdx].ratchet = ratchet;
    }
  }

  setStepProbability(trackIdx, stepIdx, prob) {
    if (this.patterns[trackIdx] && this.patterns[trackIdx][stepIdx]) {
      this.patterns[trackIdx][stepIdx].probability = Math.max(0, Math.min(100, prob));
    }
  }

  clearTrack(trackIdx) {
    if (this.patterns[trackIdx]) {
      this.patterns[trackIdx].forEach(step => step.active = false);
    }
  }

  clearAll() {
    this.patterns.forEach(trackSteps => {
      trackSteps.forEach(step => step.active = false);
    });
  }
}
