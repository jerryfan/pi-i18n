import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { detectLocaleFromEnv, loadI18nConfig, saveUserI18nConfig, type I18nConfig } from "./src/config";
import { I18nRegistry } from "./src/registry";
import type { BundleV1, I18nApi } from "./src/types";
import { applyLocalizedFooter, applyLocalizedHeader, installLocalizedToolsOnce } from "./src/pi-ui";
import {
	getCoreDistDebug,
	getCoreProbeDebug,
	getSlashDescMode,
	installCoreHacks,
	resetCoreProbe,
	setCoreProbeEnabled,
	shouldWarnCoreMisalignment,
	uninstallCoreHacks,
} from "./src/core-hacks";

function loadBundle(baseDir: string, rel: string): BundleV1 {
	const path = join(baseDir, rel);
	const raw = readFileSync(path, "utf-8");
	return JSON.parse(raw) as BundleV1;
}

export default function i18nExtension(pi: ExtensionAPI): void {
	const baseDir = dirname(fileURLToPath(import.meta.url));

	// 1) Bootstrap locale from config/env. Actual cwd is only known at session_start,
	// so we finalize in session_start.
	const i18n = new I18nRegistry({ locale: "en", fallbackLocale: "en" });

	const en = loadBundle(baseDir, "locales/en.json");
	const zhTw = loadBundle(baseDir, "locales/zh-TW.json");
	i18n.registerBundle(en);
	i18n.registerBundle(zhTw);

	// 2) Event-bus compliance bridge
	pi.events.on("pi-i18n/requestApi", (payload: any) => {
		try {
			payload?.reply?.(i18n as unknown as I18nApi);
		} catch {
			// ignore
		}
	});

	pi.events.on("pi-i18n/registerBundle", (bundle: any) => {
		const res = i18n.registerBundle(bundle as BundleV1);
		if (!res.ok) {
			pi.events.emit("pi-i18n/bundleRejected", {
				namespace: bundle?.namespace,
				locale: bundle?.locale,
				errors: res.errors,
			});
		}
	});

	// Upstream-aligned capability surface (same API, no separate bridge contract).
	const i18nCapabilities = {
		contractVersion: 1,
		capability: "pi.i18n.v1",
		provider: "@jrryfn/pi-i18n",
		apiVersion: "1.x",
		detection: {
			requestEvent: "pi-core/i18n/requestApi",
			registerBundleEvent: "pi-core/i18n/registerBundle",
		},
	};

	pi.events.on("pi-core/i18n/requestApi", (payload: any) => {
		try {
			payload?.reply?.(i18n as unknown as I18nApi, i18nCapabilities);
		} catch {
			// ignore
		}
	});

	pi.events.on("pi-core/i18n/registerBundle", (bundle: any) => {
		const res = i18n.registerBundle(bundle as BundleV1);
		if (!res.ok) {
			pi.events.emit("pi-core/i18n/bundleRejected", {
				namespace: bundle?.namespace,
				locale: bundle?.locale,
				errors: res.errors,
			});
		}
	});

	// 3) Persisted + env locale selection
	let runtimeConfig: I18nConfig = {};
	const applyLocaleForCwd = (cwd: string, ctxUi?: { notify?: (m: string, t?: any) => void; setHiddenThinkingLabel?: (s?: string) => void }) => {
		const prevLocale = i18n.getLocale();
		const loaded = loadI18nConfig(cwd);
		runtimeConfig = loaded.config ?? {};
		const envLocale = detectLocaleFromEnv();
		const chosen = loaded.config.locale ?? envLocale ?? "en";
		i18n.setFallbackLocale(loaded.config.fallbackLocale ?? "en");
		i18n.setLocale(chosen);
		ctxUi?.setHiddenThinkingLabel?.(i18n.getLocale().startsWith("zh") ? "（思考已隱藏）" : "(thinking hidden)");
		pi.events.emit("pi-i18n/localeChanged", { locale: i18n.getLocale(), prevLocale, source: "startup" });
	};

	// Header chrome is disabled by policy for this extension runtime.
	const shouldApplyHeaderOnStartup = () => false;

	// Install tool overrides once (behavior preserved, rendering localized)
	// Must be registered before the first session_start fires.
	installLocalizedToolsOnce(pi, i18n as unknown as I18nApi);

	pi.on("session_start", async (_event, ctx) => {
		applyLocaleForCwd(ctx.cwd, ctx.ui);
		setCoreProbeEnabled(runtimeConfig.probeEnabled !== false);
		pi.events.emit("pi-i18n/capabilities", i18nCapabilities);
		pi.events.emit("pi-core/i18n/capabilities", i18nCapabilities);

		// Best-effort core UI hacks (no core changes). Auto-on by default.
		// Safe scope: core status/warn/error + selector UIs (session/model) + slash command descriptions.
		if (runtimeConfig.coreHacksEnabled !== false) {
			await installCoreHacks(i18n as unknown as I18nApi);
		} else {
			await uninstallCoreHacks();
		}
		const warnCoreMismatch = shouldWarnCoreMisalignment(i18n as unknown as I18nApi);
		if (warnCoreMismatch) {
			ctx.ui?.notify?.("i18n: slash command localization is running in fallback mode (pi-core alignment needed)", "warning");
		}

		// Apply chrome now
		// Failsafe: force-clear header renderer so localized banner never appears.
		try {
			ctx.ui?.setHeader?.(() => ({ invalidate() {}, render() { return []; } }));
		} catch {
			// ignore
		}
		if (shouldApplyHeaderOnStartup()) {
			applyLocalizedHeader(pi, ctx, i18n as unknown as I18nApi, { warnCoreMismatch });
		}
		applyLocalizedFooter(pi, ctx, i18n as unknown as I18nApi);

		// warn if RTL selected
		if ((i18n as any).isRtlSelected?.()) {
			ctx.ui.notify(i18n.t("pi.language.rtlWarning", { locale: i18n.getLocale() }), "warning");
		}
	});

	// 4) Commands
	function canonicalizeLocaleTag(input: string): string {
		const raw = String(input ?? "").trim().replace(/_/g, "-");
		const base = raw.split(".")[0] ?? raw; // handle zh_TW.UTF-8
		const parts = base.split("-").filter(Boolean);
		if (parts.length === 0) return "en";
		const out: string[] = [];
		out.push((parts[0] ?? "en").toLowerCase());
		for (const p of parts.slice(1)) {
			if (p.length === 2) out.push(p.toUpperCase());
			else if (p.length === 4) out.push(p[0]!.toUpperCase() + p.slice(1).toLowerCase()); // Latn
			else out.push(p.toLowerCase());
		}
		return out.join("-");
	}

	function resolveLanguageArg(rawArgs: string, currentLocale: string):
		| { action: "pick" }
		| { action: "help" }
		| { action: "set"; locale: string }
		| { action: "error" } {
		const raw = String(rawArgs ?? "").trim();
		if (!raw) return { action: "pick" };
		const token = raw.split(/\s+/)[0] ?? "";
		const k1 = token.trim().toLowerCase().replace(/_/g, "-");
		const k2 = k1.replace(/-/g, "");

		if (["pick", "ui", "select"].includes(k1)) return { action: "pick" };
		if (["help", "h", "?"].includes(k1)) return { action: "help" };

		if (["toggle", "t"].includes(k1)) {
			const cur = String(currentLocale ?? "").toLowerCase();
			return { action: "set", locale: cur.startsWith("zh") ? "en" : "zh-TW" };
		}

		const aliases: Record<string, string> = {
			en: "en",
			eng: "en",
			english: "en",
			enus: "en-US",
			"en-us": "en-US",
			us: "en-US",
			"zh-tw": "zh-TW",
			zhtw: "zh-TW",
			tw: "zh-TW",
		};

		const mapped = aliases[k1] ?? aliases[k2];
		if (mapped) return { action: "set", locale: mapped };

		// Accept well-formed locale tags directly (fr, ja, en-GB, zh-Hant-TW, ...)
		if (/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(k1)) {
			return { action: "set", locale: canonicalizeLocaleTag(k1) };
		}

		return { action: "error" };
	}

	async function commandLanguage(args: string, ctx: any): Promise<void> {
		const current = i18n.getLocale();
		const resolved = resolveLanguageArg(args, current);

		let locale: string | null = null;
		if (resolved.action === "help") {
			ctx.ui?.notify?.(i18n.t("pi.language.usage"), "info");
			return;
		}

		if (resolved.action === "error") {
			ctx.ui?.notify?.(i18n.t("pi.language.usage"), "warning");
			return;
		}

		if (resolved.action === "set") {
			locale = resolved.locale;
		} else {
			// picker (existing UX)
			const title = i18n.t("pi.language.dialog.title");
			const pick = i18n.t("pi.language.dialog.pick");

			const options = [
				`English (en)${current === "en" ? " ✓" : ""}`,
				`繁體中文 (zh-TW)${current.toLowerCase() === "zh-tw" ? " ✓" : ""}`,
				i18n.t("pi.language.dialog.other"),
			];

			const choice = await ctx.ui.select(`${title}: ${pick}`, options);
			if (!choice) return;

			if (choice.startsWith("English")) locale = "en";
			else if (choice.startsWith("繁體中文")) locale = "zh-TW";
			else {
				const other = await ctx.ui.input(title, i18n.t("pi.language.dialog.other.placeholder"));
				if (!other) return;
				locale = other;
			}
		}

		const nextLocale = canonicalizeLocaleTag(locale);
		const prevLocale = i18n.getLocale();
		if (canonicalizeLocaleTag(prevLocale) === nextLocale) {
			ctx.ui?.notify?.(i18n.t("pi.language.alreadySet", { locale: prevLocale }), "info");
			return;
		}

		i18n.setLocale(nextLocale);
		ctx.ui?.setHiddenThinkingLabel?.(i18n.getLocale().startsWith("zh") ? "（思考已隱藏）" : "(thinking hidden)");
		saveUserI18nConfig({ locale: i18n.getLocale(), fallbackLocale: i18n.getFallbackLocale() });

		pi.events.emit("pi-i18n/localeChanged", { locale: i18n.getLocale(), prevLocale, source: "command" });
		ctx.ui?.notify?.(i18n.t("pi.language.changed", { locale: i18n.getLocale() }), "info");
		ctx.ui?.notify?.(i18n.t("pi.language.reloading", { locale: i18n.getLocale() }), "info");

		// Force full UI re-render (same as /reload).
		await ctx.reload();
		return;
	}

	function commandDoctor(_args: string, ctx: any): void {
		const { issues } = i18n.doctor();
		if (issues.length === 0) {
			ctx.ui.notify(i18n.t("pi.doctor.ok"), "info");
			return;
		}
		ctx.ui.notify(i18n.t("pi.doctor.issues", { count: issues.length }), "warning");
		for (const issue of issues.slice(0, 12)) {
			if (issue.type === "missing_key") {
				ctx.ui.notify(i18n.t("pi.doctor.missingKey", issue), "warning");
			} else {
				ctx.ui.notify(
					i18n.t("pi.doctor.placeholderMismatch", {
						namespace: issue.namespace,
						key: issue.key,
						expected: issue.expected.join(",") || "(none)",
						got: issue.got.join(",") || "(none)",
					}),
					"warning",
				);
			}
		}

		const probe = getCoreProbeDebug();
		ctx.ui.notify(
			`probe: enabled=${probe.enabled} total=${probe.summary.total} matched=${probe.summary.matched} notFound=${probe.summary.notFound} unsafe=${probe.summary.unsafe} hit=${probe.summary.hit} translated=${probe.summary.translated}`,
			probe.summary.notFound > 0 || probe.summary.unsafe > 0 ? "warning" : "info",
		);
	}

	function commandDebug(_args: string, ctx: any): void {
		const mode = getSlashDescMode();
		const core = getCoreDistDebug();
		const probe = getCoreProbeDebug();
		const lines = [
			`locale=${i18n.getLocale()} fallback=${i18n.getFallbackLocale()}`,
			`slashDescMode=${mode.mode}${mode.reason ? ` reason=${mode.reason}` : ""}`,
			`coreDist=${core.distDir ?? "<not found>"}${core.reason ? ` reason=${core.reason}` : ""}`,
			`probe.enabled=${probe.enabled} total=${probe.summary.total} matched=${probe.summary.matched} notFound=${probe.summary.notFound} hit=${probe.summary.hit} translated=${probe.summary.translated}`,
			`cwd=${ctx.cwd}`,
		];
		ctx.ui.notify(lines.join("\n"), mode.mode === "fallback" ? "warning" : "info");
	}

	async function commandHacks(_args: string, ctx: any): Promise<void> {
		const enabled = await ctx.ui.select(i18n.t("pi.language.dialog.title"), [i18n.t("pi.i18n.hacks.option.on"), i18n.t("pi.i18n.hacks.option.off")]);
		if (!enabled) return;
		if (enabled.endsWith("on")) {
			saveUserI18nConfig({ coreHacksEnabled: true });
			const res = await installCoreHacks(i18n as unknown as I18nApi);
			ctx.ui.notify(res.ok ? "core hacks enabled" : `core hacks failed: ${res.reason}`, res.ok ? "info" : "warning");
		} else {
			saveUserI18nConfig({ coreHacksEnabled: false });
			const res = await uninstallCoreHacks();
			ctx.ui.notify(res.ok ? "core hacks disabled" : `core hacks disable failed: ${res.reason}`, res.ok ? "info" : "warning");
		}
	}

	function commandProbe(args: string, ctx: any): void {
		const token = String(args ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "report";
		if (token === "reset") {
			resetCoreProbe();
			ctx.ui.notify(i18n.t("pi.i18n.probe.reset"), "info");
			return;
		}
		if (token === "on") {
			setCoreProbeEnabled(true);
			saveUserI18nConfig({ probeEnabled: true });
			ctx.ui.notify(i18n.t("pi.i18n.probe.enabled"), "info");
			return;
		}
		if (token === "off") {
			setCoreProbeEnabled(false);
			saveUserI18nConfig({ probeEnabled: false });
			ctx.ui.notify(i18n.t("pi.i18n.probe.disabled"), "info");
			return;
		}

		const snap = getCoreProbeDebug();
		ctx.ui.notify(
			`i18n probe: enabled=${snap.enabled} total=${snap.summary.total} matched=${snap.summary.matched} notFound=${snap.summary.notFound} unsafe=${snap.summary.unsafe} hit=${snap.summary.hit} translated=${snap.summary.translated}`,
			snap.summary.notFound > 0 || snap.summary.unsafe > 0 ? "warning" : "info",
		);
		for (const p of snap.points.slice(0, 20)) {
			ctx.ui.notify(
				`${p.id}: state=${p.state} hooked=${p.hooked} hit=${p.hits} translated=${p.translated}${p.reason ? ` reason=${p.reason}` : ""}`,
				p.state !== "matched" ? "warning" : "info",
			);
		}
	}

	async function commandSetup(args: string, ctx: any): Promise<void> {
		const preset = String(args ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "beginner";
		if (preset !== "beginner") {
			ctx.ui.notify(i18n.t("pi.i18n.setup.usage"), "warning");
			return;
		}
		const env = detectLocaleFromEnv();
		const locale = env && env.toLowerCase().startsWith("zh") ? "zh-TW" : i18n.getLocale().startsWith("zh") ? "zh-TW" : "en";
		saveUserI18nConfig({
			locale,
			fallbackLocale: "en",
			disableHeader: true,
			disableHeaderOnStartup: true,
			coreHacksEnabled: true,
			probeEnabled: true,
			preset: "beginner",
		});
		ctx.ui.notify(i18n.t("pi.i18n.setup.applied", { locale }), "info");
		await ctx.reload();
	}

	async function dispatchI18nSubcommand(rawArgs: string, ctx: any): Promise<boolean> {
		const parts = String(rawArgs ?? "").trim().split(/\s+/).filter(Boolean);
		const sub = (parts[0] ?? "").toLowerCase();
		const rest = parts.slice(1).join(" ");
		if (!sub) return false;
		if (sub === "doctor") {
			commandDoctor(rest, ctx);
			return true;
		}
		if (sub === "debug") {
			commandDebug(rest, ctx);
			return true;
		}
		if (sub === "hacks") {
			await commandHacks(rest, ctx);
			return true;
		}
		if (sub === "probe") {
			commandProbe(rest, ctx);
			return true;
		}
		if (sub === "setup") {
			await commandSetup(rest, ctx);
			return true;
		}
		return false;
	}

	const commandLang = async (args: string, ctx: any): Promise<void> => {
		if (await dispatchI18nSubcommand(args, ctx)) return;
		await commandLanguage(args, ctx);
	};

	pi.registerCommand("lang", {
		description: i18n.t("pi.language.command.description"),
		handler: commandLang,
	});

	// Optional tool for LLM to query current locale
	pi.registerTool({
		name: "i18n_get_locale",
		label: "i18n_get_locale",
		description: "Get current UI locale from pi-i18n",
		parameters: { type: "object", properties: {}, additionalProperties: false } as any,
		async execute() {
			return {
				content: [{ type: "text", text: i18n.getLocale() }],
				details: { locale: i18n.getLocale() },
			};
		},
	});
}
