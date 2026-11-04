# CYB!RM

> **Cyberpunk Atmospheric Sound Matrix & Groovebox**  
> *Directly inspired by the architecture and philosophy of [GRiMMBIENT/grimm](https://github.com/GRiMMBIENT/grimm), re-imagined for Dystopian Sci-Fi, Neon Noir, and Cyberdeck soundscapes.*

---

## ⚡ Overview

**CYB!RM** preserves the core 4-track groovebox & atmospheric sound generator architecture of the legendary **GR!MM** (created for the M-VAVE FM-1), shifting the aesthetic from medieval dark ambient and dungeon synth into **Cyberpunk, Neon Noir, and Industrial Sci-Fi**.

It is built as a zero-dependency, high-performance web synthesizer using the **Web Audio API**, **Canvas CRT visuals**, and **WebMIDI**, ready to run directly in any modern browser without complex build setups or toolchains.

The FM-1 firmware lives in this repository, not in a GR!MM checkout. `firmware/src/` is the GPL-3.0 engine (the same feature logic: 4 tracks, 7 sources, sequencer, tape, grain, delay, space). The boot screen says **CYB!RM**, the default accent is neon cyan, and the factory sounds and scales are the neon-noir set. Build it from this directory with `./build.sh` once the JieLi toolchain is installed (`tools/get_toolchain.sh`). The package is `build/grimm.fwsc` (the installer name; the program on the device is CYB!RM). Install with `python3 tools/fm1_install.py build/grimm.fwsc` while the FM-1 is connected.

---

## 🎛️ Architecture Comparison: GR!MM vs CYB!RM

| Feature | GR!MM (Original) | CYB!RM (Cyberpunk Edition) |
| :--- | :--- | :--- |
| **Aesthetic** | Dark Ambient, Dungeon Synth, Deathdream | Neon Noir, Cyberdeck, Blade Runner, Darksynth |
| **Tracks** | 4 independent tracks | 4 independent tracks (Sub/Bass, Lead, Choir/Pad, Glitch) |
| **Analog Engine** | Organ & Low-fi Saw Drones | **Cyber-Analog:** Dual detuned saw/pulse with sub-osc & resonant lowpass |
| **FM Engine** | 6-Operator FM Bells & Metals | **Neon-FM:** Algorithmic carrier/modulator with decay envelope & metallic feedback |
| **Physical Model** | String / Primitive Acoustic Pipe | **Metallic Resonator:** Karplus-Strong industrial pipe & cyber-cable resonator |
| **Vocal Engine** | Gregorian Chants & Murmurs | **Android Choir:** 3-band vowel formant filters ([A], [O], [U], [I]) with vocal vibrato |
| **Sampler / Lo-Fi** | Recorded Choirs & Cassette Noise | **Cyber Lo-Fi:** Neo-Tokyo acid rain generator, telemetry bursts, and custom WAV drag & drop |
| **Acid Synthesis** | Monophonic organ drone | **Acid 303:** Screaming 24dB diode ladder filter, diode clipping, accent & slide |
| **Pad Engine** | Organ sustain | **Drone Megapad:** Quad-oscillator ambient cloud with slow beating frequency drift |
| **Tape Effects** | Tape saturation & wow/flutter | **Tape & VHS Drift:** Asymmetric saturation shaper + LFO pitch wow & flutter |
| **Audio Freeze** | Granular buffer freeze | **Granular Freeze & Buffer Lock:** Real-time circular buffer grain player (40-200ms) |
| **Space Reverb** | Infinite cavern reverb | **Megacity Space Reverb:** 6 comb filters + 3 allpass diffusers + infinite freeze toggle |
| **Sequencer** | 64 steps, self-playing modes | **64 steps (4 pages of 16), ratchets (1x-4x), probability, swing, and generative engine** |
| **Scales** | Phrygian, Dorian, Harmonic Minor | **Insen, Hirajoshi, Phrygian Dominant, Cyber Dorian, Iwato, Whole Tone** |

---

## 🚀 Quick Start

Run the included startup script:

```bash
./start.sh
```

Or start Python's built-in HTTP server:

```bash
python3 -m http.server 8080
```

Then open your browser at:  
👉 **`http://localhost:8080`**

---

## 🎹 Control & Interaction

### 1. Computer Keyboard (QWERTY Piano)
Play the active track in real-time with your keyboard:
* **White Keys:** `A` (C), `S` (D), `D` (E), `F` (F), `G` (G), `H` (A), `J` (B), `K` (C)
* **Black Keys:** `W` (C#), `E` (D#), `T` (F#), `Y` (G#), `U` (A#)
* **Octave Shift:** `Z` (Octave Down), `X` (Octave Up)
* **Transport:** `SPACE` (Play / Stop Sequencer)

### 2. WebMIDI Controllers
Connect any physical USB or Bluetooth MIDI controller (e.g. M-VAVE, Launchpad, Arturia, Korg). The app auto-detects incoming MIDI:
* **Note On/Off & Velocity:** Triggers the currently selected track.
* **CC 1 / CC 74 (Mod Wheel / Cutoff):** Modulates active filter cutoff.
* **CC 71 (Resonance):** Modulates filter resonance.
* **CC 91 / CC 93:** Modulates Reverb & Delay sends.
* **CC 7:** Channel volume.

### 3. Step Sequencer
* **Step Pads:** Click any of the 16 step pads to toggle active notes on/off.
* **Page Buttons:** Switch between pages (`1-16`, `17-32`, `33-48`, `49-64`) for sequences up to 64 steps.
* **Step Inspector:** Select a step to customize its **Pitch**, **Ratchet** (`1x`, `2x` roll, `3x` triplet, `4x` burst), and trigger **Probability** (`0-100%`).

### 4. Self-Hacking Matrix (Autonomous Ambient Engine)
Click **`⚡ SELF-HACK MATRIX`** to activate generative dark ambient mode. The engine will:
* Procedurally generate chord swells on the Android Choir and Megapad.
* Trigger rhythmic FM lead plucks and acid sub pulses in the selected Cyberpunk scale.
* Evolve filter sweeps, resonance, and delay send spikes organically.

### 5. Custom Samples
Drag and drop any `.wav` or `.mp3` audio file directly into the browser window. It will be decoded and assigned to the **CYBER LO-FI** engine with chromatic pitch tracking!

### 6. Live Session Recording
Click **`⏺ REC SESSION`** to record high-fidelity master output. When you click **STOP**, CYB!RM instantly generates and downloads a `.webm`/`.wav` audio file with your session.

---

## 📂 Project Structure

```
cybirm/
├── index.html                # Cyberdeck CRT interface & HUD
├── css/
│   ├── cyberpunk.css         # Cyberpunk design system, scanlines, knobs, LEDs
│   └── components.css        # Channel strips, sequencer grid, mixer layout
├── js/
│   ├── app.js                # Bootstrap and master coordinator
│   ├── audio/
│   │   ├── audio-context.js  # AudioContext, master bus limiter, WAV recorder
│   │   ├── engines.js        # The 7 Sound Engines (Analog, FM, Resonator, Formant, etc.)
│   │   ├── track.js          # Track DSP class, routing, sends, and voice allocation
│   │   └── effects.js        # Tape Saturation, Granular Freeze, Delay, Space Reverb
│   ├── sequencer/
│   │   ├── sequencer.js      # Precision lookahead clock, ratchets, probability, swing
│   │   ├── scales.js         # Cyberpunk scales (Insen, Hirajoshi, Phrygian Dominant)
│   │   └── generative.js     # Autonomous Self-Hacking Matrix ambient engine
│   ├── midi/
│   │   └── midi-handler.js   # WebMIDI API and QWERTY keyboard listener
│   ├── ui/
│   │   ├── visualizer.js     # Neon Oscilloscope & Spectrum Canvas visualizer
│   │   ├── knob.js           # Precision hardware rotary knob component
│   │   └── ui-controller.js  # UI bindings, presets, and playhead updates
│   └── presets/
│       └── presets.js        # Pre-configured cyberpunk soundscapes
├── start.sh                  # One-click startup script
└── README.md                 # Documentation and user manual
```

---

## 📜 License & Credits

* Inspired by **GR!MM** by [GRiMMBIENT](https://github.com/GRiMMBIENT/grimm).
* Built under the **GPL-3.0** open-source license.
