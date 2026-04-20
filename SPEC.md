---
id: pi-i18n
title: pi-i18n (pi extension) — SPEC
version: 0.1.3
status: draft
owner: jerry
created_at: 2026-04-19
updated_at: 2026-04-20
review_due: 2026-05-19
change_policy: minor
source_of_truth: true
tags: [pi, extension, i18n, l10n, localization, ltr]
risk_tier: low
distribution: public
---

# pi-i18n (pi extension) — SPEC

## 0) What this is (in one sentence)
`pi-i18n` is a **LTR-only internationalization layer** for the Pi interactive TUI that:
1) adapts the Pi UI experience to **any Left-to-Right language**, and
2) provides a **stable localization contract** so other Pi extensions can comply.

`zh-TW` is the first shipped locale.

---

## 1) Canon (95+/100 bar)

### 1.1 Objective
Deliver a localization system that feels “native” in daily Pi use while remaining:
- **safe** (no behavior changes to tools/agent),
- **fast** (no perceptible latency),
- **extensible** (other extensions can localize without rewriting their UI twice),
- **portable** (LTR languages now; RTL later without breaking schema).

### 1.2 Quality gate
This extension is considered “done” only when:
- **i18n_score ≥ 95/100** (see §8), and
- MVP acceptance criteria pass (see §9).

### 1.3 Constraints
- **LTR only** in v1.
  - We MUST support any BCP-47 locale tag that is LTR (e.g., `en`, `zh-TW`, `ja`, `fr`).
  - We MUST NOT claim RTL support (Arabic/Hebrew) until a separate RTL phase.
- **No Pi core patch required** for MVP.
  - If Pi later adds first-class i18n hooks, `pi-i18n` MUST be able to adopt them without breaking bundle format v1.
- **No model-output translation**.
  - This is UI localization, not LLM response translation.
- **Deterministic fallback**.
  - Missing keys MUST fall back predictably (never crash the TUI).

---

## 2) Scope

### 2.1 MUST localize (highest-impact surfaces Pi extensions can control today)
1. **Header + footer chrome**
   - Implemented via `ctx.ui.setHeader(...)` and `ctx.ui.setFooter(...)`.
2. **Built-in tool rendering** (behavior preserved)
   - Re-register built-ins (`read`, `bash`, `edit`, `write`, optionally `grep/find/ls`) with identical execution, localized `renderCall`/`renderResult`.
3. **Core command surface for localization**
   - `/lang` to switch locale.
   - `/lang doctor` to report missing keys/placeholder mismatches.
   - `/lang <doctor|debug|probe|setup|hacks>` for operational i18n controls.
4. **Extension compliance API**
   - A small runtime registry that other extensions can use to localize their own UI.

### 2.2 SHOULD localize (nice-to-have, still within v1)
- Help/overlay UI owned by this extension (keybinding hints, quick tips).
- Localized alias commands for common flows (`/模型` for model picker, `/續` for resume picker), implemented as extension commands.

### 2.3 NOT in v1 (explicit)
- RTL rendering, BiDi reordering, mirroring, cursor/selection semantics for RTL.
- Automatic machine translation.
- Perfect translation coverage for every built-in Pi string not exposed to extensions.

---

## 3) Architecture overview

### 3.1 Components
`pi-i18n` consists of:
1. **I18n Registry (runtime)**
   - Stores current locale, fallback locale, and bundles `(namespace, locale)`.
   - Provides `t(key, params)` formatting.
2. **Pi Adapter**
   - Hooks into Pi UI extension points (header/footer/tool renderers/commands).
3. **Extension Compliance Bridge**
   - Lets other extensions obtain `t()` without hard dependency (event-bus handshake).
4. **Locale Packs**
   - JSON bundles for `en` (baseline) and `zh-TW` (first real translation).

### 3.2 Data model

#### Locale
- Stored as BCP-47 string (examples: `en`, `zh-TW`, `ja`).
- v1 assumes LTR.

#### Key naming
- Fully-qualified key: `"{namespace}.{messageKey}"`
  - Example: `pi.tool.bash.running`
  - Example: `ext.oneliner.status.ready`

#### Namespaces
- `pi` — strings owned by `pi-i18n` that render Pi-level UI chrome/tool rows.
- `ext.<name>` — recommended convention for extension packages.

#### Canonical catalog boundary
- `zh-TW` is the canonical benchmark locale for Pi-owned and compat-owned surfaces in this spec.
- The canonical catalog is an **internal** resource arrangement for `pi-i18n` and does **not** replace the public extension bundle contract.
- Extension authors MAY continue to ship their own locale files and keys exactly as they do today.
- No extension is required to adopt the canonical catalog to remain compatible with `pi-i18n`.

---

## 4) Public API contract (what other extensions rely on)

### 4.1 Import-based API (recommended)
Other extensions MAY import a small helper module (published with this package):

```ts
export type BundleV1 = {
  version: 1;
  namespace: string;
  locale: string;
  messages: Record<string, string | { value: string | Record<string, string>; description?: string }>;
};

export type I18nApi = {
  getLocale(): string;
  setLocale(locale: string): void;
  t(fullKey: string, params?: Record<string, string | number>): string;
  registerBundle(bundle: BundleV1): void;
  onLocaleChanged(cb: (locale: string) => void): () => void;
};
```

### 4.2 Event-bus handshake (no dependency)
Because many UI render paths are synchronous, extensions need an in-memory `t()`.

- Request: `pi.events.emit("pi-i18n/requestApi", { reply: (api: I18nApi) => void })`
- Response: `pi-i18n` MUST call `reply(api)` synchronously.
- Upstream-aligned alias request (same API): `pi.events.emit("pi-core/i18n/requestApi", { reply: (api, caps) => void })`
- Capability metadata MUST be published in `i18n.manifest.json` (schema: `schemas/pi-i18n.extension.schema.json`).

### 4.3 Bundle registration events
Extensions MAY also register bundles by event:
- `pi.events.emit("pi-i18n/registerBundle", bundle)`
- Upstream-aligned alias: `pi.events.emit("pi-core/i18n/registerBundle", bundle)`

`pi-i18n` MUST validate bundles and either:
- accept and store, or
- reject and emit `pi-i18n/bundleRejected` with reasons.

### 4.4 Compatibility boundary (non-breaking)
The canonical catalog and locale-pack workflow defined later in this spec are **optional internal mechanisms** for `pi-i18n`-owned surfaces.
They MUST NOT become a prerequisite for third-party extensions that already integrate through `I18nApi`, the event-bus handshake, or their own locale files.

Hard rule:
- Existing extension i18n implementations MUST remain compatible as long as they obey the public API in §4.1–§4.3.
- No extension should need to rename its keys, reformat its bundles, or adopt the canonical catalog unless it explicitly opts into the internal Pi-owned surface workflow.

---

## 5) Message formatting requirements

### 5.1 Interpolation
- Placeholders use `{name}` style.
- Missing params MUST NOT crash; SHOULD render as `{name}` or empty string (configurable) but be reported by `/lang doctor`.

### 5.2 Plurals (kept, even if zh-TW rarely needs it)
Support plural category selection using `Intl.PluralRules(locale)`.
Bundle value may be:

```json
"files.count": { "value": { "one": "{count} file", "other": "{count} files" } }
```

### 5.3 Fallback chain
- `currentLocale → fallbackLocale (default: en) → key`
- MUST be deterministic.

---

## 6) LTR contract (v1)

### 6.1 Runtime behavior
- `pi-i18n` MUST treat all locales as LTR in v1.
- `pi-i18n` MUST NOT attempt BiDi transformations.

### 6.2 Guardrails
- If user selects a known RTL locale (e.g., `ar`, `he`), `pi-i18n` MUST:
  - warn (non-blocking) that RTL is not supported yet,
  - still allow selection for experimentation,
  - mark UI state as “unsupported” (e.g., footer hint) to prevent false expectations.

---

## 7) Pi UI integration details (how we “adapt the app” without core patches)

### 7.1 Header/footer
- On `session_start`, if `ctx.hasUI`:
  - set a localized header showing Pi title + key hints.
  - set a localized footer with queue hints/status.

### 7.2 Built-in tool renderers
- Re-register built-ins by name (delegate execute to originals created via `createReadTool/createBashTool/...`).
- Only change rendering strings.
- MUST preserve tool semantics (inputs/outputs/details).

### 7.3 Locale switch UX
- Provide `/lang` command with a TUI picker.
- Locale change MUST apply immediately (re-render header/footer and invalidate tool components).

### 7.4 Headless mode
- If `ctx.hasUI === false`, `pi-i18n` MUST:
  - not attempt header/footer,
  - still allow locale selection via command (prints confirmation),
  - still provide API to other extensions.

### 7.5 Best-effort “core hacks” (no pi-core repo edits)
Some high-impact UI strings in Pi are currently **owned by pi-core** and not exposed via stable extension APIs.
To hit the 95+/100 UX bar without waiting for upstream hooks, `pi-i18n` MAY apply **best-effort monkey patches** at runtime.

This is the **current standard workaround** and MUST be treated as a deliberate compatibility layer, not as optional fragmentation.

#### 7.5.1 Invariants (safety)
- MUST NOT change command invocation tokens/IDs (e.g. `/model` stays `/model`).
- MUST change **descriptions only** (display-only text).
- MUST be idempotent (safe to call on every locale change).
- MUST store originals and restore when locale changes away from the target locale or when uninstalling.
- MUST fail closed (patch failure must not crash Pi; it merely leaves English strings).
- MUST preserve the existing zh-TW path exactly until a deliberate equivalence step says otherwise.
- MUST NOT reclassify the workaround as “fragmentation”; if translation is partial, that is a coverage gap, not a new architecture.

#### 7.5.2 Slash-command description localization (two-layer strategy, 95+/100)
**Problem:** built-in slash command metadata (name+description) is hardcoded in pi-core and used by the interactive `/` autocomplete.

**Obstacle:** `@mariozechner/pi-coding-agent` is ESM with an `exports` map; extensions also run outside the core dependency tree.
Deep imports like `@mariozechner/pi-coding-agent/dist/...` are therefore unreliable (`ERR_PACKAGE_PATH_NOT_EXPORTED`).

**Solution:** resolve and import pi-core modules by **absolute file path**:
1) Locate `@mariozechner/pi-coding-agent/dist` using deterministic probes (argv anchors and known global install paths).
2) `import(pathToFileURL(<abs path>))` to bypass `exports`.

**Primary (Choice 2, preferred):** patch pi-core’s in-memory list
- Import: `dist/core/slash-commands.js`
- Patch: `BUILTIN_SLASH_COMMANDS[].description` in-place
- Keying: command `name` is the stable ID; translate via keys:
  - `pi.slash.<name>.description`
- Result: any consumer of `BUILTIN_SLASH_COMMANDS` (including autocomplete setup) sees localized descriptions.

**Fallback (Choice 1, gated):** patch what the user sees
- Patch: `CombinedAutocompleteProvider.prototype.getSuggestions()`
- Condition: only rewrite descriptions when `prefix.startsWith("/")`.
- Gating: enable this rewriting only when primary patching is not active to avoid double-translation.
- Visual warning: when fallback is active, the header locale hint MUST render **dim yellow** to signal core misalignment risk.

#### 7.5.3 Diagnostics (required for reliability)
`pi-i18n` SHOULD expose an operator-grade debug surface:
- `/lang debug` MUST report:
  - `slashDescMode = primary|fallback|none` (and reason)
  - resolved `coreDist` path (or `<not found>`)

### 7.5.4 Locale rollout policy (no half-implementation)
A locale is considered **rolled out** only when the following are true:
- status/footer badge shows the locale using the current standards (native label when possible, width-safe fallback when needed)
- language picker includes the locale
- monkeypatch surfaces for that locale are enabled on the same runtime path as the rest of the shipped locale set
- translation coverage is either complete for the intended surface or explicitly documented as fallback-English by design

A locale MUST NOT be treated as “done” if only one UI surface is translated while the others silently remain English.
That is a **coverage gap**, not acceptable product behavior.

### 7.5.5 One-pass locale addition procedure (required)
When adding a new shipped language, the work MUST be completed in one pass across all affected surfaces:
1. **Extension bundles**: add/update `locales/<locale>.json` for each extension that ships user-facing UI strings.
2. **Monkeypatch packs**: add/update `src/core-hacks-locales/<locale>.json` with the core exact-anchor map for the same locale.
3. **Picker + badge**: ensure `/lang` picker aliases and footer/status labels know the locale and its native display label.
4. **TUI width check**: verify the native label fits the footer/status bar; if not, use a width-safe fallback by design, not by accident.
5. **Doctor/build check**: run `/lang doctor` and a bundle build to confirm the locale is visible, loadable, and not missing required keys for the intended rollout surface.
6. **Decision rule**: if any shipped surface is still silently English, the locale is not done yet; keep it explicitly fallback-English until the missing surface is added.

This procedure exists so future locale work is added as a coherent rollout, not a partial translation pass.

---

## 7.6 Proactive core-drift adaptation (LLM-assisted, non-AST; 95+/100)

### 7.6.1 Purpose
Pi core (`pi-coding-agent`, `pi-tui`) contains **hard-coded UI strings** that can change across versions.
To maintain ≥95/100 UX coverage without waiting for upstream hooks, `pi-i18n` MUST support a **repeatable, low-friction adaptation process** that:
- discovers new/changed UI strings,
- proposes translations + patch points using existing strategies (§7.5), and
- produces a deterministic “patch plan” the extension can apply at runtime.

### 7.6.2 Hard rule: runtime stays lightweight
- Runtime MUST NOT parse the full core codebase.
- Runtime MAY validate that expected patch points still exist (probe), and MUST fail closed.
- Heavy discovery work MUST be invoked explicitly (dev command/script) and write outputs to `c:\trash\<repo>\...`.

### 7.6.3 Inputs
Adaptation tooling MUST accept the resolved absolute dist roots:
- `coreDistAgent = <...>/@mariozechner/pi-coding-agent/dist`
- `coreDistTui   = <...>/@mariozechner/pi-tui/dist`

### 7.6.4 Harvest (string inventory) — heuristic, not AST
The tooling MUST produce a **Core String Catalog** by scanning dist JS with text+context capture (e.g., `rg`), extracting:
- `text` (literal/template),
- `file` + nearby context window (N lines),
- `nearest anchors` (best-effort): `class`, `method`, `export`, `property key` (derived by heuristic regex + LLM),
- `uiLikelihood` score (0–1) based on callsite patterns (examples):
  - `new Text("…")`, `theme.*("…")`, `keyHint(..., "…")`, selector `items: [{ label, description }]`, footer/header renderers, loader/status strings.

The tooling MUST also maintain a **previous catalog** and emit a diff:
- added/removed/changed strings,
- moved strings (same text, different anchors).

### 7.6.5 LLM inference step (balanced, reviewable)
Given each harvested candidate, the tooling SHOULD use an LLM to infer:
1) **Is this UI text** (vs logs/internal/tool output)?
2) **Stable identity** (keying) in priority order:
   - semantic IDs present in core data (`setting.id`, `slash.name`, tool name), else
   - `{module}:{class}:{method}:{role}`, else
   - structural fingerprint `{file}:{anchorHash}`.
3) **Best strategy tier** (least fragile wins):
   - Tier 1: data-level patch (arrays/objects)
   - Tier 2: method/property patch (`getFooterText`, `getScopeText`, constructor fields)
   - Tier 3: render-line postprocess (`render() => map(t)`) (selector-style)
   - Tier 4: regex replacement (last resort; locale-gated; context-gated)
4) **Translation key proposal** and parameters (for templates).

LLM output MUST be persisted as structured JSON and remain **human-reviewable** (no silent auto-apply to runtime patches).

### 7.6.6 Outputs (durable artifacts)
Adaptation tooling MUST emit three artifacts:
1) `core-string-catalog.json` — raw harvested + inferred metadata.
2) `core-patch-spec.json` — declarative patch plan consumed by runtime.
3) `core-drift-report.md` — concise operator report (coverage, new strings, broken probes).

### 7.6.7 Runtime consumption (declarative patch spec)
`pi-i18n` core-hacks SHOULD be spec-driven.

**Patch spec schema (v1, minimal):**
```ts
export type CorePatchSpecV1 = {
  version: 1;
  core: "pi-coding-agent" | "pi-tui";
  patches: Array<{
    id: string; // stable; used in doctor output
    moduleRelPath: string; // e.g. "modes/interactive/interactive-mode.js"
    target: {
      exportName?: string; // optional
      className?: string;  // optional
      methodName?: string; // optional
      propertyPath?: string; // e.g. "items[].label"
    };
    strategy: "data" | "method" | "render" | "regex";
    when: { locale: string | "*"; uiOnly: true };
    i18n: { key: string; params?: string[] };
    guard?: { containsText?: string; minCoreVersion?: string };
  }>;
};
```

Runtime behavior:
- Apply patches from `core-patch-spec.json`.
- On startup and locale change, probe each spec target and record:
  - `matched | notFound | unsafe`.
- `/lang doctor` MUST report match rate and list unmapped high-`uiLikelihood` strings.

### 7.6.8 Safety gates (non-negotiable)
- MUST NOT translate or mutate tool arguments or tool outputs.
- MUST NOT change slash command tokens/IDs; descriptions only.
- MUST locale-gate any Tier-3/4 transformations.
- MUST store originals and restore when locale changes away or when uninstalling.

## 7.7 Extension ecosystem integration (PR-first; compat layer)

### 7.7.1 Preferred: submit PRs to the extension repo
To localize an extension sustainably (≥95/100), the correct path is to **add i18n support inside the extension**:
- Use the `pi-i18n` **event-bus handshake** (§4.2) to avoid a hard dependency.
- Ship `locales/en.json` as the **baseline** and add other locale JSON files as desired.
- Replace user-facing UI strings with `t("ext.<name>.<key>")` lookups.
- Keep an English fallback so the extension remains usable without `pi-i18n`.

A ready-to-copy PR description template is provided in this repo:
- `.github/pull_request_template.md`

### 7.7.2 Compat layer: when an extension will not accept PRs
If an extension is third-party and will not accept i18n changes, `pi-i18n` MAY provide a **best-effort compat layer** by translating that extension's UI strings at runtime.

**Hard limits (non-negotiable):**
- Compat MUST remain UI-only.
  - Do NOT translate model outputs, tool outputs, or file contents.
- Compat MUST be locale-gated (e.g. apply only for `zh-TW`, `zh-CN`, etc.).
- Compat MUST be reversible (store originals; restore on uninstall/locale change).
- Compat MUST prefer stable patch points (Tier 1/2) over regex rewriting.

**Where to implement compat:**
- Primary: `src/core-hacks.ts` string anchors + selector/text-tree postprocessing.
  - Add exact-match anchors when available.
  - Add narrowly-scoped regex patterns only as last resort.

**Compat workflow (repeatable):**
1. Identify the exact user-facing string and its render path (file + method/component).
2. Prefer PR-style keying when possible; otherwise add a compat mapping:
   - Exact map entry (preferred)
   - Pattern rule (last resort; must be tight)
3. Add probe instrumentation (or rely on existing probe points) so `/lang probe` can confirm the compat path is actually hit.
4. Update `tools/need-scan.mjs` inventory if new strings appear (drift control).
5. Manual proof in a live session for the target extension paths.

**When compat is acceptable:**
- The string is high-impact (command usage, picker labels, warnings/errors).
- The string is stable across versions (or has an easy-to-detect anchor).

### 7.6.9 Translation-change gotchas (required operator checklist)
For changes targeting `src/core-hacks.ts`, operators MUST follow this checklist to preserve ≥95/100:

1. **Width safety first (hard blocker)**
   - Any translated line shown in TUI menus/status MUST fit terminal width constraints.
   - For narrow rows, translations SHOULD prefer concise wording over literal phrasing.
   - A render overflow crash (`Rendered line ... exceeds terminal width`) is a release blocker.

2. **Regex integrity (hard blocker)**
   - Word-boundary regexes MUST use escaped text sequences (`\\b`) in source.
   - Literal control chars (e.g., backspace `0x08`) in regex patterns are forbidden.

3. **Dynamic surface coverage (hard blocker)**
   - Command outputs assembled at runtime (e.g., `/session`, `/hotkeys`, `/compact`) MUST be validated via live runtime checks.
   - Static map replacements alone are insufficient when core adds children/components after initial patch points.

4. **No pi-core mutation**
   - Changes MUST be extension-only runtime patching; no edits under installed `pi-coding-agent` dist.

5. **Proof protocol (required)**
   - After translation edits: reinstall extension, `/reload`, switch locale, run command regression set.
   - Heuristic inventory (`NEED.md`) is advisory; live runtime output is authoritative.

6. **Header policy stability**
   - If header suppression is policy, startup and language-switch paths MUST both preserve suppression.

---

## 7.8 Canonical key catalog (internal-only)

### 7.8.1 Purpose
Provide a single authoritative key set for Pi-owned UI surfaces so locale parity is machine-checkable and no shipped locale can silently miss keys.

### 7.8.2 Scope
This catalog applies only to:
- `pi-i18n`-owned surfaces,
- core-hack compat surfaces,
- any first-party extension that explicitly opts into the canonical workflow.

It does **not** replace or constrain the public extension bundle contract in §4.

### 7.8.3 Suggested resource layout
The implementation SHOULD use a resource-file arrangement with three layers:
1. `catalog/keys.json` — stable key metadata and surface classification.
2. `catalog/zh-TW.json` — canonical reference text for the key set.
3. `locales/<locale>.json` — per-locale mirrors that must match the canonical key universe.

The catalog MAY be generated into derived artifacts, but the canonical key set MUST remain deterministic and reviewable.

### 7.8.4 Mirror rules
- Every shipped locale mirror MUST contain the same key set as the canonical reference.
- Missing keys are release blockers for the targeted surface set.
- Extra keys are stale unless they are explicitly marked as legacy compatibility entries.
- Enum values, option labels, helper text, and hint strings count as keys if they render to the user.

### 7.8.5 One-pass addition workflow
When a new Pi-owned string is introduced:
1. add it to the canonical catalog,
2. regenerate the locale mirrors,
3. fill translations for each shipped locale,
4. run parity checks,
5. ship only when the intended rollout surface is complete or explicitly fallback-English by design.

### 7.8.6 Compatibility with third-party extensions
Third-party extensions MAY ignore the canonical catalog completely and keep using their own keys, bundles, and namespaces.
That is the supported default path.

The canonical catalog is for **Pi-owned surface completeness**, not for forcing every extension into the same file layout.

## 8) Scoring rubric (i18n_score)

Score is 0–100 and MUST be computed from explicit checks:

### 8.1 Coverage (40 pts)
- (10) Canonical key catalog complete for shipped Pi-owned surfaces; parity checks pass.
- (10) Pi-owned UI surfaces localized: header/footer + built-in tool renderers.
- (20) First-party extension compliance demonstrated by localizing at least:
  - `public/pi-extensions/oneliner`, and
  - `internal/govern`.

### 8.2 Correctness (30 pts)
- (15) No missing-key crashes; deterministic fallback.
- (10) Placeholder validation catches mismatches.
- (5) Locale switch updates UI immediately.

### 8.3 DX & ecosystem (20 pts)
- (10) Clear schema + conventions + examples.
- (10) Event-bus handshake works (no dependency adoption path).

### 8.4 Performance & safety (10 pts)
- (5) No perceptible slowdown; no repeated heavy work per render.
- (5) No tool behavior changes; no network calls by default.

**95+ requirement:** must score ≥95 with no single category below 80% of its points.

---

## 9) Acceptance criteria (MVP-level)

### Functional
- Locale can be switched at runtime via `/lang`.
- `zh-TW` locale exists and localizes:
  - header/footer,
  - built-in tool renderers (at minimum read/bash/edit/write).
- Other extensions can:
  - request `I18nApi` via event-bus,
  - register a bundle,
  - render translated strings.

### MVP translation proof
- `public/pi-extensions/oneliner` is made i18n-compliant and ships `zh-TW` strings.
- `internal/govern` is made i18n-compliant and ships `zh-TW` strings.

### Safety
- No interception that mutates tool call arguments.
- No outbound network calls by default.

---

## 10) Changelog
| Version | Date | Change Type | Summary | Approved By |
|---|---|---|---|---|
| 0.1.3 | 2026-04-20 | minor | add internal canonical key catalog + one-pass locale rollout procedure without breaking extension compatibility | jerry |
| 0.1.0 | 2026-04-19 | major | initial spec (LTR i18n platform + zh-TW first) | jerry |
| 0.1.1 | 2026-04-20 | minor | add LLM-assisted, non-AST core-drift adaptation pipeline + patch-spec contract | jerry |
| 0.1.2 | 2026-04-20 | minor | command namespace consolidation (/lang only), runtime probe mode, upstream-compatible capability manifest | jerry |
