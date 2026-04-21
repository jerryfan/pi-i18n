# pi-i18n Release Plan (lean, npm-first)

## 1) Quality gate (manual, in a real pi session)

After installing the package and restarting pi:

```text
/lang setup beginner
/lang doctor
/lang debug
/lang probe

/settings
/model
/compact
```

Expected:
- Core UI strings show in zh-TW when locale is zh-TW
- No `/i18n ...` command surface exists (all operational commands are under `/lang`)
- No startup header banner spam (per config flags/policy)
- `/lang probe` shows non-zero hits for patched high-impact render paths

## 2) Pack + publish

From this folder:

```bash
npm pack --dry-run
npm publish
```

Notes:
- Package is a **pi extension**. Users install with:
  - `pi install npm:pi-i18n`
- `publishConfig.access=public` is set; publishing should not require extra flags.

## 3) Tag + GitHub release

- Tag: `v<version>`
- GitHub release notes: paste the relevant `CHANGELOG.md` section
- Include install snippet:
  - `pi install npm:pi-i18n`
