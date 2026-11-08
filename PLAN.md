# CYB!RM — plan

CYB!RM is GR!MM's firmware re-skinned as neon-noir cyberpunk for the M-VAVE FM-1, with its own factory sounds,
scales and hub. The engine tracks GR!MM upstream; this file tracks CYB!RM's own direction.

## Done (2.0)

- Firmware identity: 44 factory sounds (9 categories), 16 scales, cyber source names, CYB!RM boot screen.
- Clean web presence modelled on the COQUI project: `hub/` (landing + `emu/`), `tools/gen_hub.py`, GitHub Actions
  (`pages.yml`, `release.yml`). The parallel hand-written JavaScript synth was removed.
- Phosphor-CRT amber redesign (after ardor.cloud/retro-computer) across the hub, the panel and the editor.

## Next

- **Audio demos**: the hub ships no pre-rendered audio (CYB!RM has no self-playing GROOVE styles like COQUI). If
  wanted, extend `gen_hub.py` to render short host-mode captures of representative factory sounds per category
  (needs the host build + ffmpeg).
- **`og.png`**: replace the 240×240 placeholder (`docs/card.png`) with a 1200×630 social card in the amber-CRT look.
- **Colour switch**: optionally add the reference's `[C]` phosphor-colour cycle (amber default) to the hub.
- **Tag `v2.0`** once tested on a real FM-1, to cut the first attested release.
