# Demo / film spec (GitHub-star optimized)

This repo lands best when visitors immediately see:

1) **Pi’s UI switching languages** (without pi-core changes)
2) A **deep proof** screen that’s clearly localized (not just a header)

Recommended deliverables:

- **Hero GIF** (10–14s): loops well in GitHub README
- **Proof MP4** (30–60s): optional, for people who click

Default format: **2:1** (e.g. **1200×600**) so text stays readable.

---

## A) Hero GIF (recommended): immersive language tour (deterministic)

### What it should show ("fully immersed")

Show three **phases** (viewer sees the same surface changing, then the next surface):

1) `/settings` across **all locales** (scrub fast)
2) simulated localized chat (`/lang demo chat`) across **all locales**
3) `/hotkeys` across **all locales**

Hold longer on **German** at the end of each phase (or at least the final phase) for credibility.

### Why this works

Live recordings of `/lang` + reload + selectors are timing-sensitive.
This approach is deterministic:

- pre-set locale before launching Pi
- capture a still while each surface is visible
- stitch stills into a loop

### Generate (WSL2, no Docker)

See `VHS.md` for setup.

```bash
OUT=/mnt/c/trash/pi/$(date +%F)-pi-i18n-immersive-r1
bash tools/vhs/make-immersive-stills.sh "$OUT"
```

Outputs:

- `$OUT/pi-immersive.gif`
- `$OUT/pi-immersive.mp4`
- `$OUT/stills/*.png`

---

## B) Proof MP4 (optional): 2–3 locales + 2 surfaces

Goal: show the workflow briefly (commands + UI), without making viewers watch repetitive navigation.

Suggested sequence (30–45s):

1. Start in English → `/lang ja` (Hide during reload)
2. `/settings` (hold 2–3s)
3. Esc
4. `/hotkeys` (hold 2–3s)
5. `/lang zh-TW` (Hide during reload)
6. End with `/lang doctor`

Editing rule: prefer **jump-cuts** (multi-clip concat) over recording every keystroke.
