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

## Next

- **Render the demo on CI/Linux**: the host (`__attribute__((section(".pool")))`) does not build on macOS, so run
  `tests/run_host.sh` then `tools/gen_hub.py` on Linux (or in the release workflow) to produce `hub/audio/demo.*` and
  commit it. Optionally extend `render_demo()` to one teaser per source engine.
- **Tag `v2.0`** once tested on a real FM-1, to cut the first attested release (`release.yml` is ready).
