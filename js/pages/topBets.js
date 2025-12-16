/**
 * Top Bets Page
 */

let topBetsDataTable = null;

function renderTopBetsPage(params, topBetsData) {
  const ausOnly = params.aus_only === "1" || (!params.aus_only && getAusOnlyPreference());
  
  // Filter data if AU-only is enabled
  let workingData = ausOnly ? filterBookmakers(topBetsData) : topBetsData;
  
  // Build index rows
  const { columns, rows } = buildIndexRows(workingData);
  
  return `
    <main class="page">
      <header class="page__header">
        <div>
          <h1>Top Bets</h1>
          <p>Data source: data/top_bets.csv</p>
        </div>
        <nav class="nav-actions">
          <a class="btn" href="#/home">Home</a>
          <a class="btn" href="#/about">About</a>
          <a class="btn" href="#/analyse">Analyse Games</a>
          <a class="btn btn-primary" href="#/arbitrage">Arbitrage Bets</a>
        </nav>
      </header>

      <section class="card">
        <form class="filter-form" id="topbets-filter-form">
          <label class="checkbox">
            <input type="checkbox" id="aus_only" name="aus_only" value="1" ${ausOnly ? 'checked' : ''}>
            Only show Australian bookmakers
          </label>
        </form>
      </section>

      <section class="table-container">
        <table id="bets-table" class="display nowrap">
          <thead>
            <tr>
              ${columns.map(col => `<th>${escapeHtml(col)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${columns.map(col => {
                  if (col === "Bet") {
                    return `<td><a class="link-cell" href="${buildHashUrl('/bet/' + encodeURIComponent(row.Bet))}">${escapeHtml(row.BetDisplay)}</a></td>`;
                  } else {
                    const val = row[col];
                    return `<td>${val !== null && val !== undefined ? escapeHtml(String(val)) : ''}</td>`;
                  }
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    </main>
  `;
}

function initTopBetsPage() {
  // Initialize DataTable
  const tableEl = document.getElementById('bets-table');
  if (tableEl && $.fn.DataTable) {
    // Destroy previous instance if exists
    if (topBetsDataTable) {
      topBetsDataTable.destroy();
    }
    topBetsDataTable = $('#bets-table').DataTable({
      paging: true,
      scrollX: true,
      order: [],
      stateSave: true
    });
  }
  
  // Handle AU-only checkbox
  const ausOnlyCheckbox = document.getElementById('aus_only');
  if (ausOnlyCheckbox) {
    ausOnlyCheckbox.addEventListener('change', () => {
      setAusOnlyPreference(ausOnlyCheckbox.checked);
      navigateTo('/top-bets', { aus_only: ausOnlyCheckbox.checked ? '1' : '0' });
    });
  }
}

