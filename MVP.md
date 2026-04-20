# MVP

## Product

**pi-i18n** — a LTR-only localization platform for the Pi interactive TUI and for Pi extensions.

- Goal: make Pi usable in **any LTR language** via a stable i18n contract.
- First shipped locale: **zh-TW**.
- RTL is explicitly deferred.

## MVP outcomes

1. A user can switch UI locale at runtime (no restart).
2. The Pi “daily-driver” experience feels localized (chrome + tool rows).
3. Other extensions can comply with a stable schema + API (import or event-bus).
4. We prove ecosystem compatibility by localizing **two real extensions** in this repo:
   - `public/pi-extensions/oneliner`
   - `internal/govern`

## MVP shipped scope

### 1) i18n runtime + bundle contract
- `BundleV1` JSON schema (namespace + locale + messages)
- deterministic fallback: `currentLocale → en → key`
- interpolation (`{name}`) + plural categories (kept for future locales)
- event-bus handshake: extensions can request `I18nApi` without dependencies

### 2) Pi UI adaptation (LTR)
- localized header/footer (via `ctx.ui.setHeader/setFooter`)
- localized built-in tool rendering (delegate behavior; only strings change)
  - minimum: `read`, `bash`, `edit`, `write`
- `/lang` command with a picker

### 3) Locale packs
- baseline: `en`
- first translation: `zh-TW`

### 4) First-party compliance proof (required)
- Update **oneliner** to use `pi-i18n` for all user-visible strings and ship `zh-TW`.
- Update **govern** to use `pi-i18n` for all user-visible strings and ship `zh-TW`.

## Definition of done (MVP)

- Switching to `zh-TW` results in:
  - Pi header/footer strings in zh-TW
  - tool rows in zh-TW for read/bash/edit/write
  - oneliner UI strings in zh-TW
  - govern UI strings in zh-TW
- `/lang doctor` (or equivalent) reports no missing keys for `pi`, `ext.oneliner`, `ext.govern` in `zh-TW`.
- No Pi tool behavior changes (only rendering).

## Not in MVP

- RTL support (BiDi, mirroring, cursor semantics)
- Weblate integration / hosted translation workflow
- AST-based extraction CLI and type-safe key generation
- automatic machine translation
- full coverage of Pi internal built-in strings that extensions cannot currently override
