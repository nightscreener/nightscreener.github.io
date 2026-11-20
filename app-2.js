/*__TIKR_JS_START__*/
// ==================== reviews #75–#78: ideas from the TIKR study, built our own way ====================
// No outside names, logos, colours, wording or layouts. Colours come only from theme tokens (var(--…)); green / red only through the
// #72 moveClass helper. tests/test_review75.py checks this block for hard-coded colours.

// ---- #75 B: the min / median / max band and its one-line sentence (needs 4+ years; uses up to the last 10) ----
const BAND_MIN = 4, BAND_MAX = 10;
function bandStats(vals) {
  const v = vals.filter(x => x != null && isFinite(x)).slice(-BAND_MAX);
  if (v.length < BAND_MIN) return null;
  const s = [...v].sort((a, b) => a - b), m = s.length >> 1;
  const med = s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2, lo = s[0], hi = s[s.length - 1], last = v[v.length - 1];
  const pos = hi === lo ? .5 : (last - lo) / (hi - lo);
  return { lo, hi, med, last, n: v.length, where: pos >= .8 ? "high" : pos <= .2 ? "low" : "usual" };
}
// short axis labels (the unit is in the title): 2.5 L · 40k · 18% · 1.2×
const axisTxt = (v, unit) => { const a = Math.abs(v), sg = v < 0 ? FMT.MINUS : "";
  if (unit === "pct") return FMT.num(v, a < 10 && a % 1 ? 1 : 0) + "%"; if (unit === "x") return FMT.num(v, 1) + "×";
  return a >= 1e5 ? sg + FMT.num(a / 1e5, a % 1e5 ? 1 : 0) + " L" : a >= 1e3 ? sg + FMT.num(a / 1e3, 0) + "k" : FMT.num(v, a < 10 && a % 1 ? 1 : 0); };
const UNITS = { cr: x => FMT.cr(x, 0), pct: x => FMT.pctPlain(x, 1), x: x => FMT.times(x, 2), num: x => FMT.num(x, 1) };
function bandLine(label, b, unit) {
  if (!b) return `<p class="t-label sub bandl">Band needs ${BAND_MIN}+ years.</p>`;
  const f = UNITS[unit] || UNITS.num, yrs = `${b.n}-yr`;
  const where = b.where === "high" ? `near its ${yrs} high` : b.where === "low" ? `near its ${yrs} low` : "in its usual range";
  return `<p class="t-label bandl">${esc(label)} ${f(b.last)} – ${where} (high ${f(b.hi)}, median ${f(b.med)}, low ${f(b.lo)})</p>`;
}
// neutral compare colours (never green / red): the decorative tokens of the theme
const CMP_COL = ["var(--accent)", "var(--d-violet)", "var(--d-teal)", "var(--d-gold)", "var(--d-pink)"];
// One SVG chart for every financial series: o = { title, unit, ys: ["2023", …], series: [{ name, vals: {year: v} }], kind: "line"|"bar",
// band: true, sub, key (for the sheet), ttm: year label shaded as an estimate }
function finChart(o) {
  const ys = o.ys, S0 = o.series[0], W = 360, H = 170, L = 8, Rr = 54, T = 12, B = 22, iw = W - L - Rr, ih = H - T - B;
  const all = o.series.flatMap(s => ys.map(y => s.vals[y])).filter(v => v != null && isFinite(v));
  const band = o.band !== false ? bandStats(ys.map(y => S0.vals[y])) : null;
  if (!all.length) return `<figure class="fchart" data-chart="${esc(o.title)}"><p class="sub">No figures for ${esc(o.title)} yet.</p></figure>`;
  let lo = Math.min(...all, band ? band.lo : Infinity), hi = Math.max(...all, band ? band.hi : -Infinity);
  if (o.kind === "bar" || o.unit === "cr") { lo = Math.min(0, lo); hi = Math.max(0, hi); }
  if (hi === lo) { hi += Math.abs(hi) * .1 || 1; lo -= Math.abs(lo) * .1 || 1; }
  const pad = (hi - lo) * .08; if (lo !== 0) lo -= pad; hi += pad;
  const n = ys.length, xw = iw / Math.max(n, 1), X = i => L + xw * (i + .5), Y = v => T + ih - (v - lo) / (hi - lo) * ih;
  const f = UNITS[o.unit] || UNITS.num, step = niceStep((hi - lo) / 3) || 1, ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(v);
  const grid = ticks.map(v => `<line class="fc-grid" x1="${L}" x2="${L + iw}" y1="${FMT.coord(Y(v))}" y2="${FMT.coord(Y(v))}"/><text class="fc-ax t-label" x="${L + iw + 4}" y="${FMT.coord(Y(v) + 4)}">${esc(axisTxt(v, o.unit))}</text>`).join("");
  const bandSvg = band ? `<rect class="fc-band" x="${L}" width="${iw}" y="${FMT.coord(Y(band.hi))}" height="${FMT.coord(Math.max(1, Y(band.lo) - Y(band.hi)))}"/>
    <line class="fc-med" x1="${L}" x2="${L + iw}" y1="${FMT.coord(Y(band.med))}" y2="${FMT.coord(Y(band.med))}"/>` : "";
  const ttm = o.ttm && ys.indexOf(o.ttm) >= 0 ? `<rect class="est-col" x="${FMT.coord(X(ys.indexOf(o.ttm)) - xw / 2)}" width="${FMT.coord(xw)}" y="${T}" height="${ih}"/>` : "";
  const ns = o.series.length, bw = Math.min(26, xw * .7 / ns);
  const marks = o.series.map((s, si) => {
    const col = s.color || CMP_COL[si % CMP_COL.length];
    if (o.kind === "bar") return ys.map((y, i) => { const v = s.vals[y]; if (v == null) return "";
      const x = X(i) - bw * ns / 2 + bw * si, y0 = Y(0), y1 = Y(v);
      return `<rect data-series="${esc(s.name)}" data-v="${v}" x="${FMT.coord(x)}" width="${FMT.coord(bw - 1)}" y="${FMT.coord(Math.min(y0, y1))}" height="${FMT.coord(Math.max(1, Math.abs(y1 - y0)))}" style="fill:${col}"/>`; }).join("");
    const segs = []; let cur = [];                                           // a missing year is a gap, never a zero
    ys.forEach((y, i) => { const v = s.vals[y]; if (v == null || !isFinite(v)) { if (cur.length) segs.push(cur); cur = []; } else cur.push([X(i), Y(v)]); });
    if (cur.length) segs.push(cur);
    return segs.map(p => p.length > 1 ? `<polyline data-series="${esc(s.name)}" fill="none" style="stroke:${col}" stroke-width="2.2" points="${p.map(q => FMT.coord(q[0]) + "," + FMT.coord(q[1])).join(" ")}"/>` : "").join("")
      + segs.flat().map(q => `<circle r="2.6" cx="${FMT.coord(q[0])}" cy="${FMT.coord(q[1])}" style="fill:${col}"/>`).join("");
  }).join("");
  const xl = ys.map((y, i) => (n <= 6 || i % Math.ceil(n / 6) === 0 || i === n - 1) ? `<text class="fc-ax t-label" text-anchor="middle" x="${FMT.coord(X(i))}" y="${H - 6}">${esc(/^\d{4}$/.test(y) ? "FY" + y.slice(2) : y)}</text>` : "").join("");
  const key = "";                                       // the colour key is the chart's own title line (figcaption, inside the figure)
  const aria = `${o.title}: ` + ys.map(y => `${y} ${S0.vals[y] == null ? "no figure" : f(S0.vals[y])}`).join(", ");
  return `<figure class="fchart" data-chart="${esc(o.title)}" data-fkey="${esc(o.key || "")}"${o.dl ? ` data-dltitle="${esc(o.dl)}"` : ""}>
    <figcaption class="fc-h"><span class="t-label">${o.series.map((x, si) => kw(x.name, x.color || CMP_COL[si % CMP_COL.length])).join(" · ")}${o.title !== S0.name ? ` <span class="sub">${esc(o.title.replace(S0.name, "").trim() || o.title)}</span>` : ""}${o.sub ? ` <span class="sub">${esc(o.sub)}</span>` : ""}</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${ttm}${bandSvg}${grid}${marks}${xl}${key}</svg>
    ${o.band !== false ? bandLine(S0.name, band, o.unit) : ""}</figure>`;
}
// the financial series a stock page can chart (more appear automatically when the long-history data adds them to fund.history)
const TREND_KEYS = [["revenue_cr", "Sales", "cr", "bar"], ["pat_cr", "Profit", "cr", "bar"], ["op_margin", "Operating margin", "pct"], ["roce", "ROCE", "pct"],
  ["roe", "ROE", "pct"], ["de", "Debt / equity", "x"], ["cfo_pat", "Cash from operations ÷ profit", "x"]];
function trendSeries(s, k) { const h = (s.fund && s.fund.history) || {}; return h[k] || null; }
function trendsPanel(s) {
  const f = s.fund; if (!f || !f.history) return "";
  const hidden = new Set(f.hidden || []), fin = /bank|nbfc|insurance/.test(f.group || "");
  const charts = TREND_KEYS.filter(([k]) => !hidden.has(k) && trendSeries(s, k) && Object.keys(trendSeries(s, k)).length >= 2).map(([k, nm, unit, kind]) => {
    const vals = trendSeries(s, k), ys = Object.keys(vals).sort(), name = k === "revenue_cr" && fin ? "Total income" : nm;
    return `<div class="fcell" data-trend="${k}" role="button" tabindex="0" aria-label="Open the ${esc(name)} chart">${finChart({ title: name + (unit === "cr" ? " (₹ crore)" : ""), unit, kind, ys, series: [{ name, vals }], key: k,
      dl: `${s.name} · ${name} · ${ys.length > 1 ? "FY" + ys[0].slice(2) + "–FY" + ys[ys.length - 1].slice(2) : ys[0]}` })}</div>`; }).join("");
  if (!charts) return "";
  return `<section class="panel" id="trends"><h2>Trends</h2><p class="sub">The faint band runs from the lowest to the highest year we have (up to 10), the dashed line is the median. Tap a chart for the bigger view.</p>
    ${gmLine(s)}<div class="fgrid">${charts}</div></section>`;
}

// ---- #75 C: ⤓ on every chart → a PNG at 2× size, made in the browser from the SVG (no outside requests, works offline) ----
function dlPass(root) {
  (root || SCR()).querySelectorAll("[data-chart]").forEach(c => {
    if (c.querySelector(":scope > .dlx") || !c.querySelector("svg") || c.hasAttribute("data-nodl")) return;
    if (getComputedStyle(c).position === "static") c.style.position = "relative";
    c.insertAdjacentHTML("afterbegin", `<button class="dlx" type="button" data-act="chartdl" aria-label="Download this chart as a picture">⤓</button>`);
  });
}
let DL_FIG = null;
function chartDlSheet(fig) {
  DL_FIG = fig; const r = parseHash(), s = r.name === "stock" ? BY[r.arg] : null;
  const def = fig.dataset.dltitle || [s ? s.name : null, fig.dataset.chart].filter(Boolean).join(" · ");
  sheet(`<h2>Download chart</h2><form id="dlform"><label class="fl">Title<input name="title" maxlength="120" value="${esc(def)}"></label>
    <label class="gi sw"><input type="checkbox" name="white"><span class="gt">White background for printing<span class="gs">Otherwise it keeps the current theme.</span></span></label>
    <p class="t-label sub">A PNG at twice the screen size, with today's date and "Night Screener · personal use" in the corner. Made on this device – nothing is uploaded.</p>
    <div class="btnrow"><button class="act big primary" type="submit">Save picture</button><button class="act" type="button" data-close>Cancel</button></div></form>`);
  const fm = document.getElementById("dlform");
  fm.addEventListener("submit", e => { e.preventDefault(); chartPNG(DL_FIG, fm.title.value.trim() || def, fm.white.checked).then(b => { closeSheet(); if (b) saveBlob(b, (fm.title.value || "chart").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) + ".png"); }); });
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// copy the computed paint of each SVG node inline, so the picture looks like the screen (CSS variables resolved)
function svgSnapshot(svg, white) {
  const c = svg.cloneNode(true), src = svg.querySelectorAll("*"), dst = c.querySelectorAll("*");
  const P = ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "fill-opacity", "stroke-opacity", "font-size", "font-family", "font-weight", "text-anchor", "dominant-baseline"];
  src.forEach((el, i) => { const cs = getComputedStyle(el); P.forEach(p => { const v = cs.getPropertyValue(p); if (v) dst[i].style.setProperty(p, v); });
    if (white && el.tagName === "text" && !el.closest(".fc-key")) dst[i].style.setProperty("fill", cssVar("--print-ink"));
    if (white && el.classList.contains("fc-grid")) dst[i].style.setProperty("stroke", cssVar("--print-line")); });
  const r = svg.getBoundingClientRect(); c.setAttribute("width", r.width); c.setAttribute("height", r.height); c.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return { text: new XMLSerializer().serializeToString(c), w: r.width, h: r.height };
}
function wrapText(ctx, text, maxW) {
  const out = []; let line = "";
  String(text).split(/\s+/).forEach(w => { const tryL = line ? line + " " + w : w; if (ctx.measureText(tryL).width > maxW && line) { out.push(line); line = w; } else line = tryL; });
  if (line) out.push(line); return out;
}
function chartPNG(fig, title, white) {
  const svg = fig.querySelector("svg"); if (!svg) return Promise.resolve(null);
  const snap = svgSnapshot(svg, white), K = 2, pad = 16, W = snap.w + pad * 2, maxW = W - pad * 2;
  const fam = getComputedStyle(document.body).getPropertyValue("font-family");
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = `600 16px ${fam}`; const tl = wrapText(meas, title.slice(0, 160), maxW);
  const bandEl = fig.querySelector(".bandl"); meas.font = `12px ${fam}`; const bl = bandEl ? wrapText(meas, bandEl.textContent, maxW) : [];
  const head = 14 + tl.length * 21, body = snap.h + 8 + bl.length * 16, H = head + body + 22;
  const cv = document.createElement("canvas"); cv.width = Math.round(W * K); cv.height = Math.round(H * K);
  const ctx = cv.getContext("2d"); ctx.scale(K, K);
  const bg = white ? cssVar("--print-bg") : cssVar("--surface"), ink = white ? cssVar("--print-ink") : cssVar("--ink"), mute = white ? cssVar("--print-mute") : cssVar("--ink-3");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ink; ctx.font = `600 16px ${fam}`; tl.forEach((l, i) => ctx.fillText(l, pad, 28 + i * 21));
  ctx.fillStyle = mute; ctx.font = `12px ${fam}`; bl.forEach((l, i) => ctx.fillText(l, pad, head + snap.h + 18 + i * 16));
  ctx.font = `10px ${fam}`; const stamp = `${FMT.date(TODAY)} · Night Screener · personal use`;
  ctx.fillText(stamp, W - ctx.measureText(stamp).width - 8, H - 8);
  return new Promise(res => { const img = new Image();
    img.onload = () => { ctx.drawImage(img, pad, head, snap.w, snap.h); cv.toBlob(b => res(b), "image/png"); };
    img.onerror = () => { toast("Couldn't make the picture on this device"); res(null); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(snap.text); });
}
async function saveBlob(blob, name) {
  try { const f = typeof File === "function" ? new File([blob], name, { type: blob.type }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] }) && matchMedia("(pointer: coarse)").matches) { await navigator.share({ files: [f], title: name }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"), url = URL.createObjectURL(blob); a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000); toast("Picture saved");
}
// ---- #76 lesson 2 (used from #75 on): ONE table component – sticky first column, columns left → right, right-aligned tabular
// numbers, a row highlight on hover / tap. cols: [{ k, h, f (value → text), num }]; rows: [{ cells: {k: v}, cls, attrs }]; foot: same shape.
function dataTable(o) {
  const head = `<thead><tr>${o.cols.map((c, i) => `<th scope="col" class="${i ? "n" : "l"}${c.cls ? " " + c.cls : ""}${c.term ? "" : " noterm"}"${c.sort ? ` data-sortk="${esc(c.k)}" aria-sort="${o.sortK === c.k ? (o.sortDir > 0 ? "ascending" : "descending") : "none"}"` : ""}>${c.sort ? `<button type="button" class="dtsort" data-act="${esc(o.sortAct || "dtsort")}" data-k="${esc(c.k)}">${c.h}${o.sortK === c.k ? (o.sortDir > 0 ? " ↑" : " ↓") : ""}</button>` : c.h}</th>`).join("")}</tr></thead>`;
  const row = (r, tag) => `<tr${r.cls ? ` class="${r.cls}"` : ""}${r.attrs || ""}>${o.cols.map((c, i) => { const v = r.cells[c.k];
    const txt = r.raw && r.raw[c.k] != null ? r.raw[c.k] : c.f ? c.f(v, r) : v == null ? FMT.DASH : esc(String(v));
    return i ? `<td class="n num${c.cls ? " " + c.cls : ""}">${txt}</td>` : `<th scope="row" class="l noterm">${txt}</th>`; }).join("")}</tr>`;
  return `<div class="dtwrap"${o.label ? ` role="region" aria-label="${esc(o.label)}" tabindex="0"` : ""}><table class="dtable${o.cls ? " " + o.cls : ""}">${head}<tbody>${o.rows.map(r => row(r)).join("")}</tbody>${o.foot && o.foot.length ? `<tfoot>${o.foot.map(r => row(r, "tfoot")).join("")}</tfoot>` : ""}</table></div>`;
}
// summary statistics over a list, skipping blanks (#75 D: Mean · Median · High · Low; #76 C adds Spread and Count)
function summaryStats(vals) {
  const v = vals.filter(x => x != null && isFinite(x)).map(Number); if (!v.length) return { n: 0 };
  const s = [...v].sort((a, b) => a - b), m = s.length >> 1, mean = v.reduce((a, b) => a + b, 0) / v.length;
  return { n: v.length, mean, median: s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2, high: s[s.length - 1], low: s[0],
    spread: v.length > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1)) : 0 };
}

// ---- #75 D: the Peers tab – 5 to 10 companies from the stock's own peer group (#71 G), our stock on top, summary rows below ----
const PEER_MIN = 5, PEER_MAX = 10;
function peerList(s) { return peerSet(s).list.slice(0, PEER_MAX); }
// review #85 H: ONE peer set per stock – the same NSE basic industry, else NSE industry, else (fewer than 5) the same sector (flagged).
// Never the whole market and never filled with unrelated companies. Used by the Peers table, its medians and "above / below median",
// the health percentile bars, "better than X% of N peers", the peer pickers and the race chart.
const PEER_SETS = {};
const indBlank = v => !v || /^(-|others?|na|n\/a|none|miscellaneous)$/i.test(String(v).trim());
function peerSet(s) {
  if (!s) return { list: [], n: 0, level: null, label: "", key: "none" };
  const c = PEER_SETS[s.symbol]; if (c && c.of === S.stocks) return c;
  const pool = S.stocks.filter(x => x !== s && x.mcap_cr && inUni(x)), pick = f => pool.filter(f);
  let list = [], level = null, label = "";
  if (s.bi) { list = pick(x => x.bi === s.bi); level = "industry"; label = s.bi; }
  if (list.length < PEER_MIN && s.ind2) { const l = pick(x => x.ind2 === s.ind2); if (l.length > list.length) { list = l; level = "industry"; label = s.ind2; } }
  if (list.length < PEER_MIN && !indBlank(s.industry)) { const l = pick(x => x.industry === s.industry);
    if (l.length > list.length || !level) { list = l; level = s.bi || s.ind2 ? "sector" : "industry"; label = s.industry; } }
  list.sort((a, b) => b.mcap_cr - a.mcap_cr);
  return PEER_SETS[s.symbol] = { list, n: list.length, level, label: label || "", key: (level || "none") + ":" + label, of: S.stocks };
}
const PEER_COLS = [["mcap_cr", "Market cap", v => FMT.cr(v, 0), true], ["pe", "P/E", v => FMT.ratio(v, 1), true], ["ev_ebitda", "EV/EBITDA", v => FMT.ratio(v, 1), true],
  ["pb", "P/B", v => FMT.ratio(v, 1), true], ["sales_cagr", "Sales 3-yr CAGR", v => growthTxt(v, 1)], ["op_margin", "Operating margin", v => FMT.pctPlain(v, 1)],
  ["roce", "ROCE", v => FMT.pctPlain(v, 1)], ["de", "Debt/Equity", v => FMT.ratio(v, 2)], ["quality", "Quality", v => FMT.num(v, 0)]];
const growthTxt = (v, d = 1) => v != null && v > 500 ? "> 500% (small base)" : FMT.pctPlain(v, d);   // #85 J1: no precise huge number from a tiny base
function peersPanel(s) {
  const P = peerSet(s), peers = P.list.slice(0, PEER_MAX), all = P.list, OWN = OWNER();
  const pf = s.v4 && s.v4.v12 && s.v4.v12.pf, label = P.label || "its industry";
  if (!all.length) return `<section class="panel" id="peers"><h2>Peers</h2><p class="sub pcount">${P.label ? `Only 1 company in this industry (${esc(P.label)}) – nothing to compare with` : "This company's industry isn't known yet"}; never compared with unrelated companies.</p></section>`;
  const cols = [{ k: "name", h: "Company", f: (v, r) => r.s === s ? `<b title="${esc(r.s.name)}">${esc(r.s.name)}</b>` : `<a href="${stockHref(r.s.symbol)}" title="${esc(r.s.name)}">${esc(r.s.name)}</a>` },
    ...PEER_COLS.map(([k, h, f, price]) => ({ k, h, term: !/CAGR|Debt\/Equity/.test(h), f: (v, r) => r.stat ? (v == null ? FMT.DASH : f(v)) : OWN && price ? omRow() : f(v) + (r.s === s && v != null ? peerMark(k, v) : "") })),
    { k: "verdict", h: "Verdict", term: true, f: (v, r) => r.stat ? "" : OWN ? omRow() : esc(vgName(vfor(r.s).g)) }];
  const med = Object.fromEntries(PEER_COLS.map(([k]) => [k, summaryStats(all.map(p => p[k])).median]));
  function peerMark(k, v) { const m = med[k]; if (m == null || v === m) return ""; return ` <span class="pmark t-label${v > m ? " acc" : ""}">${v > m ? "above" : "below"} median</span>`; }
  const rowOf = x => ({ s: x, cls: x === s ? "me" : "", cells: Object.fromEntries([["name", x.name], ...PEER_COLS.map(([k]) => [k, x[k]]), ["verdict", null]]), attrs: ` data-peer="${esc(x.symbol)}"` });
  const stats = [["mean", "Mean"], ["median", "Median"], ["high", "High"], ["low", "Low"]].map(([k, nm]) => ({ stat: true, cls: "srow",
    raw: { name: `${nm} <span class="t-label sub">of ${all.length} peers</span>` }, cells: Object.fromEntries(PEER_COLS.map(([c, , , price]) => [c, OWN && price ? null : summaryStats(all.map(p => p[c]))[k]])) }));
  if (OWN) stats.forEach(r => PEER_COLS.forEach(([c, , , price]) => { if (price) r.raw[c] = omRow(); }));
  return `<section class="panel" id="peers"><h2>Peers</h2>
    ${pf && pf.fit === false ? `<p class="note">⚠️ Peers may not fit: ${esc(pf.why || "")}. Read the comparison with care.</p>` : ""}
    <p class="sub pcount">${all.length < 3 ? `Only ${all.length + 1} companies in this ${P.level === "sector" ? "sector" : "industry"} (${esc(label)}) – all shown below, never filled with unrelated companies.`
      : `${esc(s.name)} and ${all.length > peers.length ? `the ${peers.length} biggest of ${all.length}` : `the ${peers.length}`} compan${peers.length === 1 ? "y" : "ies"} in ${P.level === "sector" ? "the same sector" : "the same industry"}, ${esc(label)}, by market cap.`}
      ${P.level === "sector" ? `<span class="pflag">Fewer than ${PEER_MIN} in its own industry (${esc(s.bi || s.ind2 || "")}), so the sector is used.</span>` : ""} The summary rows cover all ${all.length} peers, leave our stock out and skip blanks. "Above / below median" is just a position – not good or bad.</p>
    ${dataTable({ cols, rows: [rowOf(s), ...peers.map(rowOf)], foot: stats, cls: "peers", label: "Peers table" })}</section>`;
}
// ---- #75 E: Search growth modes – Value · YoY % · 3-yr CAGR · 5-yr CAGR, and FY · TTM, for the growth-type fields ----
const GM_FIELDS = { sales: ["revenue_cr", "Sales", "₹ cr"], op: ["op_profit_cr", "Operating profit", "₹ cr"], profit: ["pat_cr", "Net profit", "₹ cr"],
  eps: ["eps", "EPS", "₹"], bv: ["equity_cr", "Book value", "₹ cr"], cfo: ["cfo_cr", "Cash from operations", "₹ cr"] };
const GM_MODES = [["value", "Value"], ["yoy", "YoY %"], ["c3", "3-yr CAGR"], ["c5", "5-yr CAGR"]], GM_PERS = [["fy", "FY"], ["ttm", "TTM"]];
const GM_NEED = { yoy: 2, c3: 4, c5: 6 };
const GM = { get mode() { return prefGet("screener.gmode", "value"); }, get per() { return prefGet("screener.gper", "fy"); } };
// the stock's yearly series for one field: list rows carry s.fh, full stock objects s.fund.history
function gmSeries(s, key) {
  if (s.fh && s.fh[key]) { const [y0, v] = s.fh[key]; return v.map((x, i) => [String(y0 + i), x]); }
  const h = s.fund && s.fund.history && s.fund.history[key]; if (!h) return [];
  const ys = Object.keys(h).filter(y => /^\d{4}$/.test(y)).sort(); if (!ys.length) return [];
  const out = []; for (let y = +ys[0]; y <= +ys[ys.length - 1]; y++) out.push([String(y), h[y] ?? null]); return out;
}
function gmTTM(s, key) { if (s.ft && s.ft[key] != null) return s.ft[key];
  const m = s.fund && s.fund.metrics; if (!m) return null; return m[key === "eps" ? "eps_ttm" : key] ?? null; }
// → { v } or { na: "needs 6 years" }
function gmVal(s, fk, mode = GM.mode, per = GM.per) {
  const F = GM_FIELDS[fk]; if (!F) return { na: "unknown field" };
  const ser = gmSeries(s, F[0]).filter(p => p[1] != null);
  if (mode === "value") { const v = per === "ttm" ? gmTTM(s, F[0]) : (ser.length ? ser[ser.length - 1][1] : null); return v == null ? { na: per === "ttm" ? "no TTM figure" : "no figure" } : { v }; }
  if (per === "ttm") return { na: "growth uses full years (FY)" };
  const n = GM_NEED[mode], all = gmSeries(s, F[0]);
  if (all.length < n || all.slice(-n).some(p => p[1] == null)) return { na: `needs ${n} years` };
  const end = all[all.length - 1][1], start = all[all.length - n][1];
  if (!(start > 0) || !(end > 0)) return { na: "a loss year – growth can't be worked out" };
  return { v: (mode === "yoy" ? end / start - 1 : Math.pow(end / start, 1 / (n - 1)) - 1) * 100 };
}
const GM_RE = /^(sales|revenue|operating profit|op profit|ebit|net profit|profit|pat|eps|book value|bv|cfo|cash from operations)(?: (yoy(?: ?%)?|yoy growth|value|[35] ?y(?:r|ear)?s? cagr|cagr [35] ?y(?:r|ear)?s?))?(?: (ttm|fy))?$/;
const GM_ALIAS = { sales: "sales", revenue: "sales", "operating profit": "op", "op profit": "op", ebit: "op", "net profit": "profit", profit: "profit", pat: "profit",
  eps: "eps", "book value": "bv", bv: "bv", cfo: "cfo", "cash from operations": "cfo" };
function gmField(name) {
  const m = norm(name).match(GM_RE); if (!m) return null;
  const fk = GM_ALIAS[m[1]], md = m[2] ? (/yoy/.test(m[2]) ? "yoy" : /value/.test(m[2]) ? "value" : /3/.test(m[2]) ? "c3" : "c5") : null;
  return { fk, mode: md, per: m[3] || null };
}
const gmLabel = (fk, mode, per) => `${GM_FIELDS[fk][1]} ${mode === "value" ? (per === "ttm" ? "(TTM)" : "(latest FY)") : (GM_MODES.find(x => x[0] === mode) || [])[1]}`;
function gmCond(gf, op, v) {
  const mode = () => gf.mode || GM.mode, per = () => gf.per || GM.per;
  return { get label() { return `${gmLabel(gf.fk, mode(), per())} ${op} ${v}`; }, fund: true, gm: { fk: gf.fk, mode, per },
    fn: s => { const r = gmVal(s, gf.fk, mode(), per()); return r.v != null && OPS[op](r.v, v); },
    field: { get key() { return "gm:" + gf.fk; }, get label() { return gmLabel(gf.fk, mode(), per()); }, get unit() { return mode() === "value" ? GM_FIELDS[gf.fk][2] : "%"; }, op, v,
      get: s => gmVal(s, gf.fk, mode(), per()).v } };
}
const gmLeaves = (n, out = []) => { if (n.op) n.items.forEach(x => gmLeaves(x, out)); else if (n.gm) out.push(n.gm); return out; };
function gmBar(skip) {
  return `<div class="gmbar ctlline" role="group" aria-label="Growth figures"><span class="t-label sub">Growth figures</span>
    ${GM_MODES.map(([k, nm]) => `<button class="chip${GM.mode === k ? " on" : ""}" type="button" data-act="gmode" data-v="${k}" aria-pressed="${GM.mode === k}">${nm}</button>`).join("")}
    <span class="ctlsep" aria-hidden="true"></span>${GM_PERS.map(([k, nm]) => `<button class="chip${GM.per === k ? " on" : ""}" type="button" data-act="gper" data-v="${k}" aria-pressed="${GM.per === k}">${nm}</button>`).join("")}
    <span class="t-label sub gmskip">For sales, operating profit, net profit, EPS, book value and CFO. A mode typed in the box (e.g. "sales 3y cagr > 15") wins.${skip ? ` <b>${FMT.count(skip)} stock${skip === 1 ? "" : "s"} skipped: not enough history.</b>` : ""}</span></div>`;
}
// the stock page line: every mode for sales and profit, with "n/a (needs 6 years)" where the history is short
function gmLine(s) {
  const cell = (fk, md) => { const r = gmVal(s, fk, md, "fy"); return r.v != null ? (md === "value" ? fmtF(GM_FIELDS[fk][2], r.v) : FMT.pct(r.v, 1)) : `n/a (${r.na})`; };
  const rows = ["sales", "profit"].filter(fk => gmSeries(s, GM_FIELDS[fk][0]).length);
  if (!rows.length) return "";
  return `<p class="mini gmline">${rows.map(fk => `<b>${GM_FIELDS[fk][1]}</b>: YoY ${cell(fk, "yoy")} · 3-yr CAGR ${cell(fk, "c3")} · 5-yr CAGR ${cell(fk, "c5")}`).join("<br>")}</p>`;
}
// ---- #75 F + lesson 11: a side menu on wide screens (≥ 900 px) in two groups, collapsible to icons; phones keep the bottom tabs ----
const SIDE_W = 900, SIDE_KEY = "screener.sidecol";
function SIDE() { return matchMedia(`(min-width: ${SIDE_W}px)`).matches; }
function sideApply() { const col = prefGet(SIDE_KEY, "0") === "1", b = document.querySelector(".smcol");
  document.documentElement.classList.toggle("side-col", col);
  if (b) { b.setAttribute("aria-expanded", String(!col)); b.setAttribute("aria-label", col ? "Expand the menu" : "Collapse the menu"); b.textContent = col ? "⟩" : "⟨"; } }
sideApply();
document.querySelector(".smcol").addEventListener("click", () => { prefSet(SIDE_KEY, prefGet(SIDE_KEY, "0") === "1" ? "0" : "1"); sideApply(); });
// ---- #76 A: the Statements tab – P&L · Balance sheet · Cash flow · Ratios (Segments: #78), years left → right, TTM last and shaded ----
const ST_SHEETS = [["pl", "P&L"], ["bs", "Balance sheet"], ["cf", "Cash flow"], ["ratios", "Ratios"]];
const STP = { get sheet() { return prefGet("screener.st.sheet", "pl"); }, get years() { return prefGet("screener.st.years", "10"); }, get unit() { return prefGet("screener.st.unit", "cr"); },
  get dec() { return +prefGet("screener.st.dec", "0"); }, get newest() { return prefGet("screener.st.newest", "0") === "1"; }, get yoy() { return prefGet("screener.st.yoy", "0") === "1"; } };
const LOSS_LINES = new Set(["gross_profit", "ebitda", "ebit", "pbt", "pat", "eps", "fcf"]);      // a negative here is a loss → red via moveClass
// a statement line's value in the chosen units; brackets for negatives, red only where it is a loss (the #72 rule)
function stCell(key, unit, v) {
  if (v == null) return FMT.DASH;
  const P = STP, lcr = P.unit === "lcr" && unit === "cr", x = lcr ? v / 1e5 : v;
  const d = unit === "cr" ? (lcr ? Math.max(P.dec, 2) : P.dec) : unit === "n" || unit === "d" ? 0 : Math.max(P.dec, unit === "rs" || unit === "x" ? 2 : 1);
  let t = unit === "n" ? FMT.shares(Math.abs(x)) : FMT.num(Math.abs(x), d) + (unit === "pct" ? "%" : unit === "x" ? "×" : "");
  if (x < 0) t = `(${t})`;
  return x < 0 && LOSS_LINES.has(key) ? `<span class="${moveClass(x)}">${t}</span>` : t;
}
function statementsPanel(s) {
  loadLH(s.symbol); const st = stWithLH(s.symbol, stWithXH(s, s.fund && s.fund.st));     // #81 C7 uploaded long history; #84 A the filed years
  if (!st || !st.s) return `<section class="panel" id="statements"><h2>Statements</h2><p class="sub">No data yet – this stock's yearly statement lines haven't been collected. They appear here after the next statements download.</p></section>`;
  const P = STP, sheets = ST_SHEETS.filter(([k]) => st.s[k]), sh = st.s[P.sheet] ? P.sheet : sheets[0][0];
  if (P.sheet === "seg") return `<section class="panel" id="statements"><h2>Statements</h2>
    <nav class="chiprow" aria-label="Statement">${sheets.map(([k, nm]) => `<button class="chip" type="button" data-act="stsheet" data-v="${k}" aria-pressed="false">${nm}</button>`).join("")}${segTab(s)}</nav>${segmentsPanel(s)}</section>`;   // #78 B
  let ys = st.y.map((y, i) => [y, i]); const lim = P.years === "all" ? ys.length : +P.years; ys = ys.slice(-lim);
  const ttmOn = sh === "pl" && st.ttm && Object.keys(st.ttm).length;
  const cols = ys.map(([y, i]) => ({ y, i }));
  if (P.newest) cols.reverse();
  const head = [{ k: "line", h: P.unit === "lcr" ? "₹ lakh crore" : "₹ crore" }, ...cols.map(c => ({ k: "y" + c.i, h: "FY" + c.y.slice(2) }))];
  const ttmCol = { k: "ttm", h: `<span class="estlbl">TTM</span>`, cls: "est" };
  if (ttmOn) P.newest ? head.splice(1, 0, ttmCol) : head.push(ttmCol);
  const rows = st.s[sh].map(([key, label, unit, vals]) => {
    const raw = { line: esc(label) };
    cols.forEach(c => { const v = vals[c.i], prev = c.i > 0 ? vals[c.i - 1] : null, off = st.src && st.src[key] && st.src[key][c.y];
      let txt = stCell(key, unit, v);
      if (P.yoy && v != null && prev != null && prev > 0 && unit !== "pct") { const g = (v / prev - 1) * 100; txt += `<span class="yoy t-label">${moveNum(g, FMT.pct(g, 0))}</span>`; }
      raw["y" + c.i] = `<span data-cell="${esc(key)}|${esc(c.y)}|${off ? "o" : st.lhcells && st.lhcells[key] && st.lhcells[key][c.y] ? "l" : "y"}">${txt}</span>`; });
    if (ttmOn) raw.ttm = st.ttm[key] != null ? `<span class="estv" data-cell="${esc(key)}|TTM|y">${stCell(key, unit, st.ttm[key])}</span>` : FMT.DASH;
    return { raw, cells: {}, attrs: ` data-strow="${esc(key)}" tabindex="0" aria-label="${esc(label)} – tap for its chart"`, cls: "tap" };
  });
  const seg = (k, v, opts) => `<label class="ctl">${k}<select data-stp="${{ Years: "years", Units: "unit", Decimals: "dec" }[k]}">${opts.map(([a, b]) => `<option value="${a}"${String(v) === a ? " selected" : ""}>${b}</option>`).join("")}</select></label>`;
  const ctl = `<div class="ctlline t-label" role="group" aria-label="Table controls">
    ${seg("Years", P.years, [["5", "5"], ["10", "10"], ["all", "All"]])}${seg("Units", P.unit, [["cr", "₹ crore"], ["lcr", "₹ lakh cr"]])}${seg("Decimals", P.dec, [["0", "0"], ["1", "1"], ["2", "2"]])}
    <label class="ctl"><input type="checkbox" data-stp="newest"${P.newest ? " checked" : ""}>Newest first</label><label class="ctl"><input type="checkbox" data-stp="yoy"${P.yoy ? " checked" : ""}>YoY %</label></div>`;
  return `<section class="panel" id="statements"><h2>Statements</h2>
    <nav class="chiprow" aria-label="Statement">${sheets.map(([k, nm]) => `<button class="chip${k === sh ? " on" : ""}" type="button" data-act="stsheet" data-v="${k}" aria-pressed="${k === sh}">${nm}</button>`).join("")}${segTab(s)}</nav>
    ${ctl}
    ${dataTable({ cols: head, rows, cls: "stmt", label: ST_SHEETS.find(x => x[0] === sh)[1] + " table" })}
    ${st.xh ? `<p class="t-label sub sthist"><b>${esc(st.xh)}</b> · the company's own filings (NSE XBRL), latest filing of each year; they win over Yahoo where both exist.</p>`
      : s.fund && s.fund.xh && s.fund.xh.y && dqLow(s.symbol) ? `<p class="t-label sub sthist">${esc(s.fund.xh.h || "Filed history")} is held back: data check failed (<a href="#/dataquality?s=${esc(s.symbol)}">why</a>).</p>` : ""}
    <p class="t-label sub">Year ending March. Yearly lines from Yahoo Finance (unofficial); the latest year's sales, profit, net worth, debt and cash flow from the company's official NSE filing where one matched. Blank = not reported (never estimated). ${ttmOn ? `TTM = ${esc(st.ttm_basis || "last 4 quarters")} – shaded because it isn't a full year. ` : ""}Hold a number for its source; tap a row for its chart.${sh === "ratios" ? " Ratios use the same formulas as the rest of the page." : ""}</p></section>`;
}
// #76 lesson 1: the stock page's fixed tab order (docs/STOCK-PAGE.md) – identical for every stock; an empty tab shows "No data yet"
const STOCK_TABS = ["summary", "value", "statements", "health", "peers", "investors", "owners", "news", "docs", "chart"];
// ---- #76 D: Documents – results, annual reports, concall transcripts and recordings, presentations, ratings, board outcomes,
// shareholding patterns: links only (the exchange's own file opens in a new tab), newest first, filter by type / year / words ----
const DOC_TYPES = [["results", "Financial results"], ["annual_report", "Annual report"], ["transcript", "Concall transcript"], ["concall_av", "Concall audio / video"],
  ["presentation", "Investor presentation"], ["rating", "Credit rating"], ["board_outcome", "Board meeting outcome"], ["shareholding", "Shareholding pattern"]];
const DOCF = { t: "", y: "", q: "" };
const docName = k => (DOC_TYPES.find(x => x[0] === k) || [k, k])[1];
function readerLine(s, url) {                     // the Company Reader's one line, when it read this very document
  const r = s.rd; if (!r || !url) return "";
  const hit = [...(r.numbers || []), ...(r.top || []), ...(r.signals || [])].some(x => x && x.url && x.url.split("#")[0] === url);
  return hit ? r.first : "";
}
function docsPanel(s) {
  if (s.nc) return "";
  const D = (s.docs || []).filter(d => d && d[3]);
  if (!D.length) return `<section class="panel" id="documents"><h2>Filings &amp; transcripts</h2><p class="sub">No data yet – the exchange filings list for this stock hasn't been collected (it refreshes with the weekly announcements pass).</p></section>`;
  const today = TODAY, yearAgo = new Date(new Date(today + "T00:00:00").getTime() - 365 * 864e5).toISOString().slice(0, 10);
  const latest = ["results", "annual_report", "transcript", "presentation"].map(k => { const d = D.find(x => x[1] === k);
    return `<div class="lat${d ? "" : " none"}"><span class="t-label sub">Last ${docName(k).toLowerCase()}</span>${d ? `<a href="${esc(d[3])}" target="_blank" rel="noopener">${esc(FMT.date(d[0]))}</a>` : `<span class="t-label">none in 3 years</span>`}</div>`; }).join("");
  const missing = ["transcript", "results", "presentation"].filter(k => !D.some(x => x[1] === k && x[0] >= yearAgo))
    .map(k => `<li>No ${docName(k).toLowerCase()} filed in the last 12 months</li>`).join("");
  const years = [...new Set(D.map(d => d[0].slice(0, 4)))].sort().reverse();
  const q = DOCF.q.trim().toLowerCase();
  const list = D.filter(d => (!DOCF.t || d[1] === DOCF.t) && (!DOCF.y || d[0].startsWith(DOCF.y)) && (!q || d[2].toLowerCase().includes(q) || docName(d[1]).toLowerCase().includes(q)));
  return `<section class="panel" id="documents"><h2>Filings &amp; transcripts</h2>
    <div class="latest">${latest}</div>
    ${missing ? `<ul class="mini dmiss">${missing}</ul>` : ""}
    <div class="ctlline t-label" role="group" aria-label="Filter documents">
      <label class="ctl">Type<select data-docf="t"><option value="">All</option>${DOC_TYPES.filter(([k]) => D.some(d => d[1] === k)).map(([k, nm]) => `<option value="${k}"${DOCF.t === k ? " selected" : ""}>${nm}</option>`).join("")}</select></label>
      <label class="ctl">Year<select data-docf="y"><option value="">All</option>${years.map(y => `<option${DOCF.y === y ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="ctl">Find<input type="search" data-docf="q" value="${esc(DOCF.q)}" placeholder="words" size="10" autocomplete="off"></label></div>
    <ul class="doclist">${list.slice(0, 60).map(d => { const rl = readerLine(s, d[3]);
      return `<li class="docrow"><span class="t-label num">${esc(FMT.date(d[0]))}</span><span class="dchip t-label" data-dk="${esc(d[1])}">${esc(docName(d[1]))}</span>
        <span class="dtitle">${esc(d[2] || docName(d[1]))}${rl ? `<span class="t-label sub">Company Reader: ${esc(rl)}</span>` : ""}</span>
        <a class="act" href="${esc(d[3])}" target="_blank" rel="noopener" aria-label="Open ${esc(docName(d[1]))} of ${esc(FMT.date(d[0]))} on the exchange site">Open</a></li>`; }).join("") || `<li class="sub">Nothing matches these filters.</li>`}</ul>
    <p class="t-label sub">From NSE announcements (links to the exchange's own files – nothing is downloaded here). ${FMT.count(list.length)} of ${FMT.count(D.length)} shown.</p></section>`;
}
screenEl.addEventListener("change", e => { const c = e.target.closest("[data-docf]"); if (!c || c.type === "search") return; DOCF[c.dataset.docf] = c.value; const y = scrollY; render(true); scrollTo(0, y); });
screenEl.addEventListener("input", e => { const c = e.target.closest('[data-docf="q"]'); if (!c) return; DOCF.q = c.value; const pos = c.selectionStart, y = scrollY; render(true); scrollTo(0, y);
  const n = SCR().querySelector('[data-docf="q"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
function cellSourceSheet(sym, cell) {
  const [key, y, src] = cell.split("|"), s = BY[sym], st = s && s.fund && s.fund.st, row = st && Object.values(st.s).flat().find(r => r[0] === key);
  sheet(`<h2>${esc(row ? row[1] : key)} · ${esc(y === "TTM" ? "TTM" : "FY" + y.slice(2))}</h2>
    <p class="mline"><b>Source:</b> ${src === "o" ? "Official NSE XBRL filing (audited annual results)" : src === "l" ? "Your uploaded long history – the value the checks settled on" : y === "TTM" ? "Yahoo Finance (unofficial) – the last 4 quarters added up" : "Yahoo Finance (unofficial)"}</p>
    ${trailHTML(sym, key, y) || `<p class="mini sub">Filing date and "as first reported / restated" aren't recorded for this line yet – they show here when the long-history data arrives.</p>`}
    <div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`);
}

// ---- #76 C: Watchlist columns – pick from 25, reorder, sort, a summary row (Mean · Median · High · Low · Spread · Count), copy table ----
const histRet = (s, days) => { const h = histOf(s.symbol), c = h && h.close ? h.close.filter(x => x != null) : []; if (c.length <= days) return null; const a = c[c.length - 1 - days]; return a ? (c[c.length - 1] / a - 1) * 100 : null; };
const divYield = s => { if (!s.dv || !s.close) return null; const lo = new Date(new Date(TODAY + "T00:00:00").getTime() - 365 * 864e5).toISOString().slice(0, 10);
  const t = s.dv.filter(d => d[0] >= lo).reduce((a, d) => a + (+d[2] || 0), 0); return t ? t / s.close * 100 : null; };
const fvOf = s => (s.v4 && s.v4.v12 && s.v4.v12.v) || s.fair_value || null;
const fvGap = s => { const f = fvOf(s); return f && s.close ? (s.close / f - 1) * 100 : null; };
const savedPct = s => { const w = USER.watch.find(x => x.sym === s.symbol); return w && w.px && s.close ? (s.close / w.px - 1) * 100 : null; };
// key: [label, value(s), format, price figure (hidden in Business Owner Mode), move (a gain / fall → green / red)]
const WCOL = {
  price: ["Price", s => s.close, v => inr(v), 1], today: ["Today %", s => s.change_pct, v => FMT.pct(v, 2), 1, 1], m1: ["1M %", s => histRet(s, 21), v => FMT.pct(v, 1), 1, 1],
  y1: ["1Y %", s => histRet(s, 248), v => FMT.pct(v, 1), 1, 1], mcap: ["Market cap", s => s.mcap_cr, v => FMT.cr(v, 0), 1], pe: ["P/E", s => s.pe, v => FMT.ratio(v, 1), 1],
  pb: ["P/B", s => s.pb, v => FMT.ratio(v, 2), 1], ev: ["EV/EBITDA", s => s.ev_ebitda, v => FMT.ratio(v, 1), 1], roce: ["ROCE", s => s.roce, v => FMT.pctPlain(v, 1)],
  roe: ["ROE", s => s.roe, v => FMT.pctPlain(v, 1)], opm: ["Operating margin", s => s.op_margin, v => FMT.pctPlain(v, 1)], sg3: ["Sales 3-yr CAGR", s => gmVal(s, "sales", "c3", "fy").v ?? null, v => FMT.pctPlain(v, 1)],
  pg3: ["Profit 3-yr CAGR", s => gmVal(s, "profit", "c3", "fy").v ?? null, v => FMT.pctPlain(v, 1)], de: ["Debt/Equity", s => s.de, v => FMT.ratio(v, 2)], icr: ["Interest cover", s => s.icr, v => FMT.times(v, 1)],
  dy: ["Dividend yield", divYield, v => FMT.pctPlain(v, 2), 1], prom: ["Promoter %", s => s.promoter_holding, v => FMT.pctPlain(v, 1)], pledge: ["Pledge %", s => s.pledge, v => FMT.pctPlain(v, 1)],
  q: ["Quality score", s => { const v = SET.master ? vfor(s) : null; return v && v.q != null ? v.q : s.quality; }, v => FMT.num(v, 0)],
  verdict: ["Verdict", s => null, (v, s) => SET.master && vfor(s) ? esc(vgName(vfor(s).g)) : FMT.DASH, 1, 0, 1],
  fv: ["⭐ Fair value", fvOf, v => inr(v), 1], fvgap: ["% vs fair value", fvGap, v => FMT.pct(v, 0), 1], hi52: ["From 52-wk high %", s => s.pct_from_high52, v => FMT.pct(v, 1), 1, 1],
  rsi: ["RSI(14)", s => s.rsi14, v => FMT.num(v, 0), 1], saved: ["Saved price %", savedPct, v => FMT.pct(v, 1), 1, 1] };
const WCOL_DEFAULT = ["price", "today", "pe", "roce", "verdict", "fvgap"];
const wcols = () => { const c = (USER.wcols || []).filter(k => WCOL[k]); return c.length ? c : WCOL_DEFAULT.slice(); };
const WT = { sort: null, dir: -1 };
function watchTable(list) {
  const OWN = OWNER(), keys = wcols(), rowsS = list.map(w => BY[w.sym]).filter(Boolean);
  const val = (k, s) => WCOL[k][5] ? null : WCOL[k][1](s);
  let rows = rowsS.slice();
  if (WT.sort && WCOL[WT.sort]) rows.sort((a, b) => { const x = WT.sort === "verdict" ? (VG_ORDER.indexOf((vfor(a) || {}).g)) : val(WT.sort, a), y = WT.sort === "verdict" ? (VG_ORDER.indexOf((vfor(b) || {}).g)) : val(WT.sort, b);
    if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x - y) * WT.dir; });
  const cell = (k, s) => { const [, , f, price, move] = WCOL[k]; if (OWN && price) return omRow(); const v = val(k, s);
    if (WCOL[k][5]) return f(null, s); if (v == null) return FMT.DASH; return move ? moveNum(v, f(v, s)) : f(v, s); };
  const cols = [{ k: "name", h: "Stock" }, ...keys.map(k => ({ k, h: esc(WCOL[k][0]), sort: true }))];
  const body = rows.map(s => ({ raw: Object.fromEntries([["name", `<a href="${stockHref(s.symbol)}">${esc(s.name)}</a>`], ...keys.map(k => [k, cell(k, s)])]), cells: {} }));
  const stats = summaryStatsFor(keys, rowsS, val);
  const foot = [["mean", "Mean"], ["median", "Median"], ["high", "High"], ["low", "Low"], ["spread", "Spread (std dev)"], ["n", "Count"]].map(([sk, nm]) => ({ cls: "srow",
    raw: Object.fromEntries([["name", nm], ...keys.map(k => { const st = stats[k], [, , f, price] = WCOL[k];
      if (WCOL[k][5] || (OWN && price)) return [k, sk === "n" ? FMT.count(rowsS.filter(s => WCOL[k][5] ? vfor(s) : val(k, s) != null).length) : FMT.DASH];
      if (sk === "n") return [k, `${FMT.count(st.n)} of ${FMT.count(rowsS.length)}`];
      return [k, st.n ? (sk === "spread" ? f(st.spread, s => s).replace(/^[+−]/, "") : f(st[sk], {})) : FMT.DASH]; })]), cells: {} }));
  return `<section class="panel" id="wtable"><div class="ctlline t-label" role="group" aria-label="Table controls"><button class="act" type="button" data-act="wcols">Columns (${keys.length})</button>
      <button class="act" type="button" data-act="wcopy">Copy table</button><span class="t-label sub" id="wcopied" aria-live="polite"></span></div>
    ${dataTable({ cols, rows: body, foot, cls: "wtab", label: "Watchlist table", sortK: WT.sort, sortDir: WT.dir, sortAct: "wsort" })}
    <p class="t-label sub">The summary skips blanks; Count says how many had a figure. Copy puts exactly this table on the clipboard as tab-separated text for Excel – nothing is uploaded.</p></section>`;
}
const VG_ORDER = ["buy", "acc", "hold", "trim", "avoid"];
function summaryStatsFor(keys, rows, val) { return Object.fromEntries(keys.map(k => [k, WCOL[k][5] ? { n: 0 } : summaryStats(rows.map(s => val(k, s)))])); }
function wcolsSheet() {
  const on = wcols(), off = Object.keys(WCOL).filter(k => !on.includes(k));
  sheet(`<h2>Columns</h2><p class="t-label sub">Tick the columns to show; drag a row or use ↑ ↓ to change the order. Saved in this browser and in Backup.</p>
    <div class="wcolist" id="wcolist">${[...on, ...off].map((k, i) => `<div class="horow${on.includes(k) ? "" : " off"}" data-wk="${k}" draggable="true"><span class="dragh" aria-hidden="true">${ic("more")}</span>
      <label class="gi sw hon"><input type="checkbox" data-wcol="${k}"${on.includes(k) ? " checked" : ""}><span class="gt">${esc(WCOL[k][0])}</span></label>
      <button class="act" type="button" data-wmove="${k}" data-d="-1" aria-label="Move ${esc(WCOL[k][0])} up">↑</button><button class="act" type="button" data-wmove="${k}" data-d="1" aria-label="Move ${esc(WCOL[k][0])} down">↓</button></div>`).join("")}</div>
    <div class="btnrow"><button class="act" type="button" data-wreset="1">Reset to the 6 default columns</button><button class="act big" type="button" data-close>Done</button></div>`);
}
function wcolsSave(order) { USER.wcols = order.filter(k => WCOL[k]); persist(); }
{ const d = document.getElementById("sheet");
  const cur = () => [...d.querySelectorAll("#wcolist [data-wk]")].map(r => r.dataset.wk), onKeys = () => cur().filter(k => d.querySelector(`[data-wcol="${k}"]`).checked);
  d.addEventListener("change", e => { if (!e.target.matches("[data-wcol]")) return; e.target.closest(".horow").classList.toggle("off", !e.target.checked); wcolsSave(onKeys()); if (parseHash().name === "watchlist") render(true); });
  d.addEventListener("click", e => {
    const m = e.target.closest("[data-wmove]"); if (m) { const o = cur(), i = o.indexOf(m.dataset.wmove), j = i + +m.dataset.d; if (j < 0 || j >= o.length) return;
      const row = d.querySelector(`[data-wk="${m.dataset.wmove}"]`), other = d.querySelector(`[data-wk="${o[j]}"]`); if (+m.dataset.d < 0) other.before(row); else other.after(row);
      wcolsSave(onKeys()); if (parseHash().name === "watchlist") render(true); return; }
    if (e.target.closest("[data-wreset]")) { USER.wcols = []; persist(); wcolsSheet(); if (parseHash().name === "watchlist") render(true); } });
  let dragK = null;
  d.addEventListener("dragstart", e => { const r = e.target.closest("[data-wk]"); if (r) { dragK = r.dataset.wk; try { e.dataTransfer.setData("text/plain", dragK); } catch (x) {} } });
  d.addEventListener("dragover", e => { if (dragK && e.target.closest("[data-wk]")) e.preventDefault(); });
  d.addEventListener("drop", e => { const r = e.target.closest("[data-wk]"); if (!dragK || !r || r.dataset.wk === dragK) return; e.preventDefault();
    const src = d.querySelector(`[data-wk="${dragK}"]`), after = e.clientY > r.getBoundingClientRect().top + r.offsetHeight / 2; after ? r.after(src) : r.before(src);
    dragK = null; wcolsSave(onKeys()); if (parseHash().name === "watchlist") render(true); });
}
function tableTSV(table) { return [...table.querySelectorAll("tr")].map(tr => [...tr.children].map(c => c.innerText.replace(/\s+/g, " ").replace(/\t/g, " ").trim()).join("\t")).join("\n"); }

// ---- #77 A: the Watchlist feed – Upcoming · News · Big changes · Filings · Transcripts, newest first, for your saved stocks ----
const FEED_SECS = [["upcoming", "Upcoming"], ["news", "News"], ["changes", "Big changes"], ["filings", "Filings"], ["transcripts", "Transcripts"]];
const FD = { sec: "", port: false };
const FEED_SEEN = "screener.feed.seen";
const daysTo = d => Math.round((new Date(d + "T00:00:00") - new Date(TODAY + "T00:00:00")) / 864e5);
function feedItems(syms) {
  const set = new Set(syms), out = [], M = S.market || {};
  const KIND = { results: "Results", "board meeting": "Board meeting", dividend: "Ex-dividend", split: "Split", bonus: "Bonus", "corporate action": "Corporate action" };
  (M.coming || []).filter(x => x.s && set.has(x.s)).forEach(x => out.push({ sec: "upcoming", d: x.d, sym: x.s, line: `${KIND[x.k] || x.k}${x.t && x.k !== "results" ? ": " + x.t : ""}`, tab: x.k === "results" || x.k === "board meeting" ? "docs" : "owners" }));
  syms.forEach(sym => { const s = BY[sym]; if (!s) return;
    (s.dv || []).filter(d => d[0] > TODAY && !out.some(o => o.sym === sym && o.sec === "upcoming" && o.d === d[0])).forEach(d =>
      out.push({ sec: "upcoming", d: d[0], sym, line: `Ex-dividend ₹${FMT.num(d[2], 2)} a share${d[1] && d[1] !== d[0] ? ` (record date ${FMT.date(d[1])})` : ""}`, tab: "owners" }));
    // big changes
    const H = VH(), ch = H && (H.changes || []).find(c => c.s === sym), wv = USER.watch.find(x => x.sym === sym);
    if (wv && s.vc && s.vc[0] > wv.saved) out.push({ sec: "changes", d: s.vc[0], sym, line: thenNowText(wv, s) + (s.vc[4] ? " – " + s.vc[4] : ""), tab: "summary" });   // #83 M7
    else if (ch) out.push({ sec: "changes", d: H.tonight, sym, line: `Verdict ${vgName(ch.f)} → ${vgName(ch.t)}${ch.why && ch.why[0] ? " – " + ch.why[0] : ""}`, tab: "summary" });
    (s.nf || []).filter(n => n.sev === "red" || n.sev === "high").forEach(n => out.push({ sec: "changes", d: n.dt, sym, line: `New red flag: ${n.t}`, tab: "news" }));
    const pq = s.s3 && s.s3.own && s.s3.own.pledge && s.s3.own.pledge.quarters;
    if (pq && pq.length >= 2 && pq[pq.length - 1].p - pq[pq.length - 2].p > 2) out.push({ sec: "changes", d: pq[pq.length - 1].q, sym, line: `Promoter pledge up ${FMT.num(pq[pq.length - 1].p - pq[pq.length - 2].p, 1)} points to ${FMT.pctPlain(pq[pq.length - 1].p, 1)}`, tab: "owners" });
    const pr = s.s3 && s.s3.own && s.s3.own.promoter;
    if (pr && pr.chg_1q != null && pr.chg_1q < -2) out.push({ sec: "changes", d: (pr.quarters[pr.quarters.length - 1] || {}).q || TODAY, sym, line: `Promoter stake down ${FMT.num(-pr.chg_1q, 1)} points in a quarter`, tab: "owners" });
    ((s.s3 && s.s3.tl) || []).filter(e => e.ty === "auditor" && /resign/i.test((e.ti || "") + " " + (e.w || ""))).slice(0, 1).forEach(e => out.push({ sec: "changes", d: e.d, sym, line: "Auditor resigned", tab: "news" }));
    if (s.fund && s.fund.quality && s.fund.quality.rating_downgrade) out.push({ sec: "changes", d: s.date || TODAY, sym, line: "Credit rating downgraded (last 12 months)", tab: "health" });
    const w = USER.watch.find(x => x.sym === sym), fv = fvOf(s);
    if (w && w.px && fv && s.close) { const g0 = (w.px / fv - 1) * 100, g1 = (s.close / fv - 1) * 100;
      [-25, 25].forEach(b => { if ((g0 - b) * (g1 - b) < 0 || (g0 !== b && g1 === b)) out.push({ sec: "changes", d: s.date || TODAY, sym,
        line: `Price crossed ${b < 0 ? "25% below" : "25% above"} the ⭐ fair value since you saved it (now ${FMT.pct(g1, 0)})`, tab: "value" }); }); }
    // filings + transcripts (the #76 Documents list)
    (s.docs || []).slice(0, 12).forEach(d => out.push({ sec: ["transcript", "concall_av"].includes(d[1]) ? "transcripts" : "filings", d: d[0], sym, line: `${docName(d[1])}: ${d[2]}`, tab: "docs", url: d[3] }));
  });
  return out.sort((a, b) => (a.sec === "upcoming" && b.sec === "upcoming" ? (a.d < b.d ? -1 : 1) : (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)));
}
function feedHTML() {
  const held = new Set(USER.tx.map(t => t.sym)), syms = [...new Set([...USER.watch.map(w => w.sym), ...(FD.port ? [] : [])])].filter(x => !FD.port || held.has(x));
  const scope = FD.port ? [...held].filter(x => BY[x]) : syms;
  ensureMine(scope, "watchlist");
  const seen = prefGet(FEED_SEEN, ""), items = feedItems(scope).filter(x => !FD.sec || x.sec === FD.sec);
  const by = Object.fromEntries(FEED_SECS.map(([k]) => [k, items.filter(x => x.sec === k)]));
  const row = x => `<a class="frow" href="${stockHref(x.sym)}/${x.tab}"${x.sec !== "upcoming" && seen && x.d > seen ? ' data-unread="1"' : ""}>${x.sec !== "upcoming" && seen && x.d > seen ? `<span class="udot" aria-label="new since your last visit"></span>` : ""}
    <span class="t-label num">${esc(FMT.date(x.d))}${x.sec === "upcoming" ? ` · ${daysTo(x.d) <= 0 ? "today" : daysTo(x.d) === 1 ? "tomorrow" : `in ${daysTo(x.d)} days`}` : ""}</span><b>${esc(x.sym)}</b><span class="fl1">${esc(x.line)}</span></a>`;
  const sec = ([k, nm]) => { if (FD.sec && FD.sec !== k) return "";
    if (k === "news") return `<section class="panel fsec"><h2>News</h2><p class="sub">News isn't connected – the screener has no news source (no paid feeds, no scraping). Filings and results from the exchange are below.</p></section>`;
    return `<section class="panel fsec"><h2>${nm}</h2>${by[k].length ? `<div class="flist">${by[k].slice(0, 40).map(row).join("")}</div>` : `<p class="sub">${FEED_EMPTY[k]}</p>`}</section>`; };
  setTimeout(() => prefSet(FEED_SEEN, TODAY), 1500);                      // the unread dots clear after you've seen them
  return `<div class="ctlline t-label" role="group" aria-label="Feed filters">${[["", "All"], ...FEED_SECS].map(([k, nm]) => `<button class="chip${FD.sec === k ? " on" : ""}" type="button" data-act="fdsec" data-v="${k}" aria-pressed="${FD.sec === k}">${nm}</button>`).join("")}
      <label class="ctl"><input type="checkbox" data-fdport${FD.port ? " checked" : ""}>Only my portfolio</label></div>
    ${scope.length ? FEED_SECS.map(sec).join("") : `<section class="panel"><p class="sub">${FD.port ? "No holdings yet – add one on the Portfolio tab." : "Save stocks to your Watchlist and their results dates, dividends, big changes, filings and concall transcripts appear here."}</p></section>`}
    <p class="t-label sub">Upcoming: NSE event calendar and corporate actions. Big changes: tonight's verdict log, red-flag filings, shareholding, auditor and rating checks, and the ⭐ fair value. Filings and transcripts: the exchange's own files (Documents tab).</p>`;
}
const FEED_EMPTY = { upcoming: "No results dates, board meetings or ex-dividend dates for these stocks in the coming days.", changes: "No big changes – no verdict move, new red flag, pledge or promoter jump, auditor resignation, rating downgrade or ±25% fair-value crossing.",
  filings: "No filings in the list yet for these stocks.", transcripts: "No concall transcripts or recordings in the list yet." };
function wlViewSwitch(v) {
  const unread = prefGet(FEED_SEEN, "") && feedItems(USER.watch.map(w => w.sym)).some(x => x.sec !== "upcoming" && x.d > prefGet(FEED_SEEN, ""));
  return `<nav class="chiprow" aria-label="Watchlist view"><a class="chip${v !== "feed" ? " on" : ""}" href="#/watchlist" aria-current="${v !== "feed" ? "page" : "false"}">List</a><a class="chip${v === "feed" ? " on" : ""}" href="#/watchlist?v=feed" aria-current="${v === "feed" ? "page" : "false"}">Feed${unread ? ` <span class="udot" aria-label="new items"></span>` : ""}</a></nav>`;
}

// ---- #77 B: "My model" – your own what-if valuation (Bull / Base / Bear); never feeds a rule, score or ghost ----
const MM_YEARS = [3, 5, 7];
const isFinStock = s => { const st = s.v4 && s.v4.v12 && s.v4.v12.st; return st === "Lender" || st === "Insurer" || /bank|nbfc|insurance/.test((s.fund && s.fund.group) || ""); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function mmAuto(s) {
  const fin = isFinStock(s), h = (s.fund && s.fund.history) || {}, m = (s.fund && s.fund.metrics) || {}, va = (s.v4 && s.v4.va && s.v4.va.m) || {};
  const last = o => { const ys = Object.keys(o || {}).filter(y => o[y] != null).sort(); return ys.length ? o[ys[ys.length - 1]] : null; };
  const shares = s.mcap_cr && s.close ? s.mcap_cr * 1e7 / s.close : null;
  if (fin) { const g5 = gmVal(s, "bv", "c5"), g3 = gmVal(s, "bv", "c3"), g = g5.v ?? g3.v;
    const pb = (va.pb_hist && va.pb_hist.in && va.pb_hist.in.median) || s.pb;
    return { fin, base: m.equity_cr ?? last(h.equity_cr), g: g == null ? null : clamp(g, 0, 20), gSrc: g5.v != null ? "5-yr book-value CAGR" : g3.v != null ? "3-yr book-value CAGR (5 years not on file yet)" : "no history",
      mult: pb == null ? null : clamp(pb, 0.5, 8), mSrc: va.pb_hist && va.pb_hist.in ? `its own median P/B since ${va.pb_hist.in.from}` : "today's P/B (no history)", n: 5, shares, price: s.close }; }
  const g5 = gmVal(s, "sales", "c5"), g3 = gmVal(s, "sales", "c3"), g = g5.v ?? g3.v;
  const R = h.revenue_cr || {}, P = h.pat_cr || {}, mg = Object.keys(R).sort().slice(-5).filter(y => R[y] > 0 && P[y] != null).map(y => P[y] / R[y] * 100);
  const pe = (va.pe_hist && va.pe_hist.in && va.pe_hist.in.median) || s.pe;
  return { fin, base: last(R), g: g == null ? null : clamp(g, 0, 20), gSrc: g5.v != null ? "5-yr sales CAGR" : g3.v != null ? "3-yr sales CAGR (5 years not on file yet)" : "no history",
    m: mg.length ? summaryStats(mg).median : null, mgSrc: `median of the last ${mg.length} years`, mult: pe == null ? null : clamp(pe, 8, 40),
    mSrc: va.pe_hist && va.pe_hist.in ? `its own median P/E since ${va.pe_hist.in.from}` : "today's P/E (no history)", n: 5, shares, price: s.close };
}
// the maths (tests/review77_page.js checks it against hand-worked cases)
function mmCalc(o) {
  if (![o.base, o.g, o.mult, o.n, o.shares, o.price].every(x => x != null && isFinite(x)) || (!o.fin && o.m == null)) return null;
  const fut = o.base * Math.pow(1 + o.g / 100, o.n), val = o.fin ? fut * o.mult : fut * (o.m / 100) * o.mult;      // ₹ crore
  const target = val * 1e7 / o.shares, ret = (Math.pow(target / o.price, 1 / o.n) - 1) * 100;
  return { fut, profit: o.fin ? null : fut * o.m / 100, target, ret };
}
const MM_SPREAD = { g: 0.25, mult: 0.15 };
function mmScen(base, saved) {
  const sv = saved || {}, b = Object.assign({}, base, sv.base || {});
  const mk = (k, sgn) => Object.assign({}, b, { g: b.g * (1 + sgn * MM_SPREAD.g), mult: b.mult * (1 + sgn * MM_SPREAD.mult) }, (sv[k] || {}));
  return { bull: mk("bull", 1), base: b, bear: mk("bear", -1) };
}
function myModelPanel(s) {
  const auto = mmAuto(s), saved = (USER.models || {})[s.symbol], sc = mmScen(auto, saved), fin = auto.fin;
  const fv = fvOf(s), n = sc.base.n, yEnd = +String(TODAY).slice(0, 4) + n;
  const res = Object.fromEntries(Object.entries(sc).map(([k, o]) => [k, mmCalc(Object.assign({}, o, { n }))]));
  const inp = (k, f, step) => Object.fromEntries(["bull", "base", "bear"].map(c => [c, `<input class="mmin" type="number" inputmode="decimal" step="${step}" data-mm="${c}.${f}" value="${sc[c][f] == null ? "" : FMT.raw(sc[c][f], 2)}" aria-label="${k} – ${c}">`]));
  const rows = [
    { raw: { what: fin ? "Book value growth % a year" : "Sales growth % a year", ...inp("growth", "g", 0.5) } },
    ...(fin ? [] : [{ raw: { what: "Net profit margin %", ...inp("margin", "m", 0.5) } }]),
    { raw: { what: fin ? "Exit P/B" : "Exit P/E", ...inp("exit multiple", "mult", 0.5) } },
    { cls: "est", raw: { what: `Target price in ${yEnd}`, ...Object.fromEntries(Object.entries(res).map(([k, r]) => [k, r ? inr(r.target) : FMT.DASH])) } },
    { cls: "est", raw: { what: "Yearly return", ...Object.fromEntries(Object.entries(res).map(([k, r]) => [k, r ? moveNum(r.ret, FMT.pct(r.ret, 1)) : FMT.DASH])) } },
    { cls: "est", raw: { what: "vs ⭐ fair value", ...Object.fromEntries(Object.entries(res).map(([k, r]) => [k, r && fv ? FMT.pct((r.target / fv - 1) * 100, 0) : FMT.DASH])) } }];
  return `<section class="panel" id="mymodel"><h2>My model</h2>
    <p class="mini">Your what-if. <b>The official verdict still follows Rules v1.0</b> – nothing here feeds any rule, score or model portfolio.</p>
    <div class="ctlline t-label" role="group" aria-label="Years">${MM_YEARS.map(y => `<button class="chip${n === y ? " on" : ""}" type="button" data-act="mmyears" data-v="${y}" data-sym="${esc(s.symbol)}" aria-pressed="${n === y}">${y} years</button>`).join("")}
      <button class="act" type="button" data-act="mmreset" data-sym="${esc(s.symbol)}">Reset to auto</button></div>
    ${dataTable({ cols: [{ k: "what", h: "" }, { k: "bull", h: "Bull" }, { k: "base", h: "Base" }, { k: "bear", h: "Bear" }], rows: rows.map(r => Object.assign({ cells: {} }, r)), cls: "mmtab", label: "My model" })}
    <p class="t-label sub">Base starts as <b>auto, change me</b>: ${fin ? `book-value growth = ${esc(auto.gSrc)}, capped 0–20%; exit P/B = ${esc(auto.mSrc)}` : `sales growth = ${esc(auto.gSrc)}, capped 0–20%; margin = ${esc(auto.mgSrc)}; exit P/E = ${esc(auto.mSrc)}, capped 8–40`}. Bull / Bear: growth ±25% and the exit multiple ±15% (edit any box).
      ${fin ? "Future book value = book value × (1 + growth)^years; target = future book value × exit P/B ÷ shares today." : "Future sales = sales × (1 + growth)^years; future profit = future sales × margin; target = future profit × exit P/E ÷ shares today."}
      Shares held constant (buybacks / dilution not modelled); dividends left out. Yearly return = (target ÷ today's price)^(1/years) − 1. ${saved ? "Saved in this browser (and in Backup)." : ""}</p></section>`;
}
function mmReset(sym) { if (USER.models) delete USER.models[sym]; persist(); const b = document.getElementById("mymodel"); if (b) b.outerHTML = myModelPanel(BY[sym]); toast("My model reset to auto"); }
function mmSave(sym, path, v) {
  USER.models = USER.models || {}; const m = USER.models[sym] = USER.models[sym] || {};
  const [c, f] = path.split("."); if (c === "base" && f === "n") m.base = Object.assign({}, m.base, { n: +v });
  else { m[c] = Object.assign({}, m[c], { [f]: v === "" ? undefined : +v }); if (v === "") delete m[c][f]; }
  persist();
}
screenEl.addEventListener("change", e => { if (e.target.matches("[data-fdport]")) { FD.port = e.target.checked; render(true); } });
screenEl.addEventListener("change", e => { const i = e.target.closest("[data-mm]"); if (!i) return; const sym = parseHash().arg; mmSave(sym, i.dataset.mm, i.value);
  const y = scrollY, box = i.closest("#mymodel"); if (box && box.isConnected) { try { box.outerHTML = myModelPanel(BY[sym]); } catch (x) {} } scrollTo(0, y); });

// ---- #77 C: Market factor moves + topic feeds ----
function factorRowHTML(m) {
  const F = m.factors; if (!F) return "";
  return `<section class="panel" id="factors"><h2>Factor moves</h2><div class="krows">${F.map(f => `<div class="krow"><span class="fkl"><b>${esc(f.name)}</b><span class="t-label sub">${esc(f.line)}</span></span>
      ${f.missing ? `<span class="t-label sub">not in tonight's NSE file</span>` : `<span class="kv"><span class="num">${moveNum(f.pct, FMT.pct(f.pct, 2))}</span>
      <details class="fmore"><summary class="t-label">1M · 1Y</summary><span class="t-label">1 week ${f.w1 == null ? "–" : moveNum(f.w1, FMT.pct(f.w1, 1))} · 1 month ${f.m1 == null ? "–" : moveNum(f.m1, FMT.pct(f.m1, 1))} · 1 year ${f.y1 == null ? "– (history still filling)" : moveNum(f.y1, FMT.pct(f.y1, 1))}</span></details></span>`}</div>`).join("")}</div>
    <p class="t-label sub">NSE factor indices (all-indices file). Each holds 30–50 stocks picked by one trait. <a href="#/feeds">Topic feeds ›</a></p></section>`;
}
const FEED_TOPICS = [["results", "Results"], ["order_win", "Order win"], ["fundraise", "Fund raising"], ["buyback", "Buyback"], ["dividend", "Dividend"], ["auditor", "Auditor change"],
  ["kmp", "Director/KMP change"], ["pledge", "Pledge"], ["rating", "Credit rating"], ["acquisition", "Acquisition"], ["regulatory", "Regulatory action"], ["capex", "Capacity expansion"]];
const FEED_MAX_SAVED = 10;
const FS = { cur: null };
function feedScope(sc) {
  if (sc === "watch") return new Set(USER.watch.map(w => w.sym));
  if (sc === "port") return new Set(USER.tx.map(t => t.sym));
  if (sc && sc.startsWith("sector:")) return new Set(S.stocks.filter(s => skOf(s) === sc.slice(7)).map(s => s.symbol));
  return new Set(S.stocks.filter(s => !s.ow).map(s => s.symbol));
}
const scopeName = sc => sc === "watch" ? "My watchlist" : sc === "port" ? "My portfolio" : sc && sc.startsWith("sector:") ? ((SECT[sc.slice(7)] || {}).label || sc.slice(7)) : "Nifty 500";
function feedsScreen() {
  const F = USER.feeds || [], cur = F.find(f => f.id === FS.cur) || F[0], rows = (S.feed && S.feed.rows) || [];
  const list = cur ? (() => { const set = feedScope(cur.scope), tp = new Set(cur.topics); return rows.filter(r => tp.has(r[2]) && set.has(r[1])); })() : [];
  const tname = k => (FEED_TOPICS.find(x => x[0] === k) || [k, k])[1];
  return `<button class="back" type="button" data-back="#/market">${ic("back")} Back</button><div class="scr-h"><h1>Topic feeds</h1></div>
    <p class="sub">Your saved feeds over NSE announcements of the last ${FMT.count((S.feed && S.feed.days) || 45)} days: topics × where to look. Saved in this browser (and in Backup).</p>
    ${F.length ? `<nav class="chiprow" aria-label="Saved feeds">${F.map(f => `<button class="chip${cur && f.id === cur.id ? " on" : ""}" type="button" data-act="fsel" data-v="${esc(f.id)}" aria-pressed="${cur && f.id === cur.id}">${esc(f.name)}</button>`).join("")}</nav>` : ""}
    <div class="btnrow">${F.length < FEED_MAX_SAVED ? `<button class="act primary" type="button" data-act="fnew">+ New feed</button>` : `<span class="t-label sub">Ten feeds is the most you can save.</span>`}
      ${cur ? `<button class="act" type="button" data-act="fedit" data-v="${esc(cur.id)}">Edit</button><button class="act" type="button" data-act="fmove" data-v="${esc(cur.id)}" data-d="-1" aria-label="Move left">↑</button><button class="act" type="button" data-act="fmove" data-v="${esc(cur.id)}" data-d="1" aria-label="Move right">↓</button><button class="act" type="button" data-act="fdel" data-v="${esc(cur.id)}">Delete</button>` : ""}</div>
    ${cur ? `<section class="panel"><h2>${esc(cur.name)}</h2><p class="t-label sub">${cur.topics.map(tname).join(" · ")} — ${esc(scopeName(cur.scope))}</p>
      ${list.length ? `<div class="flist">${list.slice(0, 80).map(r => `<a class="frow" href="${stockHref(r[1])}/news"><span class="t-label num">${esc(FMT.date(r[0]))}</span><b>${esc(r[1])}</b><span class="fl1"><span class="dchip t-label">${esc(tname(r[2]))}</span> ${esc(r[3] || "")}</span></a>`).join("")}</div>`
        : `<p class="sub">Nothing for these topics in the last ${FMT.count((S.feed && S.feed.days) || 45)} days.</p>`}</section>`
      : `<section class="panel"><p class="sub">No feeds yet. Make one, e.g. <b>Pledge</b> across the <b>Nifty 500</b>, or <b>Order win</b> in <b>Capital goods</b>.</p></section>`}
    <p class="t-label sub">Source: NSE corporate announcements (links and titles only).</p>`;
}
function feedSheet(id) {
  const f = (USER.feeds || []).find(x => x.id === id) || { id: "", name: "", topics: [], scope: "watch" };
  const secs = Object.entries(SECT || {}).map(([k, v]) => [k, v.label]);
  sheet(`<h2>${f.id ? "Edit feed" : "New feed"}</h2><form id="feedform" data-id="${esc(f.id)}">
    <label class="fl">Name<input name="name" maxlength="40" required value="${esc(f.name)}" placeholder="e.g. Pledges in Nifty 500"></label>
    <fieldset class="bpick"><legend class="t-label sub">Topics</legend>${FEED_TOPICS.map(([k, nm]) => `<label class="gi sw"><input type="checkbox" name="tp" value="${k}"${f.topics.includes(k) ? " checked" : ""}><span class="gt">${nm}</span></label>`).join("")}</fieldset>
    <label class="fl">Where to look<select name="scope"><option value="watch"${f.scope === "watch" ? " selected" : ""}>My watchlist</option><option value="port"${f.scope === "port" ? " selected" : ""}>My portfolio</option>
      <option value="n500"${f.scope === "n500" ? " selected" : ""}>Nifty 500</option>${secs.map(([k, nm]) => `<option value="sector:${esc(k)}"${f.scope === "sector:" + k ? " selected" : ""}>${esc(nm)}</option>`).join("")}</select></label>
    <div class="btnrow"><button class="act big primary" type="submit">Save feed</button><button class="act" type="button" data-close>Cancel</button></div></form>`);
  document.getElementById("feedform").addEventListener("submit", e => { e.preventDefault(); const fm = e.target, tp = [...fm.querySelectorAll("[name=tp]:checked")].map(x => x.value);
    if (!tp.length) { toast("Pick at least one topic"); return; }
    USER.feeds = USER.feeds || []; const rec = { id: fm.dataset.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: fm.name.value.trim().slice(0, 40) || "My feed", topics: tp, scope: fm.scope.value };
    const i = USER.feeds.findIndex(x => x.id === rec.id); if (i >= 0) USER.feeds[i] = rec; else if (USER.feeds.length < FEED_MAX_SAVED) USER.feeds.push(rec);
    FS.cur = rec.id; persist(); closeSheet(); render(true); });
}

// ---- #78 A: tracked big investors (More → Investors; side menu → Find ideas → Investors) ----
const INV = () => S.investors || null;
const CHG_WORD = { new: "New", added: "Added", cut: "Cut", gone: "Gone – below 1% or sold" };
const invName = id => ((INV() && INV().list.find(x => x.id === id)) || { name: id }).name;
function investorsOf(sym) { const I = INV(); if (!I) return []; return Object.entries(I.hold || {}).filter(([, h]) => h.some(r => r[0] === sym)).map(([id]) => id); }
function investorsScreen(id) {
  const I = INV();
  const head = `<button class="back" type="button" data-back="${id ? "#/investors" : "#/more"}">${ic("back")} Back</button>`;
  if (!I) return head + `<div class="scr-h"><h1>Investors</h1></div><section class="panel"><p class="sub">No data yet – the quarterly shareholding filings haven't been read. They fill in over the next nights (at most 1,500 a night).</p></section>`;
  if (!id) {
    const rows = I.list.map(x => ({ id: x.id, name: x.name, n: (I.hold[x.id] || []).length, c: (I.chg[x.id] || []).length })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return head + `<div class="scr-h"><h1>Investors</h1></div>
      <p class="sub">Well-known Indian investors and the listed companies where they hold <b>more than 1%</b> – from each company's quarterly shareholding filing. Holdings under 1% aren't disclosed, so the list can't see them. List kept in <code>docs/investors.json</code>.</p>
      ${invProgress()}
      <div class="glist">${rows.map(r => `<a href="#/investors/${encodeURIComponent(r.id)}"><span class="gt">${esc(r.name)}<span class="gs">${r.n ? `${FMT.count(r.n)} holding${r.n === 1 ? "" : "s"} above 1%` : invNone()}${r.c ? ` · ${FMT.count(r.c)} change${r.c === 1 ? "" : "s"} this quarter` : ""}</span></span></a>`).join("")}</div>
      <p class="t-label sub">${esc(I.src || "")} · latest quarter ${esc(I.q ? FMT.date(I.q) : "–")} · ${FMT.count(I.read || 0)} filings read.</p>`;
  }
  const h = I.hold[id] || [], ch = I.chg[id] || [], OWN = OWNER();         // #83 J: holdings outside our list too (all NSE equities)
  const px = r => BY[r[0]] && BY[r[0]].close && r[2] ? r[2] * BY[r[0]].close : null;
  const tbl = h.length ? dataTable({ cols: [{ k: "s", h: "Stock" }, { k: "p", h: "% held" }, { k: "v", h: "Value at today's close" }, { k: "q", h: "Quarter" }],
    rows: h.map(r => ({ cells: {}, raw: { s: invStock(r[0]), p: FMT.pctPlain(r[1], 2), v: OWN ? omRow() : px(r) != null ? FMT.cr(px(r) / 1e7, 0) : FMT.DASH, q: esc(FMT.date(r[3])) } })),
    foot: [{ cells: {}, cls: "srow", raw: { s: "Total (stocks on our list)", p: "", v: OWN ? omRow() : FMT.cr(h.reduce((a, r) => a + (px(r) || 0), 0) / 1e7, 0), q: "" } }], cls: "invtab", label: "Holdings" }) : `<p class="sub">${invNone(true)}.</p>`;
  const groups = ["new", "added", "cut", "gone"].map(k => [k, ch.filter(c => c[1] === k)]).filter(([, l]) => l.length);
  return head + `<div class="scr-h"><h1>${esc(invName(id))}</h1></div>
    ${invProgress()}<section class="panel"><h2>Holdings above 1%</h2>${tbl}</section>
    <section class="panel"><h2>This quarter</h2>${groups.length ? groups.map(([k, l]) => `<h3 class="minor">${CHG_WORD[k]}</h3>${l.map(c => `<p class="mline">${invStock(c[0])} <span class="t-label sub">${c[2] != null ? FMT.pctPlain(c[2], 2) : "under 1%"} → ${c[3] != null ? FMT.pctPlain(c[3], 2) : "below 1% or sold"}</span></p>`).join("")}`).join("")
      : `<p class="sub">No change between the last two quarters read.</p>`}
      <p class="t-label sub">"Gone" means <b>below 1% or sold</b> – holdings under 1% aren't disclosed, so we can't tell which.</p></section>`;
}
// #83 J: progress while the back-fill runs, and names for stocks outside our list (from NSE's equity list)
function invProgress() { const p = INV() && INV().progress; if (!p || p.done) return "";
  return `<p class="mline invprog">Reading filings: ${FMT.count(p.read)} of ${FMT.count(p.total)} (about ${FMT.count(p.nights)} more night${p.nights === 1 ? "" : "s"}). Holdings appear as they're found.</p>`; }
function invNone(cap) { const p = INV() && INV().progress; const t = p && !p.done ? `not found in the filings read so far (${FMT.count(p.read)} of ${FMT.count(p.total)})` : "no holding above 1% found";
  return cap ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
function invStock(sym) { if (BY[sym]) return `<a href="${stockHref(sym)}">${esc(BY[sym].name)}</a>`;
  const n = (INV() && INV().names || {})[sym]; return `${esc(n || sym)} <span class="t-label sub">${esc(sym)} · not on our list</span>`; }
function invLine(s) {
  const ids = investorsOf(s.symbol); if (!ids.length) return "";
  return `<p class="mline invline">Held by ${FMT.count(ids.length)} tracked investor${ids.length === 1 ? "" : "s"} (above 1%): ${ids.map(id => `<a href="#/investors/${encodeURIComponent(id)}">${esc(invName(id))}</a>`).join(", ")}</p>`;
}

// ---- #78 B: Segments – sales and profit by business, stacked bars by year and the last 8 quarters (official XBRL) ----
const SEG_COL = ["var(--d-blue)", "var(--d-violet)", "var(--d-teal)", "var(--d-gold)", "var(--d-pink)", "color-mix(in srgb, var(--d-teal) 45%, var(--d-gold))", "color-mix(in srgb, var(--d-pink) 45%, var(--d-blue))"];
function segTab(s) { return s.fund && s.fund.st ? `<button class="chip${prefGet("screener.st.sheet", "pl") === "seg" ? " on" : ""}" type="button" data-act="stsheet" data-v="seg" aria-pressed="${prefGet("screener.st.sheet", "pl") === "seg"}">Segments</button>` : ""; }
function segBars(periods, idx, title, names) {
  if (!periods.length) return "";
  const W = 360, H = 170, L = 6, R = 6, T = 10, B = 22, n = periods.length, bw = Math.min(34, (W - L - R) / n * .6);
  const vals = periods.map(p => { let pos = 0, neg = 0; names.forEach(nm => { const v = (p.seg[nm] || [])[idx]; if (v > 0) pos += v; else if (v < 0) neg += v; });
    const o = idx === 0 ? p.other || 0 : 0; if (o > 0) pos += o; else neg += o; return [pos, neg]; });
  const hi = Math.max(1, ...vals.map(v => v[0])), lo = Math.min(0, ...vals.map(v => v[1])), Y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const X = i => L + (W - L - R) / n * (i + .5) - bw / 2;
  const bars = periods.map((p, i) => { let up = 0, dn = 0;
    const parts = names.map((nm, si) => [nm, (p.seg[nm] || [])[idx], SEG_COL[si % SEG_COL.length]]).concat(idx === 0 && p.other ? [["Unallocated / eliminations", p.other, "var(--ink-3)"]] : []);
    return parts.map(([nm, v, col]) => { if (v == null || !v) return ""; const a = v > 0 ? up : dn, b = a + v; if (v > 0) up = b; else dn = b;
      return `<rect data-series="${esc(nm)}" x="${FMT.coord(X(i))}" width="${FMT.coord(bw)}" y="${FMT.coord(Y(Math.max(a, b)))}" height="${FMT.coord(Math.max(1, Math.abs(Y(a) - Y(b))))}" style="fill:${col}"/>`; }).join("")
      + `<text class="fc-ax t-label" text-anchor="middle" x="${FMT.coord(X(i) + bw / 2)}" y="${H - 6}">${esc(p.label.replace(" FY", "·"))}</text>`; }).join("");
  const keys = names.map((nm, si) => kw(nm, SEG_COL[si % SEG_COL.length])).join(" · ") + (idx === 0 && periods.some(p => p.other) ? " · " + kw("Unallocated / eliminations", "var(--ink-3)") : "");
  return `<figure class="fchart segfig" data-chart="${esc(title)}"><figcaption class="fc-h"><span class="t-label">${keys} <span class="sub">${esc(title)}</span></span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}"><line class="fc-grid" x1="${L}" x2="${W - R}" y1="${FMT.coord(Y(0))}" y2="${FMT.coord(Y(0))}"/>${bars}</svg></figure>`;
}
function segmentsPanel(s) {
  const g = s.fund && s.fund.seg;
  if (!g || (!g.years.length && !g.quarters.length)) return `<p class="sub">This company doesn't file segment figures${g && g.failed && g.failed.length ? " we could check – its segment lines don't add up to its total revenue within 2%, so they're not shown (listed on More → Data quality)" : ""}.</p>`;
  const nm = ps => { const out = []; ps.forEach(p => Object.keys(p.seg).forEach(k => { if (!out.includes(k)) out.push(k); }));
    const last = ps[ps.length - 1] || { seg: {} }, size = k => /^others?$/i.test(k) ? -1e15 : ((last.seg[k] || [])[0] ?? -1e14);
    return out.sort((a, b) => size(b) - size(a)); };                      // biggest first, "Others" last
  const yN = nm(g.years), qN = nm(g.quarters);
  const d = g.driver;
  return `${g.years.length ? segBars(g.years, 0, "Sales by segment, by year (₹ crore)", yN) + segBars(g.years, 1, "Profit (segment result) by segment, by year (₹ crore)", yN) : ""}
    ${d ? `<p class="mline"><b>Biggest growth driver:</b> ${esc(d.name)} (${FMT.pct(d.g, 0)} ${d.years > 1 ? "a year" : "in the last year"})</p>` : ""}
    ${g.quarters.length ? segBars(g.quarters, 0, `Sales by segment, last ${g.quarters.length} quarters (₹ crore)`, qN) : ""}
    <p class="t-label sub">From the company's results filings on NSE (official XBRL, Ind AS 108 segment lines). Each period's segments add up to its total revenue within 2% – what's left is the grey "unallocated / eliminations" bar. A renamed or merged segment starts a new series (never joined by guess).${g.failed && g.failed.length ? ` ${FMT.count(g.failed.length)} period${g.failed.length === 1 ? "" : "s"} left out because they didn't add up.` : ""}</p>`;
}

// ---- #80: the World tab – foreign markets on their own page, never mixed with India ----
// Country data comes from its own files (data/world/<id>.json, data/world/<id>/<TICKER>.json) and loads only when World opens;
// the offline copy carries it inside. India screens never read it.
const W0 = () => S.world || { countries: [] };
const WD = { us: null, loading: false, err: null }, USFULL = {};
function worldUS() { const w = W0().us || {}; return w.stocks ? { market: w.market, holidays: w.holidays, stocks: w.stocks } : WD.us; }
function loadWorld() { const w = W0().us; if (!w || w.stocks || !w.file || WD.us || WD.loading || WD.err) return; WD.loading = true;
  fetch(`data/world/us.json`).then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))).then(j => { WD.us = j; }).catch(e => { WD.err = String(e && e.message || e); })
    .finally(() => { WD.loading = false; if (parseHash().name === "world") render(true); }); }
const USX = () => (worldUS() || {}).stocks || [];
const usRow = sym => USX().find(x => x.symbol === sym);
function loadUSStock(sym) { if (USFULL[sym]) return Promise.resolve(USFULL[sym]); const w = W0().us || {};
  if (w.stocks) { USFULL[sym] = w.stocks.find(x => x.symbol === sym) || null; return Promise.resolve(USFULL[sym]); }
  return fetch(`data/world/us/${stockFile(sym)}.json`).then(r => r.ok ? r.json() : null).then(j => { if (j) USFULL[sym] = j; return j; }).catch(() => null); }
// the ₹ / $ switch lives here only (World defaults to $); India never shows $
const WCUR_KEY = "screener.world.cur";
const CURR = () => prefGet(WCUR_KEY, "usd");
function fxAt(date) { const F = S.fx || {}, R = F.rates || {}; const ds = Object.keys(R).sort(); if (!ds.length) return null;
  let best = ds[0]; for (const d of ds) { if (d <= date) best = d; } return R[best]; }
const fxNow = () => { const F = S.fx || {}; return F.latest ? F.latest[1] : fxAt(TODAY); };
const usMoney = (usdM, date) => { if (usdM == null) return FMT.DASH; const a = Math.abs(usdM), sg = usdM < 0 ? FMT.MINUS : "";
  if (CURR() === "usd") return a >= 1e6 ? sg + "$" + FMT.num(a / 1e6, 2) + " tn" : sg + "$" + FMT.num(a / 1e3, 1) + " bn";       // $ amounts in bn / tn (no lakh grouping)
  const r = fxAt(date); return r ? FMT.cr(usdM * r / 10, 0) : FMT.DASH; };
const usCell = (usdM, date) => { if (usdM == null) return FMT.DASH; if (CURR() === "usd") return FMT.num(usdM / 1e3, 1); const r = fxAt(date); return r ? FMT.num(usdM * r / 10, 0) : FMT.DASH; };   // table cells: the unit is in the header
const usPrice = (usd, date) => { if (usd == null) return FMT.DASH; if (CURR() === "usd") return "$" + FMT.num(usd, 2); const r = fxAt(date); return r ? FMT.money(usd * r, 2) : FMT.DASH; };
const usd = x => x == null ? FMT.DASH : (x < 0 ? FMT.MINUS : "") + "$" + FMT.num(Math.abs(x), 2);
function curSwitch() { return `<div class="ctlline t-label" role="group" aria-label="Currency">${[["inr", "₹"], ["usd", "$"]].map(([k, nm]) => `<button class="chip${CURR() === k ? " on" : ""}" type="button" data-act="cur" data-v="${k}" aria-pressed="${CURR() === k}">${nm}</button>`).join("")}<span class="t-label sub">${CURR() === "usd" ? "US dollars" : "rupees at each date's USD/INR rate"} – ratios don't change</span></div>`; }
// the US world user data: its own storage key (+ Backup) – watchlist and portfolios separate from India
const WU_KEY = "screener.world.v1";
let WU = (() => { try { const o = JSON.parse(localStorage.getItem(WU_KEY) || "null"); if (o && typeof o === "object") return Object.assign({ watch: [], pfs: [], tx: [] }, o); } catch (e) {} return { watch: [], pfs: [], tx: [] }; })();
function saveWU() { try { localStorage.setItem(WU_KEY, JSON.stringify(WU)); } catch (e) {} }
const inUSWatch = sym => WU.watch.some(w => w.sym === sym);
// an experimental quality score for US stocks (0–100): the average percentile among the US list of ROCE, operating margin and
// low debt / equity. Labelled "experimental for US" wherever it is used (meter); never a verdict.
let USQ = null;
function usQuality(sym) {
  if (!USQ) { USQ = {}; const L = USX(), m = s => (s.fund && s.fund.metrics) || {};
    const pr = (k, hi) => { const v = L.map(s => m(s)[k]).filter(x => x != null); return x => x == null || v.length < 2 ? null : v.filter(y => hi ? y < x : y > x).length / (v.length - 1) * 100; };
    const a = pr("roce", true), b = pr("op_margin", true), c = pr("de", false);
    L.forEach(s => { const p = [a(m(s).roce), b(m(s).op_margin), c(m(s).de)].filter(x => x != null); USQ[s.symbol] = p.length >= 2 ? p.reduce((x, y) => x + y, 0) / p.length : null; }); }
  return USQ[sym] ?? null;
}
const usLook = () => new Proxy({}, { get: (_, sym) => { const s = usRow(sym); return s ? Object.assign({}, s, { sector: s.industry, v4: { q: usQuality(sym), rf: [] } }) : undefined; } });
// ---- C1–C3: the World screen
const WSORT = { move: ["Today's move", s => s.change_pct], mcap: ["Market cap", s => (s.fund.metrics || {}).mcap_usd_m], pe: ["P/E", s => (s.fund.metrics || {}).pe],
  roce: ["ROCE", s => (s.fund.metrics || {}).roce], cagr: ["Sales 3-yr CAGR", s => (s.fund.metrics || {}).sales_cagr3] };
const WF = { q: "", sec: "", sort: "mcap", view: "cards", c: "us" };
function worldScreen() {
  // review #84 C: India and the US only – a country appears when its docs/world/<id>.json says live; one country → no chip row
  const C = (W0().countries || []).filter(c => c.live), cur = C.find(c => c.id === WF.c) || C[0] || { id: "us", name: "US", live: true };
  const chips = C.length > 1 ? `<nav class="chiprow" aria-label="Countries">${C.map(c => `<button class="chip${c.id === cur.id ? " on" : ""}" type="button" data-act="wcountry" data-v="${esc(c.id)}" aria-pressed="${c.id === cur.id}">${esc(c.flag || "")} ${esc(c.name)}</button>`).join("")}</nav>` : "";
  const head = `<div class="scr-h"><h1>World</h1><span class="sub">US stocks – never mixed with India</span></div>${chips}`;
  const w = W0().us || {};
  if (!w.on) return head + `<section class="panel"><h2>US</h2><p class="sub">${esc(w.note || "US data is off: add the SEC_USER_AGENT secret in GitHub → Settings → Secrets and variables → Actions")}</p></section>` + worldPortfolioHTML();
  loadWorld();
  const D = worldUS();
  if (!D) return head + `<section class="panel"><p class="sub">${WD.err ? `Could not load the US data (${esc(WD.err)}).` : "Loading the US data…"}</p></section>`;
  return head + curSwitch() + usMarketHTML(D) + usListHTML(D) + usWatchHTML() + worldPortfolioHTML();
}
function usClosed(D) { const H = D.holidays || {}, us = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10), wd = new Date(us + "T12:00:00").getDay();
  return H[us] ? `US market closed today: ${H[us]}` : wd === 0 || wd === 6 ? "US market closed today: weekend" : ""; }
function usMarketHTML(D) {
  const M = D.market || {}, cl = usClosed(D), r = fxNow();
  return `<section class="panel" id="usmkt"><h2>US market today</h2>${cl ? `<p class="infobox">${esc(cl)}</p>` : ""}<div class="wrows">${(M.indices || []).map(x => `<div class="wkrow"><span class="fkl"><b>${esc(x.name)}</b><span class="t-label sub">${x.missing ? "not in tonight's data" : `${FMT.num(x.close, 2)} · ${esc(FMT.date(x.date))}`}</span></span>
      ${x.missing ? "" : `<span class="num">${moveNum(x.pct, FMT.pct(x.pct, 2))}</span><span class="t-label sub wfull">1 month ${x.m1 == null ? "–" : moveNum(x.m1, FMT.pct(x.m1, 1))} · 1 year ${x.y1 == null ? "–" : moveNum(x.y1, FMT.pct(x.y1, 1))}</span>`}</div>`).join("")}
      <div class="wkrow"><span class="fkl"><b>USD/INR</b><span class="t-label sub">${esc((S.fx && S.fx.src) || "")}</span></span><span class="num">${r ? "₹" + FMT.num(r, 2) : "–"}</span></div></div>
    <p class="t-label sub">${esc(M.src || "yfinance – single source, end of day")}.</p></section>`;
}
function usListHTML(D) {
  const q = WF.q.trim().toLowerCase(), secs = [...new Set(D.stocks.map(s => s.industry).filter(Boolean))].sort(), [, key] = WSORT[WF.sort] || WSORT.mcap, OWN = OWNER();
  let L = D.stocks.filter(s => (!q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) && (!WF.sec || s.industry === WF.sec));
  L = [...L].sort((a, b) => { const x = key(a), y = key(b); return x == null ? 1 : y == null ? -1 : y - x; });
  const m = s => s.fund.metrics || {};
  const body = WF.view === "table" ? dataTable({ cols: [{ k: "n", h: "Stock" }, { k: "p", h: "Price" }, { k: "c", h: "Today" }, { k: "m", h: "Market cap" }, { k: "e", h: "P/E" }, { k: "r", h: "ROCE" }, { k: "g", h: "Sales 3-yr CAGR" }],
      rows: L.map(s => ({ cells: {}, raw: { n: `<a href="#/world/us/${encodeURIComponent(s.symbol)}">${esc(s.name)}</a>`, p: OWN ? omRow() : usPrice(s.close, s.date), c: OWN ? omRow() : s.change_pct == null ? FMT.DASH : moveNum(s.change_pct, FMT.pct(s.change_pct, 2)),
        m: OWN ? omRow() : usMoney(m(s).mcap_usd_m, s.date), e: OWN ? omRow() : FMT.ratio(m(s).pe, 1), r: FMT.pctPlain(m(s).roce, 1), g: FMT.pctPlain(m(s).sales_cagr3, 1) } })), cls: "ustab", label: "US stocks" })
    : `<div class="flist">${L.map(s => `<a class="frow" href="#/world/us/${encodeURIComponent(s.symbol)}"><b>${esc(s.symbol)}</b><span class="fl1">${esc(s.name)} <span class="t-label sub">${esc(s.industry || "")}</span></span><span class="num">${OWN ? omRow() : usPrice(s.close, s.date) + " " + (s.change_pct == null ? "" : moveNum(s.change_pct, FMT.pct(s.change_pct, 2)))}</span></a>`).join("")}</div>`;
  return `<section class="panel" id="uslist"><h2>US stocks <span class="sub">${FMT.count(L.length)} of ${FMT.count(D.stocks.length)}</span></h2>
    <label class="fl">Find<input type="search" data-wq value="${esc(WF.q)}" placeholder="name or ticker, e.g. AAPL" autocomplete="off"></label>
    <nav class="chiprow" aria-label="Sectors"><button class="chip${WF.sec ? "" : " on"}" type="button" data-act="wsec" data-v="" aria-pressed="${!WF.sec}">All</button>${secs.map(x => `<button class="chip${WF.sec === x ? " on" : ""}" type="button" data-act="wsec" data-v="${esc(x)}" aria-pressed="${WF.sec === x}">${esc(x)}</button>`).join("")}</nav>
    <div class="ctlline t-label"><label class="ctl">Sort<select data-wsort>${Object.entries(WSORT).map(([k, [nm]]) => `<option value="${k}"${WF.sort === k ? " selected" : ""}>${nm}</option>`).join("")}</select></label>
      ${[["cards", "Cards"], ["table", "Table"]].map(([k, nm]) => `<button class="chip${WF.view === k ? " on" : ""}" type="button" data-act="wview" data-v="${k}" aria-pressed="${WF.view === k}">${nm}</button>`).join("")}</div>
    ${body}<p class="t-label sub">S&amp;P 100 · no verdict for US stocks – our rules are tested on Indian stocks only.</p></section>`;
}
function usWatchHTML() {
  const L = WU.watch.filter(w => usRow(w.sym));
  return `<section class="panel" id="uswatch"><h2>US watchlist <span class="sub">${FMT.count(L.length)}</span></h2>${L.length ? `<div class="flist">${L.map(w => { const s = usRow(w.sym), ch = w.px && s.close ? (s.close / w.px - 1) * 100 : null;
      return `<a class="frow" href="#/world/us/${encodeURIComponent(w.sym)}"><b>${esc(w.sym)}</b><span class="fl1">${esc(s.name)} <span class="t-label sub">saved ${esc(FMT.date(w.saved))} at ${usd(w.px)}</span></span><span class="num">${OWNER() ? omRow() : ch == null ? "" : moveNum(ch, FMT.pct(ch, 1))}</span></a>`; }).join("")}</div>`
    : `<p class="sub">Tap ☆ on a US stock page to save it here. The Indian Watchlist stays separate.</p>`}</section>`;
}
// ---- C6: World portfolios (US) – cost in $ and in ₹ at each buy date's rate, so currency gains show separately
function wPos(pfId) {
  const by = {}; WU.tx.filter(t => t.pf === pfId).sort((a, b) => a.date < b.date ? -1 : 1).forEach(t => { const p = by[t.sym] = by[t.sym] || { sym: t.sym, qty: 0, cost: 0, costR: 0 };
    const r = fxAt(t.date) || fxNow() || 0;
    if (t.side === "sell") { const f = p.qty ? Math.min(1, t.qty / p.qty) : 0; p.cost *= 1 - f; p.costR *= 1 - f; p.qty -= t.qty; }
    else { p.qty += t.qty; p.cost += t.qty * t.px; p.costR += t.qty * t.px * r; } });
  return Object.values(by).filter(p => p.qty > 0).map(p => { const s = usRow(p.sym), v = s && s.close ? p.qty * s.close : null, rn = fxNow();
    return Object.assign(p, { value: v, valueR: v != null && rn ? v * rn : null }); });
}
function wSplit(rows) { const c = rows.reduce((a, r) => a + r.cost, 0), cr = rows.reduce((a, r) => a + r.costR, 0), v = rows.reduce((a, r) => a + (r.value || 0), 0), vr = rows.reduce((a, r) => a + (r.valueR || 0), 0);
  if (!c || !cr) return null; const stock = (v / c - 1) * 100, total = (vr / cr - 1) * 100; return { c, cr, v, vr, stock, total, rupee: ((1 + total / 100) / (1 + stock / 100) - 1) * 100 }; }
// India pages never load the World files, so the Family line uses the live value when World data is loaded and otherwise the value
// last worked out in the World tab (saved with its date in the World storage)
function worldINR() {
  if (!(WU.pfs || []).length) return 0;
  if (USX().length) { const v = WU.pfs.reduce((a, p) => a + wPos(p.id).reduce((x, r) => x + (r.valueR || 0), 0), 0);
    if (!WU.last || WU.last.v !== v || WU.last.d !== TODAY) { WU.last = { v, d: TODAY }; saveWU(); } return v; }
  return WU.last ? WU.last.v : 0;
}
const worldINRNote = () => USX().length || !WU.last ? "in ₹ at today's rate" : `in ₹, as last worked out in World on ${FMT.date(WU.last.d)}`;
function worldPortfolioHTML() {
  const P = WU.pfs || [], cur = P.find(p => p.id === WU.cur) || P[0];
  const pills = `<nav class="chiprow" aria-label="World portfolios">${P.map(p => `<button class="chip${cur && p.id === cur.id ? " on" : ""}" type="button" data-act="wpfsel" data-v="${esc(p.id)}" aria-pressed="${!!cur && p.id === cur.id}">${esc(p.name)}</button>`).join("")}${P.length < 10 ? `<button class="chip" type="button" data-act="wpfnew">+ New US portfolio</button>` : ""}</nav>`;
  if (!cur) return `<section class="panel" id="wpf"><h2>World portfolio</h2>${pills}<p class="sub">US portfolios live only here, with the cost in $ and in ₹. Make one with "+ New US portfolio".</p></section>`;
  const rows = wPos(cur.id), sp = wSplit(rows), OWN = OWNER(), rowsM = rows.filter(r => r.value != null).map(r => ({ sym: r.sym, value: r.value })), look = usLook();
  const m = rowsM.length ? meterOf(rowsM, look) : null, E = rowsM.length ? expertsAll(rowsM, look).filter(e => e.sc != null) : [];
  return `<section class="panel" id="wpf"><h2>World portfolio</h2>${pills}
    ${rows.length ? dataTable({ cols: [{ k: "s", h: "Stock" }, { k: "q", h: "Shares" }, { k: "c", h: "Cost $" }, { k: "r", h: "Cost ₹" }, { k: "v", h: "Value $" }, { k: "w", h: "Value ₹" }],
        rows: rows.map(r => ({ cells: {}, raw: { s: `<a href="#/world/us/${encodeURIComponent(r.sym)}">${esc(r.sym)}</a>`, q: FMT.num(r.qty, 2), c: usd(r.cost), r: FMT.money(r.costR, 0), v: OWN ? omRow() : usd(r.value), w: OWN ? omRow() : FMT.money(r.valueR, 0) } })), cls: "wpftab", label: "World portfolio" }) : `<p class="sub">No holdings yet.</p>`}
    ${sp ? `<p class="mline wsplit">stock ${moveNum(sp.stock, FMT.pct(sp.stock, 1))} · rupee ${moveNum(sp.rupee, FMT.pct(sp.rupee, 1))} · total ${moveNum(sp.total, FMT.pct(sp.total, 1))}</p>
      <p class="t-label sub">Cost in ₹ uses the USD/INR rate of each buy date; value in ₹ uses today's rate (₹${FMT.num(fxNow(), 2)}), so the rupee's own move shows separately.</p>` : ""}
    <form id="wtxform" class="ogrid"><label class="fl">Stock<input name="sym" list="uslistdl" required placeholder="AAPL" autocomplete="off"></label><datalist id="uslistdl">${USX().map(s => `<option value="${esc(s.symbol)}">${esc(s.name)}</option>`).join("")}</datalist>
      <label class="fl">Date<input name="date" type="date" required max="${TODAY}"></label><label class="fl">Shares<input name="qty" type="number" min="0.0001" step="any" required></label><label class="fl">Price ($)<input name="px" type="number" min="0.01" step="any" required></label>
      <label class="fl">Buy / sell<select name="side"><option value="buy">Buy</option><option value="sell">Sell</option></select></label><button class="act" type="submit">Add</button></form>
    ${m ? `<h3 class="minor">Health meter <span class="sub">experimental for US</span></h3><p class="mline"><b class="num">${m.total}</b>/100 – ${meterLabel(m.total)[0]} <span class="t-label sub">(${m.n} of ${m.of} scored; quality = an experimental US score, no fair value or red flags for US yet)</span></p>` : ""}
    ${rowsM.length ? `<p class="t-label sub">Experts (experimental for US): ${E.length ? E.map(e => `${e.who.split(" (")[0].split(" ").pop()} ${e.grade[0]}`).join(" · ") : "not enough data – the investor lenses aren't computed for US stocks yet"}.</p>` : ""}
    <p class="t-label sub">Manual entry only (the Zerodha import is for Indian stocks). The What-to-do plan stays India-only. ${COACH_LINE}</p></section>`;
}
// ---- C5: the US stock page – same fixed tabs as India, no verdict, ₹ / $ switch, statements, chart bands, compare (US vs US)
// review #84 B: EPS in $ (or ₹ at the year-end rate) and the last quarters where filed (10-Q, 3-month figures)
const usPerShare = (v, end) => CURR() === "usd" ? "$" + FMT.num(v, 2) : (fxAt(end) ? inr(v * fxAt(end), 2) : FMT.DASH);
function usQuarters(s) {
  const q = s.fund && s.fund.q; if (!q || !(q.s || []).length) return "";
  const lbl = e => { const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+e.slice(5, 7) - 1]; return `${m} ${e.slice(2, 4)}`; };
  const ends = q.ends.slice(-8);
  return `<h3 class="minor">Last quarters (10-Q)</h3>${dataTable({ cols: [{ k: "line", h: CURR() === "usd" ? "$ billion" : "₹ crore" }, ...ends.map((e, i) => ({ k: "q" + i, h: lbl(e) }))], cls: "stmt usq", label: "US quarters",
    rows: q.s.map(([key, label, vals]) => ({ cells: {}, raw: Object.assign({ line: esc(label) }, Object.fromEntries(ends.map((e, i) => ["q" + i, usCell(vals[q.ends.indexOf(e)], e)]))) })) })}`;
}
function usStatements(s) {
  const st = s.fund && s.fund.st; if (!st || !st.s) return "";
  const sh = st.s[prefGet("screener.st.sheet", "pl")] ? prefGet("screener.st.sheet", "pl") : Object.keys(st.s)[0];
  const cols = [{ k: "line", h: CURR() === "usd" ? "$ billion" : "₹ crore" }, ...st.y.map((y, i) => ({ k: "y" + i, h: "FY" + y.slice(2) }))];
  const rows = st.s[sh].map(([key, label, unit, vals]) => ({ cells: {}, cls: "tap", attrs: ` data-usrow="${esc(key)}" tabindex="0"`, raw: Object.assign({ line: esc(label) }, Object.fromEntries(vals.map((v, i) => ["y" + i,
    unit === "usdm" ? usCell(v, st.ends[i]) : v == null ? FMT.DASH : unit === "usd" ? usPerShare(v, st.ends[i]) : unit === "pct" ? FMT.pctPlain(v, 1) : FMT.times(v, 2)]))) }));
  return `<section class="panel" id="statements"><h2>Statements</h2><nav class="chiprow" aria-label="Statement">${ST_SHEETS.filter(([k]) => st.s[k]).map(([k, nm]) => `<button class="chip${k === sh ? " on" : ""}" type="button" data-act="stsheet" data-v="${k}" aria-pressed="${k === sh}">${nm}</button>`).join("")}</nav>
    ${dataTable({ cols, rows, cls: "stmt", label: "US statements" })}<p class="t-label sub">Fiscal years as the company reports them (FY = the year it ends). SEC EDGAR companyfacts (official XBRL, 10-K). ₹ uses the USD/INR rate at each year-end. Tap a row for its chart.</p>${usQuarters(s)}</section>`;
}
function usSeries(s, key) { const st = s && s.fund && s.fund.st; if (!st) return null; const row = Object.values(st.s).flat().find(r => r[0] === key); if (!row) return null;
  const v = {}; st.y.forEach((y, i) => { const x = row[3][i]; if (x != null) v[y] = row[2] === "usdm" ? (CURR() === "usd" ? x / 1e3 : (fxAt(st.ends[i]) ? x * fxAt(st.ends[i]) / 10 : null)) : x; }); return { label: row[1], unit: row[2], vals: v }; }
function usTrends(s) {
  const ks = ["revenue", "net_income", "op_margin", "roe"].map(k => [k, usSeries(s, k)]).filter(([, x]) => x && Object.keys(x.vals).length >= 2);
  if (!ks.length) return "";
  return `<section class="panel" id="trends"><h2>Trends</h2><div class="fgrid">${ks.map(([k, x]) => `<div class="fcell" data-ustrend="${k}" role="button" tabindex="0">${finChart({ title: x.label + (x.unit === "usdm" ? (CURR() === "usd" ? " ($ billion)" : " (₹ crore)") : ""),
    unit: x.unit === "usdm" ? (CURR() === "usd" ? "num" : "cr") : x.unit, kind: x.unit === "usdm" ? "bar" : "line", ys: Object.keys(x.vals).sort(), series: [{ name: x.label, vals: x.vals }], key: k, dl: `${s.name} · ${x.label}` })}</div>`).join("")}</div></section>`;
}
const UCS = { sym: null, key: null, others: [] };
function usChartSheet(sym, key) {
  const s = USFULL[sym]; if (!s) return; if (UCS.sym !== sym || UCS.key !== key) Object.assign(UCS, { sym, key, others: UCS.sym === sym ? UCS.others : [] });
  const all = [s, ...UCS.others.map(x => USFULL[x]).filter(Boolean)], ser = all.map(x => ({ name: x.name, vals: (usSeries(x, key) || { vals: {} }).vals })), meta = usSeries(s, key) || { label: key, unit: "num" };
  const ys = [...new Set(ser.flatMap(x => Object.keys(x.vals)))].sort(), peers = USX().filter(x => x.industry === s.industry && x.symbol !== sym && !UCS.others.includes(x.symbol)).slice(0, 6);
  sheet(`<div class="csheet"><h2>${esc(meta.label)}</h2>${finChart({ title: meta.label, unit: meta.unit === "usdm" ? (CURR() === "usd" ? "num" : "cr") : meta.unit, kind: "line", ys, series: ser, key, dl: `${s.name} · ${meta.label}` })}
    <h3 class="minor">+ Add a US stock <span class="sub">(US vs US only, up to 5 lines)</span></h3>${UCS.others.length ? `<div class="chiprow">${UCS.others.map(x => `<button class="chip on" type="button" data-ucs="del" data-v="${esc(x)}">${esc(x)} ✕</button>`).join("")}</div>` : ""}
    ${all.length < 5 ? `<div class="chiprow">${peers.map(p => `<button class="chip" type="button" data-ucs="add" data-v="${esc(p.symbol)}">+ ${esc(p.symbol)}</button>`).join("")}</div>` : ""}
    <div class="btnrow"><button class="act" type="button" data-close>Close</button></div></div>`);
  dlPass(document.getElementById("sheet"));
}
document.getElementById("sheet").addEventListener("click", e => { const b = e.target.closest("[data-ucs]"); if (!b) return;
  if (b.dataset.ucs === "add") { if (UCS.others.length < 4) UCS.others.push(b.dataset.v); loadUSStock(b.dataset.v).then(() => usChartSheet(UCS.sym, UCS.key)); }
  else { UCS.others = UCS.others.filter(x => x !== b.dataset.v); usChartSheet(UCS.sym, UCS.key); } });
function renderUS(sym) {
  const row = usRow(sym) || USFULL[sym];
  if (!row && !(W0().us || {}).on) return false;
  const s = USFULL[sym];
  if (!s) { SCR().innerHTML = `<button class="back" type="button" data-back="#/world">${ic("back")} Back</button><div class="skel" aria-label="Loading this stock…"><i class="h"></i><i></i><i class="b"></i></div>`;
    loadWorld(); loadUSStock(sym).then(x => { const r = parseHash(); if (x && r.name === "world" && r.sub === sym) render(true); else if (!x && r.sub === sym) SCR().innerHTML = `<button class="back" type="button" data-back="#/world">${ic("back")} Back</button><p class="sub">This US stock isn't in tonight's data.</p>`; }); return true; }
  const m = (s.fund && s.fund.metrics) || {}, OWN = OWNER(), nd = t => `<section class="panel nodata"><h2>${t}</h2><p class="sub">No data yet.</p></section>`;
  const tabs = { summary: `<section class="panel"><h2>Summary</h2><p class="note">No verdict — our rules are tested on Indian stocks only. Quality checks and fair value methods for US stocks are experimental and not shown as a verdict.</p>
      <div class="metrics">${[["Market cap", OWN ? omh() : usMoney(m.mcap_usd_m, s.date)], ["P/E", OWN ? omh() : FMT.ratio(m.pe, 1)], ["P/B", OWN ? omh() : FMT.ratio(m.pb, 2)], ["ROCE", FMT.pctPlain(m.roce, 1)]].map(([l, v]) => `<div><span class="t-label sub">${l}</span><span class="num">${v}</span></div>`).join("")}</div></section>`,
    value: OWN ? omPanel("Fair value") : `<section class="panel"><h2>Fair value</h2><p class="sub">Experimental for US – not built yet. No verdict: our rules are tested on Indian stocks only.</p></section>`,
    statements: usStatements(s), health: usTrends(s), peers: "", investors: "", owners: "", news: "",
    docs: `<section class="panel"><h2>Documents</h2><p class="mline"><a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&amp;CIK=${encodeURIComponent(sym)}&amp;type=10-K" target="_blank" rel="noopener">10-K and 10-Q filings on SEC EDGAR ›</a></p></section>`, chart: "" };
  const NAMES = { summary: "Summary", value: "Fair value", statements: "Statements", health: "Health", peers: "Peers", investors: "Investors", owners: "Owners", news: "News", docs: "Documents", chart: "Chart" };
  const J = STOCK_TABS.map(k => [k, NAMES[k], tabs[k] && tabs[k].trim() ? tabs[k] : nd(NAMES[k]), !(tabs[k] && tabs[k].trim())]);
  SCR().innerHTML = `<button class="back" type="button" data-back="#/world">${ic("back")} Back</button>
    <div class="hero"><h1>${esc(s.name)} <span class="usflag t-label">US</span></h1><span class="sub">${esc(sym)} · ${esc(s.industry || "")} · close on ${esc(s.date ? FMT.date(s.date) : "–")} (Yahoo, unofficial, single source)</span>
      ${OWN ? omh("omh-big") : `<span class="big num">${usPrice(s.close, s.date)}</span> ${s.change_pct != null ? chgPill(s.change_pct, 2) : ""}`}
      <div class="acts"><button class="act eye" type="button" data-act="owner" aria-pressed="${OWN}">${ic("eye")} ${OWN ? "Show prices" : "Owner mode"}</button><button class="act" type="button" data-act="uswatch" data-sym="${esc(sym)}">${ic(inUSWatch(sym) ? "star-fill" : "star")} ${inUSWatch(sym) ? "In US watchlist" : "US watchlist"}</button></div>${curSwitch()}</div>
    <nav class="jump" aria-label="Jump to a section">${J.map(([k, nm, , e]) => `<a href="#/world/us/${encodeURIComponent(sym)}" data-jump="j-${k}"${e ? ' class="nodata"' : ""}>${nm}</a>`).join("")}</nav>
    ${J.map(([k, , html]) => `<div class="jsec" id="j-${k}">${html}</div>`).join("")}<p class="t-label sub">${esc(s.src || "")}</p>`;
  return true;
}
screenEl.addEventListener("input", e => { const i = e.target.closest("[data-wq]"); if (!i) return; WF.q = i.value; const pos = i.selectionStart, y = scrollY; render(true); scrollTo(0, y);
  const n = SCR().querySelector("[data-wq]"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
screenEl.addEventListener("change", e => { const s = e.target.closest("[data-wsort]"); if (s) { WF.sort = s.value; render(true); } });
screenEl.addEventListener("click", e => { if (parseHash().name !== "world" || e.target.closest("button, a, select, input")) return;
  const r = e.target.closest("[data-usrow], [data-ustrend]"); if (r) usChartSheet(parseHash().sub, r.dataset.usrow || r.dataset.ustrend); });
screenEl.addEventListener("submit", e => { if (e.target.id !== "wtxform") return; e.preventDefault(); const f = e.target, sym = f.sym.value.trim().toUpperCase();
  if (!usRow(sym)) { toast("Pick a US stock from the list"); return; }
  WU.tx.push({ id: "w" + Date.now().toString(36), pf: WU.cur || (WU.pfs[0] || {}).id, sym, date: f.date.value, qty: +f.qty.value, px: +f.px.value, side: f.side.value }); saveWU(); const y = scrollY; render(true); scrollTo(0, y); });
function dqNewSources() {
  const I = INV(), F = S.feed, segF = S.seg_failed || [];
  const rows = [["Statements tab (#76)", "Yahoo Finance yearly lines (unofficial) + the official NSE filing for the latest year", S.generated_at],
    ["Documents and topic feeds (#76, #77)", "NSE corporate announcements – links only", S.generated_at],
    ["Factor indices (#77)", "NSE all-indices file", S.market && S.market.date],
    ["Big investors (#78)", I ? `${I.src} – ${FMT.count(I.read || 0)} filings read` : "not read yet", I && I.q],
    ["Segments (#78)", "NSE results XBRL (Ind AS 108 segment lines)", S.generated_at],
    ["US stocks – World tab (#78, #80)", (W0().us || {}).note || "not built", (W0().us || {}).updated], ["USD/INR (₹ / $ switch)", (S.fx && S.fx.src) || "–", S.fx && S.fx.latest && S.fx.latest[0]]];
  return `<section class="panel" id="newsrc"><h2>Sources added in reviews #76–#78</h2>${dataTable({ cols: [{ k: "a", h: "What" }, { k: "b", h: "Source" }, { k: "c", h: "Last updated" }],
      rows: rows.map(([a, b, c]) => ({ cells: {}, raw: { a: esc(a), b: esc(b), c: c ? esc(FMT.date(String(c).slice(0, 10))) : FMT.DASH } })), cls: "dqsrc", label: "New sources" })}
    ${segF.length ? `<h3 class="minor">Segment periods left out (didn't add up within 2%)</h3><ul class="mini">${segF.slice(0, 30).map(x => `<li>${esc(x[0])} · ${esc(x[2] === "year" ? "year" : "quarter")} to ${esc(FMT.date(x[1]))} – ${esc(x[3])}</li>`).join("")}</ul>` : ""}</section>`;
}

// ==================== review #79: Portfolio coach – several portfolios, health meter, experts' review, What to do, budget planner,
// Family view, crash test, System vs Me, goal tracker, Rebalance day, trial period. Everything runs in this browser on the user's own
// data: holdings never leave the phone, no API calls. "Ideas from our rules and your numbers, not advice. You decide." ====================
const PF_MAX = 10, PF_FAMILY = "__family", PF_MAIN = "main", COACH_LINE = "Ideas from our rules and your numbers, not advice. You decide.";
// A2: the single portfolio of older data becomes "My portfolio" – nothing lost
function pfMigrate(u) { let ch = false;
  if (!Array.isArray(u.pfs) || !u.pfs.length) { u.pfs = [{ id: PF_MAIN, name: "My portfolio", goal: "bal", other: {} }]; ch = true; }
  const ids = new Set(u.pfs.map(p => p.id));
  (u.tx || []).forEach(t => { if (!t.pf || !ids.has(t.pf)) { t.pf = u.pfs[0].id; ch = true; } });
  return ch; }
if (pfMigrate(USER)) persist();
const pfList = () => USER.pfs || [];
const pfCur = () => { const c = USER.meta.pfCur; if (c === PF_FAMILY && pfList().length > 1) return c; return (pfList().find(p => p.id === c) || pfList()[0]).id; };
const pfObj = id => id === PF_FAMILY ? { id, name: "Family", goal: USER.meta.famGoal || "bal", other: pfList().reduce((o, p) => { Object.entries(p.other || {}).forEach(([k, v]) => { o[k] = (o[k] || 0) + (+v || 0); }); return o; }, {}) } : pfList().find(p => p.id === id);
// a trade added by older code (no tag, or a deleted portfolio's tag) counts in the first portfolio – never lost from view
const pfOfTx = t => { const L = pfList(); return t.pf && L.some(p => p.id === t.pf) ? t.pf : L[0].id; };
const pfTx = id => id === PF_FAMILY ? USER.tx : USER.tx.filter(t => pfOfTx(t) === id);
function withPf(id, fn) { const all = USER.tx; USER.tx = pfTx(id); try { return fn(); } finally { USER.tx = all; } }
const pfRows = id => UL.portfolio(pfTx(id), priceOf, PDAY).rows.filter(r => r.value > 0);
const pfValue = id => UL.portfolio(pfTx(id), priceOf, PDAY).totals.value;
const otherSum = o => ["debt", "mf", "gold", "cash"].reduce((a, k) => a + (+(o || {})[k] || 0), 0);
const GOALS = { safe: { nm: "Safer", eq: 60, debt: 40, cap: 10, ret: 9, core: 70, line: "Protect money first, grow steadily",
    tilt: "Shift new stock money toward the Graham / Coffee Can-style picks (steady, low debt). Keep an index fund as the biggest single holding." },
  bal: { nm: "Balanced", eq: 75, debt: 25, cap: 12, ret: 11, core: 60, line: "Mix of growth and safety",
    tilt: "Keep 60% of the stock money in an index fund and 40% in the app's Buy / Accumulate picks. Rebalance once a year." },
  high: { nm: "Higher return", eq: 90, debt: 10, cap: 15, ret: 12, core: 50, line: "Accept bigger falls for more growth",
    tilt: "Room for 2–3 smaller growth names (Lynch / Kedia-style picks with quality 65+), each at most 5%. Expect falls of 30–40% in bad years." } };
const GOAL_IC = { safe: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>', bal: '<path d="M12 4v16M5 20h14M6 8l-3 6h6zM18 8l-3 6h6zM6 8h12"/>', high: '<path d="M5 19c1-4 3-7 7-11 2-2 5-3 7-3 0 2-1 5-3 7-4 4-7 6-11 7zM9 15l-3 3"/>' };
const goalIc = k => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${GOAL_IC[k]}</svg>`;
// ---- B: the health meter ----
const qOf = s => { const v = s.v4 && s.v4.q != null ? s.v4.q : (SET.master && vfor(s) ? vfor(s).q : null); return v != null ? v : s.quality != null ? s.quality : null; };
const redOf = s => !!((s.v4 && s.v4.rf && s.v4.rf.length) || (s.red_flags > 0));
function meterOf(rows, L = BY) {
  const all = rows.filter(r => r.value > 0), H = all.filter(r => L[r.sym] && qOf(L[r.sym]) != null);
  if (!H.length) return null;
  const W = H.reduce((a, r) => a + r.value, 0), w = r => r.value / W * 100;
  const q = H.reduce((a, r) => a + qOf(L[r.sym]) * r.value, 0) / W, quality = q / 100 * 40;
  const n = H.length, mx = Math.max(...H.map(w)), sec = {};
  H.forEach(r => { const k = skOf(L[r.sym]); sec[k] = (sec[k] || 0) + w(r); });
  const [topS, ms] = Object.entries(sec).sort((a, b) => b[1] - a[1])[0];
  let spread = 20; if (n < 8) spread -= 2 * (8 - n); if (mx > 15) spread -= Math.min(6, (mx - 15) / 2); if (ms > 30) spread -= Math.min(6, (ms - 30) / 2); spread = Math.max(0, spread);
  const G = H.filter(r => fvGap(L[r.sym]) != null), GW = G.reduce((a, r) => a + r.value, 0);
  const gap = GW ? G.reduce((a, r) => a + fvGap(L[r.sym]) * r.value, 0) / GW : null;
  const value = gap == null ? 0 : gap <= -20 ? 20 : gap >= 30 ? 0 : 20 * (30 - gap) / 50;
  const rf = H.filter(r => redOf(L[r.sym])).reduce((a, r) => a + r.value, 0) / W * 100, red = 20 * (1 - rf / 100);
  const total = Math.round(quality + spread + value + red);
  return { total, n, of: all.length, q, mx, ms, topS, gap, rf, parts: [["Quality", quality, 40, `average quality ${FMT.num(q, 0)}/100`],
    ["Spread", spread, 20, `${n} stock${n === 1 ? "" : "s"} · biggest ${FMT.num(mx, 0)}% · top sector ${FMT.num(ms, 0)}%`],
    ["Price vs fair value", value, 20, gap == null ? "no ⭐ fair value for these stocks" : `on average ${FMT.num(Math.abs(gap), 0)}% ${gap < 0 ? "below" : "above"} ⭐ fair value`],
    ["Red-flag free", red, 20, `${FMT.num(rf, 0)}% of the money in stocks with a red flag`]] };
}
const meterLabel = t => t >= 80 ? ["Strong", "Well built. Keep doing what you're doing."] : t >= 60 ? ["Healthy", "Solid base, a couple of things to tidy."] : t >= 40 ? ["Needs work", "Some weak spots are pulling it down."] : ["Weak", "Several warning signs. Review before adding money."];
function meterHTML(m) {
  if (!m) return `<section class="panel" id="meter"><h2>Health meter</h2><p class="sub">Add holdings to see the meter.</p></section>`;
  const [lb, ln] = meterLabel(m.total), r = 15.9;
  return `<section class="panel" id="meter"><h2>Health meter</h2><div class="mwrap"><figure class="gaugefig" data-chart="Health meter" data-direct="1" data-nodraw data-nodl><svg viewBox="0 0 36 36" class="gauge" role="img" aria-label="Health ${m.total} of 100"><circle cx="18" cy="18" r="${r}" class="gtrack"/><circle cx="18" cy="18" r="${r}" class="garc" pathLength="100" stroke-dasharray="${m.total} 100" data-label="Health meter"/></svg></figure>
      <div><b class="num t-number-lg">${m.total}</b><span class="t-label sub">/100</span><p class="mline"><b>${lb}</b> – ${ln}</p><p class="t-label sub">${m.n} of ${m.of} stocks scored</p></div></div>
    ${m.parts.map(([nm, v, mx, why]) => `<div class="mpart"><div class="mrow2"><span>${nm}</span><span class="num">${FMT.num(v, 0)} / ${mx}</span></div><div class="mbar"><i style="width:${FMT.coord(v / mx * 100)}%"></i></div><p class="t-label sub">${esc(why)}</p></div>`).join("")}
    <details><summary>How it's worked out</summary><p class="mini">0–100 from four parts, weighted by the money in each stock at today's close. <b>Quality, 40:</b> the money-weighted quality score ÷ 100 × 40. <b>Spread, 20:</b> start at 20; −2 per stock below 8; −(biggest weight − 15) ÷ 2, at most −6; −(biggest sector − 30) ÷ 2, at most −6; never below 0. <b>Price vs fair value, 20:</b> the money-weighted % vs ⭐ fair value – 20%+ below = 20, 30%+ above = 0, a straight line between. <b>Red-flag free, 20:</b> 20 × (1 − share of money in stocks with a red flag). 80+ Strong · 60–79 Healthy · 40–59 Needs work · below 40 Weak.</p></details></section>`;
}
// ---- C: the experts' review (the 10 lenses already computed per stock) ----
const LENSES = [["graham", "Benjamin Graham", "Safe, cheap, steady", "cheap and safe on paper (low P/E, low debt, steady dividends)", "A Graham-style investor would want more margin of safety: more of the money in stocks priced well below fair value."],
  ["buffett", "Warren Buffett", "Wonderful business at a fair price", "high, steady ROCE with little debt", "A Buffett-style investor would hold fewer, higher-quality businesses and ignore short-term price moves."],
  ["munger", "Charlie Munger", "Great business, avoid stupidity", "durable quality with no accounting worries", "A Munger-style investor would first remove the weakest holdings before looking for new ones."],
  ["lynch", "Peter Lynch", "Growth at a reasonable price", "growth that the P/E isn't over-charging for", "A Lynch-style investor would check that each stock's P/E is below its growth rate (PEG under 1)."],
  ["fisher", "Philip Fisher", "Outstanding growers, held for years", "long runways of sales growth with good margins", "A Fisher-style investor would keep the long-term growers and judge them on 5-year sales, not 1-year price."],
  ["greenblatt", "Joel Greenblatt", "Good and cheap (Magic Formula)", "high return on capital at a low price", "A Greenblatt-style investor would rebalance once a year into the best 'good and cheap' names."],
  ["piotroski", "Piotroski F-score", "Is financial health improving?", "improving profits, cash flow and balance sheet", "A Piotroski-style check would flag holdings scoring 3/9 or less for a closer look."],
  ["kedia", "Vijay Kedia (SMILE)", "Small, ambitious, big market", "small size with an ambitious, scalable story", "A Kedia-style investor would want a few smaller, fast-growing companies with strong management."],
  ["qglp", "Raamdeo Agrawal (QGLP)", "Quality, Growth, Longevity, Price", "quality, growth and fair price together", "A QGLP-style investor would look for growth of 20%+ while keeping quality and price in check."],
  ["coffeecan", "Saurabh Mukherjea (Coffee Can)", "Consistent compounders for a decade", "10 years of 10%+ sales growth and 15%+ ROCE", "A Coffee Can-style investor would hold only the consistent compounders and stop trading the rest."]];
// per stock: passed ÷ (passed + failed), "partial" by its lean, judge / none left out – the pipeline's lens_<key> field
const lensOf = (s, k) => { const v = s && s["lens_" + k]; return v == null || !isFinite(v) ? null : +v; };
const gradeOf = sc => sc == null ? null : sc >= 65 ? ["Good", "buy"] : sc >= 45 ? ["Average", "hold"] : ["Weak", "trim"];
function expertOf(rows, L, B = BY) {
  const [k, who, , why, tip] = L, H = rows.filter(r => r.value > 0 && B[r.sym]), W = H.reduce((a, r) => a + r.value, 0);
  const C = H.filter(r => lensOf(B[r.sym], k) != null), CW = C.reduce((a, r) => a + r.value, 0);
  if (!W || CW / W < 0.5) return { k, who, sc: null, grade: null, lines: [`Not enough data – this lens could check ${W ? FMT.num(CW / W * 100, 0) : 0}% of the money (it needs 50%).`] };
  const sc = C.reduce((a, r) => a + lensOf(B[r.sym], k) * r.value, 0) / CW;
  const sorted = [...C].sort((a, b) => lensOf(BY[b.sym], k) - lensOf(BY[a.sym], k)), nm = r => B[r.sym].name.replace(/ Ltd\.?$/, "");
  const best = sorted.slice(0, 2).filter(r => lensOf(B[r.sym], k) >= 60), worst = sorted.slice(-2).reverse().filter(r => lensOf(B[r.sym], k) < 45 && !best.includes(r));
  const passW = C.filter(r => lensOf(B[r.sym], k) >= 60).reduce((a, r) => a + r.value, 0) / W * 100;
  const lines = [`${FMT.num(passW, 0)}% of your money is in stocks that pass this lens, i.e. ${why}.`];
  if (best.length) lines.push(`Likes: ${best.map(nm).join(" and ")} (${best.map(r => FMT.num(lensOf(B[r.sym], k), 0) + "%").join(", ")} of checks passed).`);
  if (worst.length) lines.push(`Worries: ${worst.map(r => `${nm(r)} (${FMT.num(r.value / W * 100, 0)}% of portfolio)`).join(" and ")}, passing under 45% of checks.`);
  lines.push(tip);
  return { k, who, sc, grade: gradeOf(sc), lines };
}
const expertsAll = (rows, B = BY) => LENSES.map(L => expertOf(rows, L, B));
function expertsHTML(rows) {
  const E = expertsAll(rows), c = { Good: 0, Average: 0, Weak: 0 }; E.forEach(e => { if (e.grade) c[e.grade[0]]++; });
  return `<section class="panel" id="experts"><h2>What the experts say about this portfolio</h2>
    <p class="banner">Their published checklist run on your holdings by our rules. Not their words or views. ${COACH_LINE}</p>
    <p class="mline etally">${["Good", "Average", "Weak"].map(g => `<span class="vgp" style="--vgc:var(--vg-${g === "Good" ? "buy" : g === "Average" ? "hold" : "trim"})">${g} ${c[g]}</span>`).join(" ")} <span class="t-label sub">of 10 lenses</span></p>
    <div class="ecards">${E.map((e, i) => `<div class="ecard"><div class="etop"><h3 class="minor">${esc(e.who.split(" (")[0].split(" ").pop())}-style lens</h3>${e.grade ? `<span class="vgp" style="--vgc:var(--vg-${e.grade[1]})">${e.grade[0]} · ${FMT.num(e.sc, 0)}%</span>` : `<span class="t-label sub">Not enough data</span>`}</div>
      <p class="t-label sub">${esc(LENSES[i][1])} · ${esc(LENSES[i][2])}</p><ul class="mini">${e.lines.map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("")}</div></section>`;
}
// ---- I6: trial period – newer rule versions are on trial for 6 months; the plan, budget and System tag use Rules v1.0 until then ----
const addMonths = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };
function trials() { return [["v1.1", S.portfolio_v1_1], ["v1.2", S.portfolio_v1_2]].map(([v, p]) => { const st = S.trials ? (S.trials[v] || null) : (p && p.stats && p.stats.started);   // #83 D: the ghost log's first date
  return { v, started: st || null, until: st ? addMonths(st, 6) : null, passed: !!(st && addMonths(st, 6) <= TODAY) }; }); }
const PLAN_RULES = "screener.planrules";
const planG = s => { const t = trials().find(x => x.v === "v1.2"); return prefGet(PLAN_RULES, "v1.0") === "v1.2" && t && t.passed && s.v4 && s.v4.v12 ? (dqLow(s.symbol) ? null : s.v4.v12.g) : s.v4 && s.v4.g; };   // #81 C6
function trialHTML() { return `<p class="t-label sub trial">${trials().map(t => `Rules ${t.v} – ${t.started ? `trial: ghost since ${FMT.date(t.started)}, 6 months needed (until ${FMT.date(t.until)})${t.passed ? " – passed" : ""}` : "trial: ghost not started yet"}`).join(" · ")}. The plan and the System tag use Rules ${prefGet(PLAN_RULES, "v1.0") === "v1.2" && (trials().find(x => x.v === "v1.2") || {}).passed ? "v1.2 (switched on in Settings)" : "v1.0"}.</p>`; }
// ---- I5: Rebalance day ----
const rebalDay = () => { const r = String(USER.meta.rebal || "11-15"); return /^\d{4}-\d{2}-\d{2}$/.test(r) ? r.slice(5) : /^\d{2}-\d{2}$/.test(r) ? r : "11-15"; };   // #83 C: day + month only
function daysToRebal() { const [m, d] = rebalDay().split("-").map(Number), t = new Date(TODAY + "T00:00:00"); let r = new Date(t.getFullYear(), m - 1, d); if (r < t) r = new Date(t.getFullYear() + 1, m - 1, d);
  return Math.round((r - t) / 864e5); }
const isRebalDay = () => TODAY.slice(5) === rebalDay();
// ---- D: What to do ----
function planOf(id) {
  const P = pfObj(id), G = GOALS[P.goal] || GOALS.bal, rows = pfRows(id), o = P.other || {};
  const S0 = rows.reduce((a, r) => a + r.value, 0), shares = S0 + (+o.mf || 0) + (id === PF_FAMILY ? worldINR() : 0),   /* #80: World portfolios count as shares in Family */ safe = (+o.debt || 0) + (+o.cash || 0), gold = +o.gold || 0, T = shares + safe + gold;
  const d = G.debt / 100, eqNow = T ? shares / T * 100 : 0;
  const addX = Math.max(0, (d * T - safe) / (1 - d)), moveY = Math.max(0, d * T - safe);
  const W = S0 || 1, w = r => r.value / W * 100, A = { first: [], then: [], later: [], always: [] };
  const flags = rows.filter(r => BY[r.sym] && redOf(BY[r.sym])), nm = r => (BY[r.sym] || { name: r.sym }).name.replace(/ Ltd\.?$/, "");
  if (flags.length) A.first.push(`Review ${flags.map(nm).join(", ")}: red flag (${FMT.pctPlain(flags.reduce((a, r) => a + w(r), 0), 0)} of this portfolio). Read why on its stock page; our rules say no new money in red-flag stocks.`);
  if (moveY > 1) A.first.push(`Safety money: you're ${FMT.pctPlain(eqNow, 0)} in shares. For "${G.nm}" the mix is ${G.eq}% shares / ${G.debt}% debt. Add ${FMT.money(addX, 0)} to a debt fund (short-duration / liquid) or FD, or move ${FMT.money(moveY, 0)} from stocks.`);
  rows.filter(r => w(r) > G.cap).forEach(r => A.then.push(`${nm(r)} is ${FMT.pctPlain(w(r), 0)} of the portfolio – above the ${G.cap}% cap for "${G.nm}". Trim about ${FMT.money(r.value - G.cap / 100 * W, 0)}, or add to others instead.`));
  const sec = {}; rows.forEach(r => { if (BY[r.sym]) { const k = skOf(BY[r.sym]); sec[k] = (sec[k] || 0) + r.value; } });
  Object.entries(sec).filter(([, v]) => v / W > 0.3).forEach(([k, v]) => A.then.push(`${(SECT[k] || {}).label || k} is ${FMT.pctPlain(v / W * 100, 0)} of the portfolio (above 30%). Put new money elsewhere, or trim about ${FMT.money(v - 0.3 * W, 0)}.`));
  rows.filter(r => BY[r.sym] && fvGap(BY[r.sym]) >= 25).forEach(r => A.then.push(`${nm(r)} is ${FMT.pct(fvGap(BY[r.sym]), 0)} vs ⭐ fair value – don't add at this price.`));
  A.later.push(G.tilt);
  A.always.push("Keep 6 months of expenses aside before investing.", "Don't put money you need within 3 years into shares.");
  return { G, A, eqNow, T };
}
function whatToDoHTML(id) {
  const P = pfObj(id), p = planOf(id), m = meterOf(pfRows(id)), E = expertsAll(pfRows(id)).filter(e => e.sc != null), avg = E.length ? E.reduce((a, e) => a + e.sc, 0) / E.length : null, g = gradeOf(avg);
  const waits = !isRebalDay(), wl = `<span class="t-label sub">Waits for your Rebalance day (in ${daysToRebal()} day${daysToRebal() === 1 ? "" : "s"})</span>`;
  const grp = (k, nm, gate) => p.A[k].length ? `<h3 class="minor">${nm}</h3><ul class="mini">${p.A[k].map(x => `<li>${esc(x)}${gate && waits ? " " + wl : ""}</li>`).join("")}</ul>` : "";
  return `<section class="panel" id="todo"><h2>What to do with this portfolio</h2><p class="banner">${COACH_LINE} The app never buys or sells.</p>
    <div class="ctlline t-label" role="group" aria-label="Goal">${Object.entries(GOALS).map(([k, G]) => `<button class="chip${P.goal === k ? " on" : ""}" type="button" data-act="pfgoal" data-v="${k}" aria-pressed="${P.goal === k}">${goalIc(k)} ${G.nm}</button>`).join("")}</div>
    <p class="t-label sub">${esc(p.G.line)}</p>
    <p class="mline">Meter <b class="num">${m ? m.total : "–"}</b> · experts ${avg != null ? `<b class="num">${FMT.num(avg, 0)}%</b> <span class="vgp" style="--vgc:var(--vg-${g[1]})">${g[0]}</span>` : "–"} · Shares ${FMT.pctPlain(p.eqNow, 0)} → ${p.G.eq}%</p>
    ${grp("first", "Do first", false)}${grp("then", "Then", true)}${grp("later", "Later", true)}${grp("always", "Always", false)}${trialHTML()}</section>`;
}
// ---- E: budget planner ----
function budgetPlan(amount, goal) {
  const G = GOALS[goal] || GOALS.bal, core = amount * G.core / 100, stock = amount - core;
  const n = Math.max(3, Math.min(20, Math.floor(stock / 8000))), per = stock / n, cap = 0.3 * stock, secUsed = {}, rows = [];
  const pool = ["buy", "acc"].flatMap(g => S.stocks.filter(s => !s.ow && s.close && planG(s) === g).sort((a, b) => (qOf(b) ?? 0) - (qOf(a) ?? 0)));
  for (const s of pool) { if (rows.length >= n) break; const k = skOf(s), q = Math.floor(per / s.close); if (q < 1) continue;
    if ((secUsed[k] || 0) + q * s.close > cap) continue; secUsed[k] = (secUsed[k] || 0) + q * s.close; rows.push({ sym: s.symbol, px: s.close, qty: q, value: q * s.close }); }
  const used = rows.reduce((a, r) => a + r.value, 0);
  return { core, stock, n: rows.length, per, rows, left: stock - used, G };
}
function budgetHTML(id) {
  const P = pfObj(id), A = +(USER.meta.budget || 200000), b = budgetPlan(A, P.goal);
  const E = expertsAll(b.rows).filter(e => e.sc != null).sort((x, y) => y.sc - x.sc), nm = e => e.who.split(" (")[0].split(" ").pop() + "-style";
  return `<section class="panel" id="budget"><h2>"If I had ₹___"</h2><div class="ctlline t-label" role="group" aria-label="Amount">${[[50000, "₹50k"], [200000, "₹2 L"], [500000, "₹5 L"], [1000000, "₹10 L"]].map(([v, l]) => `<button class="chip${A === v ? " on" : ""}" type="button" data-act="budget" data-v="${v}" aria-pressed="${A === v}">${l}</button>`).join("")}
      <label class="ctl">₹<input type="number" inputmode="numeric" min="10000" step="1000" data-budget value="${FMT.raw(A, 0)}" aria-label="Amount in rupees" class="mmin"></label></div>
    <div class="kvs"><div><span class="t-label sub">Index fund core (${b.G.core}%)</span><b class="num">${FMT.money(b.core, 0)}</b><span class="t-label sub">a Nifty 50 / Nifty Next 50 index fund</span></div><div><span class="t-label sub">Stocks (${100 - b.G.core}%)</span><b class="num">${FMT.money(b.stock, 0)}</b><span class="t-label sub">${b.n} stocks, about ${FMT.money(b.per, 0)} each</span></div></div>
    ${b.rows.length ? dataTable({ cols: [{ k: "s", h: "Stock" }, { k: "p", h: "Price" }, { k: "q", h: "Shares" }, { k: "v", h: "Amount" }], rows: b.rows.map(r => ({ cells: {}, raw: { s: `<a href="${stockHref(r.sym)}">${esc(BY[r.sym].name)}</a>`, p: OWNER() ? omRow() : inr(r.px), q: FMT.count(r.qty), v: FMT.money(r.value, 0) } })),
      foot: [{ cells: {}, cls: "srow", raw: { s: "Cash left over", p: "", q: "", v: FMT.money(b.left, 0) } }], cls: "budtab", label: "Budget plan" }) : `<p class="sub">No Buy or Accumulate stock fits these amounts today.</p>`}
    ${E.length >= 2 ? `<p class="mline">Experts on this plan: best ${E.slice(0, 2).map(e => `${nm(e)} ${e.grade[0]}`).join(" · ")}; weakest ${E.slice(-2).reverse().map(e => `${nm(e)} ${e.grade[0]}`).join(" · ")}.</p>` : ""}
    <p class="t-label sub">Picks: today's Rules v1.0 Buy, then Accumulate, by quality; at most 30% of the stock part in one sector; whole shares at today's close. ${COACH_LINE}</p></section>`;
}
// ---- F: other money per portfolio ----
function otherHTML(id) {
  if (id === PF_FAMILY) return "";
  const o = (pfObj(id).other) || {};
  return `<details class="panel" id="other"><summary>Other money in this portfolio (optional)</summary><div class="ogrid">${[["debt", "Debt funds / FD"], ["mf", "Equity mutual funds"], ["gold", "Gold"], ["cash", "Cash"]].map(([k, l]) =>
    `<label class="fl">${l} (₹)<input type="number" inputmode="numeric" min="0" step="1000" data-other="${k}" value="${o[k] ? FMT.raw(o[k], 0) : ""}"></label>`).join("")}</div>
    <p class="t-label sub">Counted in the shares / debt mix of What to do (equity funds count as shares) and in the crash test. Only in this browser.</p></details>`;
}
// ---- G: crash test ----
function crashOf(id) {
  const C = S.crash, rows = pfRows(id), o = pfObj(id).other || {}; if (!C) return null;
  return Object.keys(C.windows).map((k, i) => { let loss = 0, est = 0, V = 0;
    rows.forEach(r => { const f = C.sym && C.sym[r.sym] && C.sym[r.sym][i] != null ? C.sym[r.sym][i] : (est++, C.n500[k].fall); loss += r.value * f / 100; V += r.value; });
    if (+o.mf) { loss += +o.mf * C.n500[k].fall / 100; V += +o.mf; est++; }
    V += (+o.debt || 0) + (+o.cash || 0) + (+o.gold || 0);
    return { k, from: C.windows[k][0], to: C.windows[k][1], pct: V ? loss / V * 100 : null, rs: loss, est, n: rows.length, idx: C.n500[k] }; });
}
function crashHTML(id) {
  const R = crashOf(id); if (!R) return "";
  return `<section class="panel" id="crash"><h2>Crash test</h2><p class="sub">If 2008 or 2020 happened tomorrow: each holding's own peak-to-low fall in that window, from our NSE price history.</p>
    ${R.map(x => `<div class="crow"><b>${x.k}</b><span class="t-label sub">${FMT.date(x.from)} → ${FMT.date(x.to)}</span><span class="num">${x.pct == null ? "–" : moveNum(x.pct, FMT.pct(x.pct, 0))} · ${OWNER() ? omRow() : moveNum(x.rs, FMT.moneySigned(x.rs, 0))}</span>
      <span class="t-label sub">Nifty 500 fell ${FMT.pct(x.idx.fall, 0)}; it took ${x.idx.recover_months != null ? `about ${x.idx.recover_months} months` : "–"} to get back (${esc(x.idx.src)})${x.est ? ` · ${x.est} holding${x.est === 1 ? "" : "s"} estimated with the Nifty 500 fall (not listed then)` : ""}</span></div>`).join("")}
    <p class="t-label sub">Debt funds, FD, cash and gold are counted as not falling (0%). Equity mutual funds fall like the Nifty 500.</p></section>`;
}
// ---- H: System vs Me ----
function tagOf(t) {
  const V = S.vh, s = BY[t.sym]; if (!V || !V.dates || !V.dates.length) return "before";
  if (t.date < V.dates[0]) return "before";
  const wk = V.weeks || [], i = wk.reduce((a, d, j) => d <= t.date ? j : a, -1), code = s && s.vh ? s.vh[i] : null;
  return code === "b" || code === "a" ? "system" : "mine";
}
function scoreHTML(id) {
  const tx = pfTx(id).filter(t => t.side !== "sell" && BY[t.sym]); if (!tx.length) return "";
  const grp = { system: [], mine: [], before: [] }; tx.forEach(t => grp[tagOf(t)].push(t));
  const row = (nm, list) => { if (!list.length) return null; const syms = new Set(list.map(t => t.sym)), all = pfTx(id).filter(t => syms.has(t.sym) && list.some(x => x.sym === t.sym));
    const v = UL.portfolio(all, priceOf, PDAY).totals.value, first = all.reduce((m, t) => t.date < m ? t.date : m, all[0].date);
    const x = UL.days(first, PDAY) >= 30 ? UL.xirr(UL.flowsOf(all, v, PDAY)) : null, bc = allBench() ? UL.benchCompare(all, LEVEL, PDAY) : null;
    const xb = bc && UL.days(first, PDAY) >= 30 ? UL.xirr(UL.flowsOf(all, bc.value, PDAY)) : null;
    return { nm, n: syms.size, x, xb }; };
  const R = [row("System picks", grp.system), row("My picks", grp.mine), row("Before the log", grp.before)].filter(Boolean);
  const nov = TODAY.slice(5, 7) === "11", sys = R.find(r => r.nm === "System picks"), g = S.portfolio && S.portfolio.stats;
  const hist = USER.meta.scorecards || {}, last2 = [String(+TODAY.slice(0, 4) - 1), String(+TODAY.slice(0, 4) - 2)].map(y => hist[y]);
  const card = !nov ? "" : sys && sys.x != null && sys.xb != null ? (sys.x > sys.xb ? `<p class="mline">November scorecard: system picks beat the Nifty 500 TRI this year – you could raise the system part by 10 points (cap 50%).</p>`
      : last2.every(v => v === false) ? `<p class="mline">November scorecard: system picks lagged 2 years in a row – consider cutting the system part to 20% and reviewing the rules.</p>` : `<p class="mline">November scorecard: system picks lagged the Nifty 500 TRI this year – keep the system part as it is and check again next November.</p>`)
    : `<p class="mline">November scorecard: needs 30+ days of system picks to compare.</p>`;
  return `<section class="panel" id="score"><h2>System vs Me</h2><p class="sub">Each buy is tagged on its date: <b>System pick</b> if that day's Rules v1.0 verdict (the write-once verdict log) was Buy or Accumulate, otherwise <b>My pick</b>.</p>
    ${dataTable({ cols: [{ k: "a", h: "Group" }, { k: "b", h: "Stocks" }, { k: "c", h: "XIRR" }, { k: "d", h: "Nifty 500 TRI, same cash flows" }], rows: R.map(r => ({ cells: {}, raw: { a: r.nm, b: FMT.count(r.n), c: r.x == null ? "after 30 days" : moveNum(r.x, FMT.pct(r.x, 1)), d: r.xb == null ? "–" : moveNum(r.xb, FMT.pct(r.xb, 1)) } })), cls: "scoretab", label: "System vs Me" })}
    ${card}${g && g.started ? `<p class="t-label sub">Ghost Rules v1.0 (paper, since ${FMT.date(g.started)}): ${moveNum(g.ret, FMT.pct(g.ret, 2))} vs Nifty 500 TRI ${g.bench_ret && g.bench_ret["NIFTY 500 TRI"] != null ? moveNum(g.bench_ret["NIFTY 500 TRI"], FMT.pct(g.bench_ret["NIFTY 500 TRI"], 2)) : "–"} – the model's own record, labelled.</p>` : ""}</section>`;
}
// ---- I3: goal tracker ----
function sipNeeded(target, pv, years, ret) { const m = Math.max(1, Math.round(years * 12)), i = Math.pow(1 + ret / 100, 1 / 12) - 1, fv = pv * Math.pow(1 + i, m);
  if (fv >= target) return 0; return (target - fv) * i / (Math.pow(1 + i, m) - 1); }
function goalsHTML(id) {
  const G = USER.goals || [], pv = pfValue(id) + otherSum((pfObj(id) || {}).other), goal = GOALS[(pfObj(id) || {}).goal || "bal"];
  return `<section class="panel" id="goals"><h2>Goal tracker</h2>
    ${G.map(g => { const yrs = (new Date(g.date + "T00:00:00") - new Date(TODAY + "T00:00:00")) / (365.25 * 864e5), need = yrs > 0 ? sipNeeded(g.target, g.pv ?? pv, yrs, g.ret ?? goal.ret) : null;
      const ok = need != null && (g.sip || 0) >= need;
      return `<div class="gcard"><div class="etop"><b>${esc(g.name)}</b><button class="act" type="button" data-act="goaldel" data-v="${esc(g.id)}" aria-label="Delete goal ${esc(g.name)}">Delete</button></div>
        <p class="mini">${FMT.money(g.target, 0)} by ${FMT.date(g.date)} at ${FMT.pctPlain(g.ret ?? goal.ret, 0)} a year, starting from ${FMT.money(g.pv ?? pv, 0)}.</p>
        <p class="mline">${need == null ? "The date has passed." : `SIP needed: <b class="num">${FMT.money(need, 0)}</b> a month · ${ok ? "<b>On track</b>" : `<b>Behind by ${FMT.money(need - (g.sip || 0), 0)} a month</b> (you put in ${FMT.money(g.sip || 0, 0)})`}`}</p></div>`; }).join("")}
    <form id="goalform" class="ogrid"><label class="fl">Goal<input name="name" maxlength="40" placeholder="e.g. House" required></label><label class="fl">Target (₹)<input name="target" type="number" min="1000" step="1000" required></label>
      <label class="fl">By<input name="date" type="date" required></label><label class="fl">Return % a year<input name="ret" type="number" step="0.5" value="${goal.ret}"></label>
      <label class="fl">Your SIP a month (₹)<input name="sip" type="number" min="0" step="500" value="0"></label><button class="act" type="submit">Add goal</button></form>
    <p class="t-label sub">Return by goal: Safer 9% · Balanced 11% · Higher return 12% a year (editable). SIP = (target − today's money grown at that rate) × i ÷ ((1 + i)^months − 1), i = the monthly rate.</p></section>`;
}
// ---- A: the portfolio pills, count line and the coach sections ----
function pfBarHTML() {
  const L = pfList(), cur = pfCur(), tot = L.reduce((a, p) => a + pfValue(p.id) + otherSum(p.other), 0), me = cur === PF_FAMILY ? tot : pfValue(cur) + otherSum(pfObj(cur).other);
  return `<nav class="chiprow pfbar" aria-label="Portfolios">${L.map(p => `<button class="chip${p.id === cur ? " on" : ""}" type="button" data-act="pfsel" data-v="${esc(p.id)}" aria-pressed="${p.id === cur}">${esc(p.name)}</button>`).join("")}
      ${L.length > 1 ? `<button class="chip${cur === PF_FAMILY ? " on" : ""}" type="button" data-act="pfsel" data-v="${PF_FAMILY}" aria-pressed="${cur === PF_FAMILY}">Family</button>` : ""}
      ${L.length < PF_MAX ? `<button class="chip" type="button" data-act="pfnew">+ New</button>` : ""}</nav>
    <p class="t-label sub pfcount">${FMT.count(L.length)} portfolio${L.length === 1 ? "" : "s"} · together ${OWNER() ? "hidden" : FMT.money(tot, 0)}${cur !== PF_FAMILY && L.length > 1 && tot ? ` · this one is ${FMT.pctPlain(me / tot * 100, 0)} of your money` : ""}
      ${cur === PF_FAMILY && worldINR() ? `<br>World portfolios: ${OWNER() ? "hidden" : FMT.money(worldINR(), 0)} (${worldINRNote()}) – counted as shares in the safety-money mix` : ""}
      ${cur !== PF_FAMILY ? ` · <button class="linkbtn" type="button" data-act="pfedit" data-v="${esc(cur)}">Rename / move / delete</button>` : ""}</p>${PF_UNDO ? `<p class="mline">Deleted “${esc(PF_UNDO.p.name)}”. <button class="act" type="button" data-act="pfundo">Undo</button></p>` : ""}`;
}
function coachHTML(id) { const rows = pfRows(id); return meterHTML(meterOf(rows)) + (rows.length ? expertsHTML(rows) + whatToDoHTML(id) : "") + budgetHTML(id) + otherHTML(id) + (rows.length ? crashHTML(id) + scoreHTML(id) : "") + goalsHTML(id); }
let PF_UNDO = null;
function pfSheet(id) {
  const p = pfList().find(x => x.id === id) || { id: "", name: "", goal: "bal" }, i = pfList().indexOf(p);
  sheet(`<h2>${p.id ? "Portfolio" : "New portfolio"}</h2><form id="pfform" data-id="${esc(p.id)}"><label class="fl">Name<input name="name" maxlength="30" required value="${esc(p.name)}"></label>
    <label class="fl">Goal<select name="goal">${Object.entries(GOALS).map(([k, G]) => `<option value="${k}"${p.goal === k ? " selected" : ""}>${G.nm}</option>`).join("")}</select></label>
    <div class="btnrow"><button class="act big primary" type="submit">Save</button>${p.id ? `<button class="act" type="button" data-pfmove="-1"${i > 0 ? "" : " disabled"}>↑ Move up</button><button class="act" type="button" data-pfmove="1"${i < pfList().length - 1 ? "" : " disabled"}>↓ Move down</button>${pfList().length > 1 ? `<button class="act" type="button" data-pfdel="1">Delete</button>` : ""}` : ""}<button class="act" type="button" data-close>Cancel</button></div></form>`);
  const f = document.getElementById("pfform");
  f.addEventListener("submit", e => { e.preventDefault(); const name = f.name.value.trim().slice(0, 30) || "Portfolio";
    if (p.id) Object.assign(p, { name, goal: f.goal.value }); else if (pfList().length < PF_MAX) { const n = { id: "pf" + Date.now().toString(36), name, goal: f.goal.value, other: {} }; USER.pfs.push(n); USER.meta.pfCur = n.id; }
    persist(); closeSheet(); render(true); });
  f.addEventListener("click", e => { const mv = e.target.closest("[data-pfmove]"); if (mv) { const L = USER.pfs, j = i + +mv.dataset.pfmove; [L[i], L[j]] = [L[j], L[i]]; persist(); closeSheet(); render(true); return; }
    if (e.target.closest("[data-pfdel]")) { if (!confirm(`Delete “${p.name}”? Its trades are kept for 10 seconds so you can undo.`)) return;
      const tx = USER.tx.filter(t => t.pf === p.id); PF_UNDO = { p, i, tx }; USER.pfs = USER.pfs.filter(x => x.id !== p.id); USER.tx = USER.tx.filter(t => t.pf !== p.id); USER.meta.pfCur = USER.pfs[0].id; persist(); closeSheet(); render(true);
      setTimeout(() => { if (PF_UNDO && PF_UNDO.p === p) { PF_UNDO = null; if (parseHash().name === "portfolio") render(true); } }, 10000); } });
}
function pfUndo() { if (!PF_UNDO) return; USER.pfs.splice(PF_UNDO.i, 0, PF_UNDO.p); USER.tx.push(...PF_UNDO.tx); USER.meta.pfCur = PF_UNDO.p.id; PF_UNDO = null; persist(); render(true); }
screenEl.addEventListener("change", e => { const o = e.target.closest("[data-other]"); if (o) { const p = pfObj(pfCur()); p.other = p.other || {}; p.other[o.dataset.other] = Math.max(0, +o.value || 0); persist(); const y = scrollY; render(true); scrollTo(0, y); return; }
  const b = e.target.closest("[data-budget]"); if (b && +b.value >= 10000) { USER.meta.budget = Math.round(+b.value); persist(); const y = scrollY; render(true); scrollTo(0, y); } });
screenEl.addEventListener("change", e => {
  if (e.target.matches("[data-planrules]")) { prefSet(PLAN_RULES, e.target.value); render(true); } });
screenEl.addEventListener("submit", e => { if (e.target.id !== "goalform") return; e.preventDefault(); const f = e.target; USER.goals = USER.goals || [];
  USER.goals.push({ id: "g" + Date.now().toString(36), name: f.name.value.trim().slice(0, 40), target: +f.target.value, date: f.date.value, ret: +f.ret.value || null, sip: +f.sip.value || 0 }); persist(); const y = scrollY; render(true); scrollTo(0, y); });
function rebalCardHTML() {
  if (!isRebalDay() || !USER.tx.length) return "";
  const items = pfList().flatMap(p => { const pl = planOf(p.id); return [...pl.A.then, ...pl.A.later].map(x => `${p.name}: ${x}`); });
  return `<section class="panel" id="rebal"><h2>Rebalance day</h2><p class="sub">${COACH_LINE}</p><ul class="mini">${items.map(x => `<li>${esc(x)}</li>`).join("") || "<li>Nothing to rebalance.</li>"}</ul><p class="mline"><a href="#/portfolio">Open Portfolio ›</a></p></section>`;
}
// ---- #76 B + lesson 3: tap any financial row → the chart sheet (line / bars, the band, ⤓, "+ Add stock" up to 5) ----
// series keys a chart can show for any stock (list rows carry them in s.fh; full stock files in fund.history / fund.st)
const FIN_KEYS = { revenue_cr: ["Sales", "cr", "bar"], pat_cr: ["Net profit", "cr", "bar"], op_profit_cr: ["Operating profit", "cr", "bar"], cfo_cr: ["Cash from operations", "cr", "bar"],
  equity_cr: ["Net worth", "cr", "bar"], eps: ["EPS (₹)", "num", "bar"], roce: ["ROCE", "pct"], roe: ["ROE", "pct"], op_margin: ["Operating margin", "pct"], de: ["Debt / equity", "x"], cfo_pat: ["Cash from operations ÷ profit", "x"] };
const ST2FIN = { rev: "revenue_cr", pat: "pat_cr", ebit: "op_profit_cr", cfo: "cfo_cr", equity: "equity_cr", eps: "eps", cfo_pat: "cfo_pat" };
function finVals(s, key) {
  const o = {}; gmSeries(s, key).forEach(([y, v]) => { if (v != null) o[y] = v; });
  if (Object.keys(o).length) return o;
  const st = s.fund && s.fund.st, row = st && Object.values(st.s).flat().find(r => r[0] === key);     // a statement-only line
  if (row) st.y.forEach((y, i) => { if (row[3][i] != null) o[y] = row[3][i]; });
  return o;
}
const CS = { sym: null, key: null, kind: null, others: [] };
function chartSheet(sym, key) {
  const s = BY[sym]; if (!s) return;
  key = ST2FIN[key] || key;
  if (CS.sym !== sym || CS.key !== key) Object.assign(CS, { kind: null, others: CS.sym === sym ? CS.others : [] }, { sym, key });
  const st = s.fund && s.fund.st, stRow = st && Object.values(st.s).flat().find(r => r[0] === key);
  const meta = FIN_KEYS[key] || (stRow ? [stRow[1], stRow[2] === "rs" ? "num" : stRow[2], stRow[2] === "cr" ? "bar" : "line"] : [key, "num"]);
  const kind = CS.kind || (CS.others.length ? "line" : meta[2] || "line");
  const all = [s, ...CS.others.map(x => BY[x]).filter(Boolean)];
  const series = all.map(x => ({ name: x.name, vals: finVals(x, key) }));
  const ys = [...new Set(series.flatMap(x => Object.keys(x.vals)))].sort();
  const tk = key === "revenue_cr" ? "rev" : key === "pat_cr" ? "pat" : null, ttm = tk && st && st.ttm ? st.ttm[tk] : null;
  if (ttm != null && !CS.others.length) { ys.push("TTM"); series[0].vals.TTM = ttm; }
  const peers = peerList(s).filter(p => !CS.others.includes(p.symbol)).slice(0, 5);
  const span = ys.length ? `${ys[0]}–${ys[ys.length - 1]}` : "no years";
  sheet(`<div class="csheet"><h2>${esc(meta[0])}</h2><p class="t-label sub">${esc(s.name)}${CS.others.length ? ` and ${CS.others.length} more` : ""} · ${esc(span)}</p>
    <div class="ctlline t-label" role="group" aria-label="Chart controls">${[["line", "Line"], ["bar", "Bars"]].map(([k, nm]) => `<button class="chip${kind === k ? " on" : ""}" type="button" data-cs="kind" data-v="${k}" aria-pressed="${kind === k}">${nm}</button>`).join("")}</div>
    ${finChart({ title: meta[0] + (meta[1] === "cr" ? " (₹ crore)" : ""), unit: meta[1], kind, ys, series, key, ttm: ttm != null && !CS.others.length ? "TTM" : null, band: true,
      dl: `${s.name}${CS.others.length ? " vs " + CS.others.join(", ") : ""} · ${meta[0]} · ${span}` })}
    <h3 class="minor">+ Add stock <span class="sub">(up to 5 lines, same years and unit; a missing year is a gap)</span></h3>
    ${CS.others.length ? `<div class="chiprow">${CS.others.map(x => `<button class="chip on" type="button" data-cs="del" data-v="${esc(x)}" aria-label="Remove ${esc(x)}">${esc(x)} ✕</button>`).join("")}</div>` : ""}
    ${all.length < 5 ? `<div class="chiprow">${peers.map(p => `<button class="chip" type="button" data-cs="add" data-v="${esc(p.symbol)}">+ ${esc(p.symbol)}</button>`).join("")}</div>
    <label class="fl">Find a stock<input type="search" id="csq" list="cslist" placeholder="symbol, e.g. INFY" autocomplete="off"></label><datalist id="cslist">${S.stocks.filter(x => x !== s).map(x => `<option value="${esc(x.symbol)}">${esc(x.name)}</option>`).join("")}</datalist>` : `<p class="t-label sub">Five lines is the most one chart shows.</p>`}
    <div class="btnrow"><button class="act" type="button" data-close>Close</button></div></div>`);
  const d = document.getElementById("sheet"); dlPass(d);
  const q = d.querySelector("#csq"); if (q) q.addEventListener("change", () => { const v = q.value.trim().toUpperCase(); if (BY[v] && v !== sym) csAdd(v); });
}
function csAdd(x) { if (CS.others.includes(x) || CS.others.length >= 4) return; CS.others.push(x); CS.kind = "line";
  ensureFull(x).then(() => { if (document.getElementById("sheet").open) chartSheet(CS.sym, CS.key); }); chartSheet(CS.sym, CS.key); }
document.getElementById("sheet").addEventListener("click", e => {
  const dl = e.target.closest("[data-act=chartdl]"); if (dl) { const f = dl.closest("[data-chart]"); if (f) chartDlSheet(f); return; }
  const b = e.target.closest("[data-cs]"); if (!b) return;
  if (b.dataset.cs === "kind") CS.kind = b.dataset.v; else if (b.dataset.cs === "add") return csAdd(b.dataset.v); else if (b.dataset.cs === "del") CS.others = CS.others.filter(x => x !== b.dataset.v);
  chartSheet(CS.sym, CS.key);
});
// taps and holds on a stock page: a statement row / trend chart / peer row → the chart sheet; hold a number 450 ms (or right-click) → its source
{ let ht = null, held = false;
  screenEl.addEventListener("click", e => {
    if (held) { held = false; e.preventDefault(); return; }
    if (e.target.closest("button, a, select, input, label, .dlx")) return;
    const r = parseHash(); if (r.name !== "stock") return;
    const row = e.target.closest("[data-strow]"), tc = e.target.closest("[data-trend]"), pr = e.target.closest("[data-peer]");
    if (row) chartSheet(r.arg, row.dataset.strow);
    else if (tc) chartSheet(r.arg, tc.dataset.trend);
    else if (pr) { Object.assign(CS, { sym: r.arg, key: "roce", kind: null, others: pr.dataset.peer === r.arg ? [] : [pr.dataset.peer] }); ensureFull(pr.dataset.peer).then(() => chartSheet(r.arg, "roce")); }
  });
  screenEl.addEventListener("keydown", e => { if (e.key !== "Enter" && e.key !== " ") return; const t = e.target.closest("[data-strow], [data-trend]"); if (!t || e.target.closest("button, a, select, input")) return; e.preventDefault(); t.click(); });
  const cellAt = el => { const td = el && el.closest && el.closest("td, [data-cell]"); return td ? (td.matches("[data-cell]") ? td : td.querySelector("[data-cell]")) : null; };
  screenEl.addEventListener("touchstart", e => { const c = cellAt(e.target); if (!c) return; held = false; clearTimeout(ht); ht = setTimeout(() => { held = true; cellSourceSheet(parseHash().arg, c.dataset.cell); }, 450); }, { passive: true });
  ["touchend", "touchmove", "touchcancel"].forEach(ev => screenEl.addEventListener(ev, () => clearTimeout(ht), { passive: true }));
  screenEl.addEventListener("contextmenu", e => { const c = cellAt(e.target); if (!c) return; e.preventDefault(); e.stopPropagation(); cellSourceSheet(parseHash().arg, c.dataset.cell); }, true);
  screenEl.addEventListener("change", e => { const c = e.target.closest("[data-stp]"); if (!c) return;
    prefSet("screener.st." + c.dataset.stp, c.type === "checkbox" ? (c.checked ? "1" : "0") : c.value); const y = scrollY; render(true); scrollTo(0, y); });
}
// ---------- review #81 A5: the private site's first 30 days – "New address: take a Backup on the old site, Restore here" ----------
const CF_NOTE_DAYS = 30;
function cfNote() {
  const since = S.cf && S.cf.since; if (!since) return "";
  const d = Math.round((Date.parse(IST_TODAY()) - Date.parse(since)) / 864e5); if (d < 0 || d >= CF_NOTE_DAYS) return "";
  return `<p class="mline bkline cfnote">${ic("save")} New address: take a Backup on the old site, Restore here – <a href="#/settings/backup">Settings › Data &amp; backup</a></p>`;
}
// ---------- review #81 B6: Settings → Data & backup → "TIKR files: keep / delete when I cancel" ----------
// The choice is kept in this browser (USER.meta.tikr, so it travels in Backup). The nightly follows docs/tikr_retention.json in the
// repository; nothing is sent anywhere – the page shows the exact line to put there, a copy button and where to paste it on GitHub.
const TIKR_CHOICES = [["decide later", "Decide later"], ["keep", "Keep"], ["delete", "Delete"]];
function tikrPref() { const t = USER.meta.tikr || {}; return { choice: ["keep", "delete"].includes(t.choice) ? t.choice : "decide later", cancel_date: t.choice === "delete" && /^\d{4}-\d{2}-\d{2}$/.test(t.cancel_date || "") ? t.cancel_date : null }; }
function tikrLine(p) { return JSON.stringify({ choice: p.choice, cancel_date: p.cancel_date }); }
function tikrBox() {                                            // review #83 E: plain words; the repository detail only with maintenance notes on
  const p = tikrPref(), repo = (S.raw && S.raw.retention) || { choice: "decide later", cancel_date: null };
  const same = repo.choice === p.choice && (repo.cancel_date || null) === (p.cancel_date || null);
  return `<div id="tikrret" class="gi"><span class="gt">Data files from TIKR: keep or delete if I cancel<span class="gs">Only matters if you cancel TIKR. Nothing happens until you choose.</span></span>
    <div class="segpick" role="group" aria-label="Data files from TIKR">${TIKR_CHOICES.map(([v, l]) => `<button class="chip${p.choice === v ? " on" : ""}" type="button" data-act="tikrret" data-v="${v}" aria-pressed="${p.choice === v}">${l}</button>`).join("")}</div>
    ${p.choice === "delete" ? `<label class="tikrdate">Cancel date <input type="date" data-tikrdate="1" value="${esc(p.cancel_date || "")}"></label>
    <span class="gs">${p.cancel_date ? `On ${dateTxt(p.cancel_date)} your TIKR files, and the numbers only they gave, are deleted.` : "Pick the date your TIKR subscription ends."}</span>` : p.choice === "keep" ? `<span class="gs">Your TIKR files stay after you cancel.</span>` : ""}
    ${!same && !MAINT() ? `<span class="gs">One more step on GitHub makes it count – tick Show maintenance notes (Alerts &amp; checks) to see it.</span>` : ""}
    ${MAINT() ? `<span class="gs tikrmaint">Maintenance: the nightly follows docs/tikr_retention.json in your repository. It now says: <b>${esc(repo.choice)}${repo.cancel_date ? " on " + dateTxt(repo.cancel_date) : ""}</b>${same ? " – the same as here." : "."}</span>
    ${same ? "" : `<span class="gs">Your choice here is saved in this browser and in Backup only. For the nightly to follow it, put this line in that file:</span><p class="tikrline">${esc(tikrLine(p))}</p>
    <div class="btnrow"><button class="act" type="button" data-act="tikrcopy">Copy the line</button></div>
    <span class="gs">On GitHub: your repository → docs → tikr_retention.json → the pencil (Edit) → paste → Commit changes.</span>`}` : ""}</div>`;
}
function rawAct(act, el) {
  if (act === "rebalsheet") { rebalSheet(); return true; }
  if (act === "rebalsave") { rebalSave(); return true; }
  if (act === "tikrret") { USER.meta.tikr = { ...(USER.meta.tikr || {}), choice: el.dataset.v }; persist(); const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "tikrcopy") { copyText(tikrLine(tikrPref())).then(ok => toast(ok ? "Line copied" : "Couldn't copy")); return true; }
  if (act === "wlvf") { WL.vf = el.dataset.v || ""; saveWhere(); const y = scrollY; render(true); scrollTo(0, y); return true; }   // #83 M6
  if (act === "tofull") { openFull(); return true; }                                                                  // #83 N
  if (act === "tosplit") { prefSet(STOCK_OPEN_KEY, "split"); const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "dqf") { DQF = +el.dataset.v; const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "audtick") { const a = USER.meta.audit || (USER.meta.audit = {}); const k = el.dataset.k; a[k] = el.dataset.v === a[k] ? undefined : el.dataset.v; if (!a[k]) delete a[k]; persist(); const y = scrollY; render(true); scrollTo(0, y); return true; }
  return false;
}
document.addEventListener("change", e => { const d = e.target.closest && e.target.closest("[data-tikrdate]"); if (!d) return;
  USER.meta.tikr = { ...(USER.meta.tikr || {}), choice: "delete", cancel_date: d.value || null }; persist(); const y = scrollY; render(true); scrollTo(0, y); });
// ==================== review #81 C: the 7 checking layers (data/dq.json + data/lh/<SYMBOL>.json – private site only) ====================
// The nightly (pipeline/layers.py) checks every company-year value: 1 cross-source agreement, 2 accounting identities, 3 jumps,
// 4 golden set, 5 monthly spot audit, 6 data-quality score, 7 trail. The page loads the results once; the public copy has none.
function dqsRerender() { const n = parseHash().name; if (["dataquality", "checks", "stock", "home", "watchlist", "screens", "search"].includes(n)) { const y = scrollY; render(true); scrollTo(0, y); } }
const dqScore = sym => S.dqs && S.dqs.score && S.dqs.score[sym] != null ? S.dqs.score[sym] : null;
const dqLow = sym => { const v = dqScore(sym); return v != null && v < ((S.dqs && S.dqs.fail_below) || 60); };
const dqChip = s => dqLow(s.symbol) ? ` <a class="dbadge dqchip" href="#/dataquality?s=${esc(s.symbol)}">Data check failed (${FMT.count(dqScore(s.symbol))}/100)</a>` : "";
const dqFailLine = s => `<p class="bmv mline dqfail"><span class="dbadge"><b>Data check failed – no verdict</b></span> <span class="t-label sub">Rules v1.2: data-quality score ${FMT.count(dqScore(s.symbol))}/100 (below ${FMT.count(S.dqs.fail_below || 60)}) · <a href="#/dataquality?s=${esc(s.symbol)}">why</a></span></p>`;
const DQ_LAYERS = [[1, "Sources agree", "every company-year line compared across TIKR, Screener, NSE XBRL and Yahoo (0.5%)"], [2, "Accounting adds up", "assets = liabilities + equity · PBT − tax = profit · CFO + CFI + CFF = change in cash · EPS × shares ≈ profit (1%)"],
  [3, "No odd jumps", "profit or sales changing over 3× · share count changing with no split / bonus / issue · a day's price move over 20% · NSE vs BSE close over 0.5%"],
  [4, "Golden set", "25 companies' key lines checked against the annual reports by hand (0.5%)"]];
const DQ_LINE = { rev: "Sales", pat: "Net profit", equity: "Net worth", debt: "Debt", cfo: "Cash from operations", ta: "Total assets", tl: "Total liabilities", pbt: "Profit before tax", tax: "Tax", eps: "EPS", shares: "Shares",
  cfi: "Cash from investing", cff: "Cash from financing", net_cash: "Change in cash", cogs: "Cost of goods sold", gross_profit: "Gross profit", price: "Price", ebitda: "EBITDA", ebit: "Operating profit", interest: "Interest", dep: "Depreciation",
  cash: "Cash", inv: "Inventory", rec: "Receivables", cl: "Current liabilities", ca: "Current assets", pay: "Payables", ltd: "Long-term debt", capex: "Capex", sga: "Selling & admin", other_income: "Other income" };
const DQ_SEV = { red: "🔴", orange: "🟠", yellow: "🟡", flag: "⚑", info: "ⓘ" };
let DQF = 0;
function goldenTop() {
  const g = S.dqs && S.dqs.golden; if (!g || !(g.red || []).length) return "";
  return `<section class="panel noterm goldred"><h2>🔴 Golden set: ${FMT.count(g.red.length)} ${g.red.length === 1 ? "value doesn't" : "values don't"} match the annual report</h2><ul class="plain">${g.red.map(x =>
    `<li><a href="${stockHref(x.symbol)}">${esc(x.symbol)}</a> · FY${esc(String(x.fy).slice(2))} ${esc((DQ_LINE[x.line] || x.line).toLowerCase())}: annual report <b class="num">${FMT.cr(x.golden, 0)}</b> vs ours <b class="num">${FMT.cr(x.ours, 0)}</b> (${FMT.num(x.gap_pct, 1)}% apart; ${esc(x.src)})</li>`).join("")}</ul>
    <p class="mini sub">From docs/golden_set.csv, which you fill by hand. Nothing is changed automatically – check the filing, then the source.</p></section>`;
}
function auditPick(month) {
  const P = (S.dqs && S.dqs.pool) || []; if (!P.length) return [];
  let h = 2166136261; for (const ch of "audit" + month) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const rnd = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const idx = P.map((_, i) => i); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, 12).map(i => P[i]);
}
function auditHTML() {
  const month = IST_TODAY().slice(0, 7), pick = auditPick(month), A = USER.meta.audit || {}, ai = !!(S.reader && S.reader.on);
  if (!pick.length) return "";
  const li = (p, mine) => { const k = `${month}|${p[0]}|${p[1]}|${p[2]}`, t = A[k];
    return `<li class="audrow"><span><a href="${stockHref(p[0])}">${esc(p[0])}</a> · FY${esc(String(p[1]).slice(2))} ${esc((DQ_LINE[p[2]] || p[2]).toLowerCase())} <b class="num">${p[2] === "shares" ? FMT.count(p[3]) : p[2] === "eps" ? inr(p[3], 2) : FMT.cr(p[3], 0)}</b> <span class="sub">(${esc(p[4])})</span> · <a href="${esc(p[6])}" target="_blank" rel="noopener">filing</a></span>
      ${mine ? `<span class="btnrow"><button class="chip${t === "ok" ? " on" : ""}" type="button" data-act="audtick" data-k="${esc(k)}" data-v="ok" aria-pressed="${t === "ok"}">Matches</button><button class="chip${t === "bad" ? " on" : ""}" type="button" data-act="audtick" data-k="${esc(k)}" data-v="bad" aria-pressed="${t === "bad"}">Doesn't match</button></span>` : ""}</li>`; };
  const done = pick.slice(10).filter(p => A[`${month}|${p[0]}|${p[1]}|${p[2]}`]).length;
  return `<section class="panel noterm" id="dqaudit"><h2>Monthly spot audit · ${esc(FMT.date(month + "-01"))}</h2>
    <p class="sub">On the 1st the page picks 12 random company-year values with a link to the filing: 10 for the AI reviewer and 2 for you. Your ticks stay in this browser and in Backup.</p>
    <h3 class="minor">For you (${FMT.count(done)} of 2 checked)</h3><ul class="plain audlist">${pick.slice(10).map(p => li(p, true)).join("")}</ul>
    <h3 class="minor">For the AI reviewer</h3><p class="mini sub">${ai ? "Checked by the AI reviewer with the nightly." : "The AI reviewer is off (no API spending), so these 10 wait. You can check them yourself."}</p>
    <ul class="plain audlist mini">${pick.slice(0, 10).map(p => li(p, false)).join("")}</ul></section>`;
}
function dq7HTML() {
  const d = S.dqs;
  if (!d) return `<section class="panel noterm" id="dq7"><h2>The 7 data checks</h2><p class="sub">${DQS_STATE === "loading" ? "Loading…" : "They run every night, but their results are on the private site only (they use your TIKR files)."}</p></section>`;
  const t = d.total || {}, imp = d.imports || {}, sel = new URLSearchParams((location.hash.split("?")[1] || "")).get("s");
  const fl = (d.flags || []).filter(f => (!DQF || f.layer === DQF) && (!sel || f.symbol === sel));
  const by = l => (d.flags || []).filter(f => f.layer === l && f.sev !== "info").length;
  const g = d.golden || {}, low = d.low || [];
  const st = imp.status || {}, wait = Object.values(st).some(x => x === "waiting for samples");
  return `<section class="panel noterm" id="dq7"><h2>The 7 data checks · every value, every night</h2>
    <p class="sub">Run ${esc(FMT.date(d.built))} over ${FMT.count(d.keys)} company-year values. Flags are never fixed automatically.</p>
    ${dqFilingsHTML(d, sel)}
    <p class="mline dqsum"><span>✅ <b class="num">${FMT.count(t.agreed || 0)}</b> agreed</span> · <span>🟡 <b class="num">${FMT.count(t.two_agree || 0)}</b> two agree, one differs</span> · <span>🟠 <b class="num">${FMT.count((t.single || 0) + (t.differ || 0))}</b> single source or all differ</span></p>
    ${dataTable({ cols: [{ k: "l", h: "Layer · what it checks" }, { k: "n", h: "Flags" }], label: "Checking layers", cls: "dqlayers",
      rows: [...DQ_LAYERS.map(([n, a, b]) => [`${n}. ${a}`, b, FMT.count(by(n))]), ["5. Spot audit", "12 random values a month, with links to the filing (below)", FMT.DASH],
        ["6. Score", `0–100 per stock from layers 1–4; below ${d.fail_below || 60} → “Data check failed – no verdict” (Rules v1.2)`, FMT.count(low.length)],
        ["7. Trail", "hold any number on a stock's Statements for its source, file, date and version", FMT.DASH]]
        .map(([a, b, n]) => ({ cells: {}, raw: { l: `<b>${esc(a)}</b><br><span class="sub dqwhat">${esc(b)}</span>`, n } })) })}
    <p class="mini sub">${esc(d.bse || "")} · Golden set: ${FMT.count(g.filled || 0)} of ${FMT.count(g.rows || 0)} values filled in docs/golden_set.csv${(g.red || []).length ? ` – <b>${FMT.count(g.red.length)} 🔴 mismatch${g.red.length === 1 ? "" : "es"}</b> (top of Checks)` : ""}.</p>
    ${low.length ? `<h3 class="minor">Data check failed – no Rules v1.2 verdict (${FMT.count(low.length)})</h3><p class="mline dqlow">${low.slice(0, 60).map(x => `<a class="chip" href="#/dataquality?s=${esc(x)}">${esc(x)} ${FMT.count(d.score[x])}</a>`).join(" ")}</p>` : ""}
    <h3 class="minor">Flags${sel ? ` for ${esc(sel)} (data-quality score ${FMT.count(dqScore(sel) ?? 100)}/100) · <a href="#/dataquality">all</a>` : ""}</h3>
    <div class="chiprow" role="group" aria-label="Show flags of one layer">${[[0, "All"], [1, "1 · sources"], [2, "2 · identities"], [3, "3 · jumps"], [4, "4 · golden"]].map(([v, l]) => `<button class="chip${DQF === v ? " on" : ""}" type="button" data-act="dqf" data-v="${v}" aria-pressed="${DQF === v}">${l}</button>`).join("")}</div>
    ${fl.length ? dataTable({ cols: [{ k: "s", h: "Flag" }, { k: "y", h: "Layer" }], label: "Flags", cls: "dqflags",
      rows: fl.slice(0, 80).map(f => ({ cells: {}, raw: { s: `${DQ_SEV[f.sev] || ""} <a href="${stockHref(f.symbol)}">${esc(f.symbol)}</a>${f.fy ? " · FY" + esc(String(f.fy).slice(2)) : ""}<br><span class="dqwhat">${f.line ? esc(DQ_LINE[f.line] || f.line) + ": " : ""}${esc(f.why)}</span>`,
        y: FMT.count(f.layer) } })) }) : `<p class="sub">No flags${DQF ? " in this layer" : ""}.</p>`}
    ${fl.length > 80 ? `<p class="mini sub">First 80 of ${FMT.count(fl.length)} shown.</p>` : ""}
    <details class="mini"><summary>How the score is worked out</summary><p>100, minus: ½ point per single-source value (at most 20) · 5 per “two agree, one differs” (at most 30) · 8 per “all differ” (at most 40) · 10 per broken accounting identity (at most 40) · 8 per unexplained jump (at most 40) · 25 per golden-set mismatch (at most 60). A stock with nothing to check keeps 100.</p>
      <p><b>Point in time:</b> backtests and the ghost portfolios may use only “as first reported” values, from 45 days after the period end; restated values are for the stock page. <b>Survivorship:</b> delisted or merged companies in the uploads are kept for the years they existed${(d.delisted || []).length ? ` (${esc(d.delisted.join(", "))})` : ""}. <b>Demergers:</b> a history reset (#71 G) explains a jump in that year.</p></details>
    </section>
    <section class="panel noterm" id="dqimp"><h2>Your uploads (data/raw – never published)</h2>
    <p class="sub">Parsers: TIKR statements ${esc(st.tikr || "–")} · TIKR screen file ${esc(st.screen || "–")} · Screener export ${esc(st.screener || "–")}.${wait ? " They were written on hand-made test files; the first real files you upload will be checked against them." : ""}</p>
    ${(imp.read || []).length ? dataTable({ cols: [{ k: "f", h: "File" }, { k: "n", h: "Values" }, { k: "c", h: "Companies" }], label: "Files read", cls: "dqfiles",
      rows: imp.read.map(r => ({ cells: { n: r.values, c: r.n_symbols }, raw: { f: `<span class="dqwhat">${esc(r.file)}</span><br><span class="mini sub">${esc(r.source)} · uploaded ${esc(FMT.date(r.uploaded))}</span>`, n: FMT.count(r.values), c: FMT.count(r.n_symbols) } })) }) : `<p class="sub">No files uploaded yet. Upload with GitHub: data/raw/tikr or data/raw/screener → Add file → Upload files.</p>`}
    ${(imp.failed || []).length ? `<h3 class="minor">Couldn't read (${FMT.count(imp.failed.length)})</h3><ul class="plain dqfail-list">${imp.failed.map(x => `<li><b>${esc(x.file)}</b> – ${esc(x.why)}</li>`).join("")}</ul>` : ""}
    ${(imp.unmatched || []).length ? `<h3 class="minor">Screen rows not matched to an NSE stock (${FMT.count(imp.unmatched.length)}) – never guessed</h3><ul class="plain dqunm">${imp.unmatched.slice(0, 50).map(x => `<li>${esc(x.name || x.ticker)}${x.ticker && x.name ? ` (${esc(x.ticker)})` : ""} – ${esc(x.why)} <span class="sub">(${esc(x.file)})</span></li>`).join("")}</ul>` : ""}
    ${imp.fx_rule ? `<h3 class="minor">Screen files in US$ → ₹ at each fiscal year's own rate</h3>
    <p class="mini sub">TIKR's screener puts old years in ₹ at today's rate, so screens are copied in US$ and converted here with that year's USD/INR rate. Year-average or year-end is picked per year by matching the NSE XBRL rupee figures within 0.5%.</p>
    ${dataTable({ cols: [{ k: "y", h: "Fiscal year · rule" }, { k: "m", h: "Matched" }], label: "USD/INR rule per year", cls: "dqfx",
      rows: Object.entries(imp.fx_rule).flatMap(([fy, v]) => Object.entries(v).map(([k, x]) => ({ cells: {}, raw: { y: `<b>FY${esc(fy.slice(2))} · ${k === "flow" ? "P&amp;L and cash flow" : "balance sheet"}</b><br><span class="sub dqwhat">${esc(x.rule)} rate – ${esc(x.basis)}</span>`,
        m: `${FMT.count(x.matched)} of ${FMT.count(x.of)}` } }))) })}
    ${(imp.fx_flags || []).length ? `<ul class="plain dqfxflags">${imp.fx_flags.slice(0, 30).map(f => `<li>⚑ ${esc(f.symbol)} · FY${esc(String(f.fy).slice(2))} ${esc((DQ_LINE[f.line] || f.line).toLowerCase())}: converted <b class="num">${FMT.cr(f.ours, 0)}</b> vs filing <b class="num">${FMT.cr(f.xbrl, 0)}</b> (${FMT.num(f.gap_pct, 1)}% apart, ${esc(f.rule)} rate)</li>`).join("")}</ul>` : ""}` : ""}
    </section>${auditHTML()}`;
}
// ---- layer 7: the trail – long-history values on the Statements tab, and every source in the hold-a-number sheet
const lhOf = sym => LH[sym] && typeof LH[sym] === "object" ? LH[sym] : null;
// the Statements block with the long history's agreed values added (more years; the same lines). Cells from it are marked "l".
function stWithLH(sym, st) {
  const L = lhOf(sym); if (!st || !L) return st;
  const yrs = new Set(st.y.map(String)), add = {};
  Object.entries(L.agree).forEach(([k, a]) => { const [line, fy] = k.split("|"); (add[line] = add[line] || {})[fy] = a[1]; yrs.add(fy); });
  const y = [...yrs].sort(), out = { ...st, y, s: {}, lhcells: {} };
  Object.entries(st.s).forEach(([sh, rows]) => { out.s[sh] = rows.map(([key, label, unit, vals]) => { const old = Object.fromEntries(st.y.map((yy, i) => [String(yy), vals[i]]));
    return [key, label, unit, y.map(yy => { if (old[yy] != null) return old[yy]; const v = add[key] && add[key][yy]; if (v != null && unit !== "pct" && unit !== "x" && unit !== "d") { (out.lhcells[key] = out.lhcells[key] || {})[yy] = 1; return v; } return null; })]; }); });
  return out;
}
function trailHTML(sym, key, y) {
  const L = lhOf(sym); if (!L) return "";
  const rows = L.rows.filter(r => r[0] === key && String(r[1]) === String(y)), a = L.agree[`${key}|${y}`];
  if (!rows.length) return "";
  const word = { agreed: `✅ agreed (${a && a[2]} sources)`, two_agree: "🟡 two agree, one differs", single: "🟠 single source", differ: "🟠 all sources differ" };
  return `<p class="mline"><b>Check:</b> ${esc(word[a && a[0]] || "")}${a && a[3] ? ` <span class="sub">– ${esc(a[3])}</span>` : ""}</p>
    ${dataTable({ cols: [{ k: "s", h: "Source · file · date · version" }, { k: "v", h: "Value" }], label: "Every source for this number", cls: "trail",
      rows: rows.map(r => ({ cells: { v: r[2] }, raw: { v: key === "shares" ? FMT.count(r[2]) : key === "eps" ? inr(r[2], 2) : FMT.cr(r[2], 0),
        s: `<b>${esc(r[3])}</b><br><span class="sub dqwhat">${esc(String(r[4] || "").replace(/^https?:\/\/[^/]+\//, ""))}${r[5] ? " · " + esc(FMT.date(r[5])) : ""} · ${r[6] === "first" ? "as first reported" : "restated"}${r[7] ? " · from " + esc(r[7]) : ""}</span>` } })) })}`;
}
loadDQS();
// ---------- review #83 C: Rebalance day – a normal row (day + month, no year), a small sheet with day / month pickers ----------
const MONTHS_S = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function rebalNext() { const [m, d] = rebalDay().split("-").map(Number), y = +TODAY.slice(0, 4), pad = x => String(x).padStart(2, "0");
  let iso = `${y}-${pad(m)}-${pad(d)}`; if (iso < TODAY) iso = `${y + 1}-${pad(m)}-${pad(d)}`; return { iso, days: Math.round((Date.parse(iso) - Date.parse(TODAY)) / 864e5) }; }
function rebalRow() {
  const [m, d] = rebalDay().split("-").map(Number), nx = rebalNext();
  return `<button class="setrow" type="button" data-act="rebalsheet"><span class="gt">Rebalance day<span class="sval rbval">${d} ${MONTHS_S[m - 1]} every year</span><span class="gs rbnext">${nx.days === 0 ? "Today" : `Next: ${esc(FMT.date(nx.iso))} (in ${FMT.count(nx.days)} day${nx.days === 1 ? "" : "s"})`}</span></span></button>`;
}
function rebalSheet() {
  const [m, d] = rebalDay().split("-").map(Number);
  sheet(`<h2>Rebalance day</h2><p class="sub">Once a year, on this day, Home and Alerts show your portfolio checklist. Day and month only – it repeats every year.</p>
    <div class="rbpick"><label>Day <select data-rbday>${Array.from({ length: 31 }, (_, i) => `<option${i + 1 === d ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
    <label>Month <select data-rbmonth>${MONTHS_S.map((x, i) => `<option value="${i + 1}"${i + 1 === m ? " selected" : ""}>${x}</option>`).join("")}</select></label></div>
    <div class="btnrow"><button class="act big" type="button" data-act="rebalsave">Save</button><button class="act" type="button" data-close>Cancel</button></div>`);
}
function rebalSave() {
  const dd = document.querySelector("[data-rbday]"), mm = document.querySelector("[data-rbmonth]"); if (!dd || !mm) return;
  const m = +mm.value, d = Math.min(+dd.value, MONTH_DAYS[m - 1]);
  USER.meta.rebal = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; persist();
  const sh = document.getElementById("sheet"); if (sh && sh.open) sh.close();
  const y = scrollY; render(true); scrollTo(0, y); toast("Rebalance day saved");
}
// ---------- review #83 D: each Rules version's trial from its ghost log's first date (S.trials, written by the nightly) ----------
function trialWords() { return trials().map(t => `Rules ${t.v}: ${t.started ? `trial since ${FMT.date(t.started)}, until ${FMT.date(t.until)}${t.passed ? " – passed" : ""}` : "trial not started"}`).join(" · "); }
// ---------- review #83 H5: the Save sheet's "From:" line – the verdict once, in its design-system colour ----------
function saveFrom(s) {
  const v = s && SET.master ? vfor(s) : null, fromGroup = /^Verdict group/.test(CTX);
  const ctx = fromGroup ? "" : esc(String(CTX).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, ""));
  const chip = v ? `<span class="vgp" style="--vgc:var(--vg-${v.g})">${esc(vgName(v.g))}${fromGroup ? " group" : ""}</span>` : "";
  return `From: ${[ctx, chip].filter(Boolean).join(" · ")}${s ? ` · ${inr(s.close)} tonight` : ""}${v && s.cr ? ` · Core ${FMT.count(s.cr.sc)}` : ""}`;
}
// ---------- review #83 H4: on-screen keyboard – the sheet sits above it, scrolls, and the focused field stays in view ----------
function sheetKB() {
  const d = document.getElementById("sheet"), vv = window.visualViewport; if (!d || !d.open || !vv) return;
  const kb = Math.max(0, innerHeight - vv.height - (vv.offsetTop || 0));
  d.style.transform = kb ? `translateY(-${kb}px)` : ""; d.style.maxHeight = kb ? Math.max(180, vv.height - 8) + "px" : "";
  const f = document.activeElement; if (kb && f && d.contains(f) && f.matches("input, select, textarea")) f.scrollIntoView({ block: "nearest" });
}
if (window.visualViewport) { visualViewport.addEventListener("resize", sheetKB); visualViewport.addEventListener("scroll", sheetKB); }
document.addEventListener("focusin", e => { if (e.target.closest && e.target.closest("#sheet")) setTimeout(sheetKB, 50); });
{ const sc = document.getElementById("scrim"); if (sc) sc.addEventListener("click", closeSheet); }          // tap the scrim → close (the dialog's own backdrop tap is handled with the sheet's clicks)
// ---------- review #83 L: Back goes to the list – sideways switches never add a history step ----------
// Each stock page's history entry carries its origin (history.state.origin = {hash, label}): the list it was opened from, the
// stock it was opened from (going deeper: a peer, an investor …) or Home for a shared link. Previous / Next, swipe, tapping
// another row of the split-view list and peek → Open from that list replace the entry; "‹ <origin>" goes back to it.
let PREV_HASH = null, LAST_SEEN = null;
const isStockRoute = r => r.name === "stock" && !!r.arg;
function originLabel(h) {
  const r = parseHashOf(h);
  if (r.name === "stock" && BY[r.arg]) return BY[r.arg].name;
  if (r.name === "verdicts" && r.arg) return (vgName(r.arg) || r.arg) + " group";
  if (r.name === "sector" && r.arg) return (SECT[r.arg] && SECT[r.arg].name) || "Sector";
  if (r.name === "investors" && r.arg) return invName(r.arg);
  return { home: "Home", watchlist: "Watchlist", search: "Search results", portfolio: "Portfolio", world: "World", investors: "Investors", market: "Market", compare: "Compare",
    ranking: "Core ranking", alerts: "Alerts", models: "Model portfolios", screens: "Screens", discover: "Discover", feed: "Feed", sectors: "Sectors", verdicts: "Verdicts" }[r.name] || "Back";
}
function parseHashOf(h) { try { return parseHashStr(h); } catch (e) { return { name: "home" }; } }
function parseHashStr(h) { const [path, qs] = String(h || "#/home").replace(/^#\/?/, "").split("?"); const parts = path.split("/").map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  return { name: parts[0] || "home", arg: parts[1], sub: parts[2], q: new URLSearchParams(qs || "").get("q") || "" }; }
function noteOrigin(r) {
  const prev = PREV_HASH; PREV_HASH = location.hash || "#/home";
  if (!isStockRoute(r)) return;
  LAST_SEEN = r.arg; SEEN_ON = null;
  const st = history.state || {};
  if (st.origin) return;                                                   // already known (sideways, Back / Forward, reload)
  const o = prev && prev !== location.hash ? { hash: prev, label: originLabel(prev) } : { hash: "#/home", label: "Home", direct: true };
  history.replaceState(Object.assign({}, st, { origin: o }), "", location.hash);
}
const originOf = () => (history.state && history.state.origin) || { hash: "#/home", label: "Home", direct: true };
const originName = () => originOf().label || "Back";
function goSide(h) {                                                       // a sideways stock switch: replace, don't push
  if (!h || h === location.hash) return;
  const sl = document.querySelector(".splitl"); SPLIT_TOP = sl ? sl.scrollTop : null;
  history.replaceState(history.state, "", h); FWD = true; render(false);
}
function backToOrigin() {
  const o = originOf();
  if (!o.direct && NAV_OK()) history.back(); else go(o.hash);
}
const NAV_OK = () => history.length > 1;
let SEEN_ON = null;
function markLastSeen(r) {                                                // back on the list: the last stock viewed is highlighted
  if (isStockRoute(r) || !LAST_SEEN) return;
  if (SEEN_ON && SEEN_ON !== location.hash) { LAST_SEEN = SEEN_ON = null; return; }   // moved on to another screen
  SEEN_ON = location.hash; const sym = LAST_SEEN;                          // kept for this list's own re-renders (data arriving)
  const el = SCR().querySelector(`[data-open="${CSS.escape(sym)}"]`) || [...SCR().querySelectorAll("a[href]")].find(a => a.getAttribute("href") === stockHref(sym));
  if (!el) return;
  const row = el.closest(".urow, .card, li, tr, .glist > a, .splrow, .rowbtn") || el; row.classList.add("lastseen");
  const rc = row.getBoundingClientRect(); if (rc.top < 0 || rc.bottom > innerHeight) requestAnimationFrame(() => row.scrollIntoView({ block: "center" }));
}
// ---------- review #83 M: Watchlist – "then vs now" for every saved stock ----------
// At save time the entry keeps the date, price, Rules v1.0 verdict, quality, % vs ⭐ fair value, buy zone and the top reasons (browser +
// Backup). Older saves are filled once from the write-once verdict log (s.vt.s: the save date or the nearest earlier logged date),
// marked "from the log". Changes since the save come from the log with the #70 V2 reason (s.vt.c).
const VCODE = { b: "buy", a: "acc", h: "hold", t: "trim", v: "avoid" };
function thenSnap(s) {
  const v = vfor(s), z = v ? zoneFor(s) : null, gap = v && v.va && v.va.fair ? (s.close / v.va.fair - 1) * 100 : null, why = [];
  if (v && v.q != null) why.push(`quality ${v.q}/100`);
  if (gap != null) why.push(`price ${FMT.pct(gap, 0)} vs fair value`);
  if (v && (v.flags || []).length) why.push("red flag: " + (v.flags[0].t || v.flags[0].n || v.flags[0].c || "see the stock page"));
  return { d: PDAY, px: s.close, g: v ? v.g : null, q: v ? v.q : null, fv: gap == null ? null : Math.round(gap * 10) / 10, zone: z && z.zone != null ? z.zone : null, why: why.slice(0, 3), src: "save" };
}
function fillThen(w) {
  if (w.then) return w.then;
  const s = BY[w.sym], snaps = s && s.vt ? s.vt.s.filter(x => x[0] <= w.saved) : [], x = snaps[snaps.length - 1];
  if (x) w.then = { d: x[0], px: x[3] != null ? x[3] : w.px, g: VCODE[x[1]], q: x[2], fv: x[4], zone: null, why: [], src: "log" };
  else if (s && s.vt) w.then = { d: w.saved, px: w.px, g: w.g || null, q: null, fv: null, zone: null, why: [], src: w.g ? "save" : "none" };
  return w.then || null;
}
const thenOf = w => w.then || fillThen(w) || { d: w.saved, px: w.px, g: w.g || null, src: w.g ? "save" : "none" };
const vChip = g => g ? `<span class="vgp" style="--vgc:var(--vg-${g})">${esc(vgName(g))}</span>` : `<span class="sub">no verdict</span>`;
const changesSince = (w, s) => ((s && s.vt && s.vt.c) || (s && s.vc ? [s.vc] : [])).filter(c => c[0] > w.saved);
function thenNowText(w, s) {
  const t = thenOf(w), v = SET.master ? vfor(s) : null, own = OWNER(), pc = s.close && (t.px || w.px) ? (s.close / (t.px || w.px) - 1) * 100 : null;
  return `Saved ${dShort(w.saved)} · ${t.g ? vgName(t.g) : "no verdict"}${own ? "" : ` · ${inr(t.px || w.px)}`} → Today ${v ? vgName(v.g) : "no verdict"}${own || pc == null ? "" : ` · ${inr(s.close)} (${FMT.arrow(pc)} ${FMT.pctPlain(Math.abs(pc), 1)})`}`;
}
let N50 = null, N50_STATE = "none";
function n50Since(d) {
  if (N50_STATE === "none" && CH_OK()) { N50_STATE = "loading"; loadChartFile("index:nifty-50").then(r => { N50 = r.bars; N50_STATE = "ok"; if (parseHash().name === "watchlist") { const y = scrollY; render(true); scrollTo(0, y); } }).catch(() => { N50_STATE = "missing"; }); }
  if (!N50 || !N50.length) return null;
  const i = CL.indexAt(N50, d), b0 = N50[i] && N50[i].t === d ? N50[i] : N50[i - 1], b1 = N50[N50.length - 1];
  return b0 && b1 && b0 !== b1 ? (b1.c / b0.c - 1) * 100 : b0 === b1 ? 0 : null;
}
function thenNowHTML(w, s) {
  const t = thenOf(w), v = SET.master ? vfor(s) : null, own = OWNER(), px0 = t.px || w.px, pc = px0 ? (s.close / px0 - 1) * 100 : null;
  const ch = changesSince(w, s), nd = UL.days(w.saved, PDAY);
  const top = `<p class="mline thennow"><span>Saved ${esc(dShort(w.saved))} · ${vChip(t.g)}${own ? "" : ` · <span class="num">${inr(px0)}</span>`}</span> <span class="tn-arr" aria-hidden="true">→</span>
    <span>Today ${vChip(v && v.g)}${own ? "" : ` · <span class="num">${inr(s.close)}</span> (${moveNum(pc, FMT.pct(pc, 1))})`}</span>${t.src === "log" ? ` <span class="t-label sub">then: from the log</span>` : ""}</p>`;
  let what = "";
  if (ch.length) { const c = ch[ch.length - 1];
    what = `<p class="mini tnwhy">Changed ${esc(vgName(VCODE[c[1]]))} → ${esc(vgName(VCODE[c[2]]))} on ${esc(dShort(c[0]))}: ${esc(c[4] || "reason not recorded")}${ch.length > 1 ? ` <span class="sub">(${ch.length} changes since you saved it)</span>` : ""}</p>`; }
  else if (t.g && v && t.g === v.g) what = `<p class="mini tnwhy">Still ${esc(vgName(v.g))} since you saved it (${FMT.count(nd)} day${nd === 1 ? "" : "s"})</p>`;
  else if (t.g && v) what = `<p class="mini tnwhy">Changed ${esc(vgName(t.g))} → ${esc(vgName(v.g))} – reason not recorded (the change isn't in the log)</p>`;
  const tl = ch.length ? `<details class="tnmore"><summary>Show more – every change since you saved it (${FMT.count(ch.length)})</summary><ol class="vtl">${ch.slice().reverse().map(c =>
    `<li><span class="vtdot" style="--vgc:var(--vg-${VCODE[c[2]]})" aria-hidden="true"></span><b>${esc(FMT.date(c[0]))}</b> ${esc(vgName(VCODE[c[1]]))} → ${esc(vgName(VCODE[c[2]]))}${own || c[3] == null ? "" : ` · ${inr(c[3])}`}<br><span class="sub">${esc(c[4] || "reason not recorded")}</span></li>`).join("")}</ol></details>` : "";
  const n = own ? null : n50Since(w.saved);
  const quick = own || pc == null ? "" : `<p class="mini tnquick">Bought on your saved idea? You'd be ${moveNum(pc, FMT.pct(pc, 1))} (${FMT.moneySigned(s.close - px0, 2)}/share). Nifty 50 since then: ${n == null ? (N50_STATE === "loading" ? "…" : "–") : moveNum(n, FMT.pct(n, 1))}.</p>`;
  return `<div class="tnblock">${top}${what}${quick}${tl}</div>`;
}
const WLV = [["", "All"], ["chg", "Verdict changed since saved"], ["buy", "Still Buy"], ["bad", "Now Avoid / Trim"]];
function wlvPass(w) {
  if (!WL.vf) return true;
  const s = BY[w.sym], v = s && SET.master ? vfor(s) : null, t = thenOf(w);
  if (WL.vf === "chg") return !!(v && t.g && v.g !== t.g) || changesSince(w, s).length > 0;
  if (WL.vf === "buy") return !!(v && v.g === "buy" && t.g === "buy");
  if (WL.vf === "bad") return !!(v && (v.g === "avoid" || v.g === "trim"));
  return true;
}
const wlvChips = () => `<div class="chiprow wlvf" role="group" aria-label="Show saved stocks">${WLV.map(([k, n]) => `<button class="chip${(WL.vf || "") === k ? " on" : ""}" type="button" data-act="wlvf" data-v="${k}" aria-pressed="${(WL.vf || "") === k}">${n}</button>`).join("")}</div>`;
// ---------- review #83 N: split view → full page, one tap, remembered ----------
const STOCK_OPEN_KEY = "screener.stockopen";
const STOCK_OPEN = () => prefGet(STOCK_OPEN_KEY, "split") === "full" ? "full" : "split";
function openFull() {                                                     // same entry (no extra Back step), same tab and scroll position
  const y = scrollY; prefSet(STOCK_OPEN_KEY, "full");
  history.replaceState(history.state, "", location.hash); render(true); scrollTo(0, y);
}
function fullBar(el) {
  if (el.querySelector(".fullbar")) return;
  el.insertAdjacentHTML("afterbegin", `<div class="panebar fullbar"><button class="act" type="button" data-act="tosplit" aria-label="Back to the split view">⤡ Split view</button></div>`);
}
// ---------- review #84 A: the company's own filed years (NSE / BSE XBRL back-fill) – official wins ties, only when the checks pass ----------
const XH_MAP = { revenue: "rev", total_income: "rev", op_profit: "ebitda", depreciation: "dep", interest: "interest", pbt: "pbt", pat: "pat",
  eps_basic: "eps", total_assets: "ta", inventory: "inv", receivables: "rec", cash: "cash", payables: "pay", borrowings: "debt", equity: "equity",
  shares: "shares", cfo: "cfo", capex: "capex" };
// lines the Yahoo block doesn't carry: [xh line, st key, label, unit, sheet]
const XH_EXTRA = [["other_income", "oi", "Other income", "cr", "pl"], ["exceptional", "exc", "Exceptional items", "cr", "pl"], ["tax", "tax", "Tax", "cr", "pl"],
  ["eps_diluted", "eps_d", "EPS diluted (₹)", "rs", "pl"], ["interest_earned", "int_e", "Interest earned", "cr", "pl"], ["interest_expended", "int_x", "Interest expended", "cr", "pl"],
  ["nii", "nii", "Net interest income", "cr", "pl"], ["provisions", "prov", "Provisions", "cr", "pl"], ["deposits", "dep_b", "Deposits", "cr", "bs"],
  ["advances", "adv", "Advances (loans)", "cr", "bs"], ["gnpa", "gnpa", "Gross NPA", "cr", "bs"], ["nnpa", "nnpa", "Net NPA", "cr", "bs"],
  ["gnpa_pct", "gnpa_p", "Gross NPA %", "pct", "bs"], ["nnpa_pct", "nnpa_p", "Net NPA %", "pct", "bs"], ["dividends", "div", "Dividends paid", "cr", "cf"]];
const XH_LABEL = { rev: "Sales / total income", ebitda: "EBITDA", dep: "Depreciation", interest: "Interest", pbt: "Profit before tax", pat: "Net profit", eps: "EPS (₹)",
  ta: "Total assets", inv: "Inventory", rec: "Receivables", cash: "Cash & equivalents", pay: "Payables", debt: "Total debt", equity: "Net worth", shares: "Shares (count)",
  cfo: "Cash from operations", capex: "Capital expenditure" };
const XH_UNIT = { eps: "rs", shares: "n" };
const XH_SHEET = { ta: "bs", inv: "bs", rec: "bs", cash: "bs", pay: "bs", debt: "bs", equity: "bs", shares: "bs", cfo: "cf", capex: "cf" };
function xhUsable(s) { const x = s && s.fund && s.fund.xh; return !!(x && x.y && x.y.length) && !dqLow(s.symbol); }
function xhVal(line, v) { return v == null ? null : line === "shares" ? v * 1e7 : line === "capex" ? -Math.abs(v) : v; }
function stWithXH(s, st) {
  if (!xhUsable(s)) return st;
  const x = s.fund.xh, base = st && st.s ? st : { y: [], s: {} };
  const y = [...new Set([...base.y.map(String), ...x.y.map(String)])].sort();
  const add = {}, extra = {};
  Object.entries(x.s).forEach(([line, vals]) => { const k = XH_MAP[line] || (XH_EXTRA.find(e => e[0] === line) || [])[1]; if (!k) return;
    if (line === "total_income" && x.s.revenue) return;
    x.y.forEach((yy, i) => { const v = xhVal(line, vals[i]); if (v != null) (add[k] = add[k] || {})[String(yy)] = v; });
    if (!XH_MAP[line]) extra[k] = XH_EXTRA.find(e => e[0] === line); });
  const out = { ...base, y, s: {}, src: { ...(base.src || {}) }, xh: x.h };
  const mark = (k, yy) => { (out.src[k] = { ...(out.src[k] || {}) })[yy] = "o"; };
  Object.entries(base.s).forEach(([sh, rows]) => { out.s[sh] = rows.map(([key, label, unit, vals]) => { const old = Object.fromEntries(base.y.map((yy, i) => [String(yy), vals[i]]));
    return [key, label, unit, y.map(yy => { const v = add[key] && add[key][yy]; if (v != null) { mark(key, yy); return v; } return old[yy] ?? null; })]; }); });
  const have = new Set(Object.values(out.s).flat().map(r => r[0]));
  Object.keys(add).filter(k => !have.has(k)).forEach(k => { const e = extra[k], sh = e ? e[4] : XH_SHEET[k] || "pl";
    const vals = y.map(yy => { const v = add[k][yy]; if (v != null) mark(k, yy); return v ?? null; });
    if (vals.filter(v => v != null).length) (out.s[sh] = out.s[sh] || []).push([k, e ? e[2] : XH_LABEL[k] || k, e ? e[3] : XH_UNIT[k] || "cr", vals]); });
  return out;
}
function dqFilingsHTML(d, sel) {
  const f = d.filings || {}, h = (d.history || {})[sel] || (sel && BY[sel] && BY[sel].fund && BY[sel].fund.xh && BY[sel].fund.xh.h);
  if (!f.total && !h) return `<p class="mline dqfil sub">Filings read: 0 of 0 (the official-filing back-fill starts with the next nightly run)</p>`;
  return `<p class="mline dqfil"><b>${esc(f.text || "")}</b>${f.companies ? ` <span class="sub">· companies with data ${FMT.count(f.with_data || 0)} of ${FMT.count(f.companies)}${f.median_years ? ` · median depth ${FMT.count(f.median_years)} years` : ""} · NSE / BSE XBRL, read once, ${f.per_night ? `up to ${FMT.count(f.per_night)} requests` : "1,500 files"} a night</span>` : ""}</p>
    ${dqTonightHTML(f)}
    ${dqGoneHTML(f.gone)}
    ${sel ? `<p class="mline dqhist"><b>${esc(sel)}</b> · ${esc(h || "History: not read yet")}</p>` : ""}`;
}
// review #89: the newest back-fill night – files read tonight, the requests it used, and the nights left at that pace
function dqTonightHTML(f) {
  const t = f && f.tonight;
  if (!t || !t.night) return "";
  const left = f.nights_left || 0;
  return `<p class="mline dqtonight">Files read tonight: <b>${FMT.count(t.files || 0)}</b> <span class="sub">(${esc(FMT.date(t.night))} · ${FMT.count(t.requests || 0)} requests: ${FMT.count(t.lists || 0)} filing lists, ${FMT.count(t.failed || 0)} failed)</span> · <b>${left ? `about ${FMT.count(left)} night${left === 1 ? "" : "s"} left` : "back-fill complete"}</b>${left && f.per_night ? ` <span class="sub">at ~${FMT.count(f.per_night)} requests a night</span>` : ""}</p>`;
}
// review #87 A1: the former Nifty 500 members (delisted, merged, wound up) in the back-fill queue – so a backtest sees the failures too
function dqGoneHTML(g) {
  if (!g || !g.companies) return "";
  return `<p class="mline dqgone">Delisted / merged companies (honest backtest): <b>${FMT.count(g.companies)}</b> in the queue <span class="sub">· filing lists read ${FMT.count(g.lists_read || 0)} · with XBRL filings ${FMT.count(g.found || 0)} · none ${FMT.count(g.none || 0)} · files read ${FMT.count(g.files_read || 0)} of ${FMT.count(g.files || 0)}</span></p>`;
}
// ---------- review #85 B: the stock tab strip – fades on a clipped edge, keeps the selected tab fully in view ----------
function jumpFade(nav) { const max = nav.scrollWidth - nav.clientWidth; nav.classList.toggle("jfl", nav.scrollLeft > 2); nav.classList.toggle("jfr", max > 2 && nav.scrollLeft < max - 2); }
function jumpIntoView(nav, a) {
  a = a || nav.querySelector("a.on"); if (!a) return;
  const pad = 28, l = a.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft, r = l + a.offsetWidth;
  if (l - pad < nav.scrollLeft) nav.scrollLeft = Math.max(0, l - pad);
  else if (r + pad > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = r + pad - nav.clientWidth;
  jumpFade(nav);
}
// ---------- review #85 F: the ⓘ sheet closes with Close, a tap on the scrim, Escape – and the Back button ----------
function sheetDismiss() { if (history.state && history.state.tsheet && document.getElementById("sheet").classList.contains("tsheet")) history.back(); else closeSheet(); }
window.addEventListener("popstate", () => { const d = document.getElementById("sheet"); if (d && d.hasAttribute("open") && d.classList.contains("tsheet")) closeSheet(); });
// ---------- review #85 G: a sideways-scrolled table shows the frozen column's divider + shadow ----------
document.addEventListener("scroll", e => { const w = e.target; if (w && w.classList && (w.classList.contains("dtwrap") || (w.firstElementChild && w.firstElementChild.matches("table.sect")))) w.classList.toggle("sx", w.scrollLeft > 1); }, true);
// ---------- review #86: Company Story – the free layer (every stock, no AI) and the written story when it exists ----------
const ST_KIND = { transcript: "Concall transcript", presentation: "Investor presentation", annual_report: "Annual report", results: "Results" };
function storySegs(g) {
  if (!g || !(g.rows || []).length) return "";
  const parts = g.rows.map((r, i) => [r[0], r[1], SEG_COL[i % SEG_COL.length]]).concat(g.other_pct ? [["Other", g.other_pct, "var(--line)"]] : []);
  return `<div class="stseg"><p class="t-label sub">Main businesses · share of revenue, ${esc(g.period || "")}</p>
    <div class="stbar" role="img" aria-label="${esc(parts.map(p => p[0] + " " + FMT.num(p[1], 0) + "%").join(", "))}">${parts.map(p => `<i style="width:${FMT.coord(Math.max(0, p[1]))}%;background:${p[2]}"></i>`).join("")}</div>
    <ul class="plain stleg">${parts.map(p => `<li><i style="background:${p[2]}"></i>${esc(p[0])} <b class="num">${FMT.num(p[1], 0)}%</b></li>`).join("")}</ul>
    <p class="mini sub">Source: ${esc(g.source || "NSE results XBRL")}</p></div>`;
}
function storyFree(s, F) {
  const riv = (F.rivals || []).filter(x => BY[x]);
  const fil = FILING_ORDER.filter(k => F.filings && F.filings[k]).map(k => { const [d, t, u] = F.filings[k];
    return `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(ST_KIND[k])}</a> <span class="sub">· ${esc(dateTxt(d))}</span></li>`; }).join("");
  return `${riv.length ? `<p class="mline strival"><span class="t-label sub">Main rivals (${esc(F.rivals_level === "sector" ? "same sector" : "same industry")}, ${esc(F.rivals_label || "")}):</span> ${riv.map(x => `<a class="chip" href="${stockHref(x)}">${esc(BY[x].name)}</a>`).join(" ")}</p>` : ""}
    ${fil ? `<div class="stfil"><p class="t-label sub">Latest filings the story reads</p><ul class="plain">${fil}</ul></div>` : ""}
    ${F.no_concall ? `<p class="mini sub stnocall">No concall or presentation in the last 12 months – only the annual report and results are used.</p>` : ""}`;
}
const FILING_ORDER = ["transcript", "presentation", "annual_report", "results"];
const STHI = () => prefGet("screener.story.hi", "0") === "1";             // #86 D4: Hinglish – a translation of the stored English
function stSrc(C, src) {
  if (!src || !C.sources) return ""; const f = C.sources.find(x => x.id === src.id); if (!f) return "";
  return ` <a class="stsrc t-label" href="${esc(f.url)}${src.page ? "#page=" + encodeURIComponent(src.page) : ""}" target="_blank" rel="noopener">${esc(ST_KIND[f.kind] || f.kind)} · ${esc(dateTxt(f.date))}${src.page ? " · p." + esc(src.page) : ""}</a>`;
}
const stTxt = (C, k) => { const v = C[k]; if (!v) return ""; const hi = STHI() && C.hi && C.hi[k]; return esc(hi || v.text); };
const ST_PROM = { kept: "✔ Kept", late: "⏳ Late", missed: "✘ Missed", early: "… Too early" };
const ST_VIEW = { strong: "🟢 Strong", partly: "🟡 Partly covers it", weak: "🔴 Weak", none: "⚪ Not addressed" };
function storyWritten(s, C, B) {
  const line = (lab, k) => C[k] ? `<p class="stwig"><span class="t-label sub">${lab}</span> ${stTxt(C, k)}${stSrc(C, C[k].src)}</p>` : "";
  const bets = (C.bets || []).slice(0, 3).map(b => `<li><b>${esc(b.what)}</b>${b.amount_cr != null ? ` · ₹${FMT.count(b.amount_cr)} cr` : ""}${b.target ? ` · by ${esc(b.target)}` : ""}${b.rev_share != null ? ` · ${esc(b.rev_share)}${/%/.test(String(b.rev_share)) ? "" : "%"} of revenue` : ""}${b.text ? ` <span class="sub">– ${esc(b.text)}</span>` : ""}${stSrc(C, b.src)}</li>`).join("");
  const risks = (C.risks || []).slice(0, 3).map(r => `<div class="strisk">
      <p class="mline"><b>${esc(r.risk)}</b> <span class="stfrom t-label">${r.from === "company" ? "Company admits" : "Our reading"}</span>${stSrc(C, r.src)}</p>
      ${r.from !== "company" && r.evidence ? `<p class="mini sub">Evidence: ${esc(r.evidence)}</p>` : ""}
      <p class="mini"><span class="t-label sub">What they're doing:</span> ${esc(r.plan || "No plan mentioned in filings so far")}${r.plan_src ? stSrc(C, r.plan_src) : ""}</p>
      <p class="mini stview"><b>${ST_VIEW[r.view] || "⚪ Not addressed"}</b> – ${esc(r.why || "")}</p></div>`).join("");
  const proms = (C.promises || []).map(p => `<li><b>${ST_PROM[p.status] || p.status}</b> ${esc(p.promise)} <span class="sub">– promised ${esc(dateTxt(p.promised_on))}${p.where ? " in " + esc(p.where) : ""}</span>${stSrc(C, p.src)}</li>`).join("");
  return `${B.chg && B.chg.length ? `<p class="mline stchg"><b>What changed:</b> ${esc(B.chg.join(" · "))}</p>` : ""}
    ${C.status === "needs_review" ? `<p class="note">⚠️ Needs review – a number in this story could not be found in its filing; read it with care.</p>` : ""}
    ${C.one_line ? `<p class="stone"><b>${stTxt(C, "one_line")}</b>${stSrc(C, C.one_line.src)}</p>` : ""}
    ${C.hi ? `<div class="chiprow" role="group" aria-label="Story language"><button class="chip${STHI() ? "" : " on"}" type="button" data-act="storyhi" data-v="0" aria-pressed="${!STHI()}">English</button><button class="chip${STHI() ? " on" : ""}" type="button" data-act="storyhi" data-v="1" aria-pressed="${STHI()}">Hinglish</button></div>` : ""}
    ${storySegs(B.free.seg)}
    ${line("Sells to", "sells_to")}${line("Was", "was")}${line("Is", "is")}${line("Going", "going")}
    <details class="stmore"><summary>Show more: big bets, risks and the promise tracker</summary>
      ${bets ? `<h3 class="minor">Big bets</h3><ul class="plain stbets">${bets}</ul>` : ""}
      ${risks ? `<h3 class="minor">Risks – and what the company is doing about them</h3>${risks}` : ""}
      ${proms ? `<details class="stprom"><summary>Promise tracker (${FMT.count((C.promises || []).length)})</summary><ul class="plain">${proms}</ul></details>` : ""}
      <p class="mini sub">Our reading of public filings — not investment advice.</p>
    </details>`;
}
function storyPanel(s) {
  const B = s.story; if (!B || !B.free) return "";
  const F = B.free, C = B.cur;
  const asof = C ? `<p class="mini sub stasof">Story as of: ${esc(C.as_of || "–")}${C.core_checked ? ` · Core checked: ${esc(dateTxt(C.core_checked).replace(/^\d+ /, ""))}` : ""}${F.no_concall ? " · No concall or presentation in the last 12 months" : ""}</p>` : "";
  return `<section class="panel story noterm" id="story"><h2>Company Story</h2>
    ${C ? storyWritten(s, C, B) : `<p class="sub">${esc(F.bi || F.ind || "")}${F.bi && F.ind && F.bi !== F.ind ? ` · ${esc(F.ind)}` : ""}</p>${storySegs(F.seg)}`}
    ${storyFree(s, F)}
    ${asof}
    ${C ? "" : `<p class="mini sub stoff">The written story – what it does in one line, Was → Is → Going, big bets, risks and the company's plan – appears here once Company Story is switched on. Until then: the facts above, straight from the company's filings.</p>`}
  </section>`;
}
function storyChanges() {                    // #86 D2: Watchlist – stocks whose story changed with a new filing
  const L = (USER.watch || []).map(w => BY[w.sym]).filter(x => x && x.stc);
  return L.length ? `<section class="panel stchgs"><h2>Company Story changed</h2><ul class="plain">${L.map(x => `<li><a href="${stockHref(x.symbol)}">${esc(x.name)}</a> <span class="sub">– ${esc(x.stc[1])} (${esc(dateTxt(x.stc[0]))})</span></li>`).join("")}</ul></section>` : "";
}
/*__TIKR_JS_END__*/
render(false);
