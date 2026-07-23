# Repository Guidelines

## Project Structure & Module Organization

This repository is a static GitHub Pages portfolio. `index.html` is the single HTML shell and loads the stylesheet and JavaScript entry point. Main behavior lives in `js/main.js`, which fetches content from `data/*.json` and renders sections into DOM placeholders. Styles live in `css/style.css`, with research-specific styles imported from `css/research.css`. Media assets are stored in `images/`; filenames used by galleries should also be listed in the relevant JSON files, especially `data/media.json`. `autotester.py` is unrelated to the website and should not be treated as part of the portfolio build.

## Build, Test, and Development Commands

There is no build system, package manager, linter, or test runner. Serve the site over HTTP for local preview because `fetch()` calls to `data/*.json` do not work reliably from `file://`.

```bash
python -m http.server 8080
# or
npx serve .
```

Then open `http://localhost:8080`. To validate edited JSON, run:

```bash
python -m json.tool data/projects.json
```

Replace the filename with the JSON file you changed.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, JavaScript, and JSON. Keep JavaScript functions descriptive and action-oriented, following existing names such as `fetchAppData`, `renderAppContent`, and `setupKeywordTooltips`. CSS class names use lowercase kebab-case, for example `.section-glass-panel` and `.theme-toggle`. Keep editable content in `data/*.json` rather than hard-coding portfolio text in `js/main.js`.

## Testing Guidelines

No automated tests are currently configured. For website changes, manually verify the affected sections in a local HTTP server. Check both light and dark themes, desktop and mobile widths, navigation dots, section rendering, and browser console errors. For data edits, validate JSON syntax before previewing.

## Commit & Pull Request Guidelines

Recent commits are short and direct, with occasional prefixes such as `docs:` and `UI polish:`. Prefer concise messages that state the changed area, for example `docs: add contributor guide` or `UI polish: adjust mobile sidebar spacing`. Pull requests should include a brief summary, changed files or sections, manual validation steps, linked issues when applicable, and screenshots for visible UI changes.

## Security & Configuration Tips

Do not commit secrets, SSH keys, generated logs, or local configuration. Be cautious when editing CDN links in `index.html`; changing Font Awesome, Lenis, or font sources can affect production GitHub Pages rendering.
