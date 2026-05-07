# CLAUDE.md

This file gives coding agents the current repository context.

## Development

This is a pure static site served by GitHub Pages. There is no build system, package manager, linter, or test runner.

Use an HTTP server for local preview because `fetch()` calls do not work from `file://`:

```bash
python -m http.server 8080
```

## Architecture

Entry point: `index.html`

- Defines the sidebar, content section mount points, dot navigation, theme toggle, and script/style includes.
- Loads `css/style.css`, which imports `css/research.css`.
- Loads `js/main.js`.

Runtime: `js/main.js`

- On `DOMContentLoaded`, fetches JSON data in parallel.
- Renders home, education, research, projects, teaching, and Beyond the Lab sections.
- Manages the theme toggle, keyword overlay, education accordion, dot navigation, scroll reveal, scroll-linked background, and Lenis/fallback smooth scrolling.

Editable data:

| File | Purpose |
| --- | --- |
| `data/home.json` | Sidebar profile image, name, keywords, headline, and summary |
| `data/education.json` | Education cards and extracurricular accordion |
| `data/projects.json` | Project cards |
| `data/teaching.json` | Teaching cards |
| `data/research.json` | Publications, conferences, featured research, and experience |
| `data/beyond.json` | Beyond the Lab intro and gallery media filenames |

Assets:

- Runtime images and videos live in `images/`.
- Gallery files must be listed in `data/beyond.json`.
- Project/profile images are referenced directly from their JSON files.

## Conventions

- Keep content changes in `data/*.json` when possible.
- Keep visual/layout changes in `css/style.css` or `css/research.css`.
- Keep render or interaction changes in `js/main.js`.
- Publications and conferences are sorted by `year` and optional `month`.
- Education and experience `period` fields may use `timeline | chip label`.
- The primary author highlighting pattern is in `PRIMARY_NAME_PATTERN`.
