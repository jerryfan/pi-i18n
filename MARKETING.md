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

## Western-first language-market fit tactic

Default future outreach is **Western-language-first** unless explicit repo/product/community evidence says otherwise.

Preferred default set when no explicit signal exists:

1. `es`
2. `fr`
3. `pt-BR`
4. `it`
5. `de` for infra/devtool/status/config-heavy packages where German developer-market fit is especially plausible

Do **not** lead with `ja`, `zh-CN`, `zh-TW`, or `ko` by habit. Those locales require explicit support such as repo docs/comments/examples, issue/PR traffic, maintainer-stated preference, product geography, service audience, screenshots/demo text, or community requests. If that support is absent, using East Asian locales fails the campaign gate.

Choose languages that are plausible for **that extension's user base**, but the no-signal fallback is Western languages for developer UX, reviewability, and lower perceived drive-by translation risk.

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
| coding/model/devtool | `es`, `fr`, `pt-BR`, `it`; add `de` for config/status-heavy tooling |
| local Chinese service/API | `zh-TW` or `zh-CN` only with explicit repo/product/community signal |
| Korea-specific/API package | `ko` only with explicit product/community signal; otherwise use Western default |
| Europe/productivity package | `de`, `fr`, `es`, `pt-BR` |
| broad beginner UX package | `es`, `fr`, `pt-BR`, `it` |
| docs-heavy troubleshooting tool | languages matching issue traffic |

Default first offer when no signal exists:

- `es`
- `fr`
- `pt-BR`

Optional fourth locale: `it` or `de`, chosen by extension fit.

Use `ja`, `zh-CN`, `zh-TW`, or `ko` only when repo/content/community signals make them likely valuable. Record the exact signal in the tracker before implementation.

Hard gate: before editing, write `locale rationale` as `western default` or `explicit signal: <evidence>`. If East Asian locales are selected without an explicit signal, stop and revise.

## Regression lessons from historic submissions

Top 95+/100 lessons from retracted PRs:

- **100/100 — Locale evidence gate is non-negotiable**: no locale override from maintainer name, avatar, presumed ethnicity, or presumed nationality. Locale selection requires repo/product/community evidence or maintainer-stated preference. Historical `ja/zh-*` choices without evidence were campaign failures.
- **99/100 — First-touch PR must look hand-written for that repo**: never reuse a locale trio, branch shape, or PR body rhythm across maintainers. Clone patterns read as campaign automation.
- **99/100 — A localization PR must be a UX bugfix first**: every PR needs one concrete failure mode: wrong approval, wrong config, failed auth/setup, privacy leak, wasted context, wrong model/tool, or wrong process action.
- **98/100 — Smallest high-risk surface wins**: approval/privacy/security/setup strings beat broad command/status/help wrapping. Do not wrap adjacent copy unless it directly supports the risk path.
- **98/100 — Western default means default, not excuse**: `es/fr/pt-BR` is acceptable only when no stronger signal exists and the package has broad developer-user fit. Still record `western default` explicitly.
- **97/100 — Do not submit docs/page PRs as automatic second touches**: page localization must have its own conversion/support pain point and should usually wait for maintainer interest.
- **97/100 — Whole-extension localization is rare**: use only for tiny string surfaces with clear tests. Otherwise it looks like a translation dump.
- **96/100 — Validation honesty is part of trust**: list passed checks separately from blocked checks. If tests cannot run, say why and avoid “targeted checks” spin unless targeted checks truly cover touched code.
- **96/100 — Ledger intake is not PR evidence**: npm/pi.dev card evidence can add a target, but implementation requires exact files, strings, and maintainer-visible rationale.
- **95/100 — Retraction is cheaper than defending weak PRs**: close unsupported PRs quickly, apologize plainly, delete branches, and preserve ledger history as negative training data.
- **95/100 — Maintainer chooses expansion scope**: offer broader localization only as optional follow-up work, with maintainer-selected locales and small PRs.
- **95/100 — One maintainer, one open experiment at a time**: do not stack multiple localization PRs on the same maintainer until the first receives a positive signal.
- **95/100 — Campaign velocity must not outrun feedback**: after several submissions, pause to harvest maintainer reactions before opening more similar PRs.
- **95/100 — Existing i18n is a strong signal**: if a repo already has an i18n pattern, conform to it exactly; if not, keep the bridge tiny and optional.
- **95/100 — Avoid translating maintainer-authored examples unless requested**: commands, config keys, code examples, tool names, and product names usually stay English.
- **95/100 — PR body must include a deletion path**: explicitly say the change is easy to revert or isolate if the maintainer dislikes the direction.

Pre-implementation hard gate:

```txt
locale rationale: western default OR explicit repo/product/community signal with evidence
identity-inference check: no locale chosen from name/avatar/presumed ethnicity/nationality
anti-pattern check: does this look reusable across repos? if yes, rewrite
pain consequence: wrong approval/config/setup/privacy/model/context/etc.
exact strings/files:
why these strings, not adjacent strings:
first PR shape: pain-point runtime / compact whole-extension / page-only
validation plan:
checks expected to be blocked:
maintainer-risk sentence: one sentence, no global/localization hype
optional service footer: omit / compressed / full, with reason
same-maintainer open PR count:
feedback harvested from prior PRs:
```

## Campaign readiness rubric

Do not continue submissions unless readiness is **95+/100**.

Score each campaign batch before opening PRs:

| Gate | Points | 95+ requirement |
|---|---:|---|
| Locale discipline | 20 | Every PR uses `western default` or explicit locale evidence; no unsupported East Asian locales. |
| Pain specificity | 20 | Every PR names one concrete failure mode and exact strings/files. |
| Maintainer context | 15 | No stacked PRs to same maintainer without positive signal; PR body is repo-specific. |
| Scope control | 15 | Smallest high-risk surface only; no generated files; no adjacent string creep. |
| Validation honesty | 10 | Passed and blocked checks are separated; blockers are precise. |
| Optionality/revertability | 10 | No dependency, English fallback, easy deletion path stated. |
| Feedback loop | 10 | Prior maintainer reactions reviewed before similar submissions. |

Automatic stop conditions:

- any locale chosen from maintainer name, avatar, presumed ethnicity, or presumed nationality
- any unsupported non-default locale without explicit repo/product/community evidence
- more than one open campaign PR to the same maintainer without positive response
- PR body could be pasted into another repo unchanged
- package-card evidence is the only implementation evidence
- generated/bundled files required
- tests fail due touched code and no fix is available
- optional service offer feels like sales or pressure

Current self-rating after retraction cleanup: **88/100**.

Known gaps before more submissions:

- Historical tracker rows still contain retracted bad-locale facts; acceptable as history, but future candidate rows need stricter `western default` wording.
- Need a visible PR preflight record for each new implementation.
- Need same-maintainer open-PR counter before submit.
- Need feedback-harvest step before resubmitting to previously contacted maintainers.
- Need a rule to prefer safety/privacy/HITL targets while trust is being rebuilt.

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

Do **not** infer native language from identity traits. Do use evidenced spoken/communication-language signals in the repo or project community, including docs/comments/examples language, issue/PR language, maintainer-stated language, package audience, or product geography.

If repo has clear non-English signals, include one short courtesy line in that language, then keep the technical PR body in English.

Example:

```md
I noticed explicit Chinese-language usage context in the repo, so I selected the Chinese locale that matches that signal. Without such a signal, default future outreach now prefers Latin-derived locales (`es`, `fr`, `pt-BR`, `it`) for broad reviewability.
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

## Optional maintainer-service offer

It is acceptable to offer broader localization help, but only as an optional maintainer-service footer after the concrete PR value is clear.

Use when:

- the PR is already small and pain-point-led
- the maintainer appears active or responsive
- the extension has a coherent remaining string/docs surface
- you can credibly split follow-up work into small PRs
- the offer lets the maintainer choose locale scope

Do not use when:

- the PR is already large
- the locale rationale is weak
- the repo has generated UI bundles only
- the maintainer has not shown interest in localization
- the line would make the PR feel like a campaign pitch

Never say "outsource". Never imply the maintainer needs localization. Never promise full-repo translation. Offer reviewable follow-up work only.

Approved footer:

```md
If broader localization would be useful later, I’m happy to handle follow-up work in small PRs: remaining UI strings, README quickstart, or whichever locale set you prefer. I’ll keep English fallback unchanged and avoid generated files.
```

First-touch compressed footer:

```md
If useful later, I’m happy to handle broader localization in small follow-up PRs using whatever locale set you prefer.
```

Context rule: omit the footer unless it naturally follows from the exact PR and maintainer context.

## PR scope ladder

Choose the smallest scope that creates real maintainer value, but do not be timid when the extension surface is compact.

1. **Pain-point runtime PR**: setup/auth/error/destructive-action strings only.
2. **Whole-extension localization PR**: all user-facing extension strings when the extension has a small/medium UI surface and clean string boundaries.
3. **Page-localization PR**: public package page / README decision path.
4. **Combined runtime + page PR**: only when the repo is tiny or maintainer explicitly prefers one PR.

Use whole-extension localization aggressively when:

- total user-facing string surface is under ~80 strings
- strings are concentrated in 1-5 files
- tests/build are easy to run
- no generated/bundled files are touched
- English fallback can be preserved everywhere
- locale rationale is extension-specific

Avoid whole-extension localization when:

- it requires architecture churn
- the repo has generated UI bundles only
- it would produce a huge diff before maintainer trust exists
- strings include legal/security/product promises you cannot verify

Whole-extension PR pitch:

```md
I found the extension's user-facing string surface is small enough to localize cleanly in one pass without changing behavior.

This keeps English as the fallback/default and only adds localized labels, prompts, and status/error text for the same flows users already see.

- No new required dependency
- No behavior change without an i18n provider
- English fallback unchanged
- Locales chosen from visible package/repo signals: <locale rationale>
- Covers the full extension UI surface, not generated files
```

## PR scope ladder

Choose the smallest scope that is still obviously useful:

1. **Pain-point runtime PR**: setup/auth/error/destructive/decision strings only.
2. **Package-page PR**: README/package page install and decision path only.
3. **Entire extension localization PR**: all user-facing extension strings plus docs/page translations.

Use entire-extension localization aggressively when the extension is small, string surface is coherent, tests are available, and the diff stays reviewable. Do not split artificially if the whole extension is only one or two files of user-facing copy.

Entire-extension PR rules:

- no generated files
- no broad formatting
- no dependency requirement
- English fallback unchanged
- all user-facing strings in one namespace
- locale bundles limited to selected locales
- README/page translation included only if concise
- PR body lists exact surfaces localized
- avoid translating internal identifiers, tool names, config keys, commands, and code examples unless they are explanatory prose

Entire-extension pitch:

```md
I found the extension's user-facing string surface is small enough to localize in one reviewable pass. This PR keeps English as the fallback, does not add a dependency, and localizes the setup/status/help/docs path together so users do not switch languages mid-flow.

Localized surfaces:

- <commands/help/status/errors>
- <panel labels/descriptions>
- <README quickstart/package page, if included>

Locales: <locale rationale>
```

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
README.es.md
README.fr.md
README.pt-BR.md
```

Or, if maintainer prefers one file:

```md
## Languages

- [English](#readme)
- [Español](./README.es.md)
- [Français](./README.fr.md)
- [Português brasileiro](./README.pt-BR.md)
```

Page-localization PR pitch:

```md
The extension now has a clear setup path, but the package page is still English-only at the point where users decide whether to install it. I translated only the install/quickstart/value-prop path for the same locales as the UI strings, so non-English users can evaluate the package before installing it.

- No code changes
- English README unchanged
- Adds concise es/fr/pt-BR README variants
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

Start with 1-3 Western-default languages (`es`, `fr`, `pt-BR`) unless explicit evidence supports another set. Do not submit 20 generated locale files in a first PR.

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
   - if no explicit signal: use Western default (`es`, `fr`, `pt-BR`)
7. Decide disposition:
   - `target`
   - `defer`
   - `reject`

### 3. Plan tiny PR

Before editing, define and paste into the tracker or scratch notes:

```txt
namespace:
pain point found:
evidence URL/file/line:
strings to wrap:
why these strings, not adjacent strings:
locale rationale: western default OR explicit signal with evidence
locales:
files touched:
expected LOC:
risk:
fallback behavior:
maintainer value claim:
same-maintainer open PR count:
feedback harvested:
optional service footer: omit / compressed / full, with reason
readiness score:
```

Reject the PR if it requires invasive architecture change or scores below 95.

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
8. Add the optional maintainer-service footer only when the context rule passes.
9. If the same maintainer already has an open campaign PR, pause unless they responded positively.

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
