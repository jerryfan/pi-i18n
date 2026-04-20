# i18n integration PR (pi-i18n optional)

## Summary
- Extension(s):
- Goal:
  - Add UI localization support using `pi-i18n` **without** requiring a hard dependency.

## Behavior contract (must hold)
- [ ] Extension remains fully usable when `pi-i18n` is **not installed** (English fallback).
- [ ] No UI regressions in headless mode (no UI calls when `ctx.hasUI === false`).
- [ ] No translation of model output / tool output (UI chrome only).
- [ ] No command renames: command tokens/IDs stay unchanged.

## Implementation (recommended pattern)
### 1) Optional handshake (no dependency)
- Request API synchronously:
  - `pi.events.emit("pi-i18n/requestApi", { reply: (api) => { ... } })`
- Register bundles once:
  - `api.registerBundle(locales/en.json)`
  - `api.registerBundle(locales/<locale>.json)`

### 2) Local fallback (English baseline)
- Bundle file: `locales/en.json` is the source-of-truth.
- Provide a small `fallbackT(key, params)` that reads from `locales/en.json`.

### 3) Replace user-facing literals
- Replace `ctx.ui.notify("...")`, picker labels/descriptions, overlay headings, and usage lines with:
  - `t("some.key", params)` where `t()` dispatches to pi-i18n when present, else fallback.

## Locales shipped in this PR
- [ ] `en` (required)
- [ ] `zh-TW` (optional)
- [ ] `zh-CN` (optional)
- [ ] other:

## Test plan (manual)
In a real pi session:
- [ ] Install extension (with pi-i18n installed) and verify strings switch when locale changes:
  - `/lang <locale>`
- [ ] Uninstall pi-i18n (or disable it), restart pi, verify English fallback still works.
- [ ] Verify TUI width safety for picker rows (no overflow crashes).

## Notes for maintainers
- This PR does **not** add new runtime dependencies.
- This PR keeps the extension compatible with older pi versions by using only the event-bus handshake.
