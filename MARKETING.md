# MARKETING.md

## Purpose

Grow `pi-i18n` exposure by submitting low-risk localization PRs to high-download pi extensions.

The winning offer:

> Give maintainers free international UX with almost no risk.

Do **not** frame PRs as advertising. Frame them as optional compatibility, better UX, and preserved defaults.

## Strategy

Target pi packages where localization creates visible user value:

- high downloads on <https://pi.dev/packages>
- active repository
- slash commands, menus, prompts, settings, tool labels, or user-facing errors
- small enough diff to review quickly
- maintainer accepts outside PRs

Avoid:

- stale repos
- no repository link
- packages with no visible UI text
- large rewrites
- mandatory `pi-i18n` dependency
- broad machine-translation dumps

## Target scoring

Score each package before work:

```txt
score =
  downloads_weight
+ recent_activity_weight
+ user_facing_strings_weight
+ maintainer_responsiveness_weight
- implementation_complexity_penalty
- abandonment_penalty
```

Use this practical scale:

| Factor | Score |
|---|---:|
| Top-download package | +4 |
| Recently published / active commits | +3 |
| Many user-facing strings | +3 |
| Maintainer responds to issues/PRs | +2 |
| Small implementation surface | +2 |
| Large invasive refactor needed | -3 |
| Stale / abandoned | -5 |
| No repo link | reject |

Work highest score first.

## Language-market fit tactic

Do not blindly lead with zh-TW, zh-CN, Korean, or any fixed language set.

Choose languages that are plausible for **that extension's user base**.

Language selection inputs:

- README examples and domain terms
- package purpose and likely geography
- issue/PR/user comments
- docs language
- npm/GitHub keywords
- external service target market
- filenames, screenshots, demo text
- existing community requests

Examples:

| Extension type | Better first languages |
|---|---|
| coding/model/devtool | `ja`, `zh-CN`, `de`, `fr`, `es` |
| local Chinese service/API | `zh-CN`, then `en` polish if needed |
| Korea-specific/API package | `ko`, then `en` polish |
| Europe/productivity package | `de`, `fr`, `es`, `pt-BR` |
| broad beginner UX package | `es`, `pt-BR`, `zh-CN`, `ja` |
| docs-heavy troubleshooting tool | languages matching issue traffic |

Default first offer when no signal exists:

- `es`
- `pt-BR`
- `zh-CN`
- `ja`

Use `zh-TW` or `ko` first only when repo/content signals make them likely valuable.

## Pain-point led PR tactic

Do not pitch "translation" first.

Pitch a specific blind spot found in the package:

```txt
I noticed users hit this extension through terse commands/errors/settings.
Those strings are high-friction for non-native English users.
This PR keeps English unchanged, but makes the confusing path localizable.
```

Find a pain point by scraping repo content:

- command names/descriptions that require fluent English
- dense error messages
- setup/auth/config failure text
- destructive confirmation prompts
- model/provider names with unexplained choices
- settings labels that affect cost, privacy, deletion, permissions, or safety
- README support questions that repeat the same confusion
- screenshots showing UI labels that are too small/technical
- package card description that undersells usage

Convert the finding into a maintainer-value claim:

| Found signal | PR value claim |
|---|---|
| many setup errors | lowers support burden for setup failures |
| destructive actions | improves safety/consent clarity |
| provider/model menus | reduces wrong selections |
| beginner-facing commands | improves onboarding |
| repeated README explanation | moves explanation into UI strings |
| non-English issue traffic | serves existing users directly |
| terse command descriptions | improves command discoverability |

The PR should feel like a UX bugfix with localization as the mechanism.

## Ethical maintainer-language tactic

Use explicit repo signals only.

Allowed signals:

- multilingual README
- issues/PRs written in a non-English language
- code comments/docs in a non-English language
- package description or examples targeting a region/language

Do **not** infer native language from name, avatar, ethnicity, or location alone.

If repo has clear non-English signals, include one short courtesy line in that language, then keep the technical PR body in English.

Example:

```md
I noticed some Chinese-language usage context in the repo, so I included zh-CN strings for the highest-friction setup path.
```

## PR design rules

Every PR must be:

- optional
- no required dependency
- English fallback/default unchanged
- no behavior change without an i18n provider
- small diff
- easy to revert
- isolated translation bundles
- no marketing-first README edits in the first runtime PR

Never require maintainers to install `pi-i18n`.

Mention `pi-i18n` only as compatibility or example, not as the primary purpose.

## Follow-up PR: localized package page

After a runtime/string PR is submitted or accepted, consider a second PR that localizes the package's public-facing page content.

This means the content that pi.dev/npm/GitHub users see before install:

- README quickstart
- README feature summary
- package description if too vague
- screenshots alt text / captions
- docs landing section
- package gallery image/video captions if present

Use aggressively when:

- the package has high downloads
- README is the main conversion surface
- the runtime PR already selected locales
- package solves setup/auth/safety/cost problems
- docs are concise enough to translate without a giant diff

Do not translate the entire repo on first contact. Translate the install path and decision path.

Best shape:

```txt
README.md
README.zh-CN.md
README.ja.md
README.de.md
```

Or, if maintainer prefers one file:

```md
## Languages

- [English](#readme)
- [日本語](./README.ja.md)
- [简体中文](./README.zh-CN.md)
- [Deutsch](./README.de.md)
```

Page-localization PR pitch:

```md
The extension now has a clear setup path, but the package page is still English-only at the point where users decide whether to install it. I translated only the install/quickstart/value-prop path for the same locales as the UI strings, so non-English users can evaluate the package before installing it.

- No code changes
- English README unchanged
- Adds concise ja/zh-CN/de README variants
- Focuses on install, setup, and core safety/cost claims
```

Use this as a second touchpoint. It gives maintainers another low-risk PR and gives `pi-i18n` another natural compatibility mention without making the first PR feel promotional.

## Preferred implementation pattern

Use pi-core i18n events when available.

```ts
let t = (_key: string, fallback: string, _params?: Record<string, string | number>) => fallback;

pi.events.emit("pi-core/i18n/requestApi", {
  reply(api: any) {
    t = (key, fallback, params) => api?.t?.(`${namespace}.${key}`, params) ?? fallback;
  },
});
```

Use fallbacks at call sites:

```ts
description: t("command.description", "Original English description")
```

Register bundles only when useful:

```ts
pi.events.emit("pi-core/i18n/registerBundle", localeBundle);
```

Start with 1-3 languages selected by language-market fit. Do not submit 20 generated locale files in a first PR.

## PR title template

Pain-point led title:

```txt
Improve localized setup/error text for pi UI strings
```

Language-specific title:

```txt
Add optional es/pt-BR localization for pi UI strings
```

Compatibility title:

```txt
Add optional pi i18n support for user-facing strings
```

## PR writing style: no AI slop

The PR must sound like a maintainer wrote it after reading the repo.

Rules:

- 5-8 sentences max before checklist
- one concrete pain point, not generic praise
- cite one exact file, command, issue, or README section
- no "delighted", "seamless", "robust", "leverage", "unlock", "enhance" filler
- no long backstory
- no claims about global users without evidence
- no "I noticed your amazing project" flattery
- no repeated mention of `pi-i18n`
- use plain maintainer language: problem → small change → risk control

Good tone:

```txt
The MCP server picker currently exposes dense English labels at the exact point where a user is deciding what gets loaded into context. That is a high-cost mistake path, so I made those labels optionally localizable while keeping the existing English strings as fallbacks.
```

Bad tone:

```txt
This groundbreaking PR unlocks seamless multilingual experiences for your amazing extension and empowers global developers.
```

## PR body template

```md
I found one small UX issue: <specific string/path> appears in <high-friction flow>. If a user misreads it, they can <specific consequence: pick wrong provider, approve a destructive action, fail setup, burn context, etc.>.

This PR makes that path optionally localizable while preserving the current English strings as fallbacks.

- No new dependency
- No behavior change without an i18n provider
- English remains the default/fallback
- Locales chosen from visible package/repo signals: <locale rationale>
- Small diff; easy to revert
```

If appropriate, add one explicit-signal courtesy line:

```md
I chose these locales based on visible repo/package signals rather than adding a broad translation dump.
```

## LLM execution workflow

For each campaign cycle:

### 1. Discover targets

1. Open <https://pi.dev/packages>.
2. Sort by downloads.
3. Record the top candidates in `MARKETING_PR_TRACKER.md`.
4. For each candidate, capture:
   - package name
   - npm name
   - repo URL
   - downloads/month
   - last publish time
   - visible UI type
   - initial score

### 2. Audit candidate repo

For each high-score package:

1. Clone or inspect the repository.
2. Read `package.json`.
3. Locate pi extension entrypoints.
4. Search for user-facing strings:

```bash
rg -n "registerCommand|description|ctx\.ui|select\(|input\(|confirm\(|notify\(|label|error|warning" .
```

5. Scrape pain-point evidence:
   - high-friction command descriptions
   - setup/auth/config errors
   - destructive prompts
   - confusing model/provider/settings menus
   - repeated README troubleshooting
   - non-English issue traffic
6. Check maintainer and language-market signals:
   - recent commits
   - merged PRs
   - issue response style
   - explicit non-English repo content
   - likely user geography from service/domain/docs
7. Decide disposition:
   - `target`
   - `defer`
   - `reject`

### 3. Plan tiny PR

Before editing, define:

```txt
namespace:
pain point found:
evidence URL/file/line:
strings to wrap:
locale rationale:
locales:
files touched:
expected LOC:
risk:
fallback behavior:
maintainer value claim:
```

Reject the PR if it requires invasive architecture change.

### 4. Implement

1. Create a branch:

```bash
git checkout -b improve-localized-ui-strings
```

2. Add a tiny localization helper or inline event bridge.
3. Wrap only the pain-point strings plus adjacent obvious UI strings.
4. Add the selected 1-3 locale bundles.
5. Preserve English literals as fallback strings.
6. Run package checks:

```bash
npm install
npm test
npm run build
npm pack --dry-run
```

Use only checks that exist.

### 5. Review diff quality

Diff must satisfy:

- no dependency added unless absolutely necessary
- no lockfile churn unless required
- no unrelated formatting
- no README marketing unless minimal compatibility note is justified
- English behavior unchanged
- PR under ~150 LOC when possible
- pain-point claim is supported by repo evidence
- selected locales have an explicit rationale

### 6. Submit PR

1. Push branch to fork.
2. Open PR with the approved title/body.
3. Lead with the spotted UX pain point, not generic translation.
4. Explain why the selected locales fit this extension.
5. Add screenshots only if UI benefit is clearer.
6. Do not oversell `pi-i18n`.
7. Link to compatibility docs only if requested or useful.

### 7. Prepare page-localization follow-up

For every submitted runtime PR, decide whether a docs/page PR should follow.

Create a tracker note:

```txt
page_pr_candidate: yes/no
page_surface: README / package description / gallery image / docs quickstart
page_locales:
page_pain_point:
```

Submit the follow-up when one of these is true:

- runtime PR is merged
- maintainer comments positively
- package page has high install-friction copy
- README is short enough for a focused translation PR

Keep it separate from the runtime PR unless the maintainer explicitly asks for docs in the same PR.

### 8. Catalog status

Update `MARKETING_PR_TRACKER.md` immediately after submission.

Required fields:

| Field | Meaning |
|---|---|
| package | pi package name |
| repo | repository URL |
| score | target score |
| branch | PR branch |
| PR URL | submitted PR |
| status | researching / drafted / submitted / changes-requested / merged / closed / rejected |
| submitted_at | date |
| merged_at | date or blank |
| maintainer_language_signal | explicit signal only |
| locales | submitted locales |
| files_changed | count/list |
| LOC | approximate diff size |
| result_notes | concise outcome |

### 9. Follow up

After submission:

- respond within 24 hours when maintainer comments
- accept requested reductions
- remove marketing language if requested
- prefer maintainer style over campaign consistency
- close gracefully if rejected

### 10. Measure success

Weekly, compute:

```txt
submitted_count
merged_count
closed_count
pending_count
merge_rate = merged_count / submitted_count
avg_time_to_merge
common_objections
best accepted pattern
```

Use results to refine future PRs.

## Success criteria

A successful campaign increases exposure by earning trust in high-download repos.

Good signs:

- maintainers merge optional compatibility
- users see localized UI in popular extensions
- maintainers mention pi-compatible i18n support
- repeated PR pattern gets easier to review

Bad signs:

- PRs look like ads
- maintainers reject dependency pressure
- translations are too broad or low quality
- diffs are too large
- no tracker updates

## Operating principle

Small useful PRs compound. One accepted low-risk localization PR in a high-download extension is worth more than many broad PRs that look promotional.
