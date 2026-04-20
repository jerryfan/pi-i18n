# Changelog

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
