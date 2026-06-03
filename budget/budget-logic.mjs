// budget-logic.mjs — DOM-free budget math, extracted from Dauvy's budget.html.
// PURE: no document / localStorage / window. `store` is passed in, never global.
// `year` is an optional parameter (defaults to 2026) so the budget rolls forward
// forever; 2026 outputs stay byte-identical (proven by fixtures/golden-2026.json).

export const ANCHOR = Date.UTC(2026, 5, 4);     // Thu Jun 4 2026 = her payday (fixed reference)
export const MONTHS = [6, 7, 8, 9, 10, 11, 12]; // the budget's first (partial) year, Jun..Dec 2026
export const YEAR = 2026;
export const MNAMES = ["", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
export const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const FIXED = [
  ["FPL (electric)", 350, 3], ["Chase card (min)", 300, 5], ["Sax rental", 51.36, 5],
  ["Wells Fargo (min)", 175, 7], ["Kohl's (min)", 30, 10], ["Citicard loan", 500, 10],
  ["Target credit (min)", 30, 11], ["Ron's car insurance", 129, 11], ["Student loan", 100, 11],
  ["Wire 3", 90, 11], ["Affirm (1)", 100, 12], ["Verizon (phone)", 300, 13], ["Microsoft", 30, 15],
  ["Citi credit card (min)", 90, 16], ["Water", 250, 17], ["Discover (min)", 100, 21],
  ["Spotify", 30, 23], ["My car insurance", 98, 25], ["Home Depot (Ron)", 100, 25],
  ["Affirm (2)", 60, 26], ["Apple Card (Dauvy)", 50, 30], ["Apple Card (Ron)", 50, 30]
];
export const SPLIT_DEF = { groceries: 650, gas: 300, fun: 200, other: 250 };   // B-reconcile: date->fun, rainy->other (4 cats shared with the weekly log; values = Dauvy's verified Excel)
export const SAV_DEF = [
  ["Christmas", 200, "for the holidays"],
  ["New car (down payment)", 175, "about $2,100 a year"],
  ["Kids' college", 150, "about $1,800 a year"]
];

// months the budget covers for a given year (2026 starts in June; later years are full)
export function monthsForYear(year) {
  return year === YEAR ? MONTHS.slice() : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}

export function mkey(m, year = YEAR) { return year + "-" + m; }

export function ms(store, m, year = YEAR) { // month state with defaults
  const k = mkey(m, year);
  if (!store[k]) store[k] = { billPlan: {}, billActual: {}, billPaid: {}, split: {}, savPlan: {}, savActual: {} };
  const s = store[k];
  s.billPlan = s.billPlan || {}; s.billActual = s.billActual || {}; s.billPaid = s.billPaid || {};
  s.split = s.split || {}; s.savPlan = s.savPlan || {}; s.savActual = s.savActual || {};
  return s;
}

export function paydays(m, year = YEAR) {
  let d = new Date(Date.UTC(year, m - 1, 1));
  while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1);
  const out = [];
  while (d.getUTCMonth() === m - 1) {
    const weeks = Math.round((d.getTime() - ANCHOR) / (7 * 86400000));
    const who = (((weeks % 2) + 2) % 2 === 0) ? "You" : "Him";
    out.push({ day: d.getUTCDate(), who, amount: who === "You" ? 2000 : 1000 });
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return out;
}

// V2 effective-date helpers — a bill is "in effect" for (year,m) if it's within its optional
// start/end range. Ranges are "YYYY-M" strings; compared as year*12+month (so 2026-9 < 2026-10).
const ymNum = (year, m) => year * 12 + m;
const parseYM = s => { const [y, mo] = String(s).split("-").map(Number); return y * 12 + mo; };
export function inEffect(meta, year, m) {
  if (!meta) return true;
  const n = ymNum(year, m);
  if (meta.start && n < parseYM(meta.start)) return false;
  if (meta.end && n > parseYM(meta.end)) return false;
  return true;
}

export function billsFor(store, m, year = YEAR) {
  const s = ms(store, m, year);
  const pds = paydays(m, year);
  const her = pds.filter(p => p.who === "You").map(p => p.day);
  const billMeta = store.billMeta || {};   // V2: per-FIXED-bill overrides (retire / effective-date)
  // base recurring bills (FIXED), minus any the user retired or that are out of their effective range
  let b = FIXED.filter(x => {
    const meta = billMeta[x[0]];
    return !(meta && (meta.removed || !inEffect(meta, year, m)));
  }).map(x => ({ name: x[0], plan: x[1], due: x[2] }));
  b.push({ name: "Freedom Debt Relief (1st)", plan: 217, due: her[0] });
  b.push({ name: "Freedom Debt Relief (2nd)", plan: 217, due: (her[1] !== undefined ? her[1] : her[0]) });
  if (year === 2026 && (m === 6 || m === 7)) b.push({ name: "Ron's grill (ends July)", plan: 171.34, due: 25 });
  // V2: user-added custom bills — a MAP keyed by (unique) bill name, so add/remove/effective-date
  // are leaf writes on the shared doc. Each respects its own effective range.
  Object.entries(store.customBills || {}).forEach(([name, cb]) => {
    if (inEffect(cb, year, m)) b.push({ name, plan: num(cb.plan), due: num(cb.due) });
  });
  const billState = s.billState || {};   // V2: per-bill 'paid' | 'pushed' | 'skipped' (else legacy billPaid bool)
  b.forEach(x => {
    if (s.billPlan[x.name] !== undefined && s.billPlan[x.name] !== "") { const p = parseFloat(s.billPlan[x.name]); if (!isNaN(p)) x.plan = p; }  // guard NaN — a stray non-numeric Plan keeps the default instead of poisoning every total with $NaN
    x.actual = (s.billActual[x.name] !== undefined ? s.billActual[x.name] : "");
    x.state = billState[x.name] || (s.billPaid[x.name] ? "paid" : "unpaid");
    x.paid = x.state === "paid";   // backward-compat with existing render/logic
    // V2 "pushed" = defer to the next paycheck this month (moves it out of the current window)
    if (x.state === "pushed") {
      const nextPay = pds.map(p => p.day).find(d => d > x.due);
      if (nextPay !== undefined) x.due = nextPay; else x.pushStuck = true;  // no later check this month → "pushed" can't move it; flag so the UI doesn't claim it moved
    }
  });
  b.sort((a, c) => a.due - c.due);
  return b;
}

export const money = n => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();
export const money2 = n => { const v = Math.abs(n); return (n < 0 ? "−$" : "$") + v.toLocaleString(undefined, { minimumFractionDigits: (v % 1 ? 2 : 0), maximumFractionDigits: 2 }); };
export const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export function sumWindow(bills, lo, hi) { let t = 0; bills.forEach(b => { if (b.due >= lo && b.due <= hi && b.state !== "skipped") t += b.plan; }); return t; }

// V2 — one-off / surprise expenses (emergencies) for a month. Default []. Each: { name, amount, day }.
// `day` places it in a paycheck window (like a bill's due day) so the weekly view can subtract it.
export function oneOffsFor(store, m, year = YEAR) {
  const s = ms(store, m, year);
  // oneOffs is an id-keyed MAP (not an array) so every add/remove is a clobber-safe leaf write on
  // the shared doc; the id rides along in the output so the UI can target one entry for removal.
  return Object.entries(s.oneOffs || {}).map(([id, o]) => ({ id, name: o.name, amount: num(o.amount), day: num(o.day) }));
}

// V2.1 — savings goals. The 3 SAV_DEF defaults PLUS any the user adds. `customSavings` is a top-level
// map keyed by goal name (like customBills) — { name: { plan, note? } } — so add/remove are clobber-safe
// leaf writes on the shared doc. A DEFAULT is retired via savMeta[name].removed (can't delete a hardcoded
// entry); a CUSTOM goal is dropped by removing its customSavings leaf. Per-month plan/actual still live in
// s.savPlan / s.savActual keyed by the same goal name (orphaned entries for a removed goal are simply ignored).
export function savingsFor(store) {
  const savMeta = store.savMeta || {};
  const g = SAV_DEF.filter(x => !(savMeta[x[0]] && savMeta[x[0]].removed))
                   .map(x => ({ name: x[0], plan: x[1], note: x[2], custom: false }));
  Object.entries(store.customSavings || {}).forEach(([name, cs]) =>
    g.push({ name, plan: num(cs.plan), note: cs.note || "", custom: true }));
  return g;
}

// #4 — per-paycheck actual income. store.payActual[weekId] (top-level map, weekId="YYYY-M-D") overrides the
// nominal check amount; blank/absent = use the nominal. Lets a short/bonus check reflect in that week's
// "safe to spend" AND roll up into the month's actual income — same weekly-entry -> monthly-rollup model as spend.
export function checkAmount(store, weekId, nominal){
  const pa = store.payActual && store.payActual[weekId];
  return (pa !== undefined && pa !== "") ? num(pa) : num(nominal);
}

export function calc(store, m, year = YEAR) {
  const s = ms(store, m, year), pds = paydays(m, year), bills = billsFor(store, m, year);
  const moneyIn = pds.reduce((a, p) => a + p.amount, 0);
  const billPlanTot = bills.reduce((a, b) => a + (b.state === "skipped" ? 0 : b.plan), 0);
  const billActTot = bills.reduce((a, b) => a + num(b.actual), 0);
  const savGoals = savingsFor(store);   // V2.1: SAV_DEF defaults (minus retired) + user-added customSavings
  const savPlanTot = savGoals.reduce((a, g) => a + (s.savPlan[g.name] !== undefined && s.savPlan[g.name] !== "" ? num(s.savPlan[g.name]) : g.plan), 0);
  const savActTot = savGoals.reduce((a, g) => a + num(s.savActual[g.name]), 0);
  const SPLIT_OLD_KEY = { fun: "date", other: "rainy" };   // B-flat renamed date->fun, rainy->other
  const sp = k => {
    if (s.split[k] !== undefined && s.split[k] !== "") return num(s.split[k]);
    const old = SPLIT_OLD_KEY[k];                           // read a pre-rename saved override transparently (no migration write needed)
    if (old && s.split[old] !== undefined && s.split[old] !== "") return num(s.split[old]);
    return SPLIT_DEF[k];
  };
  const splitPlanTot = sp("groceries") + sp("gas") + sp("fun") + sp("other");
  const byCatAct = monthSpendByCat(store, m, year);   // B-reconcile: monthly Actual = the weekly purchase log rolled up (replaces hand-typed split actuals → kills double-entry)
  const splitActTot = SPEND_CATS.reduce((a, k) => a + byCatAct[k], 0);
  const leftPlan = moneyIn - billPlanTot - savPlanTot;
  const flexPlan = leftPlan - splitPlanTot;
  const moneyInAct = pds.reduce((a, p) => a + checkAmount(store, mkey(m, year) + "-" + p.day, p.amount), 0);  // #4: roll up per-paycheck actuals (each defaults to its nominal check)
  const leftAct = moneyInAct - billActTot - savActTot;
  const oneOffTot = Object.values(s.oneOffs || {}).reduce((a, o) => a + num(o.amount), 0);  // V2: surprise/one-off expenses (id-keyed map)
  const flexAct = leftAct - splitActTot - oneOffTot;
  return { s, pds, bills, moneyIn, billPlanTot, billActTot, savPlanTot, savActTot, splitPlanTot, splitActTot, leftPlan, flexPlan, moneyInAct, leftAct, flexAct, oneOffTot, sp };
}

/* ============================ TRENDS — week/month/year rollups ============================
   Pure aggregation that powers the Trends tab's charts (kept here, unit-tested, NOT inline in the
   app). Read-only over the same store the rest of the logic uses — no writes, no side effects. */
export const SPEND_CATS = ["groceries", "gas", "fun", "other"];

// Total logged in one paycheck-week's category bucket. weekSpend[weekId][cat] is an id-keyed map
// ({id:{amount,note}}) post-V2; a legacy single number is still summed. weekId = "YYYY-M-D".
export function weekBucketTotal(store, weekId, cat) {
  const sp = (store.weekSpend && store.weekSpend[weekId]) || {};
  const v = sp[cat];
  if (v && typeof v === "object") return Object.values(v).reduce((a, e) => a + num(e.amount), 0);
  return num(v);
}

// Per-category spend for a month = sum across that month's paycheck-week buckets.
export function monthSpendByCat(store, m, year = YEAR) {
  const out = {}; SPEND_CATS.forEach(c => out[c] = 0);
  paydays(m, year).forEach(p => {
    const wid = mkey(m, year) + "-" + p.day;
    SPEND_CATS.forEach(c => out[c] += weekBucketTotal(store, wid, c));
  });
  return out;
}

// One month's planner summary: income, bill/debt load, savings, spend-by-category + total.
export function monthSummary(store, m, year = YEAR) {
  const c = calc(store, m, year);
  const byCat = monthSpendByCat(store, m, year);
  const spent = SPEND_CATS.reduce((a, k) => a + byCat[k], 0);
  return { year, month: m, income: c.moneyInAct, billsActual: c.billActTot, billsPlanned: c.billPlanTot,
    savedActual: c.savActTot, byCat, spent, oneOffs: c.oneOffTot };
}

// Monthly series across a year's covered months (2026 = Jun–Dec, later years full) — month-granularity charts.
export function monthlyTrend(store, year = YEAR) {
  return monthsForYear(year).map(m => monthSummary(store, m, year));
}

// Per-week spending series within a month — week-granularity charts.
export function weeklySpendTrend(store, m, year = YEAR) {
  return paydays(m, year).map(p => {
    const wid = mkey(m, year) + "-" + p.day;
    const byCat = {}; SPEND_CATS.forEach(c => byCat[c] = weekBucketTotal(store, wid, c));
    return { day: p.day, who: p.who, income: p.amount, byCat, spent: SPEND_CATS.reduce((a, k) => a + byCat[k], 0) };
  });
}

// Whole-year totals (sum the monthly series) — year-granularity.
export function yearSummary(store, year = YEAR) {
  const months = monthlyTrend(store, year);
  const sum = k => months.reduce((a, x) => a + x[k], 0);
  const byCat = {}; SPEND_CATS.forEach(c => byCat[c] = months.reduce((a, x) => a + x.byCat[c], 0));
  return { year, income: sum("income"), billsActual: sum("billsActual"), billsPlanned: sum("billsPlanned"),
    savedActual: sum("savedActual"), byCat, spent: sum("spent"), oneOffs: sum("oneOffs") };
}
