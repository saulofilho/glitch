/**
 * CYB!RM - Cyberpunk Scales, Notes & Chord Generator
 * Provides exotic futuristic scales (Insen, Hirajoshi, Phrygian Dominant, Cyber Dorian)
 * and one-touch ambient cyberpunk chords.
 */

export const SCALES = {
  INSEN: {
    name: 'Insen (Blade Runner / Cyberpunk)',
    intervals: [0, 1, 5, 7, 10]
  },
  HIRAJOSHI: {
    name: 'Hirajoshi (Neo-Tokyo Melancholy)',
    intervals: [0, 2, 3, 7, 8]
  },
  PHRYGIAN_DOMINANT: {
    name: 'Phrygian Dominant (Dark Cybertech)',
    intervals: [0, 1, 4, 5, 7, 8, 10]
  },
  CYBER_DORIAN: {
    name: 'Cyber Dorian (Sci-Fi Neon)',
    intervals: [0, 2, 3, 5, 7, 9, 10]
  },
  AEOLIAN: {
    name: 'Aeolian (Dystopian Minor)',
    intervals: [0, 2, 3, 5, 7, 8, 10]
  },
  MINOR_PENTATONIC: {
    name: 'Minor Pentatonic (Noir Blues)',
    intervals: [0, 3, 5, 7, 10]
  },
  IWATO: {
    name: 'Iwato (Ancient Cyber Mystic)',
    intervals: [0, 1, 5, 6, 10]
  },
  WHOLE_TONE: {
    name: 'Whole Tone (Hacker Glitch)',
    intervals: [0, 2, 4, 6, 8, 10]
  }
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToNoteName(midi) {
  const note = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

export function noteNameToMidi(name) {
  const match = name.match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 60;
  const noteIdx = NOTE_NAMES.indexOf(match[1].toUpperCase());
  const octave = parseInt(match[2], 10);
  return (octave + 1) * 12 + noteIdx;
}

export function getScaleNotes(rootMidi, scaleKey, numOctaves = 4) {
  const scale = SCALES[scaleKey] || SCALES.INSEN;
  const notes = [];
  const baseRoot = rootMidi % 12;
  const startOctave = Math.floor(rootMidi / 12) - 1;

  for (let oct = 0; oct < numOctaves; oct++) {
    const octBase = (startOctave + oct + 1) * 12 + baseRoot;
    scale.intervals.forEach((interval) => {
      const midi = octBase + interval;
      if (midi >= 24 && midi <= 108) {
        notes.push(midi);
      }
    });
  }
  return notes;
}

/**
 * Cyberpunk Chord Voicings for One-Touch Pads
 */
export const CYBER_CHORDS = [
  { name: 'Min9 (Blade Runner)', intervals: [0, 3, 7, 10, 14], desc: 'Moody deep neon harmony' },
  { name: 'Min11 (Megacity)', intervals: [0, 3, 7, 10, 14, 17], desc: 'Ethereal expansive soundscape' },
  { name: 'Maj7#11 (CS-80 Sci-Fi)', intervals: [0, 4, 7, 11, 18], desc: 'Vangelis soaring chord' },
  { name: 'Sus4 Add9 (Shibuya Rain)', intervals: [0, 5, 7, 14], desc: 'Open unresolved tension' },
  { name: 'Phryg m2 (Dark Infiltration)', intervals: [0, 1, 7, 8, 12], desc: 'Dystopian cinematic edge' },
  { name: 'Power Drone (Sub Bastion)', intervals: [0, 7, 12, 19, 24], desc: 'Heavy monolithic sub stack' }
];

export function generateChordNotes(rootMidi, chordIdx) {
  const chord = CYBER_CHORDS[chordIdx] || CYBER_CHORDS[0];
  return chord.intervals.map(interval => rootMidi + interval);
}
