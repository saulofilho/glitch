#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 GL!TCH
"""GL!TCH's hub page (hub/): its data, made from the firmware itself.

  hub/glitch-data.js   the scales (firmware/src/scale.c: names, masks), the factory sounds (store.c: names,
                       category and source), the sources (voices.c) and the version
  hub/emu/             the web emulator and the editor (web/build_web.sh's web/dist)

GL!TCH is GR!MM's engine, not the Latin-percussion COQUI: it has no self-playing GROOVE styles to render, so the
hub ships no pre-rendered audio. The sound on the page is the live WebAssembly emulator in hub/emu/. Run this once
the firmware source or the web build changes:

  python3 tools/gen_hub.py --version 2.0
"""
import argparse
import array
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "firmware" / "src"
HUB = ROOT / "hub"
BIN = ROOT / "build" / "host" / "grimm"        # the host build (tests/run_host.sh makes it; Linux/CI)
FS = 44100
BOOT_MS = 6000                                 # the boot screen plays first; inputs land after it

# the seven sources, in ENG_ order (voices.c: ENG_VA .. ENG_PHASE), each with the short code the unit shows
# (ui.c: SRC_CODE) and GL!TCH's own words for it (README's engine table)
SOURCES = [
    ("VA", "CYBER-ANALOG", "Dual detuned saw/pulse with sub-osc and a resonant lowpass."),
    ("FM", "NEON-FM", "Algorithmic carrier/modulator with a decay envelope and metallic feedback."),
    ("SA", "CYBER LO-FI", "Neo-Tokyo acid rain, telemetry bursts, and your own WAV over USB."),
    ("VO", "ANDROID CHOIR", "Three-band vowel formants (A, O, U, I) with a vocal vibrato."),
    ("WH", "GRID WHEEL", "Tonewheel organ drones, from noir chapel to grid hum."),
    ("PH", "METALLIC RESONATOR", "Karplus-Strong industrial pipe and cyber-cable resonance."),
    ("PD", "PHASE", "Phase-distortion plates and glassy, glitching leads."),
]


def parse_scales():
    s = (SRC / "scale.c").read_text()
    mask = [int(x, 16) for x in re.search(r"SC_MASK\[NSCALE\] = \{.*?\n\s*(0x[0-9A-Fa-f, x]+)\};", s, re.S).group(1).replace("\n", " ").split(",") if x.strip()]
    name = re.findall(r'"([^"]+)"', re.search(r"SC_NAME\[NSCALE\] = \{(.*?)\};", s, re.S).group(1))
    short = re.findall(r'"([^"]+)"', re.search(r"SC_SHORT\[NSCALE\] = \{(.*?)\};", s, re.S).group(1))
    assert len(mask) == len(name) == len(short), (len(mask), len(name), len(short))
    # bit i of the mask: i semitones over the root are in the scale -> a 12-slot pattern ("X" in, "." out)
    out = []
    for m, n, sh in zip(mask, name, short):
        dots = "".join("X" if (m >> i) & 1 else "." for i in range(12))
        out.append({"name": n, "short": sh, "mask": dots})
    return out


def parse_sounds():
    s = (SRC / "store.c").read_text()
    names = re.findall(r'"([^"]+)"', re.search(r"SND_FNAME\[\] = \{(.*?)\};", s, re.S).group(1))
    body = s[s.index("SND_FACTORY[][SND_FSIZE] = {"):]
    body = body[:body.index("\n};")]
    rows = re.findall(r"FSNDV?\(\s*CAT_(\w+)\s*,\s*\d+\s*,\s*(ENG_\w+|VT_\w+)", body)
    assert len(rows) == len(names), (len(rows), len(names))
    eng_code = {"ENG_VA": "VA", "ENG_FM": "FM", "ENG_SAMPLE": "SA", "ENG_VOICE": "VO",
                "ENG_WHEEL": "WH", "ENG_PHYS": "PH", "ENG_PHASE": "PD"}
    sounds = []
    for name, (cat, eng) in zip(names, rows):
        code = "VO" if eng.startswith("VT_") else eng_code[eng]   # (a VT_ row is a VOICE choir type)
        sounds.append({"name": name, "cat": cat, "src": code})
    return sounds


def ffmpeg():
    """ffmpeg for MP3 (optional): $FFMPEG, the PATH, or imageio-ffmpeg's bundled binary; None if there is none"""
    ff = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
    if ff:
        return ff
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None


def host(name, events, end_ms, out):
    """run the host build with a script of (t_ms, "cmd") events and read its WAV back as (channels, raw 16-bit PCM).
    The script lines are host.c's: "T midi ST D1 D2", "T btn ID", "T enc ID STEPS", "T end" (see firmware/src/host.c)."""
    script = out / f"{name}.txt"
    script.write_text("".join(f"{t} {e}\n" for t, e in sorted(events, key=lambda x: x[0])) + f"{end_ms} end\n")
    subprocess.run([str(BIN), str(out / name), str(script)], check=True, capture_output=True,
                   env=dict(os.environ, GRIMM_MASTER="1022"))
    with wave.open(str(out / f"{name}.wav")) as w:
        return w.getnchannels(), w.readframes(w.getnframes())


def cut(raw, ch, a_ms, b_ms):
    fr = 2 * ch
    return raw[a_ms * FS // 1000 * fr:b_ms * FS // 1000 * fr]


def to_mono22k(raw, ch):
    """stereo/mono 16-bit @44.1k -> mono 16-bit @22.05k (stdlib only): average the channels, then 2:1 decimate"""
    a = array.array("h")
    a.frombytes(raw)
    mono = a if ch == 1 else array.array("h", ((a[i] + a[i + 1]) // 2 for i in range(0, len(a) - 1, 2)))
    return array.array("h", (mono[i] for i in range(0, len(mono), 2)))


def write_demo(raw, ch, dst_base, ff, fade_ms=600):
    """normalise (RMS -18 dB, peak <= -3 dB), fade the tail, and write dst_base.mp3 (if ffmpeg) or dst_base.wav.
    Returns the file written. The WAV path needs no toolchain; the MP3 path matches the COQUI hub's format."""
    mono = to_mono22k(raw, ch)
    pk = max(1, max(abs(x) for x in mono))
    sample = mono[::7] or mono
    rms = max(1.0, math.sqrt(sum(x * x for x in sample) / len(sample)))
    gain = min(32767 * 10 ** (-18 / 20) / rms, 32767 * 10 ** (-3 / 20) / pk)
    n = len(mono)
    fade = min(n, fade_ms * 22050 // 1000)
    for i in range(n):
        g = gain * ((n - i) / fade) if fade and i >= n - fade else gain
        mono[i] = max(-32768, min(32767, int(mono[i] * g)))
    if ff:
        dst = dst_base.with_suffix(".mp3")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
            with wave.open(t.name, "wb") as w:
                w.setnchannels(1), w.setsampwidth(2), w.setframerate(22050), w.writeframes(mono.tobytes())
            subprocess.run([ff, "-y", "-loglevel", "error", "-i", t.name, "-ac", "1", "-ar", "22050",
                            "-codec:a", "libmp3lame", "-b:a", "64k", str(dst)], check=True)
        os.unlink(t.name)
    else:
        dst = dst_base.with_suffix(".wav")
        with wave.open(str(dst), "wb") as w:
            w.setnchannels(1), w.setsampwidth(2), w.setframerate(22050), w.writeframes(mono.tobytes())
    return dst


def render_demo(out, ff):
    """A short teaser of the firmware's default voice: boot, then an arpeggiated minor chord (root, b3, 5, octave)
    played over two bars via plain MIDI note events (no UI navigation needed — the default project has sounds on its
    tracks). Writes hub/audio/demo.{mp3,wav}. Correct by construction; no factory-sound browsing to go stale."""
    bpm, step = 96, 60000 // 96 // 2            # eighth notes at 96 BPM
    notes = [45, 48, 52, 57, 60, 57, 52, 48, 45, 48, 52, 57, 60, 64, 60, 57]   # Am arpeggio, two bars
    t0 = BOOT_MS + 800
    ev = []
    for i, n in enumerate(notes):
        on = t0 + i * step
        ev.append((on, f"midi 0x90 {n} 100"))
        ev.append((on + step - 10, f"midi 0x80 {n} 0"))
    end = t0 + len(notes) * step + 2200
    ch, raw = host("demo", ev, end, out)
    dst = write_demo(cut(raw, ch, t0, end - 300), ch, HUB / "audio" / "demo", ff, fade_ms=900)
    return dst


EMU_FILES = ["index.html", "panel.js", "worklet.js", "glitch.wasm", "Terminus-LICENSE.txt", "LICENSE",
             "LICENSING.md", "editor.html", "editor.js", "editor_core.js", "PressStart2P-Regular.ttf"]


def copy_docs():
    """GitHub Pages publishes only hub/, so the files the landing links to must live inside it. Copy the manual and
    the licences into hub/, and drop a .nojekyll so Pages serves everything (the _-named font, etc.) untouched."""
    for f in ("MANUAL.md", "LICENSE", "LICENSING.md"):
        src = ROOT / f
        if src.exists():
            shutil.copy2(src, HUB / f)
    (HUB / ".nojekyll").write_text("")


def copy_emu():
    """web/dist (web/build_web.sh) -> hub/emu: the web emulator, the editor and their licences"""
    dist = ROOT / "web" / "dist"
    if not (dist / "glitch.wasm").exists():
        print("emu: no web/dist/glitch.wasm (run APP_VER=2.0 web/build_web.sh first): hub/emu left as it is")
        return
    emu = HUB / "emu"
    if emu.exists():
        shutil.rmtree(emu)
    (emu / "LICENSES").mkdir(parents=True)
    for f in EMU_FILES:
        src = dist / f
        if src.exists():
            shutil.copy2(src, emu / f)
    lic = dist / "LICENSES"
    if lic.exists():
        for f in lic.iterdir():
            shutil.copy2(f, emu / "LICENSES" / f.name)
    print(f"emu -> hub/emu ({(emu / 'glitch.wasm').stat().st_size} B wasm)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="2.0")
    ap.add_argument("--no-audio", action="store_true", help="skip the demo render (data and emu only)")
    a = ap.parse_args()
    scales, sounds = parse_scales(), parse_sounds()
    HUB.mkdir(parents=True, exist_ok=True)
    copy_docs()
    copy_emu()

    demo = None                                 # the landing's "HEAR IT": the demo file's name, or null
    if not a.no_audio:
        if not BIN.exists():
            print(f"audio: no {BIN.relative_to(ROOT)} (run tests/run_host.sh on Linux first): no demo rendered")
        else:
            (HUB / "audio").mkdir(parents=True, exist_ok=True)
            out = ROOT / "build" / "hub"
            out.mkdir(parents=True, exist_ok=True)
            ff = ffmpeg()
            try:
                dst = render_demo(out, ff)
                demo = dst.name
                print(f"demo -> hub/audio/{demo}" + ("" if ff else "  (no ffmpeg: WAV; install ffmpeg for MP3)"))
            except Exception as e:                # a render failure must never break the data/emu publish
                print(f"audio: demo render failed ({e}); no demo", file=sys.stderr)
    else:
        existing = sorted((HUB / "audio").glob("demo.*")) if (HUB / "audio").exists() else []
        demo = existing[0].name if existing else None

    data = {
        "version": a.version,
        "identity": "FM-1_923",
        "sources": [{"code": c, "name": n, "desc": d} for c, n, d in SOURCES],
        "scales": scales,
        "cats": ["DRONE", "PAD", "BELL", "ORGAN", "KEYS", "BASS", "TEXTURE", "VOICE", "OTHER"],
        "sounds": sounds,
        "demo": demo,
    }
    (HUB / "glitch-data.js").write_text(
        "/* GENERATED by tools/gen_hub.py from firmware/src/scale.c and store.c: do not edit */\n"
        f"window.GLITCH = {json.dumps(data, ensure_ascii=False, separators=(',', ':'))};\n")
    print(f"data -> hub/glitch-data.js ({len(scales)} scales, {len(sounds)} sounds, {len(SOURCES)} sources)")


if __name__ == "__main__":
    main()
