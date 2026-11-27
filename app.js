
/*__FMT_START__*/
// ---- review #41: THE number formatter. Every number on the page goes through FMT (docs/DESIGN.md, consistency rule):
// Indian grouping (₹1,23,456.70), large values as ₹4,560 cr / ₹12.3 L, fixed decimals per kind, "–" for missing, a sign on
// every change (+ / − with the real minus sign) and ▲ / ▼ arrows. tests/test_design.py fails if a number is formatted elsewhere.
const FMT = (() => {
  const ok = x => x != null && x !== "" && isFinite(+x);
  const MINUS = "−", DASH = "–";
  const group = (x, d) => Math.abs(+x).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
  // review #74 (3): Settings → Personalise → Number style – full Indian (default) · short Indian (₹2.49 L, ₹1.06 L cr) · international (₹248.6K)
  const NSTYLE = () => { try { return localStorage.getItem("screener.numstyle") || "full"; } catch (e) { return "full"; } };
  const bigNum = (a, d) => { const st = NSTYLE();
    if (st === "short" && a >= 1e5) return a >= 1e7 ? group(a / 1e7, 2) + " Cr" : group(a / 1e5, 2) + " L";
    if (st === "intl" && a >= 1e3) return a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(2) + "M" : (a / 1e3).toFixed(1) + "K";
    return group(a, d); };
  const bigCr = (a, d) => { const st = NSTYLE(), r = a * 1e7;                    // a = ₹ crore
    if (st === "short" && a >= 1e5) return group(a / 1e5, 2) + " L cr";
    if (st === "intl" && r >= 1e9) return r >= 1e12 ? (r / 1e12).toFixed(2) + "T" : (r / 1e9).toFixed(2) + "B";
    return group(a, d) + " cr"; };
  const sgn = (x, always) => +x < 0 && group(x, 6) !== group(0, 6) ? MINUS : always && +x > 0 ? "+" : "";
  const num = (x, d = 0) => ok(x) ? (+x < 0 && Math.abs(+x) >= 0.5 * 10 ** -d ? MINUS : "") + group(x, d) : DASH;
  const signed = (x, d = 0) => ok(x) ? (Math.abs(+x) < 0.5 * 10 ** -d ? group(0, d) : (+x > 0 ? "+" : MINUS) + group(x, d)) : DASH;
  return {
    MINUS, DASH, ok,
    num,                                                     // 1,23,456 (d decimals)
    count: n => num(n, 0),                                   // 1,547
    money: (x, d = 2) => ok(x) ? (+x < 0 ? MINUS : "") + "₹" + bigNum(Math.abs(+x), d) : DASH,     // ₹1,23,456.70 (review #74: or ₹1.23 L / ₹123.5K)
    moneySigned: (x, d = 0) => ok(x) ? (Math.abs(+x) < 0.5 * 10 ** -d ? "₹" + group(0, d) : (+x > 0 ? "+" : MINUS) + "₹" + group(x, d)) : DASH,
    cr: (x, d = 0) => ok(x) ? (+x < 0 ? MINUS : "") + "₹" + bigCr(Math.abs(+x), d) : DASH,     // a value already in ₹ crore
    compact: x => !ok(x) ? DASH : Math.abs(+x) >= 1e7 ? (+x < 0 ? MINUS : "") + "₹" + group(+x / 1e7, Math.abs(+x) >= 1e9 ? 0 : 1) + " cr"
      : Math.abs(+x) >= 1e5 ? (+x < 0 ? MINUS : "") + "₹" + group(+x / 1e5, 1) + " L" : (+x < 0 ? MINUS : "") + "₹" + group(x, 0),
    pct: (x, d = 1) => ok(x) ? signed(x, d) + "%" : DASH,    // +1.2% / −0.5% (a change)
    pctPlain: (x, d = 1) => ok(x) ? num(x, d) + "%" : DASH,  // 12.3% (a level, e.g. ROCE)
    ratio: (x, d = 1) => ok(x) && d >= 2 && x !== 0 && Math.abs(x) < 0.1 ? num(x, Math.max(d, 1 - Math.floor(Math.log10(Math.abs(x))))) : num(x, d),   // 1.2 · #85 J2: under 0.1, 2 significant digits (0.014)
    times: (x, d = 2) => ok(x) ? num(x, d) + "×" : DASH,     // 1.20×
    points: (x, d = 2) => ok(x) ? signed(x, d) : DASH,       // +0.38 (points)
    shares: x => !ok(x) ? DASH : x >= 1e7 ? group(x / 1e7, 2) + " crore" : x >= 1e5 ? group(x / 1e5, 2) + " lakh" : group(x, 0),
    arrow: x => !ok(x) || Math.abs(+x) < 1e-9 ? "" : +x > 0 ? "▲" : "▼",
    cls: x => !ok(x) || Math.abs(+x) < 1e-9 ? "flat" : +x > 0 ? "up" : "down",
    month: iso => iso ? new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-IN", { month: "short" }) : "",
    date: iso => iso ? new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : DASH,
    dateTime: iso => iso ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : DASH,
    coord: x => String(Math.round(x * 10) / 10),            // SVG coordinates (not shown as text)
    raw: (x, d) => ok(x) ? (+x).toFixed(d) : "",            // plain digits for <input value=…> (no grouping)
  };
})();
/*__FMT_END__*/
const S = DATA.summary, H = DATA.history;
// review #41: one inline SVG icon set (stroke 1.75, 20/24 px), drawn for this app – no emoji in navigation, buttons or headings
const ICONS = {
  "home": '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  "star": '<path d="m12 3 2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z"/>',
  "star-fill": '<path fill="currentColor" d="m12 3 2.8 5.8 6.2.8-4.5 4.4 1.1 6.3L12 17.3l-5.6 3 1.1-6.3L3 9.6l6.2-.8z"/>',
  "case": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  "more": '<path d="M4 7h16M4 12h16M4 17h16"/>',
  "back": '<path d="m15 18-6-6 6-6"/>',
  "eye": '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',   // review #75 A: Business Owner Mode
  "plus": '<path d="M12 5v14M5 12h14"/>',
  "minus": '<path d="M5 12h14"/>',
  "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  "verdict": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  "sectors": '<path d="M12 3 3 8l9 5 9-5z"/><path d="m3 13 9 5 9-5"/>',
  "help": '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6V14M12 17h.01"/>',
  "download": '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  "upload": '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  "copy": '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  "save": '<path d="M5 3h11l3 3v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  "folder": '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  "signal": '<rect x="8" y="3" width="8" height="18" rx="4"/><circle cx="12" cy="8" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="16" r="1.2"/>',
  "trend": '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
 "market": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  "gear": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  "x": '<path d="M18 6 6 18M6 6l12 12"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "gem": '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18 3-18"/>',
  "doc": '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
  "refresh": '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  "expand": '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  "chart": '<path d="M4 20V4M4 20h16"/><path d="M8 14v3M12 9v8M16 11v6M20 6v11"/>'
};
const ic = (n, cls = "") => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ""}</svg>`;
// ---- review #41 1c: the mood theme – green when you're up, red when you're down; calm, never flashing
// Thresholds (config): within ±0.25% = neutral; intensity grows in 3 steps: < 2% faint · 2–10% medium · > 10% strong.
const MOOD = { neutral: 0.25, steps: [2, 10], mix: [5, 8, 11] };      // mix = tint % (kept ≤ 11% so all text passes WCAG AA)
const prefGet = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } };
const prefSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const CALM = () => prefGet("screener.calm", "0") === "1";
const MAINT = () => prefGet("screener.maint", "0") === "1";       // review #72: Settings → Show maintenance notes (owner only, off by default)          // More → Display → Calm mode: numbers stay green/red, no tints
// ---- review #66: theme (Aurora night default · Neon terminal), mode (System / Dark / Light), the two colour layers (section, sector),
// the colour-blind-safe P&L colours and the optional auto theme by time – all saved on this device only
const SKIN = { key: "screener.skin", mode: "screener.mode", auto: "screener.skinauto", a: "screener.layerA", c: "screener.layerC", cb: "screener.cb" };
// review #73: 20 themes (pipeline/themes.py → S.rules.themes; tokens in the generated CSS block), glow, auto day / night, high contrast
const TH = { key: "screener.theme", glow: "screener.glow", auto: "screener.autodn", day: "screener.dayth", night: "screener.nightth", hc: "screener.hc" };
const THM = () => (S.rules && S.rules.themes) || { groups: [], themes: {}, default: "B", day: "G", night: "B" };
const TH_LIGHT = new Set(["G", "H", "Q", "R", "T"]);
const marketHours = (now = new Date()) => { const ist = new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000), d = ist.getDay(), m = ist.getHours() * 60 + ist.getMinutes();
  return d >= 1 && d <= 5 && m >= 9 * 60 + 15 && m <= 15 * 60 + 30; };        // NSE: 9:15 AM–3:30 PM IST, Monday to Friday
const istHour = (now = new Date()) => new Date(now.getTime() + (now.getTimezoneOffset() + 330) * 60000).getHours();
function themePick() {                                      // the chosen theme (an older Neon / Aurora choice carries over)
  const t = prefGet(TH.key, null); if (t && /^[A-Z]$/.test(t)) return t;
  return prefGet(SKIN.key, "aurora") === "neon" ? "I" : THM().default || "B";
}
function themeNow(now) {
  if (prefGet(TH.hc, "0") === "1") return "S";                                     // High contrast overrides any theme
  const a = prefGet(TH.auto, "off"), day = prefGet(TH.day, THM().day || "G"), night = prefGet(TH.night, THM().night || "B");
  if (a === "time") { const h = istHour(now || new Date()); return h >= 6 && h < 18 ? day : night; }        // 6 am–6 pm IST = day
  if (a === "system") return matchMedia("(prefers-color-scheme: dark)").matches ? night : day;
  return themePick();
}
const skinNow = now => themeNow(now) === "I" ? "neon" : "aurora";                   // kept for older callers
const glowNow = () => (CALM() || prefGet("screener.rmotion", "0") === "1" || matchMedia("(prefers-reduced-motion: reduce)").matches) ? "0" : prefGet(TH.glow, "0");   // Calm / Reduce motion force Off
function applySkin(now) {
  const R = document.documentElement, th = themeNow(now);
  R.dataset.th = th; R.dataset.theme = TH_LIGHT.has(th) ? "light" : "dark"; delete R.dataset.skin; R.dataset.glow = glowNow();
  R.classList.toggle("layer-a", prefGet(SKIN.a, "1") === "1"); R.classList.toggle("layer-c", prefGet(SKIN.c, "1") === "1");
  R.classList.toggle("cb", prefGet(SKIN.cb, "0") === "1"); R.classList.toggle("calm", CALM());
  // review #74: accent colour, text size, density, reduce motion
  const ac = prefGet(PZ.accent, ""); if (ACCENTS.some(a => a[0] === ac)) R.dataset.acc = ac; else delete R.dataset.acc;
  const fs = +prefGet(PZ.fs, "0"); R.style.fontSize = fs >= 13 && fs <= 19 ? fs + "px" : "";
  const dn = prefGet(PZ.density, "comfortable"); if (dn === "compact" || dn === "roomy") R.dataset.density = dn; else delete R.dataset.density;
  R.classList.toggle("rmotion", prefGet(PZ.rmotion, "0") === "1");
}
// review #74 B: Personalise – every look-and-feel choice in one place (this browser + Backup / Restore)
const PZ = { accent: "screener.accent", fs: "screener.fs", density: "screener.density", num: "screener.numstyle", home: "screener.homelayout", rmotion: "screener.rmotion", haptic: "screener.haptic", owner: "screener.owner" };
// review #75 A: Business Owner Mode – judge the business before the price. On a stock page, peek sheet and stock row the price,
// today's move, market cap, EV, P/E, P/B, EV/EBITDA, dividend yield, % vs fair value, buy zone, ladder, verdict pill, price charts and
// the Fair value tab's rupee values become a calm placeholder of the same size (no layout jump). Home / Market / Portfolio unchanged.
const OWNER = () => prefGet(PZ.owner, "0") === "1";
const OM_TXT = "Hidden in Business Owner Mode";
const omh = (cls = "") => `<span class="omh ${cls}" data-omh>${OM_TXT}</span>`;
const omRow = () => `<span class="omh omr" data-omh aria-label="${OM_TXT}">hidden</span>`;
const omPanel = (title, extra = "") => `<section class="panel omp" data-omh><h2>${title}</h2><p class="sub">${OM_TXT} – judge the business first. Tap 👁 at the top of the page (or Settings → Personalise) to show prices again.</p>${extra}</section>`;
const ACCENTS = [["blue", "Blue"], ["violet", "Violet"], ["teal", "Teal"], ["amber", "Amber"], ["pink", "Pink"], ["slate", "Slate"]];   // never green or red
const PZ_KEYS = [TH.key, TH.glow, TH.auto, TH.day, TH.night, TH.hc, SKIN.a, SKIN.c, SKIN.cb, "screener.calm", ...Object.values(PZ)];
const DISPLAY_PREFS = PZ_KEYS;
const displayPrefs = () => Object.fromEntries(DISPLAY_PREFS.map(k => [k, prefGet(k, null)]).filter(([, v]) => v != null));
try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (prefGet(TH.auto, "off") === "system") { applySkin(); render(true); } }); } catch (e) {}
applySkin();
setInterval(() => { if (prefGet(TH.auto, "off") === "time") { const was = document.documentElement.dataset.th; applySkin(); if (was !== document.documentElement.dataset.th) render(true); } }, 60000);
const skOf = s => (s && (s.sector || sigGroup(s))) || "general";   // layer C: the stock's sector colour key
const MOODBY = () => prefGet("screener.moodby", "overall");        // Portfolio totals: colour by Overall · Today
function moodOf(pct) {
  if (pct == null || !isFinite(pct) || Math.abs(pct) < MOOD.neutral) return { dir: "flat", step: 0 };
  const a = Math.abs(pct);
  return { dir: pct > 0 ? "up" : "down", step: a < MOOD.steps[0] ? 1 : a < MOOD.steps[1] ? 2 : 3 };
}
// applyMood(scope, pct, maxStep): sets --mood-bg / --mood-accent / --mood-glow on an element (scope), or – with scope null –
// returns them as a style string for a template. The one place mood colours are decided (docs/DESIGN.md).
function applyMood(scope, pct, maxStep = 3) {
  const m = moodOf(pct), step = Math.min(m.step, maxStep), calm = CALM();
  const c = m.dir === "up" ? "var(--gain)" : "var(--loss)", k = MOOD.mix[Math.max(step, 1) - 1];
  const vars = !step ? {} : {
    "--mood-bg": calm ? "var(--surface)" : `color-mix(in srgb, ${c} ${k}%, var(--surface))`,
    "--mood-accent": calm ? "var(--accent)" : c,
    "--mood-glow": calm ? "transparent" : `color-mix(in srgb, ${c} ${k + 18}%, transparent)` };
  if (scope) {
    ["--mood-bg", "--mood-accent", "--mood-glow"].forEach(p => vars[p] ? scope.style.setProperty(p, vars[p]) : scope.style.removeProperty(p));
    scope.dataset.mood = step ? m.dir + step : "flat";
    return "";
  }
  return Object.entries(vars).map(([p, v]) => `${p}:${v}`).join(";");
}
const moodAttr = (pct, maxStep) => { const st = applyMood(null, pct, maxStep), m = moodOf(pct); return ` data-mood="${m.step ? m.dir + Math.min(m.step, maxStep || 3) : "flat"}"${st ? ` style="${st}"` : ""}`; };
// a change, always with a sign and an arrow, never colour alone
const chgPill = (x, d = 2, extra = "") => `<span class="pill ${FMT.cls(x)}" data-mv="${FMT.cls(x)}" data-ch="${x == null || !isFinite(x) ? "" : +x}">${FMT.arrow(x) ? `<span class="arr" aria-hidden="true">${FMT.arrow(x)}</span>&nbsp;` : ""}${FMT.pct(x, d)}${extra}</span>`;
// toasts with Undo (review #41 2)
function toast(msg, undo) {
  const box = document.getElementById("toasts"); if (!box) return;
  const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status");
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button type="button">Undo</button>` : ""}`;
  if (undo) t.querySelector("button").onclick = () => { undo(); t.remove(); };
  box.appendChild(t);
  setTimeout(() => t.remove(), undo ? 6000 : 3000);
}
// Stage 3 data repeats many long strings; the pipeline stores each once in S.strtab and refers to it as "§<n>",
// and keeps each check's usual name/rule/tag/questions once in S.lens_registry (stocks store only differences).
const OS_FIELDS = ["high52", "low52", "pct_from_high52", "dma50", "dma200", "rsi14", "cross20", "cross_date"];
const osWarn = s => s && s.os ? `<span class="osw">unreliable – old split</span>` : "";
const osNote = s => s && s.os ? `<p class="mini osw">⚠️ 52-week high, averages, RSI and the chart are unreliable – old split: the price fell from ₹${esc(FMT.num(s.os.before, 2))} to ₹${esc(FMT.num(s.os.after, 2))} on ${esc(dateTxt(s.os.date))} with no split, bonus or demerger on record, so older prices are probably not adjusted yet.</p>` : "";
function expandStock(s) {                    // also run on a stock's full data when it loads later (review #36)
  // review #60 (BUG-20261113-01): a price cliff no split/bonus/demerger explains → the 52-week high, averages and RSI are known to be
  // wrong; they are taken out of every screen and shown as "unreliable – old split" (raw values kept in s.os.raw for the record)
  if (s.os) { s.os.raw = s.os.raw || {}; OS_FIELDS.forEach(k => { if (s[k] != null) { s.os.raw[k] = s[k]; s[k] = null; } }); }
  const T = S.strtab || [], R = S.lens_registry || {};
  const fix = o => {
    if (Array.isArray(o)) { for (let i = 0; i < o.length; i++) o[i] = fix(o[i]); return o; }
    if (o && typeof o === "object") { for (const k in o) o[k] = fix(o[k]); return o; }
    if (typeof o === "string" && o[0] === "§" && /^§\d+$/.test(o)) return T[+o.slice(1)];
    return o;
  };
  {
    if (s.v4) fix(s.v4);
    if (!s.s3 || s.s3.lite) return;
    fix(s.s3);
    s.s3.lenses.forEach(l => {
      const lr = R["L:" + l.k] || {};
      if (l.n == null) l.n = lr.n; if (l.sp == null) l.sp = lr.sp;
      l.ch.forEach(c => { const r = R[c.id] || {}; ["n", "r", "t", "q"].forEach(f => { if (c[f] == null && r[f] != null) c[f] = r[f]; }); });
      l.ct = { pass: 0, fail: 0, judge: 0, partial: 0, none: 0 };
      l.ch.forEach(c => l.ct[c.s]++);
      l.pp = l.ch.filter(c => c.s === "partial" && c.l === "pass").length;
      l.c = l.ct.pass + l.ct.fail + l.ct.partial; l.p = l.ct.pass + l.pp;
    });
  }
}
S.stocks.forEach(expandStock);
const BY = Object.fromEntries(S.stocks.map(s => [s.symbol, s]));
// ---- review #36: split page (public link) – full stock data on demand; universe switch (Nifty 500 · All)
const SPLIT = S.mode === "split";
const isFull = s => !SPLIT || !!s.__full;
const stockFile = sym => sym.replace(/[^A-Za-z0-9_-]/g, ch => "~" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
// review #81 C: the 7 checking layers' files (data/dq.json, data/lh/<SYMBOL>.json) – only on the private site: pipeline/cloudflare.py
// switches DQS_ON on when it stages data/dq.json, so no other copy asks for a file it doesn't have
const DQS_ON = window.__DQS_ON === true;     // set in the loader script above (review #85 J4: the app code may live in app.js)
let DQS_STATE = "none";
function loadDQS() {
  if (!DQS_ON || S.mode !== "split" || !/^https?:$/.test(location.protocol) || DQS_STATE !== "none") return;
  DQS_STATE = "loading";
  fetch("data/dq.json").then(r => r.ok ? r.json() : null).then(d => { S.dqs = d; DQS_STATE = d ? "ok" : "missing"; if (d) dqsRerender(); })
    .catch(() => { DQS_STATE = "missing"; });
}
const LH = {};
function loadLH(sym) {
  if (!S.dqs || !(S.dqs.lh || []).includes(sym) || LH[sym]) return;
  LH[sym] = "loading";
  fetch(`data/lh/${stockFile(sym)}.json`).then(r => r.ok ? r.json() : null).then(d => { LH[sym] = d || "none"; if (d && parseHash().arg === sym) { const y = scrollY; render(true); scrollTo(0, y); } }).catch(() => { LH[sym] = "none"; });
}
function ensureFull(sym) {
  const s = BY[sym];
  if (!s || isFull(s)) return Promise.resolve(!!s);
  if (s.__loading) return s.__loading;
  s.__loading = fetch(`data/stock/${stockFile(sym)}.json`).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(full => { Object.assign(s, full); s.__full = 1; delete s.__err; expandStock(s); if (typeof VCACHE !== "undefined") VCACHE.delete(sym); return true; })
    .catch(e => { s.__err = String(e && e.message || e); return false; })
    .finally(() => { delete s.__loading; });
  return s.__loading;
}
// review #67: the Watchlist mini lines and the Portfolio insights need each saved / held stock's price history: on the split page load
// those stocks' own files (at most 80, once each) and re-draw the screen when they arrive
let MINE_REQ = "";
function ensureMine(syms, route) {
  const need = [...new Set(syms)].filter(t => BY[t] && !isFull(BY[t]) && !BY[t].__err).slice(0, 80);
  const key = route + ":" + need.join(","); if (!need.length || MINE_REQ === key) return; MINE_REQ = key;
  Promise.all(need.map(ensureFull)).then(() => { if (parseHash().name === route) render(true); });
}
const histOf = sym => (H.close && H.close[sym]) ? { dates: H.dates, close: H.close[sym] } : (BY[sym] && BY[sym].hist) || null;
const HAS_WIDE = S.stocks.some(s => s.ow);
let UNI = (() => { try { return localStorage.getItem("screener.universe") || "all"; } catch (e) { return "all"; } })();
const inUni = s => !HAS_WIDE || UNI === "all" || !s.ow;
const UNIV = () => S.stocks.filter(inUni);
function uniSwitch() {
  if (!HAS_WIDE) return SPLIT ? "" : `<p class="sub uninote">Offline copy: Nifty 500 only. <a href="https://nightscreener.github.io/" rel="noopener">Open the link</a> for all stocks.</p>`;
  const nAll = S.stocks.length, n5 = S.stocks.filter(s => !s.ow).length;
  return `<div class="uni" role="group" aria-label="Which stocks"><button class="act${UNI === "n500" ? " on" : ""}" type="button" data-uni="n500" aria-pressed="${UNI === "n500"}">Nifty 500 <span class="sub">(${n5})</span></button><button class="act${UNI === "all" ? " on" : ""}" type="button" data-uni="all" aria-pressed="${UNI === "all"}">All ${FMT.count(nAll)}</button></div>`;
}
const wideTags = s => s.ow ? ` <span class="tag">outside Nifty 500</span>${s.traded_value_cr != null && s.traded_value_cr < 5 ? ` <span class="tag warn">⚠️ low liquidity</span>` : ""}` : "";
const DOT = { green: "🟢", yellow: "🟡", red: "🔴" };

// ---------- formatting ----------
const fmt = FMT;                                                 // review #41: the one number formatter
const inr = (x, d = 2) => FMT.money(x, d);
// review #72 (10): EVERY gain green ▲, every fall red ▼, exactly 0 grey with no arrow – one helper for changes, levels and numbers in
// sentences. moveClass(change) → "up" / "down" / "flat"; moveNum(change, text) → the number with its class and a small arrow.
// Not for P/E, ROCE, scores, counts, "% below fair value", verdict pills or the mood gauge (they aren't gains or falls).
const moveClass = ch => FMT.cls(ch);
// a level / price coloured by TODAY's change (no arrow – the change next to it carries the arrow)
const lvlNum = (ch, text, base = "num") => `<span class="${base} ${moveClass(ch)}" data-lvl="1" data-ch="${ch == null || !isFinite(ch) ? "" : +ch}">${text}</span>`;
// a sentence with its change numbers marked by the nightly ([text, change] pairs) – each coloured by the helper, never by words
const storyLine = (t, marks) => { let h = esc(t); (marks || []).forEach(([tx, ch]) => { const e = esc(tx), i = h.indexOf(e); if (i >= 0) h = h.slice(0, i) + moveNum(ch, e) + h.slice(i + e.length); }); return h; };
const moveNum = (ch, text, cls = "") => { const c = moveClass(ch), a = FMT.arrow(ch);
  return `<span class="num ${c}${cls ? " " + cls : ""}" data-mv="${c}" data-ch="${ch == null || !isFinite(ch) ? "" : +ch}">${a ? `<span class="arr" aria-hidden="true">${a}</span>&nbsp;` : ""}${text}</span>`; };
const pct = (x, d = 1) => FMT.pct(x, d);
const shares = x => FMT.shares(x);
const dateTxt = iso => FMT.date(iso);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/*__USERLIB_START__*/
// ---------- ⭐ Watchlist + 💼 Portfolio: pure functions (review #30) – no page, no network; tested by tests/userlib_test.js ----------
// PRIVACY: everything the user enters lives only in this browser (localStorage key "screener.user.v1"). Nothing is sent anywhere.
const UL = (() => {
  const KEY = "screener.user.v1", VERSION = 3;          // review #58: v2 = watchlist buckets + "suggested by"; review #68: v3 = Learn progress
  const dn = d => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5;
  const days = (a, b) => Math.round(dn(b) - dn(a));
  const iso = t => new Date(t * 864e5).toISOString().slice(0, 10);
  const r2 = x => Math.round(x * 100) / 100;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const empty = today => ({ v: VERSION, watch: [], archive: [], tx: [], charts: {}, buckets: [], learn: learnEmpty(), screens: [], meta: { created: today || null, lastBackup: null } });
  // review #70 (S4): "My screens" – up to 20 saved queries (name ≤ 40 characters), this browser only, in the backup
  const MAX_SCREENS = 20;
  const cleanScreens = a => (Array.isArray(a) ? a : []).filter(x => x && typeof x.q === "string" && x.q.trim() && typeof x.name === "string" && x.name.trim())
    .slice(0, MAX_SCREENS).map(x => ({ id: String(x.id || uid()), name: x.name.trim().slice(0, 40), q: x.q.trim().slice(0, 300), saved: x.saved || null }));
  function screenSave(data, name, q, today) {
    data.screens = cleanScreens(data.screens); name = String(name || "").trim(); q = String(q || "").trim();
    if (!name || !q) return "Give the screen a name.";
    const cur = data.screens.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (cur) { cur.q = q; cur.saved = today; return cur; }
    if (data.screens.length >= MAX_SCREENS) return `You can keep up to ${MAX_SCREENS} screens – remove one first.`;
    const x = { id: uid(), name: name.slice(0, 40), q: q.slice(0, 300), saved: today }; data.screens.push(x); return x;
  }
  // ---------- review #68: Learn progress (this browser only, in the backup) ----------
  const LEITNER = [1, 2, 4, 8, 16], HEARTS = 5, REFILL_REVIEWS = 3, STREAK_CARDS = 5;
  const learnEmpty = () => ({ level: null, start: 0, done: {}, quiz: {}, xp: 0, streak: 0, last: null, hearts: HEARTS, heartsDay: null, reviews: 0,
    cards: {}, cardsDay: null, cardsToday: 0, newToday: 0, newPerDay: 10, certs: [], lang: "en", plain: false, placed: false, name: "" });
  const cleanLearn = l => { const e = learnEmpty(), o = Object.assign(e, l && typeof l === "object" && !Array.isArray(l) ? l : {});
    o.xp = Math.max(0, +o.xp || 0); o.streak = Math.max(0, +o.streak || 0); o.hearts = Math.min(HEARTS, Math.max(0, o.hearts == null ? HEARTS : +o.hearts));
    o.done = o.done && typeof o.done === "object" ? o.done : {}; o.quiz = o.quiz && typeof o.quiz === "object" ? o.quiz : {};
    o.cards = o.cards && typeof o.cards === "object" ? o.cards : {}; o.certs = Array.isArray(o.certs) ? o.certs : [];
    o.lang = o.lang === "hi" ? "hi" : "en"; o.plain = !!o.plain; o.newPerDay = NEW_PER_DAY.includes(+o.newPerDay) ? +o.newPerDay : 10; o.newToday = Math.max(0, +o.newToday || 0); return o; };
  // review #69: new cards enter at 5 / 10 / 20 a day (default 10); reviews of cards already seen are always shown
  const NEW_PER_DAY = [5, 10, 20];
  function cardsToday(L, keys, today) {
    const reviews = keys.filter(k => L.cards[k] && L.cards[k].due <= today), unseen = keys.filter(k => !L.cards[k]);
    const fresh = unseen.slice(0, Math.max(0, (L.newPerDay || 10) - (L.cardsDay === today ? L.newToday || 0 : 0)));
    return { due: reviews.concat(fresh), reviews: reviews.length, fresh: fresh.length, waiting: unseen.length - fresh.length };
  }
  // the IST calendar day of a moment (streaks, hearts and due cards all use IST dates)
  const istDay = (ms = Date.now()) => new Date(ms + 330 * 60000).toISOString().slice(0, 10);
  // Leitner boxes: wrong → box 1 (due tomorrow); right → the next box; box n is due after 1, 2, 4, 8, 16 days
  function leitner(card, right, today) {
    const box = right ? Math.min(LEITNER.length, ((card && card.box) || 0) + 1) : 1;
    return { box, due: iso(dn(today) + LEITNER[box - 1]) };
  }
  const cardsDue = (cards, keys, today) => keys.filter(k => !cards[k] || cards[k].due <= today);
  // a new IST day: hearts refill fully; today's counters reset (the streak itself only changes when something is done)
  function learnDay(L, today) {
    if (L.heartsDay !== today) { L.hearts = HEARTS; L.heartsDay = today; L.reviews = 0; }
    if (L.cardsDay !== today) { L.cardsDay = today; L.cardsToday = 0; L.newToday = 0; }
    return L;
  }
  // the streak: days in a row with ≥ 1 lesson or 5 flashcards (IST dates)
  function learnActive(L, today) {
    if (L.last === today) return L;
    L.streak = L.last && days(L.last, today) === 1 ? L.streak + 1 : 1; L.last = today; return L;
  }
  const streakNow = (L, today) => L.last && days(L.last, today) <= 1 ? L.streak : 0;
  function learnAnswer(L, right, today, xp = 10) { learnDay(L, today); if (right) L.xp += xp; else L.hearts = Math.max(0, L.hearts - 1); return L; }
  function learnReview(L, key, right, today) {
    learnDay(L, today); if (!L.cards[key]) L.newToday++; L.cards[key] = leitner(L.cards[key], right, today); L.cardsToday++;
    if (L.hearts < HEARTS && ++L.reviews >= REFILL_REVIEWS) { L.hearts = HEARTS; L.reviews = 0; }
    if (L.cardsToday >= STREAK_CARDS) learnActive(L, today);
    return L;
  }
  function learnLesson(L, id, today, xp = 30) { learnDay(L, today); if (!L.done[id]) L.xp += xp; L.done[id] = today; learnActive(L, today); return L; }
  // the quick test → where the path starts: 0–1 right Beginner, 2 Beginner+ (skips 3 lessons), 3 Intermediate
  const quickPlace = n => n >= 3 ? { level: "intermediate", start: 0 } : n === 2 ? { level: "beginner", start: 3 } : { level: "beginner", start: 0 };
  const certOK = (right, total, pct = 60) => total > 0 && right / total * 100 >= pct;
  // a level opens when the one before is at least half done (or the quick test placed you at or past it)
  function levelOpen(levels, i, L) {
    if (i === 0) return true;
    const order = levels.map(x => x.id), at = order.indexOf(L.level);
    if (L.placed && at >= i) return true;
    const prev = levels[i - 1].lessons, n = prev.filter((x, j) => L.done[x.id] || (L.placed && order[i - 1] === L.level && j < L.start)).length;
    return n >= prev.length / 2;
  }
  // review #58: watchlist buckets – up to 8, name ≤ 24 characters, a stock can be in several; "All" always exists (not stored)
  const MAX_BUCKETS = 8, BUCKET_NAME = 24, NOTE_MAX = 280, BY_MAX = 40, SHARE_MAX = 50;
  const cleanBuckets = b => (Array.isArray(b) ? b : []).filter(x => x && typeof x.name === "string" && x.name.trim())
    .slice(0, MAX_BUCKETS).map(x => ({ id: String(x.id || uid()), name: x.name.trim().slice(0, BUCKET_NAME),
                                       syms: [...new Set((Array.isArray(x.syms) ? x.syms : []).map(t => String(t).toUpperCase()))] }));
  // review #42: chart drawings per symbol ({SYM: [{id, type, pts: [{t, p}], text?, level?}]}) – this device only, in the backup
  const cleanCharts = c => Object.fromEntries(Object.entries(c && typeof c === "object" && !Array.isArray(c) ? c : {})
    .map(([k, v]) => [String(k), (Array.isArray(v) ? v : []).filter(d => d && typeof d.type === "string" && Array.isArray(d.pts))])
    .filter(([, v]) => v.length));

  // older shapes -> current (v0 = an early draft: { watchlist: [...], transactions: [...] }, no "v")
  function upgrade(raw, today) {
    if (!raw || typeof raw !== "object") return empty(today);
    let o = JSON.parse(JSON.stringify(raw));
    if (!o.v) o = { v: 1, watch: o.watch || o.watchlist || [], archive: o.archive || [], tx: o.tx || o.transactions || [], charts: o.charts || {}, meta: o.meta || {} };
    if (o.v > VERSION) throw new Error("This data comes from a newer version of the page – update the page first.");
    o.watch = (o.watch || []).filter(w => w && w.sym).map(w => Object.assign({ id: uid(), note: "" }, w));
    o.archive = (o.archive || []).filter(w => w && w.sym);
    o.tx = (o.tx || []).filter(t => t && t.sym && +t.qty > 0 && +t.px > 0 && /^\d{4}-\d\d-\d\d$/.test(t.date || ""))
      .map(t => ({ id: t.id || uid(), sym: String(t.sym).toUpperCase(), side: t.side === "sell" ? "sell" : "buy", qty: +t.qty, px: +t.px,
                   date: t.date, charges: +t.charges || 0, src: t.src || null, pf: t.pf || null }));      // review #79: which portfolio
    o.charts = cleanCharts(o.charts);
    o.buckets = cleanBuckets(o.buckets);                  // v1 → v2: no buckets yet
    o.alerts = (Array.isArray(o.alerts) ? o.alerts : []).filter(a => a && a.sym && ["above", "below", "pct"].includes(a.kind) && +a.v > 0)
      .map(a => ({ id: a.id || uid(), sym: String(a.sym).toUpperCase(), kind: a.kind, v: +a.v, seen: a.seen || null }));
    o.watch.forEach(w => { if (w.note) w.note = String(w.note).slice(0, NOTE_MAX); if (w.by) w.by = String(w.by).slice(0, BY_MAX); });
    o.meta = Object.assign({ created: today || null, lastBackup: null }, o.meta || {});
    o.learn = cleanLearn(o.learn);                        // v2 → v3: no Learn progress yet
    o.screens = cleanScreens(o.screens);                  // review #70 (S4): "My screens" – saved queries
    o.v = VERSION;
    return o;
  }
  function load(storage, today) {
    try {
      if (!storage) throw new Error("no storage");
      const t = storage.getItem(KEY);
      return { ok: true, data: upgrade(t ? JSON.parse(t) : null, today) };
    } catch (e) { return { ok: false, data: empty(today), err: String(e && e.message || e) }; }
  }
  function save(storage, data) {
    try { if (!storage) throw new Error("no storage"); storage.setItem(KEY, JSON.stringify(data)); return { ok: true }; }
    catch (e) { return { ok: false, err: String(e && e.message || e) }; }
  }

  // transactions -> one holding. Average cost (Kite-style) for P&L, buy charges included in the cost; FIFO lots for tax timing.
  const ordered = txs => txs.map((t, i) => [t, i]).sort((a, b) => a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]).map(x => x[0]);
  function position(txs, months = 12) {
    let qty = 0, cost = 0, realised = 0, charges = 0, first = null;
    const lots = [], sells = [];
    for (const t of ordered(txs)) {
      charges += t.charges || 0;
      if (t.side === "buy") {
        if (!qty) first = t.date;
        qty += t.qty; cost += t.qty * t.px + (t.charges || 0);
        lots.push({ date: t.date, qty: t.qty, px: t.px + (t.charges || 0) / t.qty });
      } else {
        if (t.qty > qty + 1e-9) return { err: `On ${t.date} you sell ${t.qty} but hold only ${qty}.` };
        const avg = cost / qty, pnl = t.qty * (t.px - avg) - (t.charges || 0);
        realised += pnl; cost -= t.qty * avg; qty -= t.qty;
        // tax view (review #33): FIFO lots, sell charges spread over the shares; long-term = held more than `months` months
        let left = t.qty, held = null, stG = 0, ltG = 0;
        const net = t.px - (t.charges || 0) / t.qty;
        while (left > 0 && lots.length) {
          const l = lots[0], k = Math.min(l.qty, left), g = k * (net - l.px);
          held = held ?? days(l.date, t.date);
          if (daysToLT(l.date, t.date, months) === 0) ltG += g; else stG += g;
          l.qty -= k; left -= k; if (l.qty <= 0) lots.shift();
        }
        sells.push({ date: t.date, qty: t.qty, px: t.px, avg: r2(avg), pnl: r2(pnl), held, stG: r2(stG), ltG: r2(ltG) });
        if (qty === 0) { cost = 0; first = null; }
      }
    }
    return { qty, avg: qty ? cost / qty : 0, invested: cost, realised, charges, lots, sells, first };
  }
  function validateTx(t, txs, today) {
    if (!t.sym) return "Pick a stock.";
    if (!Number.isInteger(t.qty) || t.qty < 1) return "Quantity must be a whole number of shares, 1 or more.";
    if (!(t.px > 0)) return "Price per share must be more than ₹0.";
    if (!/^\d{4}-\d\d-\d\d$/.test(t.date || "")) return "Pick a date.";
    if (t.date > today) return "The date can't be in the future.";
    if ((t.charges || 0) < 0) return "Charges can't be negative.";
    const p = position(txs.filter(x => x.sym === t.sym && x.id !== t.id).concat([t]));
    if (p.err) return p.err.replace("On ", "Not possible: on ");
    return null;
  }
  // every holding with tonight's prices. priceOf(sym) -> { close, prev } or null (not tracked)
  function portfolio(txs, priceOf, today) {
    const bySym = {};
    txs.forEach(t => (bySym[t.sym] = bySym[t.sym] || []).push(t));
    const rows = [], sold = [];
    const T = { invested: 0, value: 0, day: 0, prevValue: 0, realised: 0, unpricedInvested: 0, priced: 0 };
    for (const [sym, list] of Object.entries(bySym)) {
      const p = position(list);
      if (p.err) continue;
      T.realised += p.realised;
      p.sells.forEach(x => sold.push(Object.assign({ sym }, x)));
      if (!p.qty) continue;
      const q = priceOf(sym), r = { sym, qty: p.qty, avg: p.avg, invested: p.invested, lots: p.lots, first: p.first,
        daysHeld: p.first ? days(p.first, today) : 0, tracked: !!q };
      if (q && q.close != null) {
        r.value = p.qty * q.close; r.pnl = r.value - p.invested; r.pnlPct = p.invested ? r.pnl / p.invested * 100 : 0;
        const prev = q.prev != null ? q.prev : q.close;
        r.day = p.qty * (q.close - prev); r.dayPct = prev ? (q.close / prev - 1) * 100 : 0;
        T.invested += p.invested; T.value += r.value; T.day += r.day; T.prevValue += p.qty * prev; T.priced++;
      } else T.unpricedInvested += p.invested;
      rows.push(r);
    }
    T.pnl = T.value - T.invested; T.pnlPct = T.invested ? T.pnl / T.invested * 100 : 0;
    T.dayPct = T.prevValue ? T.day / T.prevValue * 100 : 0;
    sold.sort((a, b) => a.date < b.date ? 1 : -1);
    return { rows, sold, totals: T };
  }

  // XIRR: flows [{date, amount}] (money paid in < 0, money out or today's value > 0). Newton, then bisection. Yearly rate in %.
  function xirr(flows) {
    if (flows.length < 2 || !flows.some(f => f.amount < 0) || !flows.some(f => f.amount > 0)) return null;
    const d0 = flows.reduce((m, f) => f.date < m ? f.date : m, flows[0].date);
    const ts = flows.map(f => days(d0, f.date) / 365);
    const f = r => flows.reduce((s, x, i) => s + x.amount / Math.pow(1 + r, ts[i]), 0);
    const df = r => flows.reduce((s, x, i) => s - ts[i] * x.amount / Math.pow(1 + r, ts[i] + 1), 0);
    let r = 0.1;
    for (let i = 0; i < 60; i++) { const y = f(r), d = df(r); if (!isFinite(y) || !d) break; const n = r - y / d; if (n <= -0.9999 || !isFinite(n)) break; if (Math.abs(n - r) < 1e-10) return n * 100; r = n; }
    let lo = -0.9999, hi = 100;
    if (f(lo) * f(hi) > 0) return null;
    for (let i = 0; i < 300; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
    return (lo + hi) / 2 * 100;
  }
  // cash flows of the transactions (buys incl. charges negative, sells after charges positive) + today's value
  function flowsOf(txs, value, today) {
    const fl = txs.map(t => ({ date: t.date, amount: t.side === "buy" ? -(t.qty * t.px + (t.charges || 0)) : t.qty * t.px - (t.charges || 0) }));
    if (value > 0) fl.push({ date: today, amount: value });
    return fl;
  }
  // the same money on the same dates into a benchmark: levelAt(date) -> level on or before that date
  function benchCompare(txs, levelAt, today) {
    let units = 0, missing = 0;
    for (const t of txs) {
      const L = levelAt(t.date), amt = t.side === "buy" ? t.qty * t.px + (t.charges || 0) : t.qty * t.px - (t.charges || 0);
      if (!L) { missing++; continue; }
      units += (t.side === "buy" ? 1 : -1) * amt / L;
    }
    const Lt = levelAt(today);
    return Lt && !missing ? { value: units * Lt } : null;
  }
  const levelLookup = (level) => { const ks = Object.keys(level || {}).sort();
    return d => { let lo = 0, hi = ks.length - 1, ans = null; while (lo <= hi) { const m = (lo + hi) >> 1; if (ks[m] <= d) { ans = ks[m]; lo = m + 1; } else hi = m - 1; } return ans ? level[ans] : null; }; };

  // tax timing: long-term after more than `months` months (the anniversary day still counts as short-term)
  function ltDate(date, months) {
    const y = +date.slice(0, 4), m = +date.slice(5, 7) - 1 + months, d = +date.slice(8, 10);
    const dt = new Date(Date.UTC(y + Math.floor(m / 12), m % 12, 1));
    const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
    dt.setUTCDate(Math.min(d, last));
    return iso(dn(dt.toISOString().slice(0, 10)) + 1);
  }
  const daysToLT = (date, today, months = 12) => Math.max(0, days(today, ltDate(date, months)));
  // financial year (April–March) of a date, e.g. "2026-27"
  const fyOf = d => { const y = +d.slice(0, 4), s = +d.slice(5, 7) >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(2)}`; };
  // tax estimate for one financial year (review #33): STCG × rate; LTCG summed for the year, minus the exemption, × rate.
  // st / lt = net gains of each kind (a loss nets only against gains of its own kind here – simple, labelled estimate)
  function taxEstimate(st, lt, r) {
    if (!r || r.stcg_pct == null || r.ltcg_pct == null || r.ltcg_exempt == null) return null;
    const stTax = Math.max(0, st) * r.stcg_pct / 100, ltTaxable = Math.max(0, lt - r.ltcg_exempt), ltTax = ltTaxable * r.ltcg_pct / 100;
    return { stTax, ltTax, ltTaxable, total: stTax + ltTax };
  }
  function taxSplit(lots, close, today, months = 12) {
    const o = { st: 0, lt: 0, stQty: 0, ltQty: 0 };
    lots.forEach(l => { const g = (close - l.px) * l.qty; if (daysToLT(l.date, today, months) === 0) { o.lt += g; o.ltQty += l.qty; } else { o.st += g; o.stQty += l.qty; } });
    return o;
  }

  // buy zone: the highest price that still meets tonight's Buy price rule = the value the verdict used × (1 − margin)
  // x = { value, margin, enough, hard, quality, price, trendOk, isBuy }
  function buyZone(x) {
    if (x.hard) return { zone: null, kind: "flag", text: "No buy zone – red flag" };
    if (x.enough === false || x.value == null) return { zone: null, kind: "few", text: "No buy zone – fewer than 3 valuation methods agree" };
    if (x.quality == null || x.quality < 70) return { zone: null, kind: "quality", text: `No buy zone – quality ${x.quality ?? "–"}/100, the Buy rule needs 70+` };
    const zone = x.value * (1 - x.margin / 100);
    const inZone = x.price <= zone;
    return { zone, inZone, kind: inZone ? "in" : "above",
             text: inZone ? `Still in buy zone up to ₹${fmt(zone)} – today ₹${fmt(x.price)} ✅` : `⚠️ Price ran above the buy zone (₹${fmt(zone)}) – today ₹${fmt(x.price)}` };
  }
  const fmt = v => FMT.num(v, 0);

  // skipped ideas: removed from the watchlist and never bought afterwards; their move since saved vs the benchmark
  function skipped(archive, txs, priceOf, levelAt, today) {
    const list = archive.filter(a => !txs.some(t => t.sym === a.sym && t.side === "buy" && t.date >= a.saved));
    const mv = [], bm = [];
    list.forEach(a => { const q = priceOf(a.sym), L0 = levelAt(a.saved), L1 = levelAt(today);
      if (q && q.close && a.px) { mv.push((q.close / a.px - 1) * 100); if (L0 && L1) bm.push((L1 / L0 - 1) * 100); } });
    const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
    return { n: list.length, measured: mv.length, move: avg(mv), bench: bm.length === mv.length ? avg(bm) : null };
  }

  // CSV (quotes, commas inside quotes) -> rows of strings
  function parseCSV(text) {
    const rows = []; let row = [], cell = "", q = false;
    const t = String(text).replace(/^﻿/, "");
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ""));
  }
  // Zerodha Kite / Console holdings CSV -> transactions to add. known(sym) -> true when the stock is on this page
  const COLS = { sym: ["instrument", "symbol", "tradingsymbol", "trading symbol", "stock", "scrip"],
    qty: ["qty.", "qty", "quantity", "quantity available", "net qty", "shares"],
    px: ["avg. cost", "avg cost", "average price", "avg. price", "avg price", "buy average", "buy avg"],
    date: ["date", "trade date", "buy date", "order date"] };
  function zerodhaImport(text, known, today) {
    const rows = parseCSV(text);
    if (!rows.length) return { err: "The file is empty.", rows: [] };
    const h = rows[0].map(x => x.trim().toLowerCase());
    const col = k => h.findIndex(x => COLS[k].includes(x));
    const ci = { sym: col("sym"), qty: col("qty"), px: col("px"), date: col("date") };
    if (ci.sym < 0 || ci.qty < 0 || ci.px < 0) return { err: "This doesn't look like a Zerodha holdings file (need columns Instrument/Symbol, Qty, Avg. cost).", rows: [] };
    const out = [], skipped = [];
    rows.slice(1).forEach((r, i) => {
      const sym = (r[ci.sym] || "").trim().toUpperCase().replace(/-(EQ|BE|BZ)$/, "");
      const qty = parseFloat((r[ci.qty] || "").replace(/,/g, "")), px = parseFloat((r[ci.px] || "").replace(/[,₹\s]/g, ""));
      let date = ci.date >= 0 ? (r[ci.date] || "").trim() : "";
      const m = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (m) date = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      if (!/^\d{4}-\d\d-\d\d$/.test(date) || date > today) date = today;
      if (!sym || !(qty >= 1) || !Number.isInteger(qty) || !(px > 0)) { skipped.push({ line: i + 2, why: "missing symbol, whole quantity or price" }); return; }
      out.push({ sym, qty, px: r2(px), date, tracked: !!known(sym) });
    });
    return { rows: out, skipped };
  }

  // backup file and restore (replace or merge)
  const backup = (data, today) => JSON.stringify({ app: "nifty500-screener", kind: "backup", made: today, data }, null, 1);
  function restore(text, current, mode, today) {
    let o;
    try { o = JSON.parse(text); } catch (e) { return { err: "This file is not a screener backup (not JSON)." }; }
    if (!o || o.app !== "nifty500-screener" || !o.data) return { err: "This file is not a screener backup." };
    let d;
    try { d = upgrade(o.data, today); } catch (e) { return { err: e.message }; }
    const counts = { watch: d.watch.length, archive: d.archive.length, tx: d.tx.length, made: o.made || null,
                     drawings: Object.values(d.charts).reduce((a, v) => a + v.length, 0) };
    if (mode !== "merge") return { data: Object.assign(d, { meta: Object.assign({}, current.meta, d.meta) }), counts };
    const m = JSON.parse(JSON.stringify(current));
    d.watch.forEach(w => { if (!m.watch.some(x => x.sym === w.sym)) m.watch.push(w); });
    d.archive.forEach(w => { if (!m.archive.some(x => x.id === w.id || (x.sym === w.sym && x.saved === w.saved))) m.archive.push(w); });
    d.tx.forEach(t => { if (!m.tx.some(x => x.id === t.id)) m.tx.push(t); });
    m.charts = m.charts || {};
    Object.entries(d.charts).forEach(([k, v]) => { const cur = m.charts[k] || (m.charts[k] = []); v.forEach(x => { if (!cur.some(y => y.id === x.id)) cur.push(x); }); });
    if (d.learn && (!m.learn || (d.learn.xp || 0) > (m.learn.xp || 0))) m.learn = d.learn;      // review #68: keep the further-along Learn progress
    m.screens = cleanScreens([...(m.screens || []), ...(d.screens || []).filter(x => !(m.screens || []).some(y => y.name.toLowerCase() === x.name.toLowerCase()))]);   // review #70
    if (!(m.wcols || []).length && (d.wcols || []).length) m.wcols = d.wcols;                                   // review #76 C: watchlist columns
    m.models = Object.assign({}, d.models || {}, m.models || {});
    m.pfs = [...(m.pfs || []), ...(d.pfs || []).filter(p => !(m.pfs || []).some(x => x.id === p.id))].slice(0, 10);         // review #79
    m.goals = [...(m.goals || []), ...(d.goals || []).filter(g => !(m.goals || []).some(x => x.id === g.id))];                                                // review #77 B: My model per stock
    m.feeds = [...(m.feeds || []), ...(d.feeds || []).filter(f => !(m.feeds || []).some(x => x.name === f.name))].slice(0, 10);   // review #77 C
    m.buckets = m.buckets || [];                          // review #58: same-name buckets merge their stocks
    d.buckets.forEach(b => { const cur = m.buckets.find(x => x.name.toLowerCase() === b.name.toLowerCase());
      if (cur) b.syms.forEach(t => { if (!cur.syms.includes(t)) cur.syms.push(t); });
      else if (m.buckets.length < MAX_BUCKETS) m.buckets.push(b); });
    return { data: m, counts };
  }
  // ---- review #58: bucket operations (pure: they change `u` and return an error text or null)
  function bucketAdd(u, name) {
    const n = String(name || "").trim().slice(0, BUCKET_NAME);
    u.buckets = u.buckets || [];
    if (!n) return "Give the bucket a name.";
    if (u.buckets.length >= MAX_BUCKETS) return `At most ${MAX_BUCKETS} buckets.`;
    if (u.buckets.some(b => b.name.toLowerCase() === n.toLowerCase()) || /^(all|nifty 50|bank nifty)$/i.test(n)) return "That name is taken.";
    const b = { id: uid(), name: n, syms: [] }; u.buckets.push(b); return b;
  }
  function bucketRename(u, id, name) {
    const b = (u.buckets || []).find(x => x.id === id), n = String(name || "").trim().slice(0, BUCKET_NAME);
    if (!b || !n) return "Give the bucket a name.";
    if (u.buckets.some(x => x !== b && x.name.toLowerCase() === n.toLowerCase())) return "That name is taken.";
    b.name = n; return null;
  }
  function bucketMove(u, id, dir) {
    const i = (u.buckets || []).findIndex(x => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= u.buckets.length) return null;
    [u.buckets[i], u.buckets[j]] = [u.buckets[j], u.buckets[i]]; return null;
  }
  const bucketDelete = (u, id) => { u.buckets = (u.buckets || []).filter(x => x.id !== id); return null; };
  function bucketSet(u, id, sym, on) {
    const b = (u.buckets || []).find(x => x.id === id); if (!b) return null;
    const has = b.syms.includes(sym);
    if (on && !has) b.syms.push(sym); else if (!on && has) b.syms = b.syms.filter(x => x !== sym);
    return null;
  }
  const bucketsOf = (u, sym) => (u.buckets || []).filter(b => b.syms.includes(sym)).map(b => b.id);
  // "By who suggested it": average move since saved per source (learning only)
  function bySource(watch, priceOf) {
    const g = {};
    (watch || []).forEach(w => { const q = priceOf(w.sym); if (!q || !w.px) return; const k = (w.by || "").trim() || "not noted";
      (g[k] = g[k] || []).push((q.close / w.px - 1) * 100); });
    return Object.entries(g).map(([by, v]) => ({ by, n: v.length, avg: r2(v.reduce((a, b) => a + b, 0) / v.length) })).sort((a, b) => b.avg - a.avg);
  }
  // share a bucket: a link with stock NAMES only (never notes, prices paid, portfolio)
  const shareLink = (base, name, syms) => `${base}#/import?list=${encodeURIComponent(String(name).slice(0, BUCKET_NAME))}&s=${syms.slice(0, SHARE_MAX).map(encodeURIComponent).join(",")}`;
  function parseImport(list, s, known) {
    const raw = String(s || "").split(",").map(x => decodeURIComponent(x).trim().toUpperCase()).filter(Boolean);
    const uniq = [...new Set(raw)];
    const ok = uniq.filter(x => known(x)).slice(0, SHARE_MAX);
    return { name: String(list || "").trim().slice(0, BUCKET_NAME) || "Friend's suggestions", syms: ok,
             bad: uniq.filter(x => !known(x)), cut: uniq.filter(x => known(x)).length > SHARE_MAX };
  }
  // ---- review #58 B/E: short names, live suggestions, "Did you mean…?" (pure; tested in tests/userlib_test.js)
  const ALIASES = { "sbi": "SBIN", "state bank": "SBIN", "l&t": "LT", "l and t": "LT", "larsen": "LT", "m&m": "M&M", "mahindra": "M&M",
    "airtel": "BHARTIARTL", "bharti": "BHARTIARTL", "hul": "HINDUNILVR", "hindustan unilever": "HINDUNILVR", "kotak": "KOTAKBANK",
    "icici pru": "ICICIPRULI", "icici prudential": "ICICIPRULI", "bajaj fin": "BAJFINANCE", "bajaj finance": "BAJFINANCE",
    "bajaj finserv": "BAJAJFINSV", "ril": "RELIANCE", "infy": "INFY", "hdfc": "HDFCBANK", "icici": "ICICIBANK", "axis": "AXISBANK",
    "maruti": "MARUTI", "asian paints": "ASIANPAINT", "sun pharma": "SUNPHARMA", "dr reddy": "DRREDDY", "dr reddys": "DRREDDY",
    "ultratech": "ULTRACEMCO", "hcl": "HCLTECH", "tech m": "TECHM", "tech mahindra": "TECHM", "power grid": "POWERGRID",
    "coal india": "COALINDIA", "adani ports": "ADANIPORTS", "nestle": "NESTLEIND", "pidilite": "PIDILITIND", "dmart": "DMART",
    "tata steel": "TATASTEEL", "tata power": "TATAPOWER", "tcs": "TCS", "ongc": "ONGC", "ntpc": "NTPC", "bpcl": "BPCL", "hpcl": "HINDPETRO",
    "ioc": "IOC", "lic": "LICI", "sbi life": "SBILIFE", "hdfc life": "HDFCLIFE", "eicher": "EICHERMOT", "hero": "HEROMOTOCO", "jsw steel": "JSWSTEEL" };
  const normQ = q => String(q || "").toLowerCase().replace(/\s+/g, " ").trim();
  const alias = (q, known) => { const a = ALIASES[normQ(q)]; return a && (!known || known(a)) ? a : null; };
  function suggest(q, stocks, n = 5) {
    const t = normQ(q); if (t.length < 2) return [];
    const al = alias(t), out = [], seen = new Set();
    const add = s => { if (s && !seen.has(s.symbol)) { seen.add(s.symbol); out.push(s); } };
    if (al) add(stocks.find(s => s.symbol === al));
    const sy = s => s.symbol.toLowerCase(), nm = s => String(s.name || "").toLowerCase();
    stocks.filter(s => sy(s) === t).forEach(add);
    stocks.filter(s => sy(s).startsWith(t)).sort((a, b) => a.symbol.length - b.symbol.length).forEach(add);
    stocks.filter(s => nm(s).split(/[\s.&()-]+/).some(w => w.startsWith(t)) || nm(s).startsWith(t)).forEach(add);
    stocks.filter(s => nm(s).includes(t)).forEach(add);
    return out.slice(0, n);
  }
  function dist(a, b) {                                   // Damerau–Levenshtein (adjacent swaps cost 1: "relaince" → "reliance")
    const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  function didYouMean(q, stocks, n = 3) {
    const t = normQ(q); if (t.length < 3) return [];
    const tol = Math.max(1, Math.floor(t.length / 4));
    const scored = stocks.map(s => {
      const words = String(s.name || "").toLowerCase().split(/[\s.&()-]+/).filter(w => w.length > 2);
      const cand = [s.symbol.toLowerCase(), String(s.name || "").toLowerCase(), ...words,
                    ...Object.entries(ALIASES).filter(([, v]) => v === s.symbol).map(([k]) => k)];
      return { s, d: Math.min(...cand.map(c => dist(t, c.slice(0, Math.max(t.length, Math.min(c.length, t.length + 2)))))) };
    }).filter(x => x.d <= tol).sort((a, b) => a.d - b.d || a.s.symbol.length - b.s.symbol.length);
    return scored.slice(0, n).map(x => x.s);
  }
  // ---- review #58 B: your own price alerts – end-of-day only (checked against each night's close; no phone notifications)
  function alertHits(alerts, watch, priceOf, day) {
    const out = [];
    (alerts || []).forEach(a => {
      const q = priceOf(a.sym); if (!q || q.close == null) return;
      const w = (watch || []).find(x => x.sym === a.sym);
      let hit = false, text = "";
      if (a.kind === "above" && q.close >= a.v) { hit = true; text = `${a.sym} closed above your ₹${a.v} alert`; }
      if (a.kind === "below" && q.close <= a.v) { hit = true; text = `${a.sym} closed below your ₹${a.v} alert`; }
      if (a.kind === "pct" && w && w.px) { const pc = (q.close / w.px - 1) * 100;
        if (Math.abs(pc) >= a.v) { hit = true; text = `${a.sym} has moved ${pc >= 0 ? "+" : ""}${r2(pc)}% since you saved it (your ±${a.v}% alert)`; } }
      if (hit) out.push({ id: a.id, sym: a.sym, text, seen: a.seen === day });
    });
    return out;
  }
  // ---- 🚦 exit check (review #31): the frozen Rules v1.0 model-portfolio exits, applied to a real holding. Nothing new, nothing tuned.
  // next rebalance = first weekday of the next Jan / Apr / Jul / Oct on or after `day` (NSE holidays not known here: "about")
  function nextRebalance(day, months = [1, 4, 7, 10]) {
    let y = +day.slice(0, 4), m = +day.slice(5, 7);
    for (let k = 0; k < 15; k++, m++) {
      if (m > 12) { m = 1; y++; }
      if (!months.includes(m)) continue;
      const d = new Date(Date.UTC(y, m - 1, 1));
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1);
      const s = d.toISOString().slice(0, 10);
      if (s >= day) return s;
    }
    return null;
  }
  // x = { tracked, hard, doc, eligible, rank, of, whyNot, ageDays, keepPct, taxPct, taxDays, trim, rebalance, rebalanceTxt, day, ltDays }
  function exitCheck(x) {
    const out = { level: "none", lines: [], tax: null };
    if (x.ltDays > 0) out.tax = `LTCG in ${x.ltDays} day${x.ltDays === 1 ? "" : "s"} – selling before that is taxed as short-term.`;
    if (!x.tracked) { out.lines.push({ c: "none", text: "No exit check – this stock is not in tonight's data." }); return out; }
    if (x.wideOnly) {                          // review #36: outside the Nifty 500 – no Core-score rules
      if (x.hard || x.doc) out.lines.push({ c: "red", text: `Red flag – the screener would not hold it: ${x.hard ? "hard red flag – " + x.hard : "Company Reader hard document flag – " + x.doc}.` });
      if (x.trim) out.lines.push({ c: "yellow", text: "Price far above fair value (🟠 Trim) – experimental – not in the Core score; consider taking some profit. Not an exit by itself." });
      if (x.lowLiq) out.lines.push({ c: "yellow", text: `Low liquidity: about ₹${x.tv} crore traded a day – a sale can move the price.` });
      out.note = "Outside the Nifty 500: the Core-score exit rules (keep zone, rebalance) apply only to Nifty 500 holdings – shown here: verdict, red flags and liquidity.";
      if (!out.lines.length) out.lines.push({ c: "none", text: "No red flag and no Trim signal tonight." });
      const ord = { red: 0, orange: 1, yellow: 2, green: 3, none: 4 };
      out.lines.sort((a, b) => ord[a.c] - ord[b.c]);
      out.level = out.lines[0].c;
      return out;
    }
    const keep = Math.ceil(x.of * x.keepPct / 100), taxKeep = Math.ceil(x.of * x.taxPct / 100), young = x.ageDays < x.taxDays;
    const until = x.rebalance ? days(x.day, x.rebalance) : null;
    const when = x.rebalance ? `${x.rebalanceTxt || x.rebalance}${until ? `, in ${until} day${until === 1 ? "" : "s"}` : ", today"}` : "the next rebalance";
    if (x.hard || x.doc) out.lines.push({ c: "red", text: `Rules v1.0 would sell this at the next close: ${x.hard ? "hard red flag – " + x.hard : "Company Reader hard document flag – " + x.doc}.` });
    let inZone = false;
    if (!x.eligible || x.rank == null)
      out.lines.push({ c: "orange", text: `Review at the next rebalance (${when}): no longer in the eligible universe${x.whyNot ? " – " + x.whyNot : ""}. Before that date it is only a heads-up.` });
    else if (x.rank <= keep) inZone = true;
    else if (young && x.rank <= taxKeep) { inZone = true; out.taxWait = true; }
    else out.lines.push({ c: "orange", text: `Review at the next rebalance (${when}): rank ${x.rank} of ${x.of}, keep zone = top ${young ? taxKeep + " (top " + x.taxPct + "% while held under " + Math.round(x.taxDays / 30.4) + " months)" : keep}. Before that date it is only a heads-up.` });
    if (x.trim) out.lines.push({ c: "yellow", text: "Price far above fair value (🟠 Trim, more than 30% above the consensus fair value) – experimental – not in the Core score; consider taking some profit. Not an exit by itself." });
    if (!out.lines.length) out.lines.push({ c: "green", text: out.taxWait
      ? `Keep – inside the tax-wait zone (rank ${x.rank} of ${x.of}: outside the top ${x.keepPct}% = ${keep}, but inside the top ${x.taxPct}% = ${taxKeep} while held under ${Math.round(x.taxDays / 30.4)} months; held ${x.ageDays} days).`
      : `Keep – still inside the keep zone (rank ${x.rank} of ${x.of}, keep zone = top ${keep}).` });
    const order = { red: 0, orange: 1, yellow: 2, green: 3, none: 4 };
    out.lines.sort((a, b) => order[a.c] - order[b.c]);
    out.level = out.lines[0].c;
    return out;
  }
  // ---- review #32: is the page stale? (pure; nowMs = Date.now()). An update is "missed" for every weekday after the page's
  // trade date up to yesterday, and for today once it is past 23:30 IST (the last nightly try is 23:17). Holidays unknown here.
  // review #39: hol = {ISO date: name} of NSE trading holidays (history/nse_holidays.json) – a holiday is never "missed"
  function staleCheck(tradeDate, nowMs, hol) {
    const ist = new Date(nowMs + 5.5 * 3600e3), today = ist.toISOString().slice(0, 10), hm = ist.toISOString().slice(11, 16);
    let missed = 0;
    for (let d = iso(dn(tradeDate) + 1); d <= today; d = iso(dn(d) + 1)) {
      const wd = new Date(d + "T00:00:00Z").getUTCDay();
      if (wd === 0 || wd === 6 || (hol && hol[d])) continue;
      if (d < today || hm >= "23:30") missed++;
    }
    return { stale: missed >= 1, missed, today };
  }
  // review #39: "Market closed today (<name>) – prices are from <date>" when today (IST) is an NSE holiday
  function marketClosed(tradeDate, nowMs, hol) {
    const today = new Date(nowMs + 5.5 * 3600e3).toISOString().slice(0, 10);
    return hol && hol[today] && today > tradeDate ? { name: hol[today], today } : null;
  }
  const exitCounts = checks => checks.reduce((c, e) => (c[e.level] = (c[e.level] || 0) + 1, c), { red: 0, orange: 0, yellow: 0, green: 0, none: 0 });
  // ---- review #47: surviving a fall – drawdown meter, fall alert, buying-more guard-rails (warnings only, never a sell signal)
  const DD_STAGES = [[10, "normal", "Normal"], [20, "correction", "Correction"], [30, "bear", "Bear market"], [Infinity, "severe", "Severe fall"]];
  function drawdown(points) {                    // points [{d, v}] in date order → how far below its own peak it is now
    const p = (points || []).filter(x => x && x.v > 0);
    if (!p.length) return null;
    let peak = p[0];
    for (const x of p) if (x.v >= peak.v) peak = x;
    const now = p[p.length - 1], dd = r2((1 - now.v / peak.v) * 100);      // rounded first, so 20.00% is a bear market
    const st = DD_STAGES.find(([lim]) => dd < lim);
    return { peak: peak.v, peakDate: peak.d, now: now.v, dd: r2(dd), stage: st[1], stageName: st[2] };
  }
  function fallAlert(pos, close, fromHigh52) {   // pos = position(): avg price, first buy date
    if (!pos || !(pos.qty > 0) || !close) return null;
    const fromBuy = (close / pos.avg - 1) * 100;
    if (fromBuy <= -20) return { fell: r2(-fromBuy), why: "below your average buy price" };
    if (fromHigh52 != null && fromHigh52 <= -25) return { fell: r2(-fromHigh52), why: "below its highest close of the last year" };
    return null;
  }
  // a planned buy: one stock never above 10% of the portfolio, at most 2× the money first put into it
  function buyGuard(txs, sym, addValue, portValue, priceOf) {
    const mine = txs.filter(t => t.sym === sym), p = position(mine), q = priceOf(sym);
    const nowVal = p.qty * (q && q.close ? q.close : p.avg), first = mine.filter(t => t.side === "buy").sort((a, b) => a.date < b.date ? -1 : 1)[0];
    const firstAmt = first ? first.qty * first.px : null, invested = mine.filter(t => t.side === "buy").reduce((a, t) => a + t.qty * t.px, 0);
    const out = [];
    const share = (nowVal + addValue) / ((portValue || 0) + addValue) * 100;
    if (portValue > 0 && share > 10) out.push(`after this buy ${sym} would be ${FMT.pctPlain(share, 1)} of your portfolio (guard-rail: at most 10%)`);
    if (firstAmt && invested + addValue > 2 * firstAmt) out.push(`you would have put in ${FMT.money(invested + addValue, 0)} – more than 2× your first buy of ${FMT.money(firstAmt, 0)}`);
    return out;
  }
  // ---- review #50: discipline pack – pure functions (tested in tests/userlib_test.js)
  // Delivery-trade costs for one order (rates as published, check before relying on them: STT 0.1% each side and stamp duty
  // 0.015% on buys – CBDT / Indian Stamp Act; NSE transaction charge 0.00297%; SEBI fee ₹10 a crore; GST 18% on brokerage +
  // exchange + SEBI fees; DP charge ₹15.34 + GST per scrip on a sell day – Zerodha's published charges page; brokerage ₹0 for delivery)
  const COSTS = { stt: 0.1, stamp: 0.015, nse: 0.00297, sebi: 10 / 1e7 * 100, gst: 18, dp: 15.34, brokerage: 0,
                  src: "STT and stamp duty: CBDT / Indian Stamp Act rates; NSE transaction charge, SEBI fee and DP charge: a discount broker's published charges page (zerodha.com/charges) – check the current rates" };
  function tradeCost(side, value) {
    const v = Math.max(0, +value || 0), pc = x => v * x / 100;
    const stt = pc(COSTS.stt), stamp = side === "buy" ? pc(COSTS.stamp) : 0, exch = pc(COSTS.nse), sebi = pc(COSTS.sebi);
    const dp = side === "sell" ? COSTS.dp : 0, gst = (COSTS.brokerage + exch + sebi + dp) * COSTS.gst / 100;
    const total = stt + stamp + exch + sebi + dp + gst;
    return { stt: r2(stt), stamp: r2(stamp), exch: r2(exch), sebi: r2(sebi), dp: r2(dp), gst: r2(gst), total: r2(total), pct: v ? r2(total / v * 100) : 0 };
  }
  // LTCG harvesting: long-term gains (held > ltMonths) you could book this financial year, vs the yearly exemption
  function harvest(txs, priceOf, today, exempt, ltMonths = 12) {          // exempt: S.tax.ltcg_exempt (pipeline/tax_rates.py) – never typed here
    const syms = [...new Set(txs.map(t => t.sym))], out = { lt: 0, rows: [], stLoss: [] };
    const ltDays = Math.round(ltMonths * 365 / 12);
    for (const sym of syms) {
      const p = position(txs.filter(t => t.sym === sym)), q = priceOf(sym);
      if (!q || !q.close || !(p.qty > 0)) continue;
      let lt = 0, st = 0;
      for (const l of p.lots) { const g = l.qty * (q.close - l.px); if (days(l.date, today) > ltDays) lt += g; else st += g; }
      if (lt > 0) out.rows.push({ sym, gain: r2(lt) });
      if (st < 0) out.stLoss.push({ sym, loss: r2(st) });
      out.lt += Math.max(0, lt);
    }
    out.lt = r2(out.lt); out.free = r2(Math.min(out.lt, exempt)); out.exempt = exempt;
    out.rows.sort((a, b) => b.gain - a.gain); out.stLoss.sort((a, b) => a.loss - b.loss);
    return out;
  }
  // My Policy check: one line per breach (never blocks)
  const POLICY_DEFAULT = { split: 40, maxStock: 10, maxSector: 30, needWithin3y: true, ramp: "paper → 10% of the planned money → scale only if the rules keep holding", planned: null };
  function policyCheck(pol, rows, groupOf) {
    const P = Object.assign({}, POLICY_DEFAULT, pol || {}), tot = rows.reduce((a, r) => a + (r.value || 0), 0), out = [];
    if (!tot) return out;
    rows.forEach(r => { const w = r.value / tot * 100; if (w > P.maxStock) out.push(`${r.sym} is ${FMT.pctPlain(w, 1)} of your stocks (your limit ${P.maxStock}%)`); });
    const sec = {}; rows.forEach(r => { const g = groupOf(r.sym) || "other"; sec[g] = (sec[g] || 0) + r.value / tot * 100; });
    Object.entries(sec).forEach(([g, w]) => { if (w > P.maxSector) out.push(`${g} is ${FMT.pctPlain(w, 1)} (your limit ${P.maxSector}% per sector)`); });
    if (P.planned) { const n = 20, each = P.planned * P.split / 100 / n; if (each < 15000) out.push(`20 stocks from your planned ${FMT.money(P.planned * P.split / 100, 0)} would be about ${FMT.money(each, 0)} each – costs eat small positions; consider fewer names or more in the index fund`); }
    return out;
  }
  // "Since you last visited": what changed between two snapshots {d, ghost, port, zones: {sym: kind}, exits: {sym: level}}
  function sinceDiff(prev, now) {
    if (!prev || !prev.d || prev.d === now.d) return null;
    const ch = (a, b) => a && b ? (b / a - 1) * 100 : null;
    const zin = Object.keys(now.zones || {}).filter(k => now.zones[k] === "in" && (prev.zones || {})[k] !== "in");
    const zout = Object.keys(prev.zones || {}).filter(k => prev.zones[k] === "in" && (now.zones || {})[k] !== "in");
    const ex = Object.keys(now.exits || {}).filter(k => ["red", "orange"].includes(now.exits[k]) && (prev.exits || {})[k] !== now.exits[k]);
    const r = { days: days(prev.d, now.d), ghost: ch(prev.ghost, now.ghost), port: ch(prev.port, now.port), zin, zout, exits: ex };
    r.quiet = !zin.length && !zout.length && !ex.length;
    return r;
  }
  // review #52: the reader-review progress (same maths as pipeline/reader_review.gate). answers = {sym: {claimId: {a, note}}}
  function rrProgress(queue, answers, gateStocks = 20, gatePct = 90) {
    let reviewed = 0, good = 0, bad = 0;
    (queue || []).forEach(q => {
      const a = (answers || {})[q.s] || {}, got = q.claims.filter(c => a[c.id] && a[c.id].a).map(c => a[c.id].a);
      if (q.claims.length && got.length === q.claims.length) reviewed++;
      good += got.filter(x => x === "ok").length; bad += got.filter(x => x === "bad").length;
    });
    const pct = good + bad ? Math.round(1000 * good / (good + bad)) / 10 : null;
    return { reviewed, of: (queue || []).length, pct, judged: good + bad, pass: reviewed >= gateStocks && pct != null && pct >= gatePct };
  }
  // review #50: mutual-fund X-ray – your stocks + each fund's amount × its disclosed holdings (weights in %), combined
  function xray(funds, holdings, stockValues) {
    const tot = {}, add = (sym, v) => { tot[sym] = (tot[sym] || 0) + v; };
    Object.entries(stockValues || {}).forEach(([sym, v]) => add(sym, v));
    let missing = 0;
    (funds || []).forEach(f => { const h = (holdings || {})[f.code]; if (!h) { missing += f.amount || 0; return; }
      h.forEach(x => add(x.s, (f.amount || 0) * x.w / 100)); });
    const all = Object.values(tot).reduce((a, b) => a + b, 0) || 1;
    const rows = Object.entries(tot).map(([s, v]) => ({ s, v: r2(v), pct: r2(v / all * 100) })).sort((a, b) => b.v - a.v);
    return { rows, total: r2(all), missing: r2(missing) };
  }
  // review #64: the backup reminder – every 30 days on Home and in Alerts; the first one 7 days after the first saved item; "Remind me
  // later" = 7 days, "Done" = not again today; never with nothing saved. meta: firstSaved, lastBackup, backupSnooze (date it may show again)
  const BACKUP_EVERY = 30, BACKUP_FIRST = 7, BACKUP_SNOOZE = 7;
  function backupDue(u, today) {
    const has = (u.watch || []).length || (u.tx || []).length, m = u.meta || {};
    if (!has) return { due: false, why: "nothing saved" };
    if (m.backupSnooze && days(today, m.backupSnooze) > 0) return { due: false, why: "snoozed until " + m.backupSnooze };
    if (m.lastBackup) { const d = days(m.lastBackup, today); return { due: d >= BACKUP_EVERY, days: d, why: d >= BACKUP_EVERY ? "last backup " + d + " days ago" : "backed up " + d + " days ago" }; }
    const first = m.firstSaved || today, d = days(first, today);
    return { due: d >= BACKUP_FIRST, days: null, since: d, why: d >= BACKUP_FIRST ? "never backed up" : "first reminder after " + BACKUP_FIRST + " days" };
  }
  const backupSnooze = (today, n) => iso(dn(today) + n);

  // ---------- review #67 B: Zerodha Console files (holdings CSV / XLSX, tradebook CSV, Tax P&L) – read in the browser only ----------
  const num_ = v => { const x = parseFloat(String(v == null ? "" : v).replace(/[,₹\s]/g, "")); return isFinite(x) ? x : null; };
  const dateIso = v => { const t = String(v == null ? "" : v).trim(); let m = t.match(/^(\d{4})-(\d\d)-(\d\d)/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = t.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/); if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    if (/^\d{5}(\.\d+)?$/.test(t)) return iso(Math.floor(+t) - 25569);           // an Excel serial date
    return null; };
  const cleanSym = v => String(v || "").trim().toUpperCase().replace(/-(EQ|BE|BZ)$/, "");
  function findHeader(rows, need) {        // Console files start with a few lines of account details before the real header
    for (let i = 0; i < Math.min(rows.length, 40); i++) { const h = rows[i].map(x => String(x == null ? "" : x).trim().toLowerCase()); if (need.every(k => h.some(x => k.includes(x) && x))) return { i, h }; }
    return null;
  }
  // Tax P&L cross-check: the realised short-term and long-term totals Zerodha printed, beside ours for the same financial year
  function taxPnlTotals(rows) {
    const out = {};
    rows.forEach(r => { const cells = r.map(x => String(x == null ? "" : x).trim());
      cells.forEach((c, j) => { const lc = c.toLowerCase(); const k = /short[\s-]*term/.test(lc) ? "st" : /long[\s-]*term/.test(lc) ? "lt" : null;
        if (!k || out[k] != null || /loss.*brought|carried|intraday|speculat/.test(lc)) return;
        const v = cells.slice(j + 1).map(num_).find(x => x != null); if (v != null) out[k] = v; }); });
    return out.st != null || out.lt != null ? out : null;
  }
  function consoleImport(rows, known, today) {
    rows = (rows || []).filter(r => r && r.some(x => String(x == null ? "" : x).trim()));
    if (!rows.length) return { err: "The file is empty.", rows: [], skipped: [] };
    const skipped = [];
    // 1. tradebook: one line per trade with its date and buy / sell – the real dates for LTCG / STCG and XIRR
    const tb = findHeader(rows, [["trade_date", "trade date"], ["trade_type", "trade type", "type"], ["quantity", "qty"], ["price"], ["symbol", "tradingsymbol"]]);
    if (tb) {
      const c = k => tb.h.findIndex(x => k.includes(x)), ci = { sym: c(["symbol", "tradingsymbol"]), d: c(["trade_date", "trade date"]), t: c(["trade_type", "trade type", "type"]),
        q: c(["quantity", "qty"]), p: c(["price"]), seg: c(["segment"]) };
      const agg = {};
      rows.slice(tb.i + 1).forEach((r, k) => { const line = tb.i + k + 2, sym = cleanSym(r[ci.sym]), d = dateIso(r[ci.d]), side = String(r[ci.t] || "").trim().toLowerCase(), q = num_(r[ci.q]), px = num_(r[ci.p]);
        if (ci.seg >= 0 && r[ci.seg] && !/^eq/i.test(String(r[ci.seg]).trim())) { skipped.push({ line, why: "not an equity trade (" + String(r[ci.seg]).trim() + ")" }); return; }
        if (!sym || !d || !["buy", "sell"].includes(side) || !(q > 0) || !(px > 0)) { skipped.push({ line, why: "missing symbol, date, buy/sell, quantity or price" }); return; }
        if (d > today) { skipped.push({ line, why: "date in the future" }); return; }
        const key = [sym, d, side].join("|"), a = agg[key] || (agg[key] = { sym, date: d, side, qty: 0, val: 0 }); a.qty += q; a.val += q * px; });
      let out = Object.values(agg).map(a => ({ sym: a.sym, date: a.date, side: a.side, qty: Math.round(a.qty), px: r2(a.val / a.qty), tracked: !!known(a.sym) }))
        .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.side === "buy" ? -1 : 1);
      const bad = new Set();                  // a sell of more than the file bought before it = older trades missing → that stock is skipped whole
      [...new Set(out.map(x => x.sym))].forEach(sym => { let h = 0; out.filter(x => x.sym === sym).forEach(x => { h += x.side === "buy" ? x.qty : -x.qty; if (h < 0) bad.add(sym); }); });
      bad.forEach(sym => skipped.push({ line: null, sym, why: sym + ": sells more than this file bought before them – older trades are missing (export a longer date range)" }));
      out = out.filter(x => !bad.has(x.sym));
      return { kind: "tradebook", rows: out, skipped };
    }
    // 2. holdings (Console holdings or Kite holdings): symbol, quantity, average price – dated today unless a date column exists
    const hd = findHeader(rows, [COLS.sym, COLS.qty, COLS.px]);
    if (hd) {
      const c = k => hd.h.findIndex(x => COLS[k].includes(x)), ci = { sym: c("sym"), qty: c("qty"), px: c("px"), date: c("date") };
      const out = [];
      rows.slice(hd.i + 1).forEach((r, k) => { const line = hd.i + k + 2, sym = cleanSym(r[ci.sym]), qty = num_(r[ci.qty]), px = num_(r[ci.px]);
        let date = ci.date >= 0 ? dateIso(r[ci.date]) : null; if (!date || date > today) date = today;
        if (!sym || /^total/i.test(sym)) return;
        if (!(qty >= 1) || !Number.isInteger(qty) || !(px > 0)) { skipped.push({ line, why: (sym || "?") + ": missing whole quantity or price" }); return; }
        out.push({ sym, qty, px: r2(px), date, side: "buy", tracked: !!known(sym) }); });
      return { kind: "holdings", rows: out, skipped };
    }
    // 3. Tax P&L – a cross-check only (nothing is added)
    const tp = taxPnlTotals(rows);
    if (tp) return { kind: "taxpnl", totals: tp, rows: [], skipped };
    return { err: "This doesn't look like a Zerodha holdings file, tradebook or Tax P&L (need columns such as Symbol, Quantity, Average price – or trade_date, trade_type, quantity, price).", rows: [], skipped };
  }
  // the XLSX reader: an .xlsx is a zip of XML files; DecompressionStream("deflate-raw") unpacks it (no library, nothing uploaded)
  async function readXlsx(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf instanceof ArrayBuffer ? buf : u8.buffer), td = new TextDecoder();
    let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error("not an .xlsx file");
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const files = {};
    for (let i = 0; i < n; i++) {
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const name = td.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      if (!/^xl\/(sharedStrings|workbook|worksheets\/sheet\d+)\.xml$|^xl\/_rels\/workbook\.xml\.rels$/.test(name)) continue;
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = u8.subarray(start, start + csize);
      files[name] = method === 0 ? td.decode(raw) : await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
    }
    const unx = t => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    const ss = [...(files["xl/sharedStrings.xml"] || "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => unx([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")));
    const attr = (tag, k) => (tag.match(new RegExp("\\s" + k + '="([^"]*)"')) || [])[1];          // attributes come in any order
    const rels = Object.fromEntries([...(files["xl/_rels/workbook.xml.rels"] || "").matchAll(/<Relationship\b[^>]*>/g)].map(m => [attr(m[0], "Id"), "xl/" + String(attr(m[0], "Target") || "").replace(/^\/?xl\//, "")]));
    let sheets = [...(files["xl/workbook.xml"] || "").matchAll(/<sheet\b[^>]*>/g)].map(m => [unx(attr(m[0], "name") || ""), rels[attr(m[0], "r:id")]]).filter(x => files[x[1]]);
    if (!sheets.length) sheets = Object.keys(files).filter(k => /worksheets/.test(k)).sort().map(k => [k, k]);
    const col = r => { let c = 0; for (const ch of r.replace(/\d+/g, "")) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
    return sheets.map(([nm, f]) => [nm, [...files[f].matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map(rm => { const row = [];
      for (const c of rm[1].matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) { const at = c[1], body = c[2] || "", ref = (at.match(/r="([A-Z]+)\d+"/) || [])[1], t = (at.match(/t="(\w+)"/) || [])[1];
        const v = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; let val = t === "s" ? ss[+v] : t === "inlineStr" ? unx([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x => x[1]).join("")) : v != null ? unx(v) : "";
        row[ref ? col(ref) : row.length] = val; }
      return Array.from(row, x => x == null ? "" : x); })]);
  }
  // ---------- review #67 B: portfolio insights (pure maths; the page draws them) ----------
  // 5. the tax-free LTCG meter: long-term gains already booked this financial year (losses set off) vs the yearly limit
  function ltcgMeter(sold, today, exempt) {
    const fy = fyOf(today), used = Math.max(0, r2((sold || []).filter(x => fyOf(x.date) === fy).reduce((a, x) => a + (x.ltG || 0), 0)));
    const fyEnd = (+fy.slice(0, 4) + 1) + "-03-31";
    return { fy, used, left: r2(Math.max(0, exempt - used)), exempt, pct: exempt ? Math.min(100, used / exempt * 100) : 0, daysLeft: days(today, fyEnd) };
  }
  // 6. dividends: each NSE dividend × the shares you held when it went ex (bought before the ex-date = on the register on the record date, T+1)
  function divIncome(txs, dvOf, today) {
    const bySym = {}; txs.forEach(t => (bySym[t.sym] = bySym[t.sym] || []).push(t));
    const months = {}, rows = []; let next = null;
    Object.entries(bySym).forEach(([sym, list]) => {
      (dvOf(sym) || []).forEach(([ex, rec, amt]) => {
        const sh = list.filter(t => t.date < ex).reduce((a, t) => a + (t.side === "sell" ? -t.qty : t.qty), 0);
        if (ex > today) { const now = list.reduce((a, t) => a + (t.side === "sell" ? -t.qty : t.qty), 0);
          if (now > 0 && (!next || (rec || ex) < next.rec)) next = { sym, ex, rec: rec || ex, amt, shares: now, total: r2(now * amt) }; return; }
        if (sh <= 0 || days(ex, today) > 365) return;
        const m = ex.slice(0, 7); months[m] = r2((months[m] || 0) + sh * amt); rows.push({ sym, ex, rec, amt, shares: sh, total: r2(sh * amt) }); });
    });
    const out = []; for (let k = 11; k >= 0; k--) { const d = new Date(today.slice(0, 7) + "-01T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() - k); const m = d.toISOString().slice(0, 7); out.push({ m, amt: months[m] || 0 }); }
    return { months: out, total: r2(out.reduce((a, x) => a + x.amt, 0)), rows: rows.sort((a, b) => a.ex < b.ex ? 1 : -1), next };
  }
  // 4. size class from NSE's own index lists (Nifty 100 = large, Midcap 150 = mid, Smallcap 250 = small); if a list is missing,
  // the market-cap rank in our data (1–100 large, 101–250 mid, the rest small)
  const sizeOf = (ix, rank) => (ix || []).includes("n100") || (ix || []).includes("n50") ? "Large" : (ix || []).includes("mid150") ? "Mid" : (ix || []).includes("small250") ? "Small"
    : rank == null ? null : rank <= 100 ? "Large" : rank <= 250 ? "Mid" : "Small";
  // 7. your portfolio as an index (each day's % change with your own buys / sells taken out) beside a benchmark, both rebased to 100
  function rebased(series, benchAt, from) {
    const s = series.filter(x => x.d >= from && benchAt(x.d) != null); if (s.length < 2) return [];
    let idx = 100; const b0 = benchAt(s[0].d);
    return s.map((x, i) => { if (i) idx *= 1 + (x.dayPct || 0) / 100; return { d: x.d, me: idx, bench: benchAt(x.d) / b0 * 100 }; });
  }
  // 1. treemap layout (squarified): items [{v}] → the same items with x, y, w, h in % of the box
  function treemap(items, W = 100, H = 100) {
    const it = items.filter(x => x.v > 0).sort((a, b) => b.v - a.v), tot = it.reduce((a, x) => a + x.v, 0), out = [];
    if (!tot) return out;
    let x = 0, y = 0, w = W, h = H, rest = it.map(i => Object.assign({}, i, { a: i.v / tot * W * H }));
    const worst = (row, side) => { const s = row.reduce((a, r) => a + r.a, 0), mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a)); return Math.max(side * side * mx / (s * s), s * s / (side * side * mn)); };
    while (rest.length) {
      const side = Math.min(w, h); let row = [rest[0]], k = 1;
      while (k < rest.length && worst(row.concat(rest[k]), side) <= worst(row, side)) row.push(rest[k++]);
      const s = row.reduce((a, r) => a + r.a, 0);
      if (w >= h) { const cw = s / h; let yy = y; row.forEach(r => { const rh = r.a / cw; out.push(Object.assign(r, { x, y: yy, w: cw, h: rh })); yy += rh; }); x += cw; w -= cw; }
      else { const ch = s / w; let xx = x; row.forEach(r => { const rw = r.a / ch; out.push(Object.assign(r, { x: xx, y, w: rw, h: ch })); xx += rw; }); y += ch; h -= ch; }
      rest = rest.slice(k);
    }
    return out;
  }
  return { BACKUP_EVERY, BACKUP_FIRST, BACKUP_SNOOZE, backupDue, backupSnooze, ALIASES, alias, suggest, didYouMean, dist, alertHits, MAX_BUCKETS, BUCKET_NAME, NOTE_MAX, BY_MAX, SHARE_MAX, bucketAdd, bucketRename, bucketMove, bucketDelete, bucketSet, bucketsOf, bySource, shareLink, parseImport,
    rrProgress, xray, tradeCost, COSTS, harvest, POLICY_DEFAULT, policyCheck, sinceDiff, drawdown, fallAlert, buyGuard, DD_STAGES, KEY, VERSION, empty, upgrade, load, save, position, validateTx, portfolio, xirr, flowsOf, benchCompare, levelLookup,
           ltDate, daysToLT, taxSplit, buyZone, skipped, parseCSV, zerodhaImport, backup, restore, days, uid,
           nextRebalance, exitCheck, exitCounts, staleCheck, marketClosed, fyOf, taxEstimate,
           consoleImport, readXlsx, taxPnlTotals, ltcgMeter, divIncome, sizeOf, rebased, treemap,
           LEITNER, HEARTS, REFILL_REVIEWS, STREAK_CARDS, learnEmpty, cleanLearn, istDay, leitner, cardsDue, cardsToday, NEW_PER_DAY, MAX_SCREENS, cleanScreens, screenSave, learnDay, learnActive, streakNow, learnAnswer, learnReview, learnLesson, quickPlace, certOK, levelOpen };
})();
/*__USERLIB_END__*/
/*__SIGNALS_START__*/
// ---- review #48: the green / yellow / red dot after a number – the same rules as pipeline/signal_rules.py (tests/signals_test.js
// checks both give the same level). Display only: no score, rule or ghost uses these.
const SIGNALS = (() => {
  function level(R, metric, value, pct, group) {
    const r = (R.rules || {})[metric];
    if (value == null || !r || (R.neutral || []).includes(metric) || (r.skip_groups || []).includes(group)) return "neutral";
    if (r.band) return value >= r.band[0] ? "good" : value >= r.band[1] ? "ok" : "weak";
    if (r.stretch) return value > r.stretch[0] ? "stretched" : value < r.stretch[1] ? "oversold" : "neutral";
    if (r.red_above != null && value > r.red_above) return "weak";
    if (r.green_at_or_below != null && value <= r.green_at_or_below) return "good";
    if (r.red_below != null && value < r.red_below) return "weak";
    if (r.green_from != null && value >= r.green_from) return "good";
    if (pct == null) return r.green_from != null || r.red_above != null ? "ok" : "neutral";
    let lv = pct >= R.peer_good ? "good" : pct < R.peer_weak ? "weak" : "ok";
    if (lv === "good" && ((r.never_green_below != null && value < r.never_green_below) || (r.never_green_above != null && value > r.never_green_above))) lv = "ok";
    if (lv === "weak" && r.never_red_from != null && value >= r.never_red_from) lv = "ok";
    return lv;
  }
  // share of peers (same sector group) this value beats, direction-aware; ties count half
  function pctRank(values, v, higher) {
    if (values.length < 5) return null;
    let below = 0, eq = 0;
    for (const x of values) { if (higher ? x < v : x > v) below++; else if (x === v) eq++; }
    return Math.round((below + 0.5 * Math.max(eq - 1, 0)) / (values.length - 1) * 100);
  }
  const quantile = (xs, q) => { const a = [...xs].sort((p, r) => p - r); const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
  const sizeLabel = (rank, S_) => !rank ? null : rank <= S_.large ? "Large cap" : rank <= S_.mid ? "Mid cap" : "Small cap";
  const WORD = { good: "Good", ok: "OK", weak: "Weak", stretched: "Stretched", oversold: "Oversold", neutral: "" };
  return { level, pctRank, quantile, sizeLabel, WORD };
})();
/*__SIGNALS_END__*/
/*__CHARTLIB_START__*/
// ---- review #42: chart maths – pure functions, no page or library code. Visual / analysis only: nothing here feeds the
// Core score, the rules or the ghost portfolios. tests/chartlib_test.js + tests/test_chartlib.py check every function
// against an independent pandas reference on real prices.
const CL = (() => {
  const DAY = 86400000;
  const iso = ms => new Date(ms).toISOString().slice(0, 10);
  const ms = t => Date.parse(t + "T00:00:00Z");
  const CFG = { gapMinPct: 1.0, maxPanesPhone: 2, ranges: ["1M", "3M", "6M", "YTD", "1Y", "3Y", "5Y", "Max"] };
  // the compact file → bars [{t: "YYYY-MM-DD", o, h, l, c, v}] (v = null for indices)
  function unpack(f) {
    const out = [];
    let d = ms(f.t0);
    for (let i = 0; i < f.d.length; i++) {
      if (i) d += f.d[i] * DAY;
      out.push({ t: iso(d), o: f.o[i], h: f.h[i], l: f.l[i], c: f.c[i], v: f.v ? f.v[i] : null });
    }
    return out;
  }
  // weekly bars start on the week's Monday (ISO weeks), monthly bars on the 1st; the bar is dated by its first trading day
  const weekKey = t => { const m = ms(t), wd = (new Date(m).getUTCDay() + 6) % 7; return iso(m - wd * DAY); };
  const monthKey = t => t.slice(0, 7);
  const quarterKey = t => t.slice(0, 4) + "Q" + Math.ceil(+t.slice(5, 7) / 3), yearKey = t => t.slice(0, 4);     // review #83 K
  function aggregate(bars, tf) {
    if (tf === "D") return bars.slice();
    const key = { W: weekKey, M: monthKey, Q: quarterKey, Y: yearKey }[tf] || monthKey, out = [];
    let cur = null, k = null;
    for (const b of bars) {
      const kk = key(b.t);
      if (kk !== k) { if (cur) out.push(cur); cur = { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }; k = kk; continue; }
      cur.h = Math.max(cur.h, b.h); cur.l = Math.min(cur.l, b.l); cur.c = b.c;
      cur.v = b.v == null || cur.v == null ? null : cur.v + b.v;
    }
    if (cur) out.push(cur);
    return out;
  }
  // ---- indicators: each returns an array as long as its input, null where there is not enough history
  function sma(x, n) {
    const out = new Array(x.length).fill(null);
    let s = 0;
    for (let i = 0; i < x.length; i++) { s += x[i]; if (i >= n) s -= x[i - n]; if (i >= n - 1) out[i] = s / n; }
    return out;
  }
  // EMA seeded with the simple average of the first n values (the usual charting convention), then α = 2 / (n + 1)
  function ema(x, n) {
    const out = new Array(x.length).fill(null), a = 2 / (n + 1);
    const first = x.findIndex(v => v != null);
    if (first < 0 || x.length - first < n) return out;
    let e = 0;
    for (let i = first; i < first + n; i++) e += x[i];
    e /= n; out[first + n - 1] = e;
    for (let i = first + n; i < x.length; i++) { e = a * x[i] + (1 - a) * e; out[i] = e; }
    return out;
  }
  // Bollinger bands: middle = SMA(n), bands = ± k × the population standard deviation of the same n closes
  function bollinger(x, n = 20, k = 2) {
    const mid = sma(x, n), up = new Array(x.length).fill(null), lo = new Array(x.length).fill(null);
    for (let i = n - 1; i < x.length; i++) {
      let v = 0;
      for (let j = i - n + 1; j <= i; j++) v += (x[j] - mid[i]) ** 2;
      const sd = Math.sqrt(v / n);
      up[i] = mid[i] + k * sd; lo[i] = mid[i] - k * sd;
    }
    return { mid, up, lo };
  }
  // RSI with Wilder's smoothing – the same method as pipeline/technicals.py (so the last value equals the page's RSI 14)
  function rsi(x, n = 14) {
    const out = new Array(x.length).fill(null);
    if (x.length <= n) return out;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) { const ch = x[i] - x[i - 1]; g += Math.max(ch, 0); l += Math.max(-ch, 0); }
    g /= n; l /= n;
    const val = () => l === 0 ? 100 : 100 - 100 / (1 + g / l);
    out[n] = val();
    for (let i = n + 1; i < x.length; i++) {
      const ch = x[i] - x[i - 1];
      g = (g * (n - 1) + Math.max(ch, 0)) / n; l = (l * (n - 1) + Math.max(-ch, 0)) / n;
      out[i] = val();
    }
    return out;
  }
  // MACD(12, 26, 9): line = EMA12 − EMA26, signal = EMA9 of the line, histogram = line − signal
  function macd(x, f = 12, s = 26, sig = 9) {
    const a = ema(x, f), b = ema(x, s);
    const line = x.map((_, i) => a[i] != null && b[i] != null ? a[i] - b[i] : null);
    const signal = ema(line, sig);
    return { line, signal, hist: line.map((v, i) => v != null && signal[i] != null ? v - signal[i] : null) };
  }
  function heikinAshi(bars) {
    const out = [];
    bars.forEach((b, i) => {
      const c = (b.o + b.h + b.l + b.c) / 4, o = i ? (out[i - 1].o + out[i - 1].c) / 2 : (b.o + b.c) / 2;
      out.push({ t: b.t, o, h: Math.max(b.h, o, c), l: Math.min(b.l, o, c), c, v: b.v });
    });
    return out;
  }
  // ---- gaps: today's whole range above yesterday's high (up) or below yesterday's low (down), at least minPct.
  // A gap is filled once a later bar trades back to the edge it left (yesterday's high for a gap up). Until then the
  // still-open part is shaded: it shrinks as prices move into it.
  function gaps(bars, minPct = CFG.gapMinPct) {
    const out = [];
    for (let i = 1; i < bars.length; i++) {
      const p = bars[i - 1], b = bars[i];
      let g = null;
      if (b.l > p.h && (b.l / p.h - 1) * 100 >= minPct) g = { dir: "up", edge: p.h, far: b.l };
      else if (b.h < p.l && (1 - b.h / p.l) * 100 >= minPct) g = { dir: "down", edge: p.l, far: b.h };
      if (!g) continue;
      g = Object.assign(g, { i, t: b.t, pct: (g.far / g.edge - 1) * 100, filled: null, open: g.far });
      for (let j = i + 1; j < bars.length; j++) {
        const q = bars[j];
        if (g.dir === "up") { if (q.l <= g.edge) { g.filled = q.t; break; } g.open = Math.min(g.open, q.l); }
        else { if (q.h >= g.edge) { g.filled = q.t; break; } g.open = Math.max(g.open, q.h); }
      }
      out.push(g);
    }
    return out;
  }
  // ---- measure between two points {t, p, i (bar index)}
  function measure(a, b) {
    return { change: b.p - a.p, pct: a.p ? (b.p / a.p - 1) * 100 : null, bars: Math.abs(b.i - a.i),
             days: Math.round(Math.abs(ms(b.t) - ms(a.t)) / DAY) };
  }
  // ---- anchored average from a tapped bar: volume-weighted typical price (h + l + c) / 3 since then (equal weights if no volume)
  function anchoredAvg(bars, i0) {
    const out = new Array(bars.length).fill(null);
    let pv = 0, vv = 0;
    for (let i = Math.max(0, i0); i < bars.length; i++) {
      const b = bars[i], w = b.v == null ? 1 : b.v, tp = (b.h + b.l + b.c) / 3;
      pv += tp * w; vv += w;
      out[i] = vv ? pv / vv : tp;
    }
    return out;
  }
  // 52-week high / low on the last bar (the last 365 calendar days, daily bars)
  function hiLo52(bars) {
    if (!bars.length) return null;
    const from = ms(bars[bars.length - 1].t) - 365 * DAY;
    let h = -Infinity, l = Infinity;
    for (let i = bars.length - 1; i >= 0 && ms(bars[i].t) > from; i--) { h = Math.max(h, bars[i].h); l = Math.min(l, bars[i].l); }
    return { h, l };
  }
  // the first date shown for a range button
  // review #83 K: which period a bar is, in the timeframe's own words. last = the latest daily date (the current bar is unfinished
  // while its period hasn't ended yet: "(so far, to 16 Nov)"). Intraday times (none today – end-of-day data) get an hour range.
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], WDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dm = t => `${+t.slice(8, 10)} ${MON[+t.slice(5, 7) - 1]}`, dmy = t => `${dm(t)} ${t.slice(0, 4)}`;
  function periodEnd(t, tf) {
    if (tf === "W") return iso(ms(weekKey(t)) + 4 * DAY);
    const y = +t.slice(0, 4), m = +t.slice(5, 7);
    if (tf === "M") return iso(Date.UTC(y, m, 0));
    if (tf === "Q") return iso(Date.UTC(y, Math.ceil(m / 3) * 3, 0));
    if (tf === "Y") return `${y}-12-31`;
    return t.slice(0, 10);
  }
  function periodLabel(t, tf, last, today) {
    if (/T\d\d:\d\d/.test(t)) { const h = +t.slice(11, 13), pad = x => String(x).padStart(2, "0"); return `${dmy(t)} · ${pad(h)}:${t.slice(14, 16)}–${pad(h + 1)}:${t.slice(14, 16)} IST`; }
    const y = t.slice(0, 4), m = +t.slice(5, 7);
    let out;
    if (tf === "W") { const a = weekKey(t), b = periodEnd(t, "W"); out = `Week of ${dmy(a)} (${a.slice(5, 7) === b.slice(5, 7) ? +a.slice(8, 10) : dm(a)}–${dm(b)})`; }
    else if (tf === "M") out = `${MON[m - 1]} ${y}`;
    else if (tf === "Q") { const q = Math.ceil(m / 3); out = `${MON[q * 3 - 3]}–${MON[q * 3 - 1]} ${y}`; }
    else if (tf === "Y") out = y;
    else out = `${WDAY[new Date(ms(t)).getUTCDay()]} ${dmy(t)}`;
    if (tf !== "D" && last && periodEnd(t, tf) > last && (!today || today <= periodEnd(t, tf)) && last >= t.slice(0, 10)) out += ` (so far, to ${dm(last)})`;
    return out;
  }
  function rangeStart(bars, r) {
    if (!bars.length || r === "Max") return bars.length ? bars[0].t : null;
    const last = new Date(ms(bars[bars.length - 1].t));
    if (r === "YTD") return last.getUTCFullYear() + "-01-01";
    const m = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "3Y": 36, "5Y": 60 }[r];
    const d = new Date(last); d.setUTCMonth(d.getUTCMonth() - m);
    return iso(d.getTime());
  }
  // index of the first bar on or after t (binary search); bars.length if none
  function indexAt(bars, t) {
    let lo = 0, hi = bars.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (bars[m].t < t) lo = m + 1; else hi = m; }
    return lo;
  }
  // compare lines: % change from the close on the range's first shared date
  function pctFrom(bars, t) {
    const i = indexAt(bars, t);
    if (i >= bars.length) return [];
    const base = bars[i].c;
    return bars.slice(i).map(b => ({ t: b.t, v: (b.c / base - 1) * 100 }));
  }
  // magnet: the bar's O / H / L / C nearest to a price
  function magnet(b, p) {
    let best = b.c;
    for (const v of [b.o, b.h, b.l, b.c]) if (Math.abs(v - p) < Math.abs(best - p)) best = v;
    return best;
  }
  // a price at a date on a straight line through two points (in bar-index space, so weekends don't bend lines)
  function lineAt(bars, a, b, i) {
    const ia = a.i != null ? a.i : indexAt(bars, a.t), ib = b.i != null ? b.i : indexAt(bars, b.t);
    return ia === ib ? a.p : a.p + (b.p - a.p) * (i - ia) / (ib - ia);
  }
  const FIB = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const fibLevels = (a, b) => FIB.map(r => ({ r, p: b.p - (b.p - a.p) * r }));
  // ---- drawings (kept on this device only, inside the Watchlist/Portfolio backup)
  const TOOLS = ["trend", "ray", "hline", "vline", "channel", "fib", "rect", "text", "measure"];
  const NPTS = { trend: 2, ray: 2, hline: 1, vline: 1, channel: 3, fib: 2, rect: 2, text: 1, measure: 2 };
  function cleanDrawings(list) {
    return (Array.isArray(list) ? list : []).filter(d => d && TOOLS.includes(d.type) && Array.isArray(d.pts) &&
      d.pts.length === NPTS[d.type] && d.pts.every(p => p && /^\d{4}-\d{2}-\d{2}$/.test(p.t) && isFinite(p.p)))
      .map(d => ({ id: String(d.id || Math.random().toString(36).slice(2)), type: d.type, pts: d.pts.map(p => ({ t: p.t, p: +p.p })),
                   text: d.type === "text" ? String(d.text || "").slice(0, 120) : undefined,
                   level: d.type === "hline" && d.level ? { p0: +d.level.p0 || null, at: d.level.at || null } : undefined }));
  }
  // undo / redo history of one symbol's drawings (snapshots, capped)
  function history(initial) {
    const st = { past: [], now: cleanDrawings(initial), future: [] };
    return {
      get: () => st.now,
      set(next) { st.past.push(st.now); if (st.past.length > 100) st.past.shift(); st.now = cleanDrawings(next); st.future = []; return st.now; },
      undo() { if (!st.past.length) return st.now; st.future.push(st.now); st.now = st.past.pop(); return st.now; },
      redo() { if (!st.future.length) return st.now; st.past.push(st.now); st.now = st.future.pop(); return st.now; },
      canUndo: () => st.past.length > 0, canRedo: () => st.future.length > 0,
    };
  }
  // watch levels: a horizontal line marked as a level is "crossed" once the close is on the other side of it from the
  // close on the day it was set (p0)
  function crossedLevels(drawings, close) {
    return cleanDrawings(drawings).filter(d => d.type === "hline" && d.level && d.level.p0 != null && close != null)
      .filter(d => Math.sign(close - d.pts[0].p) !== Math.sign(d.level.p0 - d.pts[0].p) && close !== d.pts[0].p)
      .map(d => d.pts[0].p);
  }
  return { CFG, unpack, aggregate, weekKey, periodLabel, periodEnd, sma, ema, bollinger, rsi, macd, heikinAshi, gaps, measure, anchoredAvg, hiLo52,
           rangeStart, indexAt, pctFrom, magnet, lineAt, FIB, fibLevels, TOOLS, NPTS, cleanDrawings, history, crossedLevels };
})();
/*__CHARTLIB_END__*/

// ---------- the query box ----------
// Phrases a beginner might type, mapped to a test. Anything we cannot read becomes a name search.
const PHRASES = [
  // review #58: "Fits a Lynch fast-grower style" = the business type matches AND that lens passes ≥ 70% of its checks
  [/^fits\s+(?:an?\s+)?(graham|buffett|munger|lynch|fisher|greenblatt|kedia|qglp|coffee\s*can)(?:[-\s]+(moat|fast[-\s]*grower|cyclical|turnaround|asset[-\s]*cheap|lender))?(?:[-\s]+style)?$/i,
   "the business type fits that investor's style and its lens passes 70% or more of the checks",
   (s, m) => { const k = m[1].toLowerCase().replace(/\s+/g, ""), t = m[2] ? ({ moat: "moat", cyclical: "cyclical", turnaround: "turnaround", lender: "lender" })[m[2].toLowerCase()] || (/fast/i.test(m[2]) ? "fast" : "asset") : null;
     return !!(s.sty && s.sty.f.includes(k) && (!t || s.sty.t.includes(t)) && (s["lens_" + k] ?? 0) >= 70); }],
  [/^(above|over)\s*(the\s*)?200\s*-?\s*(dma|day( average)?)$|^(long[- ]term )?uptrend$/i, "price is above the 200-day average", s => s.dma200 != null && s.close > s.dma200],
  [/^below\s*(the\s*)?200\s*-?\s*(dma|day( average)?)$|^(long[- ]term )?downtrend$/i, "price is below the 200-day average", s => s.dma200 != null && s.close < s.dma200],
  [/^(above|over)\s*(the\s*)?50\s*-?\s*(dma|day( average)?)$/i, "price is above the 50-day average", s => s.dma50 != null && s.close > s.dma50],
  [/^below\s*(the\s*)?50\s*-?\s*(dma|day( average)?)$/i, "price is below the 50-day average", s => s.dma50 != null && s.close < s.dma50],
  [/^near\s*(its\s*)?(1[- ]?year|52[- ]?week|52w)?\s*high$/i, "price is within 10% of the 1-year high", s => s.pct_from_high52 != null && s.pct_from_high52 >= -10],
  [/^(far from|well below)\s*(its\s*)?(1[- ]?year|52[- ]?week|52w)?\s*high$/i, "price is more than 30% below the 1-year high", s => s.pct_from_high52 != null && s.pct_from_high52 < -30],
  [/^oversold$/i, "RSI is below 30 (fell fast)", s => s.rsi14 != null && s.rsi14 < 30],
  [/^overbought$|^overheated$/i, "RSI is above 70 (rose fast)", s => s.rsi14 != null && s.rsi14 > 70],
  [/^(volume spike|busy( trading)?)$/i, "trading was at least 1.5× normal", s => s.vol_ratio != null && s.vol_ratio >= 1.5],
  [/^(verdict:? ?)?buy$/i, "the verdict is 🟢 Buy", s => SET.master && vfor(s) && vfor(s).g === "buy", "q"],
  [/^(verdict:? ?)?(acc|accumulate)$/i, "the verdict is 🟡 Accumulate (incl. Good but wait)", s => SET.master && vfor(s) && vfor(s).g === "acc", "q"],
  [/^(verdict:? ?)?hold$/i, "the verdict is ⚪ Hold", s => SET.master && vfor(s) && vfor(s).g === "hold", "q"],
  [/^(verdict:? ?)?trim$/i, "the verdict is 🟠 Trim", s => SET.master && vfor(s) && vfor(s).g === "trim", "q"],
  [/^(verdict:? ?)?(avoid|sell|avoid ?\/ ?sell)$/i, "the verdict is 🔴 Avoid / Sell", s => SET.master && vfor(s) && vfor(s).g === "avoid", "q"],
  [/^(💎 ?)?quality on sale near( misses)?$/i, "it fails exactly one 💎 Quality on Sale rule (near misses)", s => !!(s.v4 && s.v4.qs && s.v4.qs.nr && !s.v4.ex), "mos"],
  [/^(💎 ?)?quality on sale$/i, "it passes every checkable 💎 Quality on Sale rule", s => !!(s.v4 && s.v4.qs && s.v4.qs.l && !s.v4.ex), "mos"],
  // review #39 (BUG-20261110-08): "golden cross" = the cross itself, recently – not just "50-day above 200-day"
  [/^50\s*-?\s*(day|dma)\s*(average\s*)?above\s*(the\s*)?200\s*-?\s*(day|dma)(\s*average)?$|^50\s*(dma)?\s*>\s*200\s*(dma)?$/i, "the 50-day average is above the 200-day average", s => s.dma50 != null && s.dma200 != null && s.dma50 > s.dma200],
  [/^50\s*-?\s*(day|dma)\s*(average\s*)?below\s*(the\s*)?200\s*-?\s*(day|dma)(\s*average)?$|^50\s*(dma)?\s*<\s*200\s*(dma)?$/i, "the 50-day average is below the 200-day average", s => s.dma50 != null && s.dma200 != null && s.dma50 < s.dma200],
  [/^golden cross$/i, "the 50-day average crossed ABOVE the 200-day average in the last 20 trading days (golden cross)", s => s.cross20 === "golden"],
  [/^death cross$/i, "the 50-day average crossed BELOW the 200-day average in the last 20 trading days (death cross)", s => s.cross20 === "death"],
];
// Fields a person may compare, e.g. "ROCE > 15", "Debt to equity < 0.5", "PE <= 20".
// This list is the whitelist: anything else is treated as a name search, never as code.
// [pattern, label, key, unit, isFundamental]
const FIELDS = [
  [/^rsi( ?\(?14\)?)?$/, "RSI", "rsi14", "", false],
  [/^(price|close|share price)$/, "price", "close", "₹", false],
  [/^%? ?(from|below) (the )?(1 ?year |52 ?week |52w )?high$/, "% from 1-year high", "pct_from_high52", "%", false],
  [/^(volume|vol)( ratio)?$/, "volume vs normal", "vol_ratio", "×", false],
  [/^(change|day change|% change)$/, "day change", "change_pct", "%", false],
  [/^50 ?-?dma$/, "50-day average", "dma50", "₹", false],
  [/^200 ?-?dma$/, "200-day average", "dma200", "₹", false],
  [/^(roce|return on capital( employed)?)$/, "ROCE", "roce", "%", true],
  [/^((avg|average|5 ?y(ea)?r?) roce|roce (avg|average|5 ?y(ea)?r?( avg)?))$/, "average ROCE", "roce_avg", "%", true],
  [/^(roe|return on equity)$/, "ROE", "roe", "%", true],
  [/^((avg|average|5 ?y(ea)?r?) roe|roe (avg|average|5 ?y(ea)?r?( avg)?))$/, "average ROE", "roe_avg", "%", true],
  [/^(roa|return on assets)$/, "ROA", "roa", "%", true],
  [/^(debt ?to ?equity|debt ?\/ ?equity|d ?\/ ?e|de|debt equity)$/, "debt to equity", "de", "×", true],
  [/^(interest (coverage|cover)|icr)$/, "interest coverage", "icr", "×", true],
  [/^(cfo ?\/ ?pat|cfo to pat|cfo pat|cash conversion)$/, "cash conversion (CFO/PAT)", "cfo_pat", "×", true],
  [/^(operating margin|opm|ebit margin|margin)$/, "operating margin", "op_margin", "%", true],
  [/^(debtor|receivable)s? days$/, "debtor days", "debtor_days", "days", true],
  [/^inventory days$/, "inventory days", "inventory_days", "days", true],
  [/^payables? days$/, "payable days", "payable_days", "days", true],
  [/^(pe|p ?\/ ?e|pe ratio|price to earnings)$/, "PE", "pe", "×", true],
  [/^peg( ratio)?$/, "PEG", "peg", "×", true],
  [/^(pb|p ?\/ ?b|price to book)$/, "P/B", "pb", "×", true],
  [/^(ev ?\/ ?ebitda|ev ebitda|ev to ebitda)$/, "EV/EBITDA", "ev_ebitda", "×", true],
  [/^(earnings yield|ey)$/, "earnings yield", "earnings_yield", "%", true],
  [/^(sales|revenue|income) (growth|cagr)$/, "sales growth per year", "sales_cagr", "%", true],
  [/^(eps|profit|earnings) (growth|cagr)$/, "EPS growth per year", "eps_cagr", "%", true],
  [/^(market cap|mcap|market capitali[sz]ation)$/, "market cap (₹ crore)", "mcap_cr", "₹ cr", true],
  [/^(m ?-?score|beneish( m ?-?score)?)$/, "Beneish M-score", "mscore", "", true],
  [/^(z ?-?score|altman( z)?( ?-?score)?)$/, "Altman Z-score", "zscore", "", true],
  [/^accruals?( ratio)?$/, "accruals", "accruals", "%", true],
  [/^(traded value|liquidity|daily traded value)$/, "daily traded value (₹ crore)", "traded_value_cr", "₹ cr", true],
  [/^(promoter )?pledge( %)?$/, "promoter pledge %", "pledge", "%", true],
  [/^promoter (holding|stake)$/, "promoter holding %", "promoter_holding", "%", true],
  [/^(business )?health( score)?$/, "business health score", "health_score", "", true],
  [/^(piotroski|f ?-?score|piotroski f ?-?score)$/, "Piotroski F-score", "fscore", "", true],
  [/^promoter (change|stake change)( 4q| 1 ?y(ea)?r?)?$/, "promoter stake change over 4 quarters (points)", "promoter_chg_4q", "", true],
  [/^(insider|insider net|insider buying)( ₹? ?cr(ore)?)?$/, "insider net buying, 12 months (₹ crore)", "insider_net_cr", "₹ cr", true],
  [/^red flags?$/, "ownership/management red flags", "red_flags", "", true],
  [/^(core|core score)$/, "Core score v1 (0–100)", "core", "", true],
  [/^(quality|quality score)$/, "quality score (0–100)", "q_quality", "", true],
  [/^(margin of safety|mos|discount to fair value)$/, "margin of safety vs fair value (%)", "q_mos", "%", true],
  [/^fair value$/, "fair value (₹)", "fair_value", "₹", true],
  [/^graham( score)?$/, "Graham lens: % of checks passed", "lens_graham", "%", true],
  [/^buffett( score)?$/, "Buffett lens: % of checks passed", "lens_buffett", "%", true],
  [/^munger( score)?$/, "Munger lens: % of checks passed", "lens_munger", "%", true],
  [/^lynch( score)?$/, "Lynch lens: % of checks passed", "lens_lynch", "%", true],
  [/^fisher( score)?$/, "Fisher lens: % of checks passed", "lens_fisher", "%", true],
  [/^(greenblatt|magic formula)( score)?$/, "Greenblatt lens: % of checks passed", "lens_greenblatt", "%", true],
  [/^(kedia|smile)( score)?$/, "Kedia SMILE lens: % of checks passed", "lens_kedia", "%", true],
  [/^qglp( score)?$/, "QGLP lens: % of checks passed", "lens_qglp", "%", true],
  [/^coffee ?can( score)?$/, "Coffee Can lens: % of checks passed", "lens_coffeecan", "%", true],
];
const OPS = { ">": (a, b) => a > b, "<": (a, b) => a < b, ">=": (a, b) => a >= b, "<=": (a, b) => a <= b, "=": (a, b) => Math.abs(a - b) < 1e-9 };
const norm = t => t.toLowerCase().replace(/\s+/g, " ").trim();

class QueryError extends Error {}

// Split into "(", ")", AND, OR and condition text. Words are matched whole, so "Oracle" is not "or".
function tokenize(q) {
  const out = [], re = /\(|\)|\band\b|\bor\b|&&|\|\|/gi;
  let last = 0, m;
  const push = t => { if (t.trim()) out.push({ t: "COND", s: t.trim() }); };
  while ((m = re.exec(q))) {
    push(q.slice(last, m.index)); last = re.lastIndex;
    const w = m[0].toLowerCase();
    out.push({ t: w === "(" ? "(" : w === ")" ? ")" : (w === "and" || w === "&&") ? "AND" : "OR" });
  }
  push(q.slice(last));
  return out;
}

function condition(text) {
  const ph = PHRASES.find(([re]) => re.test(text));
  if (ph) { const mm = text.match(ph[0]); return { label: ph[1], fn: ph[2].length > 1 ? (s => ph[2](s, mm)) : ph[2], sort: ph[3], phrase: text.trim() }; }
  const m = text.match(/^(.+?)\s*(>=|<=|>|<|=)\s*(-?\d+(?:\.\d+)?)\s*%?$/);
  if (m) {
    const gf = gmField(m[1]); if (gf) return gmCond(gf, m[2], parseFloat(m[3]));          // review #75 E: sales 3y cagr > 15, profit yoy > 20
    const f = FIELDS.find(([re]) => re.test(norm(m[1])));
    if (!f) { const hint = fieldHint(m[1]); const e = new QueryError(`I don't know the field “${m[1].trim()}”.${hint ? ` Did you mean ${hint}?` : ""} Tap "What can I type?" below for the list.`); e.hint = hint ? { bad: m[1].trim(), good: hint } : null; throw e; }
    const [, label, key, unit, fund] = f, op = m[2], v = parseFloat(m[3]);
    return { label: `${label} ${op} ${v}`, fund, fn: s => s[key] != null && OPS[op](s[key], v), field: { key, label, unit, op, v } };
  }
  const needle = norm(text);   // anything else: name, symbol or industry contains the words
  const al = UL.alias(text, x => !!BY[x]);           // review #58: short names – SBI, L&T, M&M, Airtel, HUL, Kotak, ICICI Pru, Bajaj Fin…
  return { label: al ? `${BY[al].name} (“${text}”)` : `name or industry contains “${text}”`, text: true,
    fn: s => (al && s.symbol === al) || s.symbol.toLowerCase().includes(needle) || s.name.toLowerCase().includes(needle) || (s.industry || "").toLowerCase().includes(needle) || (needle.length >= 3 && (s.sw || "").includes(needle)) };   // #86 D3: words from the Company Story
}

// Grammar:  expr := term ((AND|OR) term)*  with one kind of joiner per level;  term := "(" expr ")" | condition
function parseQuery(q) {
  if (!q.trim()) return null;
  const tk = tokenize(q);
  let i = 0;
  const expr = () => {
    const items = [term()];
    let op = null;
    while (i < tk.length && (tk[i].t === "AND" || tk[i].t === "OR")) {
      const o = tk[i++].t;
      if (op && o !== op) throw new QueryError("You mixed AND with OR. Add brackets so the meaning is clear, e.g. (ROCE > 20 OR ROE > 20) AND Debt to equity < 0.5");
      op = o;
      items.push(term());
    }
    return items.length === 1 ? items[0] : { op, items };
  };
  const term = () => {
    const t = tk[i];
    if (!t) throw new QueryError("The search ends too early – something is missing after the last AND/OR or bracket.");
    if (t.t === "(") {
      i++;
      const e = expr();
      if (!tk[i] || tk[i].t !== ")") throw new QueryError("A bracket was opened but never closed.");
      i++;
      return e;
    }
    if (t.t === "COND") { i++; return condition(t.s); }
    throw new QueryError(t.t === ")" ? "There is a closing bracket without an opening one." : `“${t.t}” needs a condition on both sides.`);
  };
  const tree = expr();
  if (i < tk.length) throw new QueryError("There is a closing bracket without an opening one.");
  return tree;
}
const evalQ = (n, s) => n.op ? (n.op === "AND" ? n.items.every(x => evalQ(x, s)) : n.items.some(x => evalQ(x, s))) : n.fn(s);
const describe = (n, top = true) => n.op ? (top ? "" : "(") + n.items.map(x => describe(x, false)).join(n.op === "AND" ? " and " : " or ") + (top ? "" : ")") : `<b>${esc(n.label)}</b>`;
const hasFund = n => n.op ? n.items.some(hasFund) : !!n.fund;
const onlyText = n => n.op ? n.items.every(onlyText) : !!n.text;

// ---------- lists (Search results and verdict groups) – review #29: rendered only on their own screen, 30 at a time ----------
// [button label, query, the same rule in plain words]
// review #70: the ready-made screens come from pipeline/screens.py (S.rules.screens) – one source for the page, the gallery,
// the nightly member log and the guide. [label, query, plain words, id, icon]
const CHIPS = ((S.rules || {}).screens || []).map(x => [x.label, x.q, x.plain, x.id, x.icon]);
const PAGE = 30;
const SHOWN = {};          // list key -> how many cards are open (kept when you come back from a stock page)

function signalTally(s) {
  const c = { green: 0, yellow: 0, red: 0 };
  s.signals.forEach(g => c[g.light]++);
  return `${c.green} 🟢 · ${c.yellow} 🟡 · ${c.red} 🔴`;
}
const scoreLight = v => v == null ? null : v >= 60 ? "green" : v >= 40 ? "yellow" : "red";

function cardHTML(s, tree) {
  // review #41: one calm row per stock – name, price, symbol, day-change pill, verdict and Core score; details on the stock page
  const chg = s.change_pct == null ? "" : chgPill(s.change_pct, 2), OWN = OWNER();
  const core = s.cr && s.cr.sc != null ? `<span class="t-label sub">Core <span class="num">${FMT.num(s.cr.sc, 1)}</span>${sigDot("core", s.cr.sc, s)}</span>` : "";
  return `<div class="cardwrap" data-open="${esc(s.symbol)}"><a class="card" href="${stockHref(s.symbol)}" data-sym="${esc(s.symbol)}" data-sk="${esc(skOf(s))}">
    <div class="top"><span class="nm">${esc(s.name)}${ubadges(s.symbol)}</span>${OWN ? omRow() : lvlNum(s.change_pct, inr(s.close), "price num")}</div>
    <div class="top"><span class="meta">${esc(s.symbol)} · ${esc(s.industry)}${wideTags(s)}</span>${OWN ? "" : chg}</div>
    <div class="top"><ul class="sig">${OWN ? "" : verdictBadge(s, "tiny")}</ul>${core}</div>
    ${SET.signals !== false && (s.roce != null || s.pe != null) ? `<div class="top sigrow t-label sub">${s.roce != null ? `<span>ROCE <span class="num">${FMT.pctPlain(s.roce, 1)}</span>${sigDot("roce", s.roce, s)}</span>` : ""}${s.pe != null && !OWN ? `<span>P/E <span class="num">${FMT.ratio(s.pe, 1)}</span>${sigDot("pe", s.pe, s)}</span>` : ""}</div>` : ""}
    ${tree ? whyHTML(tree, s) : ""}
  </a><div class="cardact">${actBtns(s.symbol)}</div></div>`;
}

// One query -> the matching stocks, in the screener's usual order (same rules as before review #29)
function runQuery(q) {
  let tree;
  try { tree = parseQuery(q); }
  catch (e) { if (!(e instanceof QueryError)) throw e; return { err: e.message, hint: e.hint || null, list: [] }; }
  if (!tree) return { empty: true, list: [] };
  const fund = hasFund(tree), gml = gmLeaves(tree);
  let left = 0, skip = 0;                                       // review #75 E: stocks without enough years for a growth mode
  if (gml.length) skip = UNIV().filter(s => gml.some(g => gmVal(s, g.fk, g.mode(), g.per()).na)).length;
  const list = UNIV().filter(s => {
    if (!evalQ(tree, s)) return false;
    if (fund && s.excluded) { left++; return false; }   // NSE surveillance / thinly traded stay out of screens
    return true;
  });
  const text = onlyText(tree);
  let order;
  if (tree.sort === "q") { list.sort((a, b) => ((vfor(b) || {}).q ?? -1) - ((vfor(a) || {}).q ?? -1)); order = "highest quality first"; }
  else if (tree.sort === "mos") { list.sort((a, b) => (b.q_mos ?? -99) - (a.q_mos ?? -99)); order = "biggest discount to fair value first"; }
  else if (fund) { list.sort((a, b) => (b.health_score ?? -1) - (a.health_score ?? -1)); order = "best business health first"; }
  else if (!text) { list.sort((a, b) => (b.pct_from_high52 ?? -999) - (a.pct_from_high52 ?? -999)); order = "closest to their 1-year high first"; }
  return { tree, list, left, order, text, skip };
}
const SORTS = {
  best: ["Usual order", null],
  health: ["Business health (best first)", s => s.health_score],
  quality: ["Business health (best first)", s => (vfor(s) || {}).q],
  core: ["Core score (best first)", s => s.core],
  mos: ["Discount to fair value (biggest first)", s => s.q_mos],
  high: ["Closest to 1-year high", s => s.pct_from_high52],
  chg: ["Today's change (biggest rise first)", s => s.change_pct],
  name: ["Name (A–Z)", null],
};
function sorted(list, key) {
  if ((!key || key === "best") && /\bcore\b/i.test(SEARCH.q || "")) key = "core";      // review #45: a Core-score search sorts by Core
  if (!key || key === "best") return list;
  if (key === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
  const f = SORTS[key][1];
  return [...list].sort((a, b) => { const x = f(a), y = f(b); return (x == null) - (y == null) || (y ?? 0) - (x ?? 0); });
}
function cardsHTML(list, key, tree) {
  const n = SHOWN[key] || PAGE;
  setNavList(CTX, list.map(x => x.symbol));             // review #58 (6): swipe / Previous–Next walks THIS list
  const why = tree && !onlyText(tree) ? tree : null;
  if (why && prefGet(RESVIEW, "cards") === "table") return resTableHTML(list.slice(0, n), why) +
    (list.length > n ? `<button class="more-btn" type="button" data-more="${esc(key)}">Show more stocks (${list.length - n} left)</button>` : "");
  return `<div class="cards">${list.slice(0, n).map(s => cardHTML(s, why)).join("")}</div>` +
    (list.length > n ? `<button class="more-btn" type="button" data-more="${esc(key)}">Show more stocks (${list.length - n} left)</button>` : "");
}

// ---------- tiny "ⓘ" explanations and the glossary (More → How to read this page) ----------
const GLOSS = {
  de: ["Debt to equity (D/E)", "Borrowings divided by shareholders' money. Under 0.5 is comfortable for most companies; banks and NBFCs borrow by design.", "D/E 0.3 = ₹30 borrowed for every ₹100 of shareholders' money."],
  ttm: ["TTM", "Trailing twelve months – the last four quarters added up, so it is always a full year even mid-year.", "TTM sales in November = the four quarters to September."],
  cagr: ["CAGR", "Compound annual growth rate – the steady yearly growth that turns the first value into the last one.", "₹100 → ₹133 in 3 years = 10% CAGR."],
  ltcg: ["LTCG / STCG", "Long-term vs short-term capital gains. Listed shares held more than 12 months are long-term (taxed lower, with a yearly tax-free limit); sold within 12 months they are short-term.", "Bought 1 Jan 2025, sold 2 Feb 2026 = long-term."],
  vix: ["India VIX", "NSE's 'fear gauge': how much the market expects the Nifty 50 to swing over the next 30 days, from option prices. Higher = more nervous.", "VIX 12 = calm; VIX 25 = jittery."],
  breadth: ["Breadth", "How many stocks rose vs fell today. A rise led by few stocks is weaker than one where most stocks rose.", "1,800 up and 900 down = broad buying."],
  bizhealth: ["Business health", "How healthy the business is – profitability, debt, cash and growth – as a 0–100 score. Used by the verdict (the Buy rule needs 70+). Not the Core score.", "71/100 = healthier than most companies in its sector on those checks."],
  qvsector: ["Quality vs sector", "This stock's quality rank inside its sector (0–100) – 40% of the Core score (Rules v1.0).", "51.8 = better quality than about half of its sector."],
  fii: ["FII / DII", "Net buying (+) or selling (−) in the cash market by foreign investors (FII/FPI) and domestic institutions (DII: mutual funds, insurers). NSE's provisional end-of-day figures.", "FIIs −₹2,000 crore = they sold ₹2,000 crore more than they bought."],
  peband: ["P/E band", "The index's P/E tonight vs the median of its last 5 years' month-end P/E (NSE's index file): more than 10% below = cheap, more than 10% above = expensive, else fair. A rough gauge, not a forecast.", "Median 21, tonight 18 → cheap."],
  shocker: ["Volume shocker", "Traded at least 3× its usual 20-day volume and moved at least 3% – something made people trade it today.", "Usual 1 lakh shares, today 4 lakh, +5%."],
  roce: ["ROCE", "Return on capital employed: profit before interest and tax for every ₹100 of money (debt + equity) the business uses.", "ROCE 20% = ₹20 a year on every ₹100 invested in the business."],
  roe: ["ROE", "Return on equity: yearly profit for every ₹100 of the shareholders' own money.", "ROE 15% = ₹15 profit a year on ₹100 of equity."],
  pe: ["PE", "Price ÷ yearly earnings per share: how many years of today's profit you pay for.", "Share ₹500, profit ₹25 a share → PE 20."],
  pb: ["P/B", "Price ÷ book value (net worth) per share. Used mainly for banks.", "Price ₹300, book value ₹150 → P/B 2."],
  rsi: ["RSI", "A 0–100 speed meter of recent price moves (14 days). Below 30 = fell fast, above 70 = rose fast.", "RSI 25 after a sharp 15% fall in two weeks."],
  dma: ["50/200-day average (DMA)", "The average closing price of the last 50 or 200 trading days. Price above the 200-day average usually means the long-term trend is up.", "Price ₹550 vs a 200-day average of ₹500 = 10% above: an uptrend."],
  piotroski: ["Piotroski F-score", "9 yes/no checks on profit, debt and efficiency; 7–9 is strong.", "8/9 = the business improved on 8 of 9 checks this year."],
  mos: ["Margin of safety", "How far the price is below our fair-value estimate. A cushion in case the estimate is wrong.", "Fair value ₹1,000, price ₹750 → 25% margin of safety."],
  tri: ["TRI (total return index)", "An index that adds dividends back in, so it shows what an investor really earned. The plain Nifty 500 leaves dividends out.", "Price index +10% plus about 1.3% dividends → TRI about +11.3%."],
  drawdown: ["Biggest fall (drawdown)", "The largest drop from a high point to a later low.", "₹10 lakh grows to ₹12 lakh, then falls to ₹9 lakh → biggest fall −25%."],
  xirr: ["XIRR", "Your yearly return, counting when each rupee went in or came out – like a bank's interest rate for your buys and sells.", "₹10,000 in on 1 Jan and ₹5,000 on 1 Jul, worth ₹17,000 next 1 Jan → XIRR about 16% a year."],
  peg: ["PEG", "PE ÷ yearly profit growth (%). Around 1 or below = the price looks fair for the growth (Peter Lynch's rule of thumb).", "PE 30 with profit growing 30% a year → PEG 1."],
  evebitda: ["EV/EBITDA", "Company value (market cap + debt − cash) ÷ yearly operating profit before depreciation. Compares companies with different debt.", "EV ₹10,000 crore, EBITDA ₹1,000 crore → EV/EBITDA 10."],
  cfopat: ["CFO/PAT", "Cash from operations ÷ reported profit. Near 1 or above = profits really arrive as cash.", "Profit ₹100 crore, operating cash ₹90 crore → CFO/PAT 0.9."],
  fair: ["Fair value", "Our estimate of what a share is worth: the middle (median) of the valuation methods that suit the sector, e.g. cash-flow (DCF), peer PE, own PE history.", "Methods say ₹900, ₹1,000 and ₹1,150 → fair value ₹1,000."],
  stcg: ["STCG / LTCG", "Short-term / long-term capital gains tax on listed shares: short-term if held 12 months or less, long-term if held more than 12 months. The Portfolio shows the official rates and their source.", "Bought 10 Jan 2026, sold 5 Jun 2026 → short-term; sold 15 Jan 2027 → long-term."],
  core: ["Core score", "Our 0–100 rank of a stock: Quality 40% · Value 30% · Momentum 30%, compared with stocks in the same sector.", "Core 80 = better than most of its sector on the three together."],
  verdict: ["Verdict", "Simple rules that sort every stock into 🟢 Buy · 🟡 Accumulate · ⚪ Hold · 🟠 Trim · 🔴 Avoid. Experimental, not advice.", "🟢 Buy needs quality 70+, price well below fair value and no red flags."],
};
// review #60: ONE glossary (pipeline/glossary.py → S.rules.glossary); the old one-line GLOSS fills any key not there yet
const GL = (() => { const g = (S.rules && S.rules.glossary && S.rules.glossary.terms) || {}, out = {};
  Object.entries(GLOSS).forEach(([k, v]) => { out[k] = { name: v[0], meaning: v[1], example: v[2] }; });
  Object.entries(g).forEach(([k, v]) => { out[k] = Object.assign({}, out[k] || {}, v); });
  return out; })();
const GL_GROUPS = (S.rules && S.rules.glossary && S.rules.glossary.groups) || [];
const ib = k => GL[k] ? `<button class="ib" type="button" data-tip="${k}" aria-label="What is ${esc(GL[k].name)}?">ⓘ</button>` : "";
const BETTER = { higher: "Higher is better", lower: "Lower is better", "in a range": "Best in a range", depends: "Neither good nor bad on its own" };
const termStock = () => { const r = parseHash(); return r.name === "stock" && BY[r.arg] ? BY[r.arg] : null; };
// "TCS ROCE 55% · IT sector median 28 · top quarter ≥ 35 · well above" – the #48 sector reference range + its signal
function termForStock(k, s) {
  const t = GL[k]; if (!t || !s || !t.field) return "";
  const v = s[t.field] ?? (t.field === "core" && s.cr ? s.cr.sc : null) ?? (s.fund && s.fund.metrics ? s.fund.metrics[t.field] : null);
  if (v == null) return `<p class="mini">For ${esc(s.symbol)}: not available.</p>`;
  const sg = t.signal ? sigOf(t.signal, v, s) : null;
  const pos = sg ? { good: "well placed", ok: "middle of the pack", weak: "weak spot", stretched: "stretched", oversold: "oversold" }[sg.lv] : "";
  return `<p class="mini"><b>For ${esc(s.symbol)}:</b> <span class="num">${esc(FMT.num(v, Math.abs(v) < 10 ? 2 : 1))}</span>${sg ? ` · ${esc(sg.ref || "")}${sg.ref ? " · " : ""}<span class="sigd sig-${sg.lv}">${SIG_DOT[sg.lv]} ${esc(pos)}</span>` : ""}</p>`;
}
let TSK = null;
function termSheet(k) { xSheet(k, { s: termStock() }); }     // review #90 C: every ⓘ opens the same 7-part explanation sheet
// ---------- review #90 C: tap anything to understand it ----------
// Every number, score, badge, chip, verdict, colour, chart, flag and label on every page opens the ONE #83 H sheet, always with the
// same parts in plain words: What it is · This stock's value and what it means · How it's calculated · Source and date · What changed
// recently · What it does NOT tell you · Related items (long parts fold under "Show more"). "What it is" always comes from the one
// shared glossary (pipeline/glossary.py → data/glossary.json → S.rules.glossary). xPass marks whatever isn't tappable yet with
// data-x = the glossary key that explains it; links, buttons and rows that open a stock keep doing what they did.
const XP_EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B55}\u{2705}\u{274C}\u{2714}\u{2718}]/u;
const XP_CLS = /(^|[\s-])(chip|badge|pill|tag|flag|sig|sigd|dot|verdict|vb|vbig|lbl|t-label|num|price|chg|score|grade|stage|lvl)([\s-]|$)/;
// the page's own tap targets: links, controls, and every element a delegated click handler reacts to (data-act, data-peer, data-strow…)
const XP_INTER = 'a[href], button, summary, label, input, select, textarea, [data-act], [data-x], [data-tip], [role="button"], [role="link"], [role="tab"], [onclick], [data-go], [contenteditable], .tv-lightweight-charts, [data-back], [data-budget], [data-cal], [data-cell], [data-close], [data-copy], [data-cs], [data-docf], [data-drag], [data-exf], [data-hdrag], [data-howexit], [data-jump], [data-ml], [data-mm], [data-moodby], [data-more], [data-mu], [data-nav], [data-open], [data-origin], [data-other], [data-pc], [data-pca], [data-peer], [data-pfdel], [data-pfmove], [data-pl], [data-secp], [data-secv], [data-sig], [data-sort], [data-stock], [data-stp], [data-strow], [data-sym], [data-ticker], [data-tikrdate], [data-tilt], [data-tmode], [data-tool], [data-trend], [data-ucs], [data-uni], [data-usrow], [data-ustrend], [data-vsr], [data-wk], [data-wlb], [data-wmove], [data-wq], [data-wreset], [data-wsort], [data-ladder], [data-mday], [data-pg], [data-psort], [data-sim], [data-wcol], [data-lname], [data-fdport], [data-hbpeer], [data-planrules], [data-pzrange], [data-raceyear], [data-guide], [data-firstok], [data-close-go]';
const XP_INNER = 'a[href], button, summary, label, input, select, textarea, [data-act], [data-tip]';
const xOwn = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(" ").replace(/\s+/g, " ").trim();
const xTxt = e => (e ? e.textContent.replace(/ⓘ/g, "").replace(/\s+/g, " ").trim() : "");
// a label's own words, without the value, the grey note or the ⓘ inside it ("ROCE (return on capital employed)", not "… 62.2%")
const xLab = e => { if (!e) return ""; const c = e.cloneNode(true); c.querySelectorAll(".num, .sub, button, .ib, svg, .sig, .sigd, .why").forEach(x => x.remove()); return xTxt(c); };
// the page / Policy / Budget terms aren't in TERM_ALIAS (so no extra ⓘ buttons appear); the tap pass still finds them by name
const XP_ALIAS = (() => { const m = {}; Object.entries(GL).forEach(([k, t]) => { if (t.group === "Reading the page" || t.group === "Policy & Budget") { m[String(t.name).toLowerCase()] = k; m[String(t.name).split(" (")[0].toLowerCase()] = k; } });
  Object.assign(m, { "close": "price", "price": "price", "ltp": "price", "today": "change", "1d": "change", "move": "change", "chg": "change", "1w": "period_return", "1m": "period_return",
    "3m": "period_return", "6m": "period_return", "1y": "period_return", "3y": "period_return", "5y": "period_return", "ytd": "period_return", "return": "period_return",
    "shares": "quantity", "qty": "quantity", "weight": "weight", "stage": "policy_stage", "stocks": "count", "since saved": "watch_gap", "saved at": "watch_gap",
    "stake": "investor_stake", "holding": "investor_stake", "date": "data_date", "filed": "data_date", "as of": "data_date", "value": "invested", "p&l": "pnl", "sector": "qvsector" });
  return m; })();
// text patterns that name a term without being its exact name ("Nifty 50", "18% cheaper", "118 stocks rose", "Price ₹2,343")
const XP_TXT = [[/\b(vs|beat|beats|minus|than) (the )?(nifty|index|sensex)|stock minus index/i, "period_return"], [/^(nifty|bank nifty|sensex)\b[\w &]{0,24}$/i, "index_level"], [/\bvix\b/i, "vix"], [/% (cheaper|costlier)\b/i, "fair"],
  [/\bstocks? (rose|fell|up|down)\b|\brose\b.*\bfell\b|advances?|declines?/i, "breadth"], [/\b(fiis?|diis?|fpis?)\b/i, "fii"], [/^price\b|^close\b|^ltp\b/i, "price"],
  [/^fair value\b|consensus fair value/i, "fair"], [/cash-flow forecast|\bdcf\b/i, "dcf"], [/^saved\b.*₹|since you saved/i, "watch_gap"], [/^top \d+%|better than \d+% of/i, "qvsector"],
  [/stocks? match|^\d[\d,]* stocks?$/i, "count"], [/^fy\d{2,4}$|^\d{4}$|^q[1-4] ?fy\d{2}/i, "data_date"], [/token expires|up to date|due\b.*within|skipped|off \(by choice\)/i, "check_light"],
  [/reading filings/i, "investor_stake"], [/business grew|sales growing/i, "sales_cagr"], [/little debt|debt-free|borrow/i, "de"], [/of every ₹100 of sales/i, "op_margin"],
  [/a year on all the money it uses/i, "roce"], [/decisions timeline/i, "verdict"], [/backtest/i, "rules_v12"],
  [/\b(drops|moves|rises|falls) to (buy|accumulate|hold|trim|avoid)\b/i, "verdict"], [/sector rule/i, "signal"], [/sources? (agree|disagree)|cross-check/i, "check_light"],
  [/year ending/i, "data_date"], [/below its peak|from (its|the) peak/i, "drawdown"], [/above (their|its) 200-day average/i, "breadth"], [/biggest (gainer|loser)/i, "change"], [/\b(revenue|sales|profit|ebitda|margin)\b/i, "statement_line"]];
const xExact = txt => { const s = String(txt || "").replace(/ⓘ/g, "").replace(/\s+/g, " ").trim().replace(/[:·]$/, "").trim(); if (!s || s.length > 60) return null;
  return termKey(s) || XP_ALIAS[s.toLowerCase()] || XP_ALIAS[s.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase()] || null; };
const xName = txt => { const s = String(txt || "").replace(/ⓘ/g, "").replace(/\s+/g, " ").trim().replace(/[:·]$/, "").trim(); if (!s || s.length > 90) return null;
  const k = s.length <= 60 ? (termKey(s) || XP_ALIAS[s.toLowerCase()] || XP_ALIAS[s.replace(/\s*\([^)]*\)\s*$/, "").toLowerCase()]) : null; if (k) return k;
  const m = XP_TXT.find(([re]) => re.test(s)); return m && GL[m[1]] ? m[1] : null; };
// the heading nearest above el inside its card: a sub-heading, a chart's name, then the card's own title
function xHead(el) {
  const top = el.closest(".jsec, section, .card, .panel, .setcard, .tile");
  for (let n = el; n && n !== top && n.id !== "screen"; n = n.parentElement) {
    if (n.dataset && n.dataset.chart) return n.dataset.chart;
    for (let p = n.previousElementSibling; p; p = p.previousElementSibling) if (p.matches("h2, h3, h4, .minor, .ktitle, .sech")) return xTxt(p);
  }
  const h = top && top.querySelector("h2, h3, .sech, .t-heading"); return h ? xTxt(h) : "";
}
// a card heading → the term that explains the card (when its own label names nothing)
const XP_HEAD = [[/my policy|policy check/i, "concentration"], [/stocks exposed|revenue exposed|exposure/i, "policy_exposure"], [/policy radar|^policy$|government|scheme|moved up a stage|releases waiting/i, "policy_item"],
  [/budget \d{4}|budget day|ministry lines|sector by sector|tax and duty/i, "budget_line"], [/best method|every method|methods?\b/i, "best_method"], [/why\b|reasons|system vs me/i, "verdict"],
  [/today in 30 seconds|market summary/i, "market_mood"], [/money flow/i, "fii"], [/crash test|if the market falls|drawdown/i, "drawdown"], [/if i had/i, "period_return"],
  [/maintenance/i, "check_light"], [/sales vs profit|sales|profit/i, "statement_line"], [/verdict/i, "verdict"], [/fair value|price ladder|valuation/i, "fair"], [/core|ranking/i, "core"],
  [/health|quality/i, "bizhealth"], [/statement|profit (and|&) loss|balance sheet|cash flow|results|quarter/i, "statement_line"], [/segment|businesses|company story/i, "segment_share"],
  [/peer|rival/i, "qvsector"], [/owner|sharehold|promoter/i, "promoter"], [/investor|smart money|mutual fund/i, "investor_stake"], [/insider|deal/i, "insider"],
  [/mood|temperature/i, "market_mood"], [/breadth|advance|decline|52-week/i, "breadth"], [/fii|dii|flows/i, "fii"], [/vix|fear/i, "vix"], [/world|us |global|asia|europe/i, "world_index"],
  [/currenc|rupee|fx\b|dollar/i, "fx"], [/minutes|actions/i, "actions_minutes"], [/check|tonight|stage|nightly|back-fill|data quality|run\b|job/i, "check_light"],
  [/portfolio|holding|allocation|p&l|tax/i, "invested"], [/watchlist|saved/i, "watch_gap"], [/return|performance|track record|ghost|model/i, "period_return"],
  [/lens|investor style/i, "lens"], [/red flag|flag|warning|good sign/i, "redflags"], [/index|indices|nifty|sensex/i, "index_level"], [/sector|industr/i, "qvsector"],
  [/news|announce|filing|decision|timeline|event/i, "data_date"], [/technical|trend|momentum|signal/i, "dma"], [/chart|price/i, "price"], [/screen|result|list|gainer|loser|mover|volume/i, "count"]];
const XP_PAGE = { market: "index_level", portfolio: "invested", watchlist: "watch_gap", checks: "check_light", world: "world_index", investors: "investor_stake", radar: "policy_item",
  budget: "budget_line", search: "count", home: "figure", stock: "figure" };
// [glossary key, the label it was found from, fallback?]
function xKey(el) {
  const kd = el.closest("[data-xkey]"); if (kd && GL[kd.dataset.xkey]) return [kd.dataset.xkey, xTxt(kd).slice(0, 60)];
  const tag = el.tagName.toLowerCase();
  if (tag === "svg" || tag === "canvas") return ["chart", ""];
  const t = xOwn(el), full = xTxt(el);
  let k = xExact(t) || xExact(full); if (k) return [k, t || full];
  const td = el.closest("td, th"), tr = td && td.parentElement, tbl = td && td.closest("table");
  if (td && tr) {
    const first = tr.cells[0]; if (first && first !== td) { k = xName(xTxt(first)); if (k) return [k, xTxt(first)]; }
    const hr = tbl && (tbl.tHead ? tbl.tHead.rows[tbl.tHead.rows.length - 1] : null);
    if (hr && td.tagName === "TD") { let col = 0; for (const c of tr.cells) { if (c === td) break; col += c.colSpan || 1; }
      let at = 0; for (const h of hr.cells) { if (at === col || (at < col && at + (h.colSpan || 1) > col)) { k = xName(xTxt(h)); if (k) return [k, xTxt(h)]; break; } at += h.colSpan || 1; } }
  }
  // a value next to its label (never across list items or table rows): the label just before it, or the label of its small group
  for (let n = el, i = 0; n && n.id !== "screen" && i < 3; n = n.parentElement, i++) {
    if (i && /^(LI|TR|SECTION|UL|OL|TABLE|TBODY)$/.test(n.tagName)) break;
    const p = n.previousElementSibling;
    if (p && !p.matches("button, a, li, tr, div.ev, p") && xLab(p).length <= 40) { k = xName(xLab(p)); if (k) return [k, xLab(p)]; }
    const lab = n.parentElement && n.parentElement.querySelector(":scope > .t-label, :scope > .k, :scope > .km, :scope > dt, :scope > .lbl, :scope > .gt, :scope > .tl, :scope > .bml, :scope > b:first-child");
    if (lab && lab !== n && !lab.contains(el)) { k = xName(xLab(lab)); if (k) return [k, xLab(lab)]; }
    if (/^(LI|TR)$/.test(n.tagName)) break;
  }
  k = xName(t) || xName(full); if (k) return [k, t || full];                  // a looser text pattern, after the labels
  if (el.closest(".hero") && /₹/.test(t)) return ["price", ""];
  const cls = `${typeof el.className === "string" ? el.className : ""} ${el.parentElement && typeof el.parentElement.className === "string" ? el.parentElement.className : ""}`;
  if (/(Buy|Accumulate|Hold|Trim|Avoid)\b/.test(full) && (XP_EMO.test(full) || /\bv[bg]|verdict|pill/.test(cls))) return ["verdict", ""];
  if (/\b(up|down|chg)\b/.test(cls) && /%/.test(t)) return ["change", ""];
  if (/^\d{1,2} [A-Z][a-z]{2}( \d{4})?$|^\d{4}-\d{2}-\d{2}$|^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/.test(t)) return ["data_date", ""];
  if (/^[✅🟡🔴]/u.test(full) && parseHash().name === "checks") return ["check_light", ""];
  if (/^[🗣📄✅💰📜📊]/u.test(full) && /radar|budget/.test(parseHash().name)) return ["policy_stage", ""];
  if (/\b(sig|sigd|dot)\b/.test(cls) || /^[🟢🟡🔴🟠⚪]/u.test(full)) return ["signal", ""];
  const ht = xHead(el);
  if (ht) { k = xName(ht); if (k) return [k, ht]; const m = XP_HEAD.find(([re]) => re.test(ht)); if (m && GL[m[1]]) return [m[1], ht]; }
  const pg = XP_PAGE[parseHash().name];
  if (pg && pg !== "figure" && GL[pg]) return [pg, ""];                      // a page about one thing (Watchlist, Checks, World…) explains its own figures
  if (/₹/.test(t)) return ["price", "", 1];
  return ["figure", "", 1];
}
function xCands(root) {
  const out = [];
  for (const e of root.querySelectorAll("*")) {
    if (e.hasAttribute("data-x") || e.hasAttribute("data-xno")) continue;
    const tag = e.tagName.toLowerCase();
    if (tag === "svg") { if (e.closest("button, a, .ib") || e.classList.contains("ic")) continue; const r = e.getBoundingClientRect(); if (r.width >= 80 && r.height >= 40) out.push(e); continue; }
    if (tag === "canvas") { if (!e.closest(".tv-lightweight-charts")) out.push(e); continue; }     // the pro charts answer taps themselves (pin a bar)
    if (e.closest("svg") || /^(script|style|h1|h2|h3|option|br|img|input|textarea|select)$/.test(tag)) continue;
    if (e.closest(".sech, .sub, footer, .shead, .noxp")) continue;
    const t = xOwn(e); if (!t || t.length > 90) continue;
    if (/\d/.test(t) || XP_EMO.test(t) || XP_CLS.test(typeof e.className === "string" ? e.className : "") || tag === "th" || tag === "dt") out.push(e);
  }
  return out;
}
function xPass(root) {
  const scr = root || SCR(), pc = new Map();
  const pointer = e => { const seen = []; let n = e, v = false;
    for (; n && n !== scr; n = n.parentElement) { if (pc.has(n)) { v = pc.get(n); break; } seen.push(n); if (getComputedStyle(n).cursor === "pointer") { v = true; break; } }
    seen.forEach(x => pc.set(x, v)); return v; };
  for (const e of xCands(scr)) {
    if (e.closest(XP_INTER) || pointer(e)) continue;
    const [k, lab, fb] = xKey(e);
    e.setAttribute("data-x", k); if (lab) e.setAttribute("data-xl", lab.slice(0, 80)); if (fb) e.setAttribute("data-xfb", "1");
    e.setAttribute("tabindex", "0"); e.setAttribute("role", "button");
    if (!e.hasAttribute("aria-label") && (e.tagName === "CANVAS" || e.tagName.toLowerCase() === "svg")) e.setAttribute("aria-label", "What this chart shows");
  }
}
// ---- the sheet
const XP_SRC = { revenue: "Sales", pat: "Profit", net_worth: "Net worth", debt: "Borrowings", cfo: "Cash from operations" };
const xNum = (v, d) => v == null || !isFinite(v) ? "–" : FMT.num(v, d == null ? (Math.abs(v) < 10 ? 2 : 1) : d);
const xLast2 = h => { const ys = h ? Object.keys(h).filter(y => h[y] != null).sort() : []; return ys.length >= 2 ? [ys[ys.length - 2], h[ys[ys.length - 2]], ys[ys.length - 1], h[ys[ys.length - 1]]] : null; };
// "How it's calculated" with this stock's real numbers, where the page has the inputs
function xWorked(k, s) {
  if (!s) return "";
  const m = (s.fund && s.fund.metrics) || {}, h = (s.fund && s.fund.history) || {}, ly = o => { const z = xLast2(o); return z ? [z[2], z[3]] : null; };
  const px = s.close, cr = v => "₹" + xNum(v, 0) + " cr";
  switch (k) {
    case "price": return px != null ? `NSE close on ${dateTxt(s.date || S.trade_date)} = ₹${xNum(px, 2)}` : "";
    case "change": return px != null && s.prev_close ? `(₹${xNum(px, 2)} − ₹${xNum(s.prev_close, 2)}) ÷ ₹${xNum(s.prev_close, 2)} × 100 = ${xNum(s.change_pct, 2)}%` : "";
    case "pe": return px != null && m.eps_ttm ? `₹${xNum(px, 2)} ÷ EPS (last 12 months) ₹${xNum(m.eps_ttm, 2)} = ${xNum(px / m.eps_ttm, 1)}` : "";
    case "earnings_yield": return px && m.eps_ttm ? `EPS ₹${xNum(m.eps_ttm, 2)} ÷ price ₹${xNum(px, 2)} × 100 = ${xNum(m.eps_ttm / px * 100, 1)}%` : "";
    case "pb": return m.mcap_cr && m.equity_cr ? `Market cap ${cr(m.mcap_cr)} ÷ net worth ${cr(m.equity_cr)} = ${xNum(m.mcap_cr / m.equity_cr, 1)}` : "";
    case "de": return m.equity_cr ? `Borrowings ${cr(m.debt_cr || 0)} ÷ net worth ${cr(m.equity_cr)} = ${xNum((m.debt_cr || 0) / m.equity_cr, 2)}` : "";
    case "roe": case "roe_avg": return m.pat_cr && m.equity_cr ? `Profit ${cr(m.pat_cr)} ÷ net worth ${cr(m.equity_cr)} × 100 ≈ ${xNum(m.pat_cr / m.equity_cr * 100, 1)}% (the page uses the average net worth of two years: ${xNum(s.roe, 1)}%)` : "";
    case "op_margin": { const o = ly(h.op_profit_cr), r = ly(h.revenue_cr); return o && r && o[0] === r[0] && r[1] ? `Operating profit ${cr(o[1])} ÷ sales ${cr(r[1])} × 100 = ${xNum(o[1] / r[1] * 100, 1)}% (FY${o[0]})` : ""; }
    case "cfo_pat": case "cfopat": { const c = ly(h.cfo_cr), p = ly(h.pat_cr); return c && p && c[0] === p[0] && p[1] ? `Cash from operations ${cr(c[1])} ÷ profit ${cr(p[1])} = ${xNum(c[1] / p[1], 2)} (FY${c[0]})` : ""; }
    case "fair": case "mos": return s.fair_value && px ? `(Fair value ₹${xNum(s.fair_value, 0)} − price ₹${xNum(px, 2)}) ÷ fair value × 100 = ${xNum((s.fair_value - px) / s.fair_value * 100, 1)}% below fair value` : "";
    case "high52": return s.high52 && px ? `(₹${xNum(px, 2)} ÷ 1-year high ₹${xNum(s.high52, 2)} − 1) × 100 = ${xNum((px / s.high52 - 1) * 100, 1)}%` : "";
    case "dma": return s.dma200 && px ? `Price ₹${xNum(px, 2)} vs 200-day average ₹${xNum(s.dma200, 2)} → ${xNum((px / s.dma200 - 1) * 100, 1)}%; 50-day average ₹${xNum(s.dma50, 2)}` : "";
    case "volratio": return s.volume && s.avg_vol20 ? `Today ${FMT.count(s.volume)} shares ÷ 20-day average ${FMT.count(Math.round(s.avg_vol20))} = ${xNum(s.volume / s.avg_vol20, 2)}×` : "";
    case "mcap": return m.mcap_cr ? `Price ₹${xNum(px, 2)} × shares outstanding = ${cr(m.mcap_cr)}` : "";
    case "sales": case "statement_line": { const r = xLast2(h.revenue_cr); return r ? `Sales FY${r[0]} ${cr(r[1])} → FY${r[2]} ${cr(r[3])} (from the filed results)` : ""; }
    default: return "";
  }
}
function xSource(k, s, t) {
  const kind = t.src_url || "", stockLink = s && s.docs ? (s.docs.find(d => d[1] === "results") || s.docs.find(d => /^https?:/.test(d[3] || "")) || null) : null;
  if (s && /financial-results/.test(kind) && s.src && Object.keys(s.src).length) {
    const [fk, v] = Object.entries(s.src)[0];
    return { txt: `${v[2] || ""}${v[0] === "disagree" ? ` – Yahoo's ${XP_SRC[fk] || fk} differs by ${xNum(v[1], 1)}%, the filing is used` : ""}`, url: stockLink ? stockLink[3] : kind, date: stockLink ? stockLink[0] : (s.date || S.trade_date), lab: stockLink ? "Open the filing" : "NSE results filings" };
  }
  if (s && /all-reports/.test(kind)) return { txt: `NSE daily price file (bhavcopy) for ${dateTxt(s.date || S.trade_date)}.`, url: kind, date: s.date || S.trade_date, lab: "NSE daily reports" };
  return { txt: t.source || "Tonight's page data.", url: kind || "#/learn", date: (s && s.date) || S.trade_date, lab: /^#/.test(kind) ? "How we compute it (Learn)" : "Open the official source" };
}
function xChanged(k, s, t) {
  if (s) {
    if (k === "price" || k === "change") return s.prev_close != null ? `Yesterday ₹${xNum(s.prev_close, 2)} → tonight ₹${xNum(s.close, 2)} (${s.change_pct >= 0 ? "+" : ""}${xNum(s.change_pct, 2)}%).` : "";
    if (k === "verdict" && s.vt && s.vt.s && s.vt.s.length) { const rows = s.vt.s, last = rows[rows.length - 1]; let i = rows.length - 1; while (i > 0 && rows[i - 1][1] === last[1]) i--;
      return i > 0 ? `Changed on ${dateTxt(rows[i][0])} (was ${esc(VG && VG[rows[i - 1][1]] ? VG[rows[i - 1][1]].join(" ") : rows[i - 1][1])}).` : `Unchanged since ${dateTxt(rows[0][0])} (as far back as the log on this page goes).`; }
    const hist = s.fund && s.fund.history, f = t.field && hist && (hist[t.field] || hist[t.field + "_cr"]);
    const z = xLast2(f); if (z) { const d = z[3] - z[1]; return `FY${z[0]} ${xNum(z[1])} → FY${z[2]} ${xNum(z[3])} (${d >= 0 ? "up" : "down"} ${xNum(Math.abs(d))}).`; }
    if (k === "statement_line" || k === "sales") { const r = xLast2(hist && hist.revenue_cr); if (r) return `Sales FY${r[0]} ₹${xNum(r[1], 0)} cr → FY${r[2]} ₹${xNum(r[3], 0)} cr.`; }
    return `No earlier value of this item is kept on the page; it is re-read every night (latest ${dateTxt(s.date || S.trade_date)}).`;
  }
  return `Refreshed with every nightly run; tonight's data is from ${dateTxt(S.trade_date)}.`;
}
let XCTX = null;
// opens the sheet for glossary key k; ctx = { s: stock or null, label, val, sec }
function xSheet(k, ctx) {
  const t = GL[k]; if (!t) return; TSK = k; ctx = ctx || {}; XCTX = { s: ctx.s || null };
  const s = ctx.s || null, isPol = t.group === "Policy & Budget";
  if (LANG() === "hi" && !LD() && !LRN.err) learnData().then(() => { if (TSK === k && document.getElementById("sheet").hasAttribute("open")) xSheet(k, ctx); });
  const reopen = document.getElementById("sheet").classList.contains("tsheet"); if (!reopen) XSY = window.scrollY;
  const fold = (body, more) => more ? `${body}<details class="xmore"><summary>Show more</summary>${more}</details>` : body;
  const part = (id, title, html) => html ? `<section class="xpart" data-part="${id}"><h3 class="t-label">${title}</h3>${html}</section>` : "";
  const ex = ltx(k, "example") || t.example;
  const what = fold(`<p>${esc(ltx(k, "meaning"))}</p>`, ex ? `<p class="mini"><b>Example:</b> ${esc(ex)}</p>` : "");
  // value and what it means
  let val = "";
  if (s) { const fl = s.fund && s.fund.lines ? s.fund.lines.find(l => l.key === t.field || l.key === k) : null, pct = s.fund && s.fund.pct && t.field ? s.fund.pct[t.field] : null;
    const lv = pct == null ? "" : pct >= 67 ? "good" : pct >= 34 ? "OK" : "weak";
    val = (termForStock(k, s) || (ctx.val ? `<p class="mini"><b>For ${esc(s.symbol)}:</b> <span class="num">${esc(ctx.val)}</span>${ctx.label && ctx.label !== ctx.val ? ` (${esc(ctx.label)})` : ""}</p>` : `<p class="mini"><b>For ${esc(s.symbol)}:</b> see the card you tapped.</p>`))
      + (lv ? `<p class="mini"><b>What it means:</b> ${lv} – better than ${pct}% of ${esc((s.fund && s.fund.peer_label) || "its sector")}.</p>` : "")
      + (fl && fl.why ? fold("", `<p class="mini">${esc(fl.why)}</p>`) : ""); }
  else if (ctx.val) val = `<p class="mini"><b>This value:</b> <span class="num">${esc(ctx.val)}</span>${ctx.label && ctx.label !== ctx.val ? ` – ${esc(ctx.label)}` : ""}${ctx.sec ? ` · on “${esc(ctx.sec)}”` : ""}</p>`;
  else val = `<p class="mini">${ctx.sec ? `On “${esc(ctx.sec)}”. ` : ""}Open a stock to see its own value.</p>`;
  if (t.better) val += `<p class="mini"><b>${esc(BETTER[t.better] || t.better)}</b>${t.why ? ` – ${esc(ltx(k, "why"))}` : ""}</p>`;
  if (s && t.sector_notes) val += `<p class="mini sub">${esc(t.sector_notes)}</p>`;
  const wk = xWorked(k, s), how = `<p class="mini"><b>How it's calculated:</b> ${esc(t.formula || "")}</p>${wk ? `<p class="mini"><b>For ${esc(s.symbol)}:</b> <span class="num">${esc(wk)}</span></p>` : ""}`;
  const src = xSource(k, s, t), ext = /^https?:/.test(src.url);
  const srcH = `<p class="mini">${esc(src.txt)}${src.date ? ` <span class="sub">· ${esc(dateTxt(src.date))}</span>` : ""}</p><p class="mini"><a class="xsrc" href="${esc(src.url)}"${ext ? ` target="_blank" rel="noopener"` : ` data-close-go="1"`}>${esc(src.lab)} →</a></p>`;
  const rel = (t.related || []).filter(r => GL[r]).slice(0, 6);
  const relH = rel.length ? `<div class="chips xrel">${rel.map(r => `<button class="chip" type="button" data-xk="${r}">${esc(GL[r].name.split(" (")[0])}</button>`).join("")}</div>` : "";
  sheet(`<div class="shead"><h2>${esc(t.name)}</h2><button class="act shx" type="button" data-close aria-label="Close ${esc(t.name)}">Close</button></div>${langSwitch()}
    ${part("what", "What it is", what)}
    ${part("value", s ? "This stock's value and what it means" : "This value and what it means", val)}
    ${part("how", "How it's calculated", how)}
    ${part("source", "Source and date", srcH)}
    ${part("changed", "What changed recently", `<p class="mini">${xChanged(k, s, t)}</p>`)}
    ${part("not", "What it does NOT tell you", `<p class="mini">${esc(t.not_tell || "It is one number; read it with the others on the page.")}</p>`)}
    ${part("related", "Related items", relH + `<p class="mini"><a href="#/learn/${encodeURIComponent(k)}" data-close-go="1">Learn more about ${esc(t.name.split(" (")[0])} →</a></p>`)}
    <p class="sub">${isPol ? "Our reading of public information — not investment advice." : "Not investment advice."}</p>`);
  const d = document.getElementById("sheet"); d.classList.add("tsheet", "xsheet"); d.scrollTop = 0;                // #85 F: title + Close on top, a card on iPad
  if (!reopen && !(history.state && history.state.tsheet)) try { history.pushState({ tsheet: 1 }, ""); } catch (e) {}   // Back closes it
}
// the tapped element → its sheet (the stock is the page's stock, or the row's stock in a list)
function xOpen(el) {
  const k = el.dataset.x, row = el.closest("[data-sym], [data-stock]"), sym = row ? (row.dataset.sym || row.dataset.stock) : null;
  const isChart = /^(svg|canvas)$/i.test(el.tagName);
  xSheet(k, { s: (sym && BY[sym]) || termStock(), label: el.dataset.xl || "", val: isChart ? "" : xOwn(el) || xTxt(el).slice(0, 60), sec: xHead(el).slice(0, 60) });
}
// ---------- review #60: Learn – every term, its own full page (same glossary entry as the ⓘ sheet) ----------
let LEARN_Q = "";
// ---------- review #68: the interactive Learn section – every text from data/learn.json (pipeline/learn_content.py), loaded only
// when Learn opens; progress in USER.learn (this browser only, in the backup). Personal learning tool – not investment advice.
const LRN = { data: null, p: null, err: null };
function learnData() {
  if (LRN.data) return Promise.resolve(LRN.data);
  if (LRN.p) return LRN.p;
  LRN.p = fetch("data/learn.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(d => { LRN.data = d; LRN.err = null; return d; }).catch(e => { LRN.err = String(e && e.message || e); return null; }).finally(() => { LRN.p = null; });
  return LRN.p;
}
const LDAY = () => UL.istDay();
const LSt = () => { USER.learn = UL.cleanLearn(USER.learn); return UL.learnDay(USER.learn, LDAY()); };
const LANG = () => (USER.learn || {}).lang === "hi" ? "hi" : "en";
const PLAIN = () => !!(USER.learn || {}).plain;
const LD = () => LRN.data;
// a term's text in the chosen language; Hinglish falls back to English, never blank
const ltx = (k, f) => { const hi = LANG() === "hi" && LD() && LD().hi[k] && LD().hi[k][f]; return hi || (GL[k] || {})[f] || ""; };
const langSwitch = () => `<div class="segpick lsw" role="group" aria-label="Language">${[["en", "English"], ["hi", "Hinglish"]].map(([v, n]) =>
  `<button class="chip${LANG() === v ? " on" : ""}" type="button" data-act="llang" data-v="${v}" aria-pressed="${LANG() === v}">${n}</button>`).join("")}</div>`;
const LLEVEL = id => (LD().levels || []).find(x => x.id === id);
const LLESSON = id => { for (const lv of LD().levels) { const l = lv.lessons.find(x => x.id === id); if (l) return l; } return null; };
// options in a steady shuffled order per question (the right answer is not always first)
const hashS = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const qorder = q => q.options.map((o, i) => i).sort((a, b) => hashS(q.id + a) - hashS(q.id + b));
function nextLesson() {
  const L = LSt(), lv = LD().levels, from = L.placed ? Math.max(0, lv.findIndex(x => x.id === L.level)) : 0;      // after the quick test: from your level
  for (let i = from; i < lv.length; i++) {
    if (!UL.levelOpen(lv, i, L)) continue;
    const skip = L.placed && lv[i].id === L.level ? L.start : 0;
    const n = lv[i].lessons.find((x, j) => j >= skip && !L.done[x.id]);
    if (n) return n;
  }
  return null;
}
const lstats = () => { if (PLAIN()) return ""; const L = LSt();
  return `<div class="lstats t-label"><span>🔥 <b class="num">${FMT.count(UL.streakNow(L, LDAY()))}</b> day streak</span><span>❤️ <b class="num">${FMT.count(L.hearts)}</b> of ${FMT.count(UL.HEARTS)}</span><span>⭐ <b class="num">${FMT.count(L.xp)}</b> XP</span></div>`; };
const lring = (done, of) => { const C = 2 * Math.PI * 16, f = of ? done / of : 0;
  return `<svg class="lring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="lr-bg"/>${f > 0 ? `<circle cx="20" cy="20" r="16" class="lr-fg" stroke-dasharray="${FMT.coord(C * f)} ${FMT.coord(C)}" transform="rotate(-90 20 20)"/>` : ""}</svg>`; };

function learnScreen(k, sub) {
  if (k && GL[k]) { if (!LD() && !LRN.err) learnData().then(() => { if (parseHash().name === "learn" && parseHash().arg === k) render(true); }); return learnTerm(k); }
  if (k === "terms") return learnTerms();
  if (!LD()) {
    if (LRN.err) return `<div class="scr-h"><h1>Learn</h1></div><div class="warnbox">🟡 The lessons could not be loaded (${esc(LRN.err)}). The A–Z list still works. <a href="#/learn/terms">All terms ›</a></div><button class="act" type="button" data-act="lretry">Try again</button>`;
    learnData().then(() => { if (parseHash().name === "learn") render(true); });
    return `<div class="scr-h"><h1>Learn</h1></div><div class="skel" aria-label="Loading lessons…"><i class="h"></i><i class="b"></i><i></i><i class="b"></i></div>`;
  }
  const back = `<button class="back" type="button" data-back="#/learn">${ic("back")} Learn</button>`;
  if (k === "lesson") return back + lessonScreen(sub);
  if (k === "quiz") return back + quizScreen(sub);
  if (k === "cards") return back + cardsScreen();
  if (k === "games") return back + gamesScreen();
  if (k === "redflag") return back + redflagScreen(+sub || 0);
  if (k === "case") return back + caseScreen(sub);
  if (k === "sim") return back + simScreen();
  if (k === "map") return back + mapScreen(sub);
  if (k === "test") return back + quickScreen();
  if (k === "cert") return back + certScreen(+sub || 0);
  if (k === "play") return back + playList();
  if (k === "settings") return back + learnSettings();
  return learnHome();
}
function learnHome() {
  const L = LSt(), D = LD(), n = nextLesson(), ct = UL.cardsToday(L, D.cards.filter(x => GL[x]), LDAY()), due = ct.due.length;
  const lvls = D.levels.map((lv, i) => { const done = lv.lessons.filter(x => L.done[x.id]).length, open = UL.levelOpen(D.levels, i, L), q = L.quiz[lv.id];
    return `<div class="lvl${open ? "" : " locked"}">${lring(done, lv.lessons.length)}<div class="lvl-t"><b>${esc(lv.name)}</b><span class="t-label sub">${FMT.count(done)} of ${FMT.count(lv.lessons.length)} lessons${q ? ` · quiz ${FMT.count(q.right)}/${FMT.count(q.of)}` : ""}</span></div>
      ${open ? `<a class="act" href="#/learn/lesson/${esc((lv.lessons.find(x => !L.done[x.id]) || lv.lessons[0]).id)}">${done ? "Continue" : "Start"}</a><a class="act" href="#/learn/quiz/${esc(lv.id)}">Quiz</a>`
        : `<span class="t-label sub">🔒 opens when ${esc(D.levels[i - 1].name)} is half done – or <a href="#/learn/test">take the quick test</a></span>`}</div>`; }).join("");
  const tiles = [["play", "Playgrounds", "move sliders, see the number change"], ...(PLAIN() ? [] : [["games", "Games", "Spot the red flag · Detective case files"]]),
    ["sim", "Build a company", "the simulator"], ["map", "Concept map", "how the numbers connect"], ["cards", "Flashcards", `${FMT.count(due)} due today`], ["test", "Quick test", L.placed ? "retake it" : "find your starting point"],
    ["terms", "All terms", "A–Z with search"], ["settings", "Learn settings", "language, plain mode"]];
  return `<div class="scr-h"><h1>Learn</h1><span class="sub">${FMT.count(D.levels.reduce((a, x) => a + x.lessons.length, 0))} lessons</span></div>
    ${!L.placed && !L.skipTest ? `<section class="panel lfirst"><h2>New here?</h2><p class="mline">Three quick questions find your starting point.</p><div class="btnrow"><a class="act big" href="#/learn/test">Take the quick test</a><button class="act" type="button" data-act="lskip">Skip</button></div></section>` : ""}
    ${n ? `<a class="lcont" href="#/learn/lesson/${esc(n.id)}"><span class="t-label">Continue · about ${FMT.count(n.mins)} min</span><b class="lcont-t">${esc(n.title)}</b><span class="t-label sub">${esc(LLEVEL(n.level).name)}</span></a>`
      : `<section class="panel"><h2>Every lesson done</h2><p class="mline">Keep your cards fresh with the flashcards.</p></section>`}
    ${lstats()}<p class="t-label"><a href="#/learn/cards">Flashcards due: <b class="num">${FMT.count(due)}</b>${ct.waiting ? ` (${FMT.count(ct.waiting)} new waiting)` : ""}</a></p>
    <h2 class="sech">Your path</h2><div class="lpath">${lvls}</div>
    ${L.certs.length ? `<p class="t-label">${L.certs.map((c, i) => `<a href="#/learn/cert/${i}">🎓 ${esc(c.level)} certificate</a>`).join(" · ")}</p>` : ""}
    <nav class="glist ltiles" aria-label="More ways to learn">${tiles.map(([k, n2, s]) => `<a href="#/learn/${k}"><span class="gt">${esc(n2)}<span class="gs">${esc(s)}</span></span></a>`).join("")}</nav>
    <p class="sub">${esc(D.not_advice)}</p>`;
}
function learnTerms() {
  const q = LEARN_Q.toLowerCase(), keys = Object.keys(GL).filter(x => GL[x].formula || GL[x].group)
    .filter(x => !q || (GL[x].name + " " + (GL[x].meaning || "")).toLowerCase().includes(q));
  const groups = [...GL_GROUPS, "Other"];
  return `<button class="back" type="button" data-back="#/learn">${ic("back")} Learn</button><div class="scr-h"><h1>All terms</h1><span class="sub">${FMT.count(keys.length)} terms</span></div>
    <p class="sub">Every number on this page explained: what it is, how it's calculated, which way is better, and how it differs by sector.</p>
    <label class="fl">Find a term<input id="learnq" type="search" value="${esc(LEARN_Q)}" placeholder="e.g. ROCE, P/E, drawdown"></label>
    ${groups.map(g => { const ks = keys.filter(x => (GL[x].group || "Other") === g); if (!ks.length) return "";
      return `<h3 class="gl">${esc(g)}</h3><nav class="glist" aria-label="${esc(g)}">${ks.map(x => `<a href="#/learn/${encodeURIComponent(x)}"><span class="gt">${esc(GL[x].name)}<span class="gs">${esc(GL[x].meaning || "")}</span></span></a>`).join("")}</nav>`; }).join("")}
    <p class="sub">Not investment advice.</p>`;
}
function learnSettings() {
  const L = LSt();
  return `<div class="scr-h"><h1>Learn settings</h1></div><div class="glist">
    <div class="gi"><span class="gt">Language<span class="gs">for term pages, the ⓘ sheet, lessons and flashcards</span></span>${langSwitch()}</div>
    <div class="gi"><span class="gt">New flashcards a day<span class="gs">cards you've seen always come back when due</span></span><div class="segpick" role="group" aria-label="New flashcards a day">${UL.NEW_PER_DAY.map(n => `<button class="chip${L.newPerDay === n ? " on" : ""}" type="button" data-act="lnewpd" data-v="${n}" aria-pressed="${L.newPerDay === n}">${n}</button>`).join("")}</div></div>
    <label class="gi sw" style="margin:0"><input type="checkbox" data-act="lplain"${L.plain ? " checked" : ""}><span class="gt">Plain mode<span class="gs">hides XP, hearts, streak and the games – just the lessons</span></span></label>
    <label class="gi"><span class="gt">Name on certificates<span class="gs">stays on this device</span></span><input data-lname value="${esc(L.name || "")}" maxlength="40" placeholder="your name"></label></div>
    <p class="sub">No notifications, no pop-ups. Progress stays in this browser and is in your backup (More → Settings → Backup / Restore).</p>`;
}
// ---- lessons: 3–5 short screens, then 3 questions ----
const LP = { id: null, step: 0, pick: null, right: 0 };
function screenHTML(sc) {
  if (sc.t) return `<p class="lscr">${esc(sc.t)}</p>`;
  if (sc.meaning) return `<p class="t-label sub">What it is</p><p class="lscr">${esc(ltx(sc.meaning, "meaning"))}</p>`;
  if (sc.formula) return `<p class="t-label sub">How it's calculated</p><p class="lscr lformula">${esc(GL[sc.formula] ? GL[sc.formula].formula : "")}</p>`;
  if (sc.example) return `<p class="t-label sub">Worked example</p><p class="lscr">${esc(ltx(sc.example, "example"))}</p>`;
  if (sc.why) return `<p class="t-label sub">${esc(BETTER[(GL[sc.why] || {}).better] || "Why it matters")}</p><p class="lscr">${esc(ltx(sc.why, "why"))}</p>`;
  return "";
}
function qHTML(q, pick, act) {
  return `<p class="lq">${esc(q.q)}</p><div class="lopts" role="group">${qorder(q).map(i => { const cls = pick == null ? "" : i === q.answer ? " right" : i === pick ? " wrong" : "";
    return `<button class="act lopt${cls}" type="button" data-act="${act}" data-i="${i}"${pick != null ? " disabled" : ""}>${pick != null && i === q.answer ? "✓ " : pick === i ? "✗ " : ""}${esc(q.options[i])}</button>`; }).join("")}</div>
    ${pick != null ? `<p class="mline lfb ${pick === q.answer ? "ok" : "no"}">${pick === q.answer ? "Right." : "Not quite."} ${esc(q.why || "")}</p>` : ""}`;
}
function lessonScreen(id) {
  const l = LLESSON(id); if (!l) return `<p class="sub">No such lesson.</p>`;
  if (LP.id !== id) Object.assign(LP, { id, step: 0, pick: null, right: 0 });
  const L = LSt(), nS = l.screens.length, nQ = l.questions.length, total = nS + nQ;
  const head = `<div class="scr-h"><h1>${esc(l.title)}</h1><span class="sub">${esc(LLEVEL(l.level).name)} · about ${FMT.count(l.mins)} min</span></div>${langSwitch()}
    <div class="lprog" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${Math.min(LP.step, total)}"><i style="width:${FMT.coord(Math.min(LP.step, total) / total * 100)}%"></i></div>${lstats()}`;
  if (LP.step < nS) return head + `<section class="panel lcard">${screenHTML(l.screens[LP.step])}</section><div class="btnrow">${LP.step ? `<button class="act" type="button" data-act="lprev">Back</button>` : ""}<button class="act big" type="button" data-act="lnext">Next</button></div>`;
  if (LP.step < total) {
    if (!PLAIN() && L.hearts <= 0 && LP.pick == null) return head + `<section class="panel"><h2>Out of hearts for now</h2><p class="mline">Review 3 flashcards or come back tomorrow – hearts refill at midnight (IST).</p><div class="btnrow"><a class="act big" href="#/learn/cards">Review flashcards</a></div></section>`;
    const q = l.questions[LP.step - nS];
    return head + `<section class="panel lcard"><p class="t-label sub">Question ${FMT.count(LP.step - nS + 1)} of ${FMT.count(nQ)}</p>${qHTML(q, LP.pick, "lans")}</section>
      ${LP.pick != null ? `<div class="btnrow"><button class="act big" type="button" data-act="lnext">${LP.step + 1 < total ? "Next" : "Finish"}</button></div>` : ""}`;
  }
  const lv = LLEVEL(l.level), i = lv.lessons.findIndex(x => x.id === id), nx = lv.lessons[i + 1];
  haptic();                                                // review #74 (12)
  return head + `<section class="panel lcard ldone"><h2>Lesson done</h2><p class="mline">${FMT.count(LP.right)} of ${FMT.count(nQ)} right${PLAIN() ? "" : ` · +${FMT.count(LD().game.xp_lesson)} XP`}</p>
      <div class="btnrow"><a class="act big ltry" href="${esc(l.try.href)}">Try it in the app: ${esc(l.try.label)}</a></div>
      <div class="btnrow">${nx ? `<a class="act" href="#/learn/lesson/${esc(nx.id)}">Next lesson ›</a>` : `<a class="act" href="#/learn/quiz/${esc(lv.id)}">Take the ${esc(lv.name)} quiz ›</a>`}${l.terms.filter(t => GL[t]).map(t => `<a class="act" href="#/learn/${esc(t)}">${esc(GL[t].name.split(" (")[0])}</a>`).join("")}</div></section>`;
}
// ---- the level quiz: 5 questions from the level's pool; ≥ 60% → certificate ----
const LQ = { level: null, qs: [], i: 0, pick: null, right: 0, seed: 0 };
function quizScreen(level) {
  const lv = LLEVEL(level); if (!lv) return `<p class="sub">No such level.</p>`;
  const G = LD().game, C = LD().cert;
  if (LQ.level !== level || !LQ.qs.length) { const seed = Date.now(); Object.assign(LQ, { level, i: 0, pick: null, right: 0, seed,
    qs: lv.pool.slice().sort((a, b) => hashS(a.id + seed) - hashS(b.id + seed)).slice(0, G.quiz_size) }); }
  const head = `<div class="scr-h"><h1>${esc(lv.name)} quiz</h1><span class="sub">${FMT.count(G.quiz_size)} questions · pass with ${FMT.count(C.pass_pct)}%</span></div>${langSwitch()}`;
  if (LQ.i < LQ.qs.length) return head + `<section class="panel lcard"><p class="t-label sub">Question ${FMT.count(LQ.i + 1)} of ${FMT.count(LQ.qs.length)}</p>${qHTML(LQ.qs[LQ.i], LQ.pick, "qans")}</section>
    ${LQ.pick != null ? `<div class="btnrow"><button class="act big" type="button" data-act="qnext">${LQ.i + 1 < LQ.qs.length ? "Next" : "See my score"}</button></div>` : ""}`;
  const pass = UL.certOK(LQ.right, LQ.qs.length, C.pass_pct), L = LSt();
  return head + `<section class="panel lcard"><h2>${pass ? "Passed" : "Not this time"}</h2><p class="mline"><b class="num">${FMT.count(LQ.right)}</b> of ${FMT.count(LQ.qs.length)} right (${FMT.pctPlain(LQ.right / LQ.qs.length * 100, 0)})${pass && !PLAIN() ? ` · +${FMT.count(G.xp_quiz)} XP` : ""}</p>
    ${pass ? `<label class="fl">Name on the certificate<input data-lname value="${esc(L.name || "")}" maxlength="40" placeholder="your name"></label><div class="btnrow"><button class="act big" type="button" data-act="lcert">Make my certificate</button></div>`
      : `<p class="mline">You need ${FMT.count(C.pass_pct)}% for a certificate. Review the lessons and try again.</p>`}
    <div class="btnrow"><button class="act" type="button" data-act="qretry">Try again</button></div></section>`;
}
// ---- 10. certificate: SVG made in the browser; Share (Web Share) / PNG / PDF (print) ----
function certSVG(c) {
  const t = (y, s, fill, text) => `<text transform="translate(300 ${y}) scale(${s})" text-anchor="middle" fill="${fill}">${esc(text)}</text>`;
  return `<svg class="certsvg" viewBox="0 0 600 400" role="img" aria-label="${esc(c.level)} certificate for ${esc(c.name || "you")}" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="584" height="384" rx="22" fill="#0B1026" stroke="#5EE6D0" stroke-width="4"/><rect x="24" y="24" width="552" height="352" rx="14" fill="none" stroke="#8C7CF0" stroke-width="1.5"/>
    ${t(80, 1.25, "#5EE6D0", "Night Screener")}${t(140, 2.1, "#E8ECFF", c.level)}${t(185, 1, "#B9C2E8", "completed by")}${t(228, 1.75, "#E8ECFF", c.name || "–")}
    ${t(275, 1, "#B9C2E8", "Score " + c.score + " · " + c.dateTxt)}${t(350, 0.8, "#8F9AC4", c.wording)}</svg>`;
}
function certScreen(i) {
  const c = LSt().certs[i]; if (!c) return `<p class="sub">No certificate yet – pass a level quiz with ${FMT.count(LD().cert.pass_pct)}% or more.</p>`;
  return `<div class="scr-h"><h1>Certificate</h1></div><div id="certprint" class="certbox">${certSVG(c)}</div>
    <div class="btnrow"><button class="act big" type="button" data-act="lcshare" data-i="${i}">Share</button><button class="act" type="button" data-act="lcpng" data-i="${i}">Download PNG</button><button class="act" type="button" data-act="lcpdf">Download PDF</button></div>
    <p class="sub">${esc(c.wording)}</p>`;
}
function certPNG(c) {
  return new Promise((ok, no) => { const img = new Image(), url = URL.createObjectURL(new Blob([certSVG(c)], { type: "image/svg+xml" }));
    img.onload = () => { const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 800; cv.getContext("2d").drawImage(img, 0, 0, 1200, 800); URL.revokeObjectURL(url); cv.toBlob(b => b ? ok(b) : no(new Error("no image")), "image/png"); };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error("image")); }; img.src = url; });
}
const dlBlob = (b, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
// ---- 3. flashcards (Leitner) ----
const LC = { key: null, back: false };
function cardsScreen() {
  const L = LSt(), keys = LD().cards.filter(x => GL[x]), ct = UL.cardsToday(L, keys, LDAY()), due = ct.due;
  if (!due.length) return `<div class="scr-h"><h1>Flashcards</h1></div>${lstats()}<section class="panel"><h2>Nothing due today</h2><p class="mline">Come back tomorrow – ${ct.waiting ? `${FMT.count(L.newPerDay)} new cards a day (${FMT.count(ct.waiting)} waiting); ` : ""}cards you know well come back less often.</p></section>`;
  if (!LC.key || !due.includes(LC.key)) Object.assign(LC, { key: due[0], back: false });
  const k = LC.key, t = GL[k];
  return `<div class="scr-h"><h1>Flashcards</h1><span class="sub">${FMT.count(due.length)} due · ${FMT.count(ct.reviews)} reviews, ${FMT.count(ct.fresh)} new</span></div>${langSwitch()}${lstats()}
    <section class="panel fcard${LC.back ? " back" : ""}"><p class="t-label sub">Box ${FMT.count((L.cards[k] || {}).box || 0)} of ${FMT.count(UL.LEITNER.length)}</p><h2>${esc(t.name)}</h2>
      ${LC.back ? `<p class="lscr">${esc(ltx(k, "meaning"))}</p><p class="mini"><b>${esc(BETTER[t.better] || t.better)}</b> – ${esc(ltx(k, "why"))}</p>` : `<p class="mline sub">What does it mean, and which way is better?</p>`}</section>
    <div class="btnrow">${LC.back ? `<button class="act big" type="button" data-act="lgot">Got it</button><button class="act" type="button" data-act="lagain">Again</button>` : `<button class="act big" type="button" data-act="lshow">Show the answer</button>`}</div>
    <p class="t-label sub">Wrong → back to box 1 (tomorrow); right → next box (due after 1, 2, 4, 8, 16 days).</p>`;
}
// ---- 6. quick test ----
const LT = { i: 0, pick: null, right: 0 };
function quickScreen() {
  const Q = LD().quick.questions;
  const head = `<div class="scr-h"><h1>Quick test</h1><span class="sub">3 questions</span></div>`;
  if (LT.i < Q.length) return head + `<section class="panel lcard">${qHTML(Q[LT.i], LT.pick, "tans")}</section><div class="btnrow">${LT.pick != null ? `<button class="act big" type="button" data-act="tnext">Next</button>` : ""}<button class="act" type="button" data-act="lskip">Skip</button></div>`;
  const p = UL.quickPlace(LT.right), lv = LLEVEL(p.level);
  return head + `<section class="panel lcard"><h2>${FMT.count(LT.right)} of ${FMT.count(Q.length)} right</h2><p class="mline">Your path starts at <b>${esc(lv.name)}</b>${p.start ? ` (the first ${FMT.count(p.start)} lessons skipped)` : ""}.</p>
    <div class="btnrow"><button class="act big" type="button" data-act="tplace">Start my path</button><button class="act" type="button" data-act="tretake">Retake</button></div></section>`;
}
// ---- 5. Spot the red flag / 11. Detective case files ----
function gamesScreen() {
  const L = LSt(), g = L.games || {};
  return `<div class="scr-h"><h1>Games</h1></div><h2 class="sech">Spot the red flag</h2><p class="sub">Five lines from a made-up company. Tap the worrying one.</p>
    <nav class="glist">${LD().redflags.map((r, i) => `<a href="#/learn/redflag/${i}"><span class="gt">${esc(r.company)}<span class="gs">${(g.rf || {})[r.id] === 1 ? "✓ solved" : (g.rf || {})[r.id] === 0 ? "tried" : "puzzle " + FMT.count(i + 1)}</span></span></a>`).join("")}</nav>
    <h2 class="sech">Detective case files</h2><p class="sub">Four clues, then your verdict. Sometimes the company is fine.</p>
    <nav class="glist">${LD().cases.map(c => `<a href="#/learn/case/${esc(c.id)}"><span class="gt">${esc(c.company)}<span class="gs">${esc(c.intro)}</span></span></a>`).join("")}</nav>`;
}
const LR = { i: null, pick: null };
function redflagScreen(i) {
  const R = LD().redflags, r = R[i]; if (!r) return `<p class="sub">No such puzzle.</p>`;
  if (LR.i !== i) Object.assign(LR, { i, pick: null });
  return `<div class="scr-h"><h1>Spot the red flag</h1><span class="sub">${FMT.count(i + 1)} of ${FMT.count(R.length)}</span></div>
    <section class="panel"><h2>${esc(r.company)}</h2><p class="t-label sub">A made-up company. Tap the line that worries you.</p>
    <div class="rfrows">${r.rows.map(([a, b], j) => `<button class="rfrow${LR.pick == null ? "" : j === r.bad ? " right" : j === LR.pick ? " wrong" : ""}" type="button" data-act="rfpick" data-i="${j}"${LR.pick != null ? " disabled" : ""}><span>${esc(a)}</span><b class="num">${esc(b)}</b></button>`).join("")}</div>
    ${LR.pick != null ? `<p class="mline lfb ${LR.pick === r.bad ? "ok" : "no"}">${LR.pick === r.bad ? "Right." : "Not this one."} ${esc(r.reason)} <a href="#/learn/${esc(r.learn)}">Learn: ${esc((GL[r.learn] || {}).name || r.learn)} ›</a></p>` : ""}</section>
    <div class="btnrow">${i + 1 < R.length ? `<a class="act big" href="#/learn/redflag/${i + 1}">Next puzzle</a>` : `<a class="act big" href="#/learn/games">All games</a>`}</div>`;
}
const LCASE = { id: null, shown: 1, pick: null };
function caseScreen(id) {
  const c = LD().cases.find(x => x.id === id); if (!c) return `<p class="sub">No such case.</p>`;
  if (LCASE.id !== id) Object.assign(LCASE, { id, shown: 1, pick: null });
  const all = LCASE.shown >= c.clues.length, CH = LD().case_choices;
  return `<div class="scr-h"><h1>Case file: ${esc(c.company)}</h1></div><section class="panel"><p class="mline">${esc(c.intro)} <span class="sub">(a made-up company)</span></p>
    <ol class="clues">${c.clues.slice(0, LCASE.shown).map(x => `<li>${esc(x)}</li>`).join("")}</ol>
    ${!all ? `<button class="act" type="button" data-act="cnext">Next clue (${FMT.count(LCASE.shown + 1)} of ${FMT.count(c.clues.length)})</button>` : ""}
    ${all ? `<p class="t-label sub">Your verdict</p><div class="btnrow">${Object.entries(CH).map(([k, n]) => `<button class="act${LCASE.pick == null ? "" : k === c.answer ? " right" : k === LCASE.pick ? " wrong" : ""}" type="button" data-act="cpick" data-v="${k}"${LCASE.pick != null ? " disabled" : ""}>${esc(n)}</button>`).join("")}</div>` : ""}
    ${LCASE.pick != null ? `<p class="mline lfb ${LCASE.pick === c.answer ? "ok" : "no"}">${LCASE.pick === c.answer ? "Well spotted." : "Not quite."} ${esc(c.explain)}</p><p class="t-label">Learn: ${c.terms.filter(t => GL[t]).map(t => `<a href="#/learn/${esc(t)}">${esc(GL[t].name.split(" (")[0])}</a>`).join(" · ")}</p>` : ""}</section>`;
}
// ---- 8. Build-a-company simulator ----
const SIMV = {};
function simCalc(sales, cost, loans) {            // the same maths as pipeline/learn_content.simulate
  const M = LD().sim, op = sales * (1 - cost / 100), interest = loans * M.interest_pct / 100, pbt = op - interest;
  const r = { op, margin: op / sales * 100, interest, profit: pbt > 0 ? pbt * (1 - M.tax_pct / 100) : pbt, roce: op / (M.own + loans) * 100, de: loans / M.own, cover: interest ? op / interest : null };
  const band = (m, v) => { const b = M.bands[m]; if (v == null) return "green"; return b.higher ? (v >= b.good ? "green" : v < b.bad ? "red" : "yellow") : (v <= b.good ? "green" : v > b.bad ? "red" : "yellow"); };
  r.bands = { margin: band("margin", r.margin), roce: band("roce", r.roce), de: band("de", r.de), cover: band("cover", r.cover) };
  return r;
}
const SIMDOT = { green: ["good", "🟢"], yellow: ["ok", "🟡"], red: ["weak", "🔴"] };
function simOut() {
  const M = LD().sim, v = { sales: SIMV.sales ?? M.sales.v, cost: SIMV.cost ?? M.cost_pct.v, loans: SIMV.loans ?? M.loans.v }, r = simCalc(v.sales, v.cost, v.loans);
  const row = (n, val, b) => `<span>${esc(n)}</span><b class="num">${val} <span class="sigd sig-${SIMDOT[b][0]}">${SIMDOT[b][1]}</span></b>`;
  const worst = Object.values(r.bands).includes("red") ? "red" : Object.values(r.bands).includes("yellow") ? "yellow" : "green";
  const read = { green: "A healthy business: good margins, good returns on capital and debt it can carry.", yellow: "Workable, but something is thin – look at the yellow line.",
                 red: r.margin < 0 ? "It loses money on every sale – costs are above sales." : "Something is weak – look at the red line first." }[worst];
  return `<div class="kv2 simkv">${row("Operating profit", FMT.cr(r.op, 1), r.bands.margin)}${row("Operating margin", FMT.pctPlain(r.margin, 1), r.bands.margin)}
    <span>Net profit (after 9% interest, 25% tax)</span><b class="num">${FMT.cr(r.profit, 1)}</b>${row("ROCE", FMT.pctPlain(r.roce, 1), r.bands.roce)}${row("Debt to equity", FMT.ratio(r.de, 2), r.bands.de)}
    ${row("Interest cover", r.cover == null ? "no loans" : FMT.times(r.cover, 1), r.bands.cover)}</div><p class="mline simread">${esc(read)}</p>`;
}
function simScreen() {
  const M = LD().sim, sl = (k, n, c, unit) => `<label class="fl">${esc(n)} <b class="num" id="simv-${k}">${unit(SIMV[k] ?? c.v)}</b><input type="range" data-sim="${k}" min="${c.min}" max="${c.max}" step="${c.step}" value="${SIMV[k] ?? c.v}"></label>`;
  return `<div class="scr-h"><h1>Build a company</h1></div><p class="sub">Own money ₹${FMT.count(M.own)} crore. Assumptions: interest ${FMT.count(M.interest_pct)}% a year on loans, tax ${FMT.count(M.tax_pct)}% of profit.</p>
    <section class="panel">${sl("sales", "Yearly sales", M.sales, x => FMT.cr(x, 0))}${sl("cost", "Costs (% of sales)", M.cost_pct, x => FMT.pctPlain(x, 0))}${sl("loans", "Loans", M.loans, x => FMT.cr(x, 0))}</section>
    <section class="panel" id="simout">${simOut()}</section>
    <p class="t-label sub">ROCE = operating profit ÷ (own money + loans); D/E = loans ÷ own money. 🟢 margin ≥ 15% · ROCE ≥ 15% · D/E ≤ 0.5 · cover ≥ 5; 🔴 margin < 5% · ROCE < 8% · D/E > 1.5 · cover < 2; 🟡 between.</p>`;
}
// ---- 2. playgrounds inside term pages ----
const PG_FN = { pe: x => x.eps ? x.price / x.eps : null, roce: x => x.capital ? x.ebit / x.capital * 100 : null, de: x => x.own ? x.loans / x.own : null,
  mos: x => x.fair ? (x.fair - x.price) / x.fair * 100 : null, cagr: x => x.amount * Math.pow(1 + x.pct / 100, x.years),
  dcf: x => { const tg = 6, Y = Math.round(x.years); if (x.rate <= tg) return null; let pv = 0, f = x.cash;           // = pipeline.valuation.dcf_value
    for (let y = 1; y <= Y; y++) { const g = y <= 5 ? x.growth : x.growth + (tg - x.growth) * (y - 5) / (Y - 5); f *= 1 + g / 100; pv += f / Math.pow(1 + x.rate / 100, y); }
    return pv + f * (1 + tg / 100) / (x.rate / 100 - tg / 100) / Math.pow(1 + x.rate / 100, Y); } };
const PGV = {};
const pgFmt = (k, v) => v == null ? "–" : k === "pe" ? FMT.times(v, 1) : k === "roce" || k === "mos" ? FMT.pctPlain(v, 1) : k === "de" ? FMT.ratio(v, 2) : k === "cagr" ? FMT.money(v, 0) : FMT.cr(v, 0);
function pgOut(k) {
  const P = LD().playgrounds[k], vals = Object.fromEntries(P.inputs.map(i => [i.k, (PGV[k] || {})[i.k] ?? i.v])), v = PG_FN[k](vals);
  const rd = v == null ? "" : (P.read.find(([lo, hi]) => v >= lo && v < hi) || [0, 0, ""])[2];
  return `<p class="mline">${esc(P.out)}: <b class="num t-number-lg">${pgFmt(k, v)}</b></p><p class="mini">${esc(rd)}</p>`;
}
function playground(k) {
  const P = LD() && LD().playgrounds[k]; if (!P) return "";
  return `<section class="panel pground" data-pgk="${k}"><h2>Playground</h2>${P.inputs.map(i => `<label class="fl">${esc(i.label)} <b class="num" id="pgv-${k}-${i.k}">${FMT.num((PGV[k] || {})[i.k] ?? i.v, i.step < 1 ? 1 : 0)}</b><input type="range" data-pg="${k}" data-pgi="${i.k}" min="${i.min}" max="${i.max}" step="${i.step}" value="${(PGV[k] || {})[i.k] ?? i.v}"></label>`).join("")}
    <div id="pgout-${k}">${pgOut(k)}</div>${GL[k] && GL[k].signal ? `<p class="t-label sub">Typical ranges: ${esc(sigRule(GL[k].signal))}</p>` : ""}</section>`;
}
function playList() {
  return `<div class="scr-h"><h1>Playgrounds</h1></div><p class="sub">Move the sliders; the number and its plain reading change as you go.</p>
    <nav class="glist">${Object.keys(LD().playgrounds).map(k => `<a href="#/learn/${k}"><span class="gt">${esc(k === "cagr" ? "Compounding" : GL[k].name)}<span class="gs">${esc(GL[k].formula)}</span></span></a>`).join("")}</nav>`;
}
// ---- 13. concept map: the glossary's related lists; tap to move ----
function mapScreen(k) {
  const start = LD().map_start, c = GL[k] ? k : start[0], nb = [...new Set([...(GL[c].related || []), ...Object.keys(GL).filter(x => (GL[x].related || []).includes(c))])].filter(x => GL[x]).slice(0, 8);
  const R = 38, pos = nb.map((x, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / nb.length; return [x, 50 + R * Math.cos(a), 50 + R * Math.sin(a) * 0.86]; });
  const ls = LD().term_lesson[c];
  return `<div class="scr-h"><h1>Concept map</h1></div><p class="t-label sub">Start route: ${start.map(x => `<a href="#/learn/map/${x}">${esc(GL[x].name.split(" (")[0])}</a>`).join(" → ")}</p>
    <div class="cmap"><svg class="cmlines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${pos.map(([, x, y]) => `<line x1="50" y1="50" x2="${FMT.coord(x)}" y2="${FMT.coord(y)}"/>`).join("")}</svg>
      <a class="cmnode cmc" href="#/learn/${encodeURIComponent(c)}" style="left:50%;top:50%">${esc(GL[c].name.split(" (")[0])}</a>
      ${pos.map(([x, px, py]) => `<a class="cmnode" href="#/learn/map/${encodeURIComponent(x)}" style="left:${FMT.coord(px)}%;top:${FMT.coord(py)}%">${esc(GL[x].name.split(" (")[0])}</a>`).join("")}</div>
    <div class="btnrow">${ls ? `<a class="act big" href="#/learn/lesson/${esc(ls)}">Open lesson</a>` : ""}<a class="act" href="#/learn/${encodeURIComponent(c)}">${esc(GL[c].name.split(" (")[0])} – full page</a></div>
    <p class="t-label sub">Tap a neighbour to move to it. Lines follow each term's "Related" list.</p>`;
}
// ---- actions ----
function learnAct(act, el) {
  const L = LSt(), today = LDAY(), D = LD(), save = () => { persist(); render(true); };
  if (act === "llang") { L.lang = el.dataset.v === "hi" ? "hi" : "en"; persist(); if (document.getElementById("sheet").hasAttribute("open") && TSK) termSheet(TSK); render(true); return true; }
  if (act === "lplain") { L.plain = !!el.checked; save(); return true; }
  if (act === "lnewpd") { L.newPerDay = UL.NEW_PER_DAY.includes(+el.dataset.v) ? +el.dataset.v : 10; save(); return true; }      // review #69
  if (act === "lretry") { LRN.err = null; render(true); return true; }
  if (act === "lskip") { L.skipTest = true; LT.i = 0; LT.pick = null; LT.right = 0; persist(); go("#/learn"); return true; }
  if (!D) return false;
  if (act === "lnext") { const l = LLESSON(LP.id), total = l.screens.length + l.questions.length; LP.step++; LP.pick = null;
    if (LP.step === total) { UL.learnLesson(L, l.id, today, D.game.xp_lesson); } save(); return true; }
  if (act === "lprev") { LP.step = Math.max(0, LP.step - 1); render(true); return true; }
  if (act === "lans" && LP.pick == null) { const l = LLESSON(LP.id), q = l.questions[LP.step - l.screens.length]; LP.pick = +el.dataset.i;
    const ok = LP.pick === q.answer; if (ok) LP.right++; if (!PLAIN()) UL.learnAnswer(L, ok, today, D.game.xp_answer); save(); return true; }
  if (act === "qans" && LQ.pick == null) { const q = LQ.qs[LQ.i]; LQ.pick = +el.dataset.i; const ok = LQ.pick === q.answer; if (ok) LQ.right++; if (!PLAIN()) UL.learnAnswer(L, ok, today, D.game.xp_answer); save(); return true; }
  if (act === "qnext") { LQ.i++; LQ.pick = null;
    if (LQ.i >= LQ.qs.length) { const pass = UL.certOK(LQ.right, LQ.qs.length, D.cert.pass_pct), prev = L.quiz[LQ.level];
      if (pass && !(prev && prev.pass) && !PLAIN()) L.xp += D.game.xp_quiz;
      if (!prev || LQ.right >= prev.right) L.quiz[LQ.level] = { right: LQ.right, of: LQ.qs.length, pass: pass || !!(prev && prev.pass), date: today };
      if (pass && !PLAIN()) celebrate("lq-" + LQ.level, LLEVEL(LQ.level).name + " quiz passed"); }
    save(); return true; }
  if (act === "qretry") { LQ.qs = []; render(true); return true; }
  if (act === "lcert") { if (!UL.certOK(LQ.right, LQ.qs.length, D.cert.pass_pct)) return true;          // only at ≥ 60%
    const inp = SCR().querySelector("[data-lname]"); L.name = (inp ? inp.value : L.name || "").trim().slice(0, 40);
    L.certs.push({ level: LLEVEL(LQ.level).name, name: L.name, score: `${LQ.right}/${LQ.qs.length}`, date: today, dateTxt: dateTxt(today), wording: D.cert.wording });
    persist(); go("#/learn/cert/" + (L.certs.length - 1)); return true; }
  if (act === "lcpng" || act === "lcshare") { const c = L.certs[+el.dataset.i]; certPNG(c).then(b => {
      const f = typeof File === "function" ? new File([b], "certificate.png", { type: "image/png" }) : null;
      if (act === "lcshare" && f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: c.level + " certificate" }).catch(() => {});
      dlBlob(b, "certificate.png"); }).catch(() => toast("Could not make the image")); return true; }
  if (act === "lcpdf") { window.print(); return true; }
  if (act === "lshow") { LC.back = true; render(true); return true; }
  if (act === "lgot" || act === "lagain") { UL.learnReview(L, LC.key, act === "lgot", today); LC.key = null; LC.back = false; save(); return true; }
  if (act === "tans" && LT.pick == null) { LT.pick = +el.dataset.i; if (LT.pick === D.quick.questions[LT.i].answer) LT.right++; render(true); return true; }
  if (act === "tnext") { LT.i++; LT.pick = null; render(true); return true; }
  if (act === "tretake") { Object.assign(LT, { i: 0, pick: null, right: 0 }); render(true); return true; }
  if (act === "tplace") { const p = UL.quickPlace(LT.right); Object.assign(L, { level: p.level, start: p.start, placed: true }); Object.assign(LT, { i: 0, pick: null, right: 0 }); persist(); go("#/learn"); return true; }
  if (act === "rfpick" && LR.pick == null) { const r = D.redflags[LR.i]; LR.pick = +el.dataset.i; L.games = L.games || {}; L.games.rf = L.games.rf || {};
    const ok = LR.pick === r.bad; if ((L.games.rf[r.id] || 0) !== 1) L.games.rf[r.id] = ok ? 1 : 0; if (!PLAIN()) UL.learnAnswer(L, ok, today, D.game.xp_answer); save(); return true; }
  if (act === "cnext") { LCASE.shown++; render(true); return true; }
  if (act === "cpick" && LCASE.pick == null) { const c = D.cases.find(x => x.id === LCASE.id); LCASE.pick = el.dataset.v; if (!PLAIN()) UL.learnAnswer(L, LCASE.pick === c.answer, today, D.game.xp_answer); save(); return true; }
  return false;
}
function learnInput(e) {
  const t = e.target;
  if (t.matches("[data-sim]")) { SIMV[t.dataset.sim] = +t.value; const M = LD().sim, f = { sales: x => FMT.cr(x, 0), cost: x => FMT.pctPlain(x, 0), loans: x => FMT.cr(x, 0) };
    const lab = document.getElementById("simv-" + t.dataset.sim); if (lab) lab.textContent = f[t.dataset.sim](+t.value); const o = document.getElementById("simout"); if (o && M) o.innerHTML = simOut(); return true; }
  if (t.matches("[data-pg]")) { const k = t.dataset.pg, i = LD().playgrounds[k].inputs.find(x => x.k === t.dataset.pgi); (PGV[k] = PGV[k] || {})[i.k] = +t.value;
    const lab = document.getElementById(`pgv-${k}-${i.k}`); if (lab) lab.textContent = FMT.num(+t.value, i.step < 1 ? 1 : 0); const o = document.getElementById("pgout-" + k); if (o) o.innerHTML = pgOut(k); return true; }
  if (t.matches("[data-lname]")) { LSt().name = t.value.trim().slice(0, 40); persist(); return true; }
  return false;
}

function learnTerm(k) {
  const t = GL[k], last = (RECENT.get().v || []).find(x => BY[x]);
  const rel = (t.related || []).filter(x => GL[x]);
  const lastS = last ? BY[last] : null;
  const ls = LD() && LD().term_lesson[k];               // review #68: the lesson that teaches it, the playground, Hinglish
  return `<button class="back" type="button" data-back="#/learn">${ic("back")} Back</button><div class="scr-h"><h1>${esc(t.name)}</h1>${t.group ? `<span class="sub">${esc(t.group)}</span>` : ""}</div>
    ${langSwitch()}<section class="panel"><h2>What it is</h2><p>${esc(ltx(k, "meaning"))}</p>${ls ? `<p class="t-label"><a href="#/learn/lesson/${esc(ls)}">Open lesson ›</a> · <a href="#/learn/map/${encodeURIComponent(k)}">Concept map ›</a></p>` : `<p class="t-label"><a href="#/learn/map/${encodeURIComponent(k)}">Concept map ›</a></p>`}</section>
    ${playground(k)}
    ${k === "best_method" ? `<section class="panel"><h2>The main method for each style</h2>${methodRowsHTML()}<p class="mini">Loss-making companies always use peer EV/Sales (no backup, Low confidence). Every method's own Learn page explains how it is calculated.</p></section>` : ""}
    ${t.formula ? `<section class="panel"><h2>How it's calculated</h2><p class="mline">${esc(t.formula)}</p>${t.source ? `<p class="mini"><b>From:</b> ${esc(t.source)}</p>` : ""}${t.example ? `<p class="mini"><b>Worked example:</b> ${esc(ltx(k, "example"))}</p>` : ""}</section>` : ""}
    ${t.better ? `<section class="panel"><h2>${esc(BETTER[t.better] || t.better)}</h2><p>${esc(ltx(k, "why"))}</p></section>` : ""}
    ${t.signal ? `<section class="panel"><h2>Typical ranges</h2><p class="mini">${esc(sigRule(t.signal))}</p>${lastS ? termForStock(k, lastS) : ""}</section>` : ""}
    ${t.sector_notes ? `<section class="panel"><h2>Sector exceptions</h2><p>${esc(t.sector_notes)}</p></section>` : ""}
    ${t.mistakes ? `<section class="panel"><h2>When it misleads</h2><p>${esc(t.mistakes)}</p></section>` : ""}
    ${rel.length ? `<section class="panel"><h2>Related</h2><p>${rel.map(x => `<a href="#/learn/${encodeURIComponent(x)}">${esc(GL[x].name)}</a>`).join(" · ")}</p></section>` : ""}
    ${lastS && t.tab ? `<p class="mline"><a class="act" href="#/stock/${encodeURIComponent(last)}/${esc(t.tab === "summary" ? "summary" : t.tab)}">See it on ${esc(lastS.name)} →</a></p>` : ""}
    <p class="sub">Not investment advice.</p>`;
}
const sigRule = key => { const R = (S.rules || {}).signals, r = R && R.rules[key]; return r ? `${r.why[0].toUpperCase() + r.why.slice(1)}. (${r.src})` : ""; };
function showTip(k) {
  const g = GLOSS[k], box = document.getElementById("tipbox");
  if (!g) { box.hidden = true; return; }
  box.innerHTML = `<b>${esc(g[0])}</b> – ${esc(g[1])} <span style="opacity:.8">Example: ${esc(g[2])}</span>`;
  box.hidden = false;
}

// ---------- screens ----------
const SCR = () => document.getElementById("screen");
const stockHref = sym => "#/stock/" + encodeURIComponent(sym);
const asofTxt = () => `End-of-day prices for ${dateTxt(S.trade_date)} · ${FMT.count(S.count_all || S.count)} stocks · updated ${FMT.dateTime(S.generated_at)} IST`;   // review #72: said once (no second "Data of" line on Home)
// review #45: repeated "Filled a missing day …" lines become one; the full list opens in a sheet (max 2 lines on Home)
function warnSummary(ws) {
  const fill = (ws || []).filter(w => /^Filled a missing day/.test(w)), rest = (ws || []).filter(w => !/^Filled a missing day/.test(w));
  return (fill.length > 1 ? [`${FMT.count(fill.length)} recent days filled from Yahoo – tap Details.`] : fill).concat(rest);
}
// review #72: everything that needs a look, in one list (Home shows ONE compact row; More → Checks shows the detail).
// Owner-only maintenance notes (data repairs, the public-link token) join it only with Settings → Show maintenance notes on.
const IST_TODAY = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);     // the viewer's clock, in IST
const DSH_D = "Sun Mon Tue Wed Thu Fri Sat".split(" "), DSH_M = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
const dShort = d => { const x = new Date(d + "T00:00:00Z"); return DSH_D[x.getUTCDay()] + " " + x.getUTCDate() + " " + DSH_M[x.getUTCMonth()]; };
// a check's status and words from the viewer's own clock (the nightly wrote them on its day; "today" moves on)
function ckNow(r) {
  const t = IST_TODAY();
  if (r.status === "lapsed" && r.due) return { status: "lapsed", text: `was due ${dShort(r.due)}, not run – today is ${dShort(t)}` };
  if (r.status === "due" && r.today && t > r.today) return { status: "lapsed", text: `was due ${dShort(r.today)}, not run – today is ${dShort(t)}` };
  if (r.status === "ok" && r.next && r.today && t > r.next && !r.last && /first run/.test(r.text || "")) return { status: "lapsed", text: `was due ${dShort(r.next)}, not run – today is ${dShort(t)}` };
  return { status: r.status, text: r.text };
}
function needsLook() {
  const out = [], add = (sev, text, href) => out.push({ sev, text, href });
  const ws = warnSummary(S.warnings || []);
  if (S.selfaudit && S.selfaudit.red) add("red", "A self-check failed tonight – numbers may be wrong: " + S.selfaudit.red, "#/dataquality");
  if (S.db_rebuilt) add("yellow", S.db_rebuilt.text, "#/dataquality");
  ws.forEach(w => add("yellow", w, "#/checks"));
  (S.checks && S.checks.rows || []).forEach(r => { const c = ckNow(r); if (["lapsed", "failed"].includes(c.status)) add("red", `${r.name}: ${c.text}`, "#/checks"); });
  const dq = (S.dq || {}).check; if (dq && dq.total && dq.total.failed) add("red", `Data check found ${dq.total.failed} problem${dq.total.failed === 1 ? "" : "s"}`, "#/dataquality");
  if (S.dqs && S.dqs.golden && (S.dqs.golden.red || []).length) add("red", `Golden set: ${S.dqs.golden.red.length} ${S.dqs.golden.red.length === 1 ? "value doesn't" : "values don't"} match the annual report`, "#/checks");   // review #81 C4
  if (MAINT()) { (S.maint || []).forEach(m => add("yellow", m, "#/checks")); if (S.public_link && S.public_link.warn) add("yellow", S.public_link.warn, "#/checks"); }
  return out;
}
function banners() {
  const L = needsLook(); if (!L.length) return "";
  const red = L.some(x => x.sev === "red");
  return `<a class="looks sev-${red ? "red" : "yellow"}" href="#/checks" data-looks="${L.length}"><span aria-hidden="true">⚠</span><span><b>${FMT.count(L.length)} thing${L.length === 1 ? "" : "s"} need${L.length === 1 ? "s" : ""} a look</b></span><span class="lkx" aria-hidden="true">›</span></a>
    ${MAINT() && ((S.maint || []).length || (S.public_link && S.public_link.warn)) ? `<section class="panel maint"><h2 class="t-heading">Maintenance notes <span class="sub">(only shown because they're switched on in Settings)</span></h2><ul class="plain">${[...(S.maint || []), ...(S.public_link && S.public_link.warn ? [S.public_link.warn] : [])].map(m => `<li><span class="clamp2">${esc(m)}</span><button class="linkbtn" type="button" data-act="clampmore">More ›</button></li>`).join("")}</ul></section>` : ""}`;
}
function moodLine() {
  const share = S.with_200dma ? S.above_200dma / S.with_200dma : 0;
  const light = share >= 0.6 ? "green" : share >= 0.4 ? "yellow" : "red";
  const words = { green: "most stocks are in a long-term uptrend", yellow: "the market is mixed", red: "most stocks are in a long-term downtrend" }[light];
  return `<p class="moodline"><span>${DOT[light]}</span><span><b class="num">${S.above_200dma}</b> of <b class="num">${S.with_200dma}</b> stocks are above their 200-day average ${ib("dma")} – ${words}.</span></p>`;
}

function exitAlert() {
  if (!USER.tx.length) return "";
  const c = exitSummary();
  return c.red ? `<a class="warnbox exalert" href="#/portfolio?f=red">🔴 <b>${c.red} holding${c.red === 1 ? " has" : "s have"} an exit signal</b> – Rules v1.0 would sell at the next close. Open 💼 Portfolio ›</a>` : "";
}
// review #41: Home = greeting + date, the ghosts card (two big numbers vs Nifty 500 TRI, a tiny sparkline), one mood line,
// three big tiles. Nothing else – the model portfolios' full card is one tap away (#/models).
const greeting = () => { const h = new Date(Date.now() + 5.5 * 3600e3).getUTCHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const SPARK_MIN = 5;              // review #45: a sparkline needs 5 points (3 days drew a flat line across the card)
function spark(series, key, name, cap) {
  const v = series.map(r => key(r)).filter(x => x != null);
  if (v.length < SPARK_MIN) return v.length ? `<p class="t-label sub sparkwait">Chart starts after ${SPARK_MIN} trading days (day ${v.length} of ${SPARK_MIN}).</p>` : "";
  const W = 200, H = 44, lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => `${FMT.coord(i * W / (v.length - 1))},${FMT.coord(H - 3 - (y - lo) / ((hi - lo) || 1) * (H - 6))}`).join(" ");
  return `<figure class="sparkfig" data-chart="${esc(name || "value")}"><svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline data-series="${esc(name || "value")}" fill="none" stroke="var(--mood-accent)" stroke-width="2" points="${pts}"/></svg>
    <figcaption class="t-label sub">${kw(name || "value", "var(--mood-accent)")} ${esc(cap || "")} <span class="num">${FMT.money(v[0], 0)} → ${FMT.money(v[v.length - 1], 0)}</span></figcaption></figure>`;
}
// review #72: one compact row per model portfolio (v1.0, v1.1, v1.2), all the same style – each with ITS OWN start date and the
// Nifty 500 TRI over exactly that period; small ▲/▼ next to the number
function ghostsCard() {
  const p = S.portfolio; if (!p || !SET.master) return "";
  const books = [["Rules v1.0", S.portfolio], ["Rules v1.1", S.portfolio_v1_1], ["Rules v1.2", S.portfolio_v1_2]].filter(([, b]) => b);
  const tri = x => x && x.bench_ret ? x.bench_ret["NIFTY 500 TRI"] : null;
  const row = ([nm, b]) => { const x = b.stats || {};
    return x.started
      ? `<div class="grow" data-book="${esc(nm)}"><span class="gl"><span class="t-label">${nm}</span><br><span class="t-label sub">since ${esc(dateTxt(x.started))}</span></span>
          <span class="gv2">${moveNum(x.ret, FMT.pct(x.ret, 2), "t-number")}</span>
          <span class="t-label sub gfull">value <span class="num">${FMT.money(x.nav, 0)}</span> · Nifty 500 TRI ${moveNum(tri(x), FMT.pct(tri(x), 2))} over the same days</span></div>`
      : `<div class="grow" data-book="${esc(nm)}"><span class="t-label">${nm}</span><span class="t-label sub gfull">${b.pending ? "starts at the next close" : "starts after its first nightly run on main"}</span></div>`; };
  const st = p.stats || {};
  const mine = USER.tx.length ? (() => { const T = UL.portfolio(USER.tx, priceOf, PDAY).totals;
    return `<span class="t-label sub">Your portfolio ${moveNum(T.pnlPct, FMT.pct(T.pnlPct, 2))}</span>`; })() : "";
  return `<a class="ghosts" href="#/models" data-tilt>
    <div class="gh"><span class="t-heading">Model portfolios</span><span class="t-label sub">paper ₹10 lakh each</span></div>
    <div class="grows">${books.map(row).join("")}</div>
    ${spark((st.series || []), r => r.nav, "Rules v1.0", "value since the start:")}${mine}</a>${ddMeter((st.series || []).map(r => ({ d: r.d, v: r.nav })), "Rules v1.0 ghost", (st.series || []).map(r => ({ d: r.d, v: (r.b || {})["NIFTY 500 TRI"] })))}<p class="t-label"><a href="#/ranking">See the full Core ranking ›</a></p>`;
}
// ---------- review #60: the automatic data check (Tue/Thu/Sat) + More → Data quality ----------
const DQ = () => S.dq || {};
function dqHomeLine() {                                    // only when something failed
  const c = DQ().check; if (!c || !c.total || !c.total.failed) return "";
  return `<p class="mline dqline">🔴 Data check found ${FMT.count(c.total.failed)} problem${c.total.failed === 1 ? "" : "s"} – see <a href="#/dataquality">More → Data quality</a></p>`;
}
function dqScreen() {
  const d = DQ(), c = d.check, src = d.sources || {}, n = Object.values(src).length ? (src.official + src.cross + src.yahoo + src.none) : 0;
  const pc = x => n ? ` <span class="sub">(${FMT.num(x / n * 100, 0)}%)</span>` : "";
  const areas = c && c.areas ? Object.values(c.areas) : [];
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>Data quality</h1></div>
    <p class="sub">The whole page rests on the data and the calculations. This is how they are checked, and how sure we are of each source.</p>
    ${dq7HTML()}
    <section class="panel noterm"><h2>Last automatic check</h2>
      ${c ? `<p class="mline">${c.ok ? "✅ All checks passed" : c.total && c.total.failed ? `🔴 ${FMT.count(c.total.failed)} problem${c.total.failed === 1 ? "" : "s"} found` : "🟡 No check could run"} · ${esc(dateTxt(c.date))}</p>
        <p class="mini">Every Tue, Thu and Sat at 06:17 IST the QA team's checks run on the published page and the database (skipped when there's no new nightly page; never more than 4 days apart)${c.stocks ? ` – ${FMT.count(c.stocks)} stocks, prices of ${esc(dateTxt(c.trade_date))}` : ""}. No browser, no API cost.</p>
        <div class="kv2">${areas.map(a => `<span><b>${esc(a.label)}</b> <span class="sub">– ${esc(a.what)}</span></span><b class="num">${a.failed ? `🔴 ${FMT.count(a.failed)} failed · ` : "✅ "}${FMT.count(a.passed)} passed</b>`).join("")}</div>
        ${areas.some(a => (a.fails || []).length) ? `<h3 class="minor">What failed, in plain words</h3><ul class="plain dqfails">${areas.flatMap(a => (a.fails || []).map(f => `<li><b>${esc(a.label)}:</b> ${esc(f.what)}</li>`)).join("")}</ul>` : ""}
        <p class="mini sub">Full report: docs/testing/reports/${esc(c.date)}-data-check.md${c.minutes ? ` · took ${FMT.num(c.minutes, 1)} Actions minutes` : ""}</p>`
      : `<p class="mini">The first check runs on the next Tue, Thu or Sat at 06:17 IST (Actions → Data check). Its result shows here.</p>`}
    </section>
    <section class="panel noterm"><h2>Where the numbers come from</h2>
      <div class="kv2">
        <span>✅ NSE official – the company's own filing on NSE (XBRL)</span><b class="num">${FMT.count(src.official || 0)} stocks${pc(src.official || 0)}</b>
        <span>🟡 Cross-checked – Yahoo figures matched by a second source</span><b class="num">${FMT.count(src.cross || 0)} stocks${pc(src.cross || 0)}</b>
        <span>🔴 Yahoo only – unofficial, no second source yet</span><b class="num">${FMT.count(src.yahoo || 0)} stocks${pc(src.yahoo || 0)}</b>
        ${src.none ? `<span>No statements yet</span><b class="num">${FMT.count(src.none)} stocks</b>` : ""}
      </div>
      <p class="mini">Prices: the latest close is NSE's own daily file (official); earlier history is Yahoo Finance, adjusted for splits, bonuses and demergers.</p>
      ${(d.old_split || []).length ? `<p class="mini osw">⚠️ ${FMT.count(d.old_split.length)} stock${d.old_split.length === 1 ? "" : "s"} with a price fall no split, bonus or demerger explains – their 52-week high, averages, RSI and chart show "unreliable – old split" and are left out of screens: ${d.old_split.map(x => BY[x] ? `<a href="${stockHref(x)}">${esc(x)}</a>` : esc(x)).join(", ")}.</p>` : `<p class="mini">✅ No stock has an unexplained price fall in its 1-year history.</p>`}
    </section>
    <section class="panel noterm"><h2>Open bugs</h2>
      ${c && (c.bugs_open || []).length ? `<ul class="plain">${c.bugs_open.map(b => `<li>${esc(b.sev)} <b>${esc(b.title)}</b> <span class="sub">– ${esc(b.status)} (${esc(b.id)})</span></li>`).join("")}</ul>` : `<p class="mini">${c ? "None open." : "Listed after the first data check."}</p>`}
    </section>
    ${dqNewSources()}
    <p class="sub">Personal use only, not investment advice.</p>`;
}
// ---------- review #63: the Delight pack (Karma's BUILD NOW picks). Ground rules: Calm mode or the system's Reduce motion = no motion
// at all (static end states); no effects on long lists (cards, headers and buttons only); transform / opacity / clip-path only; touch
// and mouse alike. ----------
const MOTION = () => !CALM() && prefGet("screener.rmotion", "0") !== "1" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
// review #74 (12): a tiny buzz on save star / add holding / lesson done – optional, off in Calm mode, skipped where unsupported
const haptic = () => { try { if (prefGet("screener.haptic", "1") === "1" && !CALM() && navigator.vibrate) navigator.vibrate(15); } catch (e) {} };
const DL_KEY = "screener.delight.v1";
const dlGet = () => { try { return JSON.parse(localStorage.getItem(DL_KEY) || "{}"); } catch (e) { return {}; } };
const dlPut = o => { try { localStorage.setItem(DL_KEY, JSON.stringify(o)); } catch (e) {} };
const daySeed = (d, salt = 0) => { let h = 2166136261 ^ salt; for (const c of String(d)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return Math.abs(h); };
const initials = n => String(n || "").replace(/\b(ltd|limited|the|and|of|india)\b/gi, "").split(/[\s.&-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
// 2) 3D tilt at half strength (≈ 5°) + a moving shine – ghost cards on Home, the stock header (holographic), the Portfolio total
function tiltMove(e) {
  const el = e.target.closest && e.target.closest("[data-tilt]"); if (!el || !MOTION()) return;
  const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return;
  el.style.setProperty("--ry", FMT.coord((x - .5) * 10) + "deg"); el.style.setProperty("--rx", FMT.coord((.5 - y) * 10) + "deg");
  el.style.setProperty("--sx", FMT.coord(x * 100) + "%"); el.style.setProperty("--sy", FMT.coord(y * 100) + "%");
  el.style.setProperty("--hx", FMT.coord(x * 100) + "%"); el.style.setProperty("--shine", ".8");
}
function tiltEnd(e) { const el = e.target.closest && e.target.closest("[data-tilt]"); if (!el) return; ["--rx", "--ry", "--shine"].forEach(k => el.style.removeProperty(k)); }
// 5) ticker tape on Home – indices, India VIX and USD/INR from tonight's own data; pauses on touch; still (wrapped) when motion is off
function tickerTape() {
  const m = S.market; if (!m || !(m.indices || []).length) return "";
  const pick = ["NIFTY 50", "NIFTY BANK", "NIFTY 500", "NIFTY MIDCAP 150", "NIFTY SMALLCAP 250", "INDIA VIX"];
  const items = pick.map(id => (m.indices || []).find(x => x.id === id)).filter(Boolean).concat((m.global || []).filter(x => /USD\/INR/.test(x.name)));
  if (!items.length) return "";
  const one = items.map(x => `<span class="tk-i t-label"><b>${esc(x.name)}</b> ${lvlNum(x.pct, FMT.num(x.close, x.close < 200 ? 2 : 0))} ${moveNum(x.pct, FMT.pct(x.pct, 2))}</span>`).join("");
  return `<div class="ticker" data-ticker aria-label="Market ticker, ${esc(dateTxt(m.date))} close"><div class="tk-run">${one}<span class="tk-dup" aria-hidden="true">${one}</span></div></div>`;
}
// 6) rolling numbers – odometer digits for the Home ghost numbers and the Portfolio total (screen readers read the plain value)
function rollIn(root) {
  root.querySelectorAll("[data-roll]:not([data-rolled])").forEach(el => {
    el.setAttribute("data-rolled", "1"); if (!MOTION()) return;
    // each digit stays as real text (so copying, reading aloud and tests see the plain number); the rolling column is drawn by CSS
    el.innerHTML = [...el.textContent].map(ch => /\d/.test(ch) ? `<span class="od pre" style="--d:${ch}"><span class="dg">${ch}</span></span>` : esc(ch)).join("");
    requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll(".od.pre").forEach(c => c.classList.remove("pre"))));
  });
}
// 8) score ring – fills to the Core score when the stock page opens
function scoreRing(v) {
  const R = 18, C = 2 * Math.PI * R, f = Math.max(0, Math.min(100, v || 0)) / 100;
  return `<svg class="sring" viewBox="0 0 44 44" aria-hidden="true" data-ring="${FMT.coord(C * (1 - f))}"><circle class="sr-bg" cx="22" cy="22" r="${R}"/><circle class="sr-v" cx="22" cy="22" r="${R}" stroke-dasharray="${FMT.coord(C)}" stroke-dashoffset="${MOTION() ? FMT.coord(C) : FMT.coord(C * (1 - f))}" transform="rotate(-90 22 22)"/></svg>`;
}
// 9) charts draw themselves once on first view (clip reveal – the marks' sizes never change, so the design checks still measure right)
const DRAWN = new Set();
let DRAW_IO = null;
function drawIn(root) {
  if (!MOTION() || !("IntersectionObserver" in window)) return;
  DRAW_IO = DRAW_IO || new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting) return; const c = en.target; DRAW_IO.unobserve(c);
    c.classList.add("drawing"); requestAnimationFrame(() => c.classList.remove("predraw")); setTimeout(() => c.classList.remove("drawing"), 1000); }), { threshold: .25 });
  root.querySelectorAll("[data-chart]:not(.hbars):not([data-nodraw])").forEach(c => {
    const k = location.hash.split("?")[0] + "|" + c.dataset.chart; if (DRAWN.has(k)) return; DRAWN.add(k);
    c.classList.add("predraw"); DRAW_IO.observe(c); });
}
// 10) bell wiggle – once, when the number of new alerts goes up
function bellWiggle(n) {
  const o = dlGet(), prev = o.bell || 0; o.bell = n; dlPut(o);
  const b = document.getElementById("bell"); if (!b || n <= prev || !MOTION()) return;
  b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle"); setTimeout(() => b.classList.remove("wiggle"), 900);
}
// 11) rare celebration – confetti dots once per event (a ghost first beats the Nifty 500 TRI; your My Policy goal is reached)
function celebrate(key, text) {
  const o = dlGet(); o.cel = o.cel || {}; if (o.cel[key]) return false; o.cel[key] = TODAY; dlPut(o);
  toast("🎉 " + text);
  if (!MOTION()) return true;
  const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
  const cols = ["--accent", "--gain", "--gold", "--v11", "--avg"];
  box.innerHTML = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:var(${cols[i % cols.length]});--dx:${((i * 53) % 120) - 60}px;animation-delay:${(i % 9) * 60}ms"></i>`).join("");
  document.body.appendChild(box); setTimeout(() => box.remove(), 2400); return true;
}
function celebrationsCheck() {
  const tri = x => x && x.bench_ret ? x.bench_ret["NIFTY 500 TRI"] : null;
  [["v1.0", S.portfolio], ["v1.1", S.portfolio_v1_1]].forEach(([k, p]) => { const st = p && p.stats; if (st && st.started && st.ret != null && tri(st) != null && st.ret > tri(st))
    celebrate("ghost-beat-" + k, `Rules ${k} is ahead of the Nifty 500 TRI for the first time (${FMT.pct(st.ret, 2)} vs ${FMT.pct(tri(st), 2)}).`); });
}
// 12) daily quiz – one question a day from the Learn glossary (answer, one-line why, Learn more →)
function quizFor(day) {
  const keys = Object.keys(GL).filter(k => GL[k].meaning && GL[k].why && GL[k].better).sort(); if (keys.length < 3) return null;
  const k = keys[daySeed(day) % keys.length], t = GL[k], mode = (daySeed(day, 7) % 2 && t.better !== "depends") ? "better" : "meaning";
  if (mode === "better") return { day, key: k, q: `For ${t.name.split(" (")[0]}, which way is better?`,
    opts: ["higher", "lower", "in a range"].map(b => ({ id: b, text: BETTER[b] })), answer: t.better, why: t.why };
  const others = keys.filter(x => x !== k && GL[x].meaning !== t.meaning); const a = others[daySeed(day, 3) % others.length], b = others[daySeed(day, 5) % others.length] === a ? others[(daySeed(day, 5) + 1) % others.length] : others[daySeed(day, 5) % others.length];
  const opts = [k, a, b].map(x => ({ id: x, text: GL[x].meaning })).sort((x, y) => daySeed(day + x.id) - daySeed(day + y.id));
  return { day, key: k, q: `What does ${t.name.split(" (")[0]} measure?`, opts, answer: k, why: t.why };
}
function quizCard() {
  const q = quizFor(TODAY); if (!q) return "";
  const o = dlGet(), mine = o.quiz && o.quiz.day === TODAY ? o.quiz.pick : null;
  return `<section class="panel quiz" data-quiz="${esc(q.key)}"><h2>Question of the day</h2><p class="mline">${esc(q.q)}</p>
    <div class="qopts">${q.opts.map(x => `<button class="act qa${mine ? (x.id === q.answer ? " right" : x.id === mine ? " wrong" : "") : ""}" type="button" data-act="quiz" data-pick="${esc(x.id)}"${mine ? " disabled" : ""}>${esc(x.text)}</button>`).join("")}</div>
    ${mine ? `<p class="mini">${mine === q.answer ? "✅ Right!" : `❌ Not quite – ${esc(q.opts.find(x => x.id === q.answer).text)}.`} ${esc(q.why)}</p><p class="mini"><a href="#/learn/${encodeURIComponent(q.key)}">Learn more about ${esc(GL[q.key].name.split(" (")[0])} →</a></p>` : `<p class="mini sub">One question a day, from Learn. Kept only in this browser.</p>`}</section>`;
}
// 13) ripple coloured by profit / loss – green when what you tapped is in profit, red in a loss, blue (accent) otherwise
const RIPPLE_SEL = "[data-ripple], button.act, a.act, .tile, .ghosts, .tot.totals, .hero";
function rippleColor(el, target) { const h = (target && target.closest && target.closest("[data-pl]")) || el.closest("[data-pl]"), v = h ? h.dataset.pl : "";
  return v === "up" ? "var(--gain)" : v === "down" ? "var(--loss)" : "var(--accent)"; }
function ripple(e) {
  const el = e.target.closest && e.target.closest(RIPPLE_SEL); if (!el || el.closest(".cardwrap, .urow:not(.flipcard), tr, .glist, #sheet")) return;
  el.dataset.rippled = rippleColor(el, e.target);
  if (!MOTION()) return;
  const r = el.getBoundingClientRect(), sp = document.createElement("span"); sp.className = "ripple";
  sp.style.left = (e.clientX - r.left) + "px"; sp.style.top = (e.clientY - r.top) + "px"; sp.style.setProperty("--rc", el.dataset.rippled);
  sp.style.setProperty("--rs", String(Math.ceil(Math.hypot(r.width, r.height) / 8)));
  const had = el.classList.contains("ripple-host"); el.classList.add("ripple-host"); el.appendChild(sp);
  setTimeout(() => { sp.remove(); if (!had) el.classList.remove("ripple-host"); }, 600);
}
// 14) the hollow star that fills gold – one SVG, the fill scales in (≈ 300 ms, a small pop); its state is announced ("Saved" / "Not saved")
let JUST_STAR = null;
const STAR_D = "M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z";
const starIcon = (on, pop) => `<svg class="star${on ? " on" : ""}${pop ? " pop" : ""}" viewBox="0 0 24 24" aria-hidden="true"><path class="st-f" d="${STAR_D}"/><path class="st-o" d="${STAR_D}"/></svg>`;
// 17) goal jar – Portfolio value towards your My Policy goal (fills on open; a rare celebration when the goal is reached)
function goalJar(value) {
  const g = (USER.policy || {}).goal; if (!(g > 0)) return `<p class="t-label sub">Set a goal in <a href="#/policy">My Policy</a> to see your goal jar fill up.</p>`;
  const f = Math.max(0, Math.min(1, value / g));
  if (value >= g) setTimeout(() => celebrate("goal-" + g, `You reached your goal of ${FMT.money(g, 0)}!`), 300);
  return `<section class="panel"><figure class="jar${MOTION() ? " pre" : ""}" data-chart="Goal jar" data-direct="1" data-nodraw><svg viewBox="0 0 64 84" role="img" aria-label="Goal ${FMT.pctPlain(f * 100, 0)} full">
      <path d="M16 6h32v8c8 4 12 12 12 22v34a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V36c0-10 4-18 12-22z" style="fill:var(--surface-2);stroke:var(--line)"/>
      <clipPath id="jarclip"><path d="M16 6h32v8c8 4 12 12 12 22v34a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V36c0-10 4-18 12-22z"/></clipPath>
      <rect class="jr-fill" clip-path="url(#jarclip)" x="0" y="${FMT.coord(84 - 78 * f)}" width="64" height="${FMT.coord(78 * f)}" style="fill:var(--gold)" data-label="Goal"/></svg>
    <figcaption><h3 class="minor ktitle">Goal jar</h3><p class="mline"><b class="num">${FMT.money(value, 0)}</b> of <span class="num">${FMT.money(g, 0)}</span> · <b class="num">${FMT.pctPlain(f * 100, 0)}</b></p>
      <p class="mini sub">${value >= g ? "Goal reached 🎉 – set the next one in My Policy." : `${FMT.money(g - value, 0)} to go.`}</p></figcaption></figure></section>`;
}
// 18) holographic stock card – the stock header gets a soft iridescent sheen that follows the tilt (see .holo)
// 19) swipe deck (Discover): stocks with Core ≥ 70 you haven't saved – swipe right = save to Watchlist, left = skip (buttons too)
function deckList() {
  const seen = new Set((dlGet().deckSeen || []).concat(USER.watch.map(w => w.sym)));
  return S.stocks.filter(s => s.cr && s.cr.sc >= 70 && !seen.has(s.symbol)).sort((a, b) => daySeed(TODAY + a.symbol) - daySeed(TODAY + b.symbol)).slice(0, 30);
}
function deckCard(s, under) {
  return `<article class="dcard${under ? " under" : ""}" data-deck="${esc(s.symbol)}" aria-label="${esc(s.name)}"><p class="t-label sub">${esc(s.industry || "")}</p><h2>${esc(s.name)}</h2>
    <p class="mline">Core <b class="num">${FMT.num(s.cr.sc, 1)}</b>${SET.master ? ` · ${vtag(s)}` : ""}</p>
    <p class="mini">ROCE <b class="num">${FMT.pctPlain(s.roce, 1)}</b> · P/E <b class="num">${FMT.ratio(s.pe, 1)}</b> · from 1-yr high <b class="num">${FMT.pct(s.pct_from_high52, 1)}</b></p>
    <p class="mini sub">For learning, not a tip. Swipe right to save to your Watchlist, left to skip.</p>
    <a class="act" href="${stockHref(s.symbol)}">Open the stock</a></article>`;
}
function discoverScreen() {
  const L = deckList();
  return `<button class="back" type="button" data-back="#/home">${ic("back")} Back</button><div class="scr-h"><h1>Discover</h1><span class="sub">${FMT.count(L.length)} to look at</span></div>
    <p class="sub">Stocks with a Core score of 70 or more that aren't in your Watchlist yet. For learning, not a tip.</p>
    ${L.length ? `<div class="deck" id="deck">${L.slice(0, 2).reverse().map((s, i, a) => deckCard(s, i === 0 && a.length > 1)).join("")}</div>
      <div class="btnrow"><button class="act" type="button" data-act="deck" data-dir="l">✕ Skip</button><button class="act" type="button" data-act="deck" data-dir="r">${starIcon(false)} Save</button></div>`
      : `<p class="empty">You've seen them all for today. Come back tomorrow.</p>`}`;
}
function deckDecide(dir) {
  const top = document.querySelector("#deck .dcard:last-child"); if (!top) return;
  const sym = top.dataset.deck, o = dlGet(); o.deckSeen = (o.deckSeen || []).concat(sym).slice(-500); dlPut(o);
  if (dir === "r") { CTX = "Discover"; addWatch(sym, ""); toast(`${BY[sym] ? BY[sym].name : sym} saved to your Watchlist`); }
  top.classList.add(dir === "r" ? "out-r" : "out-l");
  setTimeout(() => render(true), MOTION() ? 260 : 0);
}
function deckDrag(e) {
  const card = e.target.closest && e.target.closest("#deck .dcard:last-child"); if (!card || e.target.closest("a, button")) return;
  const x0 = e.clientX; card.classList.add("drag"); card.setPointerCapture && card.setPointerCapture(e.pointerId);
  const mv = ev => { const dx = ev.clientX - x0; card.style.transform = MOTION() ? `translateX(${dx}px) rotate(${dx / 20}deg)` : ""; card.dataset.dx = dx; };
  const up = () => { card.removeEventListener("pointermove", mv); card.removeEventListener("pointerup", up); card.removeEventListener("pointercancel", up);
    card.classList.remove("drag"); const dx = +card.dataset.dx || 0; card.style.transform = ""; if (Math.abs(dx) > 90) deckDecide(dx > 0 ? "r" : "l"); };
  card.addEventListener("pointermove", mv); card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
}
// 22) scratch card – today's fact from tonight's numbers, revealed by scratching (or one tap when motion is off)
function factOfDay() {
  const el = S.stocks.filter(s => s.cr && s.cr.el), hi = (k, f = x => x) => el.filter(s => s[k] != null).sort((a, b) => f(b[k]) - f(a[k]))[0];
  const F = [];
  const a = hi("roce"); if (a) F.push(`${a.name} has the highest ROCE among the stocks the Core score ranks tonight: ${FMT.pctPlain(a.roce, 1)}.`);
  const b = el.filter(s => s.pe > 0 && s.cr.sc >= 70).sort((x, y) => x.pe - y.pe)[0]; if (b) F.push(`The cheapest stock by P/E with a Core score of 70+ is ${b.name}: P/E ${FMT.ratio(b.pe, 1)}.`);
  const c = hi("change_pct"); if (c) F.push(`Tonight's biggest gainer in the list was ${c.name}: ${FMT.pct(c.change_pct, 2)} in one day.`);
  const d = el.filter(s => s.cr.rk === 1)[0]; if (d) F.push(`Rank 1 in the Core score tonight: ${d.name} (${FMT.num(d.cr.sc, 1)}).`);
  return F.length ? F[daySeed(TODAY, 11) % F.length] : null;
}
function scratchCard() {
  const f = factOfDay(); if (!f) return "";
  const done = (dlGet().scratch || "") === TODAY;
  return `<section class="panel"><h2>Fact of the day</h2><div class="scratch" data-scratch>${done || !MOTION() ? "" : `<canvas aria-hidden="true"></canvas>`}
    <p class="sc-fact mline"${!done && !MOTION() ? " hidden" : ""}>${esc(f)}</p>${!done && !MOTION() ? `<button class="act" type="button" data-act="scratch">Tap to reveal</button>` : ""}</div>
    ${!done && MOTION() ? `<p class="mini sub">Scratch the card with your finger (or mouse) to reveal it.</p>` : ""}</section>`;
}
function scratchInit(root) {
  root.querySelectorAll("[data-scratch] canvas:not([data-ready])").forEach(cv => {
    cv.dataset.ready = "1"; const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); const g = cv.getContext("2d"); if (!g) return;
    const cs = getComputedStyle(document.documentElement);
    g.fillStyle = cs.getPropertyValue("--surface-2").trim() || "#ccc"; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = cs.getPropertyValue("--ink-3").trim() || "#888"; g.font = `${16 * dpr}px system-ui, sans-serif`; g.textAlign = "center"; g.fillText("Scratch here", cv.width / 2, cv.height / 2 + 6 * dpr);
    g.globalCompositeOperation = "destination-out"; let down = false, moves = 0;
    const at = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * dpr, (e.clientY - b.top) * dpr]; };
    const scr = e => { if (!down) return; const [x, y] = at(e); g.beginPath(); g.arc(x, y, 18 * dpr, 0, 7); g.fill(); if (++moves % 8 === 0) check(); };
    const check = () => { const d = g.getImageData(0, 0, cv.width, cv.height).data; let clear = 0; for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
      if (clear / (d.length / 64) > .45) { cv.classList.add("gone"); const o = dlGet(); o.scratch = TODAY; dlPut(o); } };
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); scr(e); });
    cv.addEventListener("pointermove", scr); cv.addEventListener("pointerup", () => { down = false; check(); }); cv.addEventListener("pointercancel", () => { down = false; });
  });
}
// 24) valuation speedometer – the price vs the consensus fair value on a gauge (cheap ↔ expensive), needle swings in on first view
function speedometer(s) {
  const v = s.v4 && s.v4.va; if (!v || !v.fair || !s.close) return "";
  const gap = (s.close / v.fair - 1) * 100, g = Math.max(-50, Math.min(50, gap)), ang = g / 50 * 90;
  const arc = (a0, a1, col) => { const p = a => [100 + 80 * Math.sin(a * Math.PI / 180), 100 - 80 * Math.cos(a * Math.PI / 180)].map(FMT.coord).join(" ");
    return `<path d="M ${p(a0)} A 80 80 0 0 1 ${p(a1)}" style="fill:none;stroke:var(${col})" stroke-width="16"/>`; };
  const word = gap < -15 ? "cheap" : gap > 15 ? "expensive" : "near fair value";
  return `<figure class="speedo" data-chart="Valuation speedometer" data-direct="1" data-nodraw>${ktitle(`Price vs ${kw("Fair value", "var(--accent)")} – speedometer`, "p")}<svg viewBox="0 0 200 118" role="img" aria-label="Price ${FMT.pctPlain(Math.abs(gap), 0)} ${gap < 0 ? "below" : "above"} fair value – ${word}">
      ${arc(-90, -27, "--gain")}${arc(-27, 27, "--warn")}${arc(27, 90, "--loss")}
      <line class="sp-n" x1="100" y1="100" x2="100" y2="30" style="stroke:var(--ink);transform:rotate(${MOTION() ? -90 : FMT.coord(ang)}deg)" data-ang="${FMT.coord(ang)}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="6" style="fill:var(--ink)"/>
</svg><div class="sp-labs t-label"><span>Cheap</span><span>Fair</span><span>Expensive</span></div>
    <figcaption class="mini" style="text-align:center">Price <b class="num">${inr(s.close, 0)}</b> is <b>${FMT.pctPlain(Math.abs(gap), 0)} ${gap < 0 ? "below" : "above"}</b> the consensus fair value <b class="num">${inr(v.fair, 0)}</b> – ${word}.</figcaption></figure>`;
}
// 25a) bar race on the stock page – this stock and its biggest sector peers, sales year by year (rank, initials, Play, year slider)
let RACE = { sym: null, year: null, timer: null, loading: false };
function racePeers(s) { const L = peerSet(s).list; return L.length ? [s].concat(L.slice(0, 7)) : []; }
function raceHTML(s) {
  const peers = racePeers(s); if (peers.length < 3) return "";
  const ready = peers.every(p => p.fund && p.fund.history && p.fund.history.revenue_cr);
  if (!ready)        // the peers' files load only when you ask (a stock page fetches only its own file)
    return `<section class="panel" id="race"><h2>Sales race</h2><p class="sub">${esc(s.name)} and the ${peers.length - 1} biggest companies in its sector, by yearly sales.</p>
      <div class="btnrow"><button class="act" type="button" data-act="race">${RACE.loading ? "Loading…" : "Play the race"}</button></div></section>`;
  const years = [...new Set(peers.flatMap(p => Object.keys(p.fund.history.revenue_cr)))].sort();
  if (years.length < 2) return "";
  if (RACE.sym !== s.symbol) { RACE.sym = s.symbol; RACE.year = years[years.length - 1]; }
  const y = years.includes(RACE.year) ? RACE.year : years[years.length - 1];
  const rows = peers.map(p => ({ s: p, v: p.fund.history.revenue_cr[y] })).filter(r => r.v != null).sort((a, b) => b.v - a.v);
  const mx = Math.max(...rows.map(r => r.v), 1);
  return `<section class="panel" id="race"><h2>Sales race</h2><p class="sub">${esc(s.name)} (blue) and the biggest companies in its sector, by yearly sales (₹ crore, one scale). Press Play.</p>
    <p class="t-label sub">${peers.map(p => `<b>${esc(initials(p.name))}</b> ${esc(p.symbol)}`).join(" · ")}</p>
    <div class="race" data-chart="Sales race" data-direct="1" data-nodraw style="height:${rows.length * 32}px">${peers.map(p => { const i = rows.findIndex(r => r.s === p), r = rows[i];
      return `<div class="rrow${p === s ? " me" : ""}" data-race="${esc(p.symbol)}" style="transform:translateY(${(i < 0 ? rows.length : i) * 32}px)${i < 0 ? ";opacity:0" : ""}"><span class="t-label num">${i < 0 ? "–" : i + 1}</span><span class="rbadge t-label" title="${esc(p.name)}" aria-label="${esc(p.name)}">${esc(initials(p.name))}</span>
        <span class="rtrack"><i class="rcbar" data-label="${esc(p.symbol)}" style="width:${r ? FMT.coord(r.v / mx * 100) : 0}%"></i></span><span class="rval t-label num">${r ? FMT.cr(r.v, 0) : ""}</span></div>`; }).join("")}</div>
    <div class="btnrow"><button class="act" type="button" data-act="race">${RACE.timer ? "Pause" : "Play"}</button>
      <label class="fl" style="flex:1">Year FY${y.slice(2, 4)}<input type="range" min="0" max="${years.length - 1}" value="${years.indexOf(y)}" data-raceyear="${esc(years.join(","))}" aria-label="Year"></label></div></section>`;
}
function raceStep(s, years) {
  const i = years.indexOf(RACE.year); RACE.year = years[(i + 1) % years.length];
  if (RACE.year === years[years.length - 1]) { clearInterval(RACE.timer); RACE.timer = null; }      // one lap, then stop on the latest year
  const box = document.getElementById("race"); if (box) box.outerHTML = raceHTML(s); else { clearInterval(RACE.timer); RACE.timer = null; }
}
// 25d) runners on a track (sector pages) – the sector's 10 biggest companies run to their Core score (0–100)
function runnersHTML(stocks) {
  const L = stocks.filter(s => s.cr && s.cr.sc != null && s.mcap_cr).sort((a, b) => b.mcap_cr - a.mcap_cr).slice(0, 10); if (L.length < 3) return "";
  return `<section class="panel"><h2>Core score race</h2><p class="sub">The 10 biggest companies in this sector, placed by their Core score (0 at the start line, 100 at the finish).</p>
    <div class="track${MOTION() ? " pre" : ""}" data-chart="Core score race" data-direct="1" data-nodraw data-runners>${L.map(s => `<div class="lane"><span class="lane-l t-label">${esc(s.symbol)}</span>
      <span class="runner t-label" title="${esc(s.name)}" style="left:${FMT.coord(30 + s.cr.sc * .66)}%" data-label="${esc(s.symbol)}">${esc(initials(s.name))}</span><span class="t-label num" style="position:absolute;right:0;top:8px">${FMT.num(s.cr.sc, 0)}</span></div>`).join("")}</div></section>`;
}
// after every render: the effects that need the DOM
function delightAfter(root) {
  document.documentElement.classList.toggle("nomotion", !MOTION());
  rollIn(root); drawIn(root); scratchInit(root);
  if (MOTION()) requestAnimationFrame(() => requestAnimationFrame(() => {
    root.querySelectorAll(".sring[data-ring] .sr-v").forEach(c => c.setAttribute("stroke-dashoffset", c.closest(".sring").dataset.ring));
    root.querySelectorAll(".speedo .sp-n").forEach(n => { n.style.transform = `rotate(${n.dataset.ang}deg)`; });
    root.querySelectorAll(".jar.pre, .track.pre").forEach(x => x.classList.remove("pre"));
  }));
}
document.addEventListener("pointermove", tiltMove, { passive: true });
document.addEventListener("pointerleave", tiltEnd, true); document.addEventListener("pointerup", tiltEnd, true); document.addEventListener("pointercancel", tiltEnd, true);
document.addEventListener("pointerout", e => { if (e.target.matches && e.target.matches("[data-tilt]") && !e.target.contains(e.relatedTarget)) tiltEnd(e); }, true);
document.addEventListener("pointerdown", e => { ripple(e); deckDrag(e); const t = e.target.closest && e.target.closest("[data-ticker]"); if (t) t.classList.toggle("paused"); }, true);
// ---------- review #66: More → Display – theme, mode, auto theme, colour layers, P&L colours ----------
function themePanel() {
  const M = THM(), cur = themePick(), now = themeNow();
  const seg = (key, curv, opts, label) => `<div class="gi"><span class="gt">${label}</span><div class="segpick" role="group" aria-label="${esc(label)}">${opts.map(([v, n]) =>
    `<button class="chip${curv === v ? " on" : ""}" type="button" data-act="skinpref" data-skinpref="${key}" data-v="${v}" aria-pressed="${curv === v}">${n}</button>`).join("")}</div></div>`;
  const tog = (key, label, sub, def = "1") => `<label class="gi sw" style="margin:0"><input type="checkbox" data-pref="${key}"${prefGet(key, def) === "1" ? " checked" : ""}><span class="gt">${label}<span class="gs">${sub}</span></span></label>`;
  const tile = k => { const t = M.themes[k]; if (!t) return ""; const [bg, card, acc, up, dn] = t.sw;
    return `<button class="thtile" type="button" data-act="skinpref" data-skinpref="${TH.key}" data-v="${k}" data-th-k="${k}" aria-pressed="${cur === k}" aria-label="${esc(t.n)} theme">
      <span class="thmini" style="background:${bg}"><i style="background:${card}"></i><i style="background:${acc};width:60%"></i><span><b style="color:${up}">▲</b><b style="color:${dn}">▼</b></span></span>
      <span class="t-label">${t.star ? "★ " : ""}${esc(t.n)}</span></button>`; };
  const opts = M.groups.flatMap(([, ks]) => ks).map(k => `<option value="${k}">${esc((M.themes[k] || {}).n || k)}</option>`).join("");
  const sel = (key, v, label) => `<label class="fl">${label}<select data-thsel="${key}">${opts.replace(`value="${v}"`, `value="${v}" selected`)}</select></label>`;
  const auto = prefGet(TH.auto, "off");
  return `<div class="themepick">
    ${M.groups.map(([g, ks]) => `<h4 class="thgl t-label">${esc(g)}${g === "Recommended" ? " ★" : ""}</h4><div class="thgal" role="group" aria-label="${esc(g)} themes">${ks.map(tile).join("")}</div>`).join("")}
    <p class="t-label sub">${esc((M.themes[cur] || {}).d || "")}</p>
    <div class="glist">
    ${seg(TH.glow, prefGet(TH.glow, "0"), [["0", "Off"], ["1", "Subtle"], ["2", "Full"]], "Glow")}
    ${seg(TH.auto, auto, [["off", "Off"], ["time", "6 am–6 pm IST"], ["system", "Follow my phone"]], "Auto day / night")}
    ${auto !== "off" ? `<div class="gi">${sel(TH.day, prefGet(TH.day, M.day || "G"), "Day theme")}${sel(TH.night, prefGet(TH.night, M.night || "B"), "Night theme")}</div>` : ""}
    ${tog(TH.hc, "High contrast", "pure black and white, brighter gains and falls, thicker lines – overrides any theme", "0")}
    ${tog(SKIN.a, "Colour per section", "each section gets its theme's own colour")}
    ${tog(SKIN.c, "Sector colours", "one fixed colour per sector – stripes on stock cards, sector chips and charts")}
    ${seg(SKIN.cb, prefGet(SKIN.cb, "0"), [["0", "Green / Red"], ["1", "Blue / Orange"]], "Profit / loss colours")}
    </div><p class="t-label sub">${now !== cur ? `Now showing ${esc((M.themes[now] || {}).n || now)} (${prefGet(TH.hc, "0") === "1" ? "high contrast" : "auto day / night"}). ` : ""}${glowNow() === "0" && prefGet(TH.glow, "0") !== "0" ? "Glow is off while Calm mode or Reduce motion is on. " : ""}▲ and ▼ always show the direction, so colour is never the only signal. Saved in this browser and in Backup / Restore.</p></div>`;
}
// ---------- review #67 A: the Market redesign – index tiles, the mood gauge, sector bars from a centre line, money tiles ----------
const MOOD_COLS = [[24, "--d-blue"], [44, "--d-teal"], [55, "--ink-3"], [75, "--d-gold"], [100, "--d-coral"]];   // decorative – never the P&L green/red
// review #69: always all four parts in the same order – a page built before #69 (or a part that wasn't sent) still gets its row
const MOOD_PARTS = [["breadth", "Breadth – share of stocks up today"], ["above200", "Share above the 200-day average"], ["vix", "India VIX vs its 1-year range (inverted)"], ["trend", "Nifty 50 vs its 50- and 200-day averages"]];
const moodParts = md => MOOD_PARTS.map(([k, n]) => (md.parts || []).find(p => p.key === k) || { key: k, name: n, score: null, why: "no data tonight" });
function moodGauge(md) {
  if (!md || md.score == null) return `<section class="panel"><h2>Market mood ${ib("market_mood")}</h2><p class="sub">Not enough history yet to scale the four parts.</p></section>`;
  const arc = (a0, a1, col) => { const p = a => [100 + 78 * Math.cos(Math.PI * (1 - a / 100)), 100 - 78 * Math.sin(Math.PI * (1 - a / 100))].map(FMT.coord).join(" ");
    return `<path d="M ${p(a0)} A 78 78 0 0 1 ${p(a1)}" style="fill:none;stroke:var(${col})" stroke-width="14"/>`; };
  let a0 = 0; const arcs = MOOD_COLS.map(([top, c]) => { const r = arc(a0 + (a0 ? 0.6 : 0), top, c); a0 = top; return r; }).join("");
  const ang = -90 + md.score / 100 * 180;
  return `<section class="panel mood"><h2>Market mood ${ib("market_mood")}</h2>
    <figure class="speedo" data-chart="Market mood" data-direct="1" data-nodraw><svg viewBox="0 0 200 112" role="img" aria-label="Market mood ${FMT.num(md.score, 0)} of 100 – ${esc(md.label)}">${arcs}
      <line class="sp-n" x1="100" y1="100" x2="100" y2="34" style="stroke:var(--ink);transform:rotate(${MOTION() ? -90 : FMT.coord(ang)}deg)" data-ang="${FMT.coord(ang)}" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="100" r="6" style="fill:var(--ink)"/></svg>
      <div class="sp-labs t-label"><span>Fearful</span><span>Neutral</span><span>Greedy</span></div>
      <figcaption class="mline" style="text-align:center"><b class="t-number-lg num" data-label="Market mood">${FMT.num(md.score, 0)}</b> <b>${esc(md.label)}</b> <span class="sub">of 100</span>${md.used < md.of ? `<br><span class="t-label sub mpused">Mood from ${FMT.count(md.used)} of ${FMT.count(md.of)} parts tonight</span>` : ""}</figcaption></figure>
    <details><summary>The four parts</summary><div class="kv2 noterm">${moodParts(md).map(p => p.score == null
      ? `<span>${esc(p.name)} <span class="sub">– ${esc(p.why || "not enough history yet")}</span></span><b class="sub">not scored</b>`
      : `<span>${esc(p.name)} <span class="sub">– ${p.value != null ? esc(FMT.num(p.value, 1) + " " + p.unit) : "–"}${p.days ? ` · vs ${FMT.count(p.days)} days` : ""}</span></span><b class="num">${FMT.num(p.score, 0)}</b>`).join("")}</div>
      <p class="mini sub">${esc(md.note)} Labels: 0–24 Fearful · 25–44 Cautious · 45–55 Neutral · 56–75 Greedy-ish · 76–100 Greedy. <a href="#/learn/market_mood">How it's worked out →</a></p></details>
    ${guidePanel("mood", md)}</section>`;
}
function mktTop(m, v) {
  const I = Object.fromEntries((m.indices || []).map(x => [x.id, x]));
  const tile = (id, big) => { const x = I[id]; if (!x) return ""; const p = pctOf(x, v);
    return `<div class="itile${big ? " big" : ""}"><span class="t-label">${esc(x.name)}</span>${lvlNum(x.pct, FMT.num(x.close, 0), "num t-number-lg")}${chgPill(p, 2)}</div>`; };
  const tiles = `<div class="itiles" role="list" aria-label="Indices">${tile("NIFTY 50", 1)}${tile("NIFTY BANK", 1)}${tile("NIFTY 500")}${tile("NIFTY MIDCAP 150")}${tile("NIFTY SMALLCAP 250")}</div>`;
  const sec = (m.sectors || []).filter(x => pctOf(x, v) != null).sort((a, b) => pctOf(b, v) - pctOf(a, v));
  const mx = Math.max(1e-9, ...sec.map(x => Math.abs(pctOf(x, v))));
  const dbars = sec.length ? `<section class="panel"><h2>Sectors ${v === "day" ? "today" : v === "week" ? "this week" : "this month"}</h2>
    <div class="dbars" data-chart="Sector moves" data-direct="1">${sec.map(x => { const p = pctOf(x, v), w = FMT.coord(Math.abs(p) / mx * 50);
      return `<div class="dbar"><span class="t-label">${x.key && SECT[x.key] ? `<a href="#/sector/${encodeURIComponent(x.key)}">${esc(x.name)}</a>` : esc(x.name)}</span><span class="dtrack"><i class="${FMT.cls(p)}" data-v="${p}" style="${p >= 0 ? "left:50%" : `left:${FMT.coord(50 - Math.abs(p) / mx * 50)}%`};width:${w}%"></i></span><span class="num ${FMT.cls(p)}">${FMT.arrow(p)} ${FMT.pct(p, 1)}</span></div>`; }).join("")}</div>
    <p class="t-label sub">Bars grow left (fell) or right (rose) from the centre line, all on one scale.</p></section>` : "";
  const ft = (m.flows || {}).today;
  const money = ft ? `<div class="mtiles"><div class="itile"><span class="t-label">FII / FPI net ${ib("fii")}</span><span class="num t-number ${FMT.cls(ft.fii_net)}">${FMT.arrow(ft.fii_net)} ${FMT.moneySigned(ft.fii_net, 0)} cr</span></div>
    <div class="itile"><span class="t-label">DII net</span><span class="num t-number ${FMT.cls(ft.dii_net)}">${FMT.arrow(ft.dii_net)} ${FMT.moneySigned(ft.dii_net, 0)} cr</span></div></div>` : "";
  return tiles + (v === "day" ? moodGauge(m.mood) : "") + dbars + money;
}
// ---------- review #67 C hook: "What now?" panels – the texts come only from S.guide (pipeline/guidance.py); none = nothing shown ----------
function guidePanel(key, ctx) { return typeof guideText === "function" ? guideText(key, ctx) : ""; }
const GUIDE = () => (S.rules || {}).guidance || null;
// which case of a rule applies (null = no panel). The numbers come from the rule file too (S.rules.guidance).
const GUIDE_CASE = {
  mood: md => md && md.label ? (md.label === "Greedy" ? "greedy" : md.label === "Fearful" ? "fearful" : "neutral") : null,
  drawdown: d => d && ["correction", "bear", "severe"].includes(d.stage) ? d.stage : null,
  concentration: c => c && c.over ? "over" : null,
  taxfree: c => c && c.left > 0 && c.unbooked > 0 && c.daysLeft >= 0 && c.daysLeft <= GUIDE().taxfree_days ? "room" : null,
  exit: e => e && (e.level === "red" || e.hard) ? "review" : null,
  cheap: s => s && s.mos != null && s.mos > 0 && s.quality != null && s.quality < GUIDE().quality_buy ? "low_quality" : null,
  watchmove: pc => pc != null && pc >= GUIDE().watch_big ? "big_up" : null,
  experts: n => n ? "scenarios" : null,
};
function guideText(key, ctx, extra) {
  const G = GUIDE(), R = G && G.rules[key]; if (!R || !GUIDE_CASE[key]) return "";
  const c = GUIDE_CASE[key](ctx); if (!c || !R.cases[c]) return "";
  return `<aside class="guide" data-guide="${key}" data-case="${c}"><p class="t-label gwhat">What now?</p><p class="mline">${esc(R.cases[c])}${extra || ""}</p>
    <p class="t-label sub">${esc(G.not_advice)} <a href="#/learn/${esc(R.learn)}" title="${esc(R.why)}">Why?</a>${R.link ? ` · <a href="${esc(R.link)}">The plan</a>` : ""}</p></aside>`;
}
// ---------- review #67 A: Portfolio and Watchlist cards ----------
const PSORT_KEY = "screener.psort";
const PSORT = () => prefGet(PSORT_KEY, "gain");
const initBadge = (s, sym) => `<span class="ibadge t-label" data-sk="${esc(skOf(s))}" aria-hidden="true">${esc((s ? s.name : sym).replace(/^(the )/i, "")[0] || "?")}</span>`;
function miniLine(sym, days = 63) {
  const h = histOf(sym); if (!h || !h.close) return "";
  const v = h.close.slice(-days).filter(x => x != null); if (v.length < 10) return "";
  const W = 96, H = 28, lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => `${FMT.coord(i * W / (v.length - 1))},${FMT.coord(H - 2 - (y - lo) / ((hi - lo) || 1) * (H - 4))}`).join(" ");
  return `<figure class="mini3" data-chart="3-month price" data-nodraw><svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline data-series="3 months" fill="none" style="stroke:var(--sec, var(--accent))" stroke-width="1.6" points="${pts}"/></svg><figcaption class="t-label sub">${kw("3 months", "var(--sec, var(--accent))")}</figcaption></figure>`;
}
function swipeWatch(e) {               // review #67 / #63: swipe a Watchlist card – left = remove (Undo), right = move to a bucket
  const card = e.target.closest && e.target.closest("#screen .wlist .urow[data-open]"); if (!card || e.target.closest("button, a, input, select")) return;
  const x0 = e.clientX, y0 = e.clientY; let dx = 0, live = false;
  const mv = ev => { dx = ev.clientX - x0; if (!live && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(ev.clientY - y0)) live = true;
    if (live && MOTION()) card.style.transform = `translateX(${FMT.coord(dx)}px)`; };
  const up = () => { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
    card.style.transform = ""; if (!live) return; card.dataset.swiped = "1"; setTimeout(() => delete card.dataset.swiped, 400); if (Math.abs(dx) < 90) return;
    const sym = card.dataset.open;
    if (dx < 0) { const b = document.createElement("button"); b.dataset.act = "unsave"; b.dataset.sym = sym; userAction(b, null); }
    else saveSheet(sym); };
  document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
}
document.addEventListener("pointerdown", swipeWatch, true);
// ---------- review #59: More → Checks (every job's status) ----------
const CK_ICON = { ok: "✅", skipped: "⏭", due: "🟡", lapsed: "🔴", failed: "🔴", off: "⏸" };
const CK_WORD = { ok: "On time", skipped: "Skipped", due: "Due today", lapsed: "Lapsed", failed: "Failed", off: "Off (by choice)" };
const ckWhen = t => t ? `${dateTxt(t.slice(0, 10))}${t.length > 10 ? ", " + t.slice(11, 16) : ""}` : "never";
function checksHomeLine() {
  const c = S.checks; if (!c || !(c.lapsed || []).length) return "";
  const r = c.rows.filter(x => c.lapsed.includes(x.job));
  return `<p class="mline ckline">🔴 ${esc(r[0].name)}: ${esc(r[0].text)}${r.length > 1 ? ` (+${r.length - 1} more)` : ""} – see <a href="#/checks">More → Checks</a></p>`;
}
function checksScreen() {
  const c = S.checks;
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>Checks</h1></div>
    <p class="sub">Every scheduled job: when it last ran, when it's next due, and whether it's on time. Updated by each night's run${c ? ` (${esc(ckWhen(c.at))})` : ""}.</p>
    ${goldenTop()}
    ${(L => L.length ? `<section class="panel noterm cknotes"><h2>Needs a look</h2><ul class="plain">${L.map(x => `<li>${x.sev === "red" ? "🔴" : "🟡"} ${esc(x.text)}</li>`).join("")}</ul></section>` : "")(needsLook())}
    ${(S.maint || []).length || (S.public_link && S.public_link.warn) ? `<section class="panel noterm"><h2>Maintenance notes</h2><ul class="plain">${[...(S.maint || []), ...(S.public_link && S.public_link.warn ? [S.public_link.warn] : [])].map(m => `<li>${esc(m)}</li>`).join("")}</ul><p class="mini sub">Shown on Home only with Settings → Show maintenance notes.</p></section>` : ""}
    ${c ? `<section class="panel noterm"><div class="cklist">${c.rows.map(r => `<div class="ckrow ck-${ckNow(r).status}">
        <p class="mline"><b>${CK_ICON[ckNow(r).status] || "•"} ${esc(r.name)}</b> <span class="sub">– ${esc(r.what)}</span></p>
        <p class="mini">${ckNow(r).status === "off" && /^Off \(by choice\)/.test(ckNow(r).text) ? esc(ckNow(r).text) : `<b>${esc(CK_WORD[ckNow(r).status] || ckNow(r).status)}</b>: ${esc(ckNow(r).text)}`}</p>
        <p class="mini sub">Last run ${esc(ckWhen(r.last))}${r.result ? ` · ${r.result === "ok" ? "✅" : r.result === "skipped" ? "⏭" : "❌"} ${esc(r.result)}` : ""}${r.minutes ? ` · ${FMT.num(r.minutes, 1)} min` : ""}${r.next ? ` · next due ${esc(dateTxt(r.next))}` : ""}</p>
        ${["lapsed", "failed", "due"].includes(ckNow(r).status) ? `<p class="mini">To run it now: ${esc(r.action)}</p>` : ""}</div>`).join("")}</div></section>`
      : `<p class="empty">No job status yet – it appears after the next nightly update.</p>`}
    ${stagesHTML(S.stages)}
    ${minutesHTML(S.minutes)}
    <p class="sub">Nightly jobs are due on NSE trading days only. Personal use only, not investment advice.</p>`;
}
// review #88 B4: tonight's stage times vs their budgets (amber = over budget; a missed publish shows red on the Nightly row above)
const ST_ICON = { ok: "✅", over: "🟡", skipped: "⏭", failed: "🔴" };
function stagesHTML(st) {
  if (!st || !(st.stages || []).length) return "";
  const over = st.stages.filter(r => r.status === "over").length;
  return `<section class="panel noterm" id="ckstages"><h2>Tonight's stage times</h2>
    <p class="mline"><b>${st.published === false ? "🔴 Not published" : "✅ Published"}</b> <span class="sub">· job ${FMT.num(st.total, 0)} min so far, guard ${FMT.num(st.guard, 0)} min, limit ${FMT.num(st.limit, 0)} min${over ? ` · ${over} over budget` : ""}</span></p>
    <div class="cklist">${st.stages.map(r => `<div class="ckrow ck-st-${esc(r.status)}"><p class="mline"><b>${ST_ICON[r.status] || "•"} ${esc(r.name)}</b> <span class="num">${FMT.num(r.min, 1)} min</span>${r.budget != null ? ` <span class="sub">of ${FMT.num(r.budget, 0)}</span>` : ""}</p>${r.note ? `<p class="mini sub">${esc(r.note)}</p>` : ""}</div>`).join("")}</div>
    <p class="mini sub">Past the guard every remaining extra is skipped and the page publishes with what is ready; skipped work carries on the next night.</p></section>`;
}
// review #88 C: GitHub Actions minutes this month (the repository is private: the free plan includes a monthly allowance)
function minutesHTML(m) {
  if (!m || !m.month) return "";
  const pct = m.allowance ? m.projected / m.allowance * 100 : null;
  return `<section class="panel noterm" id="ckminutes"><h2>GitHub Actions minutes · ${esc(m.month_label || m.month)}</h2>
    <p class="mline"><b class="num">${FMT.count(Math.round(m.used))}</b> min used so far <span class="sub">· projected ${FMT.count(Math.round(m.projected))} for the month${m.allowance ? ` of ${FMT.count(m.allowance)} included (${FMT.num(pct, 0)}%)` : ""}</span></p>
    ${pct != null && pct >= 80 ? `<p class="mline">${pct >= 100 ? "🔴" : "🟡"} ${pct >= 100 ? "On course to run out this month" : "Close to the monthly allowance"} – see docs/actions-minutes.md.</p>` : ""}
    <div class="cklist">${(m.workflows || []).slice(0, 12).map(w => `<div class="ckrow"><p class="mline"><b>${esc(w.name)}</b> <span class="num">${FMT.count(Math.round(w.minutes))} min</span> <span class="sub">· ${FMT.count(w.runs)} run${w.runs === 1 ? "" : "s"}</span></p></div>`).join("")}</div>
    <p class="mini sub">${esc(m.note || "")}</p></section>`;
}
// ---------- review #59: Alerts – one place for everything that needs your eyes (bell in the top bar) ----------
const AL_SEEN = "screener.alerts.seen.v1", AL_HIST = "screener.alerts.hist.v1";
const alGet = k => { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } };
const alPut = (k, o) => { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) {} };
function alertItems() {
  const out = [], add = (id, group, sev, what, since, why, todo, href) => out.push({ id, group, sev, what, since, why, todo, href });
  const c = S.checks;
  USER.watch.forEach(w => { const sx = BY[w.sym], c = sx && sx.vc; if (!c || c[0] <= w.saved) return;            // #83 M7: a saved stock's verdict changed
    add("wlv:" + w.sym + ":" + c[0], "stocks", "yellow", `${sx.name}: ${thenNowText(w, sx)}`, c[0], c[4] || "reason not recorded", "Open the stock – nothing is changed for you.", stockHref(w.sym)); });
  USER.watch.forEach(w => { const sx = BY[w.sym]; if (!sx || !sx.stc) return;                                        // #86 D2: the story changed
    add("story:" + w.sym + ":" + sx.stc[0], "stocks", "yellow", `${sx.name}: Company Story changed – ${sx.stc[1]}`, sx.stc[0], "A new filing changed the story.", "Open the stock – Summary → Company Story.", stockHref(w.sym)); });
  [...new Set([...USER.watch.map(w => w.sym), ...USER.tx.map(t => t.sym)])].forEach(sym => { const sx = BY[sym]; if (!sx || !sx.polf) return;   // #90 A6: Look closer
    add("polf:" + sym + ":" + sx.polf.ids.join(","), "stocks", "yellow", `${sx.name}: 🔎 Look closer – ${sx.polf.why}`, null, "Our verdict and recent sector policies at the money stage disagree. Not in the score.", "Open the stock – Summary → Policy.", stockHref(sym)); });
  if (isRebalDay() && USER.tx.length) add("rebal:" + TODAY, "mine", "yellow", "Rebalance day – your checklist is on Home and Portfolio", TODAY,   // review #79 I5
    "Once a year you check each portfolio against its goal.", "Open Portfolio → What to do.", "#/portfolio");
  (c && c.rows || []).filter(r => ["lapsed", "failed"].includes(ckNow(r).status)).forEach(r =>
    add("job:" + r.job + ":" + (r.next || r.last || ""), "system", "red", `${r.name}: ${ckNow(r).text}`, r.last ? r.last.slice(0, 10) : null,
      "Until it runs, " + r.what + " may be out of date.", r.action, "#/checks"));
  (c && c.rows || []).filter(r => r.status === "due" && r.job === "nightly" && new Date(Date.now() + 5.5 * 3600e3).getUTCHours() >= 23).forEach(r =>
    add("late:" + r.job, "system", "yellow", `${r.name} still hasn't finished tonight`, null, "It usually ends by 11:30 PM IST.", r.action, "#/checks"));
  const st = S.trade_date ? UL.staleCheck(S.trade_date, Date.now(), S.holidays) : null;
  if (st && st.stale) add("stale:" + S.trade_date, "system", "red", `Prices are ${st.missed + 1} days old – the nightly update didn't run`, S.trade_date,
    "Every number on the page is from " + dateTxt(S.trade_date) + ".", "Actions → Nightly screener update → Run workflow", "#/checks");
  if (S.selfaudit && S.selfaudit.red) add("selfaudit:" + S.trade_date, "system", "red", "A self-check failed tonight", S.trade_date, S.selfaudit.red, "Open the nightly report (Actions → Nightly screener update → the run → Summary)", "#/dataquality");
  if (S.db_rebuilt) add("rebuilt:" + S.trade_date, "system", "yellow", S.db_rebuilt.text, S.trade_date, "Some recent days come from Yahoo instead of NSE.", "Nothing to do – it settles over the next nights.", "#/dataquality");
  const dq = (S.dq || {}).check;
  if (dq && dq.total && dq.total.failed) add("dq:" + dq.date, "system", "red", `Data check found ${dq.total.failed} problem${dq.total.failed === 1 ? "" : "s"}`, dq.date,
    "A number on the page may not match its source or its formula.", "Open More → Data quality; the QA team files and fixes each one.", "#/dataquality");
  ((dq && dq.bugs_open) || []).filter(b => /🔴|🟠/.test(b.sev)).forEach(b => add("bug:" + b.id, "system", b.sev.includes("🔴") ? "red" : "yellow",
    `Open bug: ${b.title}`, null, b.status, "Ask Claude Code to run qa-fixer on it.", "#/dataquality"));
  (S.warnings || []).filter(w => /not reachable|no answer|could not be (downloaded|refreshed)|failed/i.test(w)).slice(0, 4).forEach(w =>
    add("src:" + w.slice(0, 60), "system", "yellow", w, S.trade_date, "The last good data is kept until the source answers again.", "Usually nothing – it retries every night.", "#/checks"));
  const sp = S.spend; if (sp && sp.usd >= (sp.warn || 36) * 0.9) add("spend:" + (sp.month || ""), "system", sp.usd >= (sp.stop || 40) ? "red" : "yellow",
    `Claude spend this month $${FMT.num(sp.usd, 2)} (warn at $${sp.warn || 36}, stop at $${sp.stop || 40})`, null, "Paid features pause at the stop line.", "Check logs/api_usage on main; switch features off in the repo variables if needed.", "#/checks");
  if (MAINT() && S.public_link && S.public_link.warn) add("token:" + S.public_link.warn.slice(0, 40), "system", "yellow", S.public_link.warn, null, "The public link stops updating when the token expires.", "GitHub → Settings → Developer settings → tokens → renew SITE_DEPLOY_TOKEN", "#/checks");
  // your stocks – computed here from your own lists (never published)
  const mine = new Set([...(USER.watch || []).map(w => w.sym), ...(USER.tx || []).map(t => t.sym)]);
  mine.forEach(sym => { const s = BY[sym]; (s && s.nf || []).slice(0, 1).forEach(f => add("nf:" + sym + ":" + f.dt + ":" + f.rule, "stocks", f.sev === "red" ? "red" : "yellow",
    `${s.name}: ${f.via ? "group event at " + f.via : (NF_WORD[f.rule] || "important filing")}`, f.dt, f.t, "Open the stock's News tab and read the filing.", `#/stock/${encodeURIComponent(sym)}/news`)); });
  if ((USER.tx || []).length) { const x = exitSummary(); if (x.red) add("exit:" + S.trade_date + ":" + x.red, "stocks", "red", `${x.red} holding${x.red === 1 ? " has" : "s have"} an exit signal`, S.trade_date,
    "Rules v1.0 would sell these at the next close.", "Open Portfolio → filter red.", "#/portfolio?f=red"); }
  { const bk = STORE_OK ? UL.backupDue(USER, TODAY) : { due: false };      // review #64: the backup reminder, here too
    if (bk.due) add("backup:" + (USER.meta.lastBackup || "never") + ":" + (USER.meta.backupSnooze || ""), "stocks", "yellow",
      `Back up your Watchlist and Portfolio – ${bk.days != null ? `last backup ${bk.days} days ago` : "not backed up yet"}`, USER.meta.lastBackup,
      "They live only in this browser at this address; a backup file restores them anywhere.", "Open More → Settings → Backup / Restore.", "#/settings/backup"); }
  alertHitsNow().forEach(h => add("pa:" + h.text + ":" + PDAY, "stocks", "yellow", h.text, PDAY, "Your own price alert.", "Open the stock; change or delete the alert in the Watchlist.", "#/watchlist"));
  const rank = { red: 0, yellow: 1 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev] || String(b.since || "").localeCompare(String(a.since || "")));
}
function alertsState() {                                   // current items + resolved ones (cleared by themselves) of the last 7 days
  const now = Date.now(), items = alertItems(), hist = alGet(AL_HIST), ids = new Set(items.map(x => x.id));
  items.forEach(x => { hist[x.id] = { x, first: (hist[x.id] || {}).first || now, last: now }; });
  const resolved = Object.values(hist).filter(h => !ids.has(h.x.id) && now - h.last < 7 * 864e5);
  Object.keys(hist).forEach(k => { if (!ids.has(k) && now - hist[k].last >= 7 * 864e5) delete hist[k]; });
  alPut(AL_HIST, hist);
  const seen = alGet(AL_SEEN);
  return { items, resolved, seen, unseen: items.filter(x => !seen[x.id]).length };
}
function syncBell() {
  const b = document.getElementById("bellc"); if (!b) return;
  const n = alertsState().unseen; b.textContent = n > 99 ? "99+" : String(n); b.hidden = !n; bellWiggle(n);
  document.getElementById("bell").setAttribute("aria-label", n ? `Alerts – ${n} new` : "Alerts – all clear");
}
function alertsScreen() {
  const a = alertsState(), card = (x, done) => `<div class="alitem al-${x.sev}${a.seen[x.id] && !done ? " al-seen" : ""}">
      <p class="mline"><b>${x.sev === "red" ? "🔴" : "🟡"} ${esc(x.what)}</b>${x.since ? ` <span class="sub">– since ${esc(dateTxt(x.since))}</span>` : ""}</p>
      ${x.why ? `<p class="mini">Why it matters: ${esc(x.why)}</p>` : ""}
      ${done ? `<p class="mini sub">✅ Cleared by itself.</p>` : `<p class="mini">What to do: ${esc(x.todo)}${x.href ? ` · <a href="${esc(x.href)}">Open</a>` : ""}</p>
      ${a.seen[x.id] ? `<p class="mini sub">Seen</p>` : `<button class="act" type="button" data-act="alseen" data-id="${esc(x.id)}">Mark as seen</button>`}`}</div>`;
  const grp = (g, t) => { const l = a.items.filter(x => x.group === g); return l.length ? `<h3 class="gl">${t}</h3>${l.map(x => card(x)).join("")}` : ""; };
  return `<button class="back" type="button" data-back="#/home">${ic("back")} Back</button><div class="scr-h"><h1>Alerts</h1></div>
    ${a.items.length ? grp("system", "System") + grp("stocks", "Your stocks") : `<p class="empty">✅ All clear – last checked ${esc(S.checks ? ckWhen(S.checks.at) : dateTxt(S.trade_date))}.</p>`}
    ${a.resolved.length ? `<h3 class="gl">Resolved in the last 7 days</h3>${a.resolved.map(h => card(h.x, true)).join("")}` : ""}
    <p class="sub">System items come from the public job and check files; "Your stocks" is worked out in this browser from your own Watchlist and Portfolio – nothing is sent anywhere. Not investment advice.</p>`;
}
// review #74 (4): My Home – the cards in the user's order, any of them hidden (Settings → Personalise → My Home)
const HOME_CARDS = [["ticker", "Market ticker"], ["looks", "Needs a look, alerts, filings, backup reminder"], ["since", "Since you last visited"], ["exit", "Exit signals on your holdings"],
  ["ghosts", "Model portfolios"], ["mood", "Market mood line"], ["tiles", "Shortcuts (Search, Verdicts, Sectors, Discover)"], ["learn", "Quiz and fact card"]];
function homeLayout() { let o = null; try { o = JSON.parse(prefGet(PZ.home, "null")); } catch (e) {}
  const ids = HOME_CARDS.map(c => c[0]), order = (o && Array.isArray(o.order) ? o.order.filter(x => ids.includes(x)) : []).concat(ids.filter(x => !(o && Array.isArray(o.order) && o.order.includes(x))));
  return { order, hidden: new Set(o && Array.isArray(o.hidden) ? o.hidden : []) }; }
const saveHomeLayout = L => prefSet(PZ.home, JSON.stringify({ order: L.order, hidden: [...L.hidden] }));
// review #74 (9): how fresh the data is – from the viewer's clock and the NSE holiday list; tap → Checks
const NEXT_RUN = "18:47";                                             // the nightly's first try: 6:47 PM IST (13:17 UTC), Mon–Fri
const isTradingDay = d => { const wd = new Date(d + "T00:00:00Z").getUTCDay(); return wd > 0 && wd < 6 && !(S.holidays && S.holidays[d]); };
const nextDay = d => new Date(new Date(d + "T00:00:00Z").getTime() + 864e5).toISOString().slice(0, 10);
function freshness(nowMs = Date.now()) {
  const ist = new Date(nowMs + 5.5 * 3600e3), today = ist.toISOString().slice(0, 10), hm = ist.toISOString().slice(11, 16), d = S.trade_date;
  let nx = isTradingDay(today) && hm < NEXT_RUN ? today : nextDay(today); while (!isTradingDay(nx)) nx = nextDay(nx);
  const nightly = (S.checks && S.checks.rows || []).find(r => r.job === "nightly"), failed = nightly && ckNow(nightly).status === "failed";
  const late = isTradingDay(today) && hm >= "21:30" && d < today, st = d ? UL.staleCheck(d, nowMs, S.holidays) : { stale: false };
  const state = failed ? "failed" : (late || st.stale) ? "late" : !isTradingDay(today) ? "closed" : "fresh";
  const when = `${dShort(nx)} ${nx === today ? "" : ""}6:47 PM`.replace("  ", " ");
  const text = state === "failed" ? `${dShort(d)} close · the last update failed` : state === "late" ? `${dShort(d)} close · update late` : `${dShort(d)} close · next update ${nx === today ? "today 6:47 PM" : when}`;
  return { state, text, next: nx };
}
const freshPill = () => { if (!S.trade_date) return ""; const f = freshness(); return `<a class="fresh f-${f.state} t-label" href="#/checks" data-fresh="${f.state}" aria-label="Data freshness: ${esc(f.text)}">${esc(f.text)}</a>`; };
function homeScreen() {
  const L = homeLayout(), part = {
    ticker: () => tickerTape(), looks: () => banners() + alertBanner() + filingsLine() + cfNote() + backupReminder() + rebalCardHTML(),     /* review #79 I5, #81 A5 */
    since: () => sinceCard() + ([0, 1].includes(new Date(Date.now() + 5.5 * 3600e3).getUTCDay()) ? `<p class="t-label"><a href="#/week">Week in review ›</a></p>` : ""),
    exit: () => exitAlert(), ghosts: () => ghostsCard(), mood: () => moodLine(),
    tiles: () => `<div class="tiles">
      <a class="tile" href="#/search"><span class="ib2">${ic("search", "lg")}</span><span><span class="tt">Search stocks</span><span class="ts t-label">a name, or ready-made screens</span></span></a>
      <a class="tile" href="#/verdicts"><span class="ib2">${ic("verdict", "lg")}</span><span><span class="tt">Today's verdicts</span><span class="ts t-label">all ${FMT.count(S.stocks.length)} sorted into 5 groups</span></span></a>
      <a class="tile" href="#/sectors"><span class="ib2">${ic("sectors", "lg")}</span><span><span class="tt">Browse sectors</span><span class="ts t-label">banks, IT, pharma …</span></span></a>
      <a class="tile" href="#/discover"><span class="ib2">${ic("star", "lg")}</span><span><span class="tt">Discover</span><span class="ts t-label">swipe through Core 70+ stocks – for learning</span></span></a>
      ${S.experts ? `<a class="tile" href="#/experts"><span class="ib2">${ic("info", "lg")}</span><span><span class="tt">Experts' View</span><span class="ts t-label">today's world through investors' published principles</span></span></a>` : ""}
    </div>`, learn: () => quizCard() + scratchCard() };
  return `<header class="hello"><h1>${greeting()}</h1><div class="sub" id="asof">${esc(asofTxt())}</div></header>
    ${freshPill()}${firstNote()}${oldAddressBanner()}
    ${L.order.filter(k => !L.hidden.has(k)).map(k => `<div class="hcard-slot" data-home="${k}">${part[k]()}</div>`).join("")}`;
}

// ---------- 📊 Market tab (review #40): tonight's whole-market summary – NSE files first, anything else labelled ----------
// Tonight's snapshot is inside the page (S.market); older days load from data/market/<date>.json on the public link.
const MKT = { cache: {}, days: null, loading: null, failed: {} };   // review #43: each day's file is fetched at most once per visit
if (S.market && S.market.date) MKT.cache[S.market.date] = S.market;
function mktDays() {
  if (MKT.days || !SPLIT) return MKT.days || (S.market && S.market.date ? [S.market.date] : []);
  if (!MKT.loading) MKT.loading = fetch("data/market/index.json").then(r => r.ok ? r.json() : { days: [] }).then(j => { MKT.days = j.days || []; })
    .catch(() => { MKT.days = S.market && S.market.date ? [S.market.date] : []; }).finally(() => { MKT.loading = null; if (parseHash().name === "market") render(true); });
  return S.market && S.market.date ? [S.market.date] : [];
}
function mktLoad(d) {
  if (MKT.cache[d] || MKT.cache["__l" + d] || MKT.failed[d] || !SPLIT) return;
  MKT.cache["__l" + d] = 1;
  fetch(`data/market/${d}.json`).then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(j => { MKT.cache[d] = j; }).catch(e => { MKT.failed[d] = String(e && e.message || e); })   // remembered: never re-requested
    .finally(() => { delete MKT.cache["__l" + d]; if (parseHash().name === "market") render(true); });
}
const mHref = (d, v) => "#/market" + (d || v ? "?" + [d ? "d=" + d : "", v && v !== "day" ? "v=" + v : ""].filter(Boolean).join("&") : "");
const pctOf = (x, v) => v === "week" ? x.w1 : v === "month" ? x.m1 : x.pct;
function rangeBar(x) {
  if (x.low == null || x.high == null || x.high <= x.low) return "";
  const pos = v => Math.max(0, Math.min(100, (v - x.low) / (x.high - x.low) * 100));
  return `<div class="rangefig" data-chart="Day range" data-direct="1"><div class="rbar" aria-label="Day range ${FMT.num(x.low, 2)} to ${FMT.num(x.high, 2)}"><i data-series="Close" style="left:${FMT.coord(pos(x.close))}%"></i></div>
    <div class="rlab t-label sub"><span>low <span class="num">${FMT.num(x.low, 2)}</span></span><span>${kw("Close", "var(--ink)", { label: "close" })}</span><span>high <span class="num">${FMT.num(x.high, 2)}</span></span></div></div>`;
}
function moverRows(xs, v) {
  if (!xs || !xs.length) return `<p class="t-label sub">None tonight.</p>`;
  return `<div class="krows">${xs.map(x => { const tag = BY[x.s] ? "a" : "div";
    return `<${tag} class="krow"${BY[x.s] ? ` href="${stockHref(x.s)}"` : ""}><span class="kn">${esc(x.n || x.s)}<span class="km t-label"> · ${esc(x.s)}</span></span>
      <span class="kr">${chgPill(x.p, 2)}</span>${BY[x.s] ? qpSlot(x.s) : ""}<span class="km t-label"><span class="num">${FMT.money(x.c, 2)}</span>${x.vx != null && v === "day" ? ` · vol <span class="num">${FMT.times(x.vx, 1)}</span> usual` : ""}${x.d != null && v === "day" ? ` · delivery <span class="num">${FMT.pctPlain(x.d, 0)}</span>` : ""}</span></${tag}>`; }).join("")}</div>`;
}
function marketScreen(r) {
  const days = mktDays();
  const d = r.d || (S.market && S.market.date) || days[days.length - 1];
  const v = ["week", "month"].includes(r.v) ? r.v : "day";
  const m = d ? MKT.cache[d] : null;
  if (d && !m && !MKT.failed[d] && !(S.market && S.market.error && d === S.trade_date)) mktLoad(d);
  const i = days.indexOf(d), prev = i > 0 ? days[i - 1] : null, next = i >= 0 && i < days.length - 1 ? days[i + 1] : null;
  const picker = `<div class="mpick" role="group" aria-label="Which day">
      <a class="act icon" ${prev ? `href="${mHref(prev, v)}"` : `aria-disabled="true"`} aria-label="Previous trading day">${ic("back")}</a>
      ${days.length > 1 ? `<select data-mday aria-label="Pick a day">${days.slice().reverse().map(x => `<option value="${x}"${x === d ? " selected" : ""}>${dateTxt(x)}</option>`).join("")}</select>`
        : `<span class="t-label">${d ? dateTxt(d) : "–"}</span>`}
      <a class="act icon" ${next ? `href="${mHref(next, v)}"` : `aria-disabled="true"`} aria-label="Next trading day"><span style="display:inline-flex;transform:scaleX(-1)">${ic("back")}</span></a>
      <span class="mview">${[["day", "Day"], ["week", "Week"], ["month", "Month"]].map(([k, n]) => `<a class="chip${v === k ? " on" : ""}" href="${mHref(d === (S.market || {}).date ? null : d, k)}" aria-pressed="${v === k}">${n}</a>`).join("")}</span>
    </div>${SPLIT ? "" : `<p class="t-label sub">Offline copy: tonight only – open the link for older days.</p>`}`;
  const head = `<div class="scr-h"><h1>Market</h1><span class="sub">${d ? dateTxt(d) : ""}</span></div>${freshPill()}${picker}`;
  if (d && !m && (MKT.failed[d] || !SPLIT)) return head + `<p class="empty">No market summary saved for ${dateTxt(d)}.${SPLIT ? " Use ← → for another day." : " Offline copy: tonight only – open the link for older days."}</p>`;
  if (!m) return head + (S.market && S.market.error && (!r.d || r.d === S.trade_date) ? `<p class="empty">Tonight's market summary isn't available. The rest of the page is complete.</p>`
    : `<div class="skel" aria-label="Loading the market summary…"><i class="h"></i><i class="b"></i><i class="b"></i></div>`);
  const I = Object.fromEntries((m.indices || []).map(x => [x.id, x])), n50 = I["NIFTY 50"];
  const mc = UL.marketClosed(m.date, Date.now(), S.holidays);
  const vLabel = v === "week" ? "this week (5 trading days)" : v === "month" ? "this month (21 trading days)" : "today";
  // 1. today in 30 seconds
  const today = `<section class="tot today"${moodAttr(n50 ? n50.pct : null)}><h2>${v === "day" ? "Today in 30 seconds" : v === "week" ? "This week" : "This month"}</h2>
    <span class="t-label sub">${FMT.date(m.date)} · NSE close${mc ? ` · Market closed today (${esc(mc.name)})` : ""}</span>
    ${v === "day" ? (m.story || []).map((t, i) => `<p class="mline">${storyLine(t, (m.story_mv || [])[i])}</p>`).join("")
      : n50 ? `<p class="mline">Nifty 50 ${moveNum(pctOf(n50, v), FMT.pct(pctOf(n50, v), 1))} ${vLabel}; Bank Nifty ${I["NIFTY BANK"] ? moveNum(pctOf(I["NIFTY BANK"], v), FMT.pct(pctOf(I["NIFTY BANK"], v), 1)) : "–"}; Nifty 500 ${I["NIFTY 500"] ? moveNum(pctOf(I["NIFTY 500"], v), FMT.pct(pctOf(I["NIFTY 500"], v), 1)) : "–"}.</p>` : ""}</section>`;
  // 2. major indices
  const icard = x => `<div class="icard"${x.id === "INDIA VIX" ? ` data-vix="1"` : ""}><div class="ih"><span class="t-label">${esc(x.name)}${x.id === "INDIA VIX" ? ib("vix") : ""}</span>${chgPill(pctOf(x, v), 2)}</div>
      ${lvlNum(x.pct, FMT.num(x.close, 2), "t-number-lg")}${CH_OK() && x.id !== "INDIA VIX" ? `<a class="t-label ichart" href="#/chart/index/${chartSlug(x.id)}" data-iname="${esc(x.name)}">${ic("chart")} Chart</a>` : ""}
      ${v === "day" ? `<span class="t-label sub">${moveNum(x.pts, FMT.points(x.pts, 2))} pts</span>${rangeBar(x)}` : ""}
      <span class="t-label sub">1W <span class="num ${FMT.cls(x.w1)}">${FMT.pct(x.w1, 1)}</span> · 1M <span class="num ${FMT.cls(x.m1)}">${FMT.pct(x.m1, 1)}</span> · YTD <span class="num ${FMT.cls(x.ytd)}">${FMT.pct(x.ytd, 1)}</span></span>
      ${x.pe ? `<span class="t-label sub">P/E <span class="num">${FMT.ratio(x.pe, 1)}</span>${x.pe_med5 ? ` vs 5-yr median <span class="num">${FMT.ratio(x.pe_med5, 1)}</span> · <b class="band-${x.pe_band}">${x.pe_band}</b>${ib("peband")}` : ""}</span>` : ""}</div>`;
  const indices = `<section><h2 class="msec">Major indices</h2><div class="igrid">${(m.indices || []).map(icard).join("")}</div>
    <p class="t-label sub">Sensex is a BSE index – BSE's files can't be reached from the nightly, so it isn't shown.</p></section>`;
  // 3. sectors heat-map
  const sec = (m.sectors || []).filter(x => pctOf(x, v) != null);
  const tint = p => { const k = Math.min(1, Math.abs(p) / 3); return `background:color-mix(in srgb, ${p >= 0 ? "var(--gain)" : "var(--loss)"} ${FMT.coord(6 + k * 22)}%, var(--surface))`; };
  const best = sec.slice().sort((a, b) => pctOf(b, v) - pctOf(a, v));
  const sectors = sec.length ? `<section><h2 class="msec">Sectors</h2>
    <p class="t-label sub">Best: <b>${esc(best[0].name)}</b> <span class="num">${FMT.pct(pctOf(best[0], v), 1)}</span> · worst: <b>${esc(best[best.length - 1].name)}</b> <span class="num">${FMT.pct(pctOf(best[best.length - 1], v), 1)}</span></p>
    <div class="heat">${best.map(x => { const link = x.key && SECT[x.key]; const tag = link ? "a" : "div";
      return `<${tag} class="htile"${link ? ` href="#/sector/${encodeURIComponent(x.key)}"` : ""} style="${tint(pctOf(x, v))}"><span class="t-label">${esc(x.name)}</span><span class="num ${FMT.cls(pctOf(x, v))}">${FMT.arrow(pctOf(x, v))} ${FMT.pct(pctOf(x, v), 1)}</span></${tag}>`; }).join("")}</div></section>` : "";
  const secBars = sec.length ? `<details class="panel"><summary>Sectors, best to worst</summary>${hbars(best.map(x => ({ n: x.name, v: pctOf(x, v), sk: x.key && SECT[x.key] ? x.key : null, href: x.key && SECT[x.key] ? "#/sector/" + encodeURIComponent(x.key) : null })), "Sector moves")}</details>` : "";
  // 4. breadth
  const B = m.breadth || {}, A = B.all || {}, tot = (A.adv || 0) + (A.dec || 0) + (A.unch || 0);
  const w = k => tot ? FMT.coord((A[k] || 0) / tot * 100) : 0;
  const breadth = `<section class="panel"><h2>Market breadth ${ib("breadth")}</h2>
    <div class="adbar" aria-label="${A.adv} up, ${A.dec} down, ${A.unch} unchanged"><i class="up-b" style="width:${w("adv")}%"></i><i class="un-b" style="width:${w("unch")}%"></i><i class="dn-b" style="width:${w("dec")}%"></i></div>
    <div class="kv2"><span>Rose</span><b class="num up">${FMT.count(A.adv)}</b><span>Fell</span><b class="num down">${FMT.count(A.dec)}</b><span>Unchanged</span><b class="num">${FMT.count(A.unch)}</b>
      ${B.n500 ? `<span>Nifty 500: rose / fell</span><b class="num">${FMT.count(B.n500.adv)} / ${FMT.count(B.n500.dec)}</b>` : ""}
      <span>New 52-week highs / lows</span><b class="num">${FMT.count(B.highs)} / ${FMT.count(B.lows)}</b>
      ${B.above200 && B.above200.today != null ? `<span>Nifty 500 above 200-day average</span><b class="num">${FMT.pctPlain(B.above200.today, 0)}${B.above200.week_ago != null ? ` <span class="t-label sub">(a week ago ${FMT.pctPlain(B.above200.week_ago, 0)})</span>` : ""}</b>` : ""}</div>
    <p class="t-label sub">All NSE EQ/BE stocks from the bhavcopy${v !== "day" ? " – breadth is for the day shown" : ""}. Upper/lower circuit counts aren't in NSE's free end-of-day files, so they aren't shown.</p></section>`;
  // 5. gainers / losers (+ most active, volume shockers, 52-week highs / lows)
  const U = ["n50", "n500", "all"].includes(MSET.u) ? MSET.u : "n500";
  const src = v === "day" ? (m.movers || {}) : ((m.period || {})[v] || {});
  const blk = src[U] || { gainers: [], losers: [] };
  const L = ["active", "shockers", "highs52", "lows52"].includes(MSET.l) ? MSET.l : "active";
  const movers = `<section><h2 class="msec">Top gainers and losers <span class="t-label sub">${vLabel}</span></h2>${qpBar()}
    <div class="seg mseg" role="group" aria-label="Which stocks">${[["n50", "Nifty 50"], ["n500", "Nifty 500"], ["all", "All"]].map(([k, n]) => `<a href="#/market" data-mu="${k}" class="${U === k ? "on" : ""}">${n}</a>`).join("")}</div>
    ${U === "all" ? `<p class="t-label sub">All = the wider list, traded at least ${FMT.cr(((m.config || {}).liquid_cr) || 5, 0)} today (no illiquid jumps).</p>` : ""}
    <div class="mcols"><div><h3 class="minor">Gainers</h3>${moverRows(blk.gainers, v)}</div><div><h3 class="minor">Losers</h3>${moverRows(blk.losers, v)}</div></div>
    ${v === "day" ? `<div class="seg mseg" role="group" aria-label="More lists">${[["active", "Most active"], ["shockers", "Volume shockers"], ["highs52", "52-week highs"], ["lows52", "52-week lows"]].map(([k, n]) => `<a href="#/market" data-ml="${k}" class="${L === k ? "on" : ""}">${n}</a>`).join("")}</div>
      ${L === "shockers" ? `<p class="t-label sub">Volume at least ${FMT.times(((m.config || {}).shock_vol_x) || 3, 0)} its 20-day average with a move of at least ${FMT.pctPlain(((m.config || {}).shock_move_pct) || 3, 0)} ${ib("shocker")}</p>` : L === "active" ? `<p class="t-label sub">By traded value today.</p>` : ""}
      ${moverRows((m.movers || {})[L], v)}` : ""}</section>`;
  // 6. money flow
  const F = m.flows || {}, ft = F.today;
  // review #45: green/red bars by sign (gain/loss tokens, ▲/▼ + ₹ value), at most 48 px wide, fixed height; numbers only
  // until 5 days are recorded (two giant bars told nothing)
  const bars = (F.hist || []).length ? (() => { const h = F.hist.slice(-10);
    if (h.length < 5) return `<p class="t-label sub flowwait">Chart appears after 5 days (${h.length} of 5 recorded).</p>`;
    const mx = Math.max(1, ...h.flatMap(x => [Math.abs(x[1] || 0), Math.abs(x[2] || 0)]));
    const bar = (v, who) => `<div class="fb ${FMT.cls(v)} ${who}" data-series="${who.toUpperCase()}" title="${who.toUpperCase()} ${FMT.moneySigned(v, 0)} cr"><i data-v="${v || 0}" style="height:${FMT.coord(Math.abs(v || 0) / mx * 100)}%"></i><span class="t-label">${FMT.arrow(v)} ${FMT.moneySigned(v, 0)}</span></div>`;
    return `<figure class="flowfig" data-chart="FII vs DII" data-shared-scale="1">${ktitle(`${kw("FII", "var(--ink-2)")} vs ${kw("DII", "var(--ink-2)", { light: 1 })} <span class="t-label sub">(net, ₹ crore, one scale)</span>`, "p")}<div class="fbars" role="img" aria-label="FII and DII net, last ${h.length} days">${h.map(x => `<div class="fday"><div class="fpair">${bar(x[1], "fii")}${bar(x[2], "dii")}</div><span class="t-label sub">${FMT.num(+x[0].slice(8), 0)} ${FMT.month(x[0])}</span></div>`).join("")}</div>
      <figcaption class="t-label sub">Solid bar = FII, light bar = DII · green = net buying, red = net selling · ${h.length} days since ${dateTxt(h[0][0])}</figcaption></figure>`; })() : "";
  const flow = `<section class="panel"><h2>Money flow ${ib("fii")}</h2>
    ${ft ? `<div class="kv2"><span>FII / FPI net</span><b class="num ${FMT.cls(ft.fii_net)}">${FMT.moneySigned(ft.fii_net, 0)} cr</b><span>DII net</span><b class="num ${FMT.cls(ft.dii_net)}">${FMT.moneySigned(ft.dii_net, 0)} cr</b>
      ${F.mtd ? `<span class="kvw">Month to date (${F.mtd.days} day${F.mtd.days === 1 ? "" : "s"} recorded)</span><b class="num kvw">FII ${FMT.moneySigned(F.mtd.fii, 0)} · DII ${FMT.moneySigned(F.mtd.dii, 0)} cr</b>` : ""}</div>${bars}`
      : `<p class="t-label sub">FII/DII figures not available for this day.</p>`}
    <p class="t-label sub">${esc(F.source || "NSE provisional FII/DII cash figures")}. History builds up from ${F.since ? dateTxt(F.since) : "the first night"}.</p></section>`;
  // 7. your stocks today (only in this browser)
  const mine = (() => {
    if (m.date !== S.trade_date) return "";
    const syms = [...new Set([...USER.watch.map(x => x.sym), ...UL.portfolio(USER.tx, priceOf, PDAY).rows.map(x => x.sym)])].filter(x => BY[x] && BY[x].change_pct != null);
    const g = S.portfolio && (S.portfolio.stats || {}).series, gq = S.portfolio_v1_1 && (S.portfolio_v1_1.stats || {}).series;
    const day = ser => ser && ser.length >= 2 && ser[ser.length - 2].nav ? (ser[ser.length - 1].nav / ser[ser.length - 2].nav - 1) * 100 : null;
    const tri = ser => { if (!ser || ser.length < 2) return null; const a = (ser[ser.length - 2].b || {})["NIFTY 500 TRI"], b = (ser[ser.length - 1].b || {})["NIFTY 500 TRI"]; return a && b ? (b / a - 1) * 100 : null; };
    const zones = USER.watch.map(w => { const s = BY[w.sym]; if (!s || !SET.master) return null; const z = zoneFor(s); if (!z || z.zone == null || !s.prev_close) return null;
      const was = s.prev_close <= z.zone, now = s.close <= z.zone; return was !== now ? `${esc(s.name)} ${now ? "entered" : "left"} its buy zone (${FMT.money(z.zone, 0)})` : null; }).filter(Boolean);
    let seen = {}; try { seen = JSON.parse(localStorage.getItem("screener.exitseen") || "{}"); } catch (e) {}
    const P = UL.portfolio(USER.tx, priceOf, PDAY), now = {}, fresh = [];
    P.rows.forEach(rw => { const lv = exitFor(rw.sym, rw).level; now[rw.sym] = lv; if ((lv === "red" || lv === "orange") && seen[rw.sym] && seen[rw.sym] !== lv) fresh.push(`${EXIT_ICON[lv]} ${esc(BY[rw.sym] ? BY[rw.sym].name : rw.sym)}: new exit-check signal`); });
    try { localStorage.setItem("screener.exitseen", JSON.stringify(now)); } catch (e) {}
    if (!syms.length && day(g) == null) return `<section class="panel"><h2>Your stocks today</h2><p class="empty storehint">${STORE_HINT}</p></section>`;
    const sorted = syms.map(x => BY[x]).sort((a, b) => b.change_pct - a.change_pct);
    const row = s => `<a class="krow" href="${stockHref(s.symbol)}"><span class="kn">${esc(s.name)}</span><span class="kr">${chgPill(s.change_pct, 2)}</span></a>`;
    return `<section class="panel"><h2>Your stocks today</h2><p class="t-label sub">From your Watchlist and Portfolio – only in this browser.</p>
      ${sorted.length ? `<div class="mcols"><div><h3 class="minor">Best</h3><div class="krows">${sorted.slice(0, 3).map(row).join("")}</div></div><div><h3 class="minor">Worst</h3><div class="krows">${sorted.slice(-3).reverse().map(row).join("")}</div></div></div>` : ""}
      ${zones.concat(fresh).map(t => `<p class="mline">${t}</p>`).join("")}
      ${day(g) != null ? `<p class="t-label sub">Model portfolios today: v1.0 <span class="num ${FMT.cls(day(g))}">${FMT.pct(day(g), 2)}</span>${day(gq) != null ? ` · v1.1 <span class="num ${FMT.cls(day(gq))}">${FMT.pct(day(gq), 2)}</span>` : ""}${tri(g) != null ? ` · Nifty 500 TRI <span class="num ${FMT.cls(tri(g))}">${FMT.pct(tri(g), 2)}</span>` : ""}</p>` : ""}</section>`;
  })();
  // 8. news that moved prices · 9. coming up · 10. global
  const news = (m.news || []).length ? `<section class="panel"><h2>News that moved prices</h2>${m.news.map(x => `<p class="mline"><a href="${stockHref(x.s)}">${esc(x.s)}</a> ${chgPill(x.p, 1)} – ${esc(x.cat)}${x.t ? `: ${esc(x.t)}` : ""}${x.u ? ` <a href="${esc(x.u)}" target="_blank" rel="noopener">NSE ›</a>` : ""}</p>`).join("")}
    <p class="t-label sub">Announcements on NSE that day for Nifty 500 stocks that moved at least ${FMT.pctPlain(((m.config || {}).news_move_pct) || 5, 0)}.</p></section>` : "";
  const KIND = { results: "Results", "board meeting": "Board meeting", dividend: "Ex-dividend", split: "Split", bonus: "Bonus", "corporate action": "Corporate action", holiday: "NSE holiday" };
  const byDay = {}; (m.coming || []).forEach(x => (byDay[x.d] = byDay[x.d] || []).push(x));
  const coming = Object.keys(byDay).length ? `<section class="panel"><h2>Coming up (next 7 days)</h2>${Object.entries(byDay).map(([dd, xs]) => `<h3 class="minor">${FMT.date(dd)}</h3>
    ${xs.map(x => `<p class="mline"><b>${esc(KIND[x.k] || x.k)}</b>${x.s ? ` · ${BY[x.s] ? `<a href="${stockHref(x.s)}">${esc(x.s)}</a>` : esc(x.s)}` : ""}${x.k === "holiday" ? ` · ${esc(x.t)}` : ""}</p>`).join("")}`).join("")}
    <p class="t-label sub">${esc((m.sources || {}).coming || "NSE event calendar")}.</p></section>` : "";
  const glob = (m.global || []).length ? `<details class="panel"><summary>Global markets and rates</summary><div class="mrows">${m.global.map(x => `<div class="mrow"><span class="ml"><span>${esc(x.name)}</span><span class="t-label sub">${FMT.date(x.date)} · ${esc(x.src || "unofficial (Yahoo)")}</span></span><span class="mr">${lvlNum(x.pct, FMT.num(x.close, 2))}${x.pct != null ? chgPill(x.pct, 2) : ""}</span></div>`).join("")}</div>
    <p class="t-label sub">Last closes from Yahoo Finance – unofficial; not live.</p></details>` : "";
  return head + mktTop(m, v) + today + indices + sectors + secBars + factorRowHTML(m) + breadth + movers + flow + mine + news + coming + glob +
    `<p class="t-label sub">End-of-day data, not live. Not investment advice. Sources: ${esc(Object.values(m.sources || {}).join(" · "))}.</p>`;
}
const MSET = { u: prefGet("screener.market.u", "n500"), l: "active" };
const modelsScreen = () => `<button class="back" type="button" data-back="#/home">${ic("back")} Back</button><div class="scr-h"><h1>Model portfolios</h1></div>${portfolioHome()}`;

let SEARCH = { q: "", sort: "best", timer: null };
function searchScreen(q) {
  SEARCH.q = q;
  return `<div class="scr-h"><h1>Search stocks</h1></div>${uniSwitch()}
    <form class="search" role="search" id="qform" autocomplete="off">
      <label for="q" class="sub qlabel">A stock name, or describe what you want</label>
      <div class="qrow"><span class="qi">${ic("search")}</span><span class="qbox"><input id="q" name="screener-search" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        placeholder="e.g. TCS, or: above 200 DMA AND RSI < 30" value="${esc(q)}"><button id="qclear" class="qclr" type="button" aria-label="Clear the search"${q ? "" : " hidden"}>${ic("x")}</button></span><button class="go" type="submit">Go</button></div>
      <div id="qtok" class="qtok" aria-hidden="true">${qTokens(q)}</div>
      <p id="qlive" class="t-label sub qlive" aria-live="polite">${qLive(q)}</p>
      <div id="sugg" class="sugg" role="listbox" aria-label="Suggestions"></div>
      <div class="chiprow" id="chips">${CHIPS.map(([label, cq]) => `<button class="chip${cq === q ? " on" : ""}" type="button" data-q="${esc(cq)}">${esc(label)}</button>`).join("")}</div>
    </form>
    <div id="fltrow" class="fltrow"></div>
    <div id="results"></div>`;
}
const helpBox = (open) => `<details class="help"${open ? " open" : ""}><summary>What can I type?</summary>
    <div class="helpbody">
      <p>A stock name (<i>Infosys</i>), an industry (<i>Healthcare</i>), or rules joined with AND / OR, e.g. <i>ROCE &gt; 15 AND Debt to equity &lt; 0.5</i>. When you mix AND with OR, use brackets: <i>(ROCE &gt; 20 OR ROE &gt; 20) AND PE &lt; 30</i>.</p>
      <p>Business numbers: ROCE, average ROCE, ROE, average ROE, ROA, Debt to equity, Interest coverage, CFO/PAT, Operating margin, Debtor days, Inventory days, Payable days, PE, PEG, P/B, EV/EBITDA, Earnings yield, Sales growth, EPS growth, Market cap (₹ crore), M-score, Z-score, Accruals, Traded value (₹ crore), Pledge, Promoter holding, Health score.</p>
      <p>Growth modes: <i>Sales</i>, <i>Operating profit</i>, <i>Net profit</i>, <i>EPS</i>, <i>Book value</i>, <i>CFO</i> – add <i>yoy</i>, <i>3y cagr</i> or <i>5y cagr</i> (and <i>ttm</i> for the last 12 months), e.g. <i>sales 3y cagr &gt; 15</i>, <i>profit yoy &gt; 20</i>. Without one, the Growth figures buttons above the results decide.</p>
      <p>Investor lenses and ownership: Graham, Buffett, Munger, Lynch, Fisher, Greenblatt, Kedia, QGLP, Coffee Can (each = % of checks passed), Piotroski (F-score 0–9), Promoter change (points over 4 quarters), Insider net (₹ crore, 12 months), Red flags.</p>
      <p>Price numbers: Price, RSI, From high (%), Volume (× normal), Change (%), 50 DMA, 200 DMA. Phrases: <i>above 200 DMA</i>, <i>near high</i>, <i>oversold</i>, <i>50-day above 200-day</i>, <i>golden cross</i> / <i>death cross</i> (crossed in the last 20 trading days), <i>volume spike</i>.</p>
      <p>Stocks under NSE extra surveillance (ASM/GSM) or trading under ₹5 crore a day are left out of business-number screens.</p>
    </div></details>`;
function drawResults() {                       // review #80 B: Search is India-only (US stocks live in the World tab)
  const el = document.getElementById("results");
  if (!el) return;
  const q = SEARCH.q, anyF = fltAny(FLTS.cur);
  let r = runQuery(q);
  if (r.empty && anyF) r = { list: UNIV().slice(), tree: null, left: 0, all: true };       // review #70 (S2): filters alone
  FLTS.pool = r.err ? [] : r.list;
  if (anyF && !r.err) r = Object.assign({}, r, { list: r.list.filter(s => fltPass(FLTS.cur, s)) });
  const fr = document.getElementById("fltrow"); if (fr) fr.innerHTML = r.err ? "" : fltRowHTML(r.list.length);
  document.querySelectorAll("#chips .chip").forEach(c => c.classList.toggle("on", c.dataset.q === q));
  if (r.empty) {
    el.innerHTML = recentHTML() + `<p class="sub" style="margin:8px 0 12px">Type a stock name like <b>TCS</b>, use the filters, or open a ready-made screen.</p>
      ${myScreensHTML()}${galleryHTML()}${helpBox(false)}`;
    return;
  }
  if (r.err) { el.innerHTML = `<p class="resbar"><span class="qerr">🟡 ${esc(r.err)}</span>${r.hint ? ` <button class="act" type="button" data-act="qfix" data-bad="${esc(r.hint.bad)}" data-good="${esc(r.hint.good)}">Use ${esc(r.hint.good)}</button>` : ""}</p>${helpBox(true)}`; return; }
  const chip = CHIPS.find(c => c[1] === q);
  CTX = chip ? chip[0].replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "") : `Search “${q}”`;
  const n = r.list.length, key = "search:" + q + ":" + FLTS.raw() + ":" + SEARCH.sort + ":" + UNI;
  const list = sorted(r.list, SEARCH.sort);
  el.innerHTML = `<div class="resbar">
      <p class="rescount" role="status" aria-live="polite"><span class="num">${n}</span> stock${n === 1 ? "" : "s"} match${n === 1 ? "es" : ""} ${r.all ? "your filters" : chip ? `‘${esc(chip[0].replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, ""))}’` : `‘${esc(q)}’`}${anyF && !r.all ? " and your filters" : ""}</p>
      ${r.tree && gmLeaves(r.tree).length ? gmBar(r.skip) : ""}
      <p class="resplain">${r.all ? "All stocks, narrowed by the filters above." : chip ? esc(chip[2][0].toUpperCase() + chip[2].slice(1)) + "." : "Showing stocks where " + describe(r.tree) + "."}${r.left ? ` ${r.left} matching stock${r.left > 1 ? "s" : ""} left out: under NSE extra surveillance or too thinly traded.` : ""}</p>
      <div class="resctl"><label>Sort <select id="sort">${Object.entries(SORTS).map(([k, [nm]]) => `<option value="${k}"${SEARCH.sort === k ? " selected" : ""}>${esc(k === "best" && r.order ? nm + " – " + r.order : nm)}</option>`).join("")}</select></label>
        <button class="clear" type="button" id="qclear2">${ic("x")} Clear</button>${q && !chip && !r.all ? `<button class="act" type="button" data-act="qsave">${ic("save")} Save to My screens</button>` : ""}</div>
    </div>
    ${chip && chip[3] ? newLeftHTML(chip[3]) : ""}
    ${n && r.tree && !onlyText(r.tree) ? `<div class="segpick resview" role="group" aria-label="Show as">${[["cards", "Cards"], ["table", "Table"]].map(([v, nm]) => `<button class="chip${prefGet(RESVIEW, "cards") === v ? " on" : ""}" type="button" data-act="resview" data-v="${v}" aria-pressed="${prefGet(RESVIEW, "cards") === v}">${nm}</button>`).join("")}</div>` : ""}
    ${n ? `<p class="collegend sub">Each row shows: <span>Verdict</span> <span>Core</span>${SET.signals !== false ? " <span>ROCE</span> <span>P/E</span>" : ""}</p>` : ""}
    ${n ? cardsHTML(list, key, r.tree) : anyF ? `<p class="empty">No stocks match with these filters. <button class="linkbtn" type="button" data-act="fltundo">Undo the last filter</button></p>` : didYouMeanHTML(q, r) || `<p class="empty">No stocks match. Try one of the ready-made screens above.</p>`}`;
}
// ---------- review #70 (S5): "why it's here" – one chip per rule the stock passes, with its own value ----------
const RESVIEW = "screener.resview";
const fmtF = (unit, v) => v == null ? "–" : unit === "%" ? FMT.pctPlain(v, 1) : unit === "×" ? FMT.ratio(v, 2) : unit === "₹" ? inr(v) : unit === "₹ cr" ? FMT.cr(v, 0)
  : unit === "days" ? FMT.num(v, 0) + " days" : FMT.num(v, Math.abs(v) < 10 && v % 1 ? 1 : 0);
// a rule's own number as it was typed (25, 0.3, 1.5) with its unit
const fmtT = (u, v) => FMT.num(v, String(v).includes(".") ? String(v).split(".")[1].length : 0) + (u === "%" ? "%" : u === "×" ? "×" : u === "₹ cr" ? " cr" : "");
const NEEDS = { ">=": (u, v) => `needs ${fmtT(u, v)}+`, ">": (u, v) => `needs above ${fmtT(u, v)}`, "<": (u, v) => `needs under ${fmtT(u, v)}`, "<=": (u, v) => `needs ${fmtT(u, v)} or less`, "=": (u, v) => `needs ${fmtT(u, v)}` };
function leaves(n, s, out = []) {
  if (n.op) { (n.op === "AND" ? n.items : n.items.filter(x => evalQ(x, s))).forEach(x => leaves(x, s, out)); return out; }
  if (n.fn(s)) out.push(n);
  return out;
}
function whyChip(n, s) {
  if (n.field) {
    const f = n.field, v = f.get ? f.get(s) : s[f.key], nm = (QFIELDS.find(x => x.key === f.key) || {}).typed || f.label;
    if (f.key === "q_mos") return `✓ ${FMT.pctPlain(Math.abs(v), 0)} ${v >= 0 ? "below" : "above"} fair value (needs ${FMT.num(f.v, 0)}%+${f.op === ">=" || f.op === ">" ? "" : ""})`;
    if (f.key === "q_quality") return `✓ Quality ${FMT.num(v, 0)} (${NEEDS[f.op]("", f.v)})`;
    return `✓ ${nm} ${fmtF(f.unit, v)} (${NEEDS[f.op](f.unit, f.v)})`;
  }
  const t = (n.phrase || "").toLowerCase();
  if (/200/.test(t) && /above|over|uptrend/.test(t)) return `✓ price ${inr(s.close)} above its 200-day average ${inr(s.dma200)}`;
  if (/near/.test(t) && /high/.test(t)) return `✓ ${FMT.pctPlain(Math.abs(s.pct_from_high52), 1)} below its 1-year high (needs within 10%)`;
  if (/^(verdict:? ?)?(buy|acc|accumulate|hold|trim|avoid|sell)/.test(t)) { const v = vfor(s); return `✓ verdict ${VG[v.g][1]}${v.q != null ? ` · quality ${FMT.num(v.q, 0)}` : ""}`; }
  if (/quality on sale/.test(t)) return `✓ passes every checkable Quality on Sale rule${s.q_mos != null ? ` · ${FMT.pctPlain(Math.abs(s.q_mos), 0)} ${s.q_mos >= 0 ? "below" : "above"} fair value` : ""}`;
  const fm = t.match(/^fits\s+(?:an?\s+)?(\w+)/); if (fm) { const k = fm[1].replace(/\s/g, ""); return `✓ fits the ${k[0].toUpperCase() + k.slice(1)} style · lens ${FMT.pctPlain(s["lens_" + k], 0)} (needs 70%+)`; }
  if (n.text) return `✓ ${n.label}`;
  return `✓ ${n.label}`;
}
const whyHTML = (tree, s) => { const L = leaves(tree, s); return L.length ? `<div class="whychips">${L.map(n => `<span class="why">${esc(whyChip(n, s))}</span>`).join("")}</div>` : ""; };
function resTableHTML(list, tree) {           // review #76 lesson 2: the shared table component
  const cols = []; (function walk(n) { if (n.op) n.items.forEach(walk); else if (n.field && !cols.some(c => c.key === n.field.key)) cols.push(n.field); })(tree);
  const tc = [{ k: "name", h: "Stock" }, { k: "v", h: "Verdict", term: true }, ...cols.map((c, i) => ({ k: "c" + i, h: esc((QFIELDS.find(x => x.key === c.key) || {}).typed || c.label), term: true })), { k: "core", h: "Core", term: true }];
  const rows = list.map(s => { const v = SET.master ? vfor(s) : null;
    return { cells: {}, raw: Object.assign({ name: `<a href="${stockHref(s.symbol)}">${esc(s.name)}</a>`, v: v ? esc(VG[v.g][1]) : FMT.DASH, core: s.cr && s.cr.sc != null ? FMT.num(s.cr.sc, 1) : FMT.DASH },
      Object.fromEntries(cols.map((c, i) => ["c" + i, c.key === "q_mos" ? FMT.pctPlain(s.q_mos, 0) : fmtF(c.unit, c.get ? c.get(s) : s[c.key])]))) }; });
  return dataTable({ cols: tc, rows, cls: "restable", label: "Search results table" });
}
// ---------- review #70 (S4): the query box – suggestions from the screenable glossary keys, coloured tokens, plain English,
// "did you mean …?" for an unknown word, a live count, and "My screens" (saved in this browser, in the backup) ----------
const TYPED = { lens_graham: "Graham", lens_buffett: "Buffett", lens_munger: "Munger", lens_lynch: "Lynch", lens_fisher: "Fisher", lens_greenblatt: "Greenblatt",
  lens_kedia: "Kedia", lens_qglp: "QGLP", lens_coffeecan: "Coffee Can", de: "Debt to equity", sales_cagr: "Sales growth", eps_cagr: "EPS growth", "q_quality": "Quality", q_mos: "Margin of safety", pct_from_high52: "From high", vol_ratio: "Volume",
  change_pct: "Change", close: "Price", dma50: "50 DMA", dma200: "200 DMA", rsi14: "RSI", insider_net_cr: "Insider net", promoter_chg_4q: "Promoter change",
  red_flags: "Red flags", fscore: "Piotroski", mcap_cr: "Market cap", traded_value_cr: "Traded value", health_score: "Health", roce_avg: "Average ROCE",
  roe_avg: "Average ROE", promoter_holding: "Promoter holding", icr: "Interest cover", op_margin: "Operating margin", cfo_pat: "CFO/PAT", fair_value: "Fair value" };
const GL_BY_FIELD = (() => { const o = {}; Object.entries(GL).forEach(([k, t]) => { if (t.field && !o[t.field]) o[t.field] = k; }); o.q_quality = o.quality || "bizhealth"; o.q_mos = "mos"; return o; })();
// one entry per FIELDS row: the word to type (it must parse back to the same field), its glossary key and meaning
const QFIELDS = FIELDS.map(([re, label, key, unit, fund]) => {
  const g = GL_BY_FIELD[key], cands = [TYPED[key], label, g && GL[g].name.split(" (")[0], label.split(" ")[0]].filter(Boolean);
  const typed = cands.find(t => re.test(norm(t))) || label;
  return { typed, key, label, unit, fund, g, meaning: g ? GL[g].meaning : label };
});
const fieldHint = word => { const w = norm(word); let best = null, d = 3;
  QFIELDS.forEach(f => [f.typed, f.label].forEach(t => { const x = UL.dist(w, norm(t)); if (x < d) { d = x; best = f.typed; } })); return d <= 2 ? best : null; };
function fieldSugg(q) {
  const frag = String(q).split(/\(|\)|\band\b|\bor\b/i).pop().trimStart();
  if (!frag || /[<>=]/.test(frag) || frag.length > 24) return [];
  const w = norm(frag);
  return QFIELDS.filter(f => norm(f.typed).startsWith(w) || norm(f.label).startsWith(w) || (w.length >= 3 && (f.g && norm(GL[f.g].name).includes(w)))).slice(0, 5);
}
function qTokens(q) {
  if (!q || !q.trim() || isPlain(q.trim())) return "";            // a plain name search needs no token colours
  return String(q).split(/(\(|\)|\band\b|\bor\b|>=|<=|[<>=]|-?\d+(?:\.\d+)?%?)/i).filter(x => x && x.trim()).map(t => {
    const c = /^(and|or)$/i.test(t.trim()) ? "tj" : /^(\(|\)|>=|<=|[<>=])$/.test(t.trim()) ? "ts" : /^-?\d/.test(t.trim()) ? "tn" : "tw";
    return `<span class="${c}">${esc(t.trim())}</span>`; }).join(" ");
}
const OPW = { ">": "above", ">=": "at least", "<": "under", "<=": "at most", "=": "equal to" };
const PLAINQ = {
  roce: (o, v) => `earn ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")}% on capital`, roe: (o, v) => `earn ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")}% on shareholders' money`,
  roa: (o, v) => `earn ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")}% on their assets`, de: (o, v) => (o === "<" || o === "<=") && v <= 0.5 ? `have little debt (debt ${OPW[o]} ${FMT.num(v, 2).replace(/0$/, "")}× equity)` : `have debt ${OPW[o]} ${FMT.num(v, 2).replace(/0$/, "")}× equity`,
  pe: (o, v) => `trade ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")} times earnings`, sales_cagr: (o, v) => `grow sales ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")}% a year`,
  eps_cagr: (o, v) => `grow earnings per share ${OPW[o]} ${FMT.num(v, 1).replace(/\.0$/, "")}% a year`, cfo_pat: (o, v) => `turn ${OPW[o]} ${FMT.num(v * 100, 0)}% of profit into cash`,
  q_quality: (o, v) => `score ${OPW[o]} ${FMT.num(v, 0)} for quality`, q_mos: (o, v) => `trade ${OPW[o]} ${FMT.num(v, 0)}% below fair value`,
  red_flags: (o, v) => v === 0 && o === "=" ? "have no red flags" : `have ${OPW[o]} ${FMT.num(v, 0)} red flags`, fscore: (o, v) => `have a Piotroski score ${OPW[o]} ${FMT.num(v, 0)}`,
  insider_net_cr: (o, v) => v === 0 && o === ">" ? "have insiders buying more than selling" : `have insider net buying ${OPW[o]} ₹${FMT.num(v, 0)} crore`,
  promoter_chg_4q: (o, v) => v === 0 && o === ">=" ? "have promoters not cutting their stake" : `have a promoter stake change ${OPW[o]} ${FMT.num(v, 1)} points`,
  rsi14: (o, v) => `have an RSI ${OPW[o]} ${FMT.num(v, 0)}`,
};
function plainNode(n, top) {
  if (n.op) { const t = n.items.map(x => plainNode(x, false)).join(n.op === "AND" ? " and " : " or "); return top || n.op === "AND" ? t : `either ${t}`; }
  if (n.field) { const f = n.field, p = PLAINQ[f.key]; return p ? p(f.op, f.v) : `have ${f.label} ${OPW[f.op]} ${FMT.num(f.v, Math.abs(f.v) < 10 && f.v % 1 ? 2 : 0)}${f.unit === "%" ? "%" : ""}`; }
  if (n.text) return `match “${n.label.replace(/^name or industry contains “|”$/g, "")}” by name or industry`;
  return `– ${n.label}`.replace(/^– /, "where ");
}
const plainEnglish = tree => tree ? "Companies that " + plainNode(tree, true).replace(/^where /, "") + "." : "";
function qLive(q) {
  if (!q) return "";
  const r = runQuery(q); if (r.err || r.empty || r.tree == null || onlyText(r.tree)) return "";
  return `<b class="num">${FMT.count(r.list.length)}</b> match · ${esc(plainEnglish(r.tree))}`;
}
function myScreensHTML() {
  const L = (USER.screens || []); if (!L.length) return "";
  return `<h2 class="sech">My screens</h2><div class="chips myscr">${L.map(x => `<span class="chipgrp"><button class="chip" type="button" data-q="${esc(x.q)}" title="${esc(x.q)}">${esc(x.name)}</button><button class="chip" type="button" data-act="qdel" data-id="${esc(x.id)}" aria-label="Remove ${esc(x.name)}">✕</button></span>`).join("")}</div>`;
}
function qAct(act, el) {
  if (act === "qfield") { const inp = document.getElementById("q"); if (!inp) return true; const v = inp.value, m = v.match(/^(.*?)([^()]*?)$/s);
    const parts = v.split(/(\(|\)|\band\b|\bor\b)/i), last = parts.pop(); inp.value = parts.join("") + (parts.length ? " " : "") + el.dataset.t + " ";
    inp.value = inp.value.replace(/\s+/g, " ").replace(/^\s/, ""); inp.focus(); drawSugg(""); const t = document.getElementById("qtok"); if (t) t.innerHTML = qTokens(inp.value); return true; }
  if (act === "qfix") { const inp = document.getElementById("q"); const q = SEARCH.q.replace(el.dataset.bad, el.dataset.good); if (inp) inp.value = q; setQuery(q); return true; }
  if (act === "qsave") { sheet(`<h2>Save to My screens</h2><form id="scrsave"><label class="fl">Name<input name="nm" maxlength="40" required placeholder="e.g. My quality list"></label>
      <p class="mini">${esc(SEARCH.q)}</p><div class="btnrow"><button class="act big" type="submit">Save</button><button class="act" type="button" data-close>Cancel</button></div></form>`); return true; }
  if (act === "qdel") { USER.screens = (USER.screens || []).filter(x => x.id !== el.dataset.id); persist(); render(true); return true; }
  return false;
}
// ---------- review #70 (S3): the screen gallery – tonight's count, new / left vs the previous data date, the sector mix ----------
const SCRH = () => S.screens || null;
const secName = k => (SECT[k] && SECT[k].label) || GROUP_LABEL(k);
function sectorMix(list) {
  const c = {}; list.forEach(s => { const k = skOf(s); c[k] = (c[k] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]);
}
function galleryHTML() {
  const H = SCRH();
  return `<h2 class="sech">Ready-made screens</h2><div class="gallery">${CHIPS.map(([label, q, plain, id, icon]) => {
    const r = runQuery(q), n = r.list.length, h = H && H.rows && H.rows[id], mix = sectorMix(r.list), top = mix.slice(0, 2);
    const nl = h && h.new ? `<span class="t-label nl"><b class="num">+${FMT.count(h.new.length)}</b> new · <b class="num">−${FMT.count(h.left.length)}</b> left</span>`
      : `<span class="t-label sub nl">no history yet</span>`;
    return `<a class="gcard" href="${esc(searchHash(q, {}))}" data-scr="${esc(id)}"><span class="gi-ic">${ic(icon || "search")}</span>
      <span class="gtext"><b>${esc(label)}</b><span class="sub">${esc(plain[0].toUpperCase() + plain.slice(1))}</span>
      <span class="gmeta"><b class="num" data-gn="${esc(id)}">${FMT.count(n)}</b> <span class="t-label sub">tonight</span> · ${nl}</span>
      ${n ? `<span class="smix" data-chart="Sector mix" data-direct="1" role="img" aria-label="Sector mix: ${esc(mix.map(([k, c]) => secName(k) + " " + c).join(", "))}">${mix.map(([k, c]) => `<i style="width:${FMT.coord(c / n * 100)}%;background:var(--sc-${esc(k)}, var(--sc-general))"></i>`).join("")}</span>
        <span class="t-label sub">${top.map(([k, c]) => `${esc(secName(k))} ${FMT.pctPlain(c / n * 100, 0)}`).join(" · ")}${mix.length > 2 ? " · …" : ""}</span>` : ""}</span></a>`; }).join("")}</div>
    <p class="t-label sub">${H && H.prev ? `New / left: tonight (${esc(dateTxt(H.date))}) vs ${esc(dateTxt(H.prev))}, from the nightly log of each screen's members.` : "New / left start once the nightly has logged two data dates."}</p>`;
}
function newLeftHTML(id) {
  const H = SCRH(), h = H && H.rows && H.rows[id];
  if (!h || !h.new) return `<p class="t-label sub">New / left: no history yet for this screen.</p>`;
  if (!h.new.length && !h.left.length) return `<p class="t-label sub">Same stocks as on ${esc(dateTxt(H.prev))}.</p>`;
  const nm = t => BY[t] ? `<a href="${stockHref(t)}">${esc(BY[t].name)}</a>` : esc(t);
  return `<section class="panel newleft"><h2>Since ${esc(dateTxt(H.prev))}</h2>
    ${h.new.length ? `<p class="mline"><b>New tonight (${FMT.count(h.new.length)}):</b> ${h.new.map(nm).join(", ")}</p>` : ""}
    ${h.left.length ? `<p class="mline"><b>Left tonight (${FMT.count(h.left.length)}):</b> ${h.left.map(nm).join(", ")}</p>` : ""}</section>`;
}
// ---------- review #70 (S2): filter chips + a sheet with a live count; filters live in the URL hash (Back restores them) ----------
const sizeOfS = s => { if (!MCAP_RANK) { MCAP_RANK = {}; S.stocks.filter(x => x.mcap_cr).sort((a, b) => b.mcap_cr - a.mcap_cr).forEach((x, i) => { MCAP_RANK[x.symbol] = i + 1; }); }
  return UL.sizeOf(s.ix, MCAP_RANK[s.symbol]); };
const inRange = (x, lo, hi) => x != null && x >= lo && x < hi;
const FLT = [
  { k: "sector", n: "Sector", opts: () => [...new Set(UNIV().map(s => sigGroup(s)).filter(Boolean))].sort((a, b) => GROUP_LABEL(a).localeCompare(GROUP_LABEL(b))).map(g => [g, GROUP_LABEL(g)]),
    test: (s, v) => sigGroup(s) === v },
  { k: "quality", n: "Quality", opts: () => [["70", "70 or more"], ["50", "50 to 69"], ["0", "under 50"]],
    test: (s, v) => { const q = s.q_quality; return v === "70" ? q != null && q >= 70 : v === "50" ? inRange(q, 50, 70) : q != null && q < 50; } },
  { k: "pe", n: "P/E", opts: () => [["lt15", "under 15"], ["15", "15 to 30"], ["30", "30 to 50"], ["gt50", "50 or more"]],
    test: (s, v) => v === "lt15" ? inRange(s.pe, 0, 15) : v === "15" ? inRange(s.pe, 15, 30) : v === "30" ? inRange(s.pe, 30, 50) : s.pe != null && s.pe >= 50 },
  { k: "debt", n: "Debt", opts: () => [["lt01", "almost none (D/E under 0.1)"], ["01", "low (0.1 to 0.5)"], ["05", "some (0.5 to 1.5)"], ["gt15", "high (1.5 or more)"]],
    test: (s, v) => v === "lt01" ? inRange(s.de, -1e9, 0.1) : v === "01" ? inRange(s.de, 0.1, 0.5) : v === "05" ? inRange(s.de, 0.5, 1.5) : s.de != null && s.de >= 1.5 },
  { k: "size", n: "Size", opts: () => [["Large", "Large"], ["Mid", "Mid"], ["Small", "Small"]], test: (s, v) => sizeOfS(s) === v },
  { k: "verdict", n: "Verdict", opts: () => VR().order.slice().reverse().map(g => [g, (VR().names || {})[g] || (VG[g] || [])[1] || g]),
    test: (s, v) => SET.master && (vfor(s) || {}).g === v },
];
const FLTS = { cur: {}, draft: null, open: null, pool: [], undo: [], raw: () => fltStr(FLTS.cur) };
const fltParse = str => { const o = {}; String(str || "").split(",").forEach(p => { const [k, v] = p.split(":"); if (k && v && FLT.some(f => f.k === k)) o[k] = v.split(".").filter(Boolean); }); return o; };
const fltStr = o => FLT.filter(f => (o[f.k] || []).length).map(f => f.k + ":" + o[f.k].join(".")).join(",");
const fltAny = o => FLT.some(f => (o[f.k] || []).length);
// within a filter the options are OR; across filters AND
const fltPass = (o, s, skip) => FLT.every(f => f.k === skip || !(o[f.k] || []).length || o[f.k].some(v => f.test(s, v)));
const searchHash = (q, o) => { const p = new URLSearchParams(); if (q) p.set("q", q); const f = fltStr(o || {}); if (f) p.set("flt", f); const t = p.toString(); return "#/search" + (t ? "?" + t : ""); };
function fltRowHTML(n) {
  const o = FLTS.cur, active = FLT.flatMap(f => (o[f.k] || []).map(v => [f, v]));
  const lab = (f, v) => (f.opts().find(x => x[0] === v) || [v, v])[1];
  return `<div class="chiprow fchips" role="group" aria-label="Filters">${FLT.map(f => `<button class="chip fchip${(o[f.k] || []).length ? " on" : ""}" type="button" data-act="fltopen" data-k="${f.k}" aria-haspopup="dialog">${esc(f.n)}${(o[f.k] || []).length ? ` · ${FMT.count(o[f.k].length)}` : ""} ▾</button>`).join("")}</div>
    ${active.length ? `<div class="chips factive">${active.map(([f, v]) => `<button class="chip on" type="button" data-act="fltrm" data-k="${f.k}" data-v="${esc(v)}" aria-label="Remove ${esc(f.n)}: ${esc(lab(f, v))}">${esc(f.n)}: ${esc(lab(f, v))} ✕</button>`).join("")}<button class="chip" type="button" data-act="fltclear">Clear all</button></div>` : ""}`;
}
function fltSheetHTML() {
  const f = FLT.find(x => x.k === FLTS.open), d = FLTS.draft, base = FLTS.pool;
  const others = base.filter(s => fltPass(d, s, f.k)), sel = d[f.k] || [];
  const total = base.filter(s => fltPass(d, s)).length;
  return `<h2>${esc(f.n)}</h2><p class="sub">Each option shows how many stocks it leaves with your other filters${SEARCH.q ? " and your search" : ""}.</p>
    <div class="fopts" role="group" aria-label="${esc(f.n)}">${f.opts().map(([v, nm]) => { const c = others.filter(s => f.test(s, v)).length, on = sel.includes(v);
      return `<button class="fopt${on ? " on" : ""}" type="button" data-act="fltopt" data-v="${esc(v)}" aria-pressed="${on}"${!c && !on ? " disabled" : ""}><span>${esc(nm)}</span><b class="num">${FMT.count(c)}</b></button>`; }).join("")}</div>
    <div class="fsticky"><button class="act big" type="button" data-act="fltshow">Show ${FMT.count(total)} stock${total === 1 ? "" : "s"}</button>${sel.length ? `<button class="act" type="button" data-act="fltnone">Clear ${esc(f.n)}</button>` : ""}<button class="act" type="button" data-close>Cancel</button></div>`;
}
function fltApply(o) {
  FLTS.undo.push(fltStr(FLTS.cur)); if (FLTS.undo.length > 20) FLTS.undo.shift();
  FLTS.cur = o; FLTS.expect = fltStr(o); location.hash = searchHash(SEARCH.q, o);          // a new history entry: Back restores the previous filters
}
function fltAct(act, el) {
  if (act === "fltopen") { FLTS.open = el.dataset.k; FLTS.draft = JSON.parse(JSON.stringify(FLTS.cur)); sheet(fltSheetHTML()); document.getElementById("sheet").classList.add("fsheet"); return true; }
  if (act === "fltopt") { const k = FLTS.open, v = el.dataset.v, a = FLTS.draft[k] = FLTS.draft[k] || []; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v);
    document.querySelector("#sheet .sheetbody").innerHTML = fltSheetHTML(); return true; }
  if (act === "fltnone") { FLTS.draft[FLTS.open] = []; document.querySelector("#sheet .sheetbody").innerHTML = fltSheetHTML(); return true; }
  if (act === "fltshow") { const o = FLTS.draft; closeSheet(); fltApply(o); return true; }
  if (act === "fltrm") { const o = JSON.parse(JSON.stringify(FLTS.cur)); o[el.dataset.k] = (o[el.dataset.k] || []).filter(v => v !== el.dataset.v); fltApply(o); return true; }
  if (act === "fltclear") { fltApply({}); return true; }
  if (act === "fltundo") { const prev = FLTS.undo.pop(); const o = prev != null ? fltParse(prev) : (() => { const c = JSON.parse(JSON.stringify(FLTS.cur)), k = FLT.map(f => f.k).reverse().find(x => (c[x] || []).length); if (k) c[k].pop(); return c; })();
    FLTS.cur = o; FLTS.expect = fltStr(o); location.hash = searchHash(SEARCH.q, o); return true; }
  return false;
}
// ---------- review #58 B: recent searches + recently viewed (this browser only), live suggestions, "Did you mean…?" ----------
const RECENT = {
  KEY: "screener.recent.v1", N: 8,
  get() { try { const o = JSON.parse(localStorage.getItem(this.KEY) || "{}"); return { q: o.q || [], v: o.v || [] }; } catch (e) { return { q: [], v: [] }; } },
  put(o) { try { localStorage.setItem(this.KEY, JSON.stringify(o)); } catch (e) {} },
  add(kind, x) { if (!x) return; const o = this.get(); o[kind] = [x, ...o[kind].filter(y => y !== x)].slice(0, this.N); this.put(o); },
  clear() { try { localStorage.removeItem(this.KEY); } catch (e) {} },
};
function recentHTML() {
  const o = RECENT.get(), v = o.v.filter(x => BY[x]);
  if (!o.q.length && !v.length) return "";
  return `<section class="recent">${o.q.length ? `<p class="t-label sub">Recent searches</p><div class="chips">${o.q.map(x => `<button class="chip" type="button" data-q="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
    ${v.length ? `<p class="t-label sub">Recently viewed</p><div class="chips">${v.map(x => `<a class="chip" href="${stockHref(x)}">${esc(BY[x].name)}</a>`).join("")}</div>` : ""}
    <button class="clear" type="button" id="rclear">${ic("x")} Clear history</button></section>`;
}
const isPlain = q => q && !/[<>=]|\b(and|or)\b|\b(above|below|near|oversold|golden|death|spike)\b/i.test(q);
function drawSugg(q) {
  const el = document.getElementById("sugg"); if (!el) return;
  const fs = fieldSugg(q), list = isPlain(q) ? UL.suggest(q, UNIV()).slice(0, fs.length ? 3 : 6) : [];
  el.innerHTML = fs.map(f => `<button class="urow srow fsugg" type="button" role="option" data-act="qfield" data-t="${esc(f.typed)}"><span class="nm">${esc(f.typed)}</span> <span class="sub">${esc(f.meaning)}</span></button>`).join("")
    + list.map(x => `<a class="urow srow" role="option" href="${stockHref(x.symbol)}"><span class="nm">${esc(x.name)}</span> <span class="sub">${esc(x.symbol)} · ${lvlNum(x.change_pct, inr(x.close))}</span></a>`).join("");
}
function didYouMeanHTML(q, r) {
  if (!r.text) return "";
  const c = UL.didYouMean(q, UNIV()); if (!c.length) return "";
  return `<p class="empty">No stocks match “${esc(q)}”. Did you mean ${c.map(x => `<a href="${stockHref(x.symbol)}">${esc(x.name)}</a>`).join(", ")}?</p>`;
}
function setQuery(q, push) {
  SEARCH.q = q;
  const h = searchHash(q, FLTS.cur);
  if (location.hash !== h) history.replaceState(null, "", h);
  CUR = h;
  drawResults();
}

const GROUPS = { buy: "verdict buy", acc: "verdict acc", hold: "verdict hold", trim: "verdict trim", avoid: "verdict avoid",
  qos: "quality on sale", near: "quality on sale near" };
const GROUP_NAME = { qos: ["💎", "Quality on Sale", "good businesses whose price fell – they pass every rule we can check in 5 groups: on sale, quality, not breaking, the market's fall not the company's, genuinely cheap."],
  near: ["🔍", "Nearly on sale", "they fail just one Quality on Sale rule."] };
const verdictsOff = () => `<div class="mood"><h2>Verdicts are switched off</h2><p class="sub">Turn them back on in <a href="#/settings">☰ More → ⚙️ Settings</a>. Everything else still works.</p></div>`;
// ---------- review #70 (V1): five group cards – tonight's count, the change vs one week back, the weekly counts from the log ----------
const VH = () => S.vh || null;
const VGS = () => VR().order.slice().reverse();                       // buy … avoid
const vgName = g => (VR().names || {})[g] || (VG[g] || [])[1] || g;
const vgPill = g => `<span class="vgp" data-vgc="${g}" style="--vgc:var(--vg-${g})">${esc(vgName(g))}</span>`;
function weekLine(g) {
  const H = VH(); if (!H || !H.weeks || H.weeks.length < 2) return `<span class="t-label sub">${H && H.weeks && H.weeks.length ? "1 week logged so far" : "no weekly history yet"}</span>`;
  const v = H.weeks.map(d => (H.counts[d] || {})[g] || 0), W = 96, Hh = 26, lo = Math.min(...v), hi = Math.max(...v);
  const pts = v.map((y, i) => `${FMT.coord(i * W / (v.length - 1))},${FMT.coord(Hh - 3 - (y - lo) / ((hi - lo) || 1) * (Hh - 6))}`).join(" ");
  return `<figure class="wkline" data-chart="Weekly count"><svg class="spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><polyline data-series="Weekly count" fill="none" style="stroke:var(--vg-${g})" stroke-width="2" points="${pts}"/></svg>
    <figcaption class="t-label sub">${kw("Weekly count", `var(--vg-${g})`)} ${FMT.count(v.length)} weeks: ${v.map(x => FMT.count(x)).join(" → ")}</figcaption></figure>`;
}
function verdictsScreen() {
  const head = `<div class="scr-h"><h1>Today's verdicts</h1><span class="exp">v0, experimental</span>${ib("verdict")}</div>`;
  if (!SET.master) return head + verdictsOff();
  const c = { buy: 0, acc: 0, hold: 0, trim: 0, avoid: 0 }, U = UNIV();
  U.forEach(s => { const v = vfor(s); if (v) c[v.g]++; });
  const tot = Object.values(c).reduce((a, b) => a + b, 0) || 1;
  const qos = U.filter(s => s.v4 && s.v4.qs && s.v4.qs.l && !s.v4.ex).length;
  const near = U.filter(s => s.v4 && s.v4.qs && s.v4.qs.nr && !s.v4.ex).length;
  const off = partsOff(), H = VH(), wb = H && H.week_back, lc = H && H.counts[H.tonight], wc = wb && H.counts[wb];
  const strip = `<figure class="vstrip" data-chart="Verdict groups">${ktitle(VGS().map(g => kw(vgName(g), `var(--vg-${g})`)).join(" · "), "p")}
    <div class="vsbar" role="img" aria-label="${esc(VGS().map(g => vgName(g) + " " + c[g]).join(", "))}">${VGS().map(g => c[g] ? `<i data-series="${esc(vgName(g))}" data-vgc="${g}" style="width:${FMT.coord(c[g] / tot * 100)}%;background:var(--vg-${g})"></i>` : "").join("")}</div>
    <figcaption class="t-label sub">All ${FMT.count(tot)} stocks with a verdict, split by group.</figcaption></figure>`;
  const cards = VGS().map(g => { const d = lc && wc ? lc[g] - wc[g] : null;
    return `<details class="vgcard" data-g="${g}" style="--vgc:var(--vg-${g})"><summary><span class="vgdot" data-vgc="${g}"></span><span class="vgname"><b>${esc(vgName(g))}</b>
      <span class="t-label sub">${d == null ? "no week-ago log yet" : `${d > 0 ? "+" : d < 0 ? "−" : "±"}${FMT.count(Math.abs(d))} vs ${esc(dateTxt(wb))}`}</span></span><b class="num t-number-lg" data-vgn="${g}">${FMT.count(c[g])}</b></summary>
      <p class="mini">${esc(VG_HELP[g])}</p>${weekLine(g)}<p class="t-label"><a href="#/verdicts/${g}">See the ${FMT.count(c[g])} stocks ›</a></p></details>`; }).join("");
  return head + uniSwitch() + `<p class="sub" style="margin:0 0 12px">All ${FMT.count(U.length)} stocks sorted into 5 groups by simple rules. Tap a group for what it means.${off ? ` <b>Verdict with ${off} part${off > 1 ? "s" : ""} off.</b>` : ""}</p>
    ${strip}<div class="vgcards">${cards}</div>
    ${H && H.weeks ? `<p class="t-label sub">Counts tonight follow your settings; the weekly line and the change use the verdict log (${FMT.count(H.dates.length)} logged dates, ${esc(dateTxt(H.dates[0]))} – ${esc(dateTxt(H.tonight))}).</p>` : ""}
    ${vChangesHTML()}${vFlowHTML()}${rulesComparedHTML(U)}
    <div class="rowlist">
      <a class="rowbtn" href="#/verdicts/qos"><span class="ri">${ic("gem")}</span><span class="rn">Quality on Sale<span class="sub">good businesses whose price fell</span></span><b class="num">${qos}</b></a>
      ${near ? `<a class="rowbtn" href="#/verdicts/near"><span class="ri">${ic("search")}</span><span class="rn">Nearly on sale<span class="sub">fail just one rule</span></span><b class="num">${near}</b></a>` : ""}
    </div>
    <div class="mood" style="margin-top:14px">${gaugeLine() || `<p class="sub" style="margin:0">📊 Market gauge: not available tonight.</p>`}
      <p class="sub">Personal research only – not advice. The verdict is a set of simple rules, not a prediction.</p></div>`;
}
// ---------- review #70 (V2): what changed tonight – from → to with the exact reason from the logged inputs of both nights ----------
let VCHF = "all";
function vChangesHTML() {
  const H = VH(); if (!H) return "";
  if (!H.prev) return `<section class="panel"><h2>What changed tonight</h2><p class="sub">Starts once the verdict log has two data dates.</p></section>`;
  const sm = H.summary || { up: 0, down: 0, same: 0 }, L = (H.changes || []).filter(c => VCHF === "all" || c.d === VCHF);
  const nm = t => BY[t] ? BY[t].name : t;
  return `<section class="panel vchanges"><h2>What changed tonight</h2>
    <p class="mline vsum"><b class="num">${FMT.count(sm.up)}</b> up · <b class="num">${FMT.count(sm.down)}</b> down · <b class="num">${FMT.count(sm.same)}</b> unchanged <span class="sub">(${esc(dateTxt(H.prev))} → ${esc(dateTxt(H.tonight))})</span></p>
    <div class="segpick" role="group" aria-label="Show">${[["all", "All"], ["up", "Moved up"], ["down", "Moved down"]].map(([v, n]) => `<button class="chip${VCHF === v ? " on" : ""}" type="button" data-act="vchf" data-v="${v}" aria-pressed="${VCHF === v}">${n}</button>`).join("")}</div>
    ${L.length ? `<div class="vchlist">${L.map(c => `<div class="vch" data-sym="${esc(c.s)}" data-d="${c.d}"><div class="vchtop"><button class="linkbtn" type="button" data-act="vladder" data-sym="${esc(c.s)}">${esc(nm(c.s))}</button>
      <span class="vft">${vgPill(c.f)} → ${vgPill(c.t)}</span></div>${c.why.map(w => `<p class="mini vwhy">${esc(w)}</p>`).join("")}</div>`).join("")}</div>`
      : `<p class="sub">${VCHF === "all" ? "No verdict changed tonight." : "None in this direction tonight."}</p>`}
    <p class="t-label sub">Reasons compare the logged inputs of both nights (quality, the gap to fair value, the view used, confidence) with the Rules v1.0 thresholds; red flags, the trend check and method agreement aren't logged, so a move they caused says "reason not recorded".</p></section>`;
}
// ---------- review #70 (V6): verdict history – weekly squares per stock and the Flow table, only dates the log has ----------
const VH_CODE = { b: "buy", a: "acc", h: "hold", t: "trim", v: "avoid" };
function vhistHTML(s) {
  const H = VH(); if (!H || !H.weeks || !s.vh) return "";
  const w = H.weeks, codes = s.vh.split("").slice(-12), dates = w.slice(-codes.length);
  const present = [...new Set(codes.filter(c => VH_CODE[c]).map(c => VH_CODE[c]))];
  return `<section class="panel vhist" data-sym="${esc(s.symbol)}"><h2>Verdict history</h2>
    <figure class="vhfig" data-chart="Verdict history">${ktitle(present.map(g => kw(vgName(g), `var(--vg-${g})`)).join(" · ") || "No logged verdicts", "p")}
      <div class="vhsq-row" role="group" aria-label="Weekly verdicts">${codes.map((c, i) => { const g = VH_CODE[c];
        return `<button class="vhsq${g ? "" : " none"}" type="button" data-act="vhsq" data-i="${i}" data-d="${esc(dates[i])}" data-c="${esc(c)}"${g ? ` data-series="${esc(vgName(g))}" data-vgc="${g}" style="background:var(--vg-${g})"` : ""} aria-label="${esc(dateTxt(dates[i]))}: ${g ? esc(vgName(g)) : "not logged"}"></button>`; }).join("")}</div>
      <figcaption class="t-label sub">One square per week (the last logged data date of each week), ${FMT.count(codes.length)} week${codes.length === 1 ? "" : "s"} logged: ${esc(dateTxt(dates[0]))} – ${esc(dateTxt(dates[dates.length - 1]))}. Tap a square.</figcaption></figure>
    <p class="mline" data-vhout aria-live="polite"></p></section>`;
}
function vhSquare(el) {
  const box = el.closest(".vhist"), sqs = [...box.querySelectorAll(".vhsq")], i = +el.dataset.i, c = el.dataset.c, g = VH_CODE[c];
  let n = 0; for (let j = i; j >= 0 && sqs[j].dataset.c === c; j--) n++;
  box.querySelectorAll(".vhsq.on").forEach(x => x.classList.remove("on")); el.classList.add("on");
  box.querySelector("[data-vhout]").textContent = g ? `${dateTxt(el.dataset.d)}: ${vgName(g)} – ${n} week${n === 1 ? "" : "s"} in a row in this group` : `${dateTxt(el.dataset.d)}: not in the verdict log`;
}
function vFlowHTML() {
  const H = VH(); if (!H) return "";
  if (!H.flow) return `<section class="panel"><h2>Flow: last week → tonight</h2><p class="sub">Starts once the verdict log has a data date a week before tonight.</p></section>`;
  const F = H.flow, G = VGS(), rs = g => G.reduce((a, t) => a + F.m[g][t], 0), cs = t => G.reduce((a, f) => a + F.m[f][t], 0);
  return `<section class="panel vflow"><h2>Flow: last week → tonight</h2><p class="sub">Rows: the group on ${esc(dateTxt(F.from))}; columns: tonight (${esc(dateTxt(F.to))}). The diagonal stayed put.</p>
    <div class="tablewrap noterm"><table class="hist flowt noterm"><thead><tr><th>${esc(dateTxt(F.from))} ↓ · tonight →</th>${G.map(t => `<th>${vgPill(t)}</th>`).join("")}<th>Total</th></tr></thead>
    <tbody>${G.map(f => `<tr><td class="l">${vgPill(f)}</td>${G.map(t => `<td class="num${f === t ? " diag" : ""}" data-f="${f}" data-t="${t}">${F.m[f][t] ? FMT.count(F.m[f][t]) : "·"}</td>`).join("")}<td class="num" data-rs="${f}"><b>${FMT.count(rs(f))}</b></td></tr>`).join("")}
      <tr><td class="l"><b>Total</b></td>${G.map(t => `<td class="num" data-cs="${t}"><b>${FMT.count(cs(t))}</b></td>`).join("")}<td class="num"><b>${FMT.count(G.reduce((a, g) => a + rs(g), 0))}</b></td></tr></tbody></table></div>
    <p class="t-label sub">Only stocks logged on both dates. From the write-once verdict log.</p></section>`;
}
// ---------- review #70 (V3): the price ladder – the price-based parts of the Rules v1.0 verdict, drawn as zones ----------
function ladderZones(s) {
  const R = VR(); if (R.trim == null || !SET.master) return null;
  const v = vfor(s); if (!v || !v.va || v.va.fair == null) return null;
  const fair = v.va.fair, trimAt = s.v4 && s.v4.hy ? R.trim_hype : R.trim, uv = usedViews(v);
  const view = uv && uv.main && uv.main.value ? uv.main : { value: fair, what: "consensus fair value", nm: "consensus" };
  const pTrim = fair * (1 + trimAt / 100), pAcc = fair * (1 + R.acc_band / 100), pBuy = Math.min(view.value * (1 - v.margin / 100), pAcc);
  return { fair, pTrim, pAcc, pBuy, trimAt, margin: v.margin, view, q: v.q, hard: (v.flags || []).some(f => f.hard !== false), enough: v.va.enough !== false, g: v.g, R };
}
function ladderZone(z, p) {
  if (z.hard || z.q == null || z.q < z.R.q_avoid) return "avoid";
  if (!z.enough) return "hold";
  if (p > z.pTrim) return "trim";
  if (z.q >= z.R.q_good) return p <= z.pBuy ? "buy" : p <= z.pAcc ? "acc" : "hold";
  return "hold";
}
function ladderEdges(z) {          // [from price, to price, zone] along the price axis
  if (z.hard || z.q == null || z.q < z.R.q_avoid) return [[0, Infinity, "avoid"]];
  if (!z.enough) return [[0, Infinity, "hold"]];
  return z.q >= z.R.q_good ? [[0, z.pBuy, "buy"], [z.pBuy, z.pAcc, "acc"], [z.pAcc, z.pTrim, "hold"], [z.pTrim, Infinity, "trim"]] : [[0, z.pTrim, "hold"], [z.pTrim, Infinity, "trim"]];
}
function ladderNext(z, p) {
  const E = ladderEdges(z), i = E.findIndex(([a, b]) => p > a && p <= b), out = [];
  if (i > 0) out.push(`${vgName(E[i - 1][2])} starts at ${inr(E[i - 1][1], 0)} and below`);
  if (i >= 0 && i < E.length - 1) out.push(`${vgName(E[i + 1][2])} starts above ${inr(E[i][1], 0)}`);
  return out.join(" · ");
}
function ladderHTML(s) {
  const z = ladderZones(s); if (!z) return "";
  const p = s.close, lo = Math.min(z.pBuy, p, z.fair) * 0.85, hi = Math.max(z.pTrim, p, z.fair) * 1.12, x = n => FMT.coord(Math.min(100, Math.max(0, (n - lo) / (hi - lo) * 100)));
  const side = n => +x(n) < 18 ? " left" : +x(n) > 82 ? " right" : "";
  const E = ladderEdges(z), zone = ladderZone(z, p), names = [...new Set(E.map(e => e[2]))];
  const notes = [];
  if (z.hard) notes.push("A hard red flag decides: Avoid at any price.");
  else if (z.q != null && z.q < z.R.q_avoid) notes.push(`Quality ${FMT.num(z.q, 0)} is below ${z.R.q_avoid}: Avoid at any price.`);
  else if (z.q != null && z.q < z.R.q_good) notes.push(`Buy also needs quality ${z.R.q_good}+ – this stock has ${FMT.num(z.q, 0)}.`);
  if (!z.enough) notes.push("Fewer than 3 valuation methods agree, so the price doesn't decide (Hold).");
  if (names.includes("buy")) notes.push(`In the Buy zone the other Buy checks must pass too (methods agree, trend OK, no caution flags). Buy is tested on the ${esc(z.view.what)} ${inr(z.view.value, 0)} with a ${FMT.num(z.margin, 0)}% margin.`);
  return `<section class="panel ladder" data-ladder-sym="${esc(s.symbol)}"><h2>Price ladder</h2>
    <figure class="lad" data-chart="Price ladder">${ktitle(names.map(g => kw(vgName(g), `var(--vg-${g})`)).join(" · ") + ` · ${kw("Price", "var(--ink)")} · ${kw("Fair value", "var(--lad-fair)")}`, "p")}
      <div class="ladbar">${E.map(([a, b, g]) => `<i class="lz" data-series="${esc(vgName(g))}" data-vgc="${g}" data-from="${a}" data-to="${b === Infinity ? "" : b}" style="left:${x(Math.max(a, lo))}%;width:${FMT.coord(x(Math.min(b, hi)) - x(Math.max(a, lo)))}%;background:var(--vg-${g})"></i>`).join("")}
        <i class="lf" data-series="Fair value" style="left:${x(z.fair)}%"></i><i class="lp" data-series="Price" style="left:${x(p)}%"></i>
        <span class="vlab t-label top${side(z.fair)}" data-label="Fair value" style="left:${x(z.fair)}%"><b class="num">Fair value ${inr(z.fair, 0)}</b></span><span class="vlab t-label bot${side(p)}" data-label="Price" style="left:${x(p)}%"><b class="num">Price ${inr(p, 0)}</b></span></div>
      <figcaption class="mini">${E.map(([a, b, g]) => `${vgName(g)} ${b === Infinity ? (a ? "above " + inr(a, 0) : "at any price") : a ? inr(a, 0) + "–" + inr(b, 0) : "up to " + inr(b, 0)}`).join(" · ")}</figcaption></figure>
    <p class="mline">Tonight's price is in the <b>${esc(vgName(zone))}</b> zone.</p>
    <label class="fl">What if the price is… <b class="num" data-ladv>${inr(p, 0)}</b><input type="range" data-ladder="${esc(s.symbol)}" min="${FMT.coord(lo)}" max="${FMT.coord(hi)}" step="${FMT.coord((hi - lo) / 200)}" value="${FMT.coord(p)}"></label>
    <p class="mline" data-ladout>${esc(vgName(zone))} zone · ${esc(ladderNext(z, p))}</p>
    ${notes.map(n => `<p class="mini">${esc(n)}</p>`).join("")}
    <p class="t-label sub">Rules, not predictions: the zones come straight from the Rules v1.0 thresholds (Trim above ${FMT.num(z.trimAt, 0)}% over fair value, Accumulate within ${z.R.acc_band}%, Buy ${FMT.num(z.margin, 0)}%+ below).</p></section>`;
}
function ladderSlide(inp) {
  const s = BY[inp.dataset.ladder], z = s && ladderZones(s); if (!z) return;
  const p = +inp.value, box = inp.closest(".ladder"), g = ladderZone(z, p);
  box.querySelector("[data-ladv]").textContent = inr(p, 0);
  box.querySelector("[data-ladout]").textContent = `${vgName(g)} zone · ${ladderNext(z, p)}`;
}
document.addEventListener("input", e => { if (e.target.matches && e.target.matches("[data-ladder]")) ladderSlide(e.target); });
document.addEventListener("input", e => {                    // review #74: text size follows the slider; Settings search filters the options
  if (e.target.matches && e.target.matches("[data-pzrange]")) { document.documentElement.style.fontSize = e.target.value + "px"; const o = document.querySelector("[data-fsout]"); if (o) o.textContent = e.target.value + " px"; }
  if (e.target.id === "setq") setSearch(e.target.value);
});
function setSearch(q) {
  const t = q.trim().toLowerCase(), ops = [...document.querySelectorAll("#screen .setopt")];
  ops.forEach(o => { const hit = !t || (o.dataset.sk + " " + o.textContent).toLowerCase().includes(t); o.hidden = !hit; o.classList.toggle("hit", !!t && hit); });
  document.querySelectorAll("#screen .setgrp").forEach(g => { g.hidden = !!t && !g.querySelector(".setopt:not([hidden])"); });
  const first = t && document.querySelector("#screen .setopt.hit"); if (first) first.scrollIntoView({ block: "center" });
}
function vLadderSheet(sym) {
  const show = () => { const s = BY[sym]; if (!s) return; sheet(`<h2>${esc(s.name)}</h2>${ladderHTML(s) || `<p class="sub">No fair value tonight, so there is no price ladder.</p>`}${vhistHTML(s)}
    <div class="btnrow"><a class="act big" href="${stockHref(sym)}" data-close-go="1">Open the stock page</a><button class="act" type="button" data-close>Close</button></div>`); };
  ensureFull(sym).then(show);
}
// ---------- review #71: the best-suited method (Rules v1.2 test) – one card, the second-opinion dots, every method with a star ----------
// Rules v1.0 stays the official verdict everywhere; v1.2 is computed by the nightly (pipeline/value_v12.py, rules_v1_2.py) and only shown.
const MTAB = () => (S.rules && S.rules.method) || { rows: [], names: {} };
const v12name = k => MTAB().names[k] || MNAME[k] || k;
const bmGap = g => g == null ? "" : Math.abs(g) < 0.5 ? "at that value" : `${FMT.num(Math.abs(g), 0)}% ${g < 0 ? "cheaper" : "costlier"}`;
function bmDots(s, b) {
  const others = (b.tb || []).filter(r => r.agrees !== undefined && r.b), main = b.v, p = s.close;
  if (!main || !others.length) return "";
  const vals = [main, p, main * 0.75, main * 1.25, ...others.map(r => r.b)], lo = Math.min(...vals) * 0.92, hi = Math.max(...vals) * 1.06;
  const x = n => FMT.coord(Math.min(100, Math.max(0, (n - lo) / (hi - lo) * 100))), side = n => +x(n) < 18 ? " left" : +x(n) > 82 ? " right" : "";
  return `<figure class="bmd" data-chart="Second opinion">${ktitle(`${kw("Main method", "var(--lad-fair)")} · ${kw("Agrees", "var(--d-blue)")} · ${kw("Doesn't agree", "var(--ink-3)")} · ${kw("Price", "var(--ink)")}`, "p")}
    <div class="bmbar"><i class="bmband" style="left:${x(main * 0.75)}%;width:${FMT.coord(x(main * 1.25) - x(main * 0.75))}%"></i>
      ${others.map(r => `<i class="bmdot${r.agrees ? " ok" : ""}" data-series="${r.agrees ? "Agrees" : "Doesn't agree"}" style="left:${x(r.b)}%" title="${esc(r.n)} ${esc(inr(r.b, 0))}"></i>`).join("")}
      <i class="lf" data-series="Main method" style="left:${x(main)}%"></i><i class="lp" data-series="Price" style="left:${x(p)}%"></i>
      <span class="vlab t-label top${side(main)}" data-label="Main method" style="left:${x(main)}%"><b class="num">${esc(inr(main, 0))}</b></span><span class="vlab t-label bot${side(p)}" data-label="Price" style="left:${x(p)}%"><b class="num">Price ${esc(inr(p, 0))}</b></span></div>
    <figcaption class="mini">${others.map(r => `${esc(r.n)} ${esc(inr(r.b, 0))}${r.agrees ? " ✓" : ""}`).join(" · ")}. The shaded band is within ±${MTAB().band || 25}% of the main value; ✓ = agrees. Reverse DCF is a check, not a dot.</figcaption></figure>`;
}
function bestCardHTML(s, full) {
  const b = s.v4 && s.v4.v12; if (!b || !SET.master) return "";
  const v = vfor(s), og = v ? v.g : s.v4.g, ag = b.ag || {};
  const star = b.us ? (b.bk ? "☆" : "⭐") : "";
  const nm = b.us ? `${star} ${esc(v12name(b.us))}${b.bk ? ` <span class="sub">(backup)</span>` : ""}` : "No usable method tonight";
  const line = b.v ? `value <b class="num">${esc(inr(b.v, 0))}</b> <span class="sub">(range ${esc(inr(b.lo, 0))}–${esc(inr(b.hi, 0))})</span> → price <b class="num">${esc(inr(s.close, 0))}</b> is <b>${esc(bmGap(b.gap))}</b>` : "";
  const agl = ag.l || "Low";
  return `<section class="panel bestm" data-bm="${esc(s.symbol)}">
    <h2>Best method for this stock <button class="ib" type="button" data-act="bminfo" data-sym="${esc(s.symbol)}" aria-label="Why this method?">ⓘ</button></h2>
    <p class="bmname t-number-lg">${nm}</p>
    <p class="mini">${esc(b.why || "")} <span class="sub">· ${esc(b.st)}${b.ss && b.ss !== "sector group" ? " – " + esc(b.ss) : ""}</span></p>
    ${b.nt ? `<p class="note">${esc(b.nt)}</p>` : ""}
    ${line ? `<p class="mline">${line}</p>` : ""}
    <p class="bmag"><span class="agchip ag-${agl}">Agreement: ${esc(agl)}</span> <span class="mini">second opinion: ${FMT.count(ag.a || 0)} of ${FMT.count(ag.n || 0)} other method${ag.n === 1 ? "" : "s"} agree${ag.a === 1 && ag.n === 1 ? "s" : ""}</span></p>
    ${full ? bmDots(s, b) : ""}
    <p class="bmv mline"><span class="vgp" style="--vgc:var(--vg-${og})">Verdict (Rules v1.0, official): <b>${esc(vgName(og))}</b></span></p>
    ${dqLow(s.symbol) ? dqFailLine(s) : `<p class="bmv mline"><span class="vgp" style="--vgc:var(--vg-${b.g})">New method test (Rules v1.2): <b>${esc(vgName(b.g))}</b></span> <span class="t-label sub">${b.lb && b.lb !== vgName(b.g) && b.lb !== "Buy" ? esc(b.lb) + " · " : ""}${b.g !== "buy" && b.v ? `a Buy needs ${FMT.num(b.mg, 0)}% below (${esc(agl)} agreement)` : ""}</span></p>`}
    ${full && b.oo ? `<p class="mini">One-off items left out: ${esc(b.oo.why)}.</p>` : ""}
    ${full && b.rs ? `<p class="mini">History reset on ${esc(dateTxt(b.rs.date))}: ${esc(b.rs.why)} (${esc(b.rs.src)}).</p>` : ""}
    ${full && b.pf && b.pf.fit === false ? `<p class="mini">Peers may not fit: ${esc(b.pf.why)} – peer methods can't be the main method.</p>` : ""}
    <p class="t-label sub">Rules, not predictions. Rules v1.0 stays the official verdict in every list, screen and model portfolio.</p></section>`;
}
function methodTableHTML(s) {
  const b = s.v4 && s.v4.v12; if (!b || !SET.master || !(b.tb || []).length) return "";
  const rank = r => r.star === "main" ? 0 : r.star === "backup" ? 1 : r.k === "rdcf" ? 5 : r.plan && r.b ? 2 : r.plan ? 3 : r.b ? 4 : 6;
  const all = b.tb.slice().sort((a, c) => rank(a) - rank(c)), rows = all.filter(r => r.star || r.b || r.k === "rdcf"), na = all.filter(r => !(r.star || r.b || r.k === "rdcf"));
  const tr = r => { const st = r.star === "main" ? "⭐ " : r.star === "backup" ? "☆ " : "";
    const val = r.k === "rdcf" ? (r.implied != null ? `assumes <b class="num">${FMT.num(r.implied, 0)}%</b> a year` : "–") : r.b ? `<b class="num">${esc(inr(r.b, 0))}</b><br><span class="sub"><span class="num">${esc(inr(r.lo, 0))}</span>–<span class="num">${esc(inr(r.hi, 0))}</span></span>` : `<span class="sub">–</span>`;
    const gap = r.k === "rdcf" ? (r.hist != null ? `business grew ${FMT.num(r.hist, 0)}%` : "") : r.b ? esc(bmGap(r.gap)) : "";
    const extra = [r.star === "backup" ? "backup used" : "", r.st === "na" && r.why ? "Not available: " + r.why : "", r.nofit || "", r.yrs != null ? `${r.yrs} yr${r.yrs === 1 ? "" : "s"} of inputs` : ""].filter(Boolean);
    return `<tr${r.star ? ` class="mstar"` : ""}><td class="l"><b>${st}${esc(r.n)}</b><br><span class="sub">${esc(r.k === "rdcf" ? "What growth the price assumes – a check, never a price" : r.fits)}</span>${extra.length ? `<br><span class="sub">${esc(extra.join(" · "))}</span>` : ""}</td><td>${val}${gap ? `<br><span class="mtg">${gap}</span>` : ""}</td></tr>`; };
  return `<section class="panel mtab"><h2>Every method for this stock</h2>
    <p class="sub">⭐ = the main method for ${b.st === "Loss-making" ? "a loss-making company" : "a " + esc(b.st)} · ☆ = backup used (the main one isn't usable). The Rules v1.2 verdict uses only the starred (or backup) value; the others are a second opinion.${b.pl ? ` Peers: ${esc(b.pl)}.` : ""}</p>
    <div class="tablewrap"><table class="hist mtt noterm"><thead><tr><th class="l">Method</th><th>Value (bear–bull) · price vs value</th></tr></thead><tbody>${rows.map(tr).join("")}</tbody></table></div>
    ${na.length ? `<details class="mtna"><summary class="mline">${FMT.count(na.length)} more method${na.length === 1 ? "" : "s"} can't value this stock tonight</summary><div class="tablewrap"><table class="hist mtt noterm"><tbody>${na.map(tr).join("")}</tbody></table></div></details>` : ""}
    <p class="t-label sub">Values use profit before one-off items and, after a demerger or merger, only the years since. Rules, not predictions.</p></section>`;
}
function methodRowsHTML(hl) {
  const R = MTAB().rows || [];
  return `<div class="tablewrap"><table class="hist mtt noterm"><thead><tr><th class="l">Style</th><th class="l">Main method</th><th class="l">Backups, in order</th></tr></thead><tbody>
    ${R.map(r => `<tr${r.style === hl ? ` class="mstar"` : ""}><td class="l"><b>${esc(r.style)}</b><br><span class="sub">${esc(r.why)}</span></td><td class="l">⭐ ${esc(v12name(r.main))}</td><td class="l">${r.backups.length ? r.backups.map(k => esc(v12name(k))).join(", ") : "–"}</td></tr>`).join("")}</tbody></table></div>`;
}
function bmInfoSheet(sym) {
  const s = BY[sym], b = s && s.v4 && s.v4.v12; if (!b) return;
  const r = (MTAB().rows || []).find(x => x.style === b.st);
  sheet(`<h2>Why this method?</h2>
    ${r ? `<p><b>${esc(r.style)}:</b> ${esc(r.why)}</p><p class="mini">Main method ⭐ ${esc(v12name(r.main))}${r.backups.length ? ` · backups, in order: ${r.backups.map(k => esc(v12name(k))).join(", ")}` : ""}.</p>` : ""}
    <p class="mini">The main method is used only if it can be calculated, its value is above 0 and it has at least ${FMT.count(MTAB().min_years || 4)} years of inputs (peer methods: the peers must fit); otherwise the first backup that passes. Agreement = share of the other methods within ±${MTAB().band || 25}% of the main value: ${MTAB().high || 70}%+ High, ${MTAB().med || 50}–${MTAB().high || 70}% Medium, below that Low.</p>
    ${b.nt ? `<p class="note">${esc(b.nt)}</p>` : ""}
    <p class="mini"><a href="#/learn/best_method" data-close-go="1">The whole table in Learn →</a></p>
    <p class="sub">Rules, not predictions. Not investment advice.</p><div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`);
}
function rulesComparedHTML(U) {
  const has = U.filter(s => s.v4 && s.v4.v12 && s.v4.v12.g && !dqLow(s.symbol)); if (!has.length) return "";   // #81 C6: data check failed → no v1.2 verdict
  const a = { buy: 0, acc: 0, hold: 0, trim: 0, avoid: 0 }, c = { ...a }; let diff = 0;
  has.forEach(s => { const v = vfor(s), g0 = v ? v.g : s.v4.g, g2 = s.v4.v12.g; a[g0]++; c[g2]++; if (g0 !== g2) diff++; });
  const gh = [["Rules v1.0", S.portfolio], ["Rules v1.1", S.portfolio_v1_1], ["Rules v1.2", S.portfolio_v1_2]].map(([n, p]) => { const st = p && p.stats;
    return `<tr><td class="l">${n}</td><td>${st && st.started ? `<b class="num">${FMT.pct(st.ret, 2)}</b> <span class="sub">since ${esc(dateTxt(st.started))}</span>` : `<span class="sub">${p && p.pending ? "starts at the next trading day's close" : "starts at its first nightly run on main"}</span>`}</td></tr>`; }).join("");
  return `<section class="panel rcmp"><h2>Rules compared</h2>
    <p class="sub">The official verdict (Rules v1.0, your settings) next to the new method test (Rules v1.2: the best-suited method's value, Buy margin 25 / 30 / 40% by agreement). ${FMT.count(diff)} of ${FMT.count(has.length)} stocks get a different group.</p>
    <div class="tablewrap"><table class="hist noterm"><thead><tr><th class="l">Group</th><th>Rules v1.0 (official)</th><th>Rules v1.2 (test)</th></tr></thead><tbody>
      ${VGS().slice().reverse().map(g => `<tr><td class="l"><span class="vgdot" data-vgc="${g}" style="--vgc:var(--vg-${g})"></span> ${esc(vgName(g))}</td><td class="num">${FMT.count(a[g])}</td><td class="num">${FMT.count(c[g])}</td></tr>`).join("")}</tbody></table></div>
    <h3 class="minor">Model portfolios (paper ₹10 lakh)</h3>
    <div class="tablewrap"><table class="hist noterm"><tbody>${gh}</tbody></table></div>
    <p class="t-label sub">Rules, not predictions. <a href="#/learn/rules_v12">What Rules v1.2 is ›</a> · <a href="#/models">Model portfolios ›</a></p></section>`;
}
function groupScreen(g) {
  const q = GROUPS[g];
  if (!q) return null;
  const [ic, nm, help] = VG[g] ? [VG[g][0], VG[g][1], VG_HELP[g]] : GROUP_NAME[g];
  const back = `<button class="back" type="button" data-back="#/verdicts">← Verdicts</button>`;
  if (!SET.master) return back + `<div class="scr-h"><h1>${ic} ${esc(nm)}</h1></div>` + verdictsOff();
  const r = runQuery(q), n = r.list.length;
  return back + `<div class="scr-h"><h1>${ic} ${esc(nm)}</h1><span class="sub num">${n} stock${n === 1 ? "" : "s"}</span></div>
    <p class="resplain" style="margin:0 0 12px">${esc(help)}${r.order ? ` Sorted: ${esc(r.order)}.` : ""}</p>
    ${n ? cardsHTML(r.list, "group:" + g + ":" + UNI, r.tree) : `<p class="empty">No stocks in this group tonight.</p>`}`;
}

function sectorsScreen() {
  const keys = Object.keys(SECT).filter(k => secMembers(k).length);
  return `<div class="scr-h"><h1>Browse sectors</h1></div>${uniSwitch()}
    <p class="sub" style="margin:0 0 12px">Each sector page shows only the numbers that matter for that kind of business (a bank's debt-to-equity is hidden, for example), with ready-made screens and the sector's middle values.</p>
    ${keys.length ? `<div class="secgrid">${keys.map(k => { const ms = secMembers(k), c = { buy: 0, acc: 0 };
      if (SET.master) ms.forEach(s => { const v = vfor(s); if (v && c[v.g] != null) c[v.g]++; });
      return `<a class="secbtn" href="#/sector/${encodeURIComponent(k)}" style="text-decoration:none"><span class="sn skchip" data-sk="${esc(k)}">${SECT[k].icon} ${esc(SECT[k].label)}</span><span class="sc">${ms.length} stocks${SET.master ? ` · 🟢 ${c.buy} · 🟡 ${c.acc}` : ""}</span></a>`; }).join("")}</div>` : `<p class="empty">No sector pages tonight.</p>`}`;
}

// ----- ❓ Help & Ask Claude (review #35): the nightly guide.md, a copyable question for the user's own Claude, report a problem
const GUIDE_URL = "https://nightscreener.github.io/guide.md";
const ASK_TEXT = `Read ${GUIDE_URL} and answer my question about the Nifty 500 Night Screener: <your question>`;
function mdInline(t) {
  return esc(t).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/(https:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}
function mdToHtml(md) {                       // the guide's small Markdown: ## sections (collapsible), ### headings, lists, paragraphs
  const secs = [], lines = String(md || "").split("\n");
  let cur = null, html = "", list = false;
  const close = () => { if (list) { html += "</ul>"; list = false; } };
  const flush = () => { close(); if (cur) secs.push(`<details class="panel gsec"><summary>${mdInline(cur)}</summary>${html}</details>`); html = ""; };
  for (const l of lines) {
    if (l.startsWith("# ")) continue;
    if (l.startsWith("## ")) { flush(); cur = l.slice(3); continue; }
    if (l.startsWith("### ")) { close(); html += `<h3 class="minor">${mdInline(l.slice(4))}</h3>`; continue; }
    if (l.startsWith("- ")) { if (!list) { html += `<ul class="mini">`; list = true; } html += `<li>${mdInline(l.slice(2))}</li>`; continue; }
    close();
    if (l.trim()) html += `<p class="mini">${mdInline(l)}</p>`;
  }
  flush();
  return secs.join("");
}
function reportText() {
  const ua = navigator.userAgent, br = /CriOS/.test(ua) ? "Chrome (iOS)" : /Safari/.test(ua) && !/Chrome/.test(ua) ? "Safari" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : "other";
  const dev = /iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : "computer";
  return [`Problem report – Nifty 500 Night Screener`, `App data: ${S.trade_date} (updated ${S.generated_at || "?"})`,
    `Screen: ${HELP_FROM || location.hash || "#/home"}`, `Device: ${dev}, ${window.innerWidth}×${window.innerHeight}, ${br}`,
    `What I tapped: `, `What I expected: `, `What happened instead: `].join("\n");
}
let HELP_FROM = null;                          // the screen the user was on before opening Help (for the report)
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try { const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t);
        t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch (e) { return false; }
}
function downloadGuide() {
  const a = document.createElement("a"), url = URL.createObjectURL(new Blob([S.guide || ""], { type: "text/markdown" }));
  a.href = url; a.download = "guide.md"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
}
function helpScreen() {
  return `<button class="back" type="button" data-back="#/more">← More</button>
    <div class="scr-h"><h1>Help &amp; Ask Claude</h1></div>
    <section class="panel"><h2>Ask Claude about this app</h2>
      <p class="mini" style="margin:0 0 6px">Open your own Claude (claude.ai or the app), paste this, and replace &lt;your question&gt;:</p>
      <pre class="copybox" id="asktext">${esc(ASK_TEXT)}</pre>
      <div class="btnrow"><button class="act big" type="button" data-copy="ask">${ic("copy")} Copy</button>${S.guide ? `<button class="act" type="button" data-guide="dl">${ic("download")} Download guide</button>` : ""}<span class="mini copied" id="copied-ask" role="status"></span></div>
      <p class="sub">If your Claude can't open links, tap ⬇️ Download guide and attach the file instead. Claude answers from the guide; it doesn't know your Watchlist or Portfolio.</p></section>
    <section class="panel"><h2>Report a problem</h2>
      <p class="mini" style="margin:0 0 6px">Copy this, fill in the last three lines, and send it to Karma on WhatsApp.</p>
      <pre class="copybox" id="reporttext">${esc(reportText())}</pre>
      <div class="btnrow"><button class="act big" type="button" data-copy="report">${ic("copy")} Copy report</button><span class="mini copied" id="copied-report" role="status"></span></div></section>
    <section class="panel" id="helpgl"><h2>Glossary – every term on the site</h2>
      <p class="mini" style="margin:0 0 6px">The one shared glossary (${FMT.count(Object.keys(GL).length)} terms): every explanation sheet's "What it is" comes from here, so a term always reads the same way. Tap a term for its sheet.</p>
      <label class="fl">Search the glossary<input type="search" id="hglq" placeholder="e.g. ROCE, tailwind, budget, P/E" autocomplete="off" enterkeyhint="search"></label>
      <div class="chips hglist" id="hglist">${Object.entries(GL).filter(([, t]) => t.meaning).sort((a, b) => String(a[1].name).localeCompare(String(b[1].name))).map(([k, t]) =>
        `<button class="chip" type="button" data-act="hgl" data-v="${esc(k)}" data-q="${esc(`${t.name} ${t.group || ""} ${t.meaning}`.toLowerCase())}">${esc(String(t.name).split(" (")[0])}</button>`).join("")}</div>
      <p class="mini sub" id="hglnone" hidden>No term matches – try a shorter word.</p></section>
    <h2 style="margin:16px 0 8px">The guide</h2>
    ${S.guide ? `<p class="sub" style="margin:0 0 8px">The same text your Claude reads, rebuilt every night: <a href="${GUIDE_URL}" target="_blank" rel="noopener">guide.md</a>. Tap a section to open it.</p>${mdToHtml(S.guide)}`
      : `<p class="mini">The guide is published with the page at <a href="${GUIDE_URL}" target="_blank" rel="noopener">${GUIDE_URL}</a>.</p>`}`;
}

// ----- first-visit note for friends (review #35): once, dismissible, remembered only in this browser
const FIRST_KEY = "screener.firstvisit.v1";
const firstSeen = () => { try { return !!(LS && LS.getItem(FIRST_KEY)); } catch (e) { return false; } };
const firstNote = () => firstSeen() ? "" : `<div class="warnbox firstnote">👋 Personal research tool made by Karma for learning – not investment advice. Your Watchlist/Portfolio stay only on your own device.
  <button class="act" type="button" data-firstok="1">OK, got it</button></div>`;

// review #74 A: More → Settings in 4 groups – Personalise · Data & backup · Alerts & checks · About & help – with a search box
const opt = (keys, html, cls) => `<div class="setopt${cls ? " " + cls : ""}" data-sk="${esc(keys)}">${html}</div>`;
// review #83 B: the standard Settings row – title, a one-line description in the secondary style, a › chevron; the whole row taps
const srow = (href, title, sub) => `<a class="setrow" href="${href}"><span class="gt">${esc(title)}<span class="gs">${esc(sub)}</span></span></a>`;
const pzSeg = (key, cur, opts, label) => `<div class="gi"><span class="gt">${label}</span><div class="segpick" role="group" aria-label="${esc(label)}">${opts.map(([v, n]) =>
  `<button class="chip${cur === v ? " on" : ""}" type="button" data-act="skinpref" data-skinpref="${key}" data-v="${v}" aria-pressed="${cur === v}">${n}</button>`).join("")}</div></div>`;
const pzTog = (key, label, sub, def) => `<label class="gi sw"><span class="gt">${label}<span class="gs">${sub}</span></span><input class="switch" type="checkbox" role="switch" data-pref="${key}"${prefGet(key, def) === "1" ? " checked" : ""}></label>`;   // review #83 F: the standard switch
function pzPreview() {                                        // the live mini-preview: the real tokens, formatter and classes
  const s = S.stocks.find(x => x.close && x.change_pct) || S.stocks[0];
  return `<section class="panel pzprev" aria-label="Live preview"><span class="t-label sub">Live preview</span>
    <div class="pzrow"><b>${esc(s.name)}</b><span>${lvlNum(s.change_pct, inr(s.close), "num")} ${chgPill(s.change_pct, 2)}</span></div>
    <div class="pzrow"><span class="t-label sub">Portfolio value</span><span class="num" data-pz="money">${FMT.money(248610, 0)}</span></div>
    <div class="pzrow"><span class="t-label sub">Market cap</span><span class="num" data-pz="cr">${FMT.cr(105832, 0)}</span></div>
    <button class="act primary" type="button" tabindex="-1">Continue lesson</button></section>`;
}
function homeOrderHTML() {
  const L = homeLayout(), nm = Object.fromEntries(HOME_CARDS);
  return `<div class="homeorder">${L.order.map((k, i) => `<div class="horow${L.hidden.has(k) ? " off" : ""}" data-hk="${k}"><span class="dragh" draggable="true" data-hdrag="${k}" role="img" aria-label="Drag to reorder">${ic("more")}</span>
    <span class="hon">${esc(nm[k])}</span><button class="act" type="button" data-act="hmove" data-k="${k}" data-d="-1" aria-label="Move ${esc(nm[k])} up"${i ? "" : " disabled"}>↑</button><button class="act" type="button" data-act="hmove" data-k="${k}" data-d="1" aria-label="Move ${esc(nm[k])} down"${i < L.order.length - 1 ? "" : " disabled"}>↓</button>
    <label class="sw"><input type="checkbox" data-hshow="${k}"${L.hidden.has(k) ? "" : " checked"} aria-label="Show ${esc(nm[k])}"></label></div>`).join("")}</div>
    <button class="act" type="button" data-act="hreset">Reset Home layout</button>`;
}
function settingsScreen() {
  const fs = +prefGet(PZ.fs, "16") || 16;
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>Settings</h1></div>
    <label class="fl setsearch">Find a setting<input id="setq" type="search" placeholder="e.g. text size, theme, backup" autocomplete="off"></label>
    <nav class="chiprow" aria-label="Settings groups"><button class="chip" type="button" data-act="setjump" data-id="set-pz">Personalise</button><button class="chip" type="button" data-act="setjump" data-id="set-data">Data &amp; backup</button><button class="chip" type="button" data-act="setjump" data-id="set-alerts">Alerts &amp; checks</button><button class="chip" type="button" data-act="setjump" data-id="set-about">About &amp; help</button></nav>
    <section class="setgrp" id="set-pz"><h2>Personalise</h2><div class="setcard">
      ${opt("preview look sample", pzPreview())}
      ${opt("theme themes colour color dark light gallery glow auto day night high contrast colour-blind blue orange section sector", themePanel())}
      ${opt("accent colour color button highlight", pzSeg(PZ.accent, prefGet(PZ.accent, ""), [["", "Theme's own"], ...ACCENTS], "Accent colour (never green or red)"))}
      ${opt("text size font bigger smaller", `<label class="gi fl">Text size <b class="num" data-fsout>${fs} px</b><input class="fsrange" type="range" min="13" max="19" step="1" value="${fs}" data-pzrange="${PZ.fs}" aria-label="Text size in pixels"></label>`)}
      ${opt("density compact comfortable roomy rows spacing", pzSeg(PZ.density, prefGet(PZ.density, "comfortable"), [["compact", "Compact"], ["comfortable", "Comfortable"], ["roomy", "Roomy"]], "Density"))}
      ${opt("number style format lakh crore short international", pzSeg(PZ.num, prefGet(PZ.num, "full"), [["full", "₹2,48,610"], ["short", "₹2.49 L"], ["intl", "₹248.6K"]], "Number style"))}
      ${opt("business owner mode hide price prices market cap valuation", pzTog(PZ.owner, "Business Owner Mode", "Hides the price, today's move, market cap, P/E and other price figures, % vs fair value, the verdict and price charts on stock pages, peek sheets and stock rows – judge the business first. Home, Market and Portfolio don't change.", "0"))}
      ${opt("open stocks split view full page ipad wide", pzSeg(STOCK_OPEN_KEY, STOCK_OPEN(), [["split", "Split view"], ["full", "Full page"]], "Open stocks in (wide screens)"))}
      ${opt("calm mode motion animation", pzTog("screener.calm", "Calm mode", "Keeps gains green and losses red, but turns the background tints, glow and buzz off.", "0"))}
      ${opt("reduce motion animation movement", pzTog(PZ.rmotion, "Reduce motion", "No animations or moving shimmer.", "0"))}
      ${opt("tap feedback vibration haptic buzz", pzTog(PZ.haptic, "Tap feedback", "A tiny buzz when you save a star, add a holding or finish a lesson (Android; off in Calm mode).", "1"))}
      ${opt("my home reorder hide cards layout", `<h3 class="minor">My Home</h3>${homeOrderHTML()}`)}
      ${opt("verdict settings what counts", `<h3 class="minor">Verdict</h3>${settingsPanel()}`)}
      ${opt("reset defaults personalise", `<button class="act" type="button" data-act="pzreset">Reset Personalise to defaults</button>`)}
    </div></section>
    <section class="setgrp" id="set-data"><h2>Data &amp; backup</h2><div class="setcard">
      ${opt("quick price today refresh pull yahoo worker delayed live", `<h3 class="minor">Quick price</h3>${qpSettings()}`)}
      ${opt("backup restore export import file data", backupBox(true))}
      ${opt("zerodha import holdings console", srow("#/portfolio", "Import from Zerodha Console", "on the Portfolio tab"), "rowlink")}
      ${opt("tikr files keep delete cancel subscription retention screener excel import data", tikrBox())}
    </div></section>
    <section class="setgrp" id="set-alerts"><h2>Alerts &amp; checks</h2><div class="setcard">
      ${opt("alerts bell notifications", srow("#/alerts", "Alerts", "everything that needs your eyes, in one place"), "rowlink")}
      ${opt("checks jobs schedule status", srow("#/checks", "Checks", "every scheduled job: last run, next due, on time or not"), "rowlink")}
      ${opt("rebalance day date portfolio checklist", rebalRow(), "rowlink")}
      ${opt("rules trial version plan newer v1.2", `<label class="gi">Rules for the plan and budget <select data-planrules>${["v1.0", "v1.2"].map(v => `<option${prefGet(PLAN_RULES, "v1.0") === v ? " selected" : ""}${v !== "v1.0" && !(trials().find(x => x.v === v) || {}).passed ? " disabled" : ""}>${v}</option>`).join("")}</select><span class="gs trialline">${trialWords()}. A newer version can be chosen only after its 6-month trial.</span></label>`)}
      ${opt("maintenance notes owner repairs token", pzTog("screener.maint", "Show maintenance notes", "Data repairs and the public-link token, on Home. Off by default – they are for the person who runs the site; More → Checks always has the detail. Saved in this browser.", "0"))}
    </div></section>
    <section class="setgrp" id="set-about"><h2>About &amp; help</h2><div class="setcard">
      ${opt("about version sources advice learn help", `<p class="mline">Rules ${esc((S.rules || {}).version || "v1.0")} · page built ${esc(FMT.dateTime(S.generated_at))} IST · data of ${esc(dateTxt(S.trade_date))}</p>
      <p class="mini sub">Prices: NSE (end of day); older history and some statements: Yahoo Finance (unofficial); ownership, filings and corporate actions: NSE; orders: SEBI.</p>
      <p class="mini"><b>Personal research tool for learning – not investment advice.</b> Rules, not predictions.</p>
      <p class="mline"><a href="#/learn">Learn ›</a> · <a href="#/help">Help &amp; Ask Claude ›</a></p>`)}
    </div></section>`;
}
function moreScreen() {
  const checks = S.status === "ok" ? `<p class="mini" style="margin:0">🟢 Tonight's data checks all passed.</p>`
    : `<p class="mini" style="margin:0">🟡 Some data checks need a look: ${S.warnings.map(esc).join(" ").replace(/\.$/, "") || "see the validation report"}.</p>`;
  return `<div class="scr-h"><h1>More</h1></div>
    <nav class="glist" aria-label="More screens">
      <a href="#/learn"><span class="gi-ic">${ic("help")}</span><span class="gt">Learn<span class="gs">every number explained – how it's calculated, which way is better, by sector</span></span></a>
      <a href="#/settings"><span class="gi-ic">${ic("more")}</span><span class="gt">Settings<span class="gs">display, maintenance notes, what counts in the verdict, Backup / Restore</span></span></a>
      <a href="#/policy"><span class="gi-ic">${ic("doc")}</span><span class="gt">My Policy<span class="gs">your own limits and plan, checked on Portfolio</span></span></a>
      <a href="#/radar"><span class="gi-ic">${ic("info")}</span><span class="gt">Policy Radar<span class="gs">government actions → sectors → stocks, from official sources; Budget Day</span></span></a>
      ${RRQ() ? `<a href="#/review"><span class="gi-ic">${ic("doc")}</span><span class="gt">Check the AI's reading<span class="gs">${rrLine()}</span></span></a>` : ""}
      ${S.experts ? `<a href="#/experts"><span class="gi-ic">${ic("info")}</span><span class="gt">Experts' View<span class="gs">the market through famous investors' published principles</span></span></a>` : ""}
      <a href="#/week"><span class="gi-ic">${ic("calendar")}</span><span class="gt">Week in review<span class="gs">one screen for the week</span></span></a>
      <a href="#/playbook"><span class="gi-ic">${ic("info")}</span><span class="gt">If the market falls<span class="gs">the plan, written in advance</span></span></a>
      <a href="#/ranking"><span class="gi-ic">${ic("trend")}</span><span class="gt">Core ranking<span class="gs">every eligible stock, best Core score first</span></span></a>
      <a href="#/help"><span class="gi-ic">${ic("help")}</span><span class="gt">Help &amp; Ask Claude<span class="gs">the guide, a question for your own Claude, report a problem</span></span></a>
      <a href="#/checks"><span class="gi-ic">${ic("verdict")}</span><span class="gt">Checks<span class="gs">${(c => c ? (c.lapsed.length ? `🔴 ${c.lapsed.length} job${c.lapsed.length === 1 ? "" : "s"} need${c.lapsed.length === 1 ? "s" : ""} a look` : "✅ every job on time") : "the status of every scheduled job")(S.checks)}</span></span></a>
      <a href="#/dataquality"><span class="gi-ic">${ic("signal")}</span><span class="gt">Data quality<span class="gs">${(c => c ? (c.ok ? "✅ last data check passed" : c.total && c.total.failed ? `🔴 ${c.total.failed} problem${c.total.failed === 1 ? "" : "s"} in the last check` : "last data check") + " · " + dateTxt(c.date) : "how the numbers are checked, and how sure we are of each source")(DQ().check)}</span></span></a>
      <a href="#/verdicts"><span class="gi-ic">${ic("verdict")}</span><span class="gt">Today's verdicts<span class="gs">all ${FMT.count(S.stocks.length)} stocks in 5 groups</span></span></a>
      <a href="#/sectors"><span class="gi-ic">${ic("sectors")}</span><span class="gt">Browse sectors<span class="gs">banks, IT, pharma …</span></span></a>
      <a href="#/investors"><span class="gi-ic">${ic("eye")}</span><span class="gt">Investors<span class="gs">well-known investors' holdings above 1%, quarter by quarter</span></span></a>
      <a href="#/models"><span class="gi-ic">${ic("trend")}</span><span class="gt">Model portfolios<span class="gs">Rules v1.0 and v1.1 on paper vs Nifty 500 TRI</span></span></a>
    </nav>
    <h3 class="gl">Learn</h3>
    <nav class="glist"><a href="#/learn/settings"><span class="gt">Learn settings<span class="gs">language (English / Hinglish), Plain mode, the name on certificates</span></span></a></nav>
    ${pastHome()}
    <section class="panel"><h2>How to read this page</h2>
      <p class="sub" style="margin:0 0 8px">Start on 🏠 Home. 🔍 Search finds a stock by name or by rules; 🟢 Verdicts sorts all 500 into groups; 🏦 Sectors compares companies of the same kind. Tap any stock for its full page. Tap ⓘ next to a word for its meaning.</p>
      <details id="allterms"><summary>All ${FMT.count(Object.keys(GL).length)} terms, with search</summary>
        <label class="fl">Find a term<input id="glq" type="search" placeholder="e.g. ROCE, XIRR"></label>
        <nav class="glist" id="glqlist" aria-label="All terms">${Object.keys(GL).sort((a, b) => GL[a].name.localeCompare(GL[b].name)).map(k => `<a href="#/learn/${encodeURIComponent(k)}" data-gl="${esc((GL[k].name + " " + (GL[k].meaning || "")).toLowerCase())}"><span class="gt">${esc(GL[k].name)}<span class="gs">${esc(GL[k].meaning || "")}</span></span></a>`).join("")}</nav>
        <p class="mini"><a href="#/learn">Open Learn – every term grouped, with its full page →</a></p></details>
      <details><summary>The ready-made screens, in plain words</summary>
        <div class="gloss noterm">${CHIPS.map(([l, q, plain]) => `<div class="term"><div class="k"><span>${esc(l)}</span></div><span>${esc(plain[0].toUpperCase() + plain.slice(1))}.</span><span class="ex">Typed rule: ${esc(q)}</span></div>`).join("")}</div></details>
      ${(b => b ? `<details id="stage6b"><summary>Are the verdicts tested? (Stage 6b)</summary><div class="legendbox">
        <span>The Core score was backtested in Stage 6. The verdicts (fair value, Strict / Balanced, the 25% margin, Quality on Sale) were tested the same honest way in <b>Stage 6b</b>: the page's own rules, unchanged, replayed every month from ${dateTxt(b.from)} to ${dateTxt(b.to)} with only the data known on each day; the rule for passing was written down before the first run.</span>
        <span><b>Result: ${b.pass ? "passed" : "did not pass"}.</b> From ${dateTxt(b.split)} (the out-of-sample years): a Buy + Accumulate portfolio returned <span class="num">${FMT.pctPlain(b.port, 1)}</span> a year after costs and tax, vs <span class="num">${FMT.pctPlain(b.ew, 1)}</span> for all eligible stocks equally weighted and <span class="num">${FMT.pctPlain(b.tri, 1)}</span> for the Nifty 500 (with dividends). Over the next 12 months, Trim stocks did <span class="num">${FMT.pct(b.trim12, 1)}</span> and Avoid stocks <span class="num">${FMT.pct(b.avoid12, 1)}</span> vs the market.</span>
        <span>${b.pass ? "So the verdict box now says \"tested in Stage 6b\"." : `So the verdicts stay <i>experimental</i>: ${esc((b.why || []).join("; "))}.`} Either way the Core score and the paper ghosts don't change. Free historical data is thinner than today's (no red flags, ownership or quarterly results in the past), so read this as a rough check. Not advice.</span></div></details>` : "")(SB())}
      <details><summary>What the verdict groups mean</summary><div class="legendbox">${Object.entries(VG).map(([k, [ic, nm]]) => `<span>${ic} <b>${nm}</b> – ${VG_HELP[k]}</span>`).join("")}
        <span>💎 <b>Quality on Sale</b> – ${esc(GROUP_NAME.qos[2])}</span></div></details>
      <details id="howexit"><summary>How the exit check works (🚦 on 💼 Portfolio)</summary><div class="legendbox">
        <span>It shows, on each of your real holdings, the <b>same frozen Rules v1.0 exits</b> the paper ghosts (v1.0/v1.1) follow – nothing new, nothing tuned.</span>
        <span>🔴 <b>Exit signal</b> – a hard red flag or a Company Reader hard document flag: Rules v1.0 would sell at the next close.</span>
        <span>🟠 <b>Review at the next rebalance</b> (first trading day of Jan / Apr / Jul / Oct) – the Core score rank fell out of the keep zone: the top ${EXITR().keep_pct}% of eligible stocks, or the top ${EXITR().tax_pct}% while a holding is younger than ${Math.round(EXITR().tax_days / 30.4)} months (the tax wait). Before that date it is only a heads-up.</span>
        <span>🟡 <b>Price far above fair value</b> – verdict 🟠 Trim. Experimental, not in the Core score; consider taking some profit. Not an exit by itself.</span>
        <span>🟢 <b>Keep</b> – none of the above.</span>
        <span>No stop-loss, trailing stop or chart-based sell signal: they were not tested, and the trend exit (variant V3) hurt in the Stage 6 backtest. A stop-loss could only be added later as a pre-registered Stage 6 variant. Not advice.</span></div></details>
      <details><summary>Glossary: ROCE, PE, RSI, TRI …</summary>
        <div class="gloss">${Object.values(GLOSS).map(([k, m, ex]) => `<div class="term"><div class="k"><span>${esc(k)}</span></div><span>${esc(m)}</span><span class="ex">Example: ${esc(ex)}</span></div>`).join("")}</div></details>
    </section>
    <section class="panel"><h2>Data checks</h2>${checks}
      <p class="sub">${esc(asofTxt())}.</p>
      <p class="sub">The full report is <i>data/validation.md</i> on the site branch.</p></section>
    <section class="panel" id="licences"><h2>Licences</h2>
      <p class="sub">Charts: <b>TradingView Lightweight Charts™</b> v5.2.1 – Copyright © 2025 TradingView, Inc. (<a href="https://www.tradingview.com/" rel="noopener">tradingview.com</a>). Licensed under the Apache License 2.0${SPLIT ? ` (<a href="vendor/LICENSE-lightweight-charts.txt">licence</a> · <a href="vendor/NOTICE-lightweight-charts.txt">notice</a>)` : ""}. The library is kept on this site, unchanged; the drawing tools, indicators and gap shading are this page's own code.</p>
      <p class="sub">Prices: NSE (daily, end of day); older chart prices: Yahoo Finance, adjusted for splits, bonuses and demergers (unofficial).</p></section>
    <p class="sub">⭐ Watchlist and 💼 Portfolio: what you save stays only in this browser (nothing is sent anywhere, nothing goes to the nightly). Chart drawings too – they are part of the backup file. ${LABELS.replace(/<[^>]+>/g, "")}</p>`;
}

// ---------- ⭐ Watchlist + 💼 Portfolio screens (review #30) – the user's own data, only in this browser ----------
const LS = (() => { try { return window.localStorage; } catch (e) { return null; } })();
const TODAY = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);          // today in India (form dates)
const PDAY = S.trade_date;                                                             // the night the prices are from
let USER_LOAD = UL.load(LS, TODAY), USER = USER_LOAD.data, STORE_OK = USER_LOAD.ok, SAVE_ERR = null;
function persist() {
  if ((USER.watch.length || USER.tx.length) && !USER.meta.firstSaved) USER.meta.firstSaved = TODAY;   // review #64: first reminder 7 days later
  const r = UL.save(LS, USER);
  STORE_OK = STORE_OK && r.ok; SAVE_ERR = r.ok ? null : r.err;
  return r.ok;
}
const priceOf = sym => BY[sym] ? { close: BY[sym].close, prev: BY[sym].prev_close } : null;
const LEVEL = UL.levelLookup((S.bench || {}).level || {});
const inWatch = sym => USER.watch.some(w => w.sym === sym);
const heldQty = sym => { const t = USER.tx.filter(x => x.sym === sym); if (!t.length) return 0; const p = UL.position(t); return p.err ? 0 : p.qty; };
const ubadges = sym => `${inWatch(sym) ? ` <span class="ub" title="In your watchlist" aria-label="in your watchlist">${ic("star-fill")}</span>` : ""}${heldQty(sym) ? ` <span class="ub" title="You hold it" aria-label="you hold it">${ic("case")}</span>` : ""}${nfBadge(sym)}`;
// review #59: an important filing in the last 30 days (auditor resigned, CEO left, pledge, SEBI order, group event) → ⚠️/🔴 badge
const NF_WORD = { auditor: "auditor change", kmp: "management change", pledge: "pledge", promoter_sale: "promoter sale", regulatory: "regulatory action" };
const nfBadge = sym => { const s = BY[sym], f = s && s.nf && s.nf[0]; if (!f) return "";
  return ` <span class="nfb nf-${f.sev === "red" ? "red" : "yellow"}" title="${esc(f.dt + ": " + f.t)}">${f.sev === "red" ? "🔴" : "⚠️"} ${esc(f.via ? "group event" : NF_WORD[f.rule] || "new filing")}</span>`; };
const actBtns = sym => `<button class="act" type="button" data-act="save" data-sym="${esc(sym)}" aria-pressed="${inWatch(sym)}" aria-label="${inWatch(sym) ? "Saved" : "Not saved"} – ${esc(BY[sym] ? BY[sym].name : sym)}">${starIcon(inWatch(sym), JUST_STAR === sym)} ${inWatch(sym) ? "Saved" : "Save"}</button>` +
  `<button class="act" type="button" data-act="buy" data-sym="${esc(sym)}">${ic("case")} Bought</button>` +
  `<button class="act" type="button" data-act="cmp" data-sym="${esc(sym)}"${CMP.get().includes(sym) ? ' aria-pressed="true"' : ""}>${ic("plus")} Compare</button>`;
let CTX = "Stock page";                                  // where a ☆ Save came from (screen / ready-made screen / verdict group)
const STORE_HINT = "Nothing saved in this browser. If you saved stocks in the Home Screen app (or another browser or device), open it there – each keeps its own list (use Backup/Restore to move them).";   // review #45
const LABELS = `<p class="sub honest">Prices are end-of-day (updated ~8 PM IST), not live. Your real portfolio is separate from the paper ghosts (v1.0/v1.1). Personal tool – not investment advice.</p>`;
function userBanners() {
  let h = "";
  if (!STORE_OK) h += `<div class="warnbox">🟡 This browser is not letting the page keep data (private browsing, or storage is full${SAVE_ERR || USER_LOAD.err ? ": " + esc(SAVE_ERR || USER_LOAD.err) : ""}). You can still try things, but your list will be gone when you close the page.</div>`;
  const has = USER.watch.length || USER.tx.length;
  const lb = USER.meta.lastBackup;
  void has; void lb;                                                  // review #72: the backup reminder lives on Home only, Backup / Restore in Settings
  return h;
}
const backupBox = flat => `<${flat ? "div" : "section class=\"panel\""} id="backup"><h2${flat ? ' class="t-heading"' : ""}>Backup / Restore</h2>
  <p class="sub" style="margin:0 0 8px">Your list lives only on this device and browser. Open the page from the Home Screen icon so Safari keeps it, and back up now and then.</p>
  <p class="mline bklast">${USER.meta.lastBackup ? `Last backup: <b>${dateTxt(USER.meta.lastBackup)}</b> (${FMT.count(UL.days(USER.meta.lastBackup, TODAY))} days ago)` : "Not backed up yet."}</p>
  <div class="btnrow"><button class="act" type="button" data-act="backup">${ic("download")} Back up (download a file)</button>
  <label class="act">${ic("upload")} Restore from a file<input type="file" accept=".json,application/json" data-act="restore" hidden></label></div></${flat ? "div" : "section"}>`;
const vtag = s => { const v = SET.master ? vfor(s) : null; return v ? `${VG[v.g][0]} ${esc(v.lb)}` : SET.master ? "no verdict" : "verdicts off"; };
const rup = (x, d = 0) => FMT.money(x, d);
const sgnRup = x => x == null ? "–" : FMT.moneySigned(x, 0);
const sgnPct = x => FMT.pct(x, 2);
const updn = x => x == null ? "" : x >= 0 ? "up" : "down";

function zoneFor(s) {
  const v = vfor(s);
  if (!v) return { text: "No buy zone – no financial data", kind: "none" };
  const uv = usedViews(v);
  return UL.buyZone({ value: uv ? uv.main.value : null, margin: v.margin, enough: v.va ? v.va.enough !== false : false,
                      hard: v.flags.some(f => f.hard !== false), quality: v.q, price: s.close });
}

// ----- ⭐ Watchlist
let WL = { sort: "new", src: "", b: "all" };
// review #59: tonight's market-wide NSE announcements – a line for YOUR saved / held stocks (this browser only)
function filingsLine() {
  const A = S.ann_tonight; if (!A || !A.syms) return "";
  const mine = [...new Set([...USER.watch.map(w => w.sym), ...USER.tx.map(t => t.sym)])].filter(x => A.syms[x] && BY[x]);
  if (!mine.length) return "";
  const KIND = { auditor: "auditor", kmp: "director / KMP", acquisition: "acquisition", fundraise: "fund raising", buyback: "buyback", regulatory: "regulatory action", capex: "expansion" };
  return `<section class="panel filings"><p class="mline"><b>New filings for your stocks tonight</b> <span class="sub">(NSE, ${esc(dateTxt(A.date))})</span></p>
    ${mine.map(x => `<p class="mline"><a href="#/stock/${encodeURIComponent(x)}/news">${esc(BY[x].name)}</a> <span class="sub">– ${A.syms[x].map(f => esc(KIND[f.kind] || f.kind)).join(", ")}</span></p>`).join("")}</section>`;
}
const PUBLIC_URL = "https://nightscreener.github.io/";   // review #56/#58: share links always use the current public link
// ---------- review #58 E (13): tap any term for a 1-line meaning – one glossary, the existing ⓘ pattern ----------
const TERMS = { "ROCE": "roce", "ROE": "roe", "P/E": "pe", "PE": "pe", "P/B": "pb", "EV/EBITDA": "ev_ebitda", "EV / EBITDA": "ev_ebitda", "Debt to equity": "de", "D/E": "de", "TTM": "ttm",
  "CAGR": "cagr", "CFO/PAT": "cfopat", "Piotroski": "piotroski", "Margin of safety": "mos", "TRI": "tri", "Drawdown": "drawdown", "LTCG": "ltcg",
  "STCG": "stcg", "XIRR": "xirr", "PEG": "peg", "RSI": "rsi", "Core score": "core", "Core": "core",
  // review #60: every metric label the screens show → its glossary entry (labels are matched without case, units or a trailing "(…)")
  "ROCE, average of recent years": "roce_avg", "ROE, average of recent years": "roe_avg", "Average ROCE": "roce_avg", "Average ROE": "roe_avg",
  "Interest coverage": "icr", "Interest cover": "icr", "Cash conversion": "cfo_pat", "Sales growth per year": "sales_cagr", "EPS growth per year": "eps_cagr",
  "Sales growth": "sales_cagr", "EPS growth": "eps_cagr", "Promoter holding": "promoter", "Promoter pledge": "pledge", "Pledge": "pledge",
  "Promoter change": "promoter_chg", "Insider net": "insider", "Daily traded value": "tv_daily", "Traded value": "tv", "Market cap": "mcap",
  "From 1-yr high": "high52", "From high": "high52", "From 52-week high": "high52", "50 DMA": "dma", "200 DMA": "dma", "Volume": "volratio",
  "Fair value": "fair", "Graham number": "graham", "DCF": "dcf", "P/E band": "peband", "EV/EBITDA method": "evebitda", "10-year G-sec": "gsec",
  "Quality vs sector": "qvsector", "Business health": "bizhealth", "Verdict": "verdict",
  "F-score": "piotroski", "Piotroski F-score": "piotroski", "Red flags": "redflags", "Beneish M-score": "mscore", "Altman Z-score": "zscore",
  "India VIX": "vix", "Nifty 500: rose / fell": "breadth", "Nifty 500 above 200-day average": "breadth", "New 52-week highs / lows": "breadth",
  "FII / FPI net": "fii", "DII net": "fii", "Nifty 500 TRI": "tri", "Same money in Nifty 500 TRI": "tri", "Biggest fall": "drawdown",
  "Avg price": "avgprice", "Average price": "avgprice", "Invested": "invested", "Current value": "invested", "Realised P&L": "pnl",
  "Unrealised P&L": "pnl", "Today's P&L": "pnl", "Total P&L": "pnl", "Gain": "pnl",
  "1-year high": "high52", "1-year low": "high52", "Distance from 1-year high": "high52", "Distance from 52-week high": "high52", "Near 1-year high": "high52",
  "50-day average": "dma", "200-day average": "dma", "50/200-day average": "dma", "Above the 200-day average": "dma", "20-day average volume": "volratio",
  "Shares traded": "volratio", "12-1 month return": "momentum_pillar", "Debt / equity": "de", "EBIT / operating margin": "op_margin",
  "Free-cash-flow yield": "fcf_yield", "P/E vs its own history": "peband", "ROCE 5-yr median": "roce_avg", "ROCE (ROE) stability – std-dev": "roce",
  "Max drawdown": "drawdown", "Business quality": "bizhealth", "Investor lenses": "lens", "Rose": "breadth", "Fell": "breadth", "Unchanged": "breadth",
  "LTCG / STCG": "ltcg", "STCG / LTCG": "stcg", "FII / DII": "fii", "Earnings yield": "earnings_yield",
  "Profit growth": "cagr", "Quality": "bizhealth", "Gap": "fair", "Mkt cap ₹cr": "mcap", "Mkt cap": "mcap", "Volume shocker": "shocker" };
const TERM_ALIAS = (() => { const m = {}, add = (l, k) => { if (GL[k] && l) m[l.toLowerCase()] = k; };
  Object.entries(GL).forEach(([k, t]) => { if (t.group === "Reading the page" || t.group === "Policy & Budget") return; add(t.name, k); add(String(t.name).split(" (")[0], k); });   // review #90: those are found by the tap pass, no extra ⓘ
  Object.entries(TERMS).forEach(([l, k]) => add(l, k));
  ["value", "momentum", "score", "return", "tax"].forEach(x => delete m[x]);   // too generic alone: "Value" is also a table column – these get their ⓘ where they're placed
  return m; })();
// the glossary key of a label ("ROCE (return on capital employed)", "Sales (₹ cr)", "P/E 13.6 vs …" are all handled), or null
function termKey(txt) {
  const s = String(txt || "").replace(/ⓘ/g, "").replace(/\s+/g, " ").trim().replace(/[:·]$/, "").trim(); if (!s || s.length > 60) return null;
  const noComma = s.replace(/\s*,.*$/, ""), strip = x => x.replace(/\s*\([^)]*\)\s*$/, "");
  const tries = [s, strip(s), noComma, strip(noComma)];
  for (const x of tries) { const k = TERM_ALIAS[x.toLowerCase()]; if (k) return k; }
  return null;
}
const termLabel = lbl => { if (typeof lbl !== "string" || /class="ib"/.test(lbl)) return lbl; const k = termKey(lbl.replace(/<[^>]*>/g, "")); return k ? `${lbl}${ib(k)}` : lbl; };
// review #60: every metric label / column header on every screen gets its ⓘ – one pass after each render (a MutationObserver), so no screen is missed
const TERM_SEL = ".metrics .t-label, table th, table.hist:not(.noterm) tbody td:first-child, table.cmp td.l, .kv2 > span, .term .k > span:first-child, .collegend > span";
// review #72 (10): a gain / fall number that carries the up / down class but no arrow gets its small ▲ / ▼ (by class, never by words)
const MV_NUM = /^[+−\-]?\s?₹?\s?[\d,]+(\.\d+)?\s?(%|cr|×)?/;
function movePass(root) {
  (root || document).querySelectorAll(".up, .down").forEach(el => {
    if (el.matches("[data-lvl], i, .arr, svg, svg *") || el.closest("[data-nomv], svg")) return;
    const t = el.textContent.trim();
    if (!t || /[▲▼]/.test(t) || !MV_NUM.test(t)) return;
    el.insertAdjacentHTML("afterbegin", `<span class="arr" aria-hidden="true">${el.classList.contains("up") ? "▲" : "▼"}</span>&nbsp;`);
  });
}
function annotateTerms(root) {
  (root || document).querySelectorAll(TERM_SEL).forEach(el => {
    if (el.querySelector(".ib") || el.closest(".ib, .noterm")) return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && !n.matches(".num, .sig, .sigd, .sub, button, a, svg"))).map(n => n.textContent).join("");
    const k = termKey(own); if (!k) return;
    el.insertAdjacentHTML("beforeend", ib(k));
  });
}
// ---------- review #58 E: back to top, swipe between stocks, remember where I was, reorder, shortcuts, copy a number, data age ----------
let NAVLIST = (() => { try { return JSON.parse(sessionStorage.getItem("screener.navlist") || "null"); } catch (e) { return null; } })();
function setNavList(name, syms) { NAVLIST = { name, syms: syms.slice(0, 2000) }; try { sessionStorage.setItem("screener.navlist", JSON.stringify(NAVLIST)); } catch (e) {} }
function navStep(sym, d) { if (!NAVLIST) return null; const i = NAVLIST.syms.indexOf(sym), j = i + d; return i >= 0 && j >= 0 && j < NAVLIST.syms.length ? NAVLIST.syms[j] : null; }
function navStrip(sym) {
  if (!NAVLIST || NAVLIST.syms.indexOf(sym) < 0 || NAVLIST.syms.length < 2) return "";
  const i = NAVLIST.syms.indexOf(sym), p = navStep(sym, -1), n = navStep(sym, 1);
  return `<div class="navstrip"><button class="act" type="button" data-nav="-1"${p ? "" : " disabled"} aria-label="Previous stock">${ic("back")} Previous</button>
    <span class="t-label sub">${FMT.count(i + 1)} of ${FMT.count(NAVLIST.syms.length)} · ${esc(NAVLIST.name || "list")}</span>
    <button class="act" type="button" data-nav="1"${n ? "" : " disabled"} aria-label="Next stock">Next <span class="flipx">${ic("back")}</span></button></div>`;
}
const reorderBtns = sym => `<div class="reo"><span class="dragh" draggable="true" data-drag="${esc(sym)}" role="img" aria-label="Drag to reorder">${ic("more")}</span>
  <button class="act" type="button" data-act="wup" data-sym="${esc(sym)}" aria-label="Move up">${ic("back")}</button><button class="act" type="button" data-act="wdown" data-sym="${esc(sym)}" aria-label="Move down">${ic("back")}</button></div>`;
// (7) remember where I was: scroll, filters, sort and the open tab of each screen – this session only
const WHERE_KEY = "screener.where";
function saveWhere() { try { sessionStorage.setItem(WHERE_KEY, JSON.stringify({ SCROLL, WL, sort: SEARCH.sort, SEC, RK })); } catch (e) {} }
function loadWhere() { try { const o = JSON.parse(sessionStorage.getItem(WHERE_KEY) || "null"); if (!o) return;
  Object.assign(SCROLL, o.SCROLL || {}); Object.assign(WL, o.WL || {}); if (o.sort) SEARCH.sort = o.sort; if (o.SEC) SEC = o.SEC; if (o.RK) Object.assign(RK, o.RK); } catch (e) {} }
// (15) long-press / right-click a number → copy the plain value
const plainNum = t => { const m = String(t || "").replace(/[−–]/g, "-").replace(/[₹,\s×%]/g, "").match(/-?\d+(?:\.\d+)?/); return m ? m[0] : null; };
async function copyNum(el) { const v = plainNum(el.textContent); if (v == null) return; const ok = await copyText(v); toast(ok ? `Copied ${v}` : "Couldn't copy"); }
// (16) data age on every screen
function dataAge(el) {
  if (!S.trade_date) return; const head = el.querySelector(".scr-h, .hero"); if (!head || head.querySelector(".dage")) return;   // review #72: Home's header has the date once
  const st = UL.staleCheck(S.trade_date, Date.now(), S.holidays);
  head.insertAdjacentHTML("beforeend", `<span class="dage t-label sub">Data of ${esc(dateTxt(S.trade_date))}${st.stale ? ` <span class="dbadge">${FMT.count(st.missed + 1)} days old – the nightly update didn't run</span>` : ""}</span>`);
}
// (14) keyboard shortcuts (never while typing in a field)
const KEYS_HELP = [["/", "focus the search box"], ["Esc", "clear the search / close a sheet"], ["← →", "previous / next stock in the list"], ["g h", "Home"], ["g w", "Watchlist"], ["?", "this list"]];
let gKey = 0;
document.addEventListener("keydown", e => {
  const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  if (e.key === "Escape" && document.getElementById("sheet").hasAttribute("open")) { sheetDismiss(); return; }
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  const r = parseHash();
  if (e.key === "/") { e.preventDefault(); if (r.name !== "search") go("#/search"); setTimeout(() => { const q = document.getElementById("q"); if (q) q.focus(); }, 60); return; }
  if (e.key === "?") { e.preventDefault(); sheet(`<h2>Keyboard shortcuts</h2>${KEYS_HELP.map(([k, d]) => `<p class="mline"><b class="kbd">${esc(k)}</b> ${esc(d)}</p>`).join("")}<p class="sub">They never fire while you type in a field.</p><div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`); return; }
  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && r.name === "stock" && !(t && t.closest && t.closest(".pc-canvas, .chartbox"))) {
    const n = navStep(r.arg, e.key === "ArrowLeft" ? -1 : 1); if (n) { e.preventDefault(); go(stockHref(n)); } return; }
  if (e.key === "g") { gKey = Date.now(); return; }
  if (Date.now() - gKey < 1200 && (e.key === "h" || e.key === "w")) { gKey = 0; go(e.key === "h" ? "#/home" : "#/watchlist"); }
});
// ---------- review #58 B: compare 2–3 stocks, price alerts (end-of-day), share a stock ----------
const CMP = {
  KEY: "screener.compare", MAX: 3,
  get() { try { return JSON.parse(sessionStorage.getItem(this.KEY) || "[]").filter(x => BY[x]); } catch (e) { return []; } },
  put(a) { try { sessionStorage.setItem(this.KEY, JSON.stringify(a.slice(0, this.MAX))); } catch (e) {} },
};
const CMP_ROWS = [  // [label, value, format, better: "hi" | "lo" | null, signal metric]
  ["Price", s => s.close, v => inr(v), null], ["Market cap", s => s.mcap_cr, v => FMT.cr(v, 0), null],
  ["ROCE", s => s.roce, v => FMT.pctPlain(v, 1), "hi", "roce"], ["ROE", s => s.roe, v => FMT.pctPlain(v, 1), "hi", "roe"],
  ["P/E", s => s.pe, v => FMT.ratio(v, 1), "lo", "pe"], ["P/B", s => s.pb, v => FMT.ratio(v, 1), "lo", "pb"],
  ["Debt to equity", s => s.de, v => FMT.ratio(v, 2), "lo", "de"], ["Sales growth (5 yr)", s => s.sales_cagr, v => growthTxt(v, 1), "hi", "sales_cagr"],
  ["Profit growth (5 yr)", s => s.eps_cagr, v => FMT.pctPlain(v, 1), "hi", "eps_cagr"], ["Core score", s => s.cr ? s.cr.sc : null, v => FMT.num(v, 1), "hi", "core"]];
function compareScreen(r) {
  if (r.s) CMP.put(r.s.split(",").map(x => decodeURIComponent(x).toUpperCase()).filter(x => BY[x]));
  const L = CMP.get().map(x => BY[x]);
  const head = `<button class="back" type="button" data-origin="1">${ic("back")} ${esc(originName())}</button><div class="scr-h"><h1>Compare</h1><span class="sub">${L.length} of ${CMP.MAX}</span></div>`;
  const add = L.length < CMP.MAX ? `<form id="cmpadd" class="brow"><input name="sym" list="cmplist" autocapitalize="characters" placeholder="Add a stock (name or symbol)" aria-label="Add a stock to compare">
      <datalist id="cmplist">${UNIV().slice(0, 2000).map(x => `<option value="${esc(x.symbol)}">${esc(x.name)}</option>`).join("")}</datalist><button class="act" type="submit">${ic("plus")} Add</button></form>` : "";
  if (L.length < 2) return head + `<p class="sub">Add 2 or 3 stocks – tap “Compare” on a stock page, a search result or a watchlist card, or type below.</p>${add}${L.map(x => `<p class="mline">${esc(x.name)} <button class="act" type="button" data-act="cmprm" data-sym="${esc(x.symbol)}">Remove</button></p>`).join("")}`;
  const best = (row) => { const vals = L.map(x => row[1](x)); const ok = vals.filter(v => v != null && isFinite(v)); if (!row[3] || ok.length < 2) return -1;
    const b = row[3] === "hi" ? Math.max(...ok) : Math.min(...ok.filter(v => row[4] !== "pe" || v > 0)); return vals.indexOf(b); };
  return head + `<div class="tablewrap"><table class="hist cmp"><thead><tr><th></th>${L.map(x => `<th><a href="${stockHref(x.symbol)}">${esc(x.symbol)}</a><br><button class="act" type="button" data-act="cmprm" data-sym="${esc(x.symbol)}" aria-label="Remove ${esc(x.name)}">${ic("x")}</button></th>`).join("")}</tr></thead><tbody>
    <tr><td class="l">Price</td>${L.map(x => `<td>${lvlNum(x.change_pct, inr(x.close))}</td>`).join("")}</tr>
    <tr><td class="l">Today</td>${L.map(x => `<td>${x.change_pct == null ? "–" : chgPill(x.change_pct, 2)}</td>`).join("")}</tr>
    ${CMP_ROWS.map(row => { const bi = best(row); return `<tr><td class="l">${termLabel(esc(row[0]))}</td>${L.map((x, i) => { const v = row[1](x), sg = row[4] ? sigOf(row[4], v, x) : null;
      return `<td class="${i === bi ? "cbest" : ""}"><span class="num">${v == null ? "–" : row[2](v)}</span>${sg ? `<br><span class="sigd sig-${sg.lv}">${SIG_DOT[sg.lv]} ${SIGNALS.WORD[sg.lv]}</span>` : ""}${i === bi ? `<br><span class="t-label">better</span>` : ""}</td>`; }).join("")}</tr>`; }).join("")}
    <tr><td class="l">Verdict</td>${L.map(x => `<td>${SET.master ? vtag(x) : "off"}</td>`).join("")}</tr></tbody></table></div>
    ${(hb => hb ? `<section class="panel"><h2>Business health, side by side</h2>${hb}</section>` : "")(healthBars(L, { title: "Business health, side by side" }))}
    ${add}<p class="sub">“better” marks the stronger value per row (higher ROCE, lower P/E …) – a comparison of numbers, not advice.</p>`;
}
function alertSheet(sym) {
  const s = BY[sym], A = (USER.alerts || []).filter(a => a.sym === sym), w = USER.watch.find(x => x.sym === sym);
  const desc = a => a.kind === "above" ? `closes above ${inr(a.v)}` : a.kind === "below" ? `closes below ${inr(a.v)}` : `moves ±${a.v}% from your saved price${w ? " " + inr(w.px) : ""}`;
  sheet(`<h2>Price alert: ${esc(s ? s.name : sym)}</h2>
    <p class="mini">Checked against each night's close – end-of-day only, no phone notifications. When it fires you'll see it on Home and on the Watchlist tab next time you open the app.</p>
    ${A.map(a => `<p class="mline">When it ${desc(a)} <button class="act" type="button" data-act="alertrm" data-id="${esc(a.id)}">Remove</button></p>`).join("")}
    <form id="alertform" data-sym="${esc(sym)}"><label class="fl">Alert me when it<select name="kind"><option value="below">closes below ₹</option><option value="above">closes above ₹</option>${w ? `<option value="pct">moves ±% from my saved price</option>` : ""}</select></label>
      <label class="fl">Value<input name="v" type="number" inputmode="decimal" min="0.01" step="0.01" required value="${s ? Math.round(s.close * 0.9) : ""}"></label>
      <div class="btnrow"><button class="act big" type="submit">Add alert</button><button class="act" type="button" data-close>Close</button></div></form>`);
}
const alertHitsNow = () => UL.alertHits(USER.alerts, USER.watch, priceOf, PDAY);
function alertBanner() {
  const h = alertHitsNow().filter(x => !x.seen); if (!h.length) return "";
  return `<div class="warnbox alertbox">${h.map(x => `<p class="mline">${ic("signal")} ${esc(x.text)} on ${dateTxt(PDAY)}.</p>`).join("")}
    <p class="sub">End-of-day prices – no phone notifications.</p><button class="act" type="button" data-act="alertseen">OK, seen</button></div>`;
}
function syncAlertBadge() {
  const t = document.querySelector('.tab[data-tab="watchlist"]'); if (!t) return;
  const n = alertHitsNow().filter(x => !x.seen).length; let b = t.querySelector(".tbadge");
  if (!n) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("span"); b.className = "tbadge"; t.appendChild(b); }
  b.textContent = n; b.setAttribute("aria-label", `${n} price alert${n === 1 ? "" : "s"}`);
}
async function shareStock(sym) {
  const s = BY[sym]; if (!s) return;
  const url = `${PUBLIC_URL}#/stock/${encodeURIComponent(sym)}`;
  try { if (navigator.share) { await navigator.share({ title: s.name, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  toast((await copyText(url)) ? "Link copied" : "Couldn't copy – " + url);
}

// ---------- review #58 A: watchlist buckets, notes, shared lists ----------
const BUCKETS = () => USER.buckets || (USER.buckets = []);
const AUTO_B = [["n50", "Nifty 50"], ["bank", "Bank Nifty"]];         // read-only: which SAVED stocks are in NSE's index files
const inIdx = (sym, k) => ((BY[sym] || {}).ix || []).includes(k);
function savedLine(s) {
  const w = USER.watch.find(x => x.sym === s.symbol); if (!w || !w.px) return "";
  const pc = (s.close / w.px - 1) * 100;
  return `<p class="mini savedl">Saved ${dateTxt(w.saved)} at ${inr(w.px)} · <span class="num ${updn(pc)}">${sgnPct(pc)} since saved</span>${w.by ? ` · suggested by ${esc(w.by)}` : ""}</p>`;
}
function bucketTabs() {
  const n = id => id === "all" ? USER.watch.length : AUTO_B.some(a => a[0] === id) ? USER.watch.filter(w => inIdx(w.sym, id)).length
    : ((BUCKETS().find(b => b.id === id) || {}).syms || []).filter(t => USER.watch.some(w => w.sym === t)).length;
  const tabs = [["all", "All"], ...BUCKETS().map(b => [b.id, b.name]), ...AUTO_B];
  return `<nav class="seg btabs gchips" aria-label="Watchlist buckets">${tabs.map(([id, nm]) => `<a href="#/watchlist" data-wlb="${esc(id)}"${WL.b === id ? ' aria-current="page" class="on"' : ""}>${esc(nm)} <span class="t-label">${FMT.count(n(id))}</span></a>`).join("")}</nav>`;
}
function inBucket(w) {
  if (!WL.b || WL.b === "all") return true;
  if (AUTO_B.some(a => a[0] === WL.b)) return inIdx(w.sym, WL.b);
  const b = BUCKETS().find(x => x.id === WL.b); return b ? b.syms.includes(w.sym) : true;
}
function bucketPanel() {
  const B = BUCKETS(), cur = B.find(b => b.id === WL.b);
  return `<details class="panel bmanage"><summary>Buckets: create, rename, reorder, share</summary>
    ${B.map((b, i) => `<div class="brow"><input data-bname="${esc(b.id)}" value="${esc(b.name)}" maxlength="${UL.BUCKET_NAME}" aria-label="Bucket name">
      <button class="act" type="button" data-act="bup" data-id="${esc(b.id)}" aria-label="Move up"${i ? "" : " disabled"}>${ic("back")}</button>
      <button class="act" type="button" data-act="bdown" data-id="${esc(b.id)}" aria-label="Move down"${i < B.length - 1 ? "" : " disabled"}>${ic("back")}</button>
      <button class="act" type="button" data-act="bshare" data-id="${esc(b.id)}">Share list</button>
      <button class="act" type="button" data-act="bdel" data-id="${esc(b.id)}">Delete</button></div>`).join("") || `<p class="sub">No buckets yet – make one (up to ${UL.MAX_BUCKETS}).</p>`}
    ${B.length < UL.MAX_BUCKETS ? `<form id="bnewform" class="brow"><input name="bname" maxlength="${UL.BUCKET_NAME}" placeholder="New bucket, e.g. Long term" aria-label="New bucket name"><button class="act" type="submit">${ic("plus")} Add bucket</button></form>` : ""}
    <p class="sub">Sharing sends a link with the stock names only – never your notes, prices or portfolio.${cur ? "" : " Nifty 50 and Bank Nifty fill themselves from NSE's index lists."}</p></details>`;
}
async function shareList(id) {
  const b = BUCKETS().find(x => x.id === id); if (!b) return;
  const syms = b.syms.filter(t => USER.watch.some(w => w.sym === t));
  if (!syms.length) { toast("This bucket is empty"); return; }
  const url = UL.shareLink(PUBLIC_URL, b.name, syms);
  try { if (navigator.share) { await navigator.share({ title: b.name, text: `${b.name}: ${syms.join(", ")}`, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  toast((await copyText(url)) ? "Link copied" : "Couldn't copy – the link is " + url);
}
function importScreen(r) {
  const known = sym => !!BY[sym];
  const I = UL.parseImport(r.list, r.s, known);
  const opts = BUCKETS().map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join("");
  return `<div class="scr-h"><h1>A shared list</h1></div>
    <section class="panel"><h2>${esc(I.name)}</h2>
      ${I.syms.length ? `<div class="ulist">${I.syms.map(t => { const x = BY[t]; return `<a class="urow" href="${stockHref(t)}"><span class="nm">${esc(x.name)}</span> <span class="sub">${esc(t)} · ${inr(x.close)}${inWatch(t) ? " · already in your watchlist" : ""}</span></a>`; }).join("")}</div>` : `<p class="sub">None of these stocks are in tonight's list.</p>`}
      ${I.bad.length ? `<p class="sub">Not in tonight's list (left out): ${esc(I.bad.slice(0, 20).join(", "))}</p>` : ""}${I.cut ? `<p class="sub">Only the first ${UL.SHARE_MAX} are shown.</p>` : ""}
      ${I.syms.length ? `<form id="importlist" data-syms="${esc(I.syms.join(","))}" data-name="${esc(I.name)}">
        <label class="fl">Add to<select name="to"><option value="new">a new bucket “${esc(I.name)}”</option>${opts}</select></label>
        <div class="btnrow"><button class="act big" type="submit">${ic("plus")} Add to my watchlist</button><a class="act" href="#/watchlist">Not now</a></div></form>` : ""}
      <p class="sub">Nothing is added until you tap the button. Shared links carry stock names only.</p></section>`;
}
// review #67: your portfolio's value on each trading day, from your trades × the nightly closes (carried forward over a gap).
// day = that day's change in ₹ with the money you added / took out removed, so a buy is not counted as a gain.
function pfSeries() {
  const tx = USER.tx.filter(t => BY[t.sym]).slice().sort((a, b) => a.date < b.date ? -1 : 1); if (!tx.length) return [];
  const syms = [...new Set(tx.map(t => t.sym))], px = {}, dates = new Set();
  for (const t of syms) { const h = histOf(t); if (!h || !h.close) return []; px[t] = {}; h.dates.forEach((d, i) => { if (h.close[i] != null) { px[t][d] = h.close[i]; dates.add(d); } }); }
  const first = tx[0].date, out = [], qty = {}, last = {}; let k = 0, inv = 0, prev = null;
  for (const d of [...dates].sort()) {
    let flow = 0;
    while (k < tx.length && tx[k].date <= d) { const t = tx[k++], q = +t.qty * (t.side === "sell" ? -1 : 1); qty[t.sym] = (qty[t.sym] || 0) + q; flow += q * +t.px; inv += q * +t.px; }
    syms.forEach(t => { if (px[t][d] != null) last[t] = px[t][d]; });
    if (d < first) continue;
    let v = 0, ok = true; const by = {};
    for (const t of syms) { if (!qty[t]) continue; if (last[t] == null) { ok = false; break; } by[t] = qty[t] * last[t]; v += by[t]; }
    if (!ok) continue;
    out.push({ d, v, inv, flow, by, day: prev ? v - prev.v - flow : null, dayPct: prev && prev.v > 0 ? (v - prev.v - flow) / prev.v * 100 : null });
    prev = out[out.length - 1];
  }
  return out;
}
// ---------- review #67 B: portfolio insights 1–7 (your own Portfolio + the nightly prices; nothing leaves the device) ----------
const TM_KEY = "screener.tmode", VS_KEY = "screener.vsrange";
const lvl3 = (x, mx) => [5, 8, 11][Math.min(2, Math.floor(Math.abs(x || 0) / (mx || 1) * 3))];           // tint steps that keep text readable
function insTreemap(rows) {
  const md = prefGet(TM_KEY, "since") === "today" ? "today" : "since", k = r => md === "today" ? r.dayPct : r.pnlPct;
  const mx = Math.max(1e-9, ...rows.map(r => Math.abs(k(r) || 0)));
  const t = UL.treemap(rows.map(r => ({ v: r.value, r })));
  return `<details class="panel ins" open><summary>Holdings map</summary>
    <div class="segpick" role="group" aria-label="Colour by">${[["since", "Since bought"], ["today", "Today"]].map(([v, n]) => `<button class="chip${md === v ? " on" : ""}" type="button" data-tmode="${v}" aria-pressed="${md === v}">${n}</button>`).join("")}</div>
    <div class="tmap" data-chart="Holdings map" data-direct="1" data-nodraw>${t.map(x => { const r = x.r, g = k(r), big = x.w > 22 && x.h > 16;
      return `<a class="tm-t ${FMT.cls(g)}" href="#/portfolio/${encodeURIComponent(r.sym)}" style="left:${FMT.coord(x.x)}%;top:${FMT.coord(x.y)}%;width:${FMT.coord(x.w)}%;height:${FMT.coord(x.h)}%;--tm:${lvl3(g, mx)}%" aria-label="${esc(r.sym)} ${esc(sgnPct(g))}"><b class="t-label">${esc(r.sym)}</b>${big ? `<span class="num t-label">${sgnPct(g)}</span>` : ""}</a>`; }).join("")}</div>
    <p class="t-label sub">Size = value · colour = gain ${md === "today" ? "today" : "since bought"} (green up, red down; deeper = bigger). Tap a tile for its details.</p></details>`;
}
function insCalendar(ser) {
  const d = ser.filter(x => x.day != null).slice(-66); if (d.length < 5) return "";
  const mx = Math.max(1e-9, ...d.map(x => Math.abs(x.dayPct || 0))), months = {};
  d.forEach(x => (months[x.d.slice(0, 7)] = months[x.d.slice(0, 7)] || []).push(x));
  const wd = x => (new Date(x.d + "T00:00:00Z").getUTCDay() + 6) % 7;            // Monday = 0
  return `<details class="panel ins"><summary>P&amp;L calendar</summary>
    <div class="pcal" data-chart="P&L calendar" data-direct="1" data-nodraw>${Object.entries(months).map(([m, xs]) => `<div class="pcm"><p class="t-label">${FMT.month(m + "-01")} ${m.slice(0, 4)}</p>
      <div class="pcg">${["M", "T", "W", "T", "F"].map(w => `<span class="t-label sub">${w}</span>`).join("")}${xs.filter(x => wd(x) < 5).map(x =>
        `<button class="pcd ${FMT.cls(x.day)}" type="button" style="--tm:${lvl3(x.dayPct, mx)}%;grid-column:${wd(x) + 1}" data-cal="${esc(dateTxt(x.d))}: ${esc(sgnRup(x.day))} (${esc(sgnPct(x.dayPct))})" aria-label="${esc(dateTxt(x.d))}">${+x.d.slice(8)}</button>`).join("")}</div></div>`).join("")}</div>
    <p class="mline calout" aria-live="polite">Tap a day for its ₹ and %.</p>
    <p class="t-label sub">Each trading day's change in your portfolio (money you added or took out is not counted). Green = up, red = down; deeper = bigger.</p></details>`;
}
function insWho(rows) {
  const r = rows.filter(x => x.day != null).sort((a, b) => b.day - a.day); if (!r.length) return "";
  const mx = Math.max(1e-9, ...r.map(x => Math.abs(x.day)));
  return `<details class="panel ins"><summary>Who moved my portfolio today</summary>
    <div class="dbars" data-chart="Who moved my portfolio today" data-direct="1">${r.map(x => `<div class="dbar"><span class="t-label">${esc(x.sym)}</span><span class="dtrack"><i class="${FMT.cls(x.day)}" data-v="${x.day}" style="${x.day >= 0 ? "left:50%" : `left:${FMT.coord(50 - Math.abs(x.day) / mx * 50)}%`};width:${FMT.coord(Math.abs(x.day) / mx * 50)}%"></i></span><span class="num ${FMT.cls(x.day)}">${sgnRup(x.day)}</span></div>`).join("")}</div>
    <p class="t-label sub">Each holding's ₹ share of today's change, from one centre line on one scale.</p></details>`;
}
let MCAP_RANK = null;
function insSize(rows) {
  if (!MCAP_RANK) { MCAP_RANK = {}; S.stocks.filter(x => x.mcap_cr).sort((a, b) => b.mcap_cr - a.mcap_cr).forEach((x, i) => { MCAP_RANK[x.symbol] = i + 1; }); }
  const tot = rows.reduce((a, r) => a + r.value, 0), sh = { Large: 0, Mid: 0, Small: 0 }; let nse = 0, fb = 0, none = 0;
  rows.forEach(r => { const ix = (BY[r.sym] || {}).ix || [], c = UL.sizeOf(ix, MCAP_RANK[r.sym]);
    if (!c) { none++; return; } if (ix.some(k => ["n100", "n50", "mid150", "small250"].includes(k))) nse++; else fb++; sh[c] += r.value / tot * 100; });
  if (!tot || none === rows.length) return "";
  return `<details class="panel ins"><summary>Large / mid / small</summary>
    ${donut([["Large", "--d-blue"], ["Mid", "--d-teal"], ["Small", "--d-gold"]].map(([n, c]) => ({ n, v: sh[n], c })), "Large, mid and small companies (% of value)")}
    <p class="t-label sub">Numbers are % of your holdings' value. ${nse ? "From NSE's Nifty 100 (large), Midcap 150 (mid) and Smallcap 250 (small) lists" : ""}${nse && fb ? "; " : ""}${fb ? `${fb ? (nse ? "" : "From ") + `market-cap rank in our data for ${FMT.count(fb)} holding${fb === 1 ? "" : "s"} (1–100 large, 101–250 mid, the rest small)` : ""}` : ""}${none ? `; ${FMT.count(none)} not classed` : ""}.</p></details>`;
}
function insLtcg(P) {
  const tx = S.tax || {}; if (!tx.ltcg_exempt) return "";
  const m = UL.ltcgMeter(P.sold, PDAY, tx.ltcg_exempt), h = UL.harvest(USER.tx, priceOf, PDAY, tx.ltcg_exempt, tx.lt_months || 12);
  return `<details class="panel ins"${m.daysLeft <= 60 ? " open" : ""}><summary>Tax-free long-term gain meter (FY ${esc(m.fy)})</summary>
    <div class="ltm" data-chart="Tax-free LTCG used"><p class="mline">${kw("Used", "var(--d-violet)")} <b class="num">${FMT.money(m.used, 0)}</b> of <b class="num">${FMT.money(m.exempt, 0)}</b> · left <b class="num">${FMT.money(m.left, 0)}</b></p>
      <div class="gbar ltbar"><i data-series="Used" style="width:${FMT.coord(m.pct)}%;background:var(--d-violet)"></i></div></div>
    <p class="mini">Long-term gains booked this financial year (long-term losses set off), against the yearly limit on tax-free long-term gains. On holdings you still own, long-term gains now: <b class="num">${FMT.money(h.lt, 0)}</b>. The year ends on 31 Mar (${FMT.count(m.daysLeft)} days left).</p>
    ${guidePanel("taxfree", { left: m.left, daysLeft: m.daysLeft, unbooked: h.lt })}
    <p class="t-label sub">Learning note, not advice. The limit comes from the nightly tax file (${tx.sources && tx.sources[0] ? `<a href="${esc(tx.sources[0])}" target="_blank" rel="noopener">Income Tax Department</a>` : "Income Tax Department"}); surcharge and cess are not included.</p></details>`;
}
function insDividends() {
  const d = UL.divIncome(USER.tx.filter(t => BY[t.sym]), s => (BY[s] || {}).dv, PDAY);
  const mx = Math.max(1e-9, ...d.months.map(x => x.amt)), H = 90;
  return `<details class="panel ins"><summary>Dividend income by month</summary>
    <figure class="dvfig" data-chart="Dividend income" data-shared-scale="1">${ktitle(`${kw("Dividends", "var(--d-teal)")} you received – last 12 months: <span class="num">${FMT.money(d.total, 0)}</span>`)}
    <div class="dvb">${d.months.map(x => `<div class="dvc"><span class="dvt"><i data-series="Dividends"${x.amt ? ` data-v="${x.amt}"` : ""} style="height:${FMT.coord(x.amt / mx * H)}px;background:var(--d-teal)"></i></span><span class="t-label sub">${FMT.month(x.m + "-01").slice(0, 1)}</span></div>`).join("")}</div></figure>
    <p class="mini">${d.next ? `Next record date: <b>${esc(dateTxt(d.next.rec))}</b> – ${esc(d.next.sym)} ${FMT.money(d.next.amt, 2)} a share × ${FMT.count(d.next.shares)} = <b class="num">${FMT.money(d.next.total, 0)}</b> (buy before the ex-date ${esc(dateTxt(d.next.ex))} to receive it).` : "No announced dividend ahead for your holdings."}</p>
    <p class="t-label sub">NSE corporate actions × the shares you held before each ex-date (= on the register on the record date). Before tax deducted at source.</p></details>`;
}
function insVsIndex(ser) {
  const rg = ["3m", "1y", "all"].includes(prefGet(VS_KEY, "1y")) ? prefGet(VS_KEY, "1y") : "1y";
  const back = { "3m": 91, "1y": 365, all: 1e5 }[rg], from = ser.length ? (rg === "all" ? ser[0].d : new Date(Date.parse(PDAY + "T00:00:00Z") - back * 864e5).toISOString().slice(0, 10)) : PDAY;
  const r = UL.rebased(ser, LEVEL, from); if (r.length < 5) return "";
  const W = 300, Hh = 110, all = r.flatMap(x => [x.me, x.bench]), lo = Math.min(...all), hi = Math.max(...all);
  const pts = k => r.map((x, i) => `${FMT.coord(i * W / (r.length - 1))},${FMT.coord(Hh - 4 - (x[k] - lo) / ((hi - lo) || 1) * (Hh - 8))}`).join(" ");
  const last = r[r.length - 1], tf = (S.bench || {}).tri_from;
  return `<details class="panel ins"><summary>Your portfolio vs Nifty 500 TRI</summary>
    <div class="segpick" role="group" aria-label="Period">${[["3m", "3M"], ["1y", "1Y"], ["all", "All"]].map(([v, n]) => `<button class="chip${rg === v ? " on" : ""}" type="button" data-vsr="${v}" aria-pressed="${rg === v}">${n}</button>`).join("")}</div>
    <figure class="vsfig" data-chart="Your portfolio vs Nifty 500 TRI">${ktitle(`${kw("Your portfolio", "var(--accent)")} vs ${kw("Nifty 500 TRI", "var(--ink-3)", { dash: 1 })} (both 100 at the start)`)}
      <svg class="spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" role="img" aria-label="Your portfolio ${FMT.num(last.me, 1)} vs Nifty 500 TRI ${FMT.num(last.bench, 1)}"><polyline data-series="Nifty 500 TRI" fill="none" style="stroke:var(--ink-3)" stroke-dasharray="4 3" stroke-width="1.6" points="${pts("bench")}"/><polyline data-series="Your portfolio" fill="none" style="stroke:var(--accent)" stroke-width="2" points="${pts("me")}"/></svg>
      <figcaption class="mline">You <b class="num">${FMT.num(last.me, 1)}</b> · Nifty 500 TRI <b class="num">${FMT.num(last.bench, 1)}</b> <span class="sub">since ${esc(dateTxt(r[0].d))}</span></figcaption></figure>
    <p class="t-label sub">Your line leaves out the money you added or took out (each day's % change, chained), so only performance counts.${tf && r[0].d < tf ? ` Nifty 500 price index before ${esc(dateTxt(tf))}, TRI after.` : ""}</p></details>`;
}
function insightsPanel(P) {
  const rows = P.rows.filter(r => r.tracked && r.value > 0); if (!rows.length) return "";
  const ser = pfSeries();
  return `<h2 class="sech">Insights <span class="t-label sub">from your own Portfolio and the nightly prices</span></h2>
    ${insTreemap(rows)}${insCalendar(ser)}${insWho(rows)}${insSize(rows)}${insLtcg(P)}${insDividends()}${insVsIndex(ser)}`;
}
let WMX = 1;              // review #67: the largest |% moved since saved| on the Watchlist = the one scale of every card's bar
function watchRow(w) {
  const s = BY[w.sym];
  if (!s) return `<div class="urow"><b>${esc(w.sym)}</b> <span class="sub">not in tonight's Nifty 500 list – no price</span>
    <div class="btnrow"><button class="act" type="button" data-act="unsave" data-sym="${esc(w.sym)}">Remove</button></div></div>`;
  const chg = s.close - w.px, pc = (s.close / w.px - 1) * 100, nd = UL.days(w.saved, PDAY);
  let verdict = "", zone = "", rule = "";
  if (SET.master) {
    const v = vfor(s), core = s.cr ? s.cr.sc : null;
    const gChanged = v && w.g && v.g !== w.g, cChanged = core != null && w.core != null && Math.round(core) !== Math.round(w.core);
    verdict = core != null ? `<p class="mini">Core ${core}${cChanged ? ` <span class="chgbadge">score ${Math.round(w.core)}→${Math.round(core)} since saved</span>` : ""}</p>` : "";   // #83 M: the verdict is in the then → now line
    const z = zoneFor(s), mo = s.v4 && s.v4.mo;
    zone = `<p class="mini zone z-${z.kind}">${esc(z.text)}</p>` +
      (mo ? `<p class="mini">Trend: ${mo.ok ? "✅ OK" : "⚠️ not OK"} (${mo.above200 ? "above" : "below"} the 200-day average${mo.pct != null ? `; 12-1 month return better than ${mo.pct}% of its sector` : ""})</p>` : "");
    rule = `<p class="mini"><b>Meets the screener's Buy rule today: ${v && v.g === "buy" ? "yes" : "no"}</b> – not advice.</p>`;
  } else verdict = `<p class="mini sub">Verdicts are switched off (☰ More → ⚙️ Settings).</p>`;
  // review #63 (7): flip card – the flip button turns the card to its key ratios; the card body still opens the stock
  const back = `<div class="fface fback"><div class="top"><b>${esc(s.name)}</b><button class="act flipbtn" type="button" data-act="flip" aria-label="Back to the front">↺</button></div>
    <div class="kv2"><span>ROCE</span><b class="num">${FMT.pctPlain(s.roce, 1)}</b><span>P/E</span><b class="num">${FMT.ratio(s.pe, 1)}</b><span>Debt to equity</span><b class="num">${FMT.ratio(s.de, 2)}</b>
    <span>Core score</span><b class="num">${s.cr ? FMT.num(s.cr.sc, 1) : "–"}</b><span>From 1-yr high</span><b class="num">${s.os ? "–" : FMT.pct(s.pct_from_high52, 1)}</b></div></div>`;
  // review #67 A: sector stripe, a mini 3-month line, signal dots and a bar for the % moved since saved (one scale across the list)
  const dots = SET.signals !== false ? [["roce", s.roce, "ROCE"], ["pe", s.pe, "P/E"], ["core", s.cr && s.cr.sc, "Core"]].filter(x => x[1] != null)
    .map(([m, v, n]) => `<span>${n}${sigDot(m, v, s)}</span>`).join("") : "";
  return `<div class="urow flipcard wcard" data-open="${esc(s.symbol)}" data-sk="${esc(skOf(s))}" role="link" tabindex="0" aria-label="Open ${esc(s.name)}"><div class="flipin"><div class="fface ffront">
    <div class="top"><span><a href="${stockHref(s.symbol)}" class="nm" tabindex="-1">${esc(s.name)}</a>${ubadges(s.symbol)}</span>${lvlNum(s.change_pct, inr(s.close), "price num")}<button class="act flipbtn" type="button" data-act="flip" aria-label="Flip to key ratios">↻</button></div>${qpSlot(s.symbol)}
    <div class="wmid">${miniLine(s.symbol)}<div class="wmv"><span class="t-label sub">Since saved <b class="num ${updn(chg)}">${sgnPct(pc)}</b></span>
      <div class="gbar" data-chart="Moved since saved" data-direct="1" data-nodraw><i class="${updn(chg)}" style="width:${FMT.coord(Math.min(100, Math.abs(pc) / WMX * 100))}%"></i></div></div></div>
    ${dots ? `<div class="sigrow t-label sub">${dots}</div>` : ""}${guidePanel("watchmove", pc)}
    ${thenNowHTML(w, s)}<p class="mini sub">From <i>${esc(w.src || "–")}</i>${OWNER() ? "" : ` · <span class="num ${updn(chg)}">${sgnRup(chg)} (${sgnPct(pc)})</span>`} in ${nd} day${nd === 1 ? "" : "s"}</p>
    ${(hf => hf ? `<p class="mini exl ex-red">🔴 Would not buy – red flag: ${esc(hf)}.</p>` : "")(hardFlagOf(s) || docFlagOf(s))}
    ${crossedFor(w.sym).map(L => `<p class="mini lvlx"><span class="chgbadge">crossed your level ${inr(L)}</span> <a href="${chartHref(w.sym)}">see chart</a></p>`).join("")}
    ${verdict}${zone}${rule}
    ${w.note ? `<p class="mini">📝 ${esc(w.note)}</p>` : ""}${w.by ? `<p class="mini sub">Suggested by ${esc(w.by)}</p>` : ""}
    <div class="btnrow"><button class="act" type="button" data-act="unsave" data-sym="${esc(w.sym)}">Remove</button>
      <button class="act" type="button" data-act="note" data-sym="${esc(w.sym)}">Edit note</button>
      <button class="act" type="button" data-act="move" data-sym="${esc(w.sym)}">${ic("case")} Move to portfolio</button>
      <button class="act" type="button" data-act="alert" data-sym="${esc(w.sym)}">${ic("signal")} Price alert${(USER.alerts || []).some(a => a.sym === w.sym) ? ` <span class="t-label">(${(USER.alerts || []).filter(a => a.sym === w.sym).length})</span>` : ""}</button></div>
  </div>${back}</div></div>`;
}
function watchlistScreen() {
  CTX = "Watchlist";
  const sk = UL.skipped(USER.archive, USER.tx, priceOf, LEVEL, PDAY);
  const srcs = [...new Set(USER.watch.map(w => w.src || "–"))].sort();
  USER.watch.forEach(w => { if (!w.then && BY[w.sym] && BY[w.sym].vt) { fillThen(w); persist(); } });     // #83 M1: old saves, once, from the log
  let list = USER.watch.filter(w => (!WL.src || (w.src || "–") === WL.src) && inBucket(w) && wlvPass(w));     // #83 M6: then-vs-now filter
  const mv = w => BY[w.sym] ? BY[w.sym].close / w.px - 1 : -1e9;
  if (WL.sort === "new") list = [...list].sort((a, b) => (b.savedAt || b.saved) < (a.savedAt || a.saved) ? -1 : 1);
  else if (WL.sort === "move") list = [...list].sort((a, b) => Math.abs(mv(b)) - Math.abs(mv(a)));
  else if (WL.sort === "since") list = [...list].sort((a, b) => mv(b) - mv(a));                                // #83 M6: change since saved
  else list = [...list].sort((a, b) => { const z = w => BY[w.sym] && SET.master ? (zoneFor(BY[w.sym]).kind === "in" ? 0 : 1) : 2; return z(a) - z(b) || mv(a) - mv(b); });
  const cb = BUCKETS().find(b => b.id === WL.b);
  if (cb && WL.sort === "mine") list = cb.syms.map(t => list.find(w => w.sym === t)).filter(Boolean);       // review #58 (11): your order
  setNavList("Watchlist" + (cb ? ": " + cb.name : ""), list.map(w => w.sym));
  const moves = USER.watch.filter(w => BY[w.sym] && w.px).map(w => (BY[w.sym].close / w.px - 1) * 100);
  const avgMove = moves.length ? moves.reduce((a, b) => a + b, 0) / moves.length : null;
  const bys = UL.bySource(USER.watch, priceOf);
  WMX = Math.max(1e-9, ...moves.map(Math.abs)); ensureMine(USER.watch.map(w => w.sym), "watchlist");
  if (parseHash().v === "feed") return `<div class="scr-h"><h1>Watchlist</h1><span class="sub num">${USER.watch.length} saved</span></div>${wlViewSwitch("feed")}${feedHTML()}`;   // review #77 A
  return `<div class="scr-h"><h1>Watchlist</h1><span class="sub num">${USER.watch.length} saved</span></div>${wlViewSwitch("list")}${USER.watch.length ? qpBar() : ""}
    ${userBanners()}${filingsLine()}${storyChanges()}${polFlags((USER.watch || []).map(w => w.sym), "watchlist")}${USER.watch.length ? bucketTabs() : ""}
    ${moves.length ? `<section class="tot"${moodAttr(avgMove)}><span class="tl t-label">Average move since you saved them</span>
      <span class="totv num ${FMT.cls(avgMove)}">${FMT.arrow(avgMove)} ${FMT.pct(avgMove, 2)}</span><span class="t-label sub">${FMT.count(moves.length)} stocks · prices from the ${dateTxt(PDAY)} close</span></section>` : ""}
    ${moves.length >= 2 ? `<details class="panel"><summary>% moved since you saved them</summary>${hbars(USER.watch.filter(w => BY[w.sym] && w.px).map(w => ({ n: w.sym, v: (BY[w.sym].close / w.px - 1) * 100, href: stockHref(w.sym) })).sort((a, b) => b.v - a.v), "Moves since saved")}</details>` : ""}
    ${bys.length >= 2 ? `<details class="panel"><summary>By who suggested it</summary><p class="sub">Average move since you saved them, per source – for learning, not a rating of anyone.</p>${bys.map(x => `<p class="mline">${esc(x.by)} <span class="sub">(${FMT.count(x.n)})</span> <span class="num ${updn(x.avg)}">${sgnPct(x.avg)}</span></p>`).join("")}</details>` : ""}
    ${USER.watch.length ? bucketPanel() : ""}
    ${list.length ? watchTable(list) : ""}
    <section class="panel"><h2>Ideas you skipped</h2>
      ${sk.n ? `<p class="mini" style="margin:0">${sk.n} idea${sk.n === 1 ? "" : "s"} saved and then removed without buying. Their average move since you saved them: <b class="${updn(sk.move)}">${sgnPct(sk.move)}</b>${sk.bench != null ? ` vs Nifty 500 <b>${sgnPct(sk.bench)}</b> over the same days` : ""}.${sk.measured < sk.n ? ` (${sk.n - sk.measured} without a price tonight.)` : ""}</p>`
        : `<p class="mini" style="margin:0">None yet. When you remove a saved stock without buying it, it is kept here, so you can see later whether skipping it was right.</p>`}
    </section>
    ${USER.watch.length ? `<div class="resctl" style="margin:0 0 10px"><label>Sort <select data-wl="sort">${[...(cb ? [["mine", "Your order (drag or ↑ ↓)"]] : []), ["new", "Date saved (newest first)"], ["since", "Change since saved"], ["move", "Biggest move"], ["zone", "In buy zone first"]].map(([k, n]) => `<option value="${k}"${WL.sort === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>From <select data-wl="src"><option value="">all sources</option>${srcs.map(x => `<option${WL.src === x ? " selected" : ""}>${esc(x)}</option>`).join("")}</select></label></div>
      ${wlvChips()}
      <p class="t-label sub swhint">Swipe a card left to remove it (Undo), right to move it to a bucket.</p>
      <div class="ulist wlist${cb && WL.sort === "mine" ? " reorder" : ""}"${cb ? ` data-bucket="${esc(cb.id)}"` : ""}>${list.map(w => cb && WL.sort === "mine" ? watchRow(w).replace('<div class="btnrow">', reorderBtns(w.sym) + '<div class="btnrow">') : watchRow(w)).join("")}</div>`
      : `<p class="empty storehint">${STORE_HINT}</p><p class="empty">No saved stocks yet – tap <b>${ic("star")} Save</b> on any stock (in 🔍 Search, a verdict group or a stock page) to keep it here – it is re-checked every night.</p>`}
    ${USER.archive.length ? `<details class="panel"><summary>Removed ideas (${USER.archive.length})</summary><div class="ulist">${USER.archive.slice().reverse().map(a => { const q = priceOf(a.sym);
      return `<p class="mini">${esc(a.sym)} · saved ${dateTxt(a.saved)} at ${inr(a.px)}, removed ${dateTxt(a.removed)}${a.bought ? " (bought)" : ""}${q ? ` · since saved <span class="${updn(q.close - a.px)}">${sgnPct((q.close / a.px - 1) * 100)}</span>` : ""}</p>`; }).join("")}</div></details>` : ""}
    ${LABELS}`;
}

// ----- 💼 Portfolio
const allBench = () => S.bench && Object.keys(S.bench.level || {}).length;
// ----- 🚦 exit check (review #31): the frozen Rules v1.0 exits of the paper ghosts, applied to each real holding
// fallback = the rules_v1 v1.0 values, only for a page built before review #31 (the nightly sends S.rules.exit)
const EXITR = () => (S.rules && S.rules.exit) || { keep_pct: 30, tax_pct: 50, tax_days: 365, months: [1, 4, 7, 10] };
const EXIT_ICON = { red: "🔴", orange: "🟠", yellow: "🟡", green: "🟢", none: "⚪" };
const N_ELIG = S.stocks.filter(x => x.cr && x.cr.el).length;
const hardFlagOf = s => { const f = ((s.v4 && s.v4.rf) || []).find(x => x.hard !== false); return f ? f.t.split(" (")[0] : null; };
const docFlagOf = s => s.rd && s.rd.light === "red" ? String(s.rd.first || "Company Reader red").replace(/^Reader says 🔴\s*/, "") : null;
function exitFor(sym, p) {
  const s = BY[sym], R = EXITR(), tax = S.tax || { lt_months: 12 }, reb = UL.nextRebalance(PDAY, R.months);
  const lt = (p.lots || []).map(l => UL.daysToLT(l.date, PDAY, tax.lt_months || 12)).filter(d => d > 0);
  const x = { tracked: !!s, ltDays: lt.length ? Math.min(...lt) : 0, rebalance: reb, rebalanceTxt: reb ? dateTxt(reb) : null, day: PDAY,
              keepPct: R.keep_pct, taxPct: R.tax_pct, taxDays: R.tax_days };
  if (s && s.ow) Object.assign(x, { wideOnly: true, hard: hardFlagOf(s), doc: docFlagOf(s), trim: SET.master && (vfor(s) || {}).g === "trim",
    lowLiq: s.traded_value_cr != null && s.traded_value_cr < 5, tv: s.traded_value_cr != null ? FMT.num(s.traded_value_cr, 1) : "?" });
  else if (s) {
    const c = s.cr || {};
    Object.assign(x, { hard: hardFlagOf(s), doc: docFlagOf(s), eligible: !!c.el, rank: c.el ? c.rk : null, of: c.of || N_ELIG,
      whyNot: (c.wn || []).join("; "), ageDays: p.first ? UL.days(p.first, PDAY) : 0, trim: SET.master && (vfor(s) || {}).g === "trim" });
  }
  return UL.exitCheck(x);
}
const exitLines = (e, all) => (all ? e.lines : e.lines.slice(0, 2)).map(l => `<p class="mini exl ex-${l.c}">${EXIT_ICON[l.c]} ${esc(l.text)}</p>`).join("")
  + (e.note ? `<p class="mini exl">⚪ ${esc(e.note)}</p>` : "") + (e.tax ? `<p class="mini exl">⏳ ${esc(e.tax)}</p>` : "");
const exitSummary = () => {
  const P = UL.portfolio(USER.tx, priceOf, PDAY);
  return UL.exitCounts(P.rows.map(r => exitFor(r.sym, r)));
};
let EXF = "";

function portfolioScreen(filter) {              // review #79: the selected portfolio (or Family) – pills, meter, then the screen, then the coach
  const id = pfCur(), core = withPf(id, () => portfolioScreenCore(filter)), rows = pfRows(id);
  const top = pfBarHTML() + meterHTML(meterOf(rows));
  const html = /<div class="scr-h">[\s\S]*?<\/div>/.test(core) ? core.replace(/(<div class="scr-h">[\s\S]*?<\/div>)/, m => m + top) : top + core;
  return html + polFlags(rows.map(r => r.sym), "portfolio") + (rows.length ? expertsHTML(rows) + whatToDoHTML(id) : "") + budgetHTML(id) + otherHTML(id) + (rows.length ? crashHTML(id) + scoreHTML(id) : "") + goalsHTML(id);
}
function portfolioScreenCore(filter) {
  CTX = "Portfolio";
  const P = UL.portfolio(USER.tx, priceOf, PDAY), T = P.totals;
  const tracked = USER.tx.filter(t => BY[t.sym]); ensureMine(P.rows.map(r => r.sym), "portfolio");
  const first = USER.tx.length ? USER.tx.reduce((m, t) => t.date < m ? t.date : m, USER.tx[0].date) : null;
  let bench = `<span class="sub">not available tonight</span>`, benchNote = "";
  if (allBench() && tracked.length) {
    const bc = UL.benchCompare(tracked, LEVEL, PDAY), tf = S.bench.tri_from;
    if (bc) {
      bench = `${rup(bc.value)}`;
      benchNote = `Same money on the same dates in the Nifty 500 TRI would be worth ${rup(bc.value)} – you are <b class="${updn(T.value - bc.value)}">${sgnRup(T.value - bc.value)}</b> ${T.value >= bc.value ? "ahead" : "behind"}.${tf && first && first < tf ? ` (Nifty 500 price index before ${dateTxt(tf)}, TRI after – the TRI chain starts then.)` : tf ? "" : " (Price index – the TRI chain has not started.)"}`;
    }
  }
  let xi = `<span class="sub">after 30 days</span>`;
  if (first && UL.days(first, PDAY) >= 30 && tracked.length) { const r = UL.xirr(UL.flowsOf(tracked, T.value, PDAY)); xi = r == null ? "–" : `<b class="${updn(r)}">${sgnPct(r).replace("%", "% a year")}</b>`; }
  else if (first) xi = `<span class="sub">after 30 days (first buy ${UL.days(first, PDAY)} day${UL.days(first, PDAY) === 1 ? "" : "s"} ago)</span>`;
  const tax = S.tax || { ok: false, lt_months: 12 };
  let st = 0, lt = 0;
  P.rows.forEach(r => { const q = priceOf(r.sym); if (q) { const x = UL.taxSplit(r.lots, q.close, PDAY, tax.lt_months || 12); st += x.st; lt += x.lt; } });
  if (filter !== undefined) EXF = filter;
  const ord = { red: 0, orange: 1, yellow: 2, green: 3, none: 4 };
  const checked = P.rows.map(r => Object.assign(r, { ex: exitFor(r.sym, r) }));
  const cnt = UL.exitCounts(checked.map(r => r.ex));
  const exitBar = checked.length ? `<div class="exbar" role="group" aria-label="Exit check filter"><span class="mini">${ic("signal")} <b>Exit check</b> <a href="#/more" class="mini" data-howexit="1">how it works</a></span>
    ${["red", "orange", "yellow", "green"].map(c => `<button class="act exf${EXF === c ? " on" : ""}" type="button" data-exf="${c}" aria-pressed="${EXF === c}">${cnt[c]} ${EXIT_ICON[c]}</button>`).join("")}
    ${EXF ? `<button class="act" type="button" data-exf="">Show all</button>` : ""}</div>` : "";
  // review #67 A: holdings as cards, sorted by gain (sort menu: gain, value, today, name); the gain bars share one scale
  const SORTS = { gain: (a, b) => (b.pnlPct ?? -1e9) - (a.pnlPct ?? -1e9), value: (a, b) => (b.value ?? -1) - (a.value ?? -1),
    today: (a, b) => (b.dayPct ?? -1e9) - (a.dayPct ?? -1e9), name: (a, b) => ((BY[a.sym] || {}).name || a.sym).localeCompare((BY[b.sym] || {}).name || b.sym) };
  const gmx = Math.max(1e-9, ...checked.map(r => Math.abs(r.pnlPct || 0)));
  const rows = checked.filter(r => !EXF || r.ex.level === EXF).sort(SORTS[PSORT()] || SORTS.gain).map(r => {
    const s = BY[r.sym], v = s && SET.master ? vfor(s) : null;
    const warn = [];
    if (v && v.g === "avoid") warn.push("Tonight's verdict is 🔴 Avoid");
    return `<a class="urow hold hcard ex-row-${r.ex.level}" href="#/portfolio/${encodeURIComponent(r.sym)}" data-sk="${esc(skOf(s))}">
      <div class="hh">${initBadge(s, r.sym)}<span class="nm">${esc(s ? s.name : r.sym)}</span><b class="num ${updn(r.pnl)}">${r.tracked ? sgnPct(r.pnlPct) : "–"}</b></div>${qpSlot(r.sym)}
      ${r.tracked ? `<div class="gbar" data-chart="Gain" data-direct="1" data-nodraw><i class="${updn(r.pnl)}" style="width:${FMT.coord(Math.abs(r.pnlPct || 0) / gmx * 100)}%"></i></div>` : ""}
      <p class="mini sub">${esc(s ? GROUP_LABEL(sigGroup(s) || "–") : "–")} · today <span class="num ${updn(r.day)}">${r.tracked ? sgnPct(r.dayPct) : "–"}</span></p>
      <div class="top"><span class="t-label sub">Total gain${ubadges(r.sym)}</span><span class="num ${updn(r.pnl)}">${r.tracked ? `${sgnRup(r.pnl)} (${sgnPct(r.pnlPct)})` : "not tracked"}</span></div>
      <p class="mini">${r.qty} × avg ${inr(r.avg)} = ${rup(r.invested)} → ${r.tracked ? rup(r.value) : "price unknown"} · today <span class="${updn(r.day)}">${r.tracked ? `${sgnRup(r.day)} (${sgnPct(r.dayPct)})` : "–"}</span> · held ${r.daysHeld} day${r.daysHeld === 1 ? "" : "s"}</p>
      ${s ? `<p class="mini">${vtag(s)}</p>` : ""}
      ${warn.length ? `<p class="mini warnline">⚠️ ${esc(warn.join(" · "))}</p>` : ""}
      ${exitLines(r.ex, false)}</a>`;
  }).join("");
  return `<div class="scr-h"><h1>Portfolio</h1><span class="sub num">${P.rows.length} holding${P.rows.length === 1 ? "" : "s"}</span></div>
    ${userBanners()}
    <section class="tot totals phero"${moodAttr(MOODBY() === "today" ? T.dayPct : T.pnlPct)} data-tilt data-pl="${T.pnl > 0 ? "up" : T.pnl < 0 ? "down" : ""}">
      <span class="tl t-label">Current value</span>
      <span class="totv num" data-roll>${rup(T.value)}</span>
      <span>${chgPill(T.pnlPct, 2, ` · ${sgnRup(T.pnl)}`)} <span class="t-label sub">overall</span> ${chgPill(T.dayPct, 2, ` · ${sgnRup(T.day)}`)} <span class="t-label sub">today</span></span>
      ${(MOODBY() === "today" ? T.dayPct : T.pnlPct) < -MOOD.neutral ? `<p class="t-label sub" style="margin:0">Down days are normal – check the exit check, not the colour.</p>` : ""}
      <div class="moodsw t-label" role="group" aria-label="Colour by"><span class="sub">Colour by</span>${[["overall", "Overall"], ["today", "Today"]].map(([k, n]) => `<button class="chip${MOODBY() === k ? " on" : ""}" type="button" data-moodby="${k}" aria-pressed="${MOODBY() === k}">${n}</button>`).join("")}</div>
      <div class="kv2">
      <span>Invested</span><b class="num">${rup(T.invested)}</b>
      <span>Total P&amp;L</span><b class="num ${updn(T.pnl)}">${sgnRup(T.pnl)} (${sgnPct(T.pnlPct)})</b>
      <span>Today's P&amp;L</span><b class="num ${updn(T.day)}">${sgnRup(T.day)} (${sgnPct(T.dayPct)})</b>
      <span>Realised P&amp;L</span><b class="num ${updn(T.realised)}">${sgnRup(T.realised)}</b>
      <span>Same money in Nifty 500 TRI ${ib("tri")}</span><b class="num">${bench}</b>
      <span>XIRR ${ib("xirr")}</span><b class="num">${xi}</b></div>
      ${benchNote ? `<p class="mini" style="margin:10px 0 0">${benchNote}</p>` : ""}
      ${T.unpricedInvested ? `<p class="sub">${rup(T.unpricedInvested)} in stocks this page doesn't track is left out of the totals.</p>` : ""}
      ${(ser => ser.length >= SPARK_MIN ? spark(ser, r => r.v, "Your portfolio", "value since your first buy:") : spark(trackValue(T.value), r => r.v, "Your portfolio", "value on your visits:"))(pfSeries())}
      <p class="sub" style="margin:0">Prices from the ${dateTxt(PDAY)} close. Average price includes your charges.</p>${qpOn() && !OWNER() ? `${qpBar()}<p class="qpapprox t-label" data-xkey="quick_price" data-qpapprox="${esc(JSON.stringify(P.rows.filter(r => r.tracked && BY[r.sym]).map(r => [r.sym, r.qty, BY[r.sym].close])))}" hidden></p>` : ""}</section>${goalJar(T.value)}
    ${allocation(P)}${insightsPanel(P)}${P.rows.length ? policyPanel(P) : ""}${T.value > 0 ? ddMeter(trackValue(T.value), "Your portfolio (value recorded on each visit, this device only)", null, true) : ""}${taxHelper()}
    ${USER.tx.some(t => t.j) ? `<p class="t-label"><a href="#/journal">Decision journal ›</a></p>` : ""}<p class="t-label"><a href="#/xray">Mutual fund X-ray ›</a></p>
    <div class="btnrow" style="margin:0 0 12px"><button class="act big" type="button" data-act="buy" data-sym="">${ic("plus")} Add a stock you bought</button>
      <label class="act big">${ic("upload")} Import from Zerodha<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-act="import" hidden></label></div>
    ${exitBar}
    ${checked.length > 1 ? `<label class="psort t-label">Sort holdings <select data-psort aria-label="Sort holdings">${[["gain", "Total gain"], ["value", "Value"], ["today", "Today"], ["name", "Name"]].map(([k, n]) => `<option value="${k}"${PSORT() === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}
    ${rows ? `<div class="ulist">${rows}</div>` : checked.length ? `<p class="empty">No holdings with this colour.</p>` : `<p class="empty storehint">${STORE_HINT}</p><p class="empty">No holdings yet – tap <b>${ic("case")} Bought</b> on a stock, add one above, or import your Zerodha holdings file (Kite → Holdings → Download, or Console → Portfolio → Holdings → Download).</p>`}
    ${P.rows.length ? `<section class="panel"><h2>Tax helper</h2>
      <p class="mini" style="margin:0">Unrealised gain on lots held more than ${tax.lt_months || 12} months (long-term): <b class="${updn(lt)}">${sgnRup(lt)}</b> · on younger lots (short-term): <b class="${updn(st)}">${sgnRup(st)}</b>. Each holding's page shows "LTCG in N days" per lot.</p>
      ${(() => {                                  // review #33: estimate with the official rates (this financial year)
        const fy = UL.fyOf(PDAY), sold = P.sold.filter(x => UL.fyOf(x.date) === fy);
        const rst = sold.reduce((a, x) => a + (x.stG || 0), 0), rlt = sold.reduce((a, x) => a + (x.ltG || 0), 0);
        const now = UL.taxEstimate(rst, rlt, tax), all = UL.taxEstimate(rst + st, rlt + lt, tax);
        if (!all) return "";
        return `<p class="mini" style="margin:6px 0 0">FY ${fy}: realised short-term ${sgnRup(rst)}, long-term ${sgnRup(rlt)} → tax so far about <b>${rup(now.total)}</b>.
          If you sold everything at tonight's close: about <b>${rup(all.total)}</b> (STCG ${rup(all.stTax)} at ${tax.stcg_pct}% · LTCG ${rup(all.ltTax)} = ${tax.ltcg_pct}% of ${rup(all.ltTaxable)} above the yearly ${rup(tax.ltcg_exempt)}).</p>
          <p class="sub" style="margin:2px 0 0"><b>Estimate before surcharge and cess – not tax advice.</b> Losses are netted only within the same kind here; set-off between kinds and carry-forward are not modelled.</p>`;
      })()}
      <p class="sub">${tax.ok ? `Rates as of ${dateTxt(tax.checked)}, source: <a href="${esc(tax.sources[0])}" target="_blank" rel="noopener">${esc(tax.sources[0])}</a>.` : `No rupee tax estimate: ${esc(tax.note || "the official rates could not be checked")} (checked ${dateTxt(tax.checked || PDAY)}).`} The ${tax.lt_months || 12}-month rule for listed shares: confirm on incometax.gov.in.</p></section>` : ""}
    ${P.sold.length ? `<details class="panel"><summary>Sold (${P.sold.length}) – realised ${sgnRup(T.realised)}</summary><div class="ulist">${P.sold.map(x => `<p class="mini">${dateTxt(x.date)} · sold ${x.qty} ${esc(x.sym)} at ${inr(x.px)} (avg ${inr(x.avg)}) → <span class="${updn(x.pnl)}">${sgnRup(x.pnl)}</span>${x.held != null ? ` · held ${x.held} days` : ""}</p>`).join("")}</div></details>` : ""}
    ${LABELS}`;
}
function holdingScreen(sym) {
  const list = USER.tx.filter(t => t.sym === sym);
  if (!list.length) return null;
  const s = BY[sym], p = UL.position(list), q = priceOf(sym), tax = S.tax || { lt_months: 12 };
  CTX = "Portfolio";
  const lots = p.lots.map(l => { const d = UL.daysToLT(l.date, PDAY, tax.lt_months || 12), g = q ? (q.close - l.px) * l.qty : null;
    const est = !tax.ok || g == null ? "" : d ? (g > 0 ? `STCG tax about ${rup(g * tax.stcg_pct / 100)}` : "no STCG tax (loss)") : `LTCG – counts toward the yearly ${rup(tax.ltcg_exempt)}`;
    return `<tr><td class="l">${dateTxt(l.date)}</td><td>${l.qty}</td><td>${inr(l.px)}</td><td>${g != null ? `<span class="${updn(g)}">${sgnRup(g)}</span>` : "–"}</td><td>${d ? `LTCG in ${d} day${d === 1 ? "" : "s"}` : "long-term"}</td>${tax.ok ? `<td class="l">${est}</td>` : ""}</tr>`; }).join("");
  const txs = list.slice().sort((a, b) => a.date < b.date ? 1 : -1).map(t => `<div class="txrow"><span>${dateTxt(t.date)} · <b>${t.side === "buy" ? "Bought" : "Sold"}</b> ${t.qty} at ${inr(t.px)}${t.charges ? ` + ${rup(t.charges, 2)} charges` : ""}${t.src ? ` <span class="sub">(${esc(t.src)})</span>` : ""}</span>
    <span class="btnrow"><button class="act" type="button" data-act="edittx" data-id="${t.id}">Edit</button><button class="act" type="button" data-act="deltx" data-id="${t.id}">Delete</button></span></div>`).join("");
  const value = q ? p.qty * q.close : null;
  return `<button class="back" type="button" data-back="#/portfolio">← Portfolio</button>${fallCheck(sym, p)}
    <div class="hero"><h1>${esc(s ? s.name : sym)}${ubadges(sym)}</h1><span class="sub">${esc(sym)}${s ? " · " + esc(s.industry) : " · not tracked on this page"}</span>
      ${p.qty ? `<span class="big num">${value != null ? rup(value) : "price unknown"}</span><span class="sub">${p.qty} shares · avg ${inr(p.avg)} · invested ${rup(p.invested)}${value != null ? ` · ${moveNum(value - p.invested, sgnRup(value - p.invested))} (${moveNum(value - p.invested, sgnPct((value / p.invested - 1) * 100))})` : ""}</span>` : `<span class="sub">All sold · realised ${sgnRup(p.realised)}</span>`}</div>
    <div class="btnrow" style="margin:0 0 12px"><button class="act" type="button" data-act="buy" data-sym="${esc(sym)}">${ic("plus")} Bought more</button>${p.qty ? `<button class="act" type="button" data-act="sell" data-sym="${esc(sym)}">${ic("minus")} Sold</button>` : ""}${s ? `<a class="act" href="${stockHref(sym)}">Open the full stock page</a>` : ""}</div>
    ${s ? `<section class="panel"><h2>Price over the last year</h2>${txChart(sym, list)}<div class="legend"><span>▲ bought</span><span>▼ sold</span></div></section>` : ""}
    ${p.qty ? (ex => `<section class="panel ex-panel"><h2>Exit check ${EXIT_ICON[ex.level]}</h2>${exitLines(ex, true)}${guidePanel("exit", Object.assign({}, ex, { hard: !!(BY[sym] && (hardFlagOf(BY[sym]) || docFlagOf(BY[sym]))) }))}
      <p class="sub">The same frozen Rules v1.0 exits as the paper ghosts – nothing new, nothing tuned. <a href="#/more">How the exit check works</a>.</p></section>`)(exitFor(sym, p)) : ""}
    ${lots ? `<section class="panel"><h2>Lots and tax timing</h2><div class="tablewrap"><table class="hist"><thead><tr><th>Bought</th><th>Qty</th><th>Price</th><th>Gain</th><th>Tax</th>${tax.ok ? "<th>If sold today</th>" : ""}</tr></thead><tbody>${lots}</tbody></table></div>
      <p class="sub">Oldest shares are counted as sold first (FIFO). Long-term = held more than ${tax.lt_months || 12} months – confirm on incometax.gov.in.${tax.ok ? ` Estimate before surcharge and cess – not tax advice. Rates as of ${dateTxt(tax.checked)}, source: <a href="${esc(tax.sources[0])}" target="_blank" rel="noopener">Income Tax Department</a>.` : " No rupee tax estimate (official rates not checked)."}</p></section>` : ""}
    <section class="panel"><h2>Transactions</h2>${txs}</section>${LABELS}`;
}
function txChart(sym, txs) {
  const hh = histOf(sym), cl = hh && hh.close, ds = (hh && hh.dates) || [];
  if (!cl || !ds.length) return `<p class="sub">No price history.</p>`;
  const pts = ds.map((d, i) => [d, cl[i]]).filter(x => x[1] != null);
  if (pts.length < 2) return "";
  const W = 340, Ht = 130, P = 6, lo = Math.min(...pts.map(x => x[1])), hi = Math.max(...pts.map(x => x[1]));
  const sx = i => P + i * (W - 2 * P) / (pts.length - 1), sy = v => Ht - P - (v - lo) / ((hi - lo) || 1) * (Ht - 2 * P);
  const idx = d => { let k = -1; pts.forEach((x, i) => { if (x[0] <= d) k = i; }); return k; };
  const marks = txs.map(t => { const i = idx(t.date); if (i < 0) return ""; const x = sx(i), y = sy(pts[i][1]);            // on the line at that day's close; the tooltip says the price paid
    return t.side === "buy" ? `<path data-series="Buys" d="M${x - 5},${y + 4} L${x + 5},${y + 4} L${x},${y - 5} Z" fill="var(--good)"><title>Bought ${t.qty} at ₹${t.px} on ${t.date}</title></path>`
      : `<path data-series="Sells" d="M${x - 5},${y - 4} L${x + 5},${y - 4} L${x},${y + 5} Z" fill="var(--bad)"><title>Sold ${t.qty} at ₹${t.px} on ${t.date}</title></path>`; }).join("");
  const hasB = txs.some(t => t.side === "buy"), hasS = txs.some(t => t.side !== "buy");
  return `<figure class="txfig" data-chart="Price with your buys and sells">${ktitle(`${kw("Price", "var(--accent)")} with your ${[hasB ? kw("Buys", "var(--good)", { label: "buys ▲" }) : "", hasS ? kw("Sells", "var(--bad)", { label: "sells ▼" }) : ""].filter(Boolean).join(" and ") || "trades"}`, "p")}<svg viewBox="0 0 ${W} ${Ht}" style="width:100%;height:auto" role="img" aria-label="Price with your buys and sells"><polyline data-series="Price" fill="none" stroke="var(--accent)" stroke-width="1.6" points="${pts.map((x, i) => `${FMT.coord(sx(i))},${FMT.coord(sy(x[1]))}`).join(" ")}"/>${marks}</svg></figure>`;
}

// ----- the sheet (forms): save note, bought / sold, import preview, restore preview
function sheet(html) {
  const d = document.getElementById("sheet");
  d.innerHTML = `<div class="sheetbody">${html}</div>`;
  if (typeof d.showModal === "function") { if (!d.open) d.showModal(); } else { d.setAttribute("open", ""); const sc = document.getElementById("scrim"); if (sc) sc.hidden = false; }   // #83 H: ::backdrop or the scrim
  const f = d.querySelector("input:not([type=hidden]):not([readonly]), textarea"); if (f && !matchMedia("(pointer: coarse)").matches) f.focus();
  // review #50: per-trade costs as you type (small accounts: costs eat small positions)
  const tf = d.querySelector("#txform"), cl = d.querySelector(".costline");
  if (tf && cl) { const upd = () => { const v = (+tf.qty.value || 0) * (+tf.px.value || 0), c = UL.tradeCost(cl.dataset.side, v);
      cl.textContent = v ? `Estimated costs ${FMT.money(c.total, 2)} (${FMT.pctPlain(c.pct, 2)}): STT ${FMT.money(c.stt, 2)}${c.stamp ? ` · stamp duty ${FMT.money(c.stamp, 2)}` : ""}${c.dp ? ` · DP charge ${FMT.money(c.dp, 2)}` : ""} · exchange + SEBI + GST ${FMT.money(c.exch + c.sebi + c.gst, 2)}. Published rates – check yours.` : "";
      if (!tf.charges.value && v) tf.charges.placeholder = FMT.raw(c.total, 2); };
    tf.addEventListener("input", upd); upd(); }
}
let XSY = null;
function closeSheet() { const d = document.getElementById("sheet"), y = XSY; XSY = null; if (d.open && d.close) d.close(); if (y != null) requestAnimationFrame(() => window.scrollTo(0, y)); d.removeAttribute("open"); d.innerHTML = ""; d.classList.remove("fsheet", "tsheet"); d.style.maxHeight = d.style.transform = ""; const sc = document.getElementById("scrim"); if (sc) sc.hidden = true; }
function saveSheet(sym) {
  const s = BY[sym], w = USER.watch.find(x => x.sym === sym);
  sheet(`<h2>${w ? "Saved:" : "Save"} ${esc(s ? s.name : sym)}</h2>
    <form id="saveform" data-sym="${esc(sym)}">
      ${w ? `<p class="mini">Saved ${dateTxt(w.saved)} at ${inr(w.px)} from <i>${esc(w.src)}</i>.</p>` : `<p class="mini savefrom">${saveFrom(s)}</p>`}
      <label class="fl">Why I saved it (optional)<textarea name="note" rows="2" maxlength="${UL.NOTE_MAX}">${esc(w ? w.note : "")}</textarea></label>
      <label class="fl">Suggested by (optional – me, a friend, YouTube, news)<input name="by" maxlength="${UL.BY_MAX}" list="bylist" value="${esc(w ? w.by || "" : "")}"></label>
      <datalist id="bylist">${[...new Set(USER.watch.map(x => x.by).filter(Boolean))].map(x => `<option value="${esc(x)}">`).join("")}</datalist>
      <fieldset class="bpick"><legend class="t-label sub">Buckets</legend>${BUCKETS().map(b => `<label class="gi sw"><input type="checkbox" name="bk" value="${esc(b.id)}"${b.syms.includes(sym) ? " checked" : ""}><span class="gt">${esc(b.name)}</span></label>`).join("")}
        ${BUCKETS().length < UL.MAX_BUCKETS ? `<label class="fl">New bucket (optional)<input name="bnew" maxlength="${UL.BUCKET_NAME}" placeholder="e.g. Long term"></label>` : ""}</fieldset>
      <div class="btnrow"><button class="act big" type="submit">${w ? "Save" : "Save to watchlist"}</button>${w ? `<button class="act" type="button" data-act="unsave" data-sym="${esc(sym)}">Remove</button>` : ""}<button class="act" type="button" data-close>Cancel</button></div>
    </form>`);
}
function txSheet(side, sym, edit) {
  const s = BY[sym], held = sym ? heldQty(sym) : 0;
  const t = edit || { qty: "", px: s ? s.close : "", date: TODAY, charges: "" };
  sheet(`<h2>${side === "buy" ? "Bought" : "Sold"} ${sym ? esc(s ? s.name : sym) : "a stock"}${edit ? " – edit" : ""}</h2>
    <form id="txform" data-side="${side}" data-sym="${esc(sym || "")}" data-id="${edit ? edit.id : ""}" novalidate>
      ${sym ? "" : `<label class="fl">Stock (symbol)<input name="sym" list="symlist" autocapitalize="characters" autocomplete="off" placeholder="e.g. TCS" required></label>
        <datalist id="symlist">${S.stocks.map(x => `<option value="${esc(x.symbol)}">${esc(x.name)}</option>`).join("")}</datalist>`}
      ${side === "sell" ? `<p class="mini">You hold ${held}.</p>` : ""}
      <label class="fl">Quantity (whole shares)<input name="qty" type="number" inputmode="numeric" min="1" step="1" value="${esc(t.qty)}" required></label>
      <label class="fl">Price per share (₹)<input name="px" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(t.px)}" required></label>
      <label class="fl">Date<input name="date" type="date" max="${TODAY}" value="${esc(t.date)}" required></label>
      <label class="fl">Charges (₹, optional – brokerage, STT, stamp duty…)<input name="charges" type="number" inputmode="decimal" min="0" step="0.01" value="${esc(t.charges || "")}"></label>
      <p class="t-label sub costline" data-side="${side}"></p>
      <details><summary>Decision journal (optional)</summary>
        <label class="fl">Why<textarea name="jwhy" rows="2" maxlength="300">${esc((t.j || {}).why || "")}</textarea></label>
        <label class="fl">What would make me ${side === "buy" ? "sell" : "buy back"}<textarea name="jsell" rows="2" maxlength="300">${esc((t.j || {}).sell || "")}</textarea></label>
        <label class="fl">Planned holding period<input name="jhold" maxlength="60" value="${esc((t.j || {}).hold || "")}" placeholder="e.g. 3 years"></label></details>
      <p class="formerr" role="alert"></p>
      <div class="btnrow"><button class="act big" type="submit">Save</button><button class="act" type="button" data-close>Cancel</button></div>
      <p class="sub">Saved only on this device.</p>
    </form>`);
}
function readFile(input, fn) {
  const f = input.files && input.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => fn(String(r.result || "")); r.readAsText(f); input.value = "";
}
let PENDING = null;                                          // import rows / restore text waiting for a confirm
// review #67 B: Zerodha Console holdings (CSV / XLSX), tradebook (CSV) and Tax P&L (XLSX, a cross-check) – read here in the browser only
function readImport(input) {
  const f = input.files && input.files[0]; if (!f) return; input.value = "";
  const fail = e => importPreview({ err: "Could not read this file (" + String(e && e.message || e) + "). Export it again from Console, or save it as CSV." });
  if (/\.xlsx$/i.test(f.name)) f.arrayBuffer().then(UL.readXlsx).then(sh => { let best = null;
      for (const [nm, rows] of sh) { const r = UL.consoleImport(rows, x => !!BY[x], TODAY); if (!r.err && (!best || (r.rows.length > best.rows.length))) best = Object.assign(r, { sheetName: nm }); }
      importPreview(best || { err: "No holdings, trades or Tax P&L totals found in any sheet of this file.", rows: [], skipped: [] }); }).catch(fail);
  else f.text().then(t => importPreview(UL.consoleImport(UL.parseCSV(t), x => !!BY[x], TODAY))).catch(fail);
}
const IMP_KIND = { holdings: "Holdings", tradebook: "Tradebook", taxpnl: "Tax P&L" };
function importPreview(r) {
  if (typeof r === "string") r = UL.consoleImport(UL.parseCSV(r), x => !!BY[x], TODAY);
  if (r.err) { sheet(`<h2>Import</h2><p class="formerr">${esc(r.err)}</p><div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`); return; }
  const skippedTxt = r.skipped && r.skipped.length ? `<details class="impskip"><summary>${FMT.count(r.skipped.length)} row${r.skipped.length === 1 ? "" : "s"} skipped</summary>${r.skipped.map(x => `<p class="mini">${x.line ? `Line ${x.line}: ` : ""}${esc(x.why)}</p>`).join("")}</details>` : `<p class="mini">No rows skipped.</p>`;
  if (r.kind === "taxpnl") {                                // cross-check only: Zerodha's realised totals beside ours for each FY we have sells in
    const P = UL.portfolio(USER.tx, priceOf, PDAY), fy = {};
    P.sold.forEach(x => { const k = UL.fyOf(x.date), o = fy[k] || (fy[k] = { st: 0, lt: 0 }); o.st += x.stG || 0; o.lt += x.ltG || 0; });
    const t = r.totals;
    sheet(`<h2>Tax P&amp;L – cross-check</h2><p class="mini">Read from the file (nothing is added): short-term <b class="num">${t.st != null ? FMT.moneySigned(t.st, 0) : "–"}</b> · long-term <b class="num">${t.lt != null ? FMT.moneySigned(t.lt, 0) : "–"}</b>.</p>
      ${Object.keys(fy).length ? `<div class="tablewrap"><table class="hist"><thead><tr><th>Financial year</th><th>Your short-term</th><th>Your long-term</th></tr></thead><tbody>${Object.entries(fy).sort().reverse().map(([k, o]) => `<tr><td class="l">${esc(k)}</td><td class="num">${FMT.moneySigned(o.st, 0)}</td><td class="num">${FMT.moneySigned(o.lt, 0)}</td></tr>`).join("")}</tbody></table></div>
        <p class="t-label sub">Pick the row for the same year as the file. A difference usually means a trade is missing here, or charges are counted differently. For your CA, not advice.</p>` : `<p class="mini">You have no sells here yet to compare with – import your tradebook first.</p>`}
      <div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`);
    return;
  }
  const syms = [...new Set(r.rows.map(x => x.sym))], clash = syms.filter(t => USER.tx.some(x => x.sym === t));
  PENDING = { kind: "import", rows: r.rows, syms };
  const tb = r.kind === "tradebook";
  sheet(`<h2>Import from Zerodha – ${esc(IMP_KIND[r.kind] || "file")}${r.sheetName ? ` <span class="sub">(sheet ${esc(r.sheetName)})</span>` : ""}</h2>
    <p class="mini">${FMT.count(r.rows.length)} ${tb ? `trade${r.rows.length === 1 ? "" : "s"} (same-day fills of one stock merged)` : `holding${r.rows.length === 1 ? "" : "s"}`} found for ${FMT.count(syms.length)} stock${syms.length === 1 ? "" : "s"}.
      ${tb ? "Buy / sell dates come from the file, so long- vs short-term gains and XIRR are right." : `Dated ${esc(dateTxt(TODAY))} unless the file has dates – import the tradebook for the real buy dates (they matter for tax and XIRR).`}</p>
    ${skippedTxt}
    <div class="tablewrap"><table class="hist"><thead><tr><th>Stock</th>${tb ? "<th>Buy / sell</th>" : ""}<th>Qty</th><th>Price</th><th>Date</th></tr></thead><tbody>${r.rows.slice(0, 200).map(x => `<tr><td class="l">${esc(x.sym)}${x.tracked ? "" : ` <span class="sub">not tracked</span>`}</td>${tb ? `<td class="l">${x.side === "sell" ? "Sell" : "Buy"}</td>` : ""}<td class="num">${FMT.count(x.qty)}</td><td class="num">${inr(x.px)}</td><td>${esc(x.date)}</td></tr>`).join("")}</tbody></table></div>
    <label class="fl">Import into<select id="imppf">${pfList().map(p => `<option value="${esc(p.id)}"${p.id === pfCur() ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
    ${clash.length ? `<p class="mini">You already have entries for ${FMT.count(clash.length)} of these stock${clash.length === 1 ? "" : "s"} (${esc(clash.slice(0, 6).join(", "))}${clash.length > 6 ? "…" : ""}).</p>` : ""}
    <div class="btnrow">${clash.length ? `<button class="act big" type="button" data-act="doimport" data-mode="replace">Replace my entries for ${FMT.count(clash.length)} stock${clash.length === 1 ? "" : "s"}</button><button class="act" type="button" data-act="doimport" data-mode="add">Add alongside</button>`
      : `<button class="act big" type="button" data-act="doimport" data-mode="add">Add ${FMT.count(r.rows.length)}</button>`}<button class="act" type="button" data-close>Cancel</button></div>
    <p class="t-label sub">Read on this device only – the file is never uploaded. You can still add or edit entries by hand.</p>`);
}
function restorePreview(text) {
  const r = UL.restore(text, USER, "replace", TODAY);
  if (r.err) { sheet(`<h2>Restore</h2><p class="formerr">${esc(r.err)}</p><div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`); return; }
  PENDING = { kind: "restore", text };
  const c = r.counts;
  sheet(`<h2>Restore from a backup</h2>
    <p class="mini">Backup${c.made ? ` of ${dateTxt(c.made)}` : ""}: ${c.watch} saved stock${c.watch === 1 ? "" : "s"}, ${c.tx} transaction${c.tx === 1 ? "" : "s"}, ${c.archive} removed idea${c.archive === 1 ? "" : "s"}${c.drawings ? `, ${c.drawings} chart drawing${c.drawings === 1 ? "" : "s"}` : ""}.</p>
    <p class="mini">Now on this device: ${USER.watch.length} saved, ${USER.tx.length} transactions.</p>
    <div class="btnrow"><button class="act big" type="button" data-act="dorestore" data-mode="replace">Replace with the backup</button>
      <button class="act big" type="button" data-act="dorestore" data-mode="merge">Merge (keep both)</button><button class="act" type="button" data-close>Cancel</button></div>`);
}
async function downloadBackup() {
  // review #64: the share sheet where the browser offers one for files (iPad: Save to Files / iCloud), otherwise a normal download
  USER.meta.display = displayPrefs();                               // review #73: the theme and display choices travel in the backup
  USER.meta.world = WU;                                             // review #80: the World watchlist and portfolios (their own storage key)
  const text = UL.backup(USER, TODAY), name = `screener-backup-${TODAY}.json`;
  try {
    const f = typeof File === "function" ? new File([text], name, { type: "application/json" }) : null;
    if (f && navigator.canShare && navigator.canShare({ files: [f] }) && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ files: [f], title: "Screener backup" });
      USER.meta.lastBackup = TODAY; USER.meta.backupSnooze = null; persist(); render(true); toast("Backup saved"); return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a");
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  USER.meta.lastBackup = TODAY; USER.meta.backupSnooze = null; persist(); render(true);
  toast("Backup saved");
}
// review #64: the reminder card on Home (and the same item in Alerts)
function backupReminder() {
  if (!STORE_OK) return "";
  const b = UL.backupDue(USER, TODAY); if (!b.due) return "";
  return `<p class="mline bkline bkrem">${ic("save")} ${b.days != null ? `Last backup ${FMT.count(b.days)} days ago` : "Not backed up yet"} – <a href="#/settings/backup">back up in Settings ›</a> <button class="linkbtn" type="button" data-act="bksnooze">Later</button> <button class="linkbtn" type="button" data-act="bkdone">Done</button></p>`;
}
// review #64: opened at an address that is not the app's current one (the link moved) – the data saved HERE stays here
function oldAddressBanner() {
  const cur = (S.public_link && S.public_link.url) || PUBLIC_URL;
  if (!/^https?:$/.test(location.protocol) || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname)) return "";
  let host = ""; try { host = new URL(cur).host; } catch (e) { return ""; }
  if (!host || location.host === host || !(USER.watch.length || USER.tx.length)) return "";
  return `<div class="warnbox oldaddr">🟡 <b>Your data is saved at this old address – back up here first.</b> The app now lives at <a href="${esc(cur)}">${esc(host)}</a>. Back up here first (Settings → Backup / Restore), then open the new link and use Restore. <a class="act" href="#/settings/backup">${ic("download")} Open Backup / Restore</a></div>`;
}
function addWatch(sym, note) {
  const s = BY[sym]; if (!s || inWatch(sym)) return;
  const v = SET.master ? vfor(s) : vfor(s);
  USER.watch.push({ id: UL.uid(), sym, saved: PDAY, savedAt: TODAY, px: s.close, src: CTX, g: v ? v.g : null, core: s.cr ? s.cr.sc : null, note: note || "", then: thenSnap(s) });   // #83 M1
  JUST_STAR = sym; haptic();                               // review #63: the star fills with a small pop on the next render; #74: tap feedback
}
function removeWatch(sym, bought) {
  const i = USER.watch.findIndex(w => w.sym === sym); if (i < 0) return;
  const [w] = USER.watch.splice(i, 1);
  USER.archive.push(Object.assign({}, w, { removed: TODAY, bought: !!bought }));
}
function userAction(el, e) {
  const act = el.dataset.act, sym = el.dataset.sym;
  if (act && act.startsWith("flt") && fltAct(act, el)) return true;                       // review #70 (S2)
  if (act && /^q(field|fix|save|del)$/.test(act) && qAct(act, el)) return true;            // review #70 (S4)
  if (act === "resview") { prefSet(RESVIEW, el.dataset.v === "table" ? "table" : "cards"); drawResults(); return true; }   // review #70 (S5)
  if (act === "vchf") { VCHF = el.dataset.v; render(true); return true; }                                              // review #70 (V2)
  if (act === "vladder") { vLadderSheet(el.dataset.sym); return true; }
  if (act === "bminfo") { bmInfoSheet(el.dataset.sym); return true; }                                                 // review #71                                                // review #70 (V3)
  if (act === "vhsq") { vhSquare(el); return true; }                                                                   // review #70 (V6)
  if ((parseHash().name === "learn" || act === "llang") && learnAct(act, el)) return true;          // review #68
  if (act === "save") { inWatch(sym) ? saveSheet(sym) : saveSheet(sym); return true; }
  if (act === "unsave") {
    const i = USER.watch.findIndex(w => w.sym === sym), w = USER.watch[i], na = USER.archive.length;
    removeWatch(sym, false); persist(); closeSheet(); render(true);
    if (w) toast(`Removed ${sym} from the Watchlist`, () => { USER.watch.splice(Math.max(0, i), 0, w); USER.archive.splice(na, 1); persist(); render(true); });
    return true; }
  if (act === "note") { saveSheet(sym); return true; }
  if (act === "rr") { USER.rr = USER.rr || {}; const per = USER.rr[sym] = USER.rr[sym] || {}, id = el.dataset.id;
    per[id] = Object.assign({}, per[id], { a: el.dataset.a }); persist(); render(true); return true; }
  if (act === "rrexport") { rrExport(); toast("Answers exported"); return true; }
  if (act === "cmp") { const c = CMP.get(); if (c.includes(sym)) { CMP.put(c.filter(x => x !== sym)); toast(`${sym} removed from Compare`); render(true); return true; }
    if (c.length >= CMP.MAX) { toast(`Compare holds ${CMP.MAX} stocks – remove one first`); go("#/compare"); return true; }
    CMP.put([...c, sym]); if (c.length + 1 >= 2) go("#/compare"); else { toast(`${sym} added – pick one more to compare`); render(true); } return true; }
  if (act === "cmprm") { CMP.put(CMP.get().filter(x => x !== sym)); render(true); return true; }
  if (act === "alert") { alertSheet(sym); return true; }
  if (act === "alertrm") { USER.alerts = (USER.alerts || []).filter(a => a.id !== el.dataset.id); persist(); closeSheet(); render(true); return true; }
  if (act === "alseen") { const o = alGet(AL_SEEN); o[el.dataset.id] = Date.now(); alPut(AL_SEEN, o); render(true); return true; }   // review #59
  if (act === "alertseen") { const ids = alertHitsNow().map(x => x.id); (USER.alerts || []).forEach(a => { if (ids.includes(a.id)) a.seen = PDAY; }); persist(); render(true); return true; }
  if (act === "sharestock") { shareStock(sym); return true; }
  if (act === "bup") { UL.bucketMove(USER, el.dataset.id, -1); persist(); render(true); return true; }
  if (act === "bshare") { shareList(el.dataset.id); return true; }
  if (act === "bdown") { UL.bucketMove(USER, el.dataset.id, 1); persist(); render(true); return true; }
  if (act === "wup" || act === "wdown") { const b = BUCKETS().find(x => x.id === WL.b); if (!b) return true; const i = b.syms.indexOf(sym), j = i + (act === "wup" ? -1 : 1);
    if (i >= 0 && j >= 0 && j < b.syms.length) { [b.syms[i], b.syms[j]] = [b.syms[j], b.syms[i]]; persist(); render(true); } return true; }
  if (act === "bdel") { const B = BUCKETS(), i = B.findIndex(b => b.id === el.dataset.id), b = B[i]; if (!b) return true;
    UL.bucketDelete(USER, b.id); if (WL.b === b.id) WL.b = "all"; persist(); render(true);
    toast(`Deleted the bucket “${b.name}” (the stocks stay in All)`, () => { USER.buckets.splice(i, 0, b); persist(); render(true); }); return true; }
  if (act === "fundrm") { USER.funds.splice(+el.dataset.i, 1); persist(); render(true); return true; }
  if (act === "rankcsv") { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rankCSV()], { type: "text/csv" }));
    a.download = `core-ranking-${PDAY}.csv`; document.body.appendChild(a); a.click(); a.remove(); return true; }
  if (act === "hgl") { xSheet(el.dataset.v, { s: null }); return true; }                         // review #90 C5
  if (act === "qprefresh") { qpRefresh(); return true; }                                         // review #92 B2
  if (act === "qpinfo") { const q = QP.quotes[el.dataset.qp]; xSheet("quick_price", { s: BY[el.dataset.qp] || null, val: el.textContent, label: q ? `last night's close ${inr((BY[el.dataset.qp] || {}).close)}` : "" }); return true; }   // review #92 B7
  if (act === "polopen") { policySheet(el.dataset.v); return true; }                                // review #90 A / C3
  if (act === "radarf") { RADAR[el.dataset.k] = RADAR[el.dataset.k] === el.dataset.v && el.dataset.v ? "" : el.dataset.v; render(true); return true; }
  if (act === "budsec") { budgetSheet(el.dataset.v); return true; }                                 // review #90 B2
  if (act === "warnsheet") { sheet(`<h2>Data checks tonight</h2>${(S.warnings || []).map(w => `<p class="mline">${esc(w)}</p>`).join("")}<div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`); return true; }
  if (act === "buy") { txSheet("buy", sym || ""); return true; }
  if (act === "move") { PENDING = { kind: "move", sym }; txSheet("buy", sym); return true; }
  if (act === "sell") { txSheet("sell", sym); return true; }
  if (act === "edittx") { const t = USER.tx.find(x => x.id === el.dataset.id); if (t) txSheet(t.side, t.sym, t); return true; }
  if (act === "deltx") { const t = USER.tx.find(x => x.id === el.dataset.id); if (!t) return true;
    const rest = USER.tx.filter(x => x.id !== t.id), chk = UL.position(rest.filter(x => x.sym === t.sym));
    if (chk.err) { alert("Can't delete this purchase: a later sale would then sell more than you held. Delete or edit the sale first."); return true; }
    if (confirm(`Delete this ${t.side === "buy" ? "purchase" : "sale"} (${t.qty} ${t.sym} on ${t.date})?`)) { USER.tx = rest; persist(); render(true); if (!USER.tx.some(x => x.sym === t.sym)) go("#/portfolio"); }
    return true; }
  if (act === "backup") { downloadBackup(); return true; }
  if (el.dataset.skinpref) { prefSet(el.dataset.skinpref, el.dataset.v); applySkin(); render(true); return true; }   // review #66
  if (act === "flip") { const c = el.closest(".flipcard"); if (c) { c.classList.toggle("flipped"); const f = c.classList.contains("flipped"); c.querySelector(".ffront").setAttribute("aria-hidden", f); c.querySelector(".fback").setAttribute("aria-hidden", !f); } return true; }   // review #63
  if (act === "quiz") { const q = quizFor(TODAY), o = dlGet(); if (q && !(o.quiz && o.quiz.day === TODAY)) { o.quiz = { day: TODAY, pick: el.dataset.pick }; o.qn = (o.qn || 0) + 1; o.qok = (o.qok || 0) + (el.dataset.pick === q.answer ? 1 : 0); dlPut(o); } render(true); return true; }
  if (act === "deck") { deckDecide(el.dataset.dir); return true; }
  if (act === "scratch") { const o = dlGet(); o.scratch = TODAY; dlPut(o); render(true); return true; }
  if (act === "race" && !document.querySelector("[data-raceyear]")) { const st = BY[parseHash().arg]; if (!st || RACE.loading) return true;   // first tap: load the peers, then play
    RACE.loading = true; el.textContent = "Loading…";
    Promise.all(racePeers(st).map(p => ensureFull(p.symbol))).then(() => { RACE.loading = false; const box = document.getElementById("race"); if (!box) return; box.outerHTML = raceHTML(st);
      const b = document.querySelector('#race [data-act="race"]'); if (b) b.click(); });
    return true; }
  if (act === "race") { const sym = parseHash().arg, st = BY[sym]; if (!st) return true; const yrs = (document.querySelector("[data-raceyear]") || {}).dataset ? document.querySelector("[data-raceyear]").dataset.raceyear.split(",") : [];
    if (RACE.timer) { clearInterval(RACE.timer); RACE.timer = null; } else if (yrs.length) { RACE.timer = setInterval(() => raceStep(st, yrs), MOTION() ? 1300 : 900); raceStep(st, yrs); }
    const b = document.querySelector('[data-act="race"]'); if (b) b.textContent = RACE.timer ? "Pause" : "Play"; return true; }
  if (act === "hmove") { const L = homeLayout(), i = L.order.indexOf(el.dataset.k), j = i + +el.dataset.d; if (i >= 0 && j >= 0 && j < L.order.length) { [L.order[i], L.order[j]] = [L.order[j], L.order[i]]; saveHomeLayout(L); render(true); } return true; }   // review #74
  if (act === "storyhi") { prefSet("screener.story.hi", el.dataset.v === "1" ? "1" : "0"); const y = scrollY; render(true); scrollTo(0, y); return true; }   // #86 D4
  if (act === "setjump") { const g = document.getElementById(el.dataset.id); if (g) g.scrollIntoView({ block: "start" }); return true; }
  if (act === "hreset") { try { localStorage.removeItem(PZ.home); } catch (e) {} render(true); toast("Home layout reset"); return true; }
  if (act === "chartdl") { const fg = el.closest("[data-chart]"); if (fg) chartDlSheet(fg); return true; }   // review #75 C
  if (act === "gmode" || act === "gper") { prefSet(act === "gmode" ? "screener.gmode" : "screener.gper", el.dataset.v); drawResults(); return true; }   // review #75 E
  if (rawAct(act, el)) return true;                                                                                             // review #81 B6 / C5
  if (act === "pfsel") { USER.meta.pfCur = el.dataset.v; persist(); render(true); return true; }                                        // review #79
  if (act === "pfnew") { pfSheet(null); return true; }
  if (act === "pfedit") { pfSheet(el.dataset.v); return true; }
  if (act === "pfundo") { pfUndo(); return true; }
  if (act === "pfgoal") { const p = pfObj(pfCur()); if (pfCur() === PF_FAMILY) USER.meta.famGoal = el.dataset.v; else p.goal = el.dataset.v; persist(); const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "budget") { USER.meta.budget = +el.dataset.v; persist(); const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "goaldel") { USER.goals = (USER.goals || []).filter(g => g.id !== el.dataset.v); persist(); const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "wcountry") { WF.c = el.dataset.v; render(true); return true; }                                                     // review #80
  if (act === "wsec") { WF.sec = el.dataset.v; render(true); return true; }
  if (act === "wview") { WF.view = el.dataset.v; render(true); return true; }
  if (act === "uswatch") { const i = WU.watch.findIndex(w => w.sym === sym); if (i >= 0) WU.watch.splice(i, 1); else { const s = usRow(sym) || USFULL[sym]; WU.watch.push({ sym, px: s && s.close, saved: TODAY }); }
    saveWU(); haptic(); render(true); toast(inUSWatch(sym) ? "Saved to the US watchlist" : "Removed from the US watchlist"); return true; }
  if (act === "wpfsel") { WU.cur = el.dataset.v; saveWU(); render(true); return true; }
  if (act === "wpfnew") { const n = (prompt("Name of the US portfolio", "US portfolio") || "").trim().slice(0, 30); if (!n) return true; const p = { id: "u" + Date.now().toString(36), name: n, market: "US" };
    WU.pfs.push(p); WU.cur = p.id; saveWU(); render(true); return true; }
  if (act === "cur") { prefSet(WCUR_KEY, el.dataset.v); const y = scrollY; render(true); scrollTo(0, y); return true; }                                  // review #78 C
  if (act === "fdsec") { FD.sec = el.dataset.v; render(true); return true; }                                            // review #77 A
  if (act === "mmyears") { mmSave(el.dataset.sym, "base.n", el.dataset.v); const b = document.getElementById("mymodel"); if (b) b.outerHTML = myModelPanel(BY[el.dataset.sym]); return true; }   // #77 B
  if (act === "mmreset") { mmReset(el.dataset.sym); return true; }
  if (act === "fsel") { FS.cur = el.dataset.v; render(true); return true; }                                             // #77 C topic feeds
  if (act === "fnew") { feedSheet(null); return true; }
  if (act === "fedit") { feedSheet(el.dataset.v); return true; }
  if (act === "fdel") { if (!confirm("Delete this feed?")) return true; USER.feeds = (USER.feeds || []).filter(f => f.id !== el.dataset.v); FS.cur = null; persist(); render(true); return true; }
  if (act === "fmove") { const F = USER.feeds || [], i = F.findIndex(f => f.id === el.dataset.v), j = i + +el.dataset.d; if (i >= 0 && j >= 0 && j < F.length) { [F[i], F[j]] = [F[j], F[i]]; persist(); render(true); } return true; }
  if (act === "wcols") { wcolsSheet(); return true; }                                                                   // review #76 C
  if (act === "wsort") { const k = el.dataset.k; WT.dir = WT.sort === k ? -WT.dir : -1; WT.sort = k; const y = scrollY; render(true); scrollTo(0, y); return true; }
  if (act === "wcopy") { const tb = document.querySelector("#wtable table"); if (tb) copyText(tableTSV(tb)).then(ok => { const m = document.getElementById("wcopied"); if (m) m.textContent = ok ? "✓ Copied" : "Couldn't copy"; }); return true; }
  if (act === "stsheet") { prefSet("screener.st.sheet", el.dataset.v); const y = scrollY; render(true); scrollTo(0, y); return true; }   // review #76 A
  if (act === "owner") { prefSet(PZ.owner, OWNER() ? "0" : "1"); render(true); toast(OWNER() ? "Business Owner Mode on – prices hidden" : "Prices shown again"); return true; }   // review #75 A
  if (act === "pzreset") { if (!confirm("Reset every Personalise choice (theme, glow, accent, text size, density, number style, My Home, motion) to the defaults?")) return true;
    PZ_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) {} }); applySkin(); render(true); toast("Personalise reset to defaults"); return true; }
  if (act === "clampmore") { const c = el.parentElement.querySelector(".clamp2"); if (c) { c.classList.toggle("open"); el.textContent = c.classList.contains("open") ? "Less ‹" : "More ›"; } return true; }   // review #72
  if (act === "bksnooze") { USER.meta.backupSnooze = UL.backupSnooze(TODAY, UL.BACKUP_SNOOZE); persist(); render(true); toast("We'll remind you in 7 days"); return true; }   // review #64
  if (act === "bkdone") { USER.meta.backupSnooze = UL.backupSnooze(TODAY, 1); persist(); render(true); return true; }
  if (act === "doimport" && PENDING && PENDING.kind === "import") {
    const sel = document.getElementById("imppf"), into = sel ? sel.value : (pfCur() === PF_FAMILY ? pfList()[0].id : pfCur());     // review #79 A2
    if (el.dataset.mode === "replace") USER.tx = USER.tx.filter(t => !(PENDING.syms.includes(t.sym) && t.pf === into));
    const n = PENDING.rows.length;
    PENDING.rows.forEach(r => USER.tx.push({ id: UL.uid(), sym: r.sym, side: r.side || "buy", qty: r.qty, px: r.px, date: r.date, charges: 0, src: "Zerodha import", pf: into }));
    PENDING = null; persist(); closeSheet(); render(true); toast(`Imported ${FMT.count(n)} row${n === 1 ? "" : "s"}`); return true; }
  if (act === "dorestore" && PENDING && PENDING.kind === "restore") {
    const r = UL.restore(PENDING.text, USER, el.dataset.mode, TODAY);
    if (!r.err) { USER = r.data; persist(); resetCache();
      const wb = (USER.meta || {}).world; if (wb && typeof wb === "object") { WU = Object.assign({ watch: [], pfs: [], tx: [] }, wb); saveWU(); }   // review #80
      const dp = (USER.meta || {}).display; if (dp && typeof dp === "object") { Object.entries(dp).forEach(([k, v]) => { if (DISPLAY_PREFS.includes(k) && typeof v === "string") prefSet(k, v); }); applySkin(); } }
    PENDING = null; closeSheet(); render(true); return true; }
  return false;
}
function submitForm(f) {
  if (f.id === "scrsave") { const r = UL.screenSave(USER, f.nm.value, SEARCH.q, TODAY); if (typeof r === "string") { toast(r); return; } persist(); closeSheet(); toast(`Saved “${r.name}” to My screens`); return; }   // review #70
  if (f.id === "saveform") {
    const sym = f.dataset.sym, note = f.note.value.trim().slice(0, UL.NOTE_MAX), by = (f.by ? f.by.value : "").trim().slice(0, UL.BY_MAX);
    const w = USER.watch.find(x => x.sym === sym);
    if (w) w.note = note; else addWatch(sym, note);
    const ww = USER.watch.find(x => x.sym === sym); if (ww) { if (by) ww.by = by; else delete ww.by; }
    const ticks = [...f.querySelectorAll('input[name="bk"]')];
    ticks.forEach(c => UL.bucketSet(USER, c.value, sym, c.checked));
    if (f.bnew && f.bnew.value.trim()) { const nb = UL.bucketAdd(USER, f.bnew.value); if (typeof nb === "object") UL.bucketSet(USER, nb.id, sym, true); else toast(nb); }
    persist(); closeSheet(); render(true);
    if (!w) toast("Saved to Watchlist", () => { USER.watch = USER.watch.filter(x => x.sym !== sym); persist(); render(true); });
    else toast("Note saved");
    return;
  }
  if (f.id === "alertform") {                                     // review #58: price alert (this browser only)
    const v = Number(f.v.value); if (!(v > 0)) return;
    USER.alerts = (USER.alerts || []).concat([{ id: UL.uid(), sym: f.dataset.sym, kind: f.kind.value, v, seen: null }]);
    persist(); closeSheet(); render(true); toast("Alert added – checked at each night's close"); return;
  }
  if (f.id === "fundform") {                                      // review #50: a fund in the X-ray (this browser only)
    const amt = Number(f.amount.value); if (!(amt > 0)) return;
    const code = f.code ? f.code.value : null, name = code ? (MF.data.funds || {})[code] : (f.name.value || "").trim(); if (!name) return;
    USER.funds = (USER.funds || []).concat([{ code, name, amount: amt }]); persist(); render(true); return;
  }
  if (f.id === "policyform") {                                    // review #50: My Policy, saved in this browser
    USER.policy = Object.assign({}, UL.POLICY_DEFAULT, USER.policy || {}, Object.fromEntries(["split", "maxStock", "maxSector", "planned", "goal"].map(k => [k, f[k].value === "" ? null : Number(f[k].value)])));
    persist(); toast("Policy saved"); go("#/portfolio"); return;
  }
  if (f.id === "txform") {
    const sym = (f.dataset.sym || (f.sym ? f.sym.value : "")).trim().toUpperCase().split(/\s/)[0];
    const t = { id: f.dataset.id || UL.uid(), sym, side: f.dataset.side, qty: Number(f.qty.value), px: Number(f.px.value), date: f.date.value,
                charges: f.charges.value === "" ? 0 : Number(f.charges.value) };
    if (f.jwhy && (f.jwhy.value || f.jsell.value || f.jhold.value)) t.j = { why: f.jwhy.value.trim(), sell: f.jsell.value.trim(), hold: f.jhold.value.trim() };   // review #50
    const err = UL.validateTx(t, USER.tx, TODAY);
    if (err) { f.querySelector(".formerr").textContent = "🟡 " + err; return; }
    haptic();                                              // review #74 (12): add / sell a holding
    if (t.side === "buy" && !f.dataset.id && !f.dataset.warned) {        // review #47: guard-rails – a warning, never a block
      const pv = UL.portfolio(USER.tx, priceOf, PDAY).totals.value || 0;
      const w = UL.buyGuard(USER.tx, sym, t.qty * t.px, pv, priceOf);
      if (w.length) { f.dataset.warned = "1"; f.querySelector(".formerr").textContent = "🟡 Check before adding: " + w.join("; ") + ". Tap Save again to add anyway."; return; }
    }
    const i = USER.tx.findIndex(x => x.id === t.id);
    if (i < 0 && !t.pf) t.pf = pfCur() === PF_FAMILY ? pfList()[0].id : pfCur();                 // review #79 A: into the selected portfolio
    if (i >= 0) USER.tx[i] = Object.assign(USER.tx[i], t); else USER.tx.push(t);
    if (PENDING && PENDING.kind === "move" && PENDING.sym === sym) { removeWatch(sym, true); PENDING = null; }
    persist(); closeSheet(); render(true);
    if (i < 0) toast(`${t.side === "buy" ? "Bought" : "Sold"} ${FMT.count(t.qty)} ${sym}`, () => { USER.tx = USER.tx.filter(x => x.id !== t.id); persist(); render(true); });
    else toast("Changes saved");
  }
}

// ---------- stock view ----------
const enc = sym => "stock-" + sym.replace(/[^A-Za-z0-9]/g, c => "-" + c.charCodeAt(0).toString(16) + "-");
const DEC = Object.fromEntries(S.stocks.map(s => [enc(s.symbol), s.symbol]));

function terms(s) {
  return [
    ["Price (last close)", inr(s.close), "The price at which the stock last traded when the market closed at 3:30 PM.", "Close ₹1,250 means one share cost ₹1,250 at the end of that day."],
    ["50-day average", s.os ? osWarn(s) : inr(s.dma50), "The average closing price over the last 50 trading days (about 2½ months).", "If a stock closed at ₹100 for 25 days and ₹110 for 25 days, its 50-day average is ₹105."],
    ["200-day average", s.os ? osWarn(s) : inr(s.dma200), "The average closing price over the last 200 trading days (about 10 months). Price above it usually means the long-term trend is up.", "Price ₹550 with a 200-day average of ₹500 is 10% above it: a long-term uptrend."],
    ["RSI (14 days)", s.os ? osWarn(s) : FMT.num(s.rsi14, 0), "A 0–100 score of how fast the price moved over the last 14 trading days. Above 70 = rose very fast; below 30 = fell very fast.", "A stock that went from ₹100 to ₹130 in two weeks with few down days might have an RSI near 80."],
    ["1-year high", s.os ? osWarn(s) : inr(s.high52), "The highest price the stock reached in the last 52 weeks.", "1-year high ₹1,000 and price ₹900 means the stock is 10% below its 1-year high."],
    ["Distance from 1-year high", s.os ? osWarn(s) : pct(s.pct_from_high52), "How far today's price is below the 1-year high. Within 10% is strong; more than 30% below is weak.", "High ₹200, price ₹130: 35% below the high, which counts as weak."],
    ["1-year low", s.os ? osWarn(s) : inr(s.low52), "The lowest price in the last 52 weeks.", "1-year low ₹400 and price ₹480 means the stock is 20% above its low."],
    ["Shares traded (last day)", shares(s.volume), "How many shares changed hands in the last trading day.", "If 2 lakh shares traded at ₹500 each, about ₹10 crore of the stock was bought and sold."],
    ["20-day average volume", shares(s.avg_vol20), "The usual number of shares traded per day over the last 20 days. Today vs this shows if trading was busy or quiet.", "Usually 2 lakh a day, today 6 lakh: trading was 3× busier than normal."],
  ];
}

// ---------- business health (Stage 2) ----------
// [key, name, unit, what it means, rupee example]
const FUND_TERMS = [
  ["roce", "ROCE (return on capital employed)", "%", "Operating profit (EBIT) as a % of all the money in the business: shareholders' money plus loans. Above 15% is good.", "₹1,000 crore of capital and ₹200 crore of operating profit = ROCE 20%."],
  ["roce_avg", "ROCE, average of recent years", "%", "The same, averaged over the years we have (up to 5), so one lucky year doesn't fool you.", "ROCE of 18%, 20% and 22% over three years averages 20%."],
  ["roe", "ROE (return on equity)", "%", "Profit after tax as a % of shareholders' money. Above 15% is good.", "₹500 crore of shareholders' money and ₹90 crore profit = ROE 18%."],
  ["roe_avg", "ROE, average of recent years", "%", "ROE averaged over the years we have (up to 5).", "ROE of 12%, 15% and 18% averages 15%."],
  ["roa", "ROA (return on assets)", "%", "Profit as a % of everything the company owns. Key for banks: above 1% is good.", "A bank with ₹10,000 crore of loans and assets earning ₹120 crore = ROA 1.2%."],
  ["de", "Debt to equity", "×", "Borrowed money divided by shareholders' money. Below 0.5 is comfortable, above 1 is risky (non-financial companies).", "₹200 crore of loans and ₹800 crore of shareholders' money = 0.25."],
  ["icr", "Interest coverage", "×", "How many times operating profit covers the interest bill. Above 5 is comfortable, below 3 is risky.", "₹100 crore operating profit and ₹10 crore interest = 10×."],
  ["cfo_pat", "Cash conversion (CFO ÷ profit)", "×", "Cash from operations divided by reported profit over recent years. Above 0.8 is good; below 0.5 is a red flag.", "₹100 crore profit but only ₹40 crore cash came in = 0.4."],
  ["op_margin", "Operating margin", "%", "Operating profit as a % of sales.", "₹1,000 crore of sales and ₹150 crore operating profit = 15% margin."],
  ["debtor_days", "Debtor days", "days", "How many days customers take to pay, on average. Lower is better.", "Yearly sales ₹365 crore and ₹60 crore still to collect = 60 days."],
  ["inventory_days", "Inventory days", "days", "How many days of stock the company holds. Lower usually means less cash locked up.", "Yearly cost of goods ₹365 crore and ₹90 crore of stock = 90 days."],
  ["payable_days", "Payable days", "days", "How many days the company takes to pay its suppliers.", "Yearly cost of goods ₹365 crore and ₹45 crore owed to suppliers = 45 days."],
  ["sales_cagr", "Sales growth per year", "%", "Average yearly growth of sales over the years we have (CAGR).", "₹100 crore of sales growing 10% a year becomes ₹133 crore in 3 years."],
  ["eps_cagr", "EPS growth per year", "%", "Average yearly growth of earnings per share.", "EPS of ₹20 growing 15% a year becomes about ₹30 in 3 years."],
  ["pe", "PE (price to earnings)", "×", "Share price divided by the last 12 months' earnings per share: how many rupees you pay for ₹1 of yearly profit.", "Price ₹500 and EPS ₹25 = PE 20."],
  ["peg", "PEG", "×", "PE divided by EPS growth (%). Below 1 = cheap for its growth; above 2 = expensive.", "PE 20 with 20% EPS growth = PEG 1."],
  ["pb", "P/B (price to book)", "×", "Market value divided by the company's net worth (book value). The main yardstick for banks.", "Market value ₹3,000 crore and net worth ₹1,000 crore = P/B 3."],
  ["ev_ebitda", "EV / EBITDA", "×", "The whole business's value (shares + debt − cash) divided by operating cash profit. Used for cyclical and capital-heavy businesses.", "EV ₹1,200 crore and EBITDA ₹100 crore = 12×."],
  ["earnings_yield", "Earnings yield", "%", "Operating profit as a % of the whole business's value. Higher = cheaper.", "EBIT ₹80 crore on an EV of ₹1,000 crore = 8%."],
  ["mcap_cr", "Market cap", "₹ cr", "Share price × number of shares: what the whole company is worth on the market.", "10 crore shares at ₹500 = ₹5,000 crore."],
  ["mscore", "Beneish M-score", "", "A formula that spots accounts resembling past earnings-manipulation cases. Above −1.78 = 🟡 check the annual report; it is a hint, not proof, and not yet validated on Indian companies.", "−2.5 is normal; −1.2 deserves a careful read of the notes on receivables and cash flow."],
  ["zscore", "Altman Z-score", "", "A formula for financial stress, never used for banks, NBFCs or insurers. Manufacturers use the original Z (below 1.81 = distress, above 2.99 = safe); IT, services, retail and other non-manufacturers use Z'' (below 1.10 = distress, above 2.60 = safe).", "A manufacturer with a Z of 1.5 has thin cushions against a bad year."],
  ["accruals", "Accruals", "%", "(Profit − operating cash flow) as a % of total assets. Above 10% means profit is far ahead of cash.", "₹100 crore profit, ₹40 crore cash, ₹500 crore assets = 12%."],
  ["traded_value_cr", "Daily traded value", "₹ cr", "The median value of shares traded per day over the last year. Below ₹5 crore is hard to trade.", "2 lakh shares a day at ₹500 = ₹10 crore a day."],
  ["promoter_holding", "Promoter holding", "%", "The share of the company owned by its founders/controlling group (NSE data).", "Promoters own 60 of every 100 shares = 60%."],
  ["pledge", "Promoter pledge", "%", "How much of the promoters' own shares are pledged as security for loans. 0% is ideal, above 25% is a red flag.", "Promoters own 1 crore shares and pledged 30 lakh = 30%."],
];

function fmtVal(v, unit) {
  if (v == null) return "–";
  if (unit === "₹ cr") return FMT.cr(v, 0);
  if (unit === "%") return FMT.pctPlain(v, 1);
  if (unit === "×") return FMT.times(v, 2);
  if (unit === "days") return Math.round(v) + " days";
  return String(v);
}

// Three benchmark levels per metric (pipeline/benchmarks.py): sector rule · close peers (25th–75th pct) · own history
const BM_NAME = { roce: "ROCE", roe: "ROE", roa: "ROA", de: "Debt/equity", icr: "Interest cover", cfo_pat: "Cash/profit",
  op_margin: "Op. margin", debtor_days: "Debtor days", sales_cagr: "Sales growth", eps_cagr: "EPS growth", pe: "P/E", pb: "P/B", ev_ebitda: "EV/EBITDA" };
const BM_UNIT = { roce: "%", roe: "%", roa: "%", op_margin: "%", sales_cagr: "%", eps_cagr: "%", de: "×", icr: "×", cfo_pat: "×", pe: "×", pb: "×", ev_ebitda: "×", debtor_days: " d" };
const BM_DOT = { g: "🟢", y: "🟡", r: "🔴" };
const BM_LV = { sector: "Sector rule", peer: "Close peers", own: "Own history" };
function benchPanel(f) {
  const b = f.bench;
  if (!b) return "";
  const n = x => x == null ? "–" : FMT.num(x, Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2);
  const line = (lv, on, light, html) => `<div class="bmrow${on ? " on" : ""}"><span class="bml">${BM_LV[lv]}${on ? " ✔" : ""}</span><span>${light ? BM_DOT[light] + " " : ""}${html}</span></div>`;
  const cards = Object.entries(b.m).map(([k, m]) => {
    const u = BM_UNIT[k] || "";
    const p = m.p, o = m.o;
    const sc = m.s ? esc(m.s[0]) + (m.s[1] ? ` <span class="sub">${esc(m.s[1])}</span>` : "") : "no rule";
    const pc = p ? (p[5] != null ? `middle half ${n(p[5])}–${n(p[6])}${u} after adjusting <span class="sub">(raw ${n(p[0])}–${n(p[1])}${u}; ${esc(p[7])})</span>` : `middle half ${n(p[0])}–${n(p[1])}${u}`)
      + ` <span class="sub">· ${esc(p[3])}, ${p[2]} stocks</span>` : "fewer than 6 peers with this number";
    const oc = o ? `middle half ${n(o[0])}–${n(o[1])}${u} <span class="sub">· ${esc(o[2])}</span>` : "not enough history yet";
    const dl = m.d ? (m[m.d === "sector" ? "s" : m.d === "peer" ? "p" : "o"] || [])[m.d === "sector" ? 2 : m.d === "peer" ? 4 : 3] : null;
    return `<div class="bm"><div class="bmh"><b>${BM_NAME[k] || k}</b><span class="num">${dl ? BM_DOT[dl] + " " : ""}${n(m.v)}${u}</span></div>
      ${m.rf ? `<div class="sub">Reference only – not this sector's yardstick.</div>` : ""}
      ${line("sector", m.d === "sector", m.s && m.s[2], sc)}${line("peer", m.d === "peer", p && p[4], pc)}${line("own", m.d === "own", o && o[3], oc)}
      ${m.d && m.d !== m.pf ? `<div class="sub">${BM_LV[m.pf]} not available, so ${BM_LV[m.d].toLowerCase()} decided.</div>` : ""}</div>`;
  }).join("");
  return `<h3 class="minor">Benchmarks: three levels</h3>
    <p class="mini" style="margin:0 0 4px"><b>${esc(b.d)}</b><br>What matters most here: ${esc(b.fo)}.</p>
    ${cards}
    <p class="sub">✔ = the level that decided the colour. Sector rules come from the sector playbooks (PROXY = our rule of thumb, REG = regulator). Close peers = the 25th–75th percentile ("middle half") of the finest peer group with 6+ stocks; for P/E the band is adjusted for growth (peers' PEG × this stock's fair P/E = its growth, capped at 25), for lenders', insurers' and utilities' P/B for ROE. Band colours (🟢 better than 3 in 4, 🔴 worse than 3 in 4) are our own rule: PROXY. Own history is partial until Stage 6 (10 years).</p>`;
}

// review #51: where the key figures come from, with the automatic three-way check's badge (NSE XBRL · Yahoo · annual report)
const SRC_BADGE = { agree: ["✅", "2–3 sources agree (±1%)"], one: ["🟡", "only one source"], disagree: ["🔴", "sources disagree – using the NSE filing"] };
const SRC_FIELD = { revenue: "Revenue", pat: "Profit (owners)", net_worth: "Net worth", debt: "Borrowings", cfo: "Operating cash flow" };
function srcPanel(s) {
  if (!s.src) return "";
  return `<details class="panel srcpanel"><summary>Where these numbers come from</summary><div class="mrows">${Object.entries(s.src).map(([f, [b, d, prov]]) => {
    const B = SRC_BADGE[b] || ["", ""];
    return `<div class="mrow"><span class="ml"><span>${esc(SRC_FIELD[f] || f)}</span><span class="t-label sub">${esc(prov)}</span></span><span class="mr"><span class="t-label">${B[0]} ${esc(B[1])}${b === "disagree" && d != null ? ` (${FMT.pctPlain(d, 1)} apart)` : ""}</span></span></div>`; }).join("")}</div>
    <p class="t-label sub">Checked every night: the company's own NSE filing, Yahoo's copy and, for a few stocks, the annual report. When they disagree the NSE filing is used.</p></details>`;
}
function healthPanel(s) {
  const f = s.fund;
  if (!f) return `<section class="panel"><h2>Business health</h2><p class="sub">No financial statements are available for this stock yet.${s.ow ? " Statements for the wider list arrive in a weekly rotation – check again in a few days." : ""}</p></section>`;
  const hwLine = s.hw ? `<p class="mini">Also vs all ${FMT.count(S.stocks.length)} stocks${s.hw.pl ? ` (${esc(s.hw.pl)})` : ""}: health <b>${s.hw.sc}/100</b>. The score above (vs Nifty 500 peers) is the one the Core score uses.</p>` : "";
  const li = g => `<li class="light-${g.light}"><span aria-label="${g.light}">${DOT[g.light]}</span><span>${esc(g.text)}</span><span class="why">${esc(g.why)}</span></li>`;
  const sl = scoreLight(f.score);
  const head = f.score == null ? "" :
    `<p class="score">${DOT[sl]} <b class="num">${f.score}/100</b> – ${sl === "green" ? "healthier than most" : sl === "yellow" ? "about average among" : "weaker than most"} ${esc(f.peer_label)}</p>`;
  const flags = f.flags.length ? f.flags.map(li).join("") :
    `<li class="light-green"><span aria-label="green">🟢</span><span>No warning signs found in the checks we can run</span><span class="why">Checked: ${s.fund.group.match(/bank|nbfc|insurance|fin_other/) ? "liquidity, promoter pledge, credit-rating downgrades, NSE surveillance" : "earnings-manipulation score, financial-stress score, accruals, cash conversion, liquidity, promoter pledge, credit-rating downgrades, NSE surveillance"}.</span></li>`;
  const hidden = new Set(f.hidden);
  const rows = FUND_TERMS.filter(([k]) => !hidden.has(k)).map(([k, name, unit, what, ex]) => {
    const v = k in f.metrics ? f.metrics[k] : f.quality[k];
    const p = f.pct[k];
    return `<div class="term"><div class="k"><span>${name}</span><span class="num">${fmtVal(v, unit)}</span></div>
      <span>${what}${p != null ? ` <b>Better than ${p}% of ${esc(f.peer_label)}.</b>` : ""}</span><span class="ex">Example: ${ex}</span></div>`;
  }).join("");
  const yrs = Object.keys(f.history.revenue_cr || {});
  const histT = yrs.length ? `<div class="tablewrap"><table class="hist num"><thead><tr><th>Year ending March</th>${yrs.map(y => `<th>${y}</th>`).join("")}</tr></thead><tbody>
      <tr><td>${f.group.match(/bank|nbfc|insurance/) ? "Total income" : "Sales"} (₹ cr)</td>${yrs.map(y => `<td class="num">${FMT.num(f.history.revenue_cr[y], 0)}</td>`).join("")}</tr>
      <tr><td>Profit (₹ cr)</td>${yrs.map(y => `<td class="num">${FMT.num(f.history.pat_cr[y], 0)}</td>`).join("")}</tr>
      ${hidden.has("roce") ? "" : `<tr><td>ROCE</td>${yrs.map(y => `<td class="num">${FMT.pctPlain(f.history.roce[y], 1)}</td>`).join("")}</tr>`}
      <tr><td>ROE</td>${yrs.map(y => `<td class="num">${FMT.pctPlain(f.history.roe[y], 1)}</td>`).join("")}</tr>
    </tbody></table></div>` : "";
  const hiddenNames = FUND_TERMS.filter(([k]) => hidden.has(k)).map(x => x[1].split(" (")[0]);
  const b = f.basis || {};
  return `<section class="panel"><h2>Business health</h2>
    ${head}${hwLine}
    <ul class="siglist">${f.lines.map(li).join("")}${f.valuation && !OWNER() ? li(f.valuation) : ""}</ul>
    <h3 class="minor">Warning signs</h3>
    <ul class="siglist">${flags}</ul>
    ${f.note ? `<p class="sub">ℹ️ ${esc(f.note)}</p>` : ""}
    <details><summary>Show more: all the business numbers, explained</summary>
      ${benchPanel(f)}
      ${histT}
      <div class="terms">${rows}</div>
      ${hiddenNames.length ? `<p class="sub">Not shown for ${esc(f.peer_label)} because they mislead for this kind of business: ${hiddenNames.join(", ")}.</p>` : ""}
      ${f.missing.length ? `<p class="sub">Missing: ${f.missing.map(esc).join("; ")}.</p>` : ""}
      ${Object.keys(f.depth || {}).length ? `<p class="sub">Checks running on shorter history than they need: ${Object.entries(f.depth).map(([k, st]) => `${esc((S.depth_registry[k] || {}).name || k)} – ${esc(st)}`).join("; ")}.</p>` : ""}
      <p class="sub">Sources: latest-year profit, net worth, borrowings and cash flow ${b.official_latest_year && b.official_latest_year.length ? "from the company's official audited filing on NSE" : "from Yahoo Finance (unofficial; no official filing matched)"}; earlier years and other lines from Yahoo Finance (unofficial${b.currency_converted ? ", converted from US dollars" : ""}; ${b.annual_years ?? 0} years of annual results; last-12-months figures from ${esc(b.ttm || "–")}). Pledge and surveillance: NSE. Always confirm important numbers in the company's annual report.</p>
    </details>${frLine(s, "f")}
  </section>`;
}


// ---------- Stage 3: investor view ----------
const ST_LABEL = { pass: "✅ Pass", fail: "❌ Fail", judge: "🤔 Needs your judgement", none: "– Not checked" };
function stLabel(c) {
  if (c.s !== "partial") return ST_LABEL[c.s];
  const yrs = c.y ? ` (${c.y[0]} yr${c.y[0] === 1 ? "" : "s"})` : "";
  return `◐ Partial${yrs}`;
}
const tagBadge = t => t === "S" ? `<span class="badge stated" title="The investor or author published this number">STATED</span>` :
  `<span class="badge" title="Our numeric translation of the investor's idea">PROXY</span>`;
const IMP = { green: "🟢", neutral: "⚪", yellow: "🟡", red: "🔴" };

function lensScore(l) {
  if (l.f != null) return `F-score <b>${l.f}</b>/9`;
  if (!l.c) return `${l.ct.judge} judgement`;
  return `<b>${l.p}</b> of ${l.c} pass`;
}

function checkHTML(c) {
  const lean = c.s === "partial" && c.l ? ` <span class="cw">– ${c.l === "pass" ? "passes" : "fails"} on the ${c.y ? c.y[0] + " years" : "years"} we have; the rule wants ${c.y ? c.y[1] : "more"}</span>` : "";
  const q = c.q ? `<ul>${c.q.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  return `<div class="chk">
    <div class="top"><span class="cn">${esc(c.n)}</span><span class="st st-${c.s}">${stLabel(c)}</span></div>
    ${c.v ? `<span class="cv num">${esc(c.v)}${lean}</span>` : lean ? `<span class="cv">${lean}</span>` : ""}
    ${c.w ? `<span class="cw">${esc(c.w)}</span>` : ""}
    ${q}
    <span class="cr">Rule: ${esc(c.r)} ${tagBadge(c.t)}${c.yr ? ` · compares ${esc(c.yr)}` : ""}</span>
  </div>`;
}

// ---------- review #58 C/D: best-fit investor styles (★) – rules from pipeline/styles.py, no AI ----------
const LENS_SHORT = { graham: "Graham", buffett: "Buffett", munger: "Munger", lynch: "Lynch", fisher: "Fisher", greenblatt: "Greenblatt",
  kedia: "Kedia", qglp: "QGLP", coffeecan: "Coffee Can", piotroski: "Piotroski" };
const STYLE_LABEL = { moat: "steady moat business", fast: "fast grower", cyclical: "cyclical", asset: "asset-cheap", lender: "bank / lender / insurer",
  turnaround: "turnaround", rate: "rate / currency sensitive" };
const STAR_LEGEND = "★ = this style was built for this type of business. It is not a buy signal.";
const fitStar = () => `<span class="fitstar" role="img" aria-label="best fit for this type of business">${ic("star-fill")}</span>`;
function styleLine(s) {
  const y = s.sty; if (!y || !y.f || !y.f.length) return "";
  return `<p class="mini styl">Best-fit styles: ${y.f.map(k => `${fitStar()} ${esc(LENS_SHORT[k] || k)}-style`).join(" · ")} – why: ${esc(y.why)}. <span class="sub">Matches the principles of these approaches; not a buy signal.</span></p>`;
}
function investorPanel(s) {
  const x = s.s3;
  if (!x || !x.lenses.length) return `<section class="panel"><h2>Investor view</h2><p class="sub">Not available yet: this stock has no financial statements in our data.</p></section>`;
  const by = { green: [], yellow: [], red: [], none: [] }, capped = {};
  x.lenses.forEach(l => { const nm = l.n.split(" (")[0]; if (l.cl) (capped[l.cl] = capped[l.cl] || []).push(nm); else by[l.li || "none"].push(nm); });
  const FIT = new Set((s.sty && s.sty.f) || []);
  const fitNames = x.lenses.filter(l => FIT.has(l.k)).map(l => l.n.split(" (")[0]);
  const head = [
    fitNames.length ? `${fitStar()} <b>Built for this type of business:</b> ${fitNames.map(esc).join(", ")} – ${esc(s.sty.why)}` : "",
    s.lens_sum && !OWNER() ? `🧭 <b>${esc(s.lens_sum)}</b>` : "",   /* review #75 A: it quotes the fair value */
    by.green.length ? `🟢 <b>Would like it:</b> ${by.green.map(esc).join(", ")}` : "",
    ...Object.entries(capped).map(([lab, names]) => `🟡 <b>${esc(lab)}:</b> ${names.map(esc).join(", ")}`),
    by.yellow.length ? `🟡 <b>Mixed:</b> ${by.yellow.map(esc).join(", ")}` : "",
    by.red.length ? `🔴 <b>Would probably pass:</b> ${by.red.map(esc).join(", ")}` : "",
    by.none.length ? `⚪ <b>Mostly judgement:</b> ${by.none.map(esc).join(", ")}` : "",
  ].filter(Boolean).map(t => `<p style="margin:0">${t}</p>`).join("");
  const partials = x.lenses.reduce((a, l) => a + l.ct.partial, 0);
  const ordered = [...x.lenses.filter(l => FIT.has(l.k)), ...x.lenses.filter(l => !FIT.has(l.k))];      // best-fit lenses first
  const lensRows = ordered.map(l => `<details class="lens${FIT.has(l.k) ? " fit" : ""}">
      <summary><span aria-label="${l.li || "judgement"}">${l.li ? DOT[l.li] : "⚪"}</span><span class="ln">${esc(l.n)}${FIT.has(l.k) ? " " + fitStar() : ""}</span><span class="sc">${lensScore(l)}</span>
        <span class="ls">${l.cl ? `<b>${esc(l.cl)}</b> · ` : ""}${esc(l.st)}${l.ct.partial ? ` · ${l.ct.partial} partial` : ""}${l.ct.judge ? ` · ${l.ct.judge} need you` : ""} · tap for details</span></summary>
      <div class="lensbody"><p style="margin:0"><b>${esc(l.vd)}</b> ${esc(l.sp)}</p>${l.ch.map(checkHTML).join("")}</div>
    </details>`).join("");
  return `<section class="panel"><h2>Investor view${EXP()}</h2>
    <p class="sub" style="margin:0 0 8px">How 10 famous investors' checklists would judge this stock. These describe how each investor thinks – not their opinion of this company. They disagree by design (Graham wants cheap, Fisher pays up for growth).</p>
    <div style="display:grid;gap:4px;margin-bottom:10px">${head}</div>
    ${lensRows}
    ${FIT.size ? `<p class="t-label sub starleg">${fitStar()} ${esc(STAR_LEGEND.slice(2))}</p>` : ""}
    <details><summary>Show more: what the labels mean</summary>
      <div class="legendbox">
        <span><span class="st st-pass">✅ Pass</span> / <span class="st st-fail">❌ Fail</span> – the rule was checked on enough years of data.</span>
        <span><span class="st st-partial">◐ Partial (4 yrs)</span> – the rule needs more years (often 10) than the free data has (usually 4–5), so we show how it looks on the years we have. ${partials ? `${partials} checks on this page are partial.` : ""}</span>
        <span><span class="st st-judge">🤔 Needs your judgement</span> – qualities like a moat or honest management can't be measured from numbers; guiding questions are listed.</span>
        <span>🟡 <b>Great business – price not yet checked / looks expensive</b>: Graham, Buffett, Munger, Lynch and QGLP all have a price rule. These lenses show 🟢 only when their own price test passes <b>and</b> the price is no more than 15% above the consensus fair value (see "Fair value"). Without a fair value they stay 🟡 "price not yet checked".</span>
        <span><span class="st st-none">– Not checked</span> – the data isn't available, or the rule doesn't apply to this kind of business (for example, banks skip current ratio and debt-to-equity).</span>
        <span>${tagBadge("S")} the investor or author published this number. ${tagBadge("P")} our own numeric translation of a qualitative idea – compare with peers before trusting it.</span>
      </div>
    </details>
  </section>`;
}

// ---------- Stage 3: ownership & management ----------
// review #59: per-stock freshness – "Ownership checked 3 days ago · next by 21 Nov" (from the nightly's refresh clocks)
function frLine(s, k) {
  const f = s.fr && s.fr[k]; if (!f) return "";
  const days = Math.max(0, Math.round((Date.parse(S.trade_date || f[0]) - Date.parse(f[0])) / 864e5));
  return `<p class="mini sub frl">${k === "o" ? "Ownership" : "Financial statements"} checked ${days === 0 ? "today" : days === 1 ? "1 day ago" : days + " days ago"} · next by ${esc(dateTxt(f[1]))}</p>`;
}
function ownershipPanel(s) {
  const x = s.s3;
  if (!x) return "";
  const o = x.own, m = x.mgmt, lines = [];
  const li = (light, text, why) => lines.push(`<li class="light-${light}"><span aria-label="${light}">${DOT[light]}</span><span>${esc(text)}</span><span class="why">${esc(why)}</span></li>`);
  const pq = o.promoter.quarters || [];
  if (pq.length) {
    const last = pq[pq.length - 1], c4 = o.promoter.chg_4q, drops = o.promoter.drops || [];
    const recentDrop = (x.own_flags || []).find(f => f.key === "promoter_drop");
    li(recentDrop ? "red" : (c4 != null && c4 < -1 ? "yellow" : "green"),
      `Promoters own ${FMT.pctPlain(last.p, 2)} of the company` + (c4 != null ? ` (${FMT.points(c4, 2)} points in a year)` : ""),
      recentDrop ? recentDrop.why : (drops.length ? `Earlier, the stake fell more than 2 points in a quarter (${drops.map(d => d.q).join(", ")}).` :
        `Of every 100 shares, promoters held ${FMT.num(last.p, 2)} at the end of ${dateTxt(last.q)}. No quarter showed a drop of more than 2 points in the ${pq.length} quarters on record.`));
  } else li("yellow", "Promoter holding not available", o.fetched ? "NSE has no shareholding pattern on record for this stock." : "The NSE shareholding feed could not be read for this stock.");
  const pl = o.pledge.quarters || [];
  if (pl.length) {
    const last = pl[pl.length - 1];
    const rising = o.pledge.rising_quarters;
    li(last.p > 25 || rising >= 3 ? "red" : last.p > 0 ? "yellow" : "green",
      last.p > 0 ? `${FMT.pctPlain(last.p, 1)} of promoter shares are pledged` : "No promoter shares pledged",
      last.p > 0 ? `Pledged shares can be sold by lenders if the price falls. ${rising >= 3 ? `The pledge rose in each of the last ${rising} quarters – a red flag.` : pl.length > 1 ? `Rising quarters in a row: ${rising}.` : "Earlier quarters not on record."} 0% is ideal; above 25% is a red flag.`
        : `As of ${dateTxt(last.q)}. Pledging means borrowing against shares; none here.`);
  }
  const ins = o.insider;
  if (o.pit_fetched) {
    const net = ins.net12_cr;
    li(ins.prom_sell12_cr > 50 ? "yellow" : net > 0 ? "green" : "green",
      ins.market12 ? `Insiders ${net >= 0 ? "bought" : "sold"} a net ${FMT.cr(Math.abs(net), 2).replace(" cr", " crore")} in the market in 12 months` : "No insider buying or selling in the market in 12 months",
      ins.market12 ? `Bought ₹${ins.buy12_cr} cr, sold ₹${ins.sell12_cr} cr (promoters: bought ₹${ins.prom_buy12_cr} cr, sold ₹${ins.prom_sell12_cr} cr). Promoters, directors and staff must disclose their trades to NSE.`
        : "Promoters, directors and staff must report their trades to NSE; none were market trades in the last year.");
  }
  if (o.deals_fetched) li("green", o.deals_count ? `${o.deals_count} bulk/block deal${o.deals_count > 1 ? "s" : ""} in 12 months` : "No bulk or block deals in 12 months",
    "A bulk deal is a trade of more than 0.5% of the company's shares in a day; a block deal is a single large trade of at least ₹10 crore. They show who is entering or leaving.");
  const auds = m.auditor_events_3y || [];
  if (m.announcements_fetched) {
    const res = auds.filter(a => a.kind === "resigned"), unc = auds.filter(a => a.kind === "unclear");
    li(res.length ? "red" : unc.length ? "yellow" : "green",
      res.length ? "An auditor resigned in the last 3 years" : unc.length ? "Auditor changed in the last 3 years (reason not stated)" : auds.length ? "Auditor changes in 3 years were routine" : "No auditor change in 3 years",
      res.length ? "Auditors quitting before their term ends can signal a disagreement over the accounts." :
        unc.length ? `Filed on ${unc.map(a => dateTxt(a.date)).join(", ")}. NSE's summary doesn't say if it was a resignation – open the filing in the timeline below.` :
        "The auditor checks the accounts for shareholders; a stable auditor is a good sign.");
    li(m.cfo_changes_3y >= 2 ? "red" : m.cfo_changes_3y === 1 ? "yellow" : "green",
      m.cfo_changes_3y ? `Finance chief (CFO) changed ${m.cfo_changes_3y} time${m.cfo_changes_3y > 1 ? "s" : ""} in 3 years` : "No CFO change found in 3 years",
      (m.cfo_changes_3y >= 2 ? "Two or more CFO changes in 3 years is a red flag. " : "") + (m.kmp_role_unknown ? `${m.kmp_role_unknown} director/KMP filing${m.kmp_role_unknown > 1 ? "s" : ""} didn't state the role in NSE's summary, so a CFO change could be missed.` : "Roles were readable for all director/KMP filings."));
  } else li("yellow", "Announcements not checked", "NSE announcements could not be read for this stock this week.");
  const rd = (x.mgmt.flags || []).find(f => f.key === "rating_down");
  li(rd ? "yellow" : "green", rd ? rd.text : "No confirmed credit-rating downgrade in 12 months", rd ? rd.why : "From companies' rating disclosures to NSE.");
  if (m.sebi_searched) {
    const sb = m.sebi || [], red = sb.filter(h => h.light === "red"), yel = sb.filter(h => h.light === "yellow");
    li(red.length ? "red" : yel.length ? "yellow" : "green",
      red.length ? `SEBI order${red.length > 1 ? "s" : ""} with the company as subject (10 years)` : yel.length ? "A SEBI order title mentions the company or a promoter's name" : sb.length ? "Only routine SEBI orders (exemptions/approvals) found" : "No SEBI order titles mention the company or its promoters",
      red.length ? `${red[0].title} (${red[0].status}). An allegation is not guilt – read the order.` :
        yel.length ? `${yel[0].title} — ${yel[0].identity}.` :
        "Searched SEBI's enforcement orders by company and promoter names. Orders that name someone only inside the document can't be found this way – this is not a guarantee.");
  }
  const verdictLight = { Clean: "green", Watch: "yellow", Concern: "red" }[m.verdict];
  const qt = pq.length ? `<div class="tablewrap"><table class="hist num"><thead><tr><th>Quarter end</th>${pq.slice(-8).map(q => `<th>${q.q.slice(2, 7)}</th>`).join("")}</tr></thead><tbody>
      <tr><td>Promoter holding</td>${pq.slice(-8).map(q => `<td class="num">${FMT.pctPlain(q.p, 2)}</td>`).join("")}</tr></tbody></table></div>` : "";
  const plt = pl.length > 1 ? `<div class="tablewrap"><table class="hist num"><thead><tr><th>Quarter end</th>${pl.map(q => `<th>${q.q.slice(2, 7)}</th>`).join("")}</tr></thead><tbody>
      <tr><td>Pledged (% of promoter shares)</td>${pl.map(q => `<td class="num">${FMT.pctPlain(q.p, 1)}</td>`).join("")}</tr></tbody></table></div>` : "";
  const tr = o.trades.length ? `<h3 class="minor">Insider trades (latest ${o.trades.length})</h3><div class="tablewrap"><table class="hist num"><thead><tr><th>Date</th><th>Who</th><th>Type</th><th>₹ cr</th></tr></thead><tbody>
      ${o.trades.map(t => `<tr><td>${t.date ? dateTxt(t.date) : "–"}</td><td class="l">${esc(t.who)}<br><span class="sub">${esc(t.cat || "")}</span></td><td class="l">${esc(t.txn || "")} · ${esc(t.mode || "")}</td><td>${t.value_cr}</td></tr>`).join("")}</tbody></table></div>` : "";
  const dl = o.deals.length ? `<h3 class="minor">Bulk and block deals (12 months)</h3><div class="tablewrap"><table class="hist num"><thead><tr><th>Date</th><th>Who</th><th>Side</th><th>Shares</th><th>Price</th></tr></thead><tbody>
      ${o.deals.map(d => `<tr><td>${dateTxt(d.date)}</td><td class="l">${esc(d.who)} <span class="sub">(${d.kind})</span></td><td>${esc(d.side)}</td><td>${shares(d.qty)}</td><td>${inr(d.price)}</td></tr>`).join("")}</tbody></table></div>` : "";
  const sb = (m.sebi || []).length ? `<h3 class="minor">SEBI orders found</h3><ul class="siglist">${m.sebi.map(h => `<li class="light-${h.light === "neutral" ? "green" : h.light}"><span>${IMP[h.light] || "⚪"}</span><span><a href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.title)}</a></span><span class="why">${h.date ? dateTxt(h.date) : ""} · Status: <b>${esc(h.status)}</b> · ${esc(h.nature)} · Identity: ${esc(h.identity)} · searched as ${esc(h.who)} “${esc(h.name)}”</span></li>`).join("")}</ul>` : "";
  const src = S.stage3 && S.stage3.sources ? `<h3 class="minor">Sources checked this week</h3><ul class="mini" style="margin:0;padding-left:18px">
      ${S.stage3.sources.map(x => `<li>${x.ok ? "✅" : "⚠️"} ${esc(x.name)} – ${esc(x.gives)}${x.ok ? "" : ` (<b>not reachable</b>: ${esc(x.note)})`}</li>`).join("")}
      ${(S.stage3.not_reachable || []).map(x => `<li>⛔ ${esc(x.name)} – ${esc(x.why)}</li>`).join("")}</ul>` : "";
  return `<section class="panel"><h2>Ownership &amp; management</h2>
    <p class="score">${DOT[verdictLight]} <b>${m.verdict}</b> – ${esc(m.summary)}</p>
    <ul class="siglist">${lines.join("")}</ul>
    <details><summary>Show more: quarter-by-quarter numbers, trades, deals and sources</summary>
      ${qt}${plt}${tr}${dl}${sb}${src}
      <p class="sub">Automatic checks only (management-due-diligence, automatic part). Still worth reading yourself: the annual report's related-party note and auditor's report, and directors' past companies on MCA. Educational research, not a SEBI-registered analyst's opinion.</p>
    </details>
  ${frLine(s, "o")}</section>`;
}

// ---------- Stage 3: decisions timeline ----------
const rx = v => FMT.pct(v, 1);
const IMPK = { g: "green", n: "neutral", y: "yellow", r: "red" };
function eventHTML(e0) {
  const e = { date: e0.d, type: e0.ty, title: e0.ti, impact: IMPK[e0.im], why: e0.w, explain: e0.ex, src: e0.sr, url: e0.u, rx: e0.rx, detail: e0.dt, pending: !!e0.p };
  const r = e.rx ? { d1: e.rx[0], d5: e.rx[1], d30: e.rx[2], y1: e.rx[3], d30_s: e.rx[4] } : null;
  const url = e.url ? (e.url[0] === "~" ? "https://nsearchives.nseindia.com/corporate/" + e.url.slice(1) : e.url) : null;
  let line = "";
  if (e.pending) line = `<span class="rx">⏳ Upcoming (date ${dateTxt(e.date)}) – likely impact as rated.</span>`;
  else if (r && r.d30 != null) line = `<span class="rx">Market reaction after 30 trading days: ${r.d30 >= 0 ? "beat" : "lagged"} the Nifty 500 by <b class="num">${FMT.pctPlain(Math.abs(r.d30), 1)}</b></span>`;
  else if (r && r.d5 != null) line = `<span class="rx">After 5 trading days: ${r.d5 >= 0 ? "beat" : "lagged"} the Nifty 500 by <b class="num">${FMT.pctPlain(Math.abs(r.d5), 1)}</b> (30-day figure not in yet)</span>`;
  const table = r ? `<div class="tablewrap"><table class="hist num"><thead><tr><th>vs Nifty 500</th><th>+1 day</th><th>+5 days</th><th>+30 days</th>${r.y1 != null ? "<th>1 year</th>" : ""}</tr></thead><tbody>
      <tr><td>Stock minus index</td><td>${rx(r.d1)}</td><td>${rx(r.d5)}</td><td>${rx(r.d30)}</td>${r.y1 != null ? `<td>${rx(r.y1)}</td>` : ""}</tr></tbody></table></div>
      ${r.d30_s != null ? `<span class="sub">The stock alone moved ${rx(r.d30_s)} in those 30 trading days.</span>` : ""}
      <span class="sub">Measured in trading days from the last close before the event. Example: +2.0% means if ₹10,000 in the index grew to ₹10,100, the same ₹10,000 in this stock grew to about ₹10,300.</span>` : "";
  return `<div class="ev imp-${e.impact}">
    <span aria-label="${e.impact}">${IMP[e.impact]}</span><span class="t">${esc(e.title)}</span>
    <span class="d">${e.date ? dateTxt(e.date) : ""}${e.src ? " · " + esc(e.src) : ""}</span>
    <span class="w">${esc(e.why)}</span>
    ${line}
    <details><summary>Show more</summary>
      ${e.explain ? `<p class="mini" style="margin:4px 0">${esc(e.explain)}</p>` : ""}
      ${e.detail ? `<p class="sub" style="margin:4px 0">Filing says: “${esc(e.detail)}”</p>` : ""}
      ${table}
      ${url ? `<p class="mini" style="margin:4px 0"><a href="${esc(url)}" target="_blank" rel="noopener">Open the original filing/order</a></p>` : ""}
    </details>
  </div>`;
}

function timelinePanel(s) {
  const x = s.s3;
  if (!x) return "";
  const tl = x.tl || [];
  if (!tl.length) return `<section class="panel"><h2>Decisions timeline</h2><p class="sub">No corporate actions or key decisions found in the sources we checked.</p></section>`;
  const first = tl.slice(0, 6), rest = tl.slice(6), c = { good: 0, watch: 0, bad: 0 };
  tl.forEach(e => { if (e.im === "g") c.good++; else if (e.im === "y") c.watch++; else if (e.im === "r") c.bad++; });
  return `<section class="panel"><h2>Decisions timeline</h2>
    <p class="sub" style="margin:0 0 8px">What the company decided, what it means for you, and how the market reacted compared with the Nifty 500. Newest first.</p>
    <p class="tally" style="margin:0 0 10px">${c.good} 🟢 good · ${c.watch} 🟡 watch · ${c.bad} 🔴 bad · ${tl.length - c.good - c.watch - c.bad} ⚪ neutral${x.tl_score != null ? ` · decisions sub-score <b>${x.tl_score}/100</b>` : ""}</p>
    ${first.map(eventHTML).join("")}
    ${rest.length ? `<details><summary>Show ${rest.length} older decision${rest.length > 1 ? "s" : ""}</summary>${rest.map(eventHTML).join("")}</details>` : ""}
    <p class="sub">🟢 good for shareholders · ⚪ no real change in value · 🟡 watch · 🔴 bad. Ratings follow simple rules (e.g. buyback 🟢, new shares 🟡, auditor resignation 🔴); always read the filing. Announcements cover 3 years, corporate actions 5 years (last 3 dividends shown), credit ratings 12 months.</p>
  </section>`;
}

// READER_PANEL_START (pipeline/company_reader.py copies this block into the light reader preview page)
// ---------- Stage 5a: Company Reader (read and show only – never counted in the verdict; "Document signals" stays OFF)
function readerPanel(s) {
  const r = s.rd;
  if (!r) return "";
  const M = S.reader || {};
  const PS = { "Met": "✅", "Partly": "🟡", "Missed": "🔴", "Too early": "⏳" };
  const nums = r.numbers.length ? `<div class="tablewrap"><table class="hist noterm"><thead><tr><th>Must-have</th><th>Value</th><th>Period</th><th>Page</th><th>Found</th></tr></thead><tbody>${r.numbers.map(x =>
    `<tr><td class="l">${esc(x.m)}</td><td>${esc(x.v)} ${esc(x.u)}</td><td>${esc(x.pd)}</td><td><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.doc)} p${x.pg}</a></td><td>${x.ok ? "✓" : "✗ not on that page"}</td></tr>`).join("")}</tbody></table></div>` : "";
  const st = r.story;
  const sig = x => `<li>${x.b === 0 ? "🔴" : "🟡"} ${esc(x.t)} <span class="sub">(${esc(x.doc || "")}${x.pg ? " p" + x.pg : ""}${x.n > 1 ? ` · seen in ${x.n} documents` : ""})</span></li>`;
  return `<section class="panel"><h2>Company Reader</h2>
    <p class="score">${esc(r.first)}</p>
    ${(r.top || []).length ? `<ul class="mini" style="margin:0 0 6px">${r.top.map((x, i) => i === 0 && r.light !== "red" ? `<li>${esc(x.t)} <span class="sub">(${esc(x.doc || "")}${x.pg ? " p" + x.pg : ""}${x.n > 1 ? ` · seen in ${x.n} documents` : ""})</span></li>` : sig(x)).join("")}</ul>` : ""}
    <details><summary>Show more: summary, numbers with pages, promises, more cautions</summary>
      ${r.summary.length ? `<h3 class="minor">Summary <span class="sub">(${esc(r.summary_from)})</span></h3><ul class="mini">${r.summary.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${nums ? `<h3 class="minor">Numbers (latest quarter)</h3>${nums}` : ""}
      ${r.not_disclosed.length ? `<p class="mini"><b>Not disclosed:</b> ${esc(r.not_disclosed.join(", "))}</p>` : ""}
      ${r.promises.length ? `<h3 class="minor">Promises vs delivery</h3><ul class="mini">${r.promises.map(p => `<li>${PS[p.s] || "⚪"} <b>${esc(p.s)}</b> – ${esc(p.w)}${p.t ? " (" + esc(p.t) + ")" : ""}${p.by ? " by " + esc(p.by) : ""} <span class="sub">${esc(p.in)}, ${esc(p.pg)}${p.ev ? " · " + esc(p.ev) : ""}</span></li>`).join("")}</ul>` : ""}
      ${(r.signals || []).length ? `<h3 class="minor">More cautions</h3><ul class="mini">${r.signals.map(sig).join("")}</ul>` : ""}
      ${(r.n_signals || 0) > (r.top || []).length + (r.signals || []).length ? `<p class="sub">${r.n_signals - r.top.length - r.signals.length} more cautions in the full report (reader.md).</p>` : ""}
      ${r.auditor ? `<p class="mini">🧾 ${esc(r.auditor)}</p>` : ""}
      ${st ? `<h3 class="minor">Business story</h3><p class="mini">${esc(st.what_it_does)}</p><p class="mini"><b>Plans:</b> ${esc(st.plans)}</p><p class="mini"><b>Moat:</b> ${esc(st.moat)}</p>
        <ul class="mini">${(st.scenarios || []).map(c => `<li><b>${esc(c.case[0].toUpperCase() + c.case.slice(1))}:</b> ${esc(c.story)} <i>Watch:</i> ${esc((c.signals_to_watch || []).join("; "))}</li>`).join("")}</ul>` : ""}
      <p class="sub">Documents: ${r.docs.map(d => d.ok ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.l)}</a> (${d.v[0]}/${d.v[1]} numbers found, ${d.cv[0]}/${d.cv[1]} must-haves)` : `${esc(d.l)} – ${esc(d.err || "not read")}`).join(" · ")}</p>
      <p class="sub">Read ${r.read_at ? dateTxt(r.read_at) : ""} by Claude Haiku from the company's own filings; ${r.verified[0]} of ${r.verified[1]} numbers were found by code on the page they cite.${st ? " Story by Claude Sonnet from these notes, not from the documents." : ""} Read and show only: this block does not change the verdict ("Document signals" stays OFF).</p>
    </details></section>`;
}
// READER_PANEL_END

// ---------- Core score v1 (review #16, Round 1 – rules frozen in pipeline/rules_v1.py) ----------
const EXP = () => ` <span class="exp">${esc((S.rules || {}).exp || "experimental – not in the Core score")}</span>`;
// review #34: the verdict box's tag follows the Stage 6b backtest (More → "Are the verdicts tested?")
const SB = () => (S.rules || {}).stage6b || null;
const VEXP = () => { const b = SB(); if (!b) return EXP();
  return b.pass ? ` <a class="exp" href="#/more" data-sb="1">tested in Stage 6b</a>`
    : ` <span class="exp">${esc((S.rules || {}).exp || "experimental – not in the Core score")} (Stage 6b: ${esc(b.short || "did not pass")})</span>`; };
function pfLine(s) {
  const p = S.portfolio;
  if (!p || !SET.master) return "";   // review #20: the master switch hides the model portfolio too
  const h = (p.holdings || []).find(x => x.s === s.symbol);
  if (h) return `<p class="mini">📁 <b>In the model portfolio</b> since ${dateTxt(h.since)} (${h.w}% of it, ${h.ret >= 0 ? "+" : ""}${h.ret}%). Why in: top 20 by Core score when it was bought. What would remove it: ${esc(h.out_if)}.</p>`;
  const c = s.cr;
  if (c && c.el && c.rk) return `<p class="sub">📁 Not in the model portfolio: rank ${c.rk} of ${c.of}. New entries come only from the top 20 (at most 3 per sector group), at the next quarterly rebalance.</p>`;
  return "";
}

// ---------- 🟢🟡🔴 signals on the page (review #48) ----------
const SIGC = {};                          // cache: metric|group → peer values
const sigGroup = x => (x.cr && x.cr.gr) || (x.fund && x.fund.group) || null;
function peerVals(metric, s) {                    // review #85 H: the stock's own peer set (same industry, else same sector) – never the market
  const P = peerSet(s), k = metric + "|" + P.key;
  if (!SIGC[k]) SIGC[k] = [s, ...P.list].filter(x => x[metric] != null).map(x => x[metric]);
  return SIGC[k];
}
function sigOf(metric, value, s) {
  const R = (S.rules || {}).signals; if (!R || SET.signals === false || value == null) return null;
  const r = R.rules[metric], g = sigGroup(s);
  const vals = r && r.higher != null ? peerVals(metric, s) : [];
  const pct = vals.length ? SIGNALS.pctRank(vals, value, r.higher) : null;
  const lv = SIGNALS.level(R, metric, value, pct, g);
  if (lv === "neutral") return null;
  const ref = vals.length >= 5 ? `${esc(peerSet(s).label)} median ${FMT.num(SIGNALS.quantile(vals, .5), 1)} · ${r.higher ? "top quarter ≥" : "cheapest quarter ≤"} ${FMT.num(SIGNALS.quantile(vals, r.higher ? .75 : .25), 1)}${pct != null ? ` · better than ${pct}% of ${FMT.count(vals.length)} peers` : ""}` : "";
  return { lv, ref, why: r.why, src: r.src };
}
const SIG_DOT = { good: "🟢", ok: "🟡", weak: "🔴", stretched: "🟡", oversold: "🟡" };
function sigTag(metric, value, s) {
  const x = sigOf(metric, value, s); if (!x) return "";
  return ` <button type="button" class="sig sig-${x.lv}" data-sig="${esc(metric)}" data-sym="${esc(s.symbol)}" aria-label="${SIGNALS.WORD[x.lv]} – tap for the reference range">${SIG_DOT[x.lv]} <span class="t-label">${SIGNALS.WORD[x.lv]}</span></button>`;
}
function sigSheet(metric, sym) {
  const s = BY[sym], x = sigOf(metric, s[metric] ?? (metric === "health" ? s.quality : metric === "core" ? s.core : null), s);
  if (!x) return;
  sheet(`<h2>${SIG_DOT[x.lv]} ${SIGNALS.WORD[x.lv]}</h2><p>${esc(x.why[0].toUpperCase() + x.why.slice(1))}.</p>${x.ref ? `<p class="mini">${esc(x.ref)}</p>` : ""}
    <p class="t-label sub">Reference: ${esc(x.src)} (docs/SIGNALS.md). Display only – no score uses it.</p><div class="btnrow"><button class="act" type="button" data-close>Close</button></div>`);
}
const sizeTag = s => { const R = (S.rules || {}).signals; if (!R || !s.mcap_cr) return "";
  const rank = 1 + S.stocks.filter(x => (x.mcap_cr || 0) > s.mcap_cr).length;
  return `<span class="t-label sub"> · ${SIGNALS.sizeLabel(rank, R.size)}</span>`; };
// ---------- review #61: the chart title IS the legend (Karma, 18:23) – each series name gets a short underline in the exact colour
// (and dash) of its mark. One source: the same CSS colour token is passed to the mark and to its key word. ----------
const kw = (name, color, o = {}) => `<span class="kw${o.dash ? " kdash" : ""}${o.light ? " klight" : ""}" data-key="${esc(name)}" style="--k:${color}">${esc(o.label || name)}</span>`;
const ktitle = (parts, tag = "h3") => `<${tag} class="minor ktitle">${parts}</${tag}>`;
// ---------- small summary charts (review #48): our own SVG in the design tokens, numbers always shown with them ----------
function donut(parts, label) {
  const tot = parts.reduce((a, p) => a + Math.max(0, p.v || 0), 0) || 1, R = 34, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = parts.map(p => { const len = Math.max(0, p.v || 0) / tot * C; const a = `<circle data-series="${esc(p.n)}" r="${R}" cx="45" cy="45" fill="none" stroke-width="14" style="stroke:var(${p.c})" stroke-dasharray="${FMT.coord(len)} ${FMT.coord(C - len)}" stroke-dashoffset="${FMT.coord(-off)}" transform="rotate(-90 45 45)"/>`; off += len; return a; }).join("");
  return `<figure class="donut" data-chart="${esc(label)}"><svg viewBox="0 0 90 90" role="img" aria-label="${esc(label)}">${arcs}</svg><figcaption>${parts.map(p => `<span data-key="${esc(p.n)}"><i style="background:var(${p.c})"></i>${esc(p.n)} <b class="num">${FMT.num(p.v, 1)}</b></span>`).join("")}</figcaption></figure>`;
}
function valueBand(s) {
  const v = s.v4 && s.v4.va; if (!v || !v.fair || v.low == null || v.high == null) return "";
  const lo = Math.min(v.low, s.close), hi = Math.max(v.high, s.close), xn = n => (n - lo) / ((hi - lo) || 1) * 100, x = n => FMT.coord(xn(n));
  // review #61: each marker carries its own label – fair value above the bar, price below it, so the two never overlap; a label
  // near an end is anchored to that end so it stays inside the bar's width at 320 px
  const lab = (n, cls, text, key) => { const p = xn(n), side = p < 18 ? " left" : p > 82 ? " right" : "";
    return `<span class="vlab t-label ${cls}${side}" data-label="${key}" style="left:${FMT.coord(p)}%"><b class="num">${text}</b></span>`; };
  const gap = (s.close / v.fair - 1) * 100;
  const verdict = Math.abs(gap) < 0.5 ? "Price is at the consensus fair value" : `Price is ${FMT.pctPlain(Math.abs(gap), 0)} ${gap < 0 ? "below" : "above"} the consensus fair value`;
  return `<figure class="vband" data-chart="Price vs Fair value">${ktitle(`${kw("Price", "var(--ink)")} vs ${kw("Fair value", "var(--accent)")} ${ib("fair")}`)}
    <div class="vbar"><i class="vrange" data-series="Methods range" style="left:${x(v.low)}%;width:${FMT.coord(xn(v.high) - xn(v.low))}%"></i><i class="vfair" data-series="Fair value" style="left:${x(v.fair)}%"></i><i class="vprice" data-series="Price" style="left:${x(s.close)}%"></i>
      ${lab(v.fair, "top", `Fair value ${inr(v.fair, 0)}`, "Fair value")}${lab(s.close, "bot", `Price ${inr(s.close, 0)}`, "Price")}</div>
    <div class="vends t-label"><span data-key="Methods range"><i class="kswatch" style="--k:var(--accent-soft)"></i>lowest method <b class="num">${inr(v.low, 0)}</b></span><span>highest <b class="num">${inr(v.high, 0)}</b></span></div>
    <figcaption class="mini vverdict">${verdict}.</figcaption></figure>${guidePanel("cheap", s)}`;
}
// review #83 I (replaces the #48 / #61 / #63 radar charts): business health as one row per part, in a fixed order – a 0–100 bar of the
// stock's percentile within its own sector, a thin marker at 50 (the sector middle), the number and a plain word. One neutral data
// colour (never green / red; the word carries the meaning); a missing part is an empty grey track with "No data", never a 0-length bar.
const HB_PARTS = ["Profitability", "Growth", "Balance sheet", "Cash quality", "Valuation", "Momentum"];
const HB_COLS = ["var(--d-blue)", "var(--d-violet)", "var(--d-teal)", "var(--d-gold)", "var(--d-pink)"];
const hbWord = v => v >= 80 ? "Top 20%" : v >= 60 ? "Above average" : v >= 40 ? "Average" : v >= 20 ? "Below average" : "Bottom 20%";
function healthPts(s, g) {
  const ax = [["Profitability", s.roce != null ? "roce" : "roe", true], ["Growth", "sales_cagr", true], ["Balance sheet", "de", false],
              ["Cash quality", "cfo_pat", true], ["Valuation", "pe", false]];
  const pts = ax.map(([n, k, hi]) => { const v = s[k]; const vals = v != null ? peerVals(k, s) : []; return [n, vals.length >= 5 ? SIGNALS.pctRank(vals, v, hi) : null]; });
  pts.push(["Momentum", s.cr && s.cr.pl && s.cr.pl.momentum != null ? Math.round(s.cr.pl.momentum) : null]);
  return pts;
}
function healthBars(list, opts = {}) {
  list = list.filter(Boolean); if (!list.length) return "";
  const P = list.map(s => Object.fromEntries(healthPts(s, sigGroup(s)))), multi = list.length > 1;
  if (!multi && Object.values(P[0]).filter(v => v != null).length < 1) return "";
  const col = i => HB_COLS[i % HB_COLS.length];
  const key = multi ? list.map((s, i) => kw(s.symbol, col(i), { label: s.name })).join(" · ") : kw(opts.name || "This stock", col(0));
  const cell = (s, i, v) => `<div class="hbcell"${multi ? "" : ""}>${multi ? `<span class="hbsym t-label">${esc(s.symbol)}</span>` : ""}
      <span class="hbtrack${v == null ? " empty" : ""}" role="img" aria-label="${esc(s.symbol)}: ${v == null ? "no data" : FMT.num(v, 0) + " of 100"}"><i class="hbfill" data-series="${esc(multi ? s.symbol : opts.name || "This stock")}" style="width:${v == null ? 0 : FMT.coord(Math.max(1, Math.min(100, v)))}%;--k:${col(i)}"></i><i class="hbmid" title="sector middle"></i></span>
      <span class="hbval">${v == null ? `<span class="sub">No data</span>` : `<b class="num">${FMT.num(v, 0)}</b> <span class="hbword">${hbWord(v)}</span>`}</span></div>`;
  return `<figure class="hbars${multi ? " multi" : ""}" data-chart="${esc(opts.title || "Business health vs sector")}">${ktitle(key, "p")}
    <p class="sub hbnote">Bars = how ${multi ? "each stock" : "this stock"} ranks within its own sector (50 = middle).</p>
    ${HB_PARTS.map(part => `<div class="hbrow" data-part="${esc(part)}"><span class="hblab">${esc(part)}</span><div class="hbcells">${list.map((s, i) => cell(s, i, P[i][part])).join("")}</div></div>`).join("")}
    <figcaption class="t-label sub">Percentile among ${multi ? "each stock's own industry peers" : esc(peerSet(list[0]).label || "industry") + " peers (" + FMT.count(peerSet(list[0]).n) + ")"}: 80+ Top 20% · 60–79 Above average · 40–59 Average · 20–39 Below average · under 20 Bottom 20%.</figcaption></figure>`;
}
const HB_PEER = {};
function healthFig(s) {                                          // the stock page: this stock, and a peer you pick (a second bar under each part)
  const peer = HB_PEER[s.symbol] && BY[HB_PEER[s.symbol]];
  const peers = peerSet(s).list.slice(0, 12);
  const bars = healthBars(peer ? [s, peer] : [s]); if (!bars) return "";
  return `<div class="hbwrap" data-hb="${esc(s.symbol)}" data-xkey="bizhealth">${peers.length ? `<label class="peerpick t-label">Compare with a peer <select data-hbpeer="${esc(s.symbol)}"><option value="">– none –</option>${peers.map(x => `<option value="${esc(x.symbol)}"${peer === x ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>` : ""}${bars}</div>`;
}
// review #48: sales and profit by year (as many years as the statements have), growth on each bar
function yearBars(s) {
  const h = s.fund && s.fund.history; if (!h || !h.revenue_cr) return "";
  const ys = Object.keys(h.revenue_cr).sort(); if (ys.length < 2) return "";
  const P = h.pat_cr || {};
  // review #62: ONE scale for both series (profit at 18% of sales is drawn 18% as tall); a loss goes below the zero line in red
  const pos = Math.max(1, ...ys.flatMap(y => [h.revenue_cr[y] || 0, P[y] || 0]).filter(v => v > 0));
  const neg = Math.max(0, ...ys.flatMap(y => [h.revenue_cr[y] || 0, P[y] || 0]).filter(v => v < 0).map(Math.abs));
  const rng = pos + neg, y0 = neg / rng * 100;
  const bar = (v, cls, nm) => { const hgt = Math.abs(v || 0) / rng * 100;
    return `<i class="${cls}" data-series="${nm}" data-v="${v == null ? "" : v}" style="bottom:${FMT.coord((v || 0) < 0 ? y0 - hgt : y0)}%;height:${FMT.coord(hgt)}%"></i>`; };
  const gr = (o, i) => i && o[ys[i - 1]] ? FMT.pct((o[ys[i]] / o[ys[i - 1]] - 1) * 100, 0) : "";
  return `<figure class="ybars" data-chart="Sales vs Profit" data-shared-scale="1">${ktitle(`${kw("Sales", "var(--accent)")} vs ${kw("Profit", "var(--gain)")} <span class="t-label sub">(₹ crore, one scale; a loss shows red below the line)</span>`)}<div class="yb-row">${ys.map((y, i) => `<div class="yb"><div class="yb-pair">${neg ? `<b class="yb-zero" style="bottom:${FMT.coord(y0)}%"></b>` : ""}<span class="yb-col">${bar(h.revenue_cr[y], "yb-s", "Sales")}</span><span class="yb-col">${bar(P[y], "yb-p " + FMT.cls(P[y]), "Profit")}</span></div>
    <span class="t-label">FY${y.slice(2)}</span><span class="t-label sub">${FMT.cr(h.revenue_cr[y], 0)}${gr(h.revenue_cr, i) ? ` (${gr(h.revenue_cr, i)})` : ""}</span><span class="t-label sub">profit ${FMT.cr(P[y], 0)}${gr(P, i) ? ` (${gr(P, i)})` : ""}</span></div>`).join("")}</div>
    <figcaption class="t-label sub">${ys.length} years of statements (10 when the NSE filings history lands)</figcaption></figure>`;
}
// review #48: shareholding – promoters vs everyone else (the FII / DII split isn't collected yet) + 8 quarters of promoter %
function holdingChart(s) {
  const o = s.s3 && s.s3.own, q = o && o.promoter && o.promoter.quarters; if (!q || !q.length) return "";
  const last = q[q.length - 1].p;
  const line = q.length >= 2 ? (() => { const lo = Math.min(...q.map(x => x.p)), hi = Math.max(...q.map(x => x.p)), W = 160, H = 40;
    const pts = q.map((x, i) => `${FMT.coord(i * W / (q.length - 1))},${FMT.coord(H - 4 - (x.p - lo) / ((hi - lo) || 1) * (H - 8))}`).join(" ");
    return `<figure class="pline" data-chart="Promoter %"><svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline data-series="Promoter %" fill="none" style="stroke:var(--accent)" stroke-width="2" points="${pts}"/></svg>
      <figcaption class="t-label sub">${kw("Promoter %", "var(--accent)")} over ${q.length} quarters: ${FMT.pctPlain(q[0].p, 2)} → ${FMT.pctPlain(last, 2)}</figcaption></figure>`; })() : "";
  return `<div>${donut([{ n: "Promoters", v: last, c: "--accent" }, { n: "Public, FIIs, DIIs and others", v: 100 - last, c: "--line" }], "Shareholding")}${line}</div>`;
}
function glanceRow(s) {
  const c = s.cr; const parts = c ? [{ n: "Quality vs sector", v: c.pl.quality, c: "--accent" }, { n: "Value", v: c.pl.value, c: "--v11" }, { n: "Momentum", v: c.pl.momentum, c: "--avg" }] : null;
  const vb = OWNER() ? "" : valueBand(s);
  if (!parts && !vb) return "";
  const rd = healthFig(s), yb = yearBars(s), hc = holdingChart(s);
  return `<section class="panel glance"><h2>At a glance</h2><div class="glance-row">${parts ? `<div><h3 class="minor">Core score parts</h3>${donut(parts, "Core score parts")}</div>` : ""}${vb ? `<div>${vb}</div>` : ""}
    ${rd ? `<div><h3 class="minor">Business health vs sector</h3>${rd}</div>` : ""}${yb ? `<div>${yb}</div>` : ""}${hc ? `<div><h3 class="minor">Shareholding</h3>${hc}</div>` : ""}</div></section>`;
}
// ---------- 🛡️ drawdown meter, fall check, playbook (review #47) ----------
function ddMeter(points, label, triPoints, guide) {
  const d = UL.drawdown(points); if (!d) return "";
  const t = triPoints ? UL.drawdown(triPoints) : null;
  return `<div class="ddm dd-${d.stage}"><span class="t-label sub">${esc(label)}</span>
    <span>${d.dd < 0.05 ? "At its peak" : `Now <b class="num">${FMT.pctPlain(d.dd, 1)}</b> below its peak (${FMT.money(d.peak, 0)} on ${dateTxt(d.peakDate)})`} · <b>${d.stageName}</b>${t ? ` · Nifty 500 TRI ${FMT.pctPlain(t.dd, 1)} below its peak` : ""}</span>
    ${d.dd >= 10 ? `<a class="t-label" href="#/playbook">If the market falls – the plan ›</a>` : ""}${guide ? guidePanel("drawdown", d) : ""}</div>`;
}
// your real portfolio's value, one point a day, kept only in this browser (for its drawdown meter)
function trackValue(v) {
  if (!(v > 0)) return [];
  USER.meta.vh = USER.meta.vh || [];
  const vh = USER.meta.vh, last = vh[vh.length - 1];
  if (!last || last.d !== PDAY) { vh.push({ d: PDAY, v: Math.round(v) }); if (vh.length > 800) vh.shift(); persist(); }
  else if (last.v !== Math.round(v)) { last.v = Math.round(v); persist(); }
  return vh;
}
function fallCheck(sym, pos) {
  const s = BY[sym]; if (!s) return "";
  const a = UL.fallAlert(pos, s.close, s.pct_from_high52); if (!a) return "";
  const since = pos.first || PDAY, n0 = LEVEL(since), n1 = LEVEL(PDAY), nifty = n0 && n1 ? (n1 / n0 - 1) * 100 : null;
  const mine = (s.close / pos.avg - 1) * 100;
  const flag = hardFlagOf(s) || docFlagOf(s);
  const pat = s.fund && s.fund.history && s.fund.history.pat_cr ? Object.values(s.fund.history.pat_cr) : [];
  const res = pat.length >= 2 ? (pat[pat.length - 1] / pat[pat.length - 2] - 1) * 100 : null;
  const news = s.s3 && s.s3.timeline ? s.s3.timeline.filter(e => (e.date || "") >= since && e.impact === "red").length : null;
  const pts = [
    ["Market or the stock?", nifty == null ? "Nifty 500 move not known" : `stock ${FMT.pct(mine, 1)} vs Nifty 500 ${FMT.pct(nifty, 1)} since ${dateTxt(since)}`, nifty != null && mine < nifty - 15],
    ["Core rank and business health now", s.cr ? `Core rank ${s.cr.el ? `${s.cr.rk} of ${s.cr.of}` : "not eligible"} · business health ${s.quality ?? "–"}/100` : `business health ${s.quality ?? "–"}/100`, (s.cr && !s.cr.el) || (s.quality != null && s.quality < 50)],
    ["New red flags (flags, pledge, promoter selling, auditor)", flag ? flag : "none on record", !!flag],
    ["Latest results vs the year before", res == null ? "not available" : `profit ${FMT.pct(res, 0)}`, res != null && res < -20],
    ["News since you bought (NSE)", news == null ? "not collected for this stock" : `${FMT.count(news)} negative item${news === 1 ? "" : "s"}`, news > 0]];
  const bad = pts.filter(p => p[2]).length;
  return `<section class="panel fallcheck"><h2>🟡 Fell ${FMT.pctPlain(a.fell, 0)} ${esc(a.why)} – check, don't panic</h2>
    <ol>${pts.map(([q, v, b]) => `<li>${esc(q)}: <b>${esc(v)}</b>${b ? " ⚠️" : ""}</li>`).join("")}</ol>
    <p><b>${bad ? "Something changed – review it (the 🚦 exit check decides; only 🔴 means sell now)." : "Story looks intact."}</b> This is a check, never a buy or sell signal.</p>
    ${bad ? "" : `<p class="t-label sub">Thinking of buying more? Add in steps (e.g. at −20% and −30%), keep one stock under 10% of the portfolio, at most 2× your first amount, only money you won't need for 3 years – and re-check these 5 points first.</p>`}</section>`;
}
function playbookScreen() {
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>If the market falls</h1></div>
    <p class="sub">Written in advance, so a fall doesn't have to be decided in a hurry. Not advice.</p>
    ${[["0–10% below the peak · normal", ["Nothing to do. Falls of 5–10% happen most years."]],
       ["10–20% · correction", ["Open 💼 Portfolio and look at the 🚦 exit check first – only 🔴 means sell now.", "Don't sell because of a colour or a headline."]],
       ["20–30% · bear market", ["Keep your planned split (e.g. 60% index fund / 40% stocks) and rebalance back into it at the quarter.", "New money: stagger it over 3–6 months.", "A holding 20% below your price shows a 5-point check – read it before acting."]],
       ["30%+ · severe", ["Same steps. Never add money you need within 3 years; keep an emergency fund outside stocks.", "Buying more only in steps, under 10% per stock and at most 2× the first amount."]]]
      .map(([h, xs]) => `<section class="panel"><h2>${esc(h)}</h2><ul>${xs.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>`).join("")}
    <section class="panel"><h2>What history says</h2><p>In the Stage 6 backtest (2012–2026) Rules v1.0's worst fall was <b>−52%</b> and v1.1's <b>−41.2%</b>; the Nifty 500 TRI's was <b>−38.2%</b>. Both recovered and went on to new highs – that is why the plan is to hold through, not to guess the bottom.</p>
    <p class="t-label sub">Stop-losses are being tested separately (Stage 6c, evidence only) – nothing automatic is switched on.</p></section>`;
}
// review #48: a dot + word that is not a button (inside a card link the whole card is the tap target)
function sigDot(metric, value, s) { const x = sigOf(metric, value, s); return x ? ` <span class="sigd sig-${x.lv}">${SIG_DOT[x.lv]} ${SIGNALS.WORD[x.lv]}</span>` : ""; }
// review #48: sorted horizontal bars (sector moves, % moved since saved) – HTML bars in the tokens, numbers on every row
function hbars(rows, title) {
  const mx = Math.max(1e-9, ...rows.map(r => Math.abs(r.v || 0)));
  return `<div class="hbars" data-chart="${esc(title)}" data-direct="1" role="img" aria-label="${esc(title)}">${rows.map(r => `<div class="hb"><span class="hl">${r.href ? `<a href="${r.href}">${esc(r.n)}</a>` : esc(r.n)}</span><span class="hv"><i class="${FMT.cls(r.v)}"${r.sk ? ` data-sk="${esc(r.sk)}"` : ""} style="width:${FMT.coord(Math.abs(r.v || 0) / mx * 100)}%"></i></span><span class="num ${FMT.cls(r.v)}">${FMT.pct(r.v, 1)}</span></div>`).join("")}</div>`;
}
// review #48: Portfolio allocation by stock and by sector, with the concentration warnings (one stock > 10%, a sector > 30%)
function allocation(P) {
  const rows = P.rows.filter(r => r.value > 0), tot = rows.reduce((a, r) => a + r.value, 0);
  if (rows.length < 2 || !tot) return "";
  const cols = ["--accent", "--v11", "--avg", "--trim", "--gain", "--ink-3"];
  const bySym = rows.map(r => ({ n: r.sym, v: r.value / tot * 100 })).sort((a, b) => b.v - a.v);
  const sec = {}, secKey = {}; rows.forEach(r => { const g = GROUP_LABEL(sigGroup(BY[r.sym] || {}) || "–"); sec[g] = (sec[g] || 0) + r.value / tot * 100; secKey[g] = skOf(BY[r.sym]); });
  const bySec = Object.entries(sec).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v);
  const LC = document.documentElement.classList.contains("layer-c");     // review #66: by-sector slices in the sector colours
  const top = list => list.slice(0, 5).concat(list.length > 5 ? [{ n: "Others", v: list.slice(5).reduce((a, x) => a + x.v, 0) }] : []).map((x, i) => Object.assign(x, { c: cols[i % cols.length] }));
  const warn = bySym.filter(x => x.v > 10).map(x => `${x.n} is ${FMT.pctPlain(x.v, 1)} of the portfolio (guide: at most 10%)`)
    .concat(bySec.filter(x => x.v > 30).map(x => `${x.n} is ${FMT.pctPlain(x.v, 1)} (guide: at most 30% in one sector)`));
  const usedK = new Set(), secParts = top(bySec).map(x => { const k = secKey[x.n]; if (LC && k && !usedK.has(k)) { usedK.add(k); return Object.assign(x, { c: "--sc-" + k }); } return x; });
  return `<section class="panel alloc"><h2>Allocation</h2><div class="glance-row"><div><h3 class="minor">By stock</h3>${donut(top(bySym), "Allocation by stock")}</div><div><h3 class="minor">By sector</h3>${donut(secParts, "Allocation by sector")}</div></div>
    ${warn.length ? `<p class="mini">🟡 ${esc(warn.join(" · "))}.</p>` : `<p class="t-label sub">No stock above 10% and no sector above 30%.</p>`}</section>`;
}
// ---------- 🧭 discipline pack (review #50) – everything here stays in this browser (and in the Backup file) ----------
function visitSnapshot() {
  const zones = {}, exits = {};
  USER.watch.forEach(w => { const s = BY[w.sym]; if (s && SET.master) zones[w.sym] = zoneFor(s).kind; });
  if (USER.tx.length) UL.portfolio(USER.tx, priceOf, PDAY).rows.forEach(r => { exits[r.sym] = exitFor(r.sym, r).level; });
  const T = USER.tx.length ? UL.portfolio(USER.tx, priceOf, PDAY).totals : null;
  return { d: PDAY, ghost: S.portfolio && S.portfolio.nav, port: T ? T.value : null, zones, exits };
}
function sinceCard() {
  const now = visitSnapshot(), prev = USER.meta.lastVisit, r = UL.sinceDiff(prev, now);
  if (!prev || prev.d !== now.d) { USER.meta.lastVisitPrev = prev || null; USER.meta.lastVisit = now; persist(); }
  const show = r || (USER.meta.lastVisitPrev && UL.sinceDiff(USER.meta.lastVisitPrev, now));
  if (!show) return "";
  const nm = s => esc(BY[s] ? BY[s].name : s);
  return `<section class="panel since"><h2>Since you last visited <span class="t-label sub">${FMT.count(show.days)} day${show.days === 1 ? "" : "s"} ago</span></h2>
    ${show.ghost != null ? `<p class="mline">Model portfolio v1.0 <span class="num ${FMT.cls(show.ghost)}">${FMT.pct(show.ghost, 2)}</span>${show.port != null ? ` · your portfolio <span class="num ${FMT.cls(show.port)}">${FMT.pct(show.port, 2)}</span>` : ""}</p>` : ""}
    ${show.exits.length ? `<p class="mline">🚦 New exit-check signal: ${show.exits.map(nm).join(", ")} – open 💼 Portfolio.</p>` : ""}
    ${show.zin.length ? `<p class="mline">Entered the buy zone: ${show.zin.map(nm).join(", ")}</p>` : ""}${show.zout.length ? `<p class="mline">Left the buy zone: ${show.zout.map(nm).join(", ")}</p>` : ""}
    ${show.quiet ? `<p class="mline"><b>Nothing needs action.</b> It's fine to come back next week.</p>` : ""}</section>`;
}
function weekScreen() {
  const st = (S.portfolio || {}).stats || {}, ser = st.series || [], m = S.market || {};
  const wk = ser.length >= 2 ? (ser[ser.length - 1].nav / ser[Math.max(0, ser.length - 6)].nav - 1) * 100 : null;
  const mine = USER.watch.map(w => w.sym).concat(USER.tx.map(t => t.sym)).filter((x, i, a) => a.indexOf(x) === i && BY[x]);
  const coming = (m.coming || []).filter(e => e.k === "results").slice(0, 8);
  return `<button class="back" type="button" data-back="#/home">${ic("back")} Back</button><div class="scr-h"><h1>Week in review</h1></div>
    <p class="sub">Prices from ${dateTxt(PDAY)} · end of day, not live.</p>
    <section class="panel"><h2>The market this week</h2><p><a href="#/market?v=week">Open the Market tab's week view ›</a></p></section>
    <section class="panel"><h2>Model portfolios</h2><p>v1.0 ${wk == null ? "–" : `<span class="num ${FMT.cls(wk)}">${FMT.pct(wk, 2)}</span> over the last 5 trading days`} · since start <span class="num ${FMT.cls(st.ret)}">${FMT.pct(st.ret, 2)}</span></p>
      <p class="t-label sub">Next rebalance: about ${dateTxt(UL.nextRebalance(PDAY))}.</p></section>
    <section class="panel"><h2>Your stocks</h2>${mine.length ? `<div class="krows">${mine.map(x => BY[x]).sort((a, b) => (b.change_pct || 0) - (a.change_pct || 0)).map(s => `<a class="krow" href="${stockHref(s.symbol)}"><span class="kn">${esc(s.name)}</span><span class="kr">${chgPill(s.change_pct, 2)}</span></a>`).join("")}</div>` : `<p class="empty">${STORE_HINT}</p>`}</section>
    <section class="panel"><h2>Coming up</h2>${coming.length ? coming.map(e => `<p class="mline">${dateTxt(e.d)} · ${esc(e.s)} – results</p>`).join("") : `<p class="sub">No results dates in the next few days on NSE's calendar.</p>`}</section>`;
}
function policyScreen() {
  const P = Object.assign({}, UL.POLICY_DEFAULT, USER.policy || {});
  const f = (k, lbl, unit, step) => `<label class="fl">${lbl}<input name="${k}" type="number" inputmode="decimal" min="0" step="${step}" value="${P[k] ?? ""}"> <span class="t-label sub">${unit}</span></label>`;
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>My Policy</h1></div>
    <p class="sub">Your own rules, written down once. Kept only in this browser and in the Backup file. 💼 Portfolio checks them (it never blocks anything).</p>
    <form id="policyform" class="panel">${f("split", "Strategy share (the rest in a Nifty 500 index fund)", "% – the tested 60/40 core–satellite: 15.1% a year, worst fall −37.1% in Stage 6", 5)}
      ${f("maxStock", "Most in one stock", "% of your stocks", 1)}${f("maxSector", "Most in one sector", "%", 5)}${f("planned", "Money planned for stocks", "₹ (optional – for the small-account check)", 10000)}${f("goal", "Goal for your portfolio value", "₹ (optional – fills the goal jar on Portfolio)", 50000)}
      <p class="mini">Rebalance: first trading day of January, April, July and October. Exits: only 🔴 in the exit check means sell; no automatic stop-loss. Only money you won't need within 3 years. Ramp: ${esc(P.ramp)}.</p>
      <div class="btnrow"><button class="act big" type="submit">Save my policy</button></div></form>`;
}
function policyPanel(P) {
  const w = UL.policyCheck(USER.policy, P.rows.filter(r => r.value > 0), sym => GROUP_LABEL(sigGroup(BY[sym] || {}) || "other"));
  return `<section class="panel policy"><h2>Policy check <a class="t-label" href="#/policy">My Policy ›</a></h2>${w.length ? w.map(x => `<p class="mline">🟡 ${esc(x)}</p>`).join("") : `<p class="mline">🟢 Within your limits.</p>`}${guidePanel("concentration", { over: w.some(x => /your limit/.test(x) && !/costs eat/.test(x)) })}</section>`;
}
function taxHelper() {
  if (!USER.tx.length) return "";
  const tx = S.tax || {}; if (!tx.ltcg_exempt) return "";
  const h = UL.harvest(USER.tx, priceOf, PDAY, tx.ltcg_exempt, tx.lt_months || 12), march = PDAY.slice(5, 7) === "03";
  if (!h.lt && !h.stLoss.length) return "";
  return `<details class="panel taxh"${march ? " open" : ""}><summary>🧾 Tax helper${march ? " – March: book tax-free gains?" : ""}</summary>
    ${h.lt ? `<p>${FMT.money(h.free, 0)} of long-term gains could be booked tax-free this financial year (limit ${FMT.money(h.exempt, 0)}; you have ${FMT.money(h.lt, 0)} on lots held over ${tx.lt_months || 12} months: ${h.rows.slice(0, 5).map(r => esc(r.sym)).join(", ")}).</p>` : ""}
    ${h.stLoss.length ? `<p>Short-term losses that could offset gains: ${h.stLoss.slice(0, 6).map(r => `${esc(r.sym)} ${FMT.moneySigned(r.loss, 0)}`).join(" · ")}.</p>` : ""}
    <p class="t-label sub">For your CA / tax planning, not advice. Rates from the Income Tax Department (${esc((tx.sources || [""])[0])}).</p></details>`;
}
// ---------- 🧑‍⚖️ "Check the AI's reading" (review #52, the Stage 5b gate): 20 stocks, tap Correct / Wrong / Unsure per claim ----------
const RRQ = () => (((S.reader || {}).review || {}).queue || []).length ? S.reader.review : null;
const rrLine = () => { const R = RRQ(), P = UL.rrProgress(R.queue, USER.rr);
  return `${FMT.count(P.reviewed)} of ${FMT.count(P.of)} reviewed${P.pct != null ? ` · ${FMT.num(P.pct, 0)}% correct` : ""}`; };
const RR_A = [["ok", "Correct"], ["bad", "Wrong"], ["unsure", "Unsure"]];
function reviewScreen(sym) {
  const R = RRQ();
  if (!R) return `<div class="scr-h"><h1>Check the AI's reading</h1></div><p class="sub">No Company Reader notes on tonight's page yet.</p>`;
  const P = UL.rrProgress(R.queue, USER.rr), G = R.gate || {}, ans = USER.rr || {};
  const done = q => q.claims.filter(c => (ans[q.s] || {})[c.id]).length;
  const q = sym && R.queue.find(x => x.s === sym);
  if (q) {
    const a = ans[q.s] || {};
    return `<button class="back" type="button" data-back="#/review">${ic("back")} Back</button><div class="scr-h"><h1>${esc(q.s)}</h1></div>
      <p class="sub">${esc((BY[q.s] || {}).name || q.s)} · ${done(q)} of ${q.claims.length} claims checked. Open the source page, compare, then tap.</p>
      ${q.claims.map(c => { const cur = (a[c.id] || {}).a;
        return `<section class="panel rr"><p class="t-label sub">${esc({ number: "Number", caution: "Caution", promise: "Promise" }[c.k] || c.k)}</p><p class="mline">${esc(c.t)}</p>
        <p class="sub">${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.doc || "source")}${c.pg ? " p" + c.pg : ""} ›</a>` : esc(c.doc || "")}</p>
        <div class="btnrow">${RR_A.map(([k, l]) => `<button class="act${cur === k ? " on" : ""}" type="button" data-act="rr" data-sym="${esc(q.s)}" data-id="${c.id}" data-a="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div>
        <label class="fl">Note<input data-rrnote="${c.id}" data-sym="${esc(q.s)}" value="${esc((a[c.id] || {}).note || "")}" placeholder="optional"></label></section>`; }).join("")}`;
  }
  return `<button class="back" type="button" data-back="#/more">${ic("back")} Back</button><div class="scr-h"><h1>Check the AI's reading</h1></div>
    <section class="panel"><p class="score">${FMT.count(P.reviewed)} of ${FMT.count(P.of)} reviewed${P.pct != null ? ` · ${FMT.num(P.pct, 0)}% correct` : ""}</p>
      <p class="sub">Document signals start counting in the verdict only after at least 20 stocks are reviewed with at least 90% correct (still experimental – never in the Core score). ${P.pass ? "On this device the gate is met – export and upload the file so the nightly run sees it." : ""}</p>
      <p class="t-label sub">From uploaded files: ${FMT.count(G.reviewed || 0)} of ${FMT.count(G.of || 0)} reviewed${G.pct != null ? ` · ${FMT.num(G.pct, 0)}% correct` : ""} · gate ${G.pass ? "passed" : "not passed yet"}.</p>
      <div class="btnrow"><button class="act" type="button" data-act="rrexport">Export my answers</button></div>
      <p class="sub">Then on GitHub: the repository → docs → reader-review → Add file → Upload files → pick the file → Commit changes. Your answers also stay in this browser and in the Backup file.</p></section>
    <nav class="glist" aria-label="Stocks to check">${R.queue.map(x => `<a href="#/review/${encodeURIComponent(x.s)}"><span class="gt">${esc(x.s)}${x.golden ? " · golden" : ""}<span class="gs">${esc(GROUP_LABEL(sigGroup(BY[x.s] || {}) || "other"))} · ${done(x)} of ${x.claims.length} checked</span></span></a>`).join("")}</nav>
    <h3 class="gl">Unlocks after your review</h3><div class="glist">${(R.locked || []).map(l => `<p class="mline">${esc(l)}</p>`).join("")}</div>`;
}
function rrExport() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ kind: "reader-review", made: TODAY, answers: USER.rr || {} }, null, 1)], { type: "application/json" }));
  a.download = `reader-review-${TODAY}.json`; document.body.appendChild(a); a.click(); a.remove();
}

function journalScreen() {
  const J = USER.tx.filter(t => t.j && (t.j.why || t.j.sell));
  const due = J.filter(t => UL.days(t.date, PDAY) >= 182);
  const hit = due.filter(t => BY[t.sym] && (t.side === "buy" ? BY[t.sym].close > t.px : BY[t.sym].close < t.px)).length;
  return `<button class="back" type="button" data-back="#/portfolio">${ic("back")} Back</button><div class="scr-h"><h1>Decision journal</h1></div>
    <p class="sub">Why you bought or sold, and what would make you change your mind – kept only in this browser (and the Backup file).</p>
    ${due.length ? `<section class="tot"><span class="tl t-label">My hit rate (decisions at least 6 months old)</span><span class="totv num">${FMT.count(hit)} of ${FMT.count(due.length)}</span></section>` : ""}
    ${J.length ? J.slice().reverse().map(t => { const s = BY[t.sym], mv = s ? (s.close / t.px - 1) * 100 : null, old = UL.days(t.date, PDAY) >= 182;
      return `<section class="panel"><h2>${t.side === "buy" ? "Bought" : "Sold"} ${esc(t.sym)} <span class="t-label sub">${dateTxt(t.date)} at ${inr(t.px)}</span></h2>
        ${t.j.why ? `<p class="mini"><b>Why:</b> ${esc(t.j.why)}</p>` : ""}${t.j.sell ? `<p class="mini"><b>Would sell if:</b> ${esc(t.j.sell)}</p>` : ""}${t.j.hold ? `<p class="mini"><b>Planned holding:</b> ${esc(t.j.hold)}</p>` : ""}
        <p class="t-label ${old ? "" : "sub"}">${old ? "🔔 6-month review: " : ""}since then <span class="num ${FMT.cls(mv)}">${FMT.pct(mv, 1)}</span></p></section>`; }).join("") : `<p class="empty">No journal entries yet – the Bought / Sold form has three optional "why" boxes.</p>`}`;
}
// ---------- 🧭 Experts' View (review #46): cited daily brief + weekly lenses (AI interpretations of published principles) ----------
let XPV = { data: null, tried: false, d: null, w: null };
function loadExperts() { if (XPV.tried) return Promise.resolve(XPV.data); XPV.tried = true;
  return fetch("data/experts.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null).then(d => { XPV.data = d; return d; }); }
const EXP_DIR = { up: "▲", down: "▼", flat: "–" };
const EXP_CASE = { good: "Good", base: "Base", bad: "Bad" };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return "source"; } };
function expertsAsk() {
  const D = XPV.data || {}, b = (D.daily || [])[0], w = (D.weekly || [])[0];
  return `I use a personal Indian stock screener (not investment advice). Its "Experts' View" for ${b ? b.date : "today"} lists these factors:\n` +
    ((b && b.factors) || []).map(f => `- ${f.group}: ${f.what} (${f.sources[0]})`).join("\n") +
    (w ? `\nLens moods (AI interpretations of published principles, not their words): ${w.lenses.map(c => `${c.title.replace("Through a ", "").replace("-style lens", "")} ${c.mood}`).join(", ")}.` : "") +
    `\nMy question: <your question>`;
}
function expertsScreen() {
  const D = XPV.data;
  const head = `<div class="scr-h"><h1>Experts' View</h1></div>
    <section class="panel"><p class="mini">The cards below are <b>AI interpretations of principles these investors have stated publicly</b> – not their words or views. Every fact has a source link; Indian market numbers come from this app's NSE data. Road ahead = scenarios, not predictions. Not investment advice.</p></section>`;
  if (!D) return head + `<p class="sub">${XPV.tried ? "Tonight's brief isn't available." : "Loading…"}</p>`;
  const days = (D.daily || []).map(x => x.date), weeks = (D.weekly || []).map(x => x.date);
  const b = (D.daily || []).find(x => x.date === XPV.d) || (D.daily || [])[0], w = (D.weekly || []).find(x => x.date === XPV.w) || (D.weekly || [])[0];
  const pick = (k, list, cur) => list.length > 1 ? `<label class="fl">${k === "d" ? "Day" : "Week of"}<select data-expick="${k}">${list.map(x => `<option value="${x}"${x === cur ? " selected" : ""}>${esc(dateTxt(x))}</option>`).join("")}</select></label>` : "";
  const brief = b ? `<h2 class="gl">Today's world in brief · ${esc(dateTxt(b.date))}</h2>${pick("d", days, b.date)}
    ${b.limited ? `<p class="t-label sub">Limited sources tonight (official press pages only).</p>` : ""}
    ${(b.factors || []).map(f => `<section class="panel xf"><p class="t-label sub">${esc(f.group)} · ${EXP_DIR[f.dir] || "–"}</p><p class="mline">${esc(f.what)}</p>
      <p class="mini">${esc(f.channel || "")}${(f.sectors || []).length ? ` <span class="sub">· touches ${esc(f.sectors.join(", "))}</span>` : ""}</p>
      <p class="sub">${f.sources.map(u => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))} ›</a>`).join(" · ")}</p></section>`).join("")}
    ${(b.road_ahead || []).length ? `<section class="panel"><h3 class="minor">Road ahead – three scenarios</h3>${b.road_ahead.map(r => `<p class="mline"><b>${EXP_CASE[r.case]}:</b> ${esc(r.story)} <span class="sub">What would signal it: ${esc((r.signals || []).join("; "))}</span></p>`).join("")}<p class="sub">Not investment advice.</p>${guidePanel("experts", b.road_ahead.length)}</section>` : ""}` : `<p class="sub">No daily brief yet.</p>`;
  const lenses = w ? `<h2 class="gl">Through their lenses · week of ${esc(dateTxt(w.date))}</h2>${pick("w", weeks, w.date)}
    ${(w.lenses || []).map(c => `<section class="panel xl"><h3 class="minor">${esc(c.title)}</h3><p class="t-label sub">${esc(c.label)} Based on ${esc(c.basis)}.</p>
      <p class="mline"><b>${esc(c.mood)}</b> – ${esc(c.reason || "")}</p>
      ${(c.watch || []).length ? `<p class="mini"><b>What the principles would watch:</b> ${esc(c.watch.join("; "))}</p>` : ""}
      ${(c.avoid || []).length ? `<p class="mini"><b>What they would avoid:</b> ${esc(c.avoid.join("; "))}</p>` : ""}
      ${c.macro ? `<p class="sub">A market-cycle lens – no stock checklist.</p>` : (c.fits || []).length ? `<p class="mini"><b>Fits the checklist today</b> (this app's investor-lens checks; ties go to the higher Core score): ${c.fits.map(x => { const t = x.n ? `${FMT.count(x.n[0])} of ${FMT.count(x.n[1])} checks` : `${FMT.num(x.score, 0)}%`; const cs = x.core != null ? `, Core ${FMT.num(x.core, 1)}` : "";
        return `${BY[x.s] ? `<a href="${stockHref(x.s)}">${esc(x.s)}</a>` : esc(x.s)} <span class="sub">(${t}${cs})</span>`; }).join(" · ")}</p>` : `<p class="sub">No stock scores 70+ on this checklist tonight.</p>`}
      <p class="sub">${esc(c.note)}</p></section>`).join("")}
    ${(w.agree || []).length || (w.disagree || []).length ? `<section class="panel"><p class="mline"><b>Where they agree:</b> ${esc((w.agree || []).join(" "))}</p><p class="mline"><b>Where they differ:</b> ${esc((w.disagree || []).join(" "))}</p></section>` : ""}` : `<p class="sub">No weekly lenses yet (written on Saturdays).</p>`;
  return head + brief + lenses + `<section class="panel"><h2>Ask Claude</h2><pre class="copybox">${esc(expertsAsk())}</pre>
    <div class="btnrow"><button class="act big" type="button" data-copy="experts">${ic("copy")} Copy</button><span class="mini copied" id="copied-experts" role="status"></span></div></section>`;
}
// ---------- 🔍 mutual-fund X-ray (review #50): your stocks + your funds' disclosed holdings (AMFI monthly portfolios) ----------
let MF = { data: null, tried: false };
function loadMF() { if (MF.tried) return Promise.resolve(MF.data); MF.tried = true;
  return fetch("data/mf/holdings.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null).then(d => { MF.data = d; return d; }); }
function xrayScreen() {
  const funds = USER.funds || [], D = MF.data;
  const stocks = {}; if (USER.tx.length) UL.portfolio(USER.tx, priceOf, PDAY).rows.forEach(r => { if (r.value > 0) stocks[r.sym] = r.value; });
  const X = UL.xray(funds, D ? D.holdings : {}, stocks);
  const g1 = new Set(((S.portfolio || {}).holdings || []).map(h => h.s));
  const sec = {}; X.rows.forEach(r => { const g = GROUP_LABEL(sigGroup(BY[r.s] || {}) || "other"); sec[g] = (sec[g] || 0) + r.pct; });
  return `<button class="back" type="button" data-back="#/portfolio">${ic("back")} Back</button><div class="scr-h"><h1>Mutual fund X-ray</h1></div>
    <p class="sub">What you really own: your stocks plus the stocks inside your funds (from the funds' official monthly portfolio disclosures). Kept only in this browser.</p>
    <form id="fundform" class="panel"><h2>Your funds</h2>${funds.map((f, i) => `<p class="mline">${esc(f.name)} · ${FMT.money(f.amount, 0)} <button class="act" type="button" data-act="fundrm" data-i="${i}">Remove</button></p>`).join("") || `<p class="sub">No funds added yet.</p>`}
      <label class="fl">Fund${D ? `<select name="code">${Object.entries(D.funds || {}).map(([c, n]) => `<option value="${esc(c)}">${esc(n)}</option>`).join("")}</select>` : `<input name="name" placeholder="Fund name">`}</label>
      <label class="fl">Amount (₹)<input name="amount" type="number" inputmode="decimal" min="1" step="1"></label>
      <div class="btnrow"><button class="act big" type="submit">Add fund</button></div></form>
    ${!D ? `<p class="note">Fund holdings arrive once the AMFI portfolio files are in (Actions → "Fetch test fixtures (NSE XBRL + AMFI)", then the nightly). Until then only your stocks are shown.</p>` : `<p class="t-label sub">Fund portfolios as disclosed for ${esc(D.month || "the latest month")} (${esc(D.source || "AMFI / AMC monthly disclosures")}).</p>`}
    ${X.rows.length ? `<section class="panel"><h2>Top 10 combined holdings</h2>${hbars(X.rows.slice(0, 10).map(r => ({ n: (BY[r.s] ? BY[r.s].name : r.s) + (g1.has(r.s) ? " · in v1.0 ghost" : ""), v: r.pct })), "Top holdings")}
      <p class="t-label sub">Overlap with the v1.0 ghost: ${FMT.count(X.rows.filter(r => g1.has(r.s)).length)} stock${X.rows.filter(r => g1.has(r.s)).length === 1 ? "" : "s"}${X.missing ? ` · ${FMT.money(X.missing, 0)} in funds without disclosed holdings yet` : ""}.</p></section>
      <section class="panel"><h2>Sector mix</h2>${hbars(Object.entries(sec).map(([n, v]) => ({ n, v })).sort((a, b) => b.v - a.v), "Sector mix")}</section>` : ""}
    <p class="t-label sub">ELSS funds have a 3-year lock-in, and under the new tax regime ELSS gives no section 80C deduction (incometax.gov.in). A fact, not advice.</p>`;
}
function corePanel(s) {
  const c = s.cr, RU = S.rules || {};
  if (!c) return "";
  const light = c.sc >= 60 ? "green" : c.sc < 40 ? "red" : "yellow";
  const P = { quality: "Quality vs sector", value: "Value", momentum: "Momentum" };
  const fmt = (k, v) => v == null ? "–" : k === "above_200" ? (v ? "yes" : "no") : k === "fscore" ? v + "/9" : k === "pe_own_pct" ? v + "th pct" :
    ["cfo_pat_cum", "de", "pb"].includes(k) ? FMT.times(v, 2) : FMT.pctPlain(v, 1);
  const pill = Object.entries(RU.weights || {}).map(([p, w]) => {
    if (p === "value" && OWNER()) return `<h3 class="minor">Value</h3><p class="mini">${omh()}</p>`;
    const rows = Object.entries(c.in).filter(([k]) => (RU.inputs[k] || [])[0] === p).map(([k, x]) =>
      `<tr><td class="l">${esc(RU.inputs[k][1])}</td><td>${fmt(k, x.v)}</td><td>${x.pct == null ? "missing" : k === "above_200" ? x.pct : x.pct + "th"}</td></tr>`).join("");
    return `<h3 class="minor">${P[p]} ${c.pl[p]}/100 <span class="sub">(weight ${w}%${c.th.includes(p) ? " · thin data: fewer than 2 inputs, set to 50" : ""})</span></h3>
      <div class="tablewrap"><table class="hist"><thead><tr><th>Input</th><th>Value</th><th>Percentile</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join("");
  const pool = (Object.values(c.in).find(x => x.pool) || {}).pool;
  return `<section class="panel"><h2>${DOT[light]} Core score ${c.sc}/100 <span class="sub">Rules ${esc(c.ver)}</span></h2>
    <p class="mini" style="margin:0 0 6px">Quality vs sector${ib("qvsector")} <b>${c.pl.quality}</b> · Value <b>${c.pl.value}</b> · Momentum <b>${c.pl.momentum}</b>${c.pen ? ` · red-flag penalty <b>−${c.pen}</b>` : ""}
      ${c.el ? ` · rank <b>${c.rk} of ${c.of}</b> eligible stocks – <a href="#/ranking">see the list</a>` : ""}</p>
    ${c.el ? "" : `<p class="note">Not in the eligible universe: ${esc(c.wn.join("; "))}.</p>`}
    ${c.gt.length ? `<p class="note">⚠️ ${esc(RU.gate || "Data too thin for the model portfolio")}: ${esc(c.gt.join("; "))}.</p>` : ""}
    ${pfLine(s)}
    ${c.th.length ? `<p class="sub">Thin data: ${c.th.join(", ")}.</p>` : ""}
    <details><summary>Show more: every input and its percentile</summary>
      <p class="sub">Percentiles are within ${esc(pool || "the sector group")} among eligible stocks (sector-neutral; 90th = better than 90% of them).</p>
      ${pill}
      ${c.soft.length ? `<p class="mini">Red-flag penalty −10 each (max −30): ${c.soft.map(esc).join("; ")}.</p>` : ""}
      <p class="sub">${esc(RU.note || "")} The panels below (verdict, fair value, investor lenses, price-move explainer, Quality on Sale) are explanation only: ${esc(RU.exp || "")}.</p>
    </details></section>`;
}

function reopenDcf() {   // after a DCF edit the page is redrawn: keep the valuation details open at the DCF box
  const d = document.getElementById("dg");
  if (!d) return;
  const det = d.closest("details"); if (det) det.open = true;
  d.scrollIntoView({ block: "center" });
}

function movePanel(s) {
  const m = s.v4 && s.v4.mv;
  if (!m) return "";
  const light = m.answer === "overreaction" || m.answer === "market" ? "yellow" : m.answer === "hype" ? "red" : m.fall ? "red" : "green";
  return `<section class="panel"><h2>Why did the price move?${EXP()}</h2>
    <p class="score">${esc(m.text)}</p>
    <p class="mini" style="margin:0 0 6px">${esc(m.label_text)}${m.answer_text ? " · " + esc(m.answer_text) : ""}</p>
    <ul class="mini" style="margin:0;padding-left:18px">${m.reasons.map(r => `<li>${esc(r)}</li>`).join("")}</ul>
    <details><summary>Show more: the numbers</summary>
      <p class="mini">${esc(m.parts)} (window: ${esc(m.window)}, from ${esc(m.from)}).</p>
      <p class="mini">Expected from the market and sector, given this stock's beta: ${m.expected > 0 ? "+" : ""}${m.expected}% · actual ${m.move > 0 ? "+" : ""}${m.move}%.
        ${m.value_chg != null ? `Business change over the same window: normal trailing-12-month profit ${m.value_chg > 0 ? "+" : ""}${m.value_chg}% vs the last annual profit known at the start.` : "Business change: not measurable (no profit history)."}</p>
      <p class="sub">Rules: a move is "just following the market" when the stock's own part is within ±5 points (or under 30% of the move). A fall is justified when the business value fell at least 70% as much as the price, partly 30–70%, an overreaction below 30%. Rises the same way: earned / partly earned / 🎈 hype. Business value is measured by normal trailing profit (a full fair-value recompute at the window start comes later).</p>
    </details>
  </section>`;
}

function renderStock(sym) {
  const s = BY[sym];
  if (!s) return false;
  RECENT.add("v", sym);                                   // review #58: recently viewed
  if (!isFull(s)) {                            // review #36: load data/stock/<SYMBOL>.json first
    SCR().innerHTML = `<button class="back" type="button" data-origin="1">${ic("back")} ${esc(originName())}</button><div class="hero"><h1>${esc(s.name)}${ubadges(s.symbol)}</h1>
      <span class="sub">${esc(s.symbol)} · ${esc(s.industry)}${wideTags(s)}</span>${lvlNum(s.change_pct, inr(s.close), "big num")}</div>
      ${s.__err ? `<p class="sub">🟡 Could not load this stock's details (${esc(s.__err)}). Pull down to refresh.</p>` : `<div class="skel" aria-label="Loading this stock…"><i class="h"></i><i></i><i class="s"></i><i class="b"></i><i class="b"></i></div>`}`;
    if (!s.__err) ensureFull(sym).then(() => { const r = parseHash(); if (r.name === "stock" && r.arg === sym) render(true); });
    return true;
  }
  const chg = s.change_pct == null ? "" : `<span>${chgPill(s.change_pct, 2)} <span class="t-label sub">on the last day (${inr(s.prev_close ?? (s.close / (1 + s.change_pct / 100)))} before)</span></span>`;
  const sigs = s.signals.map(g => `<li class="light-${g.light}"><span aria-label="${g.light}">${DOT[g.light]}</span><span>${esc(g.text)}</span><span class="why">${esc(g.why)}</span></li>`).join("");
  const notes = s.notes.map(n => `<div class="note">⚠️ ${esc(n)}</div>`).join("") +
    (s.splits.length ? `<div class="sub">Splits/bonuses on record (prices adjusted): ${s.splits.map(x => `${dateTxt(x.date)} (×${FMT.num(x.ratio, 2)})`).join(", ")}</div>` : "");
  const t = terms(s).map(([k, v, what, ex]) => `<div class="term"><div class="k"><span>${k}</span><span class="num">${v}</span></div><span>${what}</span><span class="ex">Example: ${ex}</span></div>`).join("");
  const v = SCR();
  // review #29: sections with a sticky jump bar (a section with nothing to show gets no button)
  const ncPanel = t => `<section class="panel"><h2>${t}</h2><p class="sub">Not collected yet for this stock – NSE shareholding, pledges, insider trades, deals, announcements, the decisions timeline and the Company Reader cover the Nifty 500 for now (planned next: Phase B).</p></section>`;
  const owNote = s.ow ? `<div class="note">ℹ️ Outside the Nifty 500: no Core score – the Core score and the paper portfolios cover the Nifty 500 only (Rules v1.x). Verdict, valuation, business health and lenses are computed the same way; business-health percentiles compare it with all ${FMT.count(S.stocks.length)} stocks.</div>` : "";
  const OWN = OWNER();
  const J = [["summary", "Summary", `${owNote}${notes}${storyPanel(s)}${polLine(s)}${glanceRow(s)}${corePanel(s)}${OWN ? omPanel("Verdict, fair value and price move") : bestCardHTML(s, false) + verdictPanel(s) + movePanel(s) + qosPanel(s)}${raceHTML(s)}`],
    ["value", "Fair value", OWN ? omPanel("Fair value", `<p class="mini">The ⭐ main method and the second opinions are still worked out – they show again with the prices.</p>`) : bestCardHTML(s, true) + methodTableHTML(s) + myModelPanel(s) + ladderHTML(s) + vhistHTML(s) + valuationPanel(s)],
    ["statements", "Statements", statementsPanel(s)], ["health", "Health", healthPanel(s) + srcPanel(s) + trendsPanel(s)], ["peers", "Peers", peersPanel(s)], ["investors", "Investors", investorPanel(s)],
    ["owners", "Owners", (invLine(s) ? `<section class="panel" id="tracked"><h2>Tracked investors</h2>${invLine(s)}</section>` : "") + (s.nc ? ncPanel("Owners & management") : ownershipPanel(s))], ["news", "News", s.nc ? ncPanel("Decisions timeline") : timelinePanel(s)],
    ["docs", "Documents", docsPanel(s) + (s.nc ? ncPanel("Company Reader") : readerPanel(s))],
    ["chart", "Chart", OWN ? omPanel("Chart") : (CH_OK() && s.ch ? `<section class="panel"><div class="pc-h"><h2>Chart</h2><a class="act" href="${chartHref(s.symbol)}">${ic("expand")} Full screen</a></div>
      <div id="pcin" class="pcwrap"></div>` : `<section class="panel"><h2>Price over the last year</h2>
      <div class="chart" id="chart" data-chart="Daily close vs 50-day average"></div>${SPLIT ? "" : `<p class="t-label sub">Pro charts (candles, indicators, drawing tools) are on the online page.</p>`}`) + `
      <details><summary>Show more: all the numbers, explained</summary><div class="terms">${t}</div></details>
    </section>
    <section class="panel"><h2>What the price is telling us</h2>
      <p class="tally" style="margin:0 0 10px">${signalTally(s)}</p>
      <ul class="siglist">${sigs}</ul>
    </section>`]].map(([k, nm, html]) => [k, nm, html.trim() ? html : `<section class="panel nodata"><h2>${nm}</h2><p class="sub">No data yet.</p></section>`, !html.trim()]);   // #76 lesson 1: same shelf every time – a tab never disappears
  if (J.map(x => x[0]).join() !== STOCK_TABS.join()) console.warn("stock page tab order differs from STOCK_TABS");
  const metric = (lbl, val, cls = "", sig = "") => `<div><span class="t-label sub">${termLabel(lbl)}</span><span class="num ${cls}">${val}</span>${sig}</div>`;
  const metrics = `<div class="metrics">${[
    s.cr ? metric("Core score", `${scoreRing(s.cr.sc)}${FMT.num(s.cr.sc, 1)}<span class="t-label sub">/100</span>`, "", sigTag("core", s.cr.sc, s)) : metric("Health", s.health_score != null ? `${FMT.num(s.health_score, 0)}<span class="t-label sub">/100</span>` : "–"),
    metric(`Business health${ib("bizhealth")}`, s.quality != null ? `${FMT.num(s.quality, 0)}<span class="t-label sub">/100</span>` : "–", "", sigTag("health", s.quality, s)),
    (s.fund && (s.fund.hidden || []).includes("roce")) ? metric("ROE", FMT.pctPlain(s.roe, 1), "", sigTag("roe", s.roe, s)) : metric("ROCE", FMT.pctPlain(s.roce, 1), "", sigTag("roce", s.roce, s)),
    ...(OWNER() ? ["Valuation", "Price move", "Size"].map(l => metric(l, omh())) : [
    metric("P/E", FMT.ratio(s.pe, 1), "", sigTag("pe", s.pe, s)),
    metric("From 1-yr high", s.os ? osWarn(s) : FMT.pct(s.pct_from_high52, 1), s.os ? "" : FMT.cls(s.pct_from_high52)),
    metric("Market cap", s.mcap_cr != null ? FMT.cr(s.mcap_cr, 0) + sizeTag(s) : "–")])].join("")}</div>`;
  v.innerHTML = `<button class="back" type="button" data-origin="1">${ic("back")} ${esc(originName())}</button>${navStrip(s.symbol)}
    <div class="hero holo"${moodAttr(s.change_pct, 1)} data-tilt data-sk="${esc(skOf(s))}">
      <h1>${esc(s.name)}${ubadges(s.symbol)}</h1>
      <span class="sub">${esc(s.symbol)} · ${esc(s.industry)}${s.iy ? " (industry from Yahoo, unofficial)" : ""} · NSE close on ${dateTxt(s.date)}${wideTags(s)}</span>
      ${OWNER() ? omh("omh-big") : lvlNum(s.change_pct, inr(s.close), "big num") + chg}${qpBar()}${qpSlot(s.symbol)}
      <div class="acts"><button class="act eye" type="button" data-act="owner" aria-pressed="${OWNER()}" aria-label="Business Owner Mode ${OWNER() ? "on – show prices" : "off – hide prices"}">${ic("eye")} ${OWNER() ? "Show prices" : "Owner mode"}</button>${actBtns(s.symbol)}${heldQty(s.symbol) ? `<a class="act" href="#/portfolio/${encodeURIComponent(s.symbol)}">${ic("case")} My holding</a>` : ""}
        ${inWatch(s.symbol) ? `<button class="act" type="button" data-act="alert" data-sym="${esc(s.symbol)}">${ic("signal")} Price alert</button>` : ""}
        <button class="act" type="button" data-act="sharestock" data-sym="${esc(s.symbol)}">${ic("upload")} Share</button></div>
      ${OWNER() ? "" : savedLine(s)}${styleLine(s)}
    </div>
    ${metrics}${s.notes && s.notes.some(n => /old split/.test(n)) ? "" : osNote(s)}
    <nav class="jump" aria-label="Jump to a section">${J.map(([k, nm, , empty]) => `<a href="#/stock/${encodeURIComponent(s.symbol)}" data-jump="j-${k}"${empty ? ' class="nodata" aria-label="' + nm + ' – no data yet"' : ""}>${nm}</a>`).join("")}</nav>
    ${J.map(([k, , html]) => `<div class="jsec" id="j-${k}">${html}</div>`).join("")}`;
  const dsave = document.getElementById("dsave");
  if (dsave) {
    dsave.onclick = () => {
      const g = +document.getElementById("dg").value, ke = +document.getElementById("dk").value, tg = +document.getElementById("dt").value;
      const r = waccJs(s.v4.va.m.dcf.in, ke);
      if (!(r > tg)) { alert("The discount rate (from the cost of equity) must be higher than the terminal growth rate."); return; }
      try { localStorage.setItem("screener.dcf." + s.symbol, JSON.stringify({ g, ke, r, tg })); } catch (e) {}
      resetCache(); renderStock(s.symbol); reopenDcf();
    };
    document.getElementById("dreset").onclick = () => { try { localStorage.removeItem("screener.dcf." + s.symbol); } catch (e) {} resetCache(); renderStock(s.symbol); reopenDcf(); };
  }
  if (document.getElementById("chart")) drawChart(s.symbol);
  if (document.getElementById("pcin")) mountChart(document.getElementById("pcin"), s.symbol, false);
  return true;
}

function drawChart(sym) {
  const el = document.getElementById("chart");
  const hh = histOf(sym) || { dates: [], close: [] };
  const raw = hh.close || [];
  const pts = raw.map((c, i) => [hh.dates[i], c]).filter(p => p[1] != null);
  if (pts.length < 2) { el.innerHTML = `<p class="sub">Not enough price history to draw a chart yet.</p>`; return; }
  const avg = pts.map((p, i) => i >= 49 ? pts.slice(i - 49, i + 1).reduce((a, q) => a + q[1], 0) / 50 : null);
  const W = 380, Hh = 220, L = 4, R = 58, T = 10, B = 24;
  const vals = pts.map(p => p[1]).concat(avg.filter(x => x != null));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
  const x = i => L + (i / (pts.length - 1)) * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (Hh - T - B);
  const path = arr => arr.map((v, i) => v == null ? null : `${FMT.coord(x(i))},${FMT.coord(y(v))}`).filter(Boolean).join(" L");
  // 4 horizontal gridlines at round rupee values
  const step = niceStep((hi - lo) / 4);
  const grid = [];
  for (let g = Math.ceil(lo / step) * step; g <= hi; g += step) grid.push(g);
  // month ticks on the x axis
  const ticks = [];
  let lastM = "";
  pts.forEach((p, i) => { const m = p[0].slice(0, 7); if (m !== lastM) { lastM = m; ticks.push(i); } });
  const tickEvery = Math.ceil(ticks.length / 6);
  const lastI = pts.length - 1, lastAvg = avg[lastI];
  const svg = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Price chart for ${esc(sym)} over the last year">
    ${grid.map(g => `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)" stroke-width="1"/><text x="${W - R + 6}" y="${y(g) + 4}">${inr(g, 0)}</text>`).join("")}
    ${ticks.filter((_, k) => k % tickEvery === 0 && _ > 0).map(i => `<text x="${x(i)}" y="${Hh - 6}" text-anchor="middle">${FMT.month(pts[i][0])}</text>`).join("")}
    ${avg.some(v => v != null) ? `<path data-series="50-day average" d="M${path(avg)}" fill="none" stroke="var(--avg)" stroke-width="2" stroke-linejoin="round"/>` : ""}
    <path data-series="Daily close" d="M${path(pts.map(p => p[1]))}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${x(lastI)}" cy="${y(pts[lastI][1])}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>
    <line id="xh" x1="0" x2="0" y1="${T}" y2="${Hh - B}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/>
    <circle id="xd" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" visibility="hidden"/>
  </svg><div class="tip" id="tip" hidden></div>`;
  el.innerHTML = ktitle(`${kw("Daily close", "var(--accent)")} vs ${kw("50-day average", "var(--avg)")}`, "p") + svg;   // review #61: the title is the legend
  const svgEl = el.querySelector("svg"), tip = el.querySelector("#tip"), xh = el.querySelector("#xh"), xd = el.querySelector("#xd");
  const move = ev => {
    const r = svgEl.getBoundingClientRect();
    const cx = ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width * W;
    const i = Math.max(0, Math.min(lastI, Math.round((cx - L) / (W - L - R) * lastI)));
    const px = x(i), py = y(pts[i][1]);
    xh.setAttribute("x1", px); xh.setAttribute("x2", px); xh.setAttribute("visibility", "visible");
    xd.setAttribute("cx", px); xd.setAttribute("cy", py); xd.setAttribute("visibility", "visible");
    tip.hidden = false;
    tip.style.left = (px / W * r.width) + "px"; tip.style.top = (py / Hh * r.height) + "px";
    tip.innerHTML = `${dateTxt(pts[i][0])}<br>Close <b>${inr(pts[i][1])}</b>${avg[i] != null ? `<br>50-day avg ${inr(avg[i])}` : ""}`;
  };
  const leave = () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); xd.setAttribute("visibility", "hidden"); };
  svgEl.addEventListener("pointermove", move); svgEl.addEventListener("pointerdown", move);
  svgEl.addEventListener("touchmove", move, { passive: true }); svgEl.addEventListener("pointerleave", leave);
}
function niceStep(raw) { const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }


// ---------- Stage 4: settings, verdict, valuation ----------
// Settings live in this browser only. OFF = still shown, but not counted in the verdict.
const PARTS = [
  ["biz", "Business quality", "Stage 2 business-health score (sector percentiles). Weight 50 in the quality score."],
  ["lens", "Investor lenses", "Share of the 10 lenses' non-price checks passed. Weight 25."],
  ["veto", "Red-flag veto", "Hard red flags force Avoid (SEBI order, auditor resigned mid-term, pledge > 25%, negative net worth, weak cash + high accruals, distress + interest cover < 1.5). Caution flags (promoter stake drop, CFO churn, weak cash or distress alone) cost 10 quality points each and cap the verdict at Hold."],
  ["val", "Valuation", "Consensus fair value from the methods suited to the sector. OFF = no Buy, Accumulate or Trim from price."],
  ["mom", "Momentum", "Buy needs price above the 200-day average, or a 12-1 month return in the top half of its sector."],
  ["own", "Ownership", "Promoter holding, pledge and promoter buying/selling (weight 10), and ownership red flags."],
  ["tl", "Decisions timeline", "Stage 3 decisions sub-score (weight 15)."],
  ["mgmt", "Management credibility", "Stage 5 – promises vs delivery. Not built yet, so nothing is counted.", true],
  ["docs", "Document signals", "Stage 5a – the Company Reader block on the stock page shows concall/annual-report signals, but they are NOT counted (OFF) until Karma has reviewed 20+ stocks (Stage 5b).", true],
  ["scen", "Future scenarios", "Stage 5 – bull/base/bear tracker. Not built yet.", true],
];
const DEFAULTS = Object.assign({ master: true, vmode: "auto", gauge: true, signals: true }, Object.fromEntries(PARTS.map(p => [p[0], true])));
let SET = (() => { try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem("screener.settings.v1") || "{}")); } catch (e) { return Object.assign({}, DEFAULTS); } })();
const saveSet = () => { try { localStorage.setItem("screener.settings.v1", JSON.stringify(SET)); } catch (e) {} };
const partsOff = () => PARTS.filter(p => !p[3] && !SET[p[0]]).length;
const VG = { buy: ["🟢", "Buy"], acc: ["🟡", "Accumulate"], hold: ["⚪", "Hold"], trim: ["🟠", "Trim"], avoid: ["🔴", "Avoid / Sell"] };
// review #70: the group meanings and the Rules v1.0 thresholds come from ONE place – pipeline/verdict_rules.py (S.rules.verdict)
const VR = () => (S.rules || {}).verdict || { meaning: {}, names: {}, order: ["avoid", "trim", "hold", "acc", "buy"] };     // an older page: no thresholds → no ladder
const VG_HELP = new Proxy({}, { get: (_, k) => VR().meaning[k] || "" });
const WEIGHTS = { biz: 50, lens: 25, tl: 15, own: 10 };

// User-edited DCF assumptions (per stock, this browser only)
function userDcf(sym) { try { return JSON.parse(localStorage.getItem("screener.dcf." + sym) || "null"); } catch (e) { return null; } }
function dcfEV(fcf, g, r, tg) {
  if (r <= tg) return null;
  let pv = 0, f = fcf;
  for (let y = 1; y <= 10; y++) { const gy = y <= 5 ? g : g + (tg - g) * (y - 5) / 5; f *= 1 + gy / 100; pv += f / Math.pow(1 + r / 100, y); }
  return pv + f * (1 + tg / 100) / (r / 100 - tg / 100) / Math.pow(1 + r / 100, 10);
}
const median = a => { const b = [...a].sort((x, y) => x - y); const n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : null; };
// Valuation with the user's DCF edits applied (or the pipeline's own, if none)
function val(s) {
  const va = s.v4 && s.v4.va;
  if (!va) return null;
  const u = userDcf(s.symbol), d = (va.m || {}).dcf;          // slim list rows have no method list (review #36)
  if (!u || !d || d.s !== "ok" || !d.in) return va;      // slim list row: DCF inputs load with the stock page
  const i = d.in, ps = ev => ev == null ? null : (ev - i.nd_cr) / i.mc_cr * s.close;
  if (u.ke != null) u.r = waccJs(i, u.ke);           // edited cost of equity -> discount rate (weighted with debt)
  const nd = JSON.parse(JSON.stringify(va));
  const cap = i.cap || 25;
  const b = ps(dcfEV(i.fcf_cr, u.g, u.r, u.tg)), lo = ps(dcfEV(i.fcf_cr, Math.max(0, u.g - 5), u.r + 1, u.tg)), hi = ps(dcfEV(i.fcf_cr, Math.min(cap, u.g + 3), Math.max(u.r - 1, u.tg + 1), u.tg));
  nd.m.dcf = Object.assign({}, d, { b, lo: Math.min(lo ?? b, b), hi: Math.max(hi ?? b, b), user: true });
  if (b == null || b <= 0) nd.m.dcf.s = "na";
  const counted = (nd.pl || []).filter(k => nd.m[k] && nd.m[k].s === "ok"), voters = (nd.pl || []).filter(k => nd.m[k] && (nd.m[k].s === "ok" || nd.m[k].s === "vote"));
  nd.ct = counted;
  nd.vo = { cheap: 0, fair: 0, dear: 0 };
  voters.forEach(k => { const m = nd.m[k]; if (m.s === "ok") m.v = s.close < m.b * 0.9 ? "cheap" : s.close > m.b * 1.1 ? "dear" : "fair"; nd.vo[m.v]++; });
  const FAM = nd.fm || {};
  nd.nv = voters.length;
  if (counted.length) {
    nd.fair = median(counted.map(k => nd.m[k].b));
    nd.low = Math.min(median(counted.map(k => nd.m[k].lo)), nd.fair); nd.high = Math.max(median(counted.map(k => nd.m[k].hi)), nd.fair);
    nd.gap = (s.close / nd.fair - 1) * 100;
    // agreement: share of counted methods within ±25% of the consensus (>= 70% High, 50-70% Medium); data depth caps it
    const bs = counted.map(k => nd.m[k].b);
    nd.agree_n = bs.filter(x => Math.abs(x / nd.fair - 1) <= 0.25).length;
    nd.n_counted = bs.length; nd.enough = bs.length >= 3; nd.agree = Math.round(nd.agree_n / bs.length * 100);
    // review #3: each family's median says cheap (<90%), dear (>110%) or fair; families conflict = one cheap + one dear
    const byF = {};
    counted.forEach(k => { (byF[FAM[k]] = byF[FAM[k]] || []).push(nd.m[k].b); });
    nd.fs = {};
    Object.entries(byF).forEach(([f, vs]) => { const mv = median(vs); nd.fs[f] = { value: mv, n: vs.length, state: s.close < mv * 0.9 ? "cheap" : s.close > mv * 1.1 ? "dear" : "fair" }; });
    const st = new Set(Object.values(nd.fs).map(x => x.state));
    nd.cx = st.has("cheap") && st.has("dear");
    nd.cs = nd.fs.cash ? nd.fs.cash.state : null;
    let c = (!nd.enough || nd.cx) ? "Low" : nd.agree >= 70 ? "High" : "Medium";
    // review #4 views: absolute (cash-flow family) vs relative (multiples); confidence per mode
    const view = keys => { if (!keys.length) return null; const vs = keys.map(k => nd.m[k].b), mv = median(vs);
      return { value: mv, gap: (s.close / mv - 1) * 100, n: vs.length, state: s.close < mv * 0.9 ? "cheap" : s.close > mv * 1.1 ? "dear" : "fair",
        agree: Math.round(vs.filter(x => Math.abs(x / mv - 1) <= 0.25).length / vs.length * 100),
        cheap_share: Math.round(keys.filter(k => nd.m[k].v === "cheap").length / keys.length * 100) }; };
    nd.ab = view(counted.filter(k => FAM[k] === "absolute")); nd.rl = view(counted.filter(k => FAM[k] === "relative"));
    const A = nd.ab, R = nd.rl, cx2 = !!(A && R && ((A.state === "cheap" && R.state === "dear") || (A.state === "dear" && R.state === "cheap")));
    nd.cmdU = { strict: (!A || !R || R.n < 2 || cx2) ? "Low" : (A.n >= 2 && A.agree >= 70 && R.state !== "dear") ? "High" : "Medium",
                balanced: (!R || R.n < 2 || (A && s.close > 1.3 * A.value)) ? "Low" : (R.n >= 3 && R.agree >= 70) ? "High" : "Medium" };
    if (c === "High" && s.v4.cm === "Medium") c = "Medium";
    nd.confidence = c;
  }
  nd.user = true;
  return nd;
}

function waccJs(i, ke) {
  const e = i.mc_cr || 0, d = i.debt_cr || 0;
  return e + d > 0 ? Math.round((ke * e + (i.kd || 6.68) * d) / (e + d) * 100) / 100 : ke;
}

// The verdict rules – the same as pipeline/stage4.py decide(), but using this browser's switches
function decideJs(v, va, q0, flags, mode, margin) {
  const hard = flags.filter(f => f.hard !== false), soft = flags.filter(f => f.hard === false);
  const q = q0 == null ? null : q0 - 10 * soft.length;          // each caution flag costs 10 quality points
  const trimAt = v.hy ? 20 : 30;
  let cm = va ? ((va.user ? va.cmdU : va.cmd) || {})[mode] || va.confidence : "Low";
  if (cm === "High" && v.cm === "Medium") cm = "Medium";
  let g, lb;
  if (hard.length) [g, lb] = ["avoid", "Avoid – serious red flag"];
  else if (q == null) [g, lb] = ["hold", "Hold – not enough data to judge"];
  else if (q0 < 50) [g, lb] = ["avoid", "Avoid – weak business"];
  else if (q < 50) [g, lb] = ["hold", "Hold – cautions to check"];   // caution flags never push a stock into Avoid
  else if (!SET.val || !va || va.fair == null) [g, lb] = q >= 70 ? ["hold", "Hold – good business, price not checked"] : ["hold", "Hold – average business"];
  else if (va.enough === false) [g, lb] = ["hold", "Hold – not enough agreement (fewer than 3 valuation methods)"];
  else if (va.gap > trimAt) [g, lb] = ["trim", "Trim – price far above fair value" + (v.hy && va.gap <= 30 ? " (hype-driven rise)" : "")];
  else if (q >= 70) {
    const A = va.ab, R = va.rl;
    let cheap, whyNot = null;
    if (mode === "strict") {
      cheap = !!(A && A.gap <= -margin);
      if (cheap) whyNot = R && R.state === "dear" ? "the relative view says expensive" : cm === "Low" ? "methods disagree" : null;
    } else {
      cheap = !!(R && R.gap <= -margin && (R.cheap_share || 0) >= 60);
      if (cheap) whyNot = A && s_price(va) > 1.3 * A.value ? "the price is more than 1.3× the cash-flow value" : cm === "Low" ? "methods disagree" : null;
    }
    if (cheap && !whyNot) [g, lb] = (v.mo.ok || !SET.mom) ? ["buy", "Buy"] : ["acc", "Good but wait – price still weak"];
    else if (cheap) [g, lb] = ["acc", "Accumulate – cheap, but " + whyNot];
    else if (va.gap <= 15) [g, lb] = ["acc", va.gap >= -15 ? "Accumulate" : "Accumulate – cheap, but not all methods agree"];
    else [g, lb] = ["hold", "Hold – good company at full price"];
  } else [g, lb] = ["hold", "Hold – average business"];
  // review #5: an unconfirmed profit spike caps Buy at Accumulate (2 later quarters must hold the new profit level)
  if (v.sk && !v.sk.ok && g === "buy") [g, lb] = ["acc", "Accumulate – profit spike, wait for 2 more quarters to confirm"];
  if (soft.length && (g === "buy" || g === "acc")) [g, lb] = ["hold", "Hold – caution: " + soft[0].t.split(" (")[0].split(" – ")[0].replace(/\.$/, "")];
  if (v.ex && (g === "buy" || g === "acc")) [g, lb] = ["hold", "Hold – left out of verdicts (NSE surveillance or too thinly traded)"];
  return { g, lb, q, conf: cm };
}
const s_price = va => va.price;
const gaugeMargin = () => (SET.gauge !== false && S.stage4.gauge && S.stage4.gauge.ok) ? S.stage4.gauge.margin : 25;
// review #5: show the gap of the view the verdict actually used (Strict = absolute value, Balanced = relative value)
const VIEWN = { strict: ["🛡️ Strict view", "absolute value", "ab"], balanced: ["⚖️ Balanced view", "relative value", "rl"] };
function usedViews(v) {
  const va = v && v.va;
  if (!va || va.fair == null) return null;
  const mk = md => { const [nm, what, k] = VIEWN[md], x = va[k]; return x && x.value ? { md, nm, what, value: x.value, gap: x.gap } : null; };
  const main = mk(v.mode) || { md: v.mode, nm: VIEWN[v.mode][0], what: "consensus fair value", value: va.fair, gap: va.gap, fb: true };
  return { main, other: mk(v.mode === "strict" ? "balanced" : "strict") };
}
const viewTxt = u => `${u.nm}: ${FMT.pctPlain(Math.abs(u.gap), 0)} ${u.gap < 0 ? "below" : "above"} ${u.what} ${inr(u.value, 0)}`;

function verdictFor(s) {
  const v = s.v4;
  if (!v) return null;
  let tot = 0, w = 0;
  for (const k in WEIGHTS) if (SET[k] && v.pt[k] != null) { tot += v.pt[k] * WEIGHTS[k]; w += WEIGHTS[k]; }
  const q0 = w >= 40 ? Math.round(tot / w) : null;
  const flags = v.rf.filter(f => SET.veto && (f.c !== "own" || SET.own));
  const va = val(s);
  if (va) va.price = s.close;
  const auto = v.md || "balanced";
  const mode = SET.vmode === "strict" || SET.vmode === "balanced" ? SET.vmode : auto;
  const margin = gaugeMargin();
  const both = { strict: decideJs(v, va, q0, flags, "strict", margin), balanced: decideJs(v, va, q0, flags, "balanced", margin) };
  const r = both[mode];
  return { g: r.g, lb: r.lb, q: r.q, flags, va, conf: r.conf, mode, auto, both, margin, off: partsOff() };
}
const VCACHE = new Map();
const vfor = s => { if (!VCACHE.has(s.symbol)) VCACHE.set(s.symbol, verdictFor(s)); return VCACHE.get(s.symbol); };
const resetCache = () => VCACHE.clear();
S.stocks.forEach(s => {   // query-box fields that follow the settings
  Object.defineProperty(s, "q_quality", { get: () => { const v = vfor(s); return v ? v.q : null; } });
  Object.defineProperty(s, "q_mos", { get: () => { const v = vfor(s); return v && v.va && v.va.fair ? (1 - s.close / v.va.fair) * 100 : null; } });
});

function verdictBadge(s, compact) {
  if (!SET.master) return "";
  const v = vfor(s);
  if (!v) return compact ? "" : `<p class="sub">No verdict: no financial data.</p>`;
  const [ic] = VG[v.g];
  if (compact === "tiny") return `<li class="vline v-${v.g}"><span class="dot">${ic}</span><span><b>${esc(v.lb)}</b>${v.q != null ? ` · quality ${FMT.num(v.q, 0)}/100` : ""}${dqChip(s)}</span></li>`;   // review #41: one line in result rows
  const uv = usedViews(v);
  const fv = uv ? ` · ${esc(viewTxt(uv.main))}` : "";
  const under = uv ? `<br><span class="sub">${uv.other ? esc(viewTxt(uv.other)) + " · " : ""}consensus ${inr(v.va.fair, 0)} (${FMT.pct(v.va.gap, 0)})</span>` : "";
  return `<li class="vline v-${v.g}"><span class="dot">${ic}</span><span><b>${esc(v.lb)}</b>${v.q != null ? ` · quality ${v.q}/100` : ""}${fv}${v.off ? ` · <i>${v.off} part${v.off > 1 ? "s" : ""} off</i>` : ""}${dqChip(s)}${under}</span></li>`;
}

function gaugeLine() {
  const G = S.stage4.gauge;
  if (!G || !G.ok) return "";
  const m = SET.gauge !== false ? G.margin : 25;
  if (G.partial) return `<p class="sub" style="margin:0">📊 <b>Market gauge: neutral</b> – not enough history yet (${G.years} yrs) – full gauge after Stage 6. The typical Nifty 500 PE (${G.pe}) would read “${G.state}” against ${G.from}–${G.to}, but that stretch is too short to trust, so a Buy needs the normal ${m}% margin of safety${SET.gauge === false ? " (gauge switched off)" : ""}. A short history may only tighten the margin, never relax it.</p>`;
  return `<p class="sub" style="margin:0">📊 <b>Market gauge: ${G.state}</b> – the typical Nifty 500 PE (${G.pe}) is cheaper than ${100 - G.pctile}% of months since ${G.from}, so a Buy needs a ${m}% margin of safety${SET.gauge === false ? " (gauge switched off)" : ""}.</p>`;
}

// ---------- home: model portfolios (paper) – review #16 Round 2, two ghosts + Nifty 500 TRI since review #27 ----------
// Lines: v1.0 and v1.1 NAV (each starts at ₹10 lakh on its own first day) and the Nifty 500 TRI as ₹10 lakh put in on
// v1.0's first day (Nifty 500 price index if TRI is missing). x = calendar of both logs.
function navChart(a, b) {
  const sa = (a && a.series) || [], sb = (b && b.series) || [];
  const days = [...new Set([...sa, ...sb].map(r => r.d))].sort();
  if (days.length < 2) return "";
  const ref = sa.length ? sa : sb, bk = ref.some(r => (r.b || {})["NIFTY 500 TRI"] != null) ? "NIFTY 500 TRI" : "NIFTY 500";
  const by = (ser, f) => Object.fromEntries(ser.map(r => [r.d, f(r)]));
  const L = [
    {k: "v1.0", col: "var(--accent)", dash: "", v: by(sa, r => r.nav)},
    {k: "v1.1", col: "var(--v11)", dash: "", v: by(sb, r => r.nav)},
    {k: bk, col: "var(--avg)", dash: ' stroke-dasharray="5 3"', v: by(ref, r => (r.b || {})[bk])},
  ];
  const all = L.flatMap(l => Object.values(l.v)).filter(v => v != null);
  if (!all.length) return "";
  const W = 340, H = 130, P = 4, lo = Math.min(...all), hi = Math.max(...all);
  const sx = i => P + i * (W - 2 * P) / (days.length - 1), sy = v => H - P - (v - lo) / ((hi - lo) || 1) * (H - 2 * P);
  const line = l => `<polyline data-series="${l.k === "v1.0" ? "Rules v1.0" : l.k === "v1.1" ? "Rules v1.1" : (l.k === "NIFTY 500 TRI" ? "Nifty 500 TRI" : "Nifty 500")}" fill="none" stroke="${l.col}" stroke-width="2"${l.dash} points="${days.map((d, i) => l.v[d] == null ? "" : `${FMT.coord(sx(i))},${FMT.coord(sy(l.v[d]))}`).join(" ")}"/>`;
  const bn = bk === "NIFTY 500 TRI" ? "Nifty 500 TRI" : "Nifty 500";
  return `<figure class="navfig" data-chart="Model portfolios">${ktitle(`${a ? kw("Rules v1.0", "var(--accent)") : ""}${a && b ? " vs " : ""}${b ? kw("Rules v1.1", "var(--v11)") : ""} vs ${kw(bn, "var(--avg)", { dash: 1 })} <span class="t-label sub">(same ₹10 lakh)</span>`, "p")}
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Model portfolios v1.0 and v1.1 vs ${bn}" style="width:100%;height:auto;margin:6px 0">${L.filter(l => Object.values(l.v).some(x => x != null)).slice().reverse().map(line).join("")}</svg></figure>`;
}

function portfolioHome() {
  const p = S.portfolio, q = S.portfolio_v1_1, r12 = S.portfolio_v1_2;   // review #71: v1.2 = verdicts on the best-suited method
  if (!p || !SET.master) return "";   // review #20: the master switch hides the model portfolio too
  const st = p.stats || {}, sq = (q && q.stats) || {}, s12 = (r12 && r12.stats) || {}, inr0 = v => FMT.money(v, 0);
  const pc = v => v == null ? "–" : (v >= 0 ? "+" : "") + v + "%";
  const tri = s => s.bench_ret ? (s.bench_ret["NIFTY 500 TRI"] != null ? s.bench_ret["NIFTY 500 TRI"] : null) : null;
  const names = (p.holdings || []).map(h => `<li><a href="${stockHref(h.s)}">${esc(h.s)}</a> <span class="sub">${h.ret >= 0 ? "+" : ""}${h.ret}%${h.since !== st.started ? " since " + dateTxt(h.since) : ""}</span></li>`).join("");
  const pendTxt = (x, tag) => x && x.pending ? `<p class="sub">${tag}: waiting for the next trading day's close – ${esc(x.pending.kind)} signalled ${dateTxt(x.pending.signal)}${x.pending.targets ? ` – ${x.pending.targets.length} stocks: ${x.pending.targets.map(esc).join(", ")}` : ""}${(x.pending.orders || []).length ? ` – exits: ${x.pending.orders.map(o => esc(o.sym)).join(", ")}` : ""}.</p>` : "";
  // v1.1 in one line: how its holdings differ from v1.0's
  let diff = "";
  if (q && (q.holdings || []).length && (p.holdings || []).length) {
    const A = new Set(p.holdings.map(h => h.s)), B = new Set(q.holdings.map(h => h.s));
    const plus = [...B].filter(s => !A.has(s)), minus = [...A].filter(s => !B.has(s));
    diff = `<p class="mini">Rules v1.1 holds ${B.size - plus.length} of the same stocks${plus.length ? `; instead of ${minus.map(esc).join(", ")} it holds ${plus.map(esc).join(", ")} (bigger companies – at least 10 of 20 from the top 100 by market cap)` : ""}.</p>`;
  }
  const row = (nm, s, x) => s.started
    ? `<tr><td class="l">${nm}<br><span class="sub">since ${dateTxt(s.started)}</span></td><td><b>${pc(s.ret)}</b><br><span class="sub">${inr0(s.nav)}</span></td><td>${pc(tri(s))}</td><td>${s.max_dd}%</td></tr>`
    : `<tr><td class="l">${nm}</td><td colspan="3" class="sub">${x && x.pending ? "starts at the next trading day's close" : "starts at its first nightly run on main"}</td></tr>`;
  const table = `<div class="tablewrap"><table class="hist pf2 noterm"><thead><tr><th class="l">Paper ₹10 lakh</th><th>Return</th><th>Nifty 500 TRI ${ib("tri")} <span class="sub">same days</span></th><th>Biggest fall ${ib("drawdown")}</th></tr></thead><tbody>
      ${row("Rules v1.0", st, p)}${q ? row("Rules v1.1", sq, q) : ""}${r12 ? row("Rules v1.2", s12, r12) : ""}</tbody></table></div>`;
  const stops = [st.started ? `v1.0: ${esc(st.stop.text)}` : "", sq.started ? `v1.1: ${esc(sq.stop.text)}` : "", s12.started ? `v1.2: ${esc(s12.stop.text)}` : ""].filter(Boolean).join("<br>");
  const head = st.started || sq.started
    ? `${navChart(st.started ? st : null, sq.started ? sq : null)}${table}${stops ? `<p class="mini">${stops}</p>` : ""}`
    : `<p class="sub">Starts at the first nightly run after the merge: tonight's top 20 by Core score are bought at the next trading day's close with a notional ₹10,00,000 – Rules v1.0 and, next to it, Rules v1.1.</p>`;
  return `<div class="mood"><h2>v1.0, v1.1${r12 ? " and v1.2" : ""} vs Nifty 500 TRI <span class="sub">(paper)</span></h2>
    ${head}
    ${names ? `<p class="mini"><b>Rules v1.0 holds:</b></p><ol class="mini pfl">${names}</ol>` : ""}
    ${diff}
    ${pendTxt(p, "Rules v1.0")}${pendTxt(q, "Rules v1.1")}${pendTxt(r12, "Rules v1.2")}
    ${r12 ? `<p class="mini">Rules v1.2 (new method test): the same money, costs, rebalance days and next-close prices as v1.0, but it picks only stocks whose v1.2 verdict – on the best-suited method's value – is Buy or Accumulate; fewer than 20 such stocks leave the rest in cash. It started on the first nightly run on main after the merge – nothing is back-filled. <a href="#/learn/rules_v12">What Rules v1.2 is ›</a></p>` : ""}
    <details><summary>Show more: rules, benchmarks, costs</summary>
      ${st.started ? `<p class="mini"><b>Rules v1.0</b></p><table class="hist noterm"><tbody>${Object.entries(st.bench_ret).map(([k, v]) => `<tr><td class="l">${esc(p.bench_names[k] || k)}</td><td>${pc(v)}</td></tr>`).join("")}
        <tr><td class="l">Model portfolio</td><td><b>${pc(st.ret)}</b></td></tr><tr><td class="l">Max drawdown</td><td>${st.max_dd}%</td></tr>
        <tr><td class="l">Turnover since start</td><td>${st.turnover}%</td></tr><tr><td class="l">Costs paid</td><td>${inr0(st.costs)}</td></tr></tbody></table>` : ""}
      ${sq.started ? `<p class="mini"><b>Rules v1.1</b></p><table class="hist noterm"><tbody><tr><td class="l">Model portfolio</td><td><b>${pc(sq.ret)}</b></td></tr><tr><td class="l">Max drawdown</td><td>${sq.max_dd}%</td></tr>
        <tr><td class="l">Turnover since start</td><td>${sq.turnover}%</td></tr><tr><td class="l">Costs paid</td><td>${inr0(sq.costs)}</td></tr></tbody></table>` : ""}
      <p class="sub">Rules ${esc(p.rules)}: top 20 eligible stocks by Core score, 5% each, at most 3 per sector group; rebalanced on the first trading day of Jan, Apr, Jul and Oct. A holding stays while it is in the top 30% (rank ${p.exit_rank} of ${p.eligible}); a hard red flag or a Company Reader hard document flag sells it at the next close. Costs 0.10% a side + 0.10–0.30% slippage (PROXY). Every trade happens at the next trading day's close and the daily log is never edited.</p>
      ${q ? `<p class="sub">Rules v1.1 = v1.0 + one rule: at least 10 of the 20 picks come from the 100 biggest Nifty 500 companies by market cap. In the 2012–2026 backtest: v1.0 14.9% a year (biggest fall −52%), v1.1 16.73% (−41.2%), Nifty 500 TRI 13.79% (−38.2%). A backtest is not a promise – that is why both run on paper first. Same costs, same stop rule.</p>` : ""}
      <p class="sub">Benchmarks: ${esc(p.bench_note)}. The stop rule compares with the Nifty 500 price index, as frozen in Rules v1.0. ${p.note ? "Note: " + esc(p.note) + "." : ""}</p>
    </details></div>`;
}

// ---------- home: "What the past 4 years say" – early signal test (review #16 Round 3, docs/research/signal-test.md) ----------
function pastHome() {
  const t = S.signaltest;
  if (!t) return "";
  const sg = n => FMT.points(n, 1);
  const cell = (k, h) => {
    const s = (t.table[k] || {})[h], vb = (t.vs_base[k] || {})[h];
    if (!s) return "<td>–</td>";
    if (k === "baseline") return `<td>${sg(s.mean)}<br><span class="sub">vs Nifty</span></td>`;
    if (!vb) return "<td>–</td>";
    const dot = vb.lo > 0 ? "🟢" : vb.hi < 0 ? "🔴" : "⚪";
    return `<td>${dot} ${sg(vb.diff)}<br><span class="sub">${sg(vb.lo)} to ${sg(vb.hi)}</span></td>`;
  };
  const rows = Object.entries(t.signals).map(([k, nm]) => `<tr><td class="l">${esc(nm)}</td>${cell(k, "63")}${cell(k, "252")}</tr>`).join("");
  const p = t.replay || {}, a = t.replay_all || {};
  return `<div class="mood"><h2>What the past 4 years say <span class="exp">early test</span></h2>
    <p class="sub">${esc(t.label)} Nothing here changes a rule. Baseline row: how far random stocks from today's list beat Nifty 500 (points) – the survivorship lift.</p>
    <details><summary>Show more: 5 price signals vs random stocks, and a momentum-only replay</summary>
      <p class="sub">Each number is how many percentage points stocks with that signal did <b>better than random stocks from the same list in the same months</b> (after Nifty 500). Example: +2 over 3 months on ₹1,00,000 = about ₹2,000 more than a random pick. 🟢 clearly better · 🔴 clearly worse · ⚪ no clear difference (the range below includes 0).</p>
      <table class="hist noterm" style="width:100%;table-layout:fixed"><thead><tr><th class="l" style="width:46%">Signal</th><th>3 months</th><th>12 months</th></tr></thead><tbody>${rows}</tbody></table>
      ${p.cagr != null ? `<p class="sub">Momentum-only top 20, rebalanced every quarter (${dateTxt(p.from)} → ${dateTxt(p.to)}): <b>${sg(p.cagr)}% a year</b> vs ${sg(a.cagr)}% for all of today's list (equal weight) and ${sg(p.nifty_cagr)}% for Nifty 500. Worst fall ${p.max_dd}% vs ${a.max_dd}% and ${p.nifty_max_dd}%. Momentum is the signal most flattered by survivorship (stocks that rose into the index are in the list), and 12 quarters can be luck.</p>` : ""}
      <p class="sub">Made ${dateTxt(t.made)}. Full tables: docs/research/signal-test.md.</p>
    </details></div>`;
}

function settingsPanel() {
  const row = ([k, nm, help, later]) => `<label class="sw${later ? " later" : ""}"><input type="checkbox" data-set="${k}" ${SET[k] ? "checked" : ""} ${later || !SET.master ? "disabled" : ""}><span><b>${nm}</b><br><span class="sub">${help}</span></span></label>`;
  return `<details class="panel settings" id="settings"><summary>⚙️ Settings: what counts in the verdict${partsOff() ? ` (${partsOff()} off)` : ""}</summary>
    <label class="sw master"><input type="checkbox" data-set="master" ${SET.master ? "checked" : ""}><span><b>Show verdicts</b><br><span class="sub">Master switch. OFF hides every Buy/Hold/Sell label and the model portfolio everywhere.</span></span></label>
    ${PARTS.map(row).join("")}
    <div class="sw"><span><b>Valuation mode</b><br><span class="sub">Which Buy rule to use. Auto picks per stock: 🛡️ Strict (absolute, cash-flow value) for risky businesses, ⚖️ Balanced (relative value, checked against cash flow) for steady ones. Adaptive rules not yet backtested (Stage 6).</span><br>
      ${[["auto", "Auto"], ["strict", "Always Strict"], ["balanced", "Always Balanced"]].map(([k, nm]) => `<label style="margin-right:10px"><input type="radio" name="vmode" data-set="vmode" value="${k}" ${SET.vmode === k ? "checked" : ""} ${!SET.master ? "disabled" : ""}> ${nm}</label>`).join("")}</span></div>
    <label class="sw"><input type="checkbox" data-set="signals" ${SET.signals !== false ? "checked" : ""}><span><b>Show signals</b><br><span class="sub">A dot and a word after a number (Good · OK · Weak) from its sector's reference range – tap it for the range. Display only.</span></span></label>
    <label class="sw"><input type="checkbox" data-set="gauge" ${SET.gauge !== false ? "checked" : ""} ${!SET.master ? "disabled" : ""}><span><b>Market gauge</b><br><span class="sub">When the whole market is expensive the Buy margin tightens to 30%; when cheap it relaxes to 20% (else 25%) – but only with 7+ years of history; until Stage 6 it can only tighten. Never relaxes red-flag vetoes.</span></span></label>
    <p class="sub">OFF = still shown on the stock page, but not counted. Saved in this browser only.</p>
    <button class="chip" type="button" id="reset-set">Reset to default</button>
  </details>`;
}

// ---------- stock page: verdict ----------
const PART_OF = { biz: "biz", lens: "lens", tl: "tl", own: "own", val: "val", mom: "mom", veto: "veto" };
function verdictPanel(s) {
  if (!SET.master) return "";
  const v = vfor(s), x = s.v4;
  if (!v) return "";
  const [ic, nm] = VG[v.g];
  const rs = x.rs.filter(r => SET[PART_OF[r.p]] !== false);
  const pos = rs.filter(r => r.s === "+"), neg = rs.filter(r => r.s !== "+");
  const pl = Object.entries(WEIGHTS).map(([k, w]) => `<tr><td>${PARTS.find(p => p[0] === k)[1]}</td><td>${x.pt[k] ?? "–"}</td><td>${w}</td><td>${SET[k] ? (x.pt[k] == null ? "missing" : "counted") : "OFF"}</td></tr>`).join("");
  const conf = v.conf || x.cf;
  return `<section class="panel verdict v-${v.g}">
    <p class="vbig">${ic} <b>${esc(v.lb)}</b>${VEXP()}</p>
    <p class="mini" style="margin:0 0 6px">🛡️ Strict view: <b>${esc(v.both.strict.lb)}</b> · ⚖️ Balanced view: <b>${esc(v.both.balanced.lb)}</b><br>
      Using: <b>${v.mode === "strict" ? "🛡️ Strict" : "⚖️ Balanced"}</b> (${SET.vmode === "auto" ? esc((x.mw || []).join(", ")) : "set in ⚙️ Settings"}) · Buy margin ${v.margin}% · <i>${SB() ? (SB().pass ? "tested in Stage 6b" : "Stage 6b backtest: did not pass – see ☰ More") : "adaptive rules not yet backtested (Stage 6)"}</i></p>
    ${(uv => uv ? `<p style="margin:0 0 6px">📏 <b>${esc(viewTxt(uv.main))}</b> (the gap this verdict used)${uv.other ? `<br><span class="sub">${esc(viewTxt(uv.other))} · consensus of all methods ${inr(v.va.fair, 0)} (${FMT.pct(v.va.gap, 0)})</span>` : ""}</p>` : "")(usedViews(v))}
    ${x.sk ? `<p class="note">🟡 Profit spike (${x.sk.factor}× normal): ${x.sk.ok ? "the new level is confirmed – " + esc(x.sk.why || "") : "Buy is capped at Accumulate until 2 more quarters confirm the new profit level. " + esc(x.sk.why || "")}</p>` : ""}
    <p class="sub" style="margin:0 0 10px">Business health <b>${v.q ?? "–"}/100</b> · confidence <b>${conf}</b>${x.cw.length ? ` (${esc(x.cw.join("; "))})` : ""}${v.off ? ` · <b>Verdict with ${v.off} part${v.off > 1 ? "s" : ""} off</b>` : ""}</p>
    ${x.wc ? `<p class="note">↻ ${esc(x.wc)}</p>` : ""}
    <h3 class="minor">Why – top ${rs.length} reasons</h3>
    <ul class="siglist">${rs.map(r => r.s === "+" ? `<li class="light-green"><span>👍</span><span>${esc(r.t)}</span></li>` :
      `<li class="light-${r.t.startsWith("🔴") ? "red" : "yellow"}"><span>${r.t.startsWith("🔴") ? "⛔" : "⚠️"}</span><span>${esc(r.t.replace(/^🔴 |^🟡 /, ""))}</span></li>`).join("")}</ul>
    <p class="sub" style="margin:6px 0 0">Ranked by how much each one moves the verdict: ${pos.length} positive${pos.length === 1 ? "" : "s"}, ${neg.length} caution${neg.length === 1 ? "" : "s"}.</p>
    ${x.ll ? `<p style="margin:10px 0 0">🧭 <b>Investor lenses:</b> ${esc(x.ll)}</p>` : ""}
    <details><summary>Show more: what would change this, and how the score is built</summary>
      <h3 class="minor">What would change this</h3>
      <ul class="mini">${x.ch.map(c => `<li>${esc(c)}</li>`).join("")}</ul>
      <h3 class="minor">Quality score parts</h3>
      <div class="tablewrap"><table class="hist num"><thead><tr><th>Part</th><th>Score</th><th>Weight</th><th>Status</th></tr></thead><tbody>${pl}</tbody></table></div>
      <p class="sub">Quality = weighted average of the parts that are ON and available (needs at least 40 of the 100 weight). Management credibility, document signals and future scenarios arrive in Stage 5.</p>
      ${x.rf.length ? `<h3 class="minor">Red flags</h3><ul class="mini">${x.rf.map(f => `<li>${f.hard === false ? "🟡" : "🔴"} ${esc(f.t)} <span class="sub">(${f.hard === false ? "caution: −10 quality, capped at Hold" : "hard: forces Avoid"} · ${f.c === "own" ? "ownership" : f.c === "acct" ? "accounts" : "management"}${(!SET.veto || (f.c === "own" && !SET.own)) ? " – switched off" : ""})</span></li>`).join("")}</ul>` : ""}
      <p class="sub">Momentum: ${x.mo.above200 ? "price above" : "price below"} its 200-day average${x.mo.r121 != null ? `; 12-1 month return ${x.mo.r121 > 0 ? "+" : ""}${x.mo.r121}% (better than ${x.mo.pct ?? "–"}% of its sector)` : ""} → ${x.mo.ok ? "OK" : "not OK"}${SET.mom ? "" : " (switched off)"}.</p>
      <p class="sub">Personal research tool, not advice. Rules: 🟢 Buy = quality ≥ 70, price ≥ 25% below fair value, ≥ 60% of methods say cheap, the cash-flow family not saying expensive, confidence Medium/High, no red flags, momentum OK · 🟡 Accumulate = quality ≥ 70, price within ±15% (or cheap but methods disagree / cash flow doesn't confirm / trend weak) · ⚪ Hold = quality 50–70, full price, a caution flag (they never force Avoid), or fewer than 3 valuation methods · 🟠 Trim = price > 30% above · 🔴 Avoid = quality < 50 or a hard red flag.</p>
    </details>
  </section>`;
}

// ---------- stock page: valuation ----------
const MNAME = { dcf: "DCF (cash-flow forecast)", rdcf: "Reverse DCF", peer_pe: "Peer PE", peer_ev_ebitda: "Peer EV/EBITDA", peer_pb: "Peer P/B", peer_ev_sales: "Peer EV/Sales", pe_hist: "Own PE history", pb_hist: "Own P/B history", epv: "Earnings power value", graham_num: "Graham number", graham_formula: "Graham formula", jpb: "Justified P/B", ddm: "Dividend discount model", peg: "Lynch PEG fair value", mid_ev_ebitda: "Mid-cycle EV/EBITDA", sotp: "Sum of the parts", nav: "Net asset value (NAV)", replacement: "Replacement cost" };
const MPLAIN = {
  dcf: "Adds up the cash the business should produce over 10 years and beyond, in today's rupees.",
  rdcf: "Works backwards: what yearly growth must the company deliver for today's price to be fair?",
  peer_pe: "Price if it had the same price-to-profit ratio (PE) as the middle company in its sector.",
  peer_ev_ebitda: "Same idea using operating cash profit (EBITDA), counting debt as part of the price.",
  peer_pb: "Price at the sector's typical price-to-net-worth (P/B).", peer_ev_sales: "Price at the sector's typical value-to-sales ratio.",
  pe_hist: "Price at its own typical PE of the past few years.", pb_hist: "Price at its own typical P/B of the past few years.",
  epv: "Value of today's normal profit if it never grew – a no-growth floor.", graham_num: "Graham's ceiling price: √(22.5 × EPS × book value per share).",
  graham_formula: "Graham's formula: EPS × (8.5 + 2 × growth).", jpb: "The P/B a lender deserves: (ROE − growth) ÷ (cost of equity − growth).",
  ddm: "Adds up all future dividends in today's rupees.", peg: "Lynch: a fair PE roughly equals the growth rate (capped at 25).",
  mid_ev_ebitda: "Values a normal year of a cyclical business, not a boom or bust year.", sotp: "Values each business separately, minus a 20–40% holding-company discount.",
  nav: "Land, projects and investments minus debt.", replacement: "What it would cost to build the same plants today.",
};
// input key -> [label, unit] (anything not listed stays hidden: it's in the DCF box or too technical)
const INP = { fcf_cr: ["free cash flow ₹", " cr"], g: ["growth", "%"], r: ["discount rate", "%"], ke: ["cost of equity", "%"], tg: ["terminal growth", "%"],
  margin: ["normal margin", "%"], rev_cr: ["sales ₹", " cr"], tax: ["tax", "%"], eps: ["EPS ₹", ""], bvps: ["book value/share ₹", ""],
  fair_pe: ["fair PE", "×"], roe: ["ROE", "%"], pb_fair: ["fair P/B", "×"], dps: ["dividend/share ₹", ""], payout: ["payout", "%"],
  mine: ["this stock", "×"], median: ["sector/own median", "×"], p25: ["25th pct", "×"], p75: ["75th pct", "×"], n: ["peers", ""], peers: ["peer group:", ""],
  now: ["today", "×"], from: ["since", ""] };
const VOTE = { cheap: "says cheap", fair: "says fair", dear: "says expensive" };

function valBars(va, price) {
  const ks = Object.keys(va.m).filter(k => va.m[k].s === "ok");
  const xs = ks.flatMap(k => [va.m[k].lo, va.m[k].hi]).concat([price, va.fair || price]);
  const lo = Math.min(...xs) * 0.9, hi = Math.min(Math.max(...xs) * 1.05, price * 4);
  const W = 100, pos = v => Math.max(0, Math.min(W, (v - lo) / (hi - lo) * W));
  const row = k => { const m = va.m[k], cnt = va.ct.includes(k);
    return `<div class="vb ${cnt ? "" : "ref"}"><span class="vbn">${MNAME[k]}${cnt ? "" : " <i>(reference)</i>"}</span>
      <span class="vbt"><span class="rng est" data-series="Bear to bull range" style="left:${pos(m.lo)}%;width:${Math.max(1, pos(m.hi) - pos(m.lo))}%"></span><span class="mid" data-series="Method value" style="left:${pos(m.b)}%"></span><span class="pr" data-series="Price" style="left:${pos(price)}%"></span></span>
      <span class="vbv num">${inr(m.b, 0)}${m.b > hi ? " ▸" : ""}</span></div>`; };
  const order = ks.sort((a, b) => (va.ct.includes(b) - va.ct.includes(a)) || va.m[a].b - va.m[b].b);
  const pp = pos(price), side = pp < 50 ? " left" : " right";       // the label grows away from the nearer end
  return `<figure class="vbfig" data-chart="Price vs Method value">${ktitle(`${kw("Price", "var(--ink)")} vs each ${kw("Method value", "var(--accent)")} <span class="t-label sub">(${kw("Bear to bull range", "var(--ink-3)", { label: "grey = bear to bull" })})</span>`, "p")}
    <div class="vbars"><div class="vb vbhead"><span class="vbn"></span><span class="vbt vbt-lab" data-overhang="1"><span class="vlab t-label${side}" data-label="Price" style="left:${pp}%"><b class="num">Price ${inr(price, 0)}</b></span></span><span class="vbv"></span></div>${order.map(row).join("")}</div>
    <figcaption class="sub">The value on the right of each row is that method's base value.</figcaption></figure>`;
}

function valuationPanel(s) {
  const va0 = s.v4 && s.v4.va;
  if (!va0) return `<section class="panel"><h2>Fair value</h2><p class="sub">Not available: no financial data for this stock.</p></section>`;
  const va = val(s), p = s.close;
  if (va.fair == null) return `<section class="panel"><h2>Fair value</h2><p>🟡 Not enough data: none of the methods suited to ${esc(va.st || "this business")} could be calculated.</p>
    <details><summary>Show more</summary>${methodList(s, va)}</details></section>`;
  const gap = va.gap, light = gap < -15 ? "green" : gap > 15 ? "red" : "yellow";
  const word = gap < -15 ? "looks cheap" : gap > 15 ? "looks expensive" : "is near fair value";
  const majority = va.vo.dear > va.vo.cheap ? `${va.vo.dear} of ${va.nv} methods say expensive` : va.vo.cheap > va.vo.dear ? `${va.vo.cheap} of ${va.nv} methods say cheap` : va.vo.cheap ? `${va.vo.cheap} say cheap, ${va.vo.dear} say expensive (of ${va.nv})` : `${va.vo.fair} of ${va.nv} methods say fair`;
    const d = va.m.dcf;
  const u = userDcf(s.symbol);
  const dcfBox = d && d.s === "ok" ? (() => { const i = d.in, g = u ? u.g : i.g, ke = u && u.ke != null ? u.ke : i.ke, tg = u ? u.tg : i.tg, r = waccJs(i, ke), bt = va.bt || {};
    return `<h3 class="minor">DCF details ${d.user ? "(your assumptions)" : "(auto-estimate)"}</h3>
      <p class="mini">Cash base: <b>${esc(i.basis || "free cash flow after all capex")}</b>, averaged over the last 3 years: <b>${FMT.cr(i.fcf_cr, 0).replace(" cr", " crore")}</b>. ${i.use_oe ? "Growing companies (sales up 15%+ a year) are valued on owner earnings: cash from operations minus depreciation (≈ the capex needed just to stand still), so money spent on new stores or plants doesn't count against today's value. Depreciation includes leased stores' right-of-use depreciation, which roughly equals the lease repayments." : "Free cash flow after all capex (cash from operations minus all spending on plants and equipment)."}</p>
      <p class="mini">Both bases, year by year: free cash flow after all capex ${(i.fcf_years || []).map(x => x[0] + ": " + FMT.cr(x[1], 0)).join(", ") || "–"}${i.fcf_avg != null ? ` (3-yr average ${FMT.cr(i.fcf_avg, 0)})` : ""} · owner earnings ${(i.oe_years || []).map(x => x[0] + ": " + FMT.cr(x[1], 0)).join(", ") || "–"}${i.oe_avg != null ? ` (3-yr average ${FMT.cr(i.oe_avg, 0)})` : ""}.</p>
      <p class="mini">Three stages: ${esc(i.stages || "years 1–5 at the growth rate, years 6–10 fading to the terminal rate")}.</p>
      <div class="dcfedit">
        <label>Growth % (yrs 1–5)<input type="number" step="0.5" id="dg" value="${g}"></label>
        <label>Cost of equity %<input type="number" step="0.1" id="dk" value="${ke}"></label>
        <label>Terminal growth %<input type="number" step="0.5" id="dt" value="${tg}"></label>
        <button class="chip" type="button" id="dsave">Recalculate</button><button class="chip" type="button" id="dreset">Back to auto-estimate</button>
      </div>
      <p class="sub">Auto-estimate: growth ${i.g}% from ${esc(i.g_src)}. Cost of equity ${i.ke}% = 10-yr G-sec ${S.stage4.assume.gsec}% + β ${bt.adj ?? 1} × equity risk premium ${S.stage4.assume.erp}% (${esc(bt.why || "market average β")}; β is clamped to 0.7–1.5, so Ke runs 10.75%–15.15%). Discount rate ${r}% = cost of equity weighted with cheaper after-tax debt. Terminal growth ${i.tg}%. Net debt ${FMT.cr(i.nd_cr, 0).replace(" cr", " crore")} is subtracted. The same Ke is used in justified P/B and the dividend model; editing it here changes the DCF only.</p>
      <div class="tablewrap"><table class="hist num"><thead><tr><th>Growth ↓ / discount →</th>${i.sens_r.map(x => `<th>${x}%</th>`).join("")}</tr></thead><tbody>
        ${i.sens_g.map((gg, a) => `<tr><td>${gg}%</td>${i.sens[a].map(v => `<td${Math.abs(v - p) / p < 0.1 ? ' class="hl"' : ""}>${inr(v, 0)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <p class="sub">Sensitivity table (auto-estimate inputs): fair value per share for each growth and discount rate. Highlighted cells are within 10% of today's price.</p>`; })() : "";
  const rd = va.m.rdcf;
  const rdLine = rd && rd.s === "vote" ? `<p class="mini">🔁 <b>Reverse DCF:</b> ${esc(rd.w)} → ${rd.v === "dear" ? "the price expects more than the past delivered" : rd.v === "cheap" ? "the price expects less than the past delivered" : "the price expects about what the past delivered"}.</p>` : "";
  return `<section class="panel"><h2>Fair value${EXP()}</h2>${speedometer(s)}
    <p class="score">${DOT[light]} Fair value <b>${inr(va.low, 0)} – ${inr(va.high, 0)}</b> · ${majority}</p>
    <p style="margin:0 0 6px">The range runs from the lowest to the highest method suited to this business. Middle estimate <b>${inr(va.fair, 0)}</b> vs price <b>${inr(p, 0)}</b>: the share ${word} (${FMT.pct(gap, 0)}). Example: ₹10,000 spent today buys shares worth about ${FMT.money(10000 * va.fair / p, 0)} at the middle fair value.</p>
    <p class="sub" style="margin:0">Method mix for a <b>${esc(va.st)}</b>: ${esc(va.pw)} Confidence <b>${va.confidence}</b>${va.n_counted != null ? ` (${va.agree_n} of ${va.n_counted} counted methods within ±25% of the middle value; 70%+ = High, 50–70% = Medium)` : ""}${va.enough === false ? ". <b>Fewer than 3 methods could be calculated, so the verdict can't be Buy or Trim.</b>" : ""}.${va.user ? " <b>Uses your DCF assumptions.</b>" : ""}</p>
    ${va.fs ? `<p class="sub" style="margin:4px 0 0">Families: ${Object.entries(va.fs).map(([f, x]) => `${({ cash: "cash-flow", earnings: "earnings-multiple", asset: "asset" })[f]} ${inr(x.value, 0)} (${x.state === "dear" ? "says expensive" : "says " + x.state})`).join(" · ")}${va.cx ? " – <b>they conflict</b>" : ""}.</p>` : ""}
    ${(uv => uv ? `<p class="sub" style="margin:4px 0 0">📏 The verdict uses <b>${esc(viewTxt(uv.main))}</b>${uv.other ? ` · other view: ${esc(viewTxt(uv.other))}` : ""}.</p>` : "")(SET.master ? usedViews(Object.assign({}, vfor(s), { va })) : null)}
    ${va.sp ? `<p class="note">🟡 Profit jumped ${va.sp.factor}× – valued on normal years (${esc(va.sp.why)}). Peer PE, own PE band, peer EV/EBITDA, PEG and Graham use normal-year earnings; the DCF, mid-cycle EV/EBITDA and earnings-power value use normal-year cash and margins too.${va.m.dcf && va.m.dcf.in && va.m.dcf.in.spike_cash ? " DCF: " + esc(va.m.dcf.in.spike_cash.why) + "." : ""}</p>` : ""}
    ${rdLine}
    <details><summary>Show more: every method, the DCF and its assumptions</summary>
      ${valBars(va, p)}
      ${dcfBox}
      ${methodList(s, va)}
    </details>
  </section>`;
}

function methodList(s, va) {
  const item = k => { const m = va.m[k]; const cnt = (va.ct || []).includes(k) || (m.s === "vote" && (va.pl || []).includes(k));
    const st = m.s === "ok" ? `${inr(m.b, 0)} <span class="sub">(${inr(m.lo, 0)}–${inr(m.hi, 0)})</span> · ${VOTE[m.v] || "reference only"}` : m.s === "vote" ? (m.im != null ? `implies ${m.im}% growth · ${VOTE[m.v]}` : VOTE[m.v]) : "not available";
    const inp = m.in ? Object.entries(m.in).filter(([a]) => INP[a]).map(([a, b]) => `${INP[a][0]} ${typeof b === "number" ? FMT.num(b, Math.abs(b) < 100 && b % 1 ? 2 : 0) : esc(b)}${INP[a][1]}`).join(" · ") : "";
    return `<div class="chk"><div class="top"><span class="cn">${MNAME[k]}</span><span class="st ${cnt ? "st-pass" : "st-none"}">${cnt ? "counted" : "reference"}</span></div>
      <span class="cv num">${st}${m.pa ? ` <span class="st st-partial">◐ partial: ${esc(m.pa)}</span>` : ""}</span>
      <span class="cw">${({ cash: "Cash-flow", earnings: "Earnings-multiple", asset: "Asset" })[(va.fm || {})[k]] ? `<b>${({ cash: "Cash-flow", earnings: "Earnings-multiple", asset: "Asset" })[va.fm[k]]} family.</b> ` : ""}${esc(MPLAIN[k] || "")}${m.w ? " " + esc(m.w) : ""}${m.n ? " " + esc(m.n) : ""}</span>
      ${inp ? `<span class="cr">Inputs (auto-estimate): ${inp}</span>` : ""}</div>`; };
  const keys = Object.keys(va.m).sort((a, b) => ((va.ct || []).includes(b) - (va.ct || []).includes(a)));
  return `<h3 class="minor">All methods</h3><p class="sub">Methods come in three families – cash-flow, earnings-multiple and asset; each family's middle value says cheap, fair or dear. Families "conflict" when one says cheap and another dear – then confidence is Low. A Buy needs the cash-flow family to say cheap or fair, not dear (for lenders and insurers, justified P/B and dividends are that family; for cyclicals, the mid-cycle value). Counted = suited to this sector (fair value = median of these). Reference = shown for learning only. A method "says cheap" when the price is more than 10% below its value, "expensive" when more than 10% above.</p>${keys.map(item).join("")}`;
}

function qosPanel(s) {
  const q = s.v4 && s.v4.qs;
  if (!q) return "";
  const GN = { 1: "On sale", 2: "Quality business", 3: "Business isn't breaking", 4: "The market's fall, not the company's", 5: "Genuinely cheap" };
  const ST = { pass: "✅", fail: "❌", na: "– not checked" };
  const rows = Object.keys(GN).map(g => `<h3 class="minor">${g}. ${GN[g]}</h3>${q.r.filter(r => r[0] == g).map(r => `<div class="mini">${ST[r[2]]} ${esc(r[1])}${r[3] != null ? ` <span class="sub">– ${esc(typeof r[3] === "number" ? FMT.num(r[3], 2) : r[3])}</span>` : ""}</div>`).join("")}`).join("");
  return `<section class="panel"><h2>Quality on Sale check${EXP()}</h2>
    <p class="score">${q.l ? "💎 <b>On the list</b>" : q.nr ? "🔍 <b>Nearly</b> – 1 rule fails" : `<b>Not on the list</b> – ${q.f} rule${q.f > 1 ? "s" : ""} fail`}${q.na ? ` · ${q.na} rule${q.na > 1 ? "s" : ""} can't be checked yet` : ""} · timing: <b>${q.tg === "Turning up" ? "📈 Turning up" : "📉 Still falling"}</b></p>
    ${q.w ? `<p class="mini" style="margin:0">❓ <b>Why is it falling?</b> ${esc(q.w)}</p>` : ""}
    <details><summary>Show more: all the rules</summary>${rows}${q.b ? `<p class="mini">⭐ Bonus: promoters bought shares in the last 6 months.</p>` : ""}
      <p class="sub">Timing tag: "Turning up" = price back above its 50-day average, or RSI rose above 40 after being below 30. "Still falling" otherwise.</p></details>
  </section>`;
}


// ---------- sector screeners (one page per sector group) ----------
const SECT = S.sectors || {};
const secMembers = key => UNIV().filter(s => s.sector === key);
let SEC = { key: null, preset: -1, verdict: null, sort: null, dir: -1 };
const secVal = (s, k) => k === "quality" ? ((vfor(s) || {}).q ?? null) : k === "used_gap" ? (((usedViews(vfor(s)) || {}).main || {}).gap ?? null) : s[k];
function secFmt(x, unit) {
  if (x == null || !isFinite(x)) return "–";
  if (unit === "%" || unit === "%/yr") return FMT.pctPlain(x, 1);
  if (unit === "x") return FMT.times(x, Math.abs(x) < 10 ? 2 : 1);
  if (unit === "days") return Math.round(x) + "";
  if (unit === "/100") return Math.round(x) + "";
  return FMT.num(x, 0);
}
function secLight(x, c) {       // c = [key, label, unit, higher, help, good, bad]
  const [, , , hi, , good, bad] = c;
  if (x == null || good == null || hi == null) return "";
  if (hi) return x >= good ? "good" : x <= bad ? "bad" : "";
  return x <= good ? "good" : x >= bad ? "bad" : "";
}
function sectorStyles(all) {        // review #58: the sector's most common business type → the styles built for it
  const n = {}; all.forEach(x => ((x.sty && x.sty.t) || []).forEach(t => { n[t] = (n[t] || 0) + 1; }));
  const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0]; if (!top || top[1] < Math.max(3, all.length * 0.3)) return "";
  const lenses = (S.rules && S.rules.styles && S.rules.styles.lenses || {})[top[0]] || [];
  if (!lenses.length) return "";
  return `<p class="mini styl">Styles built for this sector: ${lenses.map(k => `${fitStar()} ${esc(LENS_SHORT[k] || k)}-style`).join(", ")} <span class="sub">(most stocks here look like a ${esc(STYLE_LABEL[top[0]])}; ${esc(STAR_LEGEND.slice(2))})</span></p>`;
}
function renderSector(key) {
  const cfg = SECT[key];
  if (!cfg) return false;
  if (SEC.key !== key) SEC = { key, preset: -1, verdict: null, sort: null, dir: -1 };
  const all = secMembers(key);
  const cols = cfg.cols;
  // filter: preset screen (same query language as the search box) and/or verdict group
  let rows = all, parsedTxt = `All ${all.length} stocks`, err = "";
  if (SEC.preset >= 0) {
    try { const tree = parseQuery(cfg.presets[SEC.preset][1]); rows = rows.filter(s => !s.excluded && evalQ(tree, s)); parsedTxt = `Stocks where ${describe(tree)}`; }
    catch (e) { err = e.message || String(e); }
  }
  if (SEC.verdict && SET.master) { rows = rows.filter(s => (vfor(s) || {}).g === SEC.verdict); parsedTxt += ` · verdict ${VG[SEC.verdict][1]}`; }
  const sk = SEC.sort;
  rows = [...rows].sort((a, b) => sk ? ((secVal(b, sk) ?? -1e15) - (secVal(a, sk) ?? -1e15)) * (SEC.dir === -1 ? 1 : -1) : ((secVal(b, "quality") ?? -1) - (secVal(a, "quality") ?? -1)));
  if (sk) rows.sort((a, b) => (secVal(a, sk) == null) - (secVal(b, sk) == null));
  // verdict counts for the whole sector
  const vc = { buy: 0, acc: 0, hold: 0, trim: 0, avoid: 0 };
  if (SET.master) all.forEach(s => { const v = vfor(s); if (v) vc[v.g]++; });
  const fixed = SET.master ? [["quality", "Quality", "/100", true, "The screener's 0–100 business-quality score.", 70, 50],
                              ["used_gap", "Gap", "%", false, "Price vs the value the verdict used (Strict = absolute value, Balanced = relative value). −20% = 20% below.", -15, 15]] : [];
  const allCols = [...fixed, ...cols];
  const med = c => median(all.map(s => secVal(s, c[0])).filter(x => x != null && isFinite(x)));
  const head = `<tr><th data-sort="">Stock</th>${SET.master ? "<th>Verdict</th>" : ""}${allCols.map(c => `<th data-sort="${c[0]}"${SEC.sort === c[0] ? ` aria-sort="${SEC.dir === -1 ? "descending" : "ascending"}"` : ""} title="${esc(c[4])}">${esc(c[1])}${SEC.sort === c[0] ? (SEC.dir === -1 ? " ↓" : " ↑") : ""}</th>`).join("")}</tr>`;
  const medRow = `<tr class="med"><td>Sector median (${all.length})</td>${SET.master ? "<td>–</td>" : ""}${allCols.map(c => `<td>${secFmt(med(c), c[2])}</td>`).join("")}</tr>`;
  const vIcon = s => { const v = SET.master ? vfor(s) : null; return v ? `${VG[v.g][0]} ${VG[v.g][1]}` : "–"; };
  const body = rows.map(s => `<tr data-sym="${esc(s.symbol)}"><td><span class="nm2">${esc(s.name)}${ubadges(s.symbol)}</span><span class="sy">${esc(s.symbol)}${s.excluded ? " · ⚠️ left out of screens" : ""}</span></td>${SET.master ? `<td>${vIcon(s)}</td>` : ""}${allCols.map(c => { const x = secVal(s, c[0]); return `<td class="${secLight(x, c)}">${secFmt(x, c[2])}</td>`; }).join("")}</tr>`).join("");
  const kv = (s, isMed) => allCols.slice(0, 6).map(c => { const x = isMed ? med(c) : secVal(s, c[0]); return `<span>${esc(c[1])} <b class="${isMed ? "" : secLight(x, c)}">${secFmt(x, c[2])}</b></span>`; }).join("");
  const cards = `<div class="seccard med"><b>Sector median (${all.length} stocks)</b><div class="kv">${kv(null, true)}</div></div>` +
    rows.map(s => `<button class="seccard" type="button" data-sym="${esc(s.symbol)}"><span><b>${esc(s.name)}</b>${ubadges(s.symbol)} <span class="sub">${esc(s.symbol)}</span></span>${SET.master ? `<span class="mini">${vIcon(s)}${(uv => uv ? " · " + esc(viewTxt(uv.main)) : "")(usedViews(vfor(s)))}</span>` : ""}<div class="kv">${kv(s, false)}</div></button>`).join("");
  const hidden = Object.keys(COL_ALL).filter(k => !allCols.some(c => c[0] === k) && !["quality", "q_mos", "mcap_cr", "ev_ebit", "nd_ebitda", "roa"].includes(k));
  const v = SCR();
  v.innerHTML = `<button class="back" type="button" data-back="#/sectors">← Sectors</button>
    <div class="hero" data-sk="${esc(key)}"><h1>${cfg.icon} ${esc(cfg.label)}</h1>
      <span class="sub">${all.length} Nifty 500 stocks · tap a row for the full stock page${cfg.note ? "" : ""}</span>${sectorStyles(all)}</div>
    ${cfg.note ? `<p class="note">ℹ️ ${esc(cfg.note)}</p>` : ""}${runnersHTML(all)}
    ${SET.master ? `<section class="panel"><h2>Verdicts in this sector</h2>
      <div class="vgrid">${Object.entries(VG).map(([k, [ic, nm]]) => `<button class="vbtn v-${k}${SEC.verdict === k ? " on" : ""}" type="button" data-secv="${k}"><span class="vi">${ic}</span><span class="vn">${nm}</span><b class="num">${vc[k]}</b></button>`).join("")}</div>
      ${SEC.verdict ? `<p class="sub" style="margin:8px 0 0">Showing ${VG[SEC.verdict][1]} only – <a href="#" data-secv="">show all verdicts</a></p>` : ""}</section>` : ""}
    <section class="panel"><h2>Ready-made screens</h2>
      <div class="chips">${[["All stocks", null], ...cfg.presets].map(([nm, q], i) => `<button class="chip${SEC.preset === i - 1 ? " on" : ""}" type="button" data-secp="${i - 1}" title="${esc(q || "")}">${esc(nm)}</button>`).join("")}</div>
      <p class="parsed" style="margin:10px 0 0">${err ? `<span class="qerr">🟡 ${esc(err)}</span>` : `${parsedTxt} – <b>${rows.length}</b> found${SEC.preset >= 0 ? ` (query: <i>${esc(cfg.presets[SEC.preset][1])}</i>)` : ""}`}</p>
    </section>
    <section class="panel"><h2>Results</h2>
      <p class="sub" style="margin:0 0 6px">🟢 = healthy for this sector, 🔴 = weak (colour shown on the number; rules of thumb, compare with peers). Sorted by ${SEC.sort ? esc((allCols.find(c => c[0] === SEC.sort) || [, SEC.sort])[1]) : "quality"} – tap a column heading to sort.</p>
      <div class="secwide"><div class="tablewrap"><table class="sect num"><thead>${head}</thead><tbody>${medRow}${body}</tbody></table></div></div>
      <div class="secnarrow seccards">${cards}</div>
      ${rows.length ? "" : `<p class="empty">No stocks in this sector pass this screen tonight.</p>`}
    </section>
    <section class="panel"><details><summary>Show more: what the columns mean, and what's missing</summary>
      <div class="terms">${allCols.map(c => `<div class="term"><div class="k"><span>${esc(c[1])}</span><span class="sub">${c[5] != null ? `🟢 ${c[3] ? "≥" : "≤"} ${c[5]}${c[2] === "x" ? "×" : c[2] === "days" ? " days" : c[2] === "/100" ? "" : "%"} · 🔴 ${c[3] ? "≤" : "≥"} ${c[6]}${c[2] === "x" ? "×" : c[2] === "days" ? " days" : c[2] === "/100" ? "" : "%"} (PROXY)` : "judged against the sector median"}</span></div><span>${esc(c[4])}</span></div>`).join("")}</div>
      ${hidden.length ? `<p class="mini">🙈 Hidden for this sector (they mislead here): ${esc(hidden.map(k => COL_ALL[k]).join(", "))}.</p>` : ""}
      <p class="mini">📄 Not in free data yet (need investor presentations – Stage 5 Company Reader): ${esc(cfg.missing)}.</p>
      <p class="sub">Sector median = the middle value of all ${all.length} stocks in this sector (not only the ones shown). Financial statements: Yahoo Finance (unofficial) with official NSE filings where matched. Personal research only – not advice.</p>
    </details></section>`;
  v.onclick = e => {
    const t = e.target;
    const p = t.closest("[data-secp]"), vb = t.closest("[data-secv]"), th = t.closest("th[data-sort]"), row = t.closest("[data-sym]");
    if (p) { SEC.preset = +p.dataset.secp; renderSector(key); return; }
    if (vb) { e.preventDefault(); SEC.verdict = vb.dataset.secv && SEC.verdict !== vb.dataset.secv ? vb.dataset.secv : null; renderSector(key); return; }
    if (th) { const k = th.dataset.sort || null; if (SEC.sort === k) SEC.dir = -SEC.dir; else { SEC.sort = k; SEC.dir = -1; } renderSector(key); return; }
    if (row && !row.classList.contains("med")) go(stockHref(row.dataset.sym));
  };
  return true;
}
const COL_ALL = { roe: "ROE", roa: "ROA", roce: "ROCE", op_margin: "operating margin", de: "debt to equity", icr: "interest cover",
  cfo_pat: "cash conversion", debtor_days: "debtor days", inventory_days: "inventory days", sales_cagr: "sales growth", eps_cagr: "EPS growth",
  pe: "PE", pb: "P/B", ev_ebitda: "EV/EBITDA", quality: "", q_mos: "", mcap_cr: "", ev_ebit: "", nd_ebitda: "" };

// ---------- 📈 Pro charts (review #42) – TradingView Lightweight Charts™ v5.2.1, self-hosted in vendor/ (Apache-2.0) ----------
// Visual / analysis only: nothing here changes the Core score, the rules or the ghosts. End-of-day data (NSE), never live.
// The library is loaded only when a chart opens; each stock's data/chart/<SYMBOL>.json likewise. Drawings stay on this
// device (USER.charts, in the Backup file) and are never uploaded.
const CH = { lib: null, libP: null, files: {}, idx: null, live: [] };
const CH_OK = () => SPLIT && !!S.charts;
const chartSlug = n => n.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const chartFileName = sym => sym.replace(/[^A-Za-z0-9_-]/g, ch => "~" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
const chartUrl = key => key.startsWith("index:") ? `data/chart/index/${key.slice(6)}.json` : `data/chart/${chartFileName(key)}.json`;
const chartHref = key => key.startsWith("index:") ? "#/chart/index/" + key.slice(6) : "#/chart/" + encodeURIComponent(key);
function loadChartLib() {
  if (CH.lib) return Promise.resolve(CH.lib);
  if (!CH.libP) CH.libP = new Promise((ok, bad) => {
    const sc = document.createElement("script");
    sc.src = "vendor/lightweight-charts.standalone.production.js";
    sc.onload = () => { CH.lib = window.LightweightCharts; CH.lib ? ok(CH.lib) : bad(new Error("chart library missing")); };
    sc.onerror = () => { CH.libP = null; bad(new Error("could not load the chart library")); };
    document.head.appendChild(sc);
  });
  return CH.libP;
}
function loadChartFile(key) {
  if (!CH.files[key]) CH.files[key] = fetch(chartUrl(key), { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status === 404 ? "no chart data for this one yet" : "HTTP " + r.status); return r.json(); })
    .then(f => ({ f, bars: CL.unpack(f) })).catch(e => { delete CH.files[key]; throw e; });
  return CH.files[key];
}
function loadChartIndex() {
  if (!CH.idx) CH.idx = fetch("data/chart/index/index.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : { indices: [] }).catch(() => ({ indices: [] }));
  return CH.idx;
}
const CHP_KEY = "screener.chart.v1";
const CHP_DEF = { type: "candle", tf: "D", range: "1Y", scale: "lin", ov: { sma50: true, sma200: true, ev: true, trades: true, saved: true, gaps: false },
                  panes: ["vol"], cmp: [], magnet: true };
let CHP = (() => { try { return Object.assign({}, CHP_DEF, JSON.parse(localStorage.getItem(CHP_KEY) || "{}")); } catch (e) { return Object.assign({}, CHP_DEF); } })();
const chpSave = () => { try { localStorage.setItem(CHP_KEY, JSON.stringify(CHP)); } catch (e) {} };
const OVERLAYS = [["sma20", "SMA 20"], ["sma50", "SMA 50"], ["sma200", "SMA 200"], ["ema20", "EMA 20"], ["ema50", "EMA 50"], ["bb", "Bollinger (20, 2)"],
  ["hl52", "52-week high / low"], ["zone", "Buy zone (experimental)"], ["trades", "My buys / sells"], ["saved", "Watchlist saved price"],
  ["ev", "Corporate actions & results"], ["gaps", "Gaps (1% or more)"], ["anchor", "Anchored average (tap a day)"]];
const PANES = [["vol", "Volume"], ["rsi", "RSI (14)"], ["macd", "MACD (12, 26, 9)"]];
const TYPES = [["candle", "Candles"], ["bar", "OHLC bars"], ["line", "Line"], ["area", "Area"], ["ha", "Heikin-Ashi"]];
const TOOL_NAMES = { trend: "Trend line", ray: "Ray", hline: "Horizontal", vline: "Vertical", channel: "Parallel channel", fib: "Fibonacci", rect: "Rectangle", text: "Text note", measure: "Measure" };
const tok = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hexA = (hex, a) => /^#[0-9a-f]{6}$/i.test(hex) ? `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})` : hex;
function destroyCharts() { CH.live.forEach(c => { try { c.destroy(); } catch (e) {} }); CH.live = []; document.body.classList.remove("chart-max"); }

// the chart screen: #/chart/<SYMBOL> or #/chart/index/<id>
function chartScreen(r) {
  const isIdx = r.arg === "index", key = isIdx ? "index:" + (parseHash().sub || "") : r.arg, s = isIdx ? null : BY[r.arg];
  const back = isIdx ? "#/market" : stockHref(r.arg);
  const name = s ? s.name : isIdx ? (MKT_NAME[key.slice(6)] || key.slice(6)) : r.arg;
  if (s && CH_OK() && !s.ch) return `<button class="back" type="button" data-back="${back}">${ic("back")} Back</button><div class="hero"><h1>${esc(name)}</h1></div>
    <p class="empty">No chart data for this stock yet – its five-year history is filled over the next few nights.</p>`;
  if (!CH_OK()) return `<button class="back" type="button" data-back="${back}">${ic("back")} Back</button><div class="hero"><h1>${esc(name)}</h1></div>
    <p class="empty">Pro charts need the online page. <a href="${S.public_link && S.public_link.url || "https://nightscreener.github.io/"}" rel="noopener">Open the link</a> – the offline copy has the 1-year line chart on each stock page.</p>`;
  return `<div class="pc-full" data-key="${esc(key)}"><div class="pc-head"><button class="back" type="button" data-back="${back}">${ic("back")} Back</button>
    <h1 class="t-heading">${esc(name)}${s ? ` <span class="t-label sub">${esc(s.symbol)}</span>` : ""}</h1></div>
    ${osNote(s)}<div id="pcfull" class="pcwrap full"></div></div>`;
}
const MKT_NAME = {};

// one chart (full screen or the stock page's inline one). Returns a handle with destroy().
async function mountChart(host, key, full) {
  const st = { key, full, host, chart: null, main: null, bars: [], disp: [], tool: null, draft: null, sel: null, anchor: null, cmpData: {}, lines: {} };
  CH.live.push(st);
  st.destroy = () => { st.dead = true; if (st.chart) st.chart.remove(); st.chart = null; window.removeEventListener("keydown", st.onKey); };
  host.innerHTML = `<div class="skel pcskel" aria-label="Loading the chart…"><i class="b"></i></div>`;
  let lib, data;
  try { [lib, data] = await Promise.all([loadChartLib(), loadChartFile(key)]); }
  catch (e) { if (!st.dead) host.innerHTML = `<p class="sub">🟡 Chart not available (${esc(e.message)}).</p>`; return st; }
  if (st.dead) return st;
  st.lib = lib; st.f = data.f; st.daily = data.bars;
  st.hist = CL.history((USER.charts || {})[key] || []);
  const s = key.startsWith("index:") ? null : BY[key];
  st.s = s;
  host.innerHTML = chartChrome(st);
  st.el = host.querySelector(".pc-canvas");
  st.legend = host.querySelector(".pc-legend");
  wireChart(st);
  await preloadCompare(st);
  if (st.dead) return st;
  buildChart(st);
  return st;
}

function chartChrome(st) {
  const P = CHP, full = st.full, f = st.f;
  const seg = (name, items, cur) => `<div class="seg pcseg" role="group" aria-label="${name}">${items.map(([k, n]) => `<a href="#" data-pc="${name}" data-v="${k}" class="${cur === k ? "on" : ""}">${n}</a>`).join("")}</div>`;
  const ranges = seg("range", CL.CFG.ranges.map(r => [r, r]), P.range);
  const tf = seg("tf", [["D", "D"], ["W", "W"], ["M", "M"], ["Q", "Q"], ["Y", "Y"]], P.tf);       // #83 K: + quarterly, yearly
  const sel = (name, items, cur, lbl) => `<label class="pcsel"><span class="t-label sub">${lbl}</span><select data-pc="${name}">${items.map(([k, n]) => `<option value="${k}"${cur === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
  const tools = full ? `<div class="pc-tools" role="toolbar" aria-label="Drawing tools">${CL.TOOLS.map(t => `<button type="button" class="act pct" data-tool="${t}" aria-pressed="false">${TOOL_NAMES[t]}</button>`).join("")}
      <button type="button" class="act pct" data-pca="magnet" aria-pressed="${P.magnet}">Magnet</button>
      <button type="button" class="act pct" data-pca="undo">Undo</button><button type="button" class="act pct" data-pca="redo">Redo</button>
      <button type="button" class="act pct" data-pca="del" disabled>Delete</button><button type="button" class="act pct" data-pca="level" disabled>Watch this level</button>
      <button type="button" class="act pct" data-pca="clear">Clear all</button></div>` : "";
  return `<div class="pc-bar">${ranges}${tf}</div>
    ${full ? `<div class="pc-bar">${sel("type", TYPES, P.type, "Type")}${sel("scale", [["lin", "Linear"], ["log", "Log"], ["pct", "%"]], P.scale, "Scale")}
      <button type="button" class="act" data-pca="ind">Indicators</button><button type="button" class="act" data-pca="cmp">Compare</button>
      <label class="pcsel"><span class="t-label sub">Go to date</span><span class="pcdate act"><span class="pcdv">${ic("calendar")} Pick a day</span><input type="date" data-pca="goto" aria-label="Go to date" min="${f.t0}" max="${st.daily[st.daily.length - 1].t}"></span></label>
      <button type="button" class="act" data-pca="fit">Fit</button><button type="button" class="act" data-pca="max">Full screen</button></div>${tools}` : ""}
    <div class="pc-legend t-number-sm" aria-live="off"></div>
    <div class="pc-canvas${full ? "" : " inline"}" tabindex="0" aria-label="Price chart – drag to pan, pinch or scroll to zoom, double-tap to reset"></div>
    <p class="t-label sub pc-src">${esc(f.src && f.src.note || "Daily data from NSE – not live")}. For viewing only – drawings and indicators don't change any score (only momentum is in the Core score).</p>
    ${full ? `<div class="pc-gaps"></div>` : ""}`;
}

// what is drawn: bars for the timeframe, the main series, overlays, panes, markers, compare lines, drawings
function buildChart(st) {
  const L = st.lib, P = CHP;
  const keepRange = st.chart ? st.chart.timeScale().getVisibleRange() : null;
  if (st.chart) { st.chart.remove(); st.chart = null; }
  st.bars = CL.aggregate(st.daily, P.tf);
  st.disp = P.type === "ha" ? CL.heikinAshi(st.bars) : st.bars;
  const ink2 = tok("--ink-2"), line = tok("--line"), gain = tok("--gain"), loss = tok("--loss"), acc = tok("--accent");
  const fam = getComputedStyle(document.body).fontFamily, phone = window.innerWidth < 700;
  const probe = document.createElement("span"); probe.className = "t-number-sm"; document.body.appendChild(probe);
  const fsz = parseFloat(getComputedStyle(probe).fontSize) || 14; probe.remove();
  const ch = L.createChart(st.el, {
    autoSize: true,
    layout: { background: { type: "solid", color: tok("--surface") }, textColor: ink2, fontFamily: fam, fontSize: Math.min(fsz, 14),
              attributionLogo: true, panes: { separatorColor: line, enableResize: true } },
    grid: { vertLines: { color: hexA(line, 0.6) }, horzLines: { color: hexA(line, 0.6) } },
    rightPriceScale: { borderColor: line, mode: P.cmp.length ? L.PriceScaleMode.IndexedTo100 : P.scale === "pct" ? L.PriceScaleMode.Percentage : P.scale === "log" ? L.PriceScaleMode.Logarithmic : L.PriceScaleMode.Normal },
    timeScale: { borderColor: line, rightOffset: 4, minBarSpacing: 0.5 },
    crosshair: { mode: L.CrosshairMode.Normal },
    kineticScroll: { touch: true, mouse: true },
    handleScale: { axisPressedMouseMove: { time: true, price: true }, mouseWheel: true, pinch: true, axisDoubleClickReset: true },
    localization: { locale: "en-IN", timeFormatter: t => CL.periodLabel(typeof t === "string" ? t : t.year ? `${t.year}-${String(t.month).padStart(2, "0")}-${String(t.day).padStart(2, "0")}` : new Date(t * 1000).toISOString().slice(0, 10), CHP.tf) },   // #83 K: the date pill in the timeframe's words
  });
  st.chart = ch;
  const up = gain, dn = loss;
  const ohlc = st.disp.map(b => ({ time: b.t, open: b.o, high: b.h, low: b.l, close: b.c }));
  const vals = st.disp.map(b => ({ time: b.t, value: b.c }));
  if (P.type === "line") st.main = ch.addSeries(L.LineSeries, { color: acc, lineWidth: 2 });
  else if (P.type === "area") st.main = ch.addSeries(L.AreaSeries, { lineColor: acc, topColor: hexA(acc, 0.28), bottomColor: hexA(acc, 0.02), lineWidth: 2 });
  else if (P.type === "bar") st.main = ch.addSeries(L.BarSeries, { upColor: up, downColor: dn, thinBars: false });
  else st.main = ch.addSeries(L.CandlestickSeries, { upColor: up, downColor: dn, borderUpColor: up, borderDownColor: dn, wickUpColor: up, wickDownColor: dn });
  st.main.applyOptions({ priceFormat: { type: "custom", minMove: 0.05, formatter: p => FMT.num(p, Math.abs(p) >= 1e5 ? 0 : 2) } });
  st.main.setData(P.type === "line" || P.type === "area" ? vals : ohlc);
  // overlays (on the real closes, not Heikin-Ashi). review #61: every overlay / compare line also goes into the legend's colour key
  // (on a phone the lines carry no title on the chart itself)
  st.keys = [];
  const c = st.bars.map(b => b.c), O = P.ov, lineS = (arr, color, title, style = 0, w = 1.5, need = null) => {
    if (!arr.some(v => v != null)) { st.keys.push({ n: title, c: color, d: false, miss: `needs ${need || "more"} bars` }); return null; }   // #83 K: can't be drawn → a grey chip, not a silent gap
    st.keys.push({ n: title, c: color, d: style === 1 || style === 2 });
    const sr = ch.addSeries(L.LineSeries, { color, lineWidth: w, lineStyle: style, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, title: phone ? "" : title,
                                            priceFormat: { type: "custom", minMove: 0.05, formatter: p => FMT.num(p, 2) } });
    sr.setData(arr.map((v, i) => v == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: v })); return sr; };
  if (O.sma20) lineS(CL.sma(c, 20), tok("--v11"), "SMA 20", 0, 1.5, 20);
  if (O.sma50) lineS(CL.sma(c, 50), tok("--avg"), "SMA 50", 0, 1.5, 50);
  if (O.sma200) lineS(CL.sma(c, 200), tok("--trim"), "SMA 200", 0, 2, 200);
  if (O.ema20) lineS(CL.ema(c, 20), tok("--warn"), "EMA 20", 2, 1.5, 20);          // review #61: no two lines share a colour
  if (O.ema50) lineS(CL.ema(c, 50), tok("--ink-3"), "EMA 50", 2, 1.5, 50);
  if (O.bb) { const b = CL.bollinger(c, 20, 2); lineS(b.up, ink2, "BB upper", 1, 1); lineS(b.mid, ink2, "BB 20", 2, 1); lineS(b.lo, ink2, "BB lower", 1, 1);
    st.keys.splice(-3, 3, { n: "Bollinger bands (20, 2σ)", c: ink2, d: true }); }
  if (O.anchor && st.anchor != null && st.anchor < st.bars.length) lineS(CL.anchoredAvg(st.bars, st.anchor), acc, "Anchored avg", 0, 2);
  if (O.hl52) { const hl = CL.hiLo52(st.daily); if (hl) { st.main.createPriceLine({ price: hl.h, color: gain, lineStyle: 2, lineWidth: 1, axisLabelVisible: true, title: "52w high" });
    st.main.createPriceLine({ price: hl.l, color: loss, lineStyle: 2, lineWidth: 1, axisLabelVisible: true, title: "52w low" }); } }
  const w = st.s && (USER.watch || []).find(x => x.sym === st.s.symbol);
  if (O.saved && w && w.px) st.main.createPriceLine({ price: w.px, color: acc, lineStyle: 3, lineWidth: 1, axisLabelVisible: true, title: "Saved" });
  // markers: corporate actions, results, my buys / sells – placed on the bar that contains the date
  const barOf = t => { const i = CL.indexAt(st.bars, t); return st.bars[i] && st.bars[i].t === t ? i : i - 1; };
  const mk = [];
  if (O.ev) (st.f.ev || []).forEach(([t, k, txt]) => { const i = barOf(t); if (i >= 0 && i < st.bars.length)
    mk.push({ time: st.bars[i].t, position: "aboveBar", shape: "circle", color: k === "results" ? acc : tok("--warn"), size: 0.6,
              text: { results: "R", dividend: "D", split: "S", bonus: "B", demerger: "DM" }[k] || "•", id: "ev:" + t + k, tip: txt }); });
  if (O.trades && st.s) (USER.tx || []).filter(t => t.sym === st.s.symbol).forEach(t => { const i = barOf(t.date); if (i >= 0)
    mk.push({ time: st.bars[i].t, position: t.side === "buy" ? "belowBar" : "aboveBar", shape: t.side === "buy" ? "arrowUp" : "arrowDown",
              color: t.side === "buy" ? gain : loss, text: (t.side === "buy" ? "Buy " : "Sell ") + FMT.num(t.qty, 0) }); });
  mk.sort((a, b) => a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
  st.markers = L.createSeriesMarkers(st.main, mk);
  // #83 K5: the event dots (results light blue, dividends / splits / bonuses amber) sit ABOVE the candles and are named in the key –
  // on weekly / monthly bars nearly every candle carries one, which read as light-blue / peach candles when they weren't keyed
  if (mk.some(m => m.id && m.id.startsWith("ev:"))) { st.keys.push({ n: "R = results (dot above the bar)", c: acc, d: false }); st.keys.push({ n: "D / S / B = dividend · split · bonus", c: tok("--warn"), d: false }); }
  // compare lines (review #62: every line rebased to 100 at the first bar on screen – the price scale switches to "indexed to 100")
  const cmpCols = [tok("--v11"), tok("--avg"), tok("--trim"), ink2];
  P.cmp.forEach((k, j) => { const d = st.cmpData[k]; if (!d) return;
    st.keys.push({ n: d.label + " (rebased)", c: cmpCols[j % 4], d: false });
    const sr = ch.addSeries(L.LineSeries, { color: cmpCols[j % 4], lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: d.label, priceFormat: { type: "custom", minMove: 0.01, formatter: p => FMT.num(p, 2) } });
    sr.setData(CL.aggregate(d.bars, P.tf).map(b => ({ time: b.t, value: b.c }))); st.lines["cmp:" + k] = sr; });
  // panes: volume, RSI, MACD (phone: at most CL.CFG.maxPanesPhone)
  let pane = 1;
  const panes = phone ? P.panes.slice(-CL.CFG.maxPanesPhone) : P.panes;
  if (panes.includes("vol") && st.bars.some(b => b.v != null)) {
    const v = ch.addSeries(L.HistogramSeries, { priceFormat: { type: "custom", formatter: x => FMT.shares(x), minMove: 1 }, priceLineVisible: false, lastValueVisible: false, title: phone ? "" : "Volume" }, pane);
    v.setData(st.bars.map(b => ({ time: b.t, value: b.v || 0, color: hexA(b.c >= b.o ? gain : loss, 0.55) })));
    const av = CL.sma(st.bars.map(b => b.v || 0), 20);
    ch.addSeries(L.LineSeries, { color: tok("--avg"), lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: false, priceFormat: { type: "custom", formatter: x => FMT.shares(x) } }, pane)
      .setData(av.map((x, i) => x == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: x }));
    st.volPane = pane++;
  }
  if (panes.includes("rsi")) {
    const r = ch.addSeries(L.LineSeries, { color: acc, lineWidth: 1.5, priceLineVisible: false, title: phone ? "" : "RSI 14", priceFormat: { type: "custom", formatter: x => FMT.num(x, 0), minMove: 1 } }, pane);
    r.setData(CL.rsi(c, 14).map((x, i) => x == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: x }));
    r.createPriceLine({ price: 70, color: loss, lineStyle: 2, lineWidth: 1, axisLabelVisible: true, title: "" });
    r.createPriceLine({ price: 30, color: gain, lineStyle: 2, lineWidth: 1, axisLabelVisible: true, title: "" });
    st.rsiPane = pane++;
  }
  if (panes.includes("macd")) {
    const m = CL.macd(c), fm = { type: "custom", formatter: x => FMT.num(x, 2) };
    ch.addSeries(L.HistogramSeries, { priceLineVisible: false, lastValueVisible: false, priceFormat: fm }, pane)
      .setData(m.hist.map((x, i) => x == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: x, color: hexA(x >= 0 ? gain : loss, 0.55) }));
    ch.addSeries(L.LineSeries, { color: acc, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, title: phone ? "" : "MACD", priceFormat: fm }, pane)
      .setData(m.line.map((x, i) => x == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: x }));
    ch.addSeries(L.LineSeries, { color: tok("--avg"), lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false, title: phone ? "" : "Signal", priceFormat: fm }, pane)
      .setData(m.signal.map((x, i) => x == null ? { time: st.bars[i].t } : { time: st.bars[i].t, value: x }));
    st.macdPane = pane++;
  }
  const hMain = st.el.clientHeight, extra = pane - 1;
  const share = Math.min(0.2, 0.45 / (extra || 1));                     // the price pane keeps at least 55% of the height
  if (extra) ch.panes().forEach((p, i) => p.setHeight(Math.round(hMain * (i === 0 ? 1 - share * extra : share))));
  // our own primitive: drawings, gap shading, buy-zone band
  st.gaps = O.gaps || st.full ? CL.gaps(st.bars, CL.CFG.gapMinPct) : [];
  st.zone = O.zone && st.s ? (z => z && z.zone ? z.zone : null)(zoneFor(st.s)) : null;
  st.prim = drawPrimitive(st);
  st.main.attachPrimitive(st.prim);
  // #83 K1: tap / hover → the crosshair snaps to a bar; on touch it stays after lifting the finger; tapping empty space or the same bar clears it
  ch.subscribeCrosshairMove(p => { if (st.pinGuard) return;
    if (st.pin && !(p && p.time)) { pinAt(st, st.pin, true); return; }
    legendAt(st, p && p.time ? CL.indexAt(st.bars, p.time) : st.pin ? CL.indexAt(st.bars, st.pin) : null, p && p.time ? p : null); });
  ch.subscribeClick(p => { chartClick(st, p); if (st.tool || (CHP.ov.anchor && p && p.time)) return;
    if (!p || !p.time || p.time === st.pin) unpin(st); else pinAt(st, p.time); });
  if (st.pin && CL.indexAt(st.bars, st.pin) >= st.bars.length) st.pin = null;
  legendAt(st, null);
  if (keepRange && st.keepOnRebuild) { try { ch.timeScale().setVisibleRange(keepRange); } catch (e) { applyRange(st); } }
  else applyRange(st);
  st.keepOnRebuild = false;
  if (st.full) gapList(st);
  toolState(st);
}
function applyRange(st) {
  const from = CL.rangeStart(st.bars, CHP.range), to = st.bars[st.bars.length - 1].t;
  const i0 = Math.max(0, CL.indexAt(st.bars, from)), n = st.bars.length;
  if (n - i0 < 3) { st.chart.timeScale().fitContent(); return; }
  st.chart.timeScale().setVisibleLogicalRange({ from: i0 - 0.5, to: n - 1 + 3 });
  void to;
}
function legendAt(st, i, p) {
  const b = i != null && i < st.disp.length && st.disp[i] && (!p || st.disp[i].t === p.time) ? i : st.disp.length - 1;
  const x = st.disp[b], prev = b > 0 ? st.bars[b - 1].c : null, real = st.bars[b];
  const chg = prev ? (real.c / prev - 1) * 100 : null;
  const cmp = CHP.cmp.map(k => { const d = st.cmpData[k]; if (!d) return ""; const sr = st.lines["cmp:" + k];
    const v = p && p.seriesData && sr ? p.seriesData.get(sr) : null; return `<span class="pcl-c">${esc(d.label)} ${v ? FMT.num(v.value, 2) : ""}</span>`; }).join("");
  st.legend.innerHTML = `<b class="pcl-t">${CL.periodLabel(x.t, CHP.tf, st.daily[st.daily.length - 1].t, IST_TODAY())}</b> <span>O <span class="num">${FMT.num(x.o, 2)}</span></span> <span>H <span class="num">${FMT.num(x.h, 2)}</span></span>
    <span>L <span class="num">${FMT.num(x.l, 2)}</span></span> <span>C <span class="num">${FMT.num(x.c, 2)}</span></span>
    <span title="change vs the previous bar">${moveNum(chg, FMT.pct(chg, 2))}</span>${real.v != null ? ` <span>Vol <span class="num">${FMT.shares(real.v)}</span></span>` : ""}${CHP.type === "ha" ? ` <span class="sub">(Heikin-Ashi values; change % on real closes)</span>` : ""}${cmp}${(st.keys || []).length ? ` <span class="pckeys">${st.keys.map(k => k.miss ? `<span class="kw kmiss" data-key="${esc(k.n)}" aria-disabled="true">${esc(k.n)} – ${esc(k.miss)}</span>` : kw(k.n, k.c, { dash: k.d })).join(" ")}</span>` : ""}${CHP.cmp.length ? ` <span class="sub">All lines rebased to 100 at the first day shown.</span>` : ""}`;
}
function gapList(st) {
  const box = st.host.querySelector(".pc-gaps"); if (!box) return;
  const open = st.gaps.filter(g => !g.filled).reverse();
  box.innerHTML = `<section class="panel"><h2>Unfilled gaps</h2><p class="t-label sub">A gap opens when a ${({ D: "day", W: "week", M: "month", Q: "quarter", Y: "year" })[CHP.tf] || "bar"}'s whole range is at least ${FMT.pctPlain(CL.CFG.gapMinPct, 0)} above the previous high (gap up) or below the previous low (gap down). It is filled once prices trade back to that level. Shaded on the chart when "Gaps" is on.</p>
    ${open.length ? `<div class="pc-gtab" role="table"><div role="row" class="t-label sub"><span>Date</span><span>Size</span><span>Level to fill</span></div>${open.map(g => `<div role="row"><span>${FMT.date(g.t)}</span><span class="num ${g.dir === "up" ? "up" : "down"}">${FMT.arrow(g.dir === "up" ? 1 : -1)} ${FMT.pctPlain(Math.abs(g.pct), 1)}</span><span class="num">${FMT.money(g.edge, 2)}</span></div>`).join("")}</div>`
      : `<p class="empty">No unfilled gaps in this history.</p>`}</section>`;
}

// ---- drawings: a series primitive (our own code on the library's plug-in API)
function drawPrimitive(st) {
  const view = { renderer: () => ({ draw: target => target.useMediaCoordinateSpace(sc => paintAll(st, sc.context, sc.mediaSize)) }), zOrder: () => "top" };
  const back = { renderer: () => ({ draw: target => target.useMediaCoordinateSpace(sc => paintBack(st, sc.context, sc.mediaSize)) }), zOrder: () => "bottom" };
  return { attached: p => { st.req = p.requestUpdate; }, detached: () => { st.req = null; }, updateAllViews: () => {}, paneViews: () => [back, view] };
}
const redraw = st => st.req && st.req();
// date ↔ logical index (between bars by calendar days; beyond the last bar by its average spacing)
function logicalOf(st, t) {
  const b = st.bars, i = CL.indexAt(b, t), D = 864e5, ms = x => Date.parse(x + "T00:00:00Z");
  if (i < b.length && b[i].t === t) return i;
  if (i >= b.length) { const step = b.length > 20 ? (ms(b[b.length - 1].t) - ms(b[b.length - 21].t)) / 20 : D; return b.length - 1 + (ms(t) - ms(b[b.length - 1].t)) / step; }
  if (i === 0) return 0;
  return i - 1 + (ms(t) - ms(b[i - 1].t)) / (ms(b[i].t) - ms(b[i - 1].t));
}
function dateOfLogical(st, lg) {
  const b = st.bars, i = Math.round(lg);
  if (i < 0) return b[0].t;
  if (i < b.length) return b[i].t;
  const step = (Date.parse(b[b.length - 1].t) - Date.parse(b[Math.max(0, b.length - 21)].t)) / Math.min(20, b.length - 1);
  return new Date(Date.parse(b[b.length - 1].t) + step * (i - b.length + 1)).toISOString().slice(0, 10);
}
const X = (st, t) => st.chart.timeScale().logicalToCoordinate(logicalOf(st, t));
const Y = (st, p) => st.main.priceToCoordinate(p);
function paintBack(st, ctx, size) {
  const gain = tok("--gain"), loss = tok("--loss"), acc = tok("--accent");
  if (CHP.ov.gaps) st.gaps.forEach(g => {
    const x0 = X(st, g.t), x1 = g.filled ? X(st, g.filled) : size.width, y0 = Y(st, g.edge), y1 = Y(st, g.filled ? g.far : g.open);
    if (x0 == null || y0 == null || y1 == null) return;
    ctx.fillStyle = hexA(g.dir === "up" ? gain : loss, g.filled ? 0.08 : 0.2);
    ctx.fillRect(x0, Math.min(y0, y1), (x1 == null ? size.width : x1) - x0, Math.abs(y1 - y0) || 1);
  });
  if (st.zone != null) { const y = Y(st, st.zone); if (y != null) { ctx.fillStyle = hexA(acc, 0.08); ctx.fillRect(0, y, size.width, size.height - y);
    ctx.strokeStyle = acc; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.width, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = acc; ctx.font = labelFont(); ctx.fillText(`Buy zone (experimental): below ${FMT.money(st.zone, 0)}`, 8, y - 6); } }
}
const labelFont = () => { const f = getComputedStyle(document.body).fontFamily; return `13px ${f}`; };
function paintAll(st, ctx, size) {
  const list = st.hist.get().concat(st.draft ? [st.draft] : []);
  const acc = tok("--accent"), ink = tok("--ink"), warn = tok("--warn");
  ctx.font = labelFont(); ctx.lineWidth = 1.5;
  for (const d of list) {
    const sel = st.sel === d.id || d === st.draft, col = d.type === "measure" ? warn : acc;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = sel ? 2.5 : 1.5;
    const P = d.pts.map(q => ({ x: X(st, q.t), y: Y(st, q.p) }));
    if (P.some(q => q.x == null || q.y == null)) continue;
    const seg = (a, b) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
    const ext = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y, k = dx ? (size.width - a.x) / dx : 0; return dx > 0 ? { x: size.width, y: a.y + dy * k } : dx < 0 ? { x: 0, y: a.y - dy * a.x / dx } : { x: a.x, y: dy > 0 ? size.height : 0 }; };
    if (d.type === "trend") seg(P[0], P[1]);
    else if (d.type === "ray") seg(P[0], ext(P[0], P[1]));
    else if (d.type === "hline") { seg({ x: 0, y: P[0].y }, { x: size.width, y: P[0].y });
      const lv = d.level ? ` · watching${CL.crossedLevels([d], st.daily[st.daily.length - 1].c).length ? " – crossed" : ""}` : "";
      ctx.fillText(FMT.money(d.pts[0].p, 2) + lv, 8, P[0].y - 5); }
    else if (d.type === "vline") seg({ x: P[0].x, y: 0 }, { x: P[0].x, y: size.height });
    else if (d.type === "channel") { seg(P[0], P[1]); const off = P[2].y - (P[0].y + (P[1].y - P[0].y) * (P[2].x - P[0].x) / ((P[1].x - P[0].x) || 1));
      seg({ x: P[0].x, y: P[0].y + off }, { x: P[1].x, y: P[1].y + off });
      ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y); ctx.lineTo(P[1].x, P[1].y); ctx.lineTo(P[1].x, P[1].y + off); ctx.lineTo(P[0].x, P[0].y + off); ctx.fill(); ctx.globalAlpha = 1; }
    else if (d.type === "rect") { ctx.globalAlpha = 0.1; ctx.fillRect(P[0].x, P[0].y, P[1].x - P[0].x, P[1].y - P[0].y); ctx.globalAlpha = 1; ctx.strokeRect(P[0].x, P[0].y, P[1].x - P[0].x, P[1].y - P[0].y); }
    else if (d.type === "fib") { const x0 = Math.min(P[0].x, P[1].x), x1 = Math.max(P[0].x, P[1].x, x0 + 40);
      CL.fibLevels(d.pts[0], d.pts[1]).forEach(L => { const y = Y(st, L.p); if (y == null) return; seg({ x: x0, y }, { x: x1, y }); ctx.fillText(`${FMT.num(L.r * 100, 1)}% · ${FMT.money(L.p, 2)}`, x1 + 4, y + 4); });
      ctx.setLineDash([3, 3]); seg(P[0], P[1]); ctx.setLineDash([]); }
    else if (d.type === "text") { ctx.fillStyle = ink; ctx.fillText(d.text || "Note", P[0].x + 6, P[0].y - 6); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(P[0].x, P[0].y, 3, 0, 7); ctx.fill(); }
    else if (d.type === "measure") {
      const a = { t: d.pts[0].t, p: d.pts[0].p, i: Math.round(logicalOf(st, d.pts[0].t)) }, b = { t: d.pts[1].t, p: d.pts[1].p, i: Math.round(logicalOf(st, d.pts[1].t)) };
      const m = CL.measure(a, b);
      ctx.globalAlpha = 0.12; ctx.fillStyle = m.change >= 0 ? tok("--gain") : tok("--loss"); ctx.fillRect(P[0].x, P[0].y, P[1].x - P[0].x, P[1].y - P[0].y); ctx.globalAlpha = 1;
      seg(P[0], P[1]);
      const txt = `${FMT.moneySigned(m.change, 2)} (${FMT.pct(m.pct, 2)}) · ${FMT.count(m.bars)} bars · ${FMT.count(m.days)} days`;
      const w = ctx.measureText(txt).width + 12, bx = Math.min(Math.max(4, P[1].x - w / 2), size.width - w - 4), by = P[1].y + (P[1].y >= P[0].y ? 10 : -30);
      ctx.fillStyle = tok("--surface"); ctx.fillRect(bx, by, w, 22); ctx.strokeStyle = col; ctx.strokeRect(bx, by, w, 22);
      ctx.fillStyle = ink; ctx.fillText(txt, bx + 6, by + 15);
    }
    if (sel) { ctx.fillStyle = tok("--surface"); ctx.strokeStyle = col; P.forEach(q => { ctx.beginPath(); ctx.arc(q.x, q.y, 6, 0, 7); ctx.fill(); ctx.stroke(); }); }
  }
}
// hit test: the drawing (and handle) under a point, in pixels
function hitDrawing(st, x, y) {
  const tol = 12, near = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)) : 0; return Math.hypot(x - ax - t * dx, y - ay - t * dy); };
  const list = st.hist.get();
  for (let k = list.length - 1; k >= 0; k--) {
    const d = list[k], P = d.pts.map(q => ({ x: X(st, q.t), y: Y(st, q.p) }));
    if (P.some(q => q.x == null || q.y == null)) continue;
    const h = P.findIndex(q => Math.hypot(q.x - x, q.y - y) < tol + 4);
    if (h >= 0 && st.sel === d.id) return { d, handle: h };
    let dist = 1e9;
    if (d.type === "hline") dist = Math.abs(y - P[0].y);
    else if (d.type === "vline") dist = Math.abs(x - P[0].x);
    else if (d.type === "text") dist = Math.hypot(x - P[0].x, y - P[0].y) - 4;
    else if (d.type === "fib") { const x0 = Math.min(P[0].x, P[1].x) - tol, x1 = Math.max(P[0].x, P[1].x, P[0].x + 40) + tol;
      dist = Math.min(near(P[0].x, P[0].y, P[1].x, P[1].y), ...(x >= x0 && x <= x1 ? CL.fibLevels(d.pts[0], d.pts[1]).map(L => Math.abs(y - Y(st, L.p))) : [1e9])); }
    else if (d.type === "rect" || d.type === "measure") { const inX = x >= Math.min(P[0].x, P[1].x) - tol && x <= Math.max(P[0].x, P[1].x) + tol, inY = y >= Math.min(P[0].y, P[1].y) - tol && y <= Math.max(P[0].y, P[1].y) + tol; dist = inX && inY ? 0 : 1e9; }
    else { dist = near(P[0].x, P[0].y, P[1].x, P[1].y); if (d.type === "ray" && x > Math.max(P[0].x, P[1].x)) dist = Math.min(dist, near(P[0].x, P[0].y, P[0].x + (P[1].x - P[0].x) * 50, P[0].y + (P[1].y - P[0].y) * 50));
      if (d.type === "channel") { const off = P[2].y - (P[0].y + (P[1].y - P[0].y) * (P[2].x - P[0].x) / ((P[1].x - P[0].x) || 1)); dist = Math.min(dist, near(P[0].x, P[0].y + off, P[1].x, P[1].y + off)); } }
    if (dist < tol) return { d, handle: -1 };
  }
  return null;
}
// pointer → chart point {t, p} (magnet: snap to the bar's O / H / L / C)
function pointAt(st, x, y) {
  const lg = st.chart.timeScale().coordinateToLogical(x), p0 = st.main.coordinateToPrice(y);
  if (lg == null || p0 == null) return null;
  const t = dateOfLogical(st, lg), i = Math.round(lg), b = st.bars[i];
  return { t, p: CHP.magnet && b ? CL.magnet(b, p0) : p0 };
}
function saveDrawings(st, next) {
  st.hist.set(next);
  USER.charts = USER.charts || {};
  if (st.hist.get().length) USER.charts[st.key] = st.hist.get(); else delete USER.charts[st.key];
  persist(); toolState(st); redraw(st);
}
function toolState(st) {
  const h = st.host;
  h.querySelectorAll("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(st.tool === b.dataset.tool)));
  const q = a => h.querySelector(`[data-pca="${a}"]`), sel = st.hist.get().find(d => d.id === st.sel);
  if (q("undo")) { q("undo").disabled = !st.hist.canUndo(); q("redo").disabled = !st.hist.canRedo(); q("del").disabled = !sel; q("clear").disabled = !st.hist.get().length;
    q("level").disabled = !(sel && sel.type === "hline"); q("level").textContent = sel && sel.level ? "Stop watching" : "Watch this level"; q("magnet").setAttribute("aria-pressed", String(!!CHP.magnet)); }
  if (st.chart) st.chart.applyOptions({ handleScroll: !st.tool, handleScale: !st.tool });
  st.el.classList.toggle("drawing", !!st.tool);
}
// review #83 K: the sticky crosshair (touch: it stays until you tap empty space or the same bar; dragging moves it bar by bar)
function pinAt(st, t, quiet) {
  if (!st.chart || !st.main) return;
  const i = CL.indexAt(st.bars, t), b = st.bars[Math.min(i, st.bars.length - 1)]; if (!b) return;
  st.pin = b.t; st.pinGuard = true;
  try { st.chart.setCrosshairPosition(b.c, b.t, st.main); } catch (e) {}
  st.pinGuard = false;
  if (!quiet) st.chart.applyOptions({ handleScroll: { horzTouchDrag: false } });
  legendAt(st, CL.indexAt(st.bars, b.t));
}
function unpin(st) { st.pin = null; if (!st.chart) return; try { st.chart.clearCrosshairPosition(); } catch (e) {} st.chart.applyOptions({ handleScroll: { horzTouchDrag: true } }); legendAt(st, null); }
function chartClick(st, p) {
  if (!CHP.ov.anchor || st.tool || !p || !p.time) return;
  st.anchor = CL.indexAt(st.bars, p.time); st.keepOnRebuild = true; buildChart(st);
}
function wireChart(st) {
  const el = st.el, rect = () => el.getBoundingClientRect();
  el.addEventListener("pointermove", e => { if (!st.pin || e.pointerType !== "touch" || st.tool || !st.chart) return;       // #83 K: drag the pinned crosshair
    const t = st.chart.timeScale().coordinateToTime(e.clientX - rect().left); if (t && t !== st.pin) pinAt(st, typeof t === "string" ? t : CL.periodEnd(String(t), "D"), true); });
  let drag = null;
  const xy = e => { const r = rect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const inMain = ({ y }) => { const p0 = st.chart && st.chart.panes()[0]; return !p0 || y <= p0.getHeight(); };
  el.addEventListener("pointerdown", e => {
    if (!st.chart || !st.full) return;
    const q = xy(e);
    if (!inMain(q)) return;
    if (st.tool) {
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (err) {}
      const pt = pointAt(st, q.x, q.y); if (!pt) return;
      const n = CL.NPTS[st.tool];
      if (st.draft) st.draft.pts[st.draft.pts.length - 1] = pt;              // the next tap of a tap-tap drawing
      else st.draft = { id: UL.uid(), type: st.tool, pts: n === 1 ? [pt] : [pt, pt], taps: 0 };
      drag = { draft: true, start: q }; redraw(st); return;
    }
    const hit = hitDrawing(st, q.x, q.y);
    if (hit) {
      e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (err) {}
      st.sel = hit.d.id;
      drag = { move: hit, start: q, orig: JSON.parse(JSON.stringify(hit.d)), lg0: st.chart.timeScale().coordinateToLogical(q.x), p0: st.main.coordinateToPrice(q.y) };
      toolState(st); st.chart.applyOptions({ handleScroll: false, handleScale: false }); redraw(st);
    } else if (st.sel) { st.sel = null; toolState(st); redraw(st); }
  }, true);
  el.addEventListener("pointermove", e => {
    if (!st.chart) return;
    const q = xy(e);
    if (st.draft) {                                     // the free point follows the finger / mouse
      const pt = pointAt(st, q.x, q.y); if (!pt || (!drag && e.pointerType === "touch")) return;
      if (st.draft.pts.length > 1 || drag) { st.draft.pts[st.draft.pts.length - 1] = pt; redraw(st); }
      e.stopPropagation(); return;
    }
    if (drag && drag.move) {
      e.stopPropagation();
      const lg = st.chart.timeScale().coordinateToLogical(q.x), pr = st.main.coordinateToPrice(q.y); if (lg == null || pr == null) return;
      const d = st.hist.get().find(x => x.id === drag.move.d.id); if (!d) return;
      if (drag.move.handle >= 0) { const pt = pointAt(st, q.x, q.y); if (pt) d.pts[drag.move.handle] = pt; }
      else d.pts = drag.orig.pts.map(p => ({ t: dateOfLogical(st, logicalOf(st, p.t) + (lg - drag.lg0)), p: p.p + (pr - drag.p0) }));
      redraw(st);
    }
  }, true);
  const end = e => {
    if (!st.chart || !drag) return;
    const q = xy(e), moved = Math.hypot(q.x - drag.start.x, q.y - drag.start.y) > 6;
    if (drag.draft && st.draft) {
      const d = st.draft, n = CL.NPTS[d.type];
      if (n === 1) finishDraft(st);
      else if (!moved && d.taps === 0) d.taps = 1;                   // first tap: the next tap places the next point
      else if (d.pts.length < n) { d.pts.push(d.pts[d.pts.length - 1]); d.taps = 1; }   // channel: one more point
      else finishDraft(st);
    } else if (drag.move) {
      const now = st.hist.get(), i = now.findIndex(x => x.id === drag.move.d.id);
      if (i >= 0 && JSON.stringify(now[i]) !== JSON.stringify(drag.orig)) { const after = JSON.parse(JSON.stringify(now)); now[i] = drag.orig; saveDrawings(st, after); }
      toolState(st);
    }
    drag = null;
  };
  el.addEventListener("pointerup", end, true);
  el.addEventListener("pointercancel", () => { drag = null; }, true);
  el.addEventListener("dblclick", e => { if (!st.tool && !hitDrawing(st, xy(e).x, xy(e).y)) applyRange(st); });
  st.onKey = e => {
    if (!st.chart || !document.body.contains(el) || /INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
    const ts = st.chart.timeScale();
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { ts.scrollToPosition(ts.scrollPosition() + (e.key === "ArrowLeft" ? -5 : 5), true); e.preventDefault(); }
    else if ((e.key === "Delete" || e.key === "Backspace") && st.sel) { saveDrawings(st, st.hist.get().filter(d => d.id !== st.sel)); st.sel = null; toolState(st); e.preventDefault(); }
    else if (e.key === "Escape") { st.tool = null; st.draft = null; toolState(st); redraw(st); }
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { st.hist[e.shiftKey ? "redo" : "undo"](); syncUser(st); e.preventDefault(); }
  };
  window.addEventListener("keydown", st.onKey);
  st.host.addEventListener("click", e => chartControl(st, e));
  st.host.addEventListener("change", e => chartControl(st, e));
}
function syncUser(st) { USER.charts = USER.charts || {}; if (st.hist.get().length) USER.charts[st.key] = st.hist.get(); else delete USER.charts[st.key]; persist(); st.sel = null; toolState(st); redraw(st); }
function finishDraft(st) {
  const d = st.draft; st.draft = null;
  if (d.type === "text") { const t = window.prompt("Text note on the chart:", ""); if (!t) { redraw(st); return; } d.text = t; }
  delete d.waiting;
  saveDrawings(st, st.hist.get().concat([d]));
  st.sel = d.id; st.tool = null; toolState(st); redraw(st);
}
async function chartControl(st, e) {
  const a = e.target.closest("[data-pc],[data-pca],[data-tool]");
  if (!a || !st.host.contains(a)) return;
  const kind = a.dataset.pc, act = a.dataset.pca, tool = a.dataset.tool;
  if (e.type === "click" && (a.tagName === "SELECT" || a.tagName === "INPUT")) return;
  if (e.type === "change" && !(a.tagName === "SELECT" || a.tagName === "INPUT")) return;
  e.preventDefault();
  if (kind === "range") { CHP.range = a.dataset.v; chpSave(); markOn(a); applyRange(st); return; }
  if (kind === "tf") { CHP.tf = a.dataset.v; chpSave(); markOn(a); st.anchor = null; buildChart(st); return; }
  if (kind === "type") { CHP.type = a.value; chpSave(); st.keepOnRebuild = true; buildChart(st); return; }
  if (kind === "scale") { CHP.scale = a.value; chpSave(); st.keepOnRebuild = true; buildChart(st); return; }
  if (tool) { st.tool = st.tool === tool ? null : tool; st.draft = null; st.sel = null; toolState(st); redraw(st); return; }
  if (act === "magnet") { CHP.magnet = !CHP.magnet; chpSave(); toolState(st); return; }
  if (act === "undo") { st.hist.undo(); syncUser(st); return; }
  if (act === "redo") { st.hist.redo(); syncUser(st); return; }
  if (act === "del" && st.sel) { saveDrawings(st, st.hist.get().filter(d => d.id !== st.sel)); st.sel = null; toolState(st); return; }
  if (act === "clear") { if (st.hist.get().length && window.confirm("Delete all drawings on this chart? (Undo brings them back.)")) { st.sel = null; saveDrawings(st, []); } return; }
  if (act === "level") { const cur = st.hist.get().map(d => d.id !== st.sel ? d : Object.assign({}, d, { level: d.level ? undefined : { p0: st.daily[st.daily.length - 1].c, at: TODAY } }));
    saveDrawings(st, cur); toast(cur.find(d => d.id === st.sel).level ? "Watching this level – the Watchlist will say when the close crosses it." : "Stopped watching this level."); return; }
  if (act === "fit") { st.chart.timeScale().fitContent(); return; }
  if (act === "goto") { const d = a.value; if (!d) return;
    // review #45: the chosen day in the app's date format, never the browser's raw format
    const lbl = a.parentElement.querySelector(".pcdv"); if (lbl) lbl.innerHTML = `${ic("calendar")} ${FMT.date(d)}`;
    const ts = st.chart.timeScale(), i = Math.min(CL.indexAt(st.bars, d), st.bars.length - 1), r = ts.getVisibleLogicalRange(), w = r ? (r.to - r.from) : 120;
    // review #54: stop a running scroll animation first (← → keys animate; in WebKit it was still running and moved the chart
    // back), then centre the day, and check again after the next frames in case anything else moved it
    ts.scrollToPosition(ts.scrollPosition(), false);
    const centre = () => ts.setVisibleLogicalRange({ from: i - w / 2, to: i + w / 2 });
    const inView = () => { const v = ts.getVisibleLogicalRange(); return v && v.from < i && v.to > i; };
    centre(); requestAnimationFrame(() => requestAnimationFrame(() => { if (!inView()) centre(); }));
    setTimeout(() => { if (!inView()) centre(); }, 250);
    st.chart.setCrosshairPosition(st.bars[i].c, st.bars[i].t, st.main); legendAt(st, i); return; }
  if (act === "max") { const on = !document.body.classList.contains("chart-max"); document.body.classList.toggle("chart-max", on);
    try { if (on) { const rq = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen; if (rq) await rq.call(document.documentElement); if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape").catch(() => {}); }
          else if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (err) {}
    a.textContent = on ? "Exit full screen" : "Full screen"; return; }
  if (act === "ind") { indicatorSheet(st); return; }
  if (act === "cmp") { compareSheet(st); return; }
}
const markOn = a => a.parentElement.querySelectorAll("a").forEach(x => x.classList.toggle("on", x === a));
function indicatorSheet(st) {
  const P = CHP, phone = window.innerWidth < 700;
  sheet(`<h2>Indicators</h2><p class="t-label sub">For viewing only – none of these change the Core score, the verdicts or the ghosts.</p>
    <div class="pc-checks">${OVERLAYS.filter(([k]) => st.s || !["zone", "trades", "saved"].includes(k)).map(([k, n]) => `<label class="pc-chk"><input type="checkbox" data-ov="${k}"${P.ov[k] ? " checked" : ""}> ${n}</label>`).join("")}</div>
    <h3 class="t-label">Panes below the chart${phone ? ` (at most ${CL.CFG.maxPanesPhone} on a phone)` : ""}</h3>
    <div class="pc-checks">${PANES.filter(([k]) => k !== "vol" || st.bars.some(b => b.v != null)).map(([k, n]) => `<label class="pc-chk"><input type="checkbox" data-pane="${k}"${P.panes.includes(k) ? " checked" : ""}> ${n}</label>`).join("")}</div>
    <div class="btnrow"><button class="act big" type="button" data-close>Done</button></div>`);
  const box = document.getElementById("sheet");
  box.onchange = e => {
    const o = e.target.dataset.ov, p = e.target.dataset.pane;
    if (o) { CHP.ov[o] = e.target.checked; if (o === "anchor" && e.target.checked) toast("Tap a day on the chart to start the average there."); }
    if (p) { CHP.panes = CHP.panes.filter(x => x !== p); if (e.target.checked) CHP.panes.push(p);
      if (phone && CHP.panes.length > CL.CFG.maxPanesPhone) { const off = CHP.panes.shift(); const cb = box.querySelector(`[data-pane="${off}"]`); if (cb) cb.checked = false; toast("Phone: at most 2 panes – turned one off."); } }
    if (o || p) { chpSave(); st.keepOnRebuild = true; buildChart(st); }
  };
}
async function compareSheet(st) {
  const idx = (await loadChartIndex()).indices || [];
  idx.forEach(([id, n]) => { MKT_NAME[id] = n; });
  const sec = st.s && S.market && (S.market.sectors || []).find(x => x.key && x.key === st.s.sector);
  const opts = [["index:nifty-50", "Nifty 50"], ["index:nifty-500", "Nifty 500"]].concat(sec ? [["index:" + chartSlug(sec.id), sec.name + " index"]] : [])
    .filter(([k]) => k !== st.key && idx.some(([id]) => "index:" + id === k));
  sheet(`<h2>Compare</h2><p class="t-label sub">Each line shows the % change from the first day on screen.</p>
    <div class="pc-checks">${opts.map(([k, n]) => `<label class="pc-chk"><input type="checkbox" data-cmp="${k}" data-lbl="${esc(n)}"${CHP.cmp.includes(k) ? " checked" : ""}> ${esc(n)}</label>`).join("")}
    ${CHP.cmp.filter(k => !opts.some(([o]) => o === k)).map(k => `<label class="pc-chk"><input type="checkbox" data-cmp="${esc(k)}" data-lbl="${esc(k)}" checked> ${esc(k.replace("index:", ""))}</label>`).join("")}</div>
    <form class="pc-cmpform"><label class="pcsel"><span class="t-label sub">Another stock (symbol)</span><input name="sym" autocomplete="off" autocapitalize="characters" placeholder="e.g. INFY"></label>
      <button class="act" type="submit">Add</button></form><p class="formerr" hidden></p>
    <div class="btnrow"><button class="act big" type="button" data-close>Done</button></div>`);
  const box = document.getElementById("sheet");
  const apply = async (k, lbl, on) => {
    CHP.cmp = CHP.cmp.filter(x => x !== k); if (on) CHP.cmp.push(k);
    if (on && !st.cmpData[k]) { try { st.cmpData[k] = { label: lbl, bars: (await loadChartFile(k)).bars }; } catch (e) { CHP.cmp = CHP.cmp.filter(x => x !== k); toast("No chart data for " + lbl + "."); } }
    chpSave(); st.keepOnRebuild = true; buildChart(st);
  };
  box.onchange = e => { const k = e.target.dataset.cmp; if (k) apply(k, e.target.dataset.lbl, e.target.checked); };
  document.querySelector(".pc-cmpform").addEventListener("submit", e => { e.preventDefault(); const v = e.target.sym.value.trim().toUpperCase(), err = box.querySelector(".formerr");
    if (!BY[v] || !BY[v].ch) { err.hidden = false; err.textContent = BY[v] ? `No chart data for "${v}" yet.` : `"${v}" is not in tonight's list.`; return; } err.hidden = true; apply(v, v, true).then(() => toast("Added " + v + ".")); e.target.sym.value = ""; });
}
// load the compare series saved in the preferences before the first draw
async function preloadCompare(st) {
  for (const k of CHP.cmp.slice()) if (!st.cmpData[k]) { try { const idx = (await loadChartIndex()).indices || []; const n = k.startsWith("index:") ? ((idx.find(([id]) => "index:" + id === k) || [])[1] || k.slice(6)) : k;
    st.cmpData[k] = { label: n, bars: (await loadChartFile(k)).bars }; } catch (e) { CHP.cmp = CHP.cmp.filter(x => x !== k); } }
}
// the Watchlist's "crossed your level" line
function crossedFor(sym) { const s = BY[sym]; return s ? CL.crossedLevels((USER.charts || {})[sym] || [], s.close) : []; }


// ---------- 🏅 Core ranking (review #45): every eligible stock in Core-score order, from the same nightly output the ghosts use ----------
let RK = { sec: "", ghost: false, mine: false, q: "" };
const GROUP_LABEL = g => ((S.rules || {}).groups || {})[g] || (g || "–").replace(/_/g, " ");
function rankRows() {
  const RU = S.rules || {}, maxG = (RU.portfolio || {}).max_per_group || 3;
  const g1 = new Set(((S.portfolio || {}).holdings || []).map(h => h.s)), g2 = new Set(((S.portfolio_v1_1 || {}).holdings || []).map(h => h.s));
  const el = S.stocks.filter(s => s.cr && s.cr.el && s.cr.rk).sort((a, b) => a.cr.rk - b.cr.rk);
  const per = {};                                    // held stocks per sector group, walking down the ranking (v1.0 ghost)
  return el.map(s => {
    const g = s.cr.gr, rk = s.cr.rk;
    let why = null;
    if (rk <= 20 && !g1.has(s.symbol)) {
      why = (per[g] || 0) >= maxG ? `${FMT.count((per[g] || 0) + 1)}th ${GROUP_LABEL(g)} – max ${maxG} per sector group`
        : "the ghost keeps holdings while they stay in the keep zone (top 30%), so a new top-20 stock waits for the next rebalance";
    }
    if (g1.has(s.symbol)) per[g] = (per[g] || 0) + 1;
    const why2 = rk <= 20 && S.portfolio_v1_1 && !g2.has(s.symbol) && g1.has(s.symbol) ? "v1.1: size balance – needs 10 of 20 from the top 100 by market cap" : null;
    return { s, rk, g, in1: g1.has(s.symbol), in2: g2.has(s.symbol), saved: inWatch(s.symbol), held: heldQty(s.symbol) > 0, why: why || why2 };
  });
}
function rankingScreen() {
  const all = rankRows(), n = all.length, keep = Math.ceil(n * 0.30), tax = Math.ceil(n * 0.50);
  const secs = [...new Set(all.map(x => x.g))].sort();
  const q = RK.q.trim().toLowerCase();
  const rows = all.filter(x => (!RK.sec || x.g === RK.sec) && (!RK.ghost || x.in1 || x.in2) && (!RK.mine || x.saved || x.held) &&
    (!q || x.s.name.toLowerCase().includes(q) || x.s.symbol.toLowerCase().includes(q)));
  const line = (rk, txt) => `<tr class="rk-line"><td colspan="8" class="t-label rk-tag">${txt}</td></tr>`;
  let body = "";
  rows.forEach(x => {
    const c = x.s.cr, pl = c.pl || {};
    body += `<tr><td class="num">${x.rk}</td><td class="l"><a href="${stockHref(x.s.symbol)}">${esc(x.s.name)}</a>${x.in1 ? ' <span class="chip-s">in v1.0 ghost</span>' : ""}${x.in2 ? ' <span class="chip-s">in v1.1 ghost</span>' : ""}${x.saved ? ` ${ic("star-fill")}` : ""}${x.held ? ` ${ic("case")}` : ""}${x.why ? `<br><span class="t-label sub">${esc(x.why)}</span>` : ""}</td>
      <td class="l">${esc(GROUP_LABEL(x.g))}</td><td class="num">${FMT.num(c.sc, 1)}</td><td class="num">${FMT.num(pl.quality, 1)}</td><td class="num">${FMT.num(pl.value, 1)}</td><td class="num">${FMT.num(pl.momentum, 1)}</td><td>${chgPill(x.s.change_pct, 2)}</td></tr>`;
    if (!RK.sec && !RK.ghost && !RK.mine && !q) {
      if (x.rk === 20) body += line(20, "▲ top 20 – model portfolio picks come from here");
      if (x.rk === keep) body += line(keep, `▲ keep zone – top 30% (${FMT.count(keep)} tonight): a held stock stays while it is above this line`);
      if (x.rk === tax) body += line(tax, "▲ tax-wait zone – top 50%: a held stock waiting for long-term tax stays while above this line");
    }
  });
  const nope = S.stocks.filter(s => s.cr && !s.cr.el);
  return `<button class="back" type="button" data-back="#/home">${ic("back")} Back</button>
    <div class="scr-h"><h1>Core ranking</h1></div>
    <p class="sub">Every eligible stock tonight, best Core score first – the same list the paper ghosts pick from (Rules ${esc((S.rules || {}).version || "v1.0")}). ${FMT.count(n)} eligible.</p>
    <div class="rank-tools"><label class="pcsel"><span class="t-label sub">Sector</span><select data-rk="sec"><option value="">All sectors</option>${secs.map(g => `<option value="${esc(g)}"${RK.sec === g ? " selected" : ""}>${esc(GROUP_LABEL(g))}</option>`).join("")}</select></label>
      <label class="pc-chk"><input type="checkbox" data-rk="ghost"${RK.ghost ? " checked" : ""}> In a ghost only</label>
      <label class="pc-chk"><input type="checkbox" data-rk="mine"${RK.mine ? " checked" : ""}> Saved / held only</label>
      <label class="pcsel"><span class="t-label sub">Find</span><input type="search" data-rk="q" value="${esc(RK.q)}" placeholder="Name or symbol"></label>
      <button class="act" type="button" data-act="rankcsv">${ic("download")} Download CSV</button></div>
    <div class="tablewrap"><table class="hist rank"><thead><tr><th>Rank</th><th class="l">Stock</th><th class="l">Sector</th><th>Core</th><th>Quality vs sector</th><th>Value ${ib("value_pillar")}</th><th>Momentum ${ib("momentum_pillar")}</th><th>Today</th></tr></thead><tbody>${body}</tbody></table></div>
    <details class="panel"><summary>Not eligible tonight (${FMT.count(nope.length)})</summary>${nope.map(s => `<p class="mline"><a href="${stockHref(s.symbol)}">${esc(s.name)}</a> – ${esc((s.cr.wn || []).join("; ") || "not eligible")}</p>`).join("")}</details>`;
}
function rankCSV() {
  const rows = rankRows();
  const head = ["rank", "symbol", "name", "sector_group", "core", "quality_vs_sector", "value", "momentum", "change_pct", "in_v1_0_ghost", "in_v1_1_ghost", "saved", "held", "note"];
  const q = v => { const t = v == null ? "" : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return [head.join(",")].concat(rows.map(x => [x.rk, x.s.symbol, x.s.name, x.g, x.s.cr.sc, (x.s.cr.pl || {}).quality, (x.s.cr.pl || {}).value,
    (x.s.cr.pl || {}).momentum, x.s.change_pct, x.in1 ? 1 : 0, x.in2 ? 1 : 0, x.saved ? 1 : 0, x.held ? 1 : 0, x.why || ""].map(q).join(","))).join("\n");
}

// ---------- routing – review #29: one screen at a time, hash routes so Safari's back button and swipe-back work ----------
//   #/home · #/search?q=… · #/verdicts · #/verdicts/<group> · #/sectors · #/sector/<key> · #/stock/<SYMBOL> · #/more
// Old in-page anchors (#stock-…, #sector-…, #settings) are redirected. A screen opened by a tap starts at the top; going back
// returns to the scroll position (and the number of opened cards) it had.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
const SCROLL = {};
let CUR = null, FWD = false, NAV = 0, TAB = "home";
function go(h) { FWD = true; location.hash = h; }
function parseHash() {
  let h = location.hash || "#/home";
  if (!h.startsWith("#/")) {                                    // legacy anchors
    const old = h.slice(1);
    if (DEC[old]) return { redirect: stockHref(DEC[old]) };
    if (old.startsWith("sector-")) return { redirect: "#/sector/" + old.slice(7) };
    if (old === "settings") return { redirect: "#/settings" };
    return { redirect: "#/home" };
  }
  if (/^#\/us\//.test(h)) return { redirect: "#/world/us/" + h.slice(5) };     // review #80: old #/us/… links
  const [path, qs] = h.slice(2).split("?");
  const parts = path.split("/").map(x => { try { return decodeURIComponent(x); } catch (e) { return x; } });
  const sp = new URLSearchParams(qs || ""), q = sp.get("q") || "";
  return { name: parts[0] || "home", arg: parts[1], sub: parts[2], q, flt: sp.get("flt") || "", f: sp.get("f"), d: sp.get("d"), v: sp.get("v"), list: sp.get("list"), s: sp.get("s") };
}
function render(keepScroll) {
  const r = parseHash();
  if (r.redirect) { history.replaceState(null, "", r.redirect); return render(false); }
  try { noteOrigin(r); } catch (e) {}                                       // review #83 L
  const el = SCR();
  el.onclick = null;
  destroyCharts();                                              // review #42: a chart lives only on its own screen
  document.body.classList.toggle("wide-view", r.name === "sector");
  document.body.classList.toggle("chart-view", r.name === "chart");
  let ok = true, title = "Nifty 500 Night Screener", drawn = false;
  if (r.name === "home") { el.innerHTML = homeScreen(); TAB = "home"; }
  else if (r.name === "market") { el.innerHTML = marketScreen(r); TAB = "market"; title = "Market – " + title; }
  else if (r.name === "models") { el.innerHTML = modelsScreen(); TAB = "home"; title = "Model portfolios – " + title; }
  else if (r.name === "xray") { el.innerHTML = xrayScreen(); TAB = "portfolio"; title = "Mutual fund X-ray – " + title;
    if (!MF.tried) loadMF().then(() => { if (parseHash().name === "xray") render(true); }); }
  else if (r.name === "week") { el.innerHTML = weekScreen(); TAB = "home"; title = "Week in review – " + title; }
  else if (r.name === "policy") { el.innerHTML = policyScreen(); TAB = "more"; title = "My Policy – " + title; }
  else if (r.name === "radar") { el.innerHTML = radarScreen(); TAB = "more"; title = "Policy Radar – " + title;          // review #90 A8
    const sel = el.querySelector("[data-radarsec]"); if (sel) sel.addEventListener("change", () => { RADAR.sec = sel.value; render(true); }); }
  else if (r.name === "budget") { el.innerHTML = budgetDayScreen(); TAB = "more"; title = "Budget Day – " + title; }       // review #90 B
  else if (r.name === "learn") { el.innerHTML = learnScreen(r.arg, r.sub); TAB = SIDE() ? "learn" : "more"; title = (r.arg && GL[r.arg] ? GL[r.arg].name + " – " : "") + "Learn – " + title;
    const lq = el.querySelector("#learnq"); if (lq) lq.addEventListener("input", () => { LEARN_Q = lq.value; const pos = lq.selectionStart; render(true); const n = SCR().querySelector("#learnq"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); }
  else if (r.name === "compare") { el.innerHTML = compareScreen(r); TAB = "search"; title = "Compare – " + title; }   // review #58
  else if (r.name === "import") { el.innerHTML = importScreen(r); TAB = "watchlist"; title = "A shared list – " + title; }   // review #58
  else if (r.name === "experts") { el.innerHTML = expertsScreen(); TAB = "more"; title = "Experts' View – " + title;
    if (!XPV.tried) loadExperts().then(() => { if (parseHash().name === "experts") render(true); });
    el.querySelectorAll("[data-expick]").forEach(c => c.addEventListener("change", () => { XPV[c.dataset.expick] = c.value; render(true); })); }
  else if (r.name === "review") { el.innerHTML = reviewScreen(r.arg); TAB = "more"; title = "Check the AI's reading – " + title;
    el.querySelectorAll("[data-rrnote]").forEach(i => i.addEventListener("change", () => { USER.rr = USER.rr || {};
      const per = USER.rr[i.dataset.sym] = USER.rr[i.dataset.sym] || {}; per[i.dataset.rrnote] = Object.assign({}, per[i.dataset.rrnote], { note: i.value.slice(0, 500) }); persist(); })); }
  else if (r.name === "journal") { el.innerHTML = journalScreen(); TAB = "portfolio"; title = "Decision journal – " + title; }
  else if (r.name === "playbook") { el.innerHTML = playbookScreen(); TAB = "more"; title = "If the market falls – " + title; }
  else if (r.name === "ranking") { el.innerHTML = rankingScreen(); TAB = "home"; title = "Core ranking – " + title;
    el.querySelectorAll("[data-rk]").forEach(c => c.addEventListener(c.type === "search" ? "input" : "change", () => {
      RK[c.dataset.rk] = c.type === "checkbox" ? c.checked : c.value; const pos = c.type === "search" ? c.selectionStart : null;
      render(true); if (pos != null) { const i = SCR().querySelector('[data-rk="q"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } })); }
  else if (r.name === "search") { const nf = fltParse(r.flt); if (fltStr(nf) !== FLTS.expect) FLTS.undo = []; FLTS.cur = nf; FLTS.expect = null; /* review #70: undo only what this page applied */ el.innerHTML = searchScreen(r.q); drawResults(); TAB = "search"; title = "Search – " + title; }
  else if (r.name === "verdicts" && !r.arg) { el.innerHTML = verdictsScreen(); TAB = SIDE() ? "verdicts" : "home"; title = "Verdicts – " + title; }
  else if (r.name === "verdicts") { const h = groupScreen(r.arg); ok = h != null; if (ok) { el.innerHTML = h; TAB = "home"; CTX = "Verdict group: " + (VG[r.arg] ? VG[r.arg].join(" ") : GROUP_NAME[r.arg].slice(0, 2).join(" ")); } }
  else if (r.name === "sectors") { el.innerHTML = sectorsScreen(); TAB = SIDE() ? "sectors" : "home"; title = "Sectors – " + title; }
  else if (r.name === "sector") { ok = renderSector(r.arg); if (ok) { TAB = "home"; CTX = "Sector: " + SECT[r.arg].label; } }
  else if (r.name === "watchlist") { el.innerHTML = watchlistScreen(); TAB = "watchlist"; title = "Watchlist – " + title; }
  else if (r.name === "portfolio" && !r.arg) { el.innerHTML = portfolioScreen(r.f != null ? r.f : undefined); TAB = "portfolio"; title = "Portfolio – " + title; }
  else if (r.name === "portfolio") { const h = holdingScreen(r.arg); ok = h != null; if (ok) { el.innerHTML = h; if (CUR === null) TAB = "search"; drawn = true; } }
  else if (r.name === "stock") { ok = renderStock(r.arg); if (ok) { title = BY[r.arg].name + " – " + title; if (CUR === null) TAB = "search";
      if (r.sub) setTimeout(() => { const sec = document.getElementById("j-" + r.sub); if (sec) sec.scrollIntoView({ block: "start" }); }, 80); } }   // review #59: #/stock/SYM/news
  else if (r.name === "chart") { el.innerHTML = chartScreen(r); const isI = r.arg === "index", key = isI ? "index:" + (r.sub || "") : r.arg;
    ok = isI ? !!r.sub : !!BY[r.arg]; if (ok && CH_OK() && document.getElementById("pcfull")) mountChart(document.getElementById("pcfull"), key, true);
    TAB = isI ? "market" : (CUR === null ? "search" : TAB); title = "Chart – " + (isI ? (MKT_NAME[r.sub] || r.sub) : BY[r.arg] ? BY[r.arg].name : "") + " – " + title; }
  else if (r.name === "investors") { el.innerHTML = investorsScreen(r.arg); TAB = SIDE() ? "investors" : "more"; title = "Investors – " + title; }   // review #78 A
  else if (r.name === "world" && r.arg === "us" && r.sub) { ok = renderUS(r.sub); if (ok) { TAB = "world"; title = ((usRow(r.sub) || {}).name || r.sub) + " (US) – " + title; } }   // review #80
  else if (r.name === "world") { el.innerHTML = worldScreen(); TAB = "world"; title = "World – " + title; }                        // review #78 C
  else if (r.name === "feeds") { el.innerHTML = feedsScreen(); TAB = "market"; title = "Topic feeds – " + title; }   // review #77 C
  else if (r.name === "more") { el.innerHTML = moreScreen(); TAB = "more"; title = "More – " + title; }
  else if (r.name === "settings") { el.innerHTML = settingsScreen(); TAB = "more"; title = "Settings – " + title; if (r.arg === "backup") setTimeout(() => { const b = document.getElementById("backup"); if (b) b.scrollIntoView({ block: "start" }); }, 60); }
  else if (r.name === "discover") { el.innerHTML = discoverScreen(); TAB = "home"; title = "Discover – " + title; }   // review #63
  else if (r.name === "checks") { el.innerHTML = checksScreen(); TAB = "more"; title = "Checks – " + title; }
  else if (r.name === "alerts") { el.innerHTML = alertsScreen(); TAB = SIDE() ? "alerts" : "more"; title = "Alerts – " + title; }
  else if (r.name === "dataquality") { el.innerHTML = dqScreen(); TAB = "more"; title = "Data quality – " + title; }
  else if (r.name === "help") { el.innerHTML = helpScreen(); TAB = "more"; title = "Help – " + title; }
  else ok = false;
  if (!ok) { history.replaceState(null, "", "#/home"); return render(false); }
  const st = UL.staleCheck(S.trade_date, Date.now(), S.holidays);  // review #32: the page knows its own trade date
  const mc = UL.marketClosed(S.trade_date, Date.now(), S.holidays); // review #39
  if (mc && ["home", "watchlist", "portfolio"].includes(r.name) && !st.stale)
    el.insertAdjacentHTML("afterbegin", `<div class="infobox closed">🏖️ Market closed today (${esc(mc.name)}) – prices are from ${dateTxt(S.trade_date)}.</div>`);
  if (st.stale) el.insertAdjacentHTML("afterbegin", `<div class="warnbox stale">🟡 This is ${dateTxt(S.trade_date)}'s data – the latest update didn't run${st.missed > 1 ? ` (${st.missed} trading days missed)` : ""}. Prices may be out of date. <span class="sub">If today was an NSE holiday, ignore this.</span></div>`);
  document.title = title;
  // review #41 1c: the Portfolio tab tints the whole app accent (active tab, status bar) by your P&L; other screens are neutral
  { let pc = null;
    if (r.name === "portfolio" && !r.arg && USER.tx.length) { const T = UL.portfolio(USER.tx, priceOf, PDAY).totals; pc = MOODBY() === "today" ? T.dayPct : T.pnlPct; }
    applyMood(document.documentElement, pc);
    const tinted = el.querySelector(".tot, .ghosts, .hero"), bg = getComputedStyle(tinted && pc != null ? tinted : document.body).backgroundColor;
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { if (!m.dataset.orig) m.dataset.orig = m.content; m.content = pc != null && bg ? bg : m.dataset.orig; }); }
  // the stock page's section switcher follows the section in view
  { const nav = el.querySelector(".jump");
    if (nav && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { nav.querySelectorAll("a").forEach(a => a.classList.toggle("on", a.dataset.jump === x.target.id)); jumpIntoView(nav); } }), { rootMargin: "-80px 0px -70% 0px" });
      el.querySelectorAll(".jsec").forEach(sec => io.observe(sec));
    }
    if (nav) { jumpFade(nav); nav.addEventListener("scroll", () => jumpFade(nav), { passive: true }); } }
  document.querySelectorAll(".tab").forEach(t => { if (t.dataset.tab === TAB) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
  try { syncAlertBadge(); } catch (e) {}                 // review #58: price alerts hit at tonight's close
  try { syncBell(); } catch (e) {}                       // review #59: the Alerts bell
  try { delightAfter(el); if (r.name === "home") celebrationsCheck(); JUST_STAR = null; } catch (e) { console.warn(e); }   // review #63
  try { applySkin(); const R = document.documentElement; if (["home", "market", "search", "watchlist", "portfolio"].includes(TAB)) R.dataset.sec = TAB; else R.removeAttribute("data-sec"); } catch (e) {}   // review #66
  try { dataAge(el); saveWhere(); const tt = document.getElementById("totop"); if (tt) tt.hidden = true; } catch (e) {}
  try { stickyHead(); splitView(); markLastSeen(r); } catch (e) {}         // review #74 (6, 11); #83 L
  try { dlPass(el); } catch (e) {}                                       // review #75 C: ⤓ on every chart
  try { qpPaint(el); } catch (e) {}                                      // review #92: remembered quick prices (memory only)
  document.getElementById("tipbox").hidden = true;
  if (!keepScroll) { el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); }   // review #41: short fade/slide in (CSS; off with reduced motion)
  CUR = location.hash || "#/home";
  const y = keepScroll ? window.scrollY : (FWD ? 0 : (SCROLL[CUR] || 0));
  FWD = false;
  window.scrollTo(0, y);
  if (!keepScroll) requestAnimationFrame(() => window.scrollTo(0, y));   // after layout (charts, fonts)
}
window.addEventListener("hashchange", e => { NAV++; if (location.hash === "#/help") HELP_FROM = (e.oldURL || "").split("#")[1] ? "#" + e.oldURL.split("#")[1] : null;
  render(false); });
// pull to refresh on Home / Watchlist / Portfolio / More (re-fetches the page and its data with a cache-bust)
{ let y0 = null, pulled = false; const ptr = document.getElementById("ptr");
  const qpHere = () => qpOn() && !OWNER() && QP_SCREENS.includes(parseHash().name);             // review #92 B2: today's price instead of a reload
  window.addEventListener("touchstart", e => { y0 = window.scrollY <= 0 && (["home", "watchlist", "portfolio", "more"].includes(parseHash().name) || qpHere()) ? e.touches[0].clientY : null; pulled = false; }, { passive: true });
  window.addEventListener("touchmove", e => { if (y0 == null) return; pulled = e.touches[0].clientY - y0 > 80; ptr.classList.toggle("on", pulled); ptr.textContent = pulled ? "Release to refresh" : "Pull to refresh"; }, { passive: true });
  window.addEventListener("touchend", () => { if (pulled && qpHere()) { ptr.classList.remove("on"); qpRefresh(); } else if (pulled) { ptr.textContent = "Refreshing…"; const u = new URL(location.href); u.searchParams.set("t", Date.now()); location.replace(u.toString()); } else ptr.classList.remove("on"); y0 = null; }); }
let scrollTick = false;
window.addEventListener("scroll", () => {
  if (scrollTick) return; scrollTick = true;
  requestAnimationFrame(() => { scrollTick = false; if (CUR) SCROLL[CUR] = window.scrollY;
    const tt = document.getElementById("totop"); if (tt) tt.hidden = window.scrollY < window.innerHeight; saveWhere(); });
}, { passive: true });
document.addEventListener("click", e => {
  const sg = e.target.closest("[data-sig]");                      // review #48: a signal dot → its reference range
  if (sg) { e.preventDefault(); e.stopPropagation(); sigSheet(sg.dataset.sig, sg.dataset.sym); return; }
  const tb = e.target.closest(".tab");                            // review #58 (5): tapping the active tab again scrolls to the top
  if (tb && tb.getAttribute("aria-current") === "page" && window.scrollY > 0) { e.preventDefault(); window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  if (e.target.closest("#totop")) { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); return; }
  const a = e.target.closest("a[href^='#/']");
  if (a && !a.dataset.jump) {                                     // a tap on an in-app link = forward: open at the top
    if (a.getAttribute("href") === location.hash) { e.preventDefault(); window.scrollTo(0, 0); return; }
    FWD = true;
    if (a.classList.contains("card") || a.closest(".secgrid")) SCROLL[CUR] = window.scrollY;
  }
});

// ---------- one delegated set of handlers for whatever screen is showing ----------
const screenEl = SCR();
screenEl.addEventListener("input", e => {
  if (parseHash().name === "learn" && learnInput(e)) return;                                   // review #68: sliders, certificate name
  if (e.target.matches("[data-raceyear]")) { const yrs = e.target.dataset.raceyear.split(","), st = BY[parseHash().arg]; RACE.year = yrs[+e.target.value];
    if (RACE.timer) { clearInterval(RACE.timer); RACE.timer = null; } const box = document.getElementById("race"); if (box && st) box.outerHTML = raceHTML(st); return; }   // review #63 (25a)
  if (e.target.id === "hglq") { const q = e.target.value.trim().toLowerCase(); let n = 0;      // review #90 C5: search the shared glossary from Help
    document.querySelectorAll("#hglist [data-q]").forEach(b => { b.hidden = !!q && !b.dataset.q.includes(q); if (!b.hidden) n++; }); const no = document.getElementById("hglnone"); if (no) no.hidden = n > 0; return; }
  if (e.target.id !== "glq") return; const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll("#glqlist a").forEach(a => { a.hidden = !!q && !a.dataset.gl.includes(q); }); });
// review #60: the short ⓘ sheet – capture phase, so a ⓘ inside a sortable header or a card link opens the sheet, not the sort or the stock
screenEl.addEventListener("click", e => { const tip = e.target.closest(".ib:not([data-act])"); if (!tip) return; e.preventDefault(); e.stopPropagation(); termSheet(tip.dataset.tip); }, true);
{ let pend = false; new MutationObserver(() => { if (pend) return; pend = true; queueMicrotask(() => { pend = false; annotateTerms(screenEl); movePass(screenEl); try { xPass(screenEl); } catch (e) { console.warn(e); } }); })
    .observe(screenEl, { childList: true, subtree: true }); }
// review #90 C: tap anything – capture phase; a link / button inside the tapped element keeps its own job; a drag on a chart isn't a tap
{ let pd = null;
  screenEl.addEventListener("pointerdown", e => { pd = [e.clientX, e.clientY, Date.now()]; }, true);
  screenEl.addEventListener("click", e => { const x = e.target.closest("[data-x]"); if (!x || !screenEl.contains(x)) return;
    const i = e.target.closest(XP_INNER); if (i && i !== x && x.contains(i)) return;
    if (/^(svg|canvas)$/i.test(x.tagName) && pd && (Math.hypot(e.clientX - pd[0], e.clientY - pd[1]) > 6 || Date.now() - pd[2] > 600)) return;
    e.preventDefault(); e.stopPropagation(); xOpen(x); }, true);
  screenEl.addEventListener("keydown", e => { const x = e.target.closest && e.target.closest("[data-x]"); if (!x || x !== e.target || (e.key !== "Enter" && e.key !== " ")) return; e.preventDefault(); xOpen(x); });
  document.getElementById("sheet").addEventListener("click", e => { const r = e.target.closest("[data-xk]"); if (!r) return; e.preventDefault(); xSheet(r.dataset.xk, XCTX || {}); }); }
screenEl.addEventListener("click", e => {
  const t = e.target;
  const cp = t.closest("[data-copy]");
  if (cp) { const k = cp.dataset.copy; copyText(k === "ask" ? ASK_TEXT : k === "experts" ? expertsAsk() : reportText()).then(ok => { const m = document.getElementById("copied-" + k); if (m) m.textContent = ok ? "✓ Copied" : "Couldn't copy – select the text and copy it"; }); return; }
  if (t.closest("[data-guide]")) { downloadGuide(); return; }
  if (t.closest("[data-firstok]")) { try { LS && LS.setItem(FIRST_KEY, TODAY); } catch (e) {} const n = t.closest(".firstnote"); if (n) n.remove(); return; }
  const nv = t.closest("[data-nav]"); if (nv) { const n = navStep(parseHash().arg, +nv.dataset.nav); if (n) goSide(stockHref(n)); return; }   // review #58 (6); #83 L: sideways
  const sr = t.closest(".splitl a.splrow"); if (sr) { e.preventDefault(); const h = sr.getAttribute("href"); if (h !== location.hash) goSide(h); else openFull(); return; }   // #83 L; N: the selected row again → full page
  const og = t.closest("[data-origin]"); if (og) { backToOrigin(); return; }
  const hz = t.closest(".splitr .hero"); if (hz && !t.closest("button, a, select, input, [data-act], .ib")) { openFull(); return; }   // #83 N: the title card → full page                                                  // #83 L: ‹ Watchlist / ‹ Search results …
  // review #58 D: the WHOLE card opens the stock page; buttons, links and fields inside keep their own action
  const oc = t.closest("[data-open]");
  if (oc && oc.dataset.swiped) { e.preventDefault(); return; }                  // review #67: a swipe is not a tap
  if (oc && !t.closest("button, a, input, select, textarea, label, summary, .cardact, .btnrow")) { e.preventDefault(); go(stockHref(oc.dataset.open)); return; }
  const tm = t.closest("[data-tmode]"); if (tm) { prefSet(TM_KEY, tm.dataset.tmode); render(true); return; }          // review #67 B
  const vr = t.closest("[data-vsr]"); if (vr) { prefSet(VS_KEY, vr.dataset.vsr); render(true); return; }
  const cd = t.closest("[data-cal]"); if (cd) { const o = cd.closest(".ins").querySelector(".calout"); if (o) o.textContent = cd.dataset.cal; cd.closest(".pcal").querySelectorAll(".pcd.on").forEach(x => x.classList.remove("on")); cd.classList.add("on"); return; }
  const wb = t.closest("[data-wlb]"); if (wb) { e.preventDefault(); WL.b = wb.dataset.wlb; render(true); return; }   // review #58
  const mu = t.closest("[data-mu]"); if (mu) { e.preventDefault(); MSET.u = mu.dataset.mu; prefSet("screener.market.u", MSET.u); render(true); return; }
  const ml = t.closest("[data-ml]"); if (ml) { e.preventDefault(); MSET.l = ml.dataset.ml; render(true); return; }
  const mb = t.closest("[data-moodby]");
  if (mb) { prefSet("screener.moodby", mb.dataset.moodby); render(true); return; }
  const un = t.closest("[data-uni]");
  if (un) { UNI = un.dataset.uni; try { localStorage.setItem("screener.universe", UNI); } catch (e) {} render(true); return; }
  const ef = t.closest("[data-exf]");
  if (ef) { EXF = ef.dataset.exf; if (location.hash.includes("?f=")) history.replaceState(null, "", "#/portfolio"); CUR = location.hash; render(true); return; }
  const hx = t.closest("[data-howexit]");
  if (hx) { e.preventDefault(); go("#/more"); setTimeout(() => { const d = document.getElementById("howexit"); if (d) { d.open = true; d.closest("details") && d.scrollIntoView({ block: "start" }); } }, 60); return; }
  const ua = t.closest("button[data-act], a[data-act]");
  if (ua && userAction(ua, e)) { e.preventDefault(); return; }
  const back = t.closest("[data-back]");
  if (back) { if (NAV > 0) history.back(); else go(back.dataset.back); return; }
  const j = t.closest("[data-jump]");
  if (j) { e.preventDefault(); const nv = j.closest(".jump"); if (nv) { nv.querySelectorAll("a").forEach(a => a.classList.toggle("on", a === j)); jumpIntoView(nv, j); }
    const sec = document.getElementById(j.dataset.jump); if (sec) sec.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); return; }
  const more = t.closest("[data-more]");
  if (more) { const k = more.dataset.more; SHOWN[k] = (SHOWN[k] || PAGE) + PAGE; const y = window.scrollY; parseHash().name === "search" ? drawResults() : render(true); window.scrollTo(0, y); return; }
  const chip = t.closest("#results .chip, #chips .chip");
  if (chip) { const inp = document.getElementById("q"); inp.value = chip.dataset.q; setQuery(chip.dataset.q); RECENT.add("q", chip.dataset.q); syncClear(); drawSugg(""); inp.blur(); window.scrollTo(0, 0); return; }
  if (t.closest("#qclear, #qclear2")) { clearSearch(); return; }
  if (t.closest("#rclear")) { RECENT.clear(); drawResults(); return; }
  if (t.id === "reset-set") { SET = Object.assign({}, DEFAULTS); saveSet(); resetCache(); render(true); document.getElementById("settings").open = true; return; }
});
// review #57: ✕ clears the box, resets the results to the default view and keeps the focus (keyboard stays up); Esc does the same
// review #57: no contact AutoFill / autocorrect on free-text fields that aren't personal (iPad offered Karma's contact card)
function noAutofill(root) {
  (root || document).querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]), textarea').forEach(i => {
    if (!i.hasAttribute("autocomplete")) i.setAttribute("autocomplete", "off");
    i.setAttribute("autocorrect", "off"); if (!i.name) i.name = "screener-field";
    if (i.type !== "number" && i.type !== "date" && !i.hasAttribute("autocapitalize")) i.setAttribute("autocapitalize", "off"); });
}
try { new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) noAutofill(n.parentNode || n); }))).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
function clearSearch() { const inp = document.getElementById("q"); if (!inp) return; inp.value = ""; clearTimeout(SEARCH.timer); setQuery(""); syncClear(); drawSugg(""); inp.focus(); }
function syncClear() { const inp = document.getElementById("q"), b = document.getElementById("qclear"); if (inp && b) b.hidden = !inp.value; }
screenEl.addEventListener("keydown", e => {      // review #58 D: Enter on a focused card opens it
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-open][role=link]")) { e.preventDefault(); go(stockHref(e.target.dataset.open)); }
});
screenEl.addEventListener("keydown", e => { if (e.target.id === "q" && e.key === "Escape" && e.target.value) { e.preventDefault(); clearSearch(); } });
screenEl.addEventListener("input", e => {
  if (e.target.id === "q") { syncClear(); drawSugg(e.target.value.trim()); const t = document.getElementById("qtok"); if (t) t.innerHTML = qTokens(e.target.value);
    const l = document.getElementById("qlive"); if (l) l.innerHTML = qLive(e.target.value.trim()); }
  if (e.target.id !== "q") return;
  clearTimeout(SEARCH.timer);
  SEARCH.timer = setTimeout(() => setQuery(e.target.value.trim()), 250);        // live results, debounced
});
screenEl.addEventListener("submit", e => {
  if (e.target.id === "policyform" || e.target.id === "fundform") { e.preventDefault(); submitForm(e.target); return; }     // review #50
  if (e.target.id === "cmpadd") { e.preventDefault(); const q = e.target.sym.value.trim(); const hit = BY[q.toUpperCase()] ? q.toUpperCase() : (UL.suggest(q, UNIV())[0] || {}).symbol;
    if (!hit) { toast("No stock matches “" + q + "”"); return; } const c = CMP.get(); if (!c.includes(hit)) CMP.put([...c, hit]); render(true); return; }
  if (e.target.id === "bnewform") { e.preventDefault(); const r = UL.bucketAdd(USER, e.target.bname.value);            // review #58
    if (typeof r === "string") toast(r); else { WL.b = r.id; persist(); render(true); toast(`Bucket “${r.name}” added`); } return; }
  if (e.target.id === "importlist") { e.preventDefault(); const f = e.target, syms = f.dataset.syms.split(",").filter(x => BY[x]);
    let id = f.to.value;
    if (id === "new") { let nm = f.dataset.name, k = 2; while (BUCKETS().some(b => b.name.toLowerCase() === nm.toLowerCase())) nm = `${f.dataset.name.slice(0, UL.BUCKET_NAME - 3)} ${k++}`;
      const r = UL.bucketAdd(USER, nm); if (typeof r === "string") { toast(r); return; } id = r.id; }
    const prev = CTX; CTX = "Shared list";
    syms.forEach(t => { if (!inWatch(t)) addWatch(t, ""); UL.bucketSet(USER, id, t, true); }); CTX = prev;
    persist(); WL.b = id; toast(`Added ${syms.length} stock${syms.length === 1 ? "" : "s"} to your watchlist`); go("#/watchlist"); return; }
  if (e.target.id !== "qform") return;
  e.preventDefault(); clearTimeout(SEARCH.timer);
  const inp = document.getElementById("q"); setQuery(inp.value.trim()); RECENT.add("q", inp.value.trim()); drawSugg(""); inp.blur();   // Enter / Go hides the iPad keyboard
});
screenEl.addEventListener("change", e => {
  if (e.target.matches("[data-act='lplain']")) { learnAct("lplain", e.target); return; }        // review #68: Plain mode
  if (e.target.matches("[data-psort]")) { prefSet(PSORT_KEY, e.target.value); render(true); return; }        // review #67
  if (e.target.matches("[data-hbpeer]")) { HB_PEER[e.target.dataset.hbpeer] = e.target.value || null; const f = e.target.closest(".hbwrap"), st = BY[e.target.dataset.hbpeer];
    if (f && st) { f.outerHTML = healthFig(st); delightAfter(SCR()); } return; }      // #63 (23a) peer switch, on the #83 I bars
  if (e.target.dataset.bname) { const err = UL.bucketRename(USER, e.target.dataset.bname, e.target.value); if (err) toast(err); else { persist(); render(true); } return; }
  if (e.target.id === "sort") { SEARCH.sort = e.target.value; drawResults(); return; }
  if (e.target.dataset.wl) { WL[e.target.dataset.wl] = e.target.value; render(true); return; }
  if (e.target.dataset.act === "import") { readImport(e.target); return; }
  if (e.target.dataset.act === "restore") { readFile(e.target, restorePreview); return; }
  if (e.target.matches("[data-mday]")) { const r = parseHash(); go(mHref(e.target.value === (S.market || {}).date ? null : e.target.value, r.v)); return; }
  if (e.target.dataset.thsel) { prefSet(e.target.dataset.thsel, e.target.value); applySkin(); render(true); return; }   // review #73
  if (e.target.dataset.pzrange) { prefSet(e.target.dataset.pzrange, e.target.value); applySkin(); render(true); return; }   // review #74: text size
  if (e.target.dataset.hshow) { const L = homeLayout(), k = e.target.dataset.hshow; e.target.checked ? L.hidden.delete(k) : L.hidden.add(k); saveHomeLayout(L); render(true); return; }
  if (e.target.dataset.pref) { prefSet(e.target.dataset.pref, e.target.checked ? "1" : "0"); applySkin(); render(true); return; }
  const k = e.target.dataset && e.target.dataset.set; if (!k) return;
  SET[k] = e.target.type === "radio" ? e.target.value : e.target.checked; saveSet(); resetCache(); render(true);
  const st = document.getElementById("settings"); if (st) st.open = true;
});
document.addEventListener("click", e => { if (!e.target.closest(".ib, #tipbox")) document.getElementById("tipbox").hidden = true; });
// the form sheet (review #30)
const sheetEl = document.getElementById("sheet");
sheetEl.addEventListener("click", e => {
  if (e.target === sheetEl) { sheetDismiss(); return; }               // tap outside the form (the scrim)
  if (e.target.closest("[data-close]")) { PENDING = null; sheetDismiss(); return; }
  { const cg = e.target.closest("a[data-close-go]"); if (cg) { const h = cg.getAttribute("href") || "", m = h.match(/^#\/stock\/([^/?]+)/);   // #83 L: peek → open from the same list = sideways
    if (m && parseHash().name === "stock" && NAVLIST && NAVLIST.syms.includes(decodeURIComponent(m[1]))) { e.preventDefault(); closeSheet(); goSide(h); return; }
    closeSheet(); return; } }              // review #60: "Learn more →" leaves the sheet
  const ua = e.target.closest("button[data-act]"); if (ua) { e.preventDefault(); userAction(ua, e); }
});
sheetEl.addEventListener("submit", e => { e.preventDefault(); submitForm(e.target); });
sheetEl.addEventListener("cancel", () => { PENDING = null; });
// bottom sheet: swipe down to close (review #41)
{ let sy = null, dy = 0;
  sheetEl.addEventListener("touchstart", e => { const r = sheetEl.getBoundingClientRect(); sy = e.touches[0].clientY - r.top < 56 || sheetEl.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  sheetEl.addEventListener("touchmove", e => { if (sy == null) return; dy = Math.max(0, e.touches[0].clientY - sy); sheetEl.style.transform = dy ? `translateY(${FMT.coord(dy)}px)` : ""; }, { passive: true });
  sheetEl.addEventListener("touchend", () => { sheetEl.style.transform = ""; if (dy > 110) { PENDING = null; closeSheet(); } sy = null; }); }

// ---------- start ----------
// review #28: the same page is also served at the public link (the "updated … IST" line on Home is in both copies)
{ const u = (S.public_link && S.public_link.url) || "https://nightscreener.github.io/";
  document.getElementById("online").innerHTML = `Open online: <a href="${esc(u)}" rel="noopener">${esc(u)}</a>`; }
document.getElementById("src").textContent = S.source_note;
loadWhere();                                              // review #58 (7): this session's scroll, filters, sort and tabs
// review #58 (6): swipe left / right on a stock page opened from a list – never inside the chart, a table or a field
{ let sx = null, sy = null;
  screenEl.addEventListener("touchstart", e => { const t = e.target;
    sx = parseHash().name === "stock" && !t.closest(".pc-canvas, .chartbox, .tv-lightweight-charts, .tablewrap, input, select, textarea, .jump, .chiprow") ? e.touches[0].clientX : null; sy = e.touches[0].clientY; }, { passive: true });
  screenEl.addEventListener("touchend", e => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (swipeOK(dx, dy)) { const n = navStep(parseHash().arg, dx < 0 ? 1 : -1); if (n) goSide(stockHref(n)); } }, { passive: true }); }   // #83 L: sideways
// review #74 (7): a swipe is ≥ 40 px sideways and less than 30° from horizontal – a vertical scroll never changes the stock
function swipeOK(dx, dy) { return Math.abs(dx) >= 40 && Math.abs(dy) < Math.abs(dx) * Math.tan(Math.PI / 6); }
// review #74 (4): drag a Home card in Settings → Personalise → My Home (the ↑ ↓ buttons do the same for keyboard and screen readers)
{ let hd = null;
  screenEl.addEventListener("dragstart", e => { const h = e.target.closest && e.target.closest("[data-hdrag]"); if (!h) return; hd = h.dataset.hdrag; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", hd); } catch (x) {} });
  screenEl.addEventListener("dragover", e => { if (hd && e.target.closest(".horow")) e.preventDefault(); });
  screenEl.addEventListener("drop", e => { const row = e.target.closest(".horow"); if (!hd || !row) return; e.preventDefault(); homeDrop(hd, row.dataset.hk, e.offsetY > row.offsetHeight / 2); hd = null; });
  screenEl.addEventListener("dragend", () => { hd = null; }); }
function homeDrop(from, to, after) {                         // move card `from` before (or after) card `to`
  const L = homeLayout(); if (from === to || !L.order.includes(from) || !L.order.includes(to)) return;
  L.order = L.order.filter(x => x !== from); L.order.splice(L.order.indexOf(to) + (after ? 1 : 0), 0, from); saveHomeLayout(L); render(true);
}
// review #58 (11): drag a stock inside a bucket (the ↑ ↓ buttons do the same for keyboard and screen readers)
{ let drag = null;
  screenEl.addEventListener("dragstart", e => { const h = e.target.closest && e.target.closest("[data-drag]"); if (!h) return; drag = h.dataset.drag; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", drag); } catch (x) {} });
  screenEl.addEventListener("dragover", e => { if (drag && e.target.closest(".reorder [data-open]")) e.preventDefault(); });
  screenEl.addEventListener("drop", e => { const row = e.target.closest(".reorder [data-open]"); if (!drag || !row) return; e.preventDefault();
    const b = BUCKETS().find(x => x.id === WL.b); if (!b) return; const to = row.dataset.open; if (to === drag) return;
    b.syms = b.syms.filter(x => x !== drag); b.syms.splice(b.syms.indexOf(to) + (e.offsetY > row.offsetHeight / 2 ? 1 : 0), 0, drag); drag = null; persist(); render(true); });
  screenEl.addEventListener("dragend", () => { drag = null; }); }
// review #58 (15): long-press (touch) or right-click (mouse) a number → copy the plain value
{ const NUMSEL = ".num, .price, .totv, .gv";
  let lp = null;
  document.addEventListener("contextmenu", e => { const n = e.target.closest && e.target.closest(NUMSEL); if (!n) return; e.preventDefault(); copyNum(n); });
  document.addEventListener("touchstart", e => { const n = e.target.closest && e.target.closest(NUMSEL); clearTimeout(lp); if (n && !peekSym(e.target)) lp = setTimeout(() => copyNum(n), 550); }, { passive: true });   // review #74: a stock row's hold opens the peek instead
  ["touchmove", "touchend", "touchcancel"].forEach(ev => document.addEventListener(ev, () => clearTimeout(lp), { passive: true })); }
// ---------- review #74 (5): hold a stock row (450 ms) or right-click it → a peek sheet; never while scrolling ----------
const PEEKSEL = "[data-open], a[href^='#/stock/']";
const peekSym = el => { const r = el && el.closest && el.closest(PEEKSEL); if (!r || !r.closest("#screen") || r.closest(".hero, .back, .navstrip, .minihd")) return null;
  const sym = r.dataset.open || decodeURIComponent((r.getAttribute("href") || "").replace(/^#\/stock\//, "").split("/")[0]); return BY[sym] ? sym : null; };
function peekSheet(sym) {
  const s = BY[sym]; if (!s) return; const v = SET.master ? vfor(s) : null, h = histOf(sym), cl = h && h.close ? h.close.filter(x => x != null).slice(-63) : [];
  const lo = Math.min(...cl), hi = Math.max(...cl), up = cl.length > 1 && cl[cl.length - 1] >= cl[0];
  const line = cl.length > 4 ? `<figure class="peekfig" data-chart="Last 3 months">${ktitle(kw("Last 3 months", up ? "var(--gain)" : "var(--loss)"), "p")}<svg viewBox="0 0 200 64" preserveAspectRatio="none" role="img" aria-label="Price over the last 3 months">
    <polyline data-series="Last 3 months" fill="none" stroke="${up ? "var(--gain)" : "var(--loss)"}" stroke-width="2" points="${cl.map((y, i) => FMT.coord(i * 200 / (cl.length - 1)) + "," + FMT.coord(60 - (y - lo) / ((hi - lo) || 1) * 56)).join(" ")}"/></svg></figure>` : `<p class="t-label sub">No 3-month line for this stock in tonight's data.</p>`;
  sheet(`<div class="peek" data-peek="${esc(sym)}"><h2>${esc(s.name)}</h2><p class="t-label sub">${esc(sym)} · ${esc(s.industry || "")}</p>
    ${OWNER() ? `<p class="mline">${omh("omh-big")}</p>` : `<p class="mline">${lvlNum(s.change_pct, inr(s.close), "num t-number-lg")} ${s.change_pct != null ? chgPill(s.change_pct, 2) : ""}</p>
    ${v ? `<p class="mline"><span class="vgp" style="--vgc:var(--vg-${v.g})">${esc(vgName(v.g))}</span>${v.lb && v.lb !== vgName(v.g) ? ` <span class="t-label sub">${esc(v.lb)}</span>` : ""}</p>` : ""}
    ${line}`}<div class="btnrow"><a class="act big" href="${stockHref(sym)}" data-close-go="1">Open</a><button class="act" type="button" data-act="save" data-sym="${esc(sym)}">${starIcon(inWatch(sym))} ${inWatch(sym) ? "Saved" : "Watchlist"}</button><button class="act" type="button" data-close>Close</button></div></div>`);
}
{ let pt = null, px = 0, py = 0, fired = false;
  const cancel = () => { clearTimeout(pt); pt = null; };
  screenEl.addEventListener("touchstart", e => { fired = false; const sym = peekSym(e.target); if (!sym || e.touches.length > 1) return;
    px = e.touches[0].clientX; py = e.touches[0].clientY; cancel(); pt = setTimeout(() => { pt = null; fired = true; setTimeout(() => { fired = false; }, 700); peekSheet(sym); }, 450); }, { passive: true });
  screenEl.addEventListener("touchmove", e => { if (pt && Math.hypot(e.touches[0].clientX - px, e.touches[0].clientY - py) > 10) cancel(); }, { passive: true });
  ["touchend", "touchcancel"].forEach(ev => screenEl.addEventListener(ev, cancel, { passive: true }));
  window.addEventListener("scroll", cancel, { passive: true });
  screenEl.addEventListener("click", e => { if (fired) { e.preventDefault(); e.stopPropagation(); fired = false; } }, true);   // the hold doesn't also open the stock
  screenEl.addEventListener("contextmenu", e => { const sym = peekSym(e.target); if (!sym || e.target.closest(".num, .price, .totv, .gv")) return;   // a number keeps its right-click copy (#58)
    e.preventDefault(); e.stopPropagation(); peekSheet(sym); }, true); }
// ---------- review #74 (6): sticky mini header on a stock page once the big price has scrolled away ----------
let STICKY_IO = null;
function stickyHead() {
  if (STICKY_IO) { STICKY_IO.disconnect(); STICKY_IO = null; } document.querySelectorAll(".minihd").forEach(m => m.remove());
  document.documentElement.style.setProperty("--mini-h", "0px");
  const r = parseHash(), s = BY[r.arg], big = r.name === "stock" && document.querySelector("#screen .hero .big");
  if (!s || !big || typeof IntersectionObserver !== "function") return;
  const m = document.createElement("div"); m.className = "minihd"; m.setAttribute("aria-hidden", "true");
  m.innerHTML = OWNER() ? `<b>${esc(s.name)}</b>${omh()}` : `<b>${esc(s.name)}</b><span>${lvlNum(s.change_pct, inr(s.close), "num")} ${s.change_pct != null ? moveNum(s.change_pct, FMT.pct(s.change_pct, 2)) : ""}</span>`;
  document.body.appendChild(m);
  STICKY_IO = new IntersectionObserver(es => es.forEach(x => { const on = !x.isIntersecting && x.boundingClientRect.top < 0; m.classList.toggle("on", on);
    document.documentElement.style.setProperty("--mini-h", on ? m.offsetHeight + "px" : "0px"); }));   // #85 B: the tab strip moves below it
  STICKY_IO.observe(big);
}
// ---------- review #74 (11): split view on screens ≥ 900 px – the list you came from on the left, the stock on the right ----------
function splitView() {
  const r = parseHash(), el = SCR();
  if (r.name !== "stock" || innerWidth < 900 || !NAVLIST || NAVLIST.syms.length < 2 || NAVLIST.syms.indexOf(r.arg) < 0 || el.querySelector(".splitv")) return;
  if (STOCK_OPEN() === "full") { fullBar(el); return; }                      // #83 N: the remembered choice – full page (⤡ Split view goes back)
  const wrap = document.createElement("div"); wrap.className = "splitv";
  const left = document.createElement("nav"); left.className = "splitl"; left.setAttribute("aria-label", NAVLIST.name || "List");
  left.innerHTML = `<span class="t-label sub">${esc(NAVLIST.name || "list")} · ${FMT.count(NAVLIST.syms.length)}</span>` + NAVLIST.syms.slice(0, 400).filter(x => BY[x]).map(x => { const s = BY[x];
    return `<a class="splrow" href="${stockHref(x)}"${x === r.arg ? ' aria-current="page"' : ""}><span class="t-label">${esc(s.name)}</span>${OWNER() ? omRow() : lvlNum(s.change_pct, inr(s.close), "num")}<span class="t-label sub">${esc(x)}</span>${s.change_pct != null ? chgPill(s.change_pct, 2) : "<span></span>"}</a>`; }).join("");
  const right = document.createElement("div"); right.className = "splitr stock-pane";
  document.querySelectorAll(".stock-pane").forEach(x => x.remove());           // #83 N6: never two panes (no leftover copy during a switch)
  while (el.firstChild) right.appendChild(el.firstChild);                      // moved, not copied – charts and listeners stay
  right.insertAdjacentHTML("afterbegin", `<div class="panebar"><button class="act" type="button" data-act="tofull" aria-label="Open this stock on the full page">⤢ Full page</button></div>`);
  wrap.appendChild(left); wrap.appendChild(right); el.appendChild(wrap);
  if (SPLIT_TOP != null) { left.scrollTop = SPLIT_TOP; SPLIT_TOP = null; }      // #83 L5: the list stays where it is …
  const cur = left.querySelector('[aria-current="page"]');                      // … and the selected row follows Previous / Next
  if (cur) { const a = cur.offsetTop, b = a + cur.offsetHeight; if (a < left.scrollTop || b > left.scrollTop + left.clientHeight) left.scrollTop = Math.max(0, a - left.clientHeight / 2); }
}
let SPLIT_TOP = null;
window.addEventListener("resize", () => { const r = parseHash(); if (r.name === "stock" && (innerWidth >= 900) !== !!SCR().querySelector(".splitv")) render(true); });
