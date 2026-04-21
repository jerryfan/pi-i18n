#!/usr/bin/env bash
set -euo pipefail

# Generates an "immersive" i18n demo montage (deterministic):
# for each locale, capture 3 stills:
#   1) /settings
#   2) /lang demo chat (simulated localized chat)
#   3) /hotkeys
# then stitch them into a fast scrub GIF that stops longer on the final locale (de).

usage() {
	cat <<'EOF'
Usage:
  make-immersive-stills.sh <out_dir>

Example (WSL):
  OUT=/mnt/c/trash/pi/$(date +%F)-pi-i18n-immersive-r1
  bash tools/vhs/make-immersive-stills.sh "$OUT"

Writes:
  <out_dir>/pi-immersive.gif
  <out_dir>/pi-immersive.mp4
  <out_dir>/stills/*.png

Notes:
  - Run inside WSL2 (no Docker)
  - Requires: vhs, ffmpeg, pi
  - Requires: pi-i18n installed in WSL (so /settings and /hotkeys are localized)
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

CONFIG_PATH="$HOME/.pi/agent/state/pi-i18n/config.json"
mkdir -p "$(dirname "$CONFIG_PATH")"

WIDTH=1200
HEIGHT=600
FPS=15
TYPING=20ms

PI_STARTUP_SLEEP=6s
SETTINGS_SETTLE=1500ms
CHAT_SETTLE=900ms
HOTKEYS_SETTLE=900ms

VISIBLE_SHORT=900ms
VISIBLE_CHAT=1350ms
VISIBLE_HOTKEYS=1000ms

# Extract final frame while the target UI is still visible.
SSEOF=-0.15

capture_surface() {
	local locale="$1"
	local idx="$2"
	local surface="$3"  # settings|chat|hotkeys

	printf '{\n  "locale": "%s",\n  "fallbackLocale": "en"\n}\n' "$locale" > "$CONFIG_PATH"

	local tape="$TAPES/${surface}-${idx}-${locale}.tape"
	local mp4_rel="captures/${surface}-${idx}-${locale}.mp4"
	local mp4_abs="$OUT_DIR/$mp4_rel"
	local png_abs="$STILLS/${idx}-${locale}-${surface}.png"

	local command=""
	local settle="$VISIBLE_SHORT"
	local visible="$VISIBLE_SHORT"

	case "$surface" in
		settings)
			command="/settings"
			settle="$SETTINGS_SETTLE"
			visible="$VISIBLE_SHORT"
			;;
		chat)
			command="/lang demo chat"
			settle="$CHAT_SETTLE"
			visible="$VISIBLE_CHAT"
			;;
		hotkeys)
			command="/hotkeys"
			settle="$HOTKEYS_SETTLE"
			visible="$VISIBLE_HOTKEYS"
			;;
		*)
			echo "unknown surface: $surface" >&2
			exit 2
			;;
	esac

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

Type "${command}"
Enter
Sleep ${settle}
Sleep ${visible}
EOF

	echo "[vhs] ${locale} ${surface} -> ${mp4_rel}"
	vhs "$tape" >/dev/null

	echo "[ffmpeg] still -> ${png_abs}"
	ffmpeg -loglevel error -y -sseof "$SSEOF" -i "$mp4_abs" -frames:v 1 "$png_abs"
}

idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	capture_surface "$locale" "$n" settings
	capture_surface "$locale" "$n" chat
	capture_surface "$locale" "$n" hotkeys
	idx=$((idx+1))
done

# Stitch
LIST="$STILLS/list.txt"
: > "$LIST"

# Sequence (per user demo spec):
#  1) /settings across all locales
#  2) demo chat across all locales
#  3) /hotkeys across all locales

# Fast scrub: show the change effect, not reading.
D_SETTINGS=0.30
D_CHAT=0.55
D_HOTKEYS=0.30

# Stop longer on German (end-of-phase holds) for immersion/credibility.
D_DE_SETTINGS=0.60
D_DE_CHAT=1.60
D_DE_HOTKEYS=2.20

require_stills_for() {
	local locale="$1"
	local idx="$2"
	local surface="$3"
	local f="$STILLS/${idx}-${locale}-${surface}.png"
	[[ -f "$f" ]] || { echo "missing still: $f" >&2; exit 1; }
}

append_frame() {
	local locale="$1"
	local idx="$2"
	local surface="$3"
	local dur="$4"
	local f="$STILLS/${idx}-${locale}-${surface}.png"
	echo "file '$f'" >> "$LIST"
	echo "duration $dur" >> "$LIST"
}

# Preflight still existence
idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	require_stills_for "$locale" "$n" settings
	require_stills_for "$locale" "$n" chat
	require_stills_for "$locale" "$n" hotkeys
	idx=$((idx+1))
done

# 1) settings across locales
idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	append_frame "$locale" "$n" settings "$([[ "$locale" == "de" ]] && echo "$D_DE_SETTINGS" || echo "$D_SETTINGS")"
	idx=$((idx+1))
done

# 2) chat across locales
idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	append_frame "$locale" "$n" chat "$([[ "$locale" == "de" ]] && echo "$D_DE_CHAT" || echo "$D_CHAT")"
	idx=$((idx+1))
done

# 3) hotkeys across locales
idx=1
for locale in "${LOCALES[@]}"; do
	printf -v n "%02d" "$idx"
	append_frame "$locale" "$n" hotkeys "$([[ "$locale" == "de" ]] && echo "$D_DE_HOTKEYS" || echo "$D_HOTKEYS")"
	idx=$((idx+1))
done

# Repeat last file once (concat demuxer requirement)
echo "file '$STILLS/09-de-hotkeys.png'" >> "$LIST"

OUT_MP4="$OUT_DIR/pi-immersive.mp4"
OUT_GIF="$OUT_DIR/pi-immersive.gif"

ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" \
	-vf "scale=${WIDTH}:${HEIGHT}:flags=lanczos,fps=${FPS}" \
	-pix_fmt yuv420p "$OUT_MP4"

ffmpeg -loglevel error -y -i "$OUT_MP4" \
	-vf "fps=${FPS},split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
	"$OUT_GIF"

echo "Wrote:"
echo "- $OUT_MP4"
echo "- $OUT_GIF"
