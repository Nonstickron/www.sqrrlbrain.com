// budget-storage.mjs — persistence layer for the budget app.
// localStorage works today (offline cache). The Firestore shared backend is
// code-complete and injectable; it's switched on at deploy (see ACTIVATION.md) —
// needs Ronny's `firebase login`, the household rule, and Dauvy's first sign-in.
//
// The risk-bearing logic Mac-Tink flagged (migration guard, field-merge,
// snapshot-echo) lives in PURE helpers below and is fully unit-tested against a
// fake backend, so it's verified without a live Firestore.

export const STORE_KEY = "ronny-budget-2026-v1";

/* ---------------- localStorage backend (current + offline cache) ---------------- */
export const localBackend = {
  load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { return {}; } },
  saveAll(store) { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (_) {} },
  // no-op stubs so callers can treat both backends uniformly
  async start(localStore) { return localStore; },
  async saveField() {},
  stop() {},
};

/* ---------------- pure helpers (unit-tested) ---------------- */

// Migration decision — THE data-loss guard (Mac-Tink):
// import local→cloud ONLY when the cloud doc is absent. Once the cloud doc exists
// it is canonical and a stale local blob must never overwrite it. First-writer-wins.
export function decideMigration({ cloudExists, localStore }) {
  if (cloudExists) return "use-cloud";
  if (localStore && Object.keys(localStore).length) return "migrate";
  return "fresh";
}

// Deep-merge a single leaf into a doc WITHOUT disturbing siblings.
// Models Firestore's set(partial, {merge:true}); also used to build the write partial.
// `path` is e.g. ["2026-6", "billPaid", "Water"].
export function mergeField(doc, path, value) {
  const out = (typeof structuredClone === "function") ? structuredClone(doc || {}) : JSON.parse(JSON.stringify(doc || {}));
  let node = out;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof node[path[i]] !== "object" || node[path[i]] === null) node[path[i]] = {};
    node = node[path[i]];
  }
  node[path[path.length - 1]] = value;
  return out;
}

// onSnapshot reconcile guard: ignore our OWN optimistic writes echoing back
// (Firestore sets metadata.hasPendingWrites on local-origin snapshots).
export function shouldReconcile(snapshotMeta) {
  return !(snapshotMeta && snapshotMeta.hasPendingWrites);
}

/* ---------------- Firestore shared backend (code-complete; activated at deploy) ----------------
   `docRef` is injected — the real firebase compat docRef in the app
   (firebase.firestore().doc(`households/${id}`)), a fake in tests — so all of the
   migration / merge / reconcile logic above is testable without a live Firestore. */
export function firestoreBackend({ docRef, onRemote }) {
  let unsub = null;
  return {
    // Load: migrate-or-adopt-cloud, then subscribe for live reconciliation.
    async start(localStore) {
      const snap = await docRef.get();
      const decision = decideMigration({ cloudExists: snap.exists, localStore: localStore || {} });
      let current;
      if (decision === "migrate") {
        await docRef.set({ ...localStore, _migrated: true }, { merge: true });
        current = { ...localStore };
      } else {
        current = (snap.exists ? snap.data() : {}) || {};
      }
      unsub = docRef.onSnapshot(s => { if (shouldReconcile(s.metadata)) onRemote(s.data() || {}); });
      return current;
    },
    // Save only the touched leaf — concurrent edits to different fields never clobber.
    async saveField(monthKey, section, key, value) {
      await docRef.set(mergeField({}, [monthKey, section, key], value), { merge: true });
    },
    // Whole-doc overwrite for bulk ops (reset-a-month / import-a-backup). NOT a merge — so a month
    // dropped from `store` is deleted by omission, which a {merge:true} field write can't do.
    async saveAll(store) {
      await docRef.set(store);
    },
    stop() { if (unsub) unsub(); },
  };
}

// Pick the backend: Firestore when a docRef is supplied (post-activation), else localStorage.
export function makeBackend(config = {}) {
  return config.docRef ? firestoreBackend(config) : localBackend;
}
