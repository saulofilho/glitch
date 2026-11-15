# Changelog

All notable changes to GL!TCH are noted here. The firmware engine follows GR!MM; this file tracks GL!TCH's own
identity (sounds, scales, hub) and releases.

## [2.0.2] — 2026-11-15

For the FM-1 Firmware Hub's check of 2.0.

(A `v2.0.1` tag exists, set one commit too early: its package is 2.0's code under another number, still answering
`FM-1_966`. 2.0.2 is the first release with these changes.)

- **Its own identity: `FM-1_986`.** 2.0 answered `FM-1_966`, GR!MM's, so an installer could not tell the two apart.
  `tools/fm1_sample_upload.py` talks to either.
- **Newer FM-1s** (UC25HQ80 flash, `0xB36014`, units sold since autumn 2026) are accepted beside the Puya chip, in the
  app, the rescue and the update loader: on them 2.0 kept its saves in RAM only and its loader refused to write.
- **`fmhub.json` says where the sounds come from** (the four factory samples: GR!MM's, CC0; the hub's recordings: made
  from this firmware).

## [2.0] — 2026-11-15

### Hub and web
- **A new look, off a glitched landscape**: night navy, mint ink, pink for what is lit, the sky's teal and lemon. The
  hub is an editorial page (the landscape itself, alive, at its top: `hub/land.js`, the firmware's own drawing), the
  emulator's panel and the editor follow. It replaces the amber phosphor-CRT look and its colour cycle.
- **The manual is a page**: `hub/manual.html` draws `MANUAL.md` with its screens (the hub's link to the bare `.md` did
  not open on GitHub Pages).
- **New hub (`hub/`)**, published to GitHub Pages: the seven sources, the sixteen scales (each as twelve cells), the
  forty-four factory sounds by category and the install steps, all generated from the firmware source.
- **Social card** `hub/og.png` (1200×630): the boot screen and HOME, side by side (`tools/gen_screens.py`).
- **`tools/gen_hub.py`**: makes `hub/glitch-data.js` from `firmware/src/scale.c` and `store.c`, copies the web build
  (`web/dist`) into `hub/emu/`, and (when the host build exists) renders a short audio teaser
  `hub/audio/demo.{mp3,wav}` — WAV with no toolchain, MP3 when ffmpeg is present — surfaced on the landing as the
  **Hear it** button.
- **`tools/gen_screens.py`**: the manual's 19 screens and `docs/card.png`, shot from the firmware in host mode (they
  were GR!MM's before). **`tools/docker_refresh.sh`** runs the browser build, the host tests, the screens and the hub
  in Docker, on any computer.
- **Tests** follow GL!TCH's bank and accent (PHASE LINE 2's DCW against GLITCH LEAD; the CUT / DRY warning in the accent).
- **A teaser a source** on the hub: a play button on each of the seven sources' cards (`hub/audio/src-xx.mp3`, made by
  `tools/gen_hub.py` from the host build).
- **GitHub Actions**: `pages.yml` publishes `hub/`; `release.yml` builds and attests `build/glitch-X.Y.fwsc` on a tag.
- **Removed** the parallel hand-written JavaScript synth (`index.html`, `play.html`, `css/`, `js/`): the web presence
  is now the hub plus the WebAssembly emulator, as in the COQUI reference project.

### Firmware (GL!TCH identity on GR!MM 2.0)
- **The screen redrawn**: a new palette (night navy, sea, mint, pale; accents PINK, LEMON, TEAL, VIOLET), and HOME and
  the boot screen as a glitched landscape whose bands drift and whose rows tear with the sound (in place of the
  matrix rain).
- **Fixed:** MIXER 1 crashed the unit: the matrix rain's column count was a macro named `MX_N`, shadowing the
  mixer's six tiles (a null label drawn, SELECT ran past DRIVE). Found by the host tests once they ran on Linux.
- 44 factory sounds across 9 categories (DRONE, PAD, BELL, ORGAN, KEYS, BASS, TEXTURE, VOICE, OTHER).
- 16 scales including Cyber Dorian, Phrygian Dominant, Iwato, Whole Tone, Noir Pentatonic, Insen, Hirajoshi.
- Seven sources: Cyber-Analog (VA), Neon-FM, Cyber Lo-Fi sampler, Android Choir (formant), Grid Wheel, Metallic
  Resonator (PHYS), Phase.
- Boot screen reads GL!TCH; colour 1 is pink on the unit.
