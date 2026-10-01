(function () {
  const data = window.FAIRODDS_ARB;
  if (!data) return;

  const pct = (n, digits) => (n * 100).toFixed(digits) + "%";
  const money = (n) => Number(n).toFixed(2);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function formatDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return months[m - 1] + " " + d;
  }

  function fillStats() {
    const host = document.getElementById("arb-stats");
    if (!host) return;
    const items = [
      { value: String(data.games), label: "Games with a populated close" },
      { value: String(data.arbs), label: "Same-line screenshot arbs" },
      { value: data.arbGames + " / " + data.games, label: "Games with at least one arb" },
      { value: pct(data.maxEdge, 1), label: "Largest edge (Jackson-Davis 9.5)" },
    ];
    host.innerHTML = items
      .map(
        (item) =>
          '<div class="stat-card"><p class="stat-card__value">' +
          item.value +
          '</p><p class="stat-card__label">' +
          item.label +
          "</p></div>"
      )
      .join("");
  }

  function fillBins() {
    const host = document.getElementById("arb-bins");
    if (!host) return;
    const max = Math.max.apply(null, data.bins.map((b) => b.n));
    host.innerHTML = data.bins
      .map(function (bin) {
        const width = max ? (bin.n / max) * 100 : 0;
        return (
          '<div class="bar-row">' +
          '<span class="bar-row__label">' +
          bin.label +
          "</span>" +
          '<span class="bar-row__track"><span class="bar-row__fill" style="width:' +
          width +
          '%"></span></span>' +
          '<span class="bar-row__n">' +
          bin.n +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function fillMarkets() {
    const host = document.getElementById("arb-markets");
    if (!host) return;
    host.innerHTML = data.markets
      .map(function (m) {
        return (
          '<div class="kv-row"><span>' +
          m.label +
          "</span><strong>" +
          m.n +
          "</strong></div>"
        );
      })
      .join("");
  }

  function fillCallout() {
    const host = document.getElementById("arb-under-note");
    if (!host) return;
    const under = Object.fromEntries(data.underBooks);
    const over = Object.fromEntries(data.overBooks);
    host.textContent =
      (under.FanDuel || 0) +
      " of the " +
      data.arbs +
      " unders are FanDuel, " +
      (under.SportsBet || 0) +
      " are SportsBet. The overs concentrate on TAB (" +
      (over.TAB || 0) +
      "), BetRivers (" +
      (over.BetRivers || 0) +
      ") and Ladbrokes (" +
      (over.Ladbrokes || 0) +
      "). Median edge is " +
      pct(data.medianEdge, 1) +
      "; only " +
      data.bins[data.bins.length - 1].n +
      " quotes clear 8%. " +
      data.primaryVsPrimary +
      " of the " +
      data.arbs +
      " pair two books’ primary rungs rather than fringe ladder numbers.";
  }

  const searchEl = document.getElementById("arb-search");
  const marketEl = document.getElementById("arb-market");
  const minEl = document.getElementById("arb-min-edge");
  const bodyEl = document.getElementById("arb-body");
  const countEl = document.getElementById("arb-count");

  function matches(row, q, market, minEdge) {
    if (row.edge < minEdge) return false;
    if (market && row.market !== market) return false;
    if (!q) return true;
    const hay = [
      row.player,
      row.away,
      row.home,
      row.overBook,
      row.underBook,
      row.market,
      String(row.line),
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function renderTable() {
    if (!bodyEl) return;
    const q = (searchEl && searchEl.value.trim().toLowerCase()) || "";
    const market = (marketEl && marketEl.value) || "";
    const minEdge = minEl ? Number(minEl.value) : 0;
    const shown = data.rows.filter(function (row) {
      return matches(row, q, market, minEdge);
    });

    if (countEl) {
      countEl.textContent =
        shown.length === data.rows.length
          ? "Showing all " + data.arbs + " arbs"
          : "Showing " + shown.length + " of " + data.arbs + " arbs";
    }

    if (!shown.length) {
      bodyEl.innerHTML =
        '<tr><td colspan="8" class="arb-empty">No arbs match those filters.</td></tr>';
      return;
    }

    const html = [];
    for (let i = 0; i < shown.length; i++) {
      const r = shown[i];
      html.push(
        "<tr>" +
          "<td>" +
          formatDate(r.date) +
          "</td>" +
          "<td>" +
          r.away +
          " at " +
          r.home +
          "</td>" +
          "<td>" +
          r.player +
          "</td>" +
          "<td>" +
          r.market +
          " " +
          r.line +
          "</td>" +
          '<td class="num">' +
          r.books +
          "</td>" +
          "<td>" +
          r.overBook +
          " " +
          money(r.overPrice) +
          "</td>" +
          "<td>" +
          r.underBook +
          " " +
          money(r.underPrice) +
          "</td>" +
          '<td class="num">' +
          pct(r.edge, 1) +
          "</td>" +
          "</tr>"
      );
    }
    bodyEl.innerHTML = html.join("");
  }

  fillStats();
  fillBins();
  fillMarkets();
  fillCallout();
  renderTable();

  if (searchEl) searchEl.addEventListener("input", renderTable);
  if (marketEl) marketEl.addEventListener("change", renderTable);
  if (minEl) minEl.addEventListener("change", renderTable);
})();
