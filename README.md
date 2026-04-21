# pi-i18n

[![npm](https://img.shields.io/npm/v/pi-i18n?style=flat)](https://www.npmjs.com/package/pi-i18n)
[![license](https://img.shields.io/npm/l/pi-i18n?style=flat)](./LICENSE)
[![stars](https://img.shields.io/github/stars/jerryfan/pi-i18n?style=social)](https://github.com/jerryfan/pi-i18n)

LTR-only i18n/l10n platform for the **Pi coding agent** TUI and for Pi extensions.

Why it’s different:
- **extension-only**: no pi-core fork required
- ships real locale bundles + a small API for other extensions
- includes opt-in **core-hacks** (runtime patching) to localize high-impact Pi UI surfaces today

If this is useful, please star the repo → it directly influences how much time goes into expanding locale coverage.

---

## What it looks like

Deterministic “immersive tour” demo (all locales, 3 phases):
1) `/settings` across all locales
2) simulated localized chat across all locales
3) `/hotkeys` across all locales

![Pi immersive i18n tour](https://raw.githubusercontent.com/jerryfan/pi-i18n/main/assets/pi-immersive.gif)

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

## Commands

All operational controls stay under **`/lang`** (command names are not localized):

- `/lang` — switch UI language / pick a locale
- `/lang doctor` — check missing keys / placeholder mismatches
- `/lang debug` — diagnostics for core-hacks + slash menu surfaces
- `/lang probe [on|off|reset]` — runtime patch probe mode/report
- `/lang setup beginner` — sane defaults + enables core-hacks
- `/lang demo chat` — deterministic localized demo chat
- `/lang hacks` — toggle core-hacks

---

## Locale coverage

<details>
<summary><strong>Shipped locales</strong> (click to expand)</summary>

- Full bundles: **en, zh-TW, zh-CN, ja, ko, es, pt-BR, fr, de**
- Stub (English) bundles: **it, pt-PT, nl, pl, tr, vi, id, uk, hi, sv, da, fi, cs, ro, el, sg**
- RTL: not supported in v1 (explicitly out of scope)

</details>

---

## What the extension actually does

### 1) i18n platform for extensions

- bundles (`BundleV1`) + namespace/key translation API
- compatibility surface:
  - `pi-i18n/requestApi`
  - `pi-i18n/registerBundle`
- upstream-aligned aliases (`pi-core/i18n/*`) so future core i18n can replace this cleanly

### 2) Best-effort Pi UI localization (no pi-core changes)

Pi UI strings are not all routed through an i18n system today.
So this project includes **core-hacks**: runtime monkeypatching against internal Pi UI render paths.

Scope is intentionally conservative:
- UI chrome / selectors / status / warnings / errors
- slash command descriptions and help surfaces (e.g. `/hotkeys`)
- never tool args/results, never model output

Implementation anchor:
- `src/core-hacks.ts`

---

## For extension authors

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

Contract + rollout standards:
- `SPEC.md`

---

## Configuration

Config is stored as JSON.

User config:
- `~/.pi/agent/state/pi-i18n/config.json`

Project override:
- `<repo>/.pi/state/pi-i18n/config.json`

Common keys:
- `locale` (e.g. `"zh-TW"`, `"fr"`)
- `fallbackLocale` (default: `"en"`)
- `coreHacksEnabled` (best-effort UI localization)
- `probeEnabled` (patch telemetry)
- `disableHeader`, `disableHeaderOnStartup`

---

## Files

- user config: `~/.pi/agent/state/pi-i18n/config.json`
- project config: `<repo>/.pi/state/pi-i18n/config.json`

---

## Troubleshooting

- **Installed but `/lang` is unknown**
  - run `/reload` (or restart Pi)
- **Strings didn’t change after switching locale**
  - run `/lang hacks` (core-hacks must be enabled to localize non-i18n’d Pi UI)
- **Unsure what’s patched**
  - run `/lang probe` and `/lang debug`

---

## Development

Local dev install:

```bash
pi install -l <path-to-pi-i18n>
```

Then:

```text
/reload
/lang doctor
```

---

## For maintainers

Release plan: see `RELEASE.md`.

Manual quality gate (in a real Pi session):

```text
/lang setup beginner
/lang doctor
/lang debug
/lang probe

/settings
/hotkeys
```

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

## License

MIT
