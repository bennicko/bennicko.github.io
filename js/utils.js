/**
 * FairOdds Utility Functions
 */

const AU_BOOKMAKERS = [
  "Betr",
  "Ladbrokes",
  "Pointsbet (AU)",
  "Sportsbet",
  "TAB",
  "Unibet",
  "TABTouch",
];

const MARKET_CATEGORIES = {
  points: ["player_points", "player_points_alternate"],
  rebounds: ["player_rebounds", "player_rebounds_alternate"],
  assists: ["player_assists", "player_assists_alternate"],
};

/**
 * Format point value without trailing .0 if possible
 */
function formatPoint(pointValue) {
  try {
    const asFloat = parseFloat(pointValue);
    if (isNaN(asFloat)) return String(pointValue);
    if (Number.isInteger(asFloat)) {
      return String(Math.floor(asFloat));
    }
    return String(asFloat).replace(/\.?0+$/, '');
  } catch (e) {
    return String(pointValue);
  }
}

/**
 * Return human-friendly Bet display text
 */
function formatBetDisplay(betValue) {
  const parts = String(betValue).split("_");
  if (parts.length < 4) return String(betValue);
  
  const player = parts[0];
  const label = parts[1];
  const market = parts.length > 4 ? parts.slice(2, -1).join("_") : parts[2];
  const point = parts[parts.length - 1];
  
  const marketLower = market.toLowerCase();
  let category;
  if (marketLower.includes("points")) {
    category = "Points";
  } else if (marketLower.includes("rebounds")) {
    category = "Rebounds";
  } else if (marketLower.includes("assists")) {
    category = "Assists";
  } else {
    category = market.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
  
  const ou = label.toUpperCase();
  const pointFmt = formatPoint(point);
  return `${player} | ${category} | ${ou} | ${pointFmt}`;
}

/**
 * Return human-friendly market text
 */
function formatMarketDisplay(marketValue) {
  return String(marketValue)
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Compute statistics for a price array
 */
function computePriceStats(prices) {
  if (!prices || prices.length === 0) {
    return {
      count: 0,
      mean: null,
      std: null,
      min: null,
      max: null,
      counts: {},
    };
  }
  
  const validPrices = prices.filter(p => !isNaN(p) && p !== null && p !== undefined);
  if (validPrices.length === 0) {
    return {
      count: 0,
      mean: null,
      std: null,
      min: null,
      max: null,
      counts: {},
    };
  }
  
  const count = validPrices.length;
  const sum = validPrices.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  
  let std = 0;
  if (count > 1) {
    const squaredDiffs = validPrices.map(p => Math.pow(p - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (count - 1);
    std = Math.sqrt(variance);
  }
  
  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  
  // Count occurrences by rounded price
  const counts = {};
  validPrices.forEach(p => {
    const key = p.toFixed(2);
    counts[key] = (counts[key] || 0) + 1;
  });
  
  return { count, mean, std, min, max, counts };
}

/**
 * Compute stakes and returns for arbitrage betting
 */
function computeStakes(oddsOver, oddsUnder, winnings) {
  if (winnings === null || winnings <= 0) return null;
  if (oddsOver === null || oddsOver <= 0 || oddsUnder === null || oddsUnder <= 0) return null;
  
  const stakeOver = winnings / oddsOver;
  const stakeUnder = winnings / oddsUnder;
  const returnOver = oddsOver * stakeOver - stakeOver;
  const returnUnder = oddsUnder * stakeUnder - stakeUnder;
  const totalProfit = oddsUnder * stakeUnder - (stakeUnder + stakeOver);
  
  return {
    stake_over: Math.round(stakeOver * 100) / 100,
    stake_under: Math.round(stakeUnder * 100) / 100,
    return_over: Math.round(returnOver * 100) / 100,
    return_under: Math.round(returnUnder * 100) / 100,
    total_profit: Math.round(totalProfit * 100) / 100,
  };
}

/**
 * Filter data to Australian bookmakers only
 */
function filterBookmakers(data) {
  return data.filter(row => AU_BOOKMAKERS.includes(row.bookmaker));
}

/**
 * Filter data by market category
 */
function filterMarketCategory(data, categoryKey) {
  const markets = MARKET_CATEGORIES[categoryKey];
  if (!markets) return [];
  return data.filter(row => markets.includes(row.market));
}

/**
 * Parse boolean from string value
 */
function toBool(val) {
  if (val === null || val === undefined) return null;
  return ["1", "true", "yes", "on"].includes(String(val).toLowerCase());
}

/**
 * Get AU-only preference from localStorage
 */
function getAusOnlyPreference() {
  const stored = localStorage.getItem("aus_only");
  const result = toBool(stored);
  return result === null ? false : result;
}

/**
 * Set AU-only preference in localStorage
 */
function setAusOnlyPreference(value) {
  localStorage.setItem("aus_only", value ? "1" : "0");
}

/**
 * Parse query parameters from hash
 */
function parseHashParams() {
  const hash = window.location.hash;
  const questionIndex = hash.indexOf("?");
  if (questionIndex === -1) return {};
  
  const queryString = hash.substring(questionIndex + 1);
  const params = {};
  queryString.split("&").forEach(pair => {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  });
  return params;
}

/**
 * Build hash URL with parameters
 */
function buildHashUrl(path, params = {}) {
  const paramStr = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return paramStr ? `#${path}?${paramStr}` : `#${path}`;
}

/**
 * Navigate to a hash route
 */
function navigateTo(path, params = {}) {
  window.location.hash = buildHashUrl(path, params).substring(1);
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

