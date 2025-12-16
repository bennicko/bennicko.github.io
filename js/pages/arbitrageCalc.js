/**
 * Arbitrage Calculator Page
 */

function renderArbitrageCalcPage(params) {
  const game = params.game || "";
  const player = params.player || "";
  const market = params.market || "";
  const point = params.point || "";
  const overBookmaker = params.over_bookmaker || "";
  const underBookmaker = params.under_bookmaker || "";
  const overPrice = params.over_price ? parseFloat(params.over_price) : null;
  const underPrice = params.under_price ? parseFloat(params.under_price) : null;
  const winningsInput = params.winnings ? parseFloat(params.winnings) : null;
  
  const calcResult = computeStakes(overPrice, underPrice, winningsInput);
  
  let calcResultHtml = '';
  if (calcResult) {
    calcResultHtml = `
      <div class="summary-grid" style="margin-top: 12px;">
        <div>
          <dt>Stake Over</dt>
          <dd>${calcResult.stake_over}</dd>
        </div>
        <div>
          <dt>Stake Under</dt>
          <dd>${calcResult.stake_under}</dd>
        </div>
        <div>
          <dt>Return if Over wins</dt>
          <dd>${calcResult.return_over}</dd>
        </div>
        <div>
          <dt>Return if Under wins</dt>
          <dd>${calcResult.return_under}</dd>
        </div>
        <div>
          <dt>Total profit</dt>
          <dd>${calcResult.total_profit}</dd>
        </div>
      </div>
    `;
  } else if (winningsInput !== null) {
    calcResultHtml = '<p style="color: #b91c1c;">Invalid inputs. Please enter a maximum stake greater than 0 and valid odds.</p>';
  }
  
  return `
    <main class="page">
      <header class="page__header">
        <div>
          <p class="eyebrow">FairOdds</p>
          <h1>Arbitrage calculator</h1>
          <p>Compute stakes for both sides given target winnings.</p>
        </div>
        <nav class="nav-actions">
          <a class="btn" href="#/home">Home</a>
          <a class="btn" href="#/arbitrage">Arbitrage Bets</a>
        </nav>
      </header>

      <section class="card">
        <h2>Bet details</h2>
        <dl class="summary-grid">
          <div>
            <dt>Game</dt>
            <dd>${escapeHtml(game)}</dd>
          </div>
          <div>
            <dt>Player</dt>
            <dd>${escapeHtml(player)}</dd>
          </div>
          <div>
            <dt>Market</dt>
            <dd>${escapeHtml(formatMarketDisplay(market))}</dd>
          </div>
          <div>
            <dt>Point</dt>
            <dd>${escapeHtml(formatPoint(point))}</dd>
          </div>
          <div>
            <dt>Over</dt>
            <dd>${escapeHtml(overBookmaker)} @ ${overPrice !== null ? overPrice : 'N/A'}</dd>
          </div>
          <div>
            <dt>Under</dt>
            <dd>${escapeHtml(underBookmaker)} @ ${underPrice !== null ? underPrice : 'N/A'}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <h2>Calculator</h2>
        <form class="filter-form filter-form--compact" id="calc-form">
          <input type="hidden" name="game" value="${escapeHtml(game)}">
          <input type="hidden" name="player" value="${escapeHtml(player)}">
          <input type="hidden" name="market" value="${escapeHtml(market)}">
          <input type="hidden" name="point" value="${escapeHtml(point)}">
          <input type="hidden" name="over_bookmaker" value="${escapeHtml(overBookmaker)}">
          <input type="hidden" name="under_bookmaker" value="${escapeHtml(underBookmaker)}">
          <input type="hidden" name="over_price" value="${overPrice !== null ? overPrice : ''}">
          <input type="hidden" name="under_price" value="${underPrice !== null ? underPrice : ''}">

          <div class="form-field">
            <label for="winnings">Maximum stake</label>
            <input id="winnings" name="winnings" type="number" step="0.01" min="0" value="${winningsInput !== null ? winningsInput : ''}" placeholder="Enter maximum stake">
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Calculate</button>
          </div>
        </form>
        
        ${calcResultHtml}
      </section>
    </main>
  `;
}

function initArbitrageCalcPage() {
  const form = document.getElementById('calc-form');
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      navigateTo('/arbitrage/calc', {
        game: formData.get('game'),
        player: formData.get('player'),
        market: formData.get('market'),
        point: formData.get('point'),
        over_bookmaker: formData.get('over_bookmaker'),
        under_bookmaker: formData.get('under_bookmaker'),
        over_price: formData.get('over_price'),
        under_price: formData.get('under_price'),
        winnings: formData.get('winnings')
      });
    });
  }
}

