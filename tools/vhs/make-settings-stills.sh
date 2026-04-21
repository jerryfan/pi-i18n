#!/usr/bin/env bash
set -euo pipefail

# Deterministically generates a localized /settings montage:
# - records one short MP4 per locale (with /settings open)
# - extracts a single PNG still per locale
# - stitches stills into a short MP4 + GIF
#
# Intended usage: run inside WSL2 and write outputs to /mnt/c/trash/... (per AGENTS.md).

usage() {
	cat <<'EOF'
Usage:
  make-settings-stills.sh <out_dir>

Example (WSL):
  OUT=/mnt/c/trash/pi/$(date +%F)-pi-i18n-demo-r1
  bash tools/vhs/make-settings-stills.sh "$OUT"

Writes:
  <out_dir>/pi-settings-stills.gif
  <out_dir>/pi-settings-stills.mp4
  <out_dir>/stills/*.png

Requirements:
  - vhs
  - ffmpeg
  - pi (installed in WSL)
  - pi-i18n installed in WSL (so /settings is localized)
EOF
}

OUT_DIR="${1:-}"
if [[ -z "${OUT_DIR}" || "${OUT_DIR}" == "-h" || "${OUT_DIR}" == "--help" ]]; then
	usage
	exit 0
fi

mkdir -p "$OUT_DIR"
cd "$OUT_DIR"

CAPTURES="$OUT_DIR/captures"
STILLS="$OUT_DIR/stills"
TAPES="$OUT_DIR/tapes"
mkdir -p "$CAPTURES" "$STILLS" "$TAPES"

# Match /lang ORDER
LOCALES=(en zh-TW zh-CN ja ko es pt-BR fr de)

# pi-i18n config location
CONFIG_PATH="$HOME/.pi/agent/state/pi-i18n/config.json"
mkdir -p "$(dirname "$CONFIG_PATH")"

WIDTH=1200
HEIGHT=600
FPS=15
TYPING=25ms

PI_STARTUP_SLEEP=6s
SETTINGS_SETTLE=1500ms
SETTINGS_VISIBLE=2500ms

# Extract final frame while selector is still visible.
SSEOF=-0.15

run_one() {
	local locale="$1"
	local idx="$2"

	printf '{\n  "locale": "%s",\n  "fallbackLocale": "en"\n}\n' "$locale" > "$CONFIG_PATH"

	local tape="$TAPES/settings-${idx}-${locale}.tape"
	local mp4_rel="captures/settings-${idx}-${locale}.mp4"
	local mp4_abs="$OUT_DIR/$mp4_rel"
	local png_abs="$STILLS/${idx}-${locale}.png"

	cat > "$tape" <<EOF
Output ${mp4_rel}

Set Shell "bash"
Set Width ${WIDTH}
Set Height ${HEIGHT}
Set Framerate ${FPS}
Set TypingSpeed ${TYPING}

Type "pi"
Enter
Sleep ${PI_STARTUP_SLEEP}

Type "/settings"
Enter
Sleep ${SETTINGS_SETTLE}
Sleep ${SETTINGS_VISIBLE}
EOF

	echo "[vhs] locale=${locale} -> ${mp4_rel}"
	vhs "$tape" >/dev/null

	echo "[ffmpeg] still -> ${png_abs}"
	ffmpeg -loglevel error -y -sseof "$SSEOF" -i "$mp4_abs" -frames:v 1 "$png_abs"
}

idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	run_one "$locale" "$n"
	idx=$((idx+1))
done

LIST="$STILLS/list.txt"
: > "$LIST"

DUR=1.15
LAST_DUR=2.75
idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	f="$STILLS/${n}-${locale}.png"
	[[ -f "$f" ]] || { echo "missing still: $f" >&2; exit 1; }
	echo "file '$f'" >> "$LIST"
	if [[ "$idx" -eq "${#LOCALES[@]}" ]]; then
		echo "duration ${LAST_DUR}" >> "$LIST"
	else
		echo "duration ${DUR}" >> "$LIST"
	fi
	idx=$((idx+1))
done

last_idx=$((${#LOCALES[@]} - 1))
last_locale="${LOCALES[$last_idx]}"
last_file="$STILLS/$(printf '%02d' ${#LOCALES[@]})-${last_locale}.png"
echo "file '$last_file'" >> "$LIST"

OUT_MP4="$OUT_DIR/pi-settings-stills.mp4"
OUT_GIF="$OUT_DIR/pi-settings-stills.gif"

ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" \
	-vf "scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=${FPS}" \
	-pix_fmt yuv420p "$OUT_MP4"

ffmpeg -loglevel error -y -i "$OUT_MP4" \
	-vf "fps=${FPS},split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
	"$OUT_GIF"

echo "Wrote:"
echo "- $OUT_MP4"
echo "- $OUT_GIF"
