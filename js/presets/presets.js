/**
 * CYB!RM - Curated Cyberpunk Atmospheric Presets
 * Pre-configured scenes with complete track assignments, engine settings,
 * FX configurations, and pre-programmed 16/32-step patterns.
 */

import { ENGINE_TYPES } from '../audio/engines.js';

export const PRESETS = [
  {
    id: 'blade_runner_2049',
    name: 'Blade Runner 2049 (Rain & Brass)',
    bpm: 74,
    scale: 'INSEN',
    rootNote: 36, // C2
    tapeDrive: 0.42,
    tapeFlutter: 0.35,
    delayTime: 0.45,
    delayFeedback: 0.6,
    reverbDecay: 0.94,
    tracks: [
      {
        engine: ENGINE_TYPES.CYBER_ANALOG,
        volume: 0.85,
        cutoff: 850,
        resonance: 4.5,
        sendDelay: 0.2,
        sendReverb: 0.4,
        steps: [
          { step: 0, note: 36, active: true, vel: 0.9 },
          { step: 8, note: 37, active: true, vel: 0.8 }
        ]
      },
      {
        engine: ENGINE_TYPES.NEON_FM,
        volume: 0.75,
        cutoff: 3500,
        resonance: 6,
        sendDelay: 0.55,
        sendReverb: 0.65,
        steps: [
          { step: 4, note: 60, active: true, vel: 0.85 },
          { step: 7, note: 61, active: true, vel: 0.7, ratchet: 2 },
          { step: 12, note: 65, active: true, vel: 0.8 }
        ]
      },
      {
        engine: ENGINE_TYPES.ANDROID_CHOIR,
        volume: 0.7,
        cutoff: 2200,
        resonance: 3,
        sendDelay: 0.35,
        sendReverb: 0.85,
        steps: [
          { step: 0, note: 48, active: true, vel: 0.8 },
          { step: 8, note: 49, active: true, vel: 0.75 }
        ]
      },
      {
        engine: ENGINE_TYPES.CYBER_LOFI,
        volume: 0.6,
        cutoff: 4000,
        resonance: 2,
        sendDelay: 0.4,
        sendReverb: 0.5,
        steps: [
          { step: 0, note: 60, active: true, vel: 0.6 },
          { step: 2, note: 60, active: true, vel: 0.4 },
          { step: 6, note: 60, active: true, vel: 0.5, ratchet: 2 },
          { step: 10, note: 60, active: true, vel: 0.4 },
          { step: 14, note: 60, active: true, vel: 0.55 }
        ]
      }
    ]
  },
  {
    id: 'neo_tokyo_market',
    name: 'Neo-Tokyo Night Market (FM & 303)',
    bpm: 96,
    scale: 'HIRAJOSHI',
    rootNote: 38, // D2
    tapeDrive: 0.55,
    tapeFlutter: 0.2,
    delayTime: 0.312,
    delayFeedback: 0.65,
    reverbDecay: 0.86,
    tracks: [
      {
        engine: ENGINE_TYPES.ACID_303,
        volume: 0.85,
        cutoff: 1200,
        resonance: 14,
        sendDelay: 0.35,
        sendReverb: 0.3,
        steps: [
          { step: 0, note: 38, active: true, vel: 0.9 },
          { step: 3, note: 40, active: true, vel: 0.7 },
          { step: 6, note: 41, active: true, vel: 0.85 },
          { step: 8, note: 38, active: true, vel: 0.8 },
          { step: 11, note: 45, active: true, vel: 0.95 },
          { step: 14, note: 41, active: true, vel: 0.7 }
        ]
      },
      {
        engine: ENGINE_TYPES.NEON_FM,
        volume: 0.78,
        cutoff: 4500,
        resonance: 7,
        sendDelay: 0.6,
        sendReverb: 0.5,
        steps: [
          { step: 2, note: 62, active: true, vel: 0.8 },
          { step: 5, note: 65, active: true, vel: 0.75, ratchet: 2 },
          { step: 10, note: 67, active: true, vel: 0.85 },
          { step: 13, note: 70, active: true, vel: 0.7 }
        ]
      },
      {
        engine: ENGINE_TYPES.METALLIC_RESONATOR,
        volume: 0.7,
        cutoff: 3800,
        resonance: 5,
        sendDelay: 0.5,
        sendReverb: 0.7,
        steps: [
          { step: 4, note: 50, active: true, vel: 0.75 },
          { step: 12, note: 53, active: true, vel: 0.8 }
        ]
      },
      {
        engine: ENGINE_TYPES.CYBER_LOFI,
        volume: 0.65,
        cutoff: 6000,
        resonance: 4,
        sendDelay: 0.3,
        sendReverb: 0.4,
        steps: [
          { step: 0, note: 62, active: true, vel: 0.85 },
          { step: 4, note: 62, active: true, vel: 0.6, ratchet: 3 },
          { step: 8, note: 62, active: true, vel: 0.85 },
          { step: 12, note: 62, active: true, vel: 0.7 }
        ]
      }
    ]
  },
  {
    id: 'cyberdeck_infiltration',
    name: 'Cyberdeck Infiltration (Dark Minimal)',
    bpm: 82,
    scale: 'PHRYGIAN_DOMINANT',
    rootNote: 36,
    tapeDrive: 0.65,
    tapeFlutter: 0.4,
    delayTime: 0.365,
    delayFeedback: 0.7,
    reverbDecay: 0.9,
    tracks: [
      {
        engine: ENGINE_TYPES.CYBER_ANALOG,
        volume: 0.9,
        cutoff: 650,
        resonance: 7,
        sendDelay: 0.25,
        sendReverb: 0.35,
        steps: [
          { step: 0, note: 36, active: true, vel: 0.95 },
          { step: 6, note: 37, active: true, vel: 0.8 },
          { step: 10, note: 40, active: true, vel: 0.85 }
        ]
      },
      {
        engine: ENGINE_TYPES.METALLIC_RESONATOR,
        volume: 0.75,
        cutoff: 4200,
        resonance: 8,
        sendDelay: 0.6,
        sendReverb: 0.6,
        steps: [
          { step: 3, note: 60, active: true, vel: 0.7 },
          { step: 8, note: 61, active: true, vel: 0.85, ratchet: 2 },
          { step: 14, note: 64, active: true, vel: 0.75 }
        ]
      },
      {
        engine: ENGINE_TYPES.ANDROID_CHOIR,
        volume: 0.68,
        cutoff: 1800,
        resonance: 4,
        sendDelay: 0.4,
        sendReverb: 0.88,
        steps: [
          { step: 0, note: 48, active: true, vel: 0.75 },
          { step: 8, note: 49, active: true, vel: 0.8 }
        ]
      },
      {
        engine: ENGINE_TYPES.CYBER_LOFI,
        volume: 0.7,
        cutoff: 5000,
        resonance: 3,
        sendDelay: 0.45,
        sendReverb: 0.4,
        steps: [
          { step: 2, note: 60, active: true, vel: 0.5 },
          { step: 6, note: 60, active: true, vel: 0.75, ratchet: 2 },
          { step: 10, note: 60, active: true, vel: 0.6 },
          { step: 14, note: 60, active: true, vel: 0.8, ratchet: 3 }
        ]
      }
    ]
  },
  {
    id: 'off_world_orbital',
    name: 'Off-World Orbital (Infinite Space Drone)',
    bpm: 58,
    scale: 'CYBER_DORIAN',
    rootNote: 33, // A1
    tapeDrive: 0.3,
    tapeFlutter: 0.45,
    delayTime: 0.52,
    delayFeedback: 0.75,
    reverbDecay: 0.98,
    tracks: [
      {
        engine: ENGINE_TYPES.DRONE_MEGAPAD,
        volume: 0.88,
        cutoff: 1400,
        resonance: 3,
        sendDelay: 0.4,
        sendReverb: 0.92,
        steps: [
          { step: 0, note: 33, active: true, vel: 0.85 },
          { step: 8, note: 40, active: true, vel: 0.8 }
        ]
      },
      {
        engine: ENGINE_TYPES.NEON_FM,
        volume: 0.72,
        cutoff: 3800,
        resonance: 5,
        sendDelay: 0.7,
        sendReverb: 0.75,
        steps: [
          { step: 4, note: 69, active: true, vel: 0.7 },
          { step: 11, note: 72, active: true, vel: 0.75 }
        ]
      },
      {
        engine: ENGINE_TYPES.ANDROID_CHOIR,
        volume: 0.7,
        cutoff: 2000,
        resonance: 4,
        sendDelay: 0.5,
        sendReverb: 0.95,
        steps: [
          { step: 0, note: 45, active: true, vel: 0.8 },
          { step: 8, note: 48, active: true, vel: 0.75 }
        ]
      },
      {
        engine: ENGINE_TYPES.CYBER_LOFI,
        volume: 0.5,
        cutoff: 2800,
        resonance: 2,
        sendDelay: 0.5,
        sendReverb: 0.7,
        steps: [
          { step: 0, note: 57, active: true, vel: 0.4 },
          { step: 8, note: 57, active: true, vel: 0.45 }
        ]
      }
    ]
  }
];
