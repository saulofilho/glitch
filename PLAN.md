# GL!TCH — plan

GL!TCH is GR!MM's firmware re-skinned as neon-noir cyberpunk for the M-VAVE FM-1, with its own factory sounds,
scales and hub. The engine tracks GR!MM upstream; this file tracks GL!TCH's own direction.

## Done (2.0)

- Firmware identity: 44 factory sounds (9 categories), 16 scales, cyber source names, GL!TCH boot screen.
- Clean web presence modelled on the COQUI project: `hub/` (landing + `emu/`), `tools/gen_hub.py`, GitHub Actions
  (`pages.yml`, `release.yml`). The parallel hand-written JavaScript synth was removed.
- Phosphor-CRT amber redesign (after ardor.cloud/retro-computer) across the hub, the panel and the editor.
- **Phosphor-colour cycle `[C]`** (amber → green → cyan → magenta, amber default, saved per browser), on the hub.
- **1200×630 social card** `hub/og.png`, drawn by `hub/og-card.html` to the amber-CRT look (the generator page stays
  in the repo so the card can be re-exported).
- **Audio pipeline in `gen_hub.py`**: renders a short teaser (`hub/audio/demo.{mp3,wav}`) from the host build via
  plain MIDI events, normalised, mono 22 kHz — WAV with no toolchain, MP3 when ffmpeg is present. It is gated on the
  host binary and skips cleanly when absent; the landing's **`[P]` HEAR IT** button appears only when a demo exists.

- **Built and tested from source in Docker** (`tools/docker_refresh.sh`): the browser build recompiled (the emulator
  says GL!TCH), the host tests green (302 checks), the hub's demo rendered (`hub/audio/demo.mp3`), and the manual's
  19 screens and `docs/card.png` shot from the firmware (`tools/gen_screens.py`).
- **Fixed: MIXER 1 crashed** (the matrix rain's `MX_N 20` shadowed the mixer's six tiles: a null label, SELECT past
  the last tile). The rain's is `RAIN_N` now.

- **The FM-1 package builds**: `build/glitch-2.0.fwsc` (`./build.sh --release 2.0`, the JieLi toolchain in Docker), its
  size, RAM and stack checks all ok. Not yet installed on a unit.
- **A teaser a source** on the hub (`hub/audio/src-xx.mp3`: NEON PAD, DATA BELL, SAMPLE 1, MEGACITY CHOIR, NOIR ORGAN,
  CHROME PIANO, GLITCH LEAD), each loaded through PRESETS and checked by name on the host's probe.
- The technical docs say GL!TCH; *GR!MM 1.0* stays where it is the engine's history.

- **The glitch look** (after the picture the project is named for): the FM-1's palette, HOME and boot screen, the
  hub (an editorial page, the landscape alive at its top), the panel, the editor, the social card; the manual as a
  page (`hub/manual.html`). Host tests green, the browser build and the FM-1 package rebuilt.

## Next

- **Install `build/glitch-2.0.fwsc` on a real FM-1 and play it** (MIXER 1 above all: it crashed before the fix), then
  **tag `v2.0`** to cut the first attested release (`release.yml` is ready).
