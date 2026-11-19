# Neon Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/funfunin/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/funfunin/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A free offline web app that turns a photo and a caption into GTA 6 poster-style
cover art: a multi-panel poster look, bold caption lettering, and a Vice City
sunset / neon colour grade, exported as a PNG to share.

## What it does

- **Any photo, kept on your machine.** Add your own photos (read locally, never
  uploaded) or use the three included sample photos.
- **6 layouts:** Hero + two panels, Hero + three panels, four-panel grid,
  nine-panel grid, full-bleed single photo, and tilted snapshots.
- **Per-panel crop and position:** click a panel to select it, drag to move the
  photo inside it, scroll or use the slider to zoom, pick a different photo for
  that panel. One button fills every panel with a single photo.
- **Bold lettering:** a halftone title block in Anton, a neon-script subtitle in
  Pacifico, and a starburst badge ribbon.
- **5 colour grades:** Vice Sunset, Neon Night, Golden Hour, Teal Noir, Hot Pink,
  plus film grain and a vignette overlay.
- **Export PNG in one click** at the common post sizes: square 1080×1080,
  portrait 1080×1350, wide 1920×1080.
- **Undo/redo** with a 60-step history.
- Dark neon editor chrome with a live preview canvas.

## How to try it

Serve `app/` with any static HTTP server and open `index.html`:

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

No build step, no network at runtime: every script, module, image and font the
app loads is a file under `app/`.

## Files

- `app/index.html` — the editor page (controls + live preview canvas).
- `app/style.css` — dark neon editor chrome.
- `app/src/cover.js` — the cover engine: layouts, grades, panel photos,
  halftone title block, badge ribbon, grain, vignette.
- `app/src/main.js` — wiring: photos, per-panel crop, undo/redo, export.
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `app/fonts/` — Anton and Pacifico (SIL Open Font License), with `OFL.txt`.
- `app/samples/` — three AI-made sample photos.
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to `/output`
  and writes `/output/dossier.json`.
- `screenshots/` — screenshots taken by the maker (see below).

## Screenshots

1. `1-cover.jpg` — a cover the app exported (wide 1920×1080), scaled to fit.
2. `2-editor.jpg` — the editor in a browser with a photo loaded
   (hero + three panels).
3. `3-cover-portrait.jpg` — a cover the app exported (portrait 1080×1350),
   scaled to fit.
4. `4-editor-panels.jpg` — the editor with the nine-panel grid and the
   Neon Night grade.

## Originality

No Rockstar Games logo, wordmark, official artwork, character or font is used
anywhere. The Anton and Pacifico fonts are licensed under the SIL Open Font
License (see `app/fonts/OFL.txt`). The sample photos were made with an image
model and show no real people.

## Licence

MIT — see `LICENSE`.
