# bennicko.github.io

Personal landing page at [bennicko.github.io](https://bennicko.github.io/). A short complement to a resume: about, studies, projects, hobbies, and work.

Plain HTML and CSS. No build step. GitHub Pages serves the root of `main`.

## Edit copy

All text lives in `index.html`. Search for `REPLACE` comments:

- page title, name, headline, pitch
- About paragraphs
- Studies and work roles
- Project cards
- Hobbies (books, places, and short notes)

Optional portrait: uncomment the `hero-photo` block and add `assets/portrait.jpg`.

## Add a project link

1. Fill in a card in the Projects section (or duplicate an `<article class="project-card">`).
2. Uncomment the “View project” line and set `href`:
   - a page in this repo: `projects/your-project.html`
   - or any external URL
3. To add a write-up here, put an HTML file in `projects/` (FairOdds example: `projects/fairodds.html`).

Writing is commented out in `index.html` for now. Uncomment the nav link and the Writing section to restore it.

## Local preview

```bash
py -m http.server 8080
```

Open http://localhost:8080
