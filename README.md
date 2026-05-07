# Hisu Kim Portfolio

Static, data-driven academic portfolio deployed with GitHub Pages.

## Structure

```text
.
|-- index.html
|-- css/
|   |-- style.css
|   `-- research.css
|-- js/
|   `-- main.js
|-- data/
|   |-- home.json
|   |-- education.json
|   |-- projects.json
|   |-- teaching.json
|   |-- research.json
|   `-- beyond.json
`-- images/
```

## Local Preview

Serve the repository over HTTP because the site fetches JSON files at runtime:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Editing Content

- Profile sidebar: `data/home.json`
- Education and extracurricular items: `data/education.json`
- Projects: `data/projects.json`
- Teaching: `data/teaching.json`
- Publications, conferences, and experience: `data/research.json`
- Beyond the Lab gallery: `data/beyond.json` plus matching files in `images/`

The HTML shell defines mount points only. `js/main.js` fetches the JSON files and renders each section.
