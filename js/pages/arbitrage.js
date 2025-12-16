/**
 * Arbitrage Bets Page
 */

let arbitrageDataTable = null;

function renderArbitragePage(params, rawData) {
  const ausOnly = params.aus_only === "1" || (!params.aus_only && getAusOnlyPreference());
  
  // Filter data if AU-only is enabled
  let workingData = ausOnly ? filterBookmakers(rawData) : rawData;
  
  // Find arbitrage opportunities
  const arbitrageRows = findArbitrageBets(workingData);
  const hasResults = arbitrageRows.length > 0;
  
  let tableHtml = '<p>No arbitrage bets found. Adjust filters to broaden the search.</p>';
  
  if (hasResults) {
    tableHtml = `
      <table id="arbitrage-table" class="display nowrap">
        <thead>
          <tr>
            <th>Game</th>
            <th>Player</th>
            <th>Market</th>
            <th>Point</th>
            <th>Over</th>
            <th>Under</th>
            <th>Implied total %</th>
            <th>Edge %</th>
          </tr>
        </thead>
        <tbody>
          ${arbitrageRows.map(row => `
            <tr>
              <td>${escapeHtml(row.game || '')}</td>
              <td>
                <a class="link-cell" href="${buildHashUrl('/arbitrage/calc', {
                  game: row.game,
                  player: row.player,
                  market: row.market,
                  point: row.point,
                  over_bookmaker: row.over_bookmaker,
                  over_price: row.over_price,
                  under_bookmaker: row.under_bookmaker,
                  under_price: row.under_price
                })}">
                  ${escapeHtml(row.player || '')}
                </a>
              </td>
              <td>${escapeHtml(row.market_display || '')}</td>
              <td>${escapeHtml(row.point_display || '')}</td>
              <td>${escapeHtml(row.over_bookmaker || '')} @ ${row.over_price}</td>
              <td>${escapeHtml(row.under_bookmaker || '')} @ ${row.under_price}</td>
              <td>${row.implied_total_pct}</td>
              <td>${row.edge_pct}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  return `
    <main class="page">
      <header class="page__header">
        <div>
          <p class="eyebrow">FairOdds</p>
          <h1>Arbitrage bets</h1>
          <p>Find Over/Under pairs where implied probability totals under 100%.</p>
        </div>
        <nav class="nav-actions">
          <a class="btn" href="#/home">Home</a>
          <a class="btn" href="#/analyse">Analyse Games</a>
          <a class="btn" href="#/top-bets">Top Bets</a>
          <a class="btn btn-primary" href="#/arbitrage">Arbitrage Bets</a>
        </nav>
      </header>

      <section class="card">
        <form class="filter-form filter-form--compact" id="arbitrage-filter-form">
          <div class="form-field">
            <label class="checkbox">
              <input type="checkbox" id="aus_only" name="aus_only" value="1" ${ausOnly ? 'checked' : ''}>
              Only show Australian bookmakers
            </label>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Refresh</button>
          </div>
        </form>
      </section>

      <section class="table-container">
        <h2>Arbitrage opportunities</h2>
        ${tableHtml}
      </section>
    </main>
  `;
}

function initArbitragePage() {
  // Initialize DataTable
  const tableEl = document.getElementById('arbitrage-table');
  if (tableEl && $.fn.DataTable) {
    if (arbitrageDataTable) {
      arbitrageDataTable.destroy();
    }
    arbitrageDataTable = $('#arbitrage-table').DataTable({
      paging: true,
      scrollX: true,
      order: [[7, 'desc']], // Sort by Edge % descending
      stateSave: true
    });
  }
  
  // Handle AU-only checkbox
  const ausOnlyCheckbox = document.getElementById('aus_only');
  const form = document.getElementById('arbitrage-filter-form');
  
  if (ausOnlyCheckbox) {
    ausOnlyCheckbox.addEventListener('change', () => {
      setAusOnlyPreference(ausOnlyCheckbox.checked);
      navigateTo('/arbitrage', { aus_only: ausOnlyCheckbox.checked ? '1' : '0' });
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      navigateTo('/arbitrage', { aus_only: ausOnlyCheckbox && ausOnlyCheckbox.checked ? '1' : '0' });
    });
  }
}

