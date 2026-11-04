/**
 * CYB!RM - WebMIDI & Computer Keyboard Interface
 * Seamless integration with physical MIDI keyboards, controllers (M-VAVE, Launchpad, Arturia, etc.)
 * and standard QWERTY computer keyboards.
 */

export class MidiHandler {
  constructor(tracksGetter, activeTrackGetter, sequencer) {
    this.getTracks = tracksGetter;
    this.getActiveTrack = activeTrackGetter;
    this.sequencer = sequencer;
    /** Called before sequencer.start() from the keyboard (AudioContext resume). */
    this.onBeforePlay = null;

    this.midiAccess = null;
    this.connectedDevices = [];
    this.baseOctave = 3; // C3 (Midi 48)

    // Computer Keyboard key map
    this.keyMap = {
      'KeyA': 0,  // C
      'KeyW': 1,  // C#
      'KeyS': 2,  // D
      'KeyE': 3,  // D#
      'KeyD': 4,  // E
      'KeyF': 5,  // F
      'KeyT': 6,  // F#
      'KeyG': 7,  // G
      'KeyY': 8,  // G#
      'KeyH': 9,  // A
      'KeyU': 10, // A#
      'KeyJ': 11, // B
      'KeyK': 12  // C (next oct)
    };

    this.activeKeyNotes = new Map();
    this.onDeviceStatusChange = null;
  }

  async initMidi() {
    if (navigator.requestMIDIAccess) {
      try {
        this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        this.updateDevices();
        this.midiAccess.onstatechange = () => this.updateDevices();
        return true;
      } catch (err) {
        console.warn('WebMIDI Access denied or not available:', err);
        return false;
      }
    }
    return false;
  }

  updateDevices() {
    if (!this.midiAccess) return;
    this.connectedDevices = [];
    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      this.connectedDevices.push({
        id: input.id,
        name: input.name || 'Unnamed MIDI Device',
        manufacturer: input.manufacturer || 'Generic'
      });
      input.onmidimessage = (msg) => this.handleMidiMessage(msg);
    }

    if (this.onDeviceStatusChange) {
      this.onDeviceStatusChange(this.connectedDevices);
    }
  }

  handleMidiMessage(event) {
    const [status, data1, data2] = event.data;
    const command = status >> 4;
    const channel = status & 0xf;

    const currentTrack = this.getActiveTrack();
    if (!currentTrack) return;

    if (command === 0x9) {
      // Note On (or Note Off if velocity is 0)
      const note = data1;
      const velocity = data2 / 127;
      if (velocity > 0) {
        currentTrack.triggerNote(note, velocity, null, 1.0);
      } else {
        currentTrack.stopNote(note);
      }
    } else if (command === 0x8) {
      // Note Off
      currentTrack.stopNote(data1);
    } else if (command === 0xB) {
      // Control Change
      const cc = data1;
      const val = data2 / 127;
      this.handleCC(currentTrack, cc, val);
    }
  }

  handleCC(track, cc, val) {
    switch (cc) {
      case 1:  // Mod Wheel -> Cutoff
      case 74: // Brightness / Cutoff
        track.setCutoff(100 + val * 12000);
        break;
      case 71: // Resonance
        track.setResonance(val * 18 + 0.5);
        break;
      case 7:  // Channel Volume
        track.setVolume(val);
        break;
      case 91: // Reverb Send
        track.setSendReverb(val);
        break;
      case 93: // Delay Send
        track.setSendDelay(val);
        break;
    }
  }

  initKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input field
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.repeat) return;

      // Octave switching
      if (e.code === 'KeyZ') {
        this.baseOctave = Math.max(1, this.baseOctave - 1);
        return;
      }
      if (e.code === 'KeyX') {
        this.baseOctave = Math.min(6, this.baseOctave + 1);
        return;
      }

      // Spacebar toggles Play/Stop
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.sequencer.isPlaying) {
          this.sequencer.stop();
        } else {
          const go = async () => {
            if (this.onBeforePlay) await this.onBeforePlay();
            this.sequencer.start();
          };
          go();
        }
        return;
      }

      // Note keys
      if (this.keyMap.hasOwnProperty(e.code)) {
        const offset = this.keyMap[e.code];
        const midi = (this.baseOctave + 1) * 12 + offset;
        const track = this.getActiveTrack();
        if (track) {
          track.triggerNote(midi, 0.85, null, 1.2);
          this.activeKeyNotes.set(e.code, midi);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.activeKeyNotes.has(e.code)) {
        const midi = this.activeKeyNotes.get(e.code);
        const track = this.getActiveTrack();
        if (track) {
          track.stopNote(midi);
        }
        this.activeKeyNotes.delete(e.code);
      }
    });
  }
}
