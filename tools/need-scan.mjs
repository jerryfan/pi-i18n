#!/usr/bin/env node
/**
 * pi-i18n — NEED scan (non-AST)
 *
 * Heuristically scans Pi core dist JS + local extension TS/JS for UI-likely hard-coded strings.
 * Produces a human-reviewable markdown report (NEED.md).
 *
 * Design goals:
 * - No AST dependency
 * - Low false negatives on high-impact TUI surfaces
 * - Acceptable false positives (reviewable)
 */

import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "NEED.md");

function exec(cmd) {
  return childProcess.execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }).trim();
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function walkFiles(rootDir, opts) {
  const {
    exts = new Set([".js", ".ts", ".mjs", ".cjs"]),
    ignoreDirNames = new Set([
      "node_modules",
      ".git",
      "locales",
      "schemas",
      "deploy",
      "templates",
      "vendor",
      "export-html",
    ]),
    maxBytes = 2_500_000,
  } = opts ?? {};

  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ignoreDirNames.has(ent.name)) continue;
        stack.push(full);
      } else if (ent.isFile()) {
        // Exclude typings/minified bundles.
        if (ent.name.endsWith(".d.ts")) continue;
        if (ent.name.endsWith(".min.js")) continue;

        const ext = path.extname(ent.name);
        if (!exts.has(ext)) continue;
        try {
          const st = fs.statSync(full);
          if (st.size > maxBytes) continue;
        } catch {
          continue;
        }
        out.push(full);
      }
    }
  }
  return out;
}

function extractQuotedStrings(line) {
  /** @type {Array<{quote: '"'|"'"|'`', text: string, hasInterpolation: boolean, start: number, end: number}>} */
  const parts = [];
  const quotes = new Set(["\"", "'", "`"]); // ", ', `

  for (let i = 0; i < line.length; i++) {
    const q = line[i];
    if (!quotes.has(q)) continue;

    // Skip obvious JSON keys like "name": by checking next non-space is ':' and previous is word char.
    // (Still imperfect; we accept some false positives.)

    let j = i + 1;
    let buf = "";
    let escaped = false;
    let hasInterpolation = false;
    for (; j < line.length; j++) {
      const ch = line[j];
      if (escaped) {
        buf += ch;
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (q === "`" && ch === "$" && line[j + 1] === "{") {
        hasInterpolation = true;
      }
      if (ch === q) {
        parts.push({ quote: /** @type any */ (q), text: buf, hasInterpolation, start: i, end: j });
        i = j; // continue after closing quote
        break;
      }
      buf += ch;
    }
  }
  return parts;
}

function isProbablyUiContext(line) {
  const s = line;
  // High-signal UI callsites & properties.
  return (
    s.includes("new Text(") ||
    s.includes(".setText(") ||
    /\btheme\.(fg|hint|label|value|description|bold)\s*\(/.test(s) ||
    s.includes("keyHint(") ||
    s.includes("setHeader(") ||
    s.includes("setFooter(") ||
    s.includes("setWorkingMessage") ||
    s.includes("defaultWorkingMessage") ||
    s.includes("defaultHiddenThinkingLabel") ||
    s.includes("showWarning(") ||
    s.includes("showError(") ||
    s.includes("showStatus(") ||
    s.includes("ctx.ui.notify(") ||
    s.includes("ctx.ui.confirm(") ||
    s.includes("ctx.ui.select(") ||
    s.includes("ctx.ui.input(") ||
    /\b(label|description|title|placeholder)\s*:\s*["'`]/.test(s)
  );
}

const IGNORE_EXACT = new Set([
  // Theme palette keys / styling tokens (not user-facing)
  "accent",
  "muted",
  "dim",
  "warning",
  "error",
  "success",
  "text",
  "border",
  "toolTitle",

  // UI glyph tokens (not translatable)
  "[x]",
  "[ ]",

  // Common internal identifiers seen as string literals
  "customMessageBg",
  "customMessageText",
  "customMessageLabel",
  "thinkingText",
  "bashMode",
]);

function shouldIgnoreStringLiteral(text, line, meta) {
  const t = String(text ?? "");
  const quote = meta?.quote;
  const hasInterpolation = !!meta?.hasInterpolation;

  if (!t.trim()) return true;
  if (IGNORE_EXACT.has(t)) return true;

  // Ignore obvious paths/imports.
  if (t.includes("../") || t.includes("..\\") || t.endsWith(".js") || t.endsWith(".ts")) return true;

  // Ignore ANSI-ish fragments.
  if (t.startsWith("\\x1b") || t.includes("x1b[")) return true;

  if (/^https?:\/\//.test(t)) return true;

  // Ignore keybinding ids etc.
  if (/^[a-z0-9_.-]+$/i.test(t) && t.includes(".")) {
    if (t.startsWith("tui.") || t.startsWith("app.")) return true;
  }

  // Treat obvious config keys as non-UI.
  if (/^(id|name|type|role|provider|model|path|cwd)$/i.test(t)) return true;

  // If it's a template literal with interpolation and mostly code/styling, drop.
  if (quote === "`" && hasInterpolation) {
    if (t.includes("theme.") || t.includes("keyHint(") || t.includes("repeat(")) return true;

    // If there's almost no natural language outside placeholders, it's probably formatting.
    const stripped = t
      .replace(/\$\{[^}]+\}/g, "")
      .replace(/\\[nrt]/g, " ")
      .replace(/[0-9_]+/g, " ")
      .trim();
    const letters = (stripped.match(/[A-Za-z\u00C0-\u024F\u4E00-\u9FFF]/g) ?? []).length;
    if (letters < 3) return true;
  }

  // Ignore mime types.
  if (/^[a-z]+\/[a-z0-9.+-]+$/i.test(t)) return true;

  // Drop single-token lowercase/camelCase identifiers.
  if (!/\s/.test(t) && /^[a-z][a-zA-Z0-9_]*$/.test(t) && t.length <= 32) return true;

  // Drop pure punctuation.
  if (!/[A-Za-z\u00C0-\u024F\u4E00-\u9FFF]/.test(t)) return true;

  // Special-case: first arg of theme.fg("muted", ...) etc.
  if (line && /\btheme\.fg\s*\(\s*["'`]/.test(line) && IGNORE_EXACT.has(t)) return true;

  return false;
}

function fileBaseNoExt(relFile) {
  const f = relFile.replace(/\\/g, "/");
  const base = f.split("/").pop() ?? f;
  return base.replace(/\.(mjs|cjs|js|ts)$/i, "");
}

function firstPathSegment(relFile) {
  const f = relFile.replace(/\\/g, "/");
  return f.split("/").filter(Boolean)[0] ?? "unknown";
}

function guessSurface(pkg, relFile) {
  const f = relFile.replace(/\\/g, "/");

  if (pkg === "pi-coding-agent") {
    if (f.endsWith("modes/interactive/interactive-mode.js")) return "interactive.interactive-mode";
    if (f.includes("modes/interactive/components/")) return `interactive.components.${fileBaseNoExt(f)}`;
    if (f.includes("modes/interactive/")) return `interactive.${fileBaseNoExt(f)}`;
    if (f.endsWith("core/slash-commands.js")) return "core.slash-commands";
    return "core";
  }

  if (pkg === "pi-tui") {
    if (f.includes("components/")) return `tui.components.${fileBaseNoExt(f)}`;
    return "tui";
  }

  // repo-extensions
  return `ext.${firstPathSegment(f)}`;
}

function guessStrategy(surface, line) {
  if (surface.endsWith("settings-selector") && /\bid\s*:\s*['"]/i.test(line)) return "data";
  if (surface === "core.slash-commands") return "data";
  if (surface === "interactive.interactive-mode" && line.includes("defaultWorkingMessage")) return "method";
  if (surface.endsWith("settings-list")) return "method";
  if (line.includes("render(")) return "render";
  return "method";
}

function commaCountBetween(line, startIdx, endIdx) {
  if (startIdx < 0 || endIdx <= startIdx) return 0;
  const seg = line.slice(startIdx, endIdx);
  return (seg.match(/,/g) ?? []).length;
}

function guessRole(line, part) {
  const before = line.slice(0, Math.max(0, part.start));
  const propMatch = before.match(/\b(label|description|title|placeholder)\s*:\s*$/);
  if (propMatch) return propMatch[1];

  if (line.includes("defaultWorkingMessage")) return "workingMessage.default";
  if (line.includes("defaultHiddenThinkingLabel")) return "thinkingLabel.hidden";

  // ctx.ui.* positional argument hints (best-effort)
  {
    const idx = line.indexOf("ctx.ui.select(");
    if (idx >= 0) {
      const argsStart = idx + "ctx.ui.select(".length;
      const n = commaCountBetween(line, argsStart, part.start);
      if (n === 0) return "select.title";
      return "select";
    }
  }
  {
    const idx = line.indexOf("ctx.ui.confirm(");
    if (idx >= 0) {
      const argsStart = idx + "ctx.ui.confirm(".length;
      const n = commaCountBetween(line, argsStart, part.start);
      if (n === 0) return "confirm.title";
      if (n === 1) return "confirm.message";
      return "confirm";
    }
  }
  {
    const idx = line.indexOf("ctx.ui.input(");
    if (idx >= 0) {
      const argsStart = idx + "ctx.ui.input(".length;
      const n = commaCountBetween(line, argsStart, part.start);
      if (n === 0) return "input.title";
      if (n === 1) return "input.placeholder";
      return "input";
    }
  }

  if (line.includes("showWarning(")) return "warning";
  if (line.includes("showError(")) return "error";
  if (line.includes("showStatus(")) return "status";
  if (line.includes("ctx.ui.notify(")) return "notify";

  return "text";
}

function createFileCtx(pkg, relFile, surface) {
  return {
    pkg,
    relFile,
    surface,

    // Core IDs (carried across lines)
    settingId: undefined,
    slashName: undefined,

    // Extension IDs (carried across lines)
    extName: surface.startsWith("ext.") ? surface.slice("ext.".length) : undefined,

    // Command context
    commandName: undefined,
    commandTtl: 0,

    // Tool registration context
    toolName: undefined,
    toolTtl: 0,

    // Selector context (ctx.ui.select / input / confirm)
    selectorName: undefined, // stable-ish: defaults to commandName
    selectorTtl: 0,
    optionValue: undefined,
    optionTtl: 0,
  };
}

function updateFileCtx(ctx, line) {
  // TTL decay
  if (ctx.commandTtl > 0) {
    ctx.commandTtl--;
    if (ctx.commandTtl === 0) ctx.commandName = undefined;
  }
  if (ctx.toolTtl > 0) {
    ctx.toolTtl--;
    if (ctx.toolTtl === 0) ctx.toolName = undefined;
  }
  if (ctx.selectorTtl > 0) {
    ctx.selectorTtl--;
    if (ctx.selectorTtl === 0) {
      ctx.selectorName = undefined;
      ctx.optionValue = undefined;
      ctx.optionTtl = 0;
    }
  }
  if (ctx.optionTtl > 0) {
    ctx.optionTtl--;
    if (ctx.optionTtl === 0) ctx.optionValue = undefined;
  }

  // Settings selector stable IDs
  if (ctx.surface.endsWith("settings-selector")) {
    const m = line.match(/\bid\s*:\s*["']([^"']+)["']/);
    if (m) ctx.settingId = m[1];
  }

  // Slash command stable IDs
  if (ctx.surface === "core.slash-commands") {
    const m = line.match(/\bname\s*:\s*["']([^"']+)["']/);
    if (m) ctx.slashName = m[1];
  }

  // Extensions: command/tool/selector registrations
  if (ctx.surface.startsWith("ext.")) {
    const cmd = line.match(/\bregisterCommand\s*\(\s*["']([^"']+)["']/);
    if (cmd) {
      ctx.commandName = cmd[1];
      ctx.commandTtl = 320;
    }

    // Tool registrations: pi.registerTool({ name: "...", label: "...", description: "..." })
    if (line.includes("registerTool(")) {
      ctx.toolTtl = 240;
      ctx.toolName = undefined;
    }
    if (ctx.toolTtl > 0) {
      const toolName = line.match(/\bname\s*:\s*["']([^"']+)["']/);
      if (toolName) ctx.toolName = toolName[1];
    }

    // Selector calls: ctx.ui.select/confirm/input
    if (line.includes("ctx.ui.select(")) {
      ctx.selectorTtl = 140;
      ctx.selectorName = ctx.commandName ?? "ui";
      ctx.optionValue = undefined;
      ctx.optionTtl = 0;
    }
    if (line.includes("ctx.ui.confirm(")) {
      ctx.selectorTtl = 100;
      ctx.selectorName = ctx.commandName ?? "confirm";
      ctx.optionValue = undefined;
      ctx.optionTtl = 0;
    }
    if (line.includes("ctx.ui.input(")) {
      ctx.selectorTtl = 100;
      ctx.selectorName = ctx.commandName ?? "input";
      ctx.optionValue = undefined;
      ctx.optionTtl = 0;
    }

    // Selector option values (heuristic): keep last seen value/id nearby for label/description lines.
    if (ctx.selectorTtl > 0) {
      const v = line.match(/\bvalue\s*:\s*["']([^"']+)["']/) ?? line.match(/\bid\s*:\s*["']([^"']+)["']/);
      if (v) {
        ctx.optionValue = v[1];
        ctx.optionTtl = 32;
      }
    }
  }
}

function slugify(text, max = 56) {
  return String(text)
    .toLowerCase()
    // Keep template identifiers as part of the slug (helps uniqueness)
    .replace(/\$\{([^}]+)\}/g, " $1 ")
    .replace(/\bthis\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function proposeKey({ pkg, surface, line, text, role, ctx }) {
  // Prefer stable semantic IDs when present.

  // --- core: settings selector ---
  if (surface.endsWith("settings-selector") && ctx?.settingId && (role === "label" || role === "description")) {
    return `pi.settings.${ctx.settingId}.${role}`;
  }

  // --- core: slash commands ---
  if (surface === "core.slash-commands" && ctx?.slashName && role === "description") {
    return `pi.slash.${ctx.slashName}.description`;
  }

  // --- core: interactive-mode defaults ---
  if (surface === "interactive.interactive-mode" && role === "workingMessage.default") {
    return "pi.core.interactive.workingMessage.default";
  }
  if (surface === "interactive.interactive-mode" && role === "thinkingLabel.hidden") {
    return "pi.core.interactive.thinkingLabel.hidden";
  }

  // --- extensions: command/tool/selector strings ---
  if (surface.startsWith("ext.") && ctx?.extName) {
    // Commands
    if (role === "description" && ctx.commandName) {
      return `ext.${ctx.extName}.command.${ctx.commandName}.description`;
    }

    // Tools
    if (ctx.toolName) {
      if (role === "label") return `ext.${ctx.extName}.tool.${ctx.toolName}.label`;
      if (role === "description") return `ext.${ctx.extName}.tool.${ctx.toolName}.description`;
    }

    // Selector calls + option labels/descriptions
    if (role === "select.title") {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "ui");
      return `ext.${ctx.extName}.select.${sel}.title`;
    }
    if (role === "confirm.title") {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "confirm");
      return `ext.${ctx.extName}.confirm.${sel}.title`;
    }
    if (role === "confirm.message") {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "confirm");
      return `ext.${ctx.extName}.confirm.${sel}.message`;
    }
    if (role === "input.title") {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "input");
      return `ext.${ctx.extName}.input.${sel}.title`;
    }
    if (role === "input.placeholder") {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "input");
      return `ext.${ctx.extName}.input.${sel}.placeholder`;
    }

    if ((role === "label" || role === "description") && ctx.selectorTtl > 0 && ctx.optionValue) {
      const sel = ctx.selectorName ?? (ctx.commandName ?? "ui");
      return `ext.${ctx.extName}.select.${sel}.option.${ctx.optionValue}.${role}`;
    }

    // Notifications
    if (role === "notify") {
      if (ctx.commandName) return `ext.${ctx.extName}.command.${ctx.commandName}.notify.${slugify(text) || "text"}`;
      return `ext.${ctx.extName}.notify.${slugify(text) || "text"}`;
    }

    // Generic fallback
    return `ext.${ctx.extName}.${role}.${slugify(text) || "text"}`;
  }

  // --- general fallback ---
  if (pkg === "pi-tui") {
    const comp = surface.startsWith("tui.components.") ? surface.slice("tui.components.".length) : surface;
    return `pi.tui.${comp}.${role}.${slugify(text) || "text"}`;
  }

  return `pi.core.${surface}.${role}.${slugify(text) || "text"}`;
}

function resolveCoreDists() {
  const res = {
    agentDist: undefined,
    tuiDist: undefined,
    agentVersion: undefined,
    tuiVersion: undefined,
  };

  let globalRoot;
  try {
    globalRoot = exec("npm root -g");
  } catch {
    globalRoot = undefined;
  }

  if (globalRoot) {
    const agent = path.join(globalRoot, "@mariozechner", "pi-coding-agent");
    const agentDist = path.join(agent, "dist");
    const tuiFromAgent = path.join(agent, "node_modules", "@mariozechner", "pi-tui", "dist");
    const tuiGlobal = path.join(globalRoot, "@mariozechner", "pi-tui", "dist");

    if (exists(agentDist)) {
      res.agentDist = agentDist;
      try {
        res.agentVersion = JSON.parse(readText(path.join(agent, "package.json"))).version;
      } catch {}
    }
    if (exists(tuiFromAgent)) {
      res.tuiDist = tuiFromAgent;
      try {
        const tuiPkg = path.join(agent, "node_modules", "@mariozechner", "pi-tui", "package.json");
        res.tuiVersion = JSON.parse(readText(tuiPkg)).version;
      } catch {}
    } else if (exists(tuiGlobal)) {
      res.tuiDist = tuiGlobal;
      try {
        const tuiPkg = path.join(globalRoot, "@mariozechner", "pi-tui", "package.json");
        res.tuiVersion = JSON.parse(readText(tuiPkg)).version;
      } catch {}
    }
  }

  return res;
}

function scanRoots(roots) {
  /** @type {Array<{pkg: string, root: string, file: string, relFile: string, lineNo: number, text: string, surface: string, strategy: string, key: string, context: string}>} */
  const hits = [];

  for (const r of roots) {
    const { pkg, root, includeSubdirs } = r;
    for (const sub of includeSubdirs) {
      const dir = path.join(root, sub);
      if (!exists(dir)) continue;
      const files = walkFiles(dir, { exts: new Set([".js", ".ts", ".mjs", ".cjs"]) });
      for (const file of files) {
        const relFile = path.relative(root, file);
        const surface = guessSurface(pkg, relFile);
        const fileCtx = createFileCtx(pkg, relFile, surface);

        const lines = readText(file).split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          updateFileCtx(fileCtx, line);

          if (!isProbablyUiContext(line)) continue;
          const parts = extractQuotedStrings(line);
          if (!parts.length) continue;

          for (const p of parts) {
            if (shouldIgnoreStringLiteral(p.text, line, { quote: p.quote, hasInterpolation: p.hasInterpolation })) continue;

            // Skip i18n keys like i18n.t("pi.ui...")
            const before = line.slice(0, Math.max(0, p.start));
            if (/\b(i18n\.)?t\s*\($/i.test(before.trim())) continue;

            const role = guessRole(line, p);
            const strategy = guessStrategy(surface, line);
            const key = proposeKey({ pkg, surface, line, text: p.text, role, ctx: fileCtx });

            hits.push({
              pkg,
              root,
              file,
              relFile,
              lineNo: i + 1,
              text: p.text,
              surface,
              strategy,
              key,
              context: line.trim(),
            });
          }
        }
      }
    }
  }

  // Dedupe by pkg+relFile+lineNo+text
  const seen = new Set();
  const uniq = [];
  for (const h of hits) {
    const k = `${h.pkg}|${h.relFile}|${h.lineNo}|${h.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(h);
  }
  return uniq;
}

function loadCoreHacksSources() {
  const coreHacks = path.join(REPO_ROOT, "public", "pi-extensions", "i18n", "src", "core-hacks.ts");
  if (!exists(coreHacks)) return "";
  return readText(coreHacks);
}

function classifyCoreHackCoverage(coreHacksText, candidateText) {
  // Primary: explicit source-string anchor.
  const needle = JSON.stringify(candidateText);
  if (coreHacksText.includes(needle)) return { covered: true, evidence: "exact" };

  // Secondary (template-aware heuristic):
  // If candidate is template-like, look for a stable literal stem in core-hacks patterns.
  const raw = String(candidateText ?? "");
  if (raw.includes("${")) {
    const stems = [
      raw.replace(/\$\{[^}]+\}/g, "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim(),
      raw.split("${")[0]?.trim() ?? "",
    ].filter((s) => s && s.length >= 6);

    for (const stem of stems) {
      if (coreHacksText.includes(stem)) return { covered: true, evidence: "template-stem" };
    }
  }

  return { covered: false, evidence: "none" };
}

function isCoveredByExistingCoreHacks(coreHacksText, candidateText) {
  return classifyCoreHackCoverage(coreHacksText, candidateText).covered;
}

const HIGH_IMPACT_CORE_SURFACES = new Set([
  "interactive.interactive-mode",
  "interactive.components.settings-selector",
  "interactive.components.model-selector",
  "interactive.components.scoped-models-selector",
  "tui.components.settings-list",
]);

function isHighImpactCoreSurface(surface) {
  return HIGH_IMPACT_CORE_SURFACES.has(surface);
}

function proposeBestAndFallback(h) {
  const s = h.surface;

  if (s === "interactive.components.settings-selector") {
    return {
      best: "Tier1 data patch: localize settings items by setting.id before SettingsList render",
      fallback: "Tier3 render postprocess: locale-gated line rewrite in SettingsList.render*",
      proof: "open /settings; verify labels + selected description + submenu title/description",
    };
  }

  if (s === "tui.components.settings-list") {
    return {
      best: "Tier2 method patch: localize addHintLine/renderMainList static hints",
      fallback: "Tier3 render postprocess with ANSI-safe substring replacements",
      proof: "open /settings; verify hint line and no-matching/no-available lines",
    };
  }

  if (s === "interactive.components.model-selector") {
    return {
      best: "Tier2 method patch: getScopeText/getScopeHintText + constructor text nodes",
      fallback: "Tier3 render postprocess on selector/component lines",
      proof: "open /model; verify title/scope/hints in all-scoped toggle states",
    };
  }

  if (s === "interactive.interactive-mode") {
    return {
      best: "Tier2 method patch: showStatus/showWarning/showError + extension UI bridge methods",
      fallback: "Tier4 locale-gated regex fallback on emitted status lines",
      proof: "trigger /reload, /share cancel, /name bad-usage; verify status text",
    };
  }

  if (h.strategy === "data") {
    return {
      best: "Tier1 data patch keyed by stable id (name/id/propertyPath)",
      fallback: "Tier2 method patch around constructor/setup callsite",
      proof: "exercise surface and confirm translated static metadata",
    };
  }
  if (h.strategy === "method") {
    return {
      best: "Tier2 method patch at source method/property",
      fallback: "Tier3 render postprocess for produced lines",
      proof: "exercise method-driven UI and confirm translated output",
    };
  }
  if (h.strategy === "render") {
    return {
      best: "Tier3 render postprocess (locale-gated)",
      fallback: "Tier4 regex replacement with strict guard",
      proof: "render target view and confirm per-line substitutions",
    };
  }

  return {
    best: "Tier4 regex replacement (locale + context gated)",
    fallback: "Defer and keep in NEED until stable hook appears",
    proof: "manual runtime verification required",
  };
}

function loadManualRuntimeNeed() {
  const p = path.join(REPO_ROOT, "NEED.RUNTIME.md");
  if (!exists(p)) return "";
  try {
    return readText(p).trim();
  } catch {
    return "";
  }
}

function renderMarkdown({ generatedAt, coreInfo, coreHits, coreProbeHits, extHits, coverage }) {
  const lines = [];
  lines.push("---");
  lines.push(`generated_at: ${generatedAt}`);
  lines.push(`core:`);
  lines.push(`  pi-coding-agent: ${coreInfo.agentVersion ?? "<unknown>"}`);
  lines.push(`  pi-tui: ${coreInfo.tuiVersion ?? "<unknown>"}`);
  lines.push("---");
  lines.push("");
  lines.push("# NEED — strings requiring localization");
  lines.push("");
  lines.push("This file is a **heuristic, non-AST** inventory of UI-visible hard-coded strings that likely require localization.");
  lines.push("Process contract: `public/pi-extensions/i18n/SPEC.md` §7.6.");
  lines.push("It is intended to be regenerated after Pi core upgrades and extension changes.");
  lines.push("");
  lines.push("## How to regenerate");
  lines.push("");
  lines.push("From repo root:");
  lines.push("```bash");
  lines.push("node public/pi-extensions/i18n/tools/need-scan.mjs");
  lines.push("```");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Core items needing localization (uncovered): **${coreHits.length}**`);
  lines.push(`- Core items covered by hacks but requiring runtime proof (high-impact): **${coreProbeHits.length}**`);
  lines.push(`- Repo extension items needing localization: **${extHits.length}**`);
  lines.push(`- Core strings covered by existing i18n core-hacks (heuristic): **${coverage.coreCovered}**`);
  lines.push("");

  function section(title, hits, opts = {}) {
    lines.push(`## ${title}`);
    lines.push("");
    if (!hits.length) {
      lines.push("- *(none)*");
      lines.push("");
      return;
    }

    const bySurface = new Map();
    for (const h of hits) {
      const k = `${h.pkg}:${h.surface}`;
      const arr = bySurface.get(k) ?? [];
      arr.push(h);
      bySurface.set(k, arr);
    }
    for (const [k, arr] of [...bySurface.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const [pkg, surface] = k.split(":");
      lines.push(`### ${pkg} — ${surface}`);
      lines.push("");
      for (const h of arr.sort((a, b) => a.relFile.localeCompare(b.relFile) || a.lineNo - b.lineNo)) {
        const mitigation = proposeBestAndFallback(h);
        lines.push(`- **${h.text}**`);
        lines.push(`  - where: \`${pkg}/${h.relFile}:${h.lineNo}\``);
        lines.push(`  - strategy: \`${h.strategy}\``);
        lines.push(`  - key (proposed): \`${h.key}\``);
        if (h.coverageEvidence && h.coverageEvidence !== "none") {
          lines.push(`  - coverage evidence: \`${h.coverageEvidence}\``);
        }
        lines.push(`  - best: ${mitigation.best}`);
        lines.push(`  - fallback: ${mitigation.fallback}`);
        lines.push(`  - proof: ${mitigation.proof}`);
      }
      lines.push("");
    }
  }

  section("Pi core (uncovered)", coreHits);
  section("Pi core (covered heuristically, runtime-proof required)", coreProbeHits);
  section("Repo extensions (unlocalized)", extHits);

  const manualRuntime = loadManualRuntimeNeed();
  if (manualRuntime) {
    lines.push("## Runtime regressions (manual, operator-curated)");
    lines.push("");
    lines.push("> Persisted across regenerations from `NEED.RUNTIME.md`.");
    lines.push("");
    lines.push(manualRuntime);
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const outPath = process.argv.includes("--out")
    ? process.argv[process.argv.indexOf("--out") + 1]
    : DEFAULT_OUT;

  const coreInfo = resolveCoreDists();
  const coreHacksText = loadCoreHacksSources();

  /** @type {Array<{pkg: string, root: string, includeSubdirs: string[]}>} */
  const roots = [];

  if (coreInfo.agentDist) {
    roots.push({
      pkg: "pi-coding-agent",
      root: coreInfo.agentDist,
      includeSubdirs: ["."],
    });
  }

  if (coreInfo.tuiDist) {
    roots.push({
      pkg: "pi-tui",
      root: coreInfo.tuiDist,
      includeSubdirs: ["."],
    });
  }

  // Repo extensions: public + internal
  const repoPublicExt = path.join(REPO_ROOT, "public", "pi-extensions");
  const repoInternal = path.join(REPO_ROOT, "internal");

  roots.push({ pkg: "repo-extensions", root: repoPublicExt, includeSubdirs: ["."] });
  roots.push({ pkg: "repo-extensions", root: repoInternal, includeSubdirs: ["."] });

  let allHits = scanRoots(roots);

  // Explicit core file scan (high-signal, stable IDs).
  if (coreInfo.agentDist) {
    const slashFile = path.join(coreInfo.agentDist, "core", "slash-commands.js");
    if (exists(slashFile)) {
      const relFile = path.relative(coreInfo.agentDist, slashFile);
      const surface = guessSurface("pi-coding-agent", relFile);
      const fileCtx = createFileCtx("pi-coding-agent", relFile, surface);

      const lines = readText(slashFile).split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        updateFileCtx(fileCtx, line);

        if (!isProbablyUiContext(line) && !line.includes("description") && !line.includes("BUILTIN_SLASH_COMMANDS")) continue;
        const parts = extractQuotedStrings(line);
        for (const p of parts) {
          if (shouldIgnoreStringLiteral(p.text, line, { quote: p.quote, hasInterpolation: p.hasInterpolation })) continue;
          const role = guessRole(line, p);
          const strategy = "data";
          const key = proposeKey({ pkg: "pi-coding-agent", surface, line, text: p.text, role, ctx: fileCtx });
          allHits.push({
            pkg: "pi-coding-agent",
            root: coreInfo.agentDist,
            file: slashFile,
            relFile,
            lineNo: i + 1,
            text: p.text,
            surface,
            strategy,
            key,
            context: line.trim(),
          });
        }
      }
    }
  }

  // Re-dedupe after explicit scan
  {
    const seen = new Set();
    const uniq = [];
    for (const h of allHits) {
      const k = `${h.pkg}|${h.relFile}|${h.lineNo}|${h.text}`;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(h);
    }
    allHits = uniq;
  }

  // Partition: core vs repo extensions
  const coreAll = allHits.filter((h) => h.pkg === "pi-coding-agent" || h.pkg === "pi-tui");
  const extAll = allHits.filter((h) => h.pkg === "repo-extensions");

  // Determine core coverage and preserve high-impact probe backlog.
  const coreNeed = [];
  const coreProbeNeed = [];
  let coreCovered = 0;
  for (const h of coreAll) {
    const cov = classifyCoreHackCoverage(coreHacksText, h.text);
    if (!cov.covered) {
      coreNeed.push(h);
      continue;
    }

    // Keep a runtime-proof queue for high-impact surfaces only when coverage is heuristic.
    // If we have explicit exact anchors, count as covered.
    if (isHighImpactCoreSurface(h.surface) && cov.evidence !== "exact") {
      coreProbeNeed.push({ ...h, coverageEvidence: cov.evidence });
    } else {
      coreCovered++;
    }
  }

  // Extension: treat strings as needing localization unless already key-based.
  // Also drop docs/asm, and drop repo build scripts where UI isn't involved.
  const extNeed = extAll.filter((h) => {
    const f = h.relFile.replace(/\\/g, "/");
    if (f.endsWith(".md") || f.endsWith(".asm") || f.includes("README")) return false;
    if (f.includes("/locales/")) return false;
    if (f.includes("/schemas/")) return false;

    // Exclude non-runtime tooling/scripts.
    if (f.includes("/tools/")) return false;
    if (f.includes("/scripts/")) return false;

    // If core-hacks has a translation anchor/pattern for this source text, treat it as covered.
    if (isCoveredByExistingCoreHacks(coreHacksText, h.text)) return false;

    // Ignore obvious static separators.
    if (["•", "-", "—"].includes(h.text.trim())) return false;
    return true;
  });

  const md = renderMarkdown({
    generatedAt: new Date().toISOString(),
    coreInfo,
    coreHits: coreNeed,
    coreProbeHits: coreProbeNeed,
    extHits: extNeed,
    coverage: { coreCovered, coreNeed: coreNeed.length, coreProbeNeed: coreProbeNeed.length },
  });

  fs.writeFileSync(outPath, md, "utf8");
  process.stdout.write(`Wrote ${outPath}\n`);
}

main();
