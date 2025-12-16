/**
 * Bet Detail Page
 */

let betDetailDataTable = null;
let betDetailChart = null;

async function renderBetDetailPage(betKey, topBetsData) {
  // Find summary row
  const summary = topBetsData.find(row => String(row.Bet) === betKey);
  
  // Load bookmakers for this bet
  const bookmakers = await loadBookmakersForBet(betKey);
  
  if (!summary && bookmakers.length === 0) {
    return `
      <main class="page">
        <header class="page__header">
          <div>
            <h1>Bet not found</h1>
            <p>The requested bet could not be found.</p>
          </div>
          <nav class="nav-actions">
            <a class="btn" href="#/home">Home</a>
            <a class="btn" href="#/top-bets">Top Bets</a>
          </nav>
        </header>
      </main>
    `;
  }
  
  const betDisplay = formatBetDisplay(betKey);
  
  // Calculate mean and std from summary
  let meanPrice = null;
  let stdPrice = null;
  if (summary && summary.mean_price !== undefined) {
    meanPrice = summary.mean_price;
  }
  if (summary && summary.threshold !== undefined && meanPrice !== null) {
    stdPrice = summary.threshold - meanPrice;
  }
  
  // Build summary display
  const summaryFields = [
    ["Price", "max_price"],
    ["Bookmaker", "bookmaker"],
    ["Average Price", "mean_price"],
    ["Threshold", "threshold"],
    ["Sample size", "sample_size"],
    ["Above threshold", "above_threshold"],
    ["Consensus prob", "consensus_prob"],
    ["Implied prob", "implied_prob"],
    ["Prob diff", "prob_diff"],
  ];
  
  let summaryHtml = '';
  if (summary) {
    const summaryItems = summaryFields
      .filter(([_, key]) => summary[key] !== undefined && summary[key] !== null)
      .map(([label, key]) => {
        let val = summary[key];
        if (typeof val === 'number') {
          val = Math.round(val * 100) / 100;
        }
        return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(val))}</dd></div>`;
      })
      .join('');
    
    summaryHtml = `
      <section class="card">
        <h2>Summary</h2>
        <dl class="summary-grid">
          ${summaryItems}
        </dl>
      </section>
    `;
  }
  
  // Build bookmakers table
  let bookmakersTableHtml = '<p>No bookmaker records found for this bet.</p>';
  if (bookmakers.length > 0) {
    bookmakersTableHtml = `
      <table id="bookmakers-table" class="display nowrap">
        <thead>
          <tr>
            <th>bookmaker</th>
            <th>price</th>
          </tr>
        </thead>
        <tbody>
          ${bookmakers.map(row => `
            <tr>
              <td>${escapeHtml(row.bookmaker || '')}</td>
              <td>${row.price !== null && row.price !== undefined ? row.price : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  // Store data for chart initialization
  window._betDetailChartData = {
    bookmakers,
    meanPrice,
    stdPrice
  };
  
  return `
    <main class="page">
      <header class="page__header">
        <div>
          <h1>Bet detail</h1>
          <p>${escapeHtml(betDisplay)}</p>
        </div>
        <nav class="nav-actions">
          <a class="btn" href="#/home">Home</a>
          <a class="btn" href="#/about">About</a>
          <a class="btn" href="#/analyse">Analyse Games</a>
          <a class="btn" href="#/top-bets">Top Bets</a>
        </nav>
        <a class="link-back" href="#/top-bets">← Back to list</a>
      </header>

      ${summaryHtml}

      <section class="detail-grid">
        <div class="table-container">
          <h2>Bookmaker prices</h2>
          ${bookmakersTableHtml}
        </div>

        <div class="card chart-card">
          <h2>Price distribution</h2>
          ${bookmakers.length > 0 ? '<canvas id="price-chart" aria-label="Price distribution chart"></canvas>' : '<p>No data to chart.</p>'}
        </div>
      </section>
    </main>
  `;
}

function initBetDetailPage() {
  // Initialize DataTable
  const tableEl = document.getElementById('bookmakers-table');
  if (tableEl && $.fn.DataTable) {
    if (betDetailDataTable) {
      betDetailDataTable.destroy();
    }
    betDetailDataTable = $('#bookmakers-table').DataTable({
      paging: false,
      scrollX: true,
      order: [[1, "desc"]] // Sort by price descending
    });
  }
  
  // Initialize Chart
  const chartData = window._betDetailChartData;
  if (!chartData || !chartData.bookmakers || chartData.bookmakers.length === 0) return;
  
  const canvas = document.getElementById('price-chart');
  if (!canvas) return;
  
  const { bookmakers, meanPrice, stdPrice } = chartData;
  
  // Count prices
  const counts = {};
  bookmakers.forEach(r => {
    const val = parseFloat(r.price);
    if (!isFinite(val)) return;
    const key = val.toFixed(2);
    counts[key] = (counts[key] || 0) + 1;
  });
  
  // Build values array
  const values = [];
  Object.entries(counts).forEach(([k, c]) => {
    const v = parseFloat(k);
    if (isFinite(v)) {
      for (let i = 0; i < c; i++) values.push(v);
    }
  });
  values.sort((a, b) => a - b);
  if (values.length === 0) return;
  
  const lowerFence = (isFinite(meanPrice) && isFinite(stdPrice)) ? +(meanPrice - stdPrice).toFixed(2) : null;
  const upperFence = (isFinite(meanPrice) && isFinite(stdPrice)) ? +(meanPrice + stdPrice).toFixed(2) : null;
  
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const plotMin = +(minVal - 0.02).toFixed(2);
  const plotMax = +(maxVal + 0.02).toFixed(2);
  
  // Build data points
  const data = [];
  const seen = new Set();
  values.forEach(v => {
    const key = v.toFixed(2);
    if (seen.has(key)) return;
    seen.add(key);
    const count = counts[key] || 0;
    data.push({ x: v, y: 0, count });
  });
  
  // Build annotations
  const annotations = {};
  if (isFinite(meanPrice)) {
    annotations.mean = {
      type: 'line',
      xMin: meanPrice,
      xMax: meanPrice,
      borderColor: '#ef4444',
      borderWidth: 2,
      label: {
        display: true,
        content: `Mean: ${meanPrice}`,
        position: 'start',
        backgroundColor: 'rgba(239,68,68,0.1)',
        color: '#b91c1c',
        padding: 4
      }
    };
  }
  if (isFinite(lowerFence)) {
    annotations.lowerFence = {
      type: 'line',
      xMin: lowerFence,
      xMax: lowerFence,
      borderColor: '#f59e0b',
      borderWidth: 1.5,
      label: {
        display: true,
        content: '-1σ',
        position: 'start',
        backgroundColor: 'rgba(245,158,11,0.1)',
        color: '#92400e',
        padding: 3
      }
    };
  }
  if (isFinite(upperFence)) {
    annotations.upperFence = {
      type: 'line',
      xMin: upperFence,
      xMax: upperFence,
      borderColor: '#f59e0b',
      borderWidth: 1.5,
      label: {
        display: true,
        content: '+1σ',
        position: 'start',
        backgroundColor: 'rgba(245,158,11,0.1)',
        color: '#92400e',
        padding: 3
      }
    };
  }
  
  // Destroy previous chart if exists
  if (betDetailChart) {
    betDetailChart.destroy();
  }
  
  betDetailChart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Bookmakers',
        data,
        pointBackgroundColor: (ctx) => {
          const raw = ctx.raw || {};
          const x = raw.x;
          if (!isFinite(lowerFence) || !isFinite(upperFence)) return '#2563eb';
          if (x < lowerFence || x > upperFence) return '#f59e0b';
          return '#7c3aed';
        },
        pointBorderColor: '#111827',
        pointRadius: (ctx) => {
          const count = ctx.raw && ctx.raw.count ? ctx.raw.count : 1;
          return Math.min(14, 4 + count * 2);
        }
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Price' },
          min: plotMin,
          max: plotMax,
          ticks: {
            callback: (val) => Number(val).toFixed(2)
          }
        },
        y: {
          display: false,
          min: -0.5,
          max: 0.5
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const raw = ctx.raw || {};
              const count = raw.count ?? 0;
              return `${count} bookmaker(s) @ ${raw.x.toFixed(2)}`;
            }
          }
        },
        annotation: { annotations }
      }
    }
  });
}

