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
export const SPLIT_DEF = { groceries: 650, gas: 300, date: 200, rainy: 250 };
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
  if (!store[k]) store[k] = { billPlan: {}, billActual: {}, billPaid: {}, split: {}, splitActual: {}, savPlan: {}, savActual: {}, moneyInActual: "" };
  const s = store[k];
  s.billPlan = s.billPlan || {}; s.billActual = s.billActual || {}; s.billPaid = s.billPaid || {};
  s.split = s.split || {}; s.splitActual = s.splitActual || {}; s.savPlan = s.savPlan || {}; s.savActual = s.savActual || {};
  if (s.moneyInActual === undefined) s.moneyInActual = "";
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

export function billsFor(store, m, year = YEAR) {
  const s = ms(store, m, year);
  const her = paydays(m, year).filter(p => p.who === "You").map(p => p.day);
  let b = FIXED.map(x => ({ name: x[0], plan: x[1], due: x[2] }));
  b.push({ name: "Freedom Debt Relief (1st)", plan: 217, due: her[0] });
  b.push({ name: "Freedom Debt Relief (2nd)", plan: 217, due: (her[1] !== undefined ? her[1] : her[0]) });
  if (year === 2026 && (m === 6 || m === 7)) b.push({ name: "Ron's grill (ends July)", plan: 171.34, due: 25 });
  b.forEach(x => {
    if (s.billPlan[x.name] !== undefined && s.billPlan[x.name] !== "") x.plan = parseFloat(s.billPlan[x.name]);
    x.actual = (s.billActual[x.name] !== undefined ? s.billActual[x.name] : "");
    x.paid = !!s.billPaid[x.name];
  });
  b.sort((a, c) => a.due - c.due);
  return b;
}

export const money = n => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString();
export const money2 = n => { const v = Math.abs(n); return (n < 0 ? "−$" : "$") + v.toLocaleString(undefined, { minimumFractionDigits: (v % 1 ? 2 : 0), maximumFractionDigits: 2 }); };
export const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

export function sumWindow(bills, lo, hi) { let t = 0; bills.forEach(b => { if (b.due >= lo && b.due <= hi) t += b.plan; }); return t; }

export function calc(store, m, year = YEAR) {
  const s = ms(store, m, year), pds = paydays(m, year), bills = billsFor(store, m, year);
  const moneyIn = pds.reduce((a, p) => a + p.amount, 0);
  const billPlanTot = bills.reduce((a, b) => a + b.plan, 0);
  const billActTot = bills.reduce((a, b) => a + num(b.actual), 0);
  const savPlanTot = SAV_DEF.reduce((a, g) => a + (s.savPlan[g[0]] !== undefined && s.savPlan[g[0]] !== "" ? num(s.savPlan[g[0]]) : g[1]), 0);
  const savActTot = SAV_DEF.reduce((a, g) => a + num(s.savActual[g[0]]), 0);
  const sp = k => (s.split[k] !== undefined && s.split[k] !== "" ? num(s.split[k]) : SPLIT_DEF[k]);
  const splitPlanTot = sp("groceries") + sp("gas") + sp("date") + sp("rainy");
  const splitActTot = ["groceries", "gas", "date", "rainy"].reduce((a, k) => a + num(s.splitActual[k]), 0);
  const leftPlan = moneyIn - billPlanTot - savPlanTot;
  const flexPlan = leftPlan - splitPlanTot;
  const moneyInAct = (s.moneyInActual !== "" && s.moneyInActual !== undefined) ? num(s.moneyInActual) : moneyIn;
  const leftAct = moneyInAct - billActTot - savActTot;
  const flexAct = leftAct - splitActTot;
  return { s, pds, bills, moneyIn, billPlanTot, billActTot, savPlanTot, savActTot, splitPlanTot, splitActTot, leftPlan, flexPlan, moneyInAct, leftAct, flexAct, sp };
}
