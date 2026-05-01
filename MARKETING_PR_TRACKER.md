# MARKETING_PR_TRACKER.md

Track pi extension localization PR outreach and outcomes.

| package | repo | score | pain_point | evidence | locale_rationale | branch | PR URL | status | submitted_at | merged_at | maintainer_language_signal | locales | files_changed | LOC | best_pr_shape | page_pr_candidate | page_surface | page_pain_point | result_notes |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---:|---:|---|---|---|---|---|
| context-mode | https://github.com/mksglu/context-mode | 14 | Context-saving tool has high-cost choices/errors; unclear labels can waste context or hide relevant data. | pi.dev card/README: "saves 98%", "intent-driven search", MCP raw-data cost examples | Broad devtool: start `ja`, `zh-CN`, `es` if UI strings exist; prioritize setup/error/menu text. | | | researching | 2026-05-01 | | none yet | TBD | | | audit for whole-extension | yes | README quickstart/problem | Users must understand the context-cost problem before installing; translated problem/quickstart can improve conversion. | Top downloads; inspect source first. |
| pi-subagents | https://github.com/nicobailon/pi-subagents | 15 | Delegation/parallel-agent choices are easy to misunderstand; wrong choice can spawn unnecessary work or unclear child-agent behavior. | pi.dev description: chains, parallel execution, TUI clarification; README: delegate work to child agents; `src/slash/slash-commands.ts` direct/chain/parallel/status strings. | Broad agent workflow: `ja`, `zh-CN`, `es`; slash flow covers delegation/status copy. | localize-subagent-slash-flow | https://github.com/nicobailon/pi-subagents/pull/131 | submitted | 2026-05-01 | | none explicit | ja, zh-CN, es | 3 | +159/-30 | pain-point runtime; whole-extension too large for first pass | yes | README quickstart/use cases | Users need to understand delegation/parallelism before trusting subagents. | Submitted slash-flow PR; pack passed, targeted slash test import skipped due local optional deps, full suite has env failures noted. |
| pi-mcp-adapter | https://github.com/nicobailon/pi-mcp-adapter | 15 | Setup/auth/reconnect strings are high-friction: users choose config imports, OAuth, reconnect, and direct-tool setup. Misreading can leave MCP disconnected or load wrong tools into context. | `commands.ts` OAuth/reconnect notifications; `mcp-setup-panel.ts` action labels/descriptions: Run setup, Adopt imports, Scaffold project, Explain config precedence. | Devtool + MCP users: lead with `ja`, `zh-CN`, `de`; these are large developer markets and fit dense setup/error copy. | improve-localized-mcp-setup | https://github.com/nicobailon/pi-mcp-adapter/pull/66 | submitted | 2026-05-01 | | none explicit | ja, zh-CN, de | 5 | +202/-32 | pain-point runtime done; page follow-up next | yes | README install/why/setup | Package page explains 10k+ token burn; translate that decision path after runtime PR response. | Submitted first PR; targeted checks passed, full suite has pre-existing/environment failures noted in PR. |
| @a5c-ai/babysitter-pi | https://github.com/a5c-ai/babysitter | 9 | Package purpose is underspecified from card; audit needed for user-facing supervision/approval strings. | pi.dev card: "Babysitter package for Pi Coding Agent" | Unknown until repo audit; likely safety/supervision wording, choose locales after docs. | | | researching | 2026-05-01 | | none yet | TBD | | | audit first; maybe page PR before runtime | yes | package description/README | The card undersells value; localized page may need English clarity first. | High downloads, but unclear surface. |
| @ollama/pi-web-search | none on pi.dev | reject | No repo link on package card; cannot submit PR efficiently. | pi.dev card lacks repo link | N/A | | | reject | 2026-05-01 | | none | none | | | reject until repo found | no | N/A | No repo link. | Skip unless repo found another way. |
| @plannotator/pi-extension | https://github.com/backnotprop/plannotator | 13 | Plan review/approval UI has safety-critical labels; misreading annotation/approval actions can change agent execution. | pi.dev/README: interactive plan review, visual annotation, approving agent plans | Visual approval workflow: `es`, `pt-BR`, `ja` or `zh-CN`; choose after source audit. | | | researching | 2026-05-01 | | none yet | TBD | | | whole-extension if approval UI is compact | yes | README install/approval flow | Users must understand approval semantics before trusting a visual planning workflow. | Good pain-point PR if UI strings are accessible. |
| pi-web-access | https://github.com/nicobailon/pi-web-access | 13 | Web/video/PDF tools likely have permission/error/result labels; localization can reduce failed fetch/setup support. | pi.dev card: web search, URL fetch, GitHub clone, PDF extraction, video analysis | Broad utility: `ja`, `zh-CN`, `es`; audit error and tool descriptions. | | | researching | 2026-05-01 | | none yet | TBD | | | whole-extension likely if tool descriptions/errors are compact | yes | README capability matrix | Users need to know what content types are supported before relying on web access. | Same maintainer as pi-subagents/MCP; batch only after one accepted. |
| taskplane | unknown | 10 | Orchestration/checkpoint terms can be misunderstood; wrong action may affect parallel task execution. | pi.dev card: parallel task execution with checkpoint discipline | Broad workflow: `ja`, `zh-CN`, `de`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | find repo; then audit whole-extension | yes | README workflow | Orchestration/checkpoint semantics need clear pre-install explanation. | Need repo URL. |
| pi-lens | unknown | 10 | Real-time diagnostics labels are technical; localized severity/action text may reduce confusion. | pi.dev card: LSP, linters, formatters, type-checking, structural analysis | Developer diagnostics: `ja`, `zh-CN`, `de`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | find repo; likely pain-point diagnostics first | yes | README diagnostics examples | Users need to understand diagnostic categories and actionability. | Need repo URL. |
| pi-markdown-preview | unknown | 9 | Preview/export errors and mode labels are visible UI; localization can improve document workflow. | pi.dev card: terminal, browser, PDF output | Docs workflow: `ja`, `zh-CN`, `es`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | whole-extension likely if preview UI is small | yes | README output modes | Users need to understand terminal/browser/PDF output options before install. | Need repo URL. |

## Status values

- `researching`
- `defer`
- `reject`
- `drafted`
- `submitted`
- `changes-requested`
- `merged`
- `closed`
- `rejected`

## Required evidence discipline

- `pain_point`: specific UX blind spot, not generic "needs translation".
- `evidence`: repo URL, file path, line, issue, README section, screenshot, or package-card signal.
- `locale_rationale`: why these locales fit this extension's likely users.
- `maintainer_language_signal`: explicit signal only; never infer from identity.
- `page_pr_candidate`: use aggressively after runtime PRs; separate docs/page PRs are a second low-risk touchpoint.
- `page_pain_point`: why the public package page blocks evaluation, trust, install, or correct setup.

## Weekly metrics

```txt
submitted_count:
merged_count:
closed_count:
pending_count:
page_pr_submitted_count:
page_pr_merged_count:
merge_rate:
avg_time_to_merge:
common_objections:
best accepted pain_point:
best accepted locale_rationale:
best accepted page_pain_point:
best accepted pattern:
```
