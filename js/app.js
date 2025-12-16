/**
 * FairOdds Application Router
 * Main entry point for the client-side SPA
 */

// Global data cache
let appRawData = null;
let appTopBetsData = null;
let appInitialized = false;

/**
 * Initialize the application
 */
async function initApp() {
  if (appInitialized) return;
  
  try {
    // Load data in parallel
    const [rawData, topBetsData] = await Promise.all([
      loadRawData(),
      loadTopBets()
    ]);
    
    appRawData = rawData;
    appTopBetsData = topBetsData;
    appInitialized = true;
    
    // Set up router
    window.addEventListener('hashchange', handleRoute);
    
    // Handle initial route
    handleRoute();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('app').innerHTML = `
      <main class="page">
        <div class="card">
          <h1>Error Loading Data</h1>
          <p>Failed to load the application data. Please check that the CSV files are present in the data folder.</p>
          <p>Error: ${escapeHtml(error.message || 'Unknown error')}</p>
        </div>
      </main>
    `;
  }
}

/**
 * Parse the current route from the hash
 */
function parseRoute() {
  const hash = window.location.hash || '#/home';
  const questionIndex = hash.indexOf('?');
  const path = questionIndex === -1 ? hash.substring(1) : hash.substring(1, questionIndex);
  const params = parseHashParams();
  
  return { path, params };
}

/**
 * Handle route changes
 */
async function handleRoute() {
  if (!appInitialized) {
    await initApp();
    return;
  }
  
  const { path, params } = parseRoute();
  const appContainer = document.getElementById('app');
  
  // Show loading state
  appContainer.innerHTML = `
    <main class="page">
      <div class="loading-state">
        <p>Loading...</p>
      </div>
    </main>
  `;
  
  try {
    let html = '';
    let initFn = null;
    
    // Route matching
    if (path === '/home' || path === '/' || path === '') {
      html = renderHomePage();
      initFn = initHomePage;
    } else if (path === '/about') {
      html = renderAboutPage();
      initFn = initAboutPage;
    } else if (path === '/analyse') {
      html = renderAnalysePage(params, appRawData);
      initFn = initAnalysePage;
    } else if (path === '/analyse/point') {
      html = renderPointDetailPage(params, appRawData);
      initFn = initPointDetailPage;
    } else if (path === '/top-bets') {
      html = renderTopBetsPage(params, appTopBetsData);
      initFn = initTopBetsPage;
    } else if (path.startsWith('/bet/')) {
      const betKey = decodeURIComponent(path.substring(5));
      html = await renderBetDetailPage(betKey, appTopBetsData);
      initFn = initBetDetailPage;
    } else if (path === '/arbitrage') {
      html = renderArbitragePage(params, appRawData);
      initFn = initArbitragePage;
    } else if (path === '/arbitrage/calc') {
      html = renderArbitrageCalcPage(params);
      initFn = initArbitrageCalcPage;
    } else {
      // 404 - Not found
      html = `
        <main class="page">
          <div class="card">
            <h1>Page Not Found</h1>
            <p>The page you requested could not be found.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#/home">Go Home</a>
            </div>
          </div>
        </main>
      `;
    }
    
    // Render the page
    appContainer.innerHTML = html;
    
    // Initialize page-specific functionality
    if (initFn) {
      initFn();
    }
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
    
  } catch (error) {
    console.error('Error rendering route:', error);
    appContainer.innerHTML = `
      <main class="page">
        <div class="card">
          <h1>Error</h1>
          <p>An error occurred while loading this page.</p>
          <p>Error: ${escapeHtml(error.message || 'Unknown error')}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#/home">Go Home</a>
          </div>
        </div>
      </main>
    `;
  }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

