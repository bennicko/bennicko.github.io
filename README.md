# FairOdds - Static JavaScript Version

A client-side web application for analyzing NBA player prop betting odds across multiple bookmakers.

## Features

- **Analyse Games**: Compare bookmaker prices for player props (points/rebounds/assists)
- **Top Bets**: View value bets where prices are >1 standard deviation above the mean
- **Arbitrage Bets**: Find Over/Under pairs where implied probability totals under 100%
- **Arbitrage Calculator**: Compute optimal stake allocation for arbitrage opportunities
- **Bet Detail**: View individual bet analysis with price distribution charts
- **Point Detail**: Detailed Over/Under price analysis with statistical visualization

## Local Development

1. Start a local HTTP server in the `fairodds-js` directory:

   ```bash
   # Using Python
   python -m http.server 8080
   
   # Or using Node.js
   npx serve
   ```

2. Open http://localhost:8080 in your browser

## Deploying to GitHub Pages

1. Create a new GitHub repository

2. Push this `fairodds-js` folder to the repository:
   ```bash
   cd fairodds-js
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to your repository Settings
   - Navigate to "Pages" in the sidebar
   - Under "Source", select "Deploy from a branch"
   - Select the `main` branch and `/ (root)` folder
   - Click "Save"

4. Your site will be available at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Data Files

The application loads data from two CSV files in the `data/` folder:

- `betting_odds_raw.csv` - Raw betting odds data from multiple bookmakers
- `top_bets.csv` - Pre-computed top value bets

To update the data, replace these CSV files with new data in the same format.

## Tech Stack

- Vanilla JavaScript (ES6+)
- PapaParse for CSV parsing
- jQuery + DataTables for interactive tables
- Chart.js for price distribution visualizations
- KaTeX for math rendering

## Original Python Version

This is a JavaScript port of the original Flask/Python application. The original server-side version is located in the `fairodds/` folder of the parent directory.

