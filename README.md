# bennicko.github.io

Personal landing page at [bennicko.github.io](https://bennicko.github.io/). Static HTML and CSS, served from the root of `main` by GitHub Pages. No build step.

## Edit copy

All visible text lives in `index.html`. Search for `REPLACE:` comments to find:

- name, headline, and one-line pitch in the hero
- about paragraphs
- experience roles
- project cards
- writing entries
- the optional portrait (`assets/portrait.jpg`)

Change the `<title>` and meta description in the `<head>` at the same time as the name.

## Add a project link

1. Fill in a card in the Projects section (or copy an existing `<article class="card">`).
2. Point it somewhere:
   - **External URL:** change the card to `<a class="card card-link" href="https://…">…</a>`
   - **Page on this site:** add `projects/your-project.html` and use `href="projects/your-project.html"`
3. Close with `</a>` instead of `</article>`.

The same pattern works in Writing: wrap the inner markup of a `.writing-item` in `<a href="writing/slug.html">`.

`assets/` is for a portrait or project images later.

## Local preview

```bash
python -m http.server 8080
```

Open http://localhost:8080
