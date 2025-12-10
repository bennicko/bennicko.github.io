from pathlib import Path

import pandas as pd
from flask import Flask, abort, make_response, render_template, request

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "data" / "top_bets.csv"
RAW_DATA_PATH = Path(__file__).parent / "data" / "betting_odds_raw.csv"
AU_BOOKMAKERS = [
    "Betr",
    "Ladbrokes",
    "Pointsbet (AU)",
    "Sportsbet",
    "TAB",
    "Unibet",
    "TABTouch",
]
MARKET_CATEGORIES = {
    "points": ["player_points", "player_points_alternate"],
    "rebounds": ["player_rebounds", "player_rebounds_alternate"],
    "assists": ["player_assists", "player_assists_alternate"],
}


def _compute_top_bets_from_raw():
    """Compute top bets directly from raw odds as a fallback."""
    raw_df = pd.read_csv(RAW_DATA_PATH)
    raw_df["Bet"] = (
        raw_df["description"]
        + "_"
        + raw_df["label"]
        + "_"
        + raw_df["market"]
        + "_"
        + raw_df["point"].astype(str)
    )

    def analyze_group(group):
        if len(group) < 10:
            return None
        prices = group["price"]
        mean_val = prices.mean()
        std_val = prices.std(ddof=1)
        sample_size = len(prices)
        idxmax = prices.idxmax()
        max_price = prices.loc[idxmax]
        bookmaker = group.loc[idxmax, "bookmaker"]
        threshold = mean_val + std_val
        if max_price <= threshold:
            return None
        consensus_prob = 100 / mean_val
        implied_prob = 100 / max_price
        above_threshold = max_price - threshold
        prob_diff = implied_prob - consensus_prob
        return {
            "max_price": max_price,
            "bookmaker": bookmaker,
            "mean_price": mean_val,
            "threshold": threshold,
            "sample_size": sample_size,
            "above_threshold": above_threshold,
            "consensus_prob": consensus_prob,
            "implied_prob": implied_prob,
            "prob_diff": prob_diff,
        }

    result = raw_df.groupby("Bet", group_keys=False).apply(analyze_group).dropna()
    result_df = pd.DataFrame(result.tolist(), index=result.index)
    result_df = result_df.sort_values(
        by=["prob_diff", "consensus_prob"], ascending=[True, False]
    )
    top_bets = result_df.head(50).copy()
    top_bets["mean_price"] = top_bets["mean_price"].round(2)
    top_bets["threshold"] = top_bets["threshold"].round(2)
    top_bets = top_bets.reset_index().rename(columns={"index": "Bet"})
    return top_bets


def load_top_bets():
    """
    Load top_bets.csv into columns and row dicts.
    Falls back to recomputing from raw data if the CSV is unavailable.
    """
    try:
        df = pd.read_csv(DATA_PATH)
    except Exception:
        df = _compute_top_bets_from_raw()
    else:
        if "Bet" not in df.columns and "key" in df.columns:
            df = df.rename(columns={"key": "Bet"})
        if "mean_price" in df.columns:
            df["mean_price"] = df["mean_price"].round(2)
        if "threshold" in df.columns:
            df["threshold"] = df["threshold"].round(2)
        if "prob_diff" in df.columns:
            df["prob_diff"] = df["prob_diff"].round(2)

    columns = list(df.columns)
    rows = df.to_dict(orient="records")
    return df, columns, rows


def load_raw_data():
    """Load raw odds data with a computed game label."""
    raw_df = pd.read_csv(RAW_DATA_PATH)
    raw_df["game"] = raw_df["home_team"] + " vs " + raw_df["away_team"]
    return raw_df


def filter_bookmakers(df):
    """Filter dataframe to AU bookmakers when present."""
    if "bookmaker" not in df.columns:
        return df
    return df[df["bookmaker"].isin(AU_BOOKMAKERS)].copy()


def parse_aus_only_flag():
    """Determine if AU-only toggle is enabled from query or cookie."""
    arg_val = request.args.get("aus_only")
    cookie_val = request.cookies.get("aus_only")

    def _to_bool(val):
        if val is None:
            return None
        return str(val).lower() in {"1", "true", "yes", "on"}

    arg_bool = _to_bool(arg_val)
    if arg_bool is not None:
        return arg_bool
    cookie_bool = _to_bool(cookie_val)
    return bool(cookie_bool) if cookie_bool is not None else False


def format_point(point_value):
    """Format point value without trailing .0 if possible."""
    try:
        as_float = float(point_value)
    except Exception:
        return str(point_value)
    if as_float.is_integer():
        return str(int(as_float))
    return str(as_float).rstrip("0").rstrip(".")


def format_bet_display(bet_value: str) -> str:
    """Return human-friendly Bet display text."""
    parts = str(bet_value).split("_")
    if len(parts) < 4:
        return str(bet_value)
    player = parts[0]
    label = parts[1]
    market = "_".join(parts[2:-1]) if len(parts) > 3 else parts[2]
    point = parts[-1]

    market_lower = market.lower()
    if "points" in market_lower:
        category = "Points"
    elif "rebounds" in market_lower:
        category = "Rebounds"
    elif "assists" in market_lower:
        category = "Assists"
    else:
        category = market.replace("_", " ").title()

    ou = label.upper()
    point_fmt = format_point(point)
    return f"{player} | {category} | {ou} | {point_fmt}"


def build_index_rows(df):
    """Prepare rows and columns for the main table with display formatting."""
    desired = ["Bet", "Price", "Bookmaker", "Average Price", "% Edge"]
    rows = []
    for _, row in df.iterrows():
        bet_val = row.get("Bet")
        edge_val = row.get("prob_diff")
        if pd.notna(edge_val):
            edge_val = round(edge_val, 2)
        rows.append(
            {
                "Bet": bet_val,
                "BetDisplay": format_bet_display(bet_val),
                "Price": row.get("max_price"),
                "Bookmaker": row.get("bookmaker"),
                "Average Price": row.get("mean_price"),
                "% Edge": edge_val,
            }
        )
    available_columns = [c for c in desired if any(r.get(c) is not None for r in rows)]
    return available_columns, rows


def get_game_options(raw_df):
    games = sorted(raw_df["game"].dropna().unique())
    return games


def get_player_options(raw_df, game=None):
    df = raw_df
    if game:
        df = df[df["game"] == game]
    players = sorted(df["description"].dropna().unique())
    return players


def get_game_player_map(raw_df):
    mapping = (
        raw_df.groupby("game")["description"]
        .apply(lambda s: sorted(s.dropna().unique()))
        .to_dict()
    )
    return mapping


def filter_market_category(raw_df, category_key):
    markets = MARKET_CATEGORIES.get(category_key)
    if not markets:
        return raw_df.iloc[0:0]
    return raw_df[raw_df["market"].isin(markets)].copy()


def compute_price_stats(df):
    """Return stats and counts for a price series."""
    if df.empty or "price" not in df:
        return {
            "count": 0,
            "mean": None,
            "std": None,
            "min": None,
            "max": None,
            "counts": {},
        }
    prices = pd.to_numeric(df["price"], errors="coerce").dropna()
    if prices.empty:
        return {
            "count": 0,
            "mean": None,
            "std": None,
            "min": None,
            "max": None,
            "counts": {},
        }
    counts = prices.round(2).value_counts().to_dict()
    return {
        "count": int(len(prices)),
        "mean": prices.mean(),
        "std": prices.std(ddof=1) if len(prices) > 1 else 0.0,
        "min": prices.min(),
        "max": prices.max(),
        "counts": counts,
    }


def build_over_under_groups(df):
    """Return grouped rows by point with bookmaker over/under, sorted by point asc."""
    if df.empty:
        return []
    working = df.copy()
    working["point_value"] = pd.to_numeric(working["point"], errors="coerce")
    working["point_display"] = working["point"].apply(format_point)
    pivot = (
        working.pivot_table(
            index=["point_value", "point_display", "bookmaker"],
            columns="label",
            values="price",
            aggfunc="first",
        )
        .reset_index()
        .sort_values(["point_value", "bookmaker"])
    )
    groups = []
    for point_value, group_df in pivot.groupby("point_value", sort=True):
        point_label = group_df["point_display"].iloc[0]
        sorted_group = group_df.sort_values(by=["Over", "Under"], ascending=False, na_position="last")
        bookmakers = []
        for _, r in sorted_group.iterrows():
            bookmakers.append(
                {
                    "bookmaker": r["bookmaker"],
                    "over": r.get("Over"),
                    "under": r.get("Under"),
                }
            )
        groups.append({"point_value": point_value, "point": point_label, "rows": bookmakers})
    groups = sorted(groups, key=lambda g: (g["point_value"] if pd.notna(g["point_value"]) else float("inf")))
    return groups


def load_bookmakers_for_bet(bet_key: str):
    """Return bookmaker rows for the given bet."""
    raw_df = pd.read_csv(RAW_DATA_PATH)
    raw_df["Bet"] = (
        raw_df["description"]
        + "_"
        + raw_df["label"]
        + "_"
        + raw_df["market"]
        + "_"
        + raw_df["point"].astype(str)
    )
    filtered = raw_df[raw_df["Bet"] == bet_key]
    columns = [
        "bookmaker",
        "price",
    ]
    columns_present = [c for c in columns if c in filtered.columns]
    filtered = filtered[columns_present]
    return filtered


def format_market_display(market_value: str) -> str:
    """Return human-friendly market text."""
    return str(market_value).replace("_", " ").title()


def find_arbitrage_bets(df):
    """
    Identify arbitrage opportunities across bookmakers for Over/Under markets.

    For each game/player/market/point, pair every Over price with every Under
    price (cross-bookmaker allowed). An arbitrage exists when 1/over + 1/under
    is less than 1 (i.e., implied probability < 100%).
    """
    if df.empty:
        return []

    working = df.copy()
    working["price"] = pd.to_numeric(working.get("price"), errors="coerce")
    working = working[
        (working["price"].notna()) & (working["price"] > 0) & working["label"].notna()
    ]
    if working.empty:
        return []

    working["label_lower"] = working["label"].str.lower()
    working = working[working["label_lower"].isin(["over", "under"])]
    if working.empty:
        return []

    required_cols = ["game", "description", "market", "point", "bookmaker", "price"]
    for col in required_cols:
        if col not in working.columns:
            working[col] = None

    results = []
    group_cols = ["game", "description", "market", "point"]

    for (game, player, market, point), group in working.groupby(group_cols):
        over_rows = group[group["label_lower"] == "over"]
        under_rows = group[group["label_lower"] == "under"]
        if over_rows.empty or under_rows.empty:
            continue
        for _, over_row in over_rows.iterrows():
            over_price = over_row["price"]
            if over_price is None or over_price <= 0:
                continue
            for _, under_row in under_rows.iterrows():
                under_price = under_row["price"]
                if under_price is None or under_price <= 0:
                    continue
                implied_sum = (1.0 / over_price) + (1.0 / under_price)
                if implied_sum < 1.0:
                    edge = 1.0 - implied_sum
                    results.append(
                        {
                            "game": game,
                            "player": player,
                            "market": market,
                            "market_display": format_market_display(market),
                            "point": point,
                            "point_display": format_point(point),
                            "over_bookmaker": over_row["bookmaker"],
                            "over_price": round(over_price, 2),
                            "under_bookmaker": under_row["bookmaker"],
                            "under_price": round(under_price, 2),
                            "implied_total_pct": round(implied_sum * 100, 2),
                            "edge_pct": round(edge * 100, 2),
                        }
                    )

    results = sorted(results, key=lambda r: r["edge_pct"], reverse=True)
    return results


def compute_stakes(odds_over, odds_under, winnings):
    """Compute stakes and returns based on provided formula."""
    if winnings is None or winnings <= 0:
        return None
    if odds_over is None or odds_over <= 0 or odds_under is None or odds_under <= 0:
        return None

    stake_over = winnings / odds_over
    stake_under = winnings / odds_under
    return_over = odds_over * stake_over - (stake_over)
    return_under = odds_under * stake_under - (stake_under)
    total_profit = odds_under * stake_under - (stake_under + stake_over)
    return {
        "stake_over": round(stake_over, 2),
        "stake_under": round(stake_under, 2),
        "return_over": round(return_over, 2),
        "return_under": round(return_under, 2),
        "total_profit": round(total_profit, 2),
    }


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/analyse/")
def analyse():
    aus_only = parse_aus_only_flag()
    raw_df = load_raw_data()
    if aus_only:
        raw_df = filter_bookmakers(raw_df)
    game_options = get_game_options(raw_df)
    selected_game = request.args.get("game") or ""
    player_options = get_player_options(raw_df, selected_game or None)
    selected_player = request.args.get("player") or ""
    selected_category = request.args.get("category") or "points"
    game_player_map = get_game_player_map(raw_df)

    results_groups = []
    if selected_game and selected_player and selected_category:
        filtered = raw_df[raw_df["game"] == selected_game]
        filtered = filtered[filtered["description"] == selected_player]
        filtered = filter_market_category(filtered, selected_category)
        results_groups = build_over_under_groups(filtered)

    response = make_response(
        render_template(
            "analyse.html",
            game_options=game_options,
            player_options=player_options,
            selected_game=selected_game,
            selected_player=selected_player,
            selected_category=selected_category,
            results_groups=results_groups,
            has_results=bool(results_groups),
            game_player_map=game_player_map,
            aus_only=aus_only,
        )
    )
    if request.args.get("aus_only") is not None:
        response.set_cookie("aus_only", "1" if aus_only else "0", max_age=60 * 60 * 24 * 30)
    return response


@app.route("/arbitrage/")
def arbitrage():
    aus_only = parse_aus_only_flag()
    raw_df = load_raw_data()
    if aus_only:
        raw_df = filter_bookmakers(raw_df)

    arbitrage_rows = find_arbitrage_bets(raw_df)

    response = make_response(
        render_template(
            "arbitrage.html",
            arbitrage_rows=arbitrage_rows,
            has_results=bool(arbitrage_rows),
            aus_only=aus_only,
        )
    )
    if request.args.get("aus_only") is not None:
        response.set_cookie("aus_only", "1" if aus_only else "0", max_age=60 * 60 * 24 * 30)
    return response


@app.route("/arbitrage/calc/")
def arbitrage_calc():
    game = request.args.get("game") or ""
    player = request.args.get("player") or ""
    market = request.args.get("market") or ""
    point = request.args.get("point") or ""
    over_bookmaker = request.args.get("over_bookmaker") or ""
    under_bookmaker = request.args.get("under_bookmaker") or ""

    def _to_float(val):
        try:
            return float(val)
        except (TypeError, ValueError):
            return None

    over_price = _to_float(request.args.get("over_price"))
    under_price = _to_float(request.args.get("under_price"))
    winnings_input = _to_float(request.args.get("winnings"))

    calc_result = compute_stakes(over_price, under_price, winnings_input)

    return render_template(
        "arbitrage_calc.html",
        game=game,
        player=player,
        market=market,
        market_display=format_market_display(market),
        point=point,
        point_display=format_point(point),
        over_bookmaker=over_bookmaker,
        under_bookmaker=under_bookmaker,
        over_price=over_price,
        under_price=under_price,
        winnings=winnings_input,
        calc_result=calc_result,
    )


@app.route("/top-bets/")
def top_bets():
    aus_only = parse_aus_only_flag()
    df, _, _ = load_top_bets()
    if aus_only:
        df = filter_bookmakers(df)
    columns, rows = build_index_rows(df)
    response = make_response(
        render_template("index.html", columns=columns, rows=rows, aus_only=aus_only)
    )
    if request.args.get("aus_only") is not None:
        response.set_cookie("aus_only", "1" if aus_only else "0", max_age=60 * 60 * 24 * 30)
    return response


@app.route("/about/")
def about():
    return render_template("about.html")


@app.route("/analyse/point")
def point_detail():
    raw_df = load_raw_data()
    game = request.args.get("game") or ""
    player = request.args.get("player") or ""
    category = request.args.get("category") or "points"
    point_val = request.args.get("point")

    if not (game and player and category and point_val):
        abort(404)

    df = raw_df[raw_df["game"] == game]
    df = df[df["description"] == player]
    df = filter_market_category(df, category)
    df = df[df["point"].astype(str) == str(point_val)]

    if df.empty:
        abort(404)

    over_df = df[df["label"].str.lower() == "over"].copy()
    under_df = df[df["label"].str.lower() == "under"].copy()

    over_df["price"] = pd.to_numeric(over_df["price"], errors="coerce")
    under_df["price"] = pd.to_numeric(under_df["price"], errors="coerce")
    over_df = over_df.sort_values("price", ascending=False, na_position="last")
    under_df = under_df.sort_values("price", ascending=False, na_position="last")

    over_stats = compute_price_stats(over_df)
    under_stats = compute_price_stats(under_df)
    for stats in (over_stats, under_stats):
        if stats["mean"] is not None:
            stats["mean"] = round(stats["mean"], 2)
        if stats["std"] is not None:
            stats["std"] = round(stats["std"], 2)

    return render_template(
        "point_detail.html",
        game=game,
        player=player,
        category=category,
        point=point_val,
        over_prices=over_df[["bookmaker", "price"]].to_dict(orient="records"),
        under_prices=under_df[["bookmaker", "price"]].to_dict(orient="records"),
        over_stats=over_stats,
        under_stats=under_stats,
    )


@app.route("/bet/<path:bet_key>/")
def bet_detail(bet_key):
    df, columns, rows = load_top_bets()
    summary = next((row for row in rows if str(row.get("Bet")) == bet_key), None)
    bookmakers = load_bookmakers_for_bet(bet_key)
    if summary is None and bookmakers.empty:
        abort(404)

    mean_price = None
    std_price = None
    if summary and "mean_price" in summary:
        mean_price = summary["mean_price"]
    if summary and "threshold" in summary and mean_price is not None:
        # threshold = mean + std
        std_price = summary["threshold"] - mean_price

    summary_fields = [
        ("Price", "max_price"),
        ("Bookmaker", "bookmaker"),
        ("Average Price", "mean_price"),
        ("Threshold", "threshold"),
        ("Sample size", "sample_size"),
        ("Above threshold", "above_threshold"),
        ("Consensus prob", "consensus_prob"),
        ("Implied prob", "implied_prob"),
        ("Prob diff", "prob_diff"),
    ]
    summary_display = []
    if summary:
        for label, key in summary_fields:
            if key in summary:
                summary_display.append((label, summary[key]))

    return render_template(
        "bet_detail.html",
        bet=bet_key,
        bet_display=format_bet_display(bet_key),
        summary=summary,
        summary_display=summary_display,
        mean_price=mean_price,
        std_price=std_price,
        columns=columns,
        bookmakers=bookmakers.to_dict(orient="records"),
        bookmaker_columns=list(bookmakers.columns),
    )


if __name__ == "__main__":
    # Enable debug for local development; set FLASK_ENV=production for prod.
    app.run(debug=True)

