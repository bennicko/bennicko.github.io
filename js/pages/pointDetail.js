/**
 * Point Detail Page
 */

let overChart = null;
let underChart = null;

function renderPointDetailPage(params, rawData) {
  const game = params.game || "";
  const player = params.player || "";
  const category = params.category || "points";
  const pointVal = params.point || "";
  
  if (!game || !player || !category || !pointVal) {
    return `
      <main class="page">
        <header class="page__header">
          <div>
            <h1>Point not found</h1>
            <p>Missing required parameters.</p>
          </div>
          <nav class="nav-actions">
            <a class="btn" href="#/home">Home</a>
            <a class="btn" href="#/analyse">Analyse Games</a>
          </nav>
        </header>
      </main>
    `;
  }
  
  // Filter data
  let df = rawData.filter(r => r.game === game);
  df = df.filter(r => r.description === player);
  df = filterMarketCategory(df, category);
  df = df.filter(r => String(r.point) === String(pointVal));
  
  if (df.length === 0) {
    return `
      <main class="page">
        <header class="page__header">
          <div>
            <h1>Point not found</h1>
            <p>No data found for this selection.</p>
          </div>
          <nav class="nav-actions">
            <a class="btn" href="#/home">Home</a>
            <a class="btn" href="#/analyse">Analyse Games</a>
          </nav>
        </header>
      </main>
    `;
  }
  
  // Split into over and under
  const overDf = df.filter(r => String(r.label).toLowerCase() === 'over')
    .map(r => ({ ...r, price: parseFloat(r.price) }))
    .filter(r => !isNaN(r.price))
    .sort((a, b) => b.price - a.price);
  
  const underDf = df.filter(r => String(r.label).toLowerCase() === 'under')
    .map(r => ({ ...r, price: parseFloat(r.price) }))
    .filter(r => !isNaN(r.price))
    .sort((a, b) => b.price - a.price);
  
  // Compute stats
  const overStats = computePriceStats(overDf.map(r => r.price));
  const underStats = computePriceStats(underDf.map(r => r.price));
  
  // Round stats
  if (overStats.mean !== null) overStats.mean = Math.round(overStats.mean * 100) / 100;
  if (overStats.std !== null) overStats.std = Math.round(overStats.std * 100) / 100;
  if (underStats.mean !== null) underStats.mean = Math.round(underStats.mean * 100) / 100;
  if (underStats.std !== null) underStats.std = Math.round(underStats.std * 100) / 100;
  
  // Store for chart initialization
  window._pointDetailChartData = { overStats, underStats };
  
  const categoryDisplay = category.charAt(0).toUpperCase() + category.slice(1);
  
  return `
    <main class="page">
      <header class="page__header">
        <div>
          <p class="eyebrow">FairOdds</p>
          <h1>${escapeHtml(player)} — ${escapeHtml(categoryDisplay)} @ ${escapeHtml(pointVal)}</h1>
          <p>${escapeHtml(game)}</p>
        </div>
        <nav class="nav-actions">
          <a class="btn" href="#/home">Home</a>
          <a class="btn" href="#/about">About</a>
          <a class="btn" href="${buildHashUrl('/analyse', { game, player, category })}">Back to Analyse</a>
        </nav>
      </header>

      <section class="card">
        <h2>Over prices</h2>
        <p>Mean: ${overStats.mean !== null ? overStats.mean : "N/A"}, Std dev: ${overStats.std !== null ? overStats.std : "N/A"}, Count: ${overStats.count}</p>
        <div class="detail-grid">
          <div class="table-container">
            ${overDf.length > 0 ? `
              <table class="display">
                <thead>
                  <tr><th>Bookmaker</th><th>Price</th></tr>
                </thead>
                <tbody>
                  ${overDf.map(row => `
                    <tr><td>${escapeHtml(row.bookmaker || '')}</td><td>${row.price}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No Over prices found.</p>'}
          </div>
          <div class="card chart-card">
            ${overDf.length > 0 ? '<canvas id="over-chart"></canvas>' : '<p>No data to chart.</p>'}
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Under prices</h2>
        <p>Mean: ${underStats.mean !== null ? underStats.mean : "N/A"}, Std dev: ${underStats.std !== null ? underStats.std : "N/A"}, Count: ${underStats.count}</p>
        <div class="detail-grid">
          <div class="table-container">
            ${underDf.length > 0 ? `
              <table class="display">
                <thead>
                  <tr><th>Bookmaker</th><th>Price</th></tr>
                </thead>
                <tbody>
                  ${underDf.map(row => `
                    <tr><td>${escapeHtml(row.bookmaker || '')}</td><td>${row.price}</td></tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No Under prices found.</p>'}
          </div>
          <div class="card chart-card">
            ${underDf.length > 0 ? '<canvas id="under-chart"></canvas>' : '<p>No data to chart.</p>'}
          </div>
        </div>
      </section>
    </main>
  `;
}

function initPointDetailPage() {
  const chartData = window._pointDetailChartData;
  if (!chartData) return;
  
  const { overStats, underStats } = chartData;
  
  buildScatterChart('over-chart', overStats);
  buildScatterChart('under-chart', underStats);
}

function buildScatterChart(canvasId, stats) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !stats || !stats.counts) return;
  
  const counts = stats.counts;
  const values = [];
  Object.entries(counts).forEach(([k, c]) => {
    const v = parseFloat(k);
    if (isFinite(v)) {
      for (let i = 0; i < c; i++) values.push(v);
    }
  });
  values.sort((a, b) => a - b);
  if (values.length === 0) return;
  
  const mean = stats.mean;
  const std = stats.std;
  const lowerFence = (isFinite(mean) && isFinite(std) && std > 0) ? +(mean - std).toFixed(2) : null;
  const upperFence = (isFinite(mean) && isFinite(std) && std > 0) ? +(mean + std).toFixed(2) : null;
  
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const plotMin = +(minVal - 0.02).toFixed(2);
  const plotMax = +(maxVal + 0.02).toFixed(2);
  
  const data = [];
  const seen = new Set();
  values.forEach(v => {
    const key = v.toFixed(2);
    if (seen.has(key)) return;
    seen.add(key);
    const count = counts[key] || counts[v] || 0;
    if (count > 0) data.push({ x: v, y: 0, count });
  });
  
  const annotations = {};
  if (isFinite(mean)) {
    annotations.mean = {
      type: 'line',
      xMin: mean,
      xMax: mean,
      borderColor: '#ef4444',
      borderWidth: 2,
      label: {
        display: true,
        content: `Mean: ${mean.toFixed(2)}`,
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
  
  // Store reference for cleanup
  const chartRef = canvasId === 'over-chart' ? 'overChart' : 'underChart';
  if (window[chartRef]) {
    window[chartRef].destroy();
  }
  
  window[chartRef] = new Chart(canvas, {
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
          ticks: { callback: (val) => Number(val).toFixed(2) }
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

