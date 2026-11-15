# GL!TCH 2.0 on a real FM-1

Tested on 2026-11-15, over USB, with `tools/fm1_install.py`. Each step is confirmed by the identity the unit answers
(`fm1_install.py --info`).

| # | Step | Package | The unit answered |
| :-- | :--- | :--- | :--- |
| 1 | Install GL!TCH from another firmware (COQUÍ, `FM-1_923`) | `glitch-2.0.fwsc`, a local build | `FM-1_966` |
| 2 | Install the v2.0 release over it | `glitch-2.0.fwsc` from the GitHub release | `FM-1_966` |
| 3 | Leave GL!TCH: install COQUÍ 1.1.1 over it | `coqui-1.1.1.fwsc` from its GitHub release | `FM-1_923` |
| 4 | Come back: install the v2.0 release over COQUÍ | `glitch-2.0.fwsc` from the GitHub release | `FM-1_966` |

The release package's SHA-256 matches the release's `SHA256SUMS`
(`66673488258ccee3a3b52d89fc28ee6cb9097b0dca4e88858851bb4f2aff4b84`), and the local build of step 1 is the same file,
byte for byte.

## What this does not cover

- **The screen and the sound.** These steps only read the identity over USB. The boot screen, HOME, MIXER 1 (it
  crashed before 2.0's fix) and the factory sounds are for eyes and ears on the unit.
- **The official firmware.** Leaving was tested to COQUÍ, not to M-VAVE's V15, and installing from V15 was not tested.
- **An interrupted update** and the USB rescue (OCT- at power-on) were not tried.
- **CPU load** of the heaviest scene was not measured on the unit.

## Known in 2.0, fixed in 2.0.2

- 2.0 answers `FM-1_966`, the identity GR!MM uses: an installer cannot tell the two apart by it. 2.0.2 answers
  `FM-1_986`.
- 2.0 accepts only the older flash chip (Puya, `0x856014`). 2.0.2 accepts the newer one too (UC25HQ80, `0xB36014`).

2.0.2 has passed the host tests and builds; it has **not yet been installed on a unit** (and no unit with the newer
chip was at hand).

Before the hardware: the host tests pass (`tests/run_host.sh`, 302 checks, on Linux in Docker) and the browser build
runs the same code (`web/build_web.sh`).
