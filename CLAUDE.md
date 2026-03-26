# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

No build system. This is a pure static site (HTML/CSS/JS) served via GitHub Pages.

To preview locally, serve over HTTP (required because `fetch()` calls won't work with `file://`):
```bash
python3 -m http.server 8080
# or
npx serve .
```

No tests, no linter, no package manager.

## Architecture

Single-page academic portfolio with one HTML shell and data-driven content rendering.

**Entry point:** `index.html` — static shell with empty `<div>` placeholders for each section.

**`js/main.js`** — all JavaScript logic:
- On `DOMContentLoaded`, fetches all JSON files in parallel and calls section generators.
- Each `generate*(data)` function builds and injects HTML into its placeholder `<div>`.
- Theme (dark/light) is stored in `localStorage` as `'theme-preference'` and applied via `data-theme` attribute on `<html>`.
- Spotlight and scroll-background effects update CSS custom properties (`--cursor-x`, `--cursor-y`, `--bg-shift`).
- The "Fun Fact" page (`#fun-fact` section) is hidden by default; revealed by clicking "CrossFitter & Dancer" in the footer. `showFunFactPage()` / `showMainPage()` handle the transition.

**`data/*.json`** — all editable content:
| File | Controls |
|---|---|
| `home.json` | Profile photo path, name, keywords, intro paragraph |
| `education.json` | Degree cards (`main[]`) and collapsible extracurriculars |
| `research.json` | Publications, conferences (APA-formatted), and experience cards |
| `teaching.json` | Teaching role cards |
| `projects.json` | Project cards with image, title, description |
| `media.json` | Filenames for Fun Fact gallery (`crossfit[]`, `dance[]`); actual files live in `images/` |

**`css/style.css`** — all styles. Theme variants use `[data-theme="light"]` / `[data-theme="dark"]` selectors on `:root`.

**`css/research.css`** — supplementary research section styles.

## Key Conventions

- To add or update content, edit the relevant `data/*.json` file. The JS renderers pick up changes automatically.
- To add Fun Fact gallery media: add the filename to `data/media.json` under `crossfit` or `dance`, then place the file in `images/`.
- Publications and conferences are auto-sorted by recency (`year` then `month` field).
- Author highlighting uses `highlight_author_indices` (array of 0-based indices into `authors[]`). The primary name pattern `/(Kim,\s*H\.|H\.?\s*Kim)/gi` is also applied as a fallback.
- The `period` field in education/experience cards supports a pipe separator: `"2020–2024 | B.S."` — the part before `|` becomes the date and the part after becomes a chip label.
- `pages/` and `snippets/` directories are intentionally empty (legacy structure cleaned up).
- `autotester.py` is an unrelated GPU monitoring script (SSH-based); ignore it when working on the site.
