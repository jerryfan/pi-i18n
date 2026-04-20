# pi-i18n

LTR-only i18n/l10n platform for the **pi coding agent** interactive TUI and for pi extensions.

- First shipped locale: **zh-TW**
- RTL: later (explicitly not supported in v1)

## Acknowledgements (and why this is an extension, not a pi-core PR)

**pi is Mario Zechner’s work, and I’m genuinely grateful for it.** This project is my way of adding i18n support *without* barging into pi-core or demanding invasive upstream changes. In an ideal world, localization is a first-class core feature—but in the real world, maintainers have limited bandwidth, and respectful contributions should minimize disruption.

This extension is therefore a pragmatic “monkeyhack” (best-effort runtime patching) that:
- provides a small i18n registry + bundle contract for **extensions**, and
- optionally patches parts of the **interactive TUI** at runtime so the UI can be localized today, without forking pi or editing core files.

### The funny origin story (with evidence)

I only started writing this because I was doing a string scan of the interactive UI to inventory hard-coded English text. While doing that, I ran into an in-app announcement that literally contains:

- **“pi has joined Earendil”**
- **“Read the blog post:”**

That discovery sent me to Mario’s post:
https://mariozechner.at/posts/2026-04-08-ive-sold-out/

So yes—*I found out about the acquisition announcement while hunting English strings to localize them.* That’s objectively hilarious timing.

Mario: congratulations, and thank you. I’m happy for you, and I hope the acquisition gives pi the runway it deserves.

### Philosophy

This project is meant to be helpful, not territorial:
- If pi grows first-class i18n upstream, I’ll happily pivot this into a thin compatibility layer (or deprecate it).
- Until then, this extension is a practical bridge for users and extension authors who want localization now—without putting pressure on core.

## Install (npm)

> Important: install with `pi install`, **not** `npm install`.

```bash
pi install npm:@jrryfn/pi-i18n
```

Then restart pi (or run `/reload`).

## Quickstart (beginner, 2 minutes)

1) Apply the beginner preset:

```text
/lang setup beginner
```

2) Switch locale if needed:

```text
/lang zh-TW
```

3) Validate health:

```text
/lang doctor
/lang debug
/lang probe
```

Manual happy-path verification (current release gate):

```text
/settings
/model
/compact
```

Expected: zh-TW UI strings, no English leakage in these paths.

## Use (interactive)

All i18n operational commands are under `/lang`.

- `/lang` — switch UI language / pick a locale
- `/lang doctor` — check missing keys / placeholder mismatches
- `/lang debug` — core-hacks + slash menu diagnostics
- `/lang probe [on|off|reset]` — runtime patch probe mode/report
- `/lang setup beginner` — ultra-simple preset + sane defaults
- `/lang hacks` — manual core-hacks toggle for debugging only

## Optional config

`pi-i18n` reads config from:
- project: `<cwd>/.pi/state/pi-i18n/config.json`
- user: `~/.pi/agent/state/pi-i18n/config.json`

Example:

```json
{
  "locale": "zh-TW",
  "fallbackLocale": "en",
  "disableHeaderOnStartup": true,
  "disableHeader": true,
  "coreHacksEnabled": true,
  "probeEnabled": true,
  "preset": "beginner"
}
```

- `disableHeaderOnStartup: true` → do not write localized header during `pi` startup
- `disableHeader: true` → never write localized header (startup or later)
- `coreHacksEnabled: true` → apply best-effort core UI localization patches
- `probeEnabled: true` → collect runtime patch probe stats (`/lang probe`)
- `preset` → last setup profile applied

## For extension authors (no dependency)

Request the API synchronously and use it in render paths:

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

Future upstream compatibility (same API surface, no parallel bridge):

```ts
// Optional: upstream-style detection events (supported today by this extension)
pi.events.emit("pi-core/i18n/requestApi", { reply: (api: any, caps: any) => {/* ... */} });
pi.events.emit("pi-core/i18n/registerBundle", bundle);
```

Capability manifest is published at `i18n.manifest.json` (schema: `schemas/pi-i18n.extension.schema.json`).

See `SPEC.md` for the full contract.

## Translation gotchas + best practices (95+/100 playbook)

Canonical implementation file for runtime translation behavior:
- `public/pi-extensions/i18n/src/core-hacks.ts`

Canonical policy/quality bar file:
- `public/pi-extensions/i18n/SPEC.md` (scoring + safety gates)

If you are adding/modifying translations, follow this order:
1. **Patch stable sources first**
   - Prefer key/data/method-level patches over regex-only rewrites.
2. **Keep render width safe**
   - TUI lines are hard width-limited; long zh-TW phrases can crash renders.
   - In narrow menu/hint rows, prefer short high-signal strings.
3. **Never modify pi-core files**
   - Only patch via extension runtime hooks in `core-hacks.ts`.
4. **Do not translate tool args/results**
   - UI chrome/labels/status only.
5. **Avoid control-character corruption**
   - Regex boundaries must be `\\b` text, never literal backspace chars.
6. **Cover dynamic render paths**
   - Static replacements alone are insufficient for `/session`, `/hotkeys`, `/compact`.
   - Ensure post-render localization hooks run on chat/status containers.
7. **Verify with live runtime, not scan only**
   - `NEED.md` is heuristic; final truth is interactive proof after `/reload` + `/lang`.
8. **Reinstall after patching**
   - `pi install <path-to>/pi-i18n`, then retest target commands.

Quick regression set (must pass for 95+/100 confidence):
- `/name`, `/session`, `/hotkeys`, `/compact`
- model/settings menus (no width overflow)
- startup + `/lang` switch (no localized header banner reintroduced)
