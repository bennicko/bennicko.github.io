/**
 * FairOdds Data Layer
 * Handles CSV loading and data processing
 */

// Cache for loaded data
let rawDataCache = null;
let topBetsCache = null;

/**
 * Load and parse a CSV file using PapaParse
 */
async function loadCSV(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

/**
 * Load raw betting odds data
 */
async function loadRawData() {
  if (rawDataCache) return rawDataCache;
  
  const data = await loadCSV("data/betting_odds_raw.csv");
  // Add computed game label
  rawDataCache = data.map(row => ({
    ...row,
    game: `${row.home_team} vs ${row.away_team}`
  }));
  return rawDataCache;
}

/**
 * Load top bets data (with fallback to computing from raw)
 */
async function loadTopBets() {
  if (topBetsCache) return topBetsCache;
  
  try {
    let data = await loadCSV("data/top_bets.csv");
    
    // Handle column naming
    if (data.length > 0) {
      data = data.map(row => {
        const newRow = { ...row };
        if (!newRow.Bet && newRow.key) {
          newRow.Bet = newRow.key;
        }
        if (newRow.mean_price !== undefined) {
          newRow.mean_price = Math.round(newRow.mean_price * 100) / 100;
        }
        if (newRow.threshold !== undefined) {
          newRow.threshold = Math.round(newRow.threshold * 100) / 100;
        }
        if (newRow.prob_diff !== undefined) {
          newRow.prob_diff = Math.round(newRow.prob_diff * 100) / 100;
        }
        return newRow;
      });
    }
    
    topBetsCache = data;
    return topBetsCache;
  } catch (e) {
    // Fallback: compute from raw data
    return computeTopBetsFromRaw();
  }
}

/**
 * Compute top bets directly from raw odds as a fallback
 */
async function computeTopBetsFromRaw() {
  const rawData = await loadRawData();
  
  // Create bet keys
  const dataWithKeys = rawData.map(row => ({
    ...row,
    Bet: `${row.description}_${row.label}_${row.market}_${row.point}`
  }));
  
  // Group by bet key
  const groups = {};
  dataWithKeys.forEach(row => {
    if (!groups[row.Bet]) {
      groups[row.Bet] = [];
    }
    groups[row.Bet].push(row);
  });
  
  // Analyze each group
  const results = [];
  Object.entries(groups).forEach(([betKey, group]) => {
    const analyzed = analyzeGroup(group, betKey);
    if (analyzed) {
      results.push(analyzed);
    }
  });
  
  // Sort by prob_diff (ascending), then consensus_prob (descending)
  results.sort((a, b) => {
    if (a.prob_diff !== b.prob_diff) {
      return a.prob_diff - b.prob_diff;
    }
    return b.consensus_prob - a.consensus_prob;
  });
  
  // Take top 50
  topBetsCache = results.slice(0, 50).map(row => ({
    ...row,
    mean_price: Math.round(row.mean_price * 100) / 100,
    threshold: Math.round(row.threshold * 100) / 100,
  }));
  
  return topBetsCache;
}

/**
 * Analyze a group of bets to find value opportunities
 */
function analyzeGroup(group, betKey) {
  if (group.length < 10) return null;
  
  const prices = group.map(r => r.price).filter(p => !isNaN(p) && p !== null);
  if (prices.length < 10) return null;
  
  const meanVal = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  // Sample standard deviation
  const squaredDiffs = prices.map(p => Math.pow(p - meanVal, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (prices.length - 1);
  const stdVal = Math.sqrt(variance);
  
  // Find max price and associated bookmaker
  let maxPrice = -Infinity;
  let maxBookmaker = null;
  group.forEach(row => {
    if (row.price > maxPrice) {
      maxPrice = row.price;
      maxBookmaker = row.bookmaker;
    }
  });
  
  const threshold = meanVal + stdVal;
  if (maxPrice <= threshold) return null;
  
  // Calculate consensus and implied probabilities
  const consensusProb = 100 / meanVal;
  const impliedProb = 100 / maxPrice;
  const aboveThreshold = maxPrice - threshold;
  const probDiff = impliedProb - consensusProb;
  
  return {
    Bet: betKey,
    max_price: maxPrice,
    bookmaker: maxBookmaker,
    mean_price: meanVal,
    threshold: threshold,
    sample_size: prices.length,
    above_threshold: aboveThreshold,
    consensus_prob: consensusProb,
    implied_prob: impliedProb,
    prob_diff: probDiff,
  };
}

/**
 * Build index rows for the main table with display formatting
 */
function buildIndexRows(data) {
  const rows = data.map(row => {
    const betVal = row.Bet;
    let edgeVal = row.prob_diff;
    if (edgeVal !== null && edgeVal !== undefined && !isNaN(edgeVal)) {
      edgeVal = Math.round(edgeVal * 100) / 100;
    }
    return {
      Bet: betVal,
      BetDisplay: formatBetDisplay(betVal),
      Price: row.max_price,
      Bookmaker: row.bookmaker,
      "Average Price": row.mean_price,
      "% Edge": edgeVal,
    };
  });
  
  const columns = ["Bet", "Price", "Bookmaker", "Average Price", "% Edge"];
  return { columns, rows };
}

/**
 * Get unique game options from raw data
 */
function getGameOptions(rawData) {
  const games = [...new Set(rawData.map(r => r.game).filter(Boolean))];
  return games.sort();
}

/**
 * Get player options, optionally filtered by game
 */
function getPlayerOptions(rawData, game = null) {
  let data = rawData;
  if (game) {
    data = data.filter(r => r.game === game);
  }
  const players = [...new Set(data.map(r => r.description).filter(Boolean))];
  return players.sort();
}

/**
 * Get mapping of games to their players
 */
function getGamePlayerMap(rawData) {
  const mapping = {};
  rawData.forEach(row => {
    if (!row.game) return;
    if (!mapping[row.game]) {
      mapping[row.game] = new Set();
    }
    if (row.description) {
      mapping[row.game].add(row.description);
    }
  });
  
  // Convert sets to sorted arrays
  Object.keys(mapping).forEach(game => {
    mapping[game] = [...mapping[game]].sort();
  });
  
  return mapping;
}

/**
 * Build over/under groups by point with bookmaker data
 */
function buildOverUnderGroups(data) {
  if (!data || data.length === 0) return [];
  
  // Group by point value
  const pointGroups = {};
  data.forEach(row => {
    const pointValue = parseFloat(row.point);
    const pointDisplay = formatPoint(row.point);
    const key = pointValue;
    
    if (!pointGroups[key]) {
      pointGroups[key] = {
        point_value: pointValue,
        point: pointDisplay,
        bookmakers: {}
      };
    }
    
    if (!pointGroups[key].bookmakers[row.bookmaker]) {
      pointGroups[key].bookmakers[row.bookmaker] = {
        bookmaker: row.bookmaker,
        over: null,
        under: null
      };
    }
    
    const label = String(row.label).toLowerCase();
    if (label === "over") {
      pointGroups[key].bookmakers[row.bookmaker].over = row.price;
    } else if (label === "under") {
      pointGroups[key].bookmakers[row.bookmaker].under = row.price;
    }
  });
  
  // Convert to array and sort
  const groups = Object.values(pointGroups).map(group => {
    // Sort bookmakers by over price (desc), then under price (desc)
    const rows = Object.values(group.bookmakers).sort((a, b) => {
      const aOver = a.over || 0;
      const bOver = b.over || 0;
      if (bOver !== aOver) return bOver - aOver;
      const aUnder = a.under || 0;
      const bUnder = b.under || 0;
      return bUnder - aUnder;
    });
    
    return {
      point_value: group.point_value,
      point: group.point,
      rows: rows
    };
  });
  
  // Sort groups by point value
  groups.sort((a, b) => {
    if (isNaN(a.point_value)) return 1;
    if (isNaN(b.point_value)) return -1;
    return a.point_value - b.point_value;
  });
  
  return groups;
}

/**
 * Find arbitrage opportunities across bookmakers
 */
function findArbitrageBets(data) {
  if (!data || data.length === 0) return [];
  
  // Filter valid data
  const working = data.filter(row => {
    const price = parseFloat(row.price);
    return !isNaN(price) && price > 0 && row.label;
  }).map(row => ({
    ...row,
    price: parseFloat(row.price),
    label_lower: String(row.label).toLowerCase()
  })).filter(row => ["over", "under"].includes(row.label_lower));
  
  if (working.length === 0) return [];
  
  // Group by game/player/market/point
  const groups = {};
  working.forEach(row => {
    const key = `${row.game}|${row.description}|${row.market}|${row.point}`;
    if (!groups[key]) {
      groups[key] = { game: row.game, player: row.description, market: row.market, point: row.point, rows: [] };
    }
    groups[key].rows.push(row);
  });
  
  const results = [];
  
  Object.values(groups).forEach(group => {
    const overRows = group.rows.filter(r => r.label_lower === "over");
    const underRows = group.rows.filter(r => r.label_lower === "under");
    
    if (overRows.length === 0 || underRows.length === 0) return;
    
    overRows.forEach(overRow => {
      if (!overRow.price || overRow.price <= 0) return;
      
      underRows.forEach(underRow => {
        if (!underRow.price || underRow.price <= 0) return;
        
        const impliedSum = (1.0 / overRow.price) + (1.0 / underRow.price);
        if (impliedSum < 1.0) {
          const edge = 1.0 - impliedSum;
          results.push({
            game: group.game,
            player: group.player,
            market: group.market,
            market_display: formatMarketDisplay(group.market),
            point: group.point,
            point_display: formatPoint(group.point),
            over_bookmaker: overRow.bookmaker,
            over_price: Math.round(overRow.price * 100) / 100,
            under_bookmaker: underRow.bookmaker,
            under_price: Math.round(underRow.price * 100) / 100,
            implied_total_pct: Math.round(impliedSum * 100 * 100) / 100,
            edge_pct: Math.round(edge * 100 * 100) / 100,
          });
        }
      });
    });
  });
  
  // Sort by edge (descending)
  results.sort((a, b) => b.edge_pct - a.edge_pct);
  
  return results;
}

/**
 * Load bookmaker rows for a specific bet
 */
async function loadBookmakersForBet(betKey) {
  const rawData = await loadRawData();
  
  return rawData
    .filter(row => {
      const rowBet = `${row.description}_${row.label}_${row.market}_${row.point}`;
      return rowBet === betKey;
    })
    .map(row => ({
      bookmaker: row.bookmaker,
      price: row.price
    }));
}

/**
 * Clear data cache (useful for refresh)
 */
function clearDataCache() {
  rawDataCache = null;
  topBetsCache = null;
}

