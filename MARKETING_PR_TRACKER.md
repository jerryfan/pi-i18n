# MARKETING_PR_TRACKER.md

Track pi extension localization PR outreach and outcomes.

| package | repo | score | pain_point | evidence | locale_rationale | branch | PR URL | status | submitted_at | merged_at | maintainer_language_signal | locales | files_changed | LOC | result_notes |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---:|---:|---|
| context-mode | https://github.com/mksglu/context-mode | 14 | Context-saving tool has high-cost choices/errors; unclear labels can waste context or hide relevant data. | pi.dev card/README: "saves 98%", "intent-driven search", MCP raw-data cost examples | Broad devtool: start `ja`, `zh-CN`, `es` if UI strings exist; prioritize setup/error/menu text. | | | researching | 2026-05-01 | | none yet | TBD | | | Top downloads; inspect source first. |
| pi-subagents | https://github.com/nicobailon/pi-subagents | 15 | Delegation/parallel-agent choices are easy to misunderstand; wrong choice can spawn unnecessary work or unclear child-agent behavior. | pi.dev description: chains, parallel execution, TUI clarification; README: delegate work to child agents | Broad agent workflow: `ja`, `zh-CN`, `es`; if maintainer accepts small PRs, localize TUI clarification path first. | | | researching | 2026-05-01 | | none yet | TBD | | | Very high leverage; same maintainer owns other targets. |
| pi-mcp-adapter | https://github.com/nicobailon/pi-mcp-adapter | 15 | Setup/auth/reconnect strings are high-friction: users choose config imports, OAuth, reconnect, and direct-tool setup. Misreading can leave MCP disconnected or load wrong tools into context. | `commands.ts` OAuth/reconnect notifications; `mcp-setup-panel.ts` action labels/descriptions: Run setup, Adopt imports, Scaffold project, Explain config precedence. | Devtool + MCP users: lead with `ja`, `zh-CN`, `de`; these are large developer markets and fit dense setup/error copy. | improve-localized-mcp-setup | | drafted | 2026-05-01 | | none explicit | ja, zh-CN, de | | | Best first PR candidate: concrete pain, small string surface, active maintainer. |
| @a5c-ai/babysitter-pi | https://github.com/a5c-ai/babysitter | 9 | Package purpose is underspecified from card; audit needed for user-facing supervision/approval strings. | pi.dev card: "Babysitter package for Pi Coding Agent" | Unknown until repo audit; likely safety/supervision wording, choose locales after docs. | | | researching | 2026-05-01 | | none yet | TBD | | | High downloads, but unclear surface. |
| @ollama/pi-web-search | none on pi.dev | reject | No repo link on package card; cannot submit PR efficiently. | pi.dev card lacks repo link | N/A | | | reject | 2026-05-01 | | none | none | | | Skip unless repo found another way. |
| @plannotator/pi-extension | https://github.com/backnotprop/plannotator | 13 | Plan review/approval UI has safety-critical labels; misreading annotation/approval actions can change agent execution. | pi.dev/README: interactive plan review, visual annotation, approving agent plans | Visual approval workflow: `es`, `pt-BR`, `ja` or `zh-CN`; choose after source audit. | | | researching | 2026-05-01 | | none yet | TBD | | | Good pain-point PR if UI strings are accessible. |
| pi-web-access | https://github.com/nicobailon/pi-web-access | 13 | Web/video/PDF tools likely have permission/error/result labels; localization can reduce failed fetch/setup support. | pi.dev card: web search, URL fetch, GitHub clone, PDF extraction, video analysis | Broad utility: `ja`, `zh-CN`, `es`; audit error and tool descriptions. | | | researching | 2026-05-01 | | none yet | TBD | | | Same maintainer as pi-subagents/MCP; batch only after one accepted. |
| taskplane | unknown | 10 | Orchestration/checkpoint terms can be misunderstood; wrong action may affect parallel task execution. | pi.dev card: parallel task execution with checkpoint discipline | Broad workflow: `ja`, `zh-CN`, `de`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | Need repo URL. |
| pi-lens | unknown | 10 | Real-time diagnostics labels are technical; localized severity/action text may reduce confusion. | pi.dev card: LSP, linters, formatters, type-checking, structural analysis | Developer diagnostics: `ja`, `zh-CN`, `de`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | Need repo URL. |
| pi-markdown-preview | unknown | 9 | Preview/export errors and mode labels are visible UI; localization can improve document workflow. | pi.dev card: terminal, browser, PDF output | Docs workflow: `ja`, `zh-CN`, `es`; find repo before action. | | | researching | 2026-05-01 | | none yet | TBD | | | Need repo URL. |

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

## Weekly metrics

```txt
submitted_count:
merged_count:
closed_count:
pending_count:
merge_rate:
avg_time_to_merge:
common_objections:
best accepted pain_point:
best accepted locale_rationale:
best accepted pattern:
```
