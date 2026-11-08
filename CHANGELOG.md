# Changelog

All notable changes to CYB!RM are noted here. The firmware engine follows GR!MM; this file tracks CYB!RM's own
identity (sounds, scales, hub) and releases.

## [2.0] — unreleased

### Hub and web
- **New hub (`hub/`)**, published to GitHub Pages: a phosphor-CRT terminal landing in amber, with the seven sources,
  the sixteen scales (each as a 12-slot interval ring), the forty-four factory sounds by category, the install steps,
  and an interactive command terminal — all generated from the firmware source.
- **`tools/gen_hub.py`**: makes `hub/cybirm-data.js` from `firmware/src/scale.c` and `store.c`, and copies the web
  build (`web/dist`) into `hub/emu/`.
- **Redesigned web emulator and editor** (`web/index.html`, `web/editor.html`) to the amber-CRT look: scanlines,
  vignette, bloom, VT323, respecting `prefers-reduced-motion`.
- **GitHub Actions**: `pages.yml` publishes `hub/`; `release.yml` builds and attests `build/cybirm-X.Y.fwsc` on a tag.
- **Removed** the parallel hand-written JavaScript synth (`index.html`, `play.html`, `css/`, `js/`): the web presence
  is now the hub plus the WebAssembly emulator, as in the COQUI reference project.

### Firmware (CYB!RM identity on GR!MM 2.0)
- 44 factory sounds across 9 categories (DRONE, PAD, BELL, ORGAN, KEYS, BASS, TEXTURE, VOICE, OTHER).
- 16 scales including Cyber Dorian, Phrygian Dominant, Iwato, Whole Tone, Noir Pentatonic, Insen, Hirajoshi.
- Seven sources: Cyber-Analog (VA), Neon-FM, Cyber Lo-Fi sampler, Android Choir (formant), Grid Wheel, Metallic
  Resonator (PHYS), Phase.
- Boot screen reads CYB!RM; colour 1 is cyan on the unit.
