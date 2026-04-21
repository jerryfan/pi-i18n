# pi-i18n

[![npm](https://img.shields.io/npm/v/pi-i18n)](https://www.npmjs.com/package/pi-i18n)
[![license](https://img.shields.io/npm/l/pi-i18n)](./LICENSE)

LTR-only i18n/l10n platform for the **Pi coding agent** TUI and for Pi extensions.

- No pi-core changes (extension-only)
- Ships: **en, zh-TW, zh-CN, ja, ko, es, pt-BR, fr, de**
- Also ships **stub (English) bundles** for: **it, pt-PT, nl, pl, tr, vi, id, uk, hi, sv, da, fi, cs, ro, el, sg**
- RTL: not supported in v1 (explicitly out of scope)

Links:

- npm: https://www.npmjs.com/package/pi-i18n
- SPEC (contract + rollout standards): `SPEC.md`
- Demo film spec (how we make the “wow” GIFs): `DEMO.md`
- VHS/WSL2 demo pipeline (no Docker): `VHS.md`

---

## What it looks like

Deterministic “immersive” demo loop (all locales, 3 phases):

1) `/settings` across all locales
2) simulated localized chat across all locales
3) `/hotkeys` across all locales

![Pi immersive i18n tour](https://raw.githubusercontent.com/jerryfan/pi-i18n/main/assets/pi-immersive.gif)

If this is useful to you, please star the repo. It directly influences how much time goes into expanding locale coverage.

---

## Install

Install with **Pi**, not npm:

```bash
pi install npm:pi-i18n
```

Then restart Pi (or run `/reload`).

---

## Quickstart (2 minutes)

1) Apply the beginner preset:

```text
/lang setup beginner
```

2) Switch language (examples):

```text
/lang zh-TW
/lang ja
/lang fr
```

3) Health checks:

```text
/lang doctor
/lang debug
/lang probe
```

---

## Commands (operational namespace)

All operational controls stay under **`/lang`** (by design; command names are not localized):

- `/lang` — switch UI language / pick a locale
- `/lang doctor` — check missing keys / placeholder mismatches
- `/lang debug` — core-hacks + slash menu diagnostics
- `/lang probe [on|off|reset]` — runtime patch probe mode/report
- `/lang setup beginner` — sane defaults + enables core-hacks
- `/lang demo chat` — deterministic localized demo chat (screenshot/GIF friendly)
- `/lang hacks` — toggle core-hacks for debugging

---

## What this extension actually does

### 1) A small i18n platform for extensions

- bundles (`BundleV1`) + namespace/key translation API
- extension compatibility surface (`pi-i18n/requestApi`, `pi-i18n/registerBundle`)
- upstream-aligned aliases (`pi-core/i18n/*`) so future core i18n can replace this cleanly

### 2) Best-effort Pi UI localization **without pi-core changes**

Pi UI strings are not all routed through an i18n system today.
So this project includes **core-hacks**: runtime monkeypatching against internal Pi UI render paths.

Scope is intentionally conservative:

- UI chrome / selectors / status / warnings / errors
- slash command descriptions and help surfaces (e.g. `/hotkeys`)
- never tool args/results, never model output

Implementation anchor:

- `src/core-hacks.ts`

---

## Demo media (how to regenerate the GIF)

The hero GIF is produced via **stills → stitch** (not fragile sleeps):

```bash
# WSL2 recommended
OUT=/mnt/c/trash/pi/$(date +%F)-pi-i18n-immersive-r1
bash tools/vhs/make-immersive-stills.sh "$OUT"

# outputs:
# - $OUT/pi-immersive.gif
# - $OUT/pi-immersive.mp4
# - $OUT/stills/*.png
```

See `VHS.md` for WSL setup (ttyd >= 1.7.2).

---

## For extension authors (no dependency)

Request the API synchronously and translate at render time:

```ts
let i18n: any = null;
pi.events.emit("pi-i18n/requestApi", {
  reply: (api: any) => {
    i18n = api;
  },
});

const t = (k: string, p?: any) => (i18n ? i18n.t(`ext.myext.${k}`, p) : k);
```

Register bundles:

```ts
pi.events.emit("pi-i18n/registerBundle", bundle);
```

Contract details + compatibility boundary:

- `SPEC.md`

---

## Acknowledgements / intent

**Pi is Mario Zechner’s work.** This project is an attempt to add localization value *without* creating churn in pi-core.

If pi gains first-class i18n upstream, the goal is to become a thin compatibility layer (or get out of the way entirely).
