"""Freeze the Flask app into a static site for GitHub Pages."""
from pathlib import Path

from flask_frozen import Freezer

from app import app, load_top_bets

BASE_DIR = Path(__file__).resolve().parent
DEST_DIR = BASE_DIR / "docs"

# Configure freezer for GitHub Pages (docs/ + relative URLs).
app.config.update(
    FREEZER_DESTINATION=str(DEST_DIR),
    FREEZER_RELATIVE_URLS=True,
    FREEZER_DEFAULT_MIMETYPE="text/html",
    FREEZER_DEFAULT_EXTENSION=".html",
    FREEZER_IGNORE_404_NOT_FOUND=True,
)

freezer = Freezer(app)


@freezer.register_generator
def home():
    yield {}


@freezer.register_generator
def about():
    yield {}


@freezer.register_generator
def analyse():
    yield {}


@freezer.register_generator
def arbitrage():
    yield {}


@freezer.register_generator
def arbitrage_calc():
    yield {}


@freezer.register_generator
def top_bets():
    yield {}


@freezer.register_generator
def bet_detail():
    df, _, rows = load_top_bets()
    for row in rows:
        bet_key = row.get("Bet")
        if bet_key:
            yield {"bet_key": bet_key}


def main():
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    freezer.freeze()


if __name__ == "__main__":
    main()

