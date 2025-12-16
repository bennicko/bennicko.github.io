/**
 * About Page
 */

function renderAboutPage() {
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
            <a class="btn" href="#/home">Home</a>
          </div>
        </aside>

        <section class="card content-card">
          <h2>Overview</h2>
          <p>The popularity of sports betting has skyrocketed. In Australia, between 2015 and 2022, participation rose 57%. In the US it is now a multi-billion dollar industry woven into broadcasts, ads, and even professional analysis.</p>

          <h2>What this site is</h2>
          <p>This tool helps you compare bookmaker prices for NBA player props. Let me make one thing perfectly clear; in my view, <strong>there is no such thing as good value in sports betting</strong>, but if you are going to bet, you should know who offers the best price.</p>

          <h2>Background</h2>
          <p>The most common misconception about sports-betting, is that sports betting has <strong>absolutely nothing to do with sports knowledge</strong> – it has everything to do with <strong>pricing knowledge</strong>. This is the misconception that the bookmakers prey upon to make profit.</p>

          <h2>Very basic math</h2>
          <p>The expected value of a game is the sum of outcomes multiplied by their probabilities:</p>
          <p class="math-block">$$E(x) = \\sum_i x_i \\cdot P(x_i)$$</p>
          <p>If a $1 coinflip pays $2 on heads:</p>
          <p class="math-block">$$E(x) = (2.00 \\times 0.5) + (0 \\times 0.5) = 1.00$$</p>
          <p>After your $1 stake, the EV is 0. If the payout drops to $1.95:</p>
          <p class="math-block">$$E(x) = (1.95 \\times 0.5) + (0 \\times 0.5) = 0.975$$</p>
          <p>That leaves -$0.025 per play. Over a thousand plays, you lose $25.</p>
          <p>Bettors often trust their "feel" for a player or matchup, but nothing matters other than the price. A high win probability does not guarantee profit if the price is too low.</p>

          <h2>An example scenario</h2>
          <p>Suppose you think Steph Curry scores 20+ tonight. Let's say there's an 80% probability of this happening, and Sportsbet offers $1.15. On a $100 stake:</p>
          <p class="math-block">$$E(x) = (100 \\times 1.15 \\times 0.8) + (0 \\times 0.2) = 92$$</p>
          <p>After stake, you are expected to lose -$8. Over 1000 plays, you are expected to lose ~$8,000.</p>
          <p><strong>You lose money, even though 80% of the time, your bet wins.</strong></p>
          <p>If another bookmaker offered $1.30 for the same prop:</p>
          <p class="math-block">$$E(x) = 100 \\times 1.30 \\times 0.8 = 104$$</p>
          <p>After stake, you are expected to win $4. This is what I call <strong>good value</strong>.</p>

          <h2>The quest for "Good Value"</h2>
          <p>This conclusion leads to a few natural questions:
            <br>
            <br>&nbsp;&nbsp;&nbsp;1) What are the true probabilities of players hitting their props?
            <br>&nbsp;&nbsp;&nbsp;2) What are fair prices for these props?
            <br><br>
            The answer to these questions are extremely complicated, and sportsbooks pay people millions of dollars a year to answer them. My theory, though, is that we don't have to explicitly answer these questions – lets just assume that the bookmakers already have. If 10 bookmakers have a player prop priced at $1.50, and there's one bookmaker pricing the exact same prop at $5, you don't have to even follow the sport to understand that, objectively, the $5 prop must be mispriced, and if you place that bet 1000 times, you will make money. This tool, then, analyses pricing across bookmakers and attempts to find prices that are out of place.
          </p>
        </section>
      </div>
    </main>
  `;
}

function initAboutPage() {
  // Render KaTeX math
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false }
      ]
    });
  }
}

