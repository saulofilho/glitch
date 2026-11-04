/**
 * CYB!RM - Self-Hacking Matrix (Autonomous Generative Ambient Engine)
 * Directly implements GR!MM's generative / self-playing ambient philosophy.
 * Creates continuously evolving soundscapes without manual step programming:
 * - Generates evolving drone foundations
 * - Mutates patterns procedurally using Cyberpunk scale intervals
 * - Modulates filter cutoffs, resonance, and Space Reverb sends dynamically
 */

import { getScaleNotes, generateChordNotes } from './scales.js';

export class GenerativeMatrix {
  constructor(audioManager, tracks, sequencer) {
    this.audioMgr = audioManager;
    this.tracks = tracks;
    this.sequencer = sequencer;
    this.ctx = audioManager.ctx;

    this.isActive = false;
    this.timerId = null;
    this.scaleKey = 'INSEN';
    this.rootNote = 36; // C2

    this.density = 0.55; // Note spawn probability
    this.mutationRate = 0.3; // Sequence mutation chance
    this.cycleStep = 0;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.tick();
  }

  stop() {
    this.isActive = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  toggle() {
    if (this.isActive) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  setScale(scaleKey, rootNote = 36) {
    this.scaleKey = scaleKey;
    this.rootNote = rootNote;
  }

  tick() {
    if (!this.isActive) return;

    this.cycleStep++;
    const scaleNotes = getScaleNotes(this.rootNote, this.scaleKey, 5);

    // 1. Every 4 ticks, trigger a rich evolving drone/chord on Track 3 (Choir/Pad)
    if (this.cycleStep % 6 === 0) {
      const padTrack = this.tracks[2];
      const chordNotes = generateChordNotes(this.rootNote + 12, Math.floor(Math.random() * 6));
      const dur = 4.5 + Math.random() * 3.5;
      chordNotes.forEach((n) => {
        padTrack.triggerNote(n, 0.45 + Math.random() * 0.25, null, dur);
      });

      // Modulate pad cutoff slowly
      padTrack.setCutoff(600 + Math.random() * 2400);
    }

    // 2. Sub-bass pulse on Track 1 (Analog Sub)
    if (this.cycleStep % 4 === 0) {
      const subTrack = this.tracks[0];
      const subNote = this.rootNote + (Math.random() < 0.3 ? 7 : 0);
      subTrack.triggerNote(subNote, 0.8, null, 2.2);
    }

    // 3. Procedural Neon Lead / Arp trigger on Track 2 (FM)
    if (Math.random() < this.density) {
      const arpTrack = this.tracks[1];
      const randomNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
      arpTrack.triggerNote(randomNote, 0.5 + Math.random() * 0.4, null, 0.25 + Math.random() * 0.6);

      // Random delay send spike for atmospheric echoes
      arpTrack.setSendDelay(0.3 + Math.random() * 0.5);
    }

    // 4. Glitch / Resonator accent on Track 4 (Glitch/Resonator)
    if (Math.random() < 0.35) {
      const glitchTrack = this.tracks[3];
      const metallicNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)] + 12;
      glitchTrack.triggerNote(metallicNote, 0.6, null, 0.15);
    }

    // 5. Pattern mutation if sequencer is running alongside generative matrix
    if (this.sequencer.isPlaying && Math.random() < this.mutationRate) {
      const randomTrack = Math.floor(Math.random() * 4);
      const randomStep = Math.floor(Math.random() * this.sequencer.stepCount);
      const noteChoice = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];

      if (Math.random() < 0.4) {
        // Toggle step
        this.sequencer.toggleStep(randomTrack, randomStep);
      }
      this.sequencer.setStepNote(randomTrack, randomStep, noteChoice);
      if (Math.random() < 0.25) {
        // Add random ratchet
        this.sequencer.setStepRatchet(randomTrack, randomStep, Math.floor(Math.random() * 3) + 1);
      }
    }

    // Next tick in 600ms - 1400ms (fluid, organic generative rhythm)
    const nextInterval = 750 + (Math.sin(this.cycleStep * 0.5) * 350) + (Math.random() * 200);
    this.timerId = setTimeout(() => this.tick(), nextInterval);
  }
}
