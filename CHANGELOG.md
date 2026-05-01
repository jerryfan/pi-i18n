# Changelog

## 0.1.16
- Fix(command): limit `/lang` picker to completed UI translations; fallback/staging locales remain available through direct locale input.

## 0.1.15
- Fix(command): paginate `/lang` picker so the generic extension selector does not overflow and block language selection.

## 0.1.14
- Docs: README polish + checked-in hero demo GIF asset.
- Demo(tools/vhs): immersive montage now supports phase-order playback (settings all → chat all → hotkeys all).

## 0.1.13
- Add: `/lang demo chat` deterministic localized chat overlay (screenshot/GIF friendly).
- Improve(core-hacks): localize `/hotkeys` Markdown output for non-zh locales (substring replacement using locale packs).
- Add(tools/vhs): `make-immersive-stills.sh` to generate an immersive multi-locale demo (settings → demo chat → hotkeys).

## 0.1.12
- Fix(core-hacks): improve pi-core `dist/` resolution on Linux/WSL (resolve argv symlinks, probe common global npm install paths) so selector localization works reliably outside Windows.

## 0.1.11
- Change: completed the current core-settings locale pass for all shipped non-English locale packs, including selector labels, descriptions, and choice labels.
- Change: publish bump for the latest locale-pack/core-hacks updates.

## 0.1.10
- Change: completed the current core-settings locale pass for all shipped non-English locale packs, including selector labels, descriptions, and choice labels.

## 0.1.9
- Change: documented one-pass locale rollout procedure and broadened locale-pack coverage for core selector/settings surfaces.

## 0.1.8
- Change(core-hacks): selector and settings hint translations now apply to all shipped locales via locale packs, not zh-TW only.
- Change(core-hacks): locale packs expanded for current settings surfaces across zh-CN, ja, ko, es, pt-BR, fr, de.

## 0.1.7
- Change(footer): show native language label (e.g. 日本語) instead of raw locale code.

## 0.1.6
- Add: shipped UI bundles for zh-CN, ja, ko, es, pt-BR, fr, de
- Change: /lang picker now lists all shipped locales
- Improve: /lang locale aliases expanded (zh-cn/cn, ja/jp, ko/kr, etc.)
- Add(core-hacks): non-zh locale packs for monkeypatching via `src/core-hacks-locales/*.json`
- Add(core-hacks): zh-TW parity check surfaced via `/lang doctor`

## 0.1.5
- Breaking(command namespace): remove `/i18n` command; all operational controls are under `/lang`
- Remove: external TypeBox dependency (no `@sinclair/typebox`)

## 0.1.4
- Breaking(command namespace): i18n operational commands moved under `/lang` (no `/i18n` command)
  - `/lang doctor` replaces `/i18n:doctor`
  - `/lang debug` replaces `/i18n:debug`
  - `/lang hacks` replaces `/i18n:hacks`
  - `/language` alias removed (use `/lang`)
- Add: runtime probe mode `/lang probe [on|off|reset]`
- Add: beginner preset `/lang setup beginner` (sane defaults)
- Add: upstream-compatible i18n capability manifest (`i18n.manifest.json`) and core-aligned detection events

## 0.1.3
- Add: `/lang` alias for `/language` (universal; no localized command name)
- Improve: `/language <alias>` supports common inputs (en/english, zhtw/tw, toggle, pick)
- Improve: after language change, triggers `ctx.reload()` so chat UI re-renders in the new locale

## 0.1.2
- Improve: `/language` now emits `pi-i18n/localeChanged` with `{ locale, prevLocale, source }`
- Improve: `/language` updates the status "thinking hidden" label immediately (no `/reload`)

## 0.1.1
- Fix: core-hacks can now import pi-coding-agent internal files even when the package defines an `exports` map
- Improve: built-in slash command descriptions localized via stable i18n keys (pi.slash.<command>.description)

## 0.1.0
- Initial release: LTR i18n registry + zh-TW pack
- Pi UI adapter: localized header + built-in tool renderers
- Extension compliance API: import + event-bus handshake
- Commands: /lang, /lang doctor|debug|probe|setup|hacks
