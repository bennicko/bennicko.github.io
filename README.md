# Top Bets Flask Viewer

## Setup
1) Create a virtual environment (optional but recommended).
2) Install dependencies from the repo root (includes Frozen-Flask for static builds):
```
pip install -r requirements.txt
```

## Run
```
set FLASK_APP=app.py  # on Windows
flask run
```
Then open http://127.0.0.1:5000/

The app reads `data/top_bets.csv` at startup and renders it as an interactive table.

## Build a static site for GitHub Pages
From the repo root:
```
python fairodds/build_static.py
```
This writes the frozen HTML into `fairodds/docs/` with relative URLs that GitHub Pages can serve from the main branch. Commit the generated `fairodds/docs/` folder and point GitHub Pages to the `/docs` source in the repository settings.

### Refresh the data
Run the engine script to regenerate `data/top_bets.csv` (adds a `Bet` column, rounds mean/threshold):
```
python fairodds_toppicks_engine.py
```
If the CSV is open in another program, close it first so the script can overwrite it. The Flask app can also recompute from `data/betting_odds_raw.csv` if `top_bets.csv` is unavailable.

### Bet detail view
From the main table, click any Bet to see a detail page with the aggregated stats plus every bookmaker/price for that Bet pulled from `data/betting_odds_raw.csv`.

