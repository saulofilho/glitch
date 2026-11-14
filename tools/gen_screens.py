#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 GL!TCH
"""The manual's screens (docs/screens/*.png) and the hub's card (docs/card.png), from the firmware itself.

Each screen is a host-mode run (build/host/grimm: tests/run_host.sh makes it, on Linux) with a script that walks to
the page, filmed at 4 frames a second; the frame at the screen's time is saved 480 x 480 (2 x, nearest).

  python3 tools/gen_screens.py            # all of them, and build/screens/sheet.png to look them over
  python3 tools/gen_screens.py home seq   # some

Buttons (firmware/src/platform.c): OCT- 0, OCT+ 1, FX 2, SEL 3, ENV 4, LFO 5, EDIT 6, GLO 7, HOME 8, SAVE 9, ARP 10,
SEQ 11, PLAY 12, REC 13. Encoders: SELECT 0, ALGORITHM 1, KNOB1-4 2..5, PRESETS 6 (enc 6 N: the N-th factory sound).
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "build" / "host" / "grimm"
OUT = ROOT / "build" / "screens"
DST = ROOT / "docs" / "screens"
B = 6000                                        # the boot screen is over: inputs from here
CHORD = [(B + 900, "keys 0x891"), (B + 2600, "keys 0")]   # a chord held while the shot is taken (meters, scopes)
PAD, FM = 7, 13                                 # PRESETS: NEON PAD (VA), DATA BELL (FM), in the lists' order

# name: (the events, the shot's time in ms)
SCREENS = {
    "boot": ([], 2500),
    "home": ([(B, f"enc 6 {PAD}")] + CHORD, B + 2000),
    "mixer1": ([(B, f"enc 6 {PAD}"), (B + 300, "btn 8")] + CHORD, B + 2000),
    "va": ([(B, f"enc 6 {PAD}"), (B + 300, "btn 6")] + CHORD, B + 2000),
    "fm-algo": ([(B, f"enc 6 {FM}"), (B + 300, "btn 6"), (B + 500, "btn 6")], B + 1500),
    "fm-op": ([(B, f"enc 6 {FM}"), (B + 300, "btn 6"), (B + 500, "btn 6"), (B + 700, "btn 6")], B + 1500),
    "env": ([(B, f"enc 6 {PAD}"), (B + 300, "btn 4")], B + 1500),
    "lfo": ([(B, f"enc 6 {PAD}"), (B + 300, "btn 5")], B + 1500),
    "scale": ([(B, "btn 3"), (B + 300, "enc 3 14")], B + 1500),            # (SCALE: INSEN)
    "chord": ([(B, "btn 3"), (B + 300, "btn 3")], B + 1500),
    "arp": ([(B, "btn 10")], B + 1500),
    "seq": ([(B, "btn 11"), (B + 200, "down 11"), (B + 400, "keys 0x4"), (B + 500, "keys 0"), (B + 600, "up 11")],
            B + 2000),                                                     # (GRID, a RANDOM pattern: SEQ held + G3)
    "save": ([(B, "btn 9")], B + 1500),
    "song": ([(B, "btn 7")], B + 1500),
    "tape": ([(B, "btn 2")] + CHORD, B + 2000),
    "perform": ([(B, "down 2"), (B + 2400, "up 2")], B + 1500),            # (FX held: PERFORM)
    "system": ([(B, "down 8"), (B + 1500, "up 8")], B + 2200),             # (HOME held: SYSTEM)
    "system2": ([(B, "down 8"), (B + 1500, "up 8"), (B + 1800, "btn 8")], B + 2600),
    "system3": ([(B, "down 8"), (B + 1500, "up 8"), (B + 1800, "btn 8"), (B + 2100, "btn 8")], B + 2900),
}


def shoot(name):
    ev, at = SCREENS[name]
    OUT.mkdir(parents=True, exist_ok=True)
    script = OUT / f"{name}.txt"
    ev = sorted([e for e in ev if e[0] < at + 300] + [(at, "probe")], key=lambda x: x[0])
    script.write_text("".join(f"{t} {e}\n" for t, e in ev) + f"{at + 300} end\n")
    r = subprocess.run([str(BIN), str(OUT / name), str(script), "4"], check=True, capture_output=True, text=True)
    page = r.stdout.split(" ui page ")[1].split()[0] if " ui page " in r.stdout else "?"
    im = Image.open(OUT / f"{name}-{at // 250:05d}.ppm").convert("RGB")
    for p in OUT.glob(f"{name}-*.ppm"):
        p.unlink()
    (OUT / f"{name}.wav").unlink(missing_ok=True)
    print(f"{name:<8} page {page}")
    return im


def main():
    if not BIN.exists():
        sys.exit("gen_screens: no build/host/grimm (run tests/run_host.sh first, on Linux)")
    names = sys.argv[1:] or list(SCREENS)
    DST.mkdir(parents=True, exist_ok=True)
    shots = {}
    for n in names:
        shots[n] = shoot(n)
        shots[n].resize((480, 480), Image.NEAREST).save(DST / f"{n}.png", optimize=True)
    if "boot" in shots:                          # the hub's card (fmhub.json's image): the boot screen as it is
        shots["boot"].save(ROOT / "docs" / "card.png", optimize=True)
    cols = 5
    sheet = Image.new("RGB", (cols * 244, ((len(shots) + cols - 1) // cols) * 244), (40, 40, 40))
    for i, n in enumerate(shots):
        sheet.paste(shots[n], (2 + i % cols * 244, 2 + i // cols * 244))
    sheet.save(OUT / "sheet.png")
    print(f"{len(shots)} screens -> docs/screens/ (look them over: build/screens/sheet.png)")


if __name__ == "__main__":
    main()
