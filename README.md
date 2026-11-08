# CYB!RM

**A neon-noir groovebox firmware for the M-VAVE FM-1.** Blade Runner factory sounds, six cyber scales, four tracks and
seven sources, tape and megacity space — on a dead-stock amber tube.

> **Version 2.0.** Unofficial firmware, not made or endorsed by M-VAVE. Install at your own risk.
> Based on [GR!MM](https://github.com/GRiMMBIENT/grimm) (see [Credits](#credits)).

**[The CYB!RM hub](https://saulofilho.github.io/cybirm/)**: the sources, scales and sounds, and how to install ·
**[Boot it in your browser](https://saulofilho.github.io/cybirm/emu/)** (the real firmware, no FM-1 needed) ·
**[The editor](https://saulofilho.github.io/cybirm/emu/editor.html)** (sounds, samples, backup over USB)

Free and open source (GPL-3.0). Re-imagined from GR!MM's dark-ambient/dungeon-synth aesthetic into cyberpunk, neon
noir and industrial sci-fi.

## What's inside

- **Seven sources**: **Cyber-Analog** (VA — dual detuned saw/pulse, sub-osc, resonant lowpass), **Neon-FM**
  (algorithmic carrier/modulator with metallic feedback), **Cyber Lo-Fi** (SAMPLE — acid rain, telemetry, your own
  WAV over USB), **Android Choir** (VOICE — 3-band vowel formants), **Grid Wheel** (tonewheel drones), **Metallic
  Resonator** (PHYS — Karplus-Strong pipe and cable), and **Phase** (phase-distortion plates and glitch leads).
- **Sixteen scales**: Chromatic, Aeolian, Major, **Cyber Dorian**, Phrygian, Lydian, Mixolydian, Locrian, Harmonic
  Minor, **Phrygian Dominant**, **Iwato**, **Whole Tone**, **Noir Pentatonic**, Major Pentatonic, **Insen**,
  **Hirajoshi**. The keys snap to the scale; hold a key for its one-key chord.
- **Forty-four factory sounds** across nine categories — DRONE, PAD, BELL, ORGAN, KEYS, BASS, TEXTURE, VOICE, OTHER:
  NEON PAD, RAIN VEIL, ICE HALL, CITY ABYSS, DATA BELL, PIPE GONG, ANDROID GHOST, MEGACITY CHOIR, NOIR ORGAN, CHROME
  PIANO, CS80 BRASS, GLITCH LEAD, ACID RAIN…
- **From GR!MM**: 4 tracks, a 64-step sequencer per track with swing, chance and ratchets, song mode, arpeggiator,
  one-key chords, GENERATE, tape, grain, delay, and megacity space reverb (6 combs + 3 allpass + infinite freeze),
  MIDI in.

## Architecture: GR!MM → CYB!RM

| Feature | GR!MM (Original) | CYB!RM (Cyberpunk Edition) |
| :--- | :--- | :--- |
| **Aesthetic** | Dark Ambient, Dungeon Synth, Deathdream | Neon Noir, Cyberdeck, Blade Runner, Darksynth |
| **Tracks** | 4 independent tracks | 4 independent tracks (Sub/Bass, Lead, Choir/Pad, Glitch) |
| **Analog Engine** | Organ & Low-fi Saw Drones | **Cyber-Analog:** Dual detuned saw/pulse with sub-osc & resonant lowpass |
| **FM Engine** | 6-Operator FM Bells & Metals | **Neon-FM:** Algorithmic carrier/modulator with decay envelope & metallic feedback |
| **Physical Model** | String / Primitive Acoustic Pipe | **Metallic Resonator:** Karplus-Strong industrial pipe & cyber-cable resonator |
| **Vocal Engine** | Gregorian Chants & Murmurs | **Android Choir:** 3-band vowel formant filters ([A], [O], [U], [I]) with vocal vibrato |
| **Sampler / Lo-Fi** | Recorded Choirs & Cassette Noise | **Cyber Lo-Fi:** Neo-Tokyo acid rain, telemetry bursts, and custom WAV over USB |
| **Space Reverb** | Infinite cavern reverb | **Megacity Space Reverb:** 6 comb filters + 3 allpass diffusers + infinite freeze toggle |
| **Sequencer** | 64 steps, self-playing modes | **64 steps, ratchets (1×–4×), probability, swing, and a generative engine** |
| **Scales** | Phrygian, Dorian, Harmonic Minor | **Insen, Hirajoshi, Phrygian Dominant, Cyber Dorian, Iwato, Whole Tone** |

## Try it in the browser

The emulator is `firmware/src/grimm.c` itself — the code the FM-1 runs — compiled to WebAssembly and played on a fake
FM-1 (`firmware/src/fm1_web.c`). No hardware needed.

```bash
python3 -m http.server 8080
```

- **`http://localhost:8080/hub/`** — the hub: a phosphor-CRT terminal with the sources, scales, sounds and install.
- **`http://localhost:8080/hub/emu/`** — the FM-1 panel. Computer keyboard or Web MIDI.
- **`http://localhost:8080/hub/emu/editor.html`** — the editor: sounds, samples, and a backup of the unit (Chrome or Edge).

To rebuild the WebAssembly from source you need Emscripten:

```bash
web/build_web.sh           # -> web/dist/ (then: python3 tools/gen_hub.py copies it into hub/emu/)
```

## Install on the FM-1

On the unit the boot screen reads **CYB!RM**; colour 1 is cyan.

```bash
tools/get_toolchain.sh                         # the JieLi toolchain (once)
./build.sh --name cybirm.fwsc                  # -> build/cybirm.fwsc
python3 tools/fm1_install.py build/cybirm.fwsc # flash a connected FM-1 over USB
```

## The hub

`tools/gen_hub.py` makes the hub's data from the firmware source and copies the web build into it:

```bash
python3 tools/gen_hub.py --version 2.0
```

- `hub/cybirm-data.js` — the scales (`firmware/src/scale.c`), the factory sounds (`store.c`) and the sources.
- `hub/emu/` — the WebAssembly emulator and the editor (from `web/dist`).
- `hub/og.png` — the 1200×630 social card, drawn by `hub/og-card.html` (open it to re-export).

If a host build exists (`tests/run_host.sh`, Linux), `gen_hub.py` also renders a short audio teaser to
`hub/audio/demo.{mp3,wav}` — a WAV when no encoder is around, an MP3 when `ffmpeg` is on the PATH — which the hub
surfaces as a **HEAR IT** button. Pass `--no-audio` to skip it. The hub's live sound is the emulator either way.

`.github/workflows/pages.yml` publishes `hub/` to GitHub Pages; `release.yml` builds and attests
`build/cybirm-X.Y.fwsc` when you push a `v*` tag.

## Project structure

```
cybirm/
├── firmware/            # the GPL-3.0 engine (firmware/src/: 4 tracks, 7 sources, sequencer, tape, space)
├── hub/                 # the GitHub Pages site: index.html (landing), cybirm-data.js, emu/ (the emulator)
├── web/                 # the browser build: panel.js, worklet.js, editor, build_web.sh -> web/dist
├── tools/               # build.py, fm1_install.py, gen_hub.py, get_toolchain.sh …
├── tests/               # host-mode tests (tests/run_host.sh)
├── docs/                # API, building, protocols, screens
├── build.sh             # build the .fwsc package (JieLi toolchain)
├── MANUAL.md            # the full manual
└── README.md
```

## Credits

- Based on **GR!MM** by [GRiMMBIENT](https://github.com/GRiMMBIENT/grimm), and through it on
  [Dinghy](https://github.com/zvenson/dinghy), [Felucca](https://github.com/hugelton/Felucca) and
  [SLOOP](https://github.com/isod89/sloop-fm1).
- The hub's phosphor-CRT look is after [ardor.cloud/retro-computer](https://ardor.cloud/retro-computer); the colour
  and the content are CYB!RM's own.
- GPL-3.0. Third-party licences in [LICENSING.md](LICENSING.md). M-VAVE and FM-1 are trademarks of their owners;
  CYB!RM is not affiliated with or endorsed by them.
