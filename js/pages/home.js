/**
 * Home Page
 */

function renderHomePage() {
  return `
    <main class="page">
      <div class="layout">
        <aside class="card brand-card">
          <p class="eyebrow">FAIRODDS</p>
          <h1 class="brand-title">An analysis of Bookmaker Pricing for NBA Player Props</h1>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#/analyse">Analyse Games</a>
            <a class="btn" href="#/top-bets">Top Bets</a>
            <a class="btn" href="#/arbitrage">Arbitrage Bets</a>
            <a class="btn" href="#/about">About</a>
          </div>
        </aside>

        <section class="card content-card">
          <h2>Welcome</h2>
          <p>Jump straight into comparing bookmaker prices or browse the analysis.</p>
          <div class="hero-actions" style="margin-top: 8px;">
            <a class="btn btn-primary" href="#/analyse">Analyse Games</a>
            <a class="btn" href="#/top-bets">Top Bets</a>
            <a class="btn" href="#/arbitrage">Arbitrage Bets</a>
            <a class="btn" href="#/about">About</a>
          </div>
        </section>
      </div>
    </main>
  `;
}

function initHomePage() {
  // No special initialization needed for home page
}

