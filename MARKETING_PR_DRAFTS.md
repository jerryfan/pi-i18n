# MARKETING_PR_DRAFTS.md

## pi-mcp-adapter

Repo: <https://github.com/nicobailon/pi-mcp-adapter>

Status: drafted; source scraped to `C:/trash/pi/2026-05-01-marketing-campaign-scrape-1/pi-mcp-adapter`.

### Proposed branch

```txt
improve-localized-mcp-setup
```

### Proposed title

```txt
Localize MCP setup and auth status strings
```

### Proposed body

```md
I found one small UX issue: the setup/auth path has dense status strings exactly where users are deciding which MCP configs to import, when to authenticate, and when to reconnect. If those messages are misread, Pi can stay disconnected or load the wrong MCP tools into context.

This PR makes that path optionally localizable while preserving the current English strings as fallbacks.

- No new dependency
- No behavior change without an i18n provider
- English remains the default/fallback
- Locales: ja, zh-CN, de — large developer markets for dense setup/error copy
- Small diff; easy to revert
```

### Evidence

- `commands.ts`: OAuth/reconnect notifications (`requires OAuth`, `Failed to reconnect`, `Failed to authenticate`).
- `mcp-setup-panel.ts`: action labels/descriptions (`Run setup`, `Adopt detected compatibility imports`, `Scaffold project`, `Explain config precedence`).
- README/package claim: MCP definitions can burn 10k+ tokens; setup mistakes are context-costly.

### Implementation scope

Wrap only:

- setup panel action labels/descriptions
- reconnect/auth notifications
- status text for `mcp-auth`

Avoid:

- README edits
- package description edits
- broad locale dump
- touching generated/bundled files

## pi-subagents

Status: research next.

### Hypothesis

Clarification/delegation UI is the pain point. Wrongly understood subagent choices can spawn unnecessary parallel work or produce unclear handoffs.

### Likely locales

`ja`, `zh-CN`, `es` unless repo evidence suggests otherwise.

## context-mode

Status: research after pi-subagents.

### Hypothesis

Context-saving commands and diagnostics are high-stakes because misunderstood instructions can waste context or hide needed data.

### Likely locales

`ja`, `zh-CN`, `es` unless repo evidence suggests otherwise.
