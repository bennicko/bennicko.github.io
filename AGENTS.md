# AGENTS.md

## Cursor Cloud specific instructions

FairOdds is a **purely static, client-side single-page app** (vanilla JS) for analyzing NBA player prop betting odds. There is no backend, database, build step, package manager, or test/lint tooling in this repo. Third-party libraries (jQuery, DataTables, Chart.js, KaTeX, PapaParse) are loaded from CDNs at runtime, so an internet connection is required for the UI to render.

### Running the app (the only "service")

Serve the repo root over HTTP (see `README.md`). It must be served over HTTP, not opened via `file://`, because the app fetches the CSV data files with PapaParse `download:true`:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`. Note the system has `python3` (not `python`) and Node 22 (`npx serve` also works). Routing is hash-based (`#/home`, `#/top-bets`, `#/arbitrage`, `#/arbitrage/calc`, etc.).

### Data

All content comes from static CSVs in `data/` (`betting_odds_raw.csv`, `top_bets.csv`) loaded by `js/data.js`. To change the data, replace those files.

### Build / lint / test

None are configured — there is no build step and no test or lint command. "Verifying" a change means serving the site and exercising the relevant hash route in a browser.

### Known pre-existing caveat

`js/pages/analyse.js` is an empty file, but `js/app.js` routes `#/analyse` to `renderAnalysePage()`/`initAnalysePage()` (defined nowhere else). As a result the **"Analyse Games" route currently errors** and shows the generic error card. This is unrelated to environment setup. The Top Bets, Bet Detail (with charts), Arbitrage Bets, and Arbitrage Calculator routes all work.
