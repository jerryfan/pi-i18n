# VHS demo recording (WSL2, no Docker)

This repo records Pi terminal UI demos using **VHS** inside **WSL2**.

Why WSL2:

- VHS drives a headless browser that connects to a local `ttyd` server.
- On Windows this can hang due to loopback/IPv6 quirks.

---

## Required versions

- **VHS**: v0.11.x
- **ttyd**: **>= 1.7.2** (Ubuntu apt often ships 1.6.x, which is too old)

---

## WSL setup (Ubuntu 22.04 example)

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl ffmpeg fonts-noto-cjk fonts-dejavu-core
```

### Install VHS

```bash
cd /tmp
curl -L -o vhs_0.11.0_amd64.deb \
  https://github.com/charmbracelet/vhs/releases/download/v0.11.0/vhs_0.11.0_amd64.deb
sudo dpkg -i vhs_0.11.0_amd64.deb
```

### Install ttyd (pinned binary)

```bash
sudo curl -L -o /usr/local/bin/ttyd \
  https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64
sudo chmod +x /usr/local/bin/ttyd

ttyd --version
```

### Install Pi CLI in WSL

```bash
npm i -g @mariozechner/pi-coding-agent@latest
pi --version
```

### Install this extension (from Windows checkout)

```bash
pi install /mnt/c/code/pi/public/pi-extensions/i18n
```

---

## Deterministic method for localization demos (recommended)

If a tape sometimes “sleeps at the wrong time” (e.g. selector still English / still loading), use a **still-frame montage**:

1. Record a short MP4 where the localized UI is visible
2. Extract a still PNG from the stable portion (often easiest from the end with `-sseof`)
3. Stitch stills into a GIF

This repo ships tools for deterministic (still-based) demos:

- `tools/vhs/make-settings-stills.sh` — `/settings` carousel across locales
- `tools/vhs/make-immersive-stills.sh` — **immersive tour**: `/settings` → demo chat → `/hotkeys` for each locale

See `DEMO.md` for the film spec.
