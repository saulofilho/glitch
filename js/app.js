/**
 * CYB!RM - Cyberpunk Atmospheric Sound Generator & Groovebox
 * Main Application Bootstrap
 */

import { AudioManager } from './audio/audio-context.js';
import { SoundEngines, ENGINE_TYPES } from './audio/engines.js';
import { MasterEffects } from './audio/effects.js';
import { Track } from './audio/track.js';
import { StepSequencer } from './sequencer/sequencer.js';
import { GenerativeMatrix } from './sequencer/generative.js';
import { MidiHandler } from './midi/midi-handler.js';
import { AudioVisualizer } from './ui/visualizer.js';
import { UIController } from './ui/ui-controller.js';
import { startRain } from './ui/rain.js';

class CybirmApp {
  constructor() {
    this.audioMgr = new AudioManager();
    this.engines = new SoundEngines(this.audioMgr);
    this.masterFx = new MasterEffects(this.audioMgr);

    // Create the 4 Tracks
    this.tracks = [
      new Track(0, 'TRK 1 - SUB/BASS', ENGINE_TYPES.CYBER_ANALOG, this.audioMgr, this.engines, this.masterFx),
      new Track(1, 'TRK 2 - NEON LEAD', ENGINE_TYPES.NEON_FM, this.audioMgr, this.engines, this.masterFx),
      new Track(2, 'TRK 3 - CHOIR/PAD', ENGINE_TYPES.ANDROID_CHOIR, this.audioMgr, this.engines, this.masterFx),
      new Track(3, 'TRK 4 - GLITCH/PERC', ENGINE_TYPES.CYBER_LOFI, this.audioMgr, this.engines, this.masterFx)
    ];

    this.sequencer = new StepSequencer(this.audioMgr, this.tracks);
    this.generative = new GenerativeMatrix(this.audioMgr, this.tracks, this.sequencer);

    this.midi = new MidiHandler(
      () => this.tracks,
      () => this.ui ? this.ui.getActiveTrack() : this.tracks[0],
      this.sequencer
    );

    this.visualizer = null;
    this.ui = null;
  }

  async init() {
    // 1. Initialize Audio Context & Master Chain
    this.audioMgr.init();
    this.masterFx.init();

    // 2. Initialize each track DSP node graph
    this.tracks.forEach(track => track.init());

    // 3. Initialize Visualizer
    const canvas = document.getElementById('crt-screen-canvas');
    if (canvas) {
      this.visualizer = new AudioVisualizer(canvas, this.audioMgr);
      this.visualizer.start();
    }

    // 4. Initialize UI Controller
    this.ui = new UIController(this);
    this.ui.init();
    startRain(document.getElementById('city-rain'));

    // 5. Connect Sequencer Step callback to UI Playhead
    this.sequencer.onStepChange = (step) => {
      this.ui.updatePlayhead(step);
    };

    // 6. Initialize WebMIDI & Computer Keyboard
    this.midi.initMidi();
    this.midi.initKeyboardListeners();

    // 7. Load default initial preset: "Blade Runner 2049"
    this.ui.loadPreset('blade_runner_2049');

    console.log('%c CYB!RM %c Cyberdeck Sound Matrix Initialized ', 'background: #00f3ff; color: #000; font-weight: bold;', 'background: #111; color: #00f3ff;');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new CybirmApp();
  app.init();
  window.CYBIRMAP = app; // Accessible in console for debugging
});
