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
export const SPLIT_DEF = { groceries: 650, gas: 300, fun: 200, other: 250, savings: 525 };   // B-reconcile: date->fun, rainy->other (4 spend cats shared with the weekly log; values = Dauvy's verified Excel). savings = the 5th split line = the monthly savings POOL the hoards divvy up (525 = the 3 default hoards 200+175+150, so nothing shifts until edited).
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

export function billsFor(store, m, year = YEAR, opts = {}) {
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
  const billPushTo = s.billPushTo || {}; // #4: per-bill chosen push target "YYYY-M-D" (else the legacy auto-next-payday)
  b.forEach(x => {
    if (s.billPlan[x.name] !== undefined && s.billPlan[x.name] !== "") { const p = parseFloat(s.billPlan[x.name]); if (!isNaN(p)) x.plan = p; }  // guard NaN — a stray non-numeric Plan keeps the default instead of poisoning every total with $NaN
    x.actual = (s.billActual[x.name] !== undefined ? s.billActual[x.name] : "");
    x.state = billState[x.name] || (s.billPaid[x.name] ? "paid" : "unpaid");
    x.paid = x.state === "paid";   // backward-compat with existing render/logic
    // V2/#4 "pushed" = defer the bill. With an explicit target (billPushTo) the user picks WHICH check: same
    // month moves the due day; a later month leaves a breadcrumb here (pushedAway) and is pulled into the
    // target month below. Without a target, fall back to the legacy "next payday this month".
    // F1: a chosen push target stays authoritative once the bill is paid/skipped (so marking a deferred bill
    // paid doesn't snap it back + rewrite past months). Relocation applies for pushed | paid | skipped when a
    // target is set; the legacy auto-next-payday only fires for a bare "pushed" with no target.
    if (x.state === "pushed" || (billPushTo[x.name] && (x.state === "paid" || x.state === "skipped"))) {
      const tgt = billPushTo[x.name];
      const t = tgt ? String(tgt).split("-").map(Number) : null;
      if (t && t.length === 3 && !t.some(isNaN)) {
        x.origDue = x.due;
        if (t[0] === year && t[1] === m) { x.due = t[2]; x.pushedTo = tgt; }   // same-month: just move the due day
        else x.pushedAway = tgt;                                                // cross-month: handled in the target month, not here
      } else if (x.state === "pushed") {
        const nextPay = pds.map(p => p.day).find(d => d > x.due);
        if (nextPay !== undefined) { x.origDue = x.due; x.due = nextPay; } else x.pushStuck = true;  // no later check this month → can't move; flag so the UI doesn't claim it did
      }
    }
  });
  // #4: pull in any bills pushed INTO (year,m) from another month — the cross-month other half of pushedAway.
  // Gated on a `billPushTo` existing in some other month-state, which never happens for the golden empty store.
  if (!opts.noPull) {
    Object.keys(store).forEach(k => {
      const mm = /^(\d{4})-(\d+)$/.exec(k); if (!mm) return;
      const sy = +mm[1], sM = +mm[2]; if (sy === year && sM === m) return;       // skip the month we're building
      const st = store[k], pushMap = st && st.billPushTo; if (!pushMap) return;
      Object.entries(pushMap).forEach(([name, tgt]) => {
        const t = String(tgt).split("-").map(Number);
        if (t.length !== 3 || t[0] !== year || t[1] !== m) return;                // not pushed into this month
        if (!(st.billState && ["pushed", "paid", "skipped"].includes(st.billState[name]))) return;   // F1: honor it while pushed/paid/skipped (a paid deferral still lands here)
        const src = billsFor(store, sM, sy, { noPull: true }).find(x => x.name === name && x.pushedAway);
        if (src) b.push({ ...src, due: t[2], pushedAway: undefined, pushedIn: { from: `${sy}-${sM}-${src.origDue}`, srcYear: sy, srcMonth: sM } });
      });
    });
  }
  b.sort((a, c) => a.due - c.due);
  return b;
}

// #1/#12 — paycheck-to-paycheck windows across the whole timeline. Each window runs from its check to the day
// BEFORE the next check, crossing the month line when a check lands near month-end — so the last check of a
// 5-paycheck month is a full ~7-day window (NOT a 2-day "stub"), and it carries the early-next-month bills it
// actually pays. The very first window reaches back to the 1st of its month (no check exists before the budget
// starts). `years` = the list of years the app covers. Returns the windows in chronological order.
export function paycheckWindows(years) {
  const pays = [];
  years.forEach(year => monthsForYear(year).forEach(m =>
    paydays(m, year).forEach(p => pays.push({ year, month: m, day: p.day, who: p.who, amount: p.amount }))));
  return pays.map((p, i) => {
    const start = Date.UTC(p.year, p.month - 1, i === 0 ? 1 : p.day);      // first window reaches back to the 1st
    const nx = pays[i + 1];
    const end = nx ? Date.UTC(nx.year, nx.month - 1, nx.day) - 86400000    // day before the next check (may be next month)
                   : Date.UTC(p.year, p.month - 1, p.day + 6);             // last check ever: a plain 7-day window
    const inMonth = pays.filter(x => x.year === p.year && x.month === p.month);
    return { year: p.year, month: p.month, day: p.day, who: p.who, amount: p.amount, idx: i, start, end,
             herCount: inMonth.filter(x => x.who === "You").length, weeksInMonth: inMonth.length };
  });
}

// Bills due within a paycheck window's date span — pulls from the window's start month and (when it crosses the
// month line) the next month too, so a check that lands near month-end carries the early-next-month bills it
// pays. Each returned bill keeps its own month/year (for display). `win` is a paycheckWindows() entry.
export function billsInWindow(store, win) {
  const months = [], seen = {};
  const addMonth = ms => { const d = new Date(ms), y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, k = y + "-" + m;
    if (!seen[k]) { seen[k] = 1; months.push({ year: y, month: m }); } };
  addMonth(win.start); addMonth(win.end);
  const out = [];
  months.forEach(({ year, month }) => billsFor(store, month, year).forEach(b => {
    if (b.pushedAway) return;   // #4: pushed to a later month → counted in the target window, not this one
    const dueMs = Date.UTC(year, month - 1, b.due);
    if (dueMs >= win.start && dueMs <= win.end) out.push({ ...b, month, year, dueMs });
  }));
  out.sort((a, c) => a.dueMs - c.dueMs);
  return out;
}

export const money = n => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();
export const money2 = n => { const v = Math.abs(n); return (n < 0 ? "−$" : "$") + v.toLocaleString(undefined, { minimumFractionDigits: (v % 1 ? 2 : 0), maximumFractionDigits: 2 }); };
export const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export function sumWindow(bills, lo, hi) { let t = 0; bills.forEach(b => { if (b.due >= lo && b.due <= hi && b.state !== "skipped" && !b.pushedAway) t += b.plan; }); return t; }

// #2 — how much to park from the prior big check to cover a short check: the shortfall rounded up to $50
// plus a cushion ($100 if it's under $200 short, else $50). 0 when the check isn't short. Extracted so the
// weekly earmark, the carry note, and the monthly breakdown all share one formula.
export function parkAmount(net) {
  if (net >= 0) return 0;
  const short = -net;
  return Math.ceil(short / 50) * 50 + (short < 200 ? 100 : 50);
}

// V2 — one-off / surprise expenses (emergencies) for a month. Default []. Each: { name, amount, day }.
// `day` places it in a paycheck window (like a bill's due day) so the weekly view can subtract it.
export function oneOffsFor(store, m, year = YEAR) {
  const s = ms(store, m, year);
  // oneOffs is an id-keyed MAP (not an array) so every add/remove is a clobber-safe leaf write on
  // the shared doc; the id rides along in the output so the UI can target one entry for removal.
  return Object.entries(s.oneOffs || {}).map(([id, o]) => ({ id, name: o.name, amount: num(o.amount), day: num(o.day) }));
}

// Extra debt payments for a month — id-keyed MAP (clobber-safe leaf writes), mirrors oneOffsFor.
// Each: { debt, amount, day }. 'day' places it in a paycheck window exactly like a one-off.
export function debtPaymentsFor(store, m, year = YEAR) {
  const s = ms(store, m, year);
  return Object.entries(s.debtPayments || {}).map(([id, d]) => ({ id, debt: d.debt, amount: num(d.amount), day: num(d.day) }));
}

// Double-count guard trigger (spec §7): the debt's bill already records a payment ABOVE its scheduled plan.
// Keyed off the bill's ACTUAL (not paid-state) — billActual is stored independently of paid, and billsSpent
// counts the actual regardless of the due/paid toggle, so a bumped actual double-counts Trends even unpaid.
export function debtBillOverpaid(store, debtName, m, year = YEAR) {
  const bill = billsFor(store, m, year).find(b => b.name === debtName);
  if (!bill) return false;
  return bill.actual !== undefined && bill.actual !== "" && num(bill.actual) > bill.plan;
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

/* ============================ #1 — savings as persistent hoards on a ledger ============================
   Dauvy feedback: each savings goal is a hoard with a running balance you can deposit into (weekly),
   pull from (emergencies), and move between. store.savLedger is a top-level id-keyed MAP of entries —
   clobber-safe leaf writes on the shared doc, same pattern as oneOffs / weekSpend. Each entry:
     { kind:"in"|"out"|"move", goal, to?, amount, weekId?, ym:"YYYY-M", ts?, note? }
   in = deposit into `goal`; out = withdrawal from `goal`; move = transfer `amount` from `goal` → `to`.
   ALL balances/rollups derive from this one ledger — an empty store yields empty/0, so the golden math
   (which never touches savLedger) stays byte-identical. */

// Running balance per hoard, cumulative across all time. { goalName: balance }.
export function savingsBalances(store) {
  const bal = {};
  const add = (g, amt) => { bal[g] = (bal[g] || 0) + amt; };
  Object.values(store.savLedger || {}).forEach(e => {
    const amt = num(e.amount);
    if (e.kind === "in") add(e.goal, amt);
    else if (e.kind === "out") add(e.goal, -amt);
    else if (e.kind === "move") { add(e.goal, -amt); if (e.to) add(e.to, amt); }
  });
  return bal;
}

// Deposits ("in") tagged to one paycheck-week — drives the weekly "This week's savings" bar. weekId="YYYY-M-D".
export function savedInWeek(store, weekId) {
  return Object.values(store.savLedger || {})
    .reduce((a, e) => a + (e.kind === "in" && e.weekId === weekId ? num(e.amount) : 0), 0);
}

// Net saved in one month = deposits − withdrawals dated to that month (moves are internal, net zero).
// Feeds calc.savActTot + the Trends savings-growth series. Empty store → 0 (golden-safe).
export function monthSaved(store, m, year = YEAR) {
  const ym = mkey(m, year);
  return Object.values(store.savLedger || {}).reduce((a, e) => {
    if (e.ym !== ym) return a;
    if (e.kind === "in") return a + num(e.amount);
    if (e.kind === "out") return a - num(e.amount);
    return a;   // moves net zero
  }, 0);
}

// The savings POOL = the 5th Spending-Split line (s.split.savings, default 525). This is the monthly total set
// aside for savings — the single flex subtraction (calc.savPlanTot) AND the weekly her-check target (÷ herCount).
// The hoards DIVVY this pool (see savingsAllocated); a hoard is a slice, not an add-on, so adding/retiring one
// never moves the pool. Editable in the split, exactly like groceries/gas/fun/other.
export function savingsSplitTotal(store, m, year = YEAR) {
  const s = ms(store, m, year);
  return (s.split.savings !== undefined && s.split.savings !== "") ? num(s.split.savings) : SPLIT_DEF.savings;
}

// How much of the pool the hoards have claimed = Σ hoard plans (per-month savPlan override aware). The UI shows
// pool − allocated = "unallocated" (and flags allocated > pool). Distinct from savingsSplitTotal (the pool itself).
export function savingsAllocated(store, m, year = YEAR) {
  const s = ms(store, m, year), goals = savingsFor(store);
  return goals.reduce((a, g) => a + (s.savPlan[g.name] !== undefined && s.savPlan[g.name] !== "" ? num(s.savPlan[g.name]) : g.plan), 0);
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
  const billPlanTot = bills.reduce((a, b) => a + (b.state === "skipped" || b.pushedAway ? 0 : b.plan), 0);  // #4: a bill pushed to a later month is counted there, not here
  const billActTot = bills.reduce((a, b) => a + (b.pushedAway ? 0 : num(b.actual)), 0);
  const savPlanTot = savingsSplitTotal(store, m, year);   // F6: single source = the savings-split total helper (lockstep test pins these equal)
  const savActTot = monthSaved(store, m, year);   // #1: actual saved now rolls up from the savings ledger (net deposits − withdrawals this month), not the retired hand-typed savActual. Empty store → 0 → golden-safe.
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
  const extraDebtTot = Object.values(s.debtPayments || {}).reduce((a, d) => a + num(d.amount), 0);  // extra debt paydown — real money out (id-keyed map); empty store → 0 → golden-safe
  const flexAct = leftAct - splitActTot - oneOffTot - extraDebtTot;
  return { s, pds, bills, moneyIn, billPlanTot, billActTot, savPlanTot, savActTot, splitPlanTot, splitActTot, leftPlan, flexPlan, moneyInAct, leftAct, flexAct, oneOffTot, extraDebtTot, sp };
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

// Total spent in one paycheck week across the four flex buckets (groceries/gas/fun/other). One tested
// source of truth — used by both the Safe-to-Spend math below AND the weekly view's subtitle tag, so the
// hero number and the "…, spending" label can never read off two diverging sum-paths.
export function weekSpendTotal(store, weekId) {
  return SPEND_CATS.reduce((a, c) => a + weekBucketTotal(store, weekId, c), 0);
}

/* ============================ CARRYOVER REDESIGN (2026-06-11) ============================
   One REAL running balance replaces the assumed earmark/cover pair (spec: Budget/CARRYOVER-REDESIGN-HANDOFF.md v2,
   Mac-Tink + Ronny's 3 decisions). The old short-check "cover" was a parkAmount-padded assumption — it credited
   money back without ever checking the prior surplus survived, so the hero could show dollars that weren't in the
   account. Now every window's spendable draws on what ACTUALLY carried over; a committed earmark is a HOLD on one
   week's display (the money never leaves the balance), and a reconcile ledger trues the whole thing to the bank. */

// Balance-reconcile adjustments (decision 1) — store.balAdjust is a top-level id-keyed map
// { id: { weekId, amount (signed), note?, ts? } }, clobber-safe leaf writes like oneOffs/savLedger.
// The "opening balance" is simply the first entry; "bank says $1.27 more" is just another one.
export function adjustInWeek(store, weekId) {
  return Object.values(store.balAdjust || {})
    .reduce((a, e) => a + (e.weekId === weekId ? num(e.amount) : 0), 0);
}

// The set-aside actively COMMITTED for next week's short check (decision 3) — store.earmarks[weekId] =
// { amount, ts? }. Subtracts from its own week's safe-to-spend only; carryoverInto never subtracts it
// (hold, not transfer — the money arrives in next week's balance, displayed "of which $X earmarked").
export function earmarkCommitted(store, weekId) {
  const e = store.earmarks && store.earmarks[weekId];
  return e ? num(e.amount) : 0;
}

// Hoard withdrawals tagged to a week — money that came BACK to checking, so the running balance must add
// it (deposits fence money out via savedInWeek; an emergency pull un-fences it). Legacy "out" entries
// carry only ym (no weekId) → not attributable to a window; the reconcile adjustment absorbs that drift.
export function savedOutInWeek(store, weekId) {
  return Object.values(store.savLedger || {})
    .reduce((a, e) => a + (e.kind === "out" && e.weekId === weekId ? num(e.amount) : 0), 0);
}

// One window's bill money under the bills-mode setting (decision 2).
// "due" (default, = today's behavior) = plan of every non-skipped bill in the window.
// "paid" = only bills actually MARKED paid, at their actual where entered (else plan) — real money out.
export function windowBillsTotal(store, win, mode = "due") {
  return billsInWindow(store, win).reduce((a, b) => {
    if (b.state === "skipped") return a;
    if (mode === "paid") return a + (b.state === "paid" ? (b.actual !== undefined && b.actual !== "" ? num(b.actual) : b.plan) : 0);
    return a + b.plan;
  }, 0);
}

// THE running balance entering window idx = Σ over every prior window of
// (actual check + adjustments + hoard withdrawals − bills(mode) − hoard deposits − one-offs − logged spending).
// weeks = paycheckWindows(years); the bills mode comes from store.billsMode ("due" unless explicitly "paid").
// Committed earmarks deliberately ABSENT here — see earmarkCommitted. Goes honestly negative when the
// household is in the red; the weekly view renders that truth instead of conjuring a cover.
export function carryoverInto(store, weeks, idx) {
  const mode = store.billsMode === "paid" ? "paid" : "due";
  let bal = 0;
  for (let j = 0; j < idx; j++) {
    const w = weeks[j], wid = `${w.year}-${w.month}-${w.day}`;
    const oneOffs = oneOffsFor(store, w.month, w.year).reduce((a, o) => a + (o.day === w.day ? o.amount : 0), 0);
    const debtPays = debtPaymentsFor(store, w.month, w.year).reduce((a, d) => a + (d.day === w.day ? d.amount : 0), 0);
    bal += checkAmount(store, wid, w.amount) + adjustInWeek(store, wid) + savedOutInWeek(store, wid)
         - windowBillsTotal(store, w, mode) - savedInWeek(store, wid) - oneOffs - debtPays - weekSpendTotal(store, wid);
  }
  return bal;
}

// Safe-to-spend for one paycheck week = the REAL balance carried in + the check, minus everything committed
// against it: bills + what you ACTUALLY moved into savings this week (savedInWeek — savings follows real
// deposits not a fixed target) + surprise expenses + the set-aside you actively COMMITTED for next week's
// short check (earmarkCommitted — decision 3: a hold on this week's number; the money stays in the running
// balance and arrives in next week's carryoverIn), minus what's already been SPENT (weekSpendTotal), plus any
// bank-reconcile adjustments logged to this week (adjustInWeek, signed) and any hoard money pulled BACK this
// week (savedOutInWeek, + — symmetric with deposits: a withdrawal un-fences the money the moment it happens,
// so withdraw-and-spend nets zero and reconciling to the bank can't double-count it next week [Mac's 🟡,
// review 2026-06-11]). Everything the household LOGS reads straight from the store so the hero can't drift
// from the ledgers; carryoverIn is injected (the view computes it from the window graph via carryoverInto).
// The old earmark/cover params are GONE — the cover was a parkAmount-padded assumption that could show money
// not actually in the account. Returns the raw number; goes honestly negative when the real balance can't
// cover the week (the UI styles it "short").
export function weekSafeToSpend(store, weekId, { checkAmt, billsSum, oneOffSum = 0, debtPaySum = 0, carryoverIn = 0 }) {
  const saved = savedInWeek(store, weekId);   // actual hoard deposits this week (not the planned target)
  return carryoverIn + checkAmt + adjustInWeek(store, weekId) + savedOutInWeek(store, weekId)
       - billsSum - saved - oneOffSum - debtPaySum - earmarkCommitted(store, weekId) - weekSpendTotal(store, weekId);
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

// Extra debt paid in a month = sum of that month's debtPayments map. Its OWN Trends series — never folded
// into spent or billsSpent. Empty store → 0 → golden-safe.
export function monthExtraDebtPaid(store, m, year = YEAR) {
  return Object.values(ms(store, m, year).debtPayments || {}).reduce((a, d) => a + num(d.amount), 0);
}

// One month's planner summary: income, bill/debt load, savings, spend-by-category + total.
// `billsSpent` (#3) = real money out on bills for the charts — each bill's actual where entered, else its
// plan; skipped + pushed-to-a-later-month bills excluded. (`billsActual` stays the strict sum-of-actuals.)
export function monthSummary(store, m, year = YEAR) {
  const c = calc(store, m, year);
  const byCat = monthSpendByCat(store, m, year);
  const spent = SPEND_CATS.reduce((a, k) => a + byCat[k], 0);
  const billsSpent = c.bills.reduce((a, b) =>
    a + ((b.state === "skipped" || b.pushedAway) ? 0 : (b.actual !== undefined && b.actual !== "" ? num(b.actual) : b.plan)), 0);
  return { year, month: m, income: c.moneyInAct, billsActual: c.billActTot, billsPlanned: c.billPlanTot,
    billsSpent, savedActual: c.savActTot, byCat, spent, oneOffs: c.oneOffTot, extraDebtPaid: c.extraDebtTot };
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
    billsSpent: sum("billsSpent"), savedActual: sum("savedActual"), byCat, spent: sum("spent"), oneOffs: sum("oneOffs"), extraDebtPaid: sum("extraDebtPaid") };
}
